/**
 * Real-time Collaboration Middleware with Optimistic Updates
 * TASK-022: Redux State for Drawings
 */

import { createListenerMiddleware, isAnyOf, nanoid } from '@reduxjs/toolkit';
import { throttle, debounce } from 'lodash-es';
import type { RootState } from '@/store';
import type {
  OptimisticUpdate,
  StateConflict,
  CollaboratorCursor,
  CollaboratorSelection,
  ElementLock,
  DrawingAction,
  ConflictResolution,
} from '@/types/drawing-state';
import {
  addOptimisticUpdate,
  confirmOptimisticUpdate,
  rejectOptimisticUpdate,
  addStateConflict,
  resolveStateConflict,
  updateCollaboratorCursor,
  removeCollaboratorCursor,
  updateCollaboratorSelection,
  removeCollaboratorSelection,
  lockElement,
  unlockElement,
  clearExpiredLocks,
  setSyncStatus,
  addSyncError,
  updatePerformanceMetrics,
} from '@/store/slices/enhancedDrawingSlice';

// SignalR connection interface
interface SignalRConnection {
  connectionId: string;
  state: 'Connected' | 'Disconnected' | 'Connecting' | 'Reconnecting';
  invoke: (methodName: string, ...args: any[]) => Promise<any>;
  on: (methodName: string, callback: (...args: any[]) => void) => void;
  off: (methodName: string, callback?: (...args: any[]) => void) => void;
}

// Collaboration event types
interface CollaborationEvent {
  type: string;
  userId: string;
  userName: string;
  drawingId: string;
  timestamp: number;
  data: any;
}

interface OptimisticActionResult {
  success: boolean;
  conflictDetected?: boolean;
  serverState?: any;
  errorMessage?: string;
}

// Collaboration manager class
class CollaborationManager {
  private connection: SignalRConnection | null = null;
  private currentUserId: string | null = null;
  private currentUserName: string | null = null;
  private currentDrawingId: string | null = null;
  private dispatch: any = null;
  private getState: any = null;

  // Optimistic update tracking
  private pendingUpdates = new Map<string, OptimisticUpdate>();
  private updateTimeouts = new Map<string, NodeJS.Timeout>();

  // Conflict resolution
  private conflictQueue: StateConflict[] = [];
  private resolutionStrategies = {
    'concurrent_edit': 'merge',
    'version_mismatch': 'server_wins',
    'deleted_element': 'server_wins',
    'invalid_state': 'client_wins',
  } as const;

  // Performance tracking
  private collaborationMetrics = {
    optimisticUpdatesCount: 0,
    conflictsDetected: 0,
    conflictsResolved: 0,
    averageLatency: 0,
    lastActivityTime: 0,
  };

  constructor() {
    this.setupPerformanceTracking();
  }

  // Initialize collaboration
  initialize = (
    connection: SignalRConnection,
    userId: string,
    userName: string,
    dispatch: any,
    getState: any
  ) => {
    this.connection = connection;
    this.currentUserId = userId;
    this.currentUserName = userName;
    this.dispatch = dispatch;
    this.getState = getState;

    this.setupEventHandlers();
    this.startHeartbeat();
  };

  // Set current drawing for collaboration
  setDrawing = async (drawingId: string) => {
    if (this.currentDrawingId === drawingId) return;

    // Leave previous drawing
    if (this.currentDrawingId && this.connection) {
      await this.leaveDrawing(this.currentDrawingId);
    }

    this.currentDrawingId = drawingId;

    // Join new drawing
    if (drawingId && this.connection) {
      await this.joinDrawing(drawingId);
    }
  };

  // Join drawing collaboration session
  private joinDrawing = async (drawingId: string) => {
    if (!this.connection || !this.currentUserId) return;

    try {
      await this.connection.invoke('JoinDrawing', {
        drawingId,
        userId: this.currentUserId,
        userName: this.currentUserName,
      });

      this.dispatch(setSyncStatus({
        connectionStatus: 'connected',
        lastSync: Date.now(),
      }));

      console.log(`Joined drawing collaboration: ${drawingId}`);
    } catch (error) {
      console.error('Failed to join drawing:', error);
      this.dispatch(addSyncError({
        id: nanoid(),
        type: 'network',
        message: `Failed to join drawing: ${error}`,
        action: {} as DrawingAction,
        timestamp: Date.now(),
        retryCount: 0,
        isRetryable: true,
      }));
    }
  };

