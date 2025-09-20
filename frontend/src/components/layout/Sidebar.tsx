'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectUser, selectIsAuthenticated } from '@/store/slices/authSlice';
import { selectSidebar, setSidebarOpen } from '@/store/slices/uiSlice';
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  Shapes,
  GitBranch,
  Settings,
  Users,
  BarChart3,
  X,
} from 'lucide-react';
import { Sidebar as FlowbiteSidebar } from 'flowbite-react';
import { routes } from '@/config';
import { UserRole } from '@/types';

// Navigation items configuration
const navigationItems = [
  {
    label: 'Dashboard',
    href: routes.dashboard,
    icon: LayoutDashboard,
    roles: ['Admin', 'ProjectManager', 'Approver', 'Reviewer', 'Checker', 'Author', 'Viewer'],
  },
  {
    label: 'Projects',
    href: routes.projects,
    icon: FolderOpen,
    roles: ['Admin', 'ProjectManager', 'Approver', 'Reviewer', 'Checker', 'Author', 'Viewer'],
  },
  {
    label: 'Drawings',
    href: routes.drawings,
    icon: FileText,
    roles: ['Admin', 'ProjectManager', 'Approver', 'Reviewer', 'Checker', 'Author', 'Viewer'],
  },
  {
    label: 'Symbols',
    href: routes.symbols,
    icon: Shapes,
    roles: ['Admin', 'ProjectManager', 'Approver', 'Reviewer', 'Checker', 'Author'],
  },
  {
    label: 'Workflows',
    href: routes.workflows,
    icon: GitBranch,
    roles: ['Admin', 'ProjectManager', 'Approver', 'Reviewer', 'Checker'],
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    roles: ['Admin', 'ProjectManager'],
  },
  {
    label: 'Team',
    href: '/team',
    icon: Users,
    roles: ['Admin', 'ProjectManager'],
  },
  {
    label: 'Admin',
    href: routes.admin,
    icon: Settings,
    roles: ['Admin'],
  },
];

const Sidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { isOpen: sidebarOpen, isCollapsed } = useAppSelector(selectSidebar);
  const { isMobile } = useAppSelector((state) => state.ui);

  const handleNavigate = (href: string) => {
    router.push(href);

    // Close sidebar on mobile after navigation
    if (isMobile) {
      dispatch(setSidebarOpen(false));
    }
  };

  const handleCloseSidebar = () => {
    dispatch(setSidebarOpen(false));
  };

  // Filter navigation items based on user role
  const visibleItems = navigationItems.filter(item => {
    if (!user || !isAuthenticated) return false;
    return item.roles.includes(user.role);
  });

  const isActive = (href: string) => {
    if (href === routes.dashboard) {
      return pathname === routes.dashboard;
    }
    return pathname.startsWith(href);
  };

  if (!isAuthenticated || !sidebarOpen) {
    return null;
  }

  return (
    <>
      {/* Sidebar */}
      <div
        className={`
          fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isCollapsed ? 'w-16' : 'w-64'}
          ${isMobile ? 'shadow-lg' : ''}
        `}
      >
        {/* Mobile close button */}
        {isMobile && (
          <div className="flex justify-end p-2">
            <button
              onClick={handleCloseSidebar}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Navigation */}
        <FlowbiteSidebar
          aria-label="Main navigation"
          className="h-full border-none"
        >
          <FlowbiteSidebar.Items>
            <FlowbiteSidebar.ItemGroup>
              {visibleItems.map((item) => {
                const IconComponent = item.icon;
                const active = isActive(item.href);

                return (
                  <FlowbiteSidebar.Item
                    key={item.href}
                    onClick={() => handleNavigate(item.href)}
                    className={`
                      cursor-pointer transition-colors duration-150
                      ${active
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    <div className="flex items-center">
                      <IconComponent
                        className={`h-5 w-5 ${isCollapsed ? 'mx-auto' : 'mr-3'} ${
                          active ? 'text-blue-700 dark:text-blue-400' : ''
                        }`}
                      />
                      {!isCollapsed && (
                        <span className="font-medium">{item.label}</span>
                      )}
                    </div>
                  </FlowbiteSidebar.Item>
                );
              })}
            </FlowbiteSidebar.ItemGroup>
          </FlowbiteSidebar.Items>

          {/* User info at bottom */}
          {!isCollapsed && user && (
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {user.role.toLowerCase().replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </FlowbiteSidebar>
      </div>
    </>
  );
};

export default Sidebar;