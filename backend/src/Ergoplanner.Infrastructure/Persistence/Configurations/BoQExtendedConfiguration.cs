using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Ergoplanner.Domain.Entities;

namespace Ergoplanner.Infrastructure.Persistence.Configurations
{
    public class BoQTemplateConfiguration : IEntityTypeConfiguration<BoQTemplate>
    {
        public void Configure(EntityTypeBuilder<BoQTemplate> builder)
        {
            builder.ToTable("boq_templates", "boq");

            builder.HasKey(t => t.Id);

            builder.Property(t => t.Name)
                .IsRequired()
                .HasMaxLength(255);

            builder.Property(t => t.Code)
                .IsRequired()
                .HasMaxLength(50);

            builder.HasIndex(t => new { t.OrganizationId, t.Code })
                .IsUnique();

            builder.Property(t => t.Description)
                .HasColumnType("text");

            builder.Property(t => t.Industry)
                .HasMaxLength(100);

            builder.Property(t => t.ProjectType)
                .HasMaxLength(100);

            builder.Property(t => t.PrimaryCategory)
                .HasConversion<string>();

            builder.Property(t => t.Currency)
                .IsRequired()
                .HasMaxLength(3)
                .HasDefaultValue("USD");

            builder.Property(t => t.IsPublic)
                .HasDefaultValue(false);

            builder.Property(t => t.IsStandard)
                .HasDefaultValue(false);

            builder.Property(t => t.Version)
                .HasMaxLength(20)
                .HasDefaultValue("1.0");

            builder.Property(t => t.UsageCount)
                .HasDefaultValue(0);

            builder.Property(t => t.Rating)
                .HasColumnType("decimal(3,2)");

            builder.Property(t => t.Structure)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'{}'::jsonb");

            builder.Property(t => t.DefaultSettings)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'{}'::jsonb");

            builder.Property(t => t.Metadata)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'{}'::jsonb");

            builder.Property(t => t.Tags)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'[]'::jsonb");

            // Soft delete
            builder.Property(t => t.IsDeleted)
                .HasDefaultValue(false);

            builder.HasQueryFilter(t => !t.IsDeleted);

            // Relationships
            builder.HasOne(t => t.Organization)
                .WithMany(o => o.BoQTemplates)
                .HasForeignKey(t => t.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes
            builder.HasIndex(t => t.OrganizationId);
            builder.HasIndex(t => t.Industry);
            builder.HasIndex(t => t.ProjectType);
            builder.HasIndex(t => t.IsPublic);
            builder.HasIndex(t => t.IsStandard);
            builder.HasIndex(t => t.UsageCount);
            builder.HasIndex(t => t.Rating);
        }
    }

