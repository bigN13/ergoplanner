using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.Enums;
using Ergoplanner.Domain.ValueObjects;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Cost Breakdown entity for detailed cost analysis
    /// </summary>
    public class CostBreakdown : BaseEntity
    {
        public Guid? BoQId { get; set; }
        public Guid? BoQItemId { get; set; }
        public Guid? CostCenterId { get; set; }
        public Guid? ProjectId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public CostType CostType { get; set; }
        public string? CostSubType { get; set; }
        public Money? EstimatedCost { get; set; }
        public Money? ActualCost { get; set; }
        public Money? BudgetedCost { get; set; }
        public Money? VarianceCost { get; set; }
        public decimal? VariancePercentage { get; set; }
        public decimal? Quantity { get; set; }
        public string? Unit { get; set; }
        public Money? UnitCost { get; set; }
        public decimal? AllocationPercentage { get; set; }
        public string? AllocationMethod { get; set; } // Direct, Percentage, Formula
        public Formula? AllocationFormula { get; set; }
        public bool IsDirectCost { get; set; } = true;
        public bool IsVariable { get; set; } = true;
        public string? CostDriver { get; set; }
        public DateTime? CostDate { get; set; }
        public string? Reference { get; set; }
        public string? Notes { get; set; }
        public Dictionary<string, object> Breakdown { get; set; } = new(); // Detailed breakdown
        public Dictionary<string, object> Metadata { get; set; } = new();
        public List<string> Tags { get; set; } = new();

        // Navigation properties
        public virtual BoQ? BoQ { get; set; }
        public virtual BoQItem? BoQItem { get; set; }
        public virtual CostCenter? CostCenter { get; set; }
        public virtual Project? Project { get; set; }
        public virtual ICollection<CostBreakdownItem> Items { get; set; } = new List<CostBreakdownItem>();
        public virtual User? CreatedByUser { get; set; }
        public virtual User? UpdatedByUser { get; set; }

        /// <summary>
        /// Calculate variance
        /// </summary>
        public void CalculateVariance()
        {
            if (BudgetedCost?.Amount > 0 && ActualCost?.Amount > 0)
            {
                VarianceCost = new Money(ActualCost.Amount - BudgetedCost.Amount, ActualCost.Currency);
                VariancePercentage = (VarianceCost.Amount / BudgetedCost.Amount) * 100;
            }
            else if (EstimatedCost?.Amount > 0 && ActualCost?.Amount > 0)
            {
                VarianceCost = new Money(ActualCost.Amount - EstimatedCost.Amount, ActualCost.Currency);
                VariancePercentage = (VarianceCost.Amount / EstimatedCost.Amount) * 100;
            }
        }

        /// <summary>
        /// Calculate unit cost
        /// </summary>
        public void CalculateUnitCost()
        {
            if (Quantity > 0)
            {
                var cost = ActualCost ?? EstimatedCost ?? BudgetedCost;
                if (cost?.Amount > 0)
                {
                    UnitCost = new Money(cost.Amount / Quantity.Value, cost.Currency);
                }
            }
        }

        /// <summary>
        /// Allocate cost based on allocation method
        /// </summary>
        public Money? AllocateCost(decimal allocationBase)
        {
            var baseCost = ActualCost ?? EstimatedCost ?? BudgetedCost;
            if (baseCost == null) return null;

            switch (AllocationMethod?.ToLower())
            {
                case "percentage":
                    if (AllocationPercentage.HasValue)
                    {
                        var allocatedAmount = baseCost.Amount * (AllocationPercentage.Value / 100);
                        return new Money(allocatedAmount, baseCost.Currency);
                    }
                    break;

                case "formula":
                    if (AllocationFormula != null)
                    {
                        // Formula evaluation would be implemented here
                        // For now, return proportional allocation
                        var allocatedAmount = baseCost.Amount * (allocationBase / 100);
                        return new Money(allocatedAmount, baseCost.Currency);
                    }
                    break;

                case "direct":
                default:
                    return baseCost;
            }

            return baseCost;
        }

        /// <summary>
        /// Add cost breakdown item
        /// </summary>
        public void AddBreakdownItem(string name, Money cost, string? description = null)
        {
            var item = new CostBreakdownItem
            {
                CostBreakdownId = Id,
                Name = name,
                Description = description,
                Cost = cost,
                Percentage = EstimatedCost?.Amount > 0 ? (cost.Amount / EstimatedCost.Amount) * 100 : 0
            };

            Items.Add(item);
        }

        /// <summary>
        /// Get total from breakdown items
        /// </summary>
        public Money? GetTotalFromItems()
        {
            if (!Items.Any()) return null;

            var currency = Items.First().Cost?.Currency ?? "USD";
            var total = Items.Sum(i => i.Cost?.Amount ?? 0);

            return new Money(total, currency);
        }

        /// <summary>
        /// Validate breakdown
        /// </summary>
        public bool IsBreakdownValid()
        {
            var totalFromItems = GetTotalFromItems();
            var baseCost = EstimatedCost ?? ActualCost ?? BudgetedCost;

            if (totalFromItems == null || baseCost == null) return true;

            // Allow 1% variance for rounding differences
            var variance = Math.Abs(totalFromItems.Amount - baseCost.Amount);
            var allowableVariance = baseCost.Amount * 0.01m;

            return variance <= allowableVariance;
        }

        /// <summary>
        /// Get cost status
        /// </summary>
        public string GetCostStatus()
        {
            if (ActualCost == null) return "Estimated";

            if (VariancePercentage.HasValue)
            {
                if (Math.Abs(VariancePercentage.Value) <= 5) return "On Target";
                if (VariancePercentage.Value > 5) return "Over Budget";
                if (VariancePercentage.Value < -5) return "Under Budget";
            }

            return "Actual";
        }

        /// <summary>
        /// Get cost efficiency ratio
        /// </summary>
        public decimal? GetEfficiencyRatio()
        {
            if (ActualCost?.Amount > 0 && EstimatedCost?.Amount > 0)
            {
                return EstimatedCost.Amount / ActualCost.Amount;
            }

            return null;
        }
    }

    /// <summary>
    /// Cost Breakdown Item entity for detailed cost components
    /// </summary>
    public class CostBreakdownItem : BaseEntity
    {
        public Guid CostBreakdownId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public Money? Cost { get; set; }
        public decimal? Percentage { get; set; }
        public decimal? Quantity { get; set; }
        public string? Unit { get; set; }
        public Money? UnitCost { get; set; }
        public string? Reference { get; set; }
        public int SortOrder { get; set; }
        public Dictionary<string, object> Metadata { get; set; } = new();

        // Navigation properties
        public virtual CostBreakdown CostBreakdown { get; set; } = null!;
    }
}