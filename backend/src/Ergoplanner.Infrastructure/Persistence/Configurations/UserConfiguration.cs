using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Ergoplanner.Domain.Entities;
using Ergoplanner.Domain.Enums;

namespace Ergoplanner.Infrastructure.Persistence.Configurations
{
    public class UserConfiguration : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> builder)
        {
            builder.ToTable("users", "core");

            builder.HasKey(u => u.Id);

            builder.Property(u => u.Email)
                .IsRequired()
                .HasMaxLength(255);

            builder.HasIndex(u => u.Email)
                .IsUnique();

            builder.Property(u => u.Username)
                .IsRequired()
                .HasMaxLength(100);

            builder.HasIndex(u => u.Username)
                .IsUnique();

            builder.Property(u => u.PasswordHash)
                .IsRequired();

            builder.Property(u => u.FirstName)
                .HasMaxLength(100);

            builder.Property(u => u.LastName)
                .HasMaxLength(100);

            builder.Property(u => u.DisplayName)
                .HasMaxLength(255);

            builder.Property(u => u.AvatarUrl)
                .HasColumnType("text");

            builder.Property(u => u.Role)
                .IsRequired()
                .HasConversion<string>()
                .HasMaxLength(50);

            builder.Property(u => u.Permissions)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'[]'::jsonb");

            builder.Property(u => u.Preferences)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'{}'::jsonb");

            builder.Property(u => u.IsActive)
                .HasDefaultValue(true);

            builder.Property(u => u.IsVerified)
                .HasDefaultValue(false);

            builder.Property(u => u.LoginAttempts)
                .HasDefaultValue(0);

            // Indexes
            builder.HasIndex(u => u.OrganizationId);
            builder.HasIndex(u => u.Email);
            builder.HasIndex(u => new { u.OrganizationId, u.IsActive });

            // Relationships
            builder.HasOne(u => u.Organization)
                .WithMany(o => o.Users)
                .HasForeignKey(u => u.OrganizationId);

            builder.HasMany(u => u.TeamMemberships)
                .WithOne(tm => tm.User)
                .HasForeignKey(tm => tm.UserId);

            builder.HasMany(u => u.CreatedDrawings)
                .WithOne(d => d.CreatedByUser)
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasMany(u => u.UpdatedDrawings)
                .WithOne(d => d.UpdatedByUser)
                .HasForeignKey(d => d.UpdatedBy)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasMany(u => u.Comments)
                .WithOne(c => c.User)
                .HasForeignKey(c => c.UserId);

            builder.HasMany(u => u.ApprovalStages)
                .WithOne(a => a.Approver)
                .HasForeignKey(a => a.ApproverId);

            // Ignore computed property
            builder.Ignore(u => u.FullName);
        }
    }
}