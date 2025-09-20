'use client';

import React from 'react';

interface CanvasGridProps {
  size: number;
  visible: boolean;
  color?: string;
  opacity?: number;
  type?: 'dots' | 'lines';
  className?: string;
}

export const CanvasGrid: React.FC<CanvasGridProps> = ({
  size = 20,
  visible = true,
  color = '#e5e7eb',
  opacity = 0.5,
  type = 'dots',
  className = '',
}) => {
  if (!visible) return null;

  const patternId = `grid-pattern-${size}-${type}`;

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      <svg
        width="100%"
        height="100%"
        className="absolute inset-0"
        style={{ opacity }}
      >
        <defs>
          {type === 'dots' ? (
            <pattern
              id={patternId}
              width={size}
              height={size}
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx={size / 2}
                cy={size / 2}
                r={1}
                fill={color}
              />
            </pattern>
          ) : (
            <pattern
              id={patternId}
              width={size}
              height={size}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${size} 0 L 0 0 0 ${size}`}
                fill="none"
                stroke={color}
                strokeWidth={1}
              />
            </pattern>
          )}
        </defs>
        <rect
          width="100%"
          height="100%"
          fill={`url(#${patternId})`}
        />
      </svg>
    </div>
  );
};