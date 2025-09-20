/**
 * Drawing State Utilities - Diff, Merge, Validation, and Performance
 * TASK-022: Redux State for Drawings
 */

import { nanoid } from '@reduxjs/toolkit';
import { isEqual, cloneDeep, debounce } from 'lodash-es';
import type { ReactFlowData } from '@/types';
import type {
  DrawingDiff,
  DiffChange,
  DiffSummary,
  ValidationError,
  PerformanceMetrics,
  DrawingAction,
  ActionGroup,
  EnhancedDrawingState,
} from '@/types/drawing-state';

// === DIFF CALCULATION ===

/**
 * Calculate diff between two ReactFlow data states
 */
export const calculateDrawingDiff = (
  fromData: ReactFlowData,
  toData: ReactFlowData,
  fromVersion: number = 1,
  toVersion: number = 2
): DrawingDiff => {
  const changes: DiffChange[] = [];

  // Compare nodes
  const nodeChanges = calculateNodeDiff(fromData.nodes, toData.nodes);
  changes.push(...nodeChanges);

  // Compare edges
  const edgeChanges = calculateEdgeDiff(fromData.edges, toData.edges);
  changes.push(...edgeChanges);

  // Compare viewport
  const viewportChanges = calculateViewportDiff(fromData.viewport, toData.viewport);
  changes.push(...viewportChanges);

  // Generate summary
  const summary = generateDiffSummary(changes);

  return {
    id: nanoid(),
    fromVersion,
    toVersion,
    changes,
    summary,
    timestamp: Date.now(),
    conflictsDetected: detectConflicts(changes),
  };
};

/**
 * Calculate node differences
 */
const calculateNodeDiff = (fromNodes: any[], toNodes: any[]): DiffChange[] => {
  const changes: DiffChange[] = [];
  const fromNodeMap = new Map(fromNodes.map(n => [n.id, n]));
  const toNodeMap = new Map(toNodes.map(n => [n.id, n]));

  // Find added nodes
  toNodes.forEach(node => {
    if (!fromNodeMap.has(node.id)) {
      changes.push({
        type: 'add',
        elementType: 'node',
        elementId: node.id,
        newValue: node,
      });
    }
  });

  // Find removed nodes
  fromNodes.forEach(node => {
    if (!toNodeMap.has(node.id)) {
      changes.push({
        type: 'remove',
        elementType: 'node',
        elementId: node.id,
        oldValue: node,
      });
    }
  });

  // Find modified nodes
  fromNodes.forEach(fromNode => {
    const toNode = toNodeMap.get(fromNode.id);
    if (toNode && !isEqual(fromNode, toNode)) {
      const nodeChanges = calculateObjectDiff(fromNode, toNode, fromNode.id, 'node');
      changes.push(...nodeChanges);
    }
  });

  return changes;
};

/**
 * Calculate edge differences
 */
const calculateEdgeDiff = (fromEdges: any[], toEdges: any[]): DiffChange[] => {
  const changes: DiffChange[] = [];
  const fromEdgeMap = new Map(fromEdges.map(e => [e.id, e]));
  const toEdgeMap = new Map(toEdges.map(e => [e.id, e]));

  // Find added edges
  toEdges.forEach(edge => {
    if (!fromEdgeMap.has(edge.id)) {
      changes.push({
        type: 'add',
        elementType: 'edge',
        elementId: edge.id,
        newValue: edge,
      });
    }
  });

  // Find removed edges
  fromEdges.forEach(edge => {
    if (!toEdgeMap.has(edge.id)) {
      changes.push({
        type: 'remove',
        elementType: 'edge',
        elementId: edge.id,
        oldValue: edge,
      });
    }
  });

  // Find modified edges
  fromEdges.forEach(fromEdge => {
    const toEdge = toEdgeMap.get(fromEdge.id);
    if (toEdge && !isEqual(fromEdge, toEdge)) {
      const edgeChanges = calculateObjectDiff(fromEdge, toEdge, fromEdge.id, 'edge');
      changes.push(...edgeChanges);
    }
  });

  return changes;
};

/**
 * Calculate viewport differences
 */
const calculateViewportDiff = (
  fromViewport: { x: number; y: number; zoom: number },
  toViewport: { x: number; y: number; zoom: number }
): DiffChange[] => {
  const changes: DiffChange[] = [];

  if (!isEqual(fromViewport, toViewport)) {
    changes.push({
      type: 'modify',
      elementType: 'viewport',
      elementId: 'viewport',
      oldValue: fromViewport,
      newValue: toViewport,
    });
  }

  return changes;
};

