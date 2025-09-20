using System;
using System.Collections.Generic;

namespace Ergoplanner.Application.DTOs.SignalR
{
    /// <summary>
    /// DTO for user presence information
    /// </summary>
    public class UserPresenceDto
    {
        public Guid UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public string Status { get; set; } = "online"; // "online", "away", "busy", "offline"
        public DateTime LastSeen { get; set; }
        public string? CurrentDrawingId { get; set; }
        public string? CurrentProjectId { get; set; }
        public Dictionary<string, object> Metadata { get; set; } = new();
    }

    /// <summary>
    /// DTO for notification messages
    /// </summary>
    public class NotificationDto
    {
        public Guid Id { get; set; }
        public Guid? UserId { get; set; }
        public string Type { get; set; } = string.Empty; // "info", "warning", "error", "success"
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public Dictionary<string, object> Data { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public bool IsRead { get; set; } = false;
        public string? ActionUrl { get; set; }
        public string? ActionText { get; set; }
    }

    /// <summary>
    /// DTO for workflow update events
    /// </summary>
    public class WorkflowUpdateDto
    {
        public Guid WorkflowId { get; set; }
        public Guid DrawingId { get; set; }
        public string WorkflowType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string UpdateType { get; set; } = string.Empty; // "stage_completed", "approval_required", "rejected", etc.
        public Guid? ActorUserId { get; set; }
        public string? ActorUserName { get; set; }
        public string? Comments { get; set; }
        public DateTime Timestamp { get; set; }
        public Dictionary<string, object> Metadata { get; set; } = new();
    }
}