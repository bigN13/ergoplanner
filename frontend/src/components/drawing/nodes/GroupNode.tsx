'use client';

import React, { memo } from 'react';
import { NodeProps } from 'reactflow';
import { cn } from '@/lib/utils';

interface GroupNodeData {
  label: string;
  children?: string[];
  collapsed?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  borderWidth?: number;
  borderRadius?: number;
  opacity?: number;
  locked?: boolean;
  layer?: string;
  metadata?: Record<string, any>;
}

interface GroupNodeProps extends NodeProps<GroupNodeData> {
  width?: number;
  height?: number;
}

export const GroupNode: React.FC<GroupNodeProps> = memo(({
  id,
  data,
  selected,
  dragging,
  zIndex,
  width = 200,
  height = 150,
}) => {
  const isLocked = data.locked || false;
  const isCollapsed = data.collapsed || false;
  const childCount = data.children?.length || 0;

  const styles = {
    backgroundColor: data.backgroundColor || 'rgba(239, 246, 255, 0.5)',
    borderColor: data.borderColor || '#3b82f6',
    borderStyle: data.borderStyle || 'dashed',
    borderWidth: data.borderWidth || 2,
    borderRadius: data.borderRadius || 8,
    opacity: data.opacity || 0.8,
  };

  return (
    <div
      className={cn(
        'relative transition-all duration-200',
        selected && 'ring-2 ring-blue-400 ring-offset-2',
        dragging && 'scale-105',
        isLocked && 'opacity-60 cursor-not-allowed',
        'hover:shadow-md'
      )}
      style={{
        width: isCollapsed ? 120 : width,
        height: isCollapsed ? 40 : height,
        zIndex: selected ? 1000 : zIndex,
        backgroundColor: styles.backgroundColor,
        border: `${styles.borderWidth}px ${styles.borderStyle} ${styles.borderColor}`,
        borderRadius: styles.borderRadius,
        opacity: styles.opacity,
      }}
    >
      {/* Lock indicator */}
      {isLocked && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs z-10">
          🔒
        </div>
      )}

      {/* Group header */}
      <div className="absolute top-0 left-0 right-0 bg-white bg-opacity-90 border-b border-gray-300 rounded-t-md px-3 py-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Collapse/Expand button */}
          <button
            className="w-4 h-4 flex items-center justify-center text-gray-600 hover:text-gray-800"
            onClick={(e) => {
              e.stopPropagation();
              // Here you would dispatch an action to toggle collapsed state
              // dispatch(updateNodeData({ id, data: { ...data, collapsed: !isCollapsed } }));
            }}
          >
            {isCollapsed ? '▶' : '▼'}
          </button>

          {/* Group title */}
          <div className="text-sm font-medium text-gray-800 truncate">
            {data.label}
          </div>
        </div>

        {/* Child count indicator */}
        {childCount > 0 && (
          <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
            {childCount} items
          </div>
        )}
      </div>

      {/* Group content area */}
      {!isCollapsed && (
        <div className="absolute inset-0 top-8 p-2">
          {/* Content placeholder */}
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            <div className="text-center">
              <div className="text-2xl mb-2">📁</div>
              <div>Group Container</div>
              {childCount > 0 && (
                <div className="text-xs mt-1">
                  Contains {childCount} component{childCount !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>

          {/* Children indicators (simplified visualization) */}
          {data.children && data.children.length > 0 && (
            <div className="absolute bottom-2 left-2 right-2">
              <div className="flex flex-wrap gap-1">
                {data.children.slice(0, 6).map((childId, index) => (
                  <div
                    key={childId}
                    className="w-3 h-3 bg-blue-300 border border-blue-500 rounded"
                    title={`Child component: ${childId}`}
                  />
                ))}
                {data.children.length > 6 && (
                  <div className="text-xs text-gray-600 ml-1">
                    +{data.children.length - 6} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resize handles (when selected and not collapsed) */}
      {selected && !isCollapsed && !isLocked && (
        <>
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 border border-white rounded-full cursor-nw-resize" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 border border-white rounded-full cursor-ne-resize" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 border border-white rounded-full cursor-sw-resize" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 border border-white rounded-full cursor-se-resize" />
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 border border-white rounded-full cursor-n-resize" />
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 border border-white rounded-full cursor-s-resize" />
          <div className="absolute top-1/2 transform -translate-y-1/2 -left-1 w-2 h-2 bg-blue-500 border border-white rounded-full cursor-w-resize" />
          <div className="absolute top-1/2 transform -translate-y-1/2 -right-1 w-2 h-2 bg-blue-500 border border-white rounded-full cursor-e-resize" />
        </>
      )}

      {/* Selection indicator */}
      {selected && (
        <div className="absolute inset-0 border-2 border-blue-400 rounded-lg pointer-events-none" />
      )}

      {/* Group metadata overlay (when hovering and not dragging) */}
      {!dragging && data.metadata && (
        <div className="absolute top-full left-0 mt-1 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity pointer-events-none z-20">
          <div>ID: {id}</div>
          {data.metadata.description && (
            <div>Description: {data.metadata.description}</div>
          )}
          {data.layer && (
            <div>Layer: {data.layer}</div>
          )}
        </div>
      )}
    </div>
  );
});

GroupNode.displayName = 'GroupNode';

export default GroupNode;