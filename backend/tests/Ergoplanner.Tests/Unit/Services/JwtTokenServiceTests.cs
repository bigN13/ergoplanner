using System;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Xunit;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Ergoplanner.Application.Interfaces;
using Ergoplanner.Domain.Entities;
using Ergoplanner.Domain.Enums;
using Ergoplanner.Infrastructure.Configuration;
using Ergoplanner.Infrastructure.Services;

namespace Ergoplanner.Tests.Unit.Services
{
    public class JwtTokenServiceTests
    {
        private readonly JwtTokenService _tokenService;
        private readonly Mock<IRefreshTokenRepository> _refreshTokenRepositoryMock;
        private readonly Mock<ILogger<JwtTokenService>> _loggerMock;
        private readonly JwtSettings _jwtSettings;

        public JwtTokenServiceTests()
        {
            _jwtSettings = new JwtSettings
            {
                SecretKey = "ThisIsATestSecretKeyForJwtTokenGenerationThatIsAtLeast256BitsLong!@#$%",
                Issuer = "https://test.ergoplanner.ai",
                Audience = "https://test.ergoplanner.ai",
                AccessTokenExpirationMinutes = 60,
                RefreshTokenExpirationDays = 7,
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ClockSkewMinutes = 5
            };

            var options = Options.Create(_jwtSettings);
            _refreshTokenRepositoryMock = new Mock<IRefreshTokenRepository>();
            _loggerMock = new Mock<ILogger<JwtTokenService>>();

            _tokenService = new JwtTokenService(options, _refreshTokenRepositoryMock.Object, _loggerMock.Object);
        }

        [Fact]
        public void GenerateAccessToken_ShouldReturnValidToken()
        {
            // Arrange
            var user = CreateTestUser();

            // Act
            var token = _tokenService.GenerateAccessToken(user);

            // Assert
            token.Should().NotBeNullOrWhiteSpace();
            token.Should().Contain("."); // JWT tokens have three parts separated by dots
        }

        [Fact]
        public async Task ValidateTokenAsync_ShouldReturnClaimsPrincipalForValidToken()
        {
            // Arrange
            var user = CreateTestUser();
            var token = _tokenService.GenerateAccessToken(user, 1);

            // Act
            var principal = await _tokenService.ValidateTokenAsync(token);

            // Assert
            principal.Should().NotBeNull();
            principal.Identity.Should().NotBeNull();
            principal.Identity!.IsAuthenticated.Should().BeTrue();

            var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier);
            userIdClaim.Should().NotBeNull();
            userIdClaim!.Value.Should().Be(user.Id.ToString());
        }

        [Fact]
        public async Task ValidateTokenAsync_ShouldReturnNullForInvalidToken()
        {
            // Arrange
            var invalidToken = "invalid.token.here";

            // Act
            var principal = await _tokenService.ValidateTokenAsync(invalidToken);

            // Assert
            principal.Should().BeNull();
        }

        [Fact]
        public async Task ValidateTokenAsync_ShouldReturnNullForExpiredToken()
        {
            // Arrange
            var user = CreateTestUser();

            // Create a token that expires immediately
            _jwtSettings.AccessTokenExpirationMinutes = -1;
            var options = Options.Create(_jwtSettings);
            var tokenService = new JwtTokenService(options, _refreshTokenRepositoryMock.Object, _loggerMock.Object);

            var expiredToken = tokenService.GenerateAccessToken(user, 0);

            // Act
            await Task.Delay(1000); // Ensure token is expired
            var principal = await tokenService.ValidateTokenAsync(expiredToken);

            // Assert
            principal.Should().BeNull();
        }

        [Fact]
        public async Task GenerateRefreshTokenAsync_ShouldCreateAndSaveRefreshToken()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var expirationDays = 7;

