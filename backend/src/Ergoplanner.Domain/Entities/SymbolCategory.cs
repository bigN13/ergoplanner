using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Hierarchical category system for organizing symbols
    /// </summary>
    public class SymbolCategory : BaseEntity, IOrganizationScoped, ISoftDelete
    {
        public Guid OrganizationId { get; set; }
        public Guid? ParentCategoryId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? IconSvg { get; set; }
        public string? Color { get; set; }
        public int SortOrder { get; set; } = 0;
        public int Level { get; set; } = 0;
        public string Path { get; set; } = string.Empty; // Materialized path for hierarchy
        public Dictionary<string, object> Metadata { get; set; } = new();
        public bool IsStandard { get; set; } = false;
        public bool IsActive { get; set; } = true;

        // Soft delete
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }
        public Guid? DeletedBy { get; set; }

        // Navigation properties
        public virtual Organization Organization { get; set; } = null!;
        public virtual SymbolCategory? ParentCategory { get; set; }
        public virtual User? CreatedByUser { get; set; }
        public virtual User? DeletedByUser { get; set; }
        public virtual ICollection<SymbolCategory> SubCategories { get; set; } = new List<SymbolCategory>();
        public virtual ICollection<Symbol> Symbols { get; set; } = new List<Symbol>();
    }
}