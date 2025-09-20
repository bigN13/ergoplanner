namespace Ergoplanner.Domain.Enums
{
    /// <summary>
    /// Workflow status enumeration
    /// </summary>
    public enum WorkflowStatus
    {
        Pending = 1,
        Draft = 2,
        PendingCheck = 3,
        PendingReview = 4,
        PendingApproval = 5,
        Approved = 6,
        Rejected = 7,
        OnHold = 8,
        Cancelled = 9
    }

    /// <summary>
    /// Approval status enumeration
    /// </summary>
    public enum ApprovalStatus
    {
        Pending = 1,
        Approved = 2,
        Rejected = 3,
        RequestChanges = 4,
        Escalated = 5
    }

    /// <summary>
    /// Approval decision enumeration
    /// </summary>
    public enum ApprovalDecision
    {
        Approve = 1,
        Reject = 2,
        RequestChanges = 3,
        Escalate = 4
    }
}