using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using Ergoplanner.Application.Interfaces;
using Ergoplanner.Infrastructure.Caching.Configuration;
using Ergoplanner.Infrastructure.Caching.Services;

namespace Ergoplanner.UnitTests.Infrastructure.Caching;

public class DistributedCacheServiceTests
{
    private readonly Mock<ICacheService> _mockCacheService;
    private readonly Mock<ILogger<DistributedCacheService>> _mockLogger;
    private readonly IOptions<RedisConfiguration> _configuration;
    private readonly DistributedCacheService _distributedCacheService;

    public DistributedCacheServiceTests()
    {
        _mockCacheService = new Mock<ICacheService>();
        _mockLogger = new Mock<ILogger<DistributedCacheService>>();

        var redisConfig = new RedisConfiguration
        {
            Expiration = new CacheExpirationOptions
            {
                UserSessionMinutes = 60,
                UserPreferencesHours = 12,
                CollaborationDataMinutes = 5,
                BlacklistedTokenHours = 24
            }
        };
        _configuration = Options.Create(redisConfig);

        _distributedCacheService = new DistributedCacheService(_mockCacheService.Object, _configuration, _mockLogger.Object);
    }

    [Fact]
    public async Task SetUserSessionAsync_WithValidData_CallsCacheService()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var sessionData = new { UserId = userId, LoginTime = DateTime.UtcNow };

        // Act
        await _distributedCacheService.SetUserSessionAsync(userId, sessionData);

