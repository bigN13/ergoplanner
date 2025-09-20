/**
 * Context-Sensitive Tool Options - TASK-016 Implementation
 * Dynamic tool options panel that adapts based on active tool and selection
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Settings,
  Palette,
  Sliders,
  Type,
  Circle,
  Square,
  Triangle,
  Minus,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Lock,
  Unlock,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Slider } from '@/components/ui/Slider';
import { Switch } from '@/components/ui/Switch';
import { Tooltip } from '@/components/ui/Tooltip';
import { Separator } from '@/components/ui/Separator';
import { Badge } from '@/components/ui/Badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/Collapsible';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';

import { DrawingTool, ToolOptions, SelectedObject } from '@/types/tools';
import { cn } from '@/lib/utils';

interface ContextToolOptionsProps {
  activeTool: DrawingTool | null;
  toolOptions: ToolOptions;
  selectedObjects: SelectedObject[];
  onToolOptionsChange: (options: Partial<ToolOptions>) => void;
  onObjectPropertyChange: (objectId: string, property: string, value: any) => void;
  disabled?: boolean;
  readonly?: boolean;
  className?: string;
}

export const ContextToolOptions: React.FC<ContextToolOptionsProps> = ({
  activeTool,
  toolOptions,
  selectedObjects,
  onToolOptionsChange,
  onObjectPropertyChange,
  disabled = false,
  readonly = false,
  className,
}) => {
  // Local state
  const [expandedSections, setExpandedSections] = useState<string[]>(['drawing', 'style']);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Computed values
  const hasSelection = selectedObjects.length > 0;
  const isMultiSelection = selectedObjects.length > 1;
  const toolCategory = activeTool?.category;

  // Toggle section expansion
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  }, []);

  // Handle tool option change
  const handleOptionChange = useCallback(<K extends keyof ToolOptions>(
    key: K,
    value: ToolOptions[K]
  ) => {
    onToolOptionsChange({ [key]: value });
  }, [onToolOptionsChange]);

  // Handle object property change for all selected objects
  const handleObjectPropertyChange = useCallback((property: string, value: any) => {
    selectedObjects.forEach(obj => {
      onObjectPropertyChange(obj.id, property, value);
    });
  }, [selectedObjects, onObjectPropertyChange]);

  // Color picker component
  const ColorPicker = ({ value, onChange, label }: {
    value: string;
    onChange: (color: string) => void;
    label: string;
  }) => (
    <div className="flex items-center gap-2">
      <Label className="text-xs font-medium">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-6 w-12 p-0 border"
            style={{ backgroundColor: value }}
          >
            <span className="sr-only">Pick color</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3">
          <div className="space-y-3">
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full h-8 border rounded cursor-pointer"
            />
            <div className="grid grid-cols-6 gap-1">
              {[
                '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00',
                '#ff00ff', '#00ffff', '#888888', '#444444', '#cccccc', '#999999',
              ].map(color => (
                <button
                  key={color}
                  onClick={() => onChange(color)}
                  className="w-6 h-6 border rounded cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#000000"
              className="text-xs"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );

  // Render drawing options for drawing tools
  const renderDrawingOptions = () => {
    if (!activeTool || !['draw-pipe', 'draw-signal', 'add-component'].includes(activeTool.id)) {
      return null;
    }

    return (
      <Collapsible
        open={expandedSections.includes('drawing')}
        onOpenChange={() => toggleSection('drawing')}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between h-8 text-xs">
            <span className="flex items-center gap-2">
              <Sliders className="h-3 w-3" />
              Drawing Options
            </span>
            {expandedSections.includes('drawing') ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 p-3">
          {/* Snap options */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Snap to Grid</Label>
              <Switch
                checked={toolOptions.snapToGrid || false}
                onCheckedChange={(checked) => handleOptionChange('snapToGrid', checked)}
                disabled={disabled}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Snap to Objects</Label>
              <Switch
                checked={toolOptions.snapToNode || false}
                onCheckedChange={(checked) => handleOptionChange('snapToNode', checked)}
                disabled={disabled}
              />
            </div>
            {(toolOptions.snapToGrid || toolOptions.snapToNode) && (
              <div className="space-y-1">
                <Label className="text-xs">Snap Distance</Label>
                <Slider
                  value={[toolOptions.snapDistance || 10]}
                  onValueChange={([value]) => handleOptionChange('snapDistance', value)}
                  min={5}
                  max={50}
                  step={5}
                  disabled={disabled}
                />
                <div className="text-xs text-muted-foreground text-center">
                  {toolOptions.snapDistance || 10}px
                </div>
              </div>
            )}
          </div>

          {/* Auto-connect for pipe/signal tools */}
          {['draw-pipe', 'draw-signal'].includes(activeTool.id) && (
            <div className="flex items-center justify-between">
              <Label className="text-xs">Auto Connect</Label>
              <Switch
                checked={toolOptions.autoConnect || false}
                onCheckedChange={(checked) => handleOptionChange('autoConnect', checked)}
                disabled={disabled}
              />
            </div>
          )}

          {/* Preview options */}
          <div className="flex items-center justify-between">
            <Label className="text-xs">Show Preview</Label>
            <Switch
              checked={toolOptions.showPreview || false}
              onCheckedChange={(checked) => handleOptionChange('showPreview', checked)}
              disabled={disabled}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  // Render style options
  const renderStyleOptions = () => {
    if (!activeTool) return null;

    const showStrokeOptions = ['draw-pipe', 'draw-signal', 'add-annotation'].includes(activeTool.id);
    const showFillOptions = ['add-component', 'add-annotation'].includes(activeTool.id);

    if (!showStrokeOptions && !showFillOptions) return null;

    return (
      <Collapsible
        open={expandedSections.includes('style')}
        onOpenChange={() => toggleSection('style')}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between h-8 text-xs">
            <span className="flex items-center gap-2">
              <Palette className="h-3 w-3" />
              Style Options
            </span>
            {expandedSections.includes('style') ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 p-3">
          {/* Stroke options */}
          {showStrokeOptions && (
            <div className="space-y-2">
              <ColorPicker
                value={toolOptions.strokeColor || '#000000'}
                onChange={(color) => handleOptionChange('strokeColor', color)}
                label="Stroke"
              />
              <div className="space-y-1">
                <Label className="text-xs">Width</Label>
                <Slider
                  value={[toolOptions.strokeWidth || 2]}
                  onValueChange={([value]) => handleOptionChange('strokeWidth', value)}
                  min={1}
                  max={10}
                  step={1}
                  disabled={disabled}
                />
                <div className="text-xs text-muted-foreground text-center">
                  {toolOptions.strokeWidth || 2}px
                </div>
              </div>
              {/* Line dash for signals */}
              {activeTool.id === 'draw-signal' && (
                <div className="space-y-2">
                  <Label className="text-xs">Line Style</Label>
                  <Select
                    value={toolOptions.lineDash ? 'dashed' : 'solid'}
                    onValueChange={(value) =>
                      handleOptionChange('lineDash', value === 'dashed' ? [5, 5] : undefined)
                    }
                  >
                    <SelectTrigger className="h-6 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solid">Solid</SelectItem>
                      <SelectItem value="dashed">Dashed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Fill options */}
          {showFillOptions && (
            <div className="space-y-2">
              <ColorPicker
                value={toolOptions.fillColor || '#ffffff'}
                onChange={(color) => handleOptionChange('fillColor', color)}
                label="Fill"
              />
              <div className="space-y-1">
                <Label className="text-xs">Opacity</Label>
                <Slider
                  value={[(toolOptions.opacity || 1) * 100]}
                  onValueChange={([value]) => handleOptionChange('opacity', value / 100)}
                  min={0}
                  max={100}
                  step={5}
                  disabled={disabled}
                />
                <div className="text-xs text-muted-foreground text-center">
                  {Math.round((toolOptions.opacity || 1) * 100)}%
                </div>
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  // Render selection options when objects are selected
  const renderSelectionOptions = () => {
    if (!hasSelection) return null;

    const firstObject = selectedObjects[0];
    const commonProperties = isMultiSelection
      ? {} // For multi-selection, show only common properties
      : firstObject.properties;

    return (
      <Collapsible
        open={expandedSections.includes('selection')}
        onOpenChange={() => toggleSection('selection')}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between h-8 text-xs">
            <span className="flex items-center gap-2">
              <Settings className="h-3 w-3" />
              Selection ({selectedObjects.length})
            </span>
            {expandedSections.includes('selection') ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 p-3">
          {/* Object visibility */}
          <div className="flex items-center justify-between">
            <Label className="text-xs">Visible</Label>
            <Switch
              checked={!commonProperties.hidden}
              onCheckedChange={(checked) => handleObjectPropertyChange('hidden', !checked)}
              disabled={disabled || readonly}
            />
          </div>

          {/* Object locking */}
          <div className="flex items-center justify-between">
            <Label className="text-xs">Locked</Label>
            <Switch
              checked={commonProperties.locked || false}
              onCheckedChange={(checked) => handleObjectPropertyChange('locked', checked)}
              disabled={disabled || readonly}
            />
          </div>

          {/* Layer assignment */}
          <div className="space-y-1">
            <Label className="text-xs">Layer</Label>
            <Select
              value={commonProperties.layer || 'default'}
              onValueChange={(value) => handleObjectPropertyChange('layer', value)}
              disabled={disabled || readonly}
            >
              <SelectTrigger className="h-6 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
                <SelectItem value="piping">Piping</SelectItem>
                <SelectItem value="instrumentation">Instrumentation</SelectItem>
                <SelectItem value="annotations">Annotations</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleObjectPropertyChange('hidden', true)}
              disabled={disabled || readonly}
              className="h-6 text-xs"
            >
              <EyeOff className="h-3 w-3 mr-1" />
              Hide
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleObjectPropertyChange('locked', true)}
              disabled={disabled || readonly}
              className="h-6 text-xs"
            >
              <Lock className="h-3 w-3 mr-1" />
              Lock
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  // Render advanced options
  const renderAdvancedOptions = () => {
    if (!showAdvanced || !activeTool) return null;

    return (
      <Collapsible
        open={expandedSections.includes('advanced')}
        onOpenChange={() => toggleSection('advanced')}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between h-8 text-xs">
            <span className="flex items-center gap-2">
              <MoreHorizontal className="h-3 w-3" />
              Advanced Options
            </span>
            {expandedSections.includes('advanced') ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 p-3">
          {/* Validation options */}
          <div className="flex items-center justify-between">
            <Label className="text-xs">Validate on Create</Label>
            <Switch
              checked={toolOptions.validateOnCreate || false}
              onCheckedChange={(checked) => handleOptionChange('validateOnCreate', checked)}
              disabled={disabled}
            />
          </div>

          {/* Overlap prevention */}
          <div className="flex items-center justify-between">
            <Label className="text-xs">Prevent Overlap</Label>
            <Switch
              checked={toolOptions.preventOverlap || false}
              onCheckedChange={(checked) => handleOptionChange('preventOverlap', checked)}
              disabled={disabled}
            />
          </div>

          {/* Multi-select preservation */}
          <div className="flex items-center justify-between">
            <Label className="text-xs">Preserve Selection</Label>
            <Switch
              checked={toolOptions.preserveSelection || false}
              onCheckedChange={(checked) => handleOptionChange('preserveSelection', checked)}
              disabled={disabled}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  // Don't render if no active tool and no selection
  if (!activeTool && !hasSelection) {
    return (
      <div className={cn("p-4 text-center text-muted-foreground", className)}>
        <Settings className="h-8 w-8 mx-auto mb-2" />
        <p className="text-sm">Select a tool or objects to see options</p>
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-sm bg-background border rounded-lg", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          {activeTool && <activeTool.icon className="h-4 w-4" />}
          <span className="font-medium text-sm">
            {activeTool ? activeTool.name : 'Selection'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {activeTool && (
            <Badge variant="secondary" className="text-xs">
              {activeTool.category}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="h-6 w-6 p-0"
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Options content */}
      <div className="p-2 space-y-1">
        {renderDrawingOptions()}
        {renderStyleOptions()}
        {renderSelectionOptions()}
        {renderAdvancedOptions()}
      </div>

      {/* Footer with current settings summary */}
      <div className="p-2 border-t bg-muted/30">
        <div className="text-xs text-muted-foreground">
          {activeTool && (
            <div className="flex items-center justify-between">
              <span>Tool: {activeTool.name}</span>
              {activeTool.shortcut && (
                <Badge variant="outline" className="text-xs">
                  {activeTool.shortcut}
                </Badge>
              )}
            </div>
          )}
          {hasSelection && (
            <div className="flex items-center justify-between mt-1">
              <span>{selectedObjects.length} selected</span>
              <span className="text-xs">
                {isMultiSelection ? 'Multi-selection' : selectedObjects[0].type}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};