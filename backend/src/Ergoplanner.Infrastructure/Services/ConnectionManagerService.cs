using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Ergoplanner.Application.DTOs.SignalR;
using Ergoplanner.Application.Interfaces;
using Ergoplanner.Domain.Entities;

namespace Ergoplanner.Infrastructure.Services
{
    /// <summary>
    /// Service for managing SignalR connections and user presence
    /// </summary>
    public class ConnectionManagerService : IConnectionManagerService
    {
        private readonly IDistributedCache _cache;
        private readonly ILogger<ConnectionManagerService> _logger;
        private const int ConnectionExpiryMinutes = 30;
        private const int PresenceExpiryMinutes = 5;

        public ConnectionManagerService(
            IDistributedCache cache,
            ILogger<ConnectionManagerService> logger)
        {
            _cache = cache;
            _logger = logger;
        }

        public async Task AddConnectionAsync(string connectionId, Guid userId, string hubName, string? drawingId = null, string? projectId = null)
        {
            try
            {
                var connection = new UserConnection
                {
                    Id = Guid.NewGuid(),
                    ConnectionId = connectionId,
                    UserId = userId,
                    HubName = hubName,
                    DrawingId = drawingId,
                    ProjectId = projectId,
                    ConnectedAt = DateTime.UtcNow,
                    LastActivity = DateTime.UtcNow,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                var cacheKey = $"connection:{connectionId}";
                var connectionJson = JsonConvert.SerializeObject(connection);
                var options = new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(ConnectionExpiryMinutes)
                };

                await _cache.SetStringAsync(cacheKey, connectionJson, options);

                // Add to user connections list
                await AddToUserConnectionsListAsync(userId, connectionId);

                // Add to drawing connections list if applicable
                if (!string.IsNullOrEmpty(drawingId))
                {
                    await AddToDrawingConnectionsListAsync(drawingId, connectionId);
                }

                // Add to project connections list if applicable
                if (!string.IsNullOrEmpty(projectId))
                {
                    await AddToProjectConnectionsListAsync(projectId, connectionId);
                }

                _logger.LogInformation("Added connection {ConnectionId} for user {UserId} in hub {HubName}",
                    connectionId, userId, hubName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding connection {ConnectionId} for user {UserId}",
                    connectionId, userId);
                throw;
            }
        }

