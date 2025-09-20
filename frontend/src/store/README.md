# Enhanced Redux State Management for Drawings

## Overview

This document describes the enhanced Redux state management system for the Ergoplanner AI Suite drawing application, implemented as part of TASK-022. The system provides enterprise-grade state management with undo/redo functionality, real-time collaboration, state persistence, and performance optimization.

## Key Features

### 🎯 Core Features
- **Undo/Redo System**: 50-action history with smart action grouping
- **State Persistence**: Auto-save to localStorage with session recovery
- **Real-time Collaboration**: Optimistic updates with conflict resolution
- **Performance Optimization**: Normalized state structure with entity adapters
- **State Validation**: Real-time validation with error recovery
- **Import/Export**: Comprehensive state management for file operations
- **Templates & Snapshots**: Drawing templates and checkpoint system
- **Backend Synchronization**: Conflict resolution and offline support

### 🚀 Performance Features
- Normalized state structure using RTK entity adapters
- Selective state updates and partial rendering
- State size monitoring and cleanup
- Efficient diff calculations
- Memory usage optimization

### 🔄 Collaboration Features
- Optimistic updates with server confirmation
- Real-time cursor tracking and selection sharing
- Element locking for concurrent editing
- Conflict detection and automatic resolution
- Cross-tab synchronization

## Architecture

### State Structure

```typescript
interface EnhancedDrawingState {
  // Core state
  currentDrawing: Drawing | null;
  reactFlowData: ReactFlowData;

  // Normalized data for performance
  normalized: NormalizedDrawingState;

  // Selection and editing
  selection: SelectionState;
  clipboard: ClipboardState;

  // Enhanced history with undo/redo
  history: DrawingHistory;

  // Real-time collaboration
  collaboration: CollaborationState;

  // Auto-save and persistence
  persistence: PersistenceState;

  // Performance monitoring
  performance: PerformanceMetrics;

  // State validation
  validation: ValidationState;

  // Import/Export
  importExport: ImportExportState;

  // Templates and snapshots
  templates: DrawingTemplate[];
  snapshots: DrawingSnapshot[];

  // UI state
  ui: UIState;
}
```

### Key Components

#### 1. Enhanced Drawing Slice (`enhancedDrawingSlice.ts`)
- Main state slice with all drawing-related reducers
- Comprehensive action creators for all operations
- Immutable state updates using Immer
- Performance-optimized state structure

#### 2. State Persistence Middleware (`statePersistence.ts`)
- Auto-save to localStorage with compression
- Session recovery and migration support
- Cross-tab synchronization using BroadcastChannel
- Storage health monitoring

#### 3. Collaboration Middleware (`collaborationMiddleware.ts`)
- Real-time updates via SignalR
- Optimistic update management
- Conflict detection and resolution
- Cursor and selection sharing

#### 4. Drawing Utilities (`drawingUtils.ts`)
- State diff calculation and merging
- Validation functions with auto-fix suggestions
- Performance monitoring utilities
- Action grouping for better undo/redo

#### 5. Normalization Utilities (`normalization.ts`)
- Entity adapters for performance optimization
- Normalized state structure management
- Relationship mapping between entities
- Efficient state updates

## Usage

### Basic Usage

```typescript
import { useDrawing, useDrawingHistory, useDrawingUpdate } from '@/store/hooks/drawingHooks';

function DrawingComponent() {
  const { currentDrawing, reactFlowData } = useDrawing();
  const { canUndo, canRedo, undo, redo } = useDrawingHistory();
  const { updateData } = useDrawingUpdate();

  const handleDataChange = (newData) => {
    updateData(newData, 'User modification');
  };

  return (
    <div>
      <button onClick={undo} disabled={!canUndo}>Undo</button>
      <button onClick={redo} disabled={!canRedo}>Redo</button>
      {/* ReactFlow canvas */}
    </div>
  );
}
```

### Advanced Features

#### Action Grouping
```typescript
import { useDrawingHistory } from '@/store/hooks/drawingHooks';

function ComplexOperation() {
  const { withActionGroup } = useDrawingHistory();

  const performComplexOperation = () => {
    withActionGroup('Complex operation', () => {
      // Multiple related actions
      updateNodes(newNodes);
      updateEdges(newEdges);
      updateComponents(newComponents);
    });
  };
}
```

