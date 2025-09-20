using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.ValueObjects;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Material Pricing entity for price history and tiered pricing
    /// </summary>
    public class MaterialPricing : BaseEntity
    {
        public Guid MaterialId { get; set; }
        public Guid SupplierId { get; set; }
        public string? QuoteNumber { get; set; }
        public string? PriceListName { get; set; }
        public Money? UnitPrice { get; set; }
        public string Currency { get; set; } = "USD";
        public decimal? MinQuantity { get; set; }
        public decimal? MaxQuantity { get; set; }
        public DateTime EffectiveDate { get; set; } = DateTime.UtcNow;
        public DateTime? ExpiryDate { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsQuote { get; set; } = false;
        public bool IsContract { get; set; } = false;
        public bool IsSpotPrice { get; set; } = false;
        public string? PriceType { get; set; } // Standard, Volume, Contract, Spot
        public decimal? DiscountPercentage { get; set; }
        public Money? DiscountAmount { get; set; }
        public string? PaymentTerms { get; set; }
        public string? ShippingTerms { get; set; }
        public LeadTime? LeadTime { get; set; }
        public string? Notes { get; set; }
        public string? TermsAndConditions { get; set; }
        public DateTime? QuoteValidUntil { get; set; }
        public bool RequiresApproval { get; set; } = false;
        public bool IsApproved { get; set; } = false;
        public Guid? ApprovedBy { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public string? ApprovalNotes { get; set; }
        public Dictionary<string, object> Metadata { get; set; } = new();
        public List<string> Tags { get; set; } = new();

        // Navigation properties
        public virtual Material Material { get; set; } = null!;
        public virtual Supplier Supplier { get; set; } = null!;
        public virtual ICollection<BoQItemPricing> BoQItemPricing { get; set; } = new List<BoQItemPricing>();
        public virtual User? CreatedByUser { get; set; }
        public virtual User? UpdatedByUser { get; set; }
        public virtual User? ApprovedByUser { get; set; }

        /// <summary>
        /// Check if pricing is currently valid
        /// </summary>
        public bool IsCurrentlyValid()
        {
            if (!IsActive) return false;

            var now = DateTime.UtcNow;

            if (EffectiveDate > now) return false;
            if (ExpiryDate.HasValue && ExpiryDate <= now) return false;
            if (IsQuote && QuoteValidUntil.HasValue && QuoteValidUntil <= now) return false;

            return true;
        }

        /// <summary>
        /// Check if quantity qualifies for this pricing tier
        /// </summary>
        public bool QualifiesForQuantity(decimal quantity)
        {
            if (MinQuantity.HasValue && quantity < MinQuantity) return false;
            if (MaxQuantity.HasValue && quantity > MaxQuantity) return false;
            return true;
        }

        /// <summary>
        /// Calculate total price for quantity
        /// </summary>
        public Money? CalculateTotalPrice(decimal quantity)
        {
            if (!QualifiesForQuantity(quantity) || UnitPrice == null)
                return null;

            var baseTotal = UnitPrice.Amount * quantity;

            // Apply discount if applicable
            if (DiscountPercentage.HasValue && DiscountPercentage > 0)
            {
                var discountAmount = baseTotal * (DiscountPercentage.Value / 100);
                baseTotal -= discountAmount;
            }
            else if (DiscountAmount?.Amount > 0)
            {
                baseTotal -= DiscountAmount.Amount;
            }

            return new Money(Math.Max(0, baseTotal), UnitPrice.Currency);
        }

        /// <summary>
        /// Calculate effective unit price after discounts
        /// </summary>
        public Money? GetEffectiveUnitPrice()
        {
            if (UnitPrice == null) return null;

            var effectivePrice = UnitPrice.Amount;

            if (DiscountPercentage.HasValue && DiscountPercentage > 0)
            {
                effectivePrice *= (1 - DiscountPercentage.Value / 100);
            }

            return new Money(effectivePrice, UnitPrice.Currency);
        }

        /// <summary>
        /// Check if pricing expires soon
        /// </summary>
        public bool ExpiresSoon(int daysThreshold = 30)
        {
            if (!ExpiryDate.HasValue && !QuoteValidUntil.HasValue)
                return false;

            var earliestExpiry = new DateTime?[] { ExpiryDate, QuoteValidUntil }
                .Where(d => d.HasValue)
                .Min();

            if (!earliestExpiry.HasValue)
                return false;

            return (earliestExpiry.Value - DateTime.UtcNow).TotalDays <= daysThreshold;
        }

        /// <summary>
        /// Approve pricing
        /// </summary>
        public void Approve(Guid approvedByUserId, string? notes = null)
        {
            if (!RequiresApproval)
                throw new InvalidOperationException("Pricing does not require approval");

            if (IsApproved)
                throw new InvalidOperationException("Pricing is already approved");

            IsApproved = true;
            ApprovedBy = approvedByUserId;
            ApprovedAt = DateTime.UtcNow;
            ApprovalNotes = notes;
        }

        /// <summary>
        /// Extend expiry date
        /// </summary>
        public void ExtendExpiry(DateTime newExpiryDate, string? reason = null)
        {
            if (newExpiryDate <= DateTime.UtcNow)
                throw new ArgumentException("New expiry date must be in the future");

            ExpiryDate = newExpiryDate;

            if (!string.IsNullOrEmpty(reason))
            {
                Metadata["ExpiryExtensionReason"] = reason;
                Metadata["ExpiryExtensionDate"] = DateTime.UtcNow;
            }
        }

        /// <summary>
        /// Create pricing from quote
        /// </summary>
        public static MaterialPricing CreateFromQuote(Guid materialId, Guid supplierId,
            string quoteNumber, Money unitPrice, DateTime validUntil,
            decimal? minQuantity = null, decimal? maxQuantity = null)
        {
            return new MaterialPricing
            {
                MaterialId = materialId,
                SupplierId = supplierId,
                QuoteNumber = quoteNumber,
                UnitPrice = unitPrice,
                Currency = unitPrice.Currency,
                MinQuantity = minQuantity,
                MaxQuantity = maxQuantity,
                EffectiveDate = DateTime.UtcNow,
                QuoteValidUntil = validUntil,
                IsQuote = true,
                IsActive = true,
                PriceType = "Quote"
            };
        }

        /// <summary>
        /// Get pricing summary
        /// </summary>
        public string GetPricingSummary()
        {
            var summary = $"{UnitPrice?.ToString() ?? "N/A"}";

            if (MinQuantity.HasValue || MaxQuantity.HasValue)
            {
                summary += " (";
                if (MinQuantity.HasValue) summary += $"Min: {MinQuantity}";
                if (MinQuantity.HasValue && MaxQuantity.HasValue) summary += ", ";
                if (MaxQuantity.HasValue) summary += $"Max: {MaxQuantity}";
                summary += ")";
            }

            if (DiscountPercentage.HasValue && DiscountPercentage > 0)
                summary += $" [{DiscountPercentage}% discount]";

            return summary;
        }
    }
}