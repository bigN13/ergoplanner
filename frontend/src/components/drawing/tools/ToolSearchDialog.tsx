/**
 * Tool Search Dialog - TASK-016 Implementation
 * Advanced search interface for tools and nodes
 */

'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Command,
  Clock,
  Star,
  Tag,
  Filter,
  X,
  ArrowRight,
  Keyboard,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';

import { DrawingTool, NodePaletteCategory, NodePaletteItem, SearchResult } from '@/types/tools';
import { cn } from '@/lib/utils';

interface ToolSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tools: DrawingTool[];
  nodes: NodePaletteCategory[];
  onToolSelect: (toolId: string) => void;
  onNodeSelect: (nodeId: string) => void;
  recentSearches?: string[];
  onRecentSearchAdd?: (query: string) => void;
}

export const ToolSearchDialog: React.FC<ToolSearchDialogProps> = ({
  open,
  onOpenChange,
  tools,
  nodes,
  onToolSelect,
  onNodeSelect,
  recentSearches = [],
  onRecentSearchAdd,
}) => {
  // Local state
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'tools' | 'nodes' | 'actions'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Flatten all nodes from categories
  const allNodes = useMemo(() => {
    return nodes.flatMap(category => category.nodes);
  }, [nodes]);

  // Search logic
  const searchResults = useMemo(() => {
    if (!query.trim()) {
      return {
        tools: [],
        nodes: [],
        actions: [],
        all: [],
      };
    }

    const searchTerm = query.toLowerCase();
    const results = {
      tools: [] as SearchResult[],
      nodes: [] as SearchResult[],
      actions: [] as SearchResult[],
      all: [] as SearchResult[],
    };

    // Search tools
    tools.forEach(tool => {
      let score = 0;
      const highlights: string[] = [];

      // Name match
      if (tool.name.toLowerCase().includes(searchTerm)) {
        score += 100;
        highlights.push('name');
      }

      // Description match
      if (tool.description.toLowerCase().includes(searchTerm)) {
        score += 50;
        highlights.push('description');
      }

      // Category match
      if (tool.category.toLowerCase().includes(searchTerm)) {
        score += 30;
        highlights.push('category');
      }

      // Shortcut match
      if (tool.shortcut?.toLowerCase().includes(searchTerm)) {
        score += 80;
        highlights.push('shortcut');
      }

      // Hotkey match
      if (tool.hotkey?.toLowerCase().includes(searchTerm)) {
        score += 80;
        highlights.push('hotkey');
      }

      if (score > 0) {
        const result: SearchResult = {
          type: 'tool',
          id: tool.id,
          name: tool.name,
          description: tool.description,
          category: tool.category,
          score,
          highlights,
        };
        results.tools.push(result);
        results.all.push(result);
      }
    });

    // Search nodes
    allNodes.forEach(node => {
      let score = 0;
      const highlights: string[] = [];

      // Name match
      if (node.name.toLowerCase().includes(searchTerm)) {
        score += 100;
        highlights.push('name');
      }

      // Description match
      if (node.description.toLowerCase().includes(searchTerm)) {
        score += 50;
        highlights.push('description');
      }

      // Category match
      if (node.category.toLowerCase().includes(searchTerm)) {
        score += 30;
        highlights.push('category');
      }

      // Tags match
      if (node.tags.some(tag => tag.toLowerCase().includes(searchTerm))) {
        score += 40;
        highlights.push('tags');
      }

      // Properties match
      if (node.properties.tag && String(node.properties.tag).toLowerCase().includes(searchTerm)) {
        score += 60;
        highlights.push('tag');
      }

      if (score > 0) {
        const result: SearchResult = {
          type: 'node',
          id: node.id,
          name: node.name,
          description: node.description,
          category: node.category,
          score,
          highlights,
        };
        results.nodes.push(result);
        results.all.push(result);
      }
    });

    // Search actions (predefined common actions)
    const commonActions = [
      {
        id: 'select-all',
        name: 'Select All',
        description: 'Select all objects in the canvas',
        category: 'selection',
        keywords: ['select', 'all', 'ctrl+a'],
      },
      {
        id: 'copy',
        name: 'Copy',
        description: 'Copy selected objects',
        category: 'clipboard',
        keywords: ['copy', 'duplicate', 'ctrl+c'],
      },
      {
        id: 'paste',
        name: 'Paste',
        description: 'Paste copied objects',
        category: 'clipboard',
        keywords: ['paste', 'ctrl+v'],
      },
      {
        id: 'undo',
        name: 'Undo',
        description: 'Undo last action',
        category: 'history',
        keywords: ['undo', 'ctrl+z'],
      },
      {
        id: 'redo',
        name: 'Redo',
        description: 'Redo last undone action',
        category: 'history',
        keywords: ['redo', 'ctrl+y'],
      },
    ];

    commonActions.forEach(action => {
      let score = 0;
      const highlights: string[] = [];

      // Name match
      if (action.name.toLowerCase().includes(searchTerm)) {
        score += 100;
        highlights.push('name');
      }

      // Description match
      if (action.description.toLowerCase().includes(searchTerm)) {
        score += 50;
        highlights.push('description');
      }

      // Keywords match
      if (action.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm))) {
        score += 70;
        highlights.push('keywords');
      }

      if (score > 0) {
        const result: SearchResult = {
          type: 'action',
          id: action.id,
          name: action.name,
          description: action.description,
          category: action.category,
          score,
          highlights,
        };
        results.actions.push(result);
        results.all.push(result);
      }
    });

    // Sort by score
    Object.values(results).forEach(resultArray => {
      resultArray.sort((a, b) => b.score - a.score);
    });

    return results;
  }, [query, tools, allNodes]);

  // Get current results based on active tab
  const currentResults = useMemo(() => {
    return searchResults[activeTab] || [];
  }, [searchResults, activeTab]);

  // Event handlers
  const handleSelect = useCallback((result: SearchResult) => {
    switch (result.type) {
      case 'tool':
        onToolSelect(result.id);
        break;
      case 'node':
        onNodeSelect(result.id);
        break;
      case 'action':
        // Handle action selection
        console.log('Execute action:', result.id);
        break;
    }

    // Add to recent searches
    if (query.trim()) {
      onRecentSearchAdd?.(query.trim());
    }

    onOpenChange(false);
    setQuery('');
    setSelectedIndex(0);
  }, [onToolSelect, onNodeSelect, onRecentSearchAdd, query, onOpenChange]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, currentResults.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        event.preventDefault();
        if (currentResults[selectedIndex]) {
          handleSelect(currentResults[selectedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        onOpenChange(false);
        break;
      case 'Tab':
        event.preventDefault();
        // Cycle through tabs
        const tabs = ['all', 'tools', 'nodes', 'actions'];
        const currentIndex = tabs.indexOf(activeTab);
        const nextIndex = (currentIndex + 1) % tabs.length;
        setActiveTab(tabs[nextIndex] as any);
        setSelectedIndex(0);
        break;
    }
  }, [currentResults, selectedIndex, handleSelect, onOpenChange, activeTab]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [currentResults]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = resultRefs.current[selectedIndex];
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Render result item
  const renderResult = useCallback((result: SearchResult, index: number) => {
    const isSelected = index === selectedIndex;
    const IconComponent = result.type === 'tool'
      ? tools.find(t => t.id === result.id)?.icon
      : result.type === 'node'
      ? null // Would use node icon
      : Command; // Default for actions

    return (
      <div
        key={result.id}
        ref={el => { resultRefs.current[index] = el; }}
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
          isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
        )}
        onClick={() => handleSelect(result)}
      >
        <div className="flex-shrink-0">
          {IconComponent ? (
            <IconComponent className="h-5 w-5" />
          ) : (
            <div className="h-5 w-5 bg-muted rounded flex items-center justify-center">
              <span className="text-xs">{result.type[0].toUpperCase()}</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{result.name}</span>
            <Badge variant={isSelected ? "secondary" : "outline"} className="text-xs">
              {result.type}
            </Badge>
          </div>
          <div className={cn(
            "text-sm truncate",
            isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
          )}>
            {result.description}
          </div>
          {result.highlights.length > 0 && (
            <div className="flex gap-1 mt-1">
              {result.highlights.map(highlight => (
                <Badge
                  key={highlight}
                  variant="outline"
                  className={cn(
                    "text-xs",
                    isSelected ? "border-primary-foreground/30" : "border-muted-foreground/30"
                  )}
                >
                  {highlight}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex-shrink-0">
          <ArrowRight className="h-4 w-4 opacity-50" />
        </div>
      </div>
    );
  }, [selectedIndex, tools, handleSelect]);

  // Render recent searches
  const renderRecentSearches = () => {
    if (recentSearches.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-3 py-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Recent Searches</span>
        </div>
        <div className="space-y-1">
          {recentSearches.slice(0, 5).map((search, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-2 hover:bg-muted rounded-lg cursor-pointer"
              onClick={() => setQuery(search)}
            >
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm">{search}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Tools & Components
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col">
          {/* Search input */}
          <div className="px-6 py-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search tools, components, or actions..."
                className="pl-10 pr-4"
              />
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuery('')}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 py-2 border-b">
            <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" className="text-xs">
                  All ({searchResults.all.length})
                </TabsTrigger>
                <TabsTrigger value="tools" className="text-xs">
                  Tools ({searchResults.tools.length})
                </TabsTrigger>
                <TabsTrigger value="nodes" className="text-xs">
                  Nodes ({searchResults.nodes.length})
                </TabsTrigger>
                <TabsTrigger value="actions" className="text-xs">
                  Actions ({searchResults.actions.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-96">
              <div className="p-3">
                {query.trim() ? (
                  currentResults.length > 0 ? (
                    <div className="space-y-1">
                      {currentResults.map(renderResult)}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="h-8 w-8 mx-auto mb-2" />
                      <p>No results found</p>
                      <p className="text-sm">Try adjusting your search terms</p>
                    </div>
                  )
                ) : (
                  renderRecentSearches()
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t bg-muted/30">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Keyboard className="h-3 w-3" />
                  <span>Navigate with arrow keys</span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs px-1">Enter</Badge>
                  <span>to select</span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs px-1">Tab</Badge>
                  <span>to switch tabs</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs px-1">Esc</Badge>
                <span>to close</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};