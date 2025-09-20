/**
 * Enhanced Drawing Slice with Undo/Redo, Persistence, and Collaboration
 * TASK-022: Redux State for Drawings
 */

import { createSlice, createEntityAdapter, type PayloadAction, nanoid } from '@reduxjs/toolkit';
import { produce } from 'immer';
import type { Drawing, Component, ReactFlowData } from '@/types';
import type {
  EnhancedDrawingState,
  DrawingAction,
  ActionGroup,
  OptimisticUpdate,
  StateConflict,
  CollaboratorCursor,
  CollaboratorSelection,
  ElementLock,
  DrawingDiff,
  DiffChange,
  DrawingTemplate,
  DrawingSnapshot,
  ImportExportOperation,
  ValidationError,
  PerformanceMetrics,
  SyncError,
  ConflictResolution,
} from '@/types/drawing-state';

// Entity adapters for normalized state
const drawingAdapter = createEntityAdapter<Drawing>();
const componentAdapter = createEntityAdapter<Component>();
const snapshotAdapter = createEntityAdapter<DrawingSnapshot>();
const templateAdapter = createEntityAdapter<DrawingTemplate>();

// Initial viewport
const initialViewport = { x: 0, y: 0, zoom: 1 };

// Initial ReactFlow data
const initialReactFlowData: ReactFlowData = {
  nodes: [],
  edges: [],
  viewport: initialViewport,
};

// Generate session ID
const generateSessionId = () => `session_${Date.now()}_${nanoid(8)}`;

// Initial state
const initialState: EnhancedDrawingState = {
  // Core state
  currentDrawing: null,
  reactFlowData: initialReactFlowData,

  // Normalized data
  normalized: {
    entities: {
      drawings: {},
      components: {},
      nodes: {},
      edges: {},
      layers: {},
      snapshots: snapshotAdapter.getInitialState(),
      templates: templateAdapter.getInitialState(),
    },
    ids: {
      drawings: [],
      components: [],
      nodes: [],
      edges: [],
      layers: [],
      snapshots: [],
      templates: [],
    },
    relationships: {
      drawingComponents: {},
      drawingNodes: {},
      drawingEdges: {},
      componentNodes: {},
      nodeComponents: {},
    },
  },

  // Selection and editing
  selection: {
    components: [],
    nodes: [],
    edges: [],
    bounds: undefined,
    lastSelected: undefined,
    multiSelectMode: false,
  },

  // Clipboard
  clipboard: {
    actions: [],
    reactFlowNodes: [],
    reactFlowEdges: [],
    components: [],
    format: 'internal',
    timestamp: 0,
  },

  // Enhanced history with undo/redo
  history: {
    past: [],
    present: initialReactFlowData,
    future: [],
    actionGroups: [],
    maxHistorySize: 50,
    currentActionGroup: undefined,
    lastSavedAction: undefined,
  },

  // Canvas state
  viewport: initialViewport,

  // Collaboration
  collaboration: {
    optimisticUpdates: [],
    conflicts: [],
    cursors: [],
    selections: [],
    locks: [],
    lastSyncTimestamp: 0,
    syncInProgress: false,
    conflictResolutionMode: 'automatic',
  },

  // Auto-save and persistence
  persistence: {
    enabled: true,
    autoSaveInterval: 30000, // 30 seconds
    storageKey: 'ergoplanner-drawing-state',
    version: '1.0.0',
    lastPersisted: 0,
    sessionId: generateSessionId(),
    compressionEnabled: true,
    isDirty: false,
    lastSaved: null,
    isSaving: false,
    saveError: null,
    queuedSaves: [],
  },

  // Performance monitoring
  performance: {
    enabled: true,
    sampleRate: 0.1, // 10% sampling
    maxSamples: 100,
    samples: [],
    stateSize: 0,
    lastUpdateDuration: 0,
    undoRedoLatency: 0,
    persistenceLatency: 0,
    actionCount: 0,
    largestStateSize: 0,
    averageUpdateTime: 0,
  },

  // State validation
  validation: {
    enabled: true,
    strictMode: false,
    validationErrors: [],
    lastValidated: 0,
    autoFix: false,
    checksEnabled: {
      nodeEdgeConsistency: true,
      componentNodeBinding: true,
      dataIntegrity: true,
      circularReferences: true,
    },
  },

  // Import/Export
  importExport: {
    currentOperation: undefined,
    history: [],
    supportedFormats: [
      {
        id: 'json',
        name: 'Ergoplanner JSON',
        extension: '.json',
        mimeType: 'application/json',
        supportsComponents: true,
        supportsProperties: true,
        supportsLayers: true,
        qualityLoss: 'none',
        fileSize: 'medium',
      },
      {
        id: 'svg',
        name: 'SVG Vector',
        extension: '.svg',
        mimeType: 'image/svg+xml',
        supportsComponents: false,
        supportsProperties: false,
        supportsLayers: false,
        qualityLoss: 'moderate',
        fileSize: 'small',
      },
    ],
    validationRules: [],
  },

  // Templates and snapshots
  templates: [],
  snapshots: [],

  // Synchronization
  sync: {
    lastSync: 0,
    pendingChanges: [],
    syncInProgress: false,
    syncErrors: [],
    conflictResolution: [],
    connectionStatus: 'disconnected',
    retryAttempts: 0,
    maxRetryAttempts: 3,
    backoffDelay: 1000,
    queuedOperations: [],
  },

  // Grid and snap
  grid: {
    visible: true,
    size: 20,
    snapToGrid: true,
    adaptiveGrid: true,
    minGridSize: 5,
    maxGridSize: 100,
  },

  // Layers
  layers: [
    {
      id: 'default',
      name: 'Default Layer',
      visible: true,
      locked: false,
      opacity: 1,
      order: 0,
    },
  ],
  activeLayerId: 'default',

  // Drawing settings
  settings: {
    showConnections: true,
    showLabels: true,
    showDimensions: false,
    enableCollaboration: true,
    autoLayout: false,
    realTimeValidation: true,
    autoSave: true,
    performanceMode: 'standard',
    debugMode: false,
  },

  // UI state
  ui: {
    activeToolId: null,
    panelStates: {},
    modalStates: {},
    loadingStates: {},
    errorStates: {},
  },
};

