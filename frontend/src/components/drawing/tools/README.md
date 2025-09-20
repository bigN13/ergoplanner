# Drawing Tools Palette - TASK-016 Integration Guide

## Overview

The Drawing Tools Palette is a comprehensive, professional-grade tool system for the Ergoplanner AI Suite. It provides a complete user interface for drawing operations with support for:

- **40+ Tool Categories**: Selection, Drawing, Editing, View, Annotation, Measurement, Collaboration, and Validation tools
- **Node Palette**: Drag-and-drop interface with 100+ P&ID components across equipment, instrumentation, piping, and electrical categories
- **Property Inspector**: Context-sensitive property editing with real-time validation
- **Multi-Selection**: Advanced selection tools with rectangle, lasso, and intelligent selection modes
- **Keyboard Shortcuts**: Comprehensive shortcut system with customizable hotkeys
- **Responsive Design**: Adaptive layout for desktop, tablet, and mobile devices
- **Accessibility**: Full WCAG 2.1 AA compliance with screen reader support
- **State Persistence**: Auto-save tool settings and preferences

## Quick Integration

### 1. Basic Usage

```tsx
import { DrawingToolsPalette } from '@/components/drawing/tools';

function DrawingInterface() {
  const handleToolChange = (toolId: string) => {
    console.log('Tool changed to:', toolId);
  };

  const handleNodeAdd = (nodeType: string, position: { x: number; y: number }) => {
    console.log('Add node:', nodeType, 'at position:', position);
  };

  const handlePropertyChange = (objectId: string, property: string, value: any) => {
    console.log('Property changed:', objectId, property, value);
  };

  return (
    <DrawingToolsPalette
      onToolChange={handleToolChange}
      onNodeAdd={handleNodeAdd}
      onPropertyChange={handlePropertyChange}
    />
  );
}
```

### 2. Redux Integration

The tool palette integrates with Redux for state management:

```tsx
// In your store configuration
import { store } from '@/store';
import { setActiveTool, togglePalette } from '@/store/slices/toolPaletteSlice';

// Usage in components
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectActiveTool, selectPaletteState } from '@/store/slices/toolPaletteSlice';

function MyComponent() {
  const dispatch = useAppDispatch();
  const activeTool = useAppSelector(selectActiveTool);
  const paletteState = useAppSelector(selectPaletteState);

  const handleToolSelect = (toolId: string) => {
    dispatch(setActiveTool(toolId));
  };

  return (
    <div>
      <p>Active tool: {activeTool}</p>
      <button onClick={() => dispatch(togglePalette())}>
        Toggle Palette
      </button>
    </div>
  );
}
```

## Component Architecture

### Main Components

1. **DrawingToolsPalette** - Main container component
2. **MainToolbar** - Horizontal toolbar with tool categories
3. **NodePalette** - Draggable component library
4. **PropertyInspector** - Context-sensitive property editor
5. **MultiSelectTools** - Advanced selection tools
6. **ToolSearchDialog** - Quick tool and component search
7. **ResponsiveToolLayout** - Adaptive layout management

### Supporting Components

- **ToolSettingsDialog** - Preferences and accessibility settings
- **KeyboardShortcutsOverlay** - Help and shortcut reference
- **ContextToolOptions** - Dynamic tool options panel

## State Management

### Tool Palette State

```typescript
interface ToolState {
  activeTool: string;                    // Currently active tool
  toolOptions: Record<string, ToolOptions>; // Tool-specific options
  paletteState: PaletteState;           // Palette visibility and layout
  propertyInspector: PropertyInspector; // Property panel state
  toolbarLayout: ToolbarLayout;         // Toolbar configuration
  shortcuts: KeyboardShortcuts;         // Keyboard shortcuts
  accessibility: AccessibilityConfig;   // Accessibility settings
  preferences: ToolPreferences;         // User preferences
}
```

### Actions

```typescript
// Tool management
dispatch(setActiveTool('select'));
dispatch(setToolOptions({ toolId: 'draw-pipe', options: { strokeWidth: 3 } }));
dispatch(toggleTool('draw-pipe'));

// Palette management
dispatch(togglePalette());
dispatch(setSelectedCategory('equipment'));
dispatch(addRecentNode('pump-centrifugal'));

// Property inspector
dispatch(togglePropertyInspector());
dispatch(setSelectedObjects([node1, node2]));

// Preferences
dispatch(setPreferences({ showTooltips: false }));
```

## Custom Tool Integration

### Adding a New Tool

1. **Define the tool**:

