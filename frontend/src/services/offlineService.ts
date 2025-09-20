/**
 * Offline Mode Service
 * TASK-023: Auto-save Functionality
 *
 * Handles offline operation queuing, data synchronization,
 * and recovery when connection is restored.
 */

import { EventEmitter } from 'events';
import { nanoid } from '@reduxjs/toolkit';
import type {
  OfflineOperation,
  SavePayload,
  SavePriority,
  NetworkStatus,
} from '@/types/autosave';
import type { ReactFlowData } from '@/types';
import { calculateChecksum, compressData, decompressData } from '@/utils/dataUtils';

// Offline operation types
export type OfflineOperationType =
  | 'save'
  | 'delete'
  | 'update'
  | 'create'
  | 'upload'
  | 'sync';

// Offline operation status
export type OfflineOperationStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

// Enhanced offline operation
export interface EnhancedOfflineOperation extends OfflineOperation {
  status: OfflineOperationStatus;
  createdAt: number;
  updatedAt: number;
  error?: string;
  attempts: number;
  maxAttempts: number;
  estimatedSize: number;
  checksum: string;
}

// Offline configuration
interface OfflineConfig {
  maxQueueSize: number;          // Maximum operations in queue
  maxOperationSize: number;      // Maximum size per operation (bytes)
  compressionEnabled: boolean;   // Enable compression for large operations
  persistenceEnabled: boolean;   // Persist queue to storage
  syncBatchSize: number;         // Operations to sync in one batch
  syncTimeout: number;           // Timeout for sync operations
  retryDelay: number;           // Base delay for retries
  maxRetries: number;           // Maximum retry attempts
}

const DEFAULT_CONFIG: OfflineConfig = {
  maxQueueSize: 100,
  maxOperationSize: 10 * 1024 * 1024, // 10MB
  compressionEnabled: true,
  persistenceEnabled: true,
  syncBatchSize: 10,
  syncTimeout: 30000, // 30 seconds
  retryDelay: 1000,   // 1 second
  maxRetries: 5,
};

// Offline events
export interface OfflineEvents {
  'operation-queued': (operation: EnhancedOfflineOperation) => void;
  'operation-processed': (operation: EnhancedOfflineOperation) => void;
  'operation-failed': (operation: EnhancedOfflineOperation, error: Error) => void;
  'queue-full': (droppedOperation: EnhancedOfflineOperation) => void;
  'sync-started': (operations: EnhancedOfflineOperation[]) => void;
  'sync-completed': (successful: number, failed: number) => void;
  'sync-failed': (error: Error) => void;
  'storage-quota-exceeded': () => void;
}

/**
 * Offline Service
 *
 * Manages offline operations with features:
 * - Operation queuing with priority handling
 * - Persistent storage across sessions
 * - Automatic sync when online
 * - Conflict detection and resolution
 * - Data compression and validation
 * - Error handling and retry logic
 */
export class OfflineService extends EventEmitter {
  private config: OfflineConfig;
  private operations = new Map<string, EnhancedOfflineOperation>();
  private isOnline = true;
  private isSyncing = false;
  private syncTimer?: NodeJS.Timeout;

  // Storage key for persisting operations
  private readonly STORAGE_KEY = 'ergoplanner_offline_operations';

  constructor(config: Partial<OfflineConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeService();
  }

  /**
   * Initialize the offline service
   */
  private async initializeService(): Promise<void> {
    // Load persisted operations
    if (this.config.persistenceEnabled) {
      await this.loadPersistedOperations();
    }

    // Set up network monitoring
    this.isOnline = navigator.onLine;
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Set up periodic sync when online
    if (this.isOnline) {
      this.startPeriodicSync();
    }
  }