            _refreshTokenRepositoryMock
                .Setup(x => x.AddAsync(It.IsAny<RefreshToken>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            // Act
            var refreshToken = await _tokenService.GenerateRefreshTokenAsync(userId, expirationDays);

            // Assert
            refreshToken.Should().NotBeNull();
            refreshToken.UserId.Should().Be(userId);
            refreshToken.Token.Should().NotBeNullOrWhiteSpace();
            refreshToken.ExpiresAt.Should().BeCloseTo(DateTime.UtcNow.AddDays(expirationDays), TimeSpan.FromSeconds(5));
            refreshToken.IsActive.Should().BeTrue();

            _refreshTokenRepositoryMock.Verify(x => x.AddAsync(It.IsAny<RefreshToken>(), It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task ValidateRefreshTokenAsync_ShouldReturnTokenForValidToken()
        {
            // Arrange
            var refreshToken = new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                Token = "valid-refresh-token",
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                IsRevoked = false
            };

            _refreshTokenRepositoryMock
                .Setup(x => x.GetByTokenAsync(refreshToken.Token, It.IsAny<CancellationToken>()))
                .ReturnsAsync(refreshToken);

            // Act
            var result = await _tokenService.ValidateRefreshTokenAsync(refreshToken.Token);

            // Assert
            result.Should().NotBeNull();
            result!.Token.Should().Be(refreshToken.Token);
            result.IsActive.Should().BeTrue();
        }

        [Fact]
        public async Task ValidateRefreshTokenAsync_ShouldReturnNullForNonExistentToken()
        {
            // Arrange
            _refreshTokenRepositoryMock
                .Setup(x => x.GetByTokenAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((RefreshToken?)null);

            // Act
            var result = await _tokenService.ValidateRefreshTokenAsync("non-existent-token");

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task ValidateRefreshTokenAsync_ShouldReturnNullForExpiredToken()
        {
            // Arrange
            var refreshToken = new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                Token = "expired-token",
                ExpiresAt = DateTime.UtcNow.AddDays(-1), // Expired yesterday
                IsRevoked = false
            };

            _refreshTokenRepositoryMock
                .Setup(x => x.GetByTokenAsync(refreshToken.Token, It.IsAny<CancellationToken>()))
                .ReturnsAsync(refreshToken);

            // Act
            var result = await _tokenService.ValidateRefreshTokenAsync(refreshToken.Token);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task RevokeRefreshTokenAsync_ShouldRevokeActiveToken()
        {
            // Arrange
            var refreshToken = new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = Guid.NewGuid(),
                Token = "active-token",
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                IsRevoked = false
            };

            _refreshTokenRepositoryMock
                .Setup(x => x.GetByTokenAsync(refreshToken.Token, It.IsAny<CancellationToken>()))
                .ReturnsAsync(refreshToken);

            _refreshTokenRepositoryMock
                .Setup(x => x.UpdateAsync(It.IsAny<RefreshToken>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            // Act
            await _tokenService.RevokeRefreshTokenAsync(refreshToken.Token, "Test revocation");

            // Assert
            refreshToken.IsRevoked.Should().BeTrue();
            refreshToken.RevokedAt.Should().NotBeNull();
            refreshToken.RevocationReason.Should().Be("Test revocation");

            _refreshTokenRepositoryMock.Verify(x => x.UpdateAsync(It.IsAny<RefreshToken>(), It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task RevokeAllUserTokensAsync_ShouldRevokeAllActiveTokens()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var activeTokens = new[]
            {
                new RefreshToken { Id = Guid.NewGuid(), UserId = userId, Token = "token1", ExpiresAt = DateTime.UtcNow.AddDays(7), IsRevoked = false },
                new RefreshToken { Id = Guid.NewGuid(), UserId = userId, Token = "token2", ExpiresAt = DateTime.UtcNow.AddDays(7), IsRevoked = false }
            };

            _refreshTokenRepositoryMock
                .Setup(x => x.GetActiveTokensByUserIdAsync(userId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(activeTokens);

            _refreshTokenRepositoryMock
                .Setup(x => x.UpdateAsync(It.IsAny<RefreshToken>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            // Act
            await _tokenService.RevokeAllUserTokensAsync(userId, "Security reset");

            // Assert
            foreach (var token in activeTokens)
            {
                token.IsRevoked.Should().BeTrue();
                token.RevokedAt.Should().NotBeNull();
                token.RevocationReason.Should().Be("Security reset");
            }

            _refreshTokenRepositoryMock.Verify(x => x.UpdateAsync(It.IsAny<RefreshToken>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
        }

        [Fact]
        public void GetUserIdFromToken_ShouldExtractUserIdFromValidToken()
        {
            // Arrange
            var user = CreateTestUser();
            var token = _tokenService.GenerateAccessToken(user);

            // Act
            var userId = _tokenService.GetUserIdFromToken(token);

            // Assert
            userId.Should().NotBeNull();
            userId.Should().Be(user.Id);
        }

        [Fact]
        public void GetUserIdFromToken_ShouldReturnNullForInvalidToken()
        {
            // Arrange
            var invalidToken = "invalid.token.here";

            // Act
            var userId = _tokenService.GetUserIdFromToken(invalidToken);

            // Assert
            userId.Should().BeNull();
        }

        [Fact]
        public void GenerateAccessToken_ShouldIncludeAllRequiredClaims()
        {
            // Arrange
            var user = CreateTestUser();

            // Act
            var token = _tokenService.GenerateAccessToken(user);
            var principal = _tokenService.ValidateTokenAsync(token).Result;

            // Assert
            principal.Should().NotBeNull();

            var claims = principal!.Claims.ToList();

            claims.Should().Contain(c => c.Type == ClaimTypes.NameIdentifier && c.Value == user.Id.ToString());
            claims.Should().Contain(c => c.Type == ClaimTypes.Email && c.Value == user.Email);
            claims.Should().Contain(c => c.Type == ClaimTypes.Name && c.Value == user.Username);
            claims.Should().Contain(c => c.Type == ClaimTypes.Role && c.Value == user.Role.ToString());
            claims.Should().Contain(c => c.Type == "organization_id" && c.Value == user.OrganizationId.ToString());

            // Check permissions
            foreach (var permission in user.Permissions)
            {
                claims.Should().Contain(c => c.Type == "permission" && c.Value == permission);
            }
        }

        private User CreateTestUser()
        {
            return new User
            {
                Id = Guid.NewGuid(),
                OrganizationId = Guid.NewGuid(),
                Email = "test@ergoplanner.ai",
                Username = "testuser",
                FirstName = "Test",
                LastName = "User",
                DisplayName = "Test User",
                Role = UserRole.Engineer,
                IsActive = true,
                IsVerified = true,
                Permissions = new List<string> { "drawings.read", "drawings.write", "projects.read" }
            };
        }
    }
}