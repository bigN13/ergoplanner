/**
 * State Persistence Middleware for Enhanced Drawing State
 * TASK-022: Redux State for Drawings
 */

import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { throttle, debounce } from 'lodash-es';
import LZString from 'lz-string';
import type { RootState } from '@/store';
import type { EnhancedDrawingState } from '@/types/drawing-state';
import {
  setPersistenceState,
  validateState,
  updatePerformanceMetrics,
  clearValidationErrors,
} from '@/store/slices/enhancedDrawingSlice';

// Storage keys
const STORAGE_KEYS = {
  DRAWING_STATE: 'ergoplanner-drawing-state',
  SESSION_INFO: 'ergoplanner-session-info',
  BACKUP_STATE: 'ergoplanner-backup-state',
  MIGRATION_LOG: 'ergoplanner-migration-log',
} as const;

// State version for migration compatibility
const CURRENT_STATE_VERSION = '1.0.0';

// Interface for persisted state
interface PersistedState {
  version: string;
  timestamp: number;
  sessionId: string;
  state: Partial<EnhancedDrawingState>;
  checksum: string;
  compressed: boolean;
}

interface SessionInfo {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  persistenceEnabled: boolean;
  autoSaveInterval: number;
}

interface MigrationLog {
  fromVersion: string;
  toVersion: string;
  timestamp: number;
  success: boolean;
  warnings: string[];
  errors: string[];
}

// Utility functions
const generateChecksum = (data: any): string => {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
};

const compressState = (state: any): string => {
  const json = JSON.stringify(state);
  return LZString.compress(json) || json;
};

const decompressState = (compressed: string): any => {
  try {
    const decompressed = LZString.decompress(compressed);
    return JSON.parse(decompressed || compressed);
  } catch (error) {
    console.warn('Failed to decompress state, trying raw JSON:', error);
    return JSON.parse(compressed);
  }
};

