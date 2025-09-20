using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Ergoplanner.Application.DTOs.SignalR;
using Ergoplanner.Application.Interfaces;

namespace Ergoplanner.Infrastructure.SignalR
{
    /// <summary>
    /// SignalR Hub for real-time drawing collaboration
    /// </summary>
    [Authorize]
    public class DrawingHub : Hub
    {
        private readonly IConnectionManagerService _connectionManager;
        private readonly ILogger<DrawingHub> _logger;
        private const int MaxConcurrentEditorsPerDrawing = 10;

        public DrawingHub(
            IConnectionManagerService connectionManager,
            ILogger<DrawingHub> logger)
        {
            _connectionManager = connectionManager;
            _logger = logger;
        }

        /// <summary>
        /// Joins a drawing room for collaboration
        /// </summary>
        public async Task JoinDrawing(string drawingId, string? projectId = null)
        {
            try
            {
                var userId = GetUserId();
                var userName = GetUserName();

                _logger.LogInformation("User {UserId} ({UserName}) joining drawing {DrawingId}",
                    userId, userName, drawingId);

                // Check if drawing room has space for more collaborators
                var activeUsers = await _connectionManager.GetActiveUsersInDrawingAsync(drawingId);
                if (activeUsers.Count() >= MaxConcurrentEditorsPerDrawing)
                {
                    await Clients.Caller.SendAsync("DrawingJoinFailed",
                        "Maximum number of concurrent editors reached for this drawing");
                    return;
                }

                // Add to SignalR group
                await Groups.AddToGroupAsync(Context.ConnectionId, $"drawing_{drawingId}");

                // Register connection
                await _connectionManager.AddConnectionAsync(
                    Context.ConnectionId, userId, "DrawingHub", drawingId, projectId);

                // Update user presence
                await _connectionManager.UpdateUserPresenceAsync(userId, "online", drawingId, projectId);

                // Notify other users in the drawing
                var userPresence = await _connectionManager.GetUserPresenceAsync(userId);
                if (userPresence != null)
                {
                    await Clients.Group($"drawing_{drawingId}").SendAsync("UserJoined", userPresence);
                }

                // Send current active users to the joining user
                var currentUsers = await _connectionManager.GetActiveUsersInDrawingAsync(drawingId);
                await Clients.Caller.SendAsync("ActiveUsers", currentUsers);

                await Clients.Caller.SendAsync("DrawingJoinSuccess", drawingId);

                _logger.LogInformation("User {UserId} successfully joined drawing {DrawingId}",
                    userId, drawingId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error joining drawing {DrawingId} for user {UserId}",
                    drawingId, GetUserId());
                await Clients.Caller.SendAsync("DrawingJoinFailed", "Failed to join drawing");
            }
        }

        /// <summary>
        /// Leaves a drawing room
        /// </summary>
        public async Task LeaveDrawing(string drawingId)
        {
            try
            {
                var userId = GetUserId();
                var userName = GetUserName();

                _logger.LogInformation("User {UserId} ({UserName}) leaving drawing {DrawingId}",
                    userId, userName, drawingId);

                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"drawing_{drawingId}");

                // Update user presence
                await _connectionManager.UpdateUserPresenceAsync(userId, "away");

                // Notify other users
                var userPresence = await _connectionManager.GetUserPresenceAsync(userId);
                if (userPresence != null)
                {
                    await Clients.Group($"drawing_{drawingId}").SendAsync("UserLeft", userPresence);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error leaving drawing {DrawingId} for user {UserId}",
                    drawingId, GetUserId());
            }
        }

