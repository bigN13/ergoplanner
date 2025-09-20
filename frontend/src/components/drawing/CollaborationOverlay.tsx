'use client';

import React from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectCollaborators } from '@/store/slices/drawingSlice';

interface CollaboratorCursor {
  userId: string;
  userName: string;
  x: number;
  y: number;
  color: string;
}

interface CollaborationOverlayProps {
  className?: string;
}

export const CollaborationOverlay: React.FC<CollaborationOverlayProps> = ({
  className = '',
}) => {
  const collaborators = useAppSelector(selectCollaborators);

  const renderCursor = (collaborator: typeof collaborators[0]) => {
    if (!collaborator.cursor) return null;

    return (
      <div
        key={collaborator.userId}
        className="absolute pointer-events-none z-50"
        style={{
          left: collaborator.cursor.x,
          top: collaborator.cursor.y,
          transform: 'translate(-2px, -2px)',
        }}
      >
        {/* Cursor pointer */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          className="drop-shadow-sm"
        >
          <path
            d="M2 2 L2 16 L7 11 L10 11 L2 2 Z"
            fill={collaborator.color}
            stroke="white"
            strokeWidth="1"
          />
        </svg>

        {/* User name label */}
        <div
          className="absolute top-5 left-3 px-2 py-1 text-xs text-white rounded shadow-lg whitespace-nowrap"
          style={{ backgroundColor: collaborator.color }}
        >
          {collaborator.userName}
        </div>
      </div>
    );
  };

  const renderSelection = (collaborator: typeof collaborators[0]) => {
    if (!collaborator.selection.length) return null;

    return collaborator.selection.map((nodeId) => (
      <div
        key={`${collaborator.userId}-${nodeId}`}
        className="absolute pointer-events-none border-2 border-dashed rounded"
        style={{
          borderColor: collaborator.color,
          // Position would be calculated based on node position
          // This is a placeholder - actual implementation would use ReactFlow instance
          left: 0,
          top: 0,
          width: 100,
          height: 50,
        }}
      />
    ));
  };

  return (
    <div className={`absolute inset-0 pointer-events-none z-40 ${className}`}>
      {/* Render collaborator cursors */}
      {collaborators.map(renderCursor)}

      {/* Render collaborator selections */}
      {collaborators.map(renderSelection)}

      {/* Collaborators list */}
      {collaborators.length > 0 && (
        <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 max-w-xs">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Online ({collaborators.length})
          </div>
          <div className="space-y-2">
            {collaborators.map((collaborator) => (
              <div
                key={collaborator.userId}
                className="flex items-center gap-2"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: collaborator.color }}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {collaborator.userName}
                </span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-auto" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};