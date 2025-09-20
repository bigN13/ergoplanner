using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.Enums;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// User entity representing system users
    /// </summary>
    public class User : BaseEntity, IOrganizationScoped
    {
        public Guid OrganizationId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? DisplayName { get; set; }
        public string? AvatarUrl { get; set; }
        public UserRole Role { get; set; }
        public List<string> Permissions { get; set; } = new();
        public bool IsActive { get; set; } = true;
        public bool IsVerified { get; set; } = false;
        public string? VerificationToken { get; set; }
        public string? PasswordResetToken { get; set; }
        public DateTime? PasswordResetExpires { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public int LoginAttempts { get; set; } = 0;
        public DateTime? LockedUntil { get; set; }
        public Dictionary<string, object> Preferences { get; set; } = new();

        // Navigation properties
        public virtual Organization Organization { get; set; } = null!;
        public virtual ICollection<TeamMember> TeamMemberships { get; set; } = new List<TeamMember>();
        public virtual ICollection<Drawing> CreatedDrawings { get; set; } = new List<Drawing>();
        public virtual ICollection<Drawing> UpdatedDrawings { get; set; } = new List<Drawing>();
        public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();
        public virtual ICollection<ApprovalStage> ApprovalStages { get; set; } = new List<ApprovalStage>();

        // BoQ-related navigation properties
        public virtual ICollection<BoQ> CreatedBoQs { get; set; } = new List<BoQ>();
        public virtual ICollection<BoQ> UpdatedBoQs { get; set; } = new List<BoQ>();
        public virtual ICollection<BoQ> LockedBoQs { get; set; } = new List<BoQ>();
        public virtual ICollection<BoQTemplate> CreatedBoQTemplates { get; set; } = new List<BoQTemplate>();
        public virtual ICollection<BoQApproval> AssignedBoQApprovals { get; set; } = new List<BoQApproval>();
        public virtual ICollection<BoQApproval> CompletedBoQApprovals { get; set; } = new List<BoQApproval>();
        public virtual ICollection<BoQChangeRequest> RequestedBoQChanges { get; set; } = new List<BoQChangeRequest>();
        public virtual ICollection<Material> CreatedMaterials { get; set; } = new List<Material>();
        public virtual ICollection<MaterialSpecification> VerifiedSpecifications { get; set; } = new List<MaterialSpecification>();
        public virtual ICollection<SupplierEvaluation> SupplierEvaluations { get; set; } = new List<SupplierEvaluation>();

        public string FullName => $"{FirstName} {LastName}".Trim();
    }
}