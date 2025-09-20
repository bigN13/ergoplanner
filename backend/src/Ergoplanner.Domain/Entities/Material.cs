using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.Enums;
using Ergoplanner.Domain.ValueObjects;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Material master data entity
    /// </summary>
    public class Material : BaseEntity, IOrganizationScoped, ISoftDelete
    {
        public Guid OrganizationId { get; set; }
        public Guid CategoryId { get; set; }
        public string MaterialCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ShortDescription { get; set; }
        public MaterialCategoryType CategoryType { get; set; }
        public string? Manufacturer { get; set; }
        public string? ModelNumber { get; set; }
        public string? PartNumber { get; set; }
        public string? SKU { get; set; }
        public string? GTIN { get; set; } // Global Trade Item Number
        public string? HSCode { get; set; } // Harmonized System Code
        public string BaseUnit { get; set; } = "ea";
        public UnitOfMeasurement UnitOfMeasurement { get; set; } = UnitOfMeasurement.Each;
        public decimal? Weight { get; set; }
        public string? WeightUnit { get; set; } = "kg";
        public Dimensions? Dimensions { get; set; }
        public string? Color { get; set; }
        public string? MaterialComposition { get; set; } // Material composition
        public string? Grade { get; set; }
        public string? Standard { get; set; } // Industry standard (ISO, ANSI, etc.)
        public string? Certification { get; set; }
        public decimal? MinOrderQuantity { get; set; }
        public decimal? MaxOrderQuantity { get; set; }
        public LeadTime? StandardLeadTime { get; set; }
        public decimal? ShelfLife { get; set; } // In days
        public bool RequiresSpecialHandling { get; set; } = false;
        public bool IsHazardous { get; set; } = false;
        public string? HazardClass { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsStocked { get; set; } = true;
        public DateTime? DiscontinuedDate { get; set; }
        public string? ReplacementMaterialId { get; set; }
        public string? ImageUrl { get; set; }
        public string? DatasheetUrl { get; set; }
        public string? CertificateUrl { get; set; }
        public Dictionary<string, object> TechnicalProperties { get; set; } = new();
        public Dictionary<string, object> Metadata { get; set; } = new();
        public List<string> Tags { get; set; } = new();

        // Soft delete
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }
        public Guid? DeletedBy { get; set; }

        // Navigation properties
        public virtual Organization Organization { get; set; } = null!;
        public virtual MaterialCategory Category { get; set; } = null!;
        public virtual ICollection<MaterialSpecification> Specifications { get; set; } = new List<MaterialSpecification>();
        public virtual ICollection<MaterialSupplier> Suppliers { get; set; } = new List<MaterialSupplier>();
        public virtual ICollection<MaterialPricing> PricingHistory { get; set; } = new List<MaterialPricing>();
        public virtual ICollection<BoQItem> BoQItems { get; set; } = new List<BoQItem>();
        public virtual ICollection<BoQTemplateItem> TemplateItems { get; set; } = new List<BoQTemplateItem>();
        public virtual ICollection<MaterialEquivalent> EquivalentMaterials { get; set; } = new List<MaterialEquivalent>();
        public virtual ICollection<MaterialEquivalent> SourceMaterials { get; set; } = new List<MaterialEquivalent>();
        public virtual User? CreatedByUser { get; set; }
        public virtual User? UpdatedByUser { get; set; }
        public virtual User? DeletedByUser { get; set; }

        /// <summary>
        /// Get current supplier pricing
        /// </summary>
        public MaterialPricing? GetCurrentPricing(Guid? supplierId = null)
        {
            var activePricing = PricingHistory
                .Where(p => p.IsActive &&
                           p.EffectiveDate <= DateTime.UtcNow &&
                           (p.ExpiryDate == null || p.ExpiryDate > DateTime.UtcNow))
                .OrderByDescending(p => p.EffectiveDate);

            if (supplierId.HasValue)
            {
                return activePricing.FirstOrDefault(p => p.SupplierId == supplierId);
            }

            return activePricing.FirstOrDefault();
        }

        /// <summary>
        /// Get primary supplier
        /// </summary>
        public MaterialSupplier? GetPrimarySupplier()
        {
            return Suppliers
                .Where(s => s.IsActive && s.IsPrimary)
                .OrderBy(s => s.Priority)
                .FirstOrDefault();
        }

        /// <summary>
        /// Get specification value by type
        /// </summary>
        public string? GetSpecificationValue(MaterialSpecificationType type)
        {
            return Specifications
                .FirstOrDefault(s => s.SpecificationType == type && s.IsActive)?
                .Value;
        }

        /// <summary>
        /// Check if material is available for ordering
        /// </summary>
        public bool IsAvailable()
        {
            return IsActive &&
                   !IsDeleted &&
                   !DiscontinuedDate.HasValue &&
                   Suppliers.Any(s => s.IsActive);
        }

        /// <summary>
        /// Calculate lead time considering all suppliers
        /// </summary>
        public LeadTime? CalculateOptimalLeadTime()
        {
            var activeSuppliers = Suppliers.Where(s => s.IsActive).ToList();

            if (!activeSuppliers.Any())
                return StandardLeadTime;

            var minLeadTime = activeSuppliers
                .Where(s => s.LeadTime != null)
                .Min(s => s.LeadTime!.Days);

            return minLeadTime > 0
                ? new LeadTime(minLeadTime, false)
                : StandardLeadTime;
        }

        /// <summary>
        /// Get best price from all suppliers
        /// </summary>
        public Money? GetBestPrice(decimal quantity = 1)
        {
            var pricing = PricingHistory
                .Where(p => p.IsActive &&
                           p.EffectiveDate <= DateTime.UtcNow &&
                           (p.ExpiryDate == null || p.ExpiryDate > DateTime.UtcNow) &&
                           (p.MinQuantity == null || p.MinQuantity <= quantity) &&
                           (p.MaxQuantity == null || p.MaxQuantity >= quantity))
                .OrderBy(p => p.UnitPrice?.Amount)
                .FirstOrDefault();

            return pricing?.UnitPrice;
        }

        /// <summary>
        /// Discontinue material
        /// </summary>
        public void Discontinue(string? replacementMaterialId = null)
        {
            IsActive = false;
            DiscontinuedDate = DateTime.UtcNow;
            ReplacementMaterialId = replacementMaterialId;
        }
    }
}