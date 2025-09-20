using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.ValueObjects;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Component entity representing instances of symbols in drawings
    /// </summary>
    public class Component : BaseEntity
    {
        public Guid DrawingId { get; set; }
        public Guid? SymbolId { get; set; }
        public string ComponentId { get; set; } = string.Empty;
        public string? Name { get; set; }
        public string? ComponentType { get; set; }
        public Position Position { get; set; } = new();
        public decimal Rotation { get; set; } = 0;
        public Scale Scale { get; set; } = new();
        public Dictionary<string, object> Properties { get; set; } = new();
        public List<Connection> Connections { get; set; } = new();
        public string Status { get; set; } = "active";
        public Dictionary<string, object> Metadata { get; set; } = new();

        // Navigation properties
        public virtual Drawing Drawing { get; set; } = null!;
        public virtual Symbol? Symbol { get; set; }
        public virtual ICollection<BoQItem> BoQItems { get; set; } = new List<BoQItem>();
    }
}