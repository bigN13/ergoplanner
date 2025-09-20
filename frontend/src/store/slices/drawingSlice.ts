import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Drawing, Component, ReactFlowData } from '@/types';

// Drawing state interface
interface DrawingState {
  // Current drawing
  currentDrawing: Drawing | null;

  // Drawing data
  reactFlowData: ReactFlowData;

  // Selection and editing
  selectedComponents: string[];
  selectedNodes: string[];
  selectedEdges: string[];

  // Clipboard
  clipboard: {
    components: Component[];
    reactFlowNodes: any[];
    reactFlowEdges: any[];
  };

  // History for undo/redo
  history: {
    past: ReactFlowData[];
    present: ReactFlowData;
    future: ReactFlowData[];
    maxHistorySize: number;
  };

  // Canvas state
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };

  // Collaboration
  collaborators: {
    userId: string;
    userName: string;
    cursor: { x: number; y: number } | null;
    selection: string[];
    color: string;
    lastSeen: string;
  }[];

  // Auto-save
  autoSave: {
    isDirty: boolean;
    lastSaved: string | null;
    isSaving: boolean;
    saveError: string | null;
  };

  // Grid and snap
  grid: {
    visible: boolean;
    size: number;
    snapToGrid: boolean;
  };

  // Layers
  layers: {
    id: string;
    name: string;
    visible: boolean;
    locked: boolean;
    color?: string;
    opacity: number;
  }[];
  activeLayerId: string | null;

  // Drawing settings
  settings: {
    showConnections: boolean;
    showLabels: boolean;
    showDimensions: boolean;
    enableCollaboration: boolean;
    autoLayout: boolean;
  };
}

// Initial state
const initialViewport = { x: 0, y: 0, zoom: 1 };
const initialReactFlowData: ReactFlowData = {
  nodes: [],
  edges: [],
  viewport: initialViewport,
};

const initialState: DrawingState = {
  currentDrawing: null,
  reactFlowData: initialReactFlowData,
  selectedComponents: [],
  selectedNodes: [],
  selectedEdges: [],
  clipboard: {
    components: [],
    reactFlowNodes: [],
    reactFlowEdges: [],
  },
  history: {
    past: [],
    present: initialReactFlowData,
    future: [],
    maxHistorySize: 50,
  },
  viewport: initialViewport,
  collaborators: [],
  autoSave: {
    isDirty: false,
    lastSaved: null,
    isSaving: false,
    saveError: null,
  },
  grid: {
    visible: true,
    size: 20,
    snapToGrid: true,
  },
  layers: [
    {
      id: 'default',
      name: 'Default Layer',
      visible: true,
      locked: false,
      opacity: 1,
    },
  ],
  activeLayerId: 'default',
  settings: {
    showConnections: true,
    showLabels: true,
    showDimensions: false,
    enableCollaboration: true,
    autoLayout: false,
  },
};

