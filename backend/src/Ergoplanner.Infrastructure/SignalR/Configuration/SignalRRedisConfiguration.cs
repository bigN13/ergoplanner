using System;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Ergoplanner.Infrastructure.SignalR.Configuration
{
    /// <summary>
    /// Configuration for SignalR Redis backplane
    /// </summary>
    public static class SignalRRedisConfiguration
    {
        /// <summary>
        /// Configures SignalR with Redis backplane for scaling across multiple instances
        /// </summary>
        public static IServiceCollection AddSignalRWithRedis(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            var redisConnectionString = configuration.GetConnectionString("Redis");

            if (string.IsNullOrEmpty(redisConnectionString))
            {
                throw new InvalidOperationException("Redis connection string is required for SignalR backplane");
            }

            // Add SignalR with Redis backplane
            services.AddSignalR(options =>
            {
                // Global hub options
                options.EnableDetailedErrors = configuration.GetValue<bool>("SignalR:EnableDetailedErrors", false);
                options.KeepAliveInterval = TimeSpan.FromSeconds(configuration.GetValue<int>("SignalR:KeepAliveIntervalSeconds", 15));
                options.ClientTimeoutInterval = TimeSpan.FromSeconds(configuration.GetValue<int>("SignalR:ClientTimeoutIntervalSeconds", 30));
                options.HandshakeTimeout = TimeSpan.FromSeconds(configuration.GetValue<int>("SignalR:HandshakeTimeoutSeconds", 15));
                options.MaximumReceiveMessageSize = configuration.GetValue<long?>("SignalR:MaximumReceiveMessageSize") ?? 32 * 1024; // 32KB
                options.StreamBufferCapacity = configuration.GetValue<int>("SignalR:StreamBufferCapacity", 10);
                options.MaximumParallelInvocationsPerClient = configuration.GetValue<int>("SignalR:MaximumParallelInvocationsPerClient", 1);
            })
            .AddStackExchangeRedis(redisConnectionString, options =>
            {
                // Redis-specific options
                options.Configuration.ChannelPrefix = RedisChannel.Literal("ergoplanner_signalr");
                options.Configuration.ClientName = "Ergoplanner.SignalR";

                // Connection resilience
                options.Configuration.ConnectRetry = 3;
                options.Configuration.ConnectTimeout = 10000; // 10 seconds
                options.Configuration.SyncTimeout = 5000; // 5 seconds
                options.Configuration.AsyncTimeout = 5000; // 5 seconds

                // Keep alive
                options.Configuration.KeepAlive = 180; // 3 minutes

                // Abort on connect fail
                options.Configuration.AbortOnConnectFail = false;
            });

            return services;
        }

        /// <summary>
        /// Configures Redis connection with health checks
        /// </summary>
        public static IServiceCollection AddRedisHealthChecks(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            var redisConnectionString = configuration.GetConnectionString("Redis");

            if (!string.IsNullOrEmpty(redisConnectionString))
            {
                services.AddHealthChecks()
                    .AddRedis(redisConnectionString, name: "redis-signalr", tags: new[] { "signalr", "redis" });
            }

            return services;
        }
    }

    /// <summary>
    /// Configuration options for SignalR
    /// </summary>
    public class SignalROptions
    {
        public const string SectionName = "SignalR";

        public bool EnableDetailedErrors { get; set; } = false;
        public int KeepAliveIntervalSeconds { get; set; } = 15;
        public int ClientTimeoutIntervalSeconds { get; set; } = 30;
        public int HandshakeTimeoutSeconds { get; set; } = 15;
        public long? MaximumReceiveMessageSize { get; set; } = 32 * 1024; // 32KB
        public int StreamBufferCapacity { get; set; } = 10;
        public int MaximumParallelInvocationsPerClient { get; set; } = 1;
        public bool EnableCors { get; set; } = true;
        public string[] AllowedOrigins { get; set; } = Array.Empty<string>();
    }

    /// <summary>
    /// Redis backplane health check
    /// </summary>
    public class SignalRRedisHealthCheck : IDisposable
    {
        private readonly IConnectionMultiplexer _redis;
        private readonly ILogger<SignalRRedisHealthCheck> _logger;

        public SignalRRedisHealthCheck(
            IConnectionMultiplexer redis,
            ILogger<SignalRRedisHealthCheck> logger)
        {
            _redis = redis;
            _logger = logger;
        }

        public async Task<bool> CheckHealthAsync()
        {
            try
            {
                var database = _redis.GetDatabase();
                var endPoints = _redis.GetEndPoints();

                if (endPoints.Length == 0)
                {
                    _logger.LogWarning("No Redis endpoints available");
                    return false;
                }

                // Simple ping test
                var pingResult = await database.PingAsync();
                var isHealthy = pingResult.TotalMilliseconds < 1000; // Less than 1 second

                if (!isHealthy)
                {
                    _logger.LogWarning("Redis ping took {PingTime}ms, which exceeds the healthy threshold",
                        pingResult.TotalMilliseconds);
                }

                return isHealthy;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Redis health check failed");
                return false;
            }
        }

        public void Dispose()
        {
            _redis?.Dispose();
        }
    }
}