```typescript
// In toolDefinitions.ts
const customTool: DrawingTool = {
  id: 'custom-measure',
  name: 'Custom Measure',
  icon: Ruler,
  description: 'Custom measurement tool',
  category: ToolCategory.MEASUREMENT,
  shortcut: 'Ctrl+M',
  hotkey: 'ctrl+m',
  mode: ToolMode.SINGLE_USE,
  options: {
    showPreview: true,
    snapToNode: true,
  },
};

export const toolDefinitions = [...existingTools, customTool];
```

2. **Handle tool logic**:

```tsx
function MyCanvas() {
  const activeTool = useAppSelector(selectActiveTool);

  const handleCanvasClick = (event: MouseEvent) => {
    if (activeTool === 'custom-measure') {
      // Implement custom measurement logic
      console.log('Start measurement at:', event.clientX, event.clientY);
    }
  };

  return (
    <div onClick={handleCanvasClick}>
      {/* Canvas content */}
    </div>
  );
}
```

### Adding Custom Node Types

1. **Define the node**:

```typescript
// In toolDefinitions.ts
const customNode: NodePaletteItem = {
  id: 'custom-vessel',
  name: 'Custom Vessel',
  description: 'Custom pressure vessel',
  category: 'equipment',
  tags: ['vessel', 'pressure', 'custom'],
  properties: {
    tag: 'V-101',
    pressure: 10,
    volume: 1000,
  },
  standard: 'CUSTOM',
  dimensions: { width: 60, height: 80 },
  connectionPoints: [
    {
      id: 'inlet',
      name: 'Inlet',
      type: 'input',
      position: { x: 30, y: 0 },
      connectionType: 'pipe',
      required: false,
    },
  ],
  metadata: {
    version: '1.0',
    author: 'Custom',
    created: '2024-01-01',
    modified: '2024-01-01',
    usage: 0,
  },
};
```

2. **Add to category**:

```typescript
const customCategory: NodePaletteCategory = {
  id: 'custom',
  name: 'Custom Components',
  icon: Package,
  description: 'Custom organization components',
  expanded: true,
  tags: ['custom'],
  nodes: [customNode],
  standard: 'CUSTOM',
};

export const nodePaletteData = [...existingCategories, customCategory];
```

## Keyboard Shortcuts

### Default Shortcuts

| Shortcut | Tool | Description |
|----------|------|-------------|
| V | Select | Selection tool |
| M | Rectangle Select | Rectangle selection |
| L | Lasso Select | Lasso selection |
| P | Draw Pipe | Pipe drawing tool |
| S | Draw Signal | Signal drawing tool |
| C | Add Component | Component placement |
| H | Pan | Pan tool |
| Z | Zoom In | Zoom in tool |
| Shift+Z | Zoom Out | Zoom out tool |
| F | Fit View | Fit all content |
| T | Add Text | Text annotation |
| Ctrl+A | Select All | Select all objects |
| Ctrl+C | Copy | Copy selection |
| Ctrl+V | Paste | Paste clipboard |
| Del | Delete | Delete selection |
| Ctrl+Z | Undo | Undo last action |
| Ctrl+Y | Redo | Redo last action |

### Custom Shortcuts

```typescript
// Using the keyboard shortcuts hook
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

function MyComponent() {
  useKeyboardShortcuts({
    'ctrl+shift+s': () => {
      // Custom save action
      console.log('Custom save');
    },
    'alt+1': () => {
      // Switch to custom tool
      dispatch(setActiveTool('my-custom-tool'));
    },
  });
}
```

## Responsive Design

The tool palette automatically adapts to different screen sizes:

### Desktop (1024px+)
- Full toolbar with all tools visible
- Left: Node palette (280px)
- Center: Canvas
- Right: Property inspector (320px)

### Tablet (768px - 1023px)
- Collapsible sidebar panels
- Compact toolbar
- Touch-friendly controls

### Mobile (< 768px)
- Bottom toolbar with essential tools
- Overlay panels for palette and properties
- Swipe gestures for navigation

### Custom Layout

```tsx
import { ResponsiveToolLayout } from '@/components/drawing/tools';

function CustomLayout() {
  const [layout, setLayout] = useState({
    orientation: 'horizontal',
    position: 'top',
    size: 'medium',
    collapsible: true,
  });

  return (
    <ResponsiveToolLayout
      layout={layout}
      onLayoutChange={setLayout}
    >
      <MyCanvas />
    </ResponsiveToolLayout>
  );
}
```

## Accessibility Features

### Screen Reader Support

```tsx
// All components include proper ARIA attributes
<Button
  role="button"
  aria-label="Select tool (V)"
  aria-pressed={isActive}
  tabIndex={0}
>
  <MousePointer2 className="h-4 w-4" />
</Button>
```

### High Contrast Mode

```tsx
// Enable high contrast in accessibility settings
dispatch(setAccessibilityConfig({
  highContrast: true,
  largeText: true,
  focusIndicators: true
}));
```

### Keyboard Navigation

