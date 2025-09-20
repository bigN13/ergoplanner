/**
 * Node Palette Component - TASK-016 Implementation
 * Drag-and-drop node palette with categorization and search
 */

'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Search,
  Star,
  Clock,
  Filter,
  Grid,
  List,
  MoreVertical,
  Pin,
  PinOff,
  Download,
  Upload,
  Package,
  Zap,
  Wrench,
  Database,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tooltip } from '@/components/ui/Tooltip';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import { ScrollArea } from '@/components/ui/ScrollArea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/DropdownMenu';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';

import { NodePaletteCategory, NodePaletteItem, DragData } from '@/types/tools';
import { cn } from '@/lib/utils';

interface NodePaletteProps {
  categories: NodePaletteCategory[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  onNodeAdd: (nodeType: string, position: { x: number; y: number }) => void;
  searchQuery: string;
  recentNodes: string[];
  favoriteNodes: string[];
  onSearchChange?: (query: string) => void;
  onToggleFavorite?: (nodeId: string) => void;
  disabled?: boolean;
  readonly?: boolean;
  className?: string;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'usage' | 'recent' | 'category';

export const NodePalette: React.FC<NodePaletteProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  onNodeAdd,
  searchQuery,
  recentNodes,
  favoriteNodes,
  onSearchChange,
  onToggleFavorite,
  disabled = false,
  readonly = false,
  className,
}) => {
  // Local state
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    'equipment',
    'instrumentation',
  ]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('category');
  const [filteredStandards, setFilteredStandards] = useState<string[]>(['ISA', 'ISO', 'UK_WATER']);
  const [activeTab, setActiveTab] = useState<'browse' | 'recent' | 'favorites'>('browse');
  const [draggedNode, setDraggedNode] = useState<NodePaletteItem | null>(null);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dragImageRef = useRef<HTMLDivElement>(null);

  // Search and filter logic
  const filteredNodes = useMemo(() => {
    let allNodes: NodePaletteItem[] = [];

    // Collect all nodes from categories
    categories.forEach(category => {
      if (filteredStandards.includes(category.standard || 'ISA')) {
        allNodes.push(...category.nodes);
      }
    });

    // Apply search filter
    if (localSearchQuery.trim()) {
      const query = localSearchQuery.toLowerCase();
      allNodes = allNodes.filter(node =>
        node.name.toLowerCase().includes(query) ||
        node.description.toLowerCase().includes(query) ||
        node.tags.some(tag => tag.toLowerCase().includes(query)) ||
        node.category.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'name':
        allNodes.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'usage':
        allNodes.sort((a, b) => (b.metadata.usage || 0) - (a.metadata.usage || 0));
        break;
      case 'recent':
        allNodes.sort((a, b) => {
          const aIndex = recentNodes.indexOf(a.id);
          const bIndex = recentNodes.indexOf(b.id);
          if (aIndex === -1 && bIndex === -1) return 0;
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        });
        break;
      case 'category':
      default:
        allNodes.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
        break;
    }

    return allNodes;
  }, [categories, localSearchQuery, sortBy, recentNodes, filteredStandards]);

  // Get nodes for different tabs
  const recentNodesData = useMemo(() => {
    return recentNodes
      .map(nodeId => filteredNodes.find(node => node.id === nodeId))
      .filter(Boolean) as NodePaletteItem[];
  }, [recentNodes, filteredNodes]);

  const favoriteNodesData = useMemo(() => {
    return favoriteNodes
      .map(nodeId => filteredNodes.find(node => node.id === nodeId))
      .filter(Boolean) as NodePaletteItem[];
  }, [favoriteNodes, filteredNodes]);

  // Event handlers
  const handleSearchChange = useCallback((value: string) => {
    setLocalSearchQuery(value);
    onSearchChange?.(value);
  }, [onSearchChange]);

  const handleCategoryToggle = useCallback((categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  }, []);

  const handleNodeClick = useCallback((node: NodePaletteItem) => {
    if (disabled || readonly) return;

    // Add node at center of canvas (this would be calculated from canvas state)
    onNodeAdd(node.id, { x: 400, y: 300 });
  }, [onNodeAdd, disabled, readonly]);

  const handleToggleFavorite = useCallback((nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onToggleFavorite?.(nodeId);
  }, [onToggleFavorite]);

  // Drag and drop handlers
  const handleDragStart = useCallback((event: React.DragEvent, node: NodePaletteItem) => {
    if (disabled || readonly) return;

    setDraggedNode(node);

    // Set drag data
    const dragData: DragData = {
      type: 'node',
      data: node,
      source: 'palette',
    };

    event.dataTransfer.setData('application/json', JSON.stringify(dragData));
    event.dataTransfer.effectAllowed = 'copy';

    // Create custom drag image
    if (dragImageRef.current) {
      event.dataTransfer.setDragImage(dragImageRef.current, 20, 20);
    }
  }, [disabled, readonly]);

  const handleDragEnd = useCallback(() => {
    setDraggedNode(null);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'f') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Render node item
  const renderNodeItem = useCallback((node: NodePaletteItem, size: 'small' | 'medium' | 'large' = 'medium') => {
    const isFavorite = favoriteNodes.includes(node.id);
    const isRecent = recentNodes.includes(node.id);

    const itemSize = {
      small: 'h-12 w-12',
      medium: 'h-16 w-16',
      large: 'h-20 w-20',
    }[size];

    const iconSize = {
      small: 'h-6 w-6',
      medium: 'h-8 w-8',
      large: 'h-10 w-10',
    }[size];

    return (
      <Tooltip
        key={node.id}
        content={
          <div className="space-y-2 max-w-xs">
            <div className="font-medium">{node.name}</div>
            <div className="text-sm text-muted-foreground">{node.description}</div>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline">{node.standard}</Badge>
              <Badge variant="secondary">{node.category}</Badge>
            </div>
            {node.properties.tag && (
              <div className="text-xs">
                <span className="font-medium">Tag: </span>
                {node.properties.tag}
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              Drag to canvas or click to add
            </div>
          </div>
        }
        side="right"
      >
        <div
          className={cn(
            "relative group cursor-pointer border rounded-lg p-2 transition-all duration-200",
            "hover:border-primary hover:shadow-md hover:scale-105",
            "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1",
            itemSize,
            disabled && "opacity-50 cursor-not-allowed",
            draggedNode?.id === node.id && "opacity-50"
          )}
          draggable={!disabled && !readonly}
          onDragStart={(e) => handleDragStart(e, node)}
          onDragEnd={handleDragEnd}
          onClick={() => handleNodeClick(node)}
          role="button"
          tabIndex={0}
          aria-label={`Add ${node.name} to canvas`}
        >
          {/* Node icon/preview */}
          <div className="flex items-center justify-center h-full">
            {node.icon ? (
              <img
                src={node.icon}
                alt={node.name}
                className={cn(iconSize, "object-contain")}
              />
            ) : (
              <Database className={iconSize} />
            )}
          </div>

          {/* Node name (visible on hover or in list view) */}
          {(viewMode === 'list' || size === 'large') && (
            <div className="absolute bottom-0 left-0 right-0 bg-background/90 backdrop-blur-sm p-1 rounded-b-lg">
              <div className="text-xs font-medium truncate">{node.name}</div>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-1 right-1 flex gap-1">
            {isFavorite && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleToggleFavorite(node.id, e)}
                className="h-5 w-5 p-0 text-yellow-500 hover:text-yellow-600"
              >
                <Star className="h-3 w-3 fill-current" />
              </Button>
            )}
            {isRecent && !isFavorite && (
              <Badge variant="secondary" className="h-5 px-1 text-xs">
                <Clock className="h-2 w-2" />
              </Badge>
            )}
          </div>

          {/* Usage count */}
          {node.metadata.usage > 0 && (
            <div className="absolute bottom-1 left-1">
              <Badge variant="outline" className="h-4 px-1 text-xs">
                {node.metadata.usage}
              </Badge>
            </div>
          )}
        </div>
      </Tooltip>
    );
  }, [
    favoriteNodes,
    recentNodes,
    viewMode,
    handleDragStart,
    handleDragEnd,
    handleNodeClick,
    handleToggleFavorite,
    disabled,
    draggedNode,
  ]);

  // Render category section
  const renderCategory = useCallback((category: NodePaletteCategory) => {
    const isExpanded = expandedCategories.includes(category.id);
    const categoryNodes = category.nodes.filter(node =>
      filteredStandards.includes(node.standard)
    );

    if (categoryNodes.length === 0) return null;

    return (
      <div key={category.id} className="space-y-2">
        <Button
          variant="ghost"
          onClick={() => handleCategoryToggle(category.id)}
          className="w-full justify-start gap-2 text-sm font-medium"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <category.icon className="h-4 w-4" />
          {category.name}
          <Badge variant="secondary" className="ml-auto">
            {categoryNodes.length}
          </Badge>
        </Button>

        {isExpanded && (
          <div className={cn(
            "pl-6 grid gap-2",
            viewMode === 'grid'
              ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
              : "grid-cols-1"
          )}>
            {categoryNodes.map(node => renderNodeItem(node, viewMode === 'list' ? 'small' : 'medium'))}
          </div>
        )}
      </div>
    );
  }, [
    expandedCategories,
    filteredStandards,
    handleCategoryToggle,
    renderNodeItem,
    viewMode,
  ]);

  // Render header controls
  const renderHeader = () => (
    <div className="space-y-3 p-3 border-b bg-muted/30">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          value={localSearchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search nodes... (Ctrl+F)"
          className="pl-10 pr-4"
          disabled={disabled}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Tooltip content={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="h-7 w-7 p-0"
            >
              {viewMode === 'grid' ? <List className="h-3 w-3" /> : <Grid className="h-3 w-3" />}
            </Button>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2">
                <Filter className="h-3 w-3 mr-1" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <div className="px-2 py-1.5 text-sm font-medium">Standards</div>
              <DropdownMenuSeparator />
              {['ISA', 'ISO', 'UK_WATER', 'CUSTOM'].map((standard) => (
                <DropdownMenuCheckboxItem
                  key={standard}
                  checked={filteredStandards.includes(standard)}
                  onCheckedChange={(checked) => {
                    setFilteredStandards(prev =>
                      checked
                        ? [...prev, standard]
                        : prev.filter(s => s !== standard)
                    );
                  }}
                >
                  {standard.replace('_', ' ')}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-sm font-medium">Sort by</div>
              <DropdownMenuSeparator />
              {[
                { value: 'category', label: 'Category' },
                { value: 'name', label: 'Name' },
                { value: 'usage', label: 'Usage' },
                { value: 'recent', label: 'Recent' },
              ].map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setSortBy(option.value as SortBy)}
                >
                  {option.label}
                  {sortBy === option.value && ' ✓'}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Download className="h-4 w-4 mr-2" />
              Export Library
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Upload className="h-4 w-4 mr-2" />
              Import Library
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Package className="h-4 w-4 mr-2" />
              Manage Libraries
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {renderHeader()}

      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="flex-1 flex flex-col">
        <TabsList className="mx-3 mt-2 grid w-auto grid-cols-3">
          <TabsTrigger value="browse" className="text-xs">Browse</TabsTrigger>
          <TabsTrigger value="recent" className="text-xs">Recent</TabsTrigger>
          <TabsTrigger value="favorites" className="text-xs">Favorites</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-4">
              {categories.map(renderCategory)}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="recent" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-3">
              {recentNodesData.length > 0 ? (
                <div className={cn(
                  "grid gap-2",
                  viewMode === 'grid'
                    ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                    : "grid-cols-1"
                )}>
                  {recentNodesData.map(node => renderNodeItem(node, viewMode === 'list' ? 'small' : 'medium'))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Clock className="h-8 w-8 mx-auto mb-2" />
                  <p>No recent nodes</p>
                  <p className="text-sm">Nodes you use will appear here</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="favorites" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-3">
              {favoriteNodesData.length > 0 ? (
                <div className={cn(
                  "grid gap-2",
                  viewMode === 'grid'
                    ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                    : "grid-cols-1"
                )}>
                  {favoriteNodesData.map(node => renderNodeItem(node, viewMode === 'list' ? 'small' : 'medium'))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Star className="h-8 w-8 mx-auto mb-2" />
                  <p>No favorite nodes</p>
                  <p className="text-sm">Star nodes to add them to favorites</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Drag preview element (hidden) */}
      <div
        ref={dragImageRef}
        className="fixed -z-10 opacity-0 pointer-events-none"
        style={{ top: -1000, left: -1000 }}
      >
        {draggedNode && (
          <div className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-lg">
            <Database className="h-4 w-4" />
            <span className="text-sm font-medium">{draggedNode.name}</span>
          </div>
        )}
      </div>
    </div>
  );
};