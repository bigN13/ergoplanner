using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.Enums;
using Ergoplanner.Domain.ValueObjects;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// BoQ Template Item entity for template item definitions
    /// </summary>
    public class BoQTemplateItem : BaseEntity
    {
        public Guid SectionId { get; set; }
        public Guid? MaterialId { get; set; }
        public string ItemCode { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Specification { get; set; }
        public string? Unit { get; set; }
        public Money? UnitPrice { get; set; }
        public CostType CostType { get; set; } = CostType.Material;
        public Formula? QuantityFormula { get; set; }
        public string? Manufacturer { get; set; }
        public string? ModelNumber { get; set; }
        public LeadTime? StandardLeadTime { get; set; }
        public bool IsOptional { get; set; } = false;
        public bool RequiresApproval { get; set; } = false;
        public int SortOrder { get; set; }
        public Dictionary<string, object> Properties { get; set; } = new();
        public Dictionary<string, object> Metadata { get; set; } = new();
        public List<string> Tags { get; set; } = new();

        // Navigation properties
        public virtual BoQTemplateSection Section { get; set; } = null!;
        public virtual Material? Material { get; set; }
    }
}