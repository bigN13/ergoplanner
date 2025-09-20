using Ergoplanner.Application.DTOs.Projects;
using Ergoplanner.Application.DTOs.Drawings;

namespace Ergoplanner.Application.Interfaces;

/// <summary>
/// Specialized cache service for project and drawing data
/// </summary>
public interface IProjectCacheService
{
    /// <summary>
    /// Cache project metadata
    /// </summary>
    Task CacheProjectAsync(ProjectDto project, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get cached project
    /// </summary>
    Task<ProjectDto?> GetCachedProjectAsync(Guid projectId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Remove project from cache
    /// </summary>
    Task RemoveProjectAsync(Guid projectId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Cache drawing metadata (without ReactFlow data)
    /// </summary>
    Task CacheDrawingMetadataAsync(DrawingMetadataDto drawing, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get cached drawing metadata
    /// </summary>
    Task<DrawingMetadataDto?> GetCachedDrawingMetadataAsync(Guid drawingId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Cache drawing ReactFlow data separately (large JSON)
    /// </summary>
    Task CacheDrawingDataAsync(Guid drawingId, object reactFlowData, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get cached drawing ReactFlow data
    /// </summary>
    Task<T?> GetCachedDrawingDataAsync<T>(Guid drawingId, CancellationToken cancellationToken = default) where T : class;

    /// <summary>
    /// Remove drawing from cache (both metadata and data)
    /// </summary>
    Task RemoveDrawingAsync(Guid drawingId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Cache user projects list
    /// </summary>
    Task CacheUserProjectsAsync(Guid userId, IEnumerable<ProjectDto> projects, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get cached user projects
    /// </summary>
    Task<IEnumerable<ProjectDto>?> GetCachedUserProjectsAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Remove user projects cache
    /// </summary>
    Task RemoveUserProjectsAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Cache project drawings list
    /// </summary>
    Task CacheProjectDrawingsAsync(Guid projectId, IEnumerable<DrawingMetadataDto> drawings, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get cached project drawings
    /// </summary>
    Task<IEnumerable<DrawingMetadataDto>?> GetCachedProjectDrawingsAsync(Guid projectId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Remove project drawings cache
    /// </summary>
    Task RemoveProjectDrawingsAsync(Guid projectId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Cache symbol library
    /// </summary>
    Task CacheSymbolLibraryAsync(string standard, object symbols, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get cached symbol library
    /// </summary>
    Task<T?> GetCachedSymbolLibraryAsync<T>(string standard, CancellationToken cancellationToken = default) where T : class;

    /// <summary>
    /// Invalidate all project-related cache for a user
    /// </summary>
    Task InvalidateUserCacheAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Invalidate all project-related cache
    /// </summary>
    Task InvalidateProjectCacheAsync(Guid projectId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Invalidate all drawing-related cache
    /// </summary>
    Task InvalidateDrawingCacheAsync(Guid drawingId, CancellationToken cancellationToken = default);
}