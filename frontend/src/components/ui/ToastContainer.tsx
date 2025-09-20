'use client';

import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectToasts, removeToast } from '@/store/slices/uiSlice';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { Toast } from 'flowbite-react';
import type { ToastNotification } from '@/types';

const ToastContainer: React.FC = () => {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector(selectToasts);

  const getToastIcon = (type: ToastNotification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getToastColor = (type: ToastNotification['type']) => {
    switch (type) {
      case 'success':
        return 'green';
      case 'error':
        return 'red';
      case 'warning':
        return 'yellow';
      case 'info':
      default:
        return 'blue';
    }
  };

  const handleDismiss = (id: string) => {
    dispatch(removeToast(id));
  };

  // Auto-dismiss toasts
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    toasts.forEach((toast) => {
      if (toast.autoClose !== false) {
        const timeout = setTimeout(() => {
          dispatch(removeToast(toast.id));
        }, toast.duration || 5000);
        timeouts.push(timeout);
      }
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [toasts, dispatch]);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          className="relative animate-in slide-in-from-right duration-300"
        >
          <div className="flex items-start space-x-3">
            {/* Icon */}
            <div className="flex-shrink-0 pt-0.5">
              {getToastIcon(toast.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                {toast.title}
              </h4>
              {toast.message && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {toast.message}
                </p>
              )}
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={() => handleDismiss(toast.id)}
              className="flex-shrink-0 ml-auto p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-lg"
            >
              <span className="sr-only">Close</span>
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Progress bar for auto-dismiss */}
          {toast.autoClose !== false && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-b-lg overflow-hidden">
              <div
                className={`h-full bg-${getToastColor(toast.type)}-500 animate-progress`}
                style={{
                  animation: `progress ${toast.duration || 5000}ms linear`,
                }}
              />
            </div>
          )}
        </Toast>
      ))}

      <style jsx>{`
        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        .animate-progress {
          animation: progress var(--duration) linear;
        }
      `}</style>
    </div>
  );
};

export default ToastContainer;