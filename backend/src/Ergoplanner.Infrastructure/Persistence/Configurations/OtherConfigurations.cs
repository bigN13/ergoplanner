using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Ergoplanner.Domain.Entities;
using System.Text.Json;

namespace Ergoplanner.Infrastructure.Persistence.Configurations
{
    public class SymbolConfiguration : IEntityTypeConfiguration<Symbol>
    {
        public void Configure(EntityTypeBuilder<Symbol> builder)
        {
            builder.ToTable("symbols", "drawing");
            builder.HasKey(s => s.Id);
            builder.Property(s => s.Name).IsRequired().HasMaxLength(255);
            builder.Property(s => s.Code).IsRequired().HasMaxLength(100);
            builder.HasIndex(s => s.Code).IsUnique();
            builder.Property(s => s.Category).HasMaxLength(100);
            builder.Property(s => s.Subcategory).HasMaxLength(100);
            builder.Property(s => s.Standard).HasMaxLength(50);
            builder.Property(s => s.SvgContent).IsRequired().HasColumnType("text");
            builder.Property(s => s.Properties).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb");
            builder.Property(s => s.Tags).HasColumnType("text[]").HasDefaultValueSql("ARRAY[]::text[]");
            builder.HasIndex(s => new { s.Category, s.Subcategory });
            builder.HasIndex(s => s.Standard);
        }
    }

