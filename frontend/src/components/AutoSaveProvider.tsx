/**
 * Auto-save Provider Component
 * TASK-023: Auto-save Functionality
 *
 * Main integration component that provides auto-save functionality
 * throughout the application with all services and UI components.
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  initializeAutoSave,
  selectAutoSaveConfig,
  selectNetworkStatus,
} from '@/store/slices/autoSaveSlice';

// Services
import { AutoSaveService } from '@/services/autoSaveService';
import { getNetworkMonitor } from '@/services/networkMonitor';
import { BackupService } from '@/services/backupService';
import { getOfflineService } from '@/services/offlineService';
import { ErrorHandler } from '@/services/errorHandler';
import { ValidationService } from '@/services/validationService';

// UI Components
import SaveStatusIndicator from '@/components/ui/SaveStatusIndicator';
import AutoSaveNotifications from '@/components/ui/AutoSaveNotifications';
import ConflictResolutionDialog from '@/components/ui/ConflictResolutionDialog';

// Utility functions
import { calculateChecksum } from '@/utils/dataUtils';

interface AutoSaveProviderProps {
  children: React.ReactNode;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showIndicator?: boolean;
  showNotifications?: boolean;
  config?: Partial<AutoSaveConfig>;
}

interface AutoSaveConfig {
  enabled: boolean;
  interval: number;
  debounceDelay: number;
  maxRetries: number;
  compressionEnabled: boolean;
  backupRetention: number;
  offlineSupport: boolean;
  conflictResolution: boolean;
  validationEnabled: boolean;
  errorHandling: boolean;
}

const DEFAULT_CONFIG: AutoSaveConfig = {
  enabled: true,
  interval: 30000, // 30 seconds
  debounceDelay: 5000, // 5 seconds
  maxRetries: 5,
  compressionEnabled: true,
  backupRetention: 10,
  offlineSupport: true,
  conflictResolution: true,
  validationEnabled: true,
  errorHandling: true,
};

/**
 * Auto-save Provider
 *
 * Provides comprehensive auto-save functionality including:
 * - Automatic saving with smart debouncing
 * - Network monitoring and offline support
 * - Conflict detection and resolution
 * - Error handling and retry mechanisms
 * - Data validation and integrity checks
 * - Backup and recovery capabilities
 * - User feedback and notifications
 */
