using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.ValueObjects;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// BoQ Item Pricing entity for tracking pricing applied to BoQ items
    /// </summary>
    public class BoQItemPricing : BaseEntity
    {
        public Guid BoQItemId { get; set; }
        public Guid? MaterialPricingId { get; set; }
        public Money? OriginalUnitPrice { get; set; }
        public Money? AdjustedUnitPrice { get; set; }
        public Money? FinalUnitPrice { get; set; }
        public decimal Quantity { get; set; }
        public Money? TotalPrice { get; set; }
        public DateTime PricingDate { get; set; } = DateTime.UtcNow;
        public string? PricingSource { get; set; } // Quote, Catalog, Estimate, etc.
        public string? QuoteReference { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsApproved { get; set; } = false;
        public Guid? ApprovedBy { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public string? Notes { get; set; }
        public Dictionary<string, object> Adjustments { get; set; } = new(); // Record of pricing rule adjustments
        public Dictionary<string, object> Metadata { get; set; } = new();

        // Navigation properties
        public virtual BoQItem BoQItem { get; set; } = null!;
        public virtual MaterialPricing? MaterialPricing { get; set; }
        public virtual User? CreatedByUser { get; set; }
        public virtual User? UpdatedByUser { get; set; }
        public virtual User? ApprovedByUser { get; set; }

        /// <summary>
        /// Calculate total price
        /// </summary>
        public void CalculateTotalPrice()
        {
            var unitPrice = FinalUnitPrice ?? AdjustedUnitPrice ?? OriginalUnitPrice;
            if (unitPrice?.Amount > 0)
            {
                TotalPrice = new Money(unitPrice.Amount * Quantity, unitPrice.Currency);
            }
        }

        /// <summary>
        /// Apply pricing adjustment
        /// </summary>
        public void ApplyAdjustment(string adjustmentType, Money adjustmentAmount, string? reason = null)
        {
            var currentPrice = AdjustedUnitPrice ?? OriginalUnitPrice;
            if (currentPrice == null) return;

            AdjustedUnitPrice = adjustmentType.ToLower() switch
            {
                "add" => currentPrice.Add(adjustmentAmount),
                "subtract" => new Money(currentPrice.Amount - adjustmentAmount.Amount, currentPrice.Currency),
                "multiply" => currentPrice.Multiply(adjustmentAmount.Amount),
                "replace" => adjustmentAmount,
                _ => currentPrice
            };

            // Record the adjustment
            var adjustmentKey = $"Adjustment_{DateTime.UtcNow:yyyyMMddHHmmss}";
            Adjustments[adjustmentKey] = new
            {
                Type = adjustmentType,
                Amount = adjustmentAmount.Amount,
                Currency = adjustmentAmount.Currency,
                Reason = reason,
                Date = DateTime.UtcNow,
                PreviousPrice = currentPrice.Amount,
                NewPrice = AdjustedUnitPrice?.Amount
            };

            CalculateTotalPrice();
        }

        /// <summary>
        /// Finalize pricing
        /// </summary>
        public void FinalizePricing(Guid? approvedByUserId = null)
        {
            FinalUnitPrice = AdjustedUnitPrice ?? OriginalUnitPrice;
            CalculateTotalPrice();

            if (approvedByUserId.HasValue)
            {
                IsApproved = true;
                ApprovedBy = approvedByUserId;
                ApprovedAt = DateTime.UtcNow;
            }
        }

        /// <summary>
        /// Get total adjustment amount
        /// </summary>
        public Money? GetTotalAdjustmentAmount()
        {
            if (OriginalUnitPrice == null || FinalUnitPrice == null) return null;

            return new Money(
                FinalUnitPrice.Amount - OriginalUnitPrice.Amount,
                FinalUnitPrice.Currency
            );
        }

        /// <summary>
        /// Get adjustment percentage
        /// </summary>
        public decimal? GetAdjustmentPercentage()
        {
            if (OriginalUnitPrice?.Amount <= 0 || FinalUnitPrice == null) return null;

            var adjustment = FinalUnitPrice.Amount - OriginalUnitPrice.Amount;
            return (adjustment / OriginalUnitPrice.Amount) * 100;
        }

        /// <summary>
        /// Check if pricing has changed significantly
        /// </summary>
        public bool HasSignificantChange(decimal thresholdPercentage = 10)
        {
            var adjustmentPercentage = GetAdjustmentPercentage();
            return adjustmentPercentage.HasValue && Math.Abs(adjustmentPercentage.Value) >= thresholdPercentage;
        }

        /// <summary>
        /// Get pricing summary
        /// </summary>
        public string GetPricingSummary()
        {
            var summary = $"Original: {OriginalUnitPrice?.ToString() ?? "N/A"}";

            if (AdjustedUnitPrice != null && AdjustedUnitPrice.Amount != OriginalUnitPrice?.Amount)
            {
                summary += $", Adjusted: {AdjustedUnitPrice}";
            }

            if (FinalUnitPrice != null && FinalUnitPrice.Amount != AdjustedUnitPrice?.Amount)
            {
                summary += $", Final: {FinalUnitPrice}";
            }

            summary += $", Total: {TotalPrice?.ToString() ?? "N/A"}";

            var adjustmentPercentage = GetAdjustmentPercentage();
            if (adjustmentPercentage.HasValue && Math.Abs(adjustmentPercentage.Value) > 0.01m)
            {
                summary += $" ({adjustmentPercentage:+0.##;-0.##}%)";
            }

            return summary;
        }
    }
}