#### Real-time Collaboration
```typescript
import { useDrawingCollaboration } from '@/store/hooks/drawingHooks';

function CollaborativeCanvas() {
  const { cursors, locks, updateCursor, lockElement } = useDrawingCollaboration();

  const handleMouseMove = (event) => {
    const position = { x: event.clientX, y: event.clientY };
    updateCursor(position);
  };

  const handleElementEdit = async (elementId) => {
    await lockElement(elementId, 'node');
    // Perform edit
  };
}
```

#### State Validation
```typescript
import { useDrawingValidation } from '@/store/hooks/drawingHooks';

function ValidationPanel() {
  const { validationErrors, validateLocal, validateRemote } = useDrawingValidation();

  useEffect(() => {
    validateLocal(); // Validate locally
  }, [reactFlowData]);

  const handleDeepValidation = async () => {
    const result = await validateRemote(true); // Server validation
  };
}
```

#### Performance Monitoring
```typescript
import { useDrawingPerformance } from '@/store/hooks/drawingHooks';

function PerformancePanel() {
  const { metrics, health, performanceScore } = useDrawingPerformance();

  return (
    <div>
      <div>Performance Score: {performanceScore}%</div>
      <div>State Size: {metrics.stateSizeFormatted}</div>
      <div>Update Time: {metrics.averageUpdateTime}ms</div>
    </div>
  );
}
```

## API Integration

### RTK Query Integration
The enhanced state works seamlessly with RTK Query for backend synchronization:

```typescript
// Automatic API sync
const { updateData } = useDrawingUpdate();

updateData(newData, 'Description', {
  syncToServer: true, // Automatically syncs to backend
  optimistic: true,   // Applies optimistic update
});
```

### Conflict Resolution
```typescript
// Automatic conflict resolution
const conflictResolution = {
  strategy: 'merge',
  resolvedData: mergedData,
};

dispatch(resolveStateConflict({
  conflictId: 'conflict-123',
  resolution: conflictResolution,
}));
```

## Configuration

### Store Configuration
```typescript
// Configure enhanced drawing state
const store = configureStore({
  reducer: {
    enhancedDrawing: enhancedDrawingSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(statePersistenceMiddleware.middleware)
      .concat(collaborationMiddleware.middleware),
});
```

### Persistence Configuration
```typescript
// Enable auto-save with custom settings
const { enableAutosave } = useDrawingPersistence();

enableAutosave(30000, 'custom-storage-key'); // 30 second interval
```

## Performance Optimization

### State Normalization
The system uses normalized state structure for optimal performance:

```typescript
// Normalized entities for fast lookups
const normalizedState = {
  entities: {
    drawings: { 'id1': drawing1, 'id2': drawing2 },
    components: { 'comp1': component1, 'comp2': component2 },
    nodes: { 'node1': node1, 'node2': node2 },
  },
  ids: {
    drawings: ['id1', 'id2'],
    components: ['comp1', 'comp2'],
    nodes: ['node1', 'node2'],
  },
  relationships: {
    drawingComponents: { 'id1': ['comp1', 'comp2'] },
    componentNodes: { 'comp1': 'node1' },
  },
};
```

### Memory Management
- Automatic history size limiting (50 actions)
- Performance sample cleanup
- Expired optimistic update removal
- Snapshot retention policies

### Selective Updates
```typescript
// Only update specific parts of state
dispatch(updateNodes(newNodes)); // Only updates nodes
dispatch(updatePerformanceMetrics({ stateSize })); // Only metrics
```

## Error Handling

### Validation Errors
```typescript
interface ValidationError {
  id: string;
  type: 'warning' | 'error' | 'critical';
  category: 'data' | 'consistency' | 'performance';
  message: string;
  affectedElements: string[];
  suggestedFix?: string;
}
```

### Auto-fix Capabilities
```typescript
// Automatic validation issue fixes
const autoFixTypes = [
  'orphaned-edges',
  'missing-positions',
  'invalid-references',
];

dispatch(autoFixDrawing({ drawingId, autoFixTypes }));
```

