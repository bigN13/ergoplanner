using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Ergoplanner.Domain.Entities;
using Ergoplanner.Domain.Enums;

namespace Ergoplanner.Application.Interfaces
{
    /// <summary>
    /// Repository interface for Symbol entity with specialized methods
    /// </summary>
    public interface ISymbolRepository : IRepository<Symbol>
    {
        Task<IEnumerable<Symbol>> GetByOrganizationAsync(Guid organizationId, CancellationToken cancellationToken = default);
        Task<IEnumerable<Symbol>> GetByCategoryAsync(Guid categoryId, CancellationToken cancellationToken = default);
        Task<IEnumerable<Symbol>> GetByTypeAsync(Guid organizationId, SymbolType symbolType, CancellationToken cancellationToken = default);
        Task<IEnumerable<Symbol>> GetByStatusAsync(Guid organizationId, SymbolStatus status, CancellationToken cancellationToken = default);
        Task<IEnumerable<Symbol>> GetByTemplateAsync(Guid templateId, CancellationToken cancellationToken = default);
        Task<IEnumerable<Symbol>> SearchAsync(Guid organizationId, string searchTerm, CancellationToken cancellationToken = default);
        Task<IEnumerable<Symbol>> GetFavoritesAsync(Guid userId, CancellationToken cancellationToken = default);
        Task<IEnumerable<Symbol>> GetRecentlyUsedAsync(Guid userId, int count = 10, CancellationToken cancellationToken = default);
        Task<IEnumerable<Symbol>> GetMostUsedAsync(Guid organizationId, int count = 10, CancellationToken cancellationToken = default);
        Task<Symbol?> GetByCodeAsync(Guid organizationId, string code, CancellationToken cancellationToken = default);
        Task<bool> IsCodeUniqueAsync(Guid organizationId, string code, Guid? excludeSymbolId = null, CancellationToken cancellationToken = default);
        Task<IEnumerable<Symbol>> GetWithSpecificationsAsync(Guid organizationId, CancellationToken cancellationToken = default);
        Task<IEnumerable<Symbol>> GetByStandardAsync(Guid organizationId, IndustryStandard standard, CancellationToken cancellationToken = default);
        Task IncrementUsageCountAsync(Guid symbolId, CancellationToken cancellationToken = default);
        Task UpdateRatingAsync(Guid symbolId, decimal newRating, int reviewCount, CancellationToken cancellationToken = default);
    }

    /// <summary>
    /// Repository interface for SymbolCategory entity with hierarchical operations
    /// </summary>
    public interface ISymbolCategoryRepository : IRepository<SymbolCategory>
    {
        Task<IEnumerable<SymbolCategory>> GetByOrganizationAsync(Guid organizationId, CancellationToken cancellationToken = default);
        Task<IEnumerable<SymbolCategory>> GetRootCategoriesAsync(Guid organizationId, CancellationToken cancellationToken = default);
        Task<IEnumerable<SymbolCategory>> GetChildCategoriesAsync(Guid parentCategoryId, CancellationToken cancellationToken = default);
        Task<IEnumerable<SymbolCategory>> GetCategoryHierarchyAsync(Guid categoryId, CancellationToken cancellationToken = default);
        Task<SymbolCategory?> GetByCodeAsync(Guid organizationId, string code, CancellationToken cancellationToken = default);
        Task<bool> IsCodeUniqueAsync(Guid organizationId, string code, Guid? excludeCategoryId = null, CancellationToken cancellationToken = default);
        Task<string> GeneratePathAsync(Guid? parentCategoryId, string categoryCode, CancellationToken cancellationToken = default);
        Task UpdatePathsAsync(Guid categoryId, string newPath, CancellationToken cancellationToken = default);
        Task<int> GetSymbolCountAsync(Guid categoryId, CancellationToken cancellationToken = default);
        Task<bool> HasChildCategoriesAsync(Guid categoryId, CancellationToken cancellationToken = default);
    }

    /// <summary>
    /// Repository interface for SymbolTemplate entity
    /// </summary>
    public interface ISymbolTemplateRepository : IRepository<SymbolTemplate>
    {
        Task<IEnumerable<SymbolTemplate>> GetByOrganizationAsync(Guid organizationId, CancellationToken cancellationToken = default);
        Task<IEnumerable<SymbolTemplate>> GetByCategoryAsync(Guid categoryId, CancellationToken cancellationToken = default);
        Task<IEnumerable<SymbolTemplate>> GetByTypeAsync(Guid organizationId, SymbolType symbolType, CancellationToken cancellationToken = default);
        Task<SymbolTemplate?> GetByCodeAsync(Guid organizationId, string code, CancellationToken cancellationToken = default);
        Task<bool> IsCodeUniqueAsync(Guid organizationId, string code, Guid? excludeTemplateId = null, CancellationToken cancellationToken = default);
        Task<IEnumerable<SymbolTemplate>> GetStandardTemplatesAsync(CancellationToken cancellationToken = default);
        Task<IEnumerable<SymbolTemplate>> GetMostUsedAsync(Guid organizationId, int count = 10, CancellationToken cancellationToken = default);
        Task IncrementUsageCountAsync(Guid templateId, CancellationToken cancellationToken = default);
    }

