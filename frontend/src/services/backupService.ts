/**
 * Backup and Recovery Service
 * TASK-023: Auto-save Functionality
 *
 * Manages automatic backups, recovery points, and data restoration
 * for the auto-save system with multiple storage strategies.
 */

import { nanoid } from '@reduxjs/toolkit';
import { compress, decompress } from 'lz-string';
import type {
  BackupInfo,
  SavePayload,
  RecoveryInfo,
  SaveMetadata,
} from '@/types/autosave';
import type { ReactFlowData } from '@/types';
import { calculateChecksum } from '@/utils/dataUtils';

// Backup storage types
type BackupStorageType = 'localStorage' | 'indexedDB' | 'memory' | 'server';

// Backup configuration
interface BackupConfig {
  maxBackups: number;           // Maximum backups per drawing
  retentionDays: number;        // Days to retain backups
  compressionEnabled: boolean;  // Enable compression
  storageTypes: BackupStorageType[]; // Storage methods to use
  autoCleanup: boolean;         // Auto-cleanup expired backups
  encryptionEnabled: boolean;   // Enable backup encryption
}

const DEFAULT_CONFIG: BackupConfig = {
  maxBackups: 10,
  retentionDays: 30,
  compressionEnabled: true,
  storageTypes: ['localStorage', 'indexedDB'],
  autoCleanup: true,
  encryptionEnabled: false,
};

// Backup entry for storage
interface BackupEntry {
  info: BackupInfo;
  data: SavePayload;
  compressed: boolean;
  encrypted: boolean;
}

// Recovery point
interface RecoveryPoint {
  id: string;
  drawingId: string;
  timestamp: number;
  description: string;
  size: number;
  checksum: string;
  storageType: BackupStorageType;
}

/**
 * Backup and Recovery Service
 *
 * Provides comprehensive backup and recovery functionality:
 * - Multiple storage backends (localStorage, IndexedDB, memory, server)
 * - Automatic backup creation and cleanup
 * - Data compression and encryption
 * - Recovery point management
 * - Data integrity verification
 * - Cross-session persistence
 */
export class BackupService {
  private config: BackupConfig;
  private memoryBackups = new Map<string, BackupEntry[]>();
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor(config: Partial<BackupConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeStorage();
  }

  /**
   * Initialize storage backends
   */
  private async initializeStorage(): Promise<void> {
    // Initialize IndexedDB if enabled
    if (this.config.storageTypes.includes('indexedDB')) {
      try {
        this.dbPromise = this.initializeIndexedDB();
        await this.dbPromise;
      } catch (error) {
        console.warn('Failed to initialize IndexedDB, falling back to localStorage:', error);
        this.config.storageTypes = this.config.storageTypes.filter(type => type !== 'indexedDB');
      }
    }
  }

