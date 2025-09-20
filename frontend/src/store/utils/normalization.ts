/**
 * State Normalization Utilities for Performance Optimization
 * TASK-022: Redux State for Drawings
 */

import { createEntityAdapter, EntityState, createSelector } from '@reduxjs/toolkit';
import { cloneDeep } from 'lodash-es';
import type { Drawing, Component, ReactFlowData } from '@/types';
import type {
  NormalizedDrawingState,
  DrawingSnapshot,
  DrawingTemplate,
  EnhancedDrawingState,
} from '@/types/drawing-state';

// Entity adapters for different data types
export const drawingAdapter = createEntityAdapter<Drawing>({
  selectId: (drawing) => drawing.id,
  sortComparer: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
});

export const componentAdapter = createEntityAdapter<Component>({
  selectId: (component) => component.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

export const snapshotAdapter = createEntityAdapter<DrawingSnapshot>({
  selectId: (snapshot) => snapshot.id,
  sortComparer: (a, b) => b.metadata.timestamp - a.metadata.timestamp,
});

export const templateAdapter = createEntityAdapter<DrawingTemplate>({
  selectId: (template) => template.id,
  sortComparer: (a, b) => b.usageCount - a.usageCount,
});

// Node and edge adapters for ReactFlow data
export const nodeAdapter = createEntityAdapter<any>({
  selectId: (node) => node.id,
  sortComparer: (a, b) => a.position.y - b.position.y || a.position.x - b.position.x,
});

export const edgeAdapter = createEntityAdapter<any>({
  selectId: (edge) => edge.id,
  sortComparer: (a, b) => a.source.localeCompare(b.source) || a.target.localeCompare(b.target),
});

// Layer adapter
export const layerAdapter = createEntityAdapter<any>({
  selectId: (layer) => layer.id,
  sortComparer: (a, b) => a.order - b.order,
});

/**
 * Normalize ReactFlow data for better performance
 */
export const normalizeReactFlowData = (data: ReactFlowData): {
  nodes: EntityState<any>;
  edges: EntityState<any>;
  nodeIds: string[];
  edgeIds: string[];
  viewport: ReactFlowData['viewport'];
} => {
  const normalizedNodes = nodeAdapter.addMany(nodeAdapter.getInitialState(), data.nodes);
  const normalizedEdges = edgeAdapter.addMany(edgeAdapter.getInitialState(), data.edges);

  return {
    nodes: normalizedNodes,
    edges: normalizedEdges,
    nodeIds: normalizedNodes.ids as string[],
    edgeIds: normalizedEdges.ids as string[],
    viewport: data.viewport,
  };
};

/**
 * Denormalize ReactFlow data back to original format
 */
export const denormalizeReactFlowData = (normalized: {
  nodes: EntityState<any>;
  edges: EntityState<any>;
  viewport: ReactFlowData['viewport'];
}): ReactFlowData => {
  const nodes = nodeAdapter.getSelectors().selectAll(normalized.nodes);
  const edges = edgeAdapter.getSelectors().selectAll(normalized.edges);

  return {
    nodes,
    edges,
    viewport: normalized.viewport,
  };
};

/**
 * Normalize drawing state for performance
 */
export const normalizeDrawingState = (
  drawings: Drawing[],
  components: Component[],
  snapshots: DrawingSnapshot[],
  templates: DrawingTemplate[]
): NormalizedDrawingState => {
  // Normalize entities
  const normalizedDrawings = drawingAdapter.addMany(drawingAdapter.getInitialState(), drawings);
  const normalizedComponents = componentAdapter.addMany(componentAdapter.getInitialState(), components);
  const normalizedSnapshots = snapshotAdapter.addMany(snapshotAdapter.getInitialState(), snapshots);
  const normalizedTemplates = templateAdapter.addMany(templateAdapter.getInitialState(), templates);

  // Build relationships
  const relationships = buildRelationships(drawings, components);

  // Normalize nodes and edges from drawings
  const allNodes: any[] = [];
  const allEdges: any[] = [];
  const allLayers: any[] = [];

  drawings.forEach(drawing => {
    allNodes.push(...drawing.reactFlowData.nodes.map(node => ({
      ...node,
      drawingId: drawing.id,
    })));
    allEdges.push(...drawing.reactFlowData.edges.map(edge => ({
      ...edge,
      drawingId: drawing.id,
    })));
  });

  const normalizedNodes = nodeAdapter.addMany(nodeAdapter.getInitialState(), allNodes);
  const normalizedEdges = edgeAdapter.addMany(edgeAdapter.getInitialState(), allEdges);
  const normalizedLayers = layerAdapter.addMany(layerAdapter.getInitialState(), allLayers);

  return {
    entities: {
      drawings: normalizedDrawings.entities,
      components: normalizedComponents.entities,
      nodes: normalizedNodes.entities,
      edges: normalizedEdges.entities,
      layers: normalizedLayers.entities,
      snapshots: normalizedSnapshots,
      templates: normalizedTemplates,
    },
    ids: {
      drawings: normalizedDrawings.ids as string[],
      components: normalizedComponents.ids as string[],
      nodes: normalizedNodes.ids as string[],
      edges: normalizedEdges.ids as string[],
      layers: normalizedLayers.ids as string[],
      snapshots: normalizedSnapshots.ids as string[],
      templates: normalizedTemplates.ids as string[],
    },
    relationships,
  };
};

/**
 * Build relationships between entities
 */
const buildRelationships = (drawings: Drawing[], components: Component[]) => {
  const relationships = {
    drawingComponents: {} as Record<string, string[]>,
    drawingNodes: {} as Record<string, string[]>,
    drawingEdges: {} as Record<string, string[]>,
    componentNodes: {} as Record<string, string>,
    nodeComponents: {} as Record<string, string>,
  };

  // Group components by drawing
  components.forEach(component => {
    if (!relationships.drawingComponents[component.drawingId]) {
      relationships.drawingComponents[component.drawingId] = [];
    }
    relationships.drawingComponents[component.drawingId].push(component.id);

    // Map component to node
    if (component.reactFlowNodeId) {
      relationships.componentNodes[component.id] = component.reactFlowNodeId;
      relationships.nodeComponents[component.reactFlowNodeId] = component.id;
    }
  });

  // Group nodes and edges by drawing
  drawings.forEach(drawing => {
    relationships.drawingNodes[drawing.id] = drawing.reactFlowData.nodes.map(node => node.id);
    relationships.drawingEdges[drawing.id] = drawing.reactFlowData.edges.map(edge => edge.id);
  });

  return relationships;
};

/**
 * Update normalized state efficiently
 */
export const updateNormalizedState = (
  currentState: NormalizedDrawingState,
  updates: {
    drawings?: Drawing[];
    components?: Component[];
    nodes?: any[];
    edges?: any[];
    snapshots?: DrawingSnapshot[];
    templates?: DrawingTemplate[];
  }
): NormalizedDrawingState => {
  const newState = cloneDeep(currentState);

  if (updates.drawings) {
    const updatedDrawings = drawingAdapter.upsertMany(
      { ids: newState.ids.drawings, entities: newState.entities.drawings },
      updates.drawings
    );
    newState.entities.drawings = updatedDrawings.entities;
    newState.ids.drawings = updatedDrawings.ids as string[];
  }

  if (updates.components) {
    const updatedComponents = componentAdapter.upsertMany(
      { ids: newState.ids.components, entities: newState.entities.components },
      updates.components
    );
    newState.entities.components = updatedComponents.entities;
    newState.ids.components = updatedComponents.ids as string[];

    // Update relationships
    updates.components.forEach(component => {
      if (!newState.relationships.drawingComponents[component.drawingId]) {
        newState.relationships.drawingComponents[component.drawingId] = [];
      }
      if (!newState.relationships.drawingComponents[component.drawingId].includes(component.id)) {
        newState.relationships.drawingComponents[component.drawingId].push(component.id);
      }

      if (component.reactFlowNodeId) {
        newState.relationships.componentNodes[component.id] = component.reactFlowNodeId;
        newState.relationships.nodeComponents[component.reactFlowNodeId] = component.id;
      }
    });
  }

  if (updates.nodes) {
    const updatedNodes = nodeAdapter.upsertMany(
      { ids: newState.ids.nodes, entities: newState.entities.nodes },
      updates.nodes
    );
    newState.entities.nodes = updatedNodes.entities;
    newState.ids.nodes = updatedNodes.ids as string[];
  }

  if (updates.edges) {
    const updatedEdges = edgeAdapter.upsertMany(
      { ids: newState.ids.edges, entities: newState.entities.edges },
      updates.edges
    );
    newState.entities.edges = updatedEdges.entities;
    newState.ids.edges = updatedEdges.ids as string[];
  }

  if (updates.snapshots) {
    newState.entities.snapshots = snapshotAdapter.upsertMany(
      newState.entities.snapshots,
      updates.snapshots
    );
  }

  if (updates.templates) {
    newState.entities.templates = templateAdapter.upsertMany(
      newState.entities.templates,
      updates.templates
    );
  }

  return newState;
};

/**
 * Remove entities from normalized state
 */
export const removeFromNormalizedState = (
  currentState: NormalizedDrawingState,
  removals: {
    drawingIds?: string[];
    componentIds?: string[];
    nodeIds?: string[];
    edgeIds?: string[];
    snapshotIds?: string[];
    templateIds?: string[];
  }
): NormalizedDrawingState => {
  const newState = cloneDeep(currentState);

  if (removals.drawingIds) {
    const updatedDrawings = drawingAdapter.removeMany(
      { ids: newState.ids.drawings, entities: newState.entities.drawings },
      removals.drawingIds
    );
    newState.entities.drawings = updatedDrawings.entities;
    newState.ids.drawings = updatedDrawings.ids as string[];

    // Clean up relationships
    removals.drawingIds.forEach(drawingId => {
      delete newState.relationships.drawingComponents[drawingId];
      delete newState.relationships.drawingNodes[drawingId];
      delete newState.relationships.drawingEdges[drawingId];
    });
  }

  if (removals.componentIds) {
    const updatedComponents = componentAdapter.removeMany(
      { ids: newState.ids.components, entities: newState.entities.components },
      removals.componentIds
    );
    newState.entities.components = updatedComponents.entities;
    newState.ids.components = updatedComponents.ids as string[];

    // Clean up relationships
    removals.componentIds.forEach(componentId => {
      const nodeId = newState.relationships.componentNodes[componentId];
      if (nodeId) {
        delete newState.relationships.nodeComponents[nodeId];
        delete newState.relationships.componentNodes[componentId];
      }

      // Remove from drawing components
      Object.keys(newState.relationships.drawingComponents).forEach(drawingId => {
        newState.relationships.drawingComponents[drawingId] =
          newState.relationships.drawingComponents[drawingId].filter(id => id !== componentId);
      });
    });
  }

  if (removals.nodeIds) {
    const updatedNodes = nodeAdapter.removeMany(
      { ids: newState.ids.nodes, entities: newState.entities.nodes },
      removals.nodeIds
    );
    newState.entities.nodes = updatedNodes.entities;
    newState.ids.nodes = updatedNodes.ids as string[];
  }

  if (removals.edgeIds) {
    const updatedEdges = edgeAdapter.removeMany(
      { ids: newState.ids.edges, entities: newState.entities.edges },
      removals.edgeIds
    );
    newState.entities.edges = updatedEdges.entities;
    newState.ids.edges = updatedEdges.ids as string[];
  }

  if (removals.snapshotIds) {
    newState.entities.snapshots = snapshotAdapter.removeMany(
      newState.entities.snapshots,
      removals.snapshotIds
    );
  }

  if (removals.templateIds) {
    newState.entities.templates = templateAdapter.removeMany(
      newState.entities.templates,
      removals.templateIds
    );
  }

  return newState;
};

/**
 * Get denormalized drawing data
 */
export const getDenormalizedDrawing = (
  normalizedState: NormalizedDrawingState,
  drawingId: string
): Drawing | null => {
  const drawing = normalizedState.entities.drawings[drawingId];
  if (!drawing) return null;

  // Get nodes and edges for this drawing
  const nodeIds = normalizedState.relationships.drawingNodes[drawingId] || [];
  const edgeIds = normalizedState.relationships.drawingEdges[drawingId] || [];

  const nodes = nodeIds
    .map(id => normalizedState.entities.nodes[id])
    .filter(Boolean);

  const edges = edgeIds
    .map(id => normalizedState.entities.edges[id])
    .filter(Boolean);

  // Get components for this drawing
  const componentIds = normalizedState.relationships.drawingComponents[drawingId] || [];
  const components = componentIds
    .map(id => normalizedState.entities.components[id])
    .filter(Boolean);

  return {
    ...drawing,
    reactFlowData: {
      nodes,
      edges,
      viewport: drawing.reactFlowData.viewport,
    },
    components,
  };
};

/**
 * Get performance-optimized selectors
 */
export const createNormalizedSelectors = () => {
  // Drawing selectors
  const selectDrawingState = (state: { enhancedDrawing: EnhancedDrawingState }) =>
    state.enhancedDrawing.normalized;

  const selectDrawingEntities = createSelector(
    [selectDrawingState],
    (normalizedState) => normalizedState.entities.drawings
  );

  const selectDrawingIds = createSelector(
    [selectDrawingState],
    (normalizedState) => normalizedState.ids.drawings
  );

  const selectAllDrawings = createSelector(
    [selectDrawingEntities, selectDrawingIds],
    (entities, ids) => ids.map(id => entities[id]).filter(Boolean)
  );

  // Component selectors
  const selectComponentEntities = createSelector(
    [selectDrawingState],
    (normalizedState) => normalizedState.entities.components
  );

  const selectComponentsByDrawing = createSelector(
    [selectDrawingState, (_, drawingId: string) => drawingId],
    (normalizedState, drawingId) => {
      const componentIds = normalizedState.relationships.drawingComponents[drawingId] || [];
      return componentIds
        .map(id => normalizedState.entities.components[id])
        .filter(Boolean);
    }
  );

  // Node selectors
  const selectNodeEntities = createSelector(
    [selectDrawingState],
    (normalizedState) => normalizedState.entities.nodes
  );

  const selectNodesByDrawing = createSelector(
    [selectDrawingState, (_, drawingId: string) => drawingId],
    (normalizedState, drawingId) => {
      const nodeIds = normalizedState.relationships.drawingNodes[drawingId] || [];
      return nodeIds
        .map(id => normalizedState.entities.nodes[id])
        .filter(Boolean);
    }
  );

  // Edge selectors
  const selectEdgeEntities = createSelector(
    [selectDrawingState],
    (normalizedState) => normalizedState.entities.edges
  );

  const selectEdgesByDrawing = createSelector(
    [selectDrawingState, (_, drawingId: string) => drawingId],
    (normalizedState, drawingId) => {
      const edgeIds = normalizedState.relationships.drawingEdges[drawingId] || [];
      return edgeIds
        .map(id => normalizedState.entities.edges[id])
        .filter(Boolean);
    }
  );

  // Relationship selectors
  const selectComponentByNodeId = createSelector(
    [selectDrawingState, (_, nodeId: string) => nodeId],
    (normalizedState, nodeId) => {
      const componentId = normalizedState.relationships.nodeComponents[nodeId];
      return componentId ? normalizedState.entities.components[componentId] : null;
    }
  );

  const selectNodeByComponentId = createSelector(
    [selectDrawingState, (_, componentId: string) => componentId],
    (normalizedState, componentId) => {
      const nodeId = normalizedState.relationships.componentNodes[componentId];
      return nodeId ? normalizedState.entities.nodes[nodeId] : null;
    }
  );

  return {
    selectDrawingState,
    selectDrawingEntities,
    selectDrawingIds,
    selectAllDrawings,
    selectComponentEntities,
    selectComponentsByDrawing,
    selectNodeEntities,
    selectNodesByDrawing,
    selectEdgeEntities,
    selectEdgesByDrawing,
    selectComponentByNodeId,
    selectNodeByComponentId,
  };
};

/**
 * Calculate normalized state statistics
 */
export const calculateNormalizedStateStats = (normalizedState: NormalizedDrawingState) => {
  return {
    drawings: {
      count: normalizedState.ids.drawings.length,
      entities: Object.keys(normalizedState.entities.drawings).length,
    },
    components: {
      count: normalizedState.ids.components.length,
      entities: Object.keys(normalizedState.entities.components).length,
    },
    nodes: {
      count: normalizedState.ids.nodes.length,
      entities: Object.keys(normalizedState.entities.nodes).length,
    },
    edges: {
      count: normalizedState.ids.edges.length,
      entities: Object.keys(normalizedState.entities.edges).length,
    },
    relationships: {
      drawingComponents: Object.keys(normalizedState.relationships.drawingComponents).length,
      componentNodes: Object.keys(normalizedState.relationships.componentNodes).length,
    },
    memoryUsage: {
      estimated: JSON.stringify(normalizedState).length,
      formattedSize: `${(JSON.stringify(normalizedState).length / 1024).toFixed(1)} KB`,
    },
  };
};

export default {
  normalizeReactFlowData,
  denormalizeReactFlowData,
  normalizeDrawingState,
  updateNormalizedState,
  removeFromNormalizedState,
  getDenormalizedDrawing,
  createNormalizedSelectors,
  calculateNormalizedStateStats,
  // Export adapters for external use
  drawingAdapter,
  componentAdapter,
  nodeAdapter,
  edgeAdapter,
  snapshotAdapter,
  templateAdapter,
  layerAdapter,
};