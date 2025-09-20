using Microsoft.Extensions.Logging;
using Ergoplanner.Application.Interfaces;
using Ergoplanner.Infrastructure.Caching.Common;

namespace Ergoplanner.Infrastructure.Caching.Services;

/// <summary>
/// Service for coordinating cache invalidation across the application
/// </summary>
public class CacheInvalidationService : ICacheInvalidationService
{
    private readonly ICacheService _cacheService;
    private readonly IProjectCacheService _projectCacheService;
    private readonly IDistributedCacheService _distributedCacheService;
    private readonly ILogger<CacheInvalidationService> _logger;

    // Statistics tracking
    private static long _totalInvalidations = 0;
    private static long _userDataInvalidations = 0;
    private static long _projectDataInvalidations = 0;
    private static long _drawingDataInvalidations = 0;
    private static long _symbolLibraryInvalidations = 0;
    private static DateTime _lastInvalidation = DateTime.UtcNow;
    private static readonly Dictionary<string, long> _invalidationsByPattern = new();
    private static readonly object _statsLock = new object();

    public CacheInvalidationService(
        ICacheService cacheService,
        IProjectCacheService projectCacheService,
        IDistributedCacheService distributedCacheService,
        ILogger<CacheInvalidationService> logger)
    {
        _cacheService = cacheService ?? throw new ArgumentNullException(nameof(cacheService));
        _projectCacheService = projectCacheService ?? throw new ArgumentNullException(nameof(projectCacheService));
        _distributedCacheService = distributedCacheService ?? throw new ArgumentNullException(nameof(distributedCacheService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task InvalidateUserDataAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var startTime = DateTime.UtcNow;

            // Invalidate user-specific cache
            await _projectCacheService.InvalidateUserCacheAsync(userId, cancellationToken);

            // Remove user session
            await _distributedCacheService.RemoveUserSessionAsync(userId, cancellationToken);

            // Remove user refresh token
            await _distributedCacheService.RemoveRefreshTokenAsync(userId, cancellationToken);

            UpdateStatistics(ref _userDataInvalidations, "user_data", startTime);

            _logger.LogInformation("Invalidated user cache for user: {UserId}", userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error invalidating user cache for user: {UserId}", userId);
        }
    }

    public async Task InvalidateProjectDataAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        try
        {
            var startTime = DateTime.UtcNow;

            // Invalidate project-specific cache
            await _projectCacheService.InvalidateProjectCacheAsync(projectId, cancellationToken);

            // Invalidate project drawings
            await _projectCacheService.RemoveProjectDrawingsAsync(projectId, cancellationToken);

            UpdateStatistics(ref _projectDataInvalidations, "project_data", startTime);

            _logger.LogInformation("Invalidated project cache for project: {ProjectId}", projectId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error invalidating project cache for project: {ProjectId}", projectId);
        }
    }

    public async Task InvalidateDrawingDataAsync(Guid drawingId, CancellationToken cancellationToken = default)
    {
        try
        {
            var startTime = DateTime.UtcNow;

            // Invalidate drawing-specific cache
            await _projectCacheService.InvalidateDrawingCacheAsync(drawingId, cancellationToken);

            // Remove drawing locks
            await _distributedCacheService.RemoveDrawingLockAsync(drawingId, cancellationToken);

            // Remove collaboration data
            var collaborationPattern = CacheKeyBuilder.ForDrawingCollaboration(drawingId) + ":*";
            await _cacheService.RemoveByPatternAsync(collaborationPattern, cancellationToken);

            UpdateStatistics(ref _drawingDataInvalidations, "drawing_data", startTime);

            _logger.LogInformation("Invalidated drawing cache for drawing: {DrawingId}", drawingId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error invalidating drawing cache for drawing: {DrawingId}", drawingId);
        }
    }

    public async Task InvalidateOrganizationDataAsync(Guid organizationId, CancellationToken cancellationToken = default)
    {
        try
        {
            var startTime = DateTime.UtcNow;

            // Invalidate organization-specific cache
            var pattern = CacheKeyBuilder.ForOrganization(organizationId) + "*";
            await _cacheService.RemoveByPatternAsync(pattern, cancellationToken);

            UpdateStatistics(ref _totalInvalidations, "organization_data", startTime);

            _logger.LogInformation("Invalidated organization cache for organization: {OrganizationId}", organizationId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error invalidating organization cache for organization: {OrganizationId}", organizationId);
        }
    }

    public async Task InvalidateProjectMembershipAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var startTime = DateTime.UtcNow;

            // Invalidate user's project list
            await _projectCacheService.RemoveUserProjectsAsync(userId, cancellationToken);

            // Invalidate project metadata (member count might have changed)
            await _projectCacheService.RemoveProjectAsync(projectId, cancellationToken);

            UpdateStatistics(ref _totalInvalidations, "project_membership", startTime);

            _logger.LogInformation("Invalidated project membership cache for project: {ProjectId}, user: {UserId}", projectId, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error invalidating project membership cache for project: {ProjectId}, user: {UserId}", projectId, userId);
        }
    }

    public async Task InvalidateDrawingPermissionsAsync(Guid drawingId, CancellationToken cancellationToken = default)
    {
        try
        {
            var startTime = DateTime.UtcNow;

            // Invalidate drawing metadata (permissions might be cached there)
            await _projectCacheService.RemoveDrawingAsync(drawingId, cancellationToken);

            // Remove any cached permission data
            var permissionPattern = CacheKeyBuilder.ForDrawing(drawingId, "permissions") + "*";
            await _cacheService.RemoveByPatternAsync(permissionPattern, cancellationToken);

            UpdateStatistics(ref _totalInvalidations, "drawing_permissions", startTime);

            _logger.LogInformation("Invalidated drawing permissions cache for drawing: {DrawingId}", drawingId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error invalidating drawing permissions cache for drawing: {DrawingId}", drawingId);
        }
    }

    public async Task InvalidateSymbolLibraryAsync(string standard, CancellationToken cancellationToken = default)
    {
        try
        {
            var startTime = DateTime.UtcNow;

            var key = CacheKeyBuilder.ForSymbolLibrary(standard);
            await _cacheService.RemoveAsync(key, cancellationToken);

            UpdateStatistics(ref _symbolLibraryInvalidations, "symbol_library", startTime);

            _logger.LogInformation("Invalidated symbol library cache for standard: {Standard}", standard);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error invalidating symbol library cache for standard: {Standard}", standard);
        }
    }

    public async Task InvalidateAllSymbolLibrariesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var startTime = DateTime.UtcNow;

            var pattern = CacheKeyBuilder.Build("symbols") + "*";
            await _cacheService.RemoveByPatternAsync(pattern, cancellationToken);

            UpdateStatistics(ref _symbolLibraryInvalidations, "all_symbol_libraries", startTime);

            _logger.LogInformation("Invalidated all symbol library caches");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error invalidating all symbol library caches");
        }
    }

    public async Task InvalidatePatternAsync(string pattern, CancellationToken cancellationToken = default)
    {
        try
        {
            var startTime = DateTime.UtcNow;

            await _cacheService.RemoveByPatternAsync(pattern, cancellationToken);

            UpdateStatistics(ref _totalInvalidations, "custom_pattern", startTime);

            _logger.LogInformation("Invalidated cache by pattern: {Pattern}", pattern);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error invalidating cache by pattern: {Pattern}", pattern);
        }
    }

    public async Task ScheduleCacheWarmupAsync(Guid? userId = null, Guid? projectId = null, CancellationToken cancellationToken = default)
    {
        try
        {
            // This is a placeholder for cache warming logic
            // In a production environment, you might want to:
            // 1. Queue background jobs to preload frequently accessed data
            // 2. Use a separate service to handle cache warming
            // 3. Implement intelligent warming based on usage patterns

            if (userId.HasValue)
            {
                _logger.LogInformation("Scheduled cache warmup for user: {UserId}", userId.Value);
                // TODO: Implement user-specific cache warming
            }

            if (projectId.HasValue)
            {
                _logger.LogInformation("Scheduled cache warmup for project: {ProjectId}", projectId.Value);
                // TODO: Implement project-specific cache warming
            }

            await Task.CompletedTask;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error scheduling cache warmup for user: {UserId}, project: {ProjectId}", userId, projectId);
        }
    }

    public async Task<CacheInvalidationStatistics> GetInvalidationStatisticsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            lock (_statsLock)
            {
                return new CacheInvalidationStatistics
                {
                    TotalInvalidations = _totalInvalidations,
                    UserDataInvalidations = _userDataInvalidations,
                    ProjectDataInvalidations = _projectDataInvalidations,
                    DrawingDataInvalidations = _drawingDataInvalidations,
                    SymbolLibraryInvalidations = _symbolLibraryInvalidations,
                    LastInvalidation = _lastInvalidation,
                    InvalidationsByPattern = new Dictionary<string, long>(_invalidationsByPattern)
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cache invalidation statistics");
            return new CacheInvalidationStatistics();
        }
    }

    private static void UpdateStatistics(ref long counter, string pattern, DateTime startTime)
    {
        lock (_statsLock)
        {
            Interlocked.Increment(ref counter);
            Interlocked.Increment(ref _totalInvalidations);
            _lastInvalidation = DateTime.UtcNow;

            if (_invalidationsByPattern.ContainsKey(pattern))
            {
                _invalidationsByPattern[pattern]++;
            }
            else
            {
                _invalidationsByPattern[pattern] = 1;
            }
        }
    }
}