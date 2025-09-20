/**
 * Multi-Select Tools Component - TASK-016 Implementation
 * Advanced selection tools with rectangle, lasso, and intelligent selection
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Square,
  Lasso,
  MousePointer2,
  Target,
  Layers,
  Filter,
  RotateCcw,
  Move,
  Copy,
  Trash2,
  Group,
  Ungroup,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/DropdownMenu';

import { SelectionMode, CanvasNode, CanvasEdge } from '@/types/canvas';
import { cn } from '@/lib/utils';

interface MultiSelectToolsProps {
  selectionMode: SelectionMode;
  selectedNodes: CanvasNode[];
  selectedEdges: CanvasEdge[];
  onSelectionModeChange: (mode: SelectionMode) => void;
  onSelectNodes: (nodeIds: string[]) => void;
  onSelectEdges: (edgeIds: string[]) => void;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onSelectSimilar: () => void;
  onSelectConnected: () => void;
  onInvertSelection: () => void;

  // Action callbacks
  onGroupSelection?: () => void;
  onUngroupSelection?: () => void;
  onCopySelection?: () => void;
  onDeleteSelection?: () => void;
  onMoveSelection?: () => void;

  // Canvas interaction
  canvasRef?: React.RefObject<HTMLElement>;
  disabled?: boolean;
  readonly?: boolean;
  className?: string;
}

interface SelectionRectangle {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  active: boolean;
}

interface LassoPoint {
  x: number;
  y: number;
}

export const MultiSelectTools: React.FC<MultiSelectToolsProps> = ({
  selectionMode,
  selectedNodes,
  selectedEdges,
  onSelectionModeChange,
  onSelectNodes,
  onSelectEdges,
  onClearSelection,
  onSelectAll,
  onSelectSimilar,
  onSelectConnected,
  onInvertSelection,
  onGroupSelection,
  onUngroupSelection,
  onCopySelection,
  onDeleteSelection,
  onMoveSelection,
  canvasRef,
  disabled = false,
  readonly = false,
  className,
}) => {
  // Local state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionRect, setSelectionRect] = useState<SelectionRectangle>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    active: false,
  });
  const [lassoPoints, setLassoPoints] = useState<LassoPoint[]>([]);
  const [showSelectionActions, setShowSelectionActions] = useState(false);

  // Refs
  const selectionOverlayRef = useRef<HTMLDivElement>(null);
  const lassoPathRef = useRef<SVGPathElement>(null);

  // Computed values
  const hasSelection = selectedNodes.length > 0 || selectedEdges.length > 0;
  const selectionCount = selectedNodes.length + selectedEdges.length;
  const hasMultipleSelection = selectionCount > 1;

  // Rectangle selection handlers
  const handleRectangleStart = useCallback((event: React.MouseEvent) => {
    if (disabled || selectionMode !== SelectionMode.RECTANGLE) return;

    const rect = canvasRef?.current?.getBoundingClientRect();
    if (!rect) return;

    const startX = event.clientX - rect.left;
    const startY = event.clientY - rect.top;

    setSelectionRect({
      startX,
      startY,
      currentX: startX,
      currentY: startY,
      active: true,
    });
    setIsSelecting(true);

    event.preventDefault();
  }, [disabled, selectionMode, canvasRef]);

  const handleRectangleMove = useCallback((event: React.MouseEvent) => {
    if (!isSelecting || selectionMode !== SelectionMode.RECTANGLE) return;

    const rect = canvasRef?.current?.getBoundingClientRect();
    if (!rect) return;

    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;

    setSelectionRect(prev => ({
      ...prev,
      currentX,
      currentY,
    }));
  }, [isSelecting, selectionMode, canvasRef]);

  const handleRectangleEnd = useCallback(() => {
    if (!isSelecting || selectionMode !== SelectionMode.RECTANGLE) return;

    // Calculate selection bounds
    const left = Math.min(selectionRect.startX, selectionRect.currentX);
    const top = Math.min(selectionRect.startY, selectionRect.currentY);
    const right = Math.max(selectionRect.startX, selectionRect.currentX);
    const bottom = Math.max(selectionRect.startY, selectionRect.currentY);

    // Find nodes within selection rectangle
    // This would integrate with the actual canvas nodes
    const selectedNodeIds: string[] = [];
    const selectedEdgeIds: string[] = [];

    // Example logic - would need actual node positions
    // nodes.forEach(node => {
    //   if (node.position.x >= left && node.position.x <= right &&
    //       node.position.y >= top && node.position.y <= bottom) {
    //     selectedNodeIds.push(node.id);
    //   }
    // });

    onSelectNodes(selectedNodeIds);
    onSelectEdges(selectedEdgeIds);

    setSelectionRect(prev => ({ ...prev, active: false }));
    setIsSelecting(false);
  }, [isSelecting, selectionMode, selectionRect, onSelectNodes, onSelectEdges]);

  // Lasso selection handlers
  const handleLassoStart = useCallback((event: React.MouseEvent) => {
    if (disabled || selectionMode !== SelectionMode.LASSO) return;

    const rect = canvasRef?.current?.getBoundingClientRect();
    if (!rect) return;

    const startX = event.clientX - rect.left;
    const startY = event.clientY - rect.top;

    setLassoPoints([{ x: startX, y: startY }]);
    setIsSelecting(true);

    event.preventDefault();
  }, [disabled, selectionMode, canvasRef]);

  const handleLassoMove = useCallback((event: React.MouseEvent) => {
    if (!isSelecting || selectionMode !== SelectionMode.LASSO) return;

    const rect = canvasRef?.current?.getBoundingClientRect();
    if (!rect) return;

    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;

    setLassoPoints(prev => [...prev, { x: currentX, y: currentY }]);
  }, [isSelecting, selectionMode, canvasRef]);

  const handleLassoEnd = useCallback(() => {
    if (!isSelecting || selectionMode !== SelectionMode.LASSO) return;

    // Find nodes within lasso path using point-in-polygon algorithm
    // This would integrate with actual canvas nodes
    const selectedNodeIds: string[] = [];
    const selectedEdgeIds: string[] = [];

    // Point-in-polygon algorithm implementation would go here
    // isPointInPolygon(point, lassoPoints)

    onSelectNodes(selectedNodeIds);
    onSelectEdges(selectedEdgeIds);

    setLassoPoints([]);
    setIsSelecting(false);
  }, [isSelecting, selectionMode, lassoPoints, onSelectNodes, onSelectEdges]);

  // Similar selection logic
  const handleSelectSimilar = useCallback(() => {
    if (disabled || selectedNodes.length === 0) return;

    // Find nodes with similar properties to the first selected node
    const referenceNode = selectedNodes[0];
    const similarNodeIds: string[] = [];

    // Example logic - would need actual node comparison
    // allNodes.forEach(node => {
    //   if (node.type === referenceNode.type &&
    //       node.data.componentType === referenceNode.data.componentType) {
    //     similarNodeIds.push(node.id);
    //   }
    // });

    onSelectNodes(similarNodeIds);
    onSelectSimilar();
  }, [disabled, selectedNodes, onSelectNodes, onSelectSimilar]);

  // Connected selection logic
  const handleSelectConnected = useCallback(() => {
    if (disabled || selectedNodes.length === 0) return;

    // Find all nodes connected to the selected nodes
    const connectedNodeIds: string[] = [];
    const connectedEdgeIds: string[] = [];

    // Traverse connections from selected nodes
    // This would use actual graph traversal logic

    onSelectNodes([...selectedNodes.map(n => n.id), ...connectedNodeIds]);
    onSelectEdges(connectedEdgeIds);
    onSelectConnected();
  }, [disabled, selectedNodes, onSelectNodes, onSelectEdges, onSelectConnected]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (disabled) return;

      // Selection shortcuts
      switch (event.key.toLowerCase()) {
        case 'a':
          if (event.ctrlKey) {
            event.preventDefault();
            onSelectAll();
          }
          break;
        case 'd':
          if (event.ctrlKey) {
            event.preventDefault();
            onClearSelection();
          }
          break;
        case 'i':
          if (event.ctrlKey) {
            event.preventDefault();
            onInvertSelection();
          }
          break;
        case 'escape':
          if (hasSelection) {
            event.preventDefault();
            onClearSelection();
          }
          break;
      }

      // Tool shortcuts
      if (!event.ctrlKey && !event.altKey && !event.shiftKey) {
        switch (event.key.toLowerCase()) {
          case 'v':
            onSelectionModeChange(SelectionMode.SINGLE);
            break;
          case 'm':
            onSelectionModeChange(SelectionMode.RECTANGLE);
            break;
          case 'l':
            onSelectionModeChange(SelectionMode.LASSO);
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    disabled,
    hasSelection,
    onSelectAll,
    onClearSelection,
    onInvertSelection,
    onSelectionModeChange,
  ]);

  // Mouse event handlers for canvas
  useEffect(() => {
    const canvas = canvasRef?.current;
    if (!canvas) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (selectionMode === SelectionMode.RECTANGLE) {
        handleRectangleStart(event as any);
      } else if (selectionMode === SelectionMode.LASSO) {
        handleLassoStart(event as any);
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (selectionMode === SelectionMode.RECTANGLE) {
        handleRectangleMove(event as any);
      } else if (selectionMode === SelectionMode.LASSO) {
        handleLassoMove(event as any);
      }
    };

    const handleMouseUp = () => {
      if (selectionMode === SelectionMode.RECTANGLE) {
        handleRectangleEnd();
      } else if (selectionMode === SelectionMode.LASSO) {
        handleLassoEnd();
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    canvasRef,
    selectionMode,
    handleRectangleStart,
    handleRectangleMove,
    handleRectangleEnd,
    handleLassoStart,
    handleLassoMove,
    handleLassoEnd,
  ]);

  // Render selection overlay
  const renderSelectionOverlay = () => {
    if (!isSelecting) return null;

    if (selectionMode === SelectionMode.RECTANGLE && selectionRect.active) {
      const left = Math.min(selectionRect.startX, selectionRect.currentX);
      const top = Math.min(selectionRect.startY, selectionRect.currentY);
      const width = Math.abs(selectionRect.currentX - selectionRect.startX);
      const height = Math.abs(selectionRect.currentY - selectionRect.startY);

      return (
        <div
          className="absolute pointer-events-none border-2 border-primary bg-primary/10 rounded"
          style={{
            left: `${left}px`,
            top: `${top}px`,
            width: `${width}px`,
            height: `${height}px`,
          }}
        />
      );
    }

    if (selectionMode === SelectionMode.LASSO && lassoPoints.length > 1) {
      const pathData = lassoPoints.reduce((path, point, index) => {
        return path + (index === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`);
      }, '') + ' Z';

      return (
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ width: '100%', height: '100%' }}
        >
          <path
            ref={lassoPathRef}
            d={pathData}
            fill="rgba(var(--primary), 0.1)"
            stroke="rgb(var(--primary))"
            strokeWidth="2"
            strokeDasharray="4 2"
          />
        </svg>
      );
    }

    return null;
  };

  // Render selection mode buttons
  const renderSelectionModeButtons = () => (
    <div className="flex items-center gap-1">
      <Tooltip content="Select tool (V)">
        <Button
          variant={selectionMode === SelectionMode.SINGLE ? "default" : "ghost"}
          size="sm"
          onClick={() => onSelectionModeChange(SelectionMode.SINGLE)}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <MousePointer2 className="h-4 w-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Rectangle select (M)">
        <Button
          variant={selectionMode === SelectionMode.RECTANGLE ? "default" : "ghost"}
          size="sm"
          onClick={() => onSelectionModeChange(SelectionMode.RECTANGLE)}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <Square className="h-4 w-4" />
        </Button>
      </Tooltip>

      <Tooltip content="Lasso select (L)">
        <Button
          variant={selectionMode === SelectionMode.LASSO ? "default" : "ghost"}
          size="sm"
          onClick={() => onSelectionModeChange(SelectionMode.LASSO)}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <Lasso className="h-4 w-4" />
        </Button>
      </Tooltip>
    </div>
  );

  // Render selection actions
  const renderSelectionActions = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={!hasSelection || disabled}
          className="h-8 px-3"
        >
          <Target className="h-4 w-4 mr-2" />
          Select
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={onSelectAll}>
          <MousePointer2 className="h-4 w-4 mr-2" />
          Select All (Ctrl+A)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onClearSelection}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Clear Selection (Ctrl+D)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onInvertSelection}>
          <Filter className="h-4 w-4 mr-2" />
          Invert Selection (Ctrl+I)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSelectSimilar}
          disabled={selectedNodes.length === 0}
        >
          <Layers className="h-4 w-4 mr-2" />
          Select Similar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleSelectConnected}
          disabled={selectedNodes.length === 0}
        >
          <Target className="h-4 w-4 mr-2" />
          Select Connected
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Render selected object actions
  const renderObjectActions = () => {
    if (!hasSelection) return null;

    return (
      <div className="flex items-center gap-1">
        <Separator orientation="vertical" className="h-6" />

        <Tooltip content="Move selection (G)">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMoveSelection}
            disabled={disabled || readonly}
            className="h-8 w-8 p-0"
          >
            <Move className="h-4 w-4" />
          </Button>
        </Tooltip>

        <Tooltip content="Copy selection (Ctrl+C)">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCopySelection}
            disabled={disabled}
            className="h-8 w-8 p-0"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </Tooltip>

        <Tooltip content="Delete selection (Del)">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDeleteSelection}
            disabled={disabled || readonly}
            className="h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </Tooltip>

        {hasMultipleSelection && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <Tooltip content="Group selection (Ctrl+G)">
              <Button
                variant="ghost"
                size="sm"
                onClick={onGroupSelection}
                disabled={disabled || readonly}
                className="h-8 w-8 p-0"
              >
                <Group className="h-4 w-4" />
              </Button>
            </Tooltip>
          </>
        )}

        {selectedNodes.some(node => node.type === 'group') && (
          <Tooltip content="Ungroup selection (Ctrl+Shift+G)">
            <Button
              variant="ghost"
              size="sm"
              onClick={onUngroupSelection}
              disabled={disabled || readonly}
              className="h-8 w-8 p-0"
            >
              <Ungroup className="h-4 w-4" />
            </Button>
          </Tooltip>
        )}
      </div>
    );
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Selection mode buttons */}
      {renderSelectionModeButtons()}

      {/* Selection actions dropdown */}
      {renderSelectionActions()}

      {/* Selection count indicator */}
      {hasSelection && (
        <Badge variant="secondary" className="text-xs">
          {selectionCount} selected
        </Badge>
      )}

      {/* Object actions */}
      {renderObjectActions()}

      {/* Selection overlay */}
      {canvasRef?.current && (
        <div
          ref={selectionOverlayRef}
          className="absolute inset-0 pointer-events-none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
          }}
        >
          {renderSelectionOverlay()}
        </div>
      )}
    </div>
  );
};