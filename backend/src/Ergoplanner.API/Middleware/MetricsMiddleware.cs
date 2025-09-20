using System.Diagnostics;
using Ergoplanner.Infrastructure.Monitoring;

namespace Ergoplanner.API.Middleware;

public class MetricsMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IMetricsService _metricsService;
    private readonly ILogger<MetricsMiddleware> _logger;

    public MetricsMiddleware(RequestDelegate next, IMetricsService metricsService, ILogger<MetricsMiddleware> logger)
    {
        _next = next;
        _metricsService = metricsService;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        var path = context.Request.Path.Value ?? string.Empty;
        var method = context.Request.Method;

        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();
            var statusCode = context.Response.StatusCode;
            var duration = stopwatch.Elapsed.TotalMilliseconds;

            // Skip metrics for health checks and static content
            if (!ShouldSkipMetrics(path))
            {
                // Record API request metrics
                _metricsService.RecordApiRequestDuration(path, method, statusCode, duration);

                // Log slow requests
                if (duration > 5000) // 5 seconds
                {
                    _logger.LogWarning("Slow API request detected: {Method} {Path} took {Duration}ms and returned {StatusCode}",
                        method, path, duration, statusCode);
                }

                // Track error rates
                if (statusCode >= 400)
                {
                    var exceptionType = context.Items.ContainsKey("ExceptionType")
                        ? context.Items["ExceptionType"]?.ToString() ?? "Unknown"
                        : "HttpError";

                    _metricsService.IncrementExceptionOccurred(exceptionType, path);
                }
            }
        }
    }

    private static bool ShouldSkipMetrics(string path)
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
}