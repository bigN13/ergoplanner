using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// BoQ Template Feedback entity for user ratings and feedback on templates
    /// </summary>
    public class BoQTemplateFeedback : BaseEntity
    {
        public Guid TemplateId { get; set; }
        public Guid UserId { get; set; }
        public int Rating { get; set; } // 1-5 scale
        public string? Comment { get; set; }
        public string? FeedbackType { get; set; } = "General"; // General, Bug Report, Feature Request, etc.
        public DateTime FeedbackDate { get; set; } = DateTime.UtcNow;
        public bool IsPublic { get; set; } = true;
        public Dictionary<string, object> Metadata { get; set; } = new();

        // Navigation properties
        public virtual BoQTemplate Template { get; set; } = null!;
        public virtual User User { get; set; } = null!;
    }
}