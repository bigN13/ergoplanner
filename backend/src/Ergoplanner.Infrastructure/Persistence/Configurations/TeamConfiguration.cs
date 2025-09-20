using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Ergoplanner.Domain.Entities;

namespace Ergoplanner.Infrastructure.Persistence.Configurations
{
    public class TeamConfiguration : IEntityTypeConfiguration<Team>
    {
        public void Configure(EntityTypeBuilder<Team> builder)
        {
            builder.ToTable("teams", "core");

            builder.HasKey(t => t.Id);

            builder.Property(t => t.Name)
                .IsRequired()
                .HasMaxLength(255);

            builder.Property(t => t.Description)
                .HasColumnType("text");

            builder.Property(t => t.IsActive)
                .HasDefaultValue(true);

            // Indexes
            builder.HasIndex(t => t.OrganizationId);
            builder.HasIndex(t => t.ProjectId);

            // Relationships
            builder.HasOne(t => t.Organization)
                .WithMany(o => o.Teams)
                .HasForeignKey(t => t.OrganizationId);

            builder.HasOne(t => t.Project)
                .WithMany(p => p.Teams)
                .HasForeignKey(t => t.ProjectId);

            builder.HasMany(t => t.Members)
                .WithOne(tm => tm.Team)
                .HasForeignKey(tm => tm.TeamId);
        }
    }

    public class TeamMemberConfiguration : IEntityTypeConfiguration<TeamMember>
    {
        public void Configure(EntityTypeBuilder<TeamMember> builder)
        {
            builder.ToTable("team_members", "core");

            builder.HasKey(tm => tm.Id);

            builder.HasIndex(tm => new { tm.TeamId, tm.UserId })
                .IsUnique();

            builder.Property(tm => tm.Role)
                .HasMaxLength(50)
                .HasDefaultValue("member");

            builder.Property(tm => tm.Permissions)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'[]'::jsonb");

            builder.Property(tm => tm.JoinedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            // Relationships
            builder.HasOne(tm => tm.Team)
                .WithMany(t => t.Members)
                .HasForeignKey(tm => tm.TeamId);

            builder.HasOne(tm => tm.User)
                .WithMany(u => u.TeamMemberships)
                .HasForeignKey(tm => tm.UserId);
        }
    }
}