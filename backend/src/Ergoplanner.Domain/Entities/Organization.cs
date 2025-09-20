using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Organization entity representing companies using the system
    /// </summary>
    public class Organization : BaseEntity, ISoftDelete
    {
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Industry { get; set; }
        public string? Website { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public Dictionary<string, object> Address { get; set; } = new();
        public string? TaxId { get; set; }
        public string? RegistrationNumber { get; set; }
        public int MaxUsers { get; set; } = 10;
        public int MaxProjects { get; set; } = 5;
        public Dictionary<string, object> Settings { get; set; } = new();
        public List<string> Features { get; set; } = new();
        public bool IsActive { get; set; } = true;
        public DateTime? SubscriptionExpiry { get; set; }
        public string SubscriptionTier { get; set; } = "free";

        // Soft delete
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }
        public Guid? DeletedBy { get; set; }

        // Navigation properties
        public virtual ICollection<User> Users { get; set; } = new List<User>();
        public virtual ICollection<Project> Projects { get; set; } = new List<Project>();
        public virtual ICollection<Team> Teams { get; set; } = new List<Team>();
        public virtual ICollection<OrganizationBranch> Branches { get; set; } = new List<OrganizationBranch>();
        public virtual ICollection<BoQ> BoQs { get; set; } = new List<BoQ>();
        public virtual ICollection<BoQTemplate> BoQTemplates { get; set; } = new List<BoQTemplate>();
        public virtual ICollection<Material> Materials { get; set; } = new List<Material>();
        public virtual ICollection<MaterialCategory> MaterialCategories { get; set; } = new List<MaterialCategory>();
        public virtual ICollection<Supplier> Suppliers { get; set; } = new List<Supplier>();
        public virtual ICollection<CostCenter> CostCenters { get; set; } = new List<CostCenter>();
        public virtual ICollection<PricingRule> PricingRules { get; set; } = new List<PricingRule>();
        public virtual ICollection<CurrencyRate> CurrencyRates { get; set; } = new List<CurrencyRate>();
        public virtual ICollection<ERPIntegration> ERPIntegrations { get; set; } = new List<ERPIntegration>();
        public virtual ICollection<ReportTemplate> ReportTemplates { get; set; } = new List<ReportTemplate>();
    }

    /// <summary>
    /// Organization branch entity for multi-location support
    /// </summary>
    public class OrganizationBranch : BaseEntity
    {
        public Guid OrganizationId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public Dictionary<string, object> Address { get; set; } = new();
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public bool IsHeadquarters { get; set; } = false;
        public bool IsActive { get; set; } = true;

        // Navigation properties
        public virtual Organization Organization { get; set; } = null!;
    }
}