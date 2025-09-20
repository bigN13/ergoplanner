using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.Enums;
using Ergoplanner.Domain.ValueObjects;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Bill of Quantities (BoQ) entity representing a complete BoQ for a project or drawing
    /// </summary>
    public class BoQ : BaseEntity, IOrganizationScoped, ISoftDelete
    {
        public Guid OrganizationId { get; set; }
        public Guid ProjectId { get; set; }
        public Guid? DrawingId { get; set; }
        public string BoQNumber { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public BoQStatus Status { get; set; } = BoQStatus.Draft;
        public BoQRevisionType RevisionType { get; set; } = BoQRevisionType.Initial;
        public string Revision { get; set; } = "A";
        public DateTime? IssueDate { get; set; }
        public DateTime? DueDate { get; set; }
        public string Currency { get; set; } = "USD";
        public decimal? ExchangeRate { get; set; } = 1.0m;
        public Money? TotalMaterialCost { get; set; } = new();
        public Money? TotalLaborCost { get; set; } = new();
        public Money? TotalEquipmentCost { get; set; } = new();
        public Money? TotalOverheadCost { get; set; } = new();
        public Money? TotalCost { get; set; } = new();
        public decimal? ContingencyPercentage { get; set; } = 10.0m;
        public decimal? ProfitPercentage { get; set; } = 15.0m;
        public Money? GrandTotal { get; set; } = new();
        public Guid? TemplateId { get; set; }
        public Guid? BaselineId { get; set; }
        public bool IsBaseline { get; set; } = false;
        public bool IsLocked { get; set; } = false;
        public Guid? LockedBy { get; set; }
        public DateTime? LockedAt { get; set; }
        public Dictionary<string, object> Metadata { get; set; } = new();
        public List<string> Tags { get; set; } = new();

        // Soft delete
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }
        public Guid? DeletedBy { get; set; }

        // Navigation properties
        public virtual Organization Organization { get; set; } = null!;
        public virtual Project Project { get; set; } = null!;
        public virtual Drawing? Drawing { get; set; }
        public virtual BoQTemplate? Template { get; set; }
        public virtual BoQ? Baseline { get; set; }
        public virtual ICollection<BoQ> DerivedBoQs { get; set; } = new List<BoQ>();
        public virtual ICollection<BoQSection> Sections { get; set; } = new List<BoQSection>();
        public virtual ICollection<BoQRevision> Revisions { get; set; } = new List<BoQRevision>();
        public virtual ICollection<BoQApproval> Approvals { get; set; } = new List<BoQApproval>();
        public virtual ICollection<BoQChangeRequest> ChangeRequests { get; set; } = new List<BoQChangeRequest>();
        public virtual ICollection<BoQExport> Exports { get; set; } = new List<BoQExport>();
        public virtual ICollection<BoQSnapshot> Snapshots { get; set; } = new List<BoQSnapshot>();
        public virtual User? CreatedByUser { get; set; }
        public virtual User? UpdatedByUser { get; set; }
        public virtual User? LockedByUser { get; set; }
        public virtual User? DeletedByUser { get; set; }

        /// <summary>
        /// Calculate total costs from all items
        /// </summary>
        public void CalculateTotals()
        {
            var materialTotal = 0m;
            var laborTotal = 0m;
            var equipmentTotal = 0m;
            var overheadTotal = 0m;

            foreach (var section in Sections)
            {
                foreach (var item in section.Items)
                {
                    if (item.TotalCost?.Amount > 0)
                    {
                        switch (item.CostType)
                        {
                            case CostType.Material:
                                materialTotal += item.TotalCost.Amount;
                                break;
                            case CostType.Labor:
                                laborTotal += item.TotalCost.Amount;
                                break;
                            case CostType.Equipment:
                                equipmentTotal += item.TotalCost.Amount;
                                break;
                            case CostType.Overhead:
                                overheadTotal += item.TotalCost.Amount;
                                break;
                        }
                    }
                }
            }

            TotalMaterialCost = new Money(materialTotal, Currency);
            TotalLaborCost = new Money(laborTotal, Currency);
            TotalEquipmentCost = new Money(equipmentTotal, Currency);
            TotalOverheadCost = new Money(overheadTotal, Currency);

            var subtotal = materialTotal + laborTotal + equipmentTotal + overheadTotal;
            TotalCost = new Money(subtotal, Currency);

            // Apply contingency and profit
            var contingencyAmount = subtotal * (ContingencyPercentage ?? 0) / 100;
            var profitAmount = (subtotal + contingencyAmount) * (ProfitPercentage ?? 0) / 100;

            GrandTotal = new Money(subtotal + contingencyAmount + profitAmount, Currency);
        }

        /// <summary>
        /// Check if BoQ can be edited
        /// </summary>
        public bool CanEdit(Guid userId)
        {
            if (IsDeleted || IsLocked)
                return false;

            if (Status == BoQStatus.Approved || Status == BoQStatus.Archived)
                return false;

            return true;
        }

        /// <summary>
        /// Lock BoQ for editing
        /// </summary>
        public void Lock(Guid userId)
        {
            if (!CanEdit(userId))
                throw new InvalidOperationException("BoQ cannot be locked in current state");

            IsLocked = true;
            LockedBy = userId;
            LockedAt = DateTime.UtcNow;
        }

        /// <summary>
        /// Unlock BoQ
        /// </summary>
        public void Unlock(Guid userId)
        {
            if (LockedBy != userId && !IsSystemAdmin(userId))
                throw new UnauthorizedAccessException("Only the user who locked the BoQ or system admin can unlock it");

            IsLocked = false;
            LockedBy = null;
            LockedAt = null;
        }

        private bool IsSystemAdmin(Guid userId)
        {
            // This would typically check user roles
            // For now, return false - implement based on your auth system
            return false;
        }
    }
}