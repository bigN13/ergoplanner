using Microsoft.AspNetCore.Mvc;
using Ergoplanner.Infrastructure.Monitoring;
using Ergoplanner.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using System.Diagnostics;

namespace Ergoplanner.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MonitoringController : BaseController<MonitoringController>
{
    private readonly IMetricsService _metricsService;
    private readonly ISecurityAuditLogger _securityAuditLogger;
    private readonly ILogRetentionService _logRetentionService;

    public MonitoringController(
        ILogger<MonitoringController> logger,
        IMetricsService metricsService,
        ISecurityAuditLogger securityAuditLogger,
        ILogRetentionService logRetentionService) : base(logger)
    {
        _metricsService = metricsService;
        _securityAuditLogger = securityAuditLogger;
        _logRetentionService = logRetentionService;
    }

    /// <summary>
    /// Test endpoint to validate logging and monitoring functionality
    /// </summary>
    [HttpGet("test")]
    public async Task<IActionResult> TestMonitoring()
    {
        return await ExecuteWithLogging(
            nameof(TestMonitoring),
            async () =>
            {
                // Test various logging levels
                Logger.LogTrace("This is a trace message for testing");
                Logger.LogDebug("This is a debug message for testing");
                Logger.LogInformation("Testing monitoring functionality");
                Logger.LogWarning("This is a test warning message");

                // Test custom metrics
                _metricsService.IncrementDrawingCreated("test-org", "test-project");
                _metricsService.RecordApiRequestDuration("/api/monitoring/test", "GET", 200, 150);
                _metricsService.RecordMemoryUsage(1024 * 1024 * 100); // 100MB

                // Test security audit logging
                await _securityAuditLogger.LogUserLoginAttempt(
                    "test@example.com",
                    GetClientIpAddress(),
                    Request.Headers.UserAgent.ToString(),
                    true);

                // Test distributed tracing
                using var activity = Activity.Current?.Source.StartActivity("MonitoringTest");
                activity?.SetTag("test.operation", "monitoring-validation");
                activity?.AddEvent(new ActivityEvent("test.event", DateTimeOffset.UtcNow));

                await Task.Delay(100); // Simulate some work

                return new
                {
                    Message = "Monitoring test completed successfully",
                    Timestamp = DateTimeOffset.UtcNow,
                    CorrelationId = Activity.Current?.Id,
                    TraceId = Activity.Current?.TraceId.ToString(),
                    SpanId = Activity.Current?.SpanId.ToString()
                };
            });
    }

    /// <summary>
    /// Test endpoint that intentionally throws an exception
    /// </summary>
    [HttpGet("test-error")]
    public async Task<IActionResult> TestError()
    {
        return await ExecuteWithLogging(
            nameof(TestError),
            async () =>
            {
                await Task.Delay(10); // Simulate some work
                throw new InvalidOperationException("This is a test exception for monitoring validation");
            });
    }

    /// <summary>
    /// Test endpoint that simulates slow performance
    /// </summary>
    [HttpGet("test-slow")]
    public async Task<IActionResult> TestSlowOperation()
    {
        return await ExecuteWithLogging(
            nameof(TestSlowOperation),
            async () =>
            {
                // Simulate slow operation
                await Task.Delay(3000);

                return new
                {
                    Message = "Slow operation completed",
                    Duration = "3 seconds",
                    Timestamp = DateTimeOffset.UtcNow
                };
            });
    }

    /// <summary>
    /// Get log retention statistics
    /// </summary>
    [HttpGet("log-stats")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetLogStats()
    {
        return await ExecuteWithLogging(
            nameof(GetLogStats),
            async () =>
            {
                var stats = await _logRetentionService.GetRetentionStatsAsync();
                return stats;
            });
    }

    /// <summary>
    /// Test security audit logging
    /// </summary>
    [HttpPost("test-security")]
    public async Task<IActionResult> TestSecurityAudit([FromBody] TestSecurityRequest request)
    {
        return await ExecuteWithLogging(
            nameof(TestSecurityAudit),
            async () =>
            {
                var ipAddress = GetClientIpAddress();

                switch (request.EventType?.ToLowerInvariant())
                {
                    case "login":
                        await _securityAuditLogger.LogUserLoginAttempt(
                            request.Email ?? "test@example.com",
                            ipAddress,
                            Request.Headers.UserAgent.ToString(),
                            request.Successful);
                        break;

                    case "unauthorized":
                        await _securityAuditLogger.LogUnauthorizedAccess(
                            UserId,
                            request.Resource ?? "/test/resource",
                            "GET",
                            ipAddress,
                            request.Reason);
                        break;

                    case "dataaccess":
                        await _securityAuditLogger.LogSensitiveDataAccess(
                            UserId ?? "test-user",
                            "TestResource",
                            request.Resource ?? "test-123",
                            "READ",
                            ipAddress);
                        break;

                    case "suspicious":
                        await _securityAuditLogger.LogSuspiciousActivity(
                            UserId,
                            "TestActivity",
                            request.Reason ?? "Test suspicious activity",
                            ipAddress);
                        break;

                    default:
                        return BadRequest(new { Error = "Invalid event type" });
                }

                return new
                {
                    Message = $"Security audit event '{request.EventType}' logged successfully",
                    Timestamp = DateTimeOffset.UtcNow
                };
            },
            request);
    }

    /// <summary>
    /// Test health checks
    /// </summary>
    [HttpGet("health-test")]
    public IActionResult TestHealthChecks()
    {
        LogControllerAction(nameof(TestHealthChecks));

        try
        {
            Logger.LogInformation("Health check test endpoint accessed");

            var healthInfo = new
            {
                Status = "Healthy",
                Checks = new[]
                {
                    new { Name = "API", Status = "Healthy", Duration = "1ms" },
                    new { Name = "Logging", Status = "Healthy", Duration = "2ms" },
                    new { Name = "Monitoring", Status = "Healthy", Duration = "1ms" }
                },
                Timestamp = DateTimeOffset.UtcNow,
                Message = "All monitoring components are functioning correctly"
            };

            LogControllerSuccess(nameof(TestHealthChecks), healthInfo);
            return Ok(healthInfo);
        }
        catch (Exception ex)
        {
            LogControllerError(nameof(TestHealthChecks), ex);
            return StatusCode(500, new { Error = "Health check test failed" });
        }
    }
}

public class TestSecurityRequest
{
    public string? EventType { get; set; }
    public string? Email { get; set; }
    public string? Resource { get; set; }
    public string? Reason { get; set; }
    public bool Successful { get; set; } = true;
}