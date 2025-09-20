/**
 * TypeScript interfaces for SignalR real-time communication
 * Generated for Ergoplanner AI Suite - TASK-011
 */

// ============================================================================
// Core SignalR Types
// ============================================================================

export interface SignalRConnection {
  connectionId: string;
  userId: string;
  hubName: string;
  drawingId?: string;
  projectId?: string;
  connectedAt: Date;
  lastActivity: Date;
  isActive: boolean;
  metadata: Record<string, any>;
}

export interface SignalRConnectionOptions {
  automaticReconnect?: boolean;
  accessTokenFactory?: () => string | Promise<string>;
  withCredentials?: boolean;
}

// ============================================================================
// Drawing Collaboration Types
// ============================================================================

export interface CursorPosition {
  userId: string;
  userName: string;
  userColor?: string;
  userAvatar?: string;
  x: number;
  y: number;
  timestamp: Date;
  viewportId?: string;
}

export interface DrawingUpdate {
  drawingId: string;
  userId: string;
  userName: string;
  updateType: DrawingUpdateType;
  updateData: Record<string, any>;
  timestamp: Date;
  affectedComponentId?: string;
  metadata: Record<string, any>;
}

export type DrawingUpdateType =
  | 'component_added'
  | 'component_updated'
  | 'component_deleted'
  | 'component_moved'
  | 'component_resized'
  | 'component_rotated'
  | 'connection_added'
  | 'connection_updated'
  | 'connection_deleted'
  | 'drawing_saved'
  | 'drawing_exported'
  | 'layer_added'
  | 'layer_deleted'
  | 'layer_visibility_changed'
  | 'viewport_changed'
  | 'zoom_changed'
  | 'selection_changed';

export interface ComponentLock {
  drawingId: string;
  componentId: string;
  userId: string;
  userName: string;
  timestamp: Date;
  lockType?: 'editing' | 'viewing';
}

export interface UserSelection {
  drawingId: string;
  userId: string;
  userName: string;
  selectedComponents: string[];
  timestamp: Date;
}

// ============================================================================
// User Presence Types
// ============================================================================

export interface UserPresence {
  userId: string;
  userName: string;
  displayName: string;
  avatarUrl?: string;
  status: UserPresenceStatus;
  lastSeen: Date;
  currentDrawingId?: string;
  currentProjectId?: string;
  metadata: Record<string, any>;
}

export type UserPresenceStatus = 'online' | 'away' | 'busy' | 'offline';

export interface ActiveUser extends UserPresence {
  isCurrentUser: boolean;
  cursorPosition?: CursorPosition;
  selectedComponents?: string[];
}

// ============================================================================
// Notification Types
// ============================================================================

export interface Notification {
  id: string;
  userId?: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
  isRead: boolean;
  actionUrl?: string;
  actionText?: string;
}

export type NotificationType = 'info' | 'warning' | 'error' | 'success' | 'system';

export interface NotificationSettings {
  enableDrawingUpdates: boolean;
  enableWorkflowUpdates: boolean;
  enableSystemAnnouncements: boolean;
  enableUserPresence: boolean;
  soundEnabled: boolean;
  desktopNotifications: boolean;
}

// ============================================================================
// Workflow Types
// ============================================================================

