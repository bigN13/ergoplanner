using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Ergoplanner.Application.DTOs;
using Ergoplanner.Application.Common.Models;
using Ergoplanner.Domain.Enums;

namespace Ergoplanner.Application.Services
{
    /// <summary>
    /// Symbol management service interface
    /// </summary>
    public interface ISymbolService
    {
        // Symbol CRUD operations
        Task<SymbolDto?> GetSymbolAsync(Guid id, CancellationToken cancellationToken = default);
        Task<PagedList<SymbolSummaryDto>> GetSymbolsAsync(Guid organizationId, SymbolSearchDto search, CancellationToken cancellationToken = default);
        Task<SymbolDto> CreateSymbolAsync(Guid organizationId, CreateSymbolDto createDto, Guid userId, CancellationToken cancellationToken = default);
        Task<SymbolDto> UpdateSymbolAsync(Guid id, UpdateSymbolDto updateDto, Guid userId, CancellationToken cancellationToken = default);
        Task DeleteSymbolAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);

        // Symbol versioning
        Task<SymbolVersionDto> CreateVersionAsync(Guid symbolId, string? changeDescription, Guid userId, CancellationToken cancellationToken = default);
        Task<IEnumerable<SymbolVersionDto>> GetVersionHistoryAsync(Guid symbolId, CancellationToken cancellationToken = default);
        Task<SymbolVersionDto?> GetVersionAsync(Guid symbolId, int versionNumber, CancellationToken cancellationToken = default);
        Task SetCurrentVersionAsync(Guid symbolId, Guid versionId, Guid userId, CancellationToken cancellationToken = default);

        // Symbol categories
        Task<IEnumerable<SymbolCategoryDto>> GetCategoriesAsync(Guid organizationId, CancellationToken cancellationToken = default);
        Task<SymbolCategoryDto?> GetCategoryAsync(Guid id, CancellationToken cancellationToken = default);
        Task<SymbolCategoryDto> CreateCategoryAsync(Guid organizationId, CreateSymbolCategoryDto createDto, Guid userId, CancellationToken cancellationToken = default);
        Task<SymbolCategoryDto> UpdateCategoryAsync(Guid id, CreateSymbolCategoryDto updateDto, Guid userId, CancellationToken cancellationToken = default);
        Task DeleteCategoryAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
        Task<IEnumerable<SymbolCategoryDto>> GetCategoryHierarchyAsync(Guid categoryId, CancellationToken cancellationToken = default);

        // Symbol templates
        Task<IEnumerable<SymbolTemplateDto>> GetTemplatesAsync(Guid organizationId, CancellationToken cancellationToken = default);
        Task<SymbolTemplateDto?> GetTemplateAsync(Guid id, CancellationToken cancellationToken = default);
        Task<SymbolDto> CreateFromTemplateAsync(Guid templateId, CreateSymbolDto symbolDto, Guid userId, CancellationToken cancellationToken = default);

        // Symbol favorites
        Task<IEnumerable<SymbolSummaryDto>> GetFavoritesAsync(Guid userId, CancellationToken cancellationToken = default);
        Task AddToFavoritesAsync(Guid symbolId, Guid userId, string? notes = null, CancellationToken cancellationToken = default);
        Task RemoveFromFavoritesAsync(Guid symbolId, Guid userId, CancellationToken cancellationToken = default);
        Task<bool> IsFavoriteAsync(Guid symbolId, Guid userId, CancellationToken cancellationToken = default);

        // Symbol usage and analytics
        Task LogUsageAsync(Guid symbolId, Guid userId, string usageType, string? context = null, Guid? projectId = null, Guid? drawingId = null, Guid? componentId = null, CancellationToken cancellationToken = default);
        Task<IEnumerable<SymbolSummaryDto>> GetRecentlyUsedAsync(Guid userId, int count = 10, CancellationToken cancellationToken = default);
        Task<IEnumerable<SymbolSummaryDto>> GetMostUsedAsync(Guid organizationId, int count = 10, CancellationToken cancellationToken = default);
        Task<SymbolUsageStatsDto> GetUsageStatisticsAsync(Guid symbolId, DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default);

