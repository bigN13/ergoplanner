using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Enums;

namespace Ergoplanner.Application.DTOs
{
    /// <summary>
    /// Symbol DTO for API responses
    /// </summary>
    public class SymbolDto
    {
        public Guid Id { get; set; }
        public Guid OrganizationId { get; set; }
        public Guid? CategoryId { get; set; }
        public Guid? TemplateId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string SvgContent { get; set; } = string.Empty;
        public string? ThumbnailUrl { get; set; }
        public SymbolType SymbolType { get; set; }
        public SymbolStatus Status { get; set; }
        public int Version { get; set; }
        public string? VersionNotes { get; set; }
        public Dictionary<string, object> Properties { get; set; } = new();
        public Dictionary<string, object> Metadata { get; set; } = new();
        public List<string> Tags { get; set; } = new();
        public bool IsCustom { get; set; }
        public bool IsTemplate { get; set; }
        public bool IsPublic { get; set; }
        public AccessLevel AccessLevel { get; set; }
        public int UsageCount { get; set; }
        public decimal? Rating { get; set; }
        public int ReviewCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public Guid? CreatedBy { get; set; }
        public string? CreatedByName { get; set; }
        public string? CategoryName { get; set; }
        public string? TemplateName { get; set; }
        public bool IsFavorite { get; set; }
    }

