using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Ergoplanner.Domain.Entities;
using Ergoplanner.Domain.Enums;

namespace Ergoplanner.Infrastructure.Persistence.Configurations
{
    public class SymbolSpecificationConfiguration : IEntityTypeConfiguration<SymbolSpecification>
    {
        public void Configure(EntityTypeBuilder<SymbolSpecification> builder)
        {
            builder.ToTable("symbol_specifications", "symbol");
            builder.HasKey(s => s.Id);

            builder.Property(s => s.Name).IsRequired().HasMaxLength(255);
            builder.Property(s => s.Code).IsRequired().HasMaxLength(100);
            builder.Property(s => s.Description).HasMaxLength(1000);
            builder.Property(s => s.SpecificationType).IsRequired().HasMaxLength(100);
            builder.Property(s => s.Value).IsRequired().HasMaxLength(500);
            builder.Property(s => s.Unit).HasMaxLength(50);
            builder.Property(s => s.Tolerance).HasMaxLength(100);
            builder.Property(s => s.TestMethod).HasMaxLength(255);
            builder.Property(s => s.ReferenceStandard).HasMaxLength(255);
            builder.Property(s => s.Manufacturer).HasMaxLength(255);
            builder.Property(s => s.Model).HasMaxLength(255);
            builder.Property(s => s.PartNumber).HasMaxLength(255);
            builder.Property(s => s.Material).HasMaxLength(255);
            builder.Property(s => s.Coating).HasMaxLength(255);
            builder.Property(s => s.CertificationRequired).HasMaxLength(255);

            // JSON columns
            builder.Property(s => s.Metadata).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb");

            // Precision for decimals
            builder.Property(s => s.NumericValue).HasPrecision(18, 6);
            builder.Property(s => s.MinValue).HasPrecision(18, 6);
            builder.Property(s => s.MaxValue).HasPrecision(18, 6);

            // Indexes
            builder.HasIndex(s => s.OrganizationId);
            builder.HasIndex(s => s.SymbolId);
            builder.HasIndex(s => new { s.SymbolId, s.Code }).IsUnique();
            builder.HasIndex(s => s.SpecificationType);
            builder.HasIndex(s => s.SortOrder);

            // Relationships
            builder.HasOne(s => s.Organization)
                .WithMany()
                .HasForeignKey(s => s.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(s => s.Symbol)
                .WithMany(sym => sym.Specifications)
                .HasForeignKey(s => s.SymbolId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(s => s.CreatedByUser)
                .WithMany()
                .HasForeignKey(s => s.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }

    public class SymbolStandardConfiguration : IEntityTypeConfiguration<SymbolStandard>
    {
        public void Configure(EntityTypeBuilder<SymbolStandard> builder)
        {
            builder.ToTable("symbol_standards", "symbol");
            builder.HasKey(s => s.Id);

            builder.Property(s => s.StandardCode).IsRequired().HasMaxLength(100);
            builder.Property(s => s.StandardName).HasMaxLength(255);
            builder.Property(s => s.Version).HasMaxLength(50);
            builder.Property(s => s.Section).HasMaxLength(100);
            builder.Property(s => s.Description).HasMaxLength(1000);
            builder.Property(s => s.ComplianceLevel).HasMaxLength(100);
            builder.Property(s => s.CertificationBody).HasMaxLength(255);
            builder.Property(s => s.CertificateNumber).HasMaxLength(255);

            // Enums
            builder.Property(s => s.Standard).HasConversion<string>();

            // JSON columns
            builder.Property(s => s.Metadata).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb");

            // Indexes
            builder.HasIndex(s => s.OrganizationId);
            builder.HasIndex(s => s.SymbolId);
            builder.HasIndex(s => new { s.SymbolId, s.Standard }).IsUnique();
            builder.HasIndex(s => s.Standard);
            builder.HasIndex(s => s.StandardCode);

            // Relationships
            builder.HasOne(s => s.Organization)
                .WithMany()
                .HasForeignKey(s => s.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(s => s.Symbol)
                .WithMany(sym => sym.Standards)
                .HasForeignKey(s => s.SymbolId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(s => s.CreatedByUser)
                .WithMany()
                .HasForeignKey(s => s.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }

    public class SymbolUsageConfiguration : IEntityTypeConfiguration<SymbolUsage>
    {
        public void Configure(EntityTypeBuilder<SymbolUsage> builder)
        {
            builder.ToTable("symbol_usage", "symbol");
            builder.HasKey(u => u.Id);

            builder.Property(u => u.UsageType).IsRequired().HasMaxLength(50);
            builder.Property(u => u.Context).HasMaxLength(100);
            builder.Property(u => u.UserAgent).HasMaxLength(500);
            builder.Property(u => u.IpAddress).HasColumnType("inet");
            builder.Property(u => u.SessionId).HasMaxLength(255);

            // JSON columns
            builder.Property(u => u.Metadata).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb");

            // Indexes
            builder.HasIndex(u => u.OrganizationId);
            builder.HasIndex(u => u.SymbolId);
            builder.HasIndex(u => u.UserId);
            builder.HasIndex(u => u.ProjectId);
            builder.HasIndex(u => u.DrawingId);
            builder.HasIndex(u => u.ComponentId);
            builder.HasIndex(u => u.UsedAt);
            builder.HasIndex(u => new { u.SymbolId, u.UsedAt });
            builder.HasIndex(u => new { u.UserId, u.UsedAt });

            // Relationships
            builder.HasOne(u => u.Organization)
                .WithMany()
                .HasForeignKey(u => u.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(u => u.Symbol)
                .WithMany(s => s.UsageHistory)
                .HasForeignKey(u => u.SymbolId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(u => u.User)
                .WithMany()
                .HasForeignKey(u => u.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(u => u.Project)
                .WithMany()
                .HasForeignKey(u => u.ProjectId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(u => u.Drawing)
                .WithMany()
                .HasForeignKey(u => u.DrawingId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(u => u.Component)
                .WithMany()
                .HasForeignKey(u => u.ComponentId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }

    public class SymbolFavoriteConfiguration : IEntityTypeConfiguration<SymbolFavorite>
    {
        public void Configure(EntityTypeBuilder<SymbolFavorite> builder)
        {
            builder.ToTable("symbol_favorites", "symbol");
            builder.HasKey(f => f.Id);

            builder.Property(f => f.Notes).HasMaxLength(1000);

            // JSON columns
            builder.Property(f => f.Tags).HasColumnType("text[]").HasDefaultValueSql("ARRAY[]::text[]");
            builder.Property(f => f.Metadata).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb");

            // Indexes
            builder.HasIndex(f => f.OrganizationId);
            builder.HasIndex(f => f.SymbolId);
            builder.HasIndex(f => f.UserId);
            builder.HasIndex(f => new { f.UserId, f.SymbolId }).IsUnique();
            builder.HasIndex(f => new { f.UserId, f.SortOrder });

            // Relationships
            builder.HasOne(f => f.Organization)
                .WithMany()
                .HasForeignKey(f => f.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(f => f.Symbol)
                .WithMany(s => s.FavoritedBy)
                .HasForeignKey(f => f.SymbolId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(f => f.User)
                .WithMany()
                .HasForeignKey(f => f.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public class SymbolFeedbackConfiguration : IEntityTypeConfiguration<SymbolFeedback>
    {
        public void Configure(EntityTypeBuilder<SymbolFeedback> builder)
        {
            builder.ToTable("symbol_feedback", "symbol");
            builder.HasKey(f => f.Id);

            builder.Property(f => f.Title).HasMaxLength(255);
            builder.Property(f => f.Comment).HasColumnType("text");
            builder.Property(f => f.ResolutionNotes).HasColumnType("text");

            // Enums
            builder.Property(f => f.FeedbackType).HasConversion<string>();

            // JSON columns
            builder.Property(f => f.Tags).HasColumnType("text[]").HasDefaultValueSql("ARRAY[]::text[]");
            builder.Property(f => f.Metadata).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb");

            // Constraints
            builder.HasCheckConstraint("CHK_SymbolFeedback_Rating", "rating IS NULL OR (rating >= 1 AND rating <= 5)");

            // Indexes
            builder.HasIndex(f => f.OrganizationId);
            builder.HasIndex(f => f.SymbolId);
            builder.HasIndex(f => f.UserId);
            builder.HasIndex(f => f.FeedbackType);
            builder.HasIndex(f => f.Rating);
            builder.HasIndex(f => f.IsResolved);
            builder.HasIndex(f => f.CreatedAt);

            // Relationships
            builder.HasOne(f => f.Organization)
                .WithMany()
                .HasForeignKey(f => f.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(f => f.Symbol)
                .WithMany(s => s.Feedback)
                .HasForeignKey(f => f.SymbolId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(f => f.User)
                .WithMany()
                .HasForeignKey(f => f.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(f => f.ResolvedByUser)
                .WithMany()
                .HasForeignKey(f => f.ResolvedBy)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }

    public class SymbolVariantConfiguration : IEntityTypeConfiguration<SymbolVariant>
    {
        public void Configure(EntityTypeBuilder<SymbolVariant> builder)
        {
            builder.ToTable("symbol_variants", "symbol");
            builder.HasKey(v => v.Id);

            builder.Property(v => v.Name).IsRequired().HasMaxLength(255);
            builder.Property(v => v.Description).HasMaxLength(1000);

            // Enums
            builder.Property(v => v.VariantType).HasConversion<string>();

            // JSON columns
            builder.Property(v => v.VariantProperties).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb");
            builder.Property(v => v.Metadata).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb");

            // Indexes
            builder.HasIndex(v => v.OrganizationId);
            builder.HasIndex(v => v.ParentSymbolId);
            builder.HasIndex(v => v.VariantSymbolId);
            builder.HasIndex(v => new { v.ParentSymbolId, v.VariantSymbolId }).IsUnique();
            builder.HasIndex(v => v.VariantType);
            builder.HasIndex(v => v.SortOrder);
            builder.HasIndex(v => v.IsDeleted);

            // Relationships
            builder.HasOne(v => v.Organization)
                .WithMany()
                .HasForeignKey(v => v.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(v => v.ParentSymbol)
                .WithMany(s => s.Variants)
                .HasForeignKey(v => v.ParentSymbolId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(v => v.VariantSymbol)
                .WithMany()
                .HasForeignKey(v => v.VariantSymbolId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(v => v.CreatedByUser)
                .WithMany()
                .HasForeignKey(v => v.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(v => v.DeletedByUser)
                .WithMany()
                .HasForeignKey(v => v.DeletedBy)
                .OnDelete(DeleteBehavior.SetNull);

            // Query filters for soft delete
            builder.HasQueryFilter(v => !v.IsDeleted);
        }
    }

    public class SymbolApprovalConfiguration : IEntityTypeConfiguration<SymbolApproval>
    {
        public void Configure(EntityTypeBuilder<SymbolApproval> builder)
        {
            builder.ToTable("symbol_approvals", "symbol");
            builder.HasKey(a => a.Id);

            builder.Property(a => a.Comments).HasColumnType("text");
            builder.Property(a => a.ApprovalStage).IsRequired().HasMaxLength(100);
            builder.Property(a => a.RequiredRole).HasMaxLength(100);

            // Enums
            builder.Property(a => a.Decision).HasConversion<string>();

            // JSON columns
            builder.Property(a => a.Metadata).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb");

            // Indexes
            builder.HasIndex(a => a.OrganizationId);
            builder.HasIndex(a => a.SymbolId);
            builder.HasIndex(a => a.VersionId);
            builder.HasIndex(a => a.ApproverId);
            builder.HasIndex(a => new { a.SymbolId, a.StageOrder }).IsUnique();
            builder.HasIndex(a => a.Decision);
            builder.HasIndex(a => a.DecisionDate);
            builder.HasIndex(a => a.DueDate);

            // Relationships
            builder.HasOne(a => a.Organization)
                .WithMany()
                .HasForeignKey(a => a.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(a => a.Symbol)
                .WithMany(s => s.Approvals)
                .HasForeignKey(a => a.SymbolId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(a => a.Version)
                .WithMany(v => v.Approvals)
                .HasForeignKey(a => a.VersionId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(a => a.Approver)
                .WithMany()
                .HasForeignKey(a => a.ApproverId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(a => a.CreatedByUser)
                .WithMany()
                .HasForeignKey(a => a.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }

    public class SymbolChangeLogConfiguration : IEntityTypeConfiguration<SymbolChangeLog>
    {
        public void Configure(EntityTypeBuilder<SymbolChangeLog> builder)
        {
            builder.ToTable("symbol_change_logs", "symbol");
            builder.HasKey(c => c.Id);

            builder.Property(c => c.PropertyName).HasMaxLength(255);
            builder.Property(c => c.OldValue).HasColumnType("text");
            builder.Property(c => c.NewValue).HasColumnType("text");
            builder.Property(c => c.ChangeDescription).HasColumnType("text");
            builder.Property(c => c.Reason).HasMaxLength(1000);
            builder.Property(c => c.IpAddress).HasColumnType("inet");
            builder.Property(c => c.UserAgent).HasMaxLength(500);
            builder.Property(c => c.SessionId).HasMaxLength(255);

            // Enums
            builder.Property(c => c.ChangeType).HasConversion<string>();

            // JSON columns
            builder.Property(c => c.Metadata).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb");

            // Indexes
            builder.HasIndex(c => c.OrganizationId);
            builder.HasIndex(c => c.SymbolId);
            builder.HasIndex(c => c.VersionId);
            builder.HasIndex(c => c.ChangeType);
            builder.HasIndex(c => c.CreatedAt);
            builder.HasIndex(c => new { c.SymbolId, c.CreatedAt });

            // Relationships
            builder.HasOne(c => c.Organization)
                .WithMany()
                .HasForeignKey(c => c.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(c => c.Symbol)
                .WithMany(s => s.ChangeLogs)
                .HasForeignKey(c => c.SymbolId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(c => c.Version)
                .WithMany(v => v.ChangeLogs)
                .HasForeignKey(c => c.VersionId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(c => c.CreatedByUser)
                .WithMany()
                .HasForeignKey(c => c.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}