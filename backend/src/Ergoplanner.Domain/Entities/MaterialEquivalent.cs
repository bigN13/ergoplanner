using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Material Equivalent entity for alternative material mappings
    /// </summary>
    public class MaterialEquivalent : BaseEntity
    {
        public Guid SourceMaterialId { get; set; }
        public Guid EquivalentMaterialId { get; set; }
        public string? EquivalenceType { get; set; } = "Functional"; // Functional, Exact, Substitute
        public decimal EquivalenceRatio { get; set; } = 1.0m; // Conversion ratio if different
        public string? Notes { get; set; }
        public string? ApprovalReference { get; set; }
        public bool IsActive { get; set; } = true;
        public bool RequiresApproval { get; set; } = false;
        public bool IsApproved { get; set; } = false;
        public Guid? ApprovedBy { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public Dictionary<string, object> Metadata { get; set; } = new();

        // Navigation properties
        public virtual Material SourceMaterial { get; set; } = null!;
        public virtual Material EquivalentMaterial { get; set; } = null!;
        public virtual User? CreatedByUser { get; set; }
        public virtual User? UpdatedByUser { get; set; }
        public virtual User? ApprovedByUser { get; set; }

        /// <summary>
        /// Approve equivalence
        /// </summary>
        public void Approve(Guid approvedByUserId, string? approvalReference = null)
        {
            if (!RequiresApproval)
                throw new InvalidOperationException("Equivalence does not require approval");

            if (IsApproved)
                throw new InvalidOperationException("Equivalence is already approved");

            IsApproved = true;
            ApprovedBy = approvedByUserId;
            ApprovedAt = DateTime.UtcNow;
            ApprovalReference = approvalReference;
        }

        /// <summary>
        /// Calculate equivalent quantity
        /// </summary>
        public decimal CalculateEquivalentQuantity(decimal sourceQuantity)
        {
            return sourceQuantity * EquivalenceRatio;
        }
    }
}