using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Ergoplanner.Infrastructure.Caching.Common;

/// <summary>
/// Utility class for building standardized cache keys
/// </summary>
public static class CacheKeyBuilder
{
    private const string SEPARATOR = ":";
    private const string INSTANCE_PREFIX = "ergoplanner";

    /// <summary>
    /// Build a cache key with standard prefix and segments
    /// </summary>
    public static string Build(params string[] segments)
    {
        var allSegments = new List<string> { INSTANCE_PREFIX };
        allSegments.AddRange(segments.Where(s => !string.IsNullOrWhiteSpace(s)));
        return string.Join(SEPARATOR, allSegments);
    }

    /// <summary>
    /// Build a cache key for user-specific data
    /// </summary>
    public static string ForUser(Guid userId, params string[] additionalSegments)
    {
        var segments = new List<string> { "user", userId.ToString() };
        segments.AddRange(additionalSegments);
        return Build(segments.ToArray());
    }

    /// <summary>
    /// Build a cache key for project-specific data
    /// </summary>
    public static string ForProject(Guid projectId, params string[] additionalSegments)
    {
        var segments = new List<string> { "project", projectId.ToString() };
        segments.AddRange(additionalSegments);
        return Build(segments.ToArray());
    }

    /// <summary>
    /// Build a cache key for drawing-specific data
    /// </summary>
    public static string ForDrawing(Guid drawingId, params string[] additionalSegments)
    {
        var segments = new List<string> { "drawing", drawingId.ToString() };
        segments.AddRange(additionalSegments);
        return Build(segments.ToArray());
    }

    /// <summary>
    /// Build a cache key for organization-specific data
    /// </summary>
    public static string ForOrganization(Guid organizationId, params string[] additionalSegments)
    {
        var segments = new List<string> { "org", organizationId.ToString() };
        segments.AddRange(additionalSegments);
        return Build(segments.ToArray());
    }

    /// <summary>
    /// Build a cache key for session data
    /// </summary>
    public static string ForSession(Guid userId, string sessionType = "main")
    {
        return Build("session", userId.ToString(), sessionType);
    }

    /// <summary>
    /// Build a cache key for refresh tokens
    /// </summary>
    public static string ForRefreshToken(Guid userId)
    {
        return Build("token", "refresh", userId.ToString());
    }

    /// <summary>
    /// Build a cache key for blacklisted tokens
    /// </summary>
    public static string ForBlacklistedToken(string tokenId)
    {
        return Build("token", "blacklist", tokenId);
    }

    /// <summary>
    /// Build a cache key for user preferences
    /// </summary>
    public static string ForUserPreferences(Guid userId)
    {
        return ForUser(userId, "preferences");
    }

    /// <summary>
    /// Build a cache key for user projects list
    /// </summary>
    public static string ForUserProjects(Guid userId)
    {
        return ForUser(userId, "projects");
    }

    /// <summary>
    /// Build a cache key for project drawings list
    /// </summary>
    public static string ForProjectDrawings(Guid projectId)
    {
        return ForProject(projectId, "drawings");
    }

    /// <summary>
    /// Build a cache key for drawing metadata
    /// </summary>
    public static string ForDrawingMetadata(Guid drawingId)
    {
        return ForDrawing(drawingId, "metadata");
    }

    /// <summary>
    /// Build a cache key for drawing ReactFlow data
    /// </summary>
    public static string ForDrawingData(Guid drawingId)
    {
        return ForDrawing(drawingId, "data");
    }

    /// <summary>
    /// Build a cache key for drawing collaboration data
    /// </summary>
    public static string ForDrawingCollaboration(Guid drawingId, Guid? userId = null)
    {
        if (userId.HasValue)
        {
            return ForDrawing(drawingId, "collab", userId.Value.ToString());
        }
        return ForDrawing(drawingId, "collab");
    }

    /// <summary>
    /// Build a cache key for drawing locks
    /// </summary>
    public static string ForDrawingLock(Guid drawingId)
    {
        return ForDrawing(drawingId, "lock");
    }

    /// <summary>
    /// Build a cache key for symbol libraries
    /// </summary>
    public static string ForSymbolLibrary(string standard)
    {
        return Build("symbols", standard.ToLowerInvariant());
    }

    /// <summary>
    /// Build a pattern for cache key matching
    /// </summary>
    public static string BuildPattern(params string[] segments)
    {
        var pattern = Build(segments);
        return pattern.EndsWith("*") ? pattern : pattern + "*";
    }

    /// <summary>
    /// Build a pattern for user-specific cache keys
    /// </summary>
    public static string ForUserPattern(Guid userId)
    {
        return BuildPattern("user", userId.ToString());
    }

    /// <summary>
    /// Build a pattern for project-specific cache keys
    /// </summary>
    public static string ForProjectPattern(Guid projectId)
    {
        return BuildPattern("project", projectId.ToString());
    }

    /// <summary>
    /// Build a pattern for drawing-specific cache keys
    /// </summary>
    public static string ForDrawingPattern(Guid drawingId)
    {
        return BuildPattern("drawing", drawingId.ToString());
    }

    /// <summary>
    /// Generate a hash for long or complex cache keys
    /// </summary>
    public static string Hash(string input)
    {
        using var sha256 = SHA256.Create();
        var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(input));
        return Convert.ToBase64String(hashBytes).Replace("+", "-").Replace("/", "_").TrimEnd('=');
    }

    /// <summary>
    /// Build a cache key with JSON serialization for complex objects
    /// </summary>
    public static string ForComplexKey(object keyObject, params string[] additionalSegments)
    {
        var json = JsonSerializer.Serialize(keyObject, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        var hash = Hash(json);

        var segments = additionalSegments.ToList();
        segments.Add(hash);

        return Build(segments.ToArray());
    }
}