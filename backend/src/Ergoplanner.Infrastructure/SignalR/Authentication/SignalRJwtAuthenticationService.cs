using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;

namespace Ergoplanner.Infrastructure.SignalR.Authentication
{
    /// <summary>
    /// Custom authentication service for SignalR connections
    /// </summary>
    public class SignalRJwtAuthenticationService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<SignalRJwtAuthenticationService> _logger;
        private readonly TokenValidationParameters _tokenValidationParameters;

        public SignalRJwtAuthenticationService(
            IConfiguration configuration,
            ILogger<SignalRJwtAuthenticationService> logger)
        {
            _configuration = configuration;
            _logger = logger;

            var secretKey = _configuration["JwtSettings:SecretKey"];
            var issuer = _configuration["JwtSettings:Issuer"];
            var audience = _configuration["JwtSettings:Audience"];

            _tokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
                ValidateIssuer = true,
                ValidIssuer = issuer,
                ValidateAudience = true,
                ValidAudience = audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };
        }

        /// <summary>
        /// Validates JWT token from SignalR connection
        /// </summary>
        public async Task<ClaimsPrincipal?> ValidateTokenAsync(string token)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();

                if (!tokenHandler.CanReadToken(token))
                {
                    _logger.LogWarning("Invalid JWT token format");
                    return null;
                }

                var validationResult = await tokenHandler.ValidateTokenAsync(token, _tokenValidationParameters);

                if (!validationResult.IsValid)
                {
                    _logger.LogWarning("JWT token validation failed: {Exception}", validationResult.Exception?.Message);
                    return null;
                }

                return new ClaimsPrincipal(validationResult.ClaimsIdentity);
            }
            catch (SecurityTokenExpiredException ex)
            {
                _logger.LogWarning("JWT token has expired: {Message}", ex.Message);
                return null;
            }
            catch (SecurityTokenInvalidSignatureException ex)
            {
                _logger.LogWarning("JWT token has invalid signature: {Message}", ex.Message);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating JWT token");
                return null;
            }
        }

        /// <summary>
        /// Extracts user information from claims principal
        /// </summary>
        public UserInfo? ExtractUserInfo(ClaimsPrincipal principal)
        {
            try
            {
                var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var userName = principal.FindFirst(ClaimTypes.Name)?.Value;
                var email = principal.FindFirst(ClaimTypes.Email)?.Value;
                var roleClaim = principal.FindFirst(ClaimTypes.Role)?.Value;
                var organizationIdClaim = principal.FindFirst("OrganizationId")?.Value;

                if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                {
                    _logger.LogWarning("Invalid or missing user ID in JWT claims");
                    return null;
                }

                if (string.IsNullOrEmpty(organizationIdClaim) || !Guid.TryParse(organizationIdClaim, out var organizationId))
                {
                    _logger.LogWarning("Invalid or missing organization ID in JWT claims");
                    return null;
                }

                return new UserInfo
                {
                    UserId = userId,
                    UserName = userName ?? "Unknown User",
                    Email = email ?? string.Empty,
                    Role = roleClaim ?? "User",
                    OrganizationId = organizationId
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error extracting user info from claims");
                return null;
            }
        }
    }

    /// <summary>
    /// User information extracted from JWT claims
    /// </summary>
    public class UserInfo
    {
        public Guid UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public Guid OrganizationId { get; set; }
    }
}