using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.Enums;
using Ergoplanner.Domain.ValueObjects;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Pricing Rule entity for automated pricing calculations
    /// </summary>
    public class PricingRule : BaseEntity, IOrganizationScoped, ISoftDelete
    {
        public Guid OrganizationId { get; set; }
        public Guid? ProjectId { get; set; }
        public Guid? MaterialCategoryId { get; set; }
        public Guid? SupplierId { get; set; }
        public string RuleCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public PricingRuleType RuleType { get; set; }
        public int Priority { get; set; } = 1; // 1 = highest priority
        public bool IsActive { get; set; } = true;
        public DateTime EffectiveDate { get; set; } = DateTime.UtcNow;
        public DateTime? ExpiryDate { get; set; }
        public decimal? MinQuantity { get; set; }
        public decimal? MaxQuantity { get; set; }
        public Money? MinOrderValue { get; set; }
        public Money? MaxOrderValue { get; set; }
        public string? CustomerType { get; set; } // Preferred, Standard, etc.
        public string? ProjectType { get; set; }
        public string? MaterialType { get; set; }
        public string? RegionCode { get; set; }
        public Formula? CalculationFormula { get; set; }
        public decimal? PercentageValue { get; set; } // For percentage-based rules
        public Money? FixedValue { get; set; } // For fixed amount rules
        public bool IsCompounding { get; set; } = false; // Can combine with other rules
        public bool RequiresApproval { get; set; } = false;
        public Dictionary<string, object> Conditions { get; set; } = new(); // Additional conditions
        public Dictionary<string, object> Parameters { get; set; } = new(); // Rule parameters
        public Dictionary<string, object> Metadata { get; set; } = new();
        public List<string> Tags { get; set; } = new();

        // Soft delete
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }
        public Guid? DeletedBy { get; set; }

        // Navigation properties
        public virtual Organization Organization { get; set; } = null!;
        public virtual Project? Project { get; set; }
        public virtual MaterialCategory? MaterialCategory { get; set; }
        public virtual Supplier? Supplier { get; set; }
        public virtual ICollection<PricingRuleApplication> Applications { get; set; } = new List<PricingRuleApplication>();
        public virtual User? CreatedByUser { get; set; }
        public virtual User? UpdatedByUser { get; set; }
        public virtual User? DeletedByUser { get; set; }

        /// <summary>
        /// Check if rule is currently valid
        /// </summary>
        public bool IsCurrentlyValid()
        {
            if (!IsActive || IsDeleted) return false;

            var now = DateTime.UtcNow;
            if (EffectiveDate > now) return false;
            if (ExpiryDate.HasValue && ExpiryDate <= now) return false;

            return true;
        }

        /// <summary>
        /// Check if rule applies to given context
        /// </summary>
        public bool AppliesTo(PricingContext context)
        {
            if (!IsCurrentlyValid()) return false;

            // Check quantity constraints
            if (MinQuantity.HasValue && context.Quantity < MinQuantity) return false;
            if (MaxQuantity.HasValue && context.Quantity > MaxQuantity) return false;

            // Check order value constraints
            if (MinOrderValue != null && context.OrderValue != null)
            {
                if (context.OrderValue.Amount < MinOrderValue.Amount) return false;
            }
            if (MaxOrderValue != null && context.OrderValue != null)
            {
                if (context.OrderValue.Amount > MaxOrderValue.Amount) return false;
            }

            // Check project constraints
            if (ProjectId.HasValue && context.ProjectId != ProjectId) return false;

            // Check material category constraints
            if (MaterialCategoryId.HasValue && context.MaterialCategoryId != MaterialCategoryId) return false;

            // Check supplier constraints
            if (SupplierId.HasValue && context.SupplierId != SupplierId) return false;

            // Check other constraints
            if (!string.IsNullOrEmpty(CustomerType) && context.CustomerType != CustomerType) return false;
            if (!string.IsNullOrEmpty(ProjectType) && context.ProjectType != ProjectType) return false;
            if (!string.IsNullOrEmpty(MaterialType) && context.MaterialType != MaterialType) return false;
            if (!string.IsNullOrEmpty(RegionCode) && context.RegionCode != RegionCode) return false;

            // Check additional conditions
            foreach (var condition in Conditions)
            {
                if (!EvaluateCondition(condition.Key, condition.Value, context))
                    return false;
            }

            return true;
        }

        /// <summary>
        /// Calculate pricing adjustment
        /// </summary>
        public Money? CalculateAdjustment(Money basePrice, PricingContext context)
        {
            if (!AppliesTo(context)) return null;

            switch (RuleType)
            {
                case PricingRuleType.Markup:
                    return CalculateMarkup(basePrice);

                case PricingRuleType.Discount:
                    return CalculateDiscount(basePrice);

                case PricingRuleType.VolumeDiscount:
                    return CalculateVolumeDiscount(basePrice, context.Quantity);

                case PricingRuleType.EarlyPaymentDiscount:
                    return CalculateEarlyPaymentDiscount(basePrice, context);

                case PricingRuleType.SeasonalAdjustment:
                    return CalculateSeasonalAdjustment(basePrice);

                case PricingRuleType.RiskPremium:
                    return CalculateRiskPremium(basePrice, context);

                case PricingRuleType.LocationAdjustment:
                    return CalculateLocationAdjustment(basePrice, context);

                default:
                    return null;
            }
        }

        /// <summary>
        /// Calculate markup
        /// </summary>
        private Money? CalculateMarkup(Money basePrice)
        {
            if (PercentageValue.HasValue)
            {
                var markupAmount = basePrice.Amount * (PercentageValue.Value / 100);
                return new Money(markupAmount, basePrice.Currency);
            }

            if (FixedValue != null)
            {
                return FixedValue;
            }

            return null;
        }

        /// <summary>
        /// Calculate discount
        /// </summary>
        private Money? CalculateDiscount(Money basePrice)
        {
            if (PercentageValue.HasValue)
            {
                var discountAmount = basePrice.Amount * (PercentageValue.Value / 100);
                return new Money(-discountAmount, basePrice.Currency);
            }

            if (FixedValue != null)
            {
                return new Money(-FixedValue.Amount, FixedValue.Currency);
            }

            return null;
        }

        /// <summary>
        /// Calculate volume discount
        /// </summary>
        private Money? CalculateVolumeDiscount(Money basePrice, decimal quantity)
        {
            // Volume discount typically increases with quantity
            var baseDiscount = PercentageValue ?? 0;

            // Apply additional discount based on quantity tiers
            if (Parameters.ContainsKey("QuantityTiers"))
            {
                var tiers = (Dictionary<string, object>)Parameters["QuantityTiers"];
                foreach (var tier in tiers.OrderByDescending(t => decimal.Parse(t.Key)))
                {
                    if (quantity >= decimal.Parse(tier.Key))
                    {
                        baseDiscount = decimal.Parse(tier.Value.ToString()!);
                        break;
                    }
                }
            }

            if (baseDiscount > 0)
            {
                var discountAmount = basePrice.Amount * (baseDiscount / 100);
                return new Money(-discountAmount, basePrice.Currency);
            }

            return null;
        }

        /// <summary>
        /// Calculate early payment discount
        /// </summary>
        private Money? CalculateEarlyPaymentDiscount(Money basePrice, PricingContext context)
        {
            if (PercentageValue.HasValue && context.PaymentTerms != null)
            {
                // Check if payment terms qualify for early payment discount
                if (context.PaymentTerms.Contains("NET15") || context.PaymentTerms.Contains("NET10"))
                {
                    var discountAmount = basePrice.Amount * (PercentageValue.Value / 100);
                    return new Money(-discountAmount, basePrice.Currency);
                }
            }

            return null;
        }

        /// <summary>
        /// Calculate seasonal adjustment
        /// </summary>
        private Money? CalculateSeasonalAdjustment(Money basePrice)
        {
            // Seasonal adjustments based on current month
            var currentMonth = DateTime.UtcNow.Month;

            if (Parameters.ContainsKey("SeasonalFactors"))
            {
                var factors = (Dictionary<string, object>)Parameters["SeasonalFactors"];
                if (factors.ContainsKey(currentMonth.ToString()))
                {
                    var factor = decimal.Parse(factors[currentMonth.ToString()].ToString()!);
                    var adjustmentAmount = basePrice.Amount * (factor / 100);
                    return new Money(adjustmentAmount, basePrice.Currency);
                }
            }

            return null;
        }

        /// <summary>
        /// Calculate risk premium
        /// </summary>
        private Money? CalculateRiskPremium(Money basePrice, PricingContext context)
        {
            if (PercentageValue.HasValue)
            {
                // Risk premium can be based on various factors
                var riskMultiplier = 1.0m;

                if (context.IsRushOrder) riskMultiplier += 0.5m;
                if (context.IsCustomMaterial) riskMultiplier += 0.3m;
                if (context.IsHazardousMaterial) riskMultiplier += 0.2m;

                var premiumAmount = basePrice.Amount * (PercentageValue.Value / 100) * riskMultiplier;
                return new Money(premiumAmount, basePrice.Currency);
            }

            return null;
        }

        /// <summary>
        /// Calculate location adjustment
        /// </summary>
        private Money? CalculateLocationAdjustment(Money basePrice, PricingContext context)
        {
            if (!string.IsNullOrEmpty(context.RegionCode) && Parameters.ContainsKey("RegionFactors"))
            {
                var factors = (Dictionary<string, object>)Parameters["RegionFactors"];
                if (factors.ContainsKey(context.RegionCode))
                {
                    var factor = decimal.Parse(factors[context.RegionCode].ToString()!);
                    var adjustmentAmount = basePrice.Amount * (factor / 100);
                    return new Money(adjustmentAmount, basePrice.Currency);
                }
            }

            return null;
        }

        /// <summary>
        /// Evaluate custom conditions
        /// </summary>
        private bool EvaluateCondition(string conditionName, object conditionValue, PricingContext context)
        {
            // This would implement custom condition evaluation logic
            // For now, return true for any condition
            return true;
        }

        /// <summary>
        /// Record rule application
        /// </summary>
        public void RecordApplication(Guid boqItemId, Money adjustmentAmount, string? notes = null)
        {
            var application = new PricingRuleApplication
            {
                PricingRuleId = Id,
                BoQItemId = boqItemId,
                AdjustmentAmount = adjustmentAmount,
                ApplicationDate = DateTime.UtcNow,
                Notes = notes
            };

            Applications.Add(application);
        }
    }

    /// <summary>
    /// Pricing context for rule evaluation
    /// </summary>
    public class PricingContext
    {
        public Guid? ProjectId { get; set; }
        public Guid? MaterialCategoryId { get; set; }
        public Guid? SupplierId { get; set; }
        public decimal Quantity { get; set; }
        public Money? OrderValue { get; set; }
        public string? CustomerType { get; set; }
        public string? ProjectType { get; set; }
        public string? MaterialType { get; set; }
        public string? RegionCode { get; set; }
        public string? PaymentTerms { get; set; }
        public bool IsRushOrder { get; set; }
        public bool IsCustomMaterial { get; set; }
        public bool IsHazardousMaterial { get; set; }
        public Dictionary<string, object> AdditionalProperties { get; set; } = new();
    }
}