/**
 * Calculate object-level differences
 */
const calculateObjectDiff = (
  fromObj: any,
  toObj: any,
  elementId: string,
  elementType: 'node' | 'edge'
): DiffChange[] => {
  const changes: DiffChange[] = [];

  // Position changes
  if (fromObj.position && toObj.position && !isEqual(fromObj.position, toObj.position)) {
    changes.push({
      type: 'move',
      elementType,
      elementId,
      oldValue: fromObj.position,
      newValue: toObj.position,
      position: toObj.position,
    });
  }

  // Data changes
  if (!isEqual(fromObj.data, toObj.data)) {
    changes.push({
      type: 'modify',
      elementType,
      elementId,
      path: 'data',
      oldValue: fromObj.data,
      newValue: toObj.data,
    });
  }

  // Style changes
  if (!isEqual(fromObj.style, toObj.style)) {
    changes.push({
      type: 'modify',
      elementType,
      elementId,
      path: 'style',
      oldValue: fromObj.style,
      newValue: toObj.style,
    });
  }

  // Type changes (rare but possible)
  if (fromObj.type !== toObj.type) {
    changes.push({
      type: 'modify',
      elementType,
      elementId,
      path: 'type',
      oldValue: fromObj.type,
      newValue: toObj.type,
    });
  }

  return changes;
};

/**
 * Generate diff summary
 */
const generateDiffSummary = (changes: DiffChange[]): DiffSummary => {
  const summary: DiffSummary = {
    nodesAdded: 0,
    nodesRemoved: 0,
    nodesModified: 0,
    edgesAdded: 0,
    edgesRemoved: 0,
    edgesModified: 0,
    componentsChanged: 0,
    propertiesChanged: 0,
    majorChanges: false,
  };

  changes.forEach(change => {
    if (change.elementType === 'node') {
      switch (change.type) {
        case 'add':
          summary.nodesAdded++;
          break;
        case 'remove':
          summary.nodesRemoved++;
          break;
        case 'modify':
        case 'move':
          summary.nodesModified++;
          break;
      }
    } else if (change.elementType === 'edge') {
      switch (change.type) {
        case 'add':
          summary.edgesAdded++;
          break;
        case 'remove':
          summary.edgesRemoved++;
          break;
        case 'modify':
        case 'move':
          summary.edgesModified++;
          break;
      }
    }

    if (change.path) {
      summary.propertiesChanged++;
    }
  });

  // Determine if there are major changes
  summary.majorChanges = (
    summary.nodesAdded + summary.nodesRemoved > 5 ||
    summary.edgesAdded + summary.edgesRemoved > 10 ||
    summary.nodesModified > 10
  );

  return summary;
};

/**
 * Detect conflicts in changes
 */
const detectConflicts = (changes: DiffChange[]): boolean => {
  // Group changes by element ID
  const elementChanges = new Map<string, DiffChange[]>();

  changes.forEach(change => {
    const existing = elementChanges.get(change.elementId) || [];
    existing.push(change);
    elementChanges.set(change.elementId, existing);
  });

  // Check for conflicting changes to the same element
  for (const [elementId, elementChangeList] of elementChanges) {
    if (elementChangeList.length > 1) {
      const hasAddRemove = elementChangeList.some(c => c.type === 'add') &&
                          elementChangeList.some(c => c.type === 'remove');

      if (hasAddRemove) {
        return true; // Conflict: element both added and removed
      }
    }
  }

  return false;
};

// === MERGE OPERATIONS ===

/**
 * Merge two ReactFlow data states
 */
export const mergeDrawingStates = (
  baseState: ReactFlowData,
  localChanges: ReactFlowData,
  remoteChanges: ReactFlowData,
  strategy: 'three-way' | 'local-wins' | 'remote-wins' = 'three-way'
): ReactFlowData => {
  if (strategy === 'local-wins') {
    return cloneDeep(localChanges);
  }

  if (strategy === 'remote-wins') {
    return cloneDeep(remoteChanges);
  }

  // Three-way merge
  return performThreeWayMerge(baseState, localChanges, remoteChanges);
};

/**
 * Perform three-way merge
 */
