using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Supplier entity for vendor management
    /// </summary>
    public class Supplier : BaseEntity, IOrganizationScoped, ISoftDelete
    {
        public Guid OrganizationId { get; set; }
        public string SupplierCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? LegalName { get; set; }
        public string? TaxId { get; set; }
        public string? RegistrationNumber { get; set; }
        public string? Website { get; set; }
        public string? Industry { get; set; }
        public string? BusinessType { get; set; } // Manufacturer, Distributor, etc.
        public bool IsActive { get; set; } = true;
        public bool IsApproved { get; set; } = false;
        public bool IsPreferred { get; set; } = false;
        public DateTime? ApprovedDate { get; set; }
        public Guid? ApprovedBy { get; set; }
        public string? ApprovalStatus { get; set; }
        public string? PaymentTerms { get; set; }
        public string? ShippingTerms { get; set; }
        public string? Currency { get; set; } = "USD";
        public decimal? CreditLimit { get; set; }
        public string? CreditRating { get; set; }
        public decimal? QualityRating { get; set; } // 1-5 scale
        public decimal? DeliveryRating { get; set; } // 1-5 scale
        public decimal? ServiceRating { get; set; } // 1-5 scale
        public string? Notes { get; set; }
        public DateTime? LastContactDate { get; set; }
        public DateTime? LastOrderDate { get; set; }
        public string? ContractNumber { get; set; }
        public DateTime? ContractStartDate { get; set; }
        public DateTime? ContractEndDate { get; set; }
        public Dictionary<string, object> ContactInfo { get; set; } = new(); // Primary contact details
        public Dictionary<string, object> BillingAddress { get; set; } = new();
        public Dictionary<string, object> ShippingAddress { get; set; } = new();
        public Dictionary<string, object> BankDetails { get; set; } = new();
        public Dictionary<string, object> Certifications { get; set; } = new();
        public Dictionary<string, object> Metadata { get; set; } = new();
        public List<string> Tags { get; set; } = new();

        // Soft delete
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }
        public Guid? DeletedBy { get; set; }

        // Navigation properties
        public virtual Organization Organization { get; set; } = null!;
        public virtual ICollection<MaterialSupplier> MaterialSuppliers { get; set; } = new List<MaterialSupplier>();
        public virtual ICollection<SupplierContact> Contacts { get; set; } = new List<SupplierContact>();
        public virtual ICollection<SupplierDocument> Documents { get; set; } = new List<SupplierDocument>();
        public virtual ICollection<SupplierEvaluation> Evaluations { get; set; } = new List<SupplierEvaluation>();
        public virtual User? CreatedByUser { get; set; }
        public virtual User? UpdatedByUser { get; set; }
        public virtual User? ApprovedByUser { get; set; }
        public virtual User? DeletedByUser { get; set; }

        /// <summary>
        /// Get overall supplier rating
        /// </summary>
        public decimal? GetOverallRating()
        {
            var ratings = new List<decimal>();

            if (QualityRating.HasValue) ratings.Add(QualityRating.Value);
            if (DeliveryRating.HasValue) ratings.Add(DeliveryRating.Value);
            if (ServiceRating.HasValue) ratings.Add(ServiceRating.Value);

            return ratings.Any() ? ratings.Average() : null;
        }

        /// <summary>
        /// Update supplier ratings
        /// </summary>
        public void UpdateRatings(decimal? quality = null, decimal? delivery = null, decimal? service = null)
        {
            if (quality.HasValue && quality >= 1 && quality <= 5)
                QualityRating = quality;

            if (delivery.HasValue && delivery >= 1 && delivery <= 5)
                DeliveryRating = delivery;

            if (service.HasValue && service >= 1 && service <= 5)
                ServiceRating = service;
        }

        /// <summary>
        /// Approve supplier
        /// </summary>
        public void Approve(Guid approvedByUserId, string? approvalNotes = null)
        {
            if (IsApproved)
                throw new InvalidOperationException("Supplier is already approved");

            IsApproved = true;
            ApprovedBy = approvedByUserId;
            ApprovedDate = DateTime.UtcNow;
            ApprovalStatus = "Approved";

            if (!string.IsNullOrEmpty(approvalNotes))
            {
                Metadata["ApprovalNotes"] = approvalNotes;
            }
        }

        /// <summary>
        /// Reject supplier
        /// </summary>
        public void Reject(string reason)
        {
            IsApproved = false;
            ApprovalStatus = "Rejected";
            Metadata["RejectionReason"] = reason;
            Metadata["RejectionDate"] = DateTime.UtcNow;
        }

        /// <summary>
        /// Check if supplier is available for ordering
        /// </summary>
        public bool IsAvailableForOrder()
        {
            return IsActive &&
                   !IsDeleted &&
                   IsApproved &&
                   (ContractEndDate == null || ContractEndDate > DateTime.UtcNow);
        }

        /// <summary>
        /// Get primary contact
        /// </summary>
        public SupplierContact? GetPrimaryContact()
        {
            return Contacts
                .Where(c => c.IsActive && c.IsPrimary)
                .OrderBy(c => c.Priority)
                .FirstOrDefault();
        }

        /// <summary>
        /// Get contact by type
        /// </summary>
        public SupplierContact? GetContactByType(string contactType)
        {
            return Contacts
                .Where(c => c.IsActive && c.ContactType == contactType)
                .OrderBy(c => c.Priority)
                .FirstOrDefault();
        }

        /// <summary>
        /// Check if contract is valid
        /// </summary>
        public bool IsContractValid()
        {
            if (!ContractStartDate.HasValue)
                return true; // No contract required

            var now = DateTime.UtcNow;
            return ContractStartDate <= now &&
                   (!ContractEndDate.HasValue || ContractEndDate > now);
        }

        /// <summary>
        /// Get contract status
        /// </summary>
        public string GetContractStatus()
        {
            if (!ContractStartDate.HasValue)
                return "No Contract";

            var now = DateTime.UtcNow;

            if (ContractStartDate > now)
                return "Future Contract";

            if (!ContractEndDate.HasValue)
                return "Active Contract";

            if (ContractEndDate > now)
            {
                var daysRemaining = (ContractEndDate.Value - now).Days;
                if (daysRemaining <= 30)
                    return $"Expiring Soon ({daysRemaining} days)";
                return "Active Contract";
            }

            return "Expired Contract";
        }

        /// <summary>
        /// Get material count
        /// </summary>
        public int GetMaterialCount()
        {
            return MaterialSuppliers.Count(ms => ms.IsActive && ms.Material.IsActive);
        }
    }
}