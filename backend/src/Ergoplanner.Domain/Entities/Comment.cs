using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.ValueObjects;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Comment entity for drawing discussions
    /// </summary>
    public class Comment : BaseEntity
    {
        public Guid DrawingId { get; set; }
        public Guid? ParentCommentId { get; set; }
        public Guid UserId { get; set; }
        public string CommentText { get; set; } = string.Empty;
        public string CommentType { get; set; } = "general";
        public Position? Position { get; set; }
        public List<Attachment> Attachments { get; set; } = new();
        public bool IsResolved { get; set; } = false;
        public Guid? ResolvedBy { get; set; }
        public DateTime? ResolvedAt { get; set; }

        // Navigation properties
        public virtual Drawing Drawing { get; set; } = null!;
        public virtual Comment? ParentComment { get; set; }
        public virtual ICollection<Comment> Replies { get; set; } = new List<Comment>();
        public virtual User User { get; set; } = null!;
        public virtual User? ResolvedByUser { get; set; }
    }
}