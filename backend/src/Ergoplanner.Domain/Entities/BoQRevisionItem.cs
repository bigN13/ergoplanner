using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.ValueObjects;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// BoQ Revision Item entity for tracking individual item changes
    /// </summary>
    public class BoQRevisionItem : BaseEntity
    {
        public Guid RevisionId { get; set; }
        public Guid? BoQItemId { get; set; }
        public string ItemCode { get; set; } = string.Empty;
        public string ChangeType { get; set; } = string.Empty; // Added, Modified, Deleted
        public string? FieldName { get; set; } // Which field changed
        public string? PreviousValue { get; set; }
        public string? CurrentValue { get; set; }
        public Money? PreviousCost { get; set; }
        public Money? CurrentCost { get; set; }
        public Money? CostImpact { get; set; }
        public string? ChangeReason { get; set; }
        public Dictionary<string, object> Metadata { get; set; } = new();

        // Navigation properties
        public virtual BoQRevision Revision { get; set; } = null!;
        public virtual BoQItem? BoQItem { get; set; }

        /// <summary>
        /// Calculate cost impact
        /// </summary>
        public void CalculateCostImpact()
        {
            if (PreviousCost != null && CurrentCost != null)
            {
                CostImpact = new Money(
                    CurrentCost.Amount - PreviousCost.Amount,
                    CurrentCost.Currency
                );
            }
            else if (CurrentCost != null && PreviousCost == null)
            {
                // New item
                CostImpact = CurrentCost;
            }
            else if (PreviousCost != null && CurrentCost == null)
            {
                // Deleted item
                CostImpact = new Money(-PreviousCost.Amount, PreviousCost.Currency);
            }
        }
    }
}