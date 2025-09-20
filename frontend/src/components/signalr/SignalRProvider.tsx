/**
 * SignalR Provider Component for Ergoplanner AI Suite
 * Provides SignalR connection management and real-time communication
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import * as signalR from '@microsoft/signalr';
import {
  SignalRClientState,
  SignalRError,
  DrawingHubMethods,
  DrawingHubEvents,
  NotificationHubMethods,
  NotificationHubEvents,
  WorkflowHubMethods,
  WorkflowHubEvents,
  DrawingUpdate,
  CursorPosition,
  UserPresence,
  Notification,
  WorkflowUpdate
} from '../../types/signalr';

interface SignalRContextType {
  // Connection state
  state: SignalRClientState;

  // Connection management
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  reconnect: () => Promise<void>;

  // Drawing Hub methods
  joinDrawing: (drawingId: string, projectId?: string) => Promise<void>;
  leaveDrawing: (drawingId: string) => Promise<void>;
  sendDrawingUpdate: (drawingId: string, updateData: any, updateType: string) => Promise<void>;
  updateCursorPosition: (drawingId: string, x: number, y: number, viewportId?: string) => Promise<void>;
  requestComponentLock: (drawingId: string, componentId: string) => Promise<void>;
  releaseComponentLock: (drawingId: string, componentId: string) => Promise<void>;
  updateUserSelection: (drawingId: string, selectedComponentIds: string[]) => Promise<void>;

  // Notification Hub methods
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  dismissNotification: (notificationId: string) => Promise<void>;

  // Workflow Hub methods
  joinWorkflow: (workflowId: string) => Promise<void>;
  leaveWorkflow: (workflowId: string) => Promise<void>;
  submitApprovalAction: (workflowId: string, action: string, comments?: string) => Promise<void>;
  escalateWorkflow: (workflowId: string, reason: string) => Promise<void>;
  addWorkflowComment: (workflowId: string, comment: string, parentCommentId?: string) => Promise<void>;

  // Event subscriptions
  onDrawingUpdate: (callback: (update: DrawingUpdate) => void) => () => void;
  onCursorUpdate: (callback: (cursor: CursorPosition) => void) => () => void;
  onUserPresenceUpdate: (callback: (presence: UserPresence) => void) => () => void;
  onNotificationReceived: (callback: (notification: Notification) => void) => () => void;
  onWorkflowUpdate: (callback: (update: WorkflowUpdate) => void) => () => void;
  onSystemAnnouncement: (callback: (announcement: Notification) => void) => () => void;
}

const SignalRContext = createContext<SignalRContextType | null>(null);

interface SignalRProviderProps {
  children: ReactNode;
  baseUrl: string;
  accessTokenFactory: () => string | Promise<string>;
  autoConnect?: boolean;
}

export const SignalRProvider: React.FC<SignalRProviderProps> = ({
  children,
  baseUrl,
  accessTokenFactory,
  autoConnect = true
}) => {
  const [state, setState] = useState<SignalRClientState>({
    isConnected: false,
    connectionState: 'Disconnected',
    reconnectAttempts: 0,
    hubConnections: {}
  });

  const [connections, setConnections] = useState<{
    drawing?: signalR.HubConnection;
    notification?: signalR.HubConnection;
    workflow?: signalR.HubConnection;
  }>({});

  // Create hub connections
  const createConnections = useCallback(() => {
    const commonOptions: signalR.IHttpConnectionOptions = {
      accessTokenFactory,
      withCredentials: false,
      skipNegotiation: false,
      transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents,
    };

    const drawingConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${baseUrl}/hubs/drawing`, commonOptions)
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    const notificationConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${baseUrl}/hubs/notification`, commonOptions)
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    const workflowConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${baseUrl}/hubs/workflow`, commonOptions)
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Setup connection state handlers
    [drawingConnection, notificationConnection, workflowConnection].forEach(connection => {
      connection.onclose((error) => {
        setState(prev => ({
          ...prev,
          isConnected: false,
          connectionState: 'Disconnected',
          lastError: error?.message
        }));
      });

      connection.onreconnecting((error) => {
        setState(prev => ({
          ...prev,
          connectionState: 'Reconnecting',
          lastError: error?.message
        }));
      });

      connection.onreconnected(() => {
        setState(prev => ({
          ...prev,
          isConnected: true,
          connectionState: 'Connected',
          reconnectAttempts: 0,
          lastError: undefined
        }));
      });
    });

    return {
      drawing: drawingConnection,
      notification: notificationConnection,
      workflow: workflowConnection
    };
  }, [baseUrl, accessTokenFactory]);

  // Connect to all hubs
  const connect = useCallback(async () => {
    try {
      const newConnections = createConnections();

      setState(prev => ({ ...prev, connectionState: 'Connecting' }));

      await Promise.all([
        newConnections.drawing?.start(),
        newConnections.notification?.start(),
        newConnections.workflow?.start()
      ]);

      setConnections(newConnections);
      setState(prev => ({
        ...prev,
        isConnected: true,
        connectionState: 'Connected',
        hubConnections: newConnections,
        lastError: undefined
      }));

      // Auto-join user notifications
      await newConnections.notification?.invoke('JoinUserNotifications');

    } catch (error) {
      setState(prev => ({
        ...prev,
        isConnected: false,
        connectionState: 'Disconnected',
        lastError: error instanceof Error ? error.message : 'Connection failed'
      }));
      throw error;
    }
  }, [createConnections]);

  // Disconnect from all hubs
  const disconnect = useCallback(async () => {
    setState(prev => ({ ...prev, connectionState: 'Disconnecting' }));

    await Promise.all([
      connections.drawing?.stop(),
      connections.notification?.stop(),
      connections.workflow?.stop()
    ]);

    setConnections({});
    setState(prev => ({
      ...prev,
      isConnected: false,
      connectionState: 'Disconnected',
      hubConnections: {}
    }));
  }, [connections]);

  // Reconnect to all hubs
  const reconnect = useCallback(async () => {
    await disconnect();
    await connect();
  }, [disconnect, connect]);

  // Drawing Hub Methods
  const joinDrawing = useCallback(async (drawingId: string, projectId?: string) => {
    await connections.drawing?.invoke('JoinDrawing', drawingId, projectId);
  }, [connections.drawing]);

  const leaveDrawing = useCallback(async (drawingId: string) => {
    await connections.drawing?.invoke('LeaveDrawing', drawingId);
  }, [connections.drawing]);

  const sendDrawingUpdate = useCallback(async (drawingId: string, updateData: any, updateType: string) => {
    await connections.drawing?.invoke('SendDrawingUpdate', drawingId, updateData, updateType);
  }, [connections.drawing]);

  const updateCursorPosition = useCallback(async (drawingId: string, x: number, y: number, viewportId?: string) => {
    await connections.drawing?.invoke('UpdateCursorPosition', drawingId, x, y, viewportId);
  }, [connections.drawing]);

  const requestComponentLock = useCallback(async (drawingId: string, componentId: string) => {
    await connections.drawing?.invoke('RequestComponentLock', drawingId, componentId);
  }, [connections.drawing]);

  const releaseComponentLock = useCallback(async (drawingId: string, componentId: string) => {
    await connections.drawing?.invoke('ReleaseComponentLock', drawingId, componentId);
  }, [connections.drawing]);

  const updateUserSelection = useCallback(async (drawingId: string, selectedComponentIds: string[]) => {
    await connections.drawing?.invoke('UpdateUserSelection', drawingId, selectedComponentIds);
  }, [connections.drawing]);

  // Notification Hub Methods
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    await connections.notification?.invoke('MarkNotificationAsRead', notificationId);
  }, [connections.notification]);

  const markAllNotificationsAsRead = useCallback(async () => {
    await connections.notification?.invoke('MarkAllNotificationsAsRead');
  }, [connections.notification]);

  const dismissNotification = useCallback(async (notificationId: string) => {
    await connections.notification?.invoke('DismissNotification', notificationId);
  }, [connections.notification]);

  // Workflow Hub Methods
  const joinWorkflow = useCallback(async (workflowId: string) => {
    await connections.workflow?.invoke('JoinWorkflow', workflowId);
  }, [connections.workflow]);

  const leaveWorkflow = useCallback(async (workflowId: string) => {
    await connections.workflow?.invoke('LeaveWorkflow', workflowId);
  }, [connections.workflow]);

  const submitApprovalAction = useCallback(async (workflowId: string, action: string, comments?: string) => {
    await connections.workflow?.invoke('SubmitApprovalAction', workflowId, action, comments);
  }, [connections.workflow]);

  const escalateWorkflow = useCallback(async (workflowId: string, reason: string) => {
    await connections.workflow?.invoke('EscalateWorkflow', workflowId, reason);
  }, [connections.workflow]);

  const addWorkflowComment = useCallback(async (workflowId: string, comment: string, parentCommentId?: string) => {
    await connections.workflow?.invoke('AddWorkflowComment', workflowId, comment, parentCommentId);
  }, [connections.workflow]);

  // Event subscription helpers
  const onDrawingUpdate = useCallback((callback: (update: DrawingUpdate) => void) => {
    connections.drawing?.on('DrawingUpdate', callback);
    return () => connections.drawing?.off('DrawingUpdate', callback);
  }, [connections.drawing]);

  const onCursorUpdate = useCallback((callback: (cursor: CursorPosition) => void) => {
    connections.drawing?.on('CursorUpdate', callback);
    return () => connections.drawing?.off('CursorUpdate', callback);
  }, [connections.drawing]);

  const onUserPresenceUpdate = useCallback((callback: (presence: UserPresence) => void) => {
    connections.drawing?.on('UserPresenceUpdate', callback);
    connections.notification?.on('UserPresenceUpdate', callback);
    connections.workflow?.on('UserPresenceUpdate', callback);
    return () => {
      connections.drawing?.off('UserPresenceUpdate', callback);
      connections.notification?.off('UserPresenceUpdate', callback);
      connections.workflow?.off('UserPresenceUpdate', callback);
    };
  }, [connections]);

  const onNotificationReceived = useCallback((callback: (notification: Notification) => void) => {
    connections.notification?.on('NotificationReceived', callback);
    return () => connections.notification?.off('NotificationReceived', callback);
  }, [connections.notification]);

  const onWorkflowUpdate = useCallback((callback: (update: WorkflowUpdate) => void) => {
    connections.workflow?.on('WorkflowUpdate', callback);
    return () => connections.workflow?.off('WorkflowUpdate', callback);
  }, [connections.workflow]);

  const onSystemAnnouncement = useCallback((callback: (announcement: Notification) => void) => {
    connections.drawing?.on('SystemAnnouncement', callback);
    connections.notification?.on('SystemAnnouncement', callback);
    connections.workflow?.on('SystemAnnouncement', callback);
    return () => {
      connections.drawing?.off('SystemAnnouncement', callback);
      connections.notification?.off('SystemAnnouncement', callback);
      connections.workflow?.off('SystemAnnouncement', callback);
    };
  }, [connections]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect().catch(console.error);
    }

    return () => {
      disconnect().catch(console.error);
    };
  }, [autoConnect, connect, disconnect]);

  const contextValue: SignalRContextType = {
    state,
    connect,
    disconnect,
    reconnect,
    joinDrawing,
    leaveDrawing,
    sendDrawingUpdate,
    updateCursorPosition,
    requestComponentLock,
    releaseComponentLock,
    updateUserSelection,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    dismissNotification,
    joinWorkflow,
    leaveWorkflow,
    submitApprovalAction,
    escalateWorkflow,
    addWorkflowComment,
    onDrawingUpdate,
    onCursorUpdate,
    onUserPresenceUpdate,
    onNotificationReceived,
    onWorkflowUpdate,
    onSystemAnnouncement
  };

  return (
    <SignalRContext.Provider value={contextValue}>
      {children}
    </SignalRContext.Provider>
  );
};

export const useSignalR = (): SignalRContextType => {
  const context = useContext(SignalRContext);
  if (!context) {
    throw new Error('useSignalR must be used within a SignalRProvider');
  }
  return context;
};