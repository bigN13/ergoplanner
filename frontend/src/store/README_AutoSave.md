# Auto-save System Documentation
**TASK-023: Auto-save Functionality**

This document provides comprehensive documentation for the auto-save system implementation in the Ergoplanner AI Suite.

## Overview

The auto-save system provides automatic, intelligent saving of drawing data with conflict resolution, error handling, offline support, and comprehensive user feedback. It's designed to ensure data safety while providing an excellent user experience.

## Key Features

### 🔄 Automatic Saving
- **Smart Debouncing**: Saves after 5 seconds of inactivity with 30-second maximum intervals
- **Incremental Saves**: Only saves changed data to optimize performance
- **Priority-based Queuing**: Critical operations get higher priority
- **Emergency Saves**: Triggered on page navigation/close with unsaved changes

### 🌐 Network Resilience
- **Connection Monitoring**: Real-time network status tracking with quality assessment
- **Offline Mode**: Queues operations when offline with automatic sync on reconnection
- **Retry Mechanisms**: Exponential backoff with configurable retry limits
- **Circuit Breakers**: Prevents cascading failures with service protection

### ⚔️ Conflict Resolution
- **Three-way Merge**: Intelligent merging of local, server, and base versions
- **Visual Conflict Resolution**: User-friendly interface for manual conflict resolution
- **Auto-resolution**: High-confidence conflicts resolved automatically
- **Change Tracking**: Granular tracking of all drawing modifications

### 🛡️ Data Protection
- **Multiple Backups**: Automatic backups with configurable retention
- **Data Validation**: Comprehensive validation before saving
- **Integrity Checks**: Checksums and corruption detection
- **Recovery Mechanisms**: Automatic recovery from various failure scenarios

### 🎯 User Experience
- **Status Indicators**: Real-time save status with progress feedback
- **Smart Notifications**: Non-intrusive notifications with actionable items
- **Keyboard Shortcuts**: Ctrl+S for manual saves
- **Error Handling**: User-friendly error messages with suggested actions

## Architecture

### Core Services

#### AutoSaveService
The main orchestrator that handles:
- Save operation lifecycle management
- Smart debouncing and scheduling
- Integration with other services
- Emergency save scenarios

```typescript
const autoSaveService = new AutoSaveService(dispatch, getState, {
  enabled: true,
  interval: 30000,
  debounceDelay: 5000,
  maxRetries: 5
});
```

#### NetworkMonitor
Monitors network connectivity and quality:
- Real-time connection status
- Network quality assessment (excellent/good/poor)
- Automatic reconnection with exponential backoff
- Performance metrics tracking

```typescript
const networkMonitor = getNetworkMonitor({
  pingInterval: 30000,
  qualityCheckInterval: 60000,
  reconnectAttempts: 10
});
```

#### BackupService
Manages data backups and recovery:
- Multiple storage backends (localStorage, IndexedDB, memory, server)
- Automatic cleanup with retention policies
- Data compression and encryption support
- Recovery point management

```typescript
const backupService = new BackupService({
  maxBackups: 10,
  compressionEnabled: true,
  storageTypes: ['localStorage', 'indexedDB']
});
```

#### OfflineService
Handles offline operation queuing:
- Operation prioritization and dependency resolution
- Persistent queue across sessions
- Automatic sync when connection restored
- Conflict detection for queued operations

```typescript
const offlineService = getOfflineService({
  maxQueueSize: 100,
  compressionEnabled: true,
  syncBatchSize: 10
});
```

#### ErrorHandler
Comprehensive error management:
- Error classification and categorization
- Intelligent retry strategies
- Circuit breaker patterns
- User-friendly error messages

```typescript
const errorHandler = new ErrorHandler({
  enableLogging: true,
  enableReporting: true,
  maxErrorHistory: 100
});
```

#### ValidationService
Data validation and integrity:
- Structure validation
- Business rule enforcement
- Performance constraint checking
- Security validation

```typescript
const validationService = new ValidationService({
  strictMode: false,
  maxFileSize: 50 * 1024 * 1024,
  performanceChecks: true
});
```

### Redux Integration

#### AutoSaveSlice
Manages auto-save state in Redux:
- Configuration management
- Operation tracking
- Conflict management
- UI state coordination

```typescript
// Key selectors
const status = useAppSelector(selectAutoSaveStatus);
const conflicts = useAppSelector(selectActiveConflicts);
const statistics = useAppSelector(selectSaveStatistics);
```

#### AutoSaveMiddleware
Redux middleware that:
- Monitors drawing changes
- Triggers auto-save operations
- Handles immediate save requests
- Coordinates with other middleware

