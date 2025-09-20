namespace Ergoplanner.Application.DTOs.Authentication
{
    /// <summary>
    /// DTO for password reset completion
    /// </summary>
    public class PasswordResetDto
    {
        /// <summary>
        /// Password reset token from email
        /// </summary>
        public string Token { get; set; } = string.Empty;

        /// <summary>
        /// New password
        /// </summary>
        public string NewPassword { get; set; } = string.Empty;

        /// <summary>
        /// Confirm new password
        /// </summary>
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}