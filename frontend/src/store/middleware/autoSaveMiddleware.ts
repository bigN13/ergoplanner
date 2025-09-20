/**
 * Auto-save Middleware
 * TASK-023: Auto-save Functionality
 *
 * Redux middleware that integrates the auto-save service with the store,
 * monitoring state changes and triggering saves automatically.
 */

import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { debounce, throttle } from 'lodash-es';
import type { RootState, AppDispatch } from '@/store';
import type { AutoSaveConfig, SaveOperation } from '@/types/autosave';

// Import services
import { AutoSaveService } from '@/services/autoSaveService';
import { getNetworkMonitor } from '@/services/networkMonitor';
import { BackupService } from '@/services/backupService';

// Import actions
import {
  updateConfig,
  setStatus,
  updateNetworkStatus,
  addOperation,
  updateOperation,
  addNotification,
  setSaveIndicatorVisible,
  setSaveIndicatorMessage,
  recordSaveMetrics,
} from '@/store/slices/autoSaveSlice';

import {
  updateDrawing,
  addNode,
  updateNode,
  deleteNode,
  addEdge,
  updateEdge,
  deleteEdge,
  updateViewport,
  setReactFlowData,
} from '@/store/slices/enhancedDrawingSlice';

// Action patterns that trigger auto-save
const DRAWING_CHANGE_ACTIONS = [
  'enhancedDrawing/updateDrawing',
  'enhancedDrawing/addNode',
  'enhancedDrawing/updateNode',
  'enhancedDrawing/deleteNode',
  'enhancedDrawing/addEdge',
  'enhancedDrawing/updateEdge',
  'enhancedDrawing/deleteEdge',
  'enhancedDrawing/updateViewport',
  'enhancedDrawing/setReactFlowData',
  'enhancedDrawing/moveElements',
  'enhancedDrawing/resizeNode',
  'enhancedDrawing/updateNodeData',
  'enhancedDrawing/updateEdgeData',
];

// Action patterns that require immediate save
const IMMEDIATE_SAVE_ACTIONS = [
  'enhancedDrawing/saveDrawing',
  'enhancedDrawing/exportDrawing',
  'drawing/manualSave',
];

// Action patterns that should NOT trigger auto-save
const EXCLUDED_ACTIONS = [
  'enhancedDrawing/updateCollaboratorCursor',
  'enhancedDrawing/updatePerformanceMetrics',
  'enhancedDrawing/setPersistenceState',
  'autoSave/', // All auto-save actions
  'auth/',    // Authentication actions
  'ui/',      // UI-only actions
];

/**
 * Auto-save middleware configuration
 */
interface AutoSaveMiddlewareConfig {
  autoSave: Partial<AutoSaveConfig>;
  debounceDelay: number;
  throttleDelay: number;
  batchSize: number;
  enabledInDevelopment: boolean;
}

const DEFAULT_MIDDLEWARE_CONFIG: AutoSaveMiddlewareConfig = {
  autoSave: {
    enabled: true,
    interval: 30000, // 30 seconds
    debounceDelay: 5000, // 5 seconds
    maxRetries: 5,
  },
  debounceDelay: 3000,  // 3 seconds for middleware debouncing
  throttleDelay: 1000,  // 1 second for throttling
  batchSize: 5,         // Max operations to batch
  enabledInDevelopment: true,
};

/**
 * Create auto-save middleware
 */
