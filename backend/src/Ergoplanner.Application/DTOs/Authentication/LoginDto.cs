namespace Ergoplanner.Application.DTOs.Authentication
{
    /// <summary>
    /// DTO for user login request
    /// </summary>
    public class LoginDto
    {
        /// <summary>
        /// User email or username
        /// </summary>
        public string EmailOrUsername { get; set; } = string.Empty;

        /// <summary>
        /// User password
        /// </summary>
        public string Password { get; set; } = string.Empty;

        /// <summary>
        /// Whether to remember the user (longer token expiry)
        /// </summary>
        public bool RememberMe { get; set; }
    }
}