        // Assert
        _mockCacheService.Verify(x => x.SetAsync(
            It.Is<string>(k => k.Contains($"session:{userId}:main")),
            sessionData,
            TimeSpan.FromMinutes(60),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetUserSessionAsync_WithValidUserId_ReturnsSessionData()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var expectedSessionData = new TestSessionData { UserId = userId, LoginTime = DateTime.UtcNow };

        _mockCacheService.Setup(x => x.GetAsync<TestSessionData>(
            It.Is<string>(k => k.Contains($"session:{userId}:main")),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedSessionData);

        // Act
        var result = await _distributedCacheService.GetUserSessionAsync<TestSessionData>(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(expectedSessionData.UserId, result.UserId);
        Assert.Equal(expectedSessionData.LoginTime, result.LoginTime);
    }

    [Fact]
    public async Task RemoveUserSessionAsync_WithValidUserId_CallsCacheServiceRemove()
    {
        // Arrange
        var userId = Guid.NewGuid();

        // Act
        await _distributedCacheService.RemoveUserSessionAsync(userId);

        // Assert
        _mockCacheService.Verify(x => x.RemoveAsync(
            It.Is<string>(k => k.Contains($"session:{userId}:main")),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task BlacklistTokenAsync_WithValidToken_CallsCacheServiceSet()
    {
        // Arrange
        var tokenId = "test_token_123";
        var expiration = TimeSpan.FromHours(24);

        // Act
        await _distributedCacheService.BlacklistTokenAsync(tokenId, expiration);

        // Assert
        _mockCacheService.Verify(x => x.SetStringAsync(
            It.Is<string>(k => k.Contains($"token:blacklist:{tokenId}")),
            "blacklisted",
            expiration,
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task IsTokenBlacklistedAsync_WithBlacklistedToken_ReturnsTrue()
    {
        // Arrange
        var tokenId = "blacklisted_token";

        _mockCacheService.Setup(x => x.ExistsAsync(
            It.Is<string>(k => k.Contains($"token:blacklist:{tokenId}")),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await _distributedCacheService.IsTokenBlacklistedAsync(tokenId);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public async Task IsTokenBlacklistedAsync_WithValidToken_ReturnsFalse()
    {
        // Arrange
        var tokenId = "valid_token";

        _mockCacheService.Setup(x => x.ExistsAsync(
            It.Is<string>(k => k.Contains($"token:blacklist:{tokenId}")),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _distributedCacheService.IsTokenBlacklistedAsync(tokenId);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task SetRefreshTokenAsync_WithValidToken_CallsCacheServiceSet()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var refreshToken = "refresh_token_123";
        var expiration = TimeSpan.FromDays(7);

        // Act
        await _distributedCacheService.SetRefreshTokenAsync(userId, refreshToken, expiration);

        // Assert
        _mockCacheService.Verify(x => x.SetStringAsync(
            It.Is<string>(k => k.Contains($"token:refresh:{userId}")),
            refreshToken,
            expiration,
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetRefreshTokenAsync_WithValidUserId_ReturnsToken()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var expectedToken = "refresh_token_123";

        _mockCacheService.Setup(x => x.GetStringAsync(
            It.Is<string>(k => k.Contains($"token:refresh:{userId}")),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedToken);

        // Act
        var result = await _distributedCacheService.GetRefreshTokenAsync(userId);

        // Assert
        Assert.Equal(expectedToken, result);
    }

    [Fact]
    public async Task RemoveRefreshTokenAsync_WithValidUserId_CallsCacheServiceRemove()
    {
        // Arrange
        var userId = Guid.NewGuid();

        // Act
        await _distributedCacheService.RemoveRefreshTokenAsync(userId);

        // Assert
        _mockCacheService.Verify(x => x.RemoveAsync(
            It.Is<string>(k => k.Contains($"token:refresh:{userId}")),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task SetUserPreferencesAsync_WithValidPreferences_CallsCacheService()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var preferences = new { Theme = "dark", Language = "en" };

        // Act
        await _distributedCacheService.SetUserPreferencesAsync(userId, preferences);

        // Assert
        _mockCacheService.Verify(x => x.SetAsync(
            It.Is<string>(k => k.Contains($"user:{userId}:preferences")),
            preferences,
            TimeSpan.FromHours(12),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetUserPreferencesAsync_WithValidUserId_ReturnsPreferences()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var expectedPreferences = new TestUserPreferences { Theme = "dark", Language = "en" };

        _mockCacheService.Setup(x => x.GetAsync<TestUserPreferences>(
            It.Is<string>(k => k.Contains($"user:{userId}:preferences")),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedPreferences);

        // Act
        var result = await _distributedCacheService.GetUserPreferencesAsync<TestUserPreferences>(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(expectedPreferences.Theme, result.Theme);
        Assert.Equal(expectedPreferences.Language, result.Language);
    }

    [Fact]
    public async Task SetDrawingLockAsync_WithValidData_CallsCacheService()
    {
        // Arrange
        var drawingId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var expiration = TimeSpan.FromMinutes(30);

        // Act
        await _distributedCacheService.SetDrawingLockAsync(drawingId, userId, expiration);

        // Assert
        _mockCacheService.Verify(x => x.SetStringAsync(
            It.Is<string>(k => k.Contains($"drawing:{drawingId}:lock")),
            userId.ToString(),
            expiration,
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetDrawingLockAsync_WithLockedDrawing_ReturnsUserId()
    {
        // Arrange
        var drawingId = Guid.NewGuid();
        var expectedUserId = Guid.NewGuid();

        _mockCacheService.Setup(x => x.GetStringAsync(
            It.Is<string>(k => k.Contains($"drawing:{drawingId}:lock")),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedUserId.ToString());

        // Act
        var result = await _distributedCacheService.GetDrawingLockAsync(drawingId);

        // Assert
        Assert.Equal(expectedUserId, result);
    }

    [Fact]
    public async Task GetDrawingLockAsync_WithUnlockedDrawing_ReturnsNull()
    {
        // Arrange
        var drawingId = Guid.NewGuid();

        _mockCacheService.Setup(x => x.GetStringAsync(
            It.Is<string>(k => k.Contains($"drawing:{drawingId}:lock")),
            It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);

        // Act
        var result = await _distributedCacheService.GetDrawingLockAsync(drawingId);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task RemoveDrawingLockAsync_WithValidDrawingId_CallsCacheServiceRemove()
    {
        // Arrange
        var drawingId = Guid.NewGuid();

        // Act
        await _distributedCacheService.RemoveDrawingLockAsync(drawingId);

        // Assert
        _mockCacheService.Verify(x => x.RemoveAsync(
            It.Is<string>(k => k.Contains($"drawing:{drawingId}:lock")),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    private class TestSessionData
    {
        public Guid UserId { get; set; }
        public DateTime LoginTime { get; set; }
    }

    private class TestUserPreferences
    {
        public string Theme { get; set; } = string.Empty;
        public string Language { get; set; } = string.Empty;
    }
}