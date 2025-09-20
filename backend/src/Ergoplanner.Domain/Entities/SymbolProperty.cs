using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.Enums;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Configurable properties for symbols and templates
    /// </summary>
    public class SymbolProperty : BaseEntity, IOrganizationScoped
    {
        public Guid OrganizationId { get; set; }
        public Guid? SymbolId { get; set; }
        public Guid? TemplateId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Description { get; set; }
        public PropertyDataType DataType { get; set; }
        public string? DefaultValue { get; set; }
        public string? Unit { get; set; }
        public decimal? MinValue { get; set; }
        public decimal? MaxValue { get; set; }
        public List<string> AllowedValues { get; set; } = new();
        public string? ValidationPattern { get; set; }
        public bool IsRequired { get; set; } = false;
        public bool IsCalculated { get; set; } = false;
        public string? CalculationFormula { get; set; }
        public bool IsEditable { get; set; } = true;
        public bool IsVisible { get; set; } = true;
        public int SortOrder { get; set; } = 0;
        public string? Category { get; set; }
        public Dictionary<string, object> Metadata { get; set; } = new();

        // Navigation properties
        public virtual Organization Organization { get; set; } = null!;
        public virtual Symbol? Symbol { get; set; }
        public virtual SymbolTemplate? Template { get; set; }
        public virtual User? CreatedByUser { get; set; }
    }
}