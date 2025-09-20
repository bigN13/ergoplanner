/**
 * Enhanced Drawing Selectors with Memoization
 * TASK-022: Redux State for Drawings
 */

import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store';
import type {
  EnhancedDrawingState,
  DrawingAction,
  ActionGroup,
  OptimisticUpdate,
  StateConflict,
  CollaboratorCursor,
  CollaboratorSelection,
  ElementLock,
  DrawingSnapshot,
  DrawingTemplate,
  ValidationError,
  PerformanceMetrics,
} from '@/types/drawing-state';

// Base selector
const selectDrawingState = (state: RootState): EnhancedDrawingState =>
  state.enhancedDrawing || state.drawing as any;

// === CORE DRAWING SELECTORS ===
export const selectCurrentDrawing = createSelector(
  [selectDrawingState],
  (drawing) => drawing.currentDrawing
);

export const selectReactFlowData = createSelector(
  [selectDrawingState],
  (drawing) => drawing.reactFlowData
);

export const selectNodes = createSelector(
  [selectReactFlowData],
  (reactFlowData) => reactFlowData.nodes
);

export const selectEdges = createSelector(
  [selectReactFlowData],
  (reactFlowData) => reactFlowData.edges
);

export const selectViewport = createSelector(
  [selectDrawingState],
  (drawing) => drawing.viewport
);

// === HISTORY AND UNDO/REDO SELECTORS ===
export const selectHistory = createSelector(
  [selectDrawingState],
  (drawing) => drawing.history
);

export const selectCanUndo = createSelector(
  [selectHistory],
  (history) => history.past.length > 0
);

export const selectCanRedo = createSelector(
  [selectHistory],
  (history) => history.future.length > 0
);

export const selectHistorySize = createSelector(
  [selectHistory],
  (history) => ({
    pastActions: history.past.length,
    futureActions: history.future.length,
    maxSize: history.maxHistorySize,
    utilization: history.past.length / history.maxHistorySize,
  })
);

export const selectActionGroups = createSelector(
  [selectHistory],
  (history) => history.actionGroups
);

export const selectCurrentActionGroup = createSelector(
  [selectHistory],
  (history) => history.currentActionGroup
    ? history.actionGroups.find(group => group.id === history.currentActionGroup)
    : null
);

export const selectRecentActions = createSelector(
  [selectHistory],
  (history) => history.past.slice(-10).reverse() // Last 10 actions, newest first
);

export const selectLastSavedAction = createSelector(
  [selectHistory],
  (history) => history.past.find(action => action.id === history.lastSavedAction)
);

export const selectUnsavedChanges = createSelector(
  [selectHistory],
  (history) => {
    if (!history.lastSavedAction) return history.past.length;

    const lastSavedIndex = history.past.findIndex(action => action.id === history.lastSavedAction);
    return lastSavedIndex >= 0 ? history.past.length - lastSavedIndex - 1 : history.past.length;
  }
);

// === SELECTION SELECTORS ===
export const selectSelection = createSelector(
  [selectDrawingState],
  (drawing) => drawing.selection
);

export const selectSelectedNodes = createSelector(
  [selectSelection],
  (selection) => selection.nodes
);

export const selectSelectedEdges = createSelector(
  [selectSelection],
  (selection) => selection.edges
);

export const selectSelectedComponents = createSelector(
  [selectSelection],
  (selection) => selection.components
);

export const selectSelectionBounds = createSelector(
  [selectSelection],
  (selection) => selection.bounds
);

export const selectIsMultiSelect = createSelector(
  [selectSelection],
  (selection) => selection.multiSelectMode
);

export const selectSelectedElements = createSelector(
  [selectSelection],
  (selection) => ({
    total: selection.components.length + selection.nodes.length + selection.edges.length,
    components: selection.components.length,
    nodes: selection.nodes.length,
    edges: selection.edges.length,
    lastSelected: selection.lastSelected,
  })
);

export const selectSelectedNodeObjects = createSelector(
  [selectNodes, selectSelectedNodes],
  (nodes, selectedNodeIds) => nodes.filter(node => selectedNodeIds.includes(node.id))
);

