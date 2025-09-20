import { Node, Edge, Viewport, ReactFlowInstance } from 'reactflow';

// Canvas-specific types extending ReactFlow types
export interface CanvasNode extends Node {
  type: 'component' | 'annotation' | 'group';
  data: {
    componentId?: string;
    componentType?: string;
    symbolId?: string;
    label: string;
    properties?: Record<string, any>;
    locked?: boolean;
    layer?: string;
    metadata?: Record<string, any>;
  };
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  type: 'pipe' | 'signal' | 'annotation';
  data?: {
    pipeType?: string;
    diameter?: number;
    pressure?: number;
    flow?: number;
    locked?: boolean;
    layer?: string;
    metadata?: Record<string, any>;
  };
}

// Canvas state and configuration
export interface CanvasState {
  reactFlowInstance: ReactFlowInstance | null;
  isInitialized: boolean;
  isDragging: boolean;
  isSelecting: boolean;
  isPanning: boolean;
  isZooming: boolean;
  lastAction: CanvasAction | null;
  performance: {
    nodeCount: number;
    edgeCount: number;
    renderTime: number;
    lastUpdate: number;
  };
}

export interface CanvasConfig {
  // Zoom configuration
  zoom: {
    min: number;
    max: number;
    step: number;
    fitPadding: number;
    smoothTransition: boolean;
  };

  // Grid configuration
  grid: {
    visible: boolean;
    size: number;
    color: string;
    opacity: number;
    snapToGrid: boolean;
    snapThreshold: number;
  };

  // Selection configuration
  selection: {
    enabled: boolean;
    multiSelect: boolean;
    dragSelect: boolean;
    selectOnDrag: boolean;
    showBoundingBox: boolean;
  };

  // Performance configuration
  performance: {
    enableVirtualization: boolean;
    maxVisibleNodes: number;
    levelOfDetail: boolean;
    simplifyWhenZoomedOut: boolean;
    debounceMs: number;
  };

  // Interaction configuration
  interaction: {
    panOnDrag: boolean;
    zoomOnScroll: boolean;
    zoomOnPinch: boolean;
    dragThreshold: number;
    doubleClickDelay: number;
  };

  // Collaboration configuration
  collaboration: {
    enabled: boolean;
    showCursors: boolean;
    showSelections: boolean;
    broadcastChanges: boolean;
    conflictResolution: 'optimistic' | 'pessimistic';
  };
}

// Canvas actions for undo/redo system
export interface CanvasAction {
  id: string;
  type: CanvasActionType;
  timestamp: number;
  userId: string;
  data: {
    before: any;
    after: any;
    affectedNodes?: string[];
    affectedEdges?: string[];
  };
  description: string;
}

export enum CanvasActionType {
  // Node actions
  ADD_NODE = 'ADD_NODE',
  DELETE_NODE = 'DELETE_NODE',
  MOVE_NODE = 'MOVE_NODE',
  UPDATE_NODE = 'UPDATE_NODE',
  DUPLICATE_NODE = 'DUPLICATE_NODE',

  // Edge actions
  ADD_EDGE = 'ADD_EDGE',
  DELETE_EDGE = 'DELETE_EDGE',
  UPDATE_EDGE = 'UPDATE_EDGE',

  // Selection actions
  SELECT = 'SELECT',
  DESELECT = 'DESELECT',
  SELECT_ALL = 'SELECT_ALL',

  // Bulk actions
  PASTE = 'PASTE',
  DELETE_SELECTION = 'DELETE_SELECTION',
  GROUP = 'GROUP',
  UNGROUP = 'UNGROUP',

  // Layout actions
  ALIGN = 'ALIGN',
  DISTRIBUTE = 'DISTRIBUTE',
  ARRANGE = 'ARRANGE',

  // Viewport actions
  ZOOM = 'ZOOM',
  PAN = 'PAN',
  FIT_VIEW = 'FIT_VIEW',
}

// Canvas tools and modes
export enum CanvasTool {
  SELECT = 'select',
  PAN = 'pan',
  DRAW_PIPE = 'draw_pipe',
  DRAW_SIGNAL = 'draw_signal',
  ADD_COMPONENT = 'add_component',
  ADD_ANNOTATION = 'add_annotation',
  MEASURE = 'measure',
  ZOOM = 'zoom',
}

