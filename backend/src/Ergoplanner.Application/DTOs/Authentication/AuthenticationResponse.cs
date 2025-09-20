using System;
using Ergoplanner.Domain.Enums;

namespace Ergoplanner.Application.DTOs.Authentication
{
    /// <summary>
    /// DTO for authentication response containing JWT tokens and user information
    /// </summary>
    public class AuthenticationResponse
    {
        /// <summary>
        /// JWT access token
        /// </summary>
        public string AccessToken { get; set; } = string.Empty;

        /// <summary>
        /// Refresh token for obtaining new access tokens
        /// </summary>
        public string RefreshToken { get; set; } = string.Empty;

        /// <summary>
        /// Token type (typically "Bearer")
        /// </summary>
        public string TokenType { get; set; } = "Bearer";

        /// <summary>
        /// Access token expiration time in seconds
        /// </summary>
        public int ExpiresIn { get; set; }

        /// <summary>
        /// Refresh token expiration timestamp
        /// </summary>
        public DateTime RefreshTokenExpires { get; set; }

        /// <summary>
        /// Authenticated user information
        /// </summary>
        public UserDto User { get; set; } = null!;
    }

    /// <summary>
    /// DTO containing user information for authentication responses
    /// </summary>
    public class UserDto
    {
        public Guid Id { get; set; }
        public Guid OrganizationId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? DisplayName { get; set; }
        public string? AvatarUrl { get; set; }
        public UserRole Role { get; set; }
        public List<string> Permissions { get; set; } = new();
        public bool IsActive { get; set; }
        public bool IsVerified { get; set; }
        public DateTime? LastLoginAt { get; set; }
    }
}