const performThreeWayMerge = (
  base: ReactFlowData,
  local: ReactFlowData,
  remote: ReactFlowData
): ReactFlowData => {
  const merged: ReactFlowData = {
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  };

  // Merge nodes
  merged.nodes = mergeNodes(base.nodes, local.nodes, remote.nodes);

  // Merge edges
  merged.edges = mergeEdges(base.edges, local.edges, remote.edges);

  // Merge viewport (prefer local viewport)
  merged.viewport = local.viewport;

  return merged;
};

/**
 * Merge node arrays
 */
const mergeNodes = (baseNodes: any[], localNodes: any[], remoteNodes: any[]): any[] => {
  const baseNodeMap = new Map(baseNodes.map(n => [n.id, n]));
  const localNodeMap = new Map(localNodes.map(n => [n.id, n]));
  const remoteNodeMap = new Map(remoteNodes.map(n => [n.id, n]));

  const mergedNodes: any[] = [];
  const processedIds = new Set<string>();

  // Process all unique node IDs
  const allNodeIds = new Set([
    ...baseNodes.map(n => n.id),
    ...localNodes.map(n => n.id),
    ...remoteNodes.map(n => n.id),
  ]);

  allNodeIds.forEach(nodeId => {
    if (processedIds.has(nodeId)) return;

    const baseNode = baseNodeMap.get(nodeId);
    const localNode = localNodeMap.get(nodeId);
    const remoteNode = remoteNodeMap.get(nodeId);

    const mergedNode = mergeNode(baseNode, localNode, remoteNode);
    if (mergedNode) {
      mergedNodes.push(mergedNode);
    }

    processedIds.add(nodeId);
  });

  return mergedNodes;
};

/**
 * Merge individual node
 */
const mergeNode = (baseNode: any, localNode: any, remoteNode: any): any | null => {
  // If node exists in both local and remote, merge them
  if (localNode && remoteNode) {
    return {
      ...baseNode,
      ...mergeNodeProperties(baseNode, localNode, remoteNode),
    };
  }

  // If node only exists locally
  if (localNode && !remoteNode) {
    // Check if it was deleted remotely
    if (baseNode) {
      // Node was deleted remotely, keep deletion
      return null;
    } else {
      // Node was added locally
      return localNode;
    }
  }

  // If node only exists remotely
  if (remoteNode && !localNode) {
    // Check if it was deleted locally
    if (baseNode) {
      // Node was deleted locally, keep deletion
      return null;
    } else {
      // Node was added remotely
      return remoteNode;
    }
  }

  return null;
};

/**
 * Merge node properties
 */
const mergeNodeProperties = (baseNode: any, localNode: any, remoteNode: any): any => {
  const merged = { ...localNode };

  // Position: prefer local changes
  merged.position = localNode.position;

  // Data: merge object properties
  if (baseNode?.data || localNode?.data || remoteNode?.data) {
    merged.data = {
      ...baseNode?.data,
      ...remoteNode?.data,
      ...localNode?.data, // Local wins for data conflicts
    };
  }

  // Style: merge styles
  if (baseNode?.style || localNode?.style || remoteNode?.style) {
    merged.style = {
      ...baseNode?.style,
      ...remoteNode?.style,
      ...localNode?.style, // Local wins for style conflicts
    };
  }

  return merged;
};

/**
 * Merge edge arrays
 */
const mergeEdges = (baseEdges: any[], localEdges: any[], remoteEdges: any[]): any[] => {
  const baseEdgeMap = new Map(baseEdges.map(e => [e.id, e]));
  const localEdgeMap = new Map(localEdges.map(e => [e.id, e]));
  const remoteEdgeMap = new Map(remoteEdges.map(e => [e.id, e]));

  const mergedEdges: any[] = [];
  const processedIds = new Set<string>();

  // Process all unique edge IDs
  const allEdgeIds = new Set([
    ...baseEdges.map(e => e.id),
    ...localEdges.map(e => e.id),
    ...remoteEdges.map(e => e.id),
  ]);

  allEdgeIds.forEach(edgeId => {
    if (processedIds.has(edgeId)) return;

    const baseEdge = baseEdgeMap.get(edgeId);
    const localEdge = localEdgeMap.get(edgeId);
    const remoteEdge = remoteEdgeMap.get(edgeId);

    const mergedEdge = mergeEdge(baseEdge, localEdge, remoteEdge);
    if (mergedEdge) {
      mergedEdges.push(mergedEdge);
    }

    processedIds.add(edgeId);
  });

  return mergedEdges;
};

