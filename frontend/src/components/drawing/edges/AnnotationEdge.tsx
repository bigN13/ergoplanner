'use client';

import React, { memo } from 'react';
import {
  EdgeProps,
  getStraightPath,
  EdgeLabelRenderer,
  BaseEdge,
} from 'reactflow';
import { cn } from '@/lib/utils';

interface AnnotationEdgeData {
  label?: string;
  color?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  arrowType?: 'none' | 'arrow' | 'double' | 'diamond';
  locked?: boolean;
  layer?: string;
  metadata?: Record<string, any>;
}

export const AnnotationEdge: React.FC<EdgeProps<AnnotationEdgeData>> = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
  markerStart,
  style,
}) => {
  const isLocked = data?.locked || false;
  const color = data?.color || '#6b7280';
  const strokeWidth = data?.strokeWidth || 2;
  const strokeStyle = data?.strokeStyle || 'solid';
  const arrowType = data?.arrowType || 'arrow';

  // Calculate edge path
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  // Get stroke dash array based on style
  const getStrokeDashArray = () => {
    switch (strokeStyle) {
      case 'dashed':
        return '8,4';
      case 'dotted':
        return '2,3';
      default:
        return undefined;
    }
  };

  // Custom markers for different arrow types
  const CustomMarkers = () => (
    <defs>
      {/* Standard arrow */}
      <marker
        id={`annotation-arrow-${id}`}
        viewBox="0 0 10 10"
        refX="8"
        refY="3"
        markerWidth="6"
        markerHeight="6"
        orient="auto"
      >
        <path
          d="M0,0 L0,6 L9,3 z"
          fill={color}
        />
      </marker>

      {/* Double arrow */}
      <marker
        id={`annotation-double-${id}`}
        viewBox="0 0 16 10"
        refX="14"
        refY="3"
        markerWidth="8"
        markerHeight="6"
        orient="auto"
      >
        <path
          d="M0,0 L0,6 L6,3 z M7,0 L7,6 L13,3 z"
          fill={color}
        />
      </marker>

      {/* Diamond */}
      <marker
        id={`annotation-diamond-${id}`}
        viewBox="0 0 10 10"
        refX="5"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto"
      >
        <path
          d="M0,5 L5,0 L10,5 L5,10 z"
          fill={color}
          stroke={color}
          strokeWidth="1"
        />
      </marker>

      {/* Start markers for double arrows */}
      <marker
        id={`annotation-start-arrow-${id}`}
        viewBox="0 0 10 10"
        refX="2"
        refY="3"
        markerWidth="6"
        markerHeight="6"
        orient="auto"
      >
        <path
          d="M10,0 L10,6 L1,3 z"
          fill={color}
        />
      </marker>
    </defs>
  );

  // Get appropriate markers based on arrow type
  const getMarkers = () => {
    switch (arrowType) {
      case 'none':
        return { markerEnd: undefined, markerStart: undefined };
      case 'arrow':
        return { markerEnd: `url(#annotation-arrow-${id})`, markerStart: undefined };
      case 'double':
        return {
          markerEnd: `url(#annotation-arrow-${id})`,
          markerStart: `url(#annotation-start-arrow-${id})`
        };
      case 'diamond':
        return { markerEnd: `url(#annotation-diamond-${id})`, markerStart: undefined };
      default:
        return { markerEnd, markerStart };
    }
  };

  const markers = getMarkers();

  return (
    <>
      <CustomMarkers />

      {/* Main annotation line */}
      <BaseEdge
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: selected ? strokeWidth + 1 : strokeWidth,
          strokeDasharray: getStrokeDashArray(),
          filter: selected ? 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))' : undefined,
          opacity: isLocked ? 0.6 : 1,
          ...style,
        }}
      />

      {/* Edge label */}
      <EdgeLabelRenderer>
        {data?.label && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className={cn(
              'bg-white bg-opacity-95 border border-gray-300 rounded px-2 py-1 text-xs shadow-sm max-w-xs',
              selected && 'ring-2 ring-blue-400 ring-offset-1',
              isLocked && 'opacity-60'
            )}
          >
            <div
              className="font-medium whitespace-pre-wrap text-center"
              style={{ color }}
            >
              {data.label}
            </div>
          </div>
        )}

        {/* Lock indicator */}
        {isLocked && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX + 30}px,${labelY - 30}px)`,
              pointerEvents: 'none',
            }}
            className="w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
          >
            🔒
          </div>
        )}

        {/* Annotation type indicator */}
        {selected && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX - 40}px,${labelY - 30}px)`,
              pointerEvents: 'none',
            }}
            className="text-xs text-gray-500 bg-gray-100 px-1 rounded"
          >
            📝
          </div>
        )}

        {/* Style preview (when selected) */}
        {selected && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY + 30}px)`,
              pointerEvents: 'none',
            }}
            className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded flex items-center gap-2"
          >
            <div className="flex items-center gap-1">
              <div
                className="w-8 h-px"
                style={{
                  backgroundColor: color,
                  borderTop: `${strokeWidth}px ${strokeStyle} ${color}`,
                }}
              />
              <span>{arrowType}</span>
            </div>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
});

AnnotationEdge.displayName = 'AnnotationEdge';

// Export with default data creation helper
export default AnnotationEdge;

// Helper to create default annotation edge data
export const createAnnotationEdgeData = (overrides: Partial<AnnotationEdgeData> = {}): AnnotationEdgeData => ({
  edgeType: 'annotation' as any,
  annotationType: 'callout',
  text: 'Annotation',
  arrowType: 'end',
  style: {
    strokeDasharray: '5,5',
    strokeWidth: 2,
    color: '#6b7280',
    fontSize: 12,
    fontFamily: 'Arial',
  },
  locked: false,
  layer: 'default',
  label: '',
  waypoints: [],
  manuallyAdjusted: false,
  crossings: [],
  zIndex: 1,
  visible: true,
  selectable: true,
  routingAlgorithm: RoutingAlgorithm.STRAIGHT,
  metadata: {},
  ...overrides,
});