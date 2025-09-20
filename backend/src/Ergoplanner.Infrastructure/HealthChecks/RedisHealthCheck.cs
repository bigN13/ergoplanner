using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Ergoplanner.Infrastructure.HealthChecks;

public class RedisHealthCheck : IHealthCheck
{
    private readonly IConnectionMultiplexer _connectionMultiplexer;
    private readonly ILogger<RedisHealthCheck> _logger;

    public RedisHealthCheck(IConnectionMultiplexer connectionMultiplexer, ILogger<RedisHealthCheck> logger)
    {
        _connectionMultiplexer = connectionMultiplexer;
        _logger = logger;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            var startTime = DateTime.UtcNow;

            // Get database instance
            var database = _connectionMultiplexer.GetDatabase();

            // Test Redis connection with a ping
            var pingResult = await database.PingAsync();

            // Test basic set/get operations
            var testKey = $"health_check_{Guid.NewGuid()}";
            var testValue = "health_check_value";

            await database.StringSetAsync(testKey, testValue, TimeSpan.FromMinutes(1));
            var retrievedValue = await database.StringGetAsync(testKey);
            await database.KeyDeleteAsync(testKey);

            var duration = DateTime.UtcNow - startTime;

            var data = new Dictionary<string, object>
            {
                ["ping_time_ms"] = pingResult.TotalMilliseconds,
                ["total_response_time_ms"] = duration.TotalMilliseconds,
                ["is_connected"] = _connectionMultiplexer.IsConnected,
                ["configuration"] = _connectionMultiplexer.Configuration,
                ["test_operation_success"] = retrievedValue == testValue
            };

            if (retrievedValue != testValue)
            {
                _logger.LogWarning("Redis health check: Set/Get operation failed");
                return HealthCheckResult.Degraded("Redis set/get operations are not working correctly", data: data);
            }

            _logger.LogInformation("Redis health check completed successfully in {Duration}ms", duration.TotalMilliseconds);

            return duration.TotalMilliseconds > 1000
                ? HealthCheckResult.Degraded("Redis is responding slowly", data: data)
                : HealthCheckResult.Healthy("Redis is healthy", data: data);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Redis health check failed");

            var data = new Dictionary<string, object>
            {
                ["error"] = ex.Message,
                ["exception_type"] = ex.GetType().Name,
                ["is_connected"] = _connectionMultiplexer?.IsConnected ?? false
            };

            return HealthCheckResult.Unhealthy("Redis is not accessible", ex, data);
        }
    }
}