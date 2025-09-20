using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.Enums;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Drawing entity representing P&ID drawings
    /// </summary>
    public class Drawing : BaseEntity
    {
        public Guid ProjectId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string DrawingNumber { get; set; } = string.Empty;
        public string Revision { get; set; } = "A";
        public DrawingType DrawingType { get; set; }
        public DrawingStatus Status { get; set; } = DrawingStatus.Draft;
        public string? Scale { get; set; }
        public string PaperSize { get; set; } = "A1";
        public string Orientation { get; set; } = "landscape";
        public Dictionary<string, object> DrawingData { get; set; } = new();
        public string? ThumbnailUrl { get; set; }
        public Guid? LockedBy { get; set; }
        public DateTime? LockedAt { get; set; }
        public List<string> Tags { get; set; } = new();
        public Dictionary<string, object> Metadata { get; set; } = new();
        public bool IsTemplate { get; set; } = false;
        public Guid? ParentDrawingId { get; set; }

        // Navigation properties
        public virtual Project Project { get; set; } = null!;
        public virtual Drawing? ParentDrawing { get; set; }
        public virtual ICollection<Drawing> ChildDrawings { get; set; } = new List<Drawing>();
        public virtual ICollection<Component> Components { get; set; } = new List<Component>();
        public virtual ICollection<DrawingVersion> Versions { get; set; } = new List<DrawingVersion>();
        public virtual ICollection<ApprovalWorkflow> ApprovalWorkflows { get; set; } = new List<ApprovalWorkflow>();
        public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();
        public virtual ICollection<BoQ> BoQs { get; set; } = new List<BoQ>();
        public virtual ICollection<BoQItem> BoQItems { get; set; } = new List<BoQItem>();
        public virtual User? CreatedByUser { get; set; }
        public virtual User? UpdatedByUser { get; set; }
        public virtual User? LockedByUser { get; set; }
    }
}