const isStorageAvailable = (type: 'localStorage' | 'sessionStorage'): boolean => {
  try {
    const storage = window[type];
    const test = '__storage_test__';
    storage.setItem(test, test);
    storage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
};

const calculateStateSize = (state: any): number => {
  return new Blob([JSON.stringify(state)]).size;
};

// State sanitization - remove non-serializable data
const sanitizeState = (state: EnhancedDrawingState): Partial<EnhancedDrawingState> => {
  const sanitized = { ...state };

  // Remove UI-only state that shouldn't be persisted
  delete (sanitized as any).ui?.loadingStates;
  delete (sanitized as any).ui?.errorStates;

  // Remove performance samples to reduce size
  if (sanitized.performance) {
    sanitized.performance = {
      ...sanitized.performance,
      samples: sanitized.performance.samples.slice(-10), // Keep only last 10 samples
    };
  }

  // Remove expired optimistic updates
  if (sanitized.collaboration) {
    sanitized.collaboration = {
      ...sanitized.collaboration,
      optimisticUpdates: sanitized.collaboration.optimisticUpdates.filter(
        update => Date.now() - update.timestamp < 60000 // Keep only last minute
      ),
    };
  }

  // Remove old snapshots to limit size
  if (sanitized.snapshots) {
    sanitized.snapshots = sanitized.snapshots
      .sort((a, b) => b.metadata.timestamp - a.metadata.timestamp)
      .slice(0, 20); // Keep only 20 most recent snapshots
  }

  return sanitized;
};

// State migration functions
const migrateState = (persistedState: PersistedState): Partial<EnhancedDrawingState> | null => {
  const migrationLog: MigrationLog = {
    fromVersion: persistedState.version,
    toVersion: CURRENT_STATE_VERSION,
    timestamp: Date.now(),
    success: false,
    warnings: [],
    errors: [],
  };

  try {
    let state = persistedState.state;

    // Version-specific migrations
    if (persistedState.version === '0.9.0') {
      // Example migration from older version
      state = migrate_0_9_0_to_1_0_0(state, migrationLog);
    }

    migrationLog.success = true;
    saveMigrationLog(migrationLog);
    return state;
  } catch (error) {
    migrationLog.errors.push(`Migration failed: ${error}`);
    migrationLog.success = false;
    saveMigrationLog(migrationLog);
    console.error('State migration failed:', error);
    return null;
  }
};

const migrate_0_9_0_to_1_0_0 = (
  state: any,
  log: MigrationLog
): Partial<EnhancedDrawingState> => {
  // Example migration logic
  if (state.history && !state.history.actionGroups) {
    state.history.actionGroups = [];
    log.warnings.push('Added missing actionGroups to history');
  }

  if (state.performance && !state.performance.samples) {
    state.performance.samples = [];
    log.warnings.push('Added missing samples to performance metrics');
  }

  return state;
};

const saveMigrationLog = (log: MigrationLog): void => {
  if (!isStorageAvailable('localStorage')) return;

  try {
    const existingLogs = localStorage.getItem(STORAGE_KEYS.MIGRATION_LOG);
    const logs = existingLogs ? JSON.parse(existingLogs) : [];
    logs.push(log);

    // Keep only last 10 migration logs
    const recentLogs = logs.slice(-10);
    localStorage.setItem(STORAGE_KEYS.MIGRATION_LOG, JSON.stringify(recentLogs));
  } catch (error) {
    console.warn('Failed to save migration log:', error);
  }
};

// Persistence class
class StatePersistence {
  private storage: Storage | null = null;
  private compressionEnabled: boolean = true;
  private maxStateSize: number = 10 * 1024 * 1024; // 10MB limit

  constructor() {
    this.storage = isStorageAvailable('localStorage') ? localStorage : null;
  }

  // Save state to storage
  saveState = async (state: EnhancedDrawingState): Promise<void> => {
    if (!this.storage || !state.persistence.enabled) return;

    const startTime = performance.now();

    try {
      const sanitized = sanitizeState(state);
      const stateSize = calculateStateSize(sanitized);

      if (stateSize > this.maxStateSize) {
        throw new Error(`State size (${Math.round(stateSize / 1024)}KB) exceeds limit (${Math.round(this.maxStateSize / 1024)}KB)`);
      }

      const persistedState: PersistedState = {
        version: CURRENT_STATE_VERSION,
        timestamp: Date.now(),
        sessionId: state.persistence.sessionId,
        state: sanitized,
        checksum: generateChecksum(sanitized),
        compressed: this.compressionEnabled,
      };

      const serialized = this.compressionEnabled
        ? compressState(persistedState)
        : JSON.stringify(persistedState);

      // Create backup before saving
      this.createBackup();

      this.storage.setItem(STORAGE_KEYS.DRAWING_STATE, serialized);

      // Update session info
      const sessionInfo: SessionInfo = {
        sessionId: state.persistence.sessionId,
        startTime: Date.now(),
        lastActivity: Date.now(),
        persistenceEnabled: state.persistence.enabled,
        autoSaveInterval: state.persistence.autoSaveInterval,
      };

      this.storage.setItem(STORAGE_KEYS.SESSION_INFO, JSON.stringify(sessionInfo));

      const duration = performance.now() - startTime;
      console.log(`State persisted in ${duration.toFixed(2)}ms (${Math.round(stateSize / 1024)}KB)`);

    } catch (error) {
      console.error('Failed to save state:', error);
      throw error;
    }
  };

  // Load state from storage
  loadState = (): Partial<EnhancedDrawingState> | null => {
    if (!this.storage) return null;

    try {
      const serialized = this.storage.getItem(STORAGE_KEYS.DRAWING_STATE);
      if (!serialized) return null;

      const persistedState: PersistedState = this.compressionEnabled
        ? decompressState(serialized)
        : JSON.parse(serialized);

      // Verify checksum
      const calculatedChecksum = generateChecksum(persistedState.state);
      if (calculatedChecksum !== persistedState.checksum) {
        console.warn('State checksum mismatch, attempting recovery from backup');
        return this.recoverFromBackup();
      }

      // Check if migration is needed
      if (persistedState.version !== CURRENT_STATE_VERSION) {
        console.log(`Migrating state from v${persistedState.version} to v${CURRENT_STATE_VERSION}`);
        const migratedState = migrateState(persistedState);
        if (!migratedState) {
          return this.recoverFromBackup();
        }
        return migratedState;
      }

      console.log('State loaded successfully');
      return persistedState.state;

    } catch (error) {
      console.error('Failed to load state:', error);
      return this.recoverFromBackup();
    }
  };

  // Create backup of current state
  private createBackup = (): void => {
    if (!this.storage) return;

    try {
      const currentState = this.storage.getItem(STORAGE_KEYS.DRAWING_STATE);
      if (currentState) {
        this.storage.setItem(STORAGE_KEYS.BACKUP_STATE, currentState);
      }
    } catch (error) {
      console.warn('Failed to create backup:', error);
    }
  };

  // Recover from backup
  private recoverFromBackup = (): Partial<EnhancedDrawingState> | null => {
    if (!this.storage) return null;

    try {
      const backup = this.storage.getItem(STORAGE_KEYS.BACKUP_STATE);
      if (!backup) return null;

      const persistedState: PersistedState = this.compressionEnabled
        ? decompressState(backup)
        : JSON.parse(backup);

      console.log('Recovered state from backup');
      return persistedState.state;

    } catch (error) {
      console.error('Failed to recover from backup:', error);
      return null;
    }
  };

  // Clear all persisted state
  clearState = (): void => {
    if (!this.storage) return;

    try {
      this.storage.removeItem(STORAGE_KEYS.DRAWING_STATE);
      this.storage.removeItem(STORAGE_KEYS.SESSION_INFO);
      this.storage.removeItem(STORAGE_KEYS.BACKUP_STATE);
      console.log('Persisted state cleared');
    } catch (error) {
      console.error('Failed to clear state:', error);
    }
  };

  // Get session info
  getSessionInfo = (): SessionInfo | null => {
    if (!this.storage) return null;

    try {
      const sessionInfo = this.storage.getItem(STORAGE_KEYS.SESSION_INFO);
      return sessionInfo ? JSON.parse(sessionInfo) : null;
    } catch (error) {
      console.error('Failed to get session info:', error);
      return null;
    }
  };

  // Check storage health
  getStorageHealth = (): {
    available: boolean;
    usedSpace: number;
    availableSpace: number;
    quotaExceeded: boolean;
  } => {
    if (!this.storage) {
      return {
        available: false,
        usedSpace: 0,
        availableSpace: 0,
        quotaExceeded: false,
      };
    }

    try {
      // Estimate used space
      let usedSpace = 0;
      for (let key in this.storage) {
        if (this.storage.hasOwnProperty(key)) {
          usedSpace += (this.storage[key]?.length || 0) + key.length;
        }
      }

      // Try to estimate available space
      const testKey = '__test_key__';
      const testData = new Array(1024).join('x'); // 1KB of data
      let availableSpace = 0;

      try {
        for (let i = 0; i < 1000; i++) { // Test up to 1MB
          this.storage.setItem(testKey + i, testData);
          availableSpace += 1024;
        }
      } catch (e) {
        // Quota exceeded
      } finally {
        // Clean up test data
        for (let i = 0; i < 1000; i++) {
          this.storage.removeItem(testKey + i);
        }
      }

      return {
        available: true,
        usedSpace,
        availableSpace,
        quotaExceeded: availableSpace < 100 * 1024, // Less than 100KB available
      };
    } catch (error) {
      return {
        available: false,
        usedSpace: 0,
        availableSpace: 0,
        quotaExceeded: true,
      };
    }
  };
}

// Create persistence instance
const persistence = new StatePersistence();

// Create listener middleware for state persistence
export const statePersistenceMiddleware = createListenerMiddleware();

// Throttled save function to prevent excessive saves
const throttledSave = throttle(async (state: RootState) => {
  const drawingState = state.enhancedDrawing || state.drawing as any;
  if (!drawingState?.persistence?.enabled || drawingState.persistence.isSaving) return;

  try {
    // Dispatch saving state
    statePersistenceMiddleware.dispatch(setPersistenceState({ isSaving: true }));

    await persistence.saveState(drawingState);

    // Dispatch success
    statePersistenceMiddleware.dispatch(setPersistenceState({
      isSaving: false,
      lastSaved: Date.now(),
      saveError: null,
    }));

    // Update performance metrics
    const stateSize = calculateStateSize(drawingState);
    statePersistenceMiddleware.dispatch(updatePerformanceMetrics({
      stateSize,
      persistenceLatency: performance.now(),
    }));

  } catch (error) {
    // Dispatch error
    statePersistenceMiddleware.dispatch(setPersistenceState({
      isSaving: false,
      saveError: error instanceof Error ? error.message : 'Unknown error',
    }));
  }
}, 5000, { leading: false, trailing: true }); // Save at most once every 5 seconds

// Debounced validation function
const debouncedValidation = debounce((state: RootState) => {
  const drawingState = state.enhancedDrawing || state.drawing as any;
  if (drawingState?.validation?.enabled) {
    statePersistenceMiddleware.dispatch(validateState());
  }
}, 1000);

// Auto-save listener
statePersistenceMiddleware.startListening({
  predicate: (action, currentState, previousState) => {
    const current = currentState.enhancedDrawing || currentState.drawing as any;
    const previous = previousState?.enhancedDrawing || previousState?.drawing as any;

    return current?.persistence?.isDirty && current?.persistence?.enabled &&
           (!previous || current.persistence.lastPersisted !== previous.persistence?.lastPersisted);
  },
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    throttledSave(state);
  },
});