/**
 * Merge individual edge
 */
const mergeEdge = (baseEdge: any, localEdge: any, remoteEdge: any): any | null => {
  // Similar logic to mergeNode
  if (localEdge && remoteEdge) {
    return {
      ...baseEdge,
      ...remoteEdge,
      ...localEdge, // Local wins for conflicts
    };
  }

  if (localEdge && !remoteEdge) {
    return baseEdge ? null : localEdge; // Deleted remotely vs added locally
  }

  if (remoteEdge && !localEdge) {
    return baseEdge ? null : remoteEdge; // Deleted locally vs added remotely
  }

  return null;
};

// === STATE VALIDATION ===

/**
 * Validate drawing state integrity
 */
export const validateDrawingState = (state: EnhancedDrawingState): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Node-Edge consistency
  if (state.validation.checksEnabled.nodeEdgeConsistency) {
    errors.push(...validateNodeEdgeConsistency(state.reactFlowData));
  }

  // Component-Node binding
  if (state.validation.checksEnabled.componentNodeBinding) {
    errors.push(...validateComponentNodeBinding(state));
  }

  // Data integrity
  if (state.validation.checksEnabled.dataIntegrity) {
    errors.push(...validateDataIntegrity(state.reactFlowData));
  }

  // Circular references
  if (state.validation.checksEnabled.circularReferences) {
    errors.push(...validateCircularReferences(state.reactFlowData));
  }

  return errors;
};

/**
 * Validate node-edge consistency
 */
const validateNodeEdgeConsistency = (data: ReactFlowData): ValidationError[] => {
  const errors: ValidationError[] = [];
  const nodeIds = new Set(data.nodes.map(n => n.id));

  data.edges.forEach(edge => {
    if (!nodeIds.has(edge.source)) {
      errors.push({
        id: nanoid(),
        type: 'error',
        category: 'consistency',
        message: `Edge "${edge.id}" references non-existent source node "${edge.source}"`,
        affectedElements: [edge.id, edge.source],
        timestamp: Date.now(),
        suggestedFix: `Remove edge "${edge.id}" or add missing node "${edge.source}"`,
      });
    }

    if (!nodeIds.has(edge.target)) {
      errors.push({
        id: nanoid(),
        type: 'error',
        category: 'consistency',
        message: `Edge "${edge.id}" references non-existent target node "${edge.target}"`,
        affectedElements: [edge.id, edge.target],
        timestamp: Date.now(),
        suggestedFix: `Remove edge "${edge.id}" or add missing node "${edge.target}"`,
      });
    }
  });

  return errors;
};

/**
 * Validate component-node binding
 */
const validateComponentNodeBinding = (state: EnhancedDrawingState): ValidationError[] => {
  const errors: ValidationError[] = [];
  const nodeIds = new Set(state.reactFlowData.nodes.map(n => n.id));

  // Check if normalized state is available
  if (state.normalized?.relationships?.componentNodes) {
    Object.entries(state.normalized.relationships.componentNodes).forEach(([componentId, nodeId]) => {
      if (!nodeIds.has(nodeId)) {
        errors.push({
          id: nanoid(),
          type: 'error',
          category: 'consistency',
          message: `Component "${componentId}" references non-existent node "${nodeId}"`,
          affectedElements: [componentId, nodeId],
          timestamp: Date.now(),
          suggestedFix: `Update component binding or remove component "${componentId}"`,
        });
      }
    });
  }

  return errors;
};

/**
 * Validate data integrity
 */
