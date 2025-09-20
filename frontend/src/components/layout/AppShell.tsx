'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectIsAuthenticated } from '@/store/slices/authSlice';
import { setScreenSize, setActiveNavItem } from '@/store/slices/uiSlice';
import Header from './Header';
import Sidebar from './Sidebar';
import ToastContainer from '@/components/ui/ToastContainer';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import ErrorBoundary from '@/components/ErrorBoundary';

interface AppShellProps {
  children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { sidebarOpen, isMobile } = useAppSelector((state) => state.ui);

  // Update screen size on resize
  useEffect(() => {
    const handleResize = () => {
      dispatch(setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      }));
    };

    // Initial size
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch]);

  // Update active nav item based on pathname
  useEffect(() => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const activeItem = pathSegments[0] || 'dashboard';
    dispatch(setActiveNavItem(activeItem));
  }, [pathname, dispatch]);

  // Don't render shell for auth pages
  const isAuthPage = pathname.startsWith('/auth');
  if (isAuthPage || !isAuthenticated) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {children}
          <ToastContainer />
          <LoadingOverlay />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <Header />

        <div className="flex">
          {/* Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <main
            className={`
              flex-1 transition-all duration-200 ease-in-out
              ${sidebarOpen && !isMobile ? 'ml-64' : 'ml-0'}
              pt-16
            `}
          >
            <div className="p-4 lg:p-6">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile overlay when sidebar is open */}
        {sidebarOpen && isMobile && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => dispatch(setActiveNavItem(null))}
          />
        )}

        {/* Toast notifications */}
        <ToastContainer />

        {/* Global loading overlay */}
        <LoadingOverlay />
      </div>
    </ErrorBoundary>
  );
};

export default AppShell;