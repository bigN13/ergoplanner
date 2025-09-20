'use client';

import React, { memo } from 'react';
import {
  EdgeProps,
  getSmoothStepPath,
  EdgeLabelRenderer,
  BaseEdge,
} from 'reactflow';
import { cn } from '@/lib/utils';

interface PipeEdgeData {
  pipeType?: string;
  diameter?: number;
  pressure?: number;
  flow?: number;
  material?: string;
  locked?: boolean;
  layer?: string;
  label?: string;
  showFlow?: boolean;
  flowDirection?: 'forward' | 'reverse';
  metadata?: Record<string, any>;
}

export const PipeEdge: React.FC<EdgeProps<PipeEdgeData>> = memo(({
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
  const pipeType = data?.pipeType || 'standard';
  const diameter = data?.diameter || 50;
  const showFlow = data?.showFlow || false;
  const flowDirection = data?.flowDirection || 'forward';

  // Calculate edge path
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 10,
  });

  // Get pipe styling based on type and properties
  const getPipeStyle = () => {
    const baseStyle = {
      strokeWidth: Math.max(2, Math.min(diameter / 10, 8)),
      stroke: '#6b7280',
    };

    switch (pipeType) {
      case 'water':
        return {
          ...baseStyle,
          stroke: '#3b82f6',
          strokeDasharray: undefined,
        };
      case 'gas':
        return {
          ...baseStyle,
          stroke: '#f59e0b',
          strokeDasharray: '5,5',
        };
      case 'steam':
        return {
          ...baseStyle,
          stroke: '#ef4444',
          strokeDasharray: '2,2',
        };
      case 'chemical':
        return {
          ...baseStyle,
          stroke: '#8b5cf6',
          strokeDasharray: '8,3,2,3',
        };
      case 'electrical':
        return {
          ...baseStyle,
          stroke: '#10b981',
          strokeWidth: 2,
        };
      default:
        return baseStyle;
    }
  };

  const pipeStyle = getPipeStyle();

  // Flow animation markers
  const FlowMarkers = () => {
    if (!showFlow) return null;

    const isReverse = flowDirection === 'reverse';
    const animationDirection = isReverse ? 'reverse' : 'normal';

    return (
      <defs>
        <marker
          id={`flow-marker-${id}`}
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="4"
          markerHeight="4"
          orient="auto"
        >
          <polygon
            points="0,0 10,5 0,10"
            fill={pipeStyle.stroke}
            opacity="0.6"
          />
        </marker>

        {/* Animated flow indicators */}
        <g id={`flow-animation-${id}`}>
          {[0, 1, 2].map((index) => (
            <circle
              key={index}
              r="2"
              fill={pipeStyle.stroke}
              opacity="0.7"
            >
              <animateMotion
                dur="2s"
                repeatCount="indefinite"
                begin={`${index * 0.6}s`}
                rotate="auto"
                path={edgePath}
                style={{ animationDirection }}
              />
            </circle>
          ))}
        </g>
      </defs>
    );
  };

  // Pressure indicator color
  const getPressureColor = () => {
    if (!data?.pressure) return undefined;

    if (data.pressure > 100) return '#ef4444'; // High pressure - red
    if (data.pressure > 50) return '#f59e0b';  // Medium pressure - yellow
    return '#10b981'; // Low pressure - green
  };

  const pressureColor = getPressureColor();

  return (
    <>
      <defs>
        <FlowMarkers />
      </defs>

      {/* Main pipe line */}
      <BaseEdge
        path={edgePath}
        style={{
          ...pipeStyle,
          ...style,
          strokeWidth: selected ? pipeStyle.strokeWidth + 2 : pipeStyle.strokeWidth,
          filter: selected ? 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.5))' : undefined,
          opacity: isLocked ? 0.6 : 1,
        }}
      />

      {/* Pressure indicator line (if pressure data exists) */}
      {pressureColor && (
        <BaseEdge
          path={edgePath}
          style={{
            stroke: pressureColor,
            strokeWidth: 1,
            strokeDasharray: '3,3',
            opacity: 0.7,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Flow animation overlay */}
      {showFlow && (
        <use href={`#flow-animation-${id}`} />
      )}

      {/* Edge label */}
      <EdgeLabelRenderer>
        {(data?.label || data?.diameter || data?.pressure) && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className={cn(
              'bg-white bg-opacity-90 border border-gray-300 rounded px-2 py-1 text-xs shadow-sm',
              selected && 'ring-2 ring-blue-400 ring-offset-1',
              isLocked && 'opacity-60'
            )}
          >
            {/* Pipe label */}
            {data?.label && (
              <div className="font-medium text-gray-900">{data.label}</div>
            )}

            {/* Pipe specifications */}
            <div className="text-gray-600 space-y-1">
              {data?.diameter && (
                <div>⌀ {data.diameter}mm</div>
              )}
              {data?.pressure && (
                <div style={{ color: pressureColor }}>
                  {data.pressure} bar
                </div>
              )}
              {data?.flow && (
                <div>
                  {data.flow} L/min
                  {showFlow && (
                    <span className="ml-1">
                      {flowDirection === 'forward' ? '→' : '←'}
                    </span>
                  )}
                </div>
              )}
              {data?.material && (
                <div>{data.material}</div>
              )}
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
      </EdgeLabelRenderer>
    </>
  );
});

PipeEdge.displayName = 'PipeEdge';

export default PipeEdge;