// Validation listener
statePersistenceMiddleware.startListening({
  predicate: (action) => {
    return action.type.startsWith('enhancedDrawing/') &&
           !action.type.includes('performance') &&
           !action.type.includes('validation');
  },
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    debouncedValidation(state);
  },
});

// Session recovery functions
export const initializeStateFromStorage = () => {
  const persistedState = persistence.loadState();
  const sessionInfo = persistence.getSessionInfo();

  return {
    persistedState,
    sessionInfo,
    storageHealth: persistence.getStorageHealth(),
  };
};

export const clearPersistedState = () => {
  persistence.clearState();
};

export const forceStateSave = async (state: EnhancedDrawingState) => {
  await persistence.saveState(state);
};

export const getStorageHealth = () => {
  return persistence.getStorageHealth();
};

// Cross-tab synchronization using BroadcastChannel
class CrossTabSync {
  private channel: BroadcastChannel | null = null;
  private listeners: Array<(data: any) => void> = [];

  constructor() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel('ergoplanner-drawing-sync');
      this.channel.onmessage = (event) => {
        this.listeners.forEach(listener => listener(event.data));
      };
    }
  }

  broadcast = (type: string, data: any) => {
    if (this.channel) {
      this.channel.postMessage({ type, data, timestamp: Date.now() });
    }
  };

  addListener = (listener: (data: any) => void) => {
    this.listeners.push(listener);
  };

  removeListener = (listener: (data: any) => void) => {
    this.listeners = this.listeners.filter(l => l !== listener);
  };

  close = () => {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.listeners = [];
  };
}

export const crossTabSync = new CrossTabSync();

// Cross-tab sync middleware
statePersistenceMiddleware.startListening({
  predicate: (action) => {
    return action.type.startsWith('enhancedDrawing/') &&
           (action.type.includes('selection') ||
            action.type.includes('cursor') ||
            action.type.includes('viewport'));
  },
  effect: async (action, listenerApi) => {
    crossTabSync.broadcast('drawing-action', {
      action: action.type,
      payload: action.payload,
    });
  },
});

export { persistence, StatePersistence };
export default statePersistenceMiddleware;