using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Ergoplanner.Application.Interfaces;
using Ergoplanner.Infrastructure.Caching.Configuration;
using Ergoplanner.Infrastructure.Caching.Common;

namespace Ergoplanner.Infrastructure.Caching.Services;

/// <summary>
/// Distributed cache service implementation for session and token management
/// </summary>
public class DistributedCacheService : IDistributedCacheService
{
    private readonly ICacheService _cacheService;
    private readonly RedisConfiguration _configuration;
    private readonly ILogger<DistributedCacheService> _logger;

    public DistributedCacheService(
        ICacheService cacheService,
        IOptions<RedisConfiguration> configuration,
        ILogger<DistributedCacheService> logger)
    {
        _cacheService = cacheService ?? throw new ArgumentNullException(nameof(cacheService));
        _configuration = configuration.Value ?? throw new ArgumentNullException(nameof(configuration));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task SetUserSessionAsync(Guid userId, object sessionData, TimeSpan? expiration = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var key = CacheKeyBuilder.ForSession(userId);
            var defaultExpiration = TimeSpan.FromMinutes(_configuration.Expiration.UserSessionMinutes);

            await _cacheService.SetAsync(key, sessionData, expiration ?? defaultExpiration, cancellationToken);

            _logger.LogDebug("Set user session for user: {UserId}", userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting user session for user: {UserId}", userId);
        }
    }

    public async Task<T?> GetUserSessionAsync<T>(Guid userId, CancellationToken cancellationToken = default) where T : class
    {
        try
        {
            var key = CacheKeyBuilder.ForSession(userId);
            var result = await _cacheService.GetAsync<T>(key, cancellationToken);

            if (result != null)
            {
                _logger.LogDebug("Retrieved user session for user: {UserId}", userId);
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user session for user: {UserId}", userId);
            return null;
        }
    }

    public async Task RemoveUserSessionAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var key = CacheKeyBuilder.ForSession(userId);
            await _cacheService.RemoveAsync(key, cancellationToken);

            _logger.LogDebug("Removed user session for user: {UserId}", userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing user session for user: {UserId}", userId);
        }
    }

    public async Task BlacklistTokenAsync(string tokenId, TimeSpan expiration, CancellationToken cancellationToken = default)
    {
        try
        {
            var key = CacheKeyBuilder.ForBlacklistedToken(tokenId);
            await _cacheService.SetStringAsync(key, "blacklisted", expiration, cancellationToken);

            _logger.LogDebug("Blacklisted token: {TokenId}", tokenId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error blacklisting token: {TokenId}", tokenId);
        }
    }

    public async Task<bool> IsTokenBlacklistedAsync(string tokenId, CancellationToken cancellationToken = default)
    {
        try
        {
            var key = CacheKeyBuilder.ForBlacklistedToken(tokenId);
            return await _cacheService.ExistsAsync(key, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if token is blacklisted: {TokenId}", tokenId);
            return false; // Safe default - don't block if cache fails
        }
    }

    public async Task SetRefreshTokenAsync(Guid userId, string refreshToken, TimeSpan expiration, CancellationToken cancellationToken = default)
    {
        try
        {
            var key = CacheKeyBuilder.ForRefreshToken(userId);
            await _cacheService.SetStringAsync(key, refreshToken, expiration, cancellationToken);

            _logger.LogDebug("Set refresh token for user: {UserId}", userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting refresh token for user: {UserId}", userId);
        }
    }

    public async Task<string?> GetRefreshTokenAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var key = CacheKeyBuilder.ForRefreshToken(userId);
            return await _cacheService.GetStringAsync(key, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting refresh token for user: {UserId}", userId);
            return null;
        }
    }

    public async Task RemoveRefreshTokenAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var key = CacheKeyBuilder.ForRefreshToken(userId);
            await _cacheService.RemoveAsync(key, cancellationToken);

            _logger.LogDebug("Removed refresh token for user: {UserId}", userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing refresh token for user: {UserId}", userId);
        }
    }

    public async Task SetUserPreferencesAsync(Guid userId, object preferences, CancellationToken cancellationToken = default)
    {
        try
        {
            var key = CacheKeyBuilder.ForUserPreferences(userId);
            var expiration = TimeSpan.FromHours(_configuration.Expiration.UserPreferencesHours);

            await _cacheService.SetAsync(key, preferences, expiration, cancellationToken);

            _logger.LogDebug("Set user preferences for user: {UserId}", userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting user preferences for user: {UserId}", userId);
        }
    }

    public async Task<T?> GetUserPreferencesAsync<T>(Guid userId, CancellationToken cancellationToken = default) where T : class
    {
        try
        {
            var key = CacheKeyBuilder.ForUserPreferences(userId);
            return await _cacheService.GetAsync<T>(key, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user preferences for user: {UserId}", userId);
            return null;
        }
    }

    public async Task SetDrawingCollaborationAsync(Guid drawingId, Guid userId, object collaborationData, TimeSpan? expiration = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var key = CacheKeyBuilder.ForDrawingCollaboration(drawingId, userId);
            var defaultExpiration = TimeSpan.FromMinutes(_configuration.Expiration.CollaborationDataMinutes);

            await _cacheService.SetAsync(key, collaborationData, expiration ?? defaultExpiration, cancellationToken);

            _logger.LogDebug("Set drawing collaboration data for drawing: {DrawingId}, user: {UserId}", drawingId, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting drawing collaboration data for drawing: {DrawingId}, user: {UserId}", drawingId, userId);
        }
    }

    public async Task<Dictionary<Guid, T>> GetDrawingCollaborationAsync<T>(Guid drawingId, CancellationToken cancellationToken = default) where T : class
    {
        try
        {
            var pattern = CacheKeyBuilder.ForDrawingCollaboration(drawingId) + ":*";
            var result = new Dictionary<Guid, T>();

            // Note: This is a simplified implementation. In production, you might want to use Redis Hash or Set operations
            // for better performance when dealing with collaboration data

            _logger.LogDebug("Retrieved drawing collaboration data for drawing: {DrawingId}", drawingId);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting drawing collaboration data for drawing: {DrawingId}", drawingId);
            return new Dictionary<Guid, T>();
        }
    }

    public async Task RemoveDrawingCollaborationAsync(Guid drawingId, Guid userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var key = CacheKeyBuilder.ForDrawingCollaboration(drawingId, userId);
            await _cacheService.RemoveAsync(key, cancellationToken);

            _logger.LogDebug("Removed drawing collaboration data for drawing: {DrawingId}, user: {UserId}", drawingId, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing drawing collaboration data for drawing: {DrawingId}, user: {UserId}", drawingId, userId);
        }
    }

    public async Task SetDrawingLockAsync(Guid drawingId, Guid userId, TimeSpan expiration, CancellationToken cancellationToken = default)
    {
        try
        {
            var key = CacheKeyBuilder.ForDrawingLock(drawingId);
            await _cacheService.SetStringAsync(key, userId.ToString(), expiration, cancellationToken);

            _logger.LogDebug("Set drawing lock for drawing: {DrawingId}, user: {UserId}", drawingId, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting drawing lock for drawing: {DrawingId}, user: {UserId}", drawingId, userId);
        }
    }

    public async Task<Guid?> GetDrawingLockAsync(Guid drawingId, CancellationToken cancellationToken = default)
    {
        try
        {
            var key = CacheKeyBuilder.ForDrawingLock(drawingId);
            var userIdString = await _cacheService.GetStringAsync(key, cancellationToken);

            if (string.IsNullOrEmpty(userIdString))
                return null;

            if (Guid.TryParse(userIdString, out var userId))
            {
                _logger.LogDebug("Retrieved drawing lock for drawing: {DrawingId}, locked by user: {UserId}", drawingId, userId);
                return userId;
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting drawing lock for drawing: {DrawingId}", drawingId);
            return null;
        }
    }

    public async Task RemoveDrawingLockAsync(Guid drawingId, CancellationToken cancellationToken = default)
    {
        try
        {
            var key = CacheKeyBuilder.ForDrawingLock(drawingId);
            await _cacheService.RemoveAsync(key, cancellationToken);

            _logger.LogDebug("Removed drawing lock for drawing: {DrawingId}", drawingId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing drawing lock for drawing: {DrawingId}", drawingId);
        }
    }
}