        public async Task RemoveConnectionAsync(string connectionId)
        {
            try
            {
                var connection = await GetConnectionAsync(connectionId);
                if (connection == null)
                {
                    _logger.LogWarning("Attempted to remove non-existent connection {ConnectionId}", connectionId);
                    return;
                }

                // Remove from user connections list
                await RemoveFromUserConnectionsListAsync(connection.UserId, connectionId);

                // Remove from drawing connections list if applicable
                if (!string.IsNullOrEmpty(connection.DrawingId))
                {
                    await RemoveFromDrawingConnectionsListAsync(connection.DrawingId, connectionId);
                }

                // Remove from project connections list if applicable
                if (!string.IsNullOrEmpty(connection.ProjectId))
                {
                    await RemoveFromProjectConnectionsListAsync(connection.ProjectId, connectionId);
                }

                // Remove the connection itself
                var cacheKey = $"connection:{connectionId}";
                await _cache.RemoveAsync(cacheKey);

                _logger.LogInformation("Removed connection {ConnectionId} for user {UserId}",
                    connectionId, connection.UserId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing connection {ConnectionId}", connectionId);
                throw;
            }
        }

        public async Task<IEnumerable<UserConnection>> GetUserConnectionsAsync(Guid userId)
        {
            try
            {
                var connections = new List<UserConnection>();
                var connectionIds = await GetUserConnectionIdsAsync(userId);

                foreach (var connectionId in connectionIds)
                {
                    var connection = await GetConnectionAsync(connectionId);
                    if (connection != null && connection.IsActive)
                    {
                        connections.Add(connection);
                    }
                }

                return connections;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting connections for user {UserId}", userId);
                return Enumerable.Empty<UserConnection>();
            }
        }

        public async Task<IEnumerable<UserConnection>> GetDrawingConnectionsAsync(string drawingId)
        {
            try
            {
                var connections = new List<UserConnection>();
                var connectionIds = await GetDrawingConnectionIdsAsync(drawingId);

                foreach (var connectionId in connectionIds)
                {
                    var connection = await GetConnectionAsync(connectionId);
                    if (connection != null && connection.IsActive)
                    {
                        connections.Add(connection);
                    }
                }

                return connections;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting connections for drawing {DrawingId}", drawingId);
                return Enumerable.Empty<UserConnection>();
            }
        }

        public async Task<IEnumerable<UserConnection>> GetProjectConnectionsAsync(string projectId)
        {
            try
            {
                var connections = new List<UserConnection>();
                var connectionIds = await GetProjectConnectionIdsAsync(projectId);

                foreach (var connectionId in connectionIds)
                {
                    var connection = await GetConnectionAsync(connectionId);
                    if (connection != null && connection.IsActive)
                    {
                        connections.Add(connection);
                    }
                }

                return connections;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting connections for project {ProjectId}", projectId);
                return Enumerable.Empty<UserConnection>();
            }
        }

        public async Task UpdateConnectionMetadataAsync(string connectionId, Dictionary<string, object> metadata)
        {
            try
            {
                var connection = await GetConnectionAsync(connectionId);
                if (connection == null)
                {
                    _logger.LogWarning("Attempted to update metadata for non-existent connection {ConnectionId}", connectionId);
                    return;
                }

                connection.Metadata = metadata;
                connection.LastActivity = DateTime.UtcNow;
                connection.UpdatedAt = DateTime.UtcNow;

                var cacheKey = $"connection:{connectionId}";
                var connectionJson = JsonConvert.SerializeObject(connection);
                var options = new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(ConnectionExpiryMinutes)
                };

                await _cache.SetStringAsync(cacheKey, connectionJson, options);

                _logger.LogDebug("Updated metadata for connection {ConnectionId}", connectionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating metadata for connection {ConnectionId}", connectionId);
                throw;
            }
        }

        public async Task<UserPresenceDto?> GetUserPresenceAsync(Guid userId)
        {
            try
            {
                var cacheKey = $"presence:{userId}";
                var presenceJson = await _cache.GetStringAsync(cacheKey);

                if (string.IsNullOrEmpty(presenceJson))
                {
                    return null;
                }

                var presence = JsonConvert.DeserializeObject<UserPresenceDto>(presenceJson);
                return presence;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting presence for user {UserId}", userId);
                return null;
            }
        }

        public async Task UpdateUserPresenceAsync(Guid userId, string status, string? currentDrawingId = null, string? currentProjectId = null)
        {
            try
            {
                var presence = await GetUserPresenceAsync(userId) ?? new UserPresenceDto
                {
                    UserId = userId,
                    UserName = "Unknown User", // In a real implementation, fetch from user service
                    DisplayName = "Unknown User"
                };

                presence.Status = status;
                presence.LastSeen = DateTime.UtcNow;
                presence.CurrentDrawingId = currentDrawingId;
                presence.CurrentProjectId = currentProjectId;

                var cacheKey = $"presence:{userId}";
                var presenceJson = JsonConvert.SerializeObject(presence);
                var options = new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(PresenceExpiryMinutes)
                };

                await _cache.SetStringAsync(cacheKey, presenceJson, options);

                _logger.LogDebug("Updated presence for user {UserId}: {Status}", userId, status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating presence for user {UserId}", userId);
                throw;
            }
        }

        public async Task<IEnumerable<UserPresenceDto>> GetActiveUsersInDrawingAsync(string drawingId)
        {
            try
            {
                var activeUsers = new List<UserPresenceDto>();
                var connections = await GetDrawingConnectionsAsync(drawingId);

                var uniqueUserIds = connections.Select(c => c.UserId).Distinct();

                foreach (var userId in uniqueUserIds)
                {
                    var presence = await GetUserPresenceAsync(userId);
                    if (presence != null && presence.Status == "online")
                    {
                        activeUsers.Add(presence);
                    }
                }

                return activeUsers;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting active users for drawing {DrawingId}", drawingId);
                return Enumerable.Empty<UserPresenceDto>();
            }
        }

        public async Task<IEnumerable<UserPresenceDto>> GetActiveUsersInProjectAsync(string projectId)
        {
            try
            {
                var activeUsers = new List<UserPresenceDto>();
                var connections = await GetProjectConnectionsAsync(projectId);

                var uniqueUserIds = connections.Select(c => c.UserId).Distinct();

                foreach (var userId in uniqueUserIds)
                {
                    var presence = await GetUserPresenceAsync(userId);
                    if (presence != null && presence.Status == "online")
                    {
                        activeUsers.Add(presence);
                    }
                }

                return activeUsers;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting active users for project {ProjectId}", projectId);
                return Enumerable.Empty<UserPresenceDto>();
            }
        }

        public async Task CleanupExpiredConnectionsAsync()
        {
            try
            {
                _logger.LogInformation("Starting cleanup of expired connections");

                // This is a simplified cleanup - in a production system, you'd want to
                // implement a more sophisticated approach using Redis patterns or a dedicated cleanup service

                // For now, this method serves as a placeholder for cleanup logic
                // The Redis cache TTL will handle most of the cleanup automatically

                _logger.LogInformation("Completed cleanup of expired connections");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during connection cleanup");
            }
        }

        #region Private Helper Methods

        private async Task<UserConnection?> GetConnectionAsync(string connectionId)
        {
            try
            {
                var cacheKey = $"connection:{connectionId}";
                var connectionJson = await _cache.GetStringAsync(cacheKey);

                if (string.IsNullOrEmpty(connectionJson))
                {
                    return null;
                }

                return JsonConvert.DeserializeObject<UserConnection>(connectionJson);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting connection {ConnectionId}", connectionId);
                return null;
            }
        }

        private async Task AddToUserConnectionsListAsync(Guid userId, string connectionId)
        {
            var cacheKey = $"user_connections:{userId}";
            var connectionIds = await GetConnectionIdsFromCacheAsync(cacheKey);
            connectionIds.Add(connectionId);

            await SetConnectionIdsInCacheAsync(cacheKey, connectionIds);
        }

        private async Task RemoveFromUserConnectionsListAsync(Guid userId, string connectionId)
        {
            var cacheKey = $"user_connections:{userId}";
            var connectionIds = await GetConnectionIdsFromCacheAsync(cacheKey);
            connectionIds.Remove(connectionId);

            await SetConnectionIdsInCacheAsync(cacheKey, connectionIds);
        }

        private async Task<List<string>> GetUserConnectionIdsAsync(Guid userId)
        {
            var cacheKey = $"user_connections:{userId}";
            return await GetConnectionIdsFromCacheAsync(cacheKey);
        }

        private async Task AddToDrawingConnectionsListAsync(string drawingId, string connectionId)
        {
            var cacheKey = $"drawing_connections:{drawingId}";
            var connectionIds = await GetConnectionIdsFromCacheAsync(cacheKey);
            connectionIds.Add(connectionId);

            await SetConnectionIdsInCacheAsync(cacheKey, connectionIds);
        }

        private async Task RemoveFromDrawingConnectionsListAsync(string drawingId, string connectionId)
        {
            var cacheKey = $"drawing_connections:{drawingId}";
            var connectionIds = await GetConnectionIdsFromCacheAsync(cacheKey);
            connectionIds.Remove(connectionId);

            await SetConnectionIdsInCacheAsync(cacheKey, connectionIds);
        }

        private async Task<List<string>> GetDrawingConnectionIdsAsync(string drawingId)
        {
            var cacheKey = $"drawing_connections:{drawingId}";
            return await GetConnectionIdsFromCacheAsync(cacheKey);
        }

        private async Task AddToProjectConnectionsListAsync(string projectId, string connectionId)
        {
            var cacheKey = $"project_connections:{projectId}";
            var connectionIds = await GetConnectionIdsFromCacheAsync(cacheKey);
            connectionIds.Add(connectionId);

            await SetConnectionIdsInCacheAsync(cacheKey, connectionIds);
        }

        private async Task RemoveFromProjectConnectionsListAsync(string projectId, string connectionId)
        {
            var cacheKey = $"project_connections:{projectId}";
            var connectionIds = await GetConnectionIdsFromCacheAsync(cacheKey);
            connectionIds.Remove(connectionId);

            await SetConnectionIdsInCacheAsync(cacheKey, connectionIds);
        }

        private async Task<List<string>> GetProjectConnectionIdsAsync(string projectId)
        {
            var cacheKey = $"project_connections:{projectId}";
            return await GetConnectionIdsFromCacheAsync(cacheKey);
        }

        private async Task<List<string>> GetConnectionIdsFromCacheAsync(string cacheKey)
        {
            try
            {
                var connectionIdsJson = await _cache.GetStringAsync(cacheKey);

                if (string.IsNullOrEmpty(connectionIdsJson))
                {
                    return new List<string>();
                }

                return JsonConvert.DeserializeObject<List<string>>(connectionIdsJson) ?? new List<string>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting connection IDs from cache key {CacheKey}", cacheKey);
                return new List<string>();
            }
        }

        private async Task SetConnectionIdsInCacheAsync(string cacheKey, List<string> connectionIds)
        {
            try
            {
                var connectionIdsJson = JsonConvert.SerializeObject(connectionIds);
                var options = new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(ConnectionExpiryMinutes)
                };

                await _cache.SetStringAsync(cacheKey, connectionIdsJson, options);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting connection IDs in cache key {CacheKey}", cacheKey);
            }
        }

        #endregion
    }
}