  // Leave drawing collaboration session
  private leaveDrawing = async (drawingId: string) => {
    if (!this.connection || !this.currentUserId) return;

    try {
      await this.connection.invoke('LeaveDrawing', {
        drawingId,
        userId: this.currentUserId,
      });

      // Clear local collaboration state
      this.dispatch(removeCollaboratorCursor(this.currentUserId));
      this.dispatch(removeCollaboratorSelection(this.currentUserId));

      console.log(`Left drawing collaboration: ${drawingId}`);
    } catch (error) {
      console.error('Failed to leave drawing:', error);
    }
  };

  // Setup SignalR event handlers
  private setupEventHandlers = () => {
    if (!this.connection) return;

    // User joined/left events
    this.connection.on('UserJoined', this.handleUserJoined);
    this.connection.on('UserLeft', this.handleUserLeft);

    // Real-time updates
    this.connection.on('DrawingUpdated', this.handleDrawingUpdate);
    this.connection.on('CursorMoved', this.handleCursorMove);
    this.connection.on('SelectionChanged', this.handleSelectionChange);
    this.connection.on('ElementLocked', this.handleElementLock);
    this.connection.on('ElementUnlocked', this.handleElementUnlock);

    // Optimistic update results
    this.connection.on('OptimisticUpdateResult', this.handleOptimisticUpdateResult);

    // Conflict detection
    this.connection.on('ConflictDetected', this.handleConflictDetected);
    this.connection.on('ConflictResolved', this.handleConflictResolved);

    // Connection state changes
    this.connection.on('ConnectionStateChanged', this.handleConnectionStateChange);
  };

  // Event handlers
  private handleUserJoined = (data: { userId: string; userName: string; drawingId: string }) => {
    if (data.userId === this.currentUserId) return;

    console.log(`User joined: ${data.userName}`);
    // User cursor will be updated when they move
  };

  private handleUserLeft = (data: { userId: string; drawingId: string }) => {
    if (data.userId === this.currentUserId) return;

    this.dispatch(removeCollaboratorCursor(data.userId));
    this.dispatch(removeCollaboratorSelection(data.userId));
    console.log(`User left: ${data.userId}`);
  };

  private handleDrawingUpdate = (data: {
    userId: string;
    action: DrawingAction;
    timestamp: number;
  }) => {
    if (data.userId === this.currentUserId) return;

    // Apply remote update to local state
    this.applyRemoteUpdate(data.action);
  };

  private handleCursorMove = (data: {
    userId: string;
    userName: string;
    position: { x: number; y: number };
    timestamp: number;
  }) => {
    if (data.userId === this.currentUserId) return;

    const cursor: CollaboratorCursor = {
      userId: data.userId,
      userName: data.userName,
      position: data.position,
      color: this.getUserColor(data.userId),
      timestamp: data.timestamp,
      isActive: true,
    };

    this.dispatch(updateCollaboratorCursor(cursor));
  };

  private handleSelectionChange = (data: {
    userId: string;
    userName: string;
    selectedNodes: string[];
    selectedEdges: string[];
    timestamp: number;
  }) => {
    if (data.userId === this.currentUserId) return;

    const selection: CollaboratorSelection = {
      userId: data.userId,
      userName: data.userName,
      selectedNodes: data.selectedNodes,
      selectedEdges: data.selectedEdges,
      color: this.getUserColor(data.userId),
      timestamp: data.timestamp,
    };

    this.dispatch(updateCollaboratorSelection(selection));
  };

  private handleElementLock = (data: {
    elementId: string;
    elementType: 'node' | 'edge' | 'component';
    userId: string;
    userName: string;
    lockType: 'soft' | 'hard';
    expiresAt: number;
  }) => {
    if (data.userId === this.currentUserId) return;

    const lock: ElementLock = {
      elementId: data.elementId,
      elementType: data.elementType,
      userId: data.userId,
      userName: data.userName,
      timestamp: Date.now(),
      expiresAt: data.expiresAt,
      lockType: data.lockType,
    };

    this.dispatch(lockElement(lock));
  };