  /**
   * Initialize IndexedDB
   */
  private initializeIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ErgoPlannerBackups', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create backups object store
        if (!db.objectStoreNames.contains('backups')) {
          const backupStore = db.createObjectStore('backups', { keyPath: 'id' });
          backupStore.createIndex('drawingId', 'drawingId', { unique: false });
          backupStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Create recovery points object store
        if (!db.objectStoreNames.contains('recoveryPoints')) {
          const recoveryStore = db.createObjectStore('recoveryPoints', { keyPath: 'id' });
          recoveryStore.createIndex('drawingId', 'drawingId', { unique: false });
          recoveryStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Create a backup
   */
  public async createBackup(
    drawingId: string,
    payload: SavePayload,
    type: BackupInfo['type'] = 'auto'
  ): Promise<BackupInfo> {
    const backupInfo: BackupInfo = {
      id: nanoid(),
      drawingId,
      timestamp: Date.now(),
      type,
      size: JSON.stringify(payload).length,
      checksum: calculateChecksum(payload),
      metadata: payload.metadata,
      retained: true,
      expiresAt: Date.now() + (this.config.retentionDays * 24 * 60 * 60 * 1000),
    };

    // Create backup entry
    const backupEntry: BackupEntry = {
      info: backupInfo,
      data: payload,
      compressed: this.config.compressionEnabled,
      encrypted: this.config.encryptionEnabled,
    };

    // Store backup in enabled storage types
    const promises = this.config.storageTypes.map(storageType =>
      this.storeBackup(backupEntry, storageType)
    );

    try {
      await Promise.allSettled(promises);

      // Cleanup old backups
      if (this.config.autoCleanup) {
        await this.cleanupOldBackups(drawingId);
      }

      return backupInfo;
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw new Error(`Backup creation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Store backup in specific storage type
   */
  private async storeBackup(backup: BackupEntry, storageType: BackupStorageType): Promise<void> {
    let data = backup.data;

    // Apply compression if enabled
    if (backup.compressed) {
      data = this.compressData(data);
    }

    // Apply encryption if enabled
    if (backup.encrypted) {
      data = await this.encryptData(data);
    }

    switch (storageType) {
      case 'localStorage':
        await this.storeInLocalStorage(backup.info.id, { ...backup, data });
        break;

      case 'indexedDB':
        await this.storeInIndexedDB(backup.info.id, { ...backup, data });
        break;

      case 'memory':
        this.storeInMemory(backup.info.drawingId, { ...backup, data });
        break;

      case 'server':
        await this.storeOnServer(backup.info.id, { ...backup, data });
        break;

      default:
        throw new Error(`Unsupported storage type: ${storageType}`);
    }
  }

  /**
   * Store backup in localStorage
   */
  private async storeInLocalStorage(backupId: string, backup: BackupEntry): Promise<void> {
    try {
      const key = `ergoplanner_backup_${backupId}`;
      const serialized = JSON.stringify(backup);

      // Check storage quota
      const estimatedSize = new Blob([serialized]).size;
      if (estimatedSize > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('Backup too large for localStorage');
      }

      localStorage.setItem(key, serialized);
    } catch (error) {
      if ((error as Error).name === 'QuotaExceededError') {
        // Try to free up space by removing old backups
        await this.freeUpLocalStorage();
        // Retry once
        localStorage.setItem(`ergoplanner_backup_${backupId}`, JSON.stringify(backup));
      } else {
        throw error;
      }
    }
  }

  /**
   * Store backup in IndexedDB
   */
  private async storeInIndexedDB(backupId: string, backup: BackupEntry): Promise<void> {
    if (!this.dbPromise) {
      throw new Error('IndexedDB not initialized');
    }

    const db = await this.dbPromise;
    const transaction = db.transaction(['backups'], 'readwrite');
    const store = transaction.objectStore('backups');

    return new Promise((resolve, reject) => {
      const request = store.put({ id: backupId, ...backup });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Store backup in memory
   */
  private storeInMemory(drawingId: string, backup: BackupEntry): void {
    const backups = this.memoryBackups.get(drawingId) || [];
    backups.push(backup);

    // Maintain max backups limit
    if (backups.length > this.config.maxBackups) {
      backups.sort((a, b) => b.info.timestamp - a.info.timestamp);
      backups.splice(this.config.maxBackups);
    }

    this.memoryBackups.set(drawingId, backups);
  }

  /**
   * Store backup on server
   */
  private async storeOnServer(backupId: string, backup: BackupEntry): Promise<void> {
    const response = await fetch('/api/backups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
      body: JSON.stringify({
        id: backupId,
        backup,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server backup failed: ${response.statusText}`);
    }
  }

  /**
   * Retrieve a backup by ID
   */
  public async getBackup(backupId: string): Promise<BackupEntry | null> {
    // Try each storage type
    for (const storageType of this.config.storageTypes) {
      try {
        const backup = await this.retrieveBackup(backupId, storageType);
        if (backup) {
          return await this.processRetrievedBackup(backup);
        }
      } catch (error) {
        console.warn(`Failed to retrieve backup from ${storageType}:`, error);
      }
    }

    return null;
  }

  /**
   * Retrieve backup from specific storage
   */
  private async retrieveBackup(backupId: string, storageType: BackupStorageType): Promise<BackupEntry | null> {
    switch (storageType) {
      case 'localStorage':
        return this.retrieveFromLocalStorage(backupId);

      case 'indexedDB':
        return this.retrieveFromIndexedDB(backupId);

      case 'memory':
        return this.retrieveFromMemory(backupId);

      case 'server':
        return this.retrieveFromServer(backupId);

      default:
        return null;
    }
  }

  /**
   * Retrieve from localStorage
   */
  private retrieveFromLocalStorage(backupId: string): BackupEntry | null {
    try {
      const key = `ergoplanner_backup_${backupId}`;
      const serialized = localStorage.getItem(key);
      return serialized ? JSON.parse(serialized) : null;
    } catch (error) {
      console.warn('Failed to retrieve from localStorage:', error);
      return null;
    }
  }

  /**
   * Retrieve from IndexedDB
   */
  private async retrieveFromIndexedDB(backupId: string): Promise<BackupEntry | null> {
    if (!this.dbPromise) {
      return null;
    }

    const db = await this.dbPromise;
    const transaction = db.transaction(['backups'], 'readonly');
    const store = transaction.objectStore('backups');

    return new Promise((resolve, reject) => {
      const request = store.get(backupId);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? { ...result } : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Retrieve from memory
   */
  private retrieveFromMemory(backupId: string): BackupEntry | null {
    for (const backups of this.memoryBackups.values()) {
      const backup = backups.find(b => b.info.id === backupId);
      if (backup) {
        return backup;
      }
    }
    return null;
  }

  /**
   * Retrieve from server
   */
  private async retrieveFromServer(backupId: string): Promise<BackupEntry | null> {
    try {
      const response = await fetch(`/api/backups/${backupId}`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Server retrieval failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('Failed to retrieve from server:', error);
      return null;
    }
  }

  /**
   * Process retrieved backup (decompress, decrypt)
   */
  private async processRetrievedBackup(backup: BackupEntry): Promise<BackupEntry> {
    let data = backup.data;

    // Decrypt if needed
    if (backup.encrypted) {
      data = await this.decryptData(data);
    }

    // Decompress if needed
    if (backup.compressed) {
      data = this.decompressData(data);
    }

    return { ...backup, data };
  }

  /**
   * List all backups for a drawing
   */
  public async listBackups(drawingId: string): Promise<BackupInfo[]> {
    const backupMap = new Map<string, BackupInfo>();

    // Collect backups from all storage types
    for (const storageType of this.config.storageTypes) {
      try {
        const backups = await this.listBackupsFromStorage(drawingId, storageType);
        for (const backup of backups) {
          backupMap.set(backup.id, backup);
        }
      } catch (error) {
        console.warn(`Failed to list backups from ${storageType}:`, error);
      }
    }

    // Sort by timestamp (newest first)
    return Array.from(backupMap.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * List backups from specific storage
   */
  private async listBackupsFromStorage(drawingId: string, storageType: BackupStorageType): Promise<BackupInfo[]> {
    switch (storageType) {
      case 'localStorage':
        return this.listFromLocalStorage(drawingId);

      case 'indexedDB':
        return this.listFromIndexedDB(drawingId);

      case 'memory':
        return this.listFromMemory(drawingId);

      case 'server':
        return this.listFromServer(drawingId);

      default:
        return [];
    }
  }

  /**
   * List from localStorage
   */
  private listFromLocalStorage(drawingId: string): BackupInfo[] {
    const backups: BackupInfo[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('ergoplanner_backup_')) {
          const serialized = localStorage.getItem(key);
          if (serialized) {
            const backup: BackupEntry = JSON.parse(serialized);
            if (backup.info.drawingId === drawingId) {
              backups.push(backup.info);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to list from localStorage:', error);
    }

    return backups;
  }

  /**
   * List from IndexedDB
   */
  private async listFromIndexedDB(drawingId: string): Promise<BackupInfo[]> {
    if (!this.dbPromise) {
      return [];
    }

    const db = await this.dbPromise;
    const transaction = db.transaction(['backups'], 'readonly');
    const store = transaction.objectStore('backups');
    const index = store.index('drawingId');

    return new Promise((resolve, reject) => {
      const request = index.getAll(drawingId);
      request.onsuccess = () => {
        const backups = request.result.map((entry: any) => entry.info);
        resolve(backups);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * List from memory
   */
  private listFromMemory(drawingId: string): BackupInfo[] {
    const backups = this.memoryBackups.get(drawingId) || [];
    return backups.map(b => b.info);
  }

  /**
   * List from server
   */
  private async listFromServer(drawingId: string): Promise<BackupInfo[]> {
    try {
      const response = await fetch(`/api/backups?drawingId=${drawingId}`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Server list failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.backups || [];
    } catch (error) {
      console.warn('Failed to list from server:', error);
      return [];
    }
  }

  /**
   * Restore from backup
   */
  public async restoreFromBackup(backupId: string): Promise<SavePayload | null> {
    const backup = await this.getBackup(backupId);
    if (!backup) {
      return null;
    }

    // Verify data integrity
    const currentChecksum = calculateChecksum(backup.data);
    if (currentChecksum !== backup.info.checksum) {
      throw new Error('Backup data integrity check failed');
    }

    return backup.data;
  }

  /**
   * Create recovery point
   */
  public async createRecoveryPoint(
    drawingId: string,
    payload: SavePayload,
    description: string
  ): Promise<RecoveryPoint> {
    const backup = await this.createBackup(drawingId, payload, 'manual');

    const recoveryPoint: RecoveryPoint = {
      id: nanoid(),
      drawingId,
      timestamp: Date.now(),
      description,
      size: backup.size,
      checksum: backup.checksum,
      storageType: this.config.storageTypes[0], // Use primary storage
    };

    // Store recovery point metadata
    if (this.config.storageTypes.includes('indexedDB') && this.dbPromise) {
      try {
        const db = await this.dbPromise;
        const transaction = db.transaction(['recoveryPoints'], 'readwrite');
        const store = transaction.objectStore('recoveryPoints');
        store.put(recoveryPoint);
      } catch (error) {
        console.warn('Failed to store recovery point:', error);
      }
    }

    return recoveryPoint;
  }

  /**
   * Clean up old backups
   */
  private async cleanupOldBackups(drawingId?: string): Promise<void> {
    const now = Date.now();

    for (const storageType of this.config.storageTypes) {
      try {
        await this.cleanupOldBackupsFromStorage(storageType, now, drawingId);
      } catch (error) {
        console.warn(`Failed to cleanup backups from ${storageType}:`, error);
      }
    }
  }

  /**
   * Clean up old backups from specific storage
   */
  private async cleanupOldBackupsFromStorage(
    storageType: BackupStorageType,
    now: number,
    drawingId?: string
  ): Promise<void> {
    const backups = drawingId
      ? await this.listBackupsFromStorage(drawingId, storageType)
      : await this.listAllBackupsFromStorage(storageType);

    // Find expired or excess backups
    const toDelete: string[] = [];

    // Group by drawing ID
    const backupsByDrawing = new Map<string, BackupInfo[]>();
    for (const backup of backups) {
      const drawingBackups = backupsByDrawing.get(backup.drawingId) || [];
      drawingBackups.push(backup);
      backupsByDrawing.set(backup.drawingId, drawingBackups);
    }

    for (const [drawingId, drawingBackups] of backupsByDrawing) {
      // Sort by timestamp (newest first)
      drawingBackups.sort((a, b) => b.timestamp - a.timestamp);

      // Mark expired backups for deletion
      for (const backup of drawingBackups) {
        if (backup.expiresAt && backup.expiresAt < now) {
          toDelete.push(backup.id);
        }
      }

      // Mark excess backups for deletion (keep only maxBackups)
      if (drawingBackups.length > this.config.maxBackups) {
        const excess = drawingBackups.slice(this.config.maxBackups);
        for (const backup of excess) {
          if (!toDelete.includes(backup.id)) {
            toDelete.push(backup.id);
          }
        }
      }
    }

    // Delete marked backups
    for (const backupId of toDelete) {
      await this.deleteBackupFromStorage(backupId, storageType);
    }
  }

  /**
   * Delete backup from storage
   */
  private async deleteBackupFromStorage(backupId: string, storageType: BackupStorageType): Promise<void> {
    switch (storageType) {
      case 'localStorage':
        localStorage.removeItem(`ergoplanner_backup_${backupId}`);
        break;

      case 'indexedDB':
        if (this.dbPromise) {
          const db = await this.dbPromise;
          const transaction = db.transaction(['backups'], 'readwrite');
          const store = transaction.objectStore('backups');
          store.delete(backupId);
        }
        break;

      case 'memory':
        for (const [drawingId, backups] of this.memoryBackups) {
          const index = backups.findIndex(b => b.info.id === backupId);
          if (index >= 0) {
            backups.splice(index, 1);
            break;
          }
        }
        break;

      case 'server':
        await fetch(`/api/backups/${backupId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`,
          },
        });
        break;
    }
  }

  // Helper methods

  private compressData(data: any): any {
    return {
      ...data,
      drawingData: compress(JSON.stringify(data.drawingData)),
    };
  }

  private decompressData(data: any): any {
    return {
      ...data,
      drawingData: JSON.parse(decompress(data.drawingData) || '{}'),
    };
  }

  private async encryptData(data: any): Promise<any> {
    // Placeholder for encryption implementation
    // In a real implementation, you would use crypto API
    return data;
  }

  private async decryptData(data: any): Promise<any> {
    // Placeholder for decryption implementation
    // In a real implementation, you would use crypto API
    return data;
  }

  private async freeUpLocalStorage(): Promise<void> {
    // Remove oldest backups to free up space
    const backupKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('ergoplanner_backup_')) {
        backupKeys.push(key);
      }
    }

    // Remove up to half of the backups
    const toRemove = Math.ceil(backupKeys.length / 2);
    for (let i = 0; i < toRemove && i < backupKeys.length; i++) {
      localStorage.removeItem(backupKeys[i]);
    }
  }

  private async listAllBackupsFromStorage(storageType: BackupStorageType): Promise<BackupInfo[]> {
    // Implementation depends on storage type
    // This would list all backups across all drawings
    return [];
  }

  private getAuthToken(): string {
    // Get auth token from store or localStorage
    return localStorage.getItem('authToken') || '';
  }
}