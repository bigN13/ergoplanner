/**
 * Save Status Indicator Component
 * TASK-023: Auto-save Functionality
 *
 * Displays the current save status with progress indicators,
 * error states, and user feedback for the auto-save system.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CloudArrowUpIcon,
  WifiIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  selectAutoSaveStatus,
  selectUIState,
  selectCurrentProgress,
  selectNetworkStatus,
  setSaveIndicatorVisible,
  removeNotification,
} from '@/store/slices/autoSaveSlice';
import type { SaveStatus } from '@/types/autosave';

// Status icon mapping
const STATUS_ICONS = {
  idle: CloudArrowUpIcon,
  pending: ArrowPathIcon,
  saving: ArrowPathIcon,
  saved: CheckCircleIcon,
  error: XCircleIcon,
  conflict: ExclamationTriangleIcon,
  offline: WifiIcon,
  recovering: ArrowPathIcon,
} as const;

// Status color mapping
const STATUS_COLORS = {
  idle: 'text-gray-400',
  pending: 'text-blue-500',
  saving: 'text-blue-500',
  saved: 'text-green-500',
  error: 'text-red-500',
  conflict: 'text-yellow-500',
  offline: 'text-orange-500',
  recovering: 'text-purple-500',
} as const;

// Status background colors
const STATUS_BACKGROUNDS = {
  idle: 'bg-gray-50',
  pending: 'bg-blue-50',
  saving: 'bg-blue-50',
  saved: 'bg-green-50',
  error: 'bg-red-50',
  conflict: 'bg-yellow-50',
  offline: 'bg-orange-50',
  recovering: 'bg-purple-50',
} as const;

interface SaveStatusIndicatorProps {
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  compact?: boolean;
  showLastSaveTime?: boolean;
}

export function SaveStatusIndicator({
  className = '',
  position = 'bottom-right',
  compact = false,
  showLastSaveTime = true,
}: SaveStatusIndicatorProps) {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectAutoSaveStatus);
  const uiState = useAppSelector(selectUIState);
  const progress = useAppSelector(selectCurrentProgress);
  const networkStatus = useAppSelector(selectNetworkStatus);

  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Update last save time when status changes to saved
  useEffect(() => {
    if (status === 'saved') {
      setLastSaveTime(new Date());
    }
  }, [status]);

  // Auto-hide indicator after successful save
  useEffect(() => {
    if (status === 'saved' && !isHovered) {
      const timer = setTimeout(() => {
        dispatch(setSaveIndicatorVisible(false));
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [status, isHovered, dispatch]);

  // Get the appropriate icon component
  const IconComponent = STATUS_ICONS[status];
  const statusColor = STATUS_COLORS[status];
  const statusBackground = STATUS_BACKGROUNDS[status];

  // Position classes
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  // Don't show if indicator is hidden and status is idle
  if (!uiState.showSaveIndicator && status === 'idle') {
    return null;
  }

  // Format last save time
  const formatLastSaveTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffSecs < 60) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else {
      return date.toLocaleTimeString();
    }
  };

  // Get status message
  const getStatusMessage = () => {
    if (uiState.saveIndicatorMessage) {
      return uiState.saveIndicatorMessage;
    }

    if (progress) {
      return progress.message;
    }

    switch (status) {
      case 'idle':
        return 'All changes saved';
      case 'pending':
        return 'Changes pending...';
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'Saved';
      case 'error':
        return 'Save failed';
      case 'conflict':
        return 'Conflict detected';
      case 'offline':
        return 'Offline';
      case 'recovering':
        return 'Recovering...';
      default:
        return '';
    }
  };

  return (
    <AnimatePresence>
      {(uiState.showSaveIndicator || status !== 'idle') && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.2 }}
          className={`
            fixed z-50 ${positionClasses[position]}
            ${className}
          `}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            className={`
              ${statusBackground} ${compact ? 'p-2' : 'p-3'}
              rounded-lg shadow-lg border border-gray-200
              flex items-center space-x-2
              min-w-[120px] max-w-[300px]
              transition-all duration-200
              ${isHovered ? 'shadow-xl scale-105' : ''}
            `}
          >
            {/* Status Icon */}
            <div className="flex-shrink-0">
              {status === 'saving' || status === 'pending' ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <IconComponent className={`w-5 h-5 ${statusColor}`} />
                </motion.div>
              ) : (
                <IconComponent className={`w-5 h-5 ${statusColor}`} />
              )}
            </div>

            {/* Status Content */}
            {!compact && (
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${statusColor}`}>
                  {getStatusMessage()}
                </div>

                {/* Progress Bar */}
                {progress && (
                  <div className="mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress.progress}%` }}
                        transition={{ duration: 0.3 }}
                        className="bg-blue-500 h-1 rounded-full"
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {progress.progress}%
                      {progress.estimatedTimeRemaining && (
                        <span className="ml-1">
                          (~{Math.ceil(progress.estimatedTimeRemaining / 1000)}s)
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Last Save Time */}
                {showLastSaveTime && lastSaveTime && status === 'saved' && (
                  <div className="text-xs text-gray-500 mt-1">
                    {formatLastSaveTime(lastSaveTime)}
                  </div>
                )}

                {/* Network Status */}
                {!networkStatus.online && (
                  <div className="text-xs text-orange-600 mt-1 flex items-center">
                    <WifiIcon className="w-3 h-3 mr-1" />
                    Offline
                  </div>
                )}
              </div>
            )}

            {/* Close Button (for persistent states) */}
            {(status === 'error' || status === 'conflict') && !compact && (
              <button
                onClick={() => dispatch(setSaveIndicatorVisible(false))}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Dismiss"
              >
                <XCircleIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Extended Information Tooltip */}
          {isHovered && status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full mt-2 left-0 right-0 bg-red-50 border border-red-200 rounded-lg p-3 shadow-lg"
            >
              <div className="text-sm text-red-800">
                <div className="font-medium">Save Error</div>
                <div className="mt-1">{uiState.saveIndicatorMessage}</div>
                <div className="mt-2 flex space-x-2">
                  <button
                    className="text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded"
                    onClick={() => {
                      // Trigger retry
                      // This would be handled by the auto-save service
                    }}
                  >
                    Retry
                  </button>
                  <button
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                    onClick={() => dispatch(setSaveIndicatorVisible(false))}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Network Quality Indicator */}
          {networkStatus.online && networkStatus.rtt && (
            <div className="absolute -top-1 -right-1">
              <div
                className={`
                  w-2 h-2 rounded-full
                  ${networkStatus.rtt < 100 ? 'bg-green-400' :
                    networkStatus.rtt < 300 ? 'bg-yellow-400' : 'bg-red-400'}
                `}
                title={`Network RTT: ${networkStatus.rtt}ms`}
              />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Compact Save Status Badge
 *
 * A minimal indicator for use in toolbars or headers
 */
export function SaveStatusBadge({ className = '' }: { className?: string }) {
  const status = useAppSelector(selectAutoSaveStatus);
  const uiState = useAppSelector(selectUIState);

  const IconComponent = STATUS_ICONS[status];
  const statusColor = STATUS_COLORS[status];

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {status === 'saving' ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <IconComponent className={`w-4 h-4 ${statusColor}`} />
        </motion.div>
      ) : (
        <IconComponent className={`w-4 h-4 ${statusColor}`} />
      )}

      {uiState.saveIndicatorMessage && (
        <span className={`text-xs ${statusColor}`}>
          {uiState.saveIndicatorMessage}
        </span>
      )}
    </div>
  );
}

export default SaveStatusIndicator;