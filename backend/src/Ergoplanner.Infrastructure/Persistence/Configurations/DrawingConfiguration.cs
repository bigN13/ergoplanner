using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Ergoplanner.Domain.Entities;

namespace Ergoplanner.Infrastructure.Persistence.Configurations
{
    public class DrawingConfiguration : IEntityTypeConfiguration<Drawing>
    {
        public void Configure(EntityTypeBuilder<Drawing> builder)
        {
            builder.ToTable("drawings", "drawing");

            builder.HasKey(d => d.Id);

            builder.Property(d => d.Name)
                .IsRequired()
                .HasMaxLength(255);

            builder.Property(d => d.DrawingNumber)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(d => d.Revision)
                .HasMaxLength(20)
                .HasDefaultValue("A");

            builder.HasIndex(d => new { d.ProjectId, d.DrawingNumber, d.Revision })
                .IsUnique();

            builder.Property(d => d.DrawingType)
                .IsRequired()
                .HasConversion<string>()
                .HasMaxLength(50);

            builder.Property(d => d.Status)
                .IsRequired()
                .HasConversion<string>()
                .HasMaxLength(50)
                .HasDefaultValue("draft");

            builder.Property(d => d.Scale)
                .HasMaxLength(20);

            builder.Property(d => d.PaperSize)
                .HasMaxLength(20)
                .HasDefaultValue("A1");

            builder.Property(d => d.Orientation)
                .HasMaxLength(20)
                .HasDefaultValue("landscape");

            builder.Property(d => d.DrawingData)
                .IsRequired()
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'{}'::jsonb");

            builder.Property(d => d.ThumbnailUrl)
                .HasColumnType("text");

            builder.Property(d => d.Tags)
                .HasColumnType("text[]")
                .HasDefaultValueSql("ARRAY[]::text[]");

            builder.Property(d => d.Metadata)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'{}'::jsonb");

            builder.Property(d => d.IsTemplate)
                .HasDefaultValue(false);

            // Indexes
            builder.HasIndex(d => d.ProjectId);
            builder.HasIndex(d => d.Status);
            builder.HasIndex(d => d.DrawingType);
            builder.HasIndex(d => new { d.ProjectId, d.Status });

            // Relationships
            builder.HasOne(d => d.Project)
                .WithMany(p => p.Drawings)
                .HasForeignKey(d => d.ProjectId);

            builder.HasOne(d => d.ParentDrawing)
                .WithMany(d => d.ChildDrawings)
                .HasForeignKey(d => d.ParentDrawingId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(d => d.CreatedByUser)
                .WithMany(u => u.CreatedDrawings)
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(d => d.UpdatedByUser)
                .WithMany(u => u.UpdatedDrawings)
                .HasForeignKey(d => d.UpdatedBy)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(d => d.LockedByUser)
                .WithMany()
                .HasForeignKey(d => d.LockedBy)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasMany(d => d.Components)
                .WithOne(c => c.Drawing)
                .HasForeignKey(c => c.DrawingId);

            builder.HasMany(d => d.Versions)
                .WithOne(v => v.Drawing)
                .HasForeignKey(v => v.DrawingId);

            builder.HasMany(d => d.ApprovalWorkflows)
                .WithOne(a => a.Drawing)
                .HasForeignKey(a => a.DrawingId);

            builder.HasMany(d => d.Comments)
                .WithOne(c => c.Drawing)
                .HasForeignKey(c => c.DrawingId);

            builder.HasMany(d => d.BoQItems)
                .WithOne(b => b.Drawing)
                .HasForeignKey(b => b.DrawingId);
        }
    }
}