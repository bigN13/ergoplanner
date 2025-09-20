using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Ergoplanner.Application.DTOs.SignalR;
using Ergoplanner.Domain.Entities;

namespace Ergoplanner.Application.Interfaces
{
    /// <summary>
    /// Service for managing SignalR connections
    /// </summary>
    public interface IConnectionManagerService
    {
        /// <summary>
        /// Adds a new connection for a user
        /// </summary>
        Task AddConnectionAsync(string connectionId, Guid userId, string hubName, string? drawingId = null, string? projectId = null);

        /// <summary>
        /// Removes a connection
        /// </summary>
        Task RemoveConnectionAsync(string connectionId);

        /// <summary>
        /// Gets all connections for a user
        /// </summary>
        Task<IEnumerable<UserConnection>> GetUserConnectionsAsync(Guid userId);

        /// <summary>
        /// Gets all connections for a drawing
        /// </summary>
        Task<IEnumerable<UserConnection>> GetDrawingConnectionsAsync(string drawingId);

        /// <summary>
        /// Gets all connections for a project
        /// </summary>
        Task<IEnumerable<UserConnection>> GetProjectConnectionsAsync(string projectId);

        /// <summary>
        /// Updates connection metadata
        /// </summary>
        Task UpdateConnectionMetadataAsync(string connectionId, Dictionary<string, object> metadata);

        /// <summary>
        /// Gets user presence information
        /// </summary>
        Task<UserPresenceDto?> GetUserPresenceAsync(Guid userId);

        /// <summary>
        /// Updates user presence status
        /// </summary>
        Task UpdateUserPresenceAsync(Guid userId, string status, string? currentDrawingId = null, string? currentProjectId = null);

        /// <summary>
        /// Gets all active users in a drawing
        /// </summary>
        Task<IEnumerable<UserPresenceDto>> GetActiveUsersInDrawingAsync(string drawingId);

        /// <summary>
        /// Gets all active users in a project
        /// </summary>
        Task<IEnumerable<UserPresenceDto>> GetActiveUsersInProjectAsync(string projectId);

        /// <summary>
        /// Cleans up expired connections
        /// </summary>
        Task CleanupExpiredConnectionsAsync();
    }
}