using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Team entity for project collaboration
    /// </summary>
    public class Team : BaseEntity, IOrganizationScoped
    {
        public Guid OrganizationId { get; set; }
        public Guid ProjectId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;

        // Navigation properties
        public virtual Organization Organization { get; set; } = null!;
        public virtual Project Project { get; set; } = null!;
        public virtual ICollection<TeamMember> Members { get; set; } = new List<TeamMember>();
    }

    /// <summary>
    /// TeamMember entity representing team membership
    /// </summary>
    public class TeamMember : BaseEntity
    {
        public Guid TeamId { get; set; }
        public Guid UserId { get; set; }
        public string Role { get; set; } = "member";
        public List<string> Permissions { get; set; } = new();
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Team Team { get; set; } = null!;
        public virtual User User { get; set; } = null!;
    }
}