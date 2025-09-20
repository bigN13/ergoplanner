using System.Diagnostics;
using Ergoplanner.API.Extensions;

namespace Ergoplanner.API.Middleware;

public class DistributedTracingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<DistributedTracingMiddleware> _logger;

    public DistributedTracingMiddleware(RequestDelegate next, ILogger<DistributedTracingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var request = context.Request;
        var operationName = $"{request.Method} {request.Path}";

        var tags = new Dictionary<string, object?>
        {
            ["http.method"] = request.Method,
            ["http.url"] = $"{request.Scheme}://{request.Host}{request.Path}{request.QueryString}",
            ["http.route"] = request.Path,
            ["http.scheme"] = request.Scheme,
            ["http.host"] = request.Host.ToString(),
            ["http.user_agent"] = request.Headers.UserAgent.ToString(),
            ["http.remote_ip"] = context.Connection.RemoteIpAddress?.ToString(),
            ["user.id"] = context.User?.Identity?.Name,
            ["correlation_id"] = context.Response.Headers["X-Correlation-ID"].FirstOrDefault()
        };

        using var activity = TracingExtensions.StartActivityWithTags(operationName, tags, ActivityKind.Server);

        try
        {
            // Add request information to activity
            activity?.AddActivityEvent("request.start", new Dictionary<string, object?>
            {
                ["request.size"] = request.ContentLength ?? 0,
                ["request.content_type"] = request.ContentType
            });

            await _next(context);

            // Add response information to activity
            var response = context.Response;
            activity?.SetTag("http.status_code", response.StatusCode);
            activity?.SetTag("http.status_text", GetStatusText(response.StatusCode));

            activity?.AddActivityEvent("request.end", new Dictionary<string, object?>
            {
                ["response.status_code"] = response.StatusCode,
                ["response.content_type"] = response.ContentType,
                ["response.content_length"] = response.ContentLength ?? 0
            });

            // Mark as successful or failed based on status code
            if (response.StatusCode >= 400)
            {
                activity?.SetTag("error", true);
                activity?.SetTag("error.type", "http_error");
                activity?.SetTag("error.message", $"HTTP {response.StatusCode}");
            }
            else
            {
                activity?.SetActivitySuccess();
            }

            _logger.LogDebug("Distributed tracing completed for {OperationName} with status {StatusCode}",
                operationName, response.StatusCode);
        }
        catch (Exception ex)
        {
            activity?.SetActivityError(ex);

            activity?.AddActivityEvent("exception", new Dictionary<string, object?>
            {
                ["exception.type"] = ex.GetType().FullName!,
                ["exception.message"] = ex.Message,
                ["exception.escaped"] = true
            });

            // Store exception type for metrics middleware
            context.Items["ExceptionType"] = ex.GetType().Name;

            _logger.LogError(ex, "Exception occurred during distributed tracing for {OperationName}", operationName);
            throw;
        }
    }

    private static string GetStatusText(int statusCode)
    {
        return statusCode switch
        {
            200 => "OK",
            201 => "Created",
            204 => "No Content",
            400 => "Bad Request",
            401 => "Unauthorized",
            403 => "Forbidden",
            404 => "Not Found",
            409 => "Conflict",
            422 => "Unprocessable Entity",
            500 => "Internal Server Error",
            502 => "Bad Gateway",
            503 => "Service Unavailable",
            504 => "Gateway Timeout",
            _ => "Unknown"
        };
    }
}