    public class BoQApprovalConfiguration : IEntityTypeConfiguration<BoQApproval>
    {
        public void Configure(EntityTypeBuilder<BoQApproval> builder)
        {
            builder.ToTable("boq_approvals", "boq");

            builder.HasKey(a => a.Id);

            builder.Property(a => a.ApprovalLevel)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(a => a.Sequence)
                .HasDefaultValue(1);

            builder.Property(a => a.Status)
                .IsRequired()
                .HasConversion<string>()
                .HasDefaultValue("Pending");

            builder.Property(a => a.Comments)
                .HasColumnType("text");

            builder.Property(a => a.Decision)
                .HasMaxLength(50);

            builder.Property(a => a.DecisionReason)
                .HasColumnType("text");

            builder.Property(a => a.RequiresSignature)
                .HasDefaultValue(false);

            builder.Property(a => a.DigitalSignature)
                .HasColumnType("text");

            builder.Property(a => a.IsActive)
                .HasDefaultValue(true);

            builder.Property(a => a.IsEscalated)
                .HasDefaultValue(false);

            builder.Property(a => a.EscalationReason)
                .HasColumnType("text");

            builder.Property(a => a.ApprovalData)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'{}'::jsonb");

            builder.Property(a => a.Metadata)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'{}'::jsonb");

            builder.Property(a => a.Tags)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'[]'::jsonb");

            // Relationships
            builder.HasOne(a => a.BoQ)
                .WithMany(b => b.Approvals)
                .HasForeignKey(a => a.BoQId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(a => a.BoQRevision)
                .WithMany()
                .HasForeignKey(a => a.BoQRevisionId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(a => a.AssignedToUser)
                .WithMany(u => u.AssignedBoQApprovals)
                .HasForeignKey(a => a.AssignedTo)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(a => a.ActualApproverUser)
                .WithMany(u => u.CompletedBoQApprovals)
                .HasForeignKey(a => a.ActualApprover)
                .OnDelete(DeleteBehavior.SetNull);

            // Indexes
            builder.HasIndex(a => a.BoQId);
            builder.HasIndex(a => a.AssignedTo);
            builder.HasIndex(a => a.Status);
            builder.HasIndex(a => a.DueDate);
            builder.HasIndex(a => a.IsActive);
            builder.HasIndex(a => a.IsEscalated);
        }
    }

    public class CostCenterConfiguration : IEntityTypeConfiguration<CostCenter>
    {
        public void Configure(EntityTypeBuilder<CostCenter> builder)
        {
            builder.ToTable("cost_centers", "finance");

            builder.HasKey(c => c.Id);

            builder.Property(c => c.CostCenterCode)
                .IsRequired()
                .HasMaxLength(50);

            builder.HasIndex(c => new { c.OrganizationId, c.CostCenterCode })
                .IsUnique();

            builder.Property(c => c.Name)
                .IsRequired()
                .HasMaxLength(255);

            builder.Property(c => c.Description)
                .HasColumnType("text");

            builder.Property(c => c.CostCenterType)
                .HasMaxLength(50);

            builder.Property(c => c.Currency)
                .IsRequired()
                .HasMaxLength(3)
                .HasDefaultValue("USD");

            // Money value objects
            builder.OwnsOne(c => c.BudgetAmount, money =>
            {
                money.Property(m => m.Amount)
                    .HasColumnName("budget_amount")
                    .HasColumnType("decimal(18,2)");
                money.Property(m => m.Currency)
                    .HasColumnName("budget_currency")
                    .HasMaxLength(3);
            });

            builder.OwnsOne(c => c.AllocatedAmount, money =>
            {
                money.Property(m => m.Amount)
                    .HasColumnName("allocated_amount")
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);
                money.Property(m => m.Currency)
                    .HasColumnName("allocated_currency")
                    .HasMaxLength(3);
            });

            builder.OwnsOne(c => c.CommittedAmount, money =>
            {
                money.Property(m => m.Amount)
                    .HasColumnName("committed_amount")
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);
                money.Property(m => m.Currency)
                    .HasColumnName("committed_currency")
                    .HasMaxLength(3);
            });

            builder.OwnsOne(c => c.ActualAmount, money =>
            {
                money.Property(m => m.Amount)
                    .HasColumnName("actual_amount")
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);
                money.Property(m => m.Currency)
                    .HasColumnName("actual_currency")
                    .HasMaxLength(3);
            });

            builder.OwnsOne(c => c.VarianceAmount, money =>
            {
                money.Property(m => m.Amount)
                    .HasColumnName("variance_amount")
                    .HasColumnType("decimal(18,2)")
                    .HasDefaultValue(0);
                money.Property(m => m.Currency)
                    .HasColumnName("variance_currency")
                    .HasMaxLength(3);
            });

            builder.Property(c => c.VariancePercentage)
                .HasColumnType("decimal(5,2)");

            builder.Property(c => c.IsActive)
                .HasDefaultValue(true);

            builder.Property(c => c.ApprovalLevel)
                .HasMaxLength(50);

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
                .WithMany(o => o.CostCenters)
                .HasForeignKey(c => c.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(c => c.Project)
                .WithMany(p => p.CostCenters)
                .HasForeignKey(c => c.ProjectId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(c => c.ParentCostCenter)
                .WithMany(c => c.ChildCostCenters)
                .HasForeignKey(c => c.ParentCostCenterId)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes
            builder.HasIndex(c => c.OrganizationId);
            builder.HasIndex(c => c.ProjectId);
            builder.HasIndex(c => c.ParentCostCenterId);
            builder.HasIndex(c => c.IsActive);
            builder.HasIndex(c => c.CostCenterType);
        }
    }

