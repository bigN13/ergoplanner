'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CanvasNode } from '@/types/canvas';
import { cn } from '@/lib/utils';

interface ComponentNodeData {
  componentId?: string;
  componentType?: string;
  symbolId?: string;
  label: string;
  properties?: Record<string, any>;
  locked?: boolean;
  layer?: string;
  metadata?: Record<string, any>;
}

export const ComponentNode: React.FC<NodeProps<ComponentNodeData>> = memo(({
  id,
  data,
  selected,
  isConnectable,
  xPos,
  yPos,
  zIndex,
  dragging,
}) => {
  const isLocked = data.locked || false;
  const componentType = data.componentType || 'generic';

  // Get component-specific styling and configuration
  const getComponentConfig = () => {
    switch (componentType) {
      case 'pump':
        return {
          icon: '⚙️',
          color: 'bg-blue-100 border-blue-500 text-blue-900',
          handles: [
            { id: 'inlet', type: 'target', position: Position.Left },
            { id: 'outlet', type: 'source', position: Position.Right },
          ],
        };
      case 'valve':
        return {
          icon: '🔧',
          color: 'bg-green-100 border-green-500 text-green-900',
          handles: [
            { id: 'inlet', type: 'target', position: Position.Left },
            { id: 'outlet', type: 'source', position: Position.Right },
          ],
        };
      case 'tank':
        return {
          icon: '🛢️',
          color: 'bg-gray-100 border-gray-500 text-gray-900',
          handles: [
            { id: 'inlet', type: 'target', position: Position.Top },
            { id: 'outlet', type: 'source', position: Position.Bottom },
            { id: 'overflow', type: 'source', position: Position.Right },
          ],
        };
      case 'instrument':
        return {
          icon: '📊',
          color: 'bg-purple-100 border-purple-500 text-purple-900',
          handles: [
            { id: 'signal', type: 'target', position: Position.Bottom },
          ],
        };
      default:
        return {
          icon: '🔲',
          color: 'bg-gray-100 border-gray-400 text-gray-700',
          handles: [
            { id: 'input', type: 'target', position: Position.Left },
            { id: 'output', type: 'source', position: Position.Right },
          ],
        };
    }
  };

  const config = getComponentConfig();

  return (
    <div
      className={cn(
        'relative min-w-16 min-h-12 rounded-lg border-2 shadow-sm transition-all duration-200',
        config.color,
        selected && 'ring-2 ring-blue-400 ring-offset-2',
        dragging && 'rotate-2 scale-105',
        isLocked && 'opacity-60 cursor-not-allowed',
        'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2'
      )}
      style={{
        zIndex: selected ? 1000 : zIndex,
      }}
    >
      {/* Lock indicator */}
      {isLocked && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
          🔒
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col items-center justify-center p-2 min-h-12">
        {/* Component icon */}
        <div className="text-lg mb-1">{config.icon}</div>

        {/* Component label */}
        <div className="text-xs font-medium text-center leading-tight">
          {data.label}
        </div>

        {/* Component properties (if any) */}
        {data.properties && Object.keys(data.properties).length > 0 && (
          <div className="text-xs text-gray-600 mt-1">
            {Object.entries(data.properties).slice(0, 2).map(([key, value]) => (
              <div key={key} className="truncate max-w-20">
                {key}: {String(value)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connection handles */}
      {config.handles.map((handle) => (
        <Handle
          key={handle.id}
          id={handle.id}
          type={handle.type as 'source' | 'target'}
          position={handle.position}
          isConnectable={isConnectable && !isLocked}
          className={cn(
            'w-3 h-3 border-2 border-white',
            handle.type === 'source' ? 'bg-blue-500' : 'bg-green-500'
          )}
          style={{
            position: 'absolute',
            ...(handle.position === Position.Left && { left: '-6px', top: '50%', transform: 'translateY(-50%)' }),
            ...(handle.position === Position.Right && { right: '-6px', top: '50%', transform: 'translateY(-50%)' }),
            ...(handle.position === Position.Top && { top: '-6px', left: '50%', transform: 'translateX(-50%)' }),
            ...(handle.position === Position.Bottom && { bottom: '-6px', left: '50%', transform: 'translateX(-50%)' }),
          }}
        />
      ))}

      {/* Selected indicator */}
      {selected && (
        <div className="absolute inset-0 border-2 border-blue-400 rounded-lg pointer-events-none" />
      )}
    </div>
  );
});

ComponentNode.displayName = 'ComponentNode';

export default ComponentNode;