    public class ComponentConfiguration : IEntityTypeConfiguration<Component>
    {
        public void Configure(EntityTypeBuilder<Component> builder)
        {
            builder.ToTable("components", "drawing");
            builder.HasKey(c => c.Id);
            builder.Property(c => c.ComponentId).IsRequired().HasMaxLength(100);
            builder.HasIndex(c => new { c.DrawingId, c.ComponentId }).IsUnique();
            builder.Property(c => c.Name).HasMaxLength(255);
            builder.Property(c => c.ComponentType).HasMaxLength(50);

            builder.OwnsOne(c => c.Position, p =>
            {
                p.Property(pos => pos.X).HasColumnName("position_x");
                p.Property(pos => pos.Y).HasColumnName("position_y");
                p.Property(pos => pos.Z).HasColumnName("position_z");
            });

            builder.OwnsOne(c => c.Scale, s =>
            {
                s.Property(sc => sc.X).HasColumnName("scale_x").HasDefaultValue(1);
                s.Property(sc => sc.Y).HasColumnName("scale_y").HasDefaultValue(1);
            });

            builder.Property(c => c.Rotation).HasPrecision(5, 2).HasDefaultValue(0);
            builder.Property(c => c.Properties).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb");
            builder.Property(c => c.Connections)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'[]'::jsonb")
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<List<Domain.ValueObjects.Connection>>(v, (JsonSerializerOptions?)null)!);
            builder.Property(c => c.Metadata).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb");
            builder.HasIndex(c => c.DrawingId);
        }
    }

    public class BoQItemConfiguration : IEntityTypeConfiguration<BoQItem>
    {
        public void Configure(EntityTypeBuilder<BoQItem> builder)
        {
            builder.ToTable("boq_items", "drawing");
            builder.HasKey(b => b.Id);
            builder.Property(b => b.ItemCode).IsRequired().HasMaxLength(100);
            builder.Property(b => b.Description).HasColumnType("text");
            builder.Property(b => b.Specification).HasColumnType("text");
            builder.Property(b => b.Unit).HasMaxLength(50);
            builder.Property(b => b.Quantity).HasPrecision(15, 3);
            builder.Property(b => b.UnitPrice).HasPrecision(15, 2);
            builder.Property(b => b.TotalPrice).HasPrecision(15, 2);
            builder.Property(b => b.Supplier).HasMaxLength(255);
            builder.Property(b => b.Manufacturer).HasMaxLength(255);
            builder.Property(b => b.ModelNumber).HasMaxLength(100);
            builder.Property(b => b.Category).HasMaxLength(100);
            builder.Property(b => b.Status).HasMaxLength(50).HasDefaultValue("pending");
            builder.Property(b => b.Notes).HasColumnType("text");
            builder.Property(b => b.Metadata).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb");
            builder.HasIndex(b => b.ProjectId);
            builder.HasIndex(b => b.DrawingId);
        }
    }

    public class ApprovalWorkflowConfiguration : IEntityTypeConfiguration<ApprovalWorkflow>
    {
        public void Configure(EntityTypeBuilder<ApprovalWorkflow> builder)
        {
            builder.ToTable("approval_workflows", "workflow");
            builder.HasKey(a => a.Id);
            builder.Property(a => a.WorkflowType).HasMaxLength(50).HasDefaultValue("standard");
            builder.Property(a => a.CurrentStage).HasMaxLength(50);
            builder.Property(a => a.Status).IsRequired().HasConversion<string>().HasMaxLength(50).HasDefaultValue("pending");
            builder.Property(a => a.InitiatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            builder.Property(a => a.Notes).HasColumnType("text");
            builder.Property(a => a.Metadata).HasColumnType("jsonb").HasDefaultValueSql("'{}'::jsonb");
            builder.HasIndex(a => a.DrawingId);

            builder.HasOne(a => a.InitiatedByUser)
                .WithMany()
                .HasForeignKey(a => a.InitiatedBy);
        }
    }

    public class ApprovalStageConfiguration : IEntityTypeConfiguration<ApprovalStage>
    {
        public void Configure(EntityTypeBuilder<ApprovalStage> builder)
        {
            builder.ToTable("approval_stages", "workflow");
            builder.HasKey(a => a.Id);
            builder.Property(a => a.StageName).IsRequired().HasMaxLength(100);
            builder.Property(a => a.StageOrder).IsRequired();
            builder.HasIndex(a => new { a.WorkflowId, a.StageOrder }).IsUnique();
            builder.Property(a => a.Status).IsRequired().HasConversion<string>().HasMaxLength(50).HasDefaultValue("pending");
            builder.Property(a => a.Decision).HasConversion<string>().HasMaxLength(50);
            builder.Property(a => a.Comments).HasColumnType("text");
            builder.HasIndex(a => a.WorkflowId);

            builder.HasOne(a => a.Workflow)
                .WithMany(w => w.Stages)
                .HasForeignKey(a => a.WorkflowId);
        }
    }

    public class DrawingVersionConfiguration : IEntityTypeConfiguration<DrawingVersion>
    {
        public void Configure(EntityTypeBuilder<DrawingVersion> builder)
        {
            builder.ToTable("drawing_versions", "workflow");
            builder.HasKey(v => v.Id);
            builder.Property(v => v.VersionNumber).IsRequired();
            builder.HasIndex(v => new { v.DrawingId, v.VersionNumber }).IsUnique();
            builder.Property(v => v.Revision).HasMaxLength(20);
            builder.Property(v => v.ChangesSummary).HasColumnType("text");
            builder.Property(v => v.DrawingData).IsRequired().HasColumnType("jsonb");
            builder.Property(v => v.IsMajorVersion).HasDefaultValue(false);
            builder.HasIndex(v => v.DrawingId);

            builder.HasOne(v => v.CreatedByUser)
                .WithMany()
                .HasForeignKey(v => v.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }

    public class CommentConfiguration : IEntityTypeConfiguration<Comment>
    {
        public void Configure(EntityTypeBuilder<Comment> builder)
        {
            builder.ToTable("comments", "workflow");
            builder.HasKey(c => c.Id);
            builder.Property(c => c.CommentText).IsRequired().HasColumnType("text");
            builder.Property(c => c.CommentType).HasMaxLength(50).HasDefaultValue("general");

            builder.OwnsOne(c => c.Position, p =>
            {
                p.Property(pos => pos.X).HasColumnName("position_x");
                p.Property(pos => pos.Y).HasColumnName("position_y");
                p.Property(pos => pos.Z).HasColumnName("position_z");
            });

            builder.Property(c => c.Attachments)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'[]'::jsonb")
                .HasConversion(
                    v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                    v => JsonSerializer.Deserialize<List<Domain.ValueObjects.Attachment>>(v, (JsonSerializerOptions?)null)!);

            builder.Property(c => c.IsResolved).HasDefaultValue(false);
            builder.HasIndex(c => c.DrawingId);

            builder.HasOne(c => c.ParentComment)
                .WithMany(c => c.Replies)
                .HasForeignKey(c => c.ParentCommentId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(c => c.ResolvedByUser)
                .WithMany()
                .HasForeignKey(c => c.ResolvedBy)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }

    public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
    {
        public void Configure(EntityTypeBuilder<AuditLog> builder)
        {
            builder.ToTable("audit_logs", "audit");
            builder.HasKey(a => a.Id);
            builder.Property(a => a.EntityType).IsRequired().HasMaxLength(100);
            builder.Property(a => a.EntityId).IsRequired();
            builder.Property(a => a.Action).IsRequired().HasMaxLength(50);
            builder.Property(a => a.Changes).HasColumnType("jsonb");
            builder.Property(a => a.IpAddress).HasColumnType("inet");
            builder.Property(a => a.UserAgent).HasColumnType("text");
            builder.Property(a => a.SessionId).HasMaxLength(255);
            builder.Property(a => a.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            builder.HasIndex(a => new { a.EntityType, a.EntityId });
            builder.HasIndex(a => a.UserId);
            builder.HasIndex(a => a.CreatedAt);

            builder.HasOne(a => a.User)
                .WithMany()
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}