- Tab: Navigate through tools
- Enter/Space: Activate tool
- Arrow keys: Navigate within categories
- Esc: Cancel operations

## State Persistence

### Auto-Save

Tool settings are automatically saved to localStorage:

```typescript
import { useToolStatePersistence } from '@/hooks/useToolStatePersistence';

function MyApp() {
  const persistence = useToolStatePersistence({
    enabled: true,
    autoSave: true,
    saveInterval: 5000, // 5 seconds
  });

  return (
    <div>
      <button onClick={persistence.exportToFile}>
        Export Settings
      </button>
      <input
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) persistence.importFromFile(file);
        }}
      />
    </div>
  );
}
```

### Session Management

```typescript
import { useSessionState } from '@/hooks/useToolStatePersistence';

function MyComponent() {
  const { saveSessionData, loadSessionData } = useSessionState();

  // Save temporary data
  saveSessionData('lastPosition', { x: 100, y: 200 });

  // Load temporary data
  const lastPosition = loadSessionData('lastPosition', { x: 0, y: 0 });
}
```

## Performance Optimization

### Virtual Scrolling

Large node palettes use virtual scrolling for performance:

```tsx
// Automatically enabled for categories with 50+ items
<NodePalette
  categories={largeCategories}
  virtualScrolling={true}
  itemHeight={64}
  containerHeight={400}
/>
```

### Debounced Updates

Property changes are debounced to prevent excessive updates:

```typescript
// Property changes debounced by 300ms
const handlePropertyChange = debounce((objectId, property, value) => {
  updateObjectProperty(objectId, property, value);
}, 300);
```

## Integration Examples

### ReactFlow Integration

```tsx
import ReactFlow, { useReactFlow } from 'reactflow';
import { DrawingToolsPalette } from '@/components/drawing/tools';

function FlowCanvas() {
  const reactFlowInstance = useReactFlow();

  const handleNodeAdd = (nodeType: string, position: { x: number; y: number }) => {
    const newNode = {
      id: `${nodeType}-${Date.now()}`,
      type: nodeType,
      position,
      data: { label: nodeType },
    };

    reactFlowInstance.addNodes([newNode]);
  };

  const handleToolChange = (toolId: string) => {
    // Update canvas interaction mode based on tool
    if (toolId === 'pan') {
      reactFlowInstance.setViewport({
        x: 0, y: 0, zoom: 1
      });
    }
  };

  return (
    <div className="flex h-screen">
      <DrawingToolsPalette
        onNodeAdd={handleNodeAdd}
        onToolChange={handleToolChange}
      />
      <ReactFlow>
        {/* ReactFlow content */}
      </ReactFlow>
    </div>
  );
}
```

### SignalR Integration

```tsx
import { useSignalRConnection } from '@/hooks/useSignalRConnection';

function CollaborativeCanvas() {
  const connection = useSignalRConnection();

  const handleToolChange = (toolId: string) => {
    // Broadcast tool change to other users
    connection?.invoke('ToolChanged', {
      userId: currentUser.id,
      toolId,
      timestamp: new Date(),
    });
  };

  const handlePropertyChange = (objectId: string, property: string, value: any) => {
    // Broadcast property change
    connection?.invoke('PropertyChanged', {
      objectId,
      property,
      value,
      userId: currentUser.id,
    });
  };

  return (
    <DrawingToolsPalette
      onToolChange={handleToolChange}
      onPropertyChange={handlePropertyChange}
    />
  );
}
```

## Troubleshooting

### Common Issues

1. **Tools not responding to shortcuts**
   - Check if input fields have focus
   - Verify keyboard event listeners are properly attached
   - Ensure shortcuts don't conflict with browser shortcuts

2. **Performance issues with large palettes**
   - Enable virtual scrolling
   - Implement lazy loading for node icons
   - Use React.memo for node components

3. **State not persisting**
   - Check localStorage availability
   - Verify persistence is enabled in preferences
   - Check for quota exceeded errors

4. **Responsive layout issues**
   - Test on actual devices, not just browser resize
   - Check for CSS conflicts
   - Verify touch event handling

### Debug Mode

Enable debug mode for detailed logging:

```typescript
// In development
localStorage.setItem('ergoplanner-debug', 'true');

// Will log all tool changes, shortcuts, and state updates
```

## Contributing

When extending the tool palette:

1. Follow the existing component patterns
2. Add proper TypeScript types
3. Include accessibility attributes
4. Add keyboard shortcuts for new tools
5. Update the tool definitions
6. Add responsive styles
7. Include comprehensive tests

## Support

For issues and questions:
- Check the existing tool definitions in `/data/toolDefinitions.ts`
- Review component implementations in `/components/drawing/tools/`
- Test with the provided integration examples
- Enable debug mode for detailed logging