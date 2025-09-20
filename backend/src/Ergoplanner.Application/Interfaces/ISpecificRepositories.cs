using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Ergoplanner.Domain.Entities;
using Ergoplanner.Domain.Enums;

namespace Ergoplanner.Application.Interfaces
{
    /// <summary>
    /// Organization repository interface
    /// </summary>
    public interface IOrganizationRepository : IRepository<Organization>
    {
        Task<Organization?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);
        Task<IEnumerable<Organization>> GetActiveOrganizationsAsync(CancellationToken cancellationToken = default);
    }

    /// <summary>
    /// User repository interface
    /// </summary>
    public interface IUserRepository : IRepository<User>
    {
        Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
        Task<User?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default);
        Task<IEnumerable<User>> GetByOrganizationAsync(Guid organizationId, CancellationToken cancellationToken = default);
        Task<IEnumerable<User>> GetByRoleAsync(Guid organizationId, UserRole role, CancellationToken cancellationToken = default);
        Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default);
        Task<bool> UsernameExistsAsync(string username, CancellationToken cancellationToken = default);
    }

    /// <summary>
    /// Project repository interface
    /// </summary>
    public interface IProjectRepository : IRepository<Project>
    {
        Task<Project?> GetByCodeAsync(Guid organizationId, string code, CancellationToken cancellationToken = default);
        Task<IEnumerable<Project>> GetByOrganizationAsync(Guid organizationId, CancellationToken cancellationToken = default);
        Task<IEnumerable<Project>> GetActiveProjectsAsync(Guid organizationId, CancellationToken cancellationToken = default);
        Task<IEnumerable<Project>> GetProjectsByStatusAsync(Guid organizationId, ProjectStatus status, CancellationToken cancellationToken = default);
    }

    /// <summary>
    /// Drawing repository interface
    /// </summary>
    public interface IDrawingRepository : IRepository<Drawing>
    {
        Task<Drawing?> GetByNumberAsync(Guid projectId, string drawingNumber, string revision, CancellationToken cancellationToken = default);
        Task<IEnumerable<Drawing>> GetByProjectAsync(Guid projectId, CancellationToken cancellationToken = default);
        Task<IEnumerable<Drawing>> GetByStatusAsync(Guid projectId, DrawingStatus status, CancellationToken cancellationToken = default);
        Task<IEnumerable<Drawing>> GetTemplatesAsync(Guid organizationId, CancellationToken cancellationToken = default);
        Task<bool> IsLockedAsync(Guid drawingId, CancellationToken cancellationToken = default);
        Task<bool> LockDrawingAsync(Guid drawingId, Guid userId, CancellationToken cancellationToken = default);
        Task<bool> UnlockDrawingAsync(Guid drawingId, Guid userId, CancellationToken cancellationToken = default);
    }

    /// <summary>
    /// Symbol repository interface
    /// </summary>
    public interface ISymbolRepository : IRepository<Symbol>
    {
        Task<Symbol?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);
        Task<IEnumerable<Symbol>> GetByCategoryAsync(Guid organizationId, string category, CancellationToken cancellationToken = default);
        Task<IEnumerable<Symbol>> GetByStandardAsync(Guid organizationId, string standard, CancellationToken cancellationToken = default);
        Task<IEnumerable<Symbol>> SearchSymbolsAsync(Guid organizationId, string searchTerm, CancellationToken cancellationToken = default);
    }

    /// <summary>
    /// BoQ repository interface
    /// </summary>
    public interface IBoQRepository : IRepository<BoQItem>
    {
        Task<IEnumerable<BoQItem>> GetByProjectAsync(Guid projectId, CancellationToken cancellationToken = default);
        Task<IEnumerable<BoQItem>> GetByDrawingAsync(Guid drawingId, CancellationToken cancellationToken = default);
        Task<IEnumerable<BoQItem>> GetByComponentAsync(Guid componentId, CancellationToken cancellationToken = default);
        Task<decimal> GetTotalCostAsync(Guid projectId, CancellationToken cancellationToken = default);
    }

    /// <summary>
    /// Approval workflow repository interface
    /// </summary>
    public interface IApprovalWorkflowRepository : IRepository<ApprovalWorkflow>
    {
        Task<ApprovalWorkflow?> GetActiveWorkflowAsync(Guid drawingId, CancellationToken cancellationToken = default);
        Task<IEnumerable<ApprovalWorkflow>> GetPendingApprovalsAsync(Guid userId, CancellationToken cancellationToken = default);
        Task<IEnumerable<ApprovalWorkflow>> GetWorkflowHistoryAsync(Guid drawingId, CancellationToken cancellationToken = default);
    }
}