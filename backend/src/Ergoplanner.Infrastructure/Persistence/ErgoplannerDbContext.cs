using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.Entities;
using Ergoplanner.Infrastructure.Persistence.Configurations;

namespace Ergoplanner.Infrastructure.Persistence
{
    public class ErgoplannerDbContext : DbContext
    {
        public ErgoplannerDbContext(DbContextOptions<ErgoplannerDbContext> options)
            : base(options)
        {
        }

        // Core entities
        public DbSet<Organization> Organizations { get; set; } = null!;
        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Project> Projects { get; set; } = null!;
        public DbSet<Team> Teams { get; set; } = null!;
        public DbSet<TeamMember> TeamMembers { get; set; } = null!;

        // Drawing entities
        public DbSet<Drawing> Drawings { get; set; } = null!;
        public DbSet<Component> Components { get; set; } = null!;
        public DbSet<BoQItem> BoQItems { get; set; } = null!;

        // Symbol entities
        public DbSet<Symbol> Symbols { get; set; } = null!;
        public DbSet<SymbolCategory> SymbolCategories { get; set; } = null!;
        public DbSet<SymbolTemplate> SymbolTemplates { get; set; } = null!;
        public DbSet<SymbolVersion> SymbolVersions { get; set; } = null!;
        public DbSet<SymbolProperty> SymbolProperties { get; set; } = null!;
        public DbSet<SymbolSpecification> SymbolSpecifications { get; set; } = null!;
        public DbSet<SymbolStandard> SymbolStandards { get; set; } = null!;
        public DbSet<SymbolUsage> SymbolUsage { get; set; } = null!;
        public DbSet<SymbolFavorite> SymbolFavorites { get; set; } = null!;
        public DbSet<SymbolFeedback> SymbolFeedback { get; set; } = null!;
        public DbSet<SymbolVariant> SymbolVariants { get; set; } = null!;
        public DbSet<SymbolApproval> SymbolApprovals { get; set; } = null!;
        public DbSet<SymbolChangeLog> SymbolChangeLogs { get; set; } = null!;

        // Workflow entities
        public DbSet<DrawingVersion> DrawingVersions { get; set; } = null!;
        public DbSet<ApprovalWorkflow> ApprovalWorkflows { get; set; } = null!;
        public DbSet<ApprovalStage> ApprovalStages { get; set; } = null!;
        public DbSet<Comment> Comments { get; set; } = null!;

        // Audit
        public DbSet<AuditLog> AuditLogs { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Apply configurations
            modelBuilder.ApplyConfiguration(new OrganizationConfiguration());
            modelBuilder.ApplyConfiguration(new UserConfiguration());
            modelBuilder.ApplyConfiguration(new ProjectConfiguration());
            modelBuilder.ApplyConfiguration(new TeamConfiguration());
            modelBuilder.ApplyConfiguration(new DrawingConfiguration());
            modelBuilder.ApplyConfiguration(new ComponentConfiguration());
            modelBuilder.ApplyConfiguration(new BoQItemConfiguration());

            // Symbol configurations
            modelBuilder.ApplyConfiguration(new SymbolConfiguration());
            modelBuilder.ApplyConfiguration(new SymbolCategoryConfiguration());
            modelBuilder.ApplyConfiguration(new SymbolTemplateConfiguration());
            modelBuilder.ApplyConfiguration(new SymbolVersionConfiguration());
            modelBuilder.ApplyConfiguration(new SymbolPropertyConfiguration());
            modelBuilder.ApplyConfiguration(new SymbolSpecificationConfiguration());
            modelBuilder.ApplyConfiguration(new SymbolStandardConfiguration());
            modelBuilder.ApplyConfiguration(new SymbolUsageConfiguration());
            modelBuilder.ApplyConfiguration(new SymbolFavoriteConfiguration());
            modelBuilder.ApplyConfiguration(new SymbolFeedbackConfiguration());
            modelBuilder.ApplyConfiguration(new SymbolVariantConfiguration());
            modelBuilder.ApplyConfiguration(new SymbolApprovalConfiguration());
            modelBuilder.ApplyConfiguration(new SymbolChangeLogConfiguration());

            // Workflow configurations
            modelBuilder.ApplyConfiguration(new ApprovalWorkflowConfiguration());
            modelBuilder.ApplyConfiguration(new DrawingVersionConfiguration());
            modelBuilder.ApplyConfiguration(new CommentConfiguration());
            modelBuilder.ApplyConfiguration(new AuditLogConfiguration());

            // Apply global query filters for soft delete
            modelBuilder.Entity<Project>().HasQueryFilter(p => !p.IsDeleted);
            modelBuilder.Entity<Organization>().HasQueryFilter(o => !o.IsDeleted);
            modelBuilder.Entity<Symbol>().HasQueryFilter(s => !s.IsDeleted);
            modelBuilder.Entity<SymbolCategory>().HasQueryFilter(sc => !sc.IsDeleted);
            modelBuilder.Entity<SymbolTemplate>().HasQueryFilter(st => !st.IsDeleted);
            modelBuilder.Entity<SymbolVariant>().HasQueryFilter(sv => !sv.IsDeleted);

            // Set delete behavior
            foreach (var relationship in modelBuilder.Model.GetEntityTypes()
                .SelectMany(e => e.GetForeignKeys()))
            {
                relationship.DeleteBehavior = DeleteBehavior.Restrict;
            }
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            UpdateAuditableEntities();
            await CreateAuditLogs();
            return await base.SaveChangesAsync(cancellationToken);
        }

        private void UpdateAuditableEntities()
        {
            var entries = ChangeTracker.Entries<BaseEntity>()
                .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified);

            foreach (var entry in entries)
            {
                if (entry.State == EntityState.Added)
                {
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                }

                if (entry.State == EntityState.Modified)
                {
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                }
            }
        }

        private async Task CreateAuditLogs()
        {
            var auditableEntities = ChangeTracker.Entries<BaseEntity>()
                .Where(e => e.State != EntityState.Detached && e.State != EntityState.Unchanged)
                .ToList();

            foreach (var entry in auditableEntities)
            {
                var auditLog = new AuditLog
                {
                    EntityType = entry.Entity.GetType().Name,
                    EntityId = entry.Entity.Id,
                    Action = entry.State.ToString(),
                    CreatedAt = DateTime.UtcNow
                };

                if (entry.State == EntityState.Modified)
                {
                    auditLog.Changes = GetChanges(entry);
                }

                await AuditLogs.AddAsync(auditLog);
            }
        }

        private Dictionary<string, object> GetChanges(EntityEntry entry)
        {
            var changes = new Dictionary<string, object>();

            foreach (var property in entry.Properties.Where(p => p.IsModified))
            {
                changes[property.Metadata.Name] = new
                {
                    OldValue = property.OriginalValue,
                    NewValue = property.CurrentValue
                };
            }

            return changes;
        }
    }
}