'use client';

import React, { useCallback, useRef, useMemo, useEffect, useState } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  ReactFlowInstance,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  Panel,
  SelectionMode,
  OnSelectionChangeParams,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  OnMove,
  NodeChange,
  EdgeChange,
  MarkerType,
  ConnectionLineType,
} from 'reactflow';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  updateNodes,
  updateEdges,
  setViewport,
  setSelectedNodes,
  setSelectedEdges,
  updateReactFlowData,
  selectReactFlowData,
  selectGrid,
  selectCanUndo,
  selectCanRedo,
  undo,
  redo,
} from '@/store/slices/drawingSlice';
import { CanvasNode, CanvasEdge, CanvasTool, CanvasMode } from '@/types/canvas';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { CanvasToolbar } from './CanvasToolbar';
import { CanvasContextMenu } from './CanvasContextMenu';
import { CanvasGrid } from './CanvasGrid';
import { SelectionBox } from './SelectionBox';
import { CollaborationOverlay } from './CollaborationOverlay';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';

// Import ReactFlow styles
import 'reactflow/dist/style.css';

interface DrawingCanvasProps {
  drawingId: string;
  mode?: CanvasMode;
  readonly?: boolean;
  className?: string;
  onReady?: (instance: ReactFlowInstance) => void;
  onError?: (error: Error) => void;
}

// Custom node types
const nodeTypes = {
  component: React.lazy(() => import('./nodes/ComponentNode')),
  annotation: React.lazy(() => import('./nodes/AnnotationNode')),
  group: React.lazy(() => import('./nodes/GroupNode')),
};

// Custom edge types
const edgeTypes = {
  pipe: React.lazy(() => import('./edges/PipeEdge')),
  signal: React.lazy(() => import('./edges/SignalEdge')),
  annotation: React.lazy(() => import('./edges/AnnotationEdge')),
};

