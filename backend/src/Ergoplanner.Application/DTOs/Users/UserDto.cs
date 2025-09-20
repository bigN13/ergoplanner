using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Enums;

namespace Ergoplanner.Application.DTOs.Users
{
    /// <summary>
    /// User data transfer object
    /// </summary>
    public class UserDto
    {
        public Guid Id { get; set; }
        public Guid OrganizationId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? DisplayName { get; set; }
        public string? AvatarUrl { get; set; }
        public UserRole Role { get; set; }
        public List<string> Permissions { get; set; } = new();
        public bool IsActive { get; set; }
        public bool IsVerified { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public Dictionary<string, object> Preferences { get; set; } = new();
        public string? OrganizationName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    /// <summary>
    /// User profile data transfer object (for authenticated user)
    /// </summary>
    public class UserProfileDto
    {
        public Guid Id { get; set; }
        public Guid OrganizationId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? DisplayName { get; set; }
        public string? AvatarUrl { get; set; }
        public UserRole Role { get; set; }
        public List<string> Permissions { get; set; } = new();
        public bool IsActive { get; set; }
        public bool IsVerified { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public Dictionary<string, object> Preferences { get; set; } = new();
        public OrganizationSummaryDto? Organization { get; set; }
        public List<TeamSummaryDto> Teams { get; set; } = new();
        public List<ProjectSummaryDto> RecentProjects { get; set; } = new();
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// DTO for updating user profile
    /// </summary>
    public class UpdateUserProfileDto
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? DisplayName { get; set; }
        public string? AvatarUrl { get; set; }
        public Dictionary<string, object>? Preferences { get; set; }
    }

    /// <summary>
    /// DTO for admin updating user
    /// </summary>
    public class UpdateUserDto
    {
        public string? Email { get; set; }
        public string? Username { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? DisplayName { get; set; }
        public string? AvatarUrl { get; set; }
        public UserRole? Role { get; set; }
        public List<string>? Permissions { get; set; }
        public bool? IsActive { get; set; }
        public Dictionary<string, object>? Preferences { get; set; }
    }

    /// <summary>
    /// DTO for creating a new user (admin operation)
    /// </summary>
    public class CreateUserDto
    {
        public string Email { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? DisplayName { get; set; }
        public UserRole Role { get; set; } = UserRole.Viewer;
        public List<string> Permissions { get; set; } = new();
        public bool SendVerificationEmail { get; set; } = true;
    }

    /// <summary>
    /// User summary for list views
    /// </summary>
    public class UserSummaryDto
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string? DisplayName { get; set; }
        public string? AvatarUrl { get; set; }
        public UserRole Role { get; set; }
        public bool IsActive { get; set; }
        public bool IsVerified { get; set; }
        public DateTime? LastLoginAt { get; set; }
    }

    /// <summary>
    /// Organization summary for user profile
    /// </summary>
    public class OrganizationSummaryDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string SubscriptionTier { get; set; } = string.Empty;
    }

    /// <summary>
    /// Team summary for user profile
    /// </summary>
    public class TeamSummaryDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public Guid ProjectId { get; set; }
        public string? ProjectName { get; set; }
        public string Role { get; set; } = string.Empty;
    }

    /// <summary>
    /// Project summary for user profile
    /// </summary>
    public class ProjectSummaryDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public DateTime? LastAccessedAt { get; set; }
    }
}