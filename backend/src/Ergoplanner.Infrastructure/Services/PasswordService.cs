using System;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using Ergoplanner.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace Ergoplanner.Infrastructure.Services
{
    /// <summary>
    /// Service for password hashing and validation using BCrypt
    /// </summary>
    public class PasswordService : IPasswordService
    {
        private readonly ILogger<PasswordService> _logger;
        private const int WorkFactor = 12; // BCrypt work factor for security

        public PasswordService(ILogger<PasswordService> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Hash a password using BCrypt
        /// </summary>
        public string HashPassword(string password)
        {
            try
            {
                return BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error hashing password");
                throw new InvalidOperationException("Failed to hash password", ex);
            }
        }

        /// <summary>
        /// Verify a password against a hash
        /// </summary>
        public bool VerifyPassword(string password, string hash)
        {
            try
            {
                return BCrypt.Net.BCrypt.Verify(password, hash);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying password");
                return false;
            }
        }

        /// <summary>
        /// Validate password strength
        /// </summary>
        public PasswordValidationResult ValidatePasswordStrength(string password)
        {
            var result = new PasswordValidationResult { IsValid = true };

            // Check minimum length
            if (password.Length < 8)
            {
                result.IsValid = false;
                result.Errors.Add("Password must be at least 8 characters long");
            }

            // Check maximum length
            if (password.Length > 128)
            {
                result.IsValid = false;
                result.Errors.Add("Password must not exceed 128 characters");
            }

            // Check for uppercase letter
            if (!Regex.IsMatch(password, @"[A-Z]"))
            {
                result.IsValid = false;
                result.Errors.Add("Password must contain at least one uppercase letter");
            }

            // Check for lowercase letter
            if (!Regex.IsMatch(password, @"[a-z]"))
            {
                result.IsValid = false;
                result.Errors.Add("Password must contain at least one lowercase letter");
            }

            // Check for digit
            if (!Regex.IsMatch(password, @"\d"))
            {
                result.IsValid = false;
                result.Errors.Add("Password must contain at least one number");
            }

            // Check for special character
            if (!Regex.IsMatch(password, @"[!@#$%^&*()_+\-=\[\]{};':""\\|,.<>\/?]"))
            {
                result.IsValid = false;
                result.Errors.Add("Password must contain at least one special character");
            }

            // Check for common passwords (simplified list)
            var commonPasswords = new[]
            {
                "password", "12345678", "qwerty", "abc123", "password123",
                "admin", "letmein", "welcome", "monkey", "dragon"
            };

            if (commonPasswords.Any(common => password.ToLowerInvariant().Contains(common)))
            {
                result.IsValid = false;
                result.Errors.Add("Password is too common. Please choose a more secure password");
            }

            // Calculate password strength
            result.Strength = CalculatePasswordStrength(password);

            return result;
        }

        /// <summary>
        /// Generate a random secure password
        /// </summary>
        public string GenerateRandomPassword(int length = 16)
        {
            if (length < 8) length = 8;
            if (length > 128) length = 128;

            const string upperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            const string lowerCase = "abcdefghijklmnopqrstuvwxyz";
            const string digits = "0123456789";
            const string specialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";
            const string allChars = upperCase + lowerCase + digits + specialChars;

            var password = new char[length];
            var randomBytes = new byte[length * 4];

            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomBytes);
            }

            // Ensure at least one character from each category
            int index = 0;
            password[index++] = upperCase[BitConverter.ToUInt32(randomBytes, 0) % upperCase.Length];
            password[index++] = lowerCase[BitConverter.ToUInt32(randomBytes, 4) % lowerCase.Length];
            password[index++] = digits[BitConverter.ToUInt32(randomBytes, 8) % digits.Length];
            password[index++] = specialChars[BitConverter.ToUInt32(randomBytes, 12) % specialChars.Length];

            // Fill the rest with random characters
            for (int i = index; i < length; i++)
            {
                password[i] = allChars[BitConverter.ToUInt32(randomBytes, i * 4) % allChars.Length];
            }

            // Shuffle the password
            return new string(password.OrderBy(x => Guid.NewGuid()).ToArray());
        }

        /// <summary>
        /// Generate a password reset token
        /// </summary>
        public string GeneratePasswordResetToken()
        {
            var bytes = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(bytes);
            }
            return Convert.ToBase64String(bytes)
                .Replace("+", "-")
                .Replace("/", "_")
                .TrimEnd('=');
        }

        private PasswordStrength CalculatePasswordStrength(string password)
        {
            int score = 0;

            // Length scoring
            if (password.Length >= 8) score++;
            if (password.Length >= 12) score++;
            if (password.Length >= 16) score++;

            // Character variety scoring
            if (Regex.IsMatch(password, @"[a-z]")) score++;
            if (Regex.IsMatch(password, @"[A-Z]")) score++;
            if (Regex.IsMatch(password, @"\d")) score++;
            if (Regex.IsMatch(password, @"[!@#$%^&*()_+\-=\[\]{};':""\\|,.<>\/?]")) score++;

            // Additional complexity
            if (Regex.IsMatch(password, @"[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':""\\|,.<>\/?]")) score++;

            // No repeating characters
            if (!Regex.IsMatch(password, @"(.)\1{2,}")) score++;

            // No sequential characters
            if (!ContainsSequentialCharacters(password)) score++;

            return score switch
            {
                >= 8 => PasswordStrength.VeryStrong,
                >= 6 => PasswordStrength.Strong,
                >= 4 => PasswordStrength.Medium,
                >= 2 => PasswordStrength.Weak,
                _ => PasswordStrength.VeryWeak
            };
        }

        private bool ContainsSequentialCharacters(string password)
        {
            const string sequences = "abcdefghijklmnopqrstuvwxyz0123456789";
            const string reverseSequences = "zyxwvutsrqponmlkjihgfedcba9876543210";

            var lowerPassword = password.ToLowerInvariant();

            for (int i = 0; i < lowerPassword.Length - 2; i++)
            {
                var substring = lowerPassword.Substring(i, 3);
                if (sequences.Contains(substring) || reverseSequences.Contains(substring))
                {
                    return true;
                }
            }

            return false;
        }
    }

    /// <summary>
    /// Result of password validation
    /// </summary>
    public class PasswordValidationResult
    {
        public bool IsValid { get; set; }
        public List<string> Errors { get; set; } = new();
        public PasswordStrength Strength { get; set; }
    }

    /// <summary>
    /// Password strength levels
    /// </summary>
    public enum PasswordStrength
    {
        VeryWeak,
        Weak,
        Medium,
        Strong,
        VeryStrong
    }
}