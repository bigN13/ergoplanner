using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.Enums;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Project entity representing engineering projects
    /// </summary>
    public class Project : BaseEntity, IOrganizationScoped, ISoftDelete
    {
        public Guid OrganizationId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ProjectType { get; set; }
        public ProjectStatus Status { get; set; } = ProjectStatus.Planning;
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public decimal? Budget { get; set; }
        public string Currency { get; set; } = "USD";
        public string? ClientName { get; set; }
        public Dictionary<string, object> ClientContact { get; set; } = new();
        public Dictionary<string, object> Metadata { get; set; } = new();
        public List<string> Tags { get; set; } = new();
        public bool IsArchived { get; set; } = false;

        // Soft delete
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }
        public Guid? DeletedBy { get; set; }

        // Navigation properties
        public virtual Organization Organization { get; set; } = null!;
        public virtual ICollection<Team> Teams { get; set; } = new List<Team>();
        public virtual ICollection<Drawing> Drawings { get; set; } = new List<Drawing>();
        public virtual ICollection<BoQ> BoQs { get; set; } = new List<BoQ>();
        public virtual ICollection<BoQItem> BoQItems { get; set; } = new List<BoQItem>();
        public virtual ICollection<CostCenter> CostCenters { get; set; } = new List<CostCenter>();
        public virtual ICollection<PricingRule> PricingRules { get; set; } = new List<PricingRule>();
        public virtual User? CreatedByUser { get; set; }
        public virtual User? UpdatedByUser { get; set; }
    }
}