  private handleElementUnlock = (data: {
    elementId: string;
    userId: string;
  }) => {
    this.dispatch(unlockElement({
      elementId: data.elementId,
      userId: data.userId,
    }));
  };

  private handleOptimisticUpdateResult = (data: {
    updateId: string;
    result: OptimisticActionResult;
  }) => {
    const update = this.pendingUpdates.get(data.updateId);
    if (!update) return;

    const timeout = this.updateTimeouts.get(data.updateId);
    if (timeout) {
      clearTimeout(timeout);
      this.updateTimeouts.delete(data.updateId);
    }

    if (data.result.success) {
      this.dispatch(confirmOptimisticUpdate(data.updateId));
      this.collaborationMetrics.optimisticUpdatesCount++;
    } else {
      this.dispatch(rejectOptimisticUpdate({
        id: data.updateId,
        reason: data.result.errorMessage,
      }));

      if (data.result.conflictDetected && data.result.serverState) {
        this.handleRemoteConflict(update, data.result.serverState);
      }
    }

    this.pendingUpdates.delete(data.updateId);
  };

  private handleConflictDetected = (data: {
    conflictId: string;
    type: string;
    localAction: DrawingAction;
    remoteAction: DrawingAction;
    affectedElements: string[];
  }) => {
    const conflict: StateConflict = {
      id: data.conflictId,
      type: data.type as any,
      description: `Conflict detected: ${data.type}`,
      localAction: data.localAction,
      remoteAction: data.remoteAction,
      timestamp: Date.now(),
      affectedElements: data.affectedElements,
    };

    this.dispatch(addStateConflict(conflict));
    this.collaborationMetrics.conflictsDetected++;

    // Auto-resolve based on strategy
    this.autoResolveConflict(conflict);
  };

  private handleConflictResolved = (data: {
    conflictId: string;
    resolution: ConflictResolution;
  }) => {
    this.dispatch(resolveStateConflict({
      conflictId: data.conflictId,
      resolution: data.resolution.strategy,
      resolvedData: data.resolution.resolvedAction.payload,
    }));

    this.collaborationMetrics.conflictsResolved++;
  };

  private handleConnectionStateChange = (state: string) => {
    const connectionStatus = state === 'Connected' ? 'connected' :
                           state === 'Disconnected' ? 'disconnected' : 'reconnecting';

    this.dispatch(setSyncStatus({ connectionStatus }));

    if (state === 'Connected' && this.currentDrawingId) {
      // Rejoin drawing after reconnection
      this.joinDrawing(this.currentDrawingId);
    }
  };

  // Apply optimistic update
  applyOptimisticUpdate = async (action: DrawingAction): Promise<string> => {
    if (!this.connection || !this.currentDrawingId) {
      throw new Error('Not connected to collaboration session');
    }

    const updateId = nanoid();
    const optimisticUpdate: OptimisticUpdate = {
      id: updateId,
      action,
      timestamp: Date.now(),
      userId: this.currentUserId!,
      status: 'pending',
      originalState: this.getState().enhancedDrawing,
      conflictResolution: 'client-wins',
    };

    // Store pending update
    this.pendingUpdates.set(updateId, optimisticUpdate);

    // Apply optimistic update locally
    this.dispatch(addOptimisticUpdate(optimisticUpdate));

    // Set timeout for update confirmation
    const timeout = setTimeout(() => {
      this.dispatch(rejectOptimisticUpdate({
        id: updateId,
        reason: 'Timeout waiting for server confirmation',
      }));
      this.pendingUpdates.delete(updateId);
    }, 10000); // 10 second timeout

    this.updateTimeouts.set(updateId, timeout);

    try {
      // Send to server
      await this.connection.invoke('ApplyDrawingUpdate', {
        updateId,
        drawingId: this.currentDrawingId,
        action,
        userId: this.currentUserId,
      });

      return updateId;
    } catch (error) {
      // Remove optimistic update on send failure
      clearTimeout(timeout);
      this.updateTimeouts.delete(updateId);
      this.pendingUpdates.delete(updateId);

      this.dispatch(rejectOptimisticUpdate({
        id: updateId,
        reason: `Failed to send update: ${error}`,
      }));

      throw error;
    }
  };