    /// <summary>
    /// Repository interface for SymbolVersion entity
    /// </summary>
    public interface ISymbolVersionRepository : IRepository<SymbolVersion>
    {
        Task<IEnumerable<SymbolVersion>> GetBySymbolAsync(Guid symbolId, CancellationToken cancellationToken = default);
        Task<SymbolVersion?> GetCurrentVersionAsync(Guid symbolId, CancellationToken cancellationToken = default);
        Task<SymbolVersion?> GetVersionAsync(Guid symbolId, int versionNumber, CancellationToken cancellationToken = default);
        Task<int> GetNextVersionNumberAsync(Guid symbolId, CancellationToken cancellationToken = default);
        Task SetCurrentVersionAsync(Guid symbolId, Guid versionId, CancellationToken cancellationToken = default);
        Task<IEnumerable<SymbolVersion>> GetVersionHistoryAsync(Guid symbolId, CancellationToken cancellationToken = default);
        Task<SymbolVersion?> GetPreviousVersionAsync(Guid symbolId, int currentVersionNumber, CancellationToken cancellationToken = default);
        Task<bool> HasVersionsAsync(Guid symbolId, CancellationToken cancellationToken = default);
    }

    /// <summary>
    /// Repository interface for SymbolUsage entity for analytics
    /// </summary>
    public interface ISymbolUsageRepository : IRepository<SymbolUsage>
    {
        Task<IEnumerable<SymbolUsage>> GetBySymbolAsync(Guid symbolId, CancellationToken cancellationToken = default);
        Task<IEnumerable<SymbolUsage>> GetByUserAsync(Guid userId, CancellationToken cancellationToken = default);
        Task<IEnumerable<SymbolUsage>> GetByProjectAsync(Guid projectId, CancellationToken cancellationToken = default);
        Task<IEnumerable<SymbolUsage>> GetByDrawingAsync(Guid drawingId, CancellationToken cancellationToken = default);
        Task<IEnumerable<SymbolUsage>> GetRecentUsageAsync(Guid userId, int count = 10, CancellationToken cancellationToken = default);
        Task<Dictionary<Guid, int>> GetUsageStatisticsAsync(Guid organizationId, DateTime fromDate, DateTime toDate, CancellationToken cancellationToken = default);
        Task<IEnumerable<Symbol>> GetMostUsedSymbolsAsync(Guid organizationId, int count = 10, CancellationToken cancellationToken = default);
        Task LogUsageAsync(Guid symbolId, Guid userId, string usageType, string? context = null, Guid? projectId = null, Guid? drawingId = null, Guid? componentId = null, CancellationToken cancellationToken = default);
    }

    /// <summary>
    /// Repository interface for SymbolFavorite entity
    /// </summary>
    public interface ISymbolFavoriteRepository : IRepository<SymbolFavorite>
    {
        Task<IEnumerable<SymbolFavorite>> GetByUserAsync(Guid userId, CancellationToken cancellationToken = default);
        Task<SymbolFavorite?> GetByUserAndSymbolAsync(Guid userId, Guid symbolId, CancellationToken cancellationToken = default);
        Task<bool> IsFavoriteAsync(Guid userId, Guid symbolId, CancellationToken cancellationToken = default);
        Task AddFavoriteAsync(Guid userId, Guid symbolId, string? notes = null, CancellationToken cancellationToken = default);
        Task RemoveFavoriteAsync(Guid userId, Guid symbolId, CancellationToken cancellationToken = default);
        Task<int> GetFavoriteCountAsync(Guid symbolId, CancellationToken cancellationToken = default);
    }

    /// <summary>
    /// Repository interface for SymbolApproval entity
    /// </summary>
    public interface ISymbolApprovalRepository : IRepository<SymbolApproval>
    {
        Task<IEnumerable<SymbolApproval>> GetBySymbolAsync(Guid symbolId, CancellationToken cancellationToken = default);
        Task<IEnumerable<SymbolApproval>> GetByApproverAsync(Guid approverId, CancellationToken cancellationToken = default);
        Task<IEnumerable<SymbolApproval>> GetPendingApprovalsAsync(Guid approverId, CancellationToken cancellationToken = default);
        Task<SymbolApproval?> GetCurrentApprovalAsync(Guid symbolId, CancellationToken cancellationToken = default);
        Task<bool> IsApprovedAsync(Guid symbolId, CancellationToken cancellationToken = default);
        Task<bool> HasPendingApprovalsAsync(Guid symbolId, CancellationToken cancellationToken = default);
    }
}