export enum CanvasMode {
  EDIT = 'edit',
  VIEW = 'view',
  REVIEW = 'review',
  PRESENT = 'present',
}

// Selection and clipboard
export interface SelectionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ClipboardData {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  bounds: SelectionBounds;
  metadata: {
    source: string;
    timestamp: number;
    userId: string;
  };
}

// Context menu
export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
  separator?: boolean;
  submenu?: ContextMenuItem[];
  action: () => void;
}

export interface ContextMenuData {
  x: number;
  y: number;
  target: 'canvas' | 'node' | 'edge' | 'selection';
  targetId?: string;
  items: ContextMenuItem[];
}

// Keyboard shortcuts
export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  description: string;
  action: () => void;
  category: 'navigation' | 'editing' | 'selection' | 'view' | 'collaboration';
}

// Canvas events
export interface CanvasEvent {
  type: CanvasEventType;
  timestamp: number;
  data: any;
  source: 'user' | 'collaboration' | 'system';
}

export enum CanvasEventType {
  // Canvas events
  CANVAS_CLICK = 'canvas_click',
  CANVAS_DOUBLE_CLICK = 'canvas_double_click',
  CANVAS_RIGHT_CLICK = 'canvas_right_click',
  CANVAS_DRAG_START = 'canvas_drag_start',
  CANVAS_DRAG_END = 'canvas_drag_end',

  // Node events
  NODE_CLICK = 'node_click',
  NODE_DOUBLE_CLICK = 'node_double_click',
  NODE_RIGHT_CLICK = 'node_right_click',
  NODE_DRAG_START = 'node_drag_start',
  NODE_DRAG = 'node_drag',
  NODE_DRAG_END = 'node_drag_end',
  NODE_SELECT = 'node_select',
  NODE_DESELECT = 'node_deselect',

  // Edge events
  EDGE_CLICK = 'edge_click',
  EDGE_DOUBLE_CLICK = 'edge_double_click',
  EDGE_RIGHT_CLICK = 'edge_right_click',
  EDGE_SELECT = 'edge_select',
  EDGE_DESELECT = 'edge_deselect',

  // Viewport events
  VIEWPORT_CHANGE = 'viewport_change',
  ZOOM_CHANGE = 'zoom_change',
  PAN_START = 'pan_start',
  PAN_END = 'pan_end',

  // Selection events
  SELECTION_CHANGE = 'selection_change',
  SELECTION_DRAG_START = 'selection_drag_start',
  SELECTION_DRAG_END = 'selection_drag_end',

  // Tool events
  TOOL_CHANGE = 'tool_change',
  MODE_CHANGE = 'mode_change',
}

// Performance monitoring
export interface CanvasPerformanceMetrics {
  frameRate: number;
  renderTime: number;
  nodeCount: number;
  edgeCount: number;
  visibleNodes: number;
  visibleEdges: number;
  memoryUsage: number;
  lastUpdate: number;
}

// Minimap configuration
export interface MinimapConfig {
  enabled: boolean;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  width: number;
  height: number;
  pannable: boolean;
  zoomable: boolean;
  maskColor: string;
  backgroundColor: string;
  borderRadius: number;
  opacity: number;
}

// Canvas layer system
export interface CanvasLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  color?: string;
  nodeIds: string[];
  edgeIds: string[];
  zIndex: number;
}

// Viewport utilities
export interface ViewportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ViewportTransition {
  duration: number;
  easing: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  onComplete?: () => void;
}

// Canvas measurement and alignment
export interface AlignmentOptions {
  type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
  target: 'selection' | 'canvas' | 'custom';
  customBounds?: SelectionBounds;
}

export interface DistributionOptions {
  type: 'horizontal' | 'vertical';
  spacing: 'even' | 'custom';
  customSpacing?: number;
}

// Canvas validation and constraints
export interface CanvasConstraints {
  minZoom: number;
  maxZoom: number;
  minNodeSize: { width: number; height: number };
  maxNodeSize: { width: number; height: number };
  maxNodes: number;
  maxEdges: number;
  boundaryChecking: boolean;
  boundary?: ViewportBounds;
}

// Export formats
export interface ExportOptions {
  format: 'png' | 'jpg' | 'svg' | 'pdf';
  quality: number;
  width?: number;
  height?: number;
  background?: string;
  includeBackground: boolean;
  viewportOnly: boolean;
  selectedOnly: boolean;
}