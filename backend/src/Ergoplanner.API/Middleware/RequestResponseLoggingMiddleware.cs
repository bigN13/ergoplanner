using System.Text;
using Serilog;
using Serilog.Events;

namespace Ergoplanner.API.Middleware;

public class RequestResponseLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestResponseLoggingMiddleware> _logger;

    public RequestResponseLoggingMiddleware(RequestDelegate next, ILogger<RequestResponseLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var startTime = DateTime.UtcNow;

        // Log request
        await LogRequestAsync(context);

        // Capture response
        var originalResponseBodyStream = context.Response.Body;
        using var responseBodyStream = new MemoryStream();
        context.Response.Body = responseBodyStream;

        try
        {
            await _next(context);
        }
        finally
        {
            var duration = DateTime.UtcNow - startTime;

            // Log response
            await LogResponseAsync(context, duration);

            // Copy response back to original stream
            responseBodyStream.Seek(0, SeekOrigin.Begin);
            await responseBodyStream.CopyToAsync(originalResponseBodyStream);
        }
    }

    private async Task LogRequestAsync(HttpContext context)
    {
        var request = context.Request;

        // Skip logging for health checks and static files
        if (ShouldSkipLogging(request.Path))
            return;

        var requestBody = string.Empty;
        if (request.ContentLength > 0 && request.ContentType?.Contains("application/json") == true)
        {
            request.EnableBuffering();
            using var reader = new StreamReader(request.Body, Encoding.UTF8, leaveOpen: true);
            requestBody = await reader.ReadToEndAsync();
            request.Body.Position = 0;

            // Mask sensitive data
            requestBody = MaskSensitiveData(requestBody);
        }

        Log.ForContext("RequestHeaders", request.Headers.ToDictionary(h => h.Key, h => h.Value.ToString()))
           .ForContext("RequestBody", requestBody)
           .ForContext("RequestMethod", request.Method)
           .ForContext("RequestPath", request.Path.Value)
           .ForContext("RequestQuery", request.QueryString.Value)
           .ForContext("UserAgent", request.Headers.UserAgent.ToString())
           .ForContext("RemoteIpAddress", context.Connection.RemoteIpAddress?.ToString())
           .ForContext("UserId", context.User?.Identity?.Name)
           .Information("HTTP Request {Method} {Path}{Query}",
               request.Method, request.Path, request.QueryString);
    }

    private async Task LogResponseAsync(HttpContext context, TimeSpan duration)
    {
        var response = context.Response;

        // Skip logging for health checks and static files
        if (ShouldSkipLogging(context.Request.Path))
            return;

        var responseBody = string.Empty;
        if (response.ContentType?.Contains("application/json") == true && response.Body.CanRead)
        {
            response.Body.Seek(0, SeekOrigin.Begin);
            using var reader = new StreamReader(response.Body, Encoding.UTF8, leaveOpen: true);
            responseBody = await reader.ReadToEndAsync();
            response.Body.Seek(0, SeekOrigin.Begin);

            // Mask sensitive data in response
            responseBody = MaskSensitiveData(responseBody);
        }

        var logLevel = response.StatusCode >= 500 ? LogEventLevel.Error :
                      response.StatusCode >= 400 ? LogEventLevel.Warning :
                      LogEventLevel.Information;

        Log.ForContext("ResponseHeaders", response.Headers.ToDictionary(h => h.Key, h => h.Value.ToString()))
           .ForContext("ResponseBody", responseBody)
           .ForContext("StatusCode", response.StatusCode)
           .ForContext("Duration", duration.TotalMilliseconds)
           .ForContext("RequestMethod", context.Request.Method)
           .ForContext("RequestPath", context.Request.Path.Value)
           .ForContext("UserId", context.User?.Identity?.Name)
           .Write(logLevel, "HTTP Response {Method} {Path} responded {StatusCode} in {Duration}ms",
               context.Request.Method, context.Request.Path, response.StatusCode, duration.TotalMilliseconds);
    }

    private static bool ShouldSkipLogging(PathString path)
    {
        var pathValue = path.Value?.ToLowerInvariant();
        return pathValue != null && (
            pathValue.StartsWith("/health") ||
            pathValue.StartsWith("/metrics") ||
            pathValue.StartsWith("/swagger") ||
            pathValue.Contains(".css") ||
            pathValue.Contains(".js") ||
            pathValue.Contains(".map") ||
            pathValue.Contains(".ico"));
    }

    private static string MaskSensitiveData(string content)
    {
        if (string.IsNullOrEmpty(content))
            return content;

        // Mask common sensitive fields
        var sensitiveFields = new[] { "password", "token", "secret", "key", "authorization" };

        foreach (var field in sensitiveFields)
        {
            // Match JSON fields like "password": "value"
            var pattern = $"\"{field}\"\\s*:\\s*\"[^\"]*\"";
            content = System.Text.RegularExpressions.Regex.Replace(
                content, pattern, $"\"{field}\": \"***MASKED***\"",
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        }

        return content;
    }
}