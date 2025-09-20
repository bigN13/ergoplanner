'use client';

import React, { memo, useMemo, useCallback } from 'react';
import {
  EdgeProps,
  getStraightPath,
  getSmoothStepPath,
  getSimpleBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
} from 'reactflow';
import { cn } from '@/lib/utils';
import {
  SignalEdgeData,
  SignalType,
  RoutingAlgorithm,
  EdgeCrossing,
  Waypoint,
} from '@/types/routing';
import { calculateEdgePath, getEdgeStyle } from '@/utils/routing/routingUtils';

export const SignalEdge: React.FC<EdgeProps<SignalEdgeData>> = memo(({
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
    signalType = SignalType.ANALOG_4_20MA,
    voltage = 24,
    current = 20,
    frequency = 50,
    protocol = '4-20mA',
    baudRate = 9600,
    cableType = 'instrumentation',
    shielded = true,
    twisted = true,
    powerRating = 10,
    signalRange = { min: 4, max: 20 },
    termination = '120ohm',
    locked = false,
    label = '',
    waypoints = [],
    crossings = [],
    routingAlgorithm = RoutingAlgorithm.ORTHOGONAL,
    manuallyAdjusted = false,
    visible = true,
  } = data || {};

  const showSignal = true;

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

    // Signals typically prefer straight paths for clarity
    switch (routingAlgorithm) {
      case RoutingAlgorithm.ORTHOGONAL:
        const [orthogonalPath, orthogonalLabelX, orthogonalLabelY] = getSmoothStepPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
          borderRadius: 5,
        });
        return { edgePath: orthogonalPath, labelX: orthogonalLabelX, labelY: orthogonalLabelY };

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

      case RoutingAlgorithm.STRAIGHT:
      default:
        const [straightPath, straightLabelX, straightLabelY] = getStraightPath({
          sourceX,
          sourceY,
          targetX,
          targetY,
        });
        return { edgePath: straightPath, labelX: straightLabelX, labelY: straightLabelY };
    }
  }, [sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, waypoints, routingAlgorithm]);

  // Get signal styling using utility function
  const signalStyle = useMemo(() => {
    const baseStyle = getEdgeStyle(data || {} as SignalEdgeData);
    return {
      ...baseStyle,
      strokeWidth: selected ? (baseStyle.strokeWidth as number) + 1 : baseStyle.strokeWidth,
      filter: selected ? 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.5))' : undefined,
      opacity: locked ? 0.6 : (visible ? 1 : 0.3),
    };
  }, [data, selected, locked, visible]);

  // Signal quality and transmission indicators
  const getSignalStrength = useCallback(() => {
    if (signalType === SignalType.WIRELESS) {
      // Calculate signal strength based on distance
      const distance = Math.sqrt(
        Math.pow(targetX - sourceX, 2) + Math.pow(targetY - sourceY, 2)
      );
      if (distance < 100) return { strength: 'strong', quality: 95 };
      if (distance < 200) return { strength: 'medium', quality: 75 };
      if (distance < 300) return { strength: 'weak', quality: 45 };
      return { strength: 'poor', quality: 20 };
    }
    return { strength: 'wired', quality: 99 };
  }, [signalType, sourceX, sourceY, targetX, targetY]);

  const getSignalQualityColor = useCallback((quality: number) => {
    if (quality >= 80) return '#10b981'; // Good - green
    if (quality >= 60) return '#f59e0b'; // Fair - yellow
    if (quality >= 40) return '#f97316'; // Poor - orange
    return '#ef4444'; // Bad - red
  }, []);

  const getProtocolInfo = useCallback(() => {
    const protocolColors: Record<string, string> = {
      'modbus': '#8b5cf6',
      'profibus': '#f59e0b',
      'ethernet': '#06b6d4',
      'hart': '#ef4444',
      '4-20ma': '#10b981',
      'foundation fieldbus': '#6366f1',
      'wireless': '#ec4899',
    };

    return {
      color: protocolColors[protocol.toLowerCase()] || '#6b7280',
      isDigital: [SignalType.DIGITAL, SignalType.MODBUS, SignalType.PROFIBUS, SignalType.ETHERNET].includes(signalType),
      isAnalog: [SignalType.ANALOG_4_20MA, SignalType.HART].includes(signalType),
      isFieldbus: [SignalType.FOUNDATION_FIELDBUS, SignalType.PROFIBUS, SignalType.MODBUS].includes(signalType),
    };
  }, [protocol, signalType]);

  const signalInfo = getSignalStrength();
  const protocolInfo = getProtocolInfo();

  // Signal animation
  const SignalAnimation = useCallback(() => {
    if (!showSignal) return null;

    const animationSpeed = protocolInfo.isDigital ? 1.5 : 2;

    return (
      <defs>
        {/* Signal pulse animation */}
        <g id={`signal-animation-${id}`}>
          <circle
            r={protocolInfo.isAnalog ? "2" : "3"}
            fill={signalStyle.stroke as string}
            opacity="0.8"
          >
            <animateMotion
              dur={`${animationSpeed}s`}
              repeatCount="indefinite"
              rotate="auto"
              path={edgePath.replace(/^M/, '')}
            />
            <animate
              attributeName="opacity"
              values="0.2;0.8;0.2"
              dur="1s"
              repeatCount="indefinite"
            />
          </circle>
        </g>

        {/* Analog signal wave pattern */}
        {protocolInfo.isAnalog && (
          <g id={`signal-wave-${id}`}>
            <path
              d={`M${sourceX},${sourceY} Q${(sourceX + targetX) / 2},${sourceY - 8} ${targetX},${targetY}`}
              fill="none"
              stroke={signalStyle.stroke as string}
              strokeWidth="1"
              opacity="0.4"
            >
              <animate
                attributeName="stroke-dasharray"
                values="0,100;10,90;20,80;30,70;40,60;50,50"
                dur="3s"
                repeatCount="indefinite"
              />
            </path>
          </g>
        )}

        {/* Digital signal square wave */}
        {protocolInfo.isDigital && (
          <g id={`digital-signal-${id}`}>
            {[0.2, 0.4, 0.6, 0.8].map((position, index) => {
              const x = sourceX + (targetX - sourceX) * position;
              const y = sourceY + (targetY - sourceY) * position;
              return (
                <rect
                  key={index}
                  x={x - 2}
                  y={y - 4}
                  width="4"
                  height="8"
                  fill={signalStyle.stroke as string}
                  opacity="0.6"
                >
                  <animate
                    attributeName="opacity"
                    values="0.2;0.8;0.2;0.8;0.2"
                    dur={`${animationSpeed}s`}
                    repeatCount="indefinite"
                    begin={`${index * 0.1}s`}
                  />
                </rect>
              );
            })}
          </g>
        )}
      </defs>
    );
  }, [showSignal, signalStyle.stroke, edgePath, id, sourceX, sourceY, targetX, targetY, protocolInfo]);

  const strengthColor = getSignalQualityColor(signalInfo.quality);

  return (
    <>
      <defs>
        <SignalAnimation />

        {/* Signal direction marker */}
        <marker
          id={`signal-arrow-${id}`}
          viewBox="0 0 10 10"
          refX="8"
          refY="3"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path
            d="M0,0 L0,6 L9,3 z"
            fill={signalStyle.stroke}
            opacity="0.8"
          />
        </marker>
      </defs>

      {/* Main signal line */}
      <BaseEdge
        path={edgePath}
        style={{
          ...signalStyle,
          ...style,
        }}
      />

      {/* Shielding indicator */}
      {shielded && (
        <BaseEdge
          path={edgePath}
          style={{
            stroke: signalStyle.stroke,
            strokeWidth: (signalStyle.strokeWidth as number) + 2,
            opacity: 0.3,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Twisted pair indicator */}
      {twisted && protocolInfo.isAnalog && (
        <BaseEdge
          path={edgePath}
          style={{
            stroke: signalStyle.stroke,
            strokeWidth: 1,
            strokeDasharray: '1,1',
            opacity: 0.6,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Protocol indicator line */}
      <BaseEdge
        path={edgePath}
        style={{
          stroke: protocolInfo.color,
          strokeWidth: 0.5,
          strokeDasharray: protocolInfo.isDigital ? '2,1' : '1,2',
          opacity: 0.6,
          pointerEvents: 'none',
        }}
      />

      {/* Signal quality indicator for wireless */}
      {signalType === SignalType.WIRELESS && signalInfo && (
        <g>
          {/* Signal strength visualization */}
          {[0.2, 0.4, 0.6, 0.8].map((position, index) => {
            const x = sourceX + (targetX - sourceX) * position;
            const y = sourceY + (targetY - sourceY) * position;
            const isActive = (signalInfo.quality / 25) > index;

            return (
              <g key={index}>
                {/* Signal wave */}
                <circle
                  cx={x}
                  cy={y - 8}
                  r="2"
                  fill={isActive ? getSignalQualityColor(signalInfo.quality) : '#d1d5db'}
                  opacity={isActive ? 0.8 : 0.3}
                />
                <circle
                  cx={x}
                  cy={y}
                  r="3"
                  fill={isActive ? getSignalQualityColor(signalInfo.quality) : '#d1d5db'}
                  opacity={isActive ? 0.8 : 0.3}
                />
                <circle
                  cx={x}
                  cy={y + 8}
                  r="2"
                  fill={isActive ? getSignalQualityColor(signalInfo.quality) : '#d1d5db'}
                  opacity={isActive ? 0.8 : 0.3}
                />
              </g>
            );
          })}
        </g>
      )}

      {/* Signal animation overlay */}
      {showSignal && (
        <>
          <use href={`#signal-animation-${id}`} />
          {protocolInfo.isAnalog && (
            <use href={`#signal-wave-${id}`} />
          )}
          {protocolInfo.isDigital && (
            <use href={`#digital-signal-${id}`} />
          )}
        </>
      )}

      {/* Waypoints visualization */}
      {manuallyAdjusted && waypoints?.map((waypoint) => (
        <circle
          key={waypoint.id}
          cx={waypoint.position.x}
          cy={waypoint.position.y}
          r="3"
          fill="#10b981"
          stroke="white"
          strokeWidth="1"
          opacity={selected ? 0.8 : 0.4}
          className="cursor-pointer"
          style={{ pointerEvents: 'all' }}
        />
      ))}

      {/* Crossing indicators */}
      {crossings?.map((crossing) => (
        <g key={crossing.id}>
          <circle
            cx={crossing.position.x}
            cy={crossing.position.y}
            r="3"
            fill="white"
            stroke={signalStyle.stroke as string}
            strokeWidth="2"
          />
        </g>
      ))}

      {/* Edge label */}
      <EdgeLabelRenderer>
        {(label || voltage || protocol || signalRange) && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className={cn(
              'bg-white bg-opacity-95 border border-gray-300 rounded-lg px-3 py-2 text-xs shadow-lg',
              'backdrop-blur-sm transition-all duration-200',
              selected && 'ring-2 ring-green-400 ring-offset-1 shadow-xl',
              locked && 'opacity-60'
            )}
          >
            {/* Signal label */}
            {label && (
              <div className="font-semibold text-gray-900 mb-1">{label}</div>
            )}

            {/* Signal specifications */}
            <div className="text-gray-700 space-y-1">
              {/* Protocol and type */}
              <div className="flex items-center space-x-2">
                <span className="font-medium" style={{ color: protocolInfo.color }}>
                  {protocol}
                </span>
                <span className="text-gray-500 text-xs">
                  {signalType.replace('_', '-').toUpperCase()}
                </span>
                {showSignal && (
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: strengthColor }}
                    title={`Signal quality: ${signalInfo.quality}%`}
                  />
                )}
              </div>

              {/* Electrical specifications */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {voltage && (
                  <div>
                    <span className="text-gray-500">V:</span> {voltage}V
                  </div>
                )}
                {current && (
                  <div>
                    <span className="text-gray-500">I:</span> {current}mA
                  </div>
                )}
                {frequency && protocolInfo.isDigital && (
                  <div>
                    <span className="text-gray-500">f:</span> {frequency}Hz
                  </div>
                )}
                {baudRate && protocolInfo.isFieldbus && (
                  <div>
                    <span className="text-gray-500">Baud:</span> {baudRate}
                  </div>
                )}
              </div>

              {/* Signal range for analog signals */}
              {protocolInfo.isAnalog && signalRange && (
                <div className="text-xs">
                  <span className="text-gray-500">Range:</span> {signalRange.min}-{signalRange.max}mA
                </div>
              )}

              {/* Cable specifications */}
              {cableType && (
                <div className="text-gray-600 text-xs">
                  {cableType.replace('_', ' ').toUpperCase()}
                </div>
              )}

              {/* Special indicators */}
              <div className="flex flex-wrap gap-1 text-xs">
                {shielded && (
                  <span className="bg-green-100 text-green-800 px-1 rounded">SH</span>
                )}
                {twisted && (
                  <span className="bg-blue-100 text-blue-800 px-1 rounded">TP</span>
                )}
                {termination && protocolInfo.isFieldbus && (
                  <span className="bg-purple-100 text-purple-800 px-1 rounded">
                    {termination}
                  </span>
                )}
                {signalInfo && (
                  <span
                    className="px-1 rounded text-white"
                    style={{ backgroundColor: getSignalQualityColor(signalInfo.quality) }}
                  >
                    {signalInfo.quality}%
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
            <div className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs shadow-md">
              ✋
            </div>
          )}
          {signalType === SignalType.WIRELESS && (
            <div className="w-5 h-5 bg-pink-500 text-white rounded-full flex items-center justify-center text-xs shadow-md">
              📶
            </div>
          )}
        </div>

        {/* Signal type indicator */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX - 45}px,${labelY - 35}px)`,
            pointerEvents: 'none',
          }}
          className="text-xs text-gray-500 bg-gray-100 px-1 rounded shadow-sm"
        >
          {protocolInfo.isAnalog && '📈'}
          {protocolInfo.isDigital && '💻'}
          {signalType === SignalType.WIRELESS && '📡'}
          {protocolInfo.isFieldbus && '🔗'}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

SignalEdge.displayName = 'SignalEdge';

// Export with default data creation helper
export default SignalEdge;

// Helper to create default signal edge data
export const createSignalEdgeData = (overrides: Partial<SignalEdgeData> = {}): SignalEdgeData => ({
  edgeType: 'signal' as any,
  signalType: SignalType.ANALOG_4_20MA,
  voltage: 24,
  current: 20,
  frequency: 50,
  protocol: '4-20mA',
  baudRate: 9600,
  cableType: 'instrumentation',
  shielded: true,
  twisted: true,
  powerRating: 10,
  signalRange: { min: 4, max: 20 },
  termination: '120ohm',
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