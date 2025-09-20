/**
 * Tool State Persistence Hook - TASK-016 Implementation
 * Manages persistent storage of tool settings and preferences
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectToolPaletteState,
  importState,
  exportState,
  setPreferences,
} from '@/store/slices/toolPaletteSlice';
import { ToolState, ToolPreferences } from '@/types/tools';

const STORAGE_KEY = 'ergoplanner-tool-state';
const STORAGE_VERSION = '1.0';

interface StorageData {
  version: string;
  timestamp: number;
  state: Partial<ToolState>;
}

interface UseToolStatePersistenceOptions {
  enabled?: boolean;
  autoSave?: boolean;
  saveInterval?: number;
  excludeKeys?: (keyof ToolState)[];
  storageKey?: string;
}

export function useToolStatePersistence(options: UseToolStatePersistenceOptions = {}) {
  const {
    enabled = true,
    autoSave = true,
    saveInterval = 5000, // 5 seconds
    excludeKeys = [],
    storageKey = STORAGE_KEY,
  } = options;

  const dispatch = useAppDispatch();
  const toolState = useAppSelector(selectToolPaletteState);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedStateRef = useRef<string>('');

  // Check if persistence is supported
  const isSupported = useCallback(() => {
    try {
      const testKey = '__ergoplanner_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Save state to localStorage
  const saveState = useCallback(async (state: ToolState) => {
    if (!enabled || !isSupported()) return;

    try {
      // Create filtered state (exclude specified keys)
      const filteredState = { ...state };
      excludeKeys.forEach(key => {
        delete filteredState[key];
      });

      const storageData: StorageData = {
        version: STORAGE_VERSION,
        timestamp: Date.now(),
        state: filteredState,
      };

      const serializedState = JSON.stringify(storageData);

      // Only save if state has actually changed
      if (serializedState === lastSavedStateRef.current) return;

      localStorage.setItem(storageKey, serializedState);
      lastSavedStateRef.current = serializedState;

      console.log('Tool state saved to localStorage');
    } catch (error) {
      console.error('Failed to save tool state:', error);
    }
  }, [enabled, isSupported, excludeKeys, storageKey]);

  // Load state from localStorage
  const loadState = useCallback(async (): Promise<Partial<ToolState> | null> => {
    if (!enabled || !isSupported()) return null;

    try {
      const serializedState = localStorage.getItem(storageKey);
      if (!serializedState) return null;

      const storageData: StorageData = JSON.parse(serializedState);

      // Check version compatibility
      if (storageData.version !== STORAGE_VERSION) {
        console.warn('Tool state version mismatch, ignoring stored state');
        return null;
      }

      // Check if state is not too old (30 days)
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
      if (Date.now() - storageData.timestamp > maxAge) {
        console.warn('Tool state is too old, ignoring stored state');
        localStorage.removeItem(storageKey);
        return null;
      }

      console.log('Tool state loaded from localStorage');
      return storageData.state;
    } catch (error) {
      console.error('Failed to load tool state:', error);
      // Clear corrupted data
      localStorage.removeItem(storageKey);
      return null;
    }
  }, [enabled, isSupported, storageKey]);

  // Clear stored state
  const clearState = useCallback(() => {
    if (!isSupported()) return;

    try {
      localStorage.removeItem(storageKey);
      lastSavedStateRef.current = '';
      console.log('Tool state cleared from localStorage');
    } catch (error) {
      console.error('Failed to clear tool state:', error);
    }
  }, [storageKey]);

  // Export state to file
  const exportToFile = useCallback((filename?: string) => {
    try {
      const exportData = {
        version: STORAGE_VERSION,
        timestamp: Date.now(),
        state: toolState,
        metadata: {
          userAgent: navigator.userAgent,
          url: window.location.href,
        },
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `ergoplanner-tools-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      console.log('Tool state exported to file');
    } catch (error) {
      console.error('Failed to export tool state:', error);
    }
  }, [toolState]);

  // Import state from file
  const importFromFile = useCallback((file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importData = JSON.parse(e.target?.result as string);

            // Validate import data
            if (!importData.state || !importData.version) {
              throw new Error('Invalid import file format');
            }

            // Check version compatibility
            if (importData.version !== STORAGE_VERSION) {
              console.warn('Import file version mismatch, attempting to migrate');
            }

            dispatch(importState(importData.state));
            console.log('Tool state imported from file');
            resolve(true);
          } catch (error) {
            console.error('Failed to parse import file:', error);
            resolve(false);
          }
        };
        reader.onerror = () => resolve(false);
        reader.readAsText(file);
      } catch (error) {
        console.error('Failed to read import file:', error);
        resolve(false);
      }
    });
  }, [dispatch]);

  // Debounced save function
  const debouncedSave = useCallback((state: ToolState) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveState(state);
    }, saveInterval);
  }, [saveState, saveInterval]);

  // Load state on mount
  useEffect(() => {
    if (!enabled) return;

    const loadInitialState = async () => {
      const savedState = await loadState();
      if (savedState) {
        dispatch(importState(savedState));
      }
    };

    loadInitialState();
  }, [enabled, loadState, dispatch]);

  // Auto-save when state changes
  useEffect(() => {
    if (!enabled || !autoSave) return;

    // Check if user has persistence enabled in preferences
    if (!toolState.preferences.persistState) return;

    debouncedSave(toolState);
  }, [enabled, autoSave, toolState, debouncedSave]);

  // Save on page unload
  useEffect(() => {
    if (!enabled || !autoSave) return;

    const handleBeforeUnload = () => {
      if (toolState.preferences.persistState) {
        saveState(toolState);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled, autoSave, toolState, saveState]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    isSupported: isSupported(),
    isEnabled: enabled,

    // Actions
    saveState: () => saveState(toolState),
    loadState,
    clearState,
    exportToFile,
    importFromFile,

    // Settings
    togglePersistence: (enabled: boolean) => {
      dispatch(setPreferences({ persistState: enabled }));
    },
  };
}

// Hook for managing specific tool preferences
export function useToolPreferences() {
  const dispatch = useAppDispatch();
  const preferences = useAppSelector(state => state.toolPalette.preferences);

  const updatePreference = useCallback(<K extends keyof ToolPreferences>(
    key: K,
    value: ToolPreferences[K]
  ) => {
    dispatch(setPreferences({ [key]: value }));
  }, [dispatch]);

  const resetPreferences = useCallback(() => {
    const defaultPreferences: ToolPreferences = {
      defaultTool: 'select',
      autoSwitchTool: true,
      confirmDestructive: true,
      showTooltips: true,
      animateTransitions: true,
      persistState: true,
      theme: 'auto',
    };

    dispatch(setPreferences(defaultPreferences));
  }, [dispatch]);

  return {
    preferences,
    updatePreference,
    resetPreferences,
  };
}

// Hook for managing user session state
export function useSessionState() {
  const sessionKey = 'ergoplanner-session-state';

  const saveSessionData = useCallback((key: string, data: any) => {
    try {
      const sessionData = JSON.parse(sessionStorage.getItem(sessionKey) || '{}');
      sessionData[key] = data;
      sessionStorage.setItem(sessionKey, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Failed to save session data:', error);
    }
  }, [sessionKey]);

  const loadSessionData = useCallback((key: string, defaultValue: any = null) => {
    try {
      const sessionData = JSON.parse(sessionStorage.getItem(sessionKey) || '{}');
      return sessionData[key] || defaultValue;
    } catch (error) {
      console.error('Failed to load session data:', error);
      return defaultValue;
    }
  }, [sessionKey]);

  const clearSessionData = useCallback((key?: string) => {
    try {
      if (key) {
        const sessionData = JSON.parse(sessionStorage.getItem(sessionKey) || '{}');
        delete sessionData[key];
        sessionStorage.setItem(sessionKey, JSON.stringify(sessionData));
      } else {
        sessionStorage.removeItem(sessionKey);
      }
    } catch (error) {
      console.error('Failed to clear session data:', error);
    }
  }, [sessionKey]);

  return {
    saveSessionData,
    loadSessionData,
    clearSessionData,
  };
}