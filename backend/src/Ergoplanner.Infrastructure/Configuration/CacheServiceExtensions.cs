using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using StackExchange.Redis;
using Ergoplanner.Application.Interfaces;
using Ergoplanner.Infrastructure.Caching.Configuration;
using Ergoplanner.Infrastructure.Caching.Services;

namespace Ergoplanner.Infrastructure.Configuration;

/// <summary>
/// Extension methods for configuring Redis cache services
/// </summary>
public static class CacheServiceExtensions
{
    /// <summary>
    /// Add Redis cache services to the service collection
    /// </summary>
    public static IServiceCollection AddRedisCaching(this IServiceCollection services, IConfiguration configuration)
    {
        // Configure Redis options
        services.Configure<RedisConfiguration>(configuration.GetSection(RedisConfiguration.Section));

        var redisConfig = configuration.GetSection(RedisConfiguration.Section).Get<RedisConfiguration>()
            ?? throw new InvalidOperationException("Redis configuration is missing");

        // Add Redis connection multiplexer
        services.AddSingleton<IConnectionMultiplexer>(serviceProvider =>
        {
            var connectionString = redisConfig.ConnectionString;

            var configurationOptions = ConfigurationOptions.Parse(connectionString);
            configurationOptions.ConnectTimeout = redisConfig.ConnectTimeoutMs;
            configurationOptions.CommandMap = CommandMap.Create(new HashSet<string>
            {
                // Disable potentially dangerous commands in production
                "FLUSHDB", "FLUSHALL", "KEYS", "CONFIG"
            }, available: false);

            if (!string.IsNullOrEmpty(redisConfig.Password))
            {
                configurationOptions.Password = redisConfig.Password;
            }

            configurationOptions.Ssl = redisConfig.UseSsl;
            configurationOptions.AbortOnConnectFail = redisConfig.AbortOnConnectFail;
            configurationOptions.ConnectRetry = redisConfig.ConnectRetry;

            return ConnectionMultiplexer.Connect(configurationOptions);
        });

        // Add distributed cache using Redis
        services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = redisConfig.ConnectionString;
            options.InstanceName = redisConfig.InstanceName;
        });

        // Register cache services
        services.AddScoped<ICacheService, RedisCacheService>();
        services.AddScoped<IDistributedCacheService, DistributedCacheService>();
        services.AddScoped<IProjectCacheService, ProjectCacheService>();
        services.AddScoped<ICacheInvalidationService, CacheInvalidationService>();

        // Add Redis health checks
        services.AddHealthChecks()
            .AddRedis(redisConfig.ConnectionString, name: "redis", tags: new[] { "cache", "infrastructure" });

        return services;
    }

    /// <summary>
    /// Add cache-related health checks
    /// </summary>
    public static IServiceCollection AddCacheHealthChecks(this IServiceCollection services, IConfiguration configuration)
    {
        var redisConfig = configuration.GetSection(RedisConfiguration.Section).Get<RedisConfiguration>();

        if (redisConfig != null)
        {
            services.AddHealthChecks()
                .AddCheck<RedisHealthCheck>("redis_detailed", HealthStatus.Degraded, new[] { "cache", "redis" });
        }

        return services;
    }
}

/// <summary>
/// Custom Redis health check with detailed status information
/// </summary>
public class RedisHealthCheck : IHealthCheck
{
    private readonly IConnectionMultiplexer _connectionMultiplexer;
    private readonly ICacheService _cacheService;

    public RedisHealthCheck(IConnectionMultiplexer connectionMultiplexer, ICacheService cacheService)
    {
        _connectionMultiplexer = connectionMultiplexer;
        _cacheService = cacheService;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            // Check connection
            if (!_connectionMultiplexer.IsConnected)
            {
                return HealthCheckResult.Unhealthy("Redis connection is not established");
            }

            // Test basic operations
            var testKey = "health_check_" + Guid.NewGuid().ToString("N")[..8];
            var testValue = DateTime.UtcNow.ToString("O");

            await _cacheService.SetStringAsync(testKey, testValue, TimeSpan.FromSeconds(10), cancellationToken);
            var retrievedValue = await _cacheService.GetStringAsync(testKey, cancellationToken);
            await _cacheService.RemoveAsync(testKey, cancellationToken);

            if (retrievedValue != testValue)
            {
                return HealthCheckResult.Degraded("Redis read/write test failed");
            }

            // Get cache statistics
            var stats = await _cacheService.GetStatisticsAsync(cancellationToken);

            var data = new Dictionary<string, object>
            {
                ["connected_clients"] = stats.ConnectedClients,
                ["used_memory"] = stats.UsedMemory,
                ["memory_usage_percentage"] = stats.MemoryUsagePercentage,
                ["hit_ratio"] = stats.HitRatio,
                ["uptime"] = stats.Uptime.ToString(),
                ["version"] = stats.Version
            };

            // Check if memory usage is too high
            if (stats.MemoryUsagePercentage > 90)
            {
                return HealthCheckResult.Degraded("Redis memory usage is high", data: data);
            }

            return HealthCheckResult.Healthy("Redis is working properly", data);
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Redis health check failed", ex);
        }
    }
}