        // Symbol feedback and ratings
        Task<IEnumerable<SymbolFeedbackDto>> GetFeedbackAsync(Guid symbolId, CancellationToken cancellationToken = default);
        Task<SymbolFeedbackDto> AddFeedbackAsync(Guid symbolId, CreateSymbolFeedbackDto feedbackDto, Guid userId, CancellationToken cancellationToken = default);
        Task ResolveFeedbackAsync(Guid feedbackId, string? resolutionNotes, Guid resolvedBy, CancellationToken cancellationToken = default);

        // Symbol approval workflow
        Task<IEnumerable<SymbolApprovalDto>> GetPendingApprovalsAsync(Guid approverId, CancellationToken cancellationToken = default);
        Task SubmitForApprovalAsync(Guid symbolId, Guid userId, CancellationToken cancellationToken = default);
        Task ApproveSymbolAsync(Guid symbolId, Guid approverId, string? comments = null, CancellationToken cancellationToken = default);
        Task RejectSymbolAsync(Guid symbolId, Guid approverId, string comments, CancellationToken cancellationToken = default);

        // Symbol validation
        Task<bool> ValidateSymbolCodeAsync(Guid organizationId, string code, Guid? excludeSymbolId = null, CancellationToken cancellationToken = default);
        Task<bool> ValidateSvgContentAsync(string svgContent, CancellationToken cancellationToken = default);

        // Symbol import/export
        Task<IEnumerable<SymbolDto>> ImportSymbolsAsync(Guid organizationId, byte[] fileData, string fileName, Guid userId, CancellationToken cancellationToken = default);
        Task<byte[]> ExportSymbolsAsync(Guid organizationId, IEnumerable<Guid> symbolIds, string format = "json", CancellationToken cancellationToken = default);

        // Symbol duplication and sharing
        Task<SymbolDto> DuplicateSymbolAsync(Guid symbolId, string newName, string newCode, Guid userId, CancellationToken cancellationToken = default);
        Task ShareSymbolAsync(Guid symbolId, AccessLevel accessLevel, Guid userId, CancellationToken cancellationToken = default);
    }

    /// <summary>
    /// Symbol category service interface
    /// </summary>
    public interface ISymbolCategoryService
    {
        Task<IEnumerable<SymbolCategoryDto>> GetHierarchyAsync(Guid organizationId, CancellationToken cancellationToken = default);
        Task<SymbolCategoryDto> CreateCategoryAsync(Guid organizationId, CreateSymbolCategoryDto createDto, Guid userId, CancellationToken cancellationToken = default);
        Task<SymbolCategoryDto> UpdateCategoryAsync(Guid id, CreateSymbolCategoryDto updateDto, Guid userId, CancellationToken cancellationToken = default);
        Task DeleteCategoryAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
        Task MoveCategoryAsync(Guid categoryId, Guid? newParentId, Guid userId, CancellationToken cancellationToken = default);
        Task ReorderCategoriesAsync(Guid parentId, IEnumerable<Guid> categoryIds, Guid userId, CancellationToken cancellationToken = default);
        Task<bool> ValidateCategoryCodeAsync(Guid organizationId, string code, Guid? excludeCategoryId = null, CancellationToken cancellationToken = default);
    }

    /// <summary>
    /// Symbol template service interface
    /// </summary>
    public interface ISymbolTemplateService
    {
        Task<IEnumerable<SymbolTemplateDto>> GetTemplatesAsync(Guid organizationId, SymbolType? symbolType = null, CancellationToken cancellationToken = default);
        Task<SymbolTemplateDto?> GetTemplateAsync(Guid id, CancellationToken cancellationToken = default);
        Task<SymbolTemplateDto> CreateTemplateAsync(Guid organizationId, SymbolTemplateDto templateDto, Guid userId, CancellationToken cancellationToken = default);
        Task<SymbolTemplateDto> UpdateTemplateAsync(Guid id, SymbolTemplateDto templateDto, Guid userId, CancellationToken cancellationToken = default);
        Task DeleteTemplateAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
        Task<SymbolDto> CreateSymbolFromTemplateAsync(Guid templateId, CreateSymbolDto symbolDto, Guid userId, CancellationToken cancellationToken = default);
        Task<IEnumerable<SymbolTemplateDto>> GetStandardTemplatesAsync(CancellationToken cancellationToken = default);
        Task<bool> ValidateTemplateCodeAsync(Guid organizationId, string code, Guid? excludeTemplateId = null, CancellationToken cancellationToken = default);
    }
}