    /// <summary>
    /// Symbol summary DTO for lists and search results
    /// </summary>
    public class SymbolSummaryDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ThumbnailUrl { get; set; }
        public SymbolType SymbolType { get; set; }
        public SymbolStatus Status { get; set; }
        public List<string> Tags { get; set; } = new();
        public int UsageCount { get; set; }
        public decimal? Rating { get; set; }
        public bool IsCustom { get; set; }
        public bool IsFavorite { get; set; }
        public string? CategoryName { get; set; }
    }

    /// <summary>
    /// Create symbol DTO for API requests
    /// </summary>
    public class CreateSymbolDto
    {
        public Guid? CategoryId { get; set; }
        public Guid? TemplateId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string SvgContent { get; set; } = string.Empty;
        public SymbolType SymbolType { get; set; }
        public Dictionary<string, object> Properties { get; set; } = new();
        public Dictionary<string, object> Metadata { get; set; } = new();
        public List<string> Tags { get; set; } = new();
        public bool IsCustom { get; set; } = false;
        public bool IsTemplate { get; set; } = false;
        public bool IsPublic { get; set; } = false;
        public AccessLevel AccessLevel { get; set; } = AccessLevel.Organization;
    }

    /// <summary>
    /// Update symbol DTO for API requests
    /// </summary>
    public class UpdateSymbolDto
    {
        public Guid? CategoryId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? SvgContent { get; set; }
        public Dictionary<string, object> Properties { get; set; } = new();
        public Dictionary<string, object> Metadata { get; set; } = new();
        public List<string> Tags { get; set; } = new();
        public bool IsPublic { get; set; }
        public AccessLevel AccessLevel { get; set; }
        public string? VersionNotes { get; set; }
    }

    /// <summary>
    /// Symbol category DTO for API responses
    /// </summary>
    public class SymbolCategoryDto
    {
        public Guid Id { get; set; }
        public Guid OrganizationId { get; set; }
        public Guid? ParentCategoryId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? IconSvg { get; set; }
        public string? Color { get; set; }
        public int SortOrder { get; set; }
        public int Level { get; set; }
        public string Path { get; set; } = string.Empty;
        public bool IsStandard { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public List<SymbolCategoryDto> SubCategories { get; set; } = new();
        public int SymbolCount { get; set; }
    }

    /// <summary>
    /// Create symbol category DTO for API requests
    /// </summary>
    public class CreateSymbolCategoryDto
    {
        public Guid? ParentCategoryId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? IconSvg { get; set; }
        public string? Color { get; set; }
        public int SortOrder { get; set; } = 0;
        public Dictionary<string, object> Metadata { get; set; } = new();
    }

    /// <summary>
    /// Symbol template DTO for API responses
    /// </summary>
    public class SymbolTemplateDto
    {
        public Guid Id { get; set; }
        public Guid OrganizationId { get; set; }
        public Guid? CategoryId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Description { get; set; }
        public SymbolType SymbolType { get; set; }
        public string BaseSvgContent { get; set; } = string.Empty;
        public string? ThumbnailUrl { get; set; }
        public Dictionary<string, object> DefaultProperties { get; set; } = new();
        public List<string> Tags { get; set; } = new();
        public AccessLevel AccessLevel { get; set; }
        public bool IsStandard { get; set; }
        public int UsageCount { get; set; }
        public decimal? Rating { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? CategoryName { get; set; }
    }

    /// <summary>
    /// Symbol version DTO for API responses
    /// </summary>
    public class SymbolVersionDto
    {
        public Guid Id { get; set; }
        public Guid SymbolId { get; set; }
        public int VersionNumber { get; set; }
        public string? VersionLabel { get; set; }
        public string? ChangeDescription { get; set; }
        public SymbolStatus Status { get; set; }
        public string SvgContent { get; set; } = string.Empty;
        public Dictionary<string, object> Properties { get; set; } = new();
        public bool IsMajorVersion { get; set; }
        public bool IsCurrentVersion { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid? CreatedBy { get; set; }
        public string? CreatedByName { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public Guid? ApprovedBy { get; set; }
        public string? ApprovedByName { get; set; }
    }

    /// <summary>
    /// Symbol usage statistics DTO
    /// </summary>
    public class SymbolUsageStatsDto
    {
        public Guid SymbolId { get; set; }
        public string SymbolName { get; set; } = string.Empty;
        public string SymbolCode { get; set; } = string.Empty;
        public int TotalUsage { get; set; }
        public int UniqueUsers { get; set; }
        public int UniqueProjects { get; set; }
        public DateTime? LastUsed { get; set; }
        public Dictionary<string, int> UsageByType { get; set; } = new();
        public Dictionary<string, int> UsageByContext { get; set; } = new();
    }

    /// <summary>
    /// Symbol search request DTO
    /// </summary>
    public class SymbolSearchDto
    {
        public string? SearchTerm { get; set; }
        public Guid? CategoryId { get; set; }
        public SymbolType? SymbolType { get; set; }
        public SymbolStatus? Status { get; set; }
        public List<string> Tags { get; set; } = new();
        public bool? IsCustom { get; set; }
        public bool? IsPublic { get; set; }
        public bool? FavoritesOnly { get; set; }
        public IndustryStandard? Standard { get; set; }
        public decimal? MinRating { get; set; }
        public DateTime? CreatedAfter { get; set; }
        public DateTime? CreatedBefore { get; set; }
        public string? SortBy { get; set; } = "name";
        public bool SortDescending { get; set; } = false;
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    /// <summary>
    /// Symbol feedback DTO
    /// </summary>
    public class SymbolFeedbackDto
    {
        public Guid Id { get; set; }
        public Guid SymbolId { get; set; }
        public Guid UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public FeedbackType FeedbackType { get; set; }
        public int? Rating { get; set; }
        public string? Title { get; set; }
        public string? Comment { get; set; }
        public List<string> Tags { get; set; } = new();
        public bool IsAnonymous { get; set; }
        public bool IsResolved { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public string? ResolvedByName { get; set; }
    }

    /// <summary>
    /// Create symbol feedback DTO
    /// </summary>
    public class CreateSymbolFeedbackDto
    {
        public FeedbackType FeedbackType { get; set; }
        public int? Rating { get; set; }
        public string? Title { get; set; }
        public string? Comment { get; set; }
        public List<string> Tags { get; set; } = new();
        public bool IsAnonymous { get; set; } = false;
    }

    /// <summary>
    /// Symbol approval DTO
    /// </summary>
    public class SymbolApprovalDto
    {
        public Guid Id { get; set; }
        public Guid SymbolId { get; set; }
        public Guid? VersionId { get; set; }
        public Guid ApproverId { get; set; }
        public string ApproverName { get; set; } = string.Empty;
        public ApprovalDecision? Decision { get; set; }
        public string? Comments { get; set; }
        public DateTime? DecisionDate { get; set; }
        public string ApprovalStage { get; set; } = string.Empty;
        public int StageOrder { get; set; }
        public bool IsRequired { get; set; }
        public DateTime? DueDate { get; set; }
        public string? RequiredRole { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}