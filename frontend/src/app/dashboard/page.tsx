'use client';

import React from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectUser } from '@/store/slices/authSlice';
import { Card, Button } from 'flowbite-react';
import {
  FolderOpen,
  FileText,
  Users,
  Clock,
  Plus,
  ArrowRight,
  BarChart3,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/config';

// Mock data - replace with actual API calls
const mockStats = {
  totalProjects: 12,
  activeDrawings: 45,
  pendingApprovals: 8,
  teamMembers: 24,
};

const mockRecentProjects = [
  {
    id: '1',
    name: 'Water Treatment Plant - Phase 2',
    description: 'Advanced filtration system design',
    status: 'Active',
    lastModified: '2024-01-15',
    drawings: 8,
  },
  {
    id: '2',
    name: 'Industrial Processing Unit',
    description: 'Chemical processing facility upgrades',
    status: 'In Review',
    lastModified: '2024-01-14',
    drawings: 12,
  },
  {
    id: '3',
    name: 'Wastewater Treatment Expansion',
    description: 'Capacity expansion project',
    status: 'Draft',
    lastModified: '2024-01-13',
    drawings: 6,
  },
];

const mockRecentDrawings = [
  {
    id: '1',
    name: 'Primary Treatment P&ID',
    projectName: 'Water Treatment Plant - Phase 2',
    status: 'Approved',
    lastModified: '2024-01-15',
    version: '2.1',
  },
  {
    id: '2',
    name: 'Chemical Dosing System',
    projectName: 'Water Treatment Plant - Phase 2',
    status: 'In Review',
    lastModified: '2024-01-14',
    version: '1.3',
  },
  {
    id: '3',
    name: 'Sludge Handling Process',
    projectName: 'Wastewater Treatment Expansion',
    status: 'Draft',
    lastModified: '2024-01-13',
    version: '1.0',
  },
];

const mockPendingTasks = [
  {
    id: '1',
    title: 'Review Chemical Dosing System P&ID',
    type: 'Review',
    priority: 'High',
    dueDate: '2024-01-16',
    project: 'Water Treatment Plant - Phase 2',
  },
  {
    id: '2',
    title: 'Approve Primary Treatment Design',
    type: 'Approval',
    priority: 'Medium',
    dueDate: '2024-01-17',
    project: 'Water Treatment Plant - Phase 2',
  },
  {
    id: '3',
    title: 'Update Equipment Specifications',
    type: 'Update',
    priority: 'Low',
    dueDate: '2024-01-18',
    project: 'Industrial Processing Unit',
  },
];

const DashboardPage: React.FC = () => {
  const user = useAppSelector(selectUser);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'in review':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'draft':
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
      case 'active':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'low':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href={`${routes.projects}/new`}>
          <Button color="blue">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </Link>
        <Link href={`${routes.drawings}/new`}>
          <Button color="gray" outline>
            <FileText className="mr-2 h-4 w-4" />
            New Drawing
          </Button>
        </Link>
        <Link href={routes.symbols}>
          <Button color="gray" outline>
            <Plus className="mr-2 h-4 w-4" />
            Import Symbols
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
              <FolderOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Projects
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockStats.totalProjects}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
              <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Drawings
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockStats.activeDrawings}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pending Approvals
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockStats.pendingApprovals}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Team Members
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockStats.teamMembers}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Projects
            </h3>
            <Link
              href={routes.projects}
              className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
            >
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {mockRecentProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <Link href={`${routes.projects}/${project.id}`}>
                    <h4 className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                      {project.name}
                    </h4>
                  </Link>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {project.description}
                  </p>
                  <div className="flex items-center mt-1 space-x-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}
                    >
                      {project.status}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {project.drawings} drawings
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Drawings */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Drawings
            </h3>
            <Link
              href={routes.drawings}
              className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
            >
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {mockRecentDrawings.map((drawing) => (
              <div
                key={drawing.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <Link href={`${routes.drawings}/${drawing.id}`}>
                    <h4 className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                      {drawing.name}
                    </h4>
                  </Link>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {drawing.projectName}
                  </p>
                  <div className="flex items-center mt-1 space-x-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(drawing.status)}`}
                    >
                      {drawing.status}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      v{drawing.version}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Pending Tasks */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Pending Tasks
          </h3>
          <Link
            href={routes.workflows}
            className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
          >
            View all
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="space-y-3">
          {mockPendingTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {task.type === 'Approval' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {task.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {task.project}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}
                >
                  {task.priority}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Due {task.dueDate}
                </span>
                <Button size="xs" color="blue">
                  Review
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;