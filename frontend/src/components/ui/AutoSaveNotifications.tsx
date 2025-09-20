/**
 * Auto-save Notifications Component
 * TASK-023: Auto-save Functionality
 *
 * Displays notifications for auto-save events, errors, conflicts,
 * and other system messages with actions and auto-dismiss.
 */

'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
  CloudArrowUpIcon,
  WifiIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  selectNotifications,
  removeNotification,
} from '@/store/slices/autoSaveSlice';
import type { AutoSaveNotification } from '@/types/autosave';

// Notification type icon mapping
const NOTIFICATION_ICONS = {
  info: InformationCircleIcon,
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  error: XCircleIcon,
} as const;

// Notification type color mapping
const NOTIFICATION_COLORS = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: 'text-blue-400',
    button: 'bg-blue-100 hover:bg-blue-200 text-blue-800',
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: 'text-green-400',
    button: 'bg-green-100 hover:bg-green-200 text-green-800',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    icon: 'text-yellow-400',
    button: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: 'text-red-400',
    button: 'bg-red-100 hover:bg-red-200 text-red-800',
  },
} as const;

interface AutoSaveNotificationsProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  maxNotifications?: number;
  className?: string;
}

export function AutoSaveNotifications({
  position = 'top-right',
  maxNotifications = 5,
  className = '',
}: AutoSaveNotificationsProps) {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);

  // Position classes
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  // Auto-dismiss notifications
  useEffect(() => {
    notifications.forEach((notification) => {
      if (notification.autoHide && notification.duration) {
        const timer = setTimeout(() => {
          dispatch(removeNotification(notification.id));
        }, notification.duration);

        return () => clearTimeout(timer);
      }
    });
  }, [notifications, dispatch]);

  // Handle notification dismiss
  const handleDismiss = (notificationId: string) => {
    dispatch(removeNotification(notificationId));
  };

  // Limit notifications displayed
  const visibleNotifications = notifications.slice(0, maxNotifications);

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div
      className={`
        fixed z-50 ${positionClasses[position]}
        flex flex-col space-y-2
        max-w-sm w-full
        ${className}
      `}
    >
      <AnimatePresence>
        {visibleNotifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={handleDismiss}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface NotificationItemProps {
  notification: AutoSaveNotification;
  onDismiss: (id: string) => void;
}

function NotificationItem({ notification, onDismiss }: NotificationItemProps) {
  const IconComponent = NOTIFICATION_ICONS[notification.type];
  const colors = NOTIFICATION_COLORS[notification.type];

  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // Handle action click
  const handleActionClick = (action: any) => {
    action.action();
    if (action.type === 'primary') {
      onDismiss(notification.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.9 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`
        ${colors.bg} ${colors.border}
        border rounded-lg shadow-lg
        p-4 relative
        max-w-sm w-full
      `}
    >
      {/* Header */}
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <IconComponent className={`w-5 h-5 ${colors.icon}`} />
        </div>

        <div className="ml-3 flex-1">
          <div className={`text-sm font-medium ${colors.text}`}>
            {notification.title}
          </div>

          {notification.message && (
            <div className={`text-sm mt-1 ${colors.text} opacity-80`}>
              {notification.message}
            </div>
          )}

          {/* Timestamp */}
          <div className={`text-xs mt-2 ${colors.text} opacity-60`}>
            {formatTime(notification.timestamp)}
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={() => onDismiss(notification.id)}
          className={`
            flex-shrink-0 ml-4
            ${colors.text} opacity-60 hover:opacity-100
            transition-opacity
          `}
          aria-label="Dismiss notification"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Actions */}
      {notification.actions && notification.actions.length > 0 && (
        <div className="mt-3 flex space-x-2">
          {notification.actions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              className={`
                px-3 py-1 rounded text-xs font-medium
                transition-colors
                ${action.type === 'primary' ? colors.button : `${colors.text} opacity-60 hover:opacity-100`}
              `}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Auto-hide progress bar */}
      {notification.autoHide && notification.duration && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: notification.duration / 1000, ease: 'linear' }}
            className={`h-full ${colors.icon.replace('text-', 'bg-')}`}
          />
        </div>
      )}
    </motion.div>
  );
}

