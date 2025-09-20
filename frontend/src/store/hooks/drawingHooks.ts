/**
 * Enhanced Drawing State Hooks
 * TASK-022: Redux State for Drawings
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { debounce, throttle } from 'lodash-es';
import type { RootState } from '@/store';
import type { ReactFlowData, Drawing } from '@/types';
import type {
  DrawingAction,
  OptimisticUpdate,
  CollaboratorCursor,
  ElementLock,
  DrawingSnapshot,
} from '@/types/drawing-state';

// Import actions
import {
  setCurrentDrawing,
  clearCurrentDrawing,
  updateReactFlowDataWithHistory,
  startActionGroup,
  endActionGroup,
  undo,
  redo,
  clearHistory,
  setSelection,
  addToSelection,
  removeFromSelection,
  clearSelection,
  copyToClipboard,
  pasteFromClipboard,
  updateCollaboratorCursor,
  lockElement,
  unlockElement,
  createSnapshot,
  restoreSnapshot,
  setViewport,
  updateGridSettings,
  updateSettings,
  validateState,
  enablePersistence,
  disablePersistence,
  addOptimisticUpdate,
  confirmOptimisticUpdate,
  rejectOptimisticUpdate,
} from '@/store/slices/enhancedDrawingSlice';

// Import selectors
import {
  selectCurrentDrawing,
  selectReactFlowData,
  selectNodes,
  selectEdges,
  selectCanUndo,
  selectCanRedo,
  selectHistorySize,
  selectSelection,
  selectSelectedNodeObjects,
  selectSelectedEdgeObjects,
  selectCollaboratorCursors,
  selectElementLocks,
  selectAutoSaveStatus,
  selectPerformanceMetrics,
  selectValidationErrors,
  selectSnapshots,
  selectSettings,
  selectDrawingStats,
  selectDrawingHealth,
} from '@/store/selectors/drawingSelectors';

// Import API hooks
import {
  useGetDrawingQuery,
  useUpdateDrawingDataMutation,
  useCreateDrawingSnapshotMutation,
  useValidateDrawingMutation,
} from '@/api/drawingApiSlice';

// Import utilities
import { collaborationManager } from '@/store/middleware/collaborationMiddleware';
import { calculateDrawingDiff, validateDrawingState } from '@/store/utils/drawingUtils';

// === CORE DRAWING HOOKS ===

/**
 * Hook for managing current drawing state
 */
export const useDrawing = (drawingId?: string) => {
  const dispatch = useDispatch();
  const currentDrawing = useSelector(selectCurrentDrawing);
  const reactFlowData = useSelector(selectReactFlowData);
  const nodes = useSelector(selectNodes);
  const edges = useSelector(selectEdges);
  const stats = useSelector(selectDrawingStats);

  // RTK Query for fetching drawing data
  const {
    data: fetchedDrawing,
    isLoading,
    error,
    refetch,
  } = useGetDrawingQuery(drawingId || '', {
    skip: !drawingId,
  });

  // Load drawing when fetched
  useEffect(() => {
    if (fetchedDrawing && fetchedDrawing.id !== currentDrawing?.id) {
      dispatch(setCurrentDrawing(fetchedDrawing));
    }
  }, [fetchedDrawing, currentDrawing?.id, dispatch]);

  const loadDrawing = useCallback((drawing: Drawing) => {
    dispatch(setCurrentDrawing(drawing));
  }, [dispatch]);

  const clearDrawing = useCallback(() => {
    dispatch(clearCurrentDrawing());
  }, [dispatch]);

  return {
    currentDrawing,
    reactFlowData,
    nodes,
    edges,
    stats,
    isLoading,
    error,
    loadDrawing,
    clearDrawing,
    refetch,
  };
};

/**
 * Hook for managing drawing history and undo/redo
 */
export const useDrawingHistory = () => {
  const dispatch = useDispatch();
  const canUndo = useSelector(selectCanUndo);
  const canRedo = useSelector(selectCanRedo);
  const historySize = useSelector(selectHistorySize);

  const performUndo = useCallback(() => {
    if (canUndo) {
      dispatch(undo());
    }
  }, [canUndo, dispatch]);

  const performRedo = useCallback(() => {
    if (canRedo) {
      dispatch(redo());
    }
  }, [canRedo, dispatch]);

  const clearHistoryData = useCallback(() => {
    dispatch(clearHistory());
  }, [dispatch]);

  // Action grouping for complex operations
  const withActionGroup = useCallback((
    description: string,
    actionFn: () => void | Promise<void>
  ) => {
    const groupId = `group_${Date.now()}`;
    dispatch(startActionGroup({ id: groupId, description }));

    try {
      const result = actionFn();
      if (result instanceof Promise) {
        return result.finally(() => {
          dispatch(endActionGroup());
        });
      } else {
        dispatch(endActionGroup());
        return result;
      }
    } catch (error) {
      dispatch(endActionGroup());
      throw error;
    }
  }, [dispatch]);

  return {
    canUndo,
    canRedo,
    historySize,
    undo: performUndo,
    redo: performRedo,
    clearHistory: clearHistoryData,
    withActionGroup,
  };
};