        /// <summary>
        /// Sends drawing update to all users in the drawing
        /// </summary>
        public async Task SendDrawingUpdate(string drawingId, object updateData, string updateType)
        {
            try
            {
                var userId = GetUserId();
                var userName = GetUserName();

                var update = new DrawingUpdateDto
                {
                    DrawingId = Guid.Parse(drawingId),
                    UserId = userId,
                    UserName = userName,
                    UpdateType = updateType,
                    UpdateData = updateData as Dictionary<string, object> ?? new Dictionary<string, object>(),
                    Timestamp = DateTime.UtcNow
                };

                _logger.LogDebug("Broadcasting drawing update from user {UserId} to drawing {DrawingId}: {UpdateType}",
                    userId, drawingId, updateType);

                // Broadcast to all users in the drawing except the sender
                await Clients.GroupExcept($"drawing_{drawingId}", Context.ConnectionId)
                    .SendAsync("DrawingUpdate", update);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending drawing update for drawing {DrawingId} from user {UserId}",
                    drawingId, GetUserId());
            }
        }

        /// <summary>
        /// Updates cursor position for real-time collaboration
        /// </summary>
        public async Task UpdateCursorPosition(string drawingId, double x, double y, string? viewportId = null)
        {
            try
            {
                var userId = GetUserId();
                var userName = GetUserName();

                var cursorPosition = new CursorPositionDto
                {
                    UserId = userId,
                    UserName = userName,
                    X = x,
                    Y = y,
                    Timestamp = DateTime.UtcNow,
                    ViewportId = viewportId
                };

                // Broadcast cursor position to all users in the drawing except the sender
                await Clients.GroupExcept($"drawing_{drawingId}", Context.ConnectionId)
                    .SendAsync("CursorUpdate", cursorPosition);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating cursor position for drawing {DrawingId} from user {UserId}",
                    drawingId, GetUserId());
            }
        }

        /// <summary>
        /// Requests exclusive lock on a component for editing
        /// </summary>
        public async Task RequestComponentLock(string drawingId, string componentId)
        {
            try
            {
                var userId = GetUserId();
                var userName = GetUserName();

                _logger.LogInformation("User {UserId} requesting lock on component {ComponentId} in drawing {DrawingId}",
                    userId, componentId, drawingId);

                // For now, we'll implement optimistic locking - broadcast the lock request
                // In a production system, you'd want to check against a distributed lock store
                var lockData = new
                {
                    DrawingId = drawingId,
                    ComponentId = componentId,
                    UserId = userId,
                    UserName = userName,
                    Timestamp = DateTime.UtcNow
                };

                await Clients.Group($"drawing_{drawingId}")
                    .SendAsync("ComponentLockRequested", lockData);

                await Clients.Caller.SendAsync("ComponentLockGranted", lockData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error requesting component lock for component {ComponentId} in drawing {DrawingId}",
                    componentId, drawingId);
            }
        }

        /// <summary>
        /// Releases lock on a component
        /// </summary>
        public async Task ReleaseComponentLock(string drawingId, string componentId)
        {
            try
            {
                var userId = GetUserId();
                var userName = GetUserName();

                _logger.LogInformation("User {UserId} releasing lock on component {ComponentId} in drawing {DrawingId}",
                    userId, componentId, drawingId);

                var lockData = new
                {
                    DrawingId = drawingId,
                    ComponentId = componentId,
                    UserId = userId,
                    UserName = userName,
                    Timestamp = DateTime.UtcNow
                };

                await Clients.Group($"drawing_{drawingId}")
                    .SendAsync("ComponentLockReleased", lockData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error releasing component lock for component {ComponentId} in drawing {DrawingId}",
                    componentId, drawingId);
            }
        }

        /// <summary>
        /// Broadcasts user selection changes
        /// </summary>
        public async Task UpdateUserSelection(string drawingId, string[] selectedComponentIds)
        {
            try
            {
                var userId = GetUserId();
                var userName = GetUserName();

                var selectionData = new
                {
                    DrawingId = drawingId,
                    UserId = userId,
                    UserName = userName,
                    SelectedComponents = selectedComponentIds,
                    Timestamp = DateTime.UtcNow
                };

                await Clients.GroupExcept($"drawing_{drawingId}", Context.ConnectionId)
                    .SendAsync("UserSelectionUpdate", selectionData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user selection for drawing {DrawingId} from user {UserId}",
                    drawingId, GetUserId());
            }
        }

        public override async Task OnConnectedAsync()
        {
            var userId = GetUserId();
            var userName = GetUserName();

            _logger.LogInformation("User {UserId} ({UserName}) connected to DrawingHub with connection {ConnectionId}",
                userId, userName, Context.ConnectionId);

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = GetUserId();
            var userName = GetUserName();

            _logger.LogInformation("User {UserId} ({UserName}) disconnected from DrawingHub. Connection: {ConnectionId}",
                userId, userName, Context.ConnectionId);

            if (exception != null)
            {
                _logger.LogError(exception, "User {UserId} disconnected with error", userId);
            }

            // Clean up connection
            await _connectionManager.RemoveConnectionAsync(Context.ConnectionId);

            await base.OnDisconnectedAsync(exception);
        }

        private Guid GetUserId()
        {
            var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
        }

        private string GetUserName()
        {
            return Context.User?.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown User";
        }
    }
}