/**
 * Specialized Save Status Notification
 *
 * A specific notification component for save-related messages
 */
interface SaveStatusNotificationProps {
  type: 'saving' | 'saved' | 'error' | 'conflict' | 'offline';
  message?: string;
  onRetry?: () => void;
  onResolveConflict?: () => void;
  className?: string;
}

export function SaveStatusNotification({
  type,
  message,
  onRetry,
  onResolveConflict,
  className = '',
}: SaveStatusNotificationProps) {
  const getNotificationConfig = () => {
    switch (type) {
      case 'saving':
        return {
          icon: ArrowPathIcon,
          title: 'Saving...',
          message: message || 'Your changes are being saved',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-400',
          animate: true,
        };

      case 'saved':
        return {
          icon: CheckCircleIcon,
          title: 'Saved',
          message: message || 'All changes have been saved',
          bgColor: 'bg-green-50',
          textColor: 'text-green-800',
          iconColor: 'text-green-400',
          animate: false,
        };

      case 'error':
        return {
          icon: XCircleIcon,
          title: 'Save Failed',
          message: message || 'Failed to save your changes',
          bgColor: 'bg-red-50',
          textColor: 'text-red-800',
          iconColor: 'text-red-400',
          animate: false,
        };

      case 'conflict':
        return {
          icon: ExclamationTriangleIcon,
          title: 'Conflict Detected',
          message: message || 'Your changes conflict with recent updates',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-400',
          animate: false,
        };

      case 'offline':
        return {
          icon: WifiIcon,
          title: 'Working Offline',
          message: message || 'Changes will be saved when connection is restored',
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-800',
          iconColor: 'text-orange-400',
          animate: false,
        };

      default:
        return {
          icon: InformationCircleIcon,
          title: 'Status Update',
          message: message || '',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-800',
          iconColor: 'text-gray-400',
          animate: false,
        };
    }
  };

  const config = getNotificationConfig();
  const IconComponent = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`
        ${config.bgColor} border border-gray-200 rounded-lg shadow-lg
        p-3 flex items-center space-x-3
        ${className}
      `}
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        {config.animate ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
          </motion.div>
        ) : (
          <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${config.textColor}`}>
          {config.title}
        </div>
        {config.message && (
          <div className={`text-sm ${config.textColor} opacity-80`}>
            {config.message}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex-shrink-0 flex space-x-2">
        {type === 'error' && onRetry && (
          <button
            onClick={onRetry}
            className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded transition-colors"
          >
            Retry
          </button>
        )}

        {type === 'conflict' && onResolveConflict && (
          <button
            onClick={onResolveConflict}
            className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 rounded transition-colors"
          >
            Resolve
          </button>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Toast-style notification for quick messages
 */
export function SaveToast({
  type,
  message,
  duration = 3000,
  onClose,
}: {
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
  onClose?: () => void;
}) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const config = {
    success: {
      icon: CheckCircleIcon,
      bgColor: 'bg-green-500',
      textColor: 'text-white',
    },
    error: {
      icon: XCircleIcon,
      bgColor: 'bg-red-500',
      textColor: 'text-white',
    },
    info: {
      icon: InformationCircleIcon,
      bgColor: 'bg-blue-500',
      textColor: 'text-white',
    },
  }[type];

  const IconComponent = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 50 }}
      className={`
        ${config.bgColor} ${config.textColor}
        rounded-lg shadow-lg p-3
        flex items-center space-x-2
        max-w-xs
      `}
    >
      <IconComponent className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm font-medium">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-2 opacity-70 hover:opacity-100"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}

export default AutoSaveNotifications;