/**
 * Hook for updating ReactFlow data with history tracking
 */
export const useDrawingUpdate = () => {
  const dispatch = useDispatch();
  const currentDrawing = useSelector(selectCurrentDrawing);
  const [updateDrawingData] = useUpdateDrawingDataMutation();

  // Debounced update to prevent excessive API calls
  const debouncedApiUpdate = useMemo(
    () => debounce(async (drawingId: string, data: ReactFlowData) => {
      try {
        await updateDrawingData({
          id: drawingId,
          reactFlowData: data,
        }).unwrap();
      } catch (error) {
        console.error('Failed to update drawing data:', error);
      }
    }, 2000),
    [updateDrawingData]
  );

  const updateData = useCallback((
    data: ReactFlowData,
    description: string = 'Update drawing data',
    options?: {
      skipHistory?: boolean;
      syncToServer?: boolean;
      metadata?: any;
    }
  ) => {
    const { skipHistory = false, syncToServer = true, metadata } = options || {};

    if (!skipHistory) {
      dispatch(updateReactFlowDataWithHistory({
        data,
        description,
        metadata,
      }));
    }

    // Sync to server if enabled and drawing exists
    if (syncToServer && currentDrawing?.id) {
      debouncedApiUpdate(currentDrawing.id, data);
    }
  }, [dispatch, currentDrawing?.id, debouncedApiUpdate]);

  const updateNodes = useCallback((
    nodes: any[],
    description: string = 'Update nodes'
  ) => {
    const currentData = useSelector.getState().enhancedDrawing?.reactFlowData ||
                       useSelector.getState().drawing?.reactFlowData;
    if (currentData) {
      updateData(
        { ...currentData, nodes },
        description,
        { metadata: { nodeIds: nodes.map(n => n.id) } }
      );
    }
  }, [updateData]);

  const updateEdges = useCallback((
    edges: any[],
    description: string = 'Update edges'
  ) => {
    const currentData = useSelector.getState().enhancedDrawing?.reactFlowData ||
                       useSelector.getState().drawing?.reactFlowData;
    if (currentData) {
      updateData(
        { ...currentData, edges },
        description,
        { metadata: { edgeIds: edges.map(e => e.id) } }
      );
    }
  }, [updateData]);

  return {
    updateData,
    updateNodes,
    updateEdges,
  };
};

/**
 * Hook for managing selection state
 */
export const useDrawingSelection = () => {
  const dispatch = useDispatch();
  const selection = useSelector(selectSelection);
  const selectedNodes = useSelector(selectSelectedNodeObjects);
  const selectedEdges = useSelector(selectSelectedEdgeObjects);

  const setSelectionState = useCallback((selection: {
    components?: string[];
    nodes?: string[];
    edges?: string[];
    bounds?: { x: number; y: number; width: number; height: number };
  }) => {
    dispatch(setSelection(selection));
  }, [dispatch]);

  const addToSelectionState = useCallback((
    type: 'component' | 'node' | 'edge',
    id: string
  ) => {
    dispatch(addToSelection({ type, id }));
  }, [dispatch]);

  const removeFromSelectionState = useCallback((
    type: 'component' | 'node' | 'edge',
    id: string
  ) => {
    dispatch(removeFromSelection({ type, id }));
  }, [dispatch]);

  const clearSelectionState = useCallback(() => {
    dispatch(clearSelection());
  }, [dispatch]);

  const selectAll = useCallback(() => {
    const allNodes = useSelector.getState().enhancedDrawing?.reactFlowData.nodes ||
                    useSelector.getState().drawing?.reactFlowData.nodes || [];
    const allEdges = useSelector.getState().enhancedDrawing?.reactFlowData.edges ||
                    useSelector.getState().drawing?.reactFlowData.edges || [];

    dispatch(setSelection({
      nodes: allNodes.map(n => n.id),
      edges: allEdges.map(e => e.id),
    }));
  }, [dispatch]);

  return {
    selection,
    selectedNodes,
    selectedEdges,
    setSelection: setSelectionState,
    addToSelection: addToSelectionState,
    removeFromSelection: removeFromSelectionState,
    clearSelection: clearSelectionState,
    selectAll,
  };
};

/**
 * Hook for clipboard operations
 */