  /**
   * Queue an operation for offline processing
   */
  public async queueOperation(
    type: OfflineOperationType,
    payload: any,
    options: {
      priority?: SavePriority;
      dependencies?: string[];
      metadata?: Record<string, any>;
      drawingId?: string;
    } = {}
  ): Promise<string> {
    const operation: EnhancedOfflineOperation = {
      id: nanoid(),
      type,
      timestamp: Date.now(),
      payload,
      priority: options.priority || 'normal',
      retryCount: 0,
      dependencies: options.dependencies || [],
      status: 'queued',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      attempts: 0,
      maxAttempts: this.config.maxRetries,
      estimatedSize: this.calculateOperationSize(payload),
      checksum: calculateChecksum(payload),
    };

    // Validate operation size
    if (operation.estimatedSize > this.config.maxOperationSize) {
      throw new Error(`Operation too large: ${operation.estimatedSize} bytes`);
    }

    // Check queue capacity
    if (this.operations.size >= this.config.maxQueueSize) {
      const droppedOperation = this.dropLowPriorityOperation();
      if (droppedOperation) {
        this.emit('queue-full', droppedOperation);
      } else {
        throw new Error('Queue full and no operations can be dropped');
      }
    }

    // Compress payload if enabled and large
    if (this.config.compressionEnabled && operation.estimatedSize > 1024) {
      operation.payload = this.compressPayload(operation.payload);
    }

    // Store operation
    this.operations.set(operation.id, operation);

    // Persist to storage
    if (this.config.persistenceEnabled) {
      await this.persistOperations();
    }

    this.emit('operation-queued', operation);

    // If online, try to sync immediately
    if (this.isOnline && !this.isSyncing) {
      this.scheduleSync();
    }

    return operation.id;
  }

