namespace Ergoplanner.Application.Interfaces
{
    /// <summary>
    /// Interface for email sending service
    /// </summary>
    public interface IEmailService
    {
        /// <summary>
        /// Sends a password reset email
        /// </summary>
        Task SendPasswordResetEmailAsync(string email, string resetToken);

        /// <summary>
        /// Sends an email verification email
        /// </summary>
        Task SendVerificationEmailAsync(string email, string verificationToken);

        /// <summary>
        /// Sends a welcome email to new users
        /// </summary>
        Task SendWelcomeEmailAsync(string email, string fullName);
    }
}