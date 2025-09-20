using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.SignalR;
using StackExchange.Redis;

namespace Ergoplanner.Infrastructure.HealthChecks;

public class SignalRHealthCheck : IHealthCheck
{
    private readonly IConnectionMultiplexer _connectionMultiplexer;
    private readonly ILogger<SignalRHealthCheck> _logger;

    public SignalRHealthCheck(IConnectionMultiplexer connectionMultiplexer, ILogger<SignalRHealthCheck> logger)
    {
        _connectionMultiplexer = connectionMultiplexer;
        _logger = logger;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            var startTime = DateTime.UtcNow;

            // Check Redis connection (SignalR backplane dependency)
            var database = _connectionMultiplexer.GetDatabase();
            var pingResult = await database.PingAsync();

            // Test SignalR backplane functionality by checking Redis pub/sub
            var subscriber = _connectionMultiplexer.GetSubscriber();
            var testChannel = "signalr:test_channel";
            var testMessage = "health_check_message";

            var messageReceived = false;
            var tcs = new TaskCompletionSource<bool>();

            // Subscribe to test channel
            await subscriber.SubscribeAsync(testChannel, (channel, message) =>
            {
                if (message == testMessage)
                {
                    messageReceived = true;
                    tcs.SetResult(true);
                }
            });

            // Publish test message
            await subscriber.PublishAsync(testChannel, testMessage);

            // Wait for message or timeout
            var timeoutTask = Task.Delay(TimeSpan.FromSeconds(5), cancellationToken);
            var completedTask = await Task.WhenAny(tcs.Task, timeoutTask);

            // Unsubscribe from test channel
            await subscriber.UnsubscribeAsync(testChannel);

            var duration = DateTime.UtcNow - startTime;

            var data = new Dictionary<string, object>
            {
                ["redis_ping_ms"] = pingResult.TotalMilliseconds,
                ["total_response_time_ms"] = duration.TotalMilliseconds,
                ["redis_connected"] = _connectionMultiplexer.IsConnected,
                ["pub_sub_test_success"] = messageReceived,
                ["signalr_backplane_status"] = messageReceived ? "Healthy" : "Degraded"
            };

            if (!messageReceived)
            {
                _logger.LogWarning("SignalR health check: Pub/Sub test failed or timed out");
                return HealthCheckResult.Degraded("SignalR backplane pub/sub functionality is not working correctly", data: data);
            }

            _logger.LogInformation("SignalR health check completed successfully in {Duration}ms", duration.TotalMilliseconds);

            return duration.TotalMilliseconds > 2000
                ? HealthCheckResult.Degraded("SignalR backplane is responding slowly", data: data)
                : HealthCheckResult.Healthy("SignalR is healthy", data: data);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SignalR health check failed");

            var data = new Dictionary<string, object>
            {
                ["error"] = ex.Message,
                ["exception_type"] = ex.GetType().Name,
                ["redis_connected"] = _connectionMultiplexer?.IsConnected ?? false
            };

            return HealthCheckResult.Unhealthy("SignalR is not accessible", ex, data);
        }
    }
}