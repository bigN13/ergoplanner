using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.Enums;
using Ergoplanner.Domain.ValueObjects;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// BoQ Change Request entity for managing changes to approved BoQs
    /// </summary>
    public class BoQChangeRequest : BaseEntity, ISoftDelete
    {
        public Guid BoQId { get; set; }
        public string ChangeRequestNumber { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Justification { get; set; }
        public string ChangeType { get; set; } = string.Empty; // Addition, Deletion, Modification, Substitution
        public string? ChangeCategory { get; set; } // Client Request, Design Change, Specification Change, etc.
        public string Priority { get; set; } = "Medium"; // Low, Medium, High, Critical
        public WorkflowStatus Status { get; set; } = WorkflowStatus.Draft;
        public Guid RequestedBy { get; set; }
        public DateTime RequestDate { get; set; } = DateTime.UtcNow;
        public DateTime? RequiredByDate { get; set; }
        public DateTime? ApprovedDate { get; set; }
        public DateTime? ImplementedDate { get; set; }
        public Guid? ApprovedBy { get; set; }
        public Guid? ImplementedBy { get; set; }
        public Money? EstimatedCostImpact { get; set; }
        public Money? ActualCostImpact { get; set; }
        public int? EstimatedTimeImpact { get; set; } // In days
        public int? ActualTimeImpact { get; set; } // In days
        public string? CostImpactReason { get; set; }
        public string? TimeImpactReason { get; set; }
        public bool RequiresClientApproval { get; set; } = false;
        public bool IsClientApproved { get; set; } = false;
        public DateTime? ClientApprovedDate { get; set; }
        public string? ClientApprovalReference { get; set; }
        public string? ApprovalComments { get; set; }
        public string? RejectionReason { get; set; }
        public string? ImplementationNotes { get; set; }
        public Dictionary<string, object> OriginalData { get; set; } = new(); // Snapshot before changes
        public Dictionary<string, object> ProposedData { get; set; } = new(); // Proposed changes
        public Dictionary<string, object> FinalData { get; set; } = new(); // Actual implemented changes
        public Dictionary<string, object> Metadata { get; set; } = new();
        public List<string> Tags { get; set; } = new();

        // Soft delete
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }
        public Guid? DeletedBy { get; set; }

        // Navigation properties
        public virtual BoQ BoQ { get; set; } = null!;
        public virtual User RequestedByUser { get; set; } = null!;
        public virtual User? ApprovedByUser { get; set; }
        public virtual User? ImplementedByUser { get; set; }
        public virtual ICollection<BoQChangeRequestItem> Items { get; set; } = new List<BoQChangeRequestItem>();
        public virtual ICollection<BoQChangeRequestApproval> Approvals { get; set; } = new List<BoQChangeRequestApproval>();
        public virtual ICollection<BoQChangeRequestComment> Comments { get; set; } = new List<BoQChangeRequestComment>();
        public virtual ICollection<BoQChangeRequestAttachment> Attachments { get; set; } = new List<BoQChangeRequestAttachment>();
        public virtual User? CreatedByUser { get; set; }
        public virtual User? UpdatedByUser { get; set; }
        public virtual User? DeletedByUser { get; set; }

        /// <summary>
        /// Submit change request for approval
        /// </summary>
        public void Submit()
        {
            if (Status != WorkflowStatus.Draft)
                throw new InvalidOperationException($"Cannot submit change request in status: {Status}");

            if (string.IsNullOrEmpty(Title) || string.IsNullOrEmpty(Description))
                throw new InvalidOperationException("Title and Description are required to submit change request");

            Status = WorkflowStatus.PendingApproval;
            RequestDate = DateTime.UtcNow;

            // Generate change request number if not set
            if (string.IsNullOrEmpty(ChangeRequestNumber))
            {
                ChangeRequestNumber = GenerateChangeRequestNumber();
            }
        }

        /// <summary>
        /// Approve change request
        /// </summary>
        public void Approve(Guid approvedByUserId, string? comments = null)
        {
            if (Status != WorkflowStatus.PendingApproval)
                throw new InvalidOperationException($"Cannot approve change request in status: {Status}");

            Status = WorkflowStatus.Approved;
            ApprovedBy = approvedByUserId;
            ApprovedDate = DateTime.UtcNow;
            ApprovalComments = comments;
        }

        /// <summary>
        /// Reject change request
        /// </summary>
        public void Reject(Guid rejectedByUserId, string reason)
        {
            if (Status != WorkflowStatus.PendingApproval)
                throw new InvalidOperationException($"Cannot reject change request in status: {Status}");

            if (string.IsNullOrEmpty(reason))
                throw new ArgumentException("Rejection reason is required");

            Status = WorkflowStatus.Rejected;
            RejectionReason = reason;
        }

        /// <summary>
        /// Implement change request
        /// </summary>
        public void Implement(Guid implementedByUserId, string? notes = null)
        {
            if (Status != WorkflowStatus.Approved)
                throw new InvalidOperationException($"Cannot implement change request in status: {Status}");

            Status = WorkflowStatus.PendingApproval; // Move to final approval after implementation
            ImplementedBy = implementedByUserId;
            ImplementedDate = DateTime.UtcNow;
            ImplementationNotes = notes;

            // Copy proposed data to final data
            FinalData = new Dictionary<string, object>(ProposedData);
        }

        /// <summary>
        /// Complete change request
        /// </summary>
        public void Complete()
        {
            if (Status != WorkflowStatus.PendingApproval || !ImplementedDate.HasValue)
                throw new InvalidOperationException("Change request must be implemented and approved before completion");

            Status = WorkflowStatus.Approved;
        }

        /// <summary>
        /// Cancel change request
        /// </summary>
        public void Cancel(string? reason = null)
        {
            if (Status == WorkflowStatus.Approved && ImplementedDate.HasValue)
                throw new InvalidOperationException("Cannot cancel implemented change request");

            Status = WorkflowStatus.Cancelled;
            if (!string.IsNullOrEmpty(reason))
            {
                Metadata["CancellationReason"] = reason;
                Metadata["CancellationDate"] = DateTime.UtcNow;
            }
        }

        /// <summary>
        /// Calculate actual cost impact
        /// </summary>
        public void CalculateActualCostImpact()
        {
            var totalImpact = 0m;
            var currency = EstimatedCostImpact?.Currency ?? "USD";

            foreach (var item in Items)
            {
                if (item.ActualCostImpact?.Amount != null)
                {
                    totalImpact += item.ActualCostImpact.Amount;
                }
            }

            ActualCostImpact = new Money(totalImpact, currency);
        }

        /// <summary>
        /// Calculate actual time impact
        /// </summary>
        public void CalculateActualTimeImpact()
        {
            ActualTimeImpact = Items.Sum(i => i.ActualTimeImpact ?? 0);
        }

        /// <summary>
        /// Add change request item
        /// </summary>
        public void AddItem(Guid? boqItemId, string changeType, string description,
                           Money? costImpact = null, int? timeImpact = null)
        {
            var item = new BoQChangeRequestItem
            {
                ChangeRequestId = Id,
                BoQItemId = boqItemId,
                ChangeType = changeType,
                Description = description,
                EstimatedCostImpact = costImpact,
                EstimatedTimeImpact = timeImpact
            };

            Items.Add(item);
        }

        /// <summary>
        /// Add comment
        /// </summary>
        public void AddComment(Guid userId, string comment, bool isInternal = false)
        {
            var requestComment = new BoQChangeRequestComment
            {
                ChangeRequestId = Id,
                UserId = userId,
                Comment = comment,
                IsInternal = isInternal,
                CommentDate = DateTime.UtcNow
            };

            Comments.Add(requestComment);
        }

        /// <summary>
        /// Add attachment
        /// </summary>
        public void AddAttachment(string fileName, string fileUrl, string contentType, long fileSize)
        {
            var attachment = new BoQChangeRequestAttachment
            {
                ChangeRequestId = Id,
                FileName = fileName,
                FileUrl = fileUrl,
                ContentType = contentType,
                FileSize = fileSize,
                UploadedAt = DateTime.UtcNow
            };

            Attachments.Add(attachment);
        }

        /// <summary>
        /// Check if change request is overdue
        /// </summary>
        public bool IsOverdue()
        {
            return RequiredByDate.HasValue &&
                   Status != WorkflowStatus.Approved &&
                   Status != WorkflowStatus.Cancelled &&
                   DateTime.UtcNow > RequiredByDate.Value;
        }

        /// <summary>
        /// Get cost variance
        /// </summary>
        public Money? GetCostVariance()
        {
            if (EstimatedCostImpact == null || ActualCostImpact == null)
                return null;

            return new Money(
                ActualCostImpact.Amount - EstimatedCostImpact.Amount,
                ActualCostImpact.Currency
            );
        }

        /// <summary>
        /// Get time variance
        /// </summary>
        public int? GetTimeVariance()
        {
            if (!EstimatedTimeImpact.HasValue || !ActualTimeImpact.HasValue)
                return null;

            return ActualTimeImpact.Value - EstimatedTimeImpact.Value;
        }

        /// <summary>
        /// Generate change request number
        /// </summary>
        private string GenerateChangeRequestNumber()
        {
            return $"CR-{DateTime.UtcNow:yyyyMM}-{Guid.NewGuid().ToString("N")[..8].ToUpper()}";
        }

        /// <summary>
        /// Get change request summary
        /// </summary>
        public string GetSummary()
        {
            var summary = $"{ChangeRequestNumber}: {Title} ({Status})";

            if (EstimatedCostImpact?.Amount != 0)
            {
                summary += $" - Cost Impact: {EstimatedCostImpact}";
            }

            if (EstimatedTimeImpact.HasValue && EstimatedTimeImpact != 0)
            {
                summary += $" - Time Impact: {EstimatedTimeImpact} days";
            }

            return summary;
        }
    }

    /// <summary>
    /// BoQ Change Request Item entity for individual item changes
    /// </summary>
    public class BoQChangeRequestItem : BaseEntity
    {
        public Guid ChangeRequestId { get; set; }
        public Guid? BoQItemId { get; set; }
        public string ChangeType { get; set; } = string.Empty; // Add, Remove, Modify, Replace
        public string Description { get; set; } = string.Empty;
        public Money? EstimatedCostImpact { get; set; }
        public Money? ActualCostImpact { get; set; }
        public int? EstimatedTimeImpact { get; set; }
        public int? ActualTimeImpact { get; set; }
        public Dictionary<string, object> OriginalValues { get; set; } = new();
        public Dictionary<string, object> ProposedValues { get; set; } = new();
        public Dictionary<string, object> FinalValues { get; set; } = new();
        public Dictionary<string, object> Metadata { get; set; } = new();

        // Navigation properties
        public virtual BoQChangeRequest ChangeRequest { get; set; } = null!;
        public virtual BoQItem? BoQItem { get; set; }
    }

    /// <summary>
    /// BoQ Change Request Approval entity for approval workflow
    /// </summary>
    public class BoQChangeRequestApproval : BaseEntity
    {
        public Guid ChangeRequestId { get; set; }
        public string ApprovalLevel { get; set; } = string.Empty;
        public Guid AssignedTo { get; set; }
        public ApprovalStatus Status { get; set; } = ApprovalStatus.Pending;
        public DateTime? ApprovedDate { get; set; }
        public string? Comments { get; set; }
        public Dictionary<string, object> Metadata { get; set; } = new();

        // Navigation properties
        public virtual BoQChangeRequest ChangeRequest { get; set; } = null!;
        public virtual User AssignedToUser { get; set; } = null!;
    }

    /// <summary>
    /// BoQ Change Request Comment entity
    /// </summary>
    public class BoQChangeRequestComment : BaseEntity
    {
        public Guid ChangeRequestId { get; set; }
        public Guid UserId { get; set; }
        public string Comment { get; set; } = string.Empty;
        public bool IsInternal { get; set; } = false;
        public DateTime CommentDate { get; set; } = DateTime.UtcNow;
        public Dictionary<string, object> Metadata { get; set; } = new();

        // Navigation properties
        public virtual BoQChangeRequest ChangeRequest { get; set; } = null!;
        public virtual User User { get; set; } = null!;
    }

    /// <summary>
    /// BoQ Change Request Attachment entity
    /// </summary>
    public class BoQChangeRequestAttachment : BaseEntity
    {
        public Guid ChangeRequestId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
        public Dictionary<string, object> Metadata { get; set; } = new();

        // Navigation properties
        public virtual BoQChangeRequest ChangeRequest { get; set; } = null!;
    }
}