using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.Enums;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Industry standards compliance for symbols
    /// </summary>
    public class SymbolStandard : BaseEntity, IOrganizationScoped
    {
        public Guid OrganizationId { get; set; }
        public Guid SymbolId { get; set; }
        public IndustryStandard Standard { get; set; }
        public string StandardCode { get; set; } = string.Empty;
        public string? StandardName { get; set; }
        public string? Version { get; set; }
        public string? Section { get; set; }
        public string? Description { get; set; }
        public string? ComplianceLevel { get; set; }
        public string? CertificationBody { get; set; }
        public DateTime? CertifiedDate { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public string? CertificateNumber { get; set; }
        public bool IsActive { get; set; } = true;
        public Dictionary<string, object> Metadata { get; set; } = new();

        // Navigation properties
        public virtual Organization Organization { get; set; } = null!;
        public virtual Symbol Symbol { get; set; } = null!;
        public virtual User? CreatedByUser { get; set; }
    }
}