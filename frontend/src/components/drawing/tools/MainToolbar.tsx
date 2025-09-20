/**
 * Main Toolbar Component - TASK-016 Implementation
 * Professional toolbar with categorized tool groups
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Undo2,
  Redo2,
  Copy,
  ClipboardPaste,
  Scissors,
  Trash2,
  Save,
  Share2,
  Download,
  Upload,
  Grid3X3,
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  MoreHorizontal,
  ChevronDown,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';

import { toolDefinitions, toolCategories } from '@/data/toolDefinitions';
import { DrawingTool, ToolCategory, ToolbarLayout, AccessibilityConfig } from '@/types/tools';
import { cn } from '@/lib/utils';

interface MainToolbarProps {
  activeTool: string;
  onToolChange: (toolId: string) => void;
  layout: ToolbarLayout;
  disabled?: boolean;
  readonly?: boolean;
  accessibility: AccessibilityConfig;

  // Action callbacks
  onUndo?: () => void;
  onRedo?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onCut?: () => void;
  onDelete?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  onExport?: () => void;
  onImport?: () => void;

  // State props
  canUndo?: boolean;
  canRedo?: boolean;
  hasSelection?: boolean;
  hasClipboard?: boolean;
  isDirty?: boolean;

  // View controls
  gridVisible?: boolean;
  onToggleGrid?: () => void;
  layersVisible?: boolean;
  onToggleLayers?: () => void;
  guidesVisible?: boolean;
  onToggleGuides?: () => void;
}

export const MainToolbar: React.FC<MainToolbarProps> = ({
  activeTool,
  onToolChange,
  layout,
  disabled = false,
  readonly = false,
  accessibility,
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onCut,
  onDelete,
  onSave,
  onShare,
  onExport,
  onImport,
  canUndo = false,
  canRedo = false,
  hasSelection = false,
  hasClipboard = false,
  isDirty = false,
  gridVisible = true,
  onToggleGrid,
  layersVisible = true,
  onToggleLayers,
  guidesVisible = false,
  onToggleGuides,
}) => {
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['selection', 'drawing']);

  // Group tools by category
  const groupedTools = useMemo(() => {
    const groups = layout.groups.map(group => ({
      ...group,
      tools: group.tools.map(toolId => toolDefinitions.find(t => t.id === toolId)).filter(Boolean) as DrawingTool[],
    }));

    return groups.sort((a, b) => a.priority - b.priority);
  }, [layout.groups]);

  // Handle tool selection with subtool support
  const handleToolSelect = useCallback((tool: DrawingTool) => {
    if (disabled || readonly || tool.disabled) return;

    onToolChange(tool.id);
  }, [onToolChange, disabled, readonly]);

  // Handle tool group expansion
  const toggleGroupExpansion = useCallback((groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  }, []);

  // Render tool button
  const renderToolButton = useCallback((tool: DrawingTool, size: 'sm' | 'md' = 'md') => {
    const isActive = activeTool === tool.id;
    const hasSubtools = tool.subtools && tool.subtools.length > 0;

    const button = (
      <Button
        variant={isActive ? "default" : "ghost"}
        size={size}
        onClick={() => handleToolSelect(tool)}
        disabled={disabled || tool.disabled}
        className={cn(
          "relative",
          size === 'sm' ? "h-8 w-8 p-0" : "h-9 px-3",
          isActive && "ring-2 ring-primary ring-offset-1",
          accessibility.highContrast && isActive && "ring-4",
          tool.premium && "bg-gradient-to-br from-amber-500 to-orange-500 text-white"
        )}
        aria-label={`${tool.name}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
        aria-pressed={isActive}
      >
        <tool.icon className={cn(
          size === 'sm' ? "h-3 w-3" : "h-4 w-4",
          size === 'md' && "mr-2"
        )} />
        {size === 'md' && (
          <span className="text-xs font-medium">{tool.name}</span>
        )}
        {hasSubtools && size === 'md' && (
          <ChevronDown className="h-3 w-3 ml-1" />
        )}
        {tool.premium && (
          <Badge variant="secondary" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
            P
          </Badge>
        )}
      </Button>
    );

    if (hasSubtools) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {button}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {tool.subtools!.map((subtool) => (
              <DropdownMenuItem
                key={subtool.id}
                onClick={() => handleToolSelect(subtool)}
                disabled={disabled || subtool.disabled}
                className="flex items-center gap-2"
              >
                <subtool.icon className="h-4 w-4" />
                <span>{subtool.name}</span>
                {subtool.shortcut && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {subtool.shortcut}
                  </span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return button;
  }, [activeTool, handleToolSelect, disabled, accessibility.highContrast]);

  // Render tool group
  const renderToolGroup = useCallback((group: any) => {
    const isExpanded = expandedGroups.includes(group.id);
    const visibleTools = isExpanded ? group.tools : group.tools.slice(0, 3);

    return (
      <div key={group.id} className="flex items-center gap-1">
        {group.separator && <Separator orientation="vertical" className="h-6" />}

        <div className="flex items-center gap-1">
          {visibleTools.map((tool: DrawingTool) => (
            <Tooltip
              key={tool.id}
              content={
                <div className="space-y-1">
                  <div className="font-medium">{tool.name}</div>
                  <div className="text-xs text-muted-foreground">{tool.description}</div>
                  {tool.shortcut && (
                    <div className="text-xs">
                      <kbd className="px-1 py-0.5 bg-muted rounded text-xs">{tool.shortcut}</kbd>
                    </div>
                  )}
                </div>
              }
              side="bottom"
              delayDuration={accessibility.enabled ? 100 : 500}
            >
              <div>
                {renderToolButton(tool, layout.size === 'small' ? 'sm' : 'md')}
              </div>
            </Tooltip>
          ))}

          {/* More tools dropdown */}
          {group.tools.length > 3 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size={layout.size === 'small' ? 'sm' : 'md'}
                  className={layout.size === 'small' ? "h-8 w-8 p-0" : "h-9 px-2"}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <div className="px-2 py-1.5 text-sm font-medium">{group.name} Tools</div>
                <DropdownMenuSeparator />
                {group.tools.map((tool: DrawingTool) => (
                  <DropdownMenuItem
                    key={tool.id}
                    onClick={() => handleToolSelect(tool)}
                    disabled={disabled || tool.disabled}
                    className="flex items-center gap-2"
                  >
                    <tool.icon className="h-4 w-4" />
                    <span>{tool.name}</span>
                    {tool.shortcut && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        {tool.shortcut}
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    );
  }, [expandedGroups, renderToolButton, handleToolSelect, disabled, layout.size, accessibility.enabled]);

  // Action buttons section
  const renderActionButtons = () => (
    <div className="flex items-center gap-1">
      <Separator orientation="vertical" className="h-6" />

      {/* History actions */}
      <div className="flex items-center gap-1">
        <Tooltip content="Undo (Ctrl+Z)">
          <Button
            variant="ghost"
            size={layout.size === 'small' ? 'sm' : 'md'}
            onClick={onUndo}
            disabled={!canUndo || disabled}
            className={layout.size === 'small' ? "h-8 w-8 p-0" : "h-9 px-3"}
          >
            <Undo2 className="h-4 w-4" />
            {layout.size !== 'small' && <span className="ml-2 text-xs">Undo</span>}
          </Button>
        </Tooltip>

        <Tooltip content="Redo (Ctrl+Y)">
          <Button
            variant="ghost"
            size={layout.size === 'small' ? 'sm' : 'md'}
            onClick={onRedo}
            disabled={!canRedo || disabled}
            className={layout.size === 'small' ? "h-8 w-8 p-0" : "h-9 px-3"}
          >
            <Redo2 className="h-4 w-4" />
            {layout.size !== 'small' && <span className="ml-2 text-xs">Redo</span>}
          </Button>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Clipboard actions */}
      <div className="flex items-center gap-1">
        <Tooltip content="Cut (Ctrl+X)">
          <Button
            variant="ghost"
            size={layout.size === 'small' ? 'sm' : 'md'}
            onClick={onCut}
            disabled={!hasSelection || disabled || readonly}
            className={layout.size === 'small' ? "h-8 w-8 p-0" : "h-9 px-3"}
          >
            <Scissors className="h-4 w-4" />
            {layout.size !== 'small' && <span className="ml-2 text-xs">Cut</span>}
          </Button>
        </Tooltip>

        <Tooltip content="Copy (Ctrl+C)">
          <Button
            variant="ghost"
            size={layout.size === 'small' ? 'sm' : 'md'}
            onClick={onCopy}
            disabled={!hasSelection || disabled}
            className={layout.size === 'small' ? "h-8 w-8 p-0" : "h-9 px-3"}
          >
            <Copy className="h-4 w-4" />
            {layout.size !== 'small' && <span className="ml-2 text-xs">Copy</span>}
          </Button>
        </Tooltip>

        <Tooltip content="Paste (Ctrl+V)">
          <Button
            variant="ghost"
            size={layout.size === 'small' ? 'sm' : 'md'}
            onClick={onPaste}
            disabled={!hasClipboard || disabled || readonly}
            className={layout.size === 'small' ? "h-8 w-8 p-0" : "h-9 px-3"}
          >
            <ClipboardPaste className="h-4 w-4" />
            {layout.size !== 'small' && <span className="ml-2 text-xs">Paste</span>}
          </Button>
        </Tooltip>

        <Tooltip content="Delete (Del)">
          <Button
            variant="ghost"
            size={layout.size === 'small' ? 'sm' : 'md'}
            onClick={onDelete}
            disabled={!hasSelection || disabled || readonly}
            className={layout.size === 'small' ? "h-8 w-8 p-0" : "h-9 px-3"}
          >
            <Trash2 className="h-4 w-4" />
            {layout.size !== 'small' && <span className="ml-2 text-xs">Delete</span>}
          </Button>
        </Tooltip>
      </div>
    </div>
  );

  // View controls section
  const renderViewControls = () => (
    <div className="flex items-center gap-1">
      <Separator orientation="vertical" className="h-6" />

      <Tooltip content="Toggle Grid">
        <Button
          variant={gridVisible ? "default" : "ghost"}
          size={layout.size === 'small' ? 'sm' : 'md'}
          onClick={onToggleGrid}
          className={layout.size === 'small' ? "h-8 w-8 p-0" : "h-9 px-3"}
        >
          <Grid3X3 className="h-4 w-4" />
          {layout.size !== 'small' && <span className="ml-2 text-xs">Grid</span>}
        </Button>
      </Tooltip>

      <Tooltip content="Toggle Layers">
        <Button
          variant={layersVisible ? "default" : "ghost"}
          size={layout.size === 'small' ? 'sm' : 'md'}
          onClick={onToggleLayers}
          className={layout.size === 'small' ? "h-8 w-8 p-0" : "h-9 px-3"}
        >
          <Layers className="h-4 w-4" />
          {layout.size !== 'small' && <span className="ml-2 text-xs">Layers</span>}
        </Button>
      </Tooltip>

      <Tooltip content="Toggle Guides">
        <Button
          variant={guidesVisible ? "default" : "ghost"}
          size={layout.size === 'small' ? 'sm' : 'md'}
          onClick={onToggleGuides}
          className={layout.size === 'small' ? "h-8 w-8 p-0" : "h-9 px-3"}
        >
          {guidesVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          {layout.size !== 'small' && <span className="ml-2 text-xs">Guides</span>}
        </Button>
      </Tooltip>
    </div>
  );

  // File actions section
  const renderFileActions = () => (
    <div className="flex items-center gap-1">
      <Separator orientation="vertical" className="h-6" />

      <Tooltip content="Save (Ctrl+S)">
        <Button
          variant="ghost"
          size={layout.size === 'small' ? 'sm' : 'md'}
          onClick={onSave}
          disabled={!isDirty || disabled}
          className={cn(
            layout.size === 'small' ? "h-8 w-8 p-0" : "h-9 px-3",
            isDirty && "text-orange-600"
          )}
        >
          <Save className="h-4 w-4" />
          {layout.size !== 'small' && <span className="ml-2 text-xs">Save</span>}
          {isDirty && layout.size !== 'small' && <span className="ml-1">•</span>}
        </Button>
      </Tooltip>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size={layout.size === 'small' ? 'sm' : 'md'}
            className={layout.size === 'small' ? "h-8 w-8 p-0" : "h-9 px-3"}
          >
            <Share2 className="h-4 w-4" />
            {layout.size !== 'small' && <span className="ml-2 text-xs">Share</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share Drawing
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export...
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onImport}>
            <Upload className="h-4 w-4 mr-2" />
            Import...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-2 bg-background border-b",
        layout.collapsed && "hidden",
        accessibility.highContrast && "border-b-2",
        disabled && "opacity-50"
      )}
      role="toolbar"
      aria-label="Drawing tools"
    >
      {/* Left section - Main tools */}
      <div className="flex items-center gap-2">
        {groupedTools.map(renderToolGroup)}
        {renderActionButtons()}
      </div>

      {/* Right section - View and file controls */}
      <div className="flex items-center gap-2">
        {renderViewControls()}
        {renderFileActions()}
      </div>

      {/* Screen reader announcements */}
      {accessibility.announcements && (
        <div
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          Current tool: {toolDefinitions.find(t => t.id === activeTool)?.name || 'Unknown'}
        </div>
      )}
    </div>
  );
};