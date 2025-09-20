using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Enums;

namespace Ergoplanner.Application.DTOs.Teams
{
    /// <summary>
    /// Team data transfer object
    /// </summary>
    public class TeamDto
    {
        public Guid Id { get; set; }
        public Guid OrganizationId { get; set; }
        public Guid ProjectId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; }
        public string? ProjectName { get; set; }
        public List<TeamMemberDto> Members { get; set; } = new();
        public int MembersCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public Guid? CreatedBy { get; set; }
        public Guid? UpdatedBy { get; set; }
    }

    /// <summary>
    /// Team member data transfer object
    /// </summary>
    public class TeamMemberDto
    {
        public Guid Id { get; set; }
        public Guid TeamId { get; set; }
        public Guid UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? DisplayName { get; set; }
        public string? AvatarUrl { get; set; }
        public string Role { get; set; } = "member";
        public List<string> Permissions { get; set; } = new();
        public DateTime JoinedAt { get; set; }
        public UserRole UserRole { get; set; }
    }

    /// <summary>
    /// DTO for creating a new team
    /// </summary>
    public class CreateTeamDto
    {
        public Guid ProjectId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public List<Guid>? InitialMemberIds { get; set; }
    }

    /// <summary>
    /// DTO for updating a team
    /// </summary>
    public class UpdateTeamDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public bool? IsActive { get; set; }
    }

    /// <summary>
    /// DTO for adding a member to a team
    /// </summary>
    public class AddTeamMemberDto
    {
        public Guid UserId { get; set; }
        public string Role { get; set; } = "member";
        public List<string> Permissions { get; set; } = new();
    }

    /// <summary>
    /// DTO for updating a team member
    /// </summary>
    public class UpdateTeamMemberDto
    {
        public string? Role { get; set; }
        public List<string>? Permissions { get; set; }
    }

    /// <summary>
    /// Team summary for list views
    /// </summary>
    public class TeamSummaryDto
    {
        public Guid Id { get; set; }
        public Guid ProjectId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ProjectName { get; set; }
        public int MembersCount { get; set; }
        public bool IsActive { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}