using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// User-specific favorite symbols for quick access
    /// </summary>
    public class SymbolFavorite : BaseEntity, IOrganizationScoped
    {
        public Guid OrganizationId { get; set; }
        public Guid SymbolId { get; set; }
        public Guid UserId { get; set; }
        public string? Notes { get; set; }
        public int SortOrder { get; set; } = 0;
        public List<string> Tags { get; set; } = new();
        public Dictionary<string, object> Metadata { get; set; } = new();

        // Navigation properties
        public virtual Organization Organization { get; set; } = null!;
        public virtual Symbol Symbol { get; set; } = null!;
        public virtual User User { get; set; } = null!;
    }
}