/**
 * Auto-save State Management Slice
 * TASK-023: Auto-save Functionality
 *
 * Redux slice for managing auto-save state, operations, conflicts,
 * and user interface state.
 */

import { createSlice, createEntityAdapter, type PayloadAction, nanoid } from '@reduxjs/toolkit';
import type {
  AutoSaveState,
  SaveOperation,
  SaveConflict,
  BackupInfo,
  AutoSaveConfig,
  NetworkStatus,
  SaveMetrics,
  AutoSaveNotification,
  SaveProgress,
  OfflineOperation,
  AutoSaveStatistics,
  ConflictResolutionOption,
} from '@/types/autosave';

// Entity adapters for normalized storage
const operationAdapter = createEntityAdapter<SaveOperation>({
  sortComparer: (a, b) => b.timestamp - a.timestamp, // Most recent first
});

const conflictAdapter = createEntityAdapter<SaveConflict>({
  sortComparer: (a, b) => b.timestamp - a.timestamp,
});

const backupAdapter = createEntityAdapter<BackupInfo>({
  sortComparer: (a, b) => b.timestamp - a.timestamp,
});

const notificationAdapter = createEntityAdapter<AutoSaveNotification>({
  sortComparer: (a, b) => b.timestamp - a.timestamp,
});

// Default configuration
const defaultConfig: AutoSaveConfig = {
  enabled: true,
  interval: 30000, // 30 seconds
  debounceDelay: 5000, // 5 seconds
  maxRetries: 5,
  retryDelay: 1000,
  batchSize: 10,
  compressionEnabled: true,
  incrementalSaves: true,
  backupRetention: 10,
  conflictResolutionTimeout: 30000,
  offlineQueueLimit: 100,
};

// Default network status
const defaultNetworkStatus: NetworkStatus = {
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  reconnectAttempts: 0,
};

// Default statistics
const defaultStatistics: AutoSaveStatistics = {
  totalSaves: 0,
  successfulSaves: 0,
  failedSaves: 0,
  averageSaveTime: 0,
  totalDataSaved: 0,
  conflictsResolved: 0,
  autoConflictsResolved: 0,
  lastResetTime: Date.now(),
};

// Initial state
const initialState: AutoSaveState = {
  // Configuration
  config: defaultConfig,

  // Current status
  status: 'idle',
  lastSaveTime: undefined,
  nextSaveTime: undefined,

  // Network status
  network: defaultNetworkStatus,

  // Active operations (normalized)
  activeOperations: operationAdapter.getInitialState(),
  operationQueue: [],

  // Save history
  saveHistory: [],

  // Conflicts (normalized)
  activeConflicts: conflictAdapter.getInitialState(),

  // Backups (normalized by drawing ID)
  backups: backupAdapter.getInitialState(),

  // Progress tracking
  currentProgress: undefined,

  // Statistics
  statistics: defaultStatistics,

  // UI state
  ui: {
    showSaveIndicator: false,
    showConflictDialog: false,
    showOfflineIndicator: false,
    notifications: notificationAdapter.getInitialState(),
  },
};

