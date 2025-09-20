using Ergoplanner.Domain.Enums;

namespace Ergoplanner.Application.DTOs.Authentication
{
    /// <summary>
    /// DTO for user registration request
    /// </summary>
    public class RegisterDto
    {
        /// <summary>
        /// User email address
        /// </summary>
        public string Email { get; set; } = string.Empty;

        /// <summary>
        /// Username for login
        /// </summary>
        public string Username { get; set; } = string.Empty;

        /// <summary>
        /// User password
        /// </summary>
        public string Password { get; set; } = string.Empty;

        /// <summary>
        /// Confirm password
        /// </summary>
        public string ConfirmPassword { get; set; } = string.Empty;

        /// <summary>
        /// User's first name
        /// </summary>
        public string? FirstName { get; set; }

        /// <summary>
        /// User's last name
        /// </summary>
        public string? LastName { get; set; }

        /// <summary>
        /// Display name for the user
        /// </summary>
        public string? DisplayName { get; set; }

        /// <summary>
        /// Organization ID for the user
        /// </summary>
        public Guid OrganizationId { get; set; }

        /// <summary>
        /// User role (defaults to Engineer)
        /// </summary>
        public UserRole Role { get; set; } = UserRole.Engineer;
    }
}