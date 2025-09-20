using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.Enums;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Reusable symbol template configurations
    /// </summary>
    public class SymbolTemplate : BaseEntity, IOrganizationScoped, ISoftDelete
    {
        public Guid OrganizationId { get; set; }
        public Guid? CategoryId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Description { get; set; }
        public SymbolType SymbolType { get; set; }
        public string BaseSvgContent { get; set; } = string.Empty;
        public string? ThumbnailUrl { get; set; }
        public Dictionary<string, object> DefaultProperties { get; set; } = new();
        public Dictionary<string, object> Metadata { get; set; } = new();
        public List<string> Tags { get; set; } = new();
        public AccessLevel AccessLevel { get; set; } = AccessLevel.Organization;
        public bool IsStandard { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public int UsageCount { get; set; } = 0;
        public decimal? Rating { get; set; }

        // Soft delete
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }
        public Guid? DeletedBy { get; set; }

        // Navigation properties
        public virtual Organization Organization { get; set; } = null!;
        public virtual SymbolCategory? Category { get; set; }
        public virtual User? CreatedByUser { get; set; }
        public virtual User? DeletedByUser { get; set; }
        public virtual ICollection<Symbol> Symbols { get; set; } = new List<Symbol>();
        public virtual ICollection<SymbolProperty> TemplateProperties { get; set; } = new List<SymbolProperty>();
    }
}