  /**
   * Get queued operations
   */
  public getQueuedOperations(status?: OfflineOperationStatus): EnhancedOfflineOperation[] {
    const operations = Array.from(this.operations.values());

    if (status) {
      return operations.filter(op => op.status === status);
    }

    return operations.sort((a, b) => {
      // Sort by priority first, then by timestamp
      const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Get operation by ID
   */
  public getOperation(operationId: string): EnhancedOfflineOperation | undefined {
    return this.operations.get(operationId);
  }

  /**
   * Remove operation from queue
   */
  public removeOperation(operationId: string): boolean {
    const operation = this.operations.get(operationId);
    if (!operation) {
      return false;
    }

    this.operations.delete(operationId);

    if (this.config.persistenceEnabled) {
      this.persistOperations();
    }

    return true;
  }

  /**
   * Clear all operations
   */
  public clearOperations(status?: OfflineOperationStatus): number {
    let count = 0;

    for (const [id, operation] of this.operations) {
      if (!status || operation.status === status) {
        this.operations.delete(id);
        count++;
      }
    }

    if (count > 0 && this.config.persistenceEnabled) {
      this.persistOperations();
    }

    return count;
  }

  /**
   * Start synchronization process
   */
  public async startSync(): Promise<{ successful: number; failed: number }> {
    if (this.isSyncing) {
      throw new Error('Sync already in progress');
    }

    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    this.isSyncing = true;

    try {
      const queuedOperations = this.getQueuedOperations('queued');

      if (queuedOperations.length === 0) {
        return { successful: 0, failed: 0 };
      }

      this.emit('sync-started', queuedOperations);

      // Process operations in batches
      const batches = this.createBatches(queuedOperations);
      let successful = 0;
      let failed = 0;

      for (const batch of batches) {
        try {
          const results = await this.processBatch(batch);
          successful += results.successful;
          failed += results.failed;
        } catch (error) {
          console.error('Batch processing failed:', error);
          failed += batch.length;
        }
      }

      this.emit('sync-completed', successful, failed);
      return { successful, failed };

    } catch (error) {
      this.emit('sync-failed', error as Error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Update network status
   */
  public updateNetworkStatus(status: NetworkStatus): void {
    const wasOnline = this.isOnline;
    this.isOnline = status.online;

    if (!wasOnline && this.isOnline) {
      this.handleOnline();
    } else if (wasOnline && !this.isOnline) {
      this.handleOffline();
    }
  }

  /**
   * Get offline statistics
   */
  public getStatistics() {
    const operations = Array.from(this.operations.values());

    return {
      totalOperations: operations.length,
      byStatus: {
        queued: operations.filter(op => op.status === 'queued').length,
        processing: operations.filter(op => op.status === 'processing').length,
        completed: operations.filter(op => op.status === 'completed').length,
        failed: operations.filter(op => op.status === 'failed').length,
        cancelled: operations.filter(op => op.status === 'cancelled').length,
      },
      byPriority: {
        critical: operations.filter(op => op.priority === 'critical').length,
        high: operations.filter(op => op.priority === 'high').length,
        normal: operations.filter(op => op.priority === 'normal').length,
        low: operations.filter(op => op.priority === 'low').length,
      },
      totalSize: operations.reduce((sum, op) => sum + op.estimatedSize, 0),
      oldestOperation: operations.length > 0
        ? Math.min(...operations.map(op => op.createdAt))
        : null,
    };
  }

  /**
   * Handle coming online
   */
  private handleOnline(): void {
    console.log('Device is back online, starting sync...');
    this.startPeriodicSync();
    this.scheduleSync();
  }

  /**
   * Handle going offline
   */
  private handleOffline(): void {
    console.log('Device went offline');
    this.stopPeriodicSync();
  }

  /**
   * Start periodic sync timer
   */
  private startPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      if (this.isOnline && !this.isSyncing && this.operations.size > 0) {
        this.scheduleSync();
      }
    }, 30000); // Sync every 30 seconds
  }

  /**
   * Stop periodic sync timer
   */
  private stopPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }
  }

  /**
   * Schedule immediate sync
   */
  private scheduleSync(): void {
    // Use setTimeout to avoid blocking
    setTimeout(() => {
      this.startSync().catch(error => {
        console.error('Scheduled sync failed:', error);
      });
    }, 100);
  }

  /**
   * Create batches of operations for processing
   */
  private createBatches(operations: EnhancedOfflineOperation[]): EnhancedOfflineOperation[][] {
    const batches: EnhancedOfflineOperation[][] = [];
    const sortedOps = this.resolveDependencies(operations);

    for (let i = 0; i < sortedOps.length; i += this.config.syncBatchSize) {
      batches.push(sortedOps.slice(i, i + this.config.syncBatchSize));
    }

    return batches;
  }

  /**
   * Resolve operation dependencies and sort
   */
  private resolveDependencies(operations: EnhancedOfflineOperation[]): EnhancedOfflineOperation[] {
    const resolved: EnhancedOfflineOperation[] = [];
    const unresolved = new Set(operations);
    const opMap = new Map(operations.map(op => [op.id, op]));

    while (unresolved.size > 0) {
      const batch: EnhancedOfflineOperation[] = [];

      for (const operation of unresolved) {
        const dependencies = operation.dependencies || [];
        const unresolvedDeps = dependencies.filter(depId =>
          operations.some(op => op.id === depId) &&
          !resolved.some(op => op.id === depId)
        );

        if (unresolvedDeps.length === 0) {
          batch.push(operation);
        }
      }

      if (batch.length === 0) {
        // Circular dependency or missing dependency - add remaining operations
        batch.push(...Array.from(unresolved));
      }

      for (const operation of batch) {
        resolved.push(operation);
        unresolved.delete(operation);
      }
    }

    return resolved;
  }

  /**
   * Process a batch of operations
   */
  private async processBatch(batch: EnhancedOfflineOperation[]): Promise<{ successful: number; failed: number }> {
    let successful = 0;
    let failed = 0;

    // Process operations in parallel with timeout
    const promises = batch.map(async (operation) => {
      try {
        operation.status = 'processing';
        operation.updatedAt = Date.now();

        const result = await Promise.race([
          this.processOperation(operation),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Operation timeout')), this.config.syncTimeout)
          ),
        ]);

        operation.status = 'completed';
        operation.updatedAt = Date.now();
        this.emit('operation-processed', operation);

        return { success: true, operation };
      } catch (error) {
        operation.status = 'failed';
        operation.error = (error as Error).message;
        operation.attempts++;
        operation.updatedAt = Date.now();

        this.emit('operation-failed', operation, error as Error);

        // Retry if attempts remaining
        if (operation.attempts < operation.maxAttempts) {
          operation.status = 'queued';
          operation.retryCount++;
        }

        return { success: false, operation };
      }
    });

    const results = await Promise.allSettled(promises);

    for (const result of results) {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          successful++;
        } else {
          failed++;
        }
      } else {
        failed++;
      }
    }

    // Remove completed operations
    for (const operation of batch) {
      if (operation.status === 'completed') {
        this.operations.delete(operation.id);
      }
    }

    // Persist updated state
    if (this.config.persistenceEnabled) {
      await this.persistOperations();
    }

    return { successful, failed };
  }

  /**
   * Process a single operation
   */
  private async processOperation(operation: EnhancedOfflineOperation): Promise<any> {
    // Decompress payload if needed
    let payload = operation.payload;
    if (this.config.compressionEnabled && this.isCompressed(payload)) {
      payload = this.decompressPayload(payload);
    }

    // Validate checksum
    const currentChecksum = calculateChecksum(payload);
    if (currentChecksum !== operation.checksum) {
      throw new Error('Operation data corruption detected');
    }

    // Process based on operation type
    switch (operation.type) {
      case 'save':
        return this.processSaveOperation(payload);
      case 'delete':
        return this.processDeleteOperation(payload);
      case 'update':
        return this.processUpdateOperation(payload);
      case 'create':
        return this.processCreateOperation(payload);
      case 'upload':
        return this.processUploadOperation(payload);
      case 'sync':
        return this.processSyncOperation(payload);
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  /**
   * Process save operation
   */
  private async processSaveOperation(payload: SavePayload): Promise<any> {
    const response = await fetch('/api/drawings/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Save failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Drop low priority operation to make space
   */
  private dropLowPriorityOperation(): EnhancedOfflineOperation | null {
    const operations = Array.from(this.operations.values());

    // Find the lowest priority, oldest operation
    const sortedOps = operations.sort((a, b) => {
      const priorityOrder = { low: 0, normal: 1, high: 2, critical: 3 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      return a.timestamp - b.timestamp;
    });

    const toDrop = sortedOps.find(op =>
      op.status === 'queued' && op.priority !== 'critical'
    );

    if (toDrop) {
      this.operations.delete(toDrop.id);
      return toDrop;
    }

    return null;
  }

  /**
   * Calculate operation size
   */
  private calculateOperationSize(payload: any): number {
    return new Blob([JSON.stringify(payload)]).size;
  }

  /**
   * Compress payload
   */
  private compressPayload(payload: any): any {
    return {
      ...payload,
      _compressed: true,
      data: compressData(payload),
    };
  }

  /**
   * Decompress payload
   */
  private decompressPayload(payload: any): any {
    if (!payload._compressed) {
      return payload;
    }

    return decompressData(payload.data);
  }

  /**
   * Check if payload is compressed
   */
  private isCompressed(payload: any): boolean {
    return payload && payload._compressed === true;
  }

  /**
   * Load persisted operations from storage
   */
  private async loadPersistedOperations(): Promise<void> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const operations: EnhancedOfflineOperation[] = JSON.parse(stored);
        for (const operation of operations) {
          this.operations.set(operation.id, operation);
        }
      }
    } catch (error) {
      console.error('Failed to load persisted operations:', error);
    }
  }

  /**
   * Persist operations to storage
   */
  private async persistOperations(): Promise<void> {
    try {
      const operations = Array.from(this.operations.values());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(operations));
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        this.emit('storage-quota-exceeded');
        // Try to clear completed operations and retry
        this.clearOperations('completed');
        try {
          const operations = Array.from(this.operations.values());
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(operations));
        } catch (retryError) {
          console.error('Failed to persist operations after cleanup:', retryError);
        }
      } else {
        console.error('Failed to persist operations:', error);
      }
    }
  }

  // Stub methods for different operation types
  private async processDeleteOperation(payload: any): Promise<any> {
    // Implementation would depend on the specific API
    throw new Error('Delete operation not implemented');
  }

  private async processUpdateOperation(payload: any): Promise<any> {
    // Implementation would depend on the specific API
    throw new Error('Update operation not implemented');
  }

  private async processCreateOperation(payload: any): Promise<any> {
    // Implementation would depend on the specific API
    throw new Error('Create operation not implemented');
  }

  private async processUploadOperation(payload: any): Promise<any> {
    // Implementation would depend on the specific API
    throw new Error('Upload operation not implemented');
  }

  private async processSyncOperation(payload: any): Promise<any> {
    // Implementation would depend on the specific API
    throw new Error('Sync operation not implemented');
  }

  private getAuthToken(): string {
    // Get auth token from store or localStorage
    return localStorage.getItem('authToken') || '';
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.stopPeriodicSync();
    this.removeAllListeners();

    // Remove event listeners
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
  }
}

// Singleton instance for global use
let offlineServiceInstance: OfflineService | null = null;

/**
 * Get or create the global offline service instance
 */
export function getOfflineService(config?: Partial<OfflineConfig>): OfflineService {
  if (!offlineServiceInstance) {
    offlineServiceInstance = new OfflineService(config);
  }
  return offlineServiceInstance;
}

/**
 * Destroy the global offline service instance
 */
export function destroyOfflineService(): void {
  if (offlineServiceInstance) {
    offlineServiceInstance.destroy();
    offlineServiceInstance = null;
  }
}

export default OfflineService;