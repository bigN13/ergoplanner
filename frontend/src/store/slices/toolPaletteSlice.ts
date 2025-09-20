/**
 * Tool Palette Redux Slice - TASK-016 Implementation
 * Comprehensive state management for drawing tools and palette
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  DrawingTool,
  ToolCategory,
  ToolState,
  NodePaletteCategory,
  NodePaletteItem,
  PropertyInspector,
  ToolbarLayout,
  PaletteState,
  SelectionMode,
  ToolSearch,
  ToolPreferences,
  AccessibilityConfig,
  HelpSystem,
  ToolOptions,
} from '@/types/tools';
import { toolDefinitions, nodePaletteData } from '@/data/toolDefinitions';

// Initial state
const initialState: ToolState = {
  activeTool: 'select',
  toolOptions: {},
  paletteState: {
    expanded: true,
    width: 280,
    selectedCategory: 'equipment',
    expandedCategories: ['equipment', 'instrumentation'],
    recentNodes: [],
    favoriteNodes: [],
    searchState: {
      query: '',
      filters: [],
      results: [],
      history: [],
      suggestions: [],
    },
  },
  propertyInspector: {
    visible: true,
    position: 'right',
    width: 320,
    height: 400,
    selectedObjects: [],
    groupedProperties: [],
    searchTerm: '',
    filterBy: [],
  },
  toolbarLayout: {
    orientation: 'horizontal',
    position: 'top',
    size: 'medium',
    collapsible: true,
    collapsed: false,
    autoHide: false,
    groups: [
      {
        id: 'selection',
        name: 'Selection',
        tools: ['select', 'rectangle-select', 'lasso-select'],
        priority: 1,
      },
      {
        id: 'drawing',
        name: 'Drawing',
        tools: ['draw-pipe', 'draw-signal', 'add-component'],
        separator: true,
        priority: 2,
      },
      {
        id: 'editing',
        name: 'Editing',
        tools: ['move', 'rotate', 'scale', 'align'],
        separator: true,
        priority: 3,
      },
      {
        id: 'view',
        name: 'View',
        tools: ['pan', 'zoom-in', 'zoom-out', 'fit-view'],
        separator: true,
        priority: 4,
      },
    ],
    customizable: true,
  },
  shortcuts: {},
  accessibility: {
    enabled: false,
    highContrast: false,
    largeText: false,
    keyboardNavigation: true,
    screenReader: false,
    focusIndicators: true,
    announcements: true,
  },
  preferences: {
    defaultTool: 'select',
    autoSwitchTool: true,
    confirmDestructive: true,
    showTooltips: true,
    animateTransitions: true,
    persistState: true,
    theme: 'auto',
  },
};

const toolPaletteSlice = createSlice({
  name: 'toolPalette',
  initialState,
  reducers: {
    // Tool management
    setActiveTool: (state, action: PayloadAction<string>) => {
      const previousTool = state.activeTool;
      state.activeTool = action.payload;

      // Auto-switch logic
      if (state.preferences.autoSwitchTool) {
        // Store previous tool for quick switching
        if (previousTool !== action.payload) {
          state.toolOptions.previousTool = previousTool;
        }
      }
    },

    setToolOptions: (state, action: PayloadAction<{ toolId: string; options: Partial<ToolOptions> }>) => {
      const { toolId, options } = action.payload;
      state.toolOptions[toolId] = {
        ...state.toolOptions[toolId],
        ...options,
      };
    },

    resetToolOptions: (state, action: PayloadAction<string>) => {
      delete state.toolOptions[action.payload];
    },

    toggleTool: (state, action: PayloadAction<string>) => {
      const toolId = action.payload;
      if (state.activeTool === toolId) {
        state.activeTool = state.preferences.defaultTool;
      } else {
        state.activeTool = toolId;
      }
    },

    // Palette management
    togglePalette: (state) => {
      state.paletteState.expanded = !state.paletteState.expanded;
    },

    setPaletteWidth: (state, action: PayloadAction<number>) => {
      state.paletteState.width = Math.max(200, Math.min(500, action.payload));
    },

    setSelectedCategory: (state, action: PayloadAction<string>) => {
      state.paletteState.selectedCategory = action.payload;
    },

    toggleCategoryExpansion: (state, action: PayloadAction<string>) => {
      const categoryId = action.payload;
      const index = state.paletteState.expandedCategories.indexOf(categoryId);

      if (index >= 0) {
        state.paletteState.expandedCategories.splice(index, 1);
      } else {
        state.paletteState.expandedCategories.push(categoryId);
      }
    },

    addRecentNode: (state, action: PayloadAction<string>) => {
      const nodeId = action.payload;
      const index = state.paletteState.recentNodes.indexOf(nodeId);

      // Remove if already exists
      if (index >= 0) {
        state.paletteState.recentNodes.splice(index, 1);
      }

      // Add to beginning
      state.paletteState.recentNodes.unshift(nodeId);

      // Keep only last 10
      if (state.paletteState.recentNodes.length > 10) {
        state.paletteState.recentNodes = state.paletteState.recentNodes.slice(0, 10);
      }
    },

    toggleFavoriteNode: (state, action: PayloadAction<string>) => {
      const nodeId = action.payload;
      const index = state.paletteState.favoriteNodes.indexOf(nodeId);

      if (index >= 0) {
        state.paletteState.favoriteNodes.splice(index, 1);
      } else {
        state.paletteState.favoriteNodes.push(nodeId);
      }
    },

    // Search functionality
    setSearchQuery: (state, action: PayloadAction<string>) => {
      const query = action.payload;
      state.paletteState.searchState.query = query;

      // Add to history if query is significant
      if (query.length > 2 && !state.paletteState.searchState.history.includes(query)) {
        state.paletteState.searchState.history.unshift(query);
        if (state.paletteState.searchState.history.length > 10) {
          state.paletteState.searchState.history = state.paletteState.searchState.history.slice(0, 10);
        }
      }
    },

    setSearchResults: (state, action: PayloadAction<any[]>) => {
      state.paletteState.searchState.results = action.payload;
    },

    clearSearch: (state) => {
      state.paletteState.searchState.query = '';
      state.paletteState.searchState.results = [];
    },

    // Property inspector
    togglePropertyInspector: (state) => {
      state.propertyInspector.visible = !state.propertyInspector.visible;
    },

    setPropertyInspectorPosition: (state, action: PayloadAction<'left' | 'right' | 'bottom' | 'floating'>) => {
      state.propertyInspector.position = action.payload;
    },

    setPropertyInspectorSize: (state, action: PayloadAction<{ width?: number; height?: number }>) => {
      const { width, height } = action.payload;
      if (width !== undefined) {
        state.propertyInspector.width = Math.max(250, Math.min(600, width));
      }
      if (height !== undefined) {
        state.propertyInspector.height = Math.max(200, Math.min(800, height));
      }
    },

    setSelectedObjects: (state, action: PayloadAction<any[]>) => {
      state.propertyInspector.selectedObjects = action.payload;
      // Auto-generate grouped properties based on selection
      // This would be implemented with actual property grouping logic
    },

    setPropertyValue: (state, action: PayloadAction<{ objectId: string; property: string; value: any }>) => {
      const { objectId, property, value } = action.payload;
      const object = state.propertyInspector.selectedObjects.find(obj => obj.id === objectId);
      if (object) {
        object.properties[property] = value;
      }
    },

    setPropertySearchTerm: (state, action: PayloadAction<string>) => {
      state.propertyInspector.searchTerm = action.payload;
    },

    // Toolbar layout
    setToolbarLayout: (state, action: PayloadAction<Partial<ToolbarLayout>>) => {
      state.toolbarLayout = {
        ...state.toolbarLayout,
        ...action.payload,
      };
    },

    toggleToolbarCollapse: (state) => {
      state.toolbarLayout.collapsed = !state.toolbarLayout.collapsed;
    },

    reorderToolGroups: (state, action: PayloadAction<{ fromIndex: number; toIndex: number }>) => {
      const { fromIndex, toIndex } = action.payload;
      const groups = [...state.toolbarLayout.groups];
      const [removed] = groups.splice(fromIndex, 1);
      groups.splice(toIndex, 0, removed);
      state.toolbarLayout.groups = groups;
    },

    updateToolGroup: (state, action: PayloadAction<{ groupId: string; updates: Partial<any> }>) => {
      const { groupId, updates } = action.payload;
      const group = state.toolbarLayout.groups.find(g => g.id === groupId);
      if (group) {
        Object.assign(group, updates);
      }
    },

    // Accessibility
    setAccessibilityConfig: (state, action: PayloadAction<Partial<AccessibilityConfig>>) => {
      state.accessibility = {
        ...state.accessibility,
        ...action.payload,
      };
    },

    toggleAccessibilityFeature: (state, action: PayloadAction<keyof AccessibilityConfig>) => {
      const feature = action.payload;
      if (typeof state.accessibility[feature] === 'boolean') {
        (state.accessibility[feature] as boolean) = !(state.accessibility[feature] as boolean);
      }
    },

    // Preferences
    setPreferences: (state, action: PayloadAction<Partial<ToolPreferences>>) => {
      state.preferences = {
        ...state.preferences,
        ...action.payload,
      };
    },

    resetToDefaults: (state) => {
      // Reset to initial state but preserve some user data
      const preservedData = {
        recentNodes: state.paletteState.recentNodes,
        favoriteNodes: state.paletteState.favoriteNodes,
        searchHistory: state.paletteState.searchState.history,
      };

      Object.assign(state, initialState);

      state.paletteState.recentNodes = preservedData.recentNodes;
      state.paletteState.favoriteNodes = preservedData.favoriteNodes;
      state.paletteState.searchState.history = preservedData.searchHistory;
    },

    // Bulk operations
    importState: (state, action: PayloadAction<Partial<ToolState>>) => {
      Object.assign(state, action.payload);
    },

    exportState: (state) => {
      // This would trigger an export action in middleware
      // For now, just return the current state
      return state;
    },

    // Quick actions
    selectPreviousTool: (state) => {
      const previousTool = state.toolOptions.previousTool as string;
      if (previousTool && previousTool !== state.activeTool) {
        const currentTool = state.activeTool;
        state.activeTool = previousTool;
        state.toolOptions.previousTool = currentTool;
      }
    },

    cycleSelectionMode: (state) => {
      // This would cycle through different selection modes
      // Implementation depends on current tool
    },

    quickTogglePropertyInspector: (state) => {
      state.propertyInspector.visible = !state.propertyInspector.visible;
    },

    quickTogglePalette: (state) => {
      state.paletteState.expanded = !state.paletteState.expanded;
    },
  },
});

export const {
  // Tool management
  setActiveTool,
  setToolOptions,
  resetToolOptions,
  toggleTool,

  // Palette management
  togglePalette,
  setPaletteWidth,
  setSelectedCategory,
  toggleCategoryExpansion,
  addRecentNode,
  toggleFavoriteNode,

  // Search functionality
  setSearchQuery,
  setSearchResults,
  clearSearch,

  // Property inspector
  togglePropertyInspector,
  setPropertyInspectorPosition,
  setPropertyInspectorSize,
  setSelectedObjects,
  setPropertyValue,
  setPropertySearchTerm,

  // Toolbar layout
  setToolbarLayout,
  toggleToolbarCollapse,
  reorderToolGroups,
  updateToolGroup,

  // Accessibility
  setAccessibilityConfig,
  toggleAccessibilityFeature,

  // Preferences
  setPreferences,
  resetToDefaults,

  // Bulk operations
  importState,
  exportState,

  // Quick actions
  selectPreviousTool,
  cycleSelectionMode,
  quickTogglePropertyInspector,
  quickTogglePalette,
} = toolPaletteSlice.actions;

export default toolPaletteSlice.reducer;

// Selectors
export const selectToolPaletteState = (state: { toolPalette: ToolState }) => state.toolPalette;
export const selectActiveTool = (state: { toolPalette: ToolState }) => state.toolPalette.activeTool;
export const selectToolOptions = (state: { toolPalette: ToolState }) => state.toolPalette.toolOptions;
export const selectPaletteState = (state: { toolPalette: ToolState }) => state.toolPalette.paletteState;
export const selectPropertyInspector = (state: { toolPalette: ToolState }) => state.toolPalette.propertyInspector;
export const selectToolbarLayout = (state: { toolPalette: ToolState }) => state.toolPalette.toolbarLayout;
export const selectAccessibilityConfig = (state: { toolPalette: ToolState }) => state.toolPalette.accessibility;
export const selectPreferences = (state: { toolPalette: ToolState }) => state.toolPalette.preferences;

// Computed selectors
export const selectCurrentToolDefinition = (state: { toolPalette: ToolState }) => {
  const activeToolId = state.toolPalette.activeTool;
  return toolDefinitions.find(tool => tool.id === activeToolId);
};

export const selectFilteredNodes = (state: { toolPalette: ToolState }) => {
  const { query, filters } = state.toolPalette.paletteState.searchState;
  // This would implement actual filtering logic
  return [];
};

export const selectSelectedProperties = (state: { toolPalette: ToolState }) => {
  const inspector = state.toolPalette.propertyInspector;
  // This would implement property filtering and grouping
  return inspector.groupedProperties;
};