// Auto-save slice
const autoSaveSlice = createSlice({
  name: 'autoSave',
  initialState,
  reducers: {
    // Configuration actions
    updateConfig: (state, action: PayloadAction<Partial<AutoSaveConfig>>) => {
      state.config = { ...state.config, ...action.payload };
    },

    resetConfig: (state) => {
      state.config = defaultConfig;
    },

    // Status actions
    setStatus: (state, action: PayloadAction<AutoSaveState['status']>) => {
      state.status = action.payload;
    },

    setLastSaveTime: (state, action: PayloadAction<number>) => {
      state.lastSaveTime = action.payload;
    },

    setNextSaveTime: (state, action: PayloadAction<number | undefined>) => {
      state.nextSaveTime = action.payload;
    },

    // Network status actions
    updateNetworkStatus: (state, action: PayloadAction<Partial<NetworkStatus>>) => {
      state.network = { ...state.network, ...action.payload };

      // Auto-show offline indicator
      if (!action.payload.online && state.network.online) {
        state.ui.showOfflineIndicator = true;
      } else if (action.payload.online && !state.network.online) {
        state.ui.showOfflineIndicator = false;
      }
    },

    incrementReconnectAttempts: (state) => {
      state.network.reconnectAttempts += 1;
    },

    resetReconnectAttempts: (state) => {
      state.network.reconnectAttempts = 0;
    },

    // Operation management actions
    addOperation: (state, action: PayloadAction<SaveOperation>) => {
      operationAdapter.addOne(state.activeOperations, action.payload);

      // Add to queue if not already active
      if (action.payload.status === 'pending') {
        state.operationQueue.push(action.payload);
      }

      // Update status based on operation
      if (action.payload.status === 'saving') {
        state.status = 'saving';
        state.ui.showSaveIndicator = true;
        state.ui.saveIndicatorMessage = 'Saving...';
        state.ui.saveIndicatorType = 'info';
      }
    },

    updateOperation: (state, action: PayloadAction<SaveOperation>) => {
      operationAdapter.updateOne(state.activeOperations, {
        id: action.payload.id,
        changes: action.payload,
      });

      const operation = action.payload;

      // Update global status based on operation status
      switch (operation.status) {
        case 'saving':
          state.status = 'saving';
          state.ui.showSaveIndicator = true;
          state.ui.saveIndicatorMessage = 'Saving...';
          state.ui.saveIndicatorType = 'info';
          break;

        case 'saved':
          state.status = 'saved';
          state.lastSaveTime = Date.now();
          state.ui.saveIndicatorMessage = 'Saved';
          state.ui.saveIndicatorType = 'success';

          // Auto-hide indicator after success
          setTimeout(() => {
            state.ui.showSaveIndicator = false;
          }, 2000);

          // Update statistics
          state.statistics.successfulSaves += 1;
          state.statistics.totalSaves += 1;
          if (operation.estimatedSize) {
            state.statistics.totalDataSaved += operation.estimatedSize;
          }

          // Add to history
          state.saveHistory.unshift(operation);
          if (state.saveHistory.length > 50) {
            state.saveHistory.pop();
          }
          break;

        case 'error':
          state.status = 'error';
          state.ui.showSaveIndicator = true;
          state.ui.saveIndicatorMessage = operation.error?.message || 'Save failed';
          state.ui.saveIndicatorType = 'error';

          // Update statistics
          state.statistics.failedSaves += 1;
          state.statistics.totalSaves += 1;
          break;

        case 'conflict':
          state.status = 'conflict';
          state.ui.showSaveIndicator = true;
          state.ui.saveIndicatorMessage = 'Conflict detected';
          state.ui.saveIndicatorType = 'warning';
          break;
      }

      // Remove from queue if completed
      if (['saved', 'error'].includes(operation.status)) {
        state.operationQueue = state.operationQueue.filter(op => op.id !== operation.id);

        // If no more active operations, reset to idle
        if (state.operationQueue.length === 0) {
          state.status = 'idle';
        }
      }
    },

    removeOperation: (state, action: PayloadAction<string>) => {
      operationAdapter.removeOne(state.activeOperations, action.payload);
      state.operationQueue = state.operationQueue.filter(op => op.id !== action.payload);
    },

    clearCompletedOperations: (state) => {
      const completedIds = Object.values(state.activeOperations.entities)
        .filter(op => op && ['saved', 'error'].includes(op.status))
        .map(op => op!.id);

      operationAdapter.removeMany(state.activeOperations, completedIds);
    },

    // Conflict management actions
    addConflict: (state, action: PayloadAction<SaveConflict>) => {
      conflictAdapter.addOne(state.activeConflicts, action.payload);
      state.status = 'conflict';
      state.ui.showConflictDialog = true;
      state.ui.conflictDialogData = action.payload;
    },

    updateConflict: (state, action: PayloadAction<{ id: string; changes: Partial<SaveConflict> }>) => {
      conflictAdapter.updateOne(state.activeConflicts, {
        id: action.payload.id,
        changes: action.payload.changes,
      });
    },

    resolveConflict: (state, action: PayloadAction<{ id: string; resolution: ConflictResolutionOption }>) => {
      const conflict = state.activeConflicts.entities[action.payload.id];
      if (conflict) {
        conflictAdapter.removeOne(state.activeConflicts, action.payload.id);

        // Update statistics
        state.statistics.conflictsResolved += 1;
        if (action.payload.resolution.type !== 'custom') {
          state.statistics.autoConflictsResolved += 1;
        }

        // Clear conflict UI if this was the active conflict
        if (state.ui.conflictDialogData?.id === action.payload.id) {
          state.ui.showConflictDialog = false;
          state.ui.conflictDialogData = undefined;
        }

        // Reset status if no more conflicts
        if (state.activeConflicts.ids.length === 1) { // Will be 0 after removal
          state.status = 'idle';
        }
      }
    },

    clearConflicts: (state) => {
      conflictAdapter.removeAll(state.activeConflicts);
      state.ui.showConflictDialog = false;
      state.ui.conflictDialogData = undefined;
    },

    // Backup management actions
    addBackup: (state, action: PayloadAction<BackupInfo>) => {
      backupAdapter.addOne(state.backups, action.payload);
    },

    removeBackup: (state, action: PayloadAction<string>) => {
      backupAdapter.removeOne(state.backups, action.payload);
    },

    cleanupExpiredBackups: (state) => {
      const now = Date.now();
      const expiredIds = Object.values(state.backups.entities)
        .filter(backup => backup && backup.expiresAt && backup.expiresAt < now)
        .map(backup => backup!.id);

      backupAdapter.removeMany(state.backups, expiredIds);
    },

    // Progress tracking actions
    setProgress: (state, action: PayloadAction<SaveProgress | undefined>) => {
      state.currentProgress = action.payload;

      if (action.payload) {
        state.ui.showSaveIndicator = true;
        state.ui.saveIndicatorMessage = action.payload.message;
        state.ui.saveIndicatorType = 'info';
      }
    },

    updateProgress: (state, action: PayloadAction<Partial<SaveProgress>>) => {
      if (state.currentProgress) {
        state.currentProgress = { ...state.currentProgress, ...action.payload };
        state.ui.saveIndicatorMessage = state.currentProgress.message;
      }
    },

    clearProgress: (state) => {
      state.currentProgress = undefined;
    },

    // Statistics actions
    updateStatistics: (state, action: PayloadAction<Partial<AutoSaveStatistics>>) => {
      state.statistics = { ...state.statistics, ...action.payload };
    },

    resetStatistics: (state) => {
      state.statistics = { ...defaultStatistics, lastResetTime: Date.now() };
    },

    updateAverageSaveTime: (state, action: PayloadAction<number>) => {
      const { averageSaveTime, successfulSaves } = state.statistics;
      const newAverage = successfulSaves === 0
        ? action.payload
        : (averageSaveTime * (successfulSaves - 1) + action.payload) / successfulSaves;

      state.statistics.averageSaveTime = newAverage;
    },

    // UI state actions
    setSaveIndicatorVisible: (state, action: PayloadAction<boolean>) => {
      state.ui.showSaveIndicator = action.payload;
      if (!action.payload) {
        state.ui.saveIndicatorMessage = undefined;
        state.ui.saveIndicatorType = undefined;
      }
    },

    setSaveIndicatorMessage: (state, action: PayloadAction<{ message: string; type?: 'info' | 'success' | 'warning' | 'error' }>) => {
      state.ui.saveIndicatorMessage = action.payload.message;
      state.ui.saveIndicatorType = action.payload.type || 'info';
      state.ui.showSaveIndicator = true;
    },

    setConflictDialogVisible: (state, action: PayloadAction<boolean>) => {
      state.ui.showConflictDialog = action.payload;
      if (!action.payload) {
        state.ui.conflictDialogData = undefined;
      }
    },

    setOfflineIndicatorVisible: (state, action: PayloadAction<boolean>) => {
      state.ui.showOfflineIndicator = action.payload;
    },

    // Notification actions
    addNotification: (state, action: PayloadAction<Omit<AutoSaveNotification, 'id'>>) => {
      const notification: AutoSaveNotification = {
        id: nanoid(),
        ...action.payload,
      };

      notificationAdapter.addOne(state.ui.notifications, notification);

      // Auto-remove if specified
      if (notification.autoHide && notification.duration) {
        setTimeout(() => {
          notificationAdapter.removeOne(state.ui.notifications, notification.id);
        }, notification.duration);
      }
    },

    removeNotification: (state, action: PayloadAction<string>) => {
      notificationAdapter.removeOne(state.ui.notifications, action.payload);
    },

    clearNotifications: (state) => {
      notificationAdapter.removeAll(state.ui.notifications);
    },

    // Metrics actions
    recordSaveMetrics: (state, action: PayloadAction<SaveMetrics>) => {
      const metrics = action.payload;

      // Update average save time if successful
      if (metrics.success && metrics.duration) {
        const currentAverage = state.statistics.averageSaveTime;
        const successCount = state.statistics.successfulSaves;
        const newAverage = successCount === 0
          ? metrics.duration
          : (currentAverage * successCount + metrics.duration) / (successCount + 1);

        state.statistics.averageSaveTime = newAverage;
      }
    },

    // Bulk operations
    initializeAutoSave: (state, action: PayloadAction<{ config?: Partial<AutoSaveConfig>; networkStatus?: Partial<NetworkStatus> }>) => {
      if (action.payload.config) {
        state.config = { ...state.config, ...action.payload.config };
      }

      if (action.payload.networkStatus) {
        state.network = { ...state.network, ...action.payload.networkStatus };
      }

      state.status = 'idle';
    },

    resetAutoSave: (state) => {
      // Clear all state except configuration
      const config = state.config;
      Object.assign(state, {
        ...initialState,
        config,
      });
    },

    // Emergency actions
    emergencySave: (state) => {
      state.status = 'saving';
      state.ui.showSaveIndicator = true;
      state.ui.saveIndicatorMessage = 'Emergency save in progress...';
      state.ui.saveIndicatorType = 'warning';
    },

    // Recovery actions
    startRecovery: (state) => {
      state.status = 'recovering';
      state.ui.showSaveIndicator = true;
      state.ui.saveIndicatorMessage = 'Recovering data...';
      state.ui.saveIndicatorType = 'info';
    },

    completeRecovery: (state, action: PayloadAction<{ success: boolean; message?: string }>) => {
      state.status = action.payload.success ? 'saved' : 'error';
      state.ui.saveIndicatorMessage = action.payload.message || (action.payload.success ? 'Recovery completed' : 'Recovery failed');
      state.ui.saveIndicatorType = action.payload.success ? 'success' : 'error';
    },
  },
});

