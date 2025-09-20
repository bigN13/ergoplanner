using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Drawing version entity for version control
    /// </summary>
    public class DrawingVersion : BaseEntity
    {
        public Guid DrawingId { get; set; }
        public string Version { get; set; } = string.Empty;
        public string? PreviousVersion { get; set; }
        public string? ChangeLog { get; set; }
        public Dictionary<string, object> DrawingData { get; set; } = new();
        public Dictionary<string, object> Metadata { get; set; } = new();
        public bool IsSnapshot { get; set; } = false;
        public string? Tag { get; set; }
        public string? Branch { get; set; }

        // Navigation properties
        public virtual Drawing Drawing { get; set; } = null!;
        public virtual User? CreatedByUser { get; set; }
    }
}