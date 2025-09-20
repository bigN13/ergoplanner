'use client';

import React, { memo, useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { PIDNode, PIDNodeData, NodeVisualState, NodeRotation, NodeHandle, NODE_STATE_COLORS, HANDLE_COLORS } from '@/types/nodes';
import { getSymbolByType } from '../../symbols';
import { cn } from '@/lib/utils';

interface BaseNodeProps extends NodeProps<PIDNodeData> {
  onPropertyChange?: (nodeId: string, properties: Record<string, any>) => void;
  onValidationChange?: (nodeId: string, isValid: boolean, errors: string[]) => void;
  onStateChange?: (nodeId: string, state: NodeVisualState) => void;
  showDetails?: boolean;
  levelOfDetail?: 'minimal' | 'basic' | 'detailed' | 'full';
}

export const BaseNode: React.FC<BaseNodeProps> = memo(({
  id,
  type,
  data,
  selected,
  isConnectable,
  xPos,
  yPos,
  zIndex,
  dragging,
  onPropertyChange,
  onValidationChange,
  onStateChange,
  showDetails = true,
  levelOfDetail = 'full'
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showPropertyPanel, setShowPropertyPanel] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Get symbol configuration
  const symbol = useMemo(() => getSymbolByType(type as any), [type]);

  // Get visual state configuration
  const stateConfig = useMemo(() => {
    const state = data.visualState || NodeVisualState.NORMAL;
    return NODE_STATE_COLORS[state];
  }, [data.visualState]);

  // Calculate effective size based on zoom and scale
  const effectiveSize = useMemo(() => {
    const baseSize = symbol?.defaultSize || { width: 60, height: 40 };
    const scale = data.scale || 1;
    return {
      width: baseSize.width * scale,
      height: baseSize.height * scale
    };
  }, [symbol, data.scale]);

  // Handle rotation transform
  const transformStyle = useMemo(() => {
    const rotation = data.rotation || NodeRotation.DEGREE_0;
    const mirrored = data.mirrored || false;

    let transform = `rotate(${rotation}deg)`;
    if (mirrored) {
      transform += ' scaleX(-1)';
    }

    return rotation !== 0 || mirrored ? transform : undefined;
  }, [data.rotation, data.mirrored]);

  // Handle node click
  const handleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    if (event.detail === 2) { // Double click
      setShowPropertyPanel(true);
    }
  }, []);

  // Handle context menu
  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    // Context menu will be handled by parent component
  }, []);

  // Validate node data
  useEffect(() => {
    const errors: string[] = [];

    // Basic validation
    if (!data.label?.trim()) {
      errors.push('Node label is required');
    }

    if (data.tagNumber && !/^[A-Z]{1,3}-\d{3}[A-Z]?$/.test(data.tagNumber)) {
      errors.push('Invalid tag number format (expected: XXX-123A)');
    }

    // Property validation based on node type
    if (symbol?.nodeType.includes('pump') && data.properties?.capacity <= 0) {
      errors.push('Pump capacity must be greater than 0');
    }

    if (symbol?.nodeType.includes('valve') && data.properties?.size <= 0) {
      errors.push('Valve size must be greater than 0');
    }

    setValidationErrors(errors);
    onValidationChange?.(id, errors.length === 0, errors);
  }, [data, symbol, id, onValidationChange]);

  // Render connection handles
  const renderHandles = () => {
    if (!symbol?.connectionPoints || levelOfDetail === 'minimal') return null;

    return symbol.connectionPoints.map((point) => {
      const handleType = point.type;
      const color = HANDLE_COLORS[handleType] || '#64748b';

      // Adjust position based on rotation
      let { x, y } = point;
      const rotation = data.rotation || NodeRotation.DEGREE_0;

      if (rotation === NodeRotation.DEGREE_90) {
        [x, y] = [-y, x];
      } else if (rotation === NodeRotation.DEGREE_180) {
        [x, y] = [-x, -y];
      } else if (rotation === NodeRotation.DEGREE_270) {
        [x, y] = [y, -x];
      }

      // Convert to percentage position
      const leftPercent = ((x + effectiveSize.width / 2) / effectiveSize.width) * 100;
      const topPercent = ((y + effectiveSize.height / 2) / effectiveSize.height) * 100;

      return (
        <Handle
          key={point.id}
          id={point.id}
          type={point.type === 'source' ? 'source' : 'target'}
          position={Position.Left} // Will be overridden by style
          isConnectable={isConnectable && !data.locked}
          className={cn(
            'w-3 h-3 border-2 border-white rounded-full transition-all duration-200',
            isHovered && 'w-4 h-4'
          )}
          style={{
            backgroundColor: color,
            position: 'absolute',
            left: `${leftPercent}%`,
            top: `${topPercent}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 10
          }}
        />
      );
    });
  };

  // Render SVG symbol
  const renderSymbol = () => {
    if (!symbol?.svg) return null;

    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ transform: transformStyle }}
        dangerouslySetInnerHTML={{
          __html: symbol.svg.replace(/currentColor/g, stateConfig.text)
        }}
      />
    );
  };

  // Render node label
  const renderLabel = () => {
    if (levelOfDetail === 'minimal') return null;

    return (
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-center whitespace-nowrap">
        <div className={cn('text-gray-900', data.visualState === NodeVisualState.ALARM && 'text-red-700')}>
          {data.label}
        </div>
        {data.tagNumber && levelOfDetail !== 'basic' && (
          <div className="text-gray-600 text-xs">{data.tagNumber}</div>
        )}
      </div>
    );
  };

  // Render validation indicators
  const renderValidationIndicators = () => {
    if (validationErrors.length === 0 || levelOfDetail === 'minimal') return null;

    return (
      <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
        !
      </div>
    );
  };

  // Render lock indicator
  const renderLockIndicator = () => {
    if (!data.locked || levelOfDetail === 'minimal') return null;

    return (
      <div className="absolute -top-2 -left-2 w-4 h-4 bg-gray-500 text-white rounded-full flex items-center justify-center text-xs">
        🔒
      </div>
    );
  };

  // Render state indicator
  const renderStateIndicator = () => {
    if (data.visualState === NodeVisualState.NORMAL || levelOfDetail === 'minimal') return null;

    const stateIcons = {
      [NodeVisualState.ALARM]: '🚨',
      [NodeVisualState.WARNING]: '⚠️',
      [NodeVisualState.ERROR]: '❌',
      [NodeVisualState.OFFLINE]: '📴',
      [NodeVisualState.MAINTENANCE]: '🔧'
    };

    return (
      <div className="absolute -top-2 right-2 w-4 h-4 flex items-center justify-center text-xs">
        {stateIcons[data.visualState]}
      </div>
    );
  };

  // Render properties overlay
  const renderPropertiesOverlay = () => {
    if (!showDetails || levelOfDetail === 'minimal' || !data.properties) return null;

    const visibleProperties = Object.entries(data.properties)
      .slice(0, levelOfDetail === 'basic' ? 1 : 3)
      .filter(([_, value]) => value != null && value !== '');

    if (visibleProperties.length === 0) return null;

    return (
      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-sm p-1 text-xs min-w-24 z-20">
        {visibleProperties.map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="text-gray-600 truncate">{key}:</span>
            <span className="font-medium truncate ml-1">{String(value)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div
        ref={nodeRef}
        className={cn(
          'relative transition-all duration-200 cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2',
          selected && 'ring-2 ring-blue-400 ring-offset-2',
          dragging && 'scale-105 rotate-1',
          data.locked && 'opacity-60 cursor-not-allowed',
          isHovered && 'scale-102'
        )}
        style={{
          width: effectiveSize.width,
          height: effectiveSize.height,
          backgroundColor: stateConfig.background,
          borderColor: stateConfig.border,
          borderWidth: '2px',
          borderStyle: 'solid',
          borderRadius: '8px',
          zIndex: selected ? 1000 : zIndex,
          opacity: data.opacity || 1
        }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={0}
        aria-label={`${symbol?.name || 'Node'}: ${data.label}`}
        aria-description={data.description}
        aria-selected={selected}
      >
        {/* Main symbol content */}
        {renderSymbol()}

        {/* Connection handles */}
        {renderHandles()}

        {/* Node indicators */}
        {renderValidationIndicators()}
        {renderLockIndicator()}
        {renderStateIndicator()}

        {/* Selection indicator */}
        {selected && (
          <div className="absolute inset-0 border-2 border-blue-400 rounded pointer-events-none animate-pulse" />
        )}
      </div>

      {/* Node label */}
      {renderLabel()}

      {/* Properties overlay */}
      {isHovered && renderPropertiesOverlay()}

      {/* Property panel modal - will be implemented later */}
      {showPropertyPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Node Properties</h3>
            <p className="text-sm text-gray-600 mb-4">
              Property editing panel will be implemented in the next phase.
            </p>
            <button
              onClick={() => setShowPropertyPanel(false)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
});

BaseNode.displayName = 'BaseNode';

export default BaseNode;