export const selectSelectedEdgeObjects = createSelector(
  [selectEdges, selectSelectedEdges],
  (edges, selectedEdgeIds) => edges.filter(edge => selectedEdgeIds.includes(edge.id))
);

// === CLIPBOARD SELECTORS ===
export const selectClipboard = createSelector(
  [selectDrawingState],
  (drawing) => drawing.clipboard
);

export const selectClipboardContent = createSelector(
  [selectClipboard],
  (clipboard) => ({
    hasContent: clipboard.reactFlowNodes.length > 0 || clipboard.reactFlowEdges.length > 0,
    nodeCount: clipboard.reactFlowNodes.length,
    edgeCount: clipboard.reactFlowEdges.length,
    componentCount: clipboard.components.length,
    format: clipboard.format,
    timestamp: clipboard.timestamp,
    age: Date.now() - clipboard.timestamp,
  })
);

// === COLLABORATION SELECTORS ===
export const selectCollaboration = createSelector(
  [selectDrawingState],
  (drawing) => drawing.collaboration
);

export const selectOptimisticUpdates = createSelector(
  [selectCollaboration],
  (collaboration) => collaboration.optimisticUpdates
);

export const selectPendingOptimisticUpdates = createSelector(
  [selectOptimisticUpdates],
  (updates) => updates.filter(update => update.status === 'pending')
);

export const selectStateConflicts = createSelector(
  [selectCollaboration],
  (collaboration) => collaboration.conflicts
);

export const selectUnresolvedConflicts = createSelector(
  [selectStateConflicts],
  (conflicts) => conflicts.filter(conflict => !conflict.resolution)
);

export const selectCollaboratorCursors = createSelector(
  [selectCollaboration],
  (collaboration) => collaboration.cursors.filter(cursor => cursor.isActive)
);

export const selectCollaboratorSelections = createSelector(
  [selectCollaboration],
  (collaboration) => collaboration.selections
);

export const selectElementLocks = createSelector(
  [selectCollaboration],
  (collaboration) => collaboration.locks.filter(lock => lock.expiresAt > Date.now())
);

export const selectLockedElements = createSelector(
  [selectElementLocks],
  (locks) => new Set(locks.map(lock => lock.elementId))
);

export const selectCollaborationStatus = createSelector(
  [selectCollaboration],
  (collaboration) => ({
    hasActiveCollaborators: collaboration.cursors.some(cursor => cursor.isActive),
    conflictCount: collaboration.conflicts.length,
    optimisticUpdateCount: collaboration.optimisticUpdates.length,
    lockCount: collaboration.locks.filter(lock => lock.expiresAt > Date.now()).length,
    lastSync: collaboration.lastSyncTimestamp,
    syncInProgress: collaboration.syncInProgress,
  })
);

// === PERSISTENCE SELECTORS ===
export const selectPersistence = createSelector(
  [selectDrawingState],
  (drawing) => drawing.persistence
);

export const selectAutoSaveStatus = createSelector(
  [selectPersistence],
  (persistence) => ({
    enabled: persistence.enabled,
    isDirty: persistence.isDirty,
    isSaving: persistence.isSaving,
    lastSaved: persistence.lastSaved,
    saveError: persistence.saveError,
    interval: persistence.autoSaveInterval,
    nextSave: persistence.lastSaved
      ? persistence.lastSaved + persistence.autoSaveInterval
      : Date.now() + persistence.autoSaveInterval,
  })
);

export const selectSessionInfo = createSelector(
  [selectPersistence],
  (persistence) => ({
    sessionId: persistence.sessionId,
    version: persistence.version,
    storageKey: persistence.storageKey,
    compressionEnabled: persistence.compressionEnabled,
    lastPersisted: persistence.lastPersisted,
  })
);

// === PERFORMANCE SELECTORS ===
export const selectPerformance = createSelector(
  [selectDrawingState],
  (drawing) => drawing.performance
);

