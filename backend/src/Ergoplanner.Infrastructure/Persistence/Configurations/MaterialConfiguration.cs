using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Ergoplanner.Domain.Entities;

namespace Ergoplanner.Infrastructure.Persistence.Configurations
{
    public class MaterialConfiguration : IEntityTypeConfiguration<Material>
    {
        public void Configure(EntityTypeBuilder<Material> builder)
        {
            builder.ToTable("materials", "material");

            builder.HasKey(m => m.Id);

            builder.Property(m => m.MaterialCode)
                .IsRequired()
                .HasMaxLength(50);

            builder.HasIndex(m => new { m.OrganizationId, m.MaterialCode })
                .IsUnique();

            builder.Property(m => m.Name)
                .IsRequired()
                .HasMaxLength(255);

            builder.Property(m => m.Description)
                .HasColumnType("text");

            builder.Property(m => m.ShortDescription)
                .HasMaxLength(500);

            builder.Property(m => m.CategoryType)
                .IsRequired()
                .HasConversion<string>();

            builder.Property(m => m.Manufacturer)
                .HasMaxLength(255);

            builder.Property(m => m.ModelNumber)
                .HasMaxLength(100);

            builder.Property(m => m.PartNumber)
                .HasMaxLength(100);

            builder.Property(m => m.SKU)
                .HasMaxLength(100);

            builder.Property(m => m.GTIN)
                .HasMaxLength(14);

            builder.Property(m => m.HSCode)
                .HasMaxLength(20);

            builder.Property(m => m.BaseUnit)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue("ea");

            builder.Property(m => m.UnitOfMeasurement)
                .IsRequired()
                .HasConversion<string>()
                .HasDefaultValue("Each");

            builder.Property(m => m.Weight)
                .HasColumnType("decimal(10,3)");

            builder.Property(m => m.WeightUnit)
                .HasMaxLength(10)
                .HasDefaultValue("kg");

            // Dimensions value object
            builder.OwnsOne(m => m.Dimensions, dimensions =>
            {
                dimensions.Property(d => d.Length)
                    .HasColumnName("dimension_length")
                    .HasColumnType("decimal(10,3)");
                dimensions.Property(d => d.Width)
                    .HasColumnName("dimension_width")
                    .HasColumnType("decimal(10,3)");
                dimensions.Property(d => d.Height)
                    .HasColumnName("dimension_height")
                    .HasColumnType("decimal(10,3)");
                dimensions.Property(d => d.Diameter)
                    .HasColumnName("dimension_diameter")
                    .HasColumnType("decimal(10,3)");
                dimensions.Property(d => d.Thickness)
                    .HasColumnName("dimension_thickness")
                    .HasColumnType("decimal(10,3)");
                dimensions.Property(d => d.Unit)
                    .HasColumnName("dimension_unit")
                    .HasMaxLength(10)
                    .HasDefaultValue("mm");
            });

            builder.Property(m => m.Color)
                .HasMaxLength(50);

            builder.Property(m => m.MaterialComposition)
                .HasMaxLength(100);

            builder.Property(m => m.Grade)
                .HasMaxLength(50);

            builder.Property(m => m.Standard)
                .HasMaxLength(100);

            builder.Property(m => m.Certification)
                .HasMaxLength(255);

            builder.Property(m => m.MinOrderQuantity)
                .HasColumnType("decimal(18,6)");

            builder.Property(m => m.MaxOrderQuantity)
                .HasColumnType("decimal(18,6)");

            // Lead time value object
            builder.OwnsOne(m => m.StandardLeadTime, leadTime =>
            {
                leadTime.Property(l => l.Days)
                    .HasColumnName("standard_lead_time_days")
                    .HasDefaultValue(0);
                leadTime.Property(l => l.EarliestDelivery)
                    .HasColumnName("standard_earliest_delivery");
                leadTime.Property(l => l.LatestDelivery)
                    .HasColumnName("standard_latest_delivery");
                leadTime.Property(l => l.IsEstimated)
                    .HasColumnName("standard_lead_time_estimated")
                    .HasDefaultValue(true);
            });

            builder.Property(m => m.ShelfLife)
                .HasColumnType("decimal(10,2)");

            builder.Property(m => m.RequiresSpecialHandling)
                .HasDefaultValue(false);

            builder.Property(m => m.IsHazardous)
                .HasDefaultValue(false);

            builder.Property(m => m.HazardClass)
                .HasMaxLength(50);

            builder.Property(m => m.IsActive)
                .HasDefaultValue(true);

            builder.Property(m => m.IsStocked)
                .HasDefaultValue(true);

            builder.Property(m => m.ReplacementMaterialId)
                .HasMaxLength(50);

            builder.Property(m => m.ImageUrl)
                .HasMaxLength(500);

            builder.Property(m => m.DatasheetUrl)
                .HasMaxLength(500);

            builder.Property(m => m.CertificateUrl)
                .HasMaxLength(500);

            builder.Property(m => m.TechnicalProperties)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'{}'::jsonb");

            builder.Property(m => m.Metadata)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'{}'::jsonb");

            builder.Property(m => m.Tags)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'[]'::jsonb");

            // Soft delete
            builder.Property(m => m.IsDeleted)
                .HasDefaultValue(false);

            builder.HasQueryFilter(m => !m.IsDeleted);

            // Relationships
            builder.HasOne(m => m.Organization)
                .WithMany(o => o.Materials)
                .HasForeignKey(m => m.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(m => m.Category)
                .WithMany(c => c.Materials)
                .HasForeignKey(m => m.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes
            builder.HasIndex(m => m.OrganizationId);
            builder.HasIndex(m => m.CategoryId);
            builder.HasIndex(m => m.CategoryType);
            builder.HasIndex(m => m.IsActive);
            builder.HasIndex(m => m.IsStocked);
            builder.HasIndex(m => m.Manufacturer);
            builder.HasIndex(m => m.PartNumber);
            builder.HasIndex(m => m.SKU);
            builder.HasIndex(m => m.IsDeleted);
        }
    }

    public class MaterialCategoryConfiguration : IEntityTypeConfiguration<MaterialCategory>
    {
        public void Configure(EntityTypeBuilder<MaterialCategory> builder)
        {
            builder.ToTable("material_categories", "material");

            builder.HasKey(c => c.Id);

            builder.Property(c => c.CategoryCode)
                .IsRequired()
                .HasMaxLength(50);

            builder.HasIndex(c => new { c.OrganizationId, c.CategoryCode })
                .IsUnique();

            builder.Property(c => c.Name)
                .IsRequired()
                .HasMaxLength(255);

            builder.Property(c => c.Description)
                .HasColumnType("text");

            builder.Property(c => c.CategoryType)
                .IsRequired()
                .HasConversion<string>();

            builder.Property(c => c.Icon)
                .HasMaxLength(100);

            builder.Property(c => c.Color)
                .HasMaxLength(20);

            builder.Property(c => c.SortOrder)
                .HasDefaultValue(0);

            builder.Property(c => c.IsSystem)
                .HasDefaultValue(false);

            builder.Property(c => c.IsActive)
                .HasDefaultValue(true);

            builder.Property(c => c.DefaultProperties)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'{}'::jsonb");

            builder.Property(c => c.RequiredSpecifications)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'{}'::jsonb");

            builder.Property(c => c.Metadata)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'{}'::jsonb");

            builder.Property(c => c.Tags)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'[]'::jsonb");

            // Soft delete
            builder.Property(c => c.IsDeleted)
                .HasDefaultValue(false);

            builder.HasQueryFilter(c => !c.IsDeleted);

            // Relationships
            builder.HasOne(c => c.Organization)
                .WithMany(o => o.MaterialCategories)
                .HasForeignKey(c => c.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(c => c.ParentCategory)
                .WithMany(c => c.ChildCategories)
                .HasForeignKey(c => c.ParentCategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes
            builder.HasIndex(c => c.OrganizationId);
            builder.HasIndex(c => c.ParentCategoryId);
            builder.HasIndex(c => c.CategoryType);
            builder.HasIndex(c => c.IsActive);
            builder.HasIndex(c => c.SortOrder);
            builder.HasIndex(c => c.IsDeleted);
        }
    }

    public class MaterialSpecificationConfiguration : IEntityTypeConfiguration<MaterialSpecification>
    {
        public void Configure(EntityTypeBuilder<MaterialSpecification> builder)
        {
            builder.ToTable("material_specifications", "material");

            builder.HasKey(s => s.Id);

            builder.Property(s => s.SpecificationType)
                .IsRequired()
                .HasConversion<string>();

            builder.Property(s => s.Name)
                .IsRequired()
                .HasMaxLength(255);

            builder.Property(s => s.Description)
                .HasColumnType("text");

            builder.Property(s => s.Value)
                .IsRequired()
                .HasColumnType("text");

            builder.Property(s => s.Unit)
                .HasMaxLength(20);

            builder.Property(s => s.MinValue)
                .HasColumnType("text");

            builder.Property(s => s.MaxValue)
                .HasColumnType("text");

            builder.Property(s => s.ToleranceType)
                .HasMaxLength(10);

            builder.Property(s => s.Tolerance)
                .HasMaxLength(50);

            builder.Property(s => s.IsRequired)
                .HasDefaultValue(false);

            builder.Property(s => s.IsActive)
                .HasDefaultValue(true);

            builder.Property(s => s.IsVerified)
                .HasDefaultValue(false);

            builder.Property(s => s.TestMethod)
                .HasMaxLength(255);

            builder.Property(s => s.Standard)
                .HasMaxLength(100);

            builder.Property(s => s.CertificateNumber)
                .HasMaxLength(100);

            builder.Property(s => s.TestLabName)
                .HasMaxLength(255);

            builder.Property(s => s.DocumentUrl)
                .HasMaxLength(500);

            builder.Property(s => s.SortOrder)
                .HasDefaultValue(0);

            builder.Property(s => s.Metadata)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'{}'::jsonb");

            builder.Property(s => s.Tags)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'[]'::jsonb");

            // Relationships
            builder.HasOne(s => s.Material)
                .WithMany(m => m.Specifications)
                .HasForeignKey(s => s.MaterialId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(s => s.VerifiedByUser)
                .WithMany(u => u.VerifiedSpecifications)
                .HasForeignKey(s => s.VerifiedBy)
                .OnDelete(DeleteBehavior.SetNull);

            // Indexes
            builder.HasIndex(s => s.MaterialId);
            builder.HasIndex(s => s.SpecificationType);
            builder.HasIndex(s => s.IsActive);
            builder.HasIndex(s => s.IsVerified);
            builder.HasIndex(s => s.SortOrder);
        }
    }

    public class MaterialSupplierConfiguration : IEntityTypeConfiguration<MaterialSupplier>
    {
        public void Configure(EntityTypeBuilder<MaterialSupplier> builder)
        {
            builder.ToTable("material_suppliers", "material");

            builder.HasKey(ms => ms.Id);

            builder.Property(ms => ms.SupplierPartNumber)
                .HasMaxLength(100);

            builder.Property(ms => ms.SupplierSKU)
                .HasMaxLength(100);

            builder.Property(ms => ms.SupplierDescription)
                .HasColumnType("text");

            builder.Property(ms => ms.IsPrimary)
                .HasDefaultValue(false);

            builder.Property(ms => ms.IsActive)
                .HasDefaultValue(true);

            builder.Property(ms => ms.Priority)
                .HasDefaultValue(1);

            builder.Property(ms => ms.MinOrderQuantity)
                .HasColumnType("decimal(18,6)");

            builder.Property(ms => ms.MaxOrderQuantity)
                .HasColumnType("decimal(18,6)");

            builder.Property(ms => ms.OrderMultiple)
                .HasColumnType("decimal(18,6)")
                .HasDefaultValue(1);

            // Lead time value object
            builder.OwnsOne(ms => ms.LeadTime, leadTime =>
            {
                leadTime.Property(l => l.Days)
                    .HasColumnName("lead_time_days")
                    .HasDefaultValue(0);
                leadTime.Property(l => l.EarliestDelivery)
                    .HasColumnName("earliest_delivery");
                leadTime.Property(l => l.LatestDelivery)
                    .HasColumnName("latest_delivery");
                leadTime.Property(l => l.IsEstimated)
                    .HasColumnName("lead_time_estimated")
                    .HasDefaultValue(true);
            });

            // Last price value object
            builder.OwnsOne(ms => ms.LastPrice, money =>
            {
                money.Property(m => m.Amount)
                    .HasColumnName("last_price")
                    .HasColumnType("decimal(18,2)");
                money.Property(m => m.Currency)
                    .HasColumnName("last_price_currency")
                    .HasMaxLength(3);
            });

            builder.Property(ms => ms.PaymentTerms)
                .HasMaxLength(100);

            builder.Property(ms => ms.ShippingTerms)
                .HasMaxLength(100);

            builder.Property(ms => ms.Currency)
                .HasMaxLength(3)
                .HasDefaultValue("USD");

            builder.Property(ms => ms.QualityRating)
                .HasColumnType("decimal(3,2)");

            builder.Property(ms => ms.DeliveryRating)
                .HasColumnType("decimal(3,2)");

            builder.Property(ms => ms.ServiceRating)
                .HasColumnType("decimal(3,2)");

            builder.Property(ms => ms.Notes)
                .HasColumnType("text");

            builder.Property(ms => ms.ContractNumber)
                .HasMaxLength(100);

            builder.Property(ms => ms.RequiresApproval)
                .HasDefaultValue(false);

            builder.Property(ms => ms.ContactInfo)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'{}'::jsonb");

            builder.Property(ms => ms.Metadata)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'{}'::jsonb");

            builder.Property(ms => ms.Tags)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'[]'::jsonb");

            // Relationships
            builder.HasOne(ms => ms.Material)
                .WithMany(m => m.Suppliers)
                .HasForeignKey(ms => ms.MaterialId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(ms => ms.Supplier)
                .WithMany(s => s.MaterialSuppliers)
                .HasForeignKey(ms => ms.SupplierId)
                .OnDelete(DeleteBehavior.Cascade);

            // Indexes
            builder.HasIndex(ms => ms.MaterialId);
            builder.HasIndex(ms => ms.SupplierId);
            builder.HasIndex(ms => ms.IsPrimary);
            builder.HasIndex(ms => ms.IsActive);
            builder.HasIndex(ms => ms.Priority);
            builder.HasIndex(ms => new { ms.MaterialId, ms.SupplierId })
                .IsUnique();
        }
    }
}