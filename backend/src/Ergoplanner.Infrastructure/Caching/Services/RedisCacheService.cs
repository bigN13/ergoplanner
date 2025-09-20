using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;
using Ergoplanner.Application.Interfaces;
using Ergoplanner.Infrastructure.Caching.Configuration;
using Ergoplanner.Infrastructure.Caching.Common;

namespace Ergoplanner.Infrastructure.Caching.Services;

/// <summary>
/// Redis-based implementation of ICacheService
/// </summary>
public class RedisCacheService : ICacheService, IDisposable
{
    private readonly IConnectionMultiplexer _connectionMultiplexer;
    private readonly IDatabase _database;
    private readonly ILogger<RedisCacheService> _logger;
    private readonly RedisConfiguration _configuration;
    private readonly JsonSerializerOptions _jsonOptions;
    private bool _disposed = false;

    public RedisCacheService(
        IConnectionMultiplexer connectionMultiplexer,
        IOptions<RedisConfiguration> configuration,
        ILogger<RedisCacheService> logger)
    {
        _connectionMultiplexer = connectionMultiplexer ?? throw new ArgumentNullException(nameof(connectionMultiplexer));
        _configuration = configuration.Value ?? throw new ArgumentNullException(nameof(configuration));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        _database = _connectionMultiplexer.GetDatabase(_configuration.DefaultDatabase);

        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        };
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default) where T : class
    {
        try
        {
            cancellationToken.ThrowIfCancellationRequested();

            var value = await _database.StringGetAsync(key);
            if (!value.HasValue)
            {
                _logger.LogDebug("Cache miss for key: {Key}", key);
                return null;
            }

            var result = JsonSerializer.Deserialize<T>(value!, _jsonOptions);
            _logger.LogDebug("Cache hit for key: {Key}", key);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cached value for key: {Key}", key);
            return null; // Graceful fallback
        }
    }

    public async Task<string?> GetStringAsync(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            cancellationToken.ThrowIfCancellationRequested();

            var value = await _database.StringGetAsync(key);
            if (!value.HasValue)
            {
                _logger.LogDebug("Cache miss for key: {Key}", key);
                return null;
            }

            _logger.LogDebug("Cache hit for key: {Key}", key);
            return value!;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cached string value for key: {Key}", key);
            return null; // Graceful fallback
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default) where T : class
    {
        try
        {
            cancellationToken.ThrowIfCancellationRequested();

            var serializedValue = JsonSerializer.Serialize(value, _jsonOptions);
            await _database.StringSetAsync(key, serializedValue, expiration);

            _logger.LogDebug("Cached value for key: {Key} with expiration: {Expiration}", key, expiration);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting cached value for key: {Key}", key);
            // Don't throw - cache operations should be non-blocking
        }
    }

    public async Task SetStringAsync(string key, string value, TimeSpan? expiration = null, CancellationToken cancellationToken = default)
    {
        try
        {
            cancellationToken.ThrowIfCancellationRequested();

            await _database.StringSetAsync(key, value, expiration);

            _logger.LogDebug("Cached string value for key: {Key} with expiration: {Expiration}", key, expiration);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting cached string value for key: {Key}", key);
            // Don't throw - cache operations should be non-blocking
        }
    }

    public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            cancellationToken.ThrowIfCancellationRequested();

            await _database.KeyDeleteAsync(key);
            _logger.LogDebug("Removed cached value for key: {Key}", key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing cached value for key: {Key}", key);
        }
    }

    public async Task RemoveAsync(IEnumerable<string> keys, CancellationToken cancellationToken = default)
    {
        try
        {
            cancellationToken.ThrowIfCancellationRequested();

            var redisKeys = keys.Select(k => (RedisKey)k).ToArray();
            if (redisKeys.Length > 0)
            {
                await _database.KeyDeleteAsync(redisKeys);
                _logger.LogDebug("Removed {Count} cached values", redisKeys.Length);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing multiple cached values");
        }
    }

    public async Task<bool> ExistsAsync(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            cancellationToken.ThrowIfCancellationRequested();

            return await _database.KeyExistsAsync(key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if key exists: {Key}", key);
            return false;
        }
    }

    public async Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> getItem, TimeSpan? expiration = null, CancellationToken cancellationToken = default) where T : class
    {
        try
        {
            cancellationToken.ThrowIfCancellationRequested();

            // Try to get from cache first
            var cachedValue = await GetAsync<T>(key, cancellationToken);
            if (cachedValue != null)
            {
                return cachedValue;
            }

            // Get from source and cache
            var value = await getItem();
            if (value != null)
            {
                await SetAsync(key, value, expiration, cancellationToken);
            }

            return value;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GetOrSetAsync for key: {Key}", key);

            // Fallback to source if cache fails
            return await getItem();
        }
    }

    public async Task RemoveByPatternAsync(string pattern, CancellationToken cancellationToken = default)
    {
        try
        {
            cancellationToken.ThrowIfCancellationRequested();

            var server = _connectionMultiplexer.GetServer(_connectionMultiplexer.GetEndPoints().First());

            await foreach (var key in server.KeysAsync(database: _configuration.DefaultDatabase, pattern: pattern))
            {
                await _database.KeyDeleteAsync(key);
            }

            _logger.LogDebug("Removed cached values matching pattern: {Pattern}", pattern);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing cached values by pattern: {Pattern}", pattern);
        }
    }

    public async Task<CacheStatistics> GetStatisticsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            cancellationToken.ThrowIfCancellationRequested();

            var server = _connectionMultiplexer.GetServer(_connectionMultiplexer.GetEndPoints().First());
            var info = await server.InfoAsync();

            var stats = new CacheStatistics();

            foreach (var group in info)
            {
                foreach (var item in group)
                {
                    switch (item.Key.ToLowerInvariant())
                    {
                        case "connected_clients":
                            _ = long.TryParse(item.Value, out var connectedClients);
                            stats.ConnectedClients = connectedClients;
                            break;
                        case "used_memory":
                            _ = long.TryParse(item.Value, out var usedMemory);
                            stats.UsedMemory = usedMemory;
                            break;
                        case "maxmemory":
                            _ = long.TryParse(item.Value, out var maxMemory);
                            stats.MaxMemory = maxMemory;
                            break;
                        case "keyspace_hits":
                            _ = long.TryParse(item.Value, out var keyspaceHits);
                            stats.KeyspaceHits = keyspaceHits;
                            break;
                        case "keyspace_misses":
                            _ = long.TryParse(item.Value, out var keyspaceMisses);
                            stats.KeyspaceMisses = keyspaceMisses;
                            break;
                        case "uptime_in_seconds":
                            _ = long.TryParse(item.Value, out var uptimeSeconds);
                            stats.Uptime = TimeSpan.FromSeconds(uptimeSeconds);
                            break;
                        case "redis_version":
                            stats.Version = item.Value;
                            break;
                    }
                }
            }

            return stats;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cache statistics");
            return new CacheStatistics();
        }
    }

    public async Task FlushAllAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            cancellationToken.ThrowIfCancellationRequested();

            var server = _connectionMultiplexer.GetServer(_connectionMultiplexer.GetEndPoints().First());
            await server.FlushDatabaseAsync(_configuration.DefaultDatabase);

            _logger.LogWarning("Flushed all cache data from database {Database}", _configuration.DefaultDatabase);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error flushing cache");
        }
    }

    public async Task ExpireAsync(string key, TimeSpan expiration, CancellationToken cancellationToken = default)
    {
        try
        {
            cancellationToken.ThrowIfCancellationRequested();

            await _database.KeyExpireAsync(key, expiration);
            _logger.LogDebug("Set expiration for key: {Key} to {Expiration}", key, expiration);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting expiration for key: {Key}", key);
        }
    }

    public async Task<TimeSpan?> GetTtlAsync(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            cancellationToken.ThrowIfCancellationRequested();

            return await _database.KeyTimeToLiveAsync(key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting TTL for key: {Key}", key);
            return null;
        }
    }

    public void Dispose()
    {
        if (!_disposed)
        {
            // ConnectionMultiplexer is managed by DI container
            // We don't dispose it here as it may be shared
            _disposed = true;
        }
    }
}