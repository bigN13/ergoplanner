using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Engineering specifications and ratings for symbols
    /// </summary>
    public class SymbolSpecification : BaseEntity, IOrganizationScoped
    {
        public Guid OrganizationId { get; set; }
        public Guid SymbolId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string SpecificationType { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
        public string? Unit { get; set; }
        public decimal? NumericValue { get; set; }
        public decimal? MinValue { get; set; }
        public decimal? MaxValue { get; set; }
        public string? Tolerance { get; set; }
        public string? TestMethod { get; set; }
        public string? ReferenceStandard { get; set; }
        public string? Manufacturer { get; set; }
        public string? Model { get; set; }
        public string? PartNumber { get; set; }
        public string? Material { get; set; }
        public string? Coating { get; set; }
        public string? CertificationRequired { get; set; }
        public DateTime? ValidFrom { get; set; }
        public DateTime? ValidTo { get; set; }
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; } = 0;
        public Dictionary<string, object> Metadata { get; set; } = new();

        // Navigation properties
        public virtual Organization Organization { get; set; } = null!;
        public virtual Symbol Symbol { get; set; } = null!;
        public virtual User? CreatedByUser { get; set; }
    }
}