using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Represents an active drawing collaboration session
    /// </summary>
    public class DrawingSession : BaseEntity
    {
        public Guid DrawingId { get; set; }
        public Guid HostUserId { get; set; }
        public string SessionName { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public List<Guid> ParticipantIds { get; set; } = new();
        public Dictionary<string, object> SessionData { get; set; } = new();
        public Dictionary<string, object> CursorPositions { get; set; } = new();
        public Dictionary<string, object> UserSelections { get; set; } = new();
        public int MaxParticipants { get; set; } = 10;

        // Navigation properties
        public virtual Drawing Drawing { get; set; } = null!;
        public virtual User HostUser { get; set; } = null!;
    }
}