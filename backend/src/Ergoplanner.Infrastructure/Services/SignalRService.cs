using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Ergoplanner.Application.DTOs.SignalR;
using Ergoplanner.Application.Interfaces;
using Ergoplanner.Infrastructure.SignalR;

namespace Ergoplanner.Infrastructure.Services
{
    /// <summary>
    /// Service for sending SignalR messages
    /// </summary>
    public class SignalRService : ISignalRService
    {
        private readonly IHubContext<DrawingHub> _drawingHubContext;
        private readonly IHubContext<NotificationHub> _notificationHubContext;
        private readonly IHubContext<WorkflowHub> _workflowHubContext;
        private readonly IConnectionManagerService _connectionManager;
        private readonly ILogger<SignalRService> _logger;

        public SignalRService(
            IHubContext<DrawingHub> drawingHubContext,
            IHubContext<NotificationHub> notificationHubContext,
            IHubContext<WorkflowHub> workflowHubContext,
            IConnectionManagerService connectionManager,
            ILogger<SignalRService> logger)
        {
            _drawingHubContext = drawingHubContext;
            _notificationHubContext = notificationHubContext;
            _workflowHubContext = workflowHubContext;
            _connectionManager = connectionManager;
            _logger = logger;
        }

        public async Task SendDrawingUpdateAsync(string drawingId, DrawingUpdateDto update)
        {
            try
            {
                _logger.LogDebug("Sending drawing update to drawing {DrawingId}: {UpdateType}",
                    drawingId, update.UpdateType);

                await _drawingHubContext.Clients.Group($"drawing_{drawingId}")
                    .SendAsync("DrawingUpdate", update);

                _logger.LogDebug("Successfully sent drawing update to drawing {DrawingId}", drawingId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending drawing update to drawing {DrawingId}", drawingId);
                throw;
            }
        }

        public async Task SendDrawingUpdateToUsersAsync(IEnumerable<Guid> userIds, DrawingUpdateDto update)
        {
            try
            {
                _logger.LogDebug("Sending drawing update to {UserCount} users: {UpdateType}",
                    userIds.Count(), update.UpdateType);

                var connectionIds = new List<string>();

                foreach (var userId in userIds)
                {
                    var userConnections = await _connectionManager.GetUserConnectionsAsync(userId);
                    var drawingConnections = userConnections.Where(c => c.HubName == "DrawingHub");
                    connectionIds.AddRange(drawingConnections.Select(c => c.ConnectionId));
                }

                if (connectionIds.Any())
                {
                    await _drawingHubContext.Clients.Clients(connectionIds)
                        .SendAsync("DrawingUpdate", update);

                    _logger.LogDebug("Successfully sent drawing update to {ConnectionCount} connections",
                        connectionIds.Count);
                }
                else
                {
                    _logger.LogWarning("No active drawing connections found for specified users");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending drawing update to users");
                throw;
            }
        }

        public async Task SendCursorUpdateAsync(string drawingId, CursorPositionDto cursorPosition)
        {
            try
            {
                _logger.LogDebug("Sending cursor update for user {UserId} in drawing {DrawingId}",
                    cursorPosition.UserId, drawingId);

                await _drawingHubContext.Clients.Group($"drawing_{drawingId}")
                    .SendAsync("CursorUpdate", cursorPosition);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending cursor update for drawing {DrawingId}", drawingId);
                throw;
            }
        }

        public async Task SendUserPresenceUpdateAsync(string? drawingId, string? projectId, UserPresenceDto userPresence)
        {
            try
            {
                _logger.LogDebug("Sending user presence update for user {UserId}: {Status}",
                    userPresence.UserId, userPresence.Status);

                var tasks = new List<Task>();

                // Send to drawing group if specified
                if (!string.IsNullOrEmpty(drawingId))
                {
                    tasks.Add(_drawingHubContext.Clients.Group($"drawing_{drawingId}")
                        .SendAsync("UserPresenceUpdate", userPresence));
                }

                // Send to project workflows if specified
                if (!string.IsNullOrEmpty(projectId))
                {
                    tasks.Add(_workflowHubContext.Clients.Group($"project_workflows_{projectId}")
                        .SendAsync("UserPresenceUpdate", userPresence));
                }

                // Send to user's notification connections
                tasks.Add(_notificationHubContext.Clients.Group($"user_{userPresence.UserId}")
                    .SendAsync("UserPresenceUpdate", userPresence));

                await Task.WhenAll(tasks);

                _logger.LogDebug("Successfully sent user presence update for user {UserId}", userPresence.UserId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending user presence update for user {UserId}", userPresence.UserId);
                throw;
            }
        }

        public async Task SendNotificationToUserAsync(Guid userId, NotificationDto notification)
        {
            try
            {
                _logger.LogInformation("Sending notification to user {UserId}: {Title}",
                    userId, notification.Title);

                await _notificationHubContext.Clients.Group($"user_{userId}")
                    .SendAsync("NotificationReceived", notification);

                _logger.LogDebug("Successfully sent notification to user {UserId}", userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending notification to user {UserId}", userId);
                throw;
            }
        }

        public async Task SendNotificationToUsersAsync(IEnumerable<Guid> userIds, NotificationDto notification)
        {
            try
            {
                _logger.LogInformation("Sending notification to {UserCount} users: {Title}",
                    userIds.Count(), notification.Title);

                var tasks = userIds.Select(userId =>
                    _notificationHubContext.Clients.Group($"user_{userId}")
                        .SendAsync("NotificationReceived", notification));

                await Task.WhenAll(tasks);

                _logger.LogDebug("Successfully sent notification to {UserCount} users", userIds.Count());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending notification to multiple users");
                throw;
            }
        }

        public async Task SendNotificationToOrganizationAsync(Guid organizationId, NotificationDto notification)
        {
            try
            {
                _logger.LogInformation("Sending notification to organization {OrganizationId}: {Title}",
                    organizationId, notification.Title);

                await _notificationHubContext.Clients.Group($"org_{organizationId}")
                    .SendAsync("NotificationReceived", notification);

                _logger.LogDebug("Successfully sent notification to organization {OrganizationId}", organizationId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending notification to organization {OrganizationId}", organizationId);
                throw;
            }
        }

        public async Task SendWorkflowUpdateAsync(WorkflowUpdateDto workflowUpdate)
        {
            try
            {
                _logger.LogInformation("Sending workflow update for workflow {WorkflowId}: {UpdateType}",
                    workflowUpdate.WorkflowId, workflowUpdate.UpdateType);

                var tasks = new List<Task>();

                // Send to specific workflow group
                tasks.Add(_workflowHubContext.Clients.Group($"workflow_{workflowUpdate.WorkflowId}")
                    .SendAsync("WorkflowUpdate", workflowUpdate));

                // Send to project workflows group
                tasks.Add(_workflowHubContext.Clients.Group($"project_workflows_{workflowUpdate.DrawingId}")
                    .SendAsync("WorkflowUpdate", workflowUpdate));

                // Send to drawing group (for users actively editing the drawing)
                tasks.Add(_drawingHubContext.Clients.Group($"drawing_{workflowUpdate.DrawingId}")
                    .SendAsync("WorkflowUpdate", workflowUpdate));

                await Task.WhenAll(tasks);

                _logger.LogDebug("Successfully sent workflow update for workflow {WorkflowId}",
                    workflowUpdate.WorkflowId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending workflow update for workflow {WorkflowId}",
                    workflowUpdate.WorkflowId);
                throw;
            }
        }

        public async Task SendSystemAnnouncementAsync(NotificationDto announcement)
        {
            try
            {
                _logger.LogInformation("Sending system announcement: {Title}", announcement.Title);

                // Send to all connected clients across all hubs
                var tasks = new List<Task>
                {
                    _notificationHubContext.Clients.All.SendAsync("SystemAnnouncement", announcement),
                    _drawingHubContext.Clients.All.SendAsync("SystemAnnouncement", announcement),
                    _workflowHubContext.Clients.All.SendAsync("SystemAnnouncement", announcement)
                };

                await Task.WhenAll(tasks);

                _logger.LogInformation("Successfully sent system announcement: {Title}", announcement.Title);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending system announcement: {Title}", announcement.Title);
                throw;
            }
        }
    }
}