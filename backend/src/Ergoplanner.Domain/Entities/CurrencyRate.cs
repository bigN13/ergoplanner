using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.Enums;
using Ergoplanner.Domain.ValueObjects;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Currency Rate entity for multi-currency support
    /// </summary>
    public class CurrencyRate : BaseEntity, IOrganizationScoped
    {
        public Guid OrganizationId { get; set; }
        public string FromCurrency { get; set; } = string.Empty;
        public string ToCurrency { get; set; } = string.Empty;
        public decimal Rate { get; set; }
        public decimal? BidRate { get; set; }
        public decimal? AskRate { get; set; }
        public DateTime EffectiveDate { get; set; } = DateTime.UtcNow;
        public DateTime? ExpiryDate { get; set; }
        public string? Source { get; set; } // Manual, API, Bank, etc.
        public string? SourceReference { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsDefault { get; set; } = false;
        public string? Notes { get; set; }
        public Dictionary<string, object> Metadata { get; set; } = new();

        // Navigation properties
        public virtual Organization Organization { get; set; } = null!;
        public virtual ICollection<CurrencyConversion> Conversions { get; set; } = new List<CurrencyConversion>();
        public virtual User? CreatedByUser { get; set; }
        public virtual User? UpdatedByUser { get; set; }

        /// <summary>
        /// Check if rate is currently valid
        /// </summary>
        public bool IsCurrentlyValid()
        {
            if (!IsActive) return false;

            var now = DateTime.UtcNow;
            if (EffectiveDate > now) return false;
            if (ExpiryDate.HasValue && ExpiryDate <= now) return false;

            return true;
        }

        /// <summary>
        /// Convert amount using this rate
        /// </summary>
        public Money Convert(Money amount)
        {
            if (amount.Currency != FromCurrency)
                throw new ArgumentException($"Amount currency {amount.Currency} does not match rate from currency {FromCurrency}");

            var convertedAmount = amount.Amount * Rate;
            return new Money(convertedAmount, ToCurrency);
        }

        /// <summary>
        /// Convert amount using bid/ask spread
        /// </summary>
        public Money Convert(Money amount, bool useBidRate = false)
        {
            if (amount.Currency != FromCurrency)
                throw new ArgumentException($"Amount currency {amount.Currency} does not match rate from currency {FromCurrency}");

            var rateToUse = useBidRate && BidRate.HasValue ? BidRate.Value :
                           (!useBidRate && AskRate.HasValue ? AskRate.Value : Rate);

            var convertedAmount = amount.Amount * rateToUse;
            return new Money(convertedAmount, ToCurrency);
        }

        /// <summary>
        /// Get spread percentage
        /// </summary>
        public decimal? GetSpreadPercentage()
        {
            if (!BidRate.HasValue || !AskRate.HasValue) return null;

            var spread = AskRate.Value - BidRate.Value;
            var midRate = (BidRate.Value + AskRate.Value) / 2;

            return (spread / midRate) * 100;
        }

        /// <summary>
        /// Check if rate is stale
        /// </summary>
        public bool IsStale(int hoursThreshold = 24)
        {
            return (DateTime.UtcNow - EffectiveDate).TotalHours > hoursThreshold;
        }

        /// <summary>
        /// Update rate
        /// </summary>
        public void UpdateRate(decimal newRate, string? source = null, decimal? bidRate = null, decimal? askRate = null)
        {
            Rate = newRate;
            BidRate = bidRate;
            AskRate = askRate;
            EffectiveDate = DateTime.UtcNow;
            Source = source ?? Source;
            UpdatedAt = DateTime.UtcNow;
        }

        /// <summary>
        /// Create inverse rate
        /// </summary>
        public CurrencyRate CreateInverseRate()
        {
            return new CurrencyRate
            {
                OrganizationId = OrganizationId,
                FromCurrency = ToCurrency,
                ToCurrency = FromCurrency,
                Rate = 1 / Rate,
                BidRate = AskRate.HasValue ? 1 / AskRate.Value : null,
                AskRate = BidRate.HasValue ? 1 / BidRate.Value : null,
                EffectiveDate = EffectiveDate,
                ExpiryDate = ExpiryDate,
                Source = Source,
                SourceReference = SourceReference,
                IsActive = IsActive,
                Notes = $"Inverse of {FromCurrency}/{ToCurrency}"
            };
        }

        /// <summary>
        /// Record conversion usage
        /// </summary>
        public void RecordConversion(Money fromAmount, Money toAmount, Guid? referenceId = null, string? referenceType = null)
        {
            var conversion = new CurrencyConversion
            {
                CurrencyRateId = Id,
                FromAmount = fromAmount,
                ToAmount = toAmount,
                ConversionDate = DateTime.UtcNow,
                RateUsed = Rate,
                ReferenceId = referenceId,
                ReferenceType = referenceType
            };

            Conversions.Add(conversion);
        }

        /// <summary>
        /// Get currency pair string
        /// </summary>
        public string GetCurrencyPair()
        {
            return $"{FromCurrency}/{ToCurrency}";
        }

        /// <summary>
        /// Validate currency codes
        /// </summary>
        public bool IsValidCurrencyPair()
        {
            return !string.IsNullOrEmpty(FromCurrency) &&
                   !string.IsNullOrEmpty(ToCurrency) &&
                   FromCurrency != ToCurrency &&
                   FromCurrency.Length == 3 &&
                   ToCurrency.Length == 3;
        }
    }

    /// <summary>
    /// Currency conversion tracking entity
    /// </summary>
    public class CurrencyConversion : BaseEntity
    {
        public Guid CurrencyRateId { get; set; }
        public Money? FromAmount { get; set; }
        public Money? ToAmount { get; set; }
        public DateTime ConversionDate { get; set; } = DateTime.UtcNow;
        public decimal RateUsed { get; set; }
        public Guid? ReferenceId { get; set; } // BoQ item, invoice, etc.
        public string? ReferenceType { get; set; }
        public Dictionary<string, object> Metadata { get; set; } = new();

        // Navigation properties
        public virtual CurrencyRate CurrencyRate { get; set; } = null!;
    }
}