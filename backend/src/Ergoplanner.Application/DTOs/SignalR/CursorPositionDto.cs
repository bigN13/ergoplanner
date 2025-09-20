using System;

namespace Ergoplanner.Application.DTOs.SignalR
{
    /// <summary>
    /// DTO for user cursor position in drawing collaboration
    /// </summary>
    public class CursorPositionDto
    {
        public Guid UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string? UserColor { get; set; }
        public string? UserAvatar { get; set; }
        public double X { get; set; }
        public double Y { get; set; }
        public DateTime Timestamp { get; set; }
        public string? ViewportId { get; set; }
    }
}