export const useDrawingClipboard = () => {
  const dispatch = useDispatch();

  const copy = useCallback((format: 'internal' | 'external' = 'internal') => {
    dispatch(copyToClipboard({ format }));
  }, [dispatch]);

  const paste = useCallback((
    offsetX: number = 20,
    offsetY: number = 20,
    generateNewIds: boolean = true
  ) => {
    dispatch(pasteFromClipboard({ offsetX, offsetY, generateNewIds }));
  }, [dispatch]);

  return {
    copy,
    paste,
  };
};

/**
 * Hook for real-time collaboration features
 */
export const useDrawingCollaboration = () => {
  const dispatch = useDispatch();
  const cursors = useSelector(selectCollaboratorCursors);
  const locks = useSelector(selectElementLocks);
  const currentDrawing = useSelector(selectCurrentDrawing);

  // Throttled cursor position update
  const updateCursor = useMemo(
    () => throttle((position: { x: number; y: number }) => {
      if (currentDrawing?.id) {
        collaborationManager.sendCursorPosition(position);
      }
    }, 100),
    [currentDrawing?.id]
  );

  const lockElementForEdit = useCallback(async (
    elementId: string,
    elementType: 'node' | 'edge' | 'component'
  ) => {
    await collaborationManager.lockElementForEdit(elementId, elementType);
  }, []);

  const unlockElementAfterEdit = useCallback(async (elementId: string) => {
    await collaborationManager.unlockElementAfterEdit(elementId);
  }, []);

  const isElementLocked = useCallback((elementId: string, userId?: string) => {
    return locks.some(lock =>
      lock.elementId === elementId &&
      (userId ? lock.userId !== userId : true)
    );
  }, [locks]);

  return {
    cursors,
    locks,
    updateCursor,
    lockElement: lockElementForEdit,
    unlockElement: unlockElementAfterEdit,
    isElementLocked,
  };
};

/**
 * Hook for snapshot management
 */
export const useDrawingSnapshots = () => {
  const dispatch = useDispatch();
  const snapshots = useSelector(selectSnapshots);
  const currentDrawing = useSelector(selectCurrentDrawing);
  const [createSnapshotApi] = useCreateDrawingSnapshotMutation();

  const createSnapshotLocal = useCallback((
    name: string,
    description?: string,
    isAutomatic: boolean = false
  ) => {
    dispatch(createSnapshot({ name, description, isAutomatic }));
  }, [dispatch]);

  const createSnapshotRemote = useCallback(async (
    name: string,
    description?: string,
    isAutomatic: boolean = false
  ) => {
    if (!currentDrawing?.id) return;

    try {
      await createSnapshotApi({
        drawingId: currentDrawing.id,
        name,
        description,
        isAutomatic,
      }).unwrap();
    } catch (error) {
      console.error('Failed to create snapshot:', error);
    }
  }, [currentDrawing?.id, createSnapshotApi]);

  const restoreSnapshotLocal = useCallback((snapshotId: string) => {
    dispatch(restoreSnapshot(snapshotId));
  }, [dispatch]);

  return {
    snapshots,
    createSnapshot: createSnapshotLocal,
    createSnapshotRemote,
    restoreSnapshot: restoreSnapshotLocal,
  };
};

/**
 * Hook for drawing validation
 */
export const useDrawingValidation = () => {
  const dispatch = useDispatch();
  const validationErrors = useSelector(selectValidationErrors);
  const [validateDrawingApi] = useValidateDrawingMutation();
  const currentDrawing = useSelector(selectCurrentDrawing);

  const validateLocal = useCallback(() => {
    dispatch(validateState());
  }, [dispatch]);

  const validateRemote = useCallback(async (strictMode: boolean = false) => {
    if (!currentDrawing?.id) return;

    try {
      const result = await validateDrawingApi({
        drawingId: currentDrawing.id,
        strictMode,
      }).unwrap();
      return result;
    } catch (error) {
      console.error('Failed to validate drawing:', error);
      return null;
    }
  }, [currentDrawing?.id, validateDrawingApi]);

  const hasErrors = useMemo(() => {
    return validationErrors.some(error => error.type === 'error' || error.type === 'critical');
  }, [validationErrors]);

  const hasWarnings = useMemo(() => {
    return validationErrors.some(error => error.type === 'warning');
  }, [validationErrors]);

  return {
    validationErrors,
    hasErrors,
    hasWarnings,
    validateLocal,
    validateRemote,
  };
};

/**
 * Hook for performance monitoring
 */