```typescript
// Middleware configuration
const middleware = createAutoSaveMiddleware({
  debounceDelay: 3000,
  throttleDelay: 1000,
  enabledInDevelopment: true
});
```

### UI Components

#### SaveStatusIndicator
Visual status indicator showing:
- Current save status (saving, saved, error, conflict)
- Progress for long operations
- Last save time
- Network status
- Quick actions for errors

```tsx
<SaveStatusIndicator
  position="bottom-right"
  showLastSaveTime={true}
  compact={false}
/>
```

#### AutoSaveNotifications
Notification system for:
- Save completion confirmations
- Error notifications with actions
- Offline/online status changes
- Conflict alerts

```tsx
<AutoSaveNotifications
  position="top-right"
  maxNotifications={5}
/>
```

#### ConflictResolutionDialog
Interactive conflict resolution:
- Side-by-side conflict comparison
- Multiple resolution strategies
- Visual diff highlighting
- Batch conflict resolution

```tsx
<ConflictResolutionDialog />
```

### Conflict Resolution

#### Three-way Merge Algorithm
1. **Change Detection**: Identify differences between base, local, and server versions
2. **Conflict Identification**: Find overlapping changes that cannot be auto-merged
3. **Resolution Options**: Present user with merge strategies
4. **Application**: Apply chosen resolution and create new merged version

#### Resolution Strategies
- **Use Local**: Keep your changes, discard server changes
- **Use Server**: Discard your changes, use server version
- **Auto Merge**: Merge non-conflicting changes automatically
- **Manual**: Resolve each conflict individually

#### Confidence Scoring
Auto-resolution confidence based on:
- Change proximity and overlap
- Historical conflict patterns
- Change complexity
- User preferences

### Error Handling

#### Error Categories
- **Network**: Connection issues, timeouts
- **Server**: Backend errors, service unavailable
- **Validation**: Data format, business rule violations
- **Conflict**: Version conflicts, concurrent edits
- **Quota**: Storage limits, size constraints
- **Permission**: Authorization failures
- **Corruption**: Data integrity issues

#### Retry Strategies
- **Exponential Backoff**: Increasing delays for network errors
- **Linear Backoff**: Fixed intervals for server errors
- **Immediate**: No delay for validation fixes
- **Circuit Breaker**: Stop retrying after consecutive failures

### Performance Optimization

#### Smart Debouncing
- Delay saves until user stops making changes
- Maximum interval to prevent data loss
- Different delays for different change types
- User activity detection

#### Incremental Saves
- Only send changed data to server
- Delta compression for large drawings
- Change tracking at element level
- Optimized serialization

#### Background Processing
- Non-blocking save operations
- Web Workers for complex calculations
- Streaming for large data sets
- Prioritized operation queues

## Configuration

### Auto-save Configuration
```typescript
interface AutoSaveConfig {
  enabled: boolean;                    // Enable/disable auto-save
  interval: number;                    // Maximum time between saves (ms)
  debounceDelay: number;              // Delay after last change (ms)
  maxRetries: number;                 // Maximum retry attempts
  retryDelay: number;                 // Base retry delay (ms)
  batchSize: number;                  // Max operations per batch
  compressionEnabled: boolean;         // Enable data compression
  incrementalSaves: boolean;          // Use incremental saves
  backupRetention: number;            // Number of backups to keep
  conflictResolutionTimeout: number;  // Time to resolve conflicts (ms)
  offlineQueueLimit: number;         // Max offline operations
}
```

### Network Monitor Configuration
```typescript
interface NetworkMonitorConfig {
  pingInterval: number;               // Connectivity check interval
  pingTimeout: number;                // Ping timeout
  qualityCheckInterval: number;       // Quality assessment interval
  reconnectAttempts: number;          // Max reconnection attempts
  reconnectDelay: number;             // Base reconnection delay
  slowConnectionThreshold: number;    // RTT threshold for warnings
}
```

## Usage

### Basic Setup
```tsx
import { AutoSaveProvider } from '@/components/AutoSaveProvider';

function App() {
  return (
    <AutoSaveProvider
      showIndicator={true}
      showNotifications={true}
      position="bottom-right"
      config={{
        enabled: true,
        interval: 30000,
        debounceDelay: 5000
      }}
    >
      <YourDrawingInterface />
    </AutoSaveProvider>
  );
}
```

### Using Auto-save Hooks
```tsx
import { useAutoSave, useAutoSaveStats } from '@/components/AutoSaveProvider';

function DrawingToolbar() {
  const { triggerSave, isOnline } = useAutoSave();
  const { successRate, averageSaveTime } = useAutoSaveStats();

  const handleManualSave = () => {
    triggerSave(currentDrawingId);
  };

  return (
    <div>
      <button onClick={handleManualSave}>Save (Ctrl+S)</button>
      <span>Success Rate: {successRate.toFixed(1)}%</span>
      <span>Avg Save Time: {averageSaveTime}ms</span>
    </div>
  );
}
```

