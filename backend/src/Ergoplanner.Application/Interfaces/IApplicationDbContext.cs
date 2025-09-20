using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Ergoplanner.Domain.Entities;

namespace Ergoplanner.Application.Interfaces
{
    /// <summary>
    /// Application database context interface
    /// </summary>
    public interface IApplicationDbContext
    {
        DbSet<Organization> Organizations { get; }
        DbSet<OrganizationBranch> OrganizationBranches { get; }
        DbSet<User> Users { get; }
        DbSet<Project> Projects { get; }
        DbSet<Team> Teams { get; }
        DbSet<TeamMember> TeamMembers { get; }
        DbSet<Drawing> Drawings { get; }
        DbSet<Component> Components { get; }
        DbSet<Symbol> Symbols { get; }
        DbSet<BoQItem> BoQItems { get; }
        DbSet<ApprovalWorkflow> ApprovalWorkflows { get; }
        DbSet<ApprovalStage> ApprovalStages { get; }
        DbSet<Comment> Comments { get; }
        DbSet<AuditLog> AuditLogs { get; }
        DbSet<RefreshToken> RefreshTokens { get; }

        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}