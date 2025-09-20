using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Ergoplanner.Domain.Entities;

namespace Ergoplanner.Infrastructure.Persistence.Configurations
{
    public class OrganizationConfiguration : IEntityTypeConfiguration<Organization>
    {
        public void Configure(EntityTypeBuilder<Organization> builder)
        {
            builder.ToTable("organizations", "core");

            builder.HasKey(o => o.Id);

            builder.Property(o => o.Name)
                .IsRequired()
                .HasMaxLength(255);

            builder.Property(o => o.Code)
                .IsRequired()
                .HasMaxLength(50);

            builder.HasIndex(o => o.Code)
                .IsUnique();

            builder.Property(o => o.Description)
                .HasColumnType("text");

            builder.Property(o => o.Industry)
                .HasMaxLength(100);

            builder.Property(o => o.Size)
                .HasMaxLength(50);

            builder.Property(o => o.Country)
                .HasMaxLength(100);

            builder.Property(o => o.Timezone)
                .HasMaxLength(50)
                .HasDefaultValue("UTC");

            builder.Property(o => o.Settings)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'{}'::jsonb");

            builder.Property(o => o.IsActive)
                .HasDefaultValue(true);

            // Relationships
            builder.HasMany(o => o.Users)
                .WithOne(u => u.Organization)
                .HasForeignKey(u => u.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(o => o.Projects)
                .WithOne(p => p.Organization)
                .HasForeignKey(p => p.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(o => o.Teams)
                .WithOne(t => t.Organization)
                .HasForeignKey(t => t.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(o => o.Symbols)
                .WithOne(s => s.Organization)
                .HasForeignKey(s => s.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}