using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.Enums;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Symbol approval workflow tracking
    /// </summary>
    public class SymbolApproval : BaseEntity, IOrganizationScoped
    {
        public Guid OrganizationId { get; set; }
        public Guid SymbolId { get; set; }
        public Guid? VersionId { get; set; }
        public Guid ApproverId { get; set; }
        public ApprovalDecision? Decision { get; set; }
        public string? Comments { get; set; }
        public DateTime? DecisionDate { get; set; }
        public string ApprovalStage { get; set; } = string.Empty; // Review, Approve, Publish
        public int StageOrder { get; set; } = 0;
        public bool IsRequired { get; set; } = true;
        public DateTime? DueDate { get; set; }
        public string? RequiredRole { get; set; }
        public Dictionary<string, object> Metadata { get; set; } = new();

        // Navigation properties
        public virtual Organization Organization { get; set; } = null!;
        public virtual Symbol Symbol { get; set; } = null!;
        public virtual SymbolVersion? Version { get; set; }
        public virtual User Approver { get; set; } = null!;
        public virtual User? CreatedByUser { get; set; }
    }
}