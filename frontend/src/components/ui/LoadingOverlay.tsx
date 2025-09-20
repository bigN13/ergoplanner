'use client';

import React from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectIsLoading } from '@/store/slices/uiSlice';
import { Spinner } from 'flowbite-react';

const LoadingOverlay: React.FC = () => {
  const { globalLoading, pageLoading, loadingMessage } = useAppSelector((state) => state.ui);
  const isLoading = globalLoading || pageLoading;

  if (!isLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
        <div className="flex flex-col items-center space-y-4">
          <Spinner size="xl" />

          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {globalLoading ? 'Processing...' : 'Loading...'}
            </h3>

            {loadingMessage && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {loadingMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;