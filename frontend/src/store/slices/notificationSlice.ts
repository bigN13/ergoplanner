import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// Notification types
interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  timestamp: string;
  read: boolean;
  persistent?: boolean;
  actionUrl?: string;
  actionLabel?: string;
  relatedEntityId?: string;
  relatedEntityType?: 'project' | 'drawing' | 'workflow' | 'user';
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  preferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    workflowNotifications: boolean;
    collaborationNotifications: boolean;
    systemNotifications: boolean;
  };
}

// Initial state
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  preferences: {
    emailNotifications: true,
    pushNotifications: true,
    workflowNotifications: true,
    collaborationNotifications: true,
    systemNotifications: true,
  },
};

// Notification slice
const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    // Notification management
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp' | 'read'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        read: false,
      };

      state.notifications.unshift(notification);
      state.unreadCount += 1;

      // Limit to 100 notifications
      if (state.notifications.length > 100) {
        const removed = state.notifications.pop();
        if (removed && !removed.read) {
          state.unreadCount -= 1;
        }
      }
    },

    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter(n => !n.read).length;
    },

    markAsRead: (state, action: PayloadAction<string>) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount -= 1;
      }
    },

    markAllAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
      state.unreadCount = 0;
    },

    markAsUnread: (state, action: PayloadAction<string>) => {
      const notificationId = action.payload;
      const notification = state.notifications.find(n => n.id === notificationId);
      if (notification && notification.read) {
        notification.read = false;
        state.unreadCount += 1;
      }
    },

    removeNotification: (state, action: PayloadAction<string>) => {
      const notificationId = action.payload;
      const notificationIndex = state.notifications.findIndex(n => n.id === notificationId);
      if (notificationIndex >= 0) {
        const notification = state.notifications[notificationIndex];
        if (!notification.read) {
          state.unreadCount -= 1;
        }
        state.notifications.splice(notificationIndex, 1);
      }
    },

    clearAllNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },

    clearReadNotifications: (state) => {
      state.notifications = state.notifications.filter(n => !n.read);
    },

    // Bulk operations
    markMultipleAsRead: (state, action: PayloadAction<string[]>) => {
      const ids = action.payload;
      ids.forEach(id => {
        const notification = state.notifications.find(n => n.id === id);
        if (notification && !notification.read) {
          notification.read = true;
          state.unreadCount -= 1;
        }
      });
    },

    removeMultiple: (state, action: PayloadAction<string[]>) => {
      const ids = action.payload;
      ids.forEach(id => {
        const notificationIndex = state.notifications.findIndex(n => n.id === id);
        if (notificationIndex >= 0) {
          const notification = state.notifications[notificationIndex];
          if (!notification.read) {
            state.unreadCount -= 1;
          }
          state.notifications.splice(notificationIndex, 1);
        }
      });
    },

    // Preferences
    updatePreferences: (state, action: PayloadAction<Partial<NotificationState['preferences']>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },

    // Real-time updates
    updateNotificationFromSignalR: (state, action: PayloadAction<{
      type: 'workflow_status' | 'drawing_shared' | 'comment_added' | 'approval_request';
      data: any;
    }>) => {
      const { type, data } = action.payload;

      let notification: Omit<Notification, 'id' | 'timestamp' | 'read'>;

      switch (type) {
        case 'workflow_status':
          notification = {
            type: data.status === 'approved' ? 'success' : data.status === 'rejected' ? 'error' : 'info',
            title: `Workflow ${data.status}`,
            message: `Drawing "${data.drawingName}" has been ${data.status}`,
            relatedEntityId: data.drawingId,
            relatedEntityType: 'drawing',
            actionUrl: `/drawings/${data.drawingId}`,
            actionLabel: 'View Drawing',
          };
          break;

        case 'drawing_shared':
          notification = {
            type: 'info',
            title: 'Drawing Shared',
            message: `${data.sharedBy} shared "${data.drawingName}" with you`,
            relatedEntityId: data.drawingId,
            relatedEntityType: 'drawing',
            actionUrl: `/drawings/${data.drawingId}`,
            actionLabel: 'View Drawing',
          };
          break;

        case 'comment_added':
          notification = {
            type: 'info',
            title: 'New Comment',
            message: `${data.commentedBy} added a comment to "${data.drawingName}"`,
            relatedEntityId: data.drawingId,
            relatedEntityType: 'drawing',
            actionUrl: `/drawings/${data.drawingId}#comment-${data.commentId}`,
            actionLabel: 'View Comment',
          };
          break;

        case 'approval_request':
          notification = {
            type: 'warning',
            title: 'Approval Required',
            message: `"${data.drawingName}" is pending your approval`,
            relatedEntityId: data.workflowId,
            relatedEntityType: 'workflow',
            actionUrl: `/workflows/${data.workflowId}`,
            actionLabel: 'Review',
            persistent: true,
          };
          break;

        default:
          return;
      }

      // Add the notification
      notificationSlice.caseReducers.addNotification(state, { payload: notification, type: '' });
    },
  },
});

// Export actions
export const {
  // Loading
  setLoading,
  setError,

  // Notification management
  addNotification,
  setNotifications,
  markAsRead,
  markAllAsRead,
  markAsUnread,
  removeNotification,
  clearAllNotifications,
  clearReadNotifications,

  // Bulk operations
  markMultipleAsRead,
  removeMultiple,

  // Preferences
  updatePreferences,

  // Real-time
  updateNotificationFromSignalR,
} = notificationSlice.actions;

// Selectors
export const selectNotifications = (state: { notifications: NotificationState }) => state.notifications.notifications;
export const selectUnreadCount = (state: { notifications: NotificationState }) => state.notifications.unreadCount;
export const selectNotificationsLoading = (state: { notifications: NotificationState }) => state.notifications.isLoading;
export const selectNotificationsError = (state: { notifications: NotificationState }) => state.notifications.error;
export const selectNotificationPreferences = (state: { notifications: NotificationState }) => state.notifications.preferences;

export const selectUnreadNotifications = (state: { notifications: NotificationState }) =>
  state.notifications.notifications.filter(n => !n.read);

export const selectNotificationsByType = (type: Notification['type']) =>
  (state: { notifications: NotificationState }) =>
    state.notifications.notifications.filter(n => n.type === type);

export const selectRecentNotifications = (limit: number = 5) =>
  (state: { notifications: NotificationState }) =>
    state.notifications.notifications.slice(0, limit);

// Export reducer
export default notificationSlice.reducer;