export const useDrawingPerformance = () => {
  const metrics = useSelector(selectPerformanceMetrics);
  const health = useSelector(selectDrawingHealth);
  const autoSaveStatus = useSelector(selectAutoSaveStatus);

  const performanceScore = useMemo(() => {
    const factors = {
      stateSize: metrics.stateSize < 1024 * 1024 ? 1 : 0.5, // < 1MB is good
      updateTime: metrics.averageUpdateTime < 16 ? 1 : 0.7, // < 16ms is good
      undoRedoLatency: metrics.undoRedoLatency < 10 ? 1 : 0.8, // < 10ms is good
    };

    const average = (factors.stateSize + factors.updateTime + factors.undoRedoLatency) / 3;
    return Math.round(average * 100);
  }, [metrics]);

  return {
    metrics,
    health,
    performanceScore,
    autoSaveStatus,
  };
};

/**
 * Hook for drawing settings management
 */
export const useDrawingSettings = () => {
  const dispatch = useDispatch();
  const settings = useSelector(selectSettings);

  const updateSettingsState = useCallback((
    newSettings: Partial<typeof settings>
  ) => {
    dispatch(updateSettings(newSettings));
  }, [dispatch]);

  const toggleSetting = useCallback((key: keyof typeof settings) => {
    if (typeof settings[key] === 'boolean') {
      dispatch(updateSettings({ [key]: !settings[key] }));
    }
  }, [settings, dispatch]);

  return {
    settings,
    updateSettings: updateSettingsState,
    toggleSetting,
  };
};

/**
 * Hook for viewport management
 */
export const useDrawingViewport = () => {
  const dispatch = useDispatch();

  const updateViewportState = useCallback((viewport: {
    x: number;
    y: number;
    zoom: number;
    bounds?: { minX: number; minY: number; maxX: number; maxY: number };
  }) => {
    dispatch(setViewport(viewport));
  }, [dispatch]);

  const fitToScreen = useCallback(() => {
    // This would typically calculate the bounds of all nodes
    // and set the viewport to fit them
    // Implementation depends on ReactFlow instance
    console.log('Fit to screen - implement with ReactFlow instance');
  }, []);

  return {
    updateViewport: updateViewportState,
    fitToScreen,
  };
};

/**
 * Hook for grid settings
 */
export const useDrawingGrid = () => {
  const dispatch = useDispatch();

  const updateGrid = useCallback((
    gridSettings: {
      visible?: boolean;
      size?: number;
      snapToGrid?: boolean;
      adaptiveGrid?: boolean;
    }
  ) => {
    dispatch(updateGridSettings(gridSettings));
  }, [dispatch]);

  return {
    updateGrid,
  };
};

/**
 * Hook for state persistence management
 */
export const useDrawingPersistence = () => {
  const dispatch = useDispatch();
  const autoSaveStatus = useSelector(selectAutoSaveStatus);

  const enableAutosave = useCallback((
    interval: number = 30000,
    storageKey: string = 'ergoplanner-drawing-state'
  ) => {
    dispatch(enablePersistence({ interval, storageKey }));
  }, [dispatch]);

  const disableAutosave = useCallback(() => {
    dispatch(disablePersistence());
  }, [dispatch]);

  return {
    autoSaveStatus,
    enableAutosave,
    disableAutosave,
  };
};

/**
 * Hook for keyboard shortcuts
 */
export const useDrawingKeyboardShortcuts = () => {
  const { undo, redo } = useDrawingHistory();
  const { copy, paste } = useDrawingClipboard();
  const { clearSelection, selectAll } = useDrawingSelection();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if we're in an input field
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }

      const isCtrl = event.ctrlKey || event.metaKey;

      if (isCtrl) {
        switch (event.key.toLowerCase()) {
          case 'z':
            event.preventDefault();
            if (event.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'y':
            event.preventDefault();
            redo();
            break;
          case 'c':
            event.preventDefault();
            copy();
            break;
          case 'v':
            event.preventDefault();
            paste();
            break;
          case 'a':
            event.preventDefault();
            selectAll();
            break;
        }
      } else {
        switch (event.key) {
          case 'Escape':
            clearSelection();
            break;
          case 'Delete':
          case 'Backspace':
            // TODO: Delete selected elements
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, copy, paste, selectAll, clearSelection]);

  return {
    // Return shortcut information for UI display
    shortcuts: {
      undo: 'Ctrl+Z',
      redo: 'Ctrl+Y / Ctrl+Shift+Z',
      copy: 'Ctrl+C',
      paste: 'Ctrl+V',
      selectAll: 'Ctrl+A',
      clearSelection: 'Escape',
      delete: 'Delete / Backspace',
    },
  };
};

export default {
  useDrawing,
  useDrawingHistory,
  useDrawingUpdate,
  useDrawingSelection,
  useDrawingClipboard,
  useDrawingCollaboration,
  useDrawingSnapshots,
  useDrawingValidation,
  useDrawingPerformance,
  useDrawingSettings,
  useDrawingViewport,
  useDrawingGrid,
  useDrawingPersistence,
  useDrawingKeyboardShortcuts,
};