## Migration and Versioning

### State Migration
```typescript
// Automatic state migration between versions
const migrateState = (persistedState: PersistedState) => {
  if (persistedState.version === '0.9.0') {
    return migrate_0_9_0_to_1_0_0(persistedState.state);
  }
  return persistedState.state;
};
```

### Version Compatibility
- Forward and backward compatibility
- Migration logging and error handling
- Backup creation before migration

## Testing

### Unit Tests
```typescript
// Example test structure
describe('Enhanced Drawing Slice', () => {
  it('should handle undo/redo correctly', () => {
    const initialState = getInitialState();
    const action = updateReactFlowDataWithHistory({
      data: newData,
      description: 'Test update',
    });

    const newState = enhancedDrawingSlice.reducer(initialState, action);
    expect(newState.history.past.length).toBe(1);

    const undoState = enhancedDrawingSlice.reducer(newState, undo());
    expect(undoState.reactFlowData).toEqual(initialState.reactFlowData);
  });
});
```

### Integration Tests
```typescript
// Test with React Testing Library
import { renderWithProviders } from '@/test/utils';
import { EnhancedDrawingCanvas } from '@/components/drawing/EnhancedDrawingCanvas';

test('should handle drawing updates', async () => {
  const { getByTestId } = renderWithProviders(<EnhancedDrawingCanvas />);

  const canvas = getByTestId('drawing-canvas');
  fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });

  await waitFor(() => {
    expect(getPerformanceMetrics().actionCount).toBeGreaterThan(0);
  });
});
```

## Best Practices

### 1. Action Grouping
Group related actions for better undo/redo experience:
```typescript
withActionGroup('Move multiple elements', () => {
  nodes.forEach(node => updateNodePosition(node.id, newPosition));
});
```

### 2. Optimistic Updates
Use optimistic updates for immediate feedback:
```typescript
const updateId = await applyOptimisticUpdate(action);
// Update applied immediately, confirmed/rejected later
```

### 3. Performance Monitoring
Monitor performance metrics in production:
```typescript
const { performanceScore, health } = useDrawingPerformance();
if (performanceScore < 60) {
  // Consider performance optimizations
}
```

### 4. State Validation
Validate state after significant changes:
```typescript
useEffect(() => {
  if (significantChange) {
    validateLocal();
  }
}, [reactFlowData]);
```

### 5. Error Recovery
Implement graceful error recovery:
```typescript
try {
  await updateDrawingData(data);
} catch (error) {
  // Revert optimistic update
  dispatch(rejectOptimisticUpdate(updateId));
  // Show user-friendly error message
}
```

## Troubleshooting

### Common Issues

#### 1. State Size Too Large
```typescript
// Check state size
const { stateSize } = useDrawingPerformance();
if (stateSize > 5 * 1024 * 1024) { // 5MB
  // Clear old history, optimize snapshots
  dispatch(clearHistory());
}
```

#### 2. Collaboration Conflicts
```typescript
// Monitor conflicts
const { conflicts } = useDrawingCollaboration();
if (conflicts.length > 0) {
  // Handle conflicts manually or automatically
  conflicts.forEach(conflict => resolveConflict(conflict));
}
```

#### 3. Performance Issues
```typescript
// Enable performance mode
dispatch(updateSettings({ performanceMode: 'high-performance' }));
```

#### 4. Persistence Failures
```typescript
// Check storage health
const storageHealth = getStorageHealth();
if (storageHealth.quotaExceeded) {
  // Clear old data or disable persistence
}
```

## Future Enhancements

### Planned Features
- [ ] WebRTC-based peer-to-peer collaboration
- [ ] Advanced conflict resolution strategies
- [ ] Machine learning-based performance optimization
- [ ] Distributed state synchronization
- [ ] Enhanced offline capabilities

### Extension Points
- Custom validation rules
- Plugin-based action handlers
- Custom persistence backends
- External collaboration providers

## Contributing

When contributing to the enhanced drawing state:

1. Follow TypeScript strict mode requirements
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Consider performance implications
5. Maintain backward compatibility

## License

This enhanced Redux state management system is part of the Ergoplanner AI Suite and follows the project's licensing terms.