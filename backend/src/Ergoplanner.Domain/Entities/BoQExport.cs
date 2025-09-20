using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.Enums;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// BoQ Export entity for managing BoQ exports and downloads
    /// </summary>
    public class BoQExport : BaseEntity
    {
        public Guid BoQId { get; set; }
        public Guid? TemplateId { get; set; }
        public string ExportName { get; set; } = string.Empty;
        public BoQExportFormat Format { get; set; }
        public string? Description { get; set; }
        public string Status { get; set; } = "Pending"; // Pending, Processing, Completed, Failed
        public DateTime ExportDate { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }
        public string? FileName { get; set; }
        public string? FileUrl { get; set; }
        public string? ContentType { get; set; }
        public long? FileSize { get; set; }
        public int? DownloadCount { get; set; } = 0;
        public DateTime? LastDownloadAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public bool IncludePricing { get; set; } = true;
        public bool IncludeSpecifications { get; set; } = true;
        public bool IncludeDrawings { get; set; } = false;
        public bool IncludeComments { get; set; } = false;
        public string? FilterCriteria { get; set; }
        public string? GroupingOptions { get; set; }
        public string? SortingOptions { get; set; }
        public string? ErrorMessage { get; set; }
        public Dictionary<string, object> ExportSettings { get; set; } = new();
        public Dictionary<string, object> Metadata { get; set; } = new();
        public List<string> Tags { get; set; } = new();

        // Navigation properties
        public virtual BoQ BoQ { get; set; } = null!;
        public virtual ReportTemplate? Template { get; set; }
        public virtual ICollection<BoQExportDownload> Downloads { get; set; } = new List<BoQExportDownload>();
        public virtual User? CreatedByUser { get; set; }
        public virtual User? UpdatedByUser { get; set; }

        /// <summary>
        /// Mark export as completed
        /// </summary>
        public void MarkCompleted(string fileName, string fileUrl, string contentType, long fileSize)
        {
            Status = "Completed";
            CompletedAt = DateTime.UtcNow;
            FileName = fileName;
            FileUrl = fileUrl;
            ContentType = contentType;
            FileSize = fileSize;

            // Set expiry date (default 30 days)
            ExpiresAt = DateTime.UtcNow.AddDays(30);
        }

        /// <summary>
        /// Mark export as failed
        /// </summary>
        public void MarkFailed(string errorMessage)
        {
            Status = "Failed";
            CompletedAt = DateTime.UtcNow;
            ErrorMessage = errorMessage;
        }

        /// <summary>
        /// Record download
        /// </summary>
        public void RecordDownload(Guid userId, string? userAgent = null, string? ipAddress = null)
        {
            DownloadCount = (DownloadCount ?? 0) + 1;
            LastDownloadAt = DateTime.UtcNow;

            var download = new BoQExportDownload
            {
                BoQExportId = Id,
                UserId = userId,
                DownloadDate = DateTime.UtcNow,
                UserAgent = userAgent,
                IpAddress = ipAddress
            };

            Downloads.Add(download);
        }

        /// <summary>
        /// Check if export is available
        /// </summary>
        public bool IsAvailable()
        {
            return Status == "Completed" &&
                   !string.IsNullOrEmpty(FileUrl) &&
                   (!ExpiresAt.HasValue || ExpiresAt > DateTime.UtcNow);
        }

        /// <summary>
        /// Check if export is expired
        /// </summary>
        public bool IsExpired()
        {
            return ExpiresAt.HasValue && ExpiresAt <= DateTime.UtcNow;
        }

        /// <summary>
        /// Extend expiry date
        /// </summary>
        public void ExtendExpiry(int additionalDays)
        {
            if (!ExpiresAt.HasValue)
                ExpiresAt = DateTime.UtcNow.AddDays(additionalDays);
            else
                ExpiresAt = ExpiresAt.Value.AddDays(additionalDays);
        }

        /// <summary>
        /// Get file size display
        /// </summary>
        public string GetFileSizeDisplay()
        {
            if (!FileSize.HasValue) return "Unknown";

            var size = FileSize.Value;
            if (size < 1024) return $"{size} B";
            if (size < 1024 * 1024) return $"{size / 1024:F1} KB";
            if (size < 1024 * 1024 * 1024) return $"{size / (1024 * 1024):F1} MB";
            return $"{size / (1024 * 1024 * 1024):F1} GB";
        }

        /// <summary>
        /// Get export summary
        /// </summary>
        public string GetExportSummary()
        {
            var summary = $"{ExportName} ({Format}) - {Status}";

            if (CompletedAt.HasValue)
            {
                summary += $" on {CompletedAt:yyyy-MM-dd HH:mm}";
            }

            if (FileSize.HasValue)
            {
                summary += $" [{GetFileSizeDisplay()}]";
            }

            if (DownloadCount > 0)
            {
                summary += $" - Downloaded {DownloadCount} times";
            }

            return summary;
        }
    }

    /// <summary>
    /// BoQ Export Download entity for tracking download history
    /// </summary>
    public class BoQExportDownload : BaseEntity
    {
        public Guid BoQExportId { get; set; }
        public Guid UserId { get; set; }
        public DateTime DownloadDate { get; set; } = DateTime.UtcNow;
        public string? UserAgent { get; set; }
        public string? IpAddress { get; set; }
        public Dictionary<string, object> Metadata { get; set; } = new();

        // Navigation properties
        public virtual BoQExport BoQExport { get; set; } = null!;
        public virtual User User { get; set; } = null!;
    }
}