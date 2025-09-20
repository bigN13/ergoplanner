namespace Ergoplanner.Application.DTOs.Drawings;

public class DrawingMetadataDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public Guid CreatedByUserId { get; set; }
    public string CreatedByUserName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string Status { get; set; } = string.Empty;
    public int Version { get; set; }
    public string DrawingNumber { get; set; } = string.Empty;
    public string Standard { get; set; } = string.Empty;
    public int ComponentsCount { get; set; }
    public bool IsLocked { get; set; }
    public Guid? LockedByUserId { get; set; }
    public string? LockedByUserName { get; set; }
    public DateTime? LockedAt { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
    public DateTime? LastActivityAt { get; set; }
}