const validateDataIntegrity = (data: ReactFlowData): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Check for required node properties
  data.nodes.forEach(node => {
    if (!node.id) {
      errors.push({
        id: nanoid(),
        type: 'critical',
        category: 'data',
        message: 'Node missing required "id" property',
        affectedElements: ['unknown'],
        timestamp: Date.now(),
        suggestedFix: 'Generate unique ID for node',
      });
    }

    if (!node.position) {
      errors.push({
        id: nanoid(),
        type: 'error',
        category: 'data',
        message: `Node "${node.id}" missing position`,
        affectedElements: [node.id],
        timestamp: Date.now(),
        suggestedFix: `Set position for node "${node.id}"`,
      });
    }

    if (node.position && (typeof node.position.x !== 'number' || typeof node.position.y !== 'number')) {
      errors.push({
        id: nanoid(),
        type: 'error',
        category: 'data',
        message: `Node "${node.id}" has invalid position coordinates`,
        affectedElements: [node.id],
        timestamp: Date.now(),
        suggestedFix: `Fix position coordinates for node "${node.id}"`,
      });
    }
  });

  // Check for required edge properties
  data.edges.forEach(edge => {
    if (!edge.id) {
      errors.push({
        id: nanoid(),
        type: 'critical',
        category: 'data',
        message: 'Edge missing required "id" property',
        affectedElements: ['unknown'],
        timestamp: Date.now(),
        suggestedFix: 'Generate unique ID for edge',
      });
    }

    if (!edge.source) {
      errors.push({
        id: nanoid(),
        type: 'error',
        category: 'data',
        message: `Edge "${edge.id}" missing source node`,
        affectedElements: [edge.id],
        timestamp: Date.now(),
        suggestedFix: `Set source node for edge "${edge.id}"`,
      });
    }

    if (!edge.target) {
      errors.push({
        id: nanoid(),
        type: 'error',
        category: 'data',
        message: `Edge "${edge.id}" missing target node`,
        affectedElements: [edge.id],
        timestamp: Date.now(),
        suggestedFix: `Set target node for edge "${edge.id}"`,
      });
    }
  });

  return errors;
};

/**
 * Validate circular references
 */
const validateCircularReferences = (data: ReactFlowData): ValidationError[] => {
  const errors: ValidationError[] = [];
  const graph = new Map<string, string[]>();

  // Build adjacency list
  data.edges.forEach(edge => {
    if (!graph.has(edge.source)) {
      graph.set(edge.source, []);
    }
    graph.get(edge.source)!.push(edge.target);
  });

  // Detect cycles using DFS
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const detectCycle = (nodeId: string, path: string[]): string[] | null => {
    if (recursionStack.has(nodeId)) {
      // Found cycle
      const cycleStart = path.indexOf(nodeId);
      return path.slice(cycleStart).concat([nodeId]);
    }

    if (visited.has(nodeId)) {
      return null;
    }

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = graph.get(nodeId) || [];
    for (const neighbor of neighbors) {
      const cycle = detectCycle(neighbor, [...path, nodeId]);
      if (cycle) {
        return cycle;
      }
    }

    recursionStack.delete(nodeId);
    return null;
  };

  // Check all nodes for cycles
  for (const nodeId of graph.keys()) {
    if (!visited.has(nodeId)) {
      const cycle = detectCycle(nodeId, []);
      if (cycle) {
        errors.push({
          id: nanoid(),
          type: 'warning',
          category: 'data',
          message: `Circular reference detected in flow: ${cycle.join(' → ')}`,
          affectedElements: cycle,
          timestamp: Date.now(),
          suggestedFix: 'Review and remove circular dependencies',
        });
      }
    }
  }

  return errors;
};

// === PERFORMANCE UTILITIES ===

/**
 * Calculate state size and performance metrics
 */
export const calculatePerformanceMetrics = (state: EnhancedDrawingState): PerformanceMetrics => {
  const stateSize = calculateStateSize(state);

  return {
    stateSize,
    lastUpdateDuration: state.performance.lastUpdateDuration,
    undoRedoLatency: state.performance.undoRedoLatency,
    persistenceLatency: state.performance.persistenceLatency,
    actionCount: state.performance.actionCount,
    largestStateSize: Math.max(state.performance.largestStateSize, stateSize),
    averageUpdateTime: state.performance.averageUpdateTime,
  };
};

/**
 * Calculate state size in bytes
 */
export const calculateStateSize = (state: any): number => {
  try {
    return new Blob([JSON.stringify(state)]).size;
  } catch (error) {
    console.warn('Failed to calculate state size:', error);
    return 0;
  }
};

/**
 * Optimize state for performance
 */
