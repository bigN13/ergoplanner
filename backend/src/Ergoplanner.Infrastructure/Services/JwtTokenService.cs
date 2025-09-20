using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Ergoplanner.Application.Interfaces;
using Ergoplanner.Domain.Entities;
using Ergoplanner.Infrastructure.Configuration;
using Microsoft.Extensions.Logging;

namespace Ergoplanner.Infrastructure.Services
{
    /// <summary>
    /// Service for generating and validating JWT tokens
    /// </summary>
    public class JwtTokenService : ITokenService
    {
        private readonly JwtSettings _jwtSettings;
        private readonly IRefreshTokenRepository _refreshTokenRepository;
        private readonly ILogger<JwtTokenService> _logger;
        private readonly JwtSecurityTokenHandler _tokenHandler;

        public JwtTokenService(
            IOptions<JwtSettings> jwtSettings,
            IRefreshTokenRepository refreshTokenRepository,
            ILogger<JwtTokenService> logger)
        {
            _jwtSettings = jwtSettings.Value;
            _refreshTokenRepository = refreshTokenRepository;
            _logger = logger;
            _tokenHandler = new JwtSecurityTokenHandler();
        }

        public string GenerateAccessToken(User user, int expirationDays = 1)
        {
            try
            {
                var key = Encoding.UTF8.GetBytes(_jwtSettings.SecretKey);
                var signingCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature);

                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Email, user.Email),
                    new Claim(ClaimTypes.Name, user.Username),
                    new Claim("organization_id", user.OrganizationId.ToString()),
                    new Claim(ClaimTypes.Role, user.Role.ToString()),
                    new Claim("display_name", user.DisplayName ?? user.FullName),
                    new Claim("is_verified", user.IsVerified.ToString().ToLower()),
                    new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                    new Claim(JwtRegisteredClaimNames.Iat,
                        new DateTimeOffset(DateTime.UtcNow).ToUnixTimeSeconds().ToString(),
                        ClaimValueTypes.Integer64)
                };

                // Add permissions as claims
                foreach (var permission in user.Permissions)
                {
                    claims.Add(new Claim("permission", permission));
                }

                var tokenDescriptor = new SecurityTokenDescriptor
                {
                    Subject = new ClaimsIdentity(claims),
                    Expires = DateTime.UtcNow.AddDays(expirationDays),
                    Issuer = _jwtSettings.Issuer,
                    Audience = _jwtSettings.Audience,
                    SigningCredentials = signingCredentials
                };

                var token = _tokenHandler.CreateToken(tokenDescriptor);
                var tokenString = _tokenHandler.WriteToken(token);

                _logger.LogDebug("Generated access token for user {UserId}", user.Id);

                return tokenString;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating access token for user {UserId}", user.Id);
                throw;
            }
        }

        public async Task<RefreshToken> GenerateRefreshTokenAsync(
            Guid userId,
            int expirationDays = 7,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var refreshToken = new RefreshToken
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Token = GenerateRandomToken(),
                    ExpiresAt = DateTime.UtcNow.AddDays(expirationDays),
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = userId.ToString()
                };

                await _refreshTokenRepository.AddAsync(refreshToken, cancellationToken);

                _logger.LogDebug("Generated refresh token for user {UserId}", userId);

                return refreshToken;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating refresh token for user {UserId}", userId);
                throw;
            }
        }

        public async Task<ClaimsPrincipal?> ValidateTokenAsync(string token, CancellationToken cancellationToken = default)
        {
            try
            {
                var key = Encoding.UTF8.GetBytes(_jwtSettings.SecretKey);

                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = _jwtSettings.ValidateIssuer,
                    ValidateAudience = _jwtSettings.ValidateAudience,
                    ValidateLifetime = _jwtSettings.ValidateLifetime,
                    ValidateIssuerSigningKey = _jwtSettings.ValidateIssuerSigningKey,
                    ValidIssuer = _jwtSettings.Issuer,
                    ValidAudience = _jwtSettings.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ClockSkew = TimeSpan.FromMinutes(_jwtSettings.ClockSkewMinutes)
                };

                var principal = _tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);

                if (validatedToken is not JwtSecurityToken jwtToken ||
                    !jwtToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256Signature, StringComparison.InvariantCultureIgnoreCase))
                {
                    _logger.LogWarning("Invalid token algorithm detected");
                    return null;
                }

                return principal;
            }
            catch (SecurityTokenExpiredException)
            {
                _logger.LogWarning("Token has expired");
                return null;
            }
            catch (SecurityTokenException ex)
            {
                _logger.LogWarning(ex, "Token validation failed");
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating token");
                return null;
            }
        }

        public async Task<RefreshToken?> ValidateRefreshTokenAsync(
            string token,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var refreshToken = await _refreshTokenRepository.GetByTokenAsync(token, cancellationToken);

                if (refreshToken == null)
                {
                    _logger.LogWarning("Refresh token not found");
                    return null;
                }

                if (!refreshToken.IsActive)
                {
                    _logger.LogWarning("Refresh token is not active. Token: {TokenId}", refreshToken.Id);
                    return null;
                }

                return refreshToken;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating refresh token");
                return null;
            }
        }

        public async Task RevokeRefreshTokenAsync(
            string token,
            string reason = "User requested",
            CancellationToken cancellationToken = default)
        {
            try
            {
                var refreshToken = await _refreshTokenRepository.GetByTokenAsync(token, cancellationToken);

                if (refreshToken != null && refreshToken.IsActive)
                {
                    refreshToken.IsRevoked = true;
                    refreshToken.RevokedAt = DateTime.UtcNow;
                    refreshToken.RevocationReason = reason;
                    refreshToken.UpdatedAt = DateTime.UtcNow;

                    await _refreshTokenRepository.UpdateAsync(refreshToken, cancellationToken);

                    _logger.LogInformation("Revoked refresh token {TokenId} for reason: {Reason}",
                        refreshToken.Id, reason);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error revoking refresh token");
                throw;
            }
        }

        public async Task RevokeAllUserTokensAsync(
            Guid userId,
            string reason = "Security reset",
            CancellationToken cancellationToken = default)
        {
            try
            {
                var activeTokens = await _refreshTokenRepository.GetActiveTokensByUserIdAsync(userId, cancellationToken);

                foreach (var token in activeTokens)
                {
                    token.IsRevoked = true;
                    token.RevokedAt = DateTime.UtcNow;
                    token.RevocationReason = reason;
                    token.UpdatedAt = DateTime.UtcNow;

                    await _refreshTokenRepository.UpdateAsync(token, cancellationToken);
                }

                _logger.LogInformation("Revoked {Count} refresh tokens for user {UserId}",
                    activeTokens.Count(), userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error revoking all tokens for user {UserId}", userId);
                throw;
            }
        }

        public Guid? GetUserIdFromToken(string token)
        {
            try
            {
                var jwtToken = _tokenHandler.ReadJwtToken(token);
                var userIdClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);

                if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
                {
                    return userId;
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error extracting user ID from token");
                return null;
            }
        }

        private string GenerateRandomToken()
        {
            using var rng = RandomNumberGenerator.Create();
            var bytes = new byte[64];
            rng.GetBytes(bytes);
            return Convert.ToBase64String(bytes)
                .Replace("+", "-")
                .Replace("/", "_")
                .TrimEnd('=');
        }
    }
}