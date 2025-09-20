using Ergoplanner.Infrastructure.Services;
using System.Security.Claims;
using System.Security;

namespace Ergoplanner.API.Middleware;

public class SecurityAuditMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ISecurityAuditLogger _securityAuditLogger;
    private readonly ILogger<SecurityAuditMiddleware> _logger;

    // Track failed authorization attempts per user
    private static readonly Dictionary<string, int> _failedAuthAttempts = new();
    private static readonly Dictionary<string, DateTime> _lastAttemptTime = new();

    public SecurityAuditMiddleware(
        RequestDelegate next,
        ISecurityAuditLogger securityAuditLogger,
        ILogger<SecurityAuditMiddleware> logger)
    {
        _next = next;
        _securityAuditLogger = securityAuditLogger;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var ipAddress = GetClientIpAddress(context);
        var userAgent = context.Request.Headers.UserAgent.ToString();
        var path = context.Request.Path.Value ?? string.Empty;
        var method = context.Request.Method;

        // Skip audit logging for health checks and static content
        if (ShouldSkipAudit(path))
        {
            await _next(context);
            return;
        }

        try
        {
            await _next(context);

            // Log successful operations for sensitive endpoints
            await LogSuccessfulOperations(context, ipAddress);
        }
        catch (UnauthorizedAccessException ex)
        {
            var userId = context.User?.Identity?.Name;
            await _securityAuditLogger.LogUnauthorizedAccess(userId, path, method, ipAddress, ex.Message);

            // Track multiple failed authorization attempts
            await TrackFailedAuthorizationAttempts(userId, path, ipAddress);

            throw;
        }
        catch (Exception ex)
        {
            // Log any other security-relevant exceptions
            if (IsSecurityRelevantException(ex))
            {
                var userId = context.User?.Identity?.Name;
                await _securityAuditLogger.LogSuspiciousActivity(
                    userId,
                    "UnexpectedException",
                    ex.Message,
                    ipAddress,
                    new Dictionary<string, object>
                    {
                        ["ExceptionType"] = ex.GetType().Name,
                        ["RequestPath"] = path,
                        ["RequestMethod"] = method
                    });
            }

            throw;
        }
    }

    private async Task LogSuccessfulOperations(HttpContext context, string ipAddress)
    {
        var path = context.Request.Path.Value ?? string.Empty;
        var method = context.Request.Method;
        var userId = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userEmail = context.User?.FindFirst(ClaimTypes.Email)?.Value;

        if (string.IsNullOrEmpty(userId))
            return;

        // Log sensitive data access
        if (IsSensitiveDataEndpoint(path, method))
        {
            var (resourceType, resourceId) = ExtractResourceInfo(path);
            await _securityAuditLogger.LogSensitiveDataAccess(
                userId, resourceType, resourceId, method, ipAddress);
        }

        // Log data exports
        if (IsDataExportEndpoint(path, method))
        {
            var dataType = ExtractDataTypeFromPath(path);
            // Note: Record count would need to be extracted from response or logged elsewhere
            await _securityAuditLogger.LogDataExport(userId, dataType, 0, ipAddress);
        }

        // Log data deletions
        if (method == "DELETE" && IsDataEndpoint(path))
        {
            var (resourceType, resourceId) = ExtractResourceInfo(path);
            await _securityAuditLogger.LogDataDeletion(userId, resourceType, resourceId, ipAddress);
        }

        // Log system configuration changes
        if (IsSystemConfigEndpoint(path, method))
        {
            // Note: Actual configuration details would need to be extracted from request/response
            await _securityAuditLogger.LogSystemConfigurationChange(
                userId, "SystemConfiguration", null, "Updated", ipAddress);
        }
    }

    private async Task TrackFailedAuthorizationAttempts(string? userId, string resource, string ipAddress)
    {
        if (string.IsNullOrEmpty(userId))
            return;

        var key = $"{userId}:{resource}";
        var now = DateTime.UtcNow;

        lock (_failedAuthAttempts)
        {
            if (_lastAttemptTime.TryGetValue(key, out var lastAttempt))
            {
                // Reset counter if last attempt was more than 15 minutes ago
                if (now - lastAttempt > TimeSpan.FromMinutes(15))
                {
                    _failedAuthAttempts[key] = 1;
                }
                else
                {
                    _failedAuthAttempts[key] = _failedAuthAttempts.GetValueOrDefault(key, 0) + 1;
                }
            }
            else
            {
                _failedAuthAttempts[key] = 1;
            }

            _lastAttemptTime[key] = now;

            var attemptCount = _failedAuthAttempts[key];

            // Log if multiple failed attempts detected
            if (attemptCount >= 3)
            {
                _ = Task.Run(async () =>
                {
                    await _securityAuditLogger.LogMultipleFailedAuthorizations(
                        userId, resource, attemptCount, ipAddress);
                });
            }
        }
    }

    private static string GetClientIpAddress(HttpContext context)
    {
        // Check for X-Forwarded-For header (load balancer/proxy)
        var xForwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(xForwardedFor))
        {
            return xForwardedFor.Split(',')[0].Trim();
        }

        // Check for X-Real-IP header
        var xRealIp = context.Request.Headers["X-Real-IP"].FirstOrDefault();
        if (!string.IsNullOrEmpty(xRealIp))
        {
            return xRealIp;
        }

        // Fall back to remote IP address
        return context.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
    }

    private static bool ShouldSkipAudit(string path)
    {
        var lowerPath = path.ToLowerInvariant();
        return lowerPath.StartsWith("/health") ||
               lowerPath.StartsWith("/metrics") ||
               lowerPath.StartsWith("/swagger") ||
               lowerPath.Contains(".css") ||
               lowerPath.Contains(".js") ||
               lowerPath.Contains(".map") ||
               lowerPath.Contains(".ico") ||
               lowerPath.Contains(".png") ||
               lowerPath.Contains(".jpg") ||
               lowerPath.Contains(".jpeg") ||
               lowerPath.Contains(".gif") ||
               lowerPath.Contains(".svg");
    }

    private static bool IsSensitiveDataEndpoint(string path, string method)
    {
        var lowerPath = path.ToLowerInvariant();
        return (method == "GET" || method == "POST") && (
            lowerPath.Contains("/users") ||
            lowerPath.Contains("/organizations") ||
            lowerPath.Contains("/projects") ||
            lowerPath.Contains("/drawings"));
    }

    private static bool IsDataExportEndpoint(string path, string method)
    {
        var lowerPath = path.ToLowerInvariant();
        return method == "GET" && (
            lowerPath.Contains("/export") ||
            lowerPath.Contains("/download") ||
            lowerPath.EndsWith(".csv") ||
            lowerPath.EndsWith(".xlsx") ||
            lowerPath.EndsWith(".pdf"));
    }

    private static bool IsDataEndpoint(string path)
    {
        var lowerPath = path.ToLowerInvariant();
        return lowerPath.Contains("/api/") && (
            lowerPath.Contains("/users") ||
            lowerPath.Contains("/organizations") ||
            lowerPath.Contains("/projects") ||
            lowerPath.Contains("/drawings") ||
            lowerPath.Contains("/components") ||
            lowerPath.Contains("/symbols"));
    }

    private static bool IsSystemConfigEndpoint(string path, string method)
    {
        var lowerPath = path.ToLowerInvariant();
        return (method == "PUT" || method == "PATCH" || method == "POST") && (
            lowerPath.Contains("/settings") ||
            lowerPath.Contains("/configuration") ||
            lowerPath.Contains("/admin"));
    }

    private static (string resourceType, string resourceId) ExtractResourceInfo(string path)
    {
        var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);

        if (segments.Length >= 3)
        {
            var resourceType = segments[1]; // Assuming /api/resourcetype/id format
            var resourceId = segments[2];
            return (resourceType, resourceId);
        }

        return ("Unknown", "Unknown");
    }

    private static string ExtractDataTypeFromPath(string path)
    {
        var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
        return segments.Length >= 2 ? segments[1] : "Unknown";
    }

    private static bool IsSecurityRelevantException(Exception exception)
    {
        return exception is UnauthorizedAccessException ||
               exception is SecurityException ||
               exception is ArgumentException ||
               exception.Message.Contains("security", StringComparison.OrdinalIgnoreCase) ||
               exception.Message.Contains("unauthorized", StringComparison.OrdinalIgnoreCase) ||
               exception.Message.Contains("forbidden", StringComparison.OrdinalIgnoreCase);
    }
}