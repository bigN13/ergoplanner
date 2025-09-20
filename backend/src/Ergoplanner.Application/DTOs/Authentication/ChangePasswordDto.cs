namespace Ergoplanner.Application.DTOs.Authentication
{
    /// <summary>
    /// DTO for changing user password
    /// </summary>
    public class ChangePasswordDto
    {
        /// <summary>
        /// Current password
        /// </summary>
        public string CurrentPassword { get; set; } = string.Empty;

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