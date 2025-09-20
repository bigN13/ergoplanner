using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Bill of Quantities item entity
    /// </summary>
    public class BoQItem : BaseEntity
    {
        public Guid ProjectId { get; set; }
        public Guid? DrawingId { get; set; }
        public Guid? ComponentId { get; set; }
        public string ItemCode { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Specification { get; set; }
        public string? Unit { get; set; }
        public decimal? Quantity { get; set; }
        public decimal? UnitPrice { get; set; }
        public decimal? TotalPrice { get; set; }
        public string? Supplier { get; set; }
        public string? Manufacturer { get; set; }
        public string? ModelNumber { get; set; }
        public int? LeadTimeDays { get; set; }
        public string? Category { get; set; }
        public string Status { get; set; } = "pending";
        public string? Notes { get; set; }
        public Dictionary<string, object> Metadata { get; set; } = new();

        // Navigation properties
        public virtual Project Project { get; set; } = null!;
        public virtual Drawing? Drawing { get; set; }
        public virtual Component? Component { get; set; }
    }
}