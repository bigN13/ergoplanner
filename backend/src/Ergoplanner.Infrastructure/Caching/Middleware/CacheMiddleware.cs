using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Text;
using Ergoplanner.Application.Interfaces;

namespace Ergoplanner.Infrastructure.Caching.Middleware;

/// <summary>
/// Middleware for response caching with Redis
/// </summary>
public class CacheMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ICacheService _cacheService;
    private readonly ILogger<CacheMiddleware> _logger;

    private static readonly HashSet<string> CacheableHttpMethods = new() { "GET" };
    private static readonly HashSet<string> CacheablePaths = new()
    {
        "/api/projects",
        "/api/drawings",
        "/api/symbols",
        "/api/organizations"
    };

    public CacheMiddleware(
        RequestDelegate next,
        ICacheService cacheService,
        ILogger<CacheMiddleware> logger)
    {
        _next = next ?? throw new ArgumentNullException(nameof(next));
        _cacheService = cacheService ?? throw new ArgumentNullException(nameof(cacheService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Check if request is cacheable
        if (!IsCacheableRequest(context.Request))
        {
            await _next(context);
            return;
        }

        var cacheKey = GenerateCacheKey(context.Request);

        try
        {
            // Try to get response from cache
            var cachedResponse = await _cacheService.GetStringAsync(cacheKey);

            if (!string.IsNullOrEmpty(cachedResponse))
            {
                _logger.LogDebug("Cache hit for request: {Path}", context.Request.Path);

                // Return cached response
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(cachedResponse);
                return;
            }

            _logger.LogDebug("Cache miss for request: {Path}", context.Request.Path);

            // Capture response
            var originalBodyStream = context.Response.Body;
            using var responseBodyStream = new MemoryStream();
            context.Response.Body = responseBodyStream;

            await _next(context);

            // Cache successful responses
            if (context.Response.StatusCode == 200 && responseBodyStream.Length > 0)
            {
                responseBodyStream.Seek(0, SeekOrigin.Begin);
                var responseBody = await new StreamReader(responseBodyStream).ReadToEndAsync();

                // Cache the response with appropriate expiration
                var expiration = GetCacheExpiration(context.Request.Path);
                await _cacheService.SetStringAsync(cacheKey, responseBody, expiration);

                _logger.LogDebug("Cached response for request: {Path}", context.Request.Path);

                // Copy response back to original stream
                responseBodyStream.Seek(0, SeekOrigin.Begin);
                await responseBodyStream.CopyToAsync(originalBodyStream);
            }
            else
            {
                // Copy response back without caching
                responseBodyStream.Seek(0, SeekOrigin.Begin);
                await responseBodyStream.CopyToAsync(originalBodyStream);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in cache middleware for request: {Path}", context.Request.Path);
            await _next(context);
        }
    }

    private static bool IsCacheableRequest(HttpRequest request)
    {
        // Only cache GET requests
        if (!CacheableHttpMethods.Contains(request.Method.ToUpperInvariant()))
            return false;

        // Check if path is cacheable
        var path = request.Path.Value?.ToLowerInvariant() ?? string.Empty;
        return CacheablePaths.Any(cacheablePath => path.StartsWith(cacheablePath.ToLowerInvariant()));
    }

    private static string GenerateCacheKey(HttpRequest request)
    {
        var keyBuilder = new StringBuilder();
        keyBuilder.Append("response:");
        keyBuilder.Append(request.Path.Value?.ToLowerInvariant() ?? "unknown");

        // Include query parameters in cache key
        if (request.QueryString.HasValue)
        {
            // Sort query parameters for consistent cache keys
            var sortedQueryParams = request.Query
                .OrderBy(kvp => kvp.Key)
                .Select(kvp => $"{kvp.Key}={string.Join(",", kvp.Value!)}")
                .ToArray();

            if (sortedQueryParams.Length > 0)
            {
                keyBuilder.Append("?");
                keyBuilder.Append(string.Join("&", sortedQueryParams));
            }
        }

        // Include user context for user-specific data
        var userId = request.HttpContext.User?.Identity?.Name;
        if (!string.IsNullOrEmpty(userId))
        {
            keyBuilder.Append(":user:");
            keyBuilder.Append(userId);
        }

        return keyBuilder.ToString();
    }

    private static TimeSpan GetCacheExpiration(string path)
    {
        // Different cache durations based on data type
        var lowerPath = path.ToLowerInvariant();

        return lowerPath switch
        {
            var p when p.Contains("/symbols") => TimeSpan.FromHours(24),    // Symbol libraries change rarely
            var p when p.Contains("/projects") => TimeSpan.FromMinutes(30), // Project metadata
            var p when p.Contains("/drawings") => TimeSpan.FromMinutes(15), // Drawing metadata
            var p when p.Contains("/organizations") => TimeSpan.FromHours(1), // Organization data
            _ => TimeSpan.FromMinutes(5) // Default cache duration
        };
    }
}