// Helper functions
const generateActionId = () => `action_${Date.now()}_${nanoid(8)}`;

const createDrawingAction = (
  type: string,
  payload: any,
  description: string,
  metadata?: any
): DrawingAction => ({
  id: generateActionId(),
  type,
  payload,
  timestamp: Date.now(),
  description,
  metadata,
});

const addToHistory = (state: EnhancedDrawingState, action: DrawingAction) => {
  // Remove oldest actions if at max size
  if (state.history.past.length >= state.history.maxHistorySize) {
    state.history.past.shift();
  }

  // Add current state to history
  state.history.past.push(action);
  state.history.future = []; // Clear future on new action

  // Update performance metrics
  state.performance.actionCount++;
  state.persistence.isDirty = true;
};

const calculateStateSize = (state: any): number => {
  return JSON.stringify(state).length;
};

const validateState = (state: EnhancedDrawingState): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (state.validation.checksEnabled.nodeEdgeConsistency) {
    // Check node-edge consistency
    const nodeIds = new Set(state.reactFlowData.nodes.map(n => n.id));
    state.reactFlowData.edges.forEach(edge => {
      if (!nodeIds.has(edge.source)) {
        errors.push({
          id: nanoid(),
          type: 'error',
          category: 'consistency',
          message: `Edge ${edge.id} references non-existent source node ${edge.source}`,
          affectedElements: [edge.id],
          timestamp: Date.now(),
        });
      }
      if (!nodeIds.has(edge.target)) {
        errors.push({
          id: nanoid(),
          type: 'error',
          category: 'consistency',
          message: `Edge ${edge.id} references non-existent target node ${edge.target}`,
          affectedElements: [edge.id],
          timestamp: Date.now(),
        });
      }
    });
  }

  return errors;
};

