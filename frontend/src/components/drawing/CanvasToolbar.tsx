'use client';

import React from 'react';
import {
  MousePointer2,
  Hand,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Home,
  Target,
  Undo2,
  Redo2,
  Copy,
  ClipboardPaste as Paste,
  Trash2,
  Grid3X3,
  Layers,
  Settings,
  Save,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import { Tooltip } from '@/components/ui/Tooltip';
import { Badge } from '@/components/ui/Badge';
import { CanvasTool, CanvasMode } from '@/types/canvas';

interface CanvasToolbarProps {
  activeTool: CanvasTool;
  onToolChange: (tool: CanvasTool) => void;
  mode: CanvasMode;
  readonly?: boolean;

  // Zoom and viewport controls
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onResetView: () => void;
  onCenterView: () => void;

  // History controls
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;

  // Additional callbacks
  onSave?: () => void;
  onShare?: () => void;
  onSettings?: () => void;
  onToggleGrid?: () => void;
  onToggleLayers?: () => void;

  // State indicators
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
  collaboratorCount?: number;
}

const toolConfig = {
  [CanvasTool.SELECT]: {
    icon: MousePointer2,
    label: 'Select',
    shortcut: 'V',
    description: 'Select and move elements',
  },
  [CanvasTool.PAN]: {
    icon: Hand,
    label: 'Pan',
    shortcut: 'H',
    description: 'Pan around the canvas',
  },
  [CanvasTool.DRAW_PIPE]: {
    icon: 'pipe',
    label: 'Pipe',
    shortcut: 'P',
    description: 'Draw pipe connections',
  },
  [CanvasTool.DRAW_SIGNAL]: {
    icon: 'signal',
    label: 'Signal',
    shortcut: 'S',
    description: 'Draw signal lines',
  },
  [CanvasTool.ADD_COMPONENT]: {
    icon: 'component',
    label: 'Component',
    shortcut: 'C',
    description: 'Add P&ID components',
  },
  [CanvasTool.ADD_ANNOTATION]: {
    icon: 'text',
    label: 'Text',
    shortcut: 'T',
    description: 'Add text annotations',
  },
  [CanvasTool.MEASURE]: {
    icon: 'ruler',
    label: 'Measure',
    shortcut: 'M',
    description: 'Measure distances',
  },
  [CanvasTool.ZOOM]: {
    icon: ZoomIn,
    label: 'Zoom',
    shortcut: 'Z',
    description: 'Zoom tool',
  },
};

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  activeTool,
  onToolChange,
  mode,
  readonly = false,
  onZoomIn,
  onZoomOut,
  onFitView,
  onResetView,
  onCenterView,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  onShare,
  onSettings,
  onToggleGrid,
  onToggleLayers,
  isSaving = false,
  hasUnsavedChanges = false,
  collaboratorCount = 0,
}) => {
  const renderToolButton = (tool: CanvasTool) => {
    const config = toolConfig[tool];
    const isActive = activeTool === tool;
    const disabled = readonly && tool !== CanvasTool.SELECT && tool !== CanvasTool.PAN && tool !== CanvasTool.ZOOM;

    // Handle custom icons
    const IconComponent = typeof config.icon === 'string' ?
      () => <div className="w-4 h-4 bg-gray-400 rounded" /> : // Placeholder for custom icons
      config.icon;

    return (
      <Tooltip key={tool} content={`${config.description} (${config.shortcut})`}>
        <Button
          variant={isActive ? 'default' : 'ghost'}
          size="sm"
          disabled={disabled}
          onClick={() => onToolChange(tool)}
          className={`w-10 h-10 p-0 ${isActive ? 'bg-blue-100 border-blue-300' : ''}`}
        >
          <IconComponent className="w-4 h-4" />
        </Button>
      </Tooltip>
    );
  };

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
      {/* Main Toolbar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2">
        <div className="flex flex-col gap-2">
          {/* Drawing Tools */}
          <div className="flex flex-col gap-1">
            <div className="text-xs text-gray-500 dark:text-gray-400 px-1 mb-1">Tools</div>
            <div className="grid grid-cols-2 gap-1">
              {renderToolButton(CanvasTool.SELECT)}
              {renderToolButton(CanvasTool.PAN)}
              {!readonly && renderToolButton(CanvasTool.DRAW_PIPE)}
              {!readonly && renderToolButton(CanvasTool.DRAW_SIGNAL)}
              {!readonly && renderToolButton(CanvasTool.ADD_COMPONENT)}
              {!readonly && renderToolButton(CanvasTool.ADD_ANNOTATION)}
              {renderToolButton(CanvasTool.MEASURE)}
              {renderToolButton(CanvasTool.ZOOM)}
            </div>
          </div>

          <Separator />

          {/* History Controls */}
          {!readonly && (
            <>
              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-500 dark:text-gray-400 px-1 mb-1">History</div>
                <div className="flex gap-1">
                  <Tooltip content="Undo (Ctrl+Z)">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!canUndo}
                      onClick={onUndo}
                      className="w-10 h-10 p-0"
                    >
                      <Undo2 className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Redo (Ctrl+Y)">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!canRedo}
                      onClick={onRedo}
                      className="w-10 h-10 p-0"
                    >
                      <Redo2 className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* View Controls */}
          <div className="flex flex-col gap-1">
            <div className="text-xs text-gray-500 dark:text-gray-400 px-1 mb-1">View</div>
            <div className="grid grid-cols-2 gap-1">
              <Tooltip content="Zoom In (+)">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onZoomIn}
                  className="w-10 h-10 p-0"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </Tooltip>
              <Tooltip content="Zoom Out (-)">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onZoomOut}
                  className="w-10 h-10 p-0"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
              </Tooltip>
              <Tooltip content="Fit to View">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onFitView}
                  className="w-10 h-10 p-0"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </Tooltip>
              <Tooltip content="Reset View">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onResetView}
                  className="w-10 h-10 p-0"
                >
                  <Home className="w-4 h-4" />
                </Button>
              </Tooltip>
            </div>
            <Tooltip content="Center View">
              <Button
                variant="ghost"
                size="sm"
                onClick={onCenterView}
                className="w-full h-8"
              >
                <Target className="w-4 h-4 mr-1" />
                <span className="text-xs">Center</span>
              </Button>
            </Tooltip>
          </div>

          <Separator />

          {/* View Options */}
          <div className="flex flex-col gap-1">
            <div className="text-xs text-gray-500 dark:text-gray-400 px-1 mb-1">Options</div>
            <div className="flex gap-1">
              {onToggleGrid && (
                <Tooltip content="Toggle Grid">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleGrid}
                    className="w-10 h-10 p-0"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                </Tooltip>
              )}
              {onToggleLayers && (
                <Tooltip content="Toggle Layers">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleLayers}
                    className="w-10 h-10 p-0"
                  >
                    <Layers className="w-4 h-4" />
                  </Button>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Toolbar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2">
        <div className="flex flex-col gap-2">
          {/* Save Status */}
          {onSave && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <Tooltip content={isSaving ? 'Saving...' : 'Save Drawing'}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSave}
                    disabled={isSaving || readonly}
                    className="w-10 h-10 p-0"
                  >
                    <Save className={`w-4 h-4 ${isSaving ? 'animate-pulse' : ''}`} />
                  </Button>
                </Tooltip>
                {hasUnsavedChanges && (
                  <div className="w-2 h-2 bg-orange-500 rounded-full" title="Unsaved changes" />
                )}
              </div>
            </div>
          )}

          {/* Collaboration */}
          {collaboratorCount > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <Badge variant="secondary" className="text-xs">
                {collaboratorCount} online
              </Badge>
            </div>
          )}

          {/* Share */}
          {onShare && (
            <Tooltip content="Share Drawing">
              <Button
                variant="ghost"
                size="sm"
                onClick={onShare}
                className="w-10 h-10 p-0"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </Tooltip>
          )}

          {/* Settings */}
          {onSettings && (
            <Tooltip content="Canvas Settings">
              <Button
                variant="ghost"
                size="sm"
                onClick={onSettings}
                className="w-10 h-10 p-0"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Mode Indicator */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 px-3 py-1">
        <Badge
          variant={mode === CanvasMode.EDIT ? 'default' : 'secondary'}
          className="text-xs"
        >
          {mode.toUpperCase()}
        </Badge>
      </div>
    </div>
  );
};