export interface WorkflowUpdate {
  workflowId: string;
  drawingId: string;
  workflowType: string;
  status: WorkflowStatus;
  updateType: WorkflowUpdateType;
  actorUserId?: string;
  actorUserName?: string;
  comments?: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export type WorkflowStatus =
  | 'draft'
  | 'pending_check'
  | 'pending_review'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'on_hold'
  | 'cancelled';

export type WorkflowUpdateType =
  | 'stage_completed'
  | 'approval_required'
  | 'approved'
  | 'rejected'
  | 'escalated'
  | 'comment_added'
  | 'deadline_extended'
  | 'assignee_changed';

export interface ApprovalAction {
  workflowId: string;
  action: ApprovalActionType;
  userId: string;
  userName: string;
  comments?: string;
  timestamp: Date;
}

export type ApprovalActionType = 'approve' | 'reject' | 'request_changes' | 'escalate';

export interface PendingApproval {
  workflowId: string;
  drawingId: string;
  drawingName: string;
  requiredAction: string;
  submittedBy: string;
  submittedAt: Date;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  deadline?: Date;
}

// ============================================================================
// Hub Interface Definitions
// ============================================================================

export interface DrawingHubMethods {
  // Client-to-server methods
  JoinDrawing: (drawingId: string, projectId?: string) => Promise<void>;
  LeaveDrawing: (drawingId: string) => Promise<void>;
  SendDrawingUpdate: (drawingId: string, updateData: any, updateType: string) => Promise<void>;
  UpdateCursorPosition: (drawingId: string, x: number, y: number, viewportId?: string) => Promise<void>;
  RequestComponentLock: (drawingId: string, componentId: string) => Promise<void>;
  ReleaseComponentLock: (drawingId: string, componentId: string) => Promise<void>;
  UpdateUserSelection: (drawingId: string, selectedComponentIds: string[]) => Promise<void>;
}

export interface DrawingHubEvents {
  // Server-to-client events
  DrawingJoinSuccess: (drawingId: string) => void;
  DrawingJoinFailed: (message: string) => void;
  DrawingUpdate: (update: DrawingUpdate) => void;
  CursorUpdate: (cursorPosition: CursorPosition) => void;
  UserJoined: (userPresence: UserPresence) => void;
  UserLeft: (userPresence: UserPresence) => void;
  ActiveUsers: (users: UserPresence[]) => void;
  ComponentLockRequested: (lockData: ComponentLock) => void;
  ComponentLockGranted: (lockData: ComponentLock) => void;
  ComponentLockReleased: (lockData: ComponentLock) => void;
  UserSelectionUpdate: (selectionData: UserSelection) => void;
  SystemAnnouncement: (notification: Notification) => void;
}

export interface NotificationHubMethods {
  // Client-to-server methods
  JoinUserNotifications: () => Promise<void>;
  JoinOrganizationNotifications: (organizationId: string) => Promise<void>;
  MarkNotificationAsRead: (notificationId: string) => Promise<void>;
  MarkAllNotificationsAsRead: () => Promise<void>;
  GetNotificationCount: () => Promise<void>;
  DismissNotification: (notificationId: string) => Promise<void>;
}

export interface NotificationHubEvents {
  // Server-to-client events
  NotificationGroupJoined: (userId: string) => void;
  NotificationGroupJoinFailed: (message: string) => void;
  OrganizationNotificationGroupJoined: (organizationId: string) => void;
  OrganizationNotificationGroupJoinFailed: (message: string) => void;
  NotificationReceived: (notification: Notification) => void;
  NotificationMarkedAsRead: (notificationId: string) => void;
  AllNotificationsMarkedAsRead: () => void;
  NotificationCount: (count: number) => void;
  NotificationDismissed: (notificationId: string) => void;
  UserPresenceUpdate: (userPresence: UserPresence) => void;
  SystemAnnouncement: (notification: Notification) => void;
}

export interface WorkflowHubMethods {
  // Client-to-server methods
  JoinWorkflow: (workflowId: string) => Promise<void>;
  LeaveWorkflow: (workflowId: string) => Promise<void>;
  JoinProjectWorkflows: (projectId: string) => Promise<void>;
  SubmitApprovalAction: (workflowId: string, action: string, comments?: string) => Promise<void>;
  RequestWorkflowStatus: (workflowId: string) => Promise<void>;
  EscalateWorkflow: (workflowId: string, reason: string) => Promise<void>;
  AddWorkflowComment: (workflowId: string, comment: string, parentCommentId?: string) => Promise<void>;
  GetPendingApprovals: () => Promise<void>;
}

export interface WorkflowHubEvents {
  // Server-to-client events
  WorkflowJoined: (workflowId: string) => void;
  WorkflowJoinFailed: (message: string) => void;
  WorkflowLeft: (workflowId: string) => void;
  ProjectWorkflowsJoined: (projectId: string) => void;
  ProjectWorkflowsJoinFailed: (message: string) => void;
  ApprovalActionSubmitted: (actionData: ApprovalAction) => void;
  ApprovalActionSuccess: (actionData: ApprovalAction) => void;
  ApprovalActionFailed: (message: string) => void;
  WorkflowStatus: (status: any) => void;
  WorkflowUpdate: (update: WorkflowUpdate) => void;
  WorkflowEscalated: (escalationData: any) => void;
  WorkflowEscalationSuccess: (escalationData: any) => void;
  WorkflowEscalationFailed: (message: string) => void;
  WorkflowCommentAdded: (commentData: any) => void;
  WorkflowCommentSuccess: (commentData: any) => void;
  WorkflowCommentFailed: (message: string) => void;
  PendingApprovals: (approvals: PendingApproval[]) => void;
  UserPresenceUpdate: (userPresence: UserPresence) => void;
  SystemAnnouncement: (notification: Notification) => void;
}

// ============================================================================
// SignalR Client Configuration
// ============================================================================

export interface SignalRClientConfig {
  baseUrl: string;
  accessTokenFactory: () => string | Promise<string>;
  automaticReconnect: boolean;
  enableLogging: boolean;
  connectionTimeout: number;
  retryDelays: number[];
}

export interface SignalRClientState {
  isConnected: boolean;
  connectionState: 'Disconnected' | 'Connecting' | 'Connected' | 'Disconnecting' | 'Reconnecting';
  lastError?: string;
  reconnectAttempts: number;
  hubConnections: {
    drawing?: any;
    notification?: any;
    workflow?: any;
  };
}

// ============================================================================
// Error Types
// ============================================================================

export interface SignalRError {
  type: 'connection' | 'authentication' | 'rate_limit' | 'validation' | 'server';
  message: string;
  details?: any;
  timestamp: Date;
}

export interface RateLimitError extends SignalRError {
  type: 'rate_limit';
  retryAfter: number;
  requestsRemaining: number;
}

// ============================================================================
// Utility Types
// ============================================================================

export type SignalREventHandler<T = any> = (data: T) => void;

export interface SignalREventSubscription {
  unsubscribe: () => void;
}

export type HubMethodName<T> = keyof T;
export type HubEventName<T> = keyof T;

// ============================================================================
// React Hook Types (for future use)
// ============================================================================

export interface UseSignalROptions {
  autoConnect?: boolean;
  reconnectOnMount?: boolean;
  dependencies?: any[];
}

export interface UseSignalRReturn {
  isConnected: boolean;
  connectionState: string;
  error: SignalRError | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  reconnect: () => Promise<void>;
}

export interface UseDrawingCollaborationOptions extends UseSignalROptions {
  drawingId: string;
  projectId?: string;
  enableCursorTracking?: boolean;
  enablePresenceDisplay?: boolean;
}

export interface UseDrawingCollaborationReturn extends UseSignalRReturn {
  activeUsers: ActiveUser[];
  joinDrawing: (drawingId: string, projectId?: string) => Promise<void>;
  leaveDrawing: (drawingId: string) => Promise<void>;
  sendUpdate: (updateType: DrawingUpdateType, updateData: any) => Promise<void>;
  updateCursor: (x: number, y: number) => Promise<void>;
  requestLock: (componentId: string) => Promise<void>;
  releaseLock: (componentId: string) => Promise<void>;
  updateSelection: (componentIds: string[]) => Promise<void>;
}