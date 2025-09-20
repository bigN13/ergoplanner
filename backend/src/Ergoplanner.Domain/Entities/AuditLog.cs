using System;
using System.Collections.Generic;
using System.Net;
using Ergoplanner.Domain.Common;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Audit log entity for tracking system changes
    /// </summary>
    public class AuditLog
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string EntityType { get; set; } = string.Empty;
        public Guid EntityId { get; set; }
        public string Action { get; set; } = string.Empty;
        public Guid? UserId { get; set; }
        public Dictionary<string, object>? Changes { get; set; }
        public IPAddress? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public string? SessionId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual User? User { get; set; }
    }
}