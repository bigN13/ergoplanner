using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Symbol entity representing P&ID symbols library
    /// </summary>
    public class Symbol : BaseEntity, IOrganizationScoped
    {
        public Guid OrganizationId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Category { get; set; }
        public string? Subcategory { get; set; }
        public string? Standard { get; set; }
        public string? SymbolType { get; set; }
        public string SvgContent { get; set; } = string.Empty;
        public string? ThumbnailUrl { get; set; }
        public Dictionary<string, object> Properties { get; set; } = new();
        public List<string> Tags { get; set; } = new();
        public bool IsCustom { get; set; } = false;
        public bool IsActive { get; set; } = true;

        // Navigation properties
        public virtual Organization Organization { get; set; } = null!;
        public virtual ICollection<Component> Components { get; set; } = new List<Component>();
        public virtual User? CreatedByUser { get; set; }
    }
}