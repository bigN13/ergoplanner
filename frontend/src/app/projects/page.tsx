'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { selectUser } from '@/store/slices/authSlice';
import {
  Card,
  Button,
  TextInput,
  Dropdown,
  Badge,
  Table,
} from 'flowbite-react';
import {
  Plus,
  Search,
  Filter,
  FolderOpen,
  Users,
  Calendar,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/config';

// Mock projects data - replace with actual API calls
const mockProjects = [
  {
    id: '1',
    name: 'Water Treatment Plant - Phase 2',
    description: 'Advanced filtration system design for municipal water treatment',
    status: 'Active',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-15',
    createdBy: 'John Doe',
    teamMembers: 8,
    drawings: 12,
    organization: 'AquaTech Solutions',
  },
  {
    id: '2',
    name: 'Industrial Processing Unit',
    description: 'Chemical processing facility upgrades and optimization',
    status: 'In Review',
    createdAt: '2024-01-05',
    updatedAt: '2024-01-14',
    createdBy: 'Jane Smith',
    teamMembers: 6,
    drawings: 18,
    organization: 'ChemCorp Industries',
  },
  {
    id: '3',
    name: 'Wastewater Treatment Expansion',
    description: 'Capacity expansion project for regional treatment facility',
    status: 'Draft',
    createdAt: '2024-01-03',
    updatedAt: '2024-01-13',
    createdBy: 'Mike Johnson',
    teamMembers: 4,
    drawings: 6,
    organization: 'Municipal Water Authority',
  },
  {
    id: '4',
    name: 'Power Plant Cooling System',
    description: 'Cooling tower and heat exchanger system redesign',
    status: 'Completed',
    createdAt: '2023-12-15',
    updatedAt: '2024-01-05',
    createdBy: 'Sarah Wilson',
    teamMembers: 12,
    drawings: 24,
    organization: 'PowerGen Corp',
  },
  {
    id: '5',
    name: 'Pharmaceutical Manufacturing',
    description: 'Clean room and sterile processing equipment design',
    status: 'On Hold',
    createdAt: '2023-12-01',
    updatedAt: '2023-12-20',
    createdBy: 'David Brown',
    teamMembers: 5,
    drawings: 9,
    organization: 'PharmaTech Ltd',
  },
];

const ProjectsPage: React.FC = () => {
  const router = useRouter();
  const user = useAppSelector(selectUser);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const statusOptions = ['All', 'Active', 'Draft', 'In Review', 'Completed', 'On Hold', 'Archived'];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'draft':
        return 'gray';
      case 'in review':
        return 'warning';
      case 'completed':
        return 'blue';
      case 'on hold':
        return 'yellow';
      case 'archived':
        return 'dark';
      default:
        return 'gray';
    }
  };

  const filteredProjects = mockProjects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateProject = () => {
    router.push(`${routes.projects}/new`);
  };

  const handleViewProject = (id: string) => {
    router.push(`${routes.projects}/${id}`);
  };

  const handleEditProject = (id: string) => {
    router.push(`${routes.projects}/${id}/edit`);
  };

  const handleDeleteProject = (id: string) => {
    // TODO: Implement delete confirmation modal and API call
    console.log('Delete project:', id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Projects
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your P&ID projects and collaborate with your team
          </p>
        </div>

        <div className="mt-4 sm:mt-0">
          <Button onClick={handleCreateProject} color="blue">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <TextInput
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <Dropdown
            label={
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                Status: {statusFilter}
              </div>
            }
            dismissOnClick={false}
          >
            {statusOptions.map((status) => (
              <Dropdown.Item
                key={status}
                onClick={() => setStatusFilter(status)}
                className={statusFilter === status ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
              >
                {status}
              </Dropdown.Item>
            ))}
          </Dropdown>

          {/* View Toggle */}
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm font-medium rounded-l-lg ${
                viewMode === 'grid'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm font-medium rounded-r-lg border-l border-gray-300 dark:border-gray-600 ${
                viewMode === 'table'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </Card>

      {/* Projects Grid/Table */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <FolderOpen className="h-5 w-5 text-blue-500" />
                    <Badge color={getStatusColor(project.status)} size="sm">
                      {project.status}
                    </Badge>
                  </div>

                  <Link href={`${routes.projects}/${project.id}`}>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                      {project.name}
                    </h3>
                  </Link>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {project.description}
                  </p>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Users className="mr-2 h-4 w-4" />
                      {project.teamMembers} members
                    </div>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="mr-2 h-4 w-4" />
                      Updated {project.updatedAt}
                    </div>
                  </div>
                </div>

                <Dropdown
                  label={<MoreVertical className="h-4 w-4" />}
                  arrowIcon={false}
                  inline
                >
                  <Dropdown.Item onClick={() => handleViewProject(project.id)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleEditProject(project.id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => handleDeleteProject(project.id)}
                    className="text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Dropdown.Item>
                </Dropdown>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    {project.drawings} drawings
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    by {project.createdBy}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <Table.Head>
              <Table.HeadCell>Project</Table.HeadCell>
              <Table.HeadCell>Status</Table.HeadCell>
              <Table.HeadCell>Team</Table.HeadCell>
              <Table.HeadCell>Drawings</Table.HeadCell>
              <Table.HeadCell>Updated</Table.HeadCell>
              <Table.HeadCell>
                <span className="sr-only">Actions</span>
              </Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {filteredProjects.map((project) => (
                <Table.Row
                  key={project.id}
                  className="bg-white dark:border-gray-700 dark:bg-gray-800"
                >
                  <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                    <div>
                      <Link href={`${routes.projects}/${project.id}`}>
                        <div className="font-semibold hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                          {project.name}
                        </div>
                      </Link>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {project.organization}
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={getStatusColor(project.status)} size="sm">
                      {project.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>{project.teamMembers}</Table.Cell>
                  <Table.Cell>{project.drawings}</Table.Cell>
                  <Table.Cell>{project.updatedAt}</Table.Cell>
                  <Table.Cell>
                    <Dropdown
                      label={<MoreVertical className="h-4 w-4" />}
                      arrowIcon={false}
                      inline
                    >
                      <Dropdown.Item onClick={() => handleViewProject(project.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleEditProject(project.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Dropdown.Item>
                      <Dropdown.Item
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Dropdown.Item>
                    </Dropdown>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Card>
      )}

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No projects found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== 'All'
                ? 'Try adjusting your search or filters.'
                : 'Get started by creating a new project.'}
            </p>
            {!searchTerm && statusFilter === 'All' && (
              <div className="mt-6">
                <Button onClick={handleCreateProject} color="blue">
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first project
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProjectsPage;