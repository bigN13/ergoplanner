using System.Text.Json;

namespace Ergoplanner.Application.Interfaces;

/// <summary>
/// Generic cache service interface for Redis operations
/// </summary>
public interface ICacheService
{
    /// <summary>
    /// Get a cached value by key
    /// </summary>
    Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default) where T : class;

    /// <summary>
    /// Get a cached value by key with string result
    /// </summary>
    Task<string?> GetStringAsync(string key, CancellationToken cancellationToken = default);

    /// <summary>
    /// Set a value in cache with expiration
    /// </summary>
    Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default) where T : class;

    /// <summary>
    /// Set a string value in cache with expiration
    /// </summary>
    Task SetStringAsync(string key, string value, TimeSpan? expiration = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Remove a key from cache
    /// </summary>
    Task RemoveAsync(string key, CancellationToken cancellationToken = default);

    /// <summary>
    /// Remove multiple keys from cache
    /// </summary>
    Task RemoveAsync(IEnumerable<string> keys, CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if a key exists in cache
    /// </summary>
    Task<bool> ExistsAsync(string key, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get or set a value in cache
    /// </summary>
    Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> getItem, TimeSpan? expiration = null, CancellationToken cancellationToken = default) where T : class;

    /// <summary>
    /// Remove keys by pattern
    /// </summary>
    Task RemoveByPatternAsync(string pattern, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get cache statistics
    /// </summary>
    Task<CacheStatistics> GetStatisticsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Flush all cache data (use with caution)
    /// </summary>
    Task FlushAllAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Set expiration for an existing key
    /// </summary>
    Task ExpireAsync(string key, TimeSpan expiration, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get time to live for a key
    /// </summary>
    Task<TimeSpan?> GetTtlAsync(string key, CancellationToken cancellationToken = default);
}

/// <summary>
/// Cache statistics model
/// </summary>
public class CacheStatistics
{
    public long ConnectedClients { get; set; }
    public long UsedMemory { get; set; }
    public long MaxMemory { get; set; }
    public double MemoryUsagePercentage => MaxMemory > 0 ? (double)UsedMemory / MaxMemory * 100 : 0;
    public long KeyspaceHits { get; set; }
    public long KeyspaceMisses { get; set; }
    public double HitRatio => KeyspaceHits + KeyspaceMisses > 0 ? (double)KeyspaceHits / (KeyspaceHits + KeyspaceMisses) * 100 : 0;
    public TimeSpan Uptime { get; set; }
    public string Version { get; set; } = string.Empty;
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}