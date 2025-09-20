using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.Enums;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Symbol entity representing P&ID symbols library
    /// </summary>
    public class Symbol : BaseEntity, IOrganizationScoped, ISoftDelete
    {
        public Guid OrganizationId { get; set; }
        public Guid? CategoryId { get; set; }
        public Guid? TemplateId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string SvgContent { get; set; } = string.Empty;
        public string? ThumbnailUrl { get; set; }
        public SymbolType SymbolType { get; set; }
        public SymbolStatus Status { get; set; } = SymbolStatus.Draft;
        public int Version { get; set; } = 1;
        public string? VersionNotes { get; set; }
        public Dictionary<string, object> Properties { get; set; } = new();
        public Dictionary<string, object> Metadata { get; set; } = new();
        public List<string> Tags { get; set; } = new();
        public bool IsCustom { get; set; } = false;
        public bool IsTemplate { get; set; } = false;
        public bool IsPublic { get; set; } = false;
        public AccessLevel AccessLevel { get; set; } = AccessLevel.Organization;
        public int UsageCount { get; set; } = 0;
        public decimal? Rating { get; set; }
        public int ReviewCount { get; set; } = 0;

        // Approval workflow
        public Guid? ApprovedBy { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public string? ApprovalNotes { get; set; }

        // Soft delete
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }
        public Guid? DeletedBy { get; set; }

        // Navigation properties
        public virtual Organization Organization { get; set; } = null!;
        public virtual SymbolCategory? Category { get; set; }
        public virtual SymbolTemplate? Template { get; set; }
        public virtual User? CreatedByUser { get; set; }
        public virtual User? ApprovedByUser { get; set; }
        public virtual User? DeletedByUser { get; set; }
        public virtual ICollection<Component> Components { get; set; } = new List<Component>();
        public virtual ICollection<SymbolVersion> Versions { get; set; } = new List<SymbolVersion>();
        public virtual ICollection<SymbolProperty> SymbolProperties { get; set; } = new List<SymbolProperty>();
        public virtual ICollection<SymbolSpecification> Specifications { get; set; } = new List<SymbolSpecification>();
        public virtual ICollection<SymbolStandard> Standards { get; set; } = new List<SymbolStandard>();
        public virtual ICollection<SymbolUsage> UsageHistory { get; set; } = new List<SymbolUsage>();
        public virtual ICollection<SymbolFavorite> FavoritedBy { get; set; } = new List<SymbolFavorite>();
        public virtual ICollection<SymbolFeedback> Feedback { get; set; } = new List<SymbolFeedback>();
        public virtual ICollection<SymbolVariant> Variants { get; set; } = new List<SymbolVariant>();
        public virtual ICollection<SymbolApproval> Approvals { get; set; } = new List<SymbolApproval>();
        public virtual ICollection<SymbolChangeLog> ChangeLogs { get; set; } = new List<SymbolChangeLog>();
    }
}