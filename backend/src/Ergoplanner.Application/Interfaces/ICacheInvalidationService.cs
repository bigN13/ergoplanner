namespace Ergoplanner.Application.Interfaces;

/// <summary>
/// Service for coordinating cache invalidation across the application
/// </summary>
public interface ICacheInvalidationService
{
    /// <summary>
    /// Invalidate cache when user data changes
    /// </summary>
    Task InvalidateUserDataAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Invalidate cache when project data changes
    /// </summary>
    Task InvalidateProjectDataAsync(Guid projectId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Invalidate cache when drawing data changes
    /// </summary>
    Task InvalidateDrawingDataAsync(Guid drawingId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Invalidate cache when organization data changes
    /// </summary>
    Task InvalidateOrganizationDataAsync(Guid organizationId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Invalidate cache when user joins or leaves a project
    /// </summary>
    Task InvalidateProjectMembershipAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Invalidate cache when drawing permissions change
    /// </summary>
    Task InvalidateDrawingPermissionsAsync(Guid drawingId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Invalidate symbol library cache
    /// </summary>
    Task InvalidateSymbolLibraryAsync(string standard, CancellationToken cancellationToken = default);

    /// <summary>
    /// Invalidate all symbol libraries
    /// </summary>
    Task InvalidateAllSymbolLibrariesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Invalidate cache for a specific pattern
    /// </summary>
    Task InvalidatePatternAsync(string pattern, CancellationToken cancellationToken = default);

    /// <summary>
    /// Schedule cache warming for frequently accessed data
    /// </summary>
    Task ScheduleCacheWarmupAsync(Guid? userId = null, Guid? projectId = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get cache invalidation statistics
    /// </summary>
    Task<CacheInvalidationStatistics> GetInvalidationStatisticsAsync(CancellationToken cancellationToken = default);
}

/// <summary>
/// Cache invalidation statistics
/// </summary>
public class CacheInvalidationStatistics
{
    public long TotalInvalidations { get; set; }
    public long UserDataInvalidations { get; set; }
    public long ProjectDataInvalidations { get; set; }
    public long DrawingDataInvalidations { get; set; }
    public long SymbolLibraryInvalidations { get; set; }
    public DateTime LastInvalidation { get; set; }
    public TimeSpan AverageInvalidationTime { get; set; }
    public Dictionary<string, long> InvalidationsByPattern { get; set; } = new();
}