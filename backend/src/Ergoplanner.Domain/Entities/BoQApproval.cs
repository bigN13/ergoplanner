using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.Enums;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// BoQ Approval entity for approval workflow tracking
    /// </summary>
    public class BoQApproval : BaseEntity
    {
        public Guid BoQId { get; set; }
        public Guid? BoQRevisionId { get; set; }
        public string ApprovalLevel { get; set; } = string.Empty; // Checker, Reviewer, Approver
        public int Sequence { get; set; } = 1;
        public ApprovalStatus Status { get; set; } = ApprovalStatus.Pending;
        public Guid? AssignedTo { get; set; }
        public Guid? ActualApprover { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime? CompletedAt { get; set; }
        public string? Comments { get; set; }
        public string? Decision { get; set; }
        public string? DecisionReason { get; set; }
        public bool RequiresSignature { get; set; } = false;
        public string? DigitalSignature { get; set; }
        public DateTime? SignedAt { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsEscalated { get; set; } = false;
        public Guid? EscalatedTo { get; set; }
        public DateTime? EscalatedAt { get; set; }
        public string? EscalationReason { get; set; }
        public Dictionary<string, object> ApprovalData { get; set; } = new(); // Snapshot of data being approved
        public Dictionary<string, object> Metadata { get; set; } = new();
        public List<string> Tags { get; set; } = new();

        // Navigation properties
        public virtual BoQ BoQ { get; set; } = null!;
        public virtual BoQRevision? BoQRevision { get; set; }
        public virtual User? AssignedToUser { get; set; }
        public virtual User? ActualApproverUser { get; set; }
        public virtual User? EscalatedToUser { get; set; }
        public virtual ICollection<BoQApprovalComment> ApprovalComments { get; set; } = new List<BoQApprovalComment>();
        public virtual ICollection<BoQApprovalAttachment> Attachments { get; set; } = new List<BoQApprovalAttachment>();
        public virtual User? CreatedByUser { get; set; }
        public virtual User? UpdatedByUser { get; set; }

        /// <summary>
        /// Approve the BoQ
        /// </summary>
        public void Approve(Guid approverUserId, string? comments = null, string? digitalSignature = null)
        {
            if (Status != ApprovalStatus.Pending)
                throw new InvalidOperationException($"Cannot approve BoQ in status: {Status}");

            Status = ApprovalStatus.Approved;
            ActualApprover = approverUserId;
            CompletedAt = DateTime.UtcNow;
            Comments = comments;
            Decision = "Approved";

            if (RequiresSignature && !string.IsNullOrEmpty(digitalSignature))
            {
                DigitalSignature = digitalSignature;
                SignedAt = DateTime.UtcNow;
            }
        }

        /// <summary>
        /// Reject the BoQ
        /// </summary>
        public void Reject(Guid approverUserId, string reason, string? comments = null)
        {
            if (Status != ApprovalStatus.Pending)
                throw new InvalidOperationException($"Cannot reject BoQ in status: {Status}");

            if (string.IsNullOrEmpty(reason))
                throw new ArgumentException("Rejection reason is required");

            Status = ApprovalStatus.Rejected;
            ActualApprover = approverUserId;
            CompletedAt = DateTime.UtcNow;
            DecisionReason = reason;
            Comments = comments;
            Decision = "Rejected";
        }

        /// <summary>
        /// Request changes
        /// </summary>
        public void RequestChanges(Guid approverUserId, string reason, string? comments = null)
        {
            if (Status != ApprovalStatus.Pending)
                throw new InvalidOperationException($"Cannot request changes for BoQ in status: {Status}");

            if (string.IsNullOrEmpty(reason))
                throw new ArgumentException("Change request reason is required");

            Status = ApprovalStatus.RequestChanges;
            ActualApprover = approverUserId;
            CompletedAt = DateTime.UtcNow;
            DecisionReason = reason;
            Comments = comments;
            Decision = "Request Changes";
        }

        /// <summary>
        /// Escalate approval
        /// </summary>
        public void Escalate(Guid escalatedToUserId, string reason)
        {
            if (Status != ApprovalStatus.Pending)
                throw new InvalidOperationException($"Cannot escalate BoQ in status: {Status}");

            if (string.IsNullOrEmpty(reason))
                throw new ArgumentException("Escalation reason is required");

            Status = ApprovalStatus.Escalated;
            IsEscalated = true;
            EscalatedTo = escalatedToUserId;
            EscalatedAt = DateTime.UtcNow;
            EscalationReason = reason;
        }

        /// <summary>
        /// Check if approval is overdue
        /// </summary>
        public bool IsOverdue()
        {
            return DueDate.HasValue &&
                   Status == ApprovalStatus.Pending &&
                   DateTime.UtcNow > DueDate.Value;
        }

        /// <summary>
        /// Get days until due
        /// </summary>
        public int? GetDaysUntilDue()
        {
            if (!DueDate.HasValue || Status != ApprovalStatus.Pending)
                return null;

            return (int)(DueDate.Value - DateTime.UtcNow).TotalDays;
        }

        /// <summary>
        /// Add approval comment
        /// </summary>
        public void AddComment(Guid userId, string comment, bool isInternal = false)
        {
            var approvalComment = new BoQApprovalComment
            {
                BoQApprovalId = Id,
                UserId = userId,
                Comment = comment,
                IsInternal = isInternal,
                CommentDate = DateTime.UtcNow
            };

            ApprovalComments.Add(approvalComment);
        }

        /// <summary>
        /// Add attachment
        /// </summary>
        public void AddAttachment(string fileName, string fileUrl, string contentType, long fileSize)
        {
            var attachment = new BoQApprovalAttachment
            {
                BoQApprovalId = Id,
                FileName = fileName,
                FileUrl = fileUrl,
                ContentType = contentType,
                FileSize = fileSize,
                UploadedAt = DateTime.UtcNow
            };

            Attachments.Add(attachment);
        }

        /// <summary>
        /// Reset approval for resubmission
        /// </summary>
        public void Reset(Guid? newAssignee = null)
        {
            Status = ApprovalStatus.Pending;
            ActualApprover = null;
            CompletedAt = null;
            Comments = null;
            Decision = null;
            DecisionReason = null;
            DigitalSignature = null;
            SignedAt = null;
            IsEscalated = false;
            EscalatedTo = null;
            EscalatedAt = null;
            EscalationReason = null;

            if (newAssignee.HasValue)
            {
                AssignedTo = newAssignee;
            }
        }

        /// <summary>
        /// Get approval summary
        /// </summary>
        public string GetApprovalSummary()
        {
            var summary = $"{ApprovalLevel} - {Status}";

            if (CompletedAt.HasValue)
            {
                summary += $" on {CompletedAt:yyyy-MM-dd}";
            }
            else if (DueDate.HasValue)
            {
                var daysUntilDue = GetDaysUntilDue();
                if (daysUntilDue.HasValue)
                {
                    if (daysUntilDue < 0)
                        summary += $" (Overdue by {Math.Abs(daysUntilDue.Value)} days)";
                    else
                        summary += $" (Due in {daysUntilDue} days)";
                }
            }

            if (IsEscalated)
                summary += " [ESCALATED]";

            return summary;
        }

        /// <summary>
        /// Validate digital signature
        /// </summary>
        public bool IsDigitalSignatureValid()
        {
            if (!RequiresSignature)
                return true;

            return !string.IsNullOrEmpty(DigitalSignature) && SignedAt.HasValue;
        }
    }

    /// <summary>
    /// BoQ Approval Comment entity for approval discussions
    /// </summary>
    public class BoQApprovalComment : BaseEntity
    {
        public Guid BoQApprovalId { get; set; }
        public Guid UserId { get; set; }
        public string Comment { get; set; } = string.Empty;
        public bool IsInternal { get; set; } = false;
        public DateTime CommentDate { get; set; } = DateTime.UtcNow;
        public Dictionary<string, object> Metadata { get; set; } = new();

        // Navigation properties
        public virtual BoQApproval BoQApproval { get; set; } = null!;
        public virtual User User { get; set; } = null!;
    }

    /// <summary>
    /// BoQ Approval Attachment entity for supporting documents
    /// </summary>
    public class BoQApprovalAttachment : BaseEntity
    {
        public Guid BoQApprovalId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
        public Dictionary<string, object> Metadata { get; set; } = new();

        // Navigation properties
        public virtual BoQApproval BoQApproval { get; set; } = null!;
    }
}