/**
 * Drawing Tools Palette - TASK-016 Main Component
 * Professional-grade tool palette with comprehensive functionality
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from 'react-resizable-panels';
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Search,
  X,
  MoreVertical,
  Pin,
  PinOff,
} from 'lucide-react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectToolPaletteState,
  setActiveTool,
  togglePalette,
  setPaletteWidth,
  setSelectedCategory,
  togglePropertyInspector,
  setPreferences,
} from '@/store/slices/toolPaletteSlice';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tooltip } from '@/components/ui/Tooltip';
import { Separator } from '@/components/ui/Separator';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';

import { MainToolbar } from './MainToolbar';
import { NodePalette } from './NodePalette';
import { PropertyInspector } from './PropertyInspector';
import { ToolSearchDialog } from './ToolSearchDialog';
import { ToolSettingsDialog } from './ToolSettingsDialog';
import { KeyboardShortcutsOverlay } from './KeyboardShortcutsOverlay';

import { toolDefinitions, nodePaletteData } from '@/data/toolDefinitions';
import { DrawingTool, ToolCategory } from '@/types/tools';
import { cn } from '@/lib/utils';

interface DrawingToolsPaletteProps {
  className?: string;
  onToolChange?: (toolId: string) => void;
  onNodeAdd?: (nodeType: string, position: { x: number; y: number }) => void;
  onPropertyChange?: (objectId: string, property: string, value: any) => void;
  disabled?: boolean;
  readonly?: boolean;
}

export const DrawingToolsPalette: React.FC<DrawingToolsPaletteProps> = ({
  className,
  onToolChange,
  onNodeAdd,
  onPropertyChange,
  disabled = false,
  readonly = false,
}) => {
  const dispatch = useAppDispatch();
  const toolPaletteState = useAppSelector(selectToolPaletteState);

  // Local state
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [shortcutsVisible, setShortcutsVisible] = useState(false);
  const [isPinned, setIsPinned] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // Destructure state
  const {
    activeTool,
    paletteState,
    propertyInspector,
    toolbarLayout,
    preferences,
    accessibility,
  } = toolPaletteState;

  // Computed values
  const activeToolDefinition = useMemo(() => {
    return toolDefinitions.find(tool => tool.id === activeTool);
  }, [activeTool]);

  const shouldAutoHide = useMemo(() => {
    return !isPinned && !isHovered && !paletteState.expanded;
  }, [isPinned, isHovered, paletteState.expanded]);

  // Event handlers
  const handleToolChange = useCallback((toolId: string) => {
    if (disabled || readonly) return;

    dispatch(setActiveTool(toolId));
    onToolChange?.(toolId);

    // Add to recent tools
    // This would be handled by the slice
  }, [dispatch, onToolChange, disabled, readonly]);

  const handleNodeAdd = useCallback((nodeType: string, position: { x: number; y: number }) => {
    if (disabled || readonly) return;

    onNodeAdd?.(nodeType, position);
  }, [onNodeAdd, disabled, readonly]);

  const handlePropertyChange = useCallback((objectId: string, property: string, value: any) => {
    if (disabled || readonly) return;

    onPropertyChange?.(objectId, property, value);
  }, [onPropertyChange, disabled, readonly]);

  const handleSearchOpen = useCallback((event?: React.KeyboardEvent) => {
    if (event?.ctrlKey && event?.key === 'k') {
      event.preventDefault();
      setSearchDialogOpen(true);
    }
  }, []);

  const handleTogglePalette = useCallback(() => {
    dispatch(togglePalette());
  }, [dispatch]);

  const handleTogglePropertyInspector = useCallback(() => {
    dispatch(togglePropertyInspector());
  }, [dispatch]);

  const handlePaletteResize = useCallback((size: number) => {
    dispatch(setPaletteWidth(size));
  }, [dispatch]);

  const handlePin = useCallback(() => {
    setIsPinned(!isPinned);
  }, [isPinned]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Search shortcut
      if (event.ctrlKey && event.key === 'k') {
        event.preventDefault();
        setSearchDialogOpen(true);
        return;
      }

      // Help shortcut
      if (event.key === 'F1' || (event.ctrlKey && event.key === '?')) {
        event.preventDefault();
        setShortcutsVisible(!shortcutsVisible);
        return;
      }

      // Tool shortcuts
      const shortcut = event.ctrlKey
        ? `ctrl+${event.key.toLowerCase()}`
        : event.shiftKey
        ? `shift+${event.key.toLowerCase()}`
        : event.key.toLowerCase();

      const tool = toolDefinitions.find(t => t.hotkey === shortcut);
      if (tool && !disabled && !readonly) {
        event.preventDefault();
        handleToolChange(tool.id);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleToolChange, shortcutsVisible, disabled, readonly]);

  // Auto-hide logic
  useEffect(() => {
    if (toolbarLayout.autoHide && shouldAutoHide) {
      const timer = setTimeout(() => {
        // Auto-hide palette if not pinned and not hovered
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [shouldAutoHide, toolbarLayout.autoHide]);

  // Accessibility announcements
  useEffect(() => {
    if (accessibility.announcements && activeToolDefinition) {
      const message = `Tool changed to ${activeToolDefinition.name}`;
      // This would use an actual screen reader announcement system
      console.log('Accessibility announcement:', message);
    }
  }, [activeToolDefinition, accessibility.announcements]);

  // Render components
  const renderMainToolbar = () => (
    <MainToolbar
      activeTool={activeTool}
      onToolChange={handleToolChange}
      layout={toolbarLayout}
      disabled={disabled}
      readonly={readonly}
      accessibility={accessibility}
    />
  );

  const renderNodePalette = () => (
    <NodePalette
      categories={nodePaletteData}
      selectedCategory={paletteState.selectedCategory}
      onCategoryChange={(categoryId) => dispatch(setSelectedCategory(categoryId))}
      onNodeAdd={handleNodeAdd}
      searchQuery={paletteState.searchState.query}
      recentNodes={paletteState.recentNodes}
      favoriteNodes={paletteState.favoriteNodes}
      disabled={disabled}
      readonly={readonly}
    />
  );

  const renderPropertyInspector = () => (
    <PropertyInspector
      visible={propertyInspector.visible}
      position={propertyInspector.position}
      width={propertyInspector.width}
      height={propertyInspector.height}
      selectedObjects={propertyInspector.selectedObjects}
      onPropertyChange={handlePropertyChange}
      onToggle={handleTogglePropertyInspector}
      disabled={disabled}
      readonly={readonly}
    />
  );

  const renderPaletteHeader = () => (
    <div className="flex items-center justify-between p-3 border-b bg-background">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-sm">Tools</h3>
        {activeToolDefinition && (
          <Badge variant="secondary" className="text-xs">
            {activeToolDefinition.name}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Tooltip content="Search tools (Ctrl+K)">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchDialogOpen(true)}
            className="h-7 w-7 p-0"
          >
            <Search className="h-3 w-3" />
          </Button>
        </Tooltip>

        <Tooltip content={isPinned ? "Unpin palette" : "Pin palette"}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePin}
            className="h-7 w-7 p-0"
          >
            {isPinned ? <Pin className="h-3 w-3" /> : <PinOff className="h-3 w-3" />}
          </Button>
        </Tooltip>

        <Tooltip content="Settings">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSettingsDialogOpen(true)}
            className="h-7 w-7 p-0"
          >
            <Settings className="h-3 w-3" />
          </Button>
        </Tooltip>

        <Tooltip content={paletteState.expanded ? "Collapse" : "Expand"}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleTogglePalette}
            className="h-7 w-7 p-0"
          >
            {paletteState.expanded ? (
              <ChevronLeft className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        </Tooltip>
      </div>
    </div>
  );

  const renderPaletteContent = () => {
    if (!paletteState.expanded) {
      return (
        <div className="p-2 flex flex-col gap-1">
          {toolDefinitions.slice(0, 6).map((tool) => (
            <Tooltip key={tool.id} content={tool.name} side="right">
              <Button
                variant={activeTool === tool.id ? "default" : "ghost"}
                size="sm"
                onClick={() => handleToolChange(tool.id)}
                className="h-8 w-8 p-0"
                disabled={disabled || tool.disabled}
              >
                <tool.icon className="h-4 w-4" />
              </Button>
            </Tooltip>
          ))}
        </div>
      );
    }

    return (
      <Tabs value="tools" className="flex-1 flex flex-col">
        <TabsList className="mx-3 mt-2 grid w-auto grid-cols-2">
          <TabsTrigger value="tools" className="text-xs">Tools</TabsTrigger>
          <TabsTrigger value="nodes" className="text-xs">Nodes</TabsTrigger>
        </TabsList>

        <TabsContent value="tools" className="flex-1 m-0 p-3">
          <div className="space-y-4">
            {/* Tool categories */}
            {Object.values(ToolCategory).map((category) => {
              const categoryTools = toolDefinitions.filter(tool => tool.category === category);
              if (categoryTools.length === 0) return null;

              return (
                <div key={category} className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {category}
                  </h4>
                  <div className="grid grid-cols-2 gap-1">
                    {categoryTools.map((tool) => (
                      <Tooltip key={tool.id} content={`${tool.name}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}>
                        <Button
                          variant={activeTool === tool.id ? "default" : "ghost"}
                          size="sm"
                          onClick={() => handleToolChange(tool.id)}
                          className="h-8 justify-start gap-2 text-xs"
                          disabled={disabled || tool.disabled}
                        >
                          <tool.icon className="h-3 w-3" />
                          <span className="truncate">{tool.name}</span>
                        </Button>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="nodes" className="flex-1 m-0">
          {renderNodePalette()}
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <>
      {/* Main toolbar */}
      <div className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-background border-b",
        toolbarLayout.collapsed && "hidden",
        className
      )}>
        {renderMainToolbar()}
      </div>

      {/* Tool palette */}
      <div
        className={cn(
          "fixed left-0 top-14 bottom-0 z-40 bg-background border-r transition-all duration-200",
          shouldAutoHide && "translate-x-[-100%]",
          !paletteState.expanded && "w-16",
          paletteState.expanded && `w-[${paletteState.width}px]`
        )}
        style={{ width: paletteState.expanded ? `${paletteState.width}px` : '64px' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <PanelGroup direction="vertical">
          <Panel defaultSize={100} className="flex flex-col">
            {renderPaletteHeader()}
            <div className="flex-1 overflow-auto">
              {renderPaletteContent()}
            </div>
          </Panel>
        </PanelGroup>

        {/* Resize handle */}
        {paletteState.expanded && (
          <div
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize bg-border hover:bg-primary/20 transition-colors"
            onMouseDown={(e) => {
              // Implement resize logic
              e.preventDefault();
            }}
          />
        )}
      </div>

      {/* Property inspector */}
      {propertyInspector.visible && renderPropertyInspector()}

      {/* Search dialog */}
      <ToolSearchDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        tools={toolDefinitions}
        nodes={nodePaletteData}
        onToolSelect={handleToolChange}
        onNodeSelect={(nodeId) => {
          // Handle node selection from search
          console.log('Selected node from search:', nodeId);
        }}
      />

      {/* Settings dialog */}
      <ToolSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        preferences={preferences}
        accessibility={accessibility}
        onPreferencesChange={(prefs) => dispatch(setPreferences(prefs))}
      />

      {/* Keyboard shortcuts overlay */}
      <KeyboardShortcutsOverlay
        visible={shortcutsVisible}
        onClose={() => setShortcutsVisible(false)}
        tools={toolDefinitions}
      />

      {/* Development info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 p-2 bg-background border rounded text-xs text-muted-foreground">
          Active: {activeTool} | Tools: {toolDefinitions.length} | Nodes: {nodePaletteData.length}
        </div>
      )}
    </>
  );
};