    public class PricingRuleConfiguration : IEntityTypeConfiguration<PricingRule>
    {
        public void Configure(EntityTypeBuilder<PricingRule> builder)
        {
            builder.ToTable("pricing_rules", "finance");

            builder.HasKey(r => r.Id);

            builder.Property(r => r.RuleCode)
                .IsRequired()
                .HasMaxLength(50);

            builder.HasIndex(r => new { r.OrganizationId, r.RuleCode })
                .IsUnique();

            builder.Property(r => r.Name)
                .IsRequired()
                .HasMaxLength(255);

            builder.Property(r => r.Description)
                .HasColumnType("text");

            builder.Property(r => r.RuleType)
                .IsRequired()
                .HasConversion<string>();

            builder.Property(r => r.Priority)
                .HasDefaultValue(1);

            builder.Property(r => r.IsActive)
                .HasDefaultValue(true);

            builder.Property(r => r.MinQuantity)
                .HasColumnType("decimal(18,6)");

            builder.Property(r => r.MaxQuantity)
                .HasColumnType("decimal(18,6)");

            // Money value objects
            builder.OwnsOne(r => r.MinOrderValue, money =>
            {
                money.Property(m => m.Amount)
                    .HasColumnName("min_order_value")
                    .HasColumnType("decimal(18,2)");
                money.Property(m => m.Currency)
                    .HasColumnName("min_order_currency")
                    .HasMaxLength(3);
            });

            builder.OwnsOne(r => r.MaxOrderValue, money =>
            {
                money.Property(m => m.Amount)
                    .HasColumnName("max_order_value")
                    .HasColumnType("decimal(18,2)");
                money.Property(m => m.Currency)
                    .HasColumnName("max_order_currency")
                    .HasMaxLength(3);
            });

            builder.Property(r => r.CustomerType)
                .HasMaxLength(50);

            builder.Property(r => r.ProjectType)
                .HasMaxLength(100);

            builder.Property(r => r.MaterialType)
                .HasMaxLength(100);

            builder.Property(r => r.RegionCode)
                .HasMaxLength(10);

            // Formula value object
            builder.OwnsOne(r => r.CalculationFormula, formula =>
            {
                formula.Property(f => f.Expression)
                    .HasColumnName("calculation_formula_expression")
                    .HasColumnType("text");
                formula.Property(f => f.Variables)
                    .HasColumnName("calculation_formula_variables")
                    .HasColumnType("jsonb");
                formula.Property(f => f.Description)
                    .HasColumnName("calculation_formula_description")
                    .HasColumnType("text");
                formula.Property(f => f.ValidationRules)
                    .HasColumnName("calculation_formula_validation")
                    .HasColumnType("text");
            });

            builder.Property(r => r.PercentageValue)
                .HasColumnType("decimal(10,6)");

            // Fixed value money object
            builder.OwnsOne(r => r.FixedValue, money =>
            {
                money.Property(m => m.Amount)
                    .HasColumnName("fixed_value")
                    .HasColumnType("decimal(18,2)");
                money.Property(m => m.Currency)
                    .HasColumnName("fixed_value_currency")
                    .HasMaxLength(3);
            });

            builder.Property(r => r.IsCompounding)
                .HasDefaultValue(false);

            builder.Property(r => r.RequiresApproval)
                .HasDefaultValue(false);

            builder.Property(r => r.Conditions)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'{}'::jsonb");

            builder.Property(r => r.Parameters)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'{}'::jsonb");

            builder.Property(r => r.Metadata)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'{}'::jsonb");

            builder.Property(r => r.Tags)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'[]'::jsonb");

            // Soft delete
            builder.Property(r => r.IsDeleted)
                .HasDefaultValue(false);

            builder.HasQueryFilter(r => !r.IsDeleted);

            // Relationships
            builder.HasOne(r => r.Organization)
                .WithMany(o => o.PricingRules)
                .HasForeignKey(r => r.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(r => r.Project)
                .WithMany(p => p.PricingRules)
                .HasForeignKey(r => r.ProjectId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(r => r.MaterialCategory)
                .WithMany()
                .HasForeignKey(r => r.MaterialCategoryId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(r => r.Supplier)
                .WithMany()
                .HasForeignKey(r => r.SupplierId)
                .OnDelete(DeleteBehavior.SetNull);

            // Indexes
            builder.HasIndex(r => r.OrganizationId);
            builder.HasIndex(r => r.ProjectId);
            builder.HasIndex(r => r.RuleType);
            builder.HasIndex(r => r.Priority);
            builder.HasIndex(r => r.IsActive);
            builder.HasIndex(r => r.EffectiveDate);
            builder.HasIndex(r => r.ExpiryDate);
        }
    }

    public class SupplierConfiguration : IEntityTypeConfiguration<Supplier>
    {
        public void Configure(EntityTypeBuilder<Supplier> builder)
        {
            builder.ToTable("suppliers", "supplier");

            builder.HasKey(s => s.Id);

            builder.Property(s => s.SupplierCode)
                .IsRequired()
                .HasMaxLength(50);

            builder.HasIndex(s => new { s.OrganizationId, s.SupplierCode })
                .IsUnique();

            builder.Property(s => s.Name)
                .IsRequired()
                .HasMaxLength(255);

            builder.Property(s => s.LegalName)
                .HasMaxLength(255);

            builder.Property(s => s.TaxId)
                .HasMaxLength(50);

            builder.Property(s => s.RegistrationNumber)
                .HasMaxLength(100);

            builder.Property(s => s.Website)
                .HasMaxLength(255);

            builder.Property(s => s.Industry)
                .HasMaxLength(100);

            builder.Property(s => s.BusinessType)
                .HasMaxLength(100);

            builder.Property(s => s.IsActive)
                .HasDefaultValue(true);

            builder.Property(s => s.IsApproved)
                .HasDefaultValue(false);

            builder.Property(s => s.IsPreferred)
                .HasDefaultValue(false);

            builder.Property(s => s.ApprovalStatus)
                .HasMaxLength(50);

            builder.Property(s => s.PaymentTerms)
                .HasMaxLength(100);

            builder.Property(s => s.ShippingTerms)
                .HasMaxLength(100);

            builder.Property(s => s.Currency)
                .HasMaxLength(3)
                .HasDefaultValue("USD");

            builder.Property(s => s.CreditLimit)
                .HasColumnType("decimal(18,2)");

            builder.Property(s => s.CreditRating)
                .HasMaxLength(20);

            builder.Property(s => s.QualityRating)
                .HasColumnType("decimal(3,2)");

            builder.Property(s => s.DeliveryRating)
                .HasColumnType("decimal(3,2)");

            builder.Property(s => s.ServiceRating)
                .HasColumnType("decimal(3,2)");

            builder.Property(s => s.Notes)
                .HasColumnType("text");

            builder.Property(s => s.ContractNumber)
                .HasMaxLength(100);

            builder.Property(s => s.ContactInfo)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'{}'::jsonb");

            builder.Property(s => s.BillingAddress)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'{}'::jsonb");

            builder.Property(s => s.ShippingAddress)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'{}'::jsonb");

            builder.Property(s => s.BankDetails)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'{}'::jsonb");

            builder.Property(s => s.Certifications)
                .HasColumnType("jsonb")
                .HasDefaultValueSql("'{}'::jsonb");

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
            builder.HasOne(s => s.Organization)
                .WithMany(o => o.Suppliers)
                .HasForeignKey(s => s.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes
            builder.HasIndex(s => s.OrganizationId);
            builder.HasIndex(s => s.Name);
            builder.HasIndex(s => s.IsActive);
            builder.HasIndex(s => s.IsApproved);
            builder.HasIndex(s => s.IsPreferred);
            builder.HasIndex(s => s.Industry);
            builder.HasIndex(s => s.BusinessType);
        }
    }
}