// Export actions
export const {
  updateConfig,
  resetConfig,
  setStatus,
  setLastSaveTime,
  setNextSaveTime,
  updateNetworkStatus,
  incrementReconnectAttempts,
  resetReconnectAttempts,
  addOperation,
  updateOperation,
  removeOperation,
  clearCompletedOperations,
  addConflict,
  updateConflict,
  resolveConflict,
  clearConflicts,
  addBackup,
  removeBackup,
  cleanupExpiredBackups,
  setProgress,
  updateProgress,
  clearProgress,
  updateStatistics,
  resetStatistics,
  updateAverageSaveTime,
  setSaveIndicatorVisible,
  setSaveIndicatorMessage,
  setConflictDialogVisible,
  setOfflineIndicatorVisible,
  addNotification,
  removeNotification,
  clearNotifications,
  recordSaveMetrics,
  initializeAutoSave,
  resetAutoSave,
  emergencySave,
  startRecovery,
  completeRecovery,
} = autoSaveSlice.actions;

// Export reducer
export default autoSaveSlice.reducer;

// Selectors
export const selectAutoSaveConfig = (state: { autoSave: AutoSaveState }) => state.autoSave.config;
export const selectAutoSaveStatus = (state: { autoSave: AutoSaveState }) => state.autoSave.status;
export const selectNetworkStatus = (state: { autoSave: AutoSaveState }) => state.autoSave.network;
export const selectActiveOperations = (state: { autoSave: AutoSaveState }) =>
  operationAdapter.getSelectors().selectAll(state.autoSave.activeOperations);
export const selectActiveConflicts = (state: { autoSave: AutoSaveState }) =>
  conflictAdapter.getSelectors().selectAll(state.autoSave.activeConflicts);
export const selectBackups = (state: { autoSave: AutoSaveState }) =>
  backupAdapter.getSelectors().selectAll(state.autoSave.backups);
export const selectNotifications = (state: { autoSave: AutoSaveState }) =>
  notificationAdapter.getSelectors().selectAll(state.autoSave.ui.notifications);
export const selectSaveStatistics = (state: { autoSave: AutoSaveState }) => state.autoSave.statistics;
export const selectCurrentProgress = (state: { autoSave: AutoSaveState }) => state.autoSave.currentProgress;
export const selectUIState = (state: { autoSave: AutoSaveState }) => state.autoSave.ui;