  // Apply remote update
  private applyRemoteUpdate = (action: DrawingAction) => {
    // Check for conflicts with pending optimistic updates
    const conflictingUpdate = Array.from(this.pendingUpdates.values())
      .find(update => this.detectConflict(update.action, action));

    if (conflictingUpdate) {
      this.handleRemoteConflict(conflictingUpdate, action);
    } else {
      // Apply remote update directly
      this.dispatch({
        type: action.type,
        payload: action.payload,
      });
    }
  };

  // Detect conflict between actions
  private detectConflict = (localAction: DrawingAction, remoteAction: DrawingAction): boolean => {
    // Same element modified
    if (localAction.metadata?.nodeIds && remoteAction.metadata?.nodeIds) {
      const localNodes = new Set(localAction.metadata.nodeIds);
      const remoteNodes = new Set(remoteAction.metadata.nodeIds);
      const intersection = new Set([...localNodes].filter(x => remoteNodes.has(x)));
      return intersection.size > 0;
    }

    // Viewport changes are not conflicting
    if (localAction.type.includes('viewport') || remoteAction.type.includes('viewport')) {
      return false;
    }

    // Time-based conflict detection (actions within 1 second)
    return Math.abs(localAction.timestamp - remoteAction.timestamp) < 1000;
  };

  // Handle remote conflict
  private handleRemoteConflict = (localUpdate: OptimisticUpdate, remoteAction: DrawingAction) => {
    const conflict: StateConflict = {
      id: nanoid(),
      type: 'concurrent_edit',
      description: 'Concurrent edit detected',
      localAction: localUpdate.action,
      remoteAction,
      timestamp: Date.now(),
      affectedElements: [
        ...(localUpdate.action.metadata?.nodeIds || []),
        ...(remoteAction.metadata?.nodeIds || []),
      ],
    };

    this.dispatch(addStateConflict(conflict));
    this.autoResolveConflict(conflict);
  };

  // Auto-resolve conflict based on strategy
  private autoResolveConflict = (conflict: StateConflict) => {
    const strategy = this.resolutionStrategies[conflict.type] || 'manual';

    if (strategy !== 'manual') {
      setTimeout(() => {
        this.dispatch(resolveStateConflict({
          conflictId: conflict.id,
          resolution: strategy === 'merge' ? 'merge' :
                     strategy === 'server_wins' ? 'use_remote' : 'use_local',
        }));
      }, 100); // Small delay to allow UI to show conflict
    }
  };

