using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Ergoplanner.Domain.Entities;
using Ergoplanner.Domain.Enums;
using System.Text.Json;

namespace Ergoplanner.Infrastructure.Persistence.Configurations
{
    public class SymbolConfiguration : IEntityTypeConfiguration<Symbol>
    {
        public void Configure(EntityTypeBuilder<Symbol> builder)
        {
            builder.ToTable("symbols", "symbol");
            builder.HasKey(s => s.Id);

            // Basic properties
            builder.Property(s => s.Name).IsRequired().HasMaxLength(255);
            builder.Property(s => s.Code).IsRequired().HasMaxLength(100);
            builder.Property(s => s.Description).HasMaxLength(1000);
            builder.Property(s => s.SvgContent).IsRequired().HasColumnType("text");
            builder.Property(s => s.ThumbnailUrl).HasMaxLength(500);
            builder.Property(s => s.VersionNotes).HasMaxLength(1000);
            builder.Property(s => s.ApprovalNotes).HasMaxLength(1000);

            // Enums
            builder.Property(s => s.SymbolType).HasConversion<string>();
            builder.Property(s => s.Status).HasConversion<string>();
            builder.Property(s => s.AccessLevel).HasConversion<string>();

            // JSON columns
            builder.Property(s => s.Properties).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb");
            builder.Property(s => s.Metadata).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb");
            builder.Property(s => s.Tags).HasColumnType("text[]").HasDefaultValueSql("ARRAY[]::text[]");

            // Indexes
            builder.HasIndex(s => s.OrganizationId);
            builder.HasIndex(s => s.CategoryId);
            builder.HasIndex(s => s.TemplateId);
            builder.HasIndex(s => new { s.OrganizationId, s.Code }).IsUnique();
            builder.HasIndex(s => new { s.OrganizationId, s.SymbolType });
            builder.HasIndex(s => new { s.OrganizationId, s.Status });
            builder.HasIndex(s => s.CreatedAt);
            builder.HasIndex(s => s.UsageCount);
            builder.HasIndex(s => s.Rating);
            builder.HasIndex(s => s.IsDeleted);

            // Relationships
            builder.HasOne(s => s.Organization)
                .WithMany()
                .HasForeignKey(s => s.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(s => s.Category)
                .WithMany(c => c.Symbols)
                .HasForeignKey(s => s.CategoryId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(s => s.Template)
                .WithMany(t => t.Symbols)
                .HasForeignKey(s => s.TemplateId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(s => s.CreatedByUser)
                .WithMany()
                .HasForeignKey(s => s.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(s => s.ApprovedByUser)
                .WithMany()
                .HasForeignKey(s => s.ApprovedBy)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(s => s.DeletedByUser)
                .WithMany()
                .HasForeignKey(s => s.DeletedBy)
                .OnDelete(DeleteBehavior.SetNull);

            // Query filters for soft delete
            builder.HasQueryFilter(s => !s.IsDeleted);
        }
    }

    public class SymbolCategoryConfiguration : IEntityTypeConfiguration<SymbolCategory>
    {
        public void Configure(EntityTypeBuilder<SymbolCategory> builder)
        {
            builder.ToTable("symbol_categories", "symbol");
            builder.HasKey(c => c.Id);

            builder.Property(c => c.Name).IsRequired().HasMaxLength(255);
            builder.Property(c => c.Code).IsRequired().HasMaxLength(100);
            builder.Property(c => c.Description).HasMaxLength(1000);
            builder.Property(c => c.IconSvg).HasColumnType("text");
            builder.Property(c => c.Color).HasMaxLength(7); // #RRGGBB
            builder.Property(c => c.Path).IsRequired().HasMaxLength(1000);
            builder.Property(c => c.Metadata).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb");

            // Indexes
            builder.HasIndex(c => c.OrganizationId);
            builder.HasIndex(c => c.ParentCategoryId);
            builder.HasIndex(c => new { c.OrganizationId, c.Code }).IsUnique();
            builder.HasIndex(c => new { c.OrganizationId, c.Level });
            builder.HasIndex(c => c.Path);
            builder.HasIndex(c => c.SortOrder);
            builder.HasIndex(c => c.IsDeleted);

            // Relationships
            builder.HasOne(c => c.Organization)
                .WithMany()
                .HasForeignKey(c => c.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(c => c.ParentCategory)
                .WithMany(c => c.SubCategories)
                .HasForeignKey(c => c.ParentCategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(c => c.CreatedByUser)
                .WithMany()
                .HasForeignKey(c => c.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(c => c.DeletedByUser)
                .WithMany()
                .HasForeignKey(c => c.DeletedBy)
                .OnDelete(DeleteBehavior.SetNull);

            // Query filters for soft delete
            builder.HasQueryFilter(c => !c.IsDeleted);
        }
    }

    public class SymbolTemplateConfiguration : IEntityTypeConfiguration<SymbolTemplate>
    {
        public void Configure(EntityTypeBuilder<SymbolTemplate> builder)
        {
            builder.ToTable("symbol_templates", "symbol");
            builder.HasKey(t => t.Id);

            builder.Property(t => t.Name).IsRequired().HasMaxLength(255);
            builder.Property(t => t.Code).IsRequired().HasMaxLength(100);
            builder.Property(t => t.Description).HasMaxLength(1000);
            builder.Property(t => t.BaseSvgContent).IsRequired().HasColumnType("text");
            builder.Property(t => t.ThumbnailUrl).HasMaxLength(500);

            // Enums
            builder.Property(t => t.SymbolType).HasConversion<string>();
            builder.Property(t => t.AccessLevel).HasConversion<string>();

            // JSON columns
            builder.Property(t => t.DefaultProperties).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb");
            builder.Property(t => t.Metadata).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb");
            builder.Property(t => t.Tags).HasColumnType("text[]").HasDefaultValueSql("ARRAY[]::text[]");

            // Indexes
            builder.HasIndex(t => t.OrganizationId);
            builder.HasIndex(t => t.CategoryId);
            builder.HasIndex(t => new { t.OrganizationId, t.Code }).IsUnique();
            builder.HasIndex(t => new { t.OrganizationId, t.SymbolType });
            builder.HasIndex(t => t.UsageCount);
            builder.HasIndex(t => t.Rating);
            builder.HasIndex(t => t.IsDeleted);

            // Relationships
            builder.HasOne(t => t.Organization)
                .WithMany()
                .HasForeignKey(t => t.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(t => t.Category)
                .WithMany()
                .HasForeignKey(t => t.CategoryId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(t => t.CreatedByUser)
                .WithMany()
                .HasForeignKey(t => t.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(t => t.DeletedByUser)
                .WithMany()
                .HasForeignKey(t => t.DeletedBy)
                .OnDelete(DeleteBehavior.SetNull);

            // Query filters for soft delete
            builder.HasQueryFilter(t => !t.IsDeleted);
        }
    }

    public class SymbolVersionConfiguration : IEntityTypeConfiguration<SymbolVersion>
    {
        public void Configure(EntityTypeBuilder<SymbolVersion> builder)
        {
            builder.ToTable("symbol_versions", "symbol");
            builder.HasKey(v => v.Id);

            builder.Property(v => v.VersionLabel).HasMaxLength(50);
            builder.Property(v => v.ChangeDescription).HasMaxLength(2000);
            builder.Property(v => v.SvgContent).IsRequired().HasColumnType("text");
            builder.Property(v => v.ThumbnailUrl).HasMaxLength(500);
            builder.Property(v => v.ChecksumSha256).HasMaxLength(64);
            builder.Property(v => v.ApprovalNotes).HasMaxLength(1000);

            // Enums
            builder.Property(v => v.Status).HasConversion<string>();

            // JSON columns
            builder.Property(v => v.Properties).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb");
            builder.Property(v => v.Metadata).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb");
            builder.Property(v => v.Tags).HasColumnType("text[]").HasDefaultValueSql("ARRAY[]::text[]");

            // Indexes
            builder.HasIndex(v => v.OrganizationId);
            builder.HasIndex(v => v.SymbolId);
            builder.HasIndex(v => new { v.SymbolId, v.VersionNumber }).IsUnique();
            builder.HasIndex(v => new { v.SymbolId, v.IsCurrentVersion });
            builder.HasIndex(v => v.ChecksumSha256);
            builder.HasIndex(v => v.CreatedAt);

            // Relationships
            builder.HasOne(v => v.Organization)
                .WithMany()
                .HasForeignKey(v => v.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(v => v.Symbol)
                .WithMany(s => s.Versions)
                .HasForeignKey(v => v.SymbolId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(v => v.CreatedByUser)
                .WithMany()
                .HasForeignKey(v => v.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(v => v.ApprovedByUser)
                .WithMany()
                .HasForeignKey(v => v.ApprovedBy)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }

    public class SymbolPropertyConfiguration : IEntityTypeConfiguration<SymbolProperty>
    {
        public void Configure(EntityTypeBuilder<SymbolProperty> builder)
        {
            builder.ToTable("symbol_properties", "symbol");
            builder.HasKey(p => p.Id);

            builder.Property(p => p.Name).IsRequired().HasMaxLength(255);
            builder.Property(p => p.Code).IsRequired().HasMaxLength(100);
            builder.Property(p => p.Description).HasMaxLength(1000);
            builder.Property(p => p.DefaultValue).HasMaxLength(500);
            builder.Property(p => p.Unit).HasMaxLength(50);
            builder.Property(p => p.ValidationPattern).HasMaxLength(500);
            builder.Property(p => p.CalculationFormula).HasMaxLength(1000);
            builder.Property(p => p.Category).HasMaxLength(100);

            // Enums
            builder.Property(p => p.DataType).HasConversion<string>();

            // JSON columns
            builder.Property(p => p.AllowedValues).HasColumnType("text[]").HasDefaultValueSql("ARRAY[]::text[]");
            builder.Property(p => p.Metadata).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb");

            // Indexes
            builder.HasIndex(p => p.OrganizationId);
            builder.HasIndex(p => p.SymbolId);
            builder.HasIndex(p => p.TemplateId);
            builder.HasIndex(p => new { p.SymbolId, p.Code }).IsUnique().HasFilter("symbol_id IS NOT NULL");
            builder.HasIndex(p => new { p.TemplateId, p.Code }).IsUnique().HasFilter("template_id IS NOT NULL");
            builder.HasIndex(p => p.SortOrder);

            // Relationships
            builder.HasOne(p => p.Organization)
                .WithMany()
                .HasForeignKey(p => p.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(p => p.Symbol)
                .WithMany(s => s.SymbolProperties)
                .HasForeignKey(p => p.SymbolId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(p => p.Template)
                .WithMany(t => t.TemplateProperties)
                .HasForeignKey(p => p.TemplateId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(p => p.CreatedByUser)
                .WithMany()
                .HasForeignKey(p => p.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}