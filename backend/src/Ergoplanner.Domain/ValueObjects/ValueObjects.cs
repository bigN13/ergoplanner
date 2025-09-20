using System;
using System.Collections.Generic;

namespace Ergoplanner.Domain.ValueObjects
{
    /// <summary>
    /// Position value object for component placement
    /// </summary>
    public class Position
    {
        public decimal X { get; set; }
        public decimal Y { get; set; }
        public decimal? Z { get; set; }

        public Position() { }

        public Position(decimal x, decimal y, decimal? z = null)
        {
            X = x;
            Y = y;
            Z = z;
        }
    }

    /// <summary>
    /// Scale value object for component sizing
    /// </summary>
    public class Scale
    {
        public decimal X { get; set; } = 1;
        public decimal Y { get; set; } = 1;

        public Scale() { }

        public Scale(decimal x, decimal y)
        {
            X = x;
            Y = y;
        }
    }

    /// <summary>
    /// Connection value object for component connections
    /// </summary>
    public class Connection
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string SourceId { get; set; } = string.Empty;
        public string TargetId { get; set; } = string.Empty;
        public string SourcePort { get; set; } = string.Empty;
        public string TargetPort { get; set; } = string.Empty;
        public string ConnectionType { get; set; } = string.Empty;
        public Dictionary<string, object> Properties { get; set; } = new();
    }

    /// <summary>
    /// Attachment value object for comments
    /// </summary>
    public class Attachment
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string FileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    }
}