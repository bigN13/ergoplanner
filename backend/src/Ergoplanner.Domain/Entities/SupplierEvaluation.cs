using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Supplier Evaluation entity for periodic supplier performance assessment
    /// </summary>
    public class SupplierEvaluation : BaseEntity
    {
        public Guid SupplierId { get; set; }
        public string EvaluationPeriod { get; set; } = string.Empty; // Q1 2024, Annual 2024, etc.
        public DateTime EvaluationDate { get; set; } = DateTime.UtcNow;
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
        public Guid EvaluatedBy { get; set; }
        public decimal? QualityScore { get; set; } // 1-5 or 1-10 scale
        public decimal? DeliveryScore { get; set; }
        public decimal? ServiceScore { get; set; }
        public decimal? PriceScore { get; set; }
        public decimal? OverallScore { get; set; }
        public string? QualityComments { get; set; }
        public string? DeliveryComments { get; set; }
        public string? ServiceComments { get; set; }
        public string? PriceComments { get; set; }
        public string? OverallComments { get; set; }
        public string? Recommendations { get; set; }
        public string? ActionItems { get; set; }
        public bool IsApproved { get; set; } = false;
        public Guid? ApprovedBy { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public Dictionary<string, object> Metrics { get; set; } = new(); // Detailed metrics
        public Dictionary<string, object> Metadata { get; set; } = new();

        // Navigation properties
        public virtual Supplier Supplier { get; set; } = null!;
        public virtual User EvaluatedByUser { get; set; } = null!;
        public virtual User? ApprovedByUser { get; set; }
        public virtual User? CreatedByUser { get; set; }
        public virtual User? UpdatedByUser { get; set; }

        /// <summary>
        /// Calculate overall score
        /// </summary>
        public void CalculateOverallScore()
        {
            var scores = new List<decimal>();

            if (QualityScore.HasValue) scores.Add(QualityScore.Value);
            if (DeliveryScore.HasValue) scores.Add(DeliveryScore.Value);
            if (ServiceScore.HasValue) scores.Add(ServiceScore.Value);
            if (PriceScore.HasValue) scores.Add(PriceScore.Value);

            OverallScore = scores.Any() ? scores.Average() : null;
        }

        /// <summary>
        /// Get performance category
        /// </summary>
        public string GetPerformanceCategory()
        {
            if (!OverallScore.HasValue) return "Not Evaluated";

            return OverallScore.Value switch
            {
                >= 4.5m => "Excellent",
                >= 3.5m => "Good",
                >= 2.5m => "Satisfactory",
                >= 1.5m => "Needs Improvement",
                _ => "Poor"
            };
        }

        /// <summary>
        /// Approve evaluation
        /// </summary>
        public void Approve(Guid approvedByUserId)
        {
            IsApproved = true;
            ApprovedBy = approvedByUserId;
            ApprovedAt = DateTime.UtcNow;
        }
    }
}