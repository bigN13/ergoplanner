using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.Enums;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Material Specification entity for technical specifications
    /// </summary>
    public class MaterialSpecification : BaseEntity
    {
        public Guid MaterialId { get; set; }
        public MaterialSpecificationType SpecificationType { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Value { get; set; } = string.Empty;
        public string? Unit { get; set; }
        public string? MinValue { get; set; }
        public string? MaxValue { get; set; }
        public string? ToleranceType { get; set; } // +/-, %, etc.
        public string? Tolerance { get; set; }
        public bool IsRequired { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public bool IsVerified { get; set; } = false;
        public Guid? VerifiedBy { get; set; }
        public DateTime? VerifiedAt { get; set; }
        public string? TestMethod { get; set; }
        public string? Standard { get; set; } // Reference standard
        public string? CertificateNumber { get; set; }
        public DateTime? CertificateDate { get; set; }
        public DateTime? CertificateExpiry { get; set; }
        public string? TestLabName { get; set; }
        public string? DocumentUrl { get; set; }
        public int SortOrder { get; set; }
        public Dictionary<string, object> Metadata { get; set; } = new();
        public List<string> Tags { get; set; } = new();

        // Navigation properties
        public virtual Material Material { get; set; } = null!;
        public virtual User? CreatedByUser { get; set; }
        public virtual User? UpdatedByUser { get; set; }
        public virtual User? VerifiedByUser { get; set; }

        /// <summary>
        /// Check if specification value is within acceptable range
        /// </summary>
        public bool IsValueInRange(string testValue)
        {
            if (string.IsNullOrEmpty(MinValue) && string.IsNullOrEmpty(MaxValue))
                return true;

            if (!decimal.TryParse(testValue, out var value))
                return false;

            if (!string.IsNullOrEmpty(MinValue) && decimal.TryParse(MinValue, out var min))
            {
                if (value < min) return false;
            }

            if (!string.IsNullOrEmpty(MaxValue) && decimal.TryParse(MaxValue, out var max))
            {
                if (value > max) return false;
            }

            return true;
        }

        /// <summary>
        /// Check if specification meets requirements
        /// </summary>
        public bool MeetsRequirement(string requiredValue, string? requiredTolerance = null)
        {
            if (Value == requiredValue)
                return true;

            // If tolerance is specified, check if within tolerance
            if (!string.IsNullOrEmpty(requiredTolerance) &&
                decimal.TryParse(Value, out var actualValue) &&
                decimal.TryParse(requiredValue, out var reqValue))
            {
                if (decimal.TryParse(requiredTolerance.Replace("%", ""), out var tolerance))
                {
                    var allowableVariation = reqValue * tolerance / 100;
                    return Math.Abs(actualValue - reqValue) <= allowableVariation;
                }
            }

            return false;
        }

        /// <summary>
        /// Verify specification with certificate
        /// </summary>
        public void Verify(Guid verifiedByUserId, string? certificateNumber = null,
                          DateTime? certificateDate = null, string? testLabName = null)
        {
            IsVerified = true;
            VerifiedBy = verifiedByUserId;
            VerifiedAt = DateTime.UtcNow;

            if (!string.IsNullOrEmpty(certificateNumber))
                CertificateNumber = certificateNumber;

            if (certificateDate.HasValue)
                CertificateDate = certificateDate;

            if (!string.IsNullOrEmpty(testLabName))
                TestLabName = testLabName;
        }

        /// <summary>
        /// Check if certificate is valid
        /// </summary>
        public bool IsCertificateValid()
        {
            if (!IsVerified || string.IsNullOrEmpty(CertificateNumber))
                return false;

            return CertificateExpiry == null || CertificateExpiry > DateTime.UtcNow;
        }

        /// <summary>
        /// Get formatted specification value with unit
        /// </summary>
        public string GetFormattedValue()
        {
            var formattedValue = Value;

            if (!string.IsNullOrEmpty(Tolerance))
            {
                formattedValue += $" ±{Tolerance}";
                if (ToleranceType == "%")
                    formattedValue += "%";
            }

            if (!string.IsNullOrEmpty(Unit))
                formattedValue += $" {Unit}";

            return formattedValue;
        }

        /// <summary>
        /// Get specification summary for reporting
        /// </summary>
        public string GetSummary()
        {
            var summary = $"{Name}: {GetFormattedValue()}";

            if (!string.IsNullOrEmpty(Standard))
                summary += $" ({Standard})";

            if (IsVerified && !string.IsNullOrEmpty(CertificateNumber))
                summary += $" [Cert: {CertificateNumber}]";

            return summary;
        }
    }
}