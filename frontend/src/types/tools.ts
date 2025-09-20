/**
 * Drawing Tools Palette - Extended types for TASK-016
 * Professional-grade tool system for ReactFlow-based P&ID drawing
 */

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { CanvasNode, CanvasEdge, CanvasTool } from './canvas';

// Enhanced tool system types
export interface DrawingTool {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
  category: ToolCategory;
  shortcut?: string;
  hotkey?: string;
  disabled?: boolean;
  premium?: boolean;
  cursor?: string;
  subtools?: DrawingTool[];
  options?: ToolOptions;
  mode: ToolMode;
}

export enum ToolCategory {
  SELECTION = 'selection',
  DRAWING = 'drawing',
  EDITING = 'editing',
  VIEW = 'view',
  ANNOTATION = 'annotation',
  MEASUREMENT = 'measurement',
  COLLABORATION = 'collaboration',
  VALIDATION = 'validation',
}

export enum ToolMode {
  SINGLE_USE = 'single_use',      // Tool deactivates after one use
  PERSISTENT = 'persistent',       // Tool stays active until manually changed
  MODAL = 'modal',                 // Tool opens a modal/dialog
  TOGGLE = 'toggle',               // Tool can be toggled on/off
}

export interface ToolOptions {
  // Drawing options
  strokeWidth?: number;
  strokeColor?: string;
  fillColor?: string;
  opacity?: number;
  lineDash?: number[];

  // Snap options
  snapToGrid?: boolean;
  snapToNode?: boolean;
  snapToEdge?: boolean;
  snapDistance?: number;

  // Creation options
  defaultProperties?: Record<string, any>;
  autoConnect?: boolean;
  preventOverlap?: boolean;

  // Behavior options
  multiSelect?: boolean;
  preserveSelection?: boolean;
  showPreview?: boolean;
  validateOnCreate?: boolean;
}

// Node palette system
export interface NodePaletteCategory {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
  expanded: boolean;
  nodes: NodePaletteItem[];
  tags: string[];
  standard?: 'ISA' | 'ISO' | 'UK_WATER' | 'CUSTOM';
}

export interface NodePaletteItem {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  icon?: string;
  svgPath?: string;
  previewUrl?: string;
  tags: string[];
  properties: NodeProperties;
  standard: 'ISA' | 'ISO' | 'UK_WATER' | 'CUSTOM';
  dimensions: {
    width: number;
    height: number;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
  };
  connectionPoints: ConnectionPoint[];
  metadata: {
    version: string;
    author: string;
    created: string;
    modified: string;
    usage: number;
    rating?: number;
  };
}

export interface NodeProperties {
  // Basic properties
  label?: string;
  description?: string;

  // Engineering properties
  tag?: string;
  service?: string;
  material?: string;
  size?: string;
  rating?: string;
  specification?: string;

  // Flow properties
  flowRate?: number;
  pressure?: number;
  temperature?: number;
  density?: number;
  viscosity?: number;

  // Equipment properties
  power?: number;
  capacity?: number;
  efficiency?: number;
  speed?: number;

  // Instrumentation properties
  signalType?: 'analog' | 'digital' | 'pneumatic' | 'hydraulic';
  range?: { min: number; max: number; unit: string };
  accuracy?: number;

  // Custom properties
  custom?: Record<string, any>;
}

export interface ConnectionPoint {
  id: string;
  name: string;
  type: 'input' | 'output' | 'bidirectional';
  position: { x: number; y: number };
  connectionType: 'pipe' | 'signal' | 'power' | 'data';
  required: boolean;
  maxConnections?: number;
}

// Selection tools
export interface SelectionTool extends DrawingTool {
  selectionMode: SelectionMode;
  multiSelectKey?: string;
  dragSelectEnabled?: boolean;
  lassoSelectEnabled?: boolean;
}

export enum SelectionMode {
  SINGLE = 'single',
  MULTI = 'multi',
  RECTANGLE = 'rectangle',
  LASSO = 'lasso',
  SIMILAR = 'similar',
  CONNECTED = 'connected',
}

// Property inspector system
export interface PropertyInspector {
  visible: boolean;
  position: 'left' | 'right' | 'bottom' | 'floating';
  width: number;
  height?: number;
  selectedObjects: SelectedObject[];
  groupedProperties: PropertyGroup[];
  searchTerm: string;
  filterBy: PropertyFilter[];
}

export interface SelectedObject {
  id: string;
  type: 'node' | 'edge' | 'group';
  name: string;
  category: string;
  properties: Record<string, PropertyValue>;
  readonly: boolean;
}

export interface PropertyGroup {
  name: string;
  icon?: LucideIcon;
  expanded: boolean;
  properties: PropertyDefinition[];
}

export interface PropertyDefinition {
  key: string;
  name: string;
  description?: string;
  type: PropertyType;
  value: PropertyValue;
  defaultValue?: PropertyValue;
  options?: PropertyValue[];
  validation?: PropertyValidation;
  readonly?: boolean;
  advanced?: boolean;
  unit?: string;
  format?: string;
}

export enum PropertyType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  COLOR = 'color',
  DATE = 'date',
  FILE = 'file',
  RANGE = 'range',
  TEXTAREA = 'textarea',
  OBJECT = 'object',
  ARRAY = 'array',
}

