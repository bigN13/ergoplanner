using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Ergoplanner.Application.Interfaces;
using Ergoplanner.Application.DTOs.Projects;
using Ergoplanner.Application.DTOs.Drawings;
using Ergoplanner.Infrastructure.Caching.Configuration;
using Ergoplanner.Infrastructure.Caching.Common;

namespace Ergoplanner.Infrastructure.Caching.Services;

/// <summary>
/// Specialized cache service for project and drawing data
/// </summary>
public class ProjectCacheService : IProjectCacheService
{
    private readonly ICacheService _cacheService;
    private readonly RedisConfiguration _configuration;
    private readonly ILogger<ProjectCacheService> _logger;

    public ProjectCacheService(
        ICacheService cacheService,
        IOptions<RedisConfiguration> configuration,
        ILogger<ProjectCacheService> logger)
    {
        _cacheService = cacheService ?? throw new ArgumentNullException(nameof(cacheService));
        _configuration = configuration.Value ?? throw new ArgumentNullException(nameof(configuration));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task CacheProjectAsync(ProjectDto project, CancellationToken cancellationToken = default)
    {
        try
        {
            var key = CacheKeyBuilder.ForProject(project.Id, "metadata");
            var expiration = TimeSpan.FromMinutes(_configuration.Expiration.ProjectMetadataMinutes);

            await _cacheService.SetAsync(key, project, expiration, cancellationToken);

            _logger.LogDebug("Cached project: {ProjectId}", project.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error caching project: {ProjectId}", project.Id);
        }
    }

    public async Task<ProjectDto?> GetCachedProjectAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        try
        {
            var key = CacheKeyBuilder.ForProject(projectId, "metadata");
            var result = await _cacheService.GetAsync<ProjectDto>(key, cancellationToken);

            if (result != null)
            {
                _logger.LogDebug("Retrieved cached project: {ProjectId}", projectId);
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cached project: {ProjectId}", projectId);
            return null;
        }
    }

    public async Task RemoveProjectAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        try
        {
            // Remove project metadata and related cache entries
            var pattern = CacheKeyBuilder.ForProjectPattern(projectId);
            await _cacheService.RemoveByPatternAsync(pattern, cancellationToken);

            _logger.LogDebug("Removed project cache: {ProjectId}", projectId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing project cache: {ProjectId}", projectId);
        }
    }

    public async Task CacheDrawingMetadataAsync(DrawingMetadataDto drawing, CancellationToken cancellationToken = default)
    {
        try
        {
            var key = CacheKeyBuilder.ForDrawingMetadata(drawing.Id);
            var expiration = TimeSpan.FromMinutes(_configuration.Expiration.DrawingMetadataMinutes);

            await _cacheService.SetAsync(key, drawing, expiration, cancellationToken);

            _logger.LogDebug("Cached drawing metadata: {DrawingId}", drawing.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error caching drawing metadata: {DrawingId}", drawing.Id);
        }
    }

    public async Task<DrawingMetadataDto?> GetCachedDrawingMetadataAsync(Guid drawingId, CancellationToken cancellationToken = default)
    {
        try
        {
            var key = CacheKeyBuilder.ForDrawingMetadata(drawingId);
            var result = await _cacheService.GetAsync<DrawingMetadataDto>(key, cancellationToken);

            if (result != null)
            {
                _logger.LogDebug("Retrieved cached drawing metadata: {DrawingId}", drawingId);
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cached drawing metadata: {DrawingId}", drawingId);
            return null;
        }
    }

    public async Task CacheDrawingDataAsync(Guid drawingId, object reactFlowData, CancellationToken cancellationToken = default)
    {
        try
        {
            var key = CacheKeyBuilder.ForDrawingData(drawingId);
            var expiration = TimeSpan.FromMinutes(_configuration.Expiration.DrawingDataMinutes);

            await _cacheService.SetAsync(key, reactFlowData, expiration, cancellationToken);

            _logger.LogDebug("Cached drawing data: {DrawingId}", drawingId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error caching drawing data: {DrawingId}", drawingId);
        }
    }

    public async Task<T?> GetCachedDrawingDataAsync<T>(Guid drawingId, CancellationToken cancellationToken = default) where T : class
    {
        try
        {
            var key = CacheKeyBuilder.ForDrawingData(drawingId);
            var result = await _cacheService.GetAsync<T>(key, cancellationToken);

            if (result != null)
            {
                _logger.LogDebug("Retrieved cached drawing data: {DrawingId}", drawingId);
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cached drawing data: {DrawingId}", drawingId);
            return null;
        }
    }

    public async Task RemoveDrawingAsync(Guid drawingId, CancellationToken cancellationToken = default)
    {
        try
        {
            // Remove drawing metadata and data
            var pattern = CacheKeyBuilder.ForDrawingPattern(drawingId);
            await _cacheService.RemoveByPatternAsync(pattern, cancellationToken);

            _logger.LogDebug("Removed drawing cache: {DrawingId}", drawingId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing drawing cache: {DrawingId}", drawingId);
        }
    }

    public async Task CacheUserProjectsAsync(Guid userId, IEnumerable<ProjectDto> projects, CancellationToken cancellationToken = default)
    {
        try
        {
            var key = CacheKeyBuilder.ForUserProjects(userId);
            var expiration = TimeSpan.FromMinutes(_configuration.Expiration.ProjectMetadataMinutes);

            await _cacheService.SetAsync(key, projects, expiration, cancellationToken);

            _logger.LogDebug("Cached user projects: {UserId}", userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error caching user projects: {UserId}", userId);
        }
    }

    public async Task<IEnumerable<ProjectDto>?> GetCachedUserProjectsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var key = CacheKeyBuilder.ForUserProjects(userId);
            var result = await _cacheService.GetAsync<IEnumerable<ProjectDto>>(key, cancellationToken);

            if (result != null)
            {
                _logger.LogDebug("Retrieved cached user projects: {UserId}", userId);
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cached user projects: {UserId}", userId);
            return null;
        }
    }

    public async Task RemoveUserProjectsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var key = CacheKeyBuilder.ForUserProjects(userId);
            await _cacheService.RemoveAsync(key, cancellationToken);

            _logger.LogDebug("Removed user projects cache: {UserId}", userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing user projects cache: {UserId}", userId);
        }
    }

    public async Task CacheProjectDrawingsAsync(Guid projectId, IEnumerable<DrawingMetadataDto> drawings, CancellationToken cancellationToken = default)
    {
        try
        {
            var key = CacheKeyBuilder.ForProjectDrawings(projectId);
            var expiration = TimeSpan.FromMinutes(_configuration.Expiration.DrawingMetadataMinutes);

            await _cacheService.SetAsync(key, drawings, expiration, cancellationToken);

            _logger.LogDebug("Cached project drawings: {ProjectId}", projectId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error caching project drawings: {ProjectId}", projectId);
        }
    }

    public async Task<IEnumerable<DrawingMetadataDto>?> GetCachedProjectDrawingsAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        try
        {
            var key = CacheKeyBuilder.ForProjectDrawings(projectId);
            var result = await _cacheService.GetAsync<IEnumerable<DrawingMetadataDto>>(key, cancellationToken);

            if (result != null)
            {
                _logger.LogDebug("Retrieved cached project drawings: {ProjectId}", projectId);
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cached project drawings: {ProjectId}", projectId);
            return null;
        }
    }

    public async Task RemoveProjectDrawingsAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        try
        {
            var key = CacheKeyBuilder.ForProjectDrawings(projectId);
            await _cacheService.RemoveAsync(key, cancellationToken);

            _logger.LogDebug("Removed project drawings cache: {ProjectId}", projectId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing project drawings cache: {ProjectId}", projectId);
        }
    }

    public async Task CacheSymbolLibraryAsync(string standard, object symbols, CancellationToken cancellationToken = default)
    {
        try
        {
            var key = CacheKeyBuilder.ForSymbolLibrary(standard);
            var expiration = TimeSpan.FromHours(_configuration.Expiration.SymbolLibraryHours);

            await _cacheService.SetAsync(key, symbols, expiration, cancellationToken);

            _logger.LogDebug("Cached symbol library: {Standard}", standard);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error caching symbol library: {Standard}", standard);
        }
    }

    public async Task<T?> GetCachedSymbolLibraryAsync<T>(string standard, CancellationToken cancellationToken = default) where T : class
    {
        try
        {
            var key = CacheKeyBuilder.ForSymbolLibrary(standard);
            var result = await _cacheService.GetAsync<T>(key, cancellationToken);

            if (result != null)
            {
                _logger.LogDebug("Retrieved cached symbol library: {Standard}", standard);
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cached symbol library: {Standard}", standard);
            return null;
        }
    }

    public async Task InvalidateUserCacheAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        try
        {
            // Remove all user-related cache entries
            var pattern = CacheKeyBuilder.ForUserPattern(userId);
            await _cacheService.RemoveByPatternAsync(pattern, cancellationToken);

            _logger.LogDebug("Invalidated user cache: {UserId}", userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error invalidating user cache: {UserId}", userId);
        }
    }

    public async Task InvalidateProjectCacheAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        try
        {
            // Remove all project-related cache entries
            var pattern = CacheKeyBuilder.ForProjectPattern(projectId);
            await _cacheService.RemoveByPatternAsync(pattern, cancellationToken);

            _logger.LogDebug("Invalidated project cache: {ProjectId}", projectId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error invalidating project cache: {ProjectId}", projectId);
        }
    }

    public async Task InvalidateDrawingCacheAsync(Guid drawingId, CancellationToken cancellationToken = default)
    {
        try
        {
            // Remove all drawing-related cache entries
            var pattern = CacheKeyBuilder.ForDrawingPattern(drawingId);
            await _cacheService.RemoveByPatternAsync(pattern, cancellationToken);

            _logger.LogDebug("Invalidated drawing cache: {DrawingId}", drawingId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error invalidating drawing cache: {DrawingId}", drawingId);
        }
    }
}