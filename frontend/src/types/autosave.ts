/**
 * Auto-save Types and Interfaces
 * TASK-023: Auto-save Functionality
 */

// Save operation status
export type SaveStatus =
  | 'idle'
  | 'pending'
  | 'saving'
  | 'saved'
  | 'error'
  | 'conflict'
  | 'offline'
  | 'recovering';

// Save operation priority
export type SavePriority = 'low' | 'normal' | 'high' | 'critical';

// Save operation type
export type SaveOperationType =
  | 'auto'        // Automatic save
  | 'manual'      // User-triggered save
  | 'periodic'    // Scheduled save
  | 'emergency'   // Emergency save (before navigation, etc.)
  | 'recovery';   // Recovery save after conflict resolution

// Connection status
export type ConnectionStatus =
  | 'online'
  | 'offline'
  | 'connecting'
  | 'disconnected'
  | 'unstable';

// Save operation interface
export interface SaveOperation {
  id: string;
  drawingId: string;
  type: SaveOperationType;
  priority: SavePriority;
  timestamp: number;
  payload: SavePayload;
  retryCount: number;
  maxRetries: number;
  status: SaveStatus;
  error?: SaveError;
  estimatedSize?: number;
  checksum?: string;
}

// Save payload containing the data to be saved
export interface SavePayload {
  drawingData: any; // ReactFlow data
  metadata: SaveMetadata;
  incremental?: boolean;
  changes?: ChangeSet[];
}

// Save metadata
export interface SaveMetadata {
  version: number;
  userId: string;
  sessionId: string;
  timestamp: number;
  clientVersion: string;
  checksum: string;
  parentVersion?: number;
  mergeBase?: string;
}

// Change set for incremental saves
export interface ChangeSet {
  id: string;
  type: 'add' | 'update' | 'delete';
  target: 'node' | 'edge' | 'viewport' | 'metadata';
  targetId?: string;
  data: any;
  timestamp: number;
}

// Save error information
export interface SaveError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
  recoverable: boolean;
  suggested_action?: string;
}

// Save progress information
export interface SaveProgress {
  operationId: string;
  phase: 'validation' | 'preparation' | 'upload' | 'confirmation';
  progress: number; // 0-100
  message: string;
  estimatedTimeRemaining?: number;
}

// Conflict information
export interface SaveConflict {
  id: string;
  drawingId: string;
  type: 'version' | 'concurrent' | 'schema';
  localVersion: number;
  serverVersion: number;
  conflictingChanges: ConflictingChange[];
  resolutionOptions: ConflictResolutionOption[];
  timestamp: number;
  autoResolvable: boolean;
}

// Conflicting change information
export interface ConflictingChange {
  path: string;
  localValue: any;
  serverValue: any;
  baseValue?: any;
  changeType: 'add' | 'update' | 'delete' | 'move';
  confidence: number; // 0-1, for auto-resolution
}

// Conflict resolution options
export interface ConflictResolutionOption {
  id: string;
  type: 'local' | 'server' | 'merge' | 'custom';
  description: string;
  preview?: any;
  recommended: boolean;
}

// Backup information
export interface BackupInfo {
  id: string;
  drawingId: string;
  timestamp: number;
  type: 'auto' | 'manual' | 'recovery';
  size: number;
  checksum: string;
  metadata: SaveMetadata;
  retained: boolean;
  expiresAt?: number;
}

// Auto-save configuration
export interface AutoSaveConfig {
  enabled: boolean;
  interval: number; // milliseconds
  debounceDelay: number; // milliseconds
  maxRetries: number;
  retryDelay: number; // base delay for exponential backoff
  batchSize: number; // max operations per batch
  compressionEnabled: boolean;
  incrementalSaves: boolean;
  backupRetention: number; // number of backups to keep
  conflictResolutionTimeout: number; // milliseconds
  offlineQueueLimit: number; // max queued operations when offline
}

// Network status information
export interface NetworkStatus {
  online: boolean;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveOnline?: boolean;
  lastOnline?: number;
  reconnectAttempts: number;
}

// Auto-save state interface
export interface AutoSaveState {
  // Configuration
  config: AutoSaveConfig;

  // Current status
  status: SaveStatus;
  lastSaveTime?: number;
  nextSaveTime?: number;

  // Network status
  network: NetworkStatus;

  // Active operations
  activeOperations: Record<string, SaveOperation>;
  operationQueue: SaveOperation[];

  // Save history
  saveHistory: SaveOperation[];

  // Conflicts
  activeConflicts: Record<string, SaveConflict>;

  // Backups
  backups: Record<string, BackupInfo[]>; // keyed by drawingId

  // Progress tracking
  currentProgress?: SaveProgress;

  // Statistics
  statistics: AutoSaveStatistics;

  // UI state
  ui: AutoSaveUIState;
}

// Auto-save statistics
export interface AutoSaveStatistics {
  totalSaves: number;
  successfulSaves: number;
  failedSaves: number;
  averageSaveTime: number;
  totalDataSaved: number; // bytes
  conflictsResolved: number;
  autoConflictsResolved: number;
  lastResetTime: number;
}

// Auto-save UI state
export interface AutoSaveUIState {
  showSaveIndicator: boolean;
  showConflictDialog: boolean;
  showOfflineIndicator: boolean;
  saveIndicatorMessage?: string;
  saveIndicatorType?: 'info' | 'success' | 'warning' | 'error';
  conflictDialogData?: SaveConflict;
  notifications: AutoSaveNotification[];
}

// Auto-save notification
export interface AutoSaveNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  actions?: NotificationAction[];
  autoHide: boolean;
  duration?: number;
}

// Notification action
export interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary';
  action: () => void;
}

// Save validation result
export interface SaveValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  estimatedSize?: number;
  checksum?: string;
}

// Validation error
export interface ValidationError {
  code: string;
  message: string;
  path?: string;
  severity: 'error' | 'warning';
  recoverable: boolean;
}

// Validation warning
export interface ValidationWarning {
  code: string;
  message: string;
  path?: string;
  suggestion?: string;
}

// Save metrics for performance monitoring
export interface SaveMetrics {
  operationId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  dataSize: number;
  compressionRatio?: number;
  networkTime?: number;
  serverProcessingTime?: number;
  retries: number;
  success: boolean;
  error?: string;
}

// Recovery information
export interface RecoveryInfo {
  id: string;
  drawingId: string;
  timestamp: number;
  lostChanges: ChangeSet[];
  recoveredChanges: ChangeSet[];
  recoveryMethod: 'auto' | 'manual' | 'backup';
  success: boolean;
  notes?: string;
}

// Offline operation queue item
export interface OfflineOperation {
  id: string;
  type: 'save' | 'delete' | 'update';
  timestamp: number;
  payload: any;
  priority: SavePriority;
  retryCount: number;
  dependencies?: string[]; // operation IDs this depends on
}

// Three-way merge context
export interface MergeContext {
  baseVersion: any;
  localVersion: any;
  serverVersion: any;
  metadata: {
    baseTimestamp: number;
    localTimestamp: number;
    serverTimestamp: number;
    userIds: string[];
  };
}

// Merge result
export interface MergeResult {
  success: boolean;
  mergedData?: any;
  conflicts: ConflictingChange[];
  resolution: 'auto' | 'manual' | 'failed';
  strategy: 'local' | 'server' | 'merge';
  notes?: string;
}