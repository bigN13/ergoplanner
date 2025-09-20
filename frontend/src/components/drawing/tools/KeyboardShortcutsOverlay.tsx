/**
 * Keyboard Shortcuts Overlay - TASK-016 Implementation
 * Comprehensive keyboard shortcuts help and reference
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  Keyboard,
  Search,
  X,
  Filter,
  MousePointer2,
  Edit,
  Eye,
  Navigation,
  Layers,
  Copy,
  Undo,
  Save,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';

import { DrawingTool } from '@/types/tools';
import { defaultKeyboardShortcuts } from '@/data/toolDefinitions';
import { cn } from '@/lib/utils';

interface KeyboardShortcutsOverlayProps {
  visible: boolean;
  onClose: () => void;
  tools: DrawingTool[];
  className?: string;
}

interface ShortcutGroup {
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcuts: ShortcutItem[];
}

interface ShortcutItem {
  keys: string;
  description: string;
  context?: string;
  tool?: string;
}

export const KeyboardShortcutsOverlay: React.FC<KeyboardShortcutsOverlayProps> = ({
  visible,
  onClose,
  tools,
  className,
}) => {
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Organize shortcuts by category
  const shortcutGroups: ShortcutGroup[] = useMemo(() => {
    const groups: ShortcutGroup[] = [
      {
        category: 'Selection',
        icon: MousePointer2,
        shortcuts: [
          { keys: 'V', description: 'Select tool', tool: 'select' },
          { keys: 'M', description: 'Rectangle select tool', tool: 'rectangle-select' },
          { keys: 'L', description: 'Lasso select tool', tool: 'lasso-select' },
          { keys: 'Ctrl+A', description: 'Select all objects' },
          { keys: 'Ctrl+D', description: 'Deselect all objects' },
          { keys: 'Tab', description: 'Cycle through selected objects' },
          { keys: 'Shift+Click', description: 'Add to selection' },
          { keys: 'Ctrl+Click', description: 'Toggle selection' },
        ],
      },
      {
        category: 'Drawing',
        icon: Edit,
        shortcuts: [
          { keys: 'P', description: 'Draw pipe tool', tool: 'draw-pipe' },
          { keys: 'S', description: 'Draw signal tool', tool: 'draw-signal' },
          { keys: 'C', description: 'Add component tool', tool: 'add-component' },
          { keys: 'T', description: 'Add text tool', tool: 'add-text' },
          { keys: 'D', description: 'Add dimension tool', tool: 'add-dimension' },
          { keys: 'Ctrl+M', description: 'Add comment tool', tool: 'add-comment' },
          { keys: 'Enter', description: 'Confirm current drawing operation' },
          { keys: 'Esc', description: 'Cancel current drawing operation' },
        ],
      },
      {
        category: 'Editing',
        icon: Edit,
        shortcuts: [
          { keys: 'G', description: 'Move tool', tool: 'move' },
          { keys: 'R', description: 'Rotate tool', tool: 'rotate' },
          { keys: 'E', description: 'Scale tool', tool: 'scale' },
          { keys: 'Ctrl+G', description: 'Group selected objects' },
          { keys: 'Ctrl+Shift+G', description: 'Ungroup selected objects' },
          { keys: 'Ctrl+L', description: 'Lock selected objects' },
          { keys: 'Ctrl+Shift+L', description: 'Unlock selected objects' },
          { keys: 'Del', description: 'Delete selected objects' },
        ],
      },
      {
        category: 'View',
        icon: Eye,
        shortcuts: [
          { keys: 'H', description: 'Pan tool', tool: 'pan' },
          { keys: 'Z', description: 'Zoom in tool', tool: 'zoom-in' },
          { keys: 'Shift+Z', description: 'Zoom out tool', tool: 'zoom-out' },
          { keys: 'F', description: 'Fit to view', tool: 'fit-view' },
          { keys: 'Ctrl+0', description: 'Center view', tool: 'center-view' },
          { keys: 'Space', description: 'Temporary pan (hold)' },
          { keys: 'Ctrl+Plus', description: 'Zoom in' },
          { keys: 'Ctrl+Minus', description: 'Zoom out' },
        ],
      },
      {
        category: 'Navigation',
        icon: Navigation,
        shortcuts: [
          { keys: 'Arrow Keys', description: 'Move selected objects' },
          { keys: 'Shift+Arrow Keys', description: 'Move selected objects faster' },
          { keys: 'Ctrl+Arrow Keys', description: 'Move selected objects precisely' },
          { keys: 'Page Up', description: 'Bring selected objects forward' },
          { keys: 'Page Down', description: 'Send selected objects backward' },
          { keys: 'Home', description: 'Bring selected objects to front' },
          { keys: 'End', description: 'Send selected objects to back' },
        ],
      },
      {
        category: 'Layers',
        icon: Layers,
        shortcuts: [
          { keys: 'Ctrl+1', description: 'Show/hide layer 1' },
          { keys: 'Ctrl+2', description: 'Show/hide layer 2' },
          { keys: 'Ctrl+3', description: 'Show/hide layer 3' },
          { keys: 'Ctrl+Shift+L', description: 'Toggle layers panel' },
          { keys: 'Ctrl+Alt+L', description: 'Lock/unlock current layer' },
        ],
      },
      {
        category: 'Clipboard',
        icon: Copy,
        shortcuts: [
          { keys: 'Ctrl+C', description: 'Copy selected objects' },
          { keys: 'Ctrl+V', description: 'Paste copied objects' },
          { keys: 'Ctrl+X', description: 'Cut selected objects' },
          { keys: 'Ctrl+D', description: 'Duplicate selected objects' },
          { keys: 'Ctrl+Shift+V', description: 'Paste in place' },
          { keys: 'Ctrl+Alt+V', description: 'Paste special' },
        ],
      },
      {
        category: 'History',
        icon: Undo,
        shortcuts: [
          { keys: 'Ctrl+Z', description: 'Undo last action' },
          { keys: 'Ctrl+Y', description: 'Redo last undone action' },
          { keys: 'Ctrl+Shift+Z', description: 'Redo (alternative)' },
          { keys: 'Ctrl+Alt+Z', description: 'Step backward through history' },
          { keys: 'Ctrl+Alt+Y', description: 'Step forward through history' },
        ],
      },
      {
        category: 'File',
        icon: Save,
        shortcuts: [
          { keys: 'Ctrl+S', description: 'Save drawing' },
          { keys: 'Ctrl+Shift+S', description: 'Save as...' },
          { keys: 'Ctrl+O', description: 'Open drawing' },
          { keys: 'Ctrl+N', description: 'New drawing' },
          { keys: 'Ctrl+P', description: 'Print drawing' },
          { keys: 'Ctrl+E', description: 'Export drawing' },
        ],
      },
      {
        category: 'Interface',
        icon: Keyboard,
        shortcuts: [
          { keys: 'Ctrl+K', description: 'Open command palette' },
          { keys: 'F1', description: 'Show this help' },
          { keys: 'Ctrl+?', description: 'Show this help (alternative)' },
          { keys: 'Ctrl+Comma', description: 'Open preferences' },
          { keys: 'F11', description: 'Toggle fullscreen' },
          { keys: 'Ctrl+B', description: 'Toggle sidebar' },
          { keys: 'Ctrl+Shift+P', description: 'Toggle property panel' },
        ],
      },
    ];

    return groups;
  }, []);

  // Filter shortcuts based on search and category
  const filteredGroups = useMemo(() => {
    let groups = shortcutGroups;

    // Filter by category
    if (selectedCategory !== 'all') {
      groups = groups.filter(group => group.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      groups = groups.map(group => ({
        ...group,
        shortcuts: group.shortcuts.filter(shortcut =>
          shortcut.keys.toLowerCase().includes(query) ||
          shortcut.description.toLowerCase().includes(query) ||
          (shortcut.context && shortcut.context.toLowerCase().includes(query))
        ),
      })).filter(group => group.shortcuts.length > 0);
    }

    return groups;
  }, [shortcutGroups, selectedCategory, searchQuery]);

  // Get all categories for filter dropdown
  const categories = useMemo(() => {
    return ['all', ...shortcutGroups.map(group => group.category.toLowerCase())];
  }, [shortcutGroups]);

  // Format keyboard shortcut for display
  const formatShortcut = (keys: string): React.ReactNode => {
    const parts = keys.split('+').map(part => part.trim());

    return (
      <div className="flex items-center gap-1">
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {index > 0 && <span className="text-muted-foreground text-xs">+</span>}
            <Badge variant="outline" className="text-xs font-mono px-2 py-1">
              {part}
            </Badge>
          </React.Fragment>
        ))}
      </div>
    );
  };

  // Render shortcut item
  const renderShortcutItem = (shortcut: ShortcutItem) => {
    const tool = shortcut.tool ? tools.find(t => t.id === shortcut.tool) : null;

    return (
      <div
        key={`${shortcut.keys}-${shortcut.description}`}
        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {tool && <tool.icon className="h-4 w-4 text-muted-foreground" />}
          <div>
            <p className="text-sm font-medium">{shortcut.description}</p>
            {shortcut.context && (
              <p className="text-xs text-muted-foreground">{shortcut.context}</p>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          {formatShortcut(shortcut.keys)}
        </div>
      </div>
    );
  };

  // Render shortcut group
  const renderShortcutGroup = (group: ShortcutGroup) => {
    if (group.shortcuts.length === 0) return null;

    return (
      <div key={group.category} className="space-y-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg">
          <group.icon className="h-4 w-4" />
          <h3 className="font-medium text-sm">{group.category}</h3>
          <Badge variant="secondary" className="ml-auto text-xs">
            {group.shortcuts.length}
          </Badge>
        </div>
        <div className="space-y-1">
          {group.shortcuts.map(renderShortcutItem)}
        </div>
      </div>
    );
  };

  if (!visible) return null;

  return (
    <Dialog open={visible} onOpenChange={() => onClose()}>
      <DialogContent className={cn("max-w-4xl max-h-[90vh] p-0", className)}>
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col">
          {/* Search and filters */}
          <div className="px-6 py-4 border-b space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search shortcuts..."
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.slice(1).map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {searchQuery && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  Found {filteredGroups.reduce((sum, group) => sum + group.shortcuts.length, 0)} shortcuts
                </span>
                {selectedCategory !== 'all' && (
                  <>
                    <span>in</span>
                    <Badge variant="outline" className="text-xs">
                      {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
                    </Badge>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Shortcuts content */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-96">
              <div className="p-6 space-y-6">
                {filteredGroups.length > 0 ? (
                  filteredGroups.map(renderShortcutGroup)
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Keyboard className="h-8 w-8 mx-auto mb-3" />
                    <p className="font-medium">No shortcuts found</p>
                    <p className="text-sm">Try adjusting your search or filter</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-muted/30">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>Total shortcuts: {shortcutGroups.reduce((sum, group) => sum + group.shortcuts.length, 0)}</span>
                <span>Categories: {shortcutGroups.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Press</span>
                <Badge variant="outline" className="text-xs px-1">Esc</Badge>
                <span>or</span>
                <Badge variant="outline" className="text-xs px-1">F1</Badge>
                <span>to close</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};