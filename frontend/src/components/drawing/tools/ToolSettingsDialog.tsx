/**
 * Tool Settings Dialog - TASK-016 Implementation
 * Configuration dialog for tool preferences and accessibility
 */

'use client';

import React, { useState, useCallback } from 'react';
import {
  Settings,
  Palette,
  Keyboard,
  Accessibility,
  Monitor,
  Save,
  RotateCcw,
  Download,
  Upload,
  Eye,
  Mouse,
  Zap,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Slider } from '@/components/ui/Slider';
import { Separator } from '@/components/ui/Separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

import { ToolPreferences, AccessibilityConfig } from '@/types/tools';
import { cn } from '@/lib/utils';

interface ToolSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preferences: ToolPreferences;
  accessibility: AccessibilityConfig;
  onPreferencesChange: (preferences: Partial<ToolPreferences>) => void;
  onAccessibilityChange?: (accessibility: Partial<AccessibilityConfig>) => void;
}

export const ToolSettingsDialog: React.FC<ToolSettingsDialogProps> = ({
  open,
  onOpenChange,
  preferences,
  accessibility,
  onPreferencesChange,
  onAccessibilityChange,
}) => {
  // Local state for temporary changes
  const [tempPreferences, setTempPreferences] = useState<ToolPreferences>(preferences);
  const [tempAccessibility, setTempAccessibility] = useState<AccessibilityConfig>(accessibility);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Update local state when props change
  React.useEffect(() => {
    setTempPreferences(preferences);
    setTempAccessibility(accessibility);
    setHasUnsavedChanges(false);
  }, [preferences, accessibility, open]);

  // Handle preference changes
  const handlePreferenceChange = useCallback(<K extends keyof ToolPreferences>(
    key: K,
    value: ToolPreferences[K]
  ) => {
    setTempPreferences(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  }, []);

  // Handle accessibility changes
  const handleAccessibilityChange = useCallback(<K extends keyof AccessibilityConfig>(
    key: K,
    value: AccessibilityConfig[K]
  ) => {
    setTempAccessibility(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  }, []);

  // Save changes
  const handleSave = useCallback(() => {
    onPreferencesChange(tempPreferences);
    onAccessibilityChange?.(tempAccessibility);
    setHasUnsavedChanges(false);
  }, [tempPreferences, tempAccessibility, onPreferencesChange, onAccessibilityChange]);

  // Reset to defaults
  const handleReset = useCallback(() => {
    const defaultPreferences: ToolPreferences = {
      defaultTool: 'select',
      autoSwitchTool: true,
      confirmDestructive: true,
      showTooltips: true,
      animateTransitions: true,
      persistState: true,
      theme: 'auto',
    };

    const defaultAccessibility: AccessibilityConfig = {
      enabled: false,
      highContrast: false,
      largeText: false,
      keyboardNavigation: true,
      screenReader: false,
      focusIndicators: true,
      announcements: true,
    };

    setTempPreferences(defaultPreferences);
    setTempAccessibility(defaultAccessibility);
    setHasUnsavedChanges(true);
  }, []);

  // Export settings
  const handleExport = useCallback(() => {
    const settings = {
      preferences: tempPreferences,
      accessibility: tempAccessibility,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ergoplanner-tool-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [tempPreferences, tempAccessibility]);

  // Import settings
  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const settings = JSON.parse(e.target?.result as string);
          if (settings.preferences) {
            setTempPreferences(settings.preferences);
          }
          if (settings.accessibility) {
            setTempAccessibility(settings.accessibility);
          }
          setHasUnsavedChanges(true);
        } catch (error) {
          console.error('Failed to import settings:', error);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  // General preferences tab
  const renderGeneralTab = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Mouse className="h-4 w-4" />
          Tool Behavior
        </h4>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Default Tool</Label>
              <p className="text-xs text-muted-foreground">
                Tool to activate when starting or after completing an action
              </p>
            </div>
            <Select
              value={tempPreferences.defaultTool}
              onValueChange={(value) => handlePreferenceChange('defaultTool', value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="select">Select</SelectItem>
                <SelectItem value="pan">Pan</SelectItem>
                <SelectItem value="zoom">Zoom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Auto-switch Tool</Label>
              <p className="text-xs text-muted-foreground">
                Automatically switch back to default tool after single-use tools
              </p>
            </div>
            <Switch
              checked={tempPreferences.autoSwitchTool}
              onCheckedChange={(checked) => handlePreferenceChange('autoSwitchTool', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Confirm Destructive Actions</Label>
              <p className="text-xs text-muted-foreground">
                Show confirmation dialogs for delete and similar operations
              </p>
            </div>
            <Switch
              checked={tempPreferences.confirmDestructive}
              onCheckedChange={(checked) => handlePreferenceChange('confirmDestructive', checked)}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Interface
        </h4>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Show Tooltips</Label>
              <p className="text-xs text-muted-foreground">
                Display helpful tooltips on hover
              </p>
            </div>
            <Switch
              checked={tempPreferences.showTooltips}
              onCheckedChange={(checked) => handlePreferenceChange('showTooltips', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Animate Transitions</Label>
              <p className="text-xs text-muted-foreground">
                Enable smooth animations for UI transitions
              </p>
            </div>
            <Switch
              checked={tempPreferences.animateTransitions}
              onCheckedChange={(checked) => handlePreferenceChange('animateTransitions', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Theme</Label>
              <p className="text-xs text-muted-foreground">
                Choose your preferred color theme
              </p>
            </div>
            <Select
              value={tempPreferences.theme}
              onValueChange={(value: 'light' | 'dark' | 'auto') => handlePreferenceChange('theme', value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Save className="h-4 w-4" />
          Data & Privacy
        </h4>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Persist State</Label>
              <p className="text-xs text-muted-foreground">
                Save tool settings and preferences between sessions
              </p>
            </div>
            <Switch
              checked={tempPreferences.persistState}
              onCheckedChange={(checked) => handlePreferenceChange('persistState', checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Accessibility tab
  const renderAccessibilityTab = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Accessibility className="h-4 w-4" />
          Accessibility Features
        </h4>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Enable Accessibility</Label>
              <p className="text-xs text-muted-foreground">
                Turn on enhanced accessibility features
              </p>
            </div>
            <Switch
              checked={tempAccessibility.enabled}
              onCheckedChange={(checked) => handleAccessibilityChange('enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>High Contrast Mode</Label>
              <p className="text-xs text-muted-foreground">
                Increase contrast for better visibility
              </p>
            </div>
            <Switch
              checked={tempAccessibility.highContrast}
              onCheckedChange={(checked) => handleAccessibilityChange('highContrast', checked)}
              disabled={!tempAccessibility.enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Large Text</Label>
              <p className="text-xs text-muted-foreground">
                Increase text size for better readability
              </p>
            </div>
            <Switch
              checked={tempAccessibility.largeText}
              onCheckedChange={(checked) => handleAccessibilityChange('largeText', checked)}
              disabled={!tempAccessibility.enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Keyboard Navigation</Label>
              <p className="text-xs text-muted-foreground">
                Enable full keyboard navigation support
              </p>
            </div>
            <Switch
              checked={tempAccessibility.keyboardNavigation}
              onCheckedChange={(checked) => handleAccessibilityChange('keyboardNavigation', checked)}
              disabled={!tempAccessibility.enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Screen Reader Support</Label>
              <p className="text-xs text-muted-foreground">
                Enhanced support for screen readers
              </p>
            </div>
            <Switch
              checked={tempAccessibility.screenReader}
              onCheckedChange={(checked) => handleAccessibilityChange('screenReader', checked)}
              disabled={!tempAccessibility.enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Focus Indicators</Label>
              <p className="text-xs text-muted-foreground">
                Show clear focus indicators for keyboard navigation
              </p>
            </div>
            <Switch
              checked={tempAccessibility.focusIndicators}
              onCheckedChange={(checked) => handleAccessibilityChange('focusIndicators', checked)}
              disabled={!tempAccessibility.enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Announcements</Label>
              <p className="text-xs text-muted-foreground">
                Audio announcements for screen readers
              </p>
            </div>
            <Switch
              checked={tempAccessibility.announcements}
              onCheckedChange={(checked) => handleAccessibilityChange('announcements', checked)}
              disabled={!tempAccessibility.enabled}
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Performance tab
  const renderPerformanceTab = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Performance Settings
        </h4>

        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Animation Speed</Label>
              <span className="text-sm text-muted-foreground">Fast</span>
            </div>
            <Slider
              value={[100]}
              onValueChange={() => {}}
              min={50}
              max={200}
              step={25}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Slow</span>
              <span>Normal</span>
              <span>Fast</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Rendering Quality</Label>
              <span className="text-sm text-muted-foreground">High</span>
            </div>
            <Select value="high" onValueChange={() => {}}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low (Better Performance)</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High (Better Quality)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Hardware Acceleration</Label>
              <p className="text-xs text-muted-foreground">
                Use GPU acceleration when available
              </p>
            </div>
            <Switch checked={true} onCheckedChange={() => {}} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Tool Settings & Preferences
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="flex-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="general" className="mt-0">
              {renderGeneralTab()}
            </TabsContent>

            <TabsContent value="accessibility" className="mt-0">
              {renderAccessibilityTab()}
            </TabsContent>

            <TabsContent value="performance" className="mt-0">
              {renderPerformanceTab()}
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleImport}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              className={cn(
                hasUnsavedChanges && "bg-orange-600 hover:bg-orange-700"
              )}
            >
              <Save className="h-4 w-4 mr-2" />
              {hasUnsavedChanges ? 'Save Changes' : 'Saved'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};