export const optimizeState = (state: EnhancedDrawingState): Partial<EnhancedDrawingState> => {
  const optimized = cloneDeep(state);

  // Limit history size
  if (optimized.history.past.length > optimized.history.maxHistorySize) {
    optimized.history.past = optimized.history.past.slice(-optimized.history.maxHistorySize);
  }

  // Remove old performance samples
  if (optimized.performance.samples.length > optimized.performance.maxSamples) {
    optimized.performance.samples = optimized.performance.samples.slice(-optimized.performance.maxSamples);
  }

  // Clean expired optimistic updates
  optimized.collaboration.optimisticUpdates = optimized.collaboration.optimisticUpdates.filter(
    update => Date.now() - update.timestamp < 60000 // Keep last minute only
  );

  // Clean old snapshots
  optimized.snapshots = optimized.snapshots
    .sort((a, b) => b.metadata.timestamp - a.metadata.timestamp)
    .slice(0, 50); // Keep only 50 most recent

  return optimized;
};

// === ACTION UTILITIES ===

/**
 * Group related actions for better undo/redo
 */
export const groupActions = (actions: DrawingAction[], maxGapMs: number = 1000): ActionGroup[] => {
  if (actions.length === 0) return [];

  const groups: ActionGroup[] = [];
  let currentGroup: DrawingAction[] = [actions[0]];
  let lastTimestamp = actions[0].timestamp;

  for (let i = 1; i < actions.length; i++) {
    const action = actions[i];
    const gap = action.timestamp - lastTimestamp;

    if (gap <= maxGapMs && areActionsRelated(currentGroup[currentGroup.length - 1], action)) {
      currentGroup.push(action);
    } else {
      // Create group from current actions
      if (currentGroup.length > 0) {
        groups.push({
          id: nanoid(),
          actions: currentGroup,
          description: generateGroupDescription(currentGroup),
          timestamp: currentGroup[0].timestamp,
        });
      }
      currentGroup = [action];
    }

    lastTimestamp = action.timestamp;
  }

  // Add final group
  if (currentGroup.length > 0) {
    groups.push({
      id: nanoid(),
      actions: currentGroup,
      description: generateGroupDescription(currentGroup),
      timestamp: currentGroup[0].timestamp,
    });
  }

  return groups;
};

/**
 * Check if two actions are related
 */
const areActionsRelated = (action1: DrawingAction, action2: DrawingAction): boolean => {
  // Same type of action
  if (action1.type === action2.type) return true;

  // Actions affecting the same elements
  const action1Elements = action1.metadata?.nodeIds || action1.metadata?.edgeIds || [];
  const action2Elements = action2.metadata?.nodeIds || action2.metadata?.edgeIds || [];

  if (action1Elements.some(id => action2Elements.includes(id))) return true;

  // Movement actions are related
  const movementTypes = ['move', 'position', 'drag'];
  const isAction1Movement = movementTypes.some(type => action1.type.toLowerCase().includes(type));
  const isAction2Movement = movementTypes.some(type => action2.type.toLowerCase().includes(type));

  return isAction1Movement && isAction2Movement;
};

/**
 * Generate description for action group
 */
const generateGroupDescription = (actions: DrawingAction[]): string => {
  if (actions.length === 1) return actions[0].description;

  const actionTypes = [...new Set(actions.map(a => a.type))];

  if (actionTypes.length === 1) {
    return `${actionTypes[0]} (${actions.length} actions)`;
  }

  if (actionTypes.every(type => type.toLowerCase().includes('move'))) {
    return `Move elements (${actions.length} actions)`;
  }

  if (actionTypes.every(type => type.toLowerCase().includes('add'))) {
    return `Add elements (${actions.length} actions)`;
  }

  return `Mixed operations (${actions.length} actions)`;
};

// === DEBOUNCED UTILITIES ===

/**
 * Create debounced state validation
 */
export const createDebouncedValidation = (validateFn: () => void, delay: number = 1000) => {
  return debounce(validateFn, delay, { leading: false, trailing: true });
};

/**
 * Create debounced state persistence
 */
export const createDebouncedPersistence = (persistFn: () => void, delay: number = 5000) => {
  return debounce(persistFn, delay, { leading: false, trailing: true });
};

/**
 * Create throttled performance monitoring
 */
export const createThrottledPerformanceMonitoring = (monitorFn: () => void, delay: number = 10000) => {
  return debounce(monitorFn, delay, { leading: true, trailing: false });
};

export default {
  calculateDrawingDiff,
  mergeDrawingStates,
  validateDrawingState,
  calculatePerformanceMetrics,
  calculateStateSize,
  optimizeState,
  groupActions,
  createDebouncedValidation,
  createDebouncedPersistence,
  createThrottledPerformanceMonitoring,
};