export const selectPerformanceMetrics = createSelector(
  [selectPerformance],
  (performance) => ({
    stateSize: performance.stateSize,
    stateSizeFormatted: `${(performance.stateSize / 1024).toFixed(1)} KB`,
    lastUpdateDuration: performance.lastUpdateDuration,
    undoRedoLatency: performance.undoRedoLatency,
    persistenceLatency: performance.persistenceLatency,
    actionCount: performance.actionCount,
    averageUpdateTime: performance.averageUpdateTime,
    largestStateSize: performance.largestStateSize,
    largestStateSizeFormatted: `${(performance.largestStateSize / 1024).toFixed(1)} KB`,
  })
);

export const selectPerformanceHealth = createSelector(
  [selectPerformance],
  (performance) => {
    const stateSizeHealth = performance.stateSize < 1024 * 1024 ? 'good' :
                           performance.stateSize < 5 * 1024 * 1024 ? 'warning' : 'critical';

    const updateTimeHealth = performance.averageUpdateTime < 16 ? 'good' :
                            performance.averageUpdateTime < 33 ? 'warning' : 'critical';

    const undoRedoHealth = performance.undoRedoLatency < 10 ? 'good' :
                          performance.undoRedoLatency < 50 ? 'warning' : 'critical';

    return {
      overall: [stateSizeHealth, updateTimeHealth, undoRedoHealth].includes('critical') ? 'critical' :
               [stateSizeHealth, updateTimeHealth, undoRedoHealth].includes('warning') ? 'warning' : 'good',
      stateSize: stateSizeHealth,
      updateTime: updateTimeHealth,
      undoRedo: undoRedoHealth,
      recommendations: [
        stateSizeHealth === 'critical' && 'Consider clearing old history or optimizing state structure',
        updateTimeHealth === 'critical' && 'Enable performance mode or reduce real-time features',
        undoRedoHealth === 'critical' && 'Reduce undo/redo history size or optimize action processing',
      ].filter(Boolean),
    };
  }
);

// === VALIDATION SELECTORS ===
export const selectValidation = createSelector(
  [selectDrawingState],
  (drawing) => drawing.validation
);

export const selectValidationErrors = createSelector(
  [selectValidation],
  (validation) => validation.validationErrors
);

export const selectValidationErrorsByType = createSelector(
  [selectValidationErrors],
  (errors) => ({
    critical: errors.filter(error => error.type === 'critical'),
    error: errors.filter(error => error.type === 'error'),
    warning: errors.filter(error => error.type === 'warning'),
  })
);

