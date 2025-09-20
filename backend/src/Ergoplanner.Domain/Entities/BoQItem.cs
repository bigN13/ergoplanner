using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.Enums;
using Ergoplanner.Domain.ValueObjects;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Bill of Quantities item entity
    /// </summary>
    public class BoQItem : BaseEntity, ISoftDelete
    {
        public Guid ProjectId { get; set; }
        public Guid? DrawingId { get; set; }
        public Guid? ComponentId { get; set; }
        public Guid? SectionId { get; set; }
        public Guid? MaterialId { get; set; }
        public Guid? SupplierId { get; set; }
        public string ItemCode { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Specification { get; set; }
        public string? Unit { get; set; }
        public Quantity? Quantity { get; set; }
        public QuantityCalculationMethod CalculationMethod { get; set; } = QuantityCalculationMethod.Manual;
        public Formula? QuantityFormula { get; set; }
        public Money? UnitPrice { get; set; }
        public Money? TotalCost { get; set; }
        public CostType CostType { get; set; } = CostType.Material;
        public BoQItemStatus Status { get; set; } = BoQItemStatus.Pending;
        public string? Supplier { get; set; }
        public string? Manufacturer { get; set; }
        public string? ModelNumber { get; set; }
        public string? PartNumber { get; set; }
        public LeadTime? LeadTime { get; set; }
        public Dimensions? Dimensions { get; set; }
        public PriceRange? PriceRange { get; set; }
        public string? Category { get; set; }
        public string? SubCategory { get; set; }
        public decimal? Weight { get; set; }
        public string? WeightUnit { get; set; } = "kg";
        public string? Notes { get; set; }
        public string? InternalNotes { get; set; }
        public bool RequiresApproval { get; set; } = false;
        public bool IsApproved { get; set; } = false;
        public Guid? ApprovedBy { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public DateTime? OrderDate { get; set; }
        public DateTime? DeliveryDate { get; set; }
        public string? PurchaseOrderNumber { get; set; }
        public string? InvoiceNumber { get; set; }
        public Dictionary<string, object> Properties { get; set; } = new();
        public Dictionary<string, object> Metadata { get; set; } = new();
        public List<string> Tags { get; set; } = new();

        // Soft delete
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }
        public Guid? DeletedBy { get; set; }

        // Navigation properties
        public virtual Project Project { get; set; } = null!;
        public virtual Drawing? Drawing { get; set; }
        public virtual Component? Component { get; set; }
        public virtual BoQSection? Section { get; set; }
        public virtual Material? Material { get; set; }
        public virtual MaterialSupplier? MaterialSupplier { get; set; }
        public virtual ICollection<BoQRevisionItem> RevisionItems { get; set; } = new List<BoQRevisionItem>();
        public virtual ICollection<BoQItemPricing> PricingHistory { get; set; } = new List<BoQItemPricing>();
        public virtual User? CreatedByUser { get; set; }
        public virtual User? UpdatedByUser { get; set; }
        public virtual User? ApprovedByUser { get; set; }
        public virtual User? DeletedByUser { get; set; }

        /// <summary>
        /// Calculate total cost based on quantity and unit price
        /// </summary>
        public void CalculateTotalCost()
        {
            if (Quantity?.Value > 0 && UnitPrice?.Amount > 0)
            {
                var total = Quantity.Value * UnitPrice.Amount;
                TotalCost = new Money(total, UnitPrice.Currency);
            }
            else
            {
                TotalCost = new Money(0, UnitPrice?.Currency ?? "USD");
            }
        }

        /// <summary>
        /// Calculate quantity from drawing components
        /// </summary>
        public void CalculateQuantityFromDrawing()
        {
            if (CalculationMethod != QuantityCalculationMethod.Drawing || ComponentId == null)
                return;

            // This would implement quantity calculation logic based on drawing components
            // For now, just ensure quantity is set
            if (Quantity == null)
            {
                Quantity = new Quantity(1, Unit ?? "ea");
            }
        }

        /// <summary>
        /// Calculate quantity using formula
        /// </summary>
        public void CalculateQuantityFromFormula(Dictionary<string, decimal>? variables = null)
        {
            if (CalculationMethod != QuantityCalculationMethod.Formula || QuantityFormula == null)
                return;

            // This would implement formula evaluation
            // For now, just ensure quantity is set
            if (Quantity == null)
            {
                Quantity = new Quantity(1, Unit ?? "ea");
            }
        }

        /// <summary>
        /// Update status based on order and delivery dates
        /// </summary>
        public void UpdateStatusFromDates()
        {
            if (DeliveryDate.HasValue && DeliveryDate <= DateTime.UtcNow)
            {
                Status = BoQItemStatus.Delivered;
            }
            else if (OrderDate.HasValue)
            {
                Status = BoQItemStatus.Ordered;
            }
            else if (IsApproved && UnitPrice?.Amount > 0)
            {
                Status = BoQItemStatus.Quoted;
            }
        }

        /// <summary>
        /// Approve this item
        /// </summary>
        public void Approve(Guid approvedByUserId, string? approvalNotes = null)
        {
            if (!RequiresApproval)
                throw new InvalidOperationException("Item does not require approval");

            if (IsApproved)
                throw new InvalidOperationException("Item is already approved");

            IsApproved = true;
            ApprovedBy = approvedByUserId;
            ApprovedAt = DateTime.UtcNow;

            if (!string.IsNullOrEmpty(approvalNotes))
            {
                Metadata["ApprovalNotes"] = approvalNotes;
            }

            UpdateStatusFromDates();
        }

        /// <summary>
        /// Check if item can be edited
        /// </summary>
        public bool CanEdit()
        {
            return !IsDeleted &&
                   Status != BoQItemStatus.Delivered &&
                   Status != BoQItemStatus.Installed;
        }
    }
}