using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Ergoplanner.Domain.Entities;

namespace Ergoplanner.Infrastructure.Persistence.Configurations
{
    public class ProjectConfiguration : IEntityTypeConfiguration<Project>
    {
        public void Configure(EntityTypeBuilder<Project> builder)
        {
            builder.ToTable("projects", "core");

            builder.HasKey(p => p.Id);

            builder.Property(p => p.Name)
                .IsRequired()
                .HasMaxLength(255);

            builder.Property(p => p.Code)
                .IsRequired()
                .HasMaxLength(100);

            builder.HasIndex(p => new { p.OrganizationId, p.Code })
                .IsUnique();

            builder.Property(p => p.Description)
                .HasColumnType("text");

            builder.Property(p => p.ProjectType)
                .HasMaxLength(50);

            builder.Property(p => p.Status)
                .IsRequired()
                .HasConversion<string>()
                .HasMaxLength(50)
                .HasDefaultValue("planning");

            builder.Property(p => p.Budget)
                .HasPrecision(15, 2);

            builder.Property(p => p.Currency)
                .HasMaxLength(3)
                .HasDefaultValue("USD");

            builder.Property(p => p.ClientName)
                .HasMaxLength(255);

            builder.Property(p => p.ClientContact)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'{}'::jsonb");

            builder.Property(p => p.Metadata)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'{}'::jsonb");

            builder.Property(p => p.Tags)
                .HasColumnType("text[]")
                .HasDefaultValueSql("ARRAY[]::text[]");

            builder.Property(p => p.IsArchived)
                .HasDefaultValue(false);

            builder.Property(p => p.IsDeleted)
                .HasDefaultValue(false);

            // Indexes
            builder.HasIndex(p => p.OrganizationId);
            builder.HasIndex(p => p.Status);
            builder.HasIndex(p => new { p.OrganizationId, p.Status });

            // Relationships
            builder.HasOne(p => p.Organization)
                .WithMany(o => o.Projects)
                .HasForeignKey(p => p.OrganizationId);

            builder.HasOne(p => p.CreatedByUser)
                .WithMany()
                .HasForeignKey(p => p.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(p => p.UpdatedByUser)
                .WithMany()
                .HasForeignKey(p => p.UpdatedBy)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasMany(p => p.Teams)
                .WithOne(t => t.Project)
                .HasForeignKey(t => t.ProjectId);

            builder.HasMany(p => p.Drawings)
                .WithOne(d => d.Project)
                .HasForeignKey(d => d.ProjectId);

            builder.HasMany(p => p.BoQItems)
                .WithOne(b => b.Project)
                .HasForeignKey(b => b.ProjectId);
        }
    }
}