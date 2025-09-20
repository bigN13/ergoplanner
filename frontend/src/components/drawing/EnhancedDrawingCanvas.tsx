/**
 * Enhanced Drawing Canvas with State Management Integration
 * TASK-022: Redux State for Drawings
 */

'use client';

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  useReactFlow,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Enhanced drawing hooks
import {
  useDrawing,
  useDrawingHistory,
  useDrawingUpdate,
  useDrawingSelection,
  useDrawingCollaboration,
  useDrawingValidation,
  useDrawingPerformance,
  useDrawingKeyboardShortcuts,
} from '@/store/hooks/drawingHooks';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Icons
import {
  Undo2,
  Redo2,
  Save,
  AlertTriangle,
  CheckCircle,
  Users,
  Lock,
  Zap,
  Grid3X3,
  Settings,
  Camera,
} from 'lucide-react';

// Types
import type { ReactFlowData } from '@/types';

interface EnhancedDrawingCanvasProps {
  drawingId?: string;
  readOnly?: boolean;
  showCollaboration?: boolean;
  showPerformanceMetrics?: boolean;
  onDrawingChange?: (data: ReactFlowData) => void;
}

/**
 * Collaboration cursors overlay
 */
const CollaborationOverlay: React.FC = () => {
  const { cursors } = useDrawingCollaboration();

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {cursors.map((cursor) => (
        <div
          key={cursor.userId}
          className="absolute transform -translate-x-1 -translate-y-1 pointer-events-none"
          style={{
            left: cursor.position.x,
            top: cursor.position.y,
          }}
        >
          <div
            className="w-4 h-4 border-2 border-white rounded-full shadow-lg"
            style={{ backgroundColor: cursor.color }}
          />
          <div
            className="mt-1 px-2 py-1 text-xs text-white rounded shadow-lg whitespace-nowrap"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.userName}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Performance metrics panel
 */
const PerformancePanel: React.FC = () => {
  const { metrics, health, performanceScore } = useDrawingPerformance();

  const scoreColor = useMemo(() => {
    if (performanceScore >= 80) return 'text-green-600';
    if (performanceScore >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }, [performanceScore]);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-4 h-4" />
        <span className="font-medium text-sm">Performance</span>
        <Badge variant="secondary" className={scoreColor}>
          {performanceScore}%
        </Badge>
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span>State Size:</span>
          <span>{metrics.stateSizeFormatted}</span>
        </div>
        <div className="flex justify-between">
          <span>Update Time:</span>
          <span>{metrics.lastUpdateDuration.toFixed(1)}ms</span>
        </div>
        <div className="flex justify-between">
          <span>Actions:</span>
          <span>{metrics.actionCount}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Validation panel
 */
const ValidationPanel: React.FC = () => {
  const { validationErrors, hasErrors, hasWarnings } = useDrawingValidation();

  if (!hasErrors && !hasWarnings) {
    return (
      <div className="bg-green-50/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span className="font-medium text-sm">Valid</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-orange-500" />
        <span className="font-medium text-sm">Issues</span>
        <Badge variant="destructive">
          {validationErrors.length}
        </Badge>
      </div>
      <div className="space-y-1 text-xs max-h-32 overflow-y-auto">
        {validationErrors.slice(0, 5).map((error) => (
          <div key={error.id} className="text-orange-600">
            {error.message}
          </div>
        ))}
        {validationErrors.length > 5 && (
          <div className="text-gray-500">
            +{validationErrors.length - 5} more...
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Collaboration panel
 */
const CollaborationPanel: React.FC = () => {
  const { cursors, locks } = useDrawingCollaboration();

  const activeCursors = cursors.filter(cursor => cursor.isActive);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <Users className="w-4 h-4" />
        <span className="font-medium text-sm">Collaborators</span>
        <Badge variant="secondary">
          {activeCursors.length}
        </Badge>
      </div>
      <div className="space-y-1">
        {activeCursors.map((cursor) => (
          <div key={cursor.userId} className="flex items-center gap-2 text-xs">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: cursor.color }}
            />
            <span>{cursor.userName}</span>
          </div>
        ))}
        {locks.length > 0 && (
          <div className="mt-2 pt-2 border-t">
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Lock className="w-3 h-3" />
              <span>{locks.length} elements locked</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Toolbar component
 */
const DrawingToolbar: React.FC = () => {
  const { canUndo, canRedo, undo, redo } = useDrawingHistory();
  const { copy, paste } = useDrawingSelection();
  const { autoSaveStatus } = useDrawingPerformance();

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={undo}
                disabled={!canUndo}
                className="h-8 w-8 p-0"
              >
                <Undo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={redo}
                disabled={!canRedo}
                className="h-8 w-8 p-0"
              >
                <Redo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="w-px h-6 bg-gray-300" />

        <div className="flex items-center gap-1 text-xs">
          <Save className={`w-3 h-3 ${autoSaveStatus.isSaving ? 'animate-spin' : ''}`} />
          <span className="text-gray-600">
            {autoSaveStatus.isSaving ? 'Saving...' : 'Saved'}
          </span>
        </div>

        {autoSaveStatus.saveError && (
          <Badge variant="destructive" className="text-xs">
            Save Error
          </Badge>
        )}
      </div>
    </div>
  );
};

/**
 * Main canvas component
 */
const DrawingCanvasInner: React.FC<EnhancedDrawingCanvasProps> = ({
  drawingId,
  readOnly = false,
  showCollaboration = true,
  showPerformanceMetrics = false,
  onDrawingChange,
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();

  // Enhanced drawing hooks
  const { currentDrawing, reactFlowData, loadDrawing } = useDrawing(drawingId);
  const { updateData, updateNodes, updateEdges } = useDrawingUpdate();
  const { selection, setSelection } = useDrawingSelection();
  const { updateCursor, isElementLocked } = useDrawingCollaboration();

  // Use ReactFlow state management with sync to Redux
  const [nodes, setNodes, onNodesChange] = useNodesState(reactFlowData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(reactFlowData.edges);

  // Sync ReactFlow state with Redux state
  useEffect(() => {
    setNodes(reactFlowData.nodes);
    setEdges(reactFlowData.edges);
  }, [reactFlowData.nodes, reactFlowData.edges, setNodes, setEdges]);

  // Handle nodes change with Redux update
  const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(changes);

    // Update Redux state after a small delay to batch changes
    setTimeout(() => {
      const newNodes = changes.reduce((acc, change) => {
        if (change.type === 'position' && change.dragging === false) {
          return acc.map(node =>
            node.id === change.id
              ? { ...node, position: change.position }
              : node
          );
        }
        return acc;
      }, nodes);

      updateNodes(newNodes, 'Move nodes');
    }, 100);
  }, [onNodesChange, nodes, updateNodes]);

  // Handle edges change with Redux update
  const handleEdgesChange = useCallback((changes: any[]) => {
    onEdgesChange(changes);

    setTimeout(() => {
      updateEdges(edges, 'Update edges');
    }, 100);
  }, [onEdgesChange, edges, updateEdges]);

  // Handle connection creation
  const onConnect = useCallback((params: Connection) => {
    const newEdge: Edge = {
      id: `edge-${Date.now()}`,
      source: params.source!,
      target: params.target!,
      sourceHandle: params.sourceHandle,
      targetHandle: params.targetHandle,
    };

    const newEdges = addEdge(newEdge, edges);
    setEdges(newEdges);
    updateEdges(newEdges, 'Add edge');
  }, [edges, setEdges, updateEdges]);

  // Handle mouse move for collaboration
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!showCollaboration) return;

    const bounds = reactFlowWrapper.current?.getBoundingClientRect();
    if (bounds && reactFlowInstance) {
      const position = reactFlowInstance.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
      updateCursor(position);
    }
  }, [showCollaboration, reactFlowInstance, updateCursor]);

  // Handle selection change
  const handleSelectionChange = useCallback((params: {
    nodes: Node[];
    edges: Edge[];
  }) => {
    setSelection({
      nodes: params.nodes.map(n => n.id),
      edges: params.edges.map(e => e.id),
    });
  }, [setSelection]);

  // Handle viewport change
  const handleViewportChange = useCallback((viewport: any) => {
    updateData(
      { ...reactFlowData, viewport },
      'Update viewport',
      { skipHistory: true, syncToServer: false }
    );
  }, [reactFlowData, updateData]);

  // Setup keyboard shortcuts
  useDrawingKeyboardShortcuts();

  // Notify parent of changes
  useEffect(() => {
    if (onDrawingChange) {
      onDrawingChange({ nodes, edges, viewport: reactFlowData.viewport });
    }
  }, [nodes, edges, reactFlowData.viewport, onDrawingChange]);

  return (
    <div
      ref={reactFlowWrapper}
      className="relative w-full h-full"
      onMouseMove={handleMouseMove}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onSelectionChange={handleSelectionChange}
        onViewportChange={handleViewportChange}
        defaultViewport={reactFlowData.viewport}
        fitView
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
      >
        <Background color="#aaa" gap={16} />
        <Controls showInteractive={!readOnly} />
        <MiniMap
          nodeColor="#fbbf24"
          maskColor="rgb(240, 240, 240, 0.6)"
          position="bottom-right"
        />

        {/* Toolbar Panel */}
        <Panel position="top-left">
          <DrawingToolbar />
        </Panel>

        {/* Performance Panel */}
        {showPerformanceMetrics && (
          <Panel position="top-right">
            <div className="space-y-2">
              <PerformancePanel />
              <ValidationPanel />
            </div>
          </Panel>
        )}

        {/* Collaboration Panel */}
        {showCollaboration && (
          <Panel position="bottom-left">
            <CollaborationPanel />
          </Panel>
        )}
      </ReactFlow>

      {/* Collaboration Overlay */}
      {showCollaboration && <CollaborationOverlay />}
    </div>
  );
};

/**
 * Main Enhanced Drawing Canvas component
 */
export const EnhancedDrawingCanvas: React.FC<EnhancedDrawingCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <DrawingCanvasInner {...props} />
    </ReactFlowProvider>
  );
};

export default EnhancedDrawingCanvas;