export function createAutoSaveMiddleware(config: Partial<AutoSaveMiddlewareConfig> = {}) {
  const middlewareConfig = { ...DEFAULT_MIDDLEWARE_CONFIG, ...config };

  // Skip in development if disabled
  if (process.env.NODE_ENV === 'development' && !middlewareConfig.enabledInDevelopment) {
    return createListenerMiddleware().middleware;
  }

  const listener = createListenerMiddleware();

  // Service instances
  let autoSaveService: AutoSaveService | null = null;
  let backupService: BackupService | null = null;
  let networkMonitor = getNetworkMonitor();

  // Change tracking
  let pendingChanges = new Set<string>();
  let lastSaveTime = 0;
  let saveInProgress = false;

  // Debounced save function
  const debouncedSave = debounce(async (dispatch: AppDispatch, getState: () => RootState) => {
    if (saveInProgress) return;

    const state = getState();
    const { enhancedDrawing, autoSave } = state;

    if (!enhancedDrawing.current?.id || !autoSave.config.enabled) {
      return;
    }

    try {
      saveInProgress = true;
      await performAutoSave(dispatch, getState);
      pendingChanges.clear();
    } catch (error) {
      console.error('Auto-save failed:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'Auto-save Failed',
        message: `Failed to auto-save: ${(error as Error).message}`,
        timestamp: Date.now(),
        autoHide: false,
      }));
    } finally {
      saveInProgress = false;
    }
  }, middlewareConfig.debounceDelay);

  // Throttled save for high-frequency actions
  const throttledSave = throttle(async (dispatch: AppDispatch, getState: () => RootState) => {
    if (pendingChanges.size > 0) {
      debouncedSave(dispatch, getState);
    }
  }, middlewareConfig.throttleDelay);

  /**
   * Initialize services
   */
  listener.startListening({
    predicate: (action, currentState, previousState) => {
      // Initialize on first action
      return !autoSaveService;
    },
    effect: async (action, listenerApi) => {
      const { dispatch, getState } = listenerApi;

      // Initialize auto-save service
      autoSaveService = new AutoSaveService(
        dispatch,
        getState,
        middlewareConfig.autoSave
      );

      // Initialize backup service
      backupService = new BackupService();

      // Initialize network monitor
      networkMonitor.start();

      // Set up network monitor event handlers
      networkMonitor.on('status-change', (status) => {
        dispatch(updateNetworkStatus(status));
      });

      networkMonitor.on('connection-lost', () => {
        dispatch(addNotification({
          type: 'warning',
          title: 'Connection Lost',
          message: 'You are now offline. Changes will be saved when connection is restored.',
          timestamp: Date.now(),
          autoHide: false,
        }));
      });

      networkMonitor.on('connection-restored', (downtime) => {
        dispatch(addNotification({
          type: 'success',
          title: 'Connection Restored',
          message: `Connection restored after ${Math.round(downtime / 1000)} seconds.`,
          timestamp: Date.now(),
          autoHide: true,
          duration: 3000,
        }));
      });

      console.log('Auto-save middleware initialized');
    },
  });

  /**
   * Listen for drawing changes that should trigger auto-save
   */
  listener.startListening({
    predicate: (action) => {
      // Check if action should trigger auto-save
      return DRAWING_CHANGE_ACTIONS.some(pattern => action.type.includes(pattern)) &&
             !EXCLUDED_ACTIONS.some(pattern => action.type.includes(pattern));
    },
    effect: async (action, listenerApi) => {
      const { dispatch, getState } = listenerApi;

      if (!autoSaveService) return;

      // Track the change
      pendingChanges.add(action.type);

      // Update save indicator
      dispatch(setSaveIndicatorMessage({
        message: 'Unsaved changes',
        type: 'warning',
      }));

      // Schedule auto-save
      throttledSave(dispatch, getState);
    },
  });

  /**
   * Listen for immediate save actions
   */
  listener.startListening({
    predicate: (action) => {
      return IMMEDIATE_SAVE_ACTIONS.some(pattern => action.type.includes(pattern));
    },
    effect: async (action, listenerApi) => {
      const { dispatch, getState } = listenerApi;

      if (!autoSaveService) return;

      const state = getState();
      const drawingId = state.enhancedDrawing.current?.id;

      if (!drawingId) return;

      try {
        // Cancel any pending debounced saves
        debouncedSave.cancel();

        // Perform immediate save
        saveInProgress = true;
        const operation = await autoSaveService.performManualSave(drawingId);

        dispatch(addNotification({
          type: 'success',
          title: 'Saved',
          message: 'Drawing saved successfully',
          timestamp: Date.now(),
          autoHide: true,
          duration: 2000,
        }));

        pendingChanges.clear();
      } catch (error) {
        console.error('Manual save failed:', error);
        dispatch(addNotification({
          type: 'error',
          title: 'Save Failed',
          message: `Failed to save: ${(error as Error).message}`,
          timestamp: Date.now(),
          autoHide: false,
        }));
      } finally {
        saveInProgress = false;
      }
    },
  });

  /**
   * Listen for auto-save configuration changes
   */
  listener.startListening({
    actionCreator: updateConfig,
    effect: async (action, listenerApi) => {
      if (autoSaveService) {
        // Restart auto-save service with new config
        autoSaveService.cleanup();
        autoSaveService = new AutoSaveService(
          listenerApi.dispatch,
          listenerApi.getState,
          action.payload
        );
      }
    },
  });

  /**
   * Listen for page visibility changes
   */
  listener.startListening({
    predicate: () => false, // Never matches - we'll set this up separately
    effect: () => {}, // No-op
  });

  // Set up page visibility listener separately
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && pendingChanges.size > 0 && autoSaveService) {
        // Save immediately when page becomes hidden
        debouncedSave.flush();
      }
    });
  }

  /**
   * Listen for beforeunload events
   */
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', (event) => {
      if (pendingChanges.size > 0) {
        // Attempt emergency save
        const state = listener.middleware.getState();
        const drawingId = state.enhancedDrawing.current?.id;

        if (drawingId && autoSaveService) {
          // Perform synchronous emergency save
          autoSaveService.performEmergencySave(drawingId);

          // Show browser warning
          event.preventDefault();
          event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
          return event.returnValue;
        }
      }
    });
  }

  /**
   * Keyboard shortcuts for manual save
   */
  if (typeof document !== 'undefined') {
    document.addEventListener('keydown', (event) => {
      // Ctrl+S or Cmd+S
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();

        if (autoSaveService) {
          const state = listener.middleware.getState();
          const drawingId = state.enhancedDrawing.current?.id;

          if (drawingId) {
            autoSaveService.performManualSave(drawingId)
              .then(() => {
                listener.middleware.dispatch(addNotification({
                  type: 'success',
                  title: 'Saved',
                  message: 'Drawing saved successfully (Ctrl+S)',
                  timestamp: Date.now(),
                  autoHide: true,
                  duration: 2000,
                }));
              })
              .catch((error) => {
                listener.middleware.dispatch(addNotification({
                  type: 'error',
                  title: 'Save Failed',
                  message: `Save failed: ${error.message}`,
                  timestamp: Date.now(),
                  autoHide: false,
                }));
              });
          }
        }
      }
    });
  }

  /**
   * Perform auto-save operation
   */
  async function performAutoSave(dispatch: AppDispatch, getState: () => RootState): Promise<void> {
    if (!autoSaveService) return;

    const state = getState();
    const { enhancedDrawing, autoSave } = state;

    if (!enhancedDrawing.current?.id) return;

    // Check if enough time has passed since last save
    const now = Date.now();
    const timeSinceLastSave = now - lastSaveTime;

    if (timeSinceLastSave < autoSave.config.debounceDelay) {
      return; // Too soon
    }

    // Update save status
    dispatch(setStatus('saving'));
    dispatch(setSaveIndicatorMessage({
      message: 'Saving...',
      type: 'info',
    }));

    try {
      // Create backup first (if enabled)
      if (backupService) {
        const payload = autoSaveService.prepareSavePayload(enhancedDrawing.current.id, state);
        await backupService.createBackup(enhancedDrawing.current.id, payload);
      }

      // Perform the save
      await autoSaveService.scheduleAutoSave();

      lastSaveTime = now;

      // Update status
      dispatch(setStatus('saved'));
      dispatch(setSaveIndicatorMessage({
        message: 'Saved',
        type: 'success',
      }));

      // Auto-hide indicator
      setTimeout(() => {
        dispatch(setSaveIndicatorVisible(false));
      }, 2000);

    } catch (error) {
      dispatch(setStatus('error'));
      dispatch(setSaveIndicatorMessage({
        message: `Save failed: ${(error as Error).message}`,
        type: 'error',
      }));

      throw error;
    }
  }

  /**
   * Clean up when middleware is destroyed
   */
  function cleanup() {
    if (autoSaveService) {
      autoSaveService.cleanup();
      autoSaveService = null;
    }

    if (networkMonitor) {
      networkMonitor.stop();
    }

    debouncedSave.cancel();
    throttledSave.cancel();
  }

  // Attach cleanup to middleware
  (listener.middleware as any).cleanup = cleanup;

  return listener.middleware;
}

/**
 * Enhanced listener middleware with auto-save integration
 */
export const autoSaveMiddleware = createAutoSaveMiddleware();

// Export the middleware with cleanup capability
export default autoSaveMiddleware;