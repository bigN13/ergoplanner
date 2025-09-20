using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.ValueObjects;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Material Supplier relationship entity
    /// </summary>
    public class MaterialSupplier : BaseEntity
    {
        public Guid MaterialId { get; set; }
        public Guid SupplierId { get; set; }
        public string? SupplierPartNumber { get; set; }
        public string? SupplierSKU { get; set; }
        public string? SupplierDescription { get; set; }
        public bool IsPrimary { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public int Priority { get; set; } = 1; // 1 = highest priority
        public decimal? MinOrderQuantity { get; set; }
        public decimal? MaxOrderQuantity { get; set; }
        public decimal? OrderMultiple { get; set; } = 1; // Must order in multiples of this
        public LeadTime? LeadTime { get; set; }
        public Money? LastPrice { get; set; }
        public DateTime? LastPriceDate { get; set; }
        public string? PaymentTerms { get; set; }
        public string? ShippingTerms { get; set; }
        public string? Currency { get; set; } = "USD";
        public decimal? QualityRating { get; set; } // 1-5 scale
        public decimal? DeliveryRating { get; set; } // 1-5 scale
        public decimal? ServiceRating { get; set; } // 1-5 scale
        public string? Notes { get; set; }
        public DateTime? LastOrderDate { get; set; }
        public DateTime? ContractStartDate { get; set; }
        public DateTime? ContractEndDate { get; set; }
        public string? ContractNumber { get; set; }
        public bool RequiresApproval { get; set; } = false;
        public Dictionary<string, object> ContactInfo { get; set; } = new();
        public Dictionary<string, object> Metadata { get; set; } = new();
        public List<string> Tags { get; set; } = new();

        // Navigation properties
        public virtual Material Material { get; set; } = null!;
        public virtual Supplier Supplier { get; set; } = null!;
        public virtual ICollection<BoQItem> BoQItems { get; set; } = new List<BoQItem>();
        public virtual User? CreatedByUser { get; set; }
        public virtual User? UpdatedByUser { get; set; }

        /// <summary>
        /// Check if supplier is available for ordering
        /// </summary>
        public bool IsAvailableForOrder(decimal quantity)
        {
            if (!IsActive || !Supplier.IsActive)
                return false;

            if (MinOrderQuantity.HasValue && quantity < MinOrderQuantity)
                return false;

            if (MaxOrderQuantity.HasValue && quantity > MaxOrderQuantity)
                return false;

            if (ContractEndDate.HasValue && ContractEndDate < DateTime.UtcNow)
                return false;

            return true;
        }

        /// <summary>
        /// Calculate lead time for quantity
        /// </summary>
        public LeadTime? CalculateLeadTime(decimal quantity)
        {
            if (LeadTime == null)
                return null;

            var baseDays = LeadTime.Days;

            // Add extra time for large orders
            if (MaxOrderQuantity.HasValue && quantity > MaxOrderQuantity * 0.8m)
            {
                baseDays += 7; // Add a week for large orders
            }

            return new LeadTime(baseDays, LeadTime.IsEstimated);
        }

        /// <summary>
        /// Get normalized order quantity based on order multiple
        /// </summary>
        public decimal GetNormalizedQuantity(decimal requestedQuantity)
        {
            if (!OrderMultiple.HasValue || OrderMultiple <= 0)
                return requestedQuantity;

            // Round up to nearest multiple
            return Math.Ceiling(requestedQuantity / OrderMultiple.Value) * OrderMultiple.Value;
        }

        /// <summary>
        /// Update ratings
        /// </summary>
        public void UpdateRatings(decimal? quality = null, decimal? delivery = null, decimal? service = null)
        {
            if (quality.HasValue && quality >= 1 && quality <= 5)
                QualityRating = quality;

            if (delivery.HasValue && delivery >= 1 && delivery <= 5)
                DeliveryRating = delivery;

            if (service.HasValue && service >= 1 && service <= 5)
                ServiceRating = service;
        }

        /// <summary>
        /// Get overall rating
        /// </summary>
        public decimal? GetOverallRating()
        {
            var ratings = new List<decimal>();

            if (QualityRating.HasValue) ratings.Add(QualityRating.Value);
            if (DeliveryRating.HasValue) ratings.Add(DeliveryRating.Value);
            if (ServiceRating.HasValue) ratings.Add(ServiceRating.Value);

            return ratings.Any() ? ratings.Average() : null;
        }

        /// <summary>
        /// Set as primary supplier
        /// </summary>
        public void SetAsPrimary()
        {
            IsPrimary = true;
            Priority = 1;
        }

        /// <summary>
        /// Check if contract is valid
        /// </summary>
        public bool IsContractValid()
        {
            if (!ContractStartDate.HasValue)
                return true; // No contract required

            var now = DateTime.UtcNow;
            return ContractStartDate <= now &&
                   (!ContractEndDate.HasValue || ContractEndDate > now);
        }

        /// <summary>
        /// Get contract status description
        /// </summary>
        public string GetContractStatus()
        {
            if (!ContractStartDate.HasValue)
                return "No Contract";

            var now = DateTime.UtcNow;

            if (ContractStartDate > now)
                return "Future Contract";

            if (!ContractEndDate.HasValue)
                return "Active Contract";

            if (ContractEndDate > now)
            {
                var daysRemaining = (ContractEndDate.Value - now).Days;
                if (daysRemaining <= 30)
                    return $"Expiring Soon ({daysRemaining} days)";
                return "Active Contract";
            }

            return "Expired Contract";
        }
    }
}