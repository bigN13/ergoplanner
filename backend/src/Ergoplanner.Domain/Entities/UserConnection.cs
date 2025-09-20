using System;
using Ergoplanner.Domain.Common;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Represents a SignalR connection for a user
    /// </summary>
    public class UserConnection : BaseEntity
    {
        public Guid UserId { get; set; }
        public string ConnectionId { get; set; } = string.Empty;
        public string HubName { get; set; } = string.Empty;
        public string? DrawingId { get; set; }
        public string? ProjectId { get; set; }
        public DateTime ConnectedAt { get; set; }
        public DateTime LastActivity { get; set; }
        public string UserAgent { get; set; } = string.Empty;
        public string IpAddress { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public Dictionary<string, object> Metadata { get; set; } = new();

        // Navigation properties
        public virtual User User { get; set; } = null!;
    }
}