using System;
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
    /// SignalR Hub for system notifications
    /// </summary>
    [Authorize]
    public class NotificationHub : Hub
    {
        private readonly IConnectionManagerService _connectionManager;
        private readonly ILogger<NotificationHub> _logger;

        public NotificationHub(
            IConnectionManagerService connectionManager,
            ILogger<NotificationHub> logger)
        {
            _connectionManager = connectionManager;
            _logger = logger;
        }

        /// <summary>
        /// Joins user-specific notification group
        /// </summary>
        public async Task JoinUserNotifications()
        {
            try
            {
                var userId = GetUserId();
                var userName = GetUserName();

                _logger.LogInformation("User {UserId} ({UserName}) joining user notification group",
                    userId, userName);

                await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");

                // Register connection
                await _connectionManager.AddConnectionAsync(
                    Context.ConnectionId, userId, "NotificationHub");

                await Clients.Caller.SendAsync("NotificationGroupJoined", userId);

                _logger.LogInformation("User {UserId} successfully joined notification group", userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error joining notification group for user {UserId}", GetUserId());
                await Clients.Caller.SendAsync("NotificationGroupJoinFailed", "Failed to join notification group");
            }
        }

        /// <summary>
        /// Joins organization-wide notification group
        /// </summary>
        public async Task JoinOrganizationNotifications(string organizationId)
        {
            try
            {
                var userId = GetUserId();
                var userName = GetUserName();

                _logger.LogInformation("User {UserId} ({UserName}) joining organization {OrganizationId} notification group",
                    userId, userName, organizationId);

                await Groups.AddToGroupAsync(Context.ConnectionId, $"org_{organizationId}");

                await Clients.Caller.SendAsync("OrganizationNotificationGroupJoined", organizationId);

                _logger.LogInformation("User {UserId} successfully joined organization {OrganizationId} notification group",
                    userId, organizationId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error joining organization notification group for user {UserId}, org {OrganizationId}",
                    GetUserId(), organizationId);
                await Clients.Caller.SendAsync("OrganizationNotificationGroupJoinFailed",
                    "Failed to join organization notification group");
            }
        }

        /// <summary>
        /// Marks a notification as read
        /// </summary>
        public async Task MarkNotificationAsRead(Guid notificationId)
        {
            try
            {
                var userId = GetUserId();

                _logger.LogDebug("User {UserId} marking notification {NotificationId} as read",
                    userId, notificationId);

                // In a real implementation, you would update the notification in the database
                // For now, we'll just broadcast the event
                await Clients.Caller.SendAsync("NotificationMarkedAsRead", notificationId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking notification {NotificationId} as read for user {UserId}",
                    notificationId, GetUserId());
            }
        }

        /// <summary>
        /// Marks all notifications as read for a user
        /// </summary>
        public async Task MarkAllNotificationsAsRead()
        {
            try
            {
                var userId = GetUserId();

                _logger.LogDebug("User {UserId} marking all notifications as read", userId);

                // In a real implementation, you would update all unread notifications in the database
                await Clients.Caller.SendAsync("AllNotificationsMarkedAsRead");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking all notifications as read for user {UserId}", GetUserId());
            }
        }

        /// <summary>
        /// Requests current notification count
        /// </summary>
        public async Task GetNotificationCount()
        {
            try
            {
                var userId = GetUserId();

                _logger.LogDebug("User {UserId} requesting notification count", userId);

                // In a real implementation, you would query the database for unread notifications
                // For now, we'll return a mock count
                var unreadCount = 0; // This would be fetched from the database

                await Clients.Caller.SendAsync("NotificationCount", unreadCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting notification count for user {UserId}", GetUserId());
            }
        }

        /// <summary>
        /// Dismisses a notification
        /// </summary>
        public async Task DismissNotification(Guid notificationId)
        {
            try
            {
                var userId = GetUserId();

                _logger.LogDebug("User {UserId} dismissing notification {NotificationId}",
                    userId, notificationId);

                // In a real implementation, you would remove/hide the notification in the database
                await Clients.Caller.SendAsync("NotificationDismissed", notificationId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error dismissing notification {NotificationId} for user {UserId}",
                    notificationId, GetUserId());
            }
        }

        public override async Task OnConnectedAsync()
        {
            var userId = GetUserId();
            var userName = GetUserName();

            _logger.LogInformation("User {UserId} ({UserName}) connected to NotificationHub with connection {ConnectionId}",
                userId, userName, Context.ConnectionId);

            // Auto-join user's personal notification group
            await JoinUserNotifications();

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = GetUserId();
            var userName = GetUserName();

            _logger.LogInformation("User {UserId} ({UserName}) disconnected from NotificationHub. Connection: {ConnectionId}",
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