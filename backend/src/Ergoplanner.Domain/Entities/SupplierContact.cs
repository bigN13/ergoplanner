using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Supplier Contact entity for managing supplier contact persons
    /// </summary>
    public class SupplierContact : BaseEntity
    {
        public Guid SupplierId { get; set; }
        public string ContactType { get; set; } = "General"; // General, Sales, Technical, Finance, etc.
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? Title { get; set; }
        public string? Department { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Mobile { get; set; }
        public string? Fax { get; set; }
        public bool IsPrimary { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public int Priority { get; set; } = 1;
        public string? Notes { get; set; }
        public Dictionary<string, object> ContactDetails { get; set; } = new();
        public Dictionary<string, object> Metadata { get; set; } = new();

        // Navigation properties
        public virtual Supplier Supplier { get; set; } = null!;
        public virtual User? CreatedByUser { get; set; }
        public virtual User? UpdatedByUser { get; set; }

        /// <summary>
        /// Get full name
        /// </summary>
        public string GetFullName()
        {
            return $"{FirstName} {LastName}".Trim();
        }

        /// <summary>
        /// Get display name with title
        /// </summary>
        public string GetDisplayName()
        {
            var name = GetFullName();
            if (!string.IsNullOrEmpty(Title))
                name = $"{Title} {name}";
            return name;
        }

        /// <summary>
        /// Get primary contact information
        /// </summary>
        public string GetPrimaryContactInfo()
        {
            var info = GetDisplayName();

            if (!string.IsNullOrEmpty(Email))
                info += $" <{Email}>";

            if (!string.IsNullOrEmpty(Phone))
                info += $" | {Phone}";

            return info;
        }
    }
}