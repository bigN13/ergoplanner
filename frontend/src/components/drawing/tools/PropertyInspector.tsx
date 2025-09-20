/**
 * Property Inspector Component - TASK-016 Implementation
 * Context-sensitive property editing panel for selected elements
 */

'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Search,
  Settings,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Paste,
  RotateCcw,
  X,
  Info,
  AlertTriangle,
  CheckCircle,
  Edit,
  Save,
  Undo,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Tooltip } from '@/components/ui/Tooltip';
import { Separator } from '@/components/ui/Separator';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Slider } from '@/components/ui/Slider';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/Collapsible';

import {
  SelectedObject,
  PropertyGroup,
  PropertyDefinition,
  PropertyType,
  PropertyValue,
  PropertyFilter,
} from '@/types/tools';
import { cn } from '@/lib/utils';

interface PropertyInspectorProps {
  visible: boolean;
  position: 'left' | 'right' | 'bottom' | 'floating';
  width: number;
  height?: number;
  selectedObjects: SelectedObject[];
  onPropertyChange: (objectId: string, property: string, value: PropertyValue) => void;
  onToggle: () => void;
  disabled?: boolean;
  readonly?: boolean;
  className?: string;
}

export const PropertyInspector: React.FC<PropertyInspectorProps> = ({
  visible,
  position,
  width,
  height,
  selectedObjects,
  onPropertyChange,
  onToggle,
  disabled = false,
  readonly = false,
  className,
}) => {
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['general', 'engineering']);
  const [activeTab, setActiveTab] = useState<'properties' | 'engineering' | 'validation'>('properties');
  const [filters, setFilters] = useState<PropertyFilter[]>([]);
  const [editingProperty, setEditingProperty] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Record<string, PropertyValue>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Computed values
  const hasSelection = selectedObjects.length > 0;
  const isMultiSelection = selectedObjects.length > 1;
  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  // Group properties by category for selected objects
  const groupedProperties = useMemo(() => {
    if (selectedObjects.length === 0) return [];

    // If multiple objects selected, show common properties
    if (isMultiSelection) {
      const commonProperties = new Map<string, PropertyDefinition>();

      selectedObjects.forEach((obj, index) => {
        Object.entries(obj.properties).forEach(([key, value]) => {
          if (index === 0) {
            commonProperties.set(key, {
              key,
              name: key,
              type: PropertyType.STRING,
              value,
              readonly: obj.readonly,
            });
          } else if (commonProperties.has(key)) {
            const prop = commonProperties.get(key)!;
            // Mark as mixed value if different
            if (prop.value !== value) {
              prop.value = '(Mixed)';
            }
          } else {
            commonProperties.delete(key);
          }
        });
      });

      return [
        {
          name: 'Common Properties',
          expanded: true,
          properties: Array.from(commonProperties.values()),
        },
      ];
    }

    // Single object - organize properties by groups
    const obj = selectedObjects[0];
    const groups: PropertyGroup[] = [];

    // General properties group
    const generalProps: PropertyDefinition[] = [
      {
        key: 'id',
        name: 'ID',
        type: PropertyType.STRING,
        value: obj.id,
        readonly: true,
      },
      {
        key: 'name',
        name: 'Name',
        type: PropertyType.STRING,
        value: obj.name,
        readonly: obj.readonly,
      },
      {
        key: 'type',
        name: 'Type',
        type: PropertyType.STRING,
        value: obj.type,
        readonly: true,
      },
      {
        key: 'category',
        name: 'Category',
        type: PropertyType.STRING,
        value: obj.category,
        readonly: true,
      },
    ];

    groups.push({
      name: 'General',
      expanded: expandedGroups.includes('general'),
      properties: generalProps,
    });

    // Engineering properties group
    const engineeringProps: PropertyDefinition[] = [];
    Object.entries(obj.properties).forEach(([key, value]) => {
      if (!['id', 'name', 'type', 'category'].includes(key)) {
        engineeringProps.push({
          key,
          name: formatPropertyName(key),
          type: inferPropertyType(value),
          value,
          readonly: obj.readonly,
          unit: getPropertyUnit(key),
        });
      }
    });

    if (engineeringProps.length > 0) {
      groups.push({
        name: 'Engineering',
        expanded: expandedGroups.includes('engineering'),
        properties: engineeringProps,
      });
    }

    return groups;
  }, [selectedObjects, expandedGroups, isMultiSelection]);

  // Filter properties based on search and filters
  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim() && filters.length === 0) {
      return groupedProperties;
    }

    return groupedProperties.map(group => ({
      ...group,
      properties: group.properties.filter(prop => {
        // Search filter
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          if (!prop.name.toLowerCase().includes(term) &&
              !prop.key.toLowerCase().includes(term) &&
              !String(prop.value).toLowerCase().includes(term)) {
            return false;
          }
        }

        // Additional filters
        for (const filter of filters) {
          switch (filter.type) {
            case 'readonly':
              if (filter.enabled && prop.readonly !== (filter.value === 'true')) {
                return false;
              }
              break;
            case 'modified':
              if (filter.enabled && !pendingChanges.hasOwnProperty(prop.key)) {
                return false;
              }
              break;
            case 'advanced':
              if (filter.enabled && !prop.advanced) {
                return false;
              }
              break;
          }
        }

        return true;
      }),
    })).filter(group => group.properties.length > 0);
  }, [groupedProperties, searchTerm, filters, pendingChanges]);

  // Event handlers
  const handlePropertyChange = useCallback((property: PropertyDefinition, value: PropertyValue) => {
    if (disabled || readonly || property.readonly) return;

    // Validate the value
    let validationError = '';
    if (property.validation) {
      if (property.validation.required && (value === null || value === undefined || value === '')) {
        validationError = 'This field is required';
      } else if (property.validation.min !== undefined && typeof value === 'number' && value < property.validation.min) {
        validationError = `Value must be at least ${property.validation.min}`;
      } else if (property.validation.max !== undefined && typeof value === 'number' && value > property.validation.max) {
        validationError = `Value must be at most ${property.validation.max}`;
      } else if (property.validation.pattern && typeof value === 'string' && !property.validation.pattern.test(value)) {
        validationError = 'Invalid format';
      } else if (property.validation.custom) {
        const customError = property.validation.custom(value);
        if (customError) {
          validationError = customError;
        }
      }
    }

    // Update validation errors
    setValidationErrors(prev => ({
      ...prev,
      [property.key]: validationError,
    }));

    if (!validationError) {
      // Store pending change
      setPendingChanges(prev => ({
        ...prev,
        [property.key]: value,
      }));

      // Apply change to all selected objects
      selectedObjects.forEach(obj => {
        onPropertyChange(obj.id, property.key, value);
      });
    }
  }, [disabled, readonly, selectedObjects, onPropertyChange]);

  const handleCommitChanges = useCallback(() => {
    setPendingChanges({});
    setValidationErrors({});
  }, []);

  const handleRevertChanges = useCallback(() => {
    setPendingChanges({});
    setValidationErrors({});
    // This would trigger a revert in the parent component
  }, []);

  const handleGroupToggle = useCallback((groupName: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupName)
        ? prev.filter(name => name !== groupName)
        : [...prev, groupName]
    );
  }, []);

  const handleCopyProperties = useCallback(() => {
    if (selectedObjects.length === 0) return;

    const properties = selectedObjects[0].properties;
    navigator.clipboard.writeText(JSON.stringify(properties, null, 2));
  }, [selectedObjects]);

  const handlePasteProperties = useCallback(async () => {
    if (disabled || readonly) return;

    try {
      const text = await navigator.clipboard.readText();
      const properties = JSON.parse(text);

      selectedObjects.forEach(obj => {
        Object.entries(properties).forEach(([key, value]) => {
          onPropertyChange(obj.id, key, value as PropertyValue);
        });
      });
    } catch (error) {
      console.error('Failed to paste properties:', error);
    }
  }, [disabled, readonly, selectedObjects, onPropertyChange]);

  // Utility functions
  const formatPropertyName = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const inferPropertyType = (value: PropertyValue): PropertyType => {
    if (typeof value === 'boolean') return PropertyType.BOOLEAN;
    if (typeof value === 'number') return PropertyType.NUMBER;
    if (Array.isArray(value)) return PropertyType.MULTISELECT;
    if (typeof value === 'object') return PropertyType.OBJECT;
    return PropertyType.STRING;
  };

  const getPropertyUnit = (key: string): string | undefined => {
    const unitMap: Record<string, string> = {
      'flowRate': 'm³/h',
      'pressure': 'bar',
      'temperature': '°C',
      'power': 'kW',
      'diameter': 'mm',
      'speed': 'rpm',
      'efficiency': '%',
    };
    return unitMap[key];
  };

  // Render property input based on type
  const renderPropertyInput = useCallback((property: PropertyDefinition) => {
    const value = pendingChanges[property.key] ?? property.value;
    const hasError = validationErrors[property.key];
    const isEditing = editingProperty === property.key;

    const inputProps = {
      disabled: disabled || property.readonly,
      className: cn(
        "transition-colors",
        hasError && "border-destructive focus:border-destructive",
        pendingChanges.hasOwnProperty(property.key) && "border-orange-500"
      ),
    };

    switch (property.type) {
      case PropertyType.BOOLEAN:
        return (
          <Switch
            checked={Boolean(value)}
            onCheckedChange={(checked) => handlePropertyChange(property, checked)}
            disabled={disabled || property.readonly}
          />
        );

      case PropertyType.NUMBER:
        return (
          <div className="space-y-1">
            <Input
              type="number"
              value={String(value || '')}
              onChange={(e) => handlePropertyChange(property, parseFloat(e.target.value) || 0)}
              {...inputProps}
            />
            {property.unit && (
              <div className="text-xs text-muted-foreground">{property.unit}</div>
            )}
          </div>
        );

      case PropertyType.SELECT:
        return (
          <Select
            value={String(value)}
            onValueChange={(newValue) => handlePropertyChange(property, newValue)}
            disabled={disabled || property.readonly}
          >
            <SelectTrigger className={inputProps.className}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {property.options?.map((option) => (
                <SelectItem key={String(option)} value={String(option)}>
                  {String(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case PropertyType.TEXTAREA:
        return (
          <Textarea
            value={String(value || '')}
            onChange={(e) => handlePropertyChange(property, e.target.value)}
            rows={3}
            {...inputProps}
          />
        );

      case PropertyType.COLOR:
        return (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={String(value || '#000000')}
              onChange={(e) => handlePropertyChange(property, e.target.value)}
              disabled={disabled || property.readonly}
              className="w-8 h-8 border rounded cursor-pointer"
            />
            <Input
              value={String(value || '')}
              onChange={(e) => handlePropertyChange(property, e.target.value)}
              placeholder="#000000"
              {...inputProps}
            />
          </div>
        );

      case PropertyType.RANGE:
        const numValue = Number(value) || 0;
        return (
          <div className="space-y-2">
            <Slider
              value={[numValue]}
              onValueChange={([newValue]) => handlePropertyChange(property, newValue)}
              min={property.validation?.min as number || 0}
              max={property.validation?.max as number || 100}
              step={1}
              disabled={disabled || property.readonly}
            />
            <div className="text-xs text-muted-foreground text-center">{numValue}</div>
          </div>
        );

      default:
        return (
          <Input
            value={String(value || '')}
            onChange={(e) => handlePropertyChange(property, e.target.value)}
            {...inputProps}
          />
        );
    }
  }, [disabled, editingProperty, pendingChanges, validationErrors, handlePropertyChange]);

  // Render property row
  const renderProperty = useCallback((property: PropertyDefinition) => {
    const hasError = validationErrors[property.key];
    const isPending = pendingChanges.hasOwnProperty(property.key);

    return (
      <div key={property.key} className="space-y-2 p-3 border rounded-lg">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">{property.name}</Label>
              {property.readonly && <Lock className="h-3 w-3 text-muted-foreground" />}
              {isPending && (
                <Badge variant="secondary" className="h-4 px-1 text-xs">
                  Modified
                </Badge>
              )}
              {property.unit && (
                <span className="text-xs text-muted-foreground">({property.unit})</span>
              )}
            </div>
            {property.description && (
              <div className="text-xs text-muted-foreground">{property.description}</div>
            )}
          </div>

          {hasError && (
            <Tooltip content={hasError}>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </Tooltip>
          )}
        </div>

        <div className="space-y-1">
          {renderPropertyInput(property)}
          {hasError && (
            <div className="text-xs text-destructive">{hasError}</div>
          )}
        </div>
      </div>
    );
  }, [validationErrors, pendingChanges, renderPropertyInput]);

  // Render property group
  const renderGroup = useCallback((group: PropertyGroup) => {
    return (
      <Collapsible
        key={group.name}
        open={group.expanded}
        onOpenChange={() => handleGroupToggle(group.name)}
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 p-3 h-auto"
          >
            {group.expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span className="font-medium">{group.name}</span>
            <Badge variant="secondary" className="ml-auto">
              {group.properties.length}
            </Badge>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 p-3 pt-0">
          {group.properties.map(renderProperty)}
        </CollapsibleContent>
      </Collapsible>
    );
  }, [handleGroupToggle, renderProperty]);

  if (!visible) return null;

  const panelClasses = cn(
    "bg-background border-l flex flex-col transition-all duration-200",
    position === 'right' && "fixed right-0 top-14 bottom-0 border-l",
    position === 'left' && "fixed left-16 top-14 bottom-0 border-r border-l-0",
    position === 'bottom' && "fixed bottom-0 left-16 right-0 border-t border-l-0",
    position === 'floating' && "fixed bg-popover border shadow-lg rounded-lg",
    className
  );

  const panelStyle = {
    width: position !== 'bottom' ? `${width}px` : undefined,
    height: position === 'bottom' ? `${height || 300}px` : undefined,
  };

  return (
    <div className={panelClasses} style={panelStyle}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Properties</h3>
          {isMultiSelection && (
            <Badge variant="secondary" className="text-xs">
              {selectedObjects.length} selected
            </Badge>
          )}
          {hasPendingChanges && (
            <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
              {Object.keys(pendingChanges).length} changes
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          {hasPendingChanges && (
            <>
              <Tooltip content="Save changes">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCommitChanges}
                  className="h-7 w-7 p-0 text-green-600"
                >
                  <Save className="h-3 w-3" />
                </Button>
              </Tooltip>
              <Tooltip content="Revert changes">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRevertChanges}
                  className="h-7 w-7 p-0 text-orange-600"
                >
                  <Undo className="h-3 w-3" />
                </Button>
              </Tooltip>
            </>
          )}

          <Tooltip content="Copy properties">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyProperties}
              disabled={!hasSelection}
              className="h-7 w-7 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </Tooltip>

          <Tooltip content="Paste properties">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePasteProperties}
              disabled={!hasSelection || readonly}
              className="h-7 w-7 p-0"
            >
              <Paste className="h-3 w-3" />
            </Button>
          </Tooltip>

          <Tooltip content="Close">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-7 w-7 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Search and filters */}
      {hasSelection && (
        <div className="p-3 border-b space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search properties..."
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {!hasSelection ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
            <Info className="h-8 w-8 mb-3" />
            <p className="font-medium">No Selection</p>
            <p className="text-sm">Select objects to view and edit their properties</p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-3 space-y-3">
              {filteredGroups.map(renderGroup)}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Footer */}
      {hasSelection && (
        <div className="border-t p-3 bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {isMultiSelection
                ? `${selectedObjects.length} objects selected`
                : `${selectedObjects[0]?.type || 'Object'} selected`
              }
            </span>
            {hasPendingChanges && (
              <span className="text-orange-600">
                {Object.keys(pendingChanges).length} unsaved changes
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};