/**
 * Drawing API Slice with RTK Query for Backend Synchronization
 * TASK-022: Redux State for Drawings
 */

import { apiSlice } from './apiSlice';
import type {
  Drawing,
  ReactFlowData,
  Component,
  ApiResponse,
  PaginatedResponse
} from '@/types';
import type {
  DrawingSnapshot,
  DrawingTemplate,
  DrawingDiff,
  ImportExportOperation,
  ConflictResolution,
} from '@/types/drawing-state';

// Extended drawing API slice
export const drawingApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // === DRAWING CRUD OPERATIONS ===

    /**
     * Get drawing by ID with full ReactFlow data
     */
    getDrawing: builder.query<Drawing, string>({
      query: (id) => `/api/v1/drawings/${id}`,
      providesTags: (result, error, id) => [{ type: 'Drawing', id }],
      transformResponse: (response: ApiResponse<Drawing>) => response.data,
    }),

    /**
     * Get all drawings for a project
     */
    getDrawings: builder.query<Drawing[], { projectId: string; includeArchived?: boolean }>({
      query: ({ projectId, includeArchived = false }) => ({
        url: '/api/v1/drawings',
        params: { projectId, includeArchived },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Drawing' as const, id })),
              { type: 'Drawing', id: 'LIST' },
            ]
          : [{ type: 'Drawing', id: 'LIST' }],
      transformResponse: (response: ApiResponse<Drawing[]>) => response.data,
    }),

    /**
     * Create new drawing
     */
    createDrawing: builder.mutation<Drawing, {
      projectId: string;
      name: string;
      description?: string;
      templateId?: string;
      reactFlowData?: ReactFlowData;
    }>({
      query: (drawing) => ({
        url: '/api/v1/drawings',
        method: 'POST',
        body: drawing,
      }),
      invalidatesTags: [{ type: 'Drawing', id: 'LIST' }],
      transformResponse: (response: ApiResponse<Drawing>) => response.data,
    }),

    /**
     * Update drawing with optimistic updates support
     */
    updateDrawing: builder.mutation<Drawing, {
      id: string;
      updates: Partial<Drawing>;
      optimisticUpdateId?: string;
      expectedVersion?: number;
    }>({
      query: ({ id, updates, optimisticUpdateId, expectedVersion }) => ({
        url: `/api/v1/drawings/${id}`,
        method: 'PUT',
        body: {
          ...updates,
          optimisticUpdateId,
          expectedVersion,
        },
        headers: optimisticUpdateId ? {
          'X-Optimistic-Update-Id': optimisticUpdateId,
        } : {},
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Drawing', id }],
      transformResponse: (response: ApiResponse<Drawing>) => response.data,
      // Handle optimistic update conflicts
      transformErrorResponse: (response) => {
        if (response.status === 409) {
          return {
            status: 'CONFLICT',
            data: response.data,
            error: 'Version conflict detected',
          };
        }
        return response;
      },
    }),

    /**
     * Update drawing ReactFlow data with conflict detection
     */
    updateDrawingData: builder.mutation<{
      drawing: Drawing;
      conflicts?: ConflictResolution[];
    }, {
      id: string;
      reactFlowData: ReactFlowData;
      components?: Component[];
      optimisticUpdateId?: string;
      expectedVersion?: number;
      userId?: string;
    }>({
      query: ({ id, reactFlowData, components, optimisticUpdateId, expectedVersion, userId }) => ({
        url: `/api/v1/drawings/${id}/data`,
        method: 'PUT',
        body: {
          reactFlowData,
          components,
          optimisticUpdateId,
          expectedVersion,
          userId,
        },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Drawing', id },
        { type: 'Component', id: 'LIST' },
      ],
      transformResponse: (response: ApiResponse<{
        drawing: Drawing;
        conflicts?: ConflictResolution[];
      }>) => response.data,
    }),

    /**
     * Delete drawing
     */
    deleteDrawing: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/v1/drawings/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Drawing', id },
        { type: 'Drawing', id: 'LIST' },
      ],
    }),

    // === DRAWING VERSIONING ===

    /**
     * Get drawing version history
     */
    getDrawingVersions: builder.query<Drawing[], string>({
      query: (id) => `/api/v1/drawings/${id}/versions`,
      providesTags: (result, error, id) => [{ type: 'Drawing', id: `${id}-versions` }],
      transformResponse: (response: ApiResponse<Drawing[]>) => response.data,
    }),

    /**
     * Create drawing version/checkpoint
     */
    createDrawingVersion: builder.mutation<Drawing, {
      id: string;
      description?: string;
      isManual?: boolean;
    }>({
      query: ({ id, description, isManual = true }) => ({
        url: `/api/v1/drawings/${id}/versions`,
        method: 'POST',
        body: { description, isManual },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Drawing', id },
        { type: 'Drawing', id: `${id}-versions` },
      ],
      transformResponse: (response: ApiResponse<Drawing>) => response.data,
    }),

    /**
     * Restore drawing to specific version
     */
    restoreDrawingVersion: builder.mutation<Drawing, {
      id: string;
      version: number;
      createBackup?: boolean;
    }>({
      query: ({ id, version, createBackup = true }) => ({
        url: `/api/v1/drawings/${id}/versions/${version}/restore`,
        method: 'POST',
        body: { createBackup },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Drawing', id },
        { type: 'Drawing', id: `${id}-versions` },
      ],
      transformResponse: (response: ApiResponse<Drawing>) => response.data,
    }),

    // === DRAWING DIFF AND MERGE ===

    /**
     * Calculate diff between drawing versions
     */
    calculateDrawingDiff: builder.query<DrawingDiff, {
      drawingId: string;
      fromVersion: number;
      toVersion: number;
    }>({
      query: ({ drawingId, fromVersion, toVersion }) => ({
        url: `/api/v1/drawings/${drawingId}/diff`,
        params: { fromVersion, toVersion },
      }),
      transformResponse: (response: ApiResponse<DrawingDiff>) => response.data,
    }),

    /**
     * Merge drawing versions with conflict resolution
     */
    mergeDrawingVersions: builder.mutation<Drawing, {
      drawingId: string;
      baseVersion: number;
      targetVersion: number;
      conflicts?: ConflictResolution[];
      strategy?: 'auto' | 'manual';
    }>({
      query: ({ drawingId, baseVersion, targetVersion, conflicts, strategy = 'auto' }) => ({
        url: `/api/v1/drawings/${drawingId}/merge`,
        method: 'POST',
        body: { baseVersion, targetVersion, conflicts, strategy },
      }),
      invalidatesTags: (result, error, { drawingId }) => [
        { type: 'Drawing', id: drawingId },
      ],
      transformResponse: (response: ApiResponse<Drawing>) => response.data,
    }),

    // === DRAWING SNAPSHOTS ===

    /**
     * Get drawing snapshots
     */
    getDrawingSnapshots: builder.query<DrawingSnapshot[], {
      drawingId: string;
      includeAutomatic?: boolean;
      limit?: number;
    }>({
      query: ({ drawingId, includeAutomatic = true, limit = 50 }) => ({
        url: `/api/v1/drawings/${drawingId}/snapshots`,
        params: { includeAutomatic, limit },
      }),
      providesTags: (result, error, { drawingId }) => [
        { type: 'Drawing', id: `${drawingId}-snapshots` },
      ],
      transformResponse: (response: ApiResponse<DrawingSnapshot[]>) => response.data,
    }),

    /**
     * Create drawing snapshot
     */
    createDrawingSnapshot: builder.mutation<DrawingSnapshot, {
      drawingId: string;
      name: string;
      description?: string;
      isAutomatic?: boolean;
    }>({
      query: ({ drawingId, name, description, isAutomatic = false }) => ({
        url: `/api/v1/drawings/${drawingId}/snapshots`,
        method: 'POST',
        body: { name, description, isAutomatic },
      }),
      invalidatesTags: (result, error, { drawingId }) => [
        { type: 'Drawing', id: `${drawingId}-snapshots` },
      ],
      transformResponse: (response: ApiResponse<DrawingSnapshot>) => response.data,
    }),

    /**
     * Restore drawing from snapshot
     */
    restoreFromSnapshot: builder.mutation<Drawing, {
      drawingId: string;
      snapshotId: string;
      createBackup?: boolean;
    }>({
      query: ({ drawingId, snapshotId, createBackup = true }) => ({
        url: `/api/v1/drawings/${drawingId}/snapshots/${snapshotId}/restore`,
        method: 'POST',
        body: { createBackup },
      }),
      invalidatesTags: (result, error, { drawingId }) => [
        { type: 'Drawing', id: drawingId },
      ],
      transformResponse: (response: ApiResponse<Drawing>) => response.data,
    }),

    /**
     * Delete drawing snapshot
     */
    deleteSnapshot: builder.mutation<void, {
      drawingId: string;
      snapshotId: string;
    }>({
      query: ({ drawingId, snapshotId }) => ({
        url: `/api/v1/drawings/${drawingId}/snapshots/${snapshotId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { drawingId }) => [
        { type: 'Drawing', id: `${drawingId}-snapshots` },
      ],
    }),

    // === DRAWING TEMPLATES ===

    /**
     * Get drawing templates
     */
    getDrawingTemplates: builder.query<DrawingTemplate[], {
      category?: string;
      isPublic?: boolean;
      search?: string;
      limit?: number;
    }>({
      query: ({ category, isPublic, search, limit = 100 }) => ({
        url: '/api/v1/drawing-templates',
        params: { category, isPublic, search, limit },
      }),
      providesTags: [{ type: 'Drawing', id: 'TEMPLATES' }],
      transformResponse: (response: ApiResponse<DrawingTemplate[]>) => response.data,
    }),

    /**
     * Create drawing template from existing drawing
     */
    createDrawingTemplate: builder.mutation<DrawingTemplate, {
      drawingId: string;
      name: string;
      description?: string;
      category: string;
      tags?: string[];
      isPublic?: boolean;
    }>({
      query: ({ drawingId, name, description, category, tags, isPublic = false }) => ({
        url: '/api/v1/drawing-templates',
        method: 'POST',
        body: { drawingId, name, description, category, tags, isPublic },
      }),
      invalidatesTags: [{ type: 'Drawing', id: 'TEMPLATES' }],
      transformResponse: (response: ApiResponse<DrawingTemplate>) => response.data,
    }),

    /**
     * Update drawing template
     */
    updateDrawingTemplate: builder.mutation<DrawingTemplate, {
      id: string;
      updates: Partial<DrawingTemplate>;
    }>({
      query: ({ id, updates }) => ({
        url: `/api/v1/drawing-templates/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: [{ type: 'Drawing', id: 'TEMPLATES' }],
      transformResponse: (response: ApiResponse<DrawingTemplate>) => response.data,
    }),

    /**
     * Delete drawing template
     */
    deleteDrawingTemplate: builder.mutation<void, string>({
      query: (id) => ({
        url: `/api/v1/drawing-templates/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Drawing', id: 'TEMPLATES' }],
    }),

    // === IMPORT/EXPORT OPERATIONS ===

    /**
     * Import drawing from file
     */
    importDrawing: builder.mutation<{
      drawing: Drawing;
      operation: ImportExportOperation;
    }, {
      projectId: string;
      file: File;
      format: string;
      name?: string;
      preserveIds?: boolean;
    }>({
      query: ({ projectId, file, format, name, preserveIds = false }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);
        formData.append('format', format);
        if (name) formData.append('name', name);
        formData.append('preserveIds', preserveIds.toString());

        return {
          url: '/api/v1/drawings/import',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: [{ type: 'Drawing', id: 'LIST' }],
      transformResponse: (response: ApiResponse<{
        drawing: Drawing;
        operation: ImportExportOperation;
      }>) => response.data,
    }),

    /**
     * Export drawing to file
     */
    exportDrawing: builder.mutation<Blob, {
      drawingId: string;
      format: string;
      includeComponents?: boolean;
      includeProperties?: boolean;
      quality?: 'low' | 'medium' | 'high';
    }>({
      query: ({ drawingId, format, includeComponents = true, includeProperties = true, quality = 'high' }) => ({
        url: `/api/v1/drawings/${drawingId}/export`,
        method: 'POST',
        body: { format, includeComponents, includeProperties, quality },
        responseHandler: (response) => response.blob(),
      }),
    }),

    /**
     * Get import/export operation status
     */
    getImportExportStatus: builder.query<ImportExportOperation, string>({
      query: (operationId) => `/api/v1/import-export/operations/${operationId}`,
      transformResponse: (response: ApiResponse<ImportExportOperation>) => response.data,
    }),

    // === COLLABORATION ENDPOINTS ===

    /**
     * Get active collaborators for a drawing
     */
    getDrawingCollaborators: builder.query<{
      userId: string;
      userName: string;
      lastActivity: string;
      isActive: boolean;
    }[], string>({
      query: (drawingId) => `/api/v1/drawings/${drawingId}/collaborators`,
      transformResponse: (response: ApiResponse<any[]>) => response.data,
    }),

    /**
     * Get drawing locks
     */
    getDrawingLocks: builder.query<{
      elementId: string;
      elementType: string;
      userId: string;
      userName: string;
      lockedAt: string;
      expiresAt: string;
    }[], string>({
      query: (drawingId) => `/api/v1/drawings/${drawingId}/locks`,
      transformResponse: (response: ApiResponse<any[]>) => response.data,
    }),

    /**
     * Request element lock for editing
     */
    requestElementLock: builder.mutation<{
      success: boolean;
      lockId?: string;
      conflictingUser?: string;
    }, {
      drawingId: string;
      elementId: string;
      elementType: 'node' | 'edge' | 'component';
      duration?: number;
    }>({
      query: ({ drawingId, elementId, elementType, duration = 300000 }) => ({
        url: `/api/v1/drawings/${drawingId}/locks`,
        method: 'POST',
        body: { elementId, elementType, duration },
      }),
      transformResponse: (response: ApiResponse<any>) => response.data,
    }),

    /**
     * Release element lock
     */
    releaseElementLock: builder.mutation<void, {
      drawingId: string;
      elementId: string;
    }>({
      query: ({ drawingId, elementId }) => ({
        url: `/api/v1/drawings/${drawingId}/locks/${elementId}`,
        method: 'DELETE',
      }),
    }),

    // === VALIDATION ENDPOINTS ===

    /**
     * Validate drawing state
     */
    validateDrawing: builder.mutation<{
      isValid: boolean;
      errors: any[];
      warnings: any[];
      suggestions: any[];
    }, {
      drawingId: string;
      strictMode?: boolean;
    }>({
      query: ({ drawingId, strictMode = false }) => ({
        url: `/api/v1/drawings/${drawingId}/validate`,
        method: 'POST',
        body: { strictMode },
      }),
      transformResponse: (response: ApiResponse<any>) => response.data,
    }),

    /**
     * Auto-fix drawing validation issues
     */
    autoFixDrawing: builder.mutation<{
      fixed: boolean;
      fixedIssues: string[];
      remainingIssues: string[];
      updatedDrawing?: Drawing;
    }, {
      drawingId: string;
      autoFixTypes: string[];
    }>({
      query: ({ drawingId, autoFixTypes }) => ({
        url: `/api/v1/drawings/${drawingId}/auto-fix`,
        method: 'POST',
        body: { autoFixTypes },
      }),
      invalidatesTags: (result, error, { drawingId }) => [
        { type: 'Drawing', id: drawingId },
      ],
      transformResponse: (response: ApiResponse<any>) => response.data,
    }),

    // === ANALYTICS AND REPORTING ===

    /**
     * Get drawing analytics
     */
    getDrawingAnalytics: builder.query<{
      nodeCount: number;
      edgeCount: number;
      componentCount: number;
      complexity: 'low' | 'medium' | 'high';
      lastModified: string;
      collaboratorCount: number;
      versionCount: number;
    }, string>({
      query: (drawingId) => `/api/v1/drawings/${drawingId}/analytics`,
      transformResponse: (response: ApiResponse<any>) => response.data,
    }),

    /**
     * Get drawing activity log
     */
    getDrawingActivity: builder.query<{
      id: string;
      action: string;
      userId: string;
      userName: string;
      timestamp: string;
      details: any;
    }[], {
      drawingId: string;
      limit?: number;
      fromDate?: string;
      toDate?: string;
    }>({
      query: ({ drawingId, limit = 100, fromDate, toDate }) => ({
        url: `/api/v1/drawings/${drawingId}/activity`,
        params: { limit, fromDate, toDate },
      }),
      transformResponse: (response: ApiResponse<any[]>) => response.data,
    }),
  }),
});

// Export hooks
export const {
  // Drawing CRUD
  useGetDrawingQuery,
  useGetDrawingsQuery,
  useCreateDrawingMutation,
  useUpdateDrawingMutation,
  useUpdateDrawingDataMutation,
  useDeleteDrawingMutation,

  // Versioning
  useGetDrawingVersionsQuery,
  useCreateDrawingVersionMutation,
  useRestoreDrawingVersionMutation,

  // Diff and merge
  useCalculateDrawingDiffQuery,
  useMergeDrawingVersionsMutation,

  // Snapshots
  useGetDrawingSnapshotsQuery,
  useCreateDrawingSnapshotMutation,
  useRestoreFromSnapshotMutation,
  useDeleteSnapshotMutation,

  // Templates
  useGetDrawingTemplatesQuery,
  useCreateDrawingTemplateMutation,
  useUpdateDrawingTemplateMutation,
  useDeleteDrawingTemplateMutation,

  // Import/Export
  useImportDrawingMutation,
  useExportDrawingMutation,
  useGetImportExportStatusQuery,

  // Collaboration
  useGetDrawingCollaboratorsQuery,
  useGetDrawingLocksQuery,
  useRequestElementLockMutation,
  useReleaseElementLockMutation,

  // Validation
  useValidateDrawingMutation,
  useAutoFixDrawingMutation,

  // Analytics
  useGetDrawingAnalyticsQuery,
  useGetDrawingActivityQuery,
} = drawingApiSlice;