export function AutoSaveProvider({
  children,
  position = 'bottom-right',
  showIndicator = true,
  showNotifications = true,
  config: userConfig = {},
}: AutoSaveProviderProps) {
  const dispatch = useAppDispatch();
  const autoSaveConfig = useAppSelector(selectAutoSaveConfig);
  const networkStatus = useAppSelector(selectNetworkStatus);

  // Service references
  const autoSaveServiceRef = useRef<AutoSaveService | null>(null);
  const networkMonitorRef = useRef<any>(null);
  const backupServiceRef = useRef<BackupService | null>(null);
  const offlineServiceRef = useRef<any>(null);
  const errorHandlerRef = useRef<ErrorHandler | null>(null);
  const validationServiceRef = useRef<ValidationService | null>(null);

  // Merged configuration
  const config = { ...DEFAULT_CONFIG, ...userConfig };

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize auto-save configuration
        dispatch(initializeAutoSave({
          config: {
            enabled: config.enabled,
            interval: config.interval,
            debounceDelay: config.debounceDelay,
            maxRetries: config.maxRetries,
            compressionEnabled: config.compressionEnabled,
            backupRetention: config.backupRetention,
          },
          networkStatus: {
            online: navigator.onLine,
            reconnectAttempts: 0,
          },
        }));

        // Initialize network monitor
        if (config.enabled) {
          networkMonitorRef.current = getNetworkMonitor({
            pingInterval: 30000,
            qualityCheckInterval: 60000,
            reconnectAttempts: 10,
          });

          networkMonitorRef.current.start();

          // Set up network event handlers
          networkMonitorRef.current.on('status-change', (status: any) => {
            dispatch({
              type: 'autoSave/updateNetworkStatus',
              payload: status,
            });
          });

          networkMonitorRef.current.on('connection-lost', () => {
            dispatch({
              type: 'autoSave/addNotification',
              payload: {
                type: 'warning',
                title: 'Connection Lost',
                message: 'Working offline. Changes will be saved when connection is restored.',
                timestamp: Date.now(),
                autoHide: false,
              },
            });
          });

          networkMonitorRef.current.on('connection-restored', (downtime: number) => {
            dispatch({
              type: 'autoSave/addNotification',
              payload: {
                type: 'success',
                title: 'Connection Restored',
                message: `Back online after ${Math.round(downtime / 1000)} seconds.`,
                timestamp: Date.now(),
                autoHide: true,
                duration: 3000,
              },
            });
          });
        }

        // Initialize backup service
        if (config.enabled) {
          backupServiceRef.current = new BackupService({
            maxBackups: config.backupRetention,
            compressionEnabled: config.compressionEnabled,
            storageTypes: ['localStorage', 'indexedDB'],
            autoCleanup: true,
          });
        }

        // Initialize offline service
        if (config.offlineSupport && config.enabled) {
          offlineServiceRef.current = getOfflineService({
            maxQueueSize: 100,
            compressionEnabled: config.compressionEnabled,
            persistenceEnabled: true,
            syncBatchSize: 10,
          });

          offlineServiceRef.current.on('operation-queued', (operation: any) => {
            dispatch({
              type: 'autoSave/addNotification',
              payload: {
                type: 'info',
                title: 'Operation Queued',
                message: `Operation queued for when connection is restored.`,
                timestamp: Date.now(),
                autoHide: true,
                duration: 3000,
              },
            });
          });

          offlineServiceRef.current.on('sync-completed', (successful: number, failed: number) => {
            if (successful > 0) {
              dispatch({
                type: 'autoSave/addNotification',
                payload: {
                  type: 'success',
                  title: 'Sync Completed',
                  message: `Synchronized ${successful} operations.`,
                  timestamp: Date.now(),
                  autoHide: true,
                  duration: 3000,
                },
              });
            }

            if (failed > 0) {
              dispatch({
                type: 'autoSave/addNotification',
                payload: {
                  type: 'warning',
                  title: 'Sync Issues',
                  message: `${failed} operations failed to sync.`,
                  timestamp: Date.now(),
                  autoHide: false,
                },
              });
            }
          });
        }

        // Initialize error handler
        if (config.errorHandling && config.enabled) {
          errorHandlerRef.current = new ErrorHandler({
            enableLogging: true,
            enableReporting: process.env.NODE_ENV === 'production',
            enableUserNotifications: true,
            maxErrorHistory: 50,
          });

          errorHandlerRef.current.on('error-occurred', (error: any) => {
            dispatch({
              type: 'autoSave/addNotification',
              payload: {
                type: 'error',
                title: 'Save Error',
                message: error.userAction || error.message,
                timestamp: Date.now(),
                autoHide: !error.severity || error.severity !== 'critical',
                duration: 5000,
                actions: error.retryable ? [
                  {
                    id: 'retry',
                    label: 'Retry',
                    type: 'primary',
                    action: () => {
                      // Trigger retry
                      dispatch({
                        type: 'autoSave/retryOperation',
                        payload: { errorId: error.id },
                      });
                    },
                  },
                ] : undefined,
              },
            });
          });

          errorHandlerRef.current.on('error-recovered', (error: any) => {
            dispatch({
              type: 'autoSave/addNotification',
              payload: {
                type: 'success',
                title: 'Error Recovered',
                message: 'Operation completed successfully after retry.',
                timestamp: Date.now(),
                autoHide: true,
                duration: 3000,
              },
            });
          });

          errorHandlerRef.current.on('critical-error', (error: any) => {
            dispatch({
              type: 'autoSave/addNotification',
              payload: {
                type: 'error',
                title: 'Critical Error',
                message: 'A critical error occurred. Please refresh the page.',
                timestamp: Date.now(),
                autoHide: false,
                actions: [
                  {
                    id: 'refresh',
                    label: 'Refresh Page',
                    type: 'primary',
                    action: () => window.location.reload(),
                  },
                ],
              },
            });
          });
        }

        // Initialize validation service
        if (config.validationEnabled && config.enabled) {
          validationServiceRef.current = new ValidationService({
            strictMode: false,
            maxFileSize: 50 * 1024 * 1024, // 50MB
            maxNodes: 10000,
            maxEdges: 20000,
            performanceChecks: true,
            validateReferences: true,
          });
        }

        console.log('Auto-save system initialized successfully');

      } catch (error) {
        console.error('Failed to initialize auto-save system:', error);

        dispatch({
          type: 'autoSave/addNotification',
          payload: {
            type: 'error',
            title: 'Initialization Failed',
            message: 'Auto-save system failed to initialize. Some features may not work.',
            timestamp: Date.now(),
            autoHide: false,
          },
        });
      }
    };

    if (config.enabled) {
      initializeServices();
    }

    // Cleanup on unmount
    return () => {
      if (autoSaveServiceRef.current) {
        autoSaveServiceRef.current.cleanup();
      }

      if (networkMonitorRef.current) {
        networkMonitorRef.current.stop();
      }

      if (offlineServiceRef.current) {
        offlineServiceRef.current.destroy();
      }

      if (errorHandlerRef.current) {
        errorHandlerRef.current.clearErrorHistory();
      }
    };
  }, [config.enabled, dispatch]);

  // Update configuration when it changes
  useEffect(() => {
    if (config.enabled && autoSaveConfig) {
      // Update service configurations
      if (validationServiceRef.current) {
        validationServiceRef.current.updateConfig({
          strictMode: false,
          performanceChecks: true,
        });
      }
    }
  }, [autoSaveConfig, config.enabled]);

  // Handle page visibility changes for emergency saves
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && autoSaveServiceRef.current) {
        // Trigger emergency save when page becomes hidden
        const state = (window as any).__REDUX_STORE__?.getState?.();
        const drawingId = state?.enhancedDrawing?.current?.id;

        if (drawingId) {
          autoSaveServiceRef.current.performEmergencySave(drawingId)
            .catch(error => {
              console.error('Emergency save failed:', error);
            });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Handle beforeunload for emergency saves
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Check if there are unsaved changes
      const state = (window as any).__REDUX_STORE__?.getState?.();
      const hasUnsavedChanges = state?.enhancedDrawing?.persistence?.hasUnsavedChanges;

      if (hasUnsavedChanges && autoSaveServiceRef.current) {
        const drawingId = state?.enhancedDrawing?.current?.id;

        if (drawingId) {
          // Attempt synchronous emergency save
          try {
            autoSaveServiceRef.current.performEmergencySave(drawingId);
          } catch (error) {
            console.error('Emergency save on beforeunload failed:', error);
          }

          // Show browser warning
          event.preventDefault();
          event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
          return event.returnValue;
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  if (!config.enabled) {
    return <>{children}</>;
  }

  return (
    <>
      {children}

      {/* Save Status Indicator */}
      {showIndicator && (
        <SaveStatusIndicator
          position={position}
          showLastSaveTime={true}
          className="z-50"
        />
      )}

      {/* Auto-save Notifications */}
      {showNotifications && (
        <AutoSaveNotifications
          position={position === 'bottom-right' ? 'top-right' : 'top-left'}
          maxNotifications={5}
          className="z-40"
        />
      )}

      {/* Conflict Resolution Dialog */}
      {config.conflictResolution && (
        <ConflictResolutionDialog className="z-60" />
      )}
    </>
  );
}

/**
 * Hook to access auto-save services
 */
export function useAutoSave() {
  const dispatch = useAppDispatch();
  const config = useAppSelector(selectAutoSaveConfig);
  const networkStatus = useAppSelector(selectNetworkStatus);

  return {
    config,
    networkStatus,
    isEnabled: config.enabled,
    isOnline: networkStatus.online,

    // Manual save trigger
    triggerSave: (drawingId: string) => {
      dispatch({
        type: 'enhancedDrawing/saveDrawing',
        payload: { drawingId, manual: true },
      });
    },

    // Emergency save trigger
    triggerEmergencySave: (drawingId: string) => {
      dispatch({
        type: 'autoSave/emergencySave',
        payload: { drawingId },
      });
    },

    // Configuration update
    updateConfig: (newConfig: Partial<any>) => {
      dispatch({
        type: 'autoSave/updateConfig',
        payload: newConfig,
      });
    },
  };
}

/**
 * Hook to access auto-save statistics
 */
export function useAutoSaveStats() {
  const statistics = useAppSelector(state => state.autoSave.statistics);
  const activeOperations = useAppSelector(state => state.autoSave.activeOperations);
  const conflicts = useAppSelector(state => state.autoSave.activeConflicts);

  return {
    statistics,
    activeOperationsCount: activeOperations.ids.length,
    activeConflictsCount: conflicts.ids.length,
    successRate: statistics.totalSaves > 0
      ? (statistics.successfulSaves / statistics.totalSaves) * 100
      : 100,
    averageSaveTime: statistics.averageSaveTime,
  };
}

export default AutoSaveProvider;