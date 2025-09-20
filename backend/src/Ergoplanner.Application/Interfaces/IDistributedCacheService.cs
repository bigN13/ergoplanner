namespace Ergoplanner.Application.Interfaces;

/// <summary>
/// Distributed cache service for session management and cross-instance data
/// </summary>
public interface IDistributedCacheService
{
    /// <summary>
    /// Store user session data
    /// </summary>
    Task SetUserSessionAsync(Guid userId, object sessionData, TimeSpan? expiration = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get user session data
    /// </summary>
    Task<T?> GetUserSessionAsync<T>(Guid userId, CancellationToken cancellationToken = default) where T : class;

    /// <summary>
    /// Remove user session
    /// </summary>
    Task RemoveUserSessionAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Store JWT token blacklist
    /// </summary>
    Task BlacklistTokenAsync(string tokenId, TimeSpan expiration, CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if token is blacklisted
    /// </summary>
    Task<bool> IsTokenBlacklistedAsync(string tokenId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Store refresh token
    /// </summary>
    Task SetRefreshTokenAsync(Guid userId, string refreshToken, TimeSpan expiration, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get refresh token
    /// </summary>
    Task<string?> GetRefreshTokenAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Remove refresh token
    /// </summary>
    Task RemoveRefreshTokenAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Store user preferences
    /// </summary>
    Task SetUserPreferencesAsync(Guid userId, object preferences, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get user preferences
    /// </summary>
    Task<T?> GetUserPreferencesAsync<T>(Guid userId, CancellationToken cancellationToken = default) where T : class;

    /// <summary>
    /// Store drawing collaboration data (cursors, selections, etc.)
    /// </summary>
    Task SetDrawingCollaborationAsync(Guid drawingId, Guid userId, object collaborationData, TimeSpan? expiration = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get drawing collaboration data for all users
    /// </summary>
    Task<Dictionary<Guid, T>> GetDrawingCollaborationAsync<T>(Guid drawingId, CancellationToken cancellationToken = default) where T : class;

    /// <summary>
    /// Remove user from drawing collaboration
    /// </summary>
    Task RemoveDrawingCollaborationAsync(Guid drawingId, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Store temporary drawing locks
    /// </summary>
    Task SetDrawingLockAsync(Guid drawingId, Guid userId, TimeSpan expiration, CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if drawing is locked
    /// </summary>
    Task<Guid?> GetDrawingLockAsync(Guid drawingId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Remove drawing lock
    /// </summary>
    Task RemoveDrawingLockAsync(Guid drawingId, CancellationToken cancellationToken = default);
}