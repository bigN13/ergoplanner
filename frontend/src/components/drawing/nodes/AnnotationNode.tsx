'use client';

import React, { memo, useState, useRef, useEffect } from 'react';
import { NodeProps } from 'reactflow';
import { cn } from '@/lib/utils';

interface AnnotationNodeData {
  label: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  padding?: number;
  locked?: boolean;
  editable?: boolean;
  layer?: string;
  metadata?: Record<string, any>;
}

export const AnnotationNode: React.FC<NodeProps<AnnotationNodeData>> = memo(({
  id,
  data,
  selected,
  dragging,
  zIndex,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(data.label);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isLocked = data.locked || false;
  const isEditable = data.editable !== false;

  // Handle double click to edit
  const handleDoubleClick = () => {
    if (!isLocked && isEditable) {
      setIsEditing(true);
      setEditText(data.label);
    }
  };

  // Handle editing completion
  const handleEditComplete = () => {
    setIsEditing(false);
    // Here you would typically dispatch an action to update the node data
    // dispatch(updateNodeData({ id, data: { ...data, label: editText } }));
  };

  // Handle escape key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditText(data.label);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditComplete();
    }
  };

  // Auto-focus and select text when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // Calculate text dimensions for auto-sizing
  const getTextDimensions = () => {
    const lines = data.label.split('\n');
    const maxLineLength = Math.max(...lines.map(line => line.length));
    const fontSize = data.fontSize || 14;

    return {
      width: Math.max(maxLineLength * 0.6 * fontSize, 80),
      height: Math.max(lines.length * fontSize * 1.4, fontSize * 1.4),
    };
  };

  const dimensions = getTextDimensions();

  const styles = {
    fontSize: data.fontSize || 14,
    fontFamily: data.fontFamily || 'Inter, sans-serif',
    fontWeight: data.fontWeight || 'normal',
    textAlign: data.textAlign || 'left',
    color: data.color || '#374151',
    backgroundColor: data.backgroundColor || 'transparent',
    borderColor: data.borderColor || 'transparent',
    borderWidth: data.borderWidth || 0,
    padding: data.padding || 8,
  } as React.CSSProperties;

  return (
    <div
      className={cn(
        'relative transition-all duration-200 cursor-text',
        selected && 'ring-2 ring-blue-400 ring-offset-2',
        dragging && 'rotate-1 scale-105',
        isLocked && 'cursor-not-allowed opacity-60',
        !isEditing && !isLocked && isEditable && 'hover:bg-gray-50 hover:border-gray-300'
      )}
      style={{
        zIndex: selected ? 1000 : zIndex,
        width: dimensions.width,
        height: dimensions.height,
        minWidth: 80,
        minHeight: 20,
        borderRadius: '4px',
        border: `${styles.borderWidth}px solid ${styles.borderColor}`,
        backgroundColor: styles.backgroundColor,
        padding: styles.padding,
      }}
      onDoubleClick={handleDoubleClick}
    >
      {/* Lock indicator */}
      {isLocked && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
          🔒
        </div>
      )}

      {/* Editable text area */}
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleEditComplete}
          onKeyDown={handleKeyDown}
          className="w-full h-full resize-none border-none outline-none bg-transparent"
          style={{
            fontSize: styles.fontSize,
            fontFamily: styles.fontFamily,
            fontWeight: styles.fontWeight,
            textAlign: styles.textAlign,
            color: styles.color,
            padding: 0,
            margin: 0,
          }}
        />
      ) : (
        <div
          className="w-full h-full whitespace-pre-wrap break-words"
          style={{
            fontSize: styles.fontSize,
            fontFamily: styles.fontFamily,
            fontWeight: styles.fontWeight,
            textAlign: styles.textAlign,
            color: styles.color,
            lineHeight: 1.4,
          }}
        >
          {data.label || 'Double-click to edit'}
        </div>
      )}

      {/* Selection handles for resizing (when selected) */}
      {selected && !isEditing && (
        <>
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 border border-white rounded-full cursor-nw-resize" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 border border-white rounded-full cursor-ne-resize" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 border border-white rounded-full cursor-sw-resize" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 border border-white rounded-full cursor-se-resize" />
        </>
      )}

      {/* Editing indicator */}
      {isEditing && (
        <div className="absolute -top-6 left-0 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
          Editing... (Press Esc to cancel, Enter to save)
        </div>
      )}
    </div>
  );
});

AnnotationNode.displayName = 'AnnotationNode';

export default AnnotationNode;