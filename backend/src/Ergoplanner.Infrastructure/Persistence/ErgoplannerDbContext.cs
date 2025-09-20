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

        // BoQ entities
        public DbSet<BoQ> BoQs { get; set; } = null!;
        public DbSet<BoQSection> BoQSections { get; set; } = null!;
        public DbSet<BoQItem> BoQItems { get; set; } = null!;
        public DbSet<BoQTemplate> BoQTemplates { get; set; } = null!;
        public DbSet<BoQTemplateSection> BoQTemplateSections { get; set; } = null!;
        public DbSet<BoQTemplateItem> BoQTemplateItems { get; set; } = null!;
        public DbSet<BoQRevision> BoQRevisions { get; set; } = null!;
        public DbSet<BoQRevisionItem> BoQRevisionItems { get; set; } = null!;
        public DbSet<BoQApproval> BoQApprovals { get; set; } = null!;
        public DbSet<BoQApprovalComment> BoQApprovalComments { get; set; } = null!;
        public DbSet<BoQApprovalAttachment> BoQApprovalAttachments { get; set; } = null!;
        public DbSet<BoQChangeRequest> BoQChangeRequests { get; set; } = null!;
        public DbSet<BoQChangeRequestItem> BoQChangeRequestItems { get; set; } = null!;
        public DbSet<BoQChangeRequestApproval> BoQChangeRequestApprovals { get; set; } = null!;
        public DbSet<BoQChangeRequestComment> BoQChangeRequestComments { get; set; } = null!;
        public DbSet<BoQChangeRequestAttachment> BoQChangeRequestAttachments { get; set; } = null!;
        public DbSet<BoQExport> BoQExports { get; set; } = null!;
        public DbSet<BoQExportDownload> BoQExportDownloads { get; set; } = null!;
        public DbSet<BoQSnapshot> BoQSnapshots { get; set; } = null!;
        public DbSet<BoQItemPricing> BoQItemPricing { get; set; } = null!;
        public DbSet<BoQTemplateFeedback> BoQTemplateFeedback { get; set; } = null!;

        // Material entities
        public DbSet<Material> Materials { get; set; } = null!;
        public DbSet<MaterialCategory> MaterialCategories { get; set; } = null!;
        public DbSet<MaterialSpecification> MaterialSpecifications { get; set; } = null!;
        public DbSet<MaterialSupplier> MaterialSuppliers { get; set; } = null!;
        public DbSet<MaterialPricing> MaterialPricing { get; set; } = null!;
        public DbSet<MaterialEquivalent> MaterialEquivalents { get; set; } = null!;

        // Supplier entities
        public DbSet<Supplier> Suppliers { get; set; } = null!;
        public DbSet<SupplierContact> SupplierContacts { get; set; } = null!;
        public DbSet<SupplierDocument> SupplierDocuments { get; set; } = null!;
        public DbSet<SupplierEvaluation> SupplierEvaluations { get; set; } = null!;

        // Finance entities
        public DbSet<CostCenter> CostCenters { get; set; } = null!;
        public DbSet<CostBreakdown> CostBreakdowns { get; set; } = null!;
        public DbSet<CostBreakdownItem> CostBreakdownItems { get; set; } = null!;
        public DbSet<PricingRule> PricingRules { get; set; } = null!;
        public DbSet<PricingRuleApplication> PricingRuleApplications { get; set; } = null!;
        public DbSet<CurrencyRate> CurrencyRates { get; set; } = null!;
        public DbSet<CurrencyConversion> CurrencyConversions { get; set; } = null!;

        // Integration entities
        public DbSet<ERPIntegration> ERPIntegrations { get; set; } = null!;
        public DbSet<ERPSyncLog> ERPSyncLogs { get; set; } = null!;
        public DbSet<ERPDataMapping> ERPDataMappings { get; set; } = null!;
        public DbSet<ReportTemplate> ReportTemplates { get; set; } = null!;
        public DbSet<ReportTemplateFeedback> ReportTemplateFeedback { get; set; } = null!;

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

            // BoQ configurations
            modelBuilder.ApplyConfiguration(new BoQConfiguration());
            modelBuilder.ApplyConfiguration(new BoQSectionConfiguration());
            modelBuilder.ApplyConfiguration(new BoQItemConfiguration());
            modelBuilder.ApplyConfiguration(new BoQTemplateConfiguration());
            modelBuilder.ApplyConfiguration(new BoQApprovalConfiguration());

            // Material configurations
            modelBuilder.ApplyConfiguration(new MaterialConfiguration());
            modelBuilder.ApplyConfiguration(new MaterialCategoryConfiguration());
            modelBuilder.ApplyConfiguration(new MaterialSpecificationConfiguration());
            modelBuilder.ApplyConfiguration(new MaterialSupplierConfiguration());

            // Finance configurations
            modelBuilder.ApplyConfiguration(new CostCenterConfiguration());
            modelBuilder.ApplyConfiguration(new PricingRuleConfiguration());

            // Supplier configurations
            modelBuilder.ApplyConfiguration(new SupplierConfiguration());

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

            // BoQ soft delete filters
            modelBuilder.Entity<BoQ>().HasQueryFilter(b => !b.IsDeleted);
            modelBuilder.Entity<BoQSection>().HasQueryFilter(s => !s.IsDeleted);
            modelBuilder.Entity<BoQItem>().HasQueryFilter(i => !i.IsDeleted);
            modelBuilder.Entity<BoQTemplate>().HasQueryFilter(t => !t.IsDeleted);
            modelBuilder.Entity<BoQChangeRequest>().HasQueryFilter(c => !c.IsDeleted);

            // Material soft delete filters
            modelBuilder.Entity<Material>().HasQueryFilter(m => !m.IsDeleted);
            modelBuilder.Entity<MaterialCategory>().HasQueryFilter(c => !c.IsDeleted);

            // Supplier soft delete filters
            modelBuilder.Entity<Supplier>().HasQueryFilter(s => !s.IsDeleted);

            // Finance soft delete filters
            modelBuilder.Entity<CostCenter>().HasQueryFilter(c => !c.IsDeleted);
            modelBuilder.Entity<PricingRule>().HasQueryFilter(r => !r.IsDeleted);

            // Integration soft delete filters
            modelBuilder.Entity<ERPIntegration>().HasQueryFilter(e => !e.IsDeleted);
            modelBuilder.Entity<ReportTemplate>().HasQueryFilter(r => !r.IsDeleted);

            // Symbol soft delete filters
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