export type PropertyValue = string | number | boolean | string[] | object | null;

export interface PropertyValidation {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: PropertyValue) => string | null;
}

export interface PropertyFilter {
  type: 'category' | 'advanced' | 'modified' | 'readonly' | 'custom';
  value: string;
  enabled: boolean;
}

// Toolbar layout system
export interface ToolbarLayout {
  orientation: 'horizontal' | 'vertical';
  position: 'top' | 'left' | 'right' | 'bottom' | 'floating';
  size: 'small' | 'medium' | 'large';
  collapsible: boolean;
  collapsed: boolean;
  autoHide: boolean;
  groups: ToolGroup[];
  customizable: boolean;
}

export interface ToolGroup {
  id: string;
  name: string;
  tools: string[];
  separator?: boolean;
  collapsible?: boolean;
  collapsed?: boolean;
  priority: number;
}

// Keyboard shortcuts system
export interface KeyboardShortcuts {
  [key: string]: ShortcutAction;
}

export interface ShortcutAction {
  description: string;
  category: string;
  action: () => void;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  conditions?: ShortcutCondition[];
}

export interface ShortcutCondition {
  type: 'tool' | 'mode' | 'selection' | 'custom';
  value: any;
  operator: 'equals' | 'not_equals' | 'includes' | 'custom';
}

// Drag and drop system
export interface DragData {
  type: 'node' | 'edge' | 'tool' | 'custom';
  data: any;
  source: string;
  preview?: ReactNode;
  offset?: { x: number; y: number };
}

export interface DropTarget {
  id: string;
  type: 'canvas' | 'node' | 'edge' | 'palette' | 'custom';
  accepts: string[];
  onDrop: (data: DragData, position: { x: number; y: number }) => void;
  onDragOver?: (data: DragData) => boolean;
  highlight?: boolean;
}

// Tool search and filtering
export interface ToolSearch {
  query: string;
  filters: SearchFilter[];
  results: SearchResult[];
  history: string[];
  suggestions: string[];
}

export interface SearchFilter {
  type: 'category' | 'tag' | 'standard' | 'recent' | 'favorite';
  value: string;
  enabled: boolean;
}

export interface SearchResult {
  type: 'tool' | 'node' | 'action' | 'help';
  id: string;
  name: string;
  description: string;
  category: string;
  score: number;
  highlights: string[];
}

// Accessibility features
export interface AccessibilityConfig {
  enabled: boolean;
  highContrast: boolean;
  largeText: boolean;
  keyboardNavigation: boolean;
  screenReader: boolean;
  focusIndicators: boolean;
  announcements: boolean;
}

export interface AccessibilityAnnouncement {
  type: 'status' | 'alert' | 'log';
  message: string;
  priority: 'low' | 'medium' | 'high';
  persistent?: boolean;
}

// Tool state persistence
export interface ToolState {
  activeTool: string;
  toolOptions: Record<string, ToolOptions>;
  paletteState: PaletteState;
  propertyInspector: PropertyInspector;
  toolbarLayout: ToolbarLayout;
  shortcuts: KeyboardShortcuts;
  accessibility: AccessibilityConfig;
  preferences: ToolPreferences;
}

export interface PaletteState {
  expanded: boolean;
  width: number;
  selectedCategory: string;
  expandedCategories: string[];
  recentNodes: string[];
  favoriteNodes: string[];
  searchState: ToolSearch;
}

export interface ToolPreferences {
  defaultTool: string;
  autoSwitchTool: boolean;
  confirmDestructive: boolean;
  showTooltips: boolean;
  animateTransitions: boolean;
  persistState: boolean;
  theme: 'light' | 'dark' | 'auto';
}

// Context-sensitive help
export interface HelpSystem {
  enabled: boolean;
  contextualHelp: boolean;
  tutorials: Tutorial[];
  tooltips: TooltipConfig;
  shortcuts: ShortcutHelp[];
}

export interface Tutorial {
  id: string;
  name: string;
  description: string;
  steps: TutorialStep[];
  prerequisites: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
}

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target?: string;
  action?: 'click' | 'drag' | 'type' | 'wait';
  validation?: (state: any) => boolean;
}

export interface TooltipConfig {
  enabled: boolean;
  delay: number;
  duration: number;
  showShortcuts: boolean;
  showDescriptions: boolean;
  position: 'auto' | 'top' | 'bottom' | 'left' | 'right';
}

export interface ShortcutHelp {
  keys: string;
  description: string;
  category: string;
  context?: string;
}

// Performance optimization
export interface ToolPerformance {
  virtualization: boolean;
  lazyLoading: boolean;
  debounceMs: number;
  throttleMs: number;
  maxConcurrentOps: number;
  cacheSize: number;
}

// Integration interfaces
export interface ToolbarIntegration {
  signalR?: {
    enabled: boolean;
    broadcastToolChanges: boolean;
    syncToolState: boolean;
  };
  analytics?: {
    enabled: boolean;
    trackToolUsage: boolean;
    trackPerformance: boolean;
  };
  validation?: {
    enabled: boolean;
    realTimeValidation: boolean;
    showErrors: boolean;
  };
}