  // Send cursor position
  sendCursorPosition = debounce(async (position: { x: number; y: number }) => {
    if (!this.connection || !this.currentDrawingId) return;

    try {
      await this.connection.invoke('UpdateCursor', {
        drawingId: this.currentDrawingId,
        position,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.warn('Failed to send cursor position:', error);
    }
  }, 100);

  // Send selection change
  sendSelectionChange = debounce(async (selection: {
    selectedNodes: string[];
    selectedEdges: string[];
  }) => {
    if (!this.connection || !this.currentDrawingId) return;

    try {
      await this.connection.invoke('UpdateSelection', {
        drawingId: this.currentDrawingId,
        selectedNodes: selection.selectedNodes,
        selectedEdges: selection.selectedEdges,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.warn('Failed to send selection change:', error);
    }
  }, 200);

  // Lock element
  lockElementForEdit = async (elementId: string, elementType: 'node' | 'edge' | 'component') => {
    if (!this.connection || !this.currentDrawingId) return;

    try {
      await this.connection.invoke('LockElement', {
        drawingId: this.currentDrawingId,
        elementId,
        elementType,
        lockType: 'soft',
        duration: 300000, // 5 minutes
      });
    } catch (error) {
      console.warn('Failed to lock element:', error);
    }
  };

  // Unlock element
  unlockElementAfterEdit = async (elementId: string) => {
    if (!this.connection || !this.currentDrawingId) return;

    try {
      await this.connection.invoke('UnlockElement', {
        drawingId: this.currentDrawingId,
        elementId,
      });
    } catch (error) {
      console.warn('Failed to unlock element:', error);
    }
  };

  // Utility functions
  private getUserColor = (userId: string): string => {
    // Generate consistent color for user
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    ];
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  private startHeartbeat = () => {
    setInterval(() => {
      this.dispatch(clearExpiredLocks());
      this.updatePerformanceMetrics();
    }, 30000); // Every 30 seconds
  };

  private setupPerformanceTracking = () => {
    setInterval(() => {
      this.collaborationMetrics.lastActivityTime = Date.now();
    }, 1000);
  };

  private updatePerformanceMetrics = () => {
    this.dispatch(updatePerformanceMetrics({
      lastUpdateDuration: this.collaborationMetrics.averageLatency,
    }));
  };

  // Cleanup
  cleanup = () => {
    if (this.currentDrawingId) {
      this.leaveDrawing(this.currentDrawingId);
    }

    // Clear all timeouts
    this.updateTimeouts.forEach(timeout => clearTimeout(timeout));
    this.updateTimeouts.clear();
    this.pendingUpdates.clear();

    // Remove event handlers
    if (this.connection) {
      this.connection.off('UserJoined', this.handleUserJoined);
      this.connection.off('UserLeft', this.handleUserLeft);
      this.connection.off('DrawingUpdated', this.handleDrawingUpdate);
      this.connection.off('CursorMoved', this.handleCursorMove);
      this.connection.off('SelectionChanged', this.handleSelectionChange);
      this.connection.off('ElementLocked', this.handleElementLock);
      this.connection.off('ElementUnlocked', this.handleElementUnlock);
      this.connection.off('OptimisticUpdateResult', this.handleOptimisticUpdateResult);
      this.connection.off('ConflictDetected', this.handleConflictDetected);
      this.connection.off('ConflictResolved', this.handleConflictResolved);
      this.connection.off('ConnectionStateChanged', this.handleConnectionStateChange);
    }
  };
}

// Create collaboration manager instance
export const collaborationManager = new CollaborationManager();

// Create listener middleware for collaboration
export const collaborationMiddleware = createListenerMiddleware();

// Listen for drawing state changes and send optimistic updates
collaborationMiddleware.startListening({
  predicate: (action) => {
    return action.type.startsWith('enhancedDrawing/updateReactFlowDataWithHistory') ||
           action.type.startsWith('enhancedDrawing/updateNodes') ||
           action.type.startsWith('enhancedDrawing/updateEdges');
  },
  effect: async (action, listenerApi) => {
    try {
      const drawingAction: DrawingAction = {
        id: nanoid(),
        type: action.type,
        payload: action.payload,
        timestamp: Date.now(),
        description: `Remote: ${action.type}`,
      };

      await collaborationManager.applyOptimisticUpdate(drawingAction);
    } catch (error) {
      console.warn('Failed to apply optimistic update:', error);
    }
  },
});

// Listen for cursor movements
collaborationMiddleware.startListening({
  actionCreator: updateCollaboratorCursor,
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    const authState = state.auth;

    if (action.payload.userId === authState.user?.id) {
      // This is our own cursor movement, send to others
      collaborationManager.sendCursorPosition(action.payload.position);
    }
  },
});

// Listen for selection changes
collaborationMiddleware.startListening({
  predicate: (action) => {
    return action.type.startsWith('enhancedDrawing/setSelection') ||
           action.type.startsWith('enhancedDrawing/addToSelection') ||
           action.type.startsWith('enhancedDrawing/removeFromSelection');
  },
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    const selection = state.enhancedDrawing?.selection || state.drawing?.selection;

    if (selection) {
      collaborationManager.sendSelectionChange({
        selectedNodes: selection.nodes,
        selectedEdges: selection.edges,
      });
    }
  },
});

export { CollaborationManager };
export default collaborationMiddleware;