/**
 * Enhanced Drawing State Types for Redux Store
 * TASK-022: Redux State for Drawings
 */

import type { Drawing, Component, ReactFlowData, User } from './index';

// Action types for undo/redo system
export interface DrawingAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  userId?: string;
  groupId?: string; // For grouping related actions
  description: string;
  metadata?: {
    nodeIds?: string[];
    edgeIds?: string[];
    componentIds?: string[];
    bounds?: { x: number; y: number; width: number; height: number };
  };
}

// Action group for complex operations
export interface ActionGroup {
  id: string;
  actions: DrawingAction[];
  description: string;
  timestamp: number;
  userId?: string;
}

// History management
export interface DrawingHistory {
  past: DrawingAction[];
  present: ReactFlowData;
  future: DrawingAction[];
  actionGroups: ActionGroup[];
  maxHistorySize: number;
  currentActionGroup?: string;
  lastSavedAction?: string;
}

// State persistence
export interface StatePersistence {
  enabled: boolean;
  autoSaveInterval: number; // milliseconds
  storageKey: string;
  version: string;
  lastPersisted: number;
  sessionId: string;
  compressionEnabled: boolean;
}

// Performance monitoring
export interface PerformanceMetrics {
  stateSize: number;
  lastUpdateDuration: number;
  undoRedoLatency: number;
  persistenceLatency: number;
  actionCount: number;
  largestStateSize: number;
  averageUpdateTime: number;
  memoryUsage?: number;
}

// State validation
export interface StateValidation {
  enabled: boolean;
  strictMode: boolean;
  validationErrors: ValidationError[];
  lastValidated: number;
  autoFix: boolean;
  checksEnabled: {
    nodeEdgeConsistency: boolean;
    componentNodeBinding: boolean;
    dataIntegrity: boolean;
    circularReferences: boolean;
  };
}

export interface ValidationError {
  id: string;
  type: 'warning' | 'error' | 'critical';
  category: 'data' | 'consistency' | 'performance' | 'security';
  message: string;
  details?: string;
  affectedElements: string[];
  suggestedFix?: string;
  timestamp: number;
}

// Optimistic updates for collaboration
export interface OptimisticUpdate {
  id: string;
  action: DrawingAction;
  timestamp: number;
  userId: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'timeout';
  originalState?: any;
  conflictResolution?: 'client-wins' | 'server-wins' | 'merge' | 'manual';
}

// Collaboration state
export interface CollaborationState {
  optimisticUpdates: OptimisticUpdate[];
  conflicts: StateConflict[];
  cursors: CollaboratorCursor[];
  selections: CollaboratorSelection[];
  locks: ElementLock[];
  lastSyncTimestamp: number;
  syncInProgress: boolean;
  conflictResolutionMode: 'automatic' | 'manual';
}

export interface StateConflict {
  id: string;
  type: 'concurrent_edit' | 'version_mismatch' | 'deleted_element' | 'invalid_state';
  description: string;
  localAction: DrawingAction;
  remoteAction: DrawingAction;
  resolution?: 'use_local' | 'use_remote' | 'merge' | 'manual';
  timestamp: number;
  affectedElements: string[];
}

export interface CollaboratorCursor {
  userId: string;
  userName: string;
  position: { x: number; y: number };
  color: string;
  timestamp: number;
  isActive: boolean;
}

export interface CollaboratorSelection {
  userId: string;
  userName: string;
  selectedNodes: string[];
  selectedEdges: string[];
  color: string;
  timestamp: number;
}

export interface ElementLock {
  elementId: string;
  elementType: 'node' | 'edge' | 'component';
  userId: string;
  userName: string;
  timestamp: number;
  expiresAt: number;
  lockType: 'soft' | 'hard'; // soft = warning, hard = prevent edits
}

// Drawing diff and merge
export interface DrawingDiff {
  id: string;
  fromVersion: number;
  toVersion: number;
  changes: DiffChange[];
  summary: DiffSummary;
  timestamp: number;
  conflictsDetected: boolean;
}

export interface DiffChange {
  type: 'add' | 'remove' | 'modify' | 'move';
  elementType: 'node' | 'edge' | 'component' | 'viewport';
  elementId: string;
  path?: string; // JSON path for property changes
  oldValue?: any;
  newValue?: any;
  position?: { x: number; y: number };
  metadata?: Record<string, any>;
}

export interface DiffSummary {
  nodesAdded: number;
  nodesRemoved: number;
  nodesModified: number;
  edgesAdded: number;
  edgesRemoved: number;
  edgesModified: number;
  componentsChanged: number;
  propertiesChanged: number;
  majorChanges: boolean;
}

// Templates and snapshots
export interface DrawingTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  tags: string[];
  reactFlowData: ReactFlowData;
  components: Component[];
  previewImage?: string;
  createdBy: string;
  createdAt: number;
  version: string;
  isPublic: boolean;
  usageCount: number;
}

export interface DrawingSnapshot {
  id: string;
  name: string;
  description?: string;
  drawingId: string;
  reactFlowData: ReactFlowData;
  components: Component[];
  metadata: {
    version: number;
    timestamp: number;
    userId: string;
    actionId: string;
    checksumBefore: string;
    checksumAfter: string;
  };
  isAutomatic: boolean;
  retentionPolicy?: {
    keepUntil?: number;
    maxSnapshots?: number;
    importance: 'low' | 'medium' | 'high' | 'critical';
  };
}

// Import/Export state
export interface ImportExportState {
  currentOperation?: ImportExportOperation;
  history: ImportExportOperation[];
  supportedFormats: ExportFormat[];
  validationRules: ImportValidationRule[];
}

