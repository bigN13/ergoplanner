'use client';

import React, { memo, useMemo, useCallback } from 'react';
import {
  EdgeProps,
  getSmoothStepPath,
  EdgeLabelRenderer,
  BaseEdge,
  getSimpleBezierPath,
  getStraightPath,
  XYPosition,
} from 'reactflow';
import { cn } from '@/lib/utils';
import {
  PipeEdgeData,
  PipeType,
  FlowDirection,
  EdgeCrossing,
  Waypoint,
  RoutingAlgorithm,
} from '@/types/routing';
import { calculateEdgePath, getEdgeStyle } from '@/utils/routing/routingUtils';

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
  // Extract data with defaults
  const {
    pipeType = PipeType.WATER,
    diameter = 50,
    pressure = 6,
    flow = 100,
    temperature = 20,
    material = 'carbon_steel',
    schedule = 'SCH 40',
    insulation = false,
    tracing = false,
    flowDirection = FlowDirection.FORWARD,
    locked = false,
    label = '',
    waypoints = [],
    crossings = [],
    routingAlgorithm = RoutingAlgorithm.ORTHOGONAL,
    manuallyAdjusted = false,
    specifications,
    visible = true,
  } = data || {};

  const showFlow = flowDirection !== FlowDirection.NONE;

  // Calculate edge path based on routing algorithm and waypoints
  const { edgePath, labelX, labelY } = useMemo(() => {
    if (waypoints && waypoints.length > 0) {
      // Use custom path with waypoints
      const pathPoints = [
        { x: sourceX, y: sourceY },
        ...waypoints.map(wp => wp.position),
        { x: targetX, y: targetY },
      ];
      const customPath = calculateEdgePath(pathPoints);
      const midPoint = pathPoints[Math.floor(pathPoints.length / 2)];
      return {
        edgePath: customPath,
        labelX: midPoint.x,
        labelY: midPoint.y,
      };
    }

    // Use ReactFlow's built-in path calculation
    switch (routingAlgorithm) {
      case RoutingAlgorithm.STRAIGHT:
        const [straightPath, straightLabelX, straightLabelY] = getStraightPath({
          sourceX,
          sourceY,
          targetX,
          targetY,
        });
        return { edgePath: straightPath, labelX: straightLabelX, labelY: straightLabelY };

      case RoutingAlgorithm.BEZIER:
        const [bezierPath, bezierLabelX, bezierLabelY] = getSimpleBezierPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
        });
        return { edgePath: bezierPath, labelX: bezierLabelX, labelY: bezierLabelY };

      case RoutingAlgorithm.ORTHOGONAL:
      default:
        const [orthogonalPath, orthogonalLabelX, orthogonalLabelY] = getSmoothStepPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
          borderRadius: 10,
        });
        return { edgePath: orthogonalPath, labelX: orthogonalLabelX, labelY: orthogonalLabelY };
    }
  }, [sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, waypoints, routingAlgorithm]);

  // Get pipe styling using utility function
  const pipeStyle = useMemo(() => {
    const baseStyle = getEdgeStyle(data || {} as PipeEdgeData);
    return {
      ...baseStyle,
      strokeWidth: selected ? (baseStyle.strokeWidth as number) + 2 : baseStyle.strokeWidth,
      filter: selected ? 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.5))' : undefined,
      opacity: locked ? 0.6 : (visible ? 1 : 0.3),
    };
  }, [data, selected, locked, visible]);

  // Flow animation markers
  const FlowMarkers = useCallback(() => {
    if (!showFlow || flowDirection === FlowDirection.NONE) return null;

    const isReverse = flowDirection === FlowDirection.REVERSE;
    const isBidirectional = flowDirection === FlowDirection.BIDIRECTIONAL;
    const animationDirection = isReverse ? 'reverse' : 'normal';
    const animationSpeed = flow ? Math.max(1, 5 - flow / 50) : 2; // Faster for higher flow

    return (
      <defs>
        {/* Flow direction marker */}
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
            fill={pipeStyle.stroke as string}
            opacity="0.6"
          />
        </marker>

        {/* Bidirectional marker */}
        {isBidirectional && (
          <marker
            id={`flow-marker-reverse-${id}`}
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto"
          >
            <polygon
              points="10,0 0,5 10,10"
              fill={pipeStyle.stroke as string}
              opacity="0.6"
            />
          </marker>
        )}

        {/* Animated flow indicators */}
        <g id={`flow-animation-${id}`}>
          {[0, 1, 2].map((index) => (
            <circle
              key={index}
              r={Math.max(1, diameter / 25)}
              fill={pipeStyle.stroke as string}
              opacity="0.7"
            >
              <animateMotion
                dur={`${animationSpeed}s`}
                repeatCount="indefinite"
                begin={`${index * (animationSpeed / 3)}s`}
                rotate="auto"
                path={edgePath.replace(/^M/, '')}
                style={{ animationDirection }}
              />
            </circle>
          ))}
          {/* Bidirectional reverse animation */}
          {isBidirectional && [0, 1].map((index) => (
            <circle
              key={`reverse-${index}`}
              r={Math.max(1, diameter / 30)}
              fill={pipeStyle.stroke as string}
              opacity="0.5"
            >
              <animateMotion
                dur={`${animationSpeed * 1.2}s`}
                repeatCount="indefinite"
                begin={`${index * (animationSpeed / 2)}s`}
                rotate="auto"
                path={edgePath.replace(/^M/, '')}
                style={{ animationDirection: 'reverse' }}
              />
            </circle>
          ))}
        </g>
      </defs>
    );
  }, [showFlow, flowDirection, flow, diameter, id, edgePath, pipeStyle.stroke]);

  // Pressure and temperature indicators
  const getPressureColor = useCallback(() => {
    if (!pressure) return undefined;

    const maxRating = specifications?.maxPressure || 100;
    const ratio = pressure / maxRating;

    if (ratio > 0.9) return '#ef4444'; // Critical pressure - red
    if (ratio > 0.7) return '#f59e0b'; // High pressure - yellow
    if (ratio > 0.5) return '#f97316'; // Medium pressure - orange
    return '#10b981'; // Low pressure - green
  }, [pressure, specifications]);

  const getTemperatureColor = useCallback(() => {
    if (!temperature) return undefined;

    const maxTemp = specifications?.maxTemperature || 100;
    const ratio = temperature / maxTemp;

    if (ratio > 0.9) return '#dc2626'; // High temperature - dark red
    if (ratio > 0.7) return '#f59e0b'; // Elevated temperature - yellow
    return undefined; // Normal temperature
  }, [temperature, specifications]);

  const pressureColor = getPressureColor();
  const temperatureColor = getTemperatureColor();

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

      {/* Pressure indicator line */}
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

      {/* Temperature indicator line */}
      {temperatureColor && (
        <BaseEdge
          path={edgePath}
          style={{
            stroke: temperatureColor,
            strokeWidth: 0.5,
            strokeDasharray: '1,2',
            opacity: 0.5,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Insulation indicator */}
      {insulation && (
        <BaseEdge
          path={edgePath}
          style={{
            stroke: '#fbbf24',
            strokeWidth: (pipeStyle.strokeWidth as number) + 4,
            opacity: 0.3,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Tracing indicator */}
      {tracing && (
        <BaseEdge
          path={edgePath}
          style={{
            stroke: '#ef4444',
            strokeWidth: 1,
            strokeDasharray: '2,1',
            opacity: 0.6,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Flow animation overlay */}
      {showFlow && (
        <>
          <use href={`#flow-animation-${id}`} />
          {flowDirection === FlowDirection.BIDIRECTIONAL && (
            <use href={`#flow-animation-reverse-${id}`} />
          )}
        </>
      )}

      {/* Waypoints visualization */}
      {manuallyAdjusted && waypoints?.map((waypoint, index) => (
        <circle
          key={waypoint.id}
          cx={waypoint.position.x}
          cy={waypoint.position.y}
          r="4"
          fill="#3b82f6"
          stroke="white"
          strokeWidth="2"
          opacity={selected ? 0.8 : 0.4}
          className="cursor-pointer"
          style={{ pointerEvents: 'all' }}
        />
      ))}

      {/* Crossing indicators */}
      {crossings?.map((crossing) => (
        <g key={crossing.id}>
          {crossing.symbol === 'bridge' && (
            <>
              {/* Bridge symbol */}
              <path
                d={`M ${crossing.position.x - 8} ${crossing.position.y - 4}
                    Q ${crossing.position.x} ${crossing.position.y - 8}
                    ${crossing.position.x + 8} ${crossing.position.y - 4}`}
                fill="none"
                stroke={pipeStyle.stroke as string}
                strokeWidth="2"
              />
              <circle
                cx={crossing.position.x}
                cy={crossing.position.y}
                r="2"
                fill="white"
                stroke={pipeStyle.stroke as string}
                strokeWidth="1"
              />
            </>
          )}
          {crossing.symbol === 'break' && (
            <>
              {/* Break symbol */}
              <line
                x1={crossing.position.x - 6}
                y1={crossing.position.y - 6}
                x2={crossing.position.x + 6}
                y2={crossing.position.y + 6}
                stroke="white"
                strokeWidth="3"
              />
              <line
                x1={crossing.position.x - 6}
                y1={crossing.position.y + 6}
                x2={crossing.position.x + 6}
                y2={crossing.position.y - 6}
                stroke="white"
                strokeWidth="3"
              />
            </>
          )}
        </g>
      ))}

      {/* Edge label */}
      <EdgeLabelRenderer>
        {(label || diameter || pressure || flow || specifications) && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className={cn(
              'bg-white bg-opacity-95 border border-gray-300 rounded-lg px-3 py-2 text-xs shadow-lg',
              'backdrop-blur-sm transition-all duration-200',
              selected && 'ring-2 ring-blue-400 ring-offset-1 shadow-xl',
              locked && 'opacity-60'
            )}
          >
            {/* Pipe label */}
            {label && (
              <div className="font-semibold text-gray-900 mb-1">{label}</div>
            )}

            {/* Pipe type and size */}
            <div className="text-gray-700 space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium">⌀ {diameter}mm</span>
                {schedule && (
                  <span className="text-gray-500">{schedule}</span>
                )}
              </div>

              {/* Operating conditions */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {pressure && (
                  <div style={{ color: pressureColor }}>
                    <span className="text-gray-500">P:</span> {pressure} bar
                  </div>
                )}
                {temperature && (
                  <div style={{ color: temperatureColor }}>
                    <span className="text-gray-500">T:</span> {temperature}°C
                  </div>
                )}
                {flow && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Q:</span> {flow} L/min
                    {showFlow && (
                      <span className="ml-1">
                        {flowDirection === FlowDirection.FORWARD && '→'}
                        {flowDirection === FlowDirection.REVERSE && '←'}
                        {flowDirection === FlowDirection.BIDIRECTIONAL && '↔'}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Material and additional info */}
              {material && (
                <div className="text-gray-600 text-xs">
                  {material.replace('_', ' ').toUpperCase()}
                </div>
              )}

              {/* Special indicators */}
              <div className="flex space-x-1 text-xs">
                {insulation && (
                  <span className="bg-yellow-100 text-yellow-800 px-1 rounded">INS</span>
                )}
                {tracing && (
                  <span className="bg-red-100 text-red-800 px-1 rounded">TRC</span>
                )}
                {specifications?.standards && specifications.standards.length > 0 && (
                  <span className="bg-blue-100 text-blue-800 px-1 rounded">
                    {specifications.standards[0]}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Status indicators */}
        <div className="absolute flex space-x-1" style={{
          transform: `translate(-50%, -50%) translate(${labelX + 40}px,${labelY - 40}px)`,
        }}>
          {locked && (
            <div className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-md">
              🔒
            </div>
          )}
          {manuallyAdjusted && (
            <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs shadow-md">
              ✋
            </div>
          )}
          {crossings && crossings.length > 0 && (
            <div className="w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs shadow-md">
              ✕
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

PipeEdge.displayName = 'PipeEdge';

// Export with default data creation helper
export default PipeEdge;

// Helper to create default pipe edge data
export const createPipeEdgeData = (overrides: Partial<PipeEdgeData> = {}): PipeEdgeData => ({
  edgeType: 'pipe' as any,
  pipeType: PipeType.WATER,
  diameter: 50,
  pressure: 6,
  flow: 100,
  temperature: 20,
  material: 'carbon_steel',
  schedule: 'SCH 40',
  insulation: false,
  tracing: false,
  flowDirection: FlowDirection.FORWARD,
  locked: false,
  layer: 'default',
  label: '',
  waypoints: [],
  manuallyAdjusted: false,
  crossings: [],
  zIndex: 1,
  visible: true,
  selectable: true,
  routingAlgorithm: RoutingAlgorithm.ORTHOGONAL,
  metadata: {},
  ...overrides,
});