using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Symbol usage tracking for analytics and recommendations
    /// </summary>
    public class SymbolUsage : BaseEntity, IOrganizationScoped
    {
        public Guid OrganizationId { get; set; }
        public Guid SymbolId { get; set; }
        public Guid UserId { get; set; }
        public Guid? ProjectId { get; set; }
        public Guid? DrawingId { get; set; }
        public Guid? ComponentId { get; set; }
        public string UsageType { get; set; } = string.Empty; // Added, Modified, Viewed, Removed
        public string? Context { get; set; } // Drawing, Library, Search, etc.
        public DateTime UsedAt { get; set; }
        public TimeSpan? Duration { get; set; }
        public string? UserAgent { get; set; }
        public string? IpAddress { get; set; }
        public string? SessionId { get; set; }
        public Dictionary<string, object> Metadata { get; set; } = new();

        // Navigation properties
        public virtual Organization Organization { get; set; } = null!;
        public virtual Symbol Symbol { get; set; } = null!;
        public virtual User User { get; set; } = null!;
        public virtual Project? Project { get; set; }
        public virtual Drawing? Drawing { get; set; }
        public virtual Component? Component { get; set; }
    }
}