export interface ImportExportOperation {
  id: string;
  type: 'import' | 'export';
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  fileName?: string;
  fileSize?: number;
  startTime: number;
  endTime?: number;
  errors: ImportExportError[];
  warnings: ImportExportWarning[];
  metadata?: {
    sourceVersion?: string;
    targetVersion?: string;
    conversionRules?: string[];
    preservedElements?: string[];
    lostElements?: string[];
  };
}

export interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
  supportsComponents: boolean;
  supportsProperties: boolean;
  supportsLayers: boolean;
  qualityLoss: 'none' | 'minimal' | 'moderate' | 'significant';
  fileSize: 'small' | 'medium' | 'large';
}

export interface ImportValidationRule {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  category: string;
  isRequired: boolean;
  validator: (data: any) => ValidationResult;
}

export interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface ImportExportError {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  line?: number;
  column?: number;
  context?: string;
}

export interface ImportExportWarning {
  code: string;
  message: string;
  suggestion?: string;
  affectedElements?: string[];
}

// Normalized state structure
export interface NormalizedDrawingState {
  // Entities
  entities: {
    drawings: Record<string, Drawing>;
    components: Record<string, Component>;
    nodes: Record<string, any>;
    edges: Record<string, any>;
    layers: Record<string, any>;
    snapshots: Record<string, DrawingSnapshot>;
    templates: Record<string, DrawingTemplate>;
  };

  // IDs for ordering
  ids: {
    drawings: string[];
    components: string[];
    nodes: string[];
    edges: string[];
    layers: string[];
    snapshots: string[];
    templates: string[];
  };

  // Relationships
  relationships: {
    drawingComponents: Record<string, string[]>; // drawingId -> componentIds
    drawingNodes: Record<string, string[]>; // drawingId -> nodeIds
    drawingEdges: Record<string, string[]>; // drawingId -> edgeIds
    componentNodes: Record<string, string>; // componentId -> nodeId
    nodeComponents: Record<string, string>; // nodeId -> componentId
  };
}

// Backend synchronization
export interface SynchronizationState {
  lastSync: number;
  pendingChanges: DrawingAction[];
  syncInProgress: boolean;
  syncErrors: SyncError[];
  conflictResolution: ConflictResolution[];
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  retryAttempts: number;
  maxRetryAttempts: number;
  backoffDelay: number;
  queuedOperations: QueuedOperation[];
}

export interface SyncError {
  id: string;
  type: 'network' | 'conflict' | 'validation' | 'authorization' | 'server';
  message: string;
  action: DrawingAction;
  timestamp: number;
  retryCount: number;
  isRetryable: boolean;
  lastRetry?: number;
}

export interface ConflictResolution {
  id: string;
  conflictId: string;
  strategy: 'client-wins' | 'server-wins' | 'merge' | 'manual';
  resolvedAction: DrawingAction;
  timestamp: number;
  resolvedBy: string;
}

export interface QueuedOperation {
  id: string;
  type: 'sync' | 'conflict_resolution' | 'retry' | 'cleanup';
  priority: number;
  payload: any;
  timestamp: number;
  attempts: number;
  maxAttempts: number;
  nextAttempt: number;
}

// Root enhanced drawing state
export interface EnhancedDrawingState {
  // Core state
  currentDrawing: Drawing | null;
  reactFlowData: ReactFlowData;

  // Normalized data
  normalized: NormalizedDrawingState;

  // Selection and editing
  selection: {
    components: string[];
    nodes: string[];
    edges: string[];
    bounds?: { x: number; y: number; width: number; height: number };
    lastSelected?: string;
    multiSelectMode: boolean;
  };

  // Clipboard
  clipboard: {
    actions: DrawingAction[];
    reactFlowNodes: any[];
    reactFlowEdges: any[];
    components: Component[];
    format: 'internal' | 'external';
    timestamp: number;
  };

  // Enhanced history with undo/redo
  history: DrawingHistory;

  // Canvas state
  viewport: {
    x: number;
    y: number;
    zoom: number;
    bounds?: { minX: number; minY: number; maxX: number; maxY: number };
  };

  // Collaboration
  collaboration: CollaborationState;

  // Auto-save and persistence
  persistence: StatePersistence & {
    isDirty: boolean;
    lastSaved: number | null;
    isSaving: boolean;
    saveError: string | null;
    queuedSaves: string[];
  };

  // Performance monitoring
  performance: PerformanceMetrics & {
    enabled: boolean;
    sampleRate: number;
    maxSamples: number;
    samples: PerformanceMetrics[];
  };

  // State validation
  validation: StateValidation;

  // Import/Export
  importExport: ImportExportState;

  // Templates and snapshots
  templates: DrawingTemplate[];
  snapshots: DrawingSnapshot[];

  // Synchronization
  sync: SynchronizationState;

  // Grid and snap
  grid: {
    visible: boolean;
    size: number;
    snapToGrid: boolean;
    adaptiveGrid: boolean;
    minGridSize: number;
    maxGridSize: number;
  };

  // Layers
  layers: {
    id: string;
    name: string;
    visible: boolean;
    locked: boolean;
    color?: string;
    opacity: number;
    order: number;
  }[];
  activeLayerId: string | null;

  // Drawing settings
  settings: {
    showConnections: boolean;
    showLabels: boolean;
    showDimensions: boolean;
    enableCollaboration: boolean;
    autoLayout: boolean;
    realTimeValidation: boolean;
    autoSave: boolean;
    performanceMode: 'standard' | 'high-performance' | 'memory-optimized';
    debugMode: boolean;
  };

  // UI state
  ui: {
    activeToolId: string | null;
    panelStates: Record<string, boolean>;
    modalStates: Record<string, boolean>;
    loadingStates: Record<string, boolean>;
    errorStates: Record<string, string>;
  };
}