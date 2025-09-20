using Serilog.Context;
using System.Diagnostics;

namespace Ergoplanner.API.Middleware;

public class CorrelationIdMiddleware
{
    private const string CorrelationIdHeaderName = "X-Correlation-ID";
    private readonly RequestDelegate _next;
    private readonly ILogger<CorrelationIdMiddleware> _logger;

    public CorrelationIdMiddleware(RequestDelegate next, ILogger<CorrelationIdMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = GetOrCreateCorrelationId(context);

        // Add to HTTP response headers
        context.Response.Headers.Add(CorrelationIdHeaderName, correlationId);

        // Add to Activity for distributed tracing
        Activity.Current?.SetTag("correlation_id", correlationId);

        // Add to Serilog context
        using (LogContext.PushProperty("CorrelationId", correlationId))
        {
            _logger.LogInformation("Starting request {Method} {Path} with correlation ID {CorrelationId}",
                context.Request.Method, context.Request.Path, correlationId);

            await _next(context);

            _logger.LogInformation("Completed request {Method} {Path} with status {StatusCode} and correlation ID {CorrelationId}",
                context.Request.Method, context.Request.Path, context.Response.StatusCode, correlationId);
        }
    }

    private static string GetOrCreateCorrelationId(HttpContext context)
    {
        // Try to get correlation ID from request headers
        if (context.Request.Headers.TryGetValue(CorrelationIdHeaderName, out var correlationIdHeader) &&
            !string.IsNullOrEmpty(correlationIdHeader))
        {
            return correlationIdHeader.ToString();
        }

        // Try to get from Activity (distributed tracing)
        var activityCorrelationId = Activity.Current?.Id;
        if (!string.IsNullOrEmpty(activityCorrelationId))
        {
            return activityCorrelationId;
        }

        // Generate new correlation ID
        return Guid.NewGuid().ToString();
    }
}