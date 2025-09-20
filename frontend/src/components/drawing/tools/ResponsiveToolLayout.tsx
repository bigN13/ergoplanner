/**
 * Responsive Tool Layout Component - TASK-016 Implementation
 * Adaptive layout for different screen sizes and orientations
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
} from 'react-resizable-panels';
import {
  Menu,
  X,
  Maximize2,
  Minimize2,
  Tablet,
  Smartphone,
  Monitor,
  Settings,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/DropdownMenu';

import { MainToolbar } from './MainToolbar';
import { NodePalette } from './NodePalette';
import { PropertyInspector } from './PropertyInspector';

import { ToolbarLayout } from '@/types/tools';
import { cn } from '@/lib/utils';

interface ResponsiveToolLayoutProps {
  children: React.ReactNode;
  layout: ToolbarLayout;
  onLayoutChange: (layout: Partial<ToolbarLayout>) => void;
  className?: string;
}

type BreakpointSize = 'mobile' | 'tablet' | 'desktop' | 'large';
type LayoutMode = 'compact' | 'standard' | 'expanded';

export const ResponsiveToolLayout: React.FC<ResponsiveToolLayoutProps> = ({
  children,
  layout,
  onLayoutChange,
  className,
}) => {
  // State
  const [breakpoint, setBreakpoint] = useState<BreakpointSize>('desktop');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('standard');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [collapsedPanels, setCollapsedPanels] = useState<string[]>([]);

  // Breakpoint detection
  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setBreakpoint('mobile');
      } else if (width < 1024) {
        setBreakpoint('tablet');
      } else if (width < 1920) {
        setBreakpoint('desktop');
      } else {
        setBreakpoint('large');
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  // Layout mode detection based on screen size
  useEffect(() => {
    switch (breakpoint) {
      case 'mobile':
        setLayoutMode('compact');
        onLayoutChange({
          size: 'small',
          collapsible: true,
          autoHide: true,
        });
        break;
      case 'tablet':
        setLayoutMode('standard');
        onLayoutChange({
          size: 'medium',
          collapsible: true,
          autoHide: false,
        });
        break;
      case 'desktop':
      case 'large':
        setLayoutMode('expanded');
        onLayoutChange({
          size: 'large',
          collapsible: false,
          autoHide: false,
        });
        break;
    }
  }, [breakpoint, onLayoutChange]);

  // Panel management
  const togglePanel = useCallback((panelId: string) => {
    setCollapsedPanels(prev =>
      prev.includes(panelId)
        ? prev.filter(id => id !== panelId)
        : [...prev, panelId]
    );
  }, []);

  const isCollapsed = useCallback((panelId: string) => {
    return collapsedPanels.includes(panelId);
  }, [collapsedPanels]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Layout configurations for different breakpoints
  const getLayoutConfig = () => {
    switch (breakpoint) {
      case 'mobile':
        return {
          toolbarPosition: 'bottom' as const,
          palettePosition: 'overlay' as const,
          propertyPosition: 'overlay' as const,
          showMiniControls: true,
          stackVertically: true,
        };
      case 'tablet':
        return {
          toolbarPosition: 'top' as const,
          palettePosition: 'left' as const,
          propertyPosition: 'right' as const,
          showMiniControls: false,
          stackVertically: false,
        };
      default:
        return {
          toolbarPosition: 'top' as const,
          palettePosition: 'left' as const,
          propertyPosition: 'right' as const,
          showMiniControls: false,
          stackVertically: false,
        };
    }
  };

  const layoutConfig = getLayoutConfig();

  // Render mobile toolbar
  const renderMobileToolbar = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-2 z-50">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => togglePanel('palette')}
          className="h-8 w-8 p-0"
        >
          <Menu className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1">
          {/* Essential tools only */}
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <span className="text-xs">S</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <span className="text-xs">P</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <span className="text-xs">T</span>
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => togglePanel('properties')}
          className="h-8 w-8 p-0"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Render overlay panel
  const renderOverlayPanel = (
    panelId: string,
    title: string,
    content: React.ReactNode,
    side: 'left' | 'right' | 'bottom' = 'left'
  ) => {
    if (isCollapsed(panelId)) return null;

    const panelClasses = cn(
      "fixed bg-background border shadow-lg z-40 transition-transform duration-200",
      side === 'left' && "left-0 top-0 bottom-0 w-80",
      side === 'right' && "right-0 top-0 bottom-0 w-80",
      side === 'bottom' && "left-0 right-0 bottom-16 h-96"
    );

    return createPortal(
      <div className={panelClasses}>
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold text-sm">{title}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => togglePanel(panelId)}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex-1 overflow-auto">
          {content}
        </div>
      </div>,
      document.body
    );
  };

  // Render desktop layout
  const renderDesktopLayout = () => (
    <PanelGroup direction="horizontal">
      {/* Left panel - Node palette */}
      <Panel defaultSize={20} minSize={15} maxSize={30}>
        <div className="h-full border-r">
          <NodePalette
            categories={[]}
            selectedCategory=""
            onCategoryChange={() => {}}
            onNodeAdd={() => {}}
            searchQuery=""
            recentNodes={[]}
            favoriteNodes={[]}
          />
        </div>
      </Panel>

      <PanelResizeHandle className="w-1 bg-border hover:bg-primary/20 transition-colors" />

      {/* Center panel - Canvas */}
      <Panel defaultSize={60} minSize={40}>
        <div className="h-full relative">
          {children}
        </div>
      </Panel>

      <PanelResizeHandle className="w-1 bg-border hover:bg-primary/20 transition-colors" />

      {/* Right panel - Properties */}
      <Panel defaultSize={20} minSize={15} maxSize={30}>
        <div className="h-full border-l">
          <PropertyInspector
            visible={true}
            position="right"
            width={320}
            selectedObjects={[]}
            onPropertyChange={() => {}}
            onToggle={() => {}}
          />
        </div>
      </Panel>
    </PanelGroup>
  );

  // Render tablet layout
  const renderTabletLayout = () => (
    <div className="flex h-full">
      {/* Collapsible left panel */}
      <div
        className={cn(
          "transition-all duration-200 border-r bg-background",
          isCollapsed('palette') ? "w-12" : "w-64"
        )}
      >
        <div className="flex items-center justify-between p-2 border-b">
          {!isCollapsed('palette') && (
            <h3 className="font-semibold text-sm">Tools</h3>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => togglePanel('palette')}
            className="h-6 w-6 p-0"
          >
            {isCollapsed('palette') ? <Menu className="h-3 w-3" /> : <X className="h-3 w-3" />}
          </Button>
        </div>
        {!isCollapsed('palette') && (
          <NodePalette
            categories={[]}
            selectedCategory=""
            onCategoryChange={() => {}}
            onNodeAdd={() => {}}
            searchQuery=""
            recentNodes={[]}
            favoriteNodes={[]}
          />
        )}
      </div>

      {/* Main canvas area */}
      <div className="flex-1 relative">
        {children}
      </div>

      {/* Collapsible right panel */}
      <div
        className={cn(
          "transition-all duration-200 border-l bg-background",
          isCollapsed('properties') ? "w-12" : "w-80"
        )}
      >
        <div className="flex items-center justify-between p-2 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => togglePanel('properties')}
            className="h-6 w-6 p-0"
          >
            {isCollapsed('properties') ? <Settings className="h-3 w-3" /> : <X className="h-3 w-3" />}
          </Button>
          {!isCollapsed('properties') && (
            <h3 className="font-semibold text-sm">Properties</h3>
          )}
        </div>
        {!isCollapsed('properties') && (
          <PropertyInspector
            visible={true}
            position="right"
            width={320}
            selectedObjects={[]}
            onPropertyChange={() => {}}
            onToggle={() => {}}
          />
        )}
      </div>
    </div>
  );

  // Render layout controls
  const renderLayoutControls = () => (
    <div className="fixed top-4 right-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 px-2">
            {breakpoint === 'mobile' && <Smartphone className="h-3 w-3 mr-1" />}
            {breakpoint === 'tablet' && <Tablet className="h-3 w-3 mr-1" />}
            {(breakpoint === 'desktop' || breakpoint === 'large') && <Monitor className="h-3 w-3 mr-1" />}
            Layout
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 className="h-4 w-4 mr-2" /> : <Maximize2 className="h-4 w-4 mr-2" />}
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={layoutMode === 'compact'}
            onCheckedChange={() => setLayoutMode('compact')}
          >
            Compact Mode
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={layoutMode === 'standard'}
            onCheckedChange={() => setLayoutMode('standard')}
          >
            Standard Mode
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={layoutMode === 'expanded'}
            onCheckedChange={() => setLayoutMode('expanded')}
          >
            Expanded Mode
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onLayoutChange({ collapsed: !layout.collapsed })}>
            {layout.collapsed ? 'Show Toolbar' : 'Hide Toolbar'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className={cn("h-screen flex flex-col", className)}>
      {/* Top toolbar (desktop/tablet) */}
      {layoutConfig.toolbarPosition === 'top' && !layout.collapsed && (
        <div className="border-b bg-background">
          <MainToolbar
            activeTool=""
            onToolChange={() => {}}
            layout={layout}
          />
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
        {breakpoint === 'mobile' && (
          <div className="h-full pb-16">
            {children}
          </div>
        )}

        {breakpoint === 'tablet' && renderTabletLayout()}

        {(breakpoint === 'desktop' || breakpoint === 'large') && renderDesktopLayout()}
      </div>

      {/* Bottom toolbar (mobile) */}
      {layoutConfig.toolbarPosition === 'bottom' && renderMobileToolbar()}

      {/* Overlay panels for mobile */}
      {breakpoint === 'mobile' && (
        <>
          {renderOverlayPanel(
            'palette',
            'Tools & Components',
            <NodePalette
              categories={[]}
              selectedCategory=""
              onCategoryChange={() => {}}
              onNodeAdd={() => {}}
              searchQuery=""
              recentNodes={[]}
              favoriteNodes={[]}
            />,
            'left'
          )}
          {renderOverlayPanel(
            'properties',
            'Properties',
            <PropertyInspector
              visible={true}
              position="bottom"
              width={320}
              height={300}
              selectedObjects={[]}
              onPropertyChange={() => {}}
              onToggle={() => {}}
            />,
            'bottom'
          )}
        </>
      )}

      {/* Layout controls */}
      {renderLayoutControls()}

      {/* Overlay for collapsed panels */}
      {collapsedPanels.length > 0 && breakpoint === 'mobile' && (
        <div
          className="fixed inset-0 bg-black/20 z-30"
          onClick={() => setCollapsedPanels([])}
        />
      )}
    </div>
  );
};