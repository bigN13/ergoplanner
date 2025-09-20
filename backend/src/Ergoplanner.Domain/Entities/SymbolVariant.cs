using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.Enums;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Different variants/representations of the same symbol
    /// </summary>
    public class SymbolVariant : BaseEntity, IOrganizationScoped, ISoftDelete
    {
        public Guid OrganizationId { get; set; }
        public Guid ParentSymbolId { get; set; }
        public Guid VariantSymbolId { get; set; }
        public VariantType VariantType { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public Dictionary<string, object> VariantProperties { get; set; } = new();
        public Dictionary<string, object> Metadata { get; set; } = new();
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; } = 0;

        // Soft delete
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }
        public Guid? DeletedBy { get; set; }

        // Navigation properties
        public virtual Organization Organization { get; set; } = null!;
        public virtual Symbol ParentSymbol { get; set; } = null!;
        public virtual Symbol VariantSymbol { get; set; } = null!;
        public virtual User? CreatedByUser { get; set; }
        public virtual User? DeletedByUser { get; set; }
    }
}