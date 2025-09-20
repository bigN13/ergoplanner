using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.Enums;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// User feedback and ratings for symbols
    /// </summary>
    public class SymbolFeedback : BaseEntity, IOrganizationScoped
    {
        public Guid OrganizationId { get; set; }
        public Guid SymbolId { get; set; }
        public Guid UserId { get; set; }
        public FeedbackType FeedbackType { get; set; }
        public int? Rating { get; set; } // 1-5 stars
        public string? Title { get; set; }
        public string? Comment { get; set; }
        public List<string> Tags { get; set; } = new();
        public bool IsAnonymous { get; set; } = false;
        public bool IsPublic { get; set; } = true;
        public bool IsResolved { get; set; } = false;
        public Guid? ResolvedBy { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public string? ResolutionNotes { get; set; }
        public Dictionary<string, object> Metadata { get; set; } = new();

        // Navigation properties
        public virtual Organization Organization { get; set; } = null!;
        public virtual Symbol Symbol { get; set; } = null!;
        public virtual User User { get; set; } = null!;
        public virtual User? ResolvedByUser { get; set; }
    }
}