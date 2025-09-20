using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.Enums;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Report Template entity for customizable report layouts
    /// </summary>
    public class ReportTemplate : BaseEntity, IOrganizationScoped, ISoftDelete
    {
        public Guid OrganizationId { get; set; }
        public string TemplateName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string ReportType { get; set; } = string.Empty; // BoQ, Material List, Cost Summary, etc.
        public BoQExportFormat OutputFormat { get; set; }
        public bool IsSystem { get; set; } = false; // System templates cannot be deleted
        public bool IsPublic { get; set; } = false;
        public bool IsDefault { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public string? Category { get; set; }
        public string? Industry { get; set; }
        public string? Version { get; set; } = "1.0";
        public int UsageCount { get; set; } = 0;
        public decimal? Rating { get; set; }
        public Dictionary<string, object> Layout { get; set; } = new(); // Report layout configuration
        public Dictionary<string, object> Columns { get; set; } = new(); // Column definitions
        public Dictionary<string, object> Formatting { get; set; } = new(); // Formatting rules
        public Dictionary<string, object> FilterOptions { get; set; } = new(); // Available filters
        public Dictionary<string, object> GroupingOptions { get; set; } = new(); // Grouping options
        public Dictionary<string, object> SortingOptions { get; set; } = new(); // Sorting options
        public Dictionary<string, object> HeaderSettings { get; set; } = new(); // Header configuration
        public Dictionary<string, object> FooterSettings { get; set; } = new(); // Footer configuration
        public Dictionary<string, object> PageSettings { get; set; } = new(); // Page size, margins, etc.
        public Dictionary<string, object> StyleSettings { get; set; } = new(); // Colors, fonts, etc.
        public Dictionary<string, object> Metadata { get; set; } = new();
        public List<string> Tags { get; set; } = new();

        // Soft delete
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }
        public Guid? DeletedBy { get; set; }

        // Navigation properties
        public virtual Organization Organization { get; set; } = null!;
        public virtual ICollection<BoQExport> BoQExports { get; set; } = new List<BoQExport>();
        public virtual ICollection<ReportTemplateFeedback> Feedback { get; set; } = new List<ReportTemplateFeedback>();
        public virtual User? CreatedByUser { get; set; }
        public virtual User? UpdatedByUser { get; set; }
        public virtual User? DeletedByUser { get; set; }

        /// <summary>
        /// Clone template for customization
        /// </summary>
        public ReportTemplate Clone(string newName, Guid? newOrganizationId = null)
        {
            return new ReportTemplate
            {
                OrganizationId = newOrganizationId ?? OrganizationId,
                TemplateName = newName,
                Description = $"Copy of {TemplateName}",
                ReportType = ReportType,
                OutputFormat = OutputFormat,
                IsSystem = false,
                IsPublic = false,
                IsDefault = false,
                IsActive = true,
                Category = Category,
                Industry = Industry,
                Version = "1.0",
                Layout = new Dictionary<string, object>(Layout),
                Columns = new Dictionary<string, object>(Columns),
                Formatting = new Dictionary<string, object>(Formatting),
                FilterOptions = new Dictionary<string, object>(FilterOptions),
                GroupingOptions = new Dictionary<string, object>(GroupingOptions),
                SortingOptions = new Dictionary<string, object>(SortingOptions),
                HeaderSettings = new Dictionary<string, object>(HeaderSettings),
                FooterSettings = new Dictionary<string, object>(FooterSettings),
                PageSettings = new Dictionary<string, object>(PageSettings),
                StyleSettings = new Dictionary<string, object>(StyleSettings),
                Metadata = new Dictionary<string, object>(Metadata),
                Tags = new List<string>(Tags)
            };
        }

        /// <summary>
        /// Increment usage count
        /// </summary>
        public void IncrementUsage()
        {
            UsageCount++;
        }

        /// <summary>
        /// Update rating based on feedback
        /// </summary>
        public void UpdateRating()
        {
            if (!Feedback.Any()) return;

            var totalRating = Feedback.Sum(f => f.Rating);
            var count = Feedback.Count();

            Rating = (decimal)totalRating / count;
        }

        /// <summary>
        /// Check if template can be deleted
        /// </summary>
        public bool CanDelete()
        {
            return !IsSystem && !IsDefault;
        }

        /// <summary>
        /// Get column definitions for report type
        /// </summary>
        public List<ReportColumn> GetColumnDefinitions()
        {
            var columns = new List<ReportColumn>();

            if (Columns.ContainsKey("ColumnDefinitions"))
            {
                var columnDefs = (List<object>)Columns["ColumnDefinitions"];
                foreach (var colDef in columnDefs)
                {
                    var colDict = (Dictionary<string, object>)colDef;
                    columns.Add(new ReportColumn
                    {
                        Name = colDict["Name"].ToString()!,
                        DisplayName = colDict.ContainsKey("DisplayName") ? colDict["DisplayName"].ToString() : colDict["Name"].ToString(),
                        DataType = colDict.ContainsKey("DataType") ? colDict["DataType"].ToString() : "string",
                        IsVisible = colDict.ContainsKey("IsVisible") ? (bool)colDict["IsVisible"] : true,
                        Width = colDict.ContainsKey("Width") ? (int)colDict["Width"] : 100,
                        Alignment = colDict.ContainsKey("Alignment") ? colDict["Alignment"].ToString() : "left",
                        Format = colDict.ContainsKey("Format") ? colDict["Format"].ToString() : null,
                        SortOrder = colDict.ContainsKey("SortOrder") ? (int)colDict["SortOrder"] : 0
                    });
                }
            }

            return columns.OrderBy(c => c.SortOrder).ToList();
        }

        /// <summary>
        /// Set default template for organization
        /// </summary>
        public void SetAsDefault(string reportType)
        {
            if (ReportType != reportType)
                throw new InvalidOperationException($"Cannot set template of type {ReportType} as default for {reportType}");

            IsDefault = true;
        }

        /// <summary>
        /// Validate template configuration
        /// </summary>
        public bool IsValid()
        {
            if (string.IsNullOrEmpty(TemplateName)) return false;
            if (string.IsNullOrEmpty(ReportType)) return false;
            if (!Columns.Any()) return false;

            // Additional validation logic can be added here
            return true;
        }

        /// <summary>
        /// Get template summary
        /// </summary>
        public string GetSummary()
        {
            var summary = $"{TemplateName} ({ReportType}, {OutputFormat})";

            if (IsDefault) summary += " [DEFAULT]";
            if (IsSystem) summary += " [SYSTEM]";
            if (!IsActive) summary += " [INACTIVE]";

            if (UsageCount > 0)
                summary += $" - Used {UsageCount} times";

            if (Rating.HasValue)
                summary += $" - Rating: {Rating:F1}/5";

            return summary;
        }
    }

    /// <summary>
    /// Report Template Feedback entity for user ratings and comments
    /// </summary>
    public class ReportTemplateFeedback : BaseEntity
    {
        public Guid ReportTemplateId { get; set; }
        public Guid UserId { get; set; }
        public int Rating { get; set; } // 1-5 scale
        public string? Comment { get; set; }
        public DateTime FeedbackDate { get; set; } = DateTime.UtcNow;
        public Dictionary<string, object> Metadata { get; set; } = new();

        // Navigation properties
        public virtual ReportTemplate ReportTemplate { get; set; } = null!;
        public virtual User User { get; set; } = null!;
    }

    /// <summary>
    /// Report column definition model
    /// </summary>
    public class ReportColumn
    {
        public string Name { get; set; } = string.Empty;
        public string? DisplayName { get; set; }
        public string DataType { get; set; } = "string";
        public bool IsVisible { get; set; } = true;
        public int Width { get; set; } = 100;
        public string Alignment { get; set; } = "left";
        public string? Format { get; set; }
        public int SortOrder { get; set; }
    }
}