### Custom Error Handling
```tsx
import { ErrorHandler } from '@/services/errorHandler';

const errorHandler = new ErrorHandler({
  enableUserNotifications: true,
  retryConfigs: {
    network: {
      strategy: 'exponential',
      maxAttempts: 5,
      baseDelay: 1000
    }
  }
});

errorHandler.on('error-occurred', (error) => {
  if (error.category === 'critical') {
    // Handle critical errors
    showCriticalErrorDialog(error);
  }
});
```

## Monitoring and Analytics

### Save Metrics
- Success/failure rates
- Average save times
- Data sizes and compression ratios
- Network performance
- Error frequency and types

### Performance Monitoring
- Operation queue lengths
- Memory usage
- Network utilization
- User interaction patterns

### Health Checks
- Service availability
- Data integrity verification
- Backup validation
- Network connectivity

## Best Practices

### For Developers
1. **Always validate** data before saving
2. **Use incremental saves** for large drawings
3. **Handle errors gracefully** with user feedback
4. **Test offline scenarios** thoroughly
5. **Monitor performance** metrics regularly

### For Users
1. **Save manually** for critical changes (Ctrl+S)
2. **Resolve conflicts** promptly when they appear
3. **Check network status** if saves are failing
4. **Report persistent** save issues

### For System Administrators
1. **Monitor save success** rates across users
2. **Set appropriate** retention policies
3. **Configure error** reporting and alerting
4. **Regular backup** validation

## Troubleshooting

### Common Issues

#### Save Operations Failing
1. Check network connectivity
2. Verify server status
3. Check browser storage quotas
4. Review error logs

#### Conflicts Not Resolving
1. Ensure conflict resolution is enabled
2. Check for user permissions
3. Verify data integrity
4. Clear browser cache if needed

#### Performance Issues
1. Enable compression
2. Use incremental saves
3. Reduce save frequency
4. Check for large data objects

#### Offline Mode Not Working
1. Verify offline service is enabled
2. Check browser storage
3. Ensure proper event listeners
4. Test network detection

### Debug Tools

#### Redux DevTools
Monitor auto-save actions and state changes:
```javascript
// View auto-save state
store.getState().autoSave

// Monitor save operations
store.getState().autoSave.activeOperations
```

#### Console Logging
Enable detailed logging:
```javascript
localStorage.setItem('autosave-debug', 'true');
```

#### Network Panel
Monitor save requests in browser dev tools to identify network issues.

## Security Considerations

### Data Protection
- All data encrypted in transit (HTTPS)
- Sensitive data sanitized before storage
- User permissions validated on every operation
- Audit trails for all save operations

### Access Control
- Role-based permissions for save operations
- Project-level access controls
- Session validation for all requests
- Rate limiting to prevent abuse

### Data Integrity
- Checksums for corruption detection
- Version tracking for change auditing
- Backup verification
- Rollback capabilities

## Future Enhancements

### Planned Features
- **Real-time Collaboration**: Live cursors and simultaneous editing
- **Advanced Merging**: AI-assisted conflict resolution
- **Cloud Sync**: Multi-device synchronization
- **Version Branching**: Git-like branching for drawings
- **Performance Analytics**: ML-based performance optimization

### Scalability Improvements
- **Distributed Caching**: Redis cluster for large deployments
- **Microservices**: Split auto-save into dedicated services
- **CDN Integration**: Global content delivery for assets
- **Edge Computing**: Regional save processing

## API Reference

### AutoSaveService Methods
```typescript
class AutoSaveService {
  scheduleAutoSave(): void
  performManualSave(drawingId: string): Promise<SaveOperation>
  performEmergencySave(drawingId: string): Promise<SaveOperation>
  cleanup(): void
}
```

### Redux Actions
```typescript
// Configuration
updateConfig(config: Partial<AutoSaveConfig>)
resetConfig()

// Operations
addOperation(operation: SaveOperation)
updateOperation(operation: SaveOperation)
removeOperation(operationId: string)

// Conflicts
addConflict(conflict: SaveConflict)
resolveConflict(resolution: ConflictResolution)

// UI
setSaveIndicatorVisible(visible: boolean)
addNotification(notification: AutoSaveNotification)
```

## Support

For issues or questions regarding the auto-save system:

1. Check this documentation first
2. Review browser console for errors
3. Test in incognito mode to rule out extensions
4. Contact the development team with detailed error logs

---

**Version**: 1.0.0
**Last Updated**: September 2024
**Maintainer**: Ergoplanner Development Team