namespace Ergoplanner.Application.Interfaces
{
    /// <summary>
    /// Interface for password hashing and validation
    /// </summary>
    public interface IPasswordService
    {
        /// <summary>
        /// Hashes a password using BCrypt
        /// </summary>
        string HashPassword(string password);

        /// <summary>
        /// Verifies a password against a hash
        /// </summary>
        bool VerifyPassword(string password, string hash);

        /// <summary>
        /// Validates password strength
        /// </summary>
        bool IsPasswordValid(string password, out string errorMessage);

        /// <summary>
        /// Generates a secure random token
        /// </summary>
        string GenerateSecureToken();
    }
}