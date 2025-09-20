namespace Ergoplanner.Application.DTOs.Authentication
{
    /// <summary>
    /// DTO for password reset request
    /// </summary>
    public class PasswordResetRequestDto
    {
        /// <summary>
        /// Email address of the user requesting password reset
        /// </summary>
        public string Email { get; set; } = string.Empty;
    }
}