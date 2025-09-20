using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.ValueObjects;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// BoQ Snapshot entity for capturing point-in-time BoQ state
    /// </summary>
    public class BoQSnapshot : BaseEntity
    {
        public Guid BoQId { get; set; }
        public string SnapshotName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string SnapshotType { get; set; } = "Manual"; // Manual, Automatic, Milestone, Approval
        public DateTime SnapshotDate { get; set; } = DateTime.UtcNow;
        public string? Reason { get; set; }
        public Guid? TriggeredBy { get; set; }
        public string? TriggerEvent { get; set; } // Approval, Change Request, etc.
        public Money? TotalCost { get; set; }
        public int ItemCount { get; set; }
        public int SectionCount { get; set; }
        public string? Version { get; set; }
        public string? Revision { get; set; }
        public Dictionary<string, object> BoQData { get; set; } = new(); // Full BoQ snapshot data
        public Dictionary<string, object> Statistics { get; set; } = new(); // Summary statistics
        public Dictionary<string, object> Metadata { get; set; } = new();
        public List<string> Tags { get; set; } = new();

        // Navigation properties
        public virtual BoQ BoQ { get; set; } = null!;
        public virtual User? TriggeredByUser { get; set; }
        public virtual User? CreatedByUser { get; set; }

        /// <summary>
        /// Create snapshot from current BoQ state
        /// </summary>
        public static BoQSnapshot CreateFromBoQ(BoQ boq, string snapshotName, string snapshotType = "Manual",
                                               string? reason = null, Guid? triggeredBy = null, string? triggerEvent = null)
        {
            var snapshot = new BoQSnapshot
            {
                BoQId = boq.Id,
                SnapshotName = snapshotName,
                Description = $"Snapshot of {boq.Name}",
                SnapshotType = snapshotType,
                SnapshotDate = DateTime.UtcNow,
                Reason = reason,
                TriggeredBy = triggeredBy,
                TriggerEvent = triggerEvent,
                TotalCost = boq.GrandTotal,
                ItemCount = boq.Sections.SelectMany(s => s.Items).Count(),
                SectionCount = boq.Sections.Count,
                Version = boq.Revision,
                Revision = boq.Revision
            };

            // Capture current BoQ data
            snapshot.CaptureBoQData(boq);
            snapshot.CalculateStatistics(boq);

            return snapshot;
        }

        /// <summary>
        /// Capture current BoQ data structure
        /// </summary>
        private void CaptureBoQData(BoQ boq)
        {
            BoQData = new Dictionary<string, object>
            {
                ["BoQId"] = boq.Id,
                ["Name"] = boq.Name,
                ["BoQNumber"] = boq.BoQNumber,
                ["Status"] = boq.Status.ToString(),
                ["RevisionType"] = boq.RevisionType.ToString(),
                ["Revision"] = boq.Revision,
                ["Currency"] = boq.Currency,
                ["TotalMaterialCost"] = boq.TotalMaterialCost?.Amount ?? 0,
                ["TotalLaborCost"] = boq.TotalLaborCost?.Amount ?? 0,
                ["TotalEquipmentCost"] = boq.TotalEquipmentCost?.Amount ?? 0,
                ["TotalOverheadCost"] = boq.TotalOverheadCost?.Amount ?? 0,
                ["TotalCost"] = boq.TotalCost?.Amount ?? 0,
                ["GrandTotal"] = boq.GrandTotal?.Amount ?? 0,
                ["ContingencyPercentage"] = boq.ContingencyPercentage ?? 0,
                ["ProfitPercentage"] = boq.ProfitPercentage ?? 0,
                ["Sections"] = CaptureSections(boq.Sections),
                ["Metadata"] = boq.Metadata,
                ["Tags"] = boq.Tags,
                ["SnapshotTimestamp"] = DateTime.UtcNow
            };
        }

        /// <summary>
        /// Capture sections data
        /// </summary>
        private List<Dictionary<string, object>> CaptureSections(ICollection<BoQSection> sections)
        {
            var sectionData = new List<Dictionary<string, object>>();

            foreach (var section in sections)
            {
                var sectionInfo = new Dictionary<string, object>
                {
                    ["Id"] = section.Id,
                    ["SectionCode"] = section.SectionCode,
                    ["Name"] = section.Name,
                    ["Description"] = section.Description,
                    ["CategoryType"] = section.CategoryType.ToString(),
                    ["SortOrder"] = section.SortOrder,
                    ["SectionTotal"] = section.SectionTotal?.Amount ?? 0,
                    ["Items"] = CaptureItems(section.Items),
                    ["Metadata"] = section.Metadata,
                    ["Tags"] = section.Tags
                };

                sectionData.Add(sectionInfo);
            }

            return sectionData;
        }

        /// <summary>
        /// Capture items data
        /// </summary>
        private List<Dictionary<string, object>> CaptureItems(ICollection<BoQItem> items)
        {
            var itemData = new List<Dictionary<string, object>>();

            foreach (var item in items)
            {
                var itemInfo = new Dictionary<string, object>
                {
                    ["Id"] = item.Id,
                    ["ItemCode"] = item.ItemCode,
                    ["Description"] = item.Description,
                    ["Specification"] = item.Specification,
                    ["Unit"] = item.Unit,
                    ["Quantity"] = item.Quantity?.Value ?? 0,
                    ["UnitPrice"] = item.UnitPrice?.Amount ?? 0,
                    ["TotalCost"] = item.TotalCost?.Amount ?? 0,
                    ["CostType"] = item.CostType.ToString(),
                    ["Status"] = item.Status.ToString(),
                    ["Supplier"] = item.Supplier,
                    ["Manufacturer"] = item.Manufacturer,
                    ["ModelNumber"] = item.ModelNumber,
                    ["PartNumber"] = item.PartNumber,
                    ["Category"] = item.Category,
                    ["Notes"] = item.Notes,
                    ["Properties"] = item.Properties,
                    ["Metadata"] = item.Metadata,
                    ["Tags"] = item.Tags
                };

                itemData.Add(itemInfo);
            }

            return itemData;
        }

        /// <summary>
        /// Calculate summary statistics
        /// </summary>
        private void CalculateStatistics(BoQ boq)
        {
            var allItems = boq.Sections.SelectMany(s => s.Items).ToList();

            Statistics = new Dictionary<string, object>
            {
                ["TotalSections"] = boq.Sections.Count,
                ["TotalItems"] = allItems.Count,
                ["ItemsByStatus"] = allItems.GroupBy(i => i.Status)
                    .ToDictionary(g => g.Key.ToString(), g => g.Count()),
                ["ItemsByCostType"] = allItems.GroupBy(i => i.CostType)
                    .ToDictionary(g => g.Key.ToString(), g => g.Count()),
                ["ItemsByCategory"] = allItems.Where(i => !string.IsNullOrEmpty(i.Category))
                    .GroupBy(i => i.Category!)
                    .ToDictionary(g => g.Key, g => g.Count()),
                ["CostBreakdown"] = new Dictionary<string, object>
                {
                    ["Material"] = boq.TotalMaterialCost?.Amount ?? 0,
                    ["Labor"] = boq.TotalLaborCost?.Amount ?? 0,
                    ["Equipment"] = boq.TotalEquipmentCost?.Amount ?? 0,
                    ["Overhead"] = boq.TotalOverheadCost?.Amount ?? 0
                },
                ["PriceRange"] = new Dictionary<string, object>
                {
                    ["MinItemPrice"] = allItems.Where(i => i.UnitPrice?.Amount > 0)
                        .Min(i => i.UnitPrice?.Amount) ?? 0,
                    ["MaxItemPrice"] = allItems.Where(i => i.UnitPrice?.Amount > 0)
                        .Max(i => i.UnitPrice?.Amount) ?? 0,
                    ["AvgItemPrice"] = allItems.Where(i => i.UnitPrice?.Amount > 0)
                        .Average(i => i.UnitPrice?.Amount) ?? 0
                },
                ["Suppliers"] = allItems.Where(i => !string.IsNullOrEmpty(i.Supplier))
                    .Select(i => i.Supplier!)
                    .Distinct()
                    .Count(),
                ["Manufacturers"] = allItems.Where(i => !string.IsNullOrEmpty(i.Manufacturer))
                    .Select(i => i.Manufacturer!)
                    .Distinct()
                    .Count()
            };
        }

        /// <summary>
        /// Compare with another snapshot
        /// </summary>
        public SnapshotComparison CompareWith(BoQSnapshot otherSnapshot)
        {
            return new SnapshotComparison
            {
                BaseSnapshot = this,
                CompareSnapshot = otherSnapshot,
                CostDifference = (TotalCost?.Amount ?? 0) - (otherSnapshot.TotalCost?.Amount ?? 0),
                ItemCountDifference = ItemCount - otherSnapshot.ItemCount,
                SectionCountDifference = SectionCount - otherSnapshot.SectionCount,
                TimeDifference = SnapshotDate - otherSnapshot.SnapshotDate
            };
        }

        /// <summary>
        /// Get snapshot summary
        /// </summary>
        public string GetSummary()
        {
            var summary = $"{SnapshotName} ({SnapshotType}) - {SnapshotDate:yyyy-MM-dd HH:mm}";

            if (TotalCost?.Amount > 0)
                summary += $" - Total: {TotalCost}";

            summary += $" - {ItemCount} items, {SectionCount} sections";

            if (!string.IsNullOrEmpty(Reason))
                summary += $" - {Reason}";

            return summary;
        }

        /// <summary>
        /// Check if snapshot data is complete
        /// </summary>
        public bool IsComplete()
        {
            return BoQData.ContainsKey("Sections") &&
                   BoQData.ContainsKey("SnapshotTimestamp") &&
                   Statistics.Any();
        }
    }

    /// <summary>
    /// Snapshot comparison result model
    /// </summary>
    public class SnapshotComparison
    {
        public BoQSnapshot BaseSnapshot { get; set; } = null!;
        public BoQSnapshot CompareSnapshot { get; set; } = null!;
        public decimal CostDifference { get; set; }
        public int ItemCountDifference { get; set; }
        public int SectionCountDifference { get; set; }
        public TimeSpan TimeDifference { get; set; }

        /// <summary>
        /// Get comparison summary
        /// </summary>
        public string GetSummary()
        {
            var summary = $"Comparison: {BaseSnapshot.SnapshotName} vs {CompareSnapshot.SnapshotName}";

            if (CostDifference != 0)
                summary += $" - Cost: {CostDifference:+0.00;-0.00;0}";

            if (ItemCountDifference != 0)
                summary += $" - Items: {ItemCountDifference:+0;-0;0}";

            if (SectionCountDifference != 0)
                summary += $" - Sections: {SectionCountDifference:+0;-0;0}";

            return summary;
        }
    }
}