using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.ValueObjects;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Pricing Rule Application entity for tracking rule usage
    /// </summary>
    public class PricingRuleApplication : BaseEntity
    {
        public Guid PricingRuleId { get; set; }
        public Guid BoQItemId { get; set; }
        public Money? AdjustmentAmount { get; set; }
        public DateTime ApplicationDate { get; set; } = DateTime.UtcNow;
        public string? Notes { get; set; }
        public Dictionary<string, object> Context { get; set; } = new(); // Context when rule was applied
        public Dictionary<string, object> Metadata { get; set; } = new();

        // Navigation properties
        public virtual PricingRule PricingRule { get; set; } = null!;
        public virtual BoQItem BoQItem { get; set; } = null!;
    }
}