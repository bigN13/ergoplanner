using System;
using Ergoplanner.Domain.Common;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Entity representing a refresh token for JWT authentication
    /// </summary>
    public class RefreshToken : BaseEntity
    {
        /// <summary>
        /// The user ID this token belongs to
        /// </summary>
        public Guid UserId { get; set; }

        /// <summary>
        /// The refresh token value
        /// </summary>
        public string Token { get; set; } = string.Empty;

        /// <summary>
        /// When this token expires
        /// </summary>
        public DateTime ExpiresAt { get; set; }

        /// <summary>
        /// Whether this token has been revoked
        /// </summary>
        public bool IsRevoked { get; set; }

        /// <summary>
        /// When this token was revoked (if applicable)
        /// </summary>
        public DateTime? RevokedAt { get; set; }

        /// <summary>
        /// Reason for revocation (if applicable)
        /// </summary>
        public string? RevocationReason { get; set; }

        /// <summary>
        /// IP address that created this token
        /// </summary>
        public string? CreatedByIp { get; set; }

        /// <summary>
        /// User agent that created this token
        /// </summary>
        public string? CreatedByUserAgent { get; set; }

        /// <summary>
        /// Navigation property to user
        /// </summary>
        public virtual User User { get; set; } = null!;

        /// <summary>
        /// Check if token is active (not expired and not revoked)
        /// </summary>
        public bool IsActive => !IsRevoked && DateTime.UtcNow < ExpiresAt;
    }
}