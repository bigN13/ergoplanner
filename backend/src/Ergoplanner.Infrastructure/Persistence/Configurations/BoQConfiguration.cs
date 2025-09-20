using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Ergoplanner.Domain.Entities;
using Ergoplanner.Domain.ValueObjects;

namespace Ergoplanner.Infrastructure.Persistence.Configurations
{
    public class BoQConfiguration : IEntityTypeConfiguration<BoQ>
    {
        public void Configure(EntityTypeBuilder<BoQ> builder)
        {
            builder.ToTable("boqs", "boq");

            builder.HasKey(b => b.Id);

            builder.Property(b => b.BoQNumber)
                .IsRequired()
                .HasMaxLength(50);

            builder.HasIndex(b => new { b.OrganizationId, b.BoQNumber })
                .IsUnique();

            builder.Property(b => b.Name)
                .IsRequired()
                .HasMaxLength(255);

            builder.Property(b => b.Description)
                .HasColumnType("text");

            builder.Property(b => b.Status)
                .IsRequired()
                .HasConversion<string>();

            builder.Property(b => b.RevisionType)
                .IsRequired()
                .HasConversion<string>();

            builder.Property(b => b.Revision)
                .IsRequired()
                .HasMaxLength(10)
                .HasDefaultValue("A");

            builder.Property(b => b.Currency)
                .IsRequired()
                .HasMaxLength(3)
                .HasDefaultValue("USD");

            // Money value objects
            builder.OwnsOne(b => b.TotalMaterialCost, money =>
            {
                money.Property(m => m.Amount)
                    .HasColumnName("total_material_cost")
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);
                money.Property(m => m.Currency)
                    .HasColumnName("total_material_cost_currency")
                    .HasMaxLength(3);
            });

            builder.OwnsOne(b => b.TotalLaborCost, money =>
            {
                money.Property(m => m.Amount)
                    .HasColumnName("total_labor_cost")
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);
                money.Property(m => m.Currency)
                    .HasColumnName("total_labor_cost_currency")
                    .HasMaxLength(3);
            });

