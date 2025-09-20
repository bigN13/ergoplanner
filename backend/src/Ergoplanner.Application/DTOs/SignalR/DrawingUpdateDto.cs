using System;
using System.Collections.Generic;

namespace Ergoplanner.Application.DTOs.SignalR
{
    /// <summary>
    /// DTO for drawing update events
    /// </summary>
    public class DrawingUpdateDto
    {
        public Guid DrawingId { get; set; }
        public Guid UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UpdateType { get; set; } = string.Empty; // "component_added", "component_updated", "component_deleted", etc.
        public Dictionary<string, object> UpdateData { get; set; } = new();
        public DateTime Timestamp { get; set; }
        public string? AffectedComponentId { get; set; }
        public Dictionary<string, object> Metadata { get; set; } = new();
    }
}