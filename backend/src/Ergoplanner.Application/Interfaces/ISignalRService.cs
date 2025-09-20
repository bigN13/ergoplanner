using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Ergoplanner.Application.DTOs.SignalR;

namespace Ergoplanner.Application.Interfaces
{
    /// <summary>
    /// Service for SignalR operations
    /// </summary>
    public interface ISignalRService
    {
        /// <summary>
        /// Sends a drawing update to all users in a drawing
        /// </summary>
        Task SendDrawingUpdateAsync(string drawingId, DrawingUpdateDto update);

        /// <summary>
        /// Sends a drawing update to specific users
        /// </summary>
        Task SendDrawingUpdateToUsersAsync(IEnumerable<Guid> userIds, DrawingUpdateDto update);

        /// <summary>
        /// Sends cursor position updates to a drawing
        /// </summary>
        Task SendCursorUpdateAsync(string drawingId, CursorPositionDto cursorPosition);

        /// <summary>
        /// Sends user presence updates to a drawing or project
        /// </summary>
        Task SendUserPresenceUpdateAsync(string? drawingId, string? projectId, UserPresenceDto userPresence);

        /// <summary>
        /// Sends a notification to a specific user
        /// </summary>
        Task SendNotificationToUserAsync(Guid userId, NotificationDto notification);

        /// <summary>
        /// Sends a notification to multiple users
        /// </summary>
        Task SendNotificationToUsersAsync(IEnumerable<Guid> userIds, NotificationDto notification);

        /// <summary>
        /// Sends a notification to all users in an organization
        /// </summary>
        Task SendNotificationToOrganizationAsync(Guid organizationId, NotificationDto notification);

        /// <summary>
        /// Sends workflow update to relevant users
        /// </summary>
        Task SendWorkflowUpdateAsync(WorkflowUpdateDto workflowUpdate);

        /// <summary>
        /// Sends a system announcement to all connected users
        /// </summary>
        Task SendSystemAnnouncementAsync(NotificationDto announcement);
    }
}