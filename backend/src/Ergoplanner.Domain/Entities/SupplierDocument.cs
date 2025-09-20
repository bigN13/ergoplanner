using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Supplier Document entity for managing supplier documentation
    /// </summary>
    public class SupplierDocument : BaseEntity
    {
        public Guid SupplierId { get; set; }
        public string DocumentType { get; set; } = string.Empty; // Certificate, License, Insurance, Contract, etc.
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public DateTime? IssueDate { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public string? IssuingAuthority { get; set; }
        public string? DocumentNumber { get; set; }
        public bool IsRequired { get; set; } = false;
        public bool IsVerified { get; set; } = false;
        public Guid? VerifiedBy { get; set; }
        public DateTime? VerifiedAt { get; set; }
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
        public Dictionary<string, object> Metadata { get; set; } = new();

        // Navigation properties
        public virtual Supplier Supplier { get; set; } = null!;
        public virtual User? VerifiedByUser { get; set; }
        public virtual User? CreatedByUser { get; set; }
        public virtual User? UpdatedByUser { get; set; }

        /// <summary>
        /// Check if document is expired
        /// </summary>
        public bool IsExpired()
        {
            return ExpiryDate.HasValue && ExpiryDate <= DateTime.UtcNow;
        }

        /// <summary>
        /// Check if document expires soon
        /// </summary>
        public bool ExpiresSoon(int daysThreshold = 30)
        {
            if (!ExpiryDate.HasValue) return false;
            return (ExpiryDate.Value - DateTime.UtcNow).TotalDays <= daysThreshold;
        }

        /// <summary>
        /// Verify document
        /// </summary>
        public void Verify(Guid verifiedByUserId)
        {
            IsVerified = true;
            VerifiedBy = verifiedByUserId;
            VerifiedAt = DateTime.UtcNow;
        }
    }
}