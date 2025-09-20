'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectUser } from '@/store/slices/authSlice';
import { toggleSidebar, setTheme, selectTheme } from '@/store/slices/uiSlice';
import { selectUnreadCount } from '@/store/slices/notificationSlice';
import { useLogoutMutation } from '@/api/authApi';
import { clearAuth } from '@/store/slices/authSlice';
import { addToast } from '@/store/slices/uiSlice';
import {
  Menu,
  Bell,
  Search,
  Sun,
  Moon,
  User,
  Settings,
  LogOut,
  HelpCircle,
} from 'lucide-react';
import {
  Navbar,
  Button,
  Dropdown,
  TextInput,
  Badge,
  Avatar,
} from 'flowbite-react';
import { config } from '@/config';

const Header: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const theme = useAppSelector(selectTheme);
  const unreadCount = useAppSelector(selectUnreadCount);
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  const handleToggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    dispatch(setTheme(newTheme));

    // Apply theme to document
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      dispatch(clearAuth());
      dispatch(addToast({
        type: 'success',
        title: 'Logged out successfully',
        autoClose: true,
      }));
      router.push('/auth/login');
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        title: 'Logout failed',
        message: 'Please try again',
        autoClose: true,
      }));
    }
  };

  const handleNotificationsClick = () => {
    // TODO: Open notifications panel or navigate to notifications page
    router.push('/notifications');
  };

  const handleProfileClick = () => {
    router.push('/profile');
  };

  const handleSettingsClick = () => {
    router.push('/settings');
  };

  const handleHelpClick = () => {
    // TODO: Open help documentation or support
    window.open('https://docs.ergoplanner.com', '_blank');
  };

  return (
    <Navbar
      fluid
      rounded={false}
      className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
    >
      <div className="flex items-center">
        {/* Sidebar toggle */}
        <Button
          size="sm"
          color="gray"
          onClick={handleToggleSidebar}
          className="mr-3"
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Logo and brand */}
        <Navbar.Brand href="/dashboard">
          <img
            src={config.app.logo}
            className="mr-3 h-8"
            alt={`${config.app.name} Logo`}
          />
          <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
            {config.app.name}
          </span>
        </Navbar.Brand>
      </div>

      {/* Search bar */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <TextInput
            type="search"
            placeholder="Search projects, drawings..."
            className="pl-10"
            sizing="sm"
          />
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center space-x-2">
        {/* Theme toggle */}
        <Button
          size="sm"
          color="gray"
          onClick={handleToggleTheme}
          className="p-2"
        >
          {theme === 'light' ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>

        {/* Notifications */}
        <Button
          size="sm"
          color="gray"
          onClick={handleNotificationsClick}
          className="p-2 relative"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              color="failure"
              size="sm"
              className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>

        {/* Help */}
        <Button
          size="sm"
          color="gray"
          onClick={handleHelpClick}
          className="p-2"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>

        {/* User menu */}
        <Dropdown
          label={
            <Avatar
              img={user?.avatar}
              alt={user ? `${user.firstName} ${user.lastName}` : 'User'}
              size="sm"
              rounded
            >
              <div className="font-medium dark:text-white">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {user?.email}
              </div>
            </Avatar>
          }
          arrowIcon={false}
          inline
        >
          <Dropdown.Header>
            <span className="block text-sm font-semibold">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="block truncate text-sm text-gray-500">
              {user?.email}
            </span>
            <span className="block text-xs text-gray-400 capitalize">
              {user?.role}
            </span>
          </Dropdown.Header>

          <Dropdown.Item onClick={handleProfileClick}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </Dropdown.Item>

          <Dropdown.Item onClick={handleSettingsClick}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Dropdown.Item>

          <Dropdown.Divider />

          <Dropdown.Item
            onClick={handleLogout}
            className="text-red-600 dark:text-red-400"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isLoggingOut ? 'Signing out...' : 'Sign out'}
          </Dropdown.Item>
        </Dropdown>
      </div>
    </Navbar>
  );
};

export default Header;