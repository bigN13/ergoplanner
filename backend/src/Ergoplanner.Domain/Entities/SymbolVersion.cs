using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.Enums;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Version history and management for symbols
    /// </summary>
    public class SymbolVersion : BaseEntity, IOrganizationScoped
    {
        public Guid OrganizationId { get; set; }
        public Guid SymbolId { get; set; }
        public int VersionNumber { get; set; }
        public string? VersionLabel { get; set; }
        public string? ChangeDescription { get; set; }
        public SymbolStatus Status { get; set; } = SymbolStatus.Draft;
        public string SvgContent { get; set; } = string.Empty;
        public string? ThumbnailUrl { get; set; }
        public Dictionary<string, object> Properties { get; set; } = new();
        public Dictionary<string, object> Metadata { get; set; } = new();
        public List<string> Tags { get; set; } = new();
        public bool IsMajorVersion { get; set; } = false;
        public bool IsCurrentVersion { get; set; } = false;
        public string? ChecksumSha256 { get; set; }
        public long? FileSizeBytes { get; set; }

        // Approval tracking
        public Guid? ApprovedBy { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public string? ApprovalNotes { get; set; }

        // Navigation properties
        public virtual Organization Organization { get; set; } = null!;
        public virtual Symbol Symbol { get; set; } = null!;
        public virtual User? CreatedByUser { get; set; }
        public virtual User? ApprovedByUser { get; set; }
        public virtual ICollection<SymbolApproval> Approvals { get; set; } = new List<SymbolApproval>();
        public virtual ICollection<SymbolChangeLog> ChangeLogs { get; set; } = new List<SymbolChangeLog>();
    }
}