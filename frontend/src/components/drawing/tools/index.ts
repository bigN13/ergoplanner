/**
 * Drawing Tools Module - TASK-016 Implementation
 * Main export file for all drawing tools components
 */

// Main tool palette component
export { DrawingToolsPalette } from './DrawingToolsPalette';

// Core tool components
export { MainToolbar } from './MainToolbar';
export { NodePalette } from './NodePalette';
export { PropertyInspector } from './PropertyInspector';
export { MultiSelectTools } from './MultiSelectTools';

// Dialog components
export { ToolSearchDialog } from './ToolSearchDialog';
export { ToolSettingsDialog } from './ToolSettingsDialog';
export { KeyboardShortcutsOverlay } from './KeyboardShortcutsOverlay';

// Re-export types for convenience
export type {
  DrawingTool,
  ToolCategory,
  ToolMode,
  NodePaletteCategory,
  NodePaletteItem,
  PropertyInspector as PropertyInspectorType,
  ToolState,
  SelectionMode,
  ToolPreferences,
  AccessibilityConfig,
  HelpSystem,
} from '@/types/tools';

// Re-export tool definitions
export {
  toolDefinitions,
  nodePaletteData,
  toolCategories,
  defaultKeyboardShortcuts,
} from '@/data/toolDefinitions';

// Re-export store actions and selectors
export {
  // Actions
  setActiveTool,
  setToolOptions,
  togglePalette,
  togglePropertyInspector,
  setSelectedCategory,
  addRecentNode,
  toggleFavoriteNode,
  setPreferences,

  // Selectors
  selectToolPaletteState,
  selectActiveTool,
  selectPaletteState,
  selectPropertyInspector,
  selectCurrentToolDefinition,
} from '@/store/slices/toolPaletteSlice';