// Enhanced Drawing Slice
const enhancedDrawingSlice = createSlice({
  name: 'enhancedDrawing',
  initialState,
  reducers: {
    // === CORE DRAWING MANAGEMENT ===
    setCurrentDrawing: (state, action: PayloadAction<Drawing>) => {
      const startTime = performance.now();

      state.currentDrawing = action.payload;
      state.reactFlowData = action.payload.reactFlowData;
      state.history.present = action.payload.reactFlowData;
      state.persistence.isDirty = false;

      // Create snapshot for major change
      const snapshot: DrawingSnapshot = {
        id: nanoid(),
        name: `Drawing Loaded: ${action.payload.name}`,
        drawingId: action.payload.id,
        reactFlowData: action.payload.reactFlowData,
        components: action.payload.components,
        metadata: {
          version: action.payload.version,
          timestamp: Date.now(),
          userId: 'system',
          actionId: 'drawing-load',
          checksumBefore: '',
          checksumAfter: JSON.stringify(action.payload.reactFlowData).slice(0, 32),
        },
        isAutomatic: true,
      };
      state.snapshots.push(snapshot);

      // Update performance metrics
      const duration = performance.now() - startTime;
      state.performance.lastUpdateDuration = duration;
      state.performance.stateSize = calculateStateSize(state);
    },

    clearCurrentDrawing: (state) => {
      state.currentDrawing = null;
      state.reactFlowData = initialReactFlowData;
      state.history = {
        ...initialState.history,
        present: initialReactFlowData,
      };
      state.selection = {
        components: [],
        nodes: [],
        edges: [],
        bounds: undefined,
        lastSelected: undefined,
        multiSelectMode: false,
      };
      state.collaboration.cursors = [];
      state.collaboration.selections = [];
      state.collaboration.locks = [];
      state.persistence.isDirty = false;
    },

    // === ENHANCED UNDO/REDO SYSTEM ===
    updateReactFlowDataWithHistory: (state, action: PayloadAction<{
      data: ReactFlowData;
      description: string;
      groupId?: string;
      metadata?: any;
    }>) => {
      const startTime = performance.now();
      const { data, description, groupId, metadata } = action.payload;

      // Create action for history
      const drawingAction = createDrawingAction(
        'UPDATE_REACTFLOW_DATA',
        { previous: state.history.present, current: data },
        description,
        metadata
      );

      if (groupId) {
        drawingAction.groupId = groupId;
      }

      // Add to history
      addToHistory(state, drawingAction);

      // Update present state
      state.history.present = data;
      state.reactFlowData = data;

      // Update performance metrics
      const duration = performance.now() - startTime;
      state.performance.lastUpdateDuration = duration;
      state.performance.stateSize = calculateStateSize(state);
    },

    startActionGroup: (state, action: PayloadAction<{ id: string; description: string }>) => {
      const { id, description } = action.payload;
      state.history.currentActionGroup = id;

      const group: ActionGroup = {
        id,
        actions: [],
        description,
        timestamp: Date.now(),
      };
      state.history.actionGroups.push(group);
    },

    endActionGroup: (state) => {
      state.history.currentActionGroup = undefined;
    },

    undo: (state) => {
      const startTime = performance.now();

      if (state.history.past.length > 0) {
        const lastAction = state.history.past.pop()!;

        // Create redo action
        const redoAction = createDrawingAction(
          'REDO_ACTION',
          { action: lastAction, state: state.history.present },
          `Undo: ${lastAction.description}`
        );

        state.history.future.unshift(redoAction);

        // Restore previous state
        if (lastAction.payload.previous) {
          state.history.present = lastAction.payload.previous;
          state.reactFlowData = lastAction.payload.previous;
        }

        state.persistence.isDirty = true;
      }

      // Update performance metrics
      const duration = performance.now() - startTime;
      state.performance.undoRedoLatency = duration;
    },

    redo: (state) => {
      const startTime = performance.now();

      if (state.history.future.length > 0) {
        const nextAction = state.history.future.shift()!;

        // Add current state to past
        const undoAction = createDrawingAction(
          'UNDO_ACTION',
          { action: nextAction, state: state.history.present },
          `Redo: ${nextAction.description}`
        );

        state.history.past.push(undoAction);

        // Apply redo state
        if (nextAction.payload.action.payload.current) {
          state.history.present = nextAction.payload.action.payload.current;
          state.reactFlowData = nextAction.payload.action.payload.current;
        }

        state.persistence.isDirty = true;
      }

      // Update performance metrics
      const duration = performance.now() - startTime;
      state.performance.undoRedoLatency = duration;
    },

    clearHistory: (state) => {
      state.history = {
        ...initialState.history,
        present: state.history.present,
      };
    },

    // === OPTIMISTIC UPDATES FOR COLLABORATION ===
    addOptimisticUpdate: (state, action: PayloadAction<OptimisticUpdate>) => {
      state.collaboration.optimisticUpdates.push(action.payload);

      // Apply optimistic update temporarily
      if (action.payload.action.type === 'UPDATE_REACTFLOW_DATA') {
        state.reactFlowData = action.payload.action.payload.current;
      }
    },

    confirmOptimisticUpdate: (state, action: PayloadAction<string>) => {
      const updateId = action.payload;
      const update = state.collaboration.optimisticUpdates.find(u => u.id === updateId);

      if (update) {
        update.status = 'confirmed';
        // Remove from optimistic updates
        state.collaboration.optimisticUpdates = state.collaboration.optimisticUpdates.filter(
          u => u.id !== updateId
        );
      }
    },

    rejectOptimisticUpdate: (state, action: PayloadAction<{ id: string; reason?: string }>) => {
      const { id } = action.payload;
      const update = state.collaboration.optimisticUpdates.find(u => u.id === id);

      if (update) {
        update.status = 'rejected';

        // Revert optimistic change
        if (update.originalState) {
          state.reactFlowData = update.originalState;
        }

        // Remove from optimistic updates
        state.collaboration.optimisticUpdates = state.collaboration.optimisticUpdates.filter(
          u => u.id !== id
        );
      }
    },

    // === STATE CONFLICTS AND RESOLUTION ===
    addStateConflict: (state, action: PayloadAction<StateConflict>) => {
      state.collaboration.conflicts.push(action.payload);
    },

    resolveStateConflict: (state, action: PayloadAction<{
      conflictId: string;
      resolution: 'use_local' | 'use_remote' | 'merge';
      resolvedData?: ReactFlowData;
    }>) => {
      const { conflictId, resolution, resolvedData } = action.payload;
      const conflictIndex = state.collaboration.conflicts.findIndex(c => c.id === conflictId);

      if (conflictIndex >= 0) {
        const conflict = state.collaboration.conflicts[conflictIndex];
        conflict.resolution = resolution;

        // Apply resolution
        if (resolution === 'use_local') {
          // Keep current state
        } else if (resolution === 'use_remote') {
          state.reactFlowData = conflict.remoteAction.payload.current;
          state.history.present = conflict.remoteAction.payload.current;
        } else if (resolution === 'merge' && resolvedData) {
          state.reactFlowData = resolvedData;
          state.history.present = resolvedData;
        }

        // Remove resolved conflict
        state.collaboration.conflicts.splice(conflictIndex, 1);
      }
    },

    // === COLLABORATION CURSORS AND SELECTIONS ===
    updateCollaboratorCursor: (state, action: PayloadAction<CollaboratorCursor>) => {
      const cursor = action.payload;
      const existingIndex = state.collaboration.cursors.findIndex(c => c.userId === cursor.userId);

      if (existingIndex >= 0) {
        state.collaboration.cursors[existingIndex] = cursor;
      } else {
        state.collaboration.cursors.push(cursor);
      }
    },

    removeCollaboratorCursor: (state, action: PayloadAction<string>) => {
      const userId = action.payload;
      state.collaboration.cursors = state.collaboration.cursors.filter(c => c.userId !== userId);
    },

    updateCollaboratorSelection: (state, action: PayloadAction<CollaboratorSelection>) => {
      const selection = action.payload;
      const existingIndex = state.collaboration.selections.findIndex(s => s.userId === selection.userId);

      if (existingIndex >= 0) {
        state.collaboration.selections[existingIndex] = selection;
      } else {
        state.collaboration.selections.push(selection);
      }
    },

    removeCollaboratorSelection: (state, action: PayloadAction<string>) => {
      const userId = action.payload;
      state.collaboration.selections = state.collaboration.selections.filter(s => s.userId !== userId);
    },

    // === ELEMENT LOCKING ===
    lockElement: (state, action: PayloadAction<ElementLock>) => {
      state.collaboration.locks.push(action.payload);
    },

    unlockElement: (state, action: PayloadAction<{ elementId: string; userId: string }>) => {
      const { elementId, userId } = action.payload;
      state.collaboration.locks = state.collaboration.locks.filter(
        lock => !(lock.elementId === elementId && lock.userId === userId)
      );
    },

    clearExpiredLocks: (state) => {
      const now = Date.now();
      state.collaboration.locks = state.collaboration.locks.filter(lock => lock.expiresAt > now);
    },

    // === SELECTION MANAGEMENT ===
    setSelection: (state, action: PayloadAction<{
      components?: string[];
      nodes?: string[];
      edges?: string[];
      bounds?: { x: number; y: number; width: number; height: number };
    }>) => {
      const { components = [], nodes = [], edges = [], bounds } = action.payload;
      state.selection = {
        components,
        nodes,
        edges,
        bounds,
        lastSelected: [...components, ...nodes, ...edges].pop(),
        multiSelectMode: ([...components, ...nodes, ...edges].length > 1),
      };
    },

    addToSelection: (state, action: PayloadAction<{
      type: 'component' | 'node' | 'edge';
      id: string;
    }>) => {
      const { type, id } = action.payload;

      if (type === 'component' && !state.selection.components.includes(id)) {
        state.selection.components.push(id);
      } else if (type === 'node' && !state.selection.nodes.includes(id)) {
        state.selection.nodes.push(id);
      } else if (type === 'edge' && !state.selection.edges.includes(id)) {
        state.selection.edges.push(id);
      }

      state.selection.lastSelected = id;
      state.selection.multiSelectMode = (
        state.selection.components.length +
        state.selection.nodes.length +
        state.selection.edges.length
      ) > 1;
    },

    removeFromSelection: (state, action: PayloadAction<{
      type: 'component' | 'node' | 'edge';
      id: string;
    }>) => {
      const { type, id } = action.payload;

      if (type === 'component') {
        state.selection.components = state.selection.components.filter(cId => cId !== id);
      } else if (type === 'node') {
        state.selection.nodes = state.selection.nodes.filter(nId => nId !== id);
      } else if (type === 'edge') {
        state.selection.edges = state.selection.edges.filter(eId => eId !== id);
      }

      const totalSelected = state.selection.components.length +
        state.selection.nodes.length +
        state.selection.edges.length;

      state.selection.multiSelectMode = totalSelected > 1;

      if (state.selection.lastSelected === id) {
        const allSelected = [...state.selection.components, ...state.selection.nodes, ...state.selection.edges];
        state.selection.lastSelected = allSelected.pop();
      }
    },

    clearSelection: (state) => {
      state.selection = {
        components: [],
        nodes: [],
        edges: [],
        bounds: undefined,
        lastSelected: undefined,
        multiSelectMode: false,
      };
    },

    // === CLIPBOARD OPERATIONS ===
    copyToClipboard: (state, action: PayloadAction<{ format?: 'internal' | 'external' }>) => {
      const { format = 'internal' } = action.payload;

      const selectedNodes = state.reactFlowData.nodes.filter(node =>
        state.selection.nodes.includes(node.id)
      );
      const selectedEdges = state.reactFlowData.edges.filter(edge =>
        state.selection.edges.includes(edge.id)
      );

      // Create actions for clipboard
      const copyAction = createDrawingAction(
        'COPY_TO_CLIPBOARD',
        { nodes: selectedNodes, edges: selectedEdges },
        `Copy ${selectedNodes.length} nodes and ${selectedEdges.length} edges`
      );

      state.clipboard = {
        actions: [copyAction],
        reactFlowNodes: selectedNodes,
        reactFlowEdges: selectedEdges,
        components: [], // TODO: Map from nodes to components
        format,
        timestamp: Date.now(),
      };
    },

    pasteFromClipboard: (state, action: PayloadAction<{
      offsetX: number;
      offsetY: number;
      generateNewIds?: boolean;
    }>) => {
      const { offsetX, offsetY, generateNewIds = true } = action.payload;

      if (state.clipboard.reactFlowNodes.length === 0) return;

      // Create new nodes with offset positions
      const newNodes = state.clipboard.reactFlowNodes.map(node => ({
        ...node,
        id: generateNewIds ? `${node.id}_${nanoid(8)}` : node.id,
        position: {
          x: node.position.x + offsetX,
          y: node.position.y + offsetY,
        },
      }));

      // Create paste action
      const pasteAction = createDrawingAction(
        'PASTE_FROM_CLIPBOARD',
        {
          previous: state.reactFlowData,
          current: {
            ...state.reactFlowData,
            nodes: [...state.reactFlowData.nodes, ...newNodes],
          },
        },
        `Paste ${newNodes.length} nodes`
      );

      // Add to history and update state
      addToHistory(state, pasteAction);
      state.history.present = pasteAction.payload.current;
      state.reactFlowData = pasteAction.payload.current;

      // Select pasted nodes
      state.selection.nodes = newNodes.map(n => n.id);
      state.selection.multiSelectMode = newNodes.length > 1;
    },

    // === STATE PERSISTENCE ===
    enablePersistence: (state, action: PayloadAction<{ interval?: number; storageKey?: string }>) => {
      const { interval = 30000, storageKey = 'ergoplanner-drawing-state' } = action.payload;
      state.persistence.enabled = true;
      state.persistence.autoSaveInterval = interval;
      state.persistence.storageKey = storageKey;
    },

    disablePersistence: (state) => {
      state.persistence.enabled = false;
    },

    setPersistenceState: (state, action: PayloadAction<{
      isSaving?: boolean;
      saveError?: string | null;
      lastSaved?: number | null;
    }>) => {
      const { isSaving, saveError, lastSaved } = action.payload;

      if (isSaving !== undefined) state.persistence.isSaving = isSaving;
      if (saveError !== undefined) state.persistence.saveError = saveError;
      if (lastSaved !== undefined) {
        state.persistence.lastSaved = lastSaved;
        state.persistence.lastPersisted = lastSaved;
        state.persistence.isDirty = false;
      }
    },

    // === STATE VALIDATION ===
    validateState: (state) => {
      const errors = validateState(state);
      state.validation.validationErrors = errors;
      state.validation.lastValidated = Date.now();
    },

    clearValidationErrors: (state) => {
      state.validation.validationErrors = [];
    },

    updateValidationSettings: (state, action: PayloadAction<Partial<typeof initialState.validation>>) => {
      state.validation = { ...state.validation, ...action.payload };
    },

    // === PERFORMANCE MONITORING ===
    updatePerformanceMetrics: (state, action: PayloadAction<Partial<PerformanceMetrics>>) => {
      const metrics = action.payload;
      state.performance = { ...state.performance, ...metrics };

      // Update averages
      if (metrics.lastUpdateDuration) {
        const samples = state.performance.samples;
        samples.push({ ...state.performance });

        if (samples.length > state.performance.maxSamples) {
          samples.shift();
        }

        state.performance.averageUpdateTime = samples.reduce((sum, s) => sum + s.lastUpdateDuration, 0) / samples.length;
      }

      // Track largest state size
      if (metrics.stateSize && metrics.stateSize > state.performance.largestStateSize) {
        state.performance.largestStateSize = metrics.stateSize;
      }
    },

    resetPerformanceMetrics: (state) => {
      state.performance = {
        ...initialState.performance,
        enabled: state.performance.enabled,
        sampleRate: state.performance.sampleRate,
        maxSamples: state.performance.maxSamples,
      };
    },

    // === SNAPSHOTS AND TEMPLATES ===
    createSnapshot: (state, action: PayloadAction<{
      name: string;
      description?: string;
      isAutomatic?: boolean;
    }>) => {
      const { name, description, isAutomatic = false } = action.payload;

      const snapshot: DrawingSnapshot = {
        id: nanoid(),
        name,
        description,
        drawingId: state.currentDrawing?.id || '',
        reactFlowData: state.reactFlowData,
        components: [], // TODO: Get components from current drawing
        metadata: {
          version: state.currentDrawing?.version || 1,
          timestamp: Date.now(),
          userId: 'current-user', // TODO: Get from auth state
          actionId: state.history.past[state.history.past.length - 1]?.id || '',
          checksumBefore: '',
          checksumAfter: JSON.stringify(state.reactFlowData).slice(0, 32),
        },
        isAutomatic,
      };

      state.snapshots.push(snapshot);
    },

    restoreSnapshot: (state, action: PayloadAction<string>) => {
      const snapshotId = action.payload;
      const snapshot = state.snapshots.find(s => s.id === snapshotId);

      if (snapshot) {
        const restoreAction = createDrawingAction(
          'RESTORE_SNAPSHOT',
          {
            previous: state.reactFlowData,
            current: snapshot.reactFlowData,
          },
          `Restore snapshot: ${snapshot.name}`
        );

        addToHistory(state, restoreAction);
        state.history.present = snapshot.reactFlowData;
        state.reactFlowData = snapshot.reactFlowData;
      }
    },

    deleteSnapshot: (state, action: PayloadAction<string>) => {
      const snapshotId = action.payload;
      state.snapshots = state.snapshots.filter(s => s.id !== snapshotId);
    },

    // === IMPORT/EXPORT ===
    startImportOperation: (state, action: PayloadAction<{
      format: string;
      fileName: string;
      fileSize: number;
    }>) => {
      const { format, fileName, fileSize } = action.payload;

      const operation: ImportExportOperation = {
        id: nanoid(),
        type: 'import',
        format,
        status: 'processing',
        progress: 0,
        fileName,
        fileSize,
        startTime: Date.now(),
        errors: [],
        warnings: [],
      };

      state.importExport.currentOperation = operation;
    },

    updateImportProgress: (state, action: PayloadAction<{
      progress: number;
      errors?: any[];
      warnings?: any[];
    }>) => {
      if (state.importExport.currentOperation) {
        const { progress, errors = [], warnings = [] } = action.payload;
        state.importExport.currentOperation.progress = progress;
        state.importExport.currentOperation.errors.push(...errors);
        state.importExport.currentOperation.warnings.push(...warnings);
      }
    },

    completeImportOperation: (state, action: PayloadAction<{
      success: boolean;
      data?: ReactFlowData;
    }>) => {
      if (state.importExport.currentOperation) {
        const { success, data } = action.payload;

        state.importExport.currentOperation.status = success ? 'completed' : 'failed';
        state.importExport.currentOperation.endTime = Date.now();
        state.importExport.currentOperation.progress = 100;

        if (success && data) {
          const importAction = createDrawingAction(
            'IMPORT_DRAWING',
            {
              previous: state.reactFlowData,
              current: data,
            },
            `Import from ${state.importExport.currentOperation.fileName}`
          );

          addToHistory(state, importAction);
          state.history.present = data;
          state.reactFlowData = data;
        }

        // Move to history
        state.importExport.history.push(state.importExport.currentOperation);
        state.importExport.currentOperation = undefined;
      }
    },

    // === DRAWING DIFF AND MERGE ===
    generateDiff: (state, action: PayloadAction<{
      fromVersion: number;
      toVersion: number;
      fromData: ReactFlowData;
      toData: ReactFlowData;
    }>) => {
      const { fromVersion, toVersion, fromData, toData } = action.payload;

      const changes: DiffChange[] = [];

      // Compare nodes
      const fromNodes = new Map(fromData.nodes.map(n => [n.id, n]));
      const toNodes = new Map(toData.nodes.map(n => [n.id, n]));

      // Find added nodes
      toNodes.forEach((node, id) => {
        if (!fromNodes.has(id)) {
          changes.push({
            type: 'add',
            elementType: 'node',
            elementId: id,
            newValue: node,
          });
        }
      });

      // Find removed nodes
      fromNodes.forEach((node, id) => {
        if (!toNodes.has(id)) {
          changes.push({
            type: 'remove',
            elementType: 'node',
            elementId: id,
            oldValue: node,
          });
        }
      });

      // Find modified nodes
      fromNodes.forEach((fromNode, id) => {
        const toNode = toNodes.get(id);
        if (toNode && JSON.stringify(fromNode) !== JSON.stringify(toNode)) {
          changes.push({
            type: 'modify',
            elementType: 'node',
            elementId: id,
            oldValue: fromNode,
            newValue: toNode,
          });
        }
      });

      // TODO: Similar logic for edges

      const diff: DrawingDiff = {
        id: nanoid(),
        fromVersion,
        toVersion,
        changes,
        summary: {
          nodesAdded: changes.filter(c => c.type === 'add' && c.elementType === 'node').length,
          nodesRemoved: changes.filter(c => c.type === 'remove' && c.elementType === 'node').length,
          nodesModified: changes.filter(c => c.type === 'modify' && c.elementType === 'node').length,
          edgesAdded: changes.filter(c => c.type === 'add' && c.elementType === 'edge').length,
          edgesRemoved: changes.filter(c => c.type === 'remove' && c.elementType === 'edge').length,
          edgesModified: changes.filter(c => c.type === 'modify' && c.elementType === 'edge').length,
          componentsChanged: 0,
          propertiesChanged: 0,
          majorChanges: changes.length > 10,
        },
        timestamp: Date.now(),
        conflictsDetected: false,
      };

      // Store diff in state for reference
      state.ui.errorStates['lastDiff'] = JSON.stringify(diff);
    },

    // === SYNCHRONIZATION ===
    setSyncStatus: (state, action: PayloadAction<{
      connectionStatus?: 'connected' | 'disconnected' | 'reconnecting';
      syncInProgress?: boolean;
      lastSync?: number;
    }>) => {
      const { connectionStatus, syncInProgress, lastSync } = action.payload;

      if (connectionStatus !== undefined) state.sync.connectionStatus = connectionStatus;
      if (syncInProgress !== undefined) state.sync.syncInProgress = syncInProgress;
      if (lastSync !== undefined) state.sync.lastSync = lastSync;
    },

    addSyncError: (state, action: PayloadAction<SyncError>) => {
      state.sync.syncErrors.push(action.payload);
    },

    clearSyncErrors: (state) => {
      state.sync.syncErrors = [];
    },

    // === UI STATE MANAGEMENT ===
    setActiveToolId: (state, action: PayloadAction<string | null>) => {
      state.ui.activeToolId = action.payload;
    },

    togglePanel: (state, action: PayloadAction<string>) => {
      const panelId = action.payload;
      state.ui.panelStates[panelId] = !state.ui.panelStates[panelId];
    },

    setModalState: (state, action: PayloadAction<{ modalId: string; isOpen: boolean }>) => {
      const { modalId, isOpen } = action.payload;
      state.ui.modalStates[modalId] = isOpen;
    },

    setLoadingState: (state, action: PayloadAction<{ key: string; isLoading: boolean }>) => {
      const { key, isLoading } = action.payload;
      state.ui.loadingStates[key] = isLoading;
    },

    setErrorState: (state, action: PayloadAction<{ key: string; error: string }>) => {
      const { key, error } = action.payload;
      state.ui.errorStates[key] = error;
    },

    clearErrorState: (state, action: PayloadAction<string>) => {
      const key = action.payload;
      delete state.ui.errorStates[key];
    },

    // === VIEWPORT MANAGEMENT ===
    setViewport: (state, action: PayloadAction<{
      x: number;
      y: number;
      zoom: number;
      bounds?: { minX: number; minY: number; maxX: number; maxY: number };
    }>) => {
      state.viewport = action.payload;
      state.reactFlowData.viewport = {
        x: action.payload.x,
        y: action.payload.y,
        zoom: action.payload.zoom,
      };
    },

    // === GRID AND LAYERS ===
    updateGridSettings: (state, action: PayloadAction<Partial<typeof initialState.grid>>) => {
      state.grid = { ...state.grid, ...action.payload };
    },

    addLayer: (state, action: PayloadAction<{ name: string; color?: string }>) => {
      const { name, color } = action.payload;
      const maxOrder = Math.max(...state.layers.map(l => l.order), -1);

      const newLayer = {
        id: nanoid(),
        name,
        visible: true,
        locked: false,
        color,
        opacity: 1,
        order: maxOrder + 1,
      };

      state.layers.push(newLayer);
    },

    updateLayer: (state, action: PayloadAction<{
      id: string;
      updates: Partial<typeof initialState.layers[0]>;
    }>) => {
      const { id, updates } = action.payload;
      const layerIndex = state.layers.findIndex(l => l.id === id);

      if (layerIndex >= 0) {
        state.layers[layerIndex] = { ...state.layers[layerIndex], ...updates };
      }
    },

    deleteLayer: (state, action: PayloadAction<string>) => {
      const layerId = action.payload;

      if (state.layers.length > 1) {
        state.layers = state.layers.filter(l => l.id !== layerId);

        if (state.activeLayerId === layerId) {
          state.activeLayerId = state.layers[0]?.id || null;
        }
      }
    },

    setActiveLayer: (state, action: PayloadAction<string>) => {
      if (state.layers.find(l => l.id === action.payload)) {
        state.activeLayerId = action.payload;
      }
    },

    reorderLayers: (state, action: PayloadAction<{ layerId: string; newOrder: number }>) => {
      const { layerId, newOrder } = action.payload;
      const layer = state.layers.find(l => l.id === layerId);

      if (layer) {
        layer.order = newOrder;

        // Reorder all layers to maintain sequence
        state.layers
          .sort((a, b) => a.order - b.order)
          .forEach((l, index) => {
            l.order = index;
          });
      }
    },

    // === SETTINGS ===
    updateSettings: (state, action: PayloadAction<Partial<typeof initialState.settings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
  },
});

// Export actions
export const {
  // Core drawing management
  setCurrentDrawing,
  clearCurrentDrawing,

  // Enhanced undo/redo
  updateReactFlowDataWithHistory,
  startActionGroup,
  endActionGroup,
  undo,
  redo,
  clearHistory,

  // Optimistic updates
  addOptimisticUpdate,
  confirmOptimisticUpdate,
  rejectOptimisticUpdate,

  // State conflicts
  addStateConflict,
  resolveStateConflict,

  // Collaboration
  updateCollaboratorCursor,
  removeCollaboratorCursor,
  updateCollaboratorSelection,
  removeCollaboratorSelection,
  lockElement,
  unlockElement,
  clearExpiredLocks,

  // Selection
  setSelection,
  addToSelection,
  removeFromSelection,
  clearSelection,

  // Clipboard
  copyToClipboard,
  pasteFromClipboard,

  // Persistence
  enablePersistence,
  disablePersistence,
  setPersistenceState,

  // Validation
  validateState,
  clearValidationErrors,
  updateValidationSettings,

  // Performance
  updatePerformanceMetrics,
  resetPerformanceMetrics,

  // Snapshots
  createSnapshot,
  restoreSnapshot,
  deleteSnapshot,

  // Import/Export
  startImportOperation,
  updateImportProgress,
  completeImportOperation,

  // Diff and merge
  generateDiff,

  // Synchronization
  setSyncStatus,
  addSyncError,
  clearSyncErrors,

  // UI state
  setActiveToolId,
  togglePanel,
  setModalState,
  setLoadingState,
  setErrorState,
  clearErrorState,

  // Viewport
  setViewport,

  // Grid and layers
  updateGridSettings,
  addLayer,
  updateLayer,
  deleteLayer,
  setActiveLayer,
  reorderLayers,

  // Settings
  updateSettings,
} = enhancedDrawingSlice.actions;

// Export reducer
export default enhancedDrawingSlice.reducer;