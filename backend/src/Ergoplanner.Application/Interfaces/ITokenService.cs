using Ergoplanner.Domain.Entities;
using System.Security.Claims;

namespace Ergoplanner.Application.Interfaces
{
    /// <summary>
    /// Interface for JWT token generation and validation
    /// </summary>
    public interface ITokenService
    {
        /// <summary>
        /// Generates an access token for the user
        /// </summary>
        string GenerateAccessToken(User user, bool rememberMe = false);

        /// <summary>
        /// Generates a refresh token
        /// </summary>
        string GenerateRefreshToken();

        /// <summary>
        /// Validates an access token and returns the principal
        /// </summary>
        ClaimsPrincipal? ValidateToken(string token, bool validateLifetime = true);

        /// <summary>
        /// Gets the user ID from a token
        /// </summary>
        Guid? GetUserIdFromToken(string token);

        /// <summary>
        /// Gets the token expiry time
        /// </summary>
        DateTime GetTokenExpiry(bool rememberMe = false);
    }
}