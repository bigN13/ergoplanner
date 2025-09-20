using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.Enums;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Approval workflow entity for drawing approval process
    /// </summary>
    public class ApprovalWorkflow : BaseEntity
    {
        public Guid DrawingId { get; set; }
        public string WorkflowType { get; set; } = "standard";
        public string CurrentStage { get; set; } = string.Empty;
        public WorkflowStatus Status { get; set; } = WorkflowStatus.Pending;
        public Guid InitiatedBy { get; set; }
        public DateTime InitiatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }
        public DateTime? Deadline { get; set; }
        public string? Notes { get; set; }
        public Dictionary<string, object> Metadata { get; set; } = new();

        // Navigation properties
        public virtual Drawing Drawing { get; set; } = null!;
        public virtual User InitiatedByUser { get; set; } = null!;
        public virtual ICollection<ApprovalStage> Stages { get; set; } = new List<ApprovalStage>();
    }

    /// <summary>
    /// Approval stage entity representing individual approval steps
    /// </summary>
    public class ApprovalStage : BaseEntity
    {
        public Guid WorkflowId { get; set; }
        public string StageName { get; set; } = string.Empty;
        public int StageOrder { get; set; }
        public Guid ApproverId { get; set; }
        public ApprovalStatus Status { get; set; } = ApprovalStatus.Pending;
        public ApprovalDecision? Decision { get; set; }
        public string? Comments { get; set; }
        public DateTime? DecidedAt { get; set; }
        public DateTime? Deadline { get; set; }

        // Navigation properties
        public virtual ApprovalWorkflow Workflow { get; set; } = null!;
        public virtual User Approver { get; set; } = null!;
    }
}