            builder.OwnsOne(b => b.TotalEquipmentCost, money =>
            {
                money.Property(m => m.Amount)
                    .HasColumnName("total_equipment_cost")
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);
                money.Property(m => m.Currency)
                    .HasColumnName("total_equipment_cost_currency")
                    .HasMaxLength(3);
            });

            builder.OwnsOne(b => b.TotalOverheadCost, money =>
            {
                money.Property(m => m.Amount)
                    .HasColumnName("total_overhead_cost")
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);
                money.Property(m => m.Currency)
                    .HasColumnName("total_overhead_cost_currency")
                    .HasMaxLength(3);
            });

            builder.OwnsOne(b => b.TotalCost, money =>
            {
                money.Property(m => m.Amount)
                    .HasColumnName("total_cost")
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);
                money.Property(m => m.Currency)
                    .HasColumnName("total_cost_currency")
                    .HasMaxLength(3);
            });

            builder.OwnsOne(b => b.GrandTotal, money =>
            {
                money.Property(m => m.Amount)
                    .HasColumnName("grand_total")
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);
                money.Property(m => m.Currency)
                    .HasColumnName("grand_total_currency")
                    .HasMaxLength(3);
            });

            builder.Property(b => b.ExchangeRate)
                .HasColumnType("decimal(10,6)")
                .HasDefaultValue(1.0m);

            builder.Property(b => b.ContingencyPercentage)
                .HasColumnType("decimal(5,2)")
                .HasDefaultValue(10.0m);

            builder.Property(b => b.ProfitPercentage)
                .HasColumnType("decimal(5,2)")
                .HasDefaultValue(15.0m);

            builder.Property(b => b.IsBaseline)
                .HasDefaultValue(false);

            builder.Property(b => b.IsLocked)
                .HasDefaultValue(false);

            builder.Property(b => b.Metadata)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'{}'::jsonb");

            builder.Property(b => b.Tags)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'[]'::jsonb");

            // Soft delete
            builder.Property(b => b.IsDeleted)
                .HasDefaultValue(false);

            builder.HasQueryFilter(b => !b.IsDeleted);

            // Relationships
            builder.HasOne(b => b.Organization)
                .WithMany(o => o.BoQs)
                .HasForeignKey(b => b.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(b => b.Project)
                .WithMany(p => p.BoQs)
                .HasForeignKey(b => b.ProjectId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(b => b.Drawing)
                .WithMany(d => d.BoQs)
                .HasForeignKey(b => b.DrawingId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(b => b.Template)
                .WithMany(t => t.BoQs)
                .HasForeignKey(b => b.TemplateId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(b => b.Baseline)
                .WithMany(b => b.DerivedBoQs)
                .HasForeignKey(b => b.BaselineId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(b => b.CreatedByUser)
                .WithMany(u => u.CreatedBoQs)
                .HasForeignKey(b => b.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(b => b.UpdatedByUser)
                .WithMany(u => u.UpdatedBoQs)
                .HasForeignKey(b => b.UpdatedBy)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(b => b.LockedByUser)
                .WithMany(u => u.LockedBoQs)
                .HasForeignKey(b => b.LockedBy)
                .OnDelete(DeleteBehavior.SetNull);

            // Indexes
            builder.HasIndex(b => b.OrganizationId);
            builder.HasIndex(b => b.ProjectId);
            builder.HasIndex(b => b.DrawingId);
            builder.HasIndex(b => b.Status);
            builder.HasIndex(b => b.CreatedAt);
            builder.HasIndex(b => b.IsDeleted);
        }
    }

    public class BoQSectionConfiguration : IEntityTypeConfiguration<BoQSection>
    {
        public void Configure(EntityTypeBuilder<BoQSection> builder)
        {
            builder.ToTable("boq_sections", "boq");

            builder.HasKey(s => s.Id);

            builder.Property(s => s.SectionCode)
                .IsRequired()
                .HasMaxLength(50);

            builder.HasIndex(s => new { s.BoQId, s.SectionCode })
                .IsUnique();

            builder.Property(s => s.Name)
                .IsRequired()
                .HasMaxLength(255);

            builder.Property(s => s.Description)
                .HasColumnType("text");

            builder.Property(s => s.CategoryType)
                .IsRequired()
                .HasConversion<string>();

            builder.Property(s => s.SortOrder)
                .HasDefaultValue(0);

            builder.Property(s => s.IsExpanded)
                .HasDefaultValue(true);

            builder.OwnsOne(s => s.SectionTotal, money =>
            {
                money.Property(m => m.Amount)
                    .HasColumnName("section_total")
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);
                money.Property(m => m.Currency)
                    .HasColumnName("section_total_currency")
                    .HasMaxLength(3);
            });

            builder.Property(s => s.Metadata)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'{}'::jsonb");

            builder.Property(s => s.Tags)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'[]'::jsonb");

            // Soft delete
            builder.Property(s => s.IsDeleted)
                .HasDefaultValue(false);

            builder.HasQueryFilter(s => !s.IsDeleted);

            // Relationships
            builder.HasOne(s => s.BoQ)
                .WithMany(b => b.Sections)
                .HasForeignKey(s => s.BoQId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(s => s.ParentSection)
                .WithMany(s => s.ChildSections)
                .HasForeignKey(s => s.ParentSectionId)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes
            builder.HasIndex(s => s.BoQId);
            builder.HasIndex(s => s.ParentSectionId);
            builder.HasIndex(s => s.SortOrder);
            builder.HasIndex(s => s.CategoryType);
        }
    }

    public class BoQItemConfiguration : IEntityTypeConfiguration<BoQItem>
    {
        public void Configure(EntityTypeBuilder<BoQItem> builder)
        {
            builder.ToTable("boq_items", "boq");

            builder.HasKey(i => i.Id);

            builder.Property(i => i.ItemCode)
                .IsRequired()
                .HasMaxLength(100);

            builder.HasIndex(i => new { i.ProjectId, i.ItemCode })
                .IsUnique();

            builder.Property(i => i.Description)
                .HasColumnType("text");

            builder.Property(i => i.Specification)
                .HasColumnType("text");

            builder.Property(i => i.Unit)
                .HasMaxLength(20);

            // Quantity value object
            builder.OwnsOne(i => i.Quantity, quantity =>
            {
                quantity.Property(q => q.Value)
                    .HasColumnName("quantity")
                    .HasColumnType("decimal(18,6)")
                    .HasDefaultValue(0);
                quantity.Property(q => q.Unit)
                    .HasColumnName("quantity_unit")
                    .HasMaxLength(20);
                quantity.Property(q => q.UnitSymbol)
                    .HasColumnName("quantity_unit_symbol")
                    .HasMaxLength(10);
            });

            builder.Property(i => i.CalculationMethod)
                .IsRequired()
                .HasConversion<string>()
                .HasDefaultValue("Manual");

            // Formula value object
            builder.OwnsOne(i => i.QuantityFormula, formula =>
            {
                formula.Property(f => f.Expression)
                    .HasColumnName("quantity_formula_expression")
                    .HasColumnType("text");
                formula.Property(f => f.Variables)
                    .HasColumnName("quantity_formula_variables")
                    .HasColumnType("jsonb");
                formula.Property(f => f.Description)
                    .HasColumnName("quantity_formula_description")
                    .HasColumnType("text");
                formula.Property(f => f.ValidationRules)
                    .HasColumnName("quantity_formula_validation")
                    .HasColumnType("text");
            });

            // Money value objects
            builder.OwnsOne(i => i.UnitPrice, money =>
            {
                money.Property(m => m.Amount)
                    .HasColumnName("unit_price")
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);
                money.Property(m => m.Currency)
                    .HasColumnName("unit_price_currency")
                    .HasMaxLength(3);
            });

            builder.OwnsOne(i => i.TotalCost, money =>
            {
                money.Property(m => m.Amount)
                    .HasColumnName("total_cost")
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);
                money.Property(m => m.Currency)
                    .HasColumnName("total_cost_currency")
                    .HasMaxLength(3);
            });

            builder.Property(i => i.CostType)
                .IsRequired()
                .HasConversion<string>()
                .HasDefaultValue("Material");

            builder.Property(i => i.Status)
                .IsRequired()
                .HasConversion<string>()
                .HasDefaultValue("Pending");

            builder.Property(i => i.Supplier)
                .HasMaxLength(255);

            builder.Property(i => i.Manufacturer)
                .HasMaxLength(255);

            builder.Property(i => i.ModelNumber)
                .HasMaxLength(100);

            builder.Property(i => i.PartNumber)
                .HasMaxLength(100);

            // Lead time value object
            builder.OwnsOne(i => i.LeadTime, leadTime =>
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

            // Dimensions value object
            builder.OwnsOne(i => i.Dimensions, dimensions =>
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

            builder.Property(i => i.Category)
                .HasMaxLength(100);

            builder.Property(i => i.SubCategory)
                .HasMaxLength(100);

            builder.Property(i => i.Weight)
                .HasColumnType("decimal(10,3)");

            builder.Property(i => i.WeightUnit)
                .HasMaxLength(10)
                .HasDefaultValue("kg");

            builder.Property(i => i.Notes)
                .HasColumnType("text");

            builder.Property(i => i.InternalNotes)
                .HasColumnType("text");

            builder.Property(i => i.RequiresApproval)
                .HasDefaultValue(false);

            builder.Property(i => i.IsApproved)
                .HasDefaultValue(false);

            builder.Property(i => i.PurchaseOrderNumber)
                .HasMaxLength(50);

            builder.Property(i => i.InvoiceNumber)
                .HasMaxLength(50);

            builder.Property(i => i.Properties)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'{}'::jsonb");

            builder.Property(i => i.Metadata)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'{}'::jsonb");

            builder.Property(i => i.Tags)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'[]'::jsonb");

            // Soft delete
            builder.Property(i => i.IsDeleted)
                .HasDefaultValue(false);

            builder.HasQueryFilter(i => !i.IsDeleted);

            // Relationships
            builder.HasOne(i => i.Project)
                .WithMany(p => p.BoQItems)
                .HasForeignKey(i => i.ProjectId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(i => i.Drawing)
                .WithMany(d => d.BoQItems)
                .HasForeignKey(i => i.DrawingId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(i => i.Component)
                .WithMany(c => c.BoQItems)
                .HasForeignKey(i => i.ComponentId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(i => i.Section)
                .WithMany(s => s.Items)
                .HasForeignKey(i => i.SectionId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(i => i.Material)
                .WithMany(m => m.BoQItems)
                .HasForeignKey(i => i.MaterialId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(i => i.MaterialSupplier)
                .WithMany(ms => ms.BoQItems)
                .HasForeignKey(i => i.SupplierId)
                .OnDelete(DeleteBehavior.SetNull);

            // Indexes
            builder.HasIndex(i => i.ProjectId);
            builder.HasIndex(i => i.DrawingId);
            builder.HasIndex(i => i.SectionId);
            builder.HasIndex(i => i.MaterialId);
            builder.HasIndex(i => i.Status);
            builder.HasIndex(i => i.CostType);
            builder.HasIndex(i => i.Category);
            builder.HasIndex(i => i.Supplier);
            builder.HasIndex(i => i.Manufacturer);
            builder.HasIndex(i => i.IsDeleted);
        }
    }
}