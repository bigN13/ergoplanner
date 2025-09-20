using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.Enums;
using Ergoplanner.Domain.ValueObjects;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// BoQ Revision entity for version control and change tracking
    /// </summary>
    public class BoQRevision : BaseEntity
    {
        public Guid BoQId { get; set; }
        public string RevisionNumber { get; set; } = string.Empty;
        public BoQRevisionType RevisionType { get; set; }
        public string? Description { get; set; }
        public string? ChangeReason { get; set; }
        public DateTime RevisionDate { get; set; } = DateTime.UtcNow;
        public Money? PreviousTotal { get; set; }
        public Money? CurrentTotal { get; set; }
        public Money? TotalChange { get; set; }
        public decimal? PercentageChange { get; set; }
        public bool IsApproved { get; set; } = false;
        public Guid? ApprovedBy { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public Dictionary<string, object> Changes { get; set; } = new(); // JSON diff of changes
        public Dictionary<string, object> Snapshot { get; set; } = new(); // Full BoQ snapshot
        public Dictionary<string, object> Metadata { get; set; } = new();
        public List<string> Tags { get; set; } = new();

        // Navigation properties
        public virtual BoQ BoQ { get; set; } = null!;
        public virtual User? CreatedByUser { get; set; }
        public virtual User? ApprovedByUser { get; set; }
        public virtual ICollection<BoQRevisionItem> RevisionItems { get; set; } = new List<BoQRevisionItem>();

        /// <summary>
        /// Calculate revision changes
        /// </summary>
        public void CalculateChanges(Money? previousTotal)
        {
            PreviousTotal = previousTotal ?? new Money(0, BoQ?.Currency ?? "USD");
            CurrentTotal = BoQ?.GrandTotal ?? new Money(0, BoQ?.Currency ?? "USD");

            if (PreviousTotal?.Amount > 0)
            {
                TotalChange = new Money(
                    CurrentTotal.Amount - PreviousTotal.Amount,
                    CurrentTotal.Currency
                );

                PercentageChange = (TotalChange.Amount / PreviousTotal.Amount) * 100;
            }
            else
            {
                TotalChange = CurrentTotal;
                PercentageChange = 100; // 100% increase from zero
            }
        }

        /// <summary>
        /// Approve this revision
        /// </summary>
        public void Approve(Guid approvedByUserId, string? approvalComments = null)
        {
            if (IsApproved)
                throw new InvalidOperationException("Revision is already approved");

            IsApproved = true;
            ApprovedBy = approvedByUserId;
            ApprovedAt = DateTime.UtcNow;

            if (!string.IsNullOrEmpty(approvalComments))
            {
                Metadata["ApprovalComments"] = approvalComments;
            }
        }

        /// <summary>
        /// Create snapshot of current BoQ state
        /// </summary>
        public void CreateSnapshot()
        {
            // This would serialize the current BoQ state
            // Implementation would depend on your serialization strategy
            Snapshot = new Dictionary<string, object>
            {
                ["BoQId"] = BoQId,
                ["Timestamp"] = DateTime.UtcNow,
                ["TotalCost"] = CurrentTotal?.Amount ?? 0,
                ["Currency"] = BoQ?.Currency ?? "USD",
                ["SectionCount"] = BoQ?.Sections?.Count ?? 0,
                ["ItemCount"] = GetTotalItemCount()
            };
        }

        /// <summary>
        /// Get total item count across all sections
        /// </summary>
        private int GetTotalItemCount()
        {
            if (BoQ?.Sections == null) return 0;

            var count = 0;
            foreach (var section in BoQ.Sections)
            {
                count += section.GetAllItems().Count();
            }
            return count;
        }
    }
}