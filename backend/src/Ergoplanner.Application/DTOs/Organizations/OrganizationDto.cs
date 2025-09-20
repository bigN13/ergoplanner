using System;
using System.Collections.Generic;

namespace Ergoplanner.Application.DTOs.Organizations
{
    /// <summary>
    /// Organization data transfer object
    /// </summary>
    public class OrganizationDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Industry { get; set; }
        public string? Website { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public Dictionary<string, object> Address { get; set; } = new();
        public string? TaxId { get; set; }
        public string? RegistrationNumber { get; set; }
        public int MaxUsers { get; set; }
        public int MaxProjects { get; set; }
        public Dictionary<string, object> Settings { get; set; } = new();
        public List<string> Features { get; set; } = new();
        public bool IsActive { get; set; }
        public DateTime? SubscriptionExpiry { get; set; }
        public string SubscriptionTier { get; set; } = "free";
        public int UsersCount { get; set; }
        public int ProjectsCount { get; set; }
        public int ActiveProjectsCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    /// <summary>
    /// DTO for creating a new organization
    /// </summary>
    public class CreateOrganizationDto
    {
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Industry { get; set; }
        public string? Website { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public Dictionary<string, object> Address { get; set; } = new();
        public string? TaxId { get; set; }
        public string? RegistrationNumber { get; set; }
        public int MaxUsers { get; set; } = 10;
        public int MaxProjects { get; set; } = 5;
        public Dictionary<string, object> Settings { get; set; } = new();
        public string SubscriptionTier { get; set; } = "free";
    }

    /// <summary>
    /// DTO for updating an organization
    /// </summary>
    public class UpdateOrganizationDto
    {
        public string? Name { get; set; }
        public string? Code { get; set; }
        public string? Description { get; set; }
        public string? Industry { get; set; }
        public string? Website { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public Dictionary<string, object>? Address { get; set; }
        public string? TaxId { get; set; }
        public string? RegistrationNumber { get; set; }
        public int? MaxUsers { get; set; }
        public int? MaxProjects { get; set; }
        public Dictionary<string, object>? Settings { get; set; }
        public List<string>? Features { get; set; }
        public bool? IsActive { get; set; }
    }

    /// <summary>
    /// Organization branch data transfer object
    /// </summary>
    public class OrganizationBranchDto
    {
        public Guid Id { get; set; }
        public Guid OrganizationId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public Dictionary<string, object> Address { get; set; } = new();
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public bool IsHeadquarters { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    /// <summary>
    /// DTO for creating a new organization branch
    /// </summary>
    public class CreateOrganizationBranchDto
    {
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public Dictionary<string, object> Address { get; set; } = new();
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public bool IsHeadquarters { get; set; } = false;
    }

    /// <summary>
    /// Organization summary for list views
    /// </summary>
    public class OrganizationSummaryDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Industry { get; set; }
        public string SubscriptionTier { get; set; } = "free";
        public int UsersCount { get; set; }
        public int ProjectsCount { get; set; }
        public bool IsActive { get; set; }
        public DateTime? SubscriptionExpiry { get; set; }
    }
}