// Drawing slice
const drawingSlice = createSlice({
  name: 'drawing',
  initialState,
  reducers: {
    // Drawing management
    setCurrentDrawing: (state, action: PayloadAction<Drawing>) => {
      state.currentDrawing = action.payload;
      state.reactFlowData = action.payload.reactFlowData;
      state.history.present = action.payload.reactFlowData;
      state.autoSave.isDirty = false;
    },

    clearCurrentDrawing: (state) => {
      state.currentDrawing = null;
      state.reactFlowData = initialReactFlowData;
      state.history = {
        ...initialState.history,
        present: initialReactFlowData,
      };
      state.selectedComponents = [];
      state.selectedNodes = [];
      state.selectedEdges = [];
      state.collaborators = [];
      state.autoSave.isDirty = false;
    },

    // ReactFlow data management
    updateReactFlowData: (state, action: PayloadAction<ReactFlowData>) => {
      // Add current state to history
      if (state.history.past.length >= state.history.maxHistorySize) {
        state.history.past.shift();
      }
      state.history.past.push(state.history.present);
      state.history.future = [];

      // Update present state
      state.history.present = action.payload;
      state.reactFlowData = action.payload;
      state.autoSave.isDirty = true;
    },

    updateNodes: (state, action: PayloadAction<any[]>) => {
      const newData = {
        ...state.reactFlowData,
        nodes: action.payload,
      };
      drawingSlice.caseReducers.updateReactFlowData(state, { payload: newData, type: '' });
    },

    updateEdges: (state, action: PayloadAction<any[]>) => {
      const newData = {
        ...state.reactFlowData,
        edges: action.payload,
      };
      drawingSlice.caseReducers.updateReactFlowData(state, { payload: newData, type: '' });
    },

    // Undo/Redo
    undo: (state) => {
      if (state.history.past.length > 0) {
        const previous = state.history.past.pop()!;
        state.history.future.unshift(state.history.present);
        state.history.present = previous;
        state.reactFlowData = previous;
        state.autoSave.isDirty = true;
      }
    },

    redo: (state) => {
      if (state.history.future.length > 0) {
        const next = state.history.future.shift()!;
        state.history.past.push(state.history.present);
        state.history.present = next;
        state.reactFlowData = next;
        state.autoSave.isDirty = true;
      }
    },

    // Selection management
    setSelectedComponents: (state, action: PayloadAction<string[]>) => {
      state.selectedComponents = action.payload;
    },

    setSelectedNodes: (state, action: PayloadAction<string[]>) => {
      state.selectedNodes = action.payload;
    },

    setSelectedEdges: (state, action: PayloadAction<string[]>) => {
      state.selectedEdges = action.payload;
    },

    clearSelection: (state) => {
      state.selectedComponents = [];
      state.selectedNodes = [];
      state.selectedEdges = [];
    },

    // Clipboard operations
    copyToClipboard: (state) => {
      const selectedNodes = state.reactFlowData.nodes.filter(node =>
        state.selectedNodes.includes(node.id)
      );
      const selectedEdges = state.reactFlowData.edges.filter(edge =>
        state.selectedEdges.includes(edge.id)
      );

      state.clipboard = {
        components: [], // TODO: Get components based on selected nodes
        reactFlowNodes: selectedNodes,
        reactFlowEdges: selectedEdges,
      };
    },

    pasteFromClipboard: (state, action: PayloadAction<{ offsetX: number; offsetY: number }>) => {
      const { offsetX, offsetY } = action.payload;

      // Create new nodes with offset positions and new IDs
      const newNodes = state.clipboard.reactFlowNodes.map(node => ({
        ...node,
        id: `${node.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        position: {
          x: node.position.x + offsetX,
          y: node.position.y + offsetY,
        },
      }));

      const newData = {
        ...state.reactFlowData,
        nodes: [...state.reactFlowData.nodes, ...newNodes],
      };

      drawingSlice.caseReducers.updateReactFlowData(state, { payload: newData, type: '' });
    },

    // Viewport management
    setViewport: (state, action: PayloadAction<{ x: number; y: number; zoom: number }>) => {
      state.viewport = action.payload;
      state.reactFlowData.viewport = action.payload;
    },

    // Collaboration
    updateCollaborator: (state, action: PayloadAction<{
      userId: string;
      userName: string;
      cursor?: { x: number; y: number } | null;
      selection?: string[];
      color?: string;
    }>) => {
      const { userId, userName, cursor, selection, color } = action.payload;
      const existingIndex = state.collaborators.findIndex(c => c.userId === userId);

      if (existingIndex >= 0) {
        state.collaborators[existingIndex] = {
          ...state.collaborators[existingIndex],
          cursor: cursor ?? state.collaborators[existingIndex].cursor,
          selection: selection ?? state.collaborators[existingIndex].selection,
          color: color ?? state.collaborators[existingIndex].color,
          lastSeen: new Date().toISOString(),
        };
      } else {
        state.collaborators.push({
          userId,
          userName,
          cursor: cursor || null,
          selection: selection || [],
          color: color || `#${Math.floor(Math.random()*16777215).toString(16)}`,
          lastSeen: new Date().toISOString(),
        });
      }
    },

    removeCollaborator: (state, action: PayloadAction<string>) => {
      state.collaborators = state.collaborators.filter(c => c.userId !== action.payload);
    },

    // Auto-save
    setSaving: (state, action: PayloadAction<boolean>) => {
      state.autoSave.isSaving = action.payload;
      if (action.payload) {
        state.autoSave.saveError = null;
      }
    },

    setSaved: (state) => {
      state.autoSave.isDirty = false;
      state.autoSave.isSaving = false;
      state.autoSave.lastSaved = new Date().toISOString();
      state.autoSave.saveError = null;
    },

    setSaveError: (state, action: PayloadAction<string>) => {
      state.autoSave.saveError = action.payload;
      state.autoSave.isSaving = false;
    },

    // Grid and snap
    toggleGrid: (state) => {
      state.grid.visible = !state.grid.visible;
    },

    setGridSize: (state, action: PayloadAction<number>) => {
      state.grid.size = Math.max(5, Math.min(100, action.payload));
    },

    toggleSnapToGrid: (state) => {
      state.grid.snapToGrid = !state.grid.snapToGrid;
    },

    // Layers
    addLayer: (state, action: PayloadAction<{ name: string; color?: string }>) => {
      const { name, color } = action.payload;
      const newLayer = {
        id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        visible: true,
        locked: false,
        color,
        opacity: 1,
      };
      state.layers.push(newLayer);
    },

    updateLayer: (state, action: PayloadAction<{ id: string; updates: Partial<DrawingState['layers'][0]> }>) => {
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

    // Settings
    updateSettings: (state, action: PayloadAction<Partial<DrawingState['settings']>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
  },
});

// Export actions
export const {
  // Drawing management
  setCurrentDrawing,
  clearCurrentDrawing,

  // ReactFlow data
  updateReactFlowData,
  updateNodes,
  updateEdges,

  // Undo/Redo
  undo,
  redo,

  // Selection
  setSelectedComponents,
  setSelectedNodes,
  setSelectedEdges,
  clearSelection,

  // Clipboard
  copyToClipboard,
  pasteFromClipboard,

  // Viewport
  setViewport,

  // Collaboration
  updateCollaborator,
  removeCollaborator,

  // Auto-save
  setSaving,
  setSaved,
  setSaveError,

  // Grid and snap
  toggleGrid,
  setGridSize,
  toggleSnapToGrid,

  // Layers
  addLayer,
  updateLayer,
  deleteLayer,
  setActiveLayer,

  // Settings
  updateSettings,
} = drawingSlice.actions;

// Selectors
export const selectDrawing = (state: { drawing: DrawingState }) => state.drawing;
export const selectCurrentDrawing = (state: { drawing: DrawingState }) => state.drawing.currentDrawing;
export const selectReactFlowData = (state: { drawing: DrawingState }) => state.drawing.reactFlowData;
export const selectSelectedItems = (state: { drawing: DrawingState }) => ({
  components: state.drawing.selectedComponents,
  nodes: state.drawing.selectedNodes,
  edges: state.drawing.selectedEdges,
});
export const selectCanUndo = (state: { drawing: DrawingState }) => state.drawing.history.past.length > 0;
export const selectCanRedo = (state: { drawing: DrawingState }) => state.drawing.history.future.length > 0;
export const selectCollaborators = (state: { drawing: DrawingState }) => state.drawing.collaborators;
export const selectAutoSave = (state: { drawing: DrawingState }) => state.drawing.autoSave;
export const selectGrid = (state: { drawing: DrawingState }) => state.drawing.grid;
export const selectLayers = (state: { drawing: DrawingState }) => state.drawing.layers;
export const selectActiveLayer = (state: { drawing: DrawingState }) =>
  state.drawing.layers.find(l => l.id === state.drawing.activeLayerId);

// Export reducer
export default drawingSlice.reducer;