const defaultEdgeOptions = {
  animated: false,
  type: 'pipe',
  markerEnd: {
    type: MarkerType.Arrow,
    width: 20,
    height: 20,
  },
};

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  drawingId,
  mode = CanvasMode.EDIT,
  readonly = false,
  className = '',
  onReady,
  onError,
}) => {
  const dispatch = useAppDispatch();
  const reactFlowData = useAppSelector(selectReactFlowData);
  const gridConfig = useAppSelector(selectGrid);
  const canUndo = useAppSelector(selectCanUndo);
  const canRedo = useAppSelector(selectCanRedo);

  // Local state
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [activeTool, setActiveTool] = useState<CanvasTool>(CanvasTool.SELECT);
  const [isInitialized, setIsInitialized] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; target: any } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const performanceRef = useRef({ lastUpdate: Date.now(), frameCount: 0 });

  // ReactFlow state management
  const [nodes, setNodes, onNodesChange] = useNodesState(reactFlowData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(reactFlowData.edges);

  // Performance monitoring
  const performance = usePerformanceMonitor({
    enabled: true,
    interval: 1000,
    onUpdate: (metrics) => {
      // Update performance metrics if needed
    },
  });

  // Keyboard shortcuts
  const shortcuts = useMemo(() => [
    {
      key: 'Delete',
      description: 'Delete selected elements',
      action: handleDeleteSelected,
      category: 'editing' as const,
    },
    {
      key: 'a',
      ctrlKey: true,
      description: 'Select all',
      action: handleSelectAll,
      category: 'selection' as const,
    },
    {
      key: 'z',
      ctrlKey: true,
      description: 'Undo',
      action: handleUndo,
      category: 'editing' as const,
    },
    {
      key: 'y',
      ctrlKey: true,
      description: 'Redo',
      action: handleRedo,
      category: 'editing' as const,
    },
    {
      key: 'c',
      ctrlKey: true,
      description: 'Copy',
      action: handleCopy,
      category: 'editing' as const,
    },
    {
      key: 'v',
      ctrlKey: true,
      description: 'Paste',
      action: handlePaste,
      category: 'editing' as const,
    },
    {
      key: 'Escape',
      description: 'Cancel current action',
      action: handleEscape,
      category: 'navigation' as const,
    },
  ], [canUndo, canRedo]);

  useKeyboardShortcuts(shortcuts, { enabled: !readonly });

  // Sync nodes and edges with Redux store
  useEffect(() => {
    if (JSON.stringify(nodes) !== JSON.stringify(reactFlowData.nodes)) {
      dispatch(updateNodes(nodes));
    }
  }, [nodes, dispatch]);

  useEffect(() => {
    if (JSON.stringify(edges) !== JSON.stringify(reactFlowData.edges)) {
      dispatch(updateEdges(edges));
    }
  }, [edges, dispatch]);

  // Sync Redux state with local state
  useEffect(() => {
    setNodes(reactFlowData.nodes);
    setEdges(reactFlowData.edges);
  }, [reactFlowData, setNodes, setEdges]);

  // ReactFlow initialization
  const onInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
    setIsInitialized(true);
    onReady?.(instance);

    // Set initial viewport
    if (reactFlowData.viewport) {
      instance.setViewport(reactFlowData.viewport);
    }
  }, [reactFlowData.viewport, onReady]);

  // Node change handlers
  const handleNodesChange: OnNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);

    // Update performance metrics
    performanceRef.current.lastUpdate = Date.now();
    performanceRef.current.frameCount++;
  }, [onNodesChange]);

  const handleEdgesChange: OnEdgesChange = useCallback((changes: EdgeChange[]) => {
    onEdgesChange(changes);
  }, [onEdgesChange]);

  // Connection handler
  const handleConnect: OnConnect = useCallback((connection: Connection) => {
    if (readonly) return;

    const newEdge = {
      ...connection,
      id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'pipe',
      animated: false,
      data: {
        pipeType: 'standard',
        layer: 'default',
      },
    };

    setEdges((eds) => addEdge(newEdge, eds));
  }, [readonly, setEdges]);

  // Selection change handler
  const handleSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    const selectedNodeIds = params.nodes.map(node => node.id);
    const selectedEdgeIds = params.edges.map(edge => edge.id);

    dispatch(setSelectedNodes(selectedNodeIds));
    dispatch(setSelectedEdges(selectedEdgeIds));
  }, [dispatch]);

  // Viewport change handler
  const handleMove: OnMove = useCallback((event, viewport) => {
    dispatch(setViewport(viewport));
  }, [dispatch]);

  // Context menu handlers
  const handleContextMenu = useCallback((event: React.MouseEvent, target?: any) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      target,
    });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Canvas action handlers
  function handleDeleteSelected() {
    if (readonly) return;

    const selectedNodes = nodes.filter(node => node.selected);
    const selectedEdges = edges.filter(edge => edge.selected);

    if (selectedNodes.length > 0 || selectedEdges.length > 0) {
      const remainingNodes = nodes.filter(node => !node.selected);
      const remainingEdges = edges.filter(edge => !edge.selected &&
        !selectedNodes.some(node => edge.source === node.id || edge.target === node.id));

      setNodes(remainingNodes);
      setEdges(remainingEdges);
    }
  }

  function handleSelectAll() {
    if (readonly) return;

    const allSelected = nodes.every(node => node.selected);
    setNodes((nds) =>
      nds.map((node) => ({ ...node, selected: !allSelected }))
    );
    setEdges((eds) =>
      eds.map((edge) => ({ ...edge, selected: !allSelected }))
    );
  }

  function handleUndo() {
    if (canUndo) {
      dispatch(undo());
    }
  }

  function handleRedo() {
    if (canRedo) {
      dispatch(redo());
    }
  }

  function handleCopy() {
    // Implement copy functionality
    const selectedNodes = nodes.filter(node => node.selected);
    const selectedEdges = edges.filter(edge => edge.selected);

    if (selectedNodes.length > 0 || selectedEdges.length > 0) {
      // Store in clipboard - will be implemented with clipboard slice
      console.log('Copy:', { nodes: selectedNodes, edges: selectedEdges });
    }
  }

  function handlePaste() {
    // Implement paste functionality
    console.log('Paste functionality - to be implemented');
  }

  function handleEscape() {
    setActiveTool(CanvasTool.SELECT);
    setContextMenu(null);
    setSelectionBox(null);
  }

  // Zoom and fit functions
  const zoomIn = useCallback(() => {
    reactFlowInstance?.zoomIn();
  }, [reactFlowInstance]);

  const zoomOut = useCallback(() => {
    reactFlowInstance?.zoomOut();
  }, [reactFlowInstance]);

  const fitView = useCallback(() => {
    reactFlowInstance?.fitView({ padding: 0.1 });
  }, [reactFlowInstance]);

  const resetView = useCallback(() => {
    reactFlowInstance?.setViewport({ x: 0, y: 0, zoom: 1 });
  }, [reactFlowInstance]);

  const centerView = useCallback(() => {
    if (nodes.length > 0) {
      reactFlowInstance?.fitView({ padding: 0.1 });
    } else {
      resetView();
    }
  }, [reactFlowInstance, nodes, resetView]);

  // Loading state
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600 dark:text-gray-300">Initializing canvas...</span>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div
        ref={canvasRef}
        className={`relative h-full w-full bg-white dark:bg-gray-900 ${className}`}
        onContextMenu={(e) => handleContextMenu(e)}
      >
        {/* Canvas Toolbar */}
        <CanvasToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          mode={mode}
          readonly={readonly}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onFitView={fitView}
          onResetView={resetView}
          onCenterView={centerView}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />

        {/* ReactFlow Canvas */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          onInit={onInit}
          onSelectionChange={handleSelectionChange}
          onMove={handleMove}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView={false}
          attributionPosition="bottom-left"
          proOptions={{ hideAttribution: true }}
          selectNodesOnDrag={false}
          selectionMode={SelectionMode.Partial}
          multiSelectionKeyCode="Shift"
          deleteKeyCode={readonly ? null : "Delete"}
          selectionKeyCode={null}
          snapToGrid={gridConfig.snapToGrid}
          snapGrid={[gridConfig.size, gridConfig.size]}
          connectionLineType={ConnectionLineType.SmoothStep}
          connectionLineStyle={{
            strokeWidth: 2,
            stroke: '#3b82f6',
          }}
          className="touch-none"
        >
          {/* Grid Background */}
          {gridConfig.visible && (
            <Background
              variant={BackgroundVariant.Dots}
              gap={gridConfig.size}
              size={1}
              color="#e5e7eb"
              className="opacity-50"
            />
          )}

          {/* Controls */}
          <Controls
            position="bottom-right"
            showZoom={true}
            showFitView={true}
            showInteractive={false}
            style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
            }}
          />

          {/* Minimap */}
          <MiniMap
            position="top-right"
            nodeColor={(node) => {
              if (node.selected) return '#3b82f6';
              return '#e5e7eb';
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
            style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
            }}
          />

          {/* Panels for additional UI */}
          <Panel position="top-left">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 border border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Nodes: {nodes.length} | Edges: {edges.length}
              </div>
            </div>
          </Panel>
        </ReactFlow>

        {/* Collaboration Overlay */}
        <CollaborationOverlay />

        {/* Context Menu */}
        {contextMenu && (
          <CanvasContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            target={contextMenu.target}
            onClose={handleCloseContextMenu}
            onAction={(action) => {
              // Handle context menu actions
              console.log('Context menu action:', action);
              handleCloseContextMenu();
            }}
          />
        )}

        {/* Selection Box */}
        {selectionBox && (
          <SelectionBox
            x={selectionBox.x}
            y={selectionBox.y}
            width={selectionBox.width}
            height={selectionBox.height}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

// Main component with ReactFlow provider
export const DrawingCanvasProvider: React.FC<DrawingCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <DrawingCanvas {...props} />
    </ReactFlowProvider>
  );
};

export default DrawingCanvasProvider;