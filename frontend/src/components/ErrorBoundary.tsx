'use client';

import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react';
import { Button } from 'flowbite-react';

// Error fallback component
interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  const handleReportError = () => {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: window.navigator.userAgent,
      url: window.location.href,
    };

    const mailtoLink = `mailto:support@ergoplanner.com?subject=Frontend Error Report&body=${encodeURIComponent(
      `Error Report:\n\n${JSON.stringify(errorReport, null, 2)}`
    )}`;

    window.location.href = mailtoLink;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>

          <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Something went wrong
          </h1>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            We're sorry, but something unexpected happened. Please try one of the options below.
          </p>

          {/* Error details for development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-md p-3 mb-6 text-left">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400 mb-2">
                Error Details (Development)
              </h3>
              <p className="text-xs text-red-700 dark:text-red-300 font-mono break-all">
                {error.message}
              </p>
              {error.stack && (
                <details className="mt-2">
                  <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer">
                    Stack Trace
                  </summary>
                  <pre className="text-xs text-red-700 dark:text-red-300 mt-2 whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}

          <div className="space-y-3">
            {/* Retry Button */}
            <Button
              onClick={resetErrorBoundary}
              className="w-full"
              color="failure"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>

            {/* Reload Page Button */}
            <Button
              onClick={handleReload}
              className="w-full"
              color="gray"
              outline
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Page
            </Button>

            {/* Go to Dashboard Button */}
            <Button
              onClick={handleGoHome}
              className="w-full"
              color="blue"
              outline
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>

            {/* Report Error Button */}
            <Button
              onClick={handleReportError}
              className="w-full"
              color="gray"
              outline
            >
              <Mail className="h-4 w-4 mr-2" />
              Report This Error
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Error boundary props
interface ErrorBoundaryProps {
  children: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  fallback?: React.ComponentType<ErrorFallbackProps>;
}

// Main error boundary component
const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({
  children,
  onError,
  fallback: FallbackComponent = ErrorFallback,
}) => {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error);
      console.error('Error Info:', errorInfo);
    }

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Here you could also send the error to an error reporting service
    // e.g., Sentry, LogRocket, etc.
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={FallbackComponent}
      onError={handleError}
      onReset={() => {
        // You can add custom reset logic here
        // For example, clearing error-related state
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
};

export default ErrorBoundary;