export const selectValidationSummary = createSelector(
  [selectValidationErrors],
  (errors) => ({
    total: errors.length,
    critical: errors.filter(error => error.type === 'critical').length,
    errors: errors.filter(error => error.type === 'error').length,
    warnings: errors.filter(error => error.type === 'warning').length,
    categories: errors.reduce((acc, error) => {
      acc[error.category] = (acc[error.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  })
);

// === SNAPSHOTS AND TEMPLATES SELECTORS ===
export const selectSnapshots = createSelector(
  [selectDrawingState],
  (drawing) => drawing.snapshots
);

export const selectTemplates = createSelector(
  [selectDrawingState],
  (drawing) => drawing.templates
);

export const selectRecentSnapshots = createSelector(
  [selectSnapshots],
  (snapshots) => [...snapshots]
    .sort((a, b) => b.metadata.timestamp - a.metadata.timestamp)
    .slice(0, 10)
);

export const selectAutomaticSnapshots = createSelector(
  [selectSnapshots],
  (snapshots) => snapshots.filter(snapshot => snapshot.isAutomatic)
);

export const selectManualSnapshots = createSelector(
  [selectSnapshots],
  (snapshots) => snapshots.filter(snapshot => !snapshot.isAutomatic)
);

export const selectTemplatesByCategory = createSelector(
  [selectTemplates],
  (templates) => templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, DrawingTemplate[]>)
);

// === IMPORT/EXPORT SELECTORS ===
export const selectImportExport = createSelector(
  [selectDrawingState],
  (drawing) => drawing.importExport
);

export const selectCurrentImportExportOperation = createSelector(
  [selectImportExport],
  (importExport) => importExport.currentOperation
);

export const selectImportExportHistory = createSelector(
  [selectImportExport],
  (importExport) => importExport.history
);

export const selectSupportedFormats = createSelector(
  [selectImportExport],
  (importExport) => importExport.supportedFormats
);

export const selectRecentImportExportOperations = createSelector(
  [selectImportExportHistory],
  (history) => [...history]
    .sort((a, b) => b.startTime - a.startTime)
    .slice(0, 10)
);

// === SYNCHRONIZATION SELECTORS ===
export const selectSync = createSelector(
  [selectDrawingState],
  (drawing) => drawing.sync
);

export const selectSyncStatus = createSelector(
  [selectSync],
  (sync) => ({
    connectionStatus: sync.connectionStatus,
    lastSync: sync.lastSync,
    syncInProgress: sync.syncInProgress,
    pendingChanges: sync.pendingChanges.length,
    errorCount: sync.syncErrors.length,
    retryAttempts: sync.retryAttempts,
    queuedOperations: sync.queuedOperations.length,
  })
);

export const selectSyncErrors = createSelector(
  [selectSync],
  (sync) => sync.syncErrors
);

export const selectRetryableSyncErrors = createSelector(
  [selectSyncErrors],
  (errors) => errors.filter(error => error.isRetryable && error.retryCount < 3)
);

// === GRID AND LAYERS SELECTORS ===
export const selectGrid = createSelector(
  [selectDrawingState],
  (drawing) => drawing.grid
);

export const selectLayers = createSelector(
  [selectDrawingState],
  (drawing) => drawing.layers
);

export const selectActiveLayer = createSelector(
  [selectDrawingState],
  (drawing) => drawing.layers.find(layer => layer.id === drawing.activeLayerId)
);

export const selectVisibleLayers = createSelector(
  [selectLayers],
  (layers) => layers.filter(layer => layer.visible)
);

export const selectUnlockedLayers = createSelector(
  [selectLayers],
  (layers) => layers.filter(layer => !layer.locked)
);

export const selectLayersByOrder = createSelector(
  [selectLayers],
  (layers) => [...layers].sort((a, b) => a.order - b.order)
);

// === SETTINGS SELECTORS ===
export const selectSettings = createSelector(
  [selectDrawingState],
  (drawing) => drawing.settings
);

export const selectPerformanceMode = createSelector(
  [selectSettings],
  (settings) => settings.performanceMode
);

export const selectCollaborationEnabled = createSelector(
  [selectSettings],
  (settings) => settings.enableCollaboration
);

// === UI STATE SELECTORS ===
export const selectUI = createSelector(
  [selectDrawingState],
  (drawing) => drawing.ui
);

export const selectActiveToolId = createSelector(
  [selectUI],
  (ui) => ui.activeToolId
);

export const selectPanelStates = createSelector(
  [selectUI],
  (ui) => ui.panelStates
);

export const selectModalStates = createSelector(
  [selectUI],
  (ui) => ui.modalStates
);

export const selectLoadingStates = createSelector(
  [selectUI],
  (ui) => ui.loadingStates
);

export const selectErrorStates = createSelector(
  [selectUI],
  (ui) => ui.errorStates
);

// === COMPUTED SELECTORS ===
export const selectDrawingStats = createSelector(
  [selectNodes, selectEdges, selectSelection, selectSnapshots],
  (nodes, edges, selection, snapshots) => ({
    totalNodes: nodes.length,
    totalEdges: edges.length,
    selectedElements: selection.components.length + selection.nodes.length + selection.edges.length,
    snapshotCount: snapshots.length,
    nodeTypes: nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    edgeTypes: edges.reduce((acc, edge) => {
      acc[edge.type || 'default'] = (acc[edge.type || 'default'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  })
);

export const selectCanvasState = createSelector(
  [selectViewport, selectGrid, selectActiveLayer],
  (viewport, grid, activeLayer) => ({
    viewport,
    grid,
    activeLayer,
    canvasSize: {
      width: Math.max(1000, viewport.zoom * 1000),
      height: Math.max(1000, viewport.zoom * 1000),
    },
    gridScale: Math.max(grid.minGridSize, Math.min(grid.maxGridSize, grid.size * viewport.zoom)),
  })
);

export const selectCollaborationActivity = createSelector(
  [selectCollaboratorCursors, selectCollaboratorSelections, selectElementLocks],
  (cursors, selections, locks) => ({
    activeCursors: cursors.length,
    activeSelections: selections.length,
    activeLocks: locks.length,
    collaborators: [
      ...new Set([
        ...cursors.map(c => c.userId),
        ...selections.map(s => s.userId),
        ...locks.map(l => l.userId),
      ]),
    ].length,
  })
);

export const selectDrawingHealth = createSelector(
  [selectValidationSummary, selectPerformanceHealth, selectSyncStatus],
  (validation, performance, sync) => {
    const validationHealth = validation.critical > 0 ? 'critical' :
                            validation.errors > 0 ? 'warning' : 'good';

    const syncHealth = sync.connectionStatus === 'connected' && sync.errorCount === 0 ? 'good' :
                      sync.connectionStatus === 'disconnected' ? 'critical' : 'warning';

    return {
      overall: [validationHealth, performance.overall, syncHealth].includes('critical') ? 'critical' :
               [validationHealth, performance.overall, syncHealth].includes('warning') ? 'warning' : 'good',
      validation: validationHealth,
      performance: performance.overall,
      sync: syncHealth,
      summary: {
        validationIssues: validation.total,
        performanceIssues: performance.recommendations.length,
        syncIssues: sync.errorCount,
      },
    };
  }
);

// === NORMALIZED STATE SELECTORS ===
export const selectNormalizedState = createSelector(
  [selectDrawingState],
  (drawing) => drawing.normalized
);

export const selectDrawingEntities = createSelector(
  [selectNormalizedState],
  (normalized) => normalized.entities.drawings
);

export const selectComponentEntities = createSelector(
  [selectNormalizedState],
  (normalized) => normalized.entities.components
);

export const selectNodeEntities = createSelector(
  [selectNormalizedState],
  (normalized) => normalized.entities.nodes
);

export const selectEdgeEntities = createSelector(
  [selectNormalizedState],
  (normalized) => normalized.entities.edges
);

export const selectDrawingRelationships = createSelector(
  [selectNormalizedState],
  (normalized) => normalized.relationships
);

// Factory selector for getting elements by drawing ID
export const makeSelectElementsByDrawingId = () => createSelector(
  [selectDrawingRelationships, (_, drawingId: string) => drawingId],
  (relationships, drawingId) => ({
    components: relationships.drawingComponents[drawingId] || [],
    nodes: relationships.drawingNodes[drawingId] || [],
    edges: relationships.drawingEdges[drawingId] || [],
  })
);

// Factory selector for getting component by node ID
export const makeSelectComponentByNodeId = () => createSelector(
  [selectDrawingRelationships, (_, nodeId: string) => nodeId],
  (relationships, nodeId) => relationships.nodeComponents[nodeId]
);

// Factory selector for getting node by component ID
export const makeSelectNodeByComponentId = () => createSelector(
  [selectDrawingRelationships, (_, componentId: string) => componentId],
  (relationships, componentId) => relationships.componentNodes[componentId]
);

export default {
  // Core
  selectCurrentDrawing,
  selectReactFlowData,
  selectNodes,
  selectEdges,
  selectViewport,

  // History
  selectHistory,
  selectCanUndo,
  selectCanRedo,
  selectHistorySize,
  selectRecentActions,
  selectUnsavedChanges,

  // Selection
  selectSelection,
  selectSelectedNodes,
  selectSelectedEdges,
  selectSelectedComponents,
  selectSelectedNodeObjects,
  selectSelectedEdgeObjects,

  // Collaboration
  selectCollaboratorCursors,
  selectCollaboratorSelections,
  selectElementLocks,
  selectStateConflicts,
  selectOptimisticUpdates,

  // Performance
  selectPerformanceMetrics,
  selectPerformanceHealth,

  // Validation
  selectValidationErrors,
  selectValidationSummary,

  // Persistence
  selectAutoSaveStatus,
  selectSessionInfo,

  // UI
  selectActiveToolId,
  selectPanelStates,
  selectModalStates,

  // Computed
  selectDrawingStats,
  selectCanvasState,
  selectDrawingHealth,
  selectCollaborationActivity,
};