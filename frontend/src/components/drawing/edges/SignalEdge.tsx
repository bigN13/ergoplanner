'use client';

import React, { memo } from 'react';
import {
  EdgeProps,
  getStraightPath,
  EdgeLabelRenderer,
  BaseEdge,
} from 'reactflow';
import { cn } from '@/lib/utils';

interface SignalEdgeData {
  signalType?: 'analog' | 'digital' | 'pneumatic' | 'hydraulic';
  voltage?: number;
  current?: number;
  frequency?: number;
  protocol?: string;
  locked?: boolean;
  layer?: string;
  label?: string;
  showSignal?: boolean;
  signalStrength?: number;
  metadata?: Record<string, any>;
}

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
  const isLocked = data?.locked || false;
  const signalType = data?.signalType || 'analog';
  const showSignal = data?.showSignal || false;
  const signalStrength = data?.signalStrength || 1;

  // Calculate edge path (signals typically use straight lines)
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  // Get signal styling based on type
  const getSignalStyle = () => {
    const baseStyle = {
      strokeWidth: 2,
      stroke: '#6b7280',
    };

    switch (signalType) {
      case 'analog':
        return {
          ...baseStyle,
          stroke: '#10b981',
          strokeDasharray: undefined,
        };
      case 'digital':
        return {
          ...baseStyle,
          stroke: '#3b82f6',
          strokeDasharray: '4,4',
        };
      case 'pneumatic':
        return {
          ...baseStyle,
          stroke: '#f59e0b',
          strokeDasharray: '8,2,2,2',
        };
      case 'hydraulic':
        return {
          ...baseStyle,
          stroke: '#ef4444',
          strokeDasharray: '6,3',
        };
      default:
        return baseStyle;
    }
  };

  const signalStyle = getSignalStyle();

  // Signal animation
  const SignalAnimation = () => {
    if (!showSignal) return null;

    return (
      <defs>
        {/* Signal pulse animation */}
        <g id={`signal-animation-${id}`}>
          <circle
            r="3"
            fill={signalStyle.stroke}
            opacity="0.8"
          >
            <animateMotion
              dur={`${2 / signalStrength}s`}
              repeatCount="indefinite"
              rotate="auto"
              path={edgePath}
            />
            <animate
              attributeName="opacity"
              values="0.2;0.8;0.2"
              dur="1s"
              repeatCount="indefinite"
            />
          </circle>
        </g>

        {/* Signal strength indicator */}
        {signalType === 'analog' && (
          <g id={`signal-wave-${id}`}>
            <path
              d={`M${sourceX},${sourceY} Q${(sourceX + targetX) / 2},${sourceY - 10} ${targetX},${targetY}`}
              fill="none"
              stroke={signalStyle.stroke}
              strokeWidth="1"
              opacity="0.4"
            >
              <animate
                attributeName="stroke-dasharray"
                values="0,100;10,90;20,80;30,70;40,60;50,50"
                dur="2s"
                repeatCount="indefinite"
              />
            </path>
          </g>
        )}
      </defs>
    );
  };

  // Get signal strength color
  const getSignalStrengthColor = () => {
    if (signalStrength >= 0.8) return '#10b981'; // Strong signal - green
    if (signalStrength >= 0.5) return '#f59e0b';  // Medium signal - yellow
    return '#ef4444'; // Weak signal - red
  };

  const strengthColor = getSignalStrengthColor();

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
          strokeWidth: selected ? signalStyle.strokeWidth + 1 : signalStyle.strokeWidth,
          filter: selected ? 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))' : undefined,
          opacity: isLocked ? 0.6 : 1,
        }}
      />

      {/* Signal strength indicator */}
      {showSignal && signalStrength < 1 && (
        <BaseEdge
          path={edgePath}
          style={{
            stroke: strengthColor,
            strokeWidth: 1,
            strokeDasharray: '2,2',
            opacity: 0.6,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Signal animation overlay */}
      {showSignal && (
        <>
          <use href={`#signal-animation-${id}`} />
          {signalType === 'analog' && (
            <use href={`#signal-wave-${id}`} />
          )}
        </>
      )}

      {/* Edge label */}
      <EdgeLabelRenderer>
        {(data?.label || data?.voltage || data?.protocol) && (
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
            {/* Signal label */}
            {data?.label && (
              <div className="font-medium text-gray-900">{data.label}</div>
            )}

            {/* Signal specifications */}
            <div className="text-gray-600 space-y-1">
              <div className="flex items-center gap-1">
                <span className="capitalize">{signalType}</span>
                {showSignal && (
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: strengthColor }}
                    title={`Signal strength: ${Math.round(signalStrength * 100)}%`}
                  />
                )}
              </div>

              {data?.voltage && (
                <div>{data.voltage}V</div>
              )}
              {data?.current && (
                <div>{data.current}mA</div>
              )}
              {data?.frequency && (
                <div>{data.frequency}Hz</div>
              )}
              {data?.protocol && (
                <div>{data.protocol}</div>
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

        {/* Signal type indicator */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX - 40}px,${labelY - 30}px)`,
            pointerEvents: 'none',
          }}
          className="text-xs text-gray-500 bg-gray-100 px-1 rounded"
        >
          {signalType === 'analog' && '📈'}
          {signalType === 'digital' && '💻'}
          {signalType === 'pneumatic' && '🌬️'}
          {signalType === 'hydraulic' && '💧'}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

SignalEdge.displayName = 'SignalEdge';

export default SignalEdge;