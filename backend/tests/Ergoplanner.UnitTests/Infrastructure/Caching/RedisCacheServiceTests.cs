using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using StackExchange.Redis;
using Xunit;
using Ergoplanner.Infrastructure.Caching.Configuration;
using Ergoplanner.Infrastructure.Caching.Services;

namespace Ergoplanner.UnitTests.Infrastructure.Caching;

public class RedisCacheServiceTests
{
    private readonly Mock<IConnectionMultiplexer> _mockConnectionMultiplexer;
    private readonly Mock<IDatabase> _mockDatabase;
    private readonly Mock<ILogger<RedisCacheService>> _mockLogger;
    private readonly IOptions<RedisConfiguration> _configuration;
    private readonly RedisCacheService _cacheService;

    public RedisCacheServiceTests()
    {
        _mockConnectionMultiplexer = new Mock<IConnectionMultiplexer>();
        _mockDatabase = new Mock<IDatabase>();
        _mockLogger = new Mock<ILogger<RedisCacheService>>();

        var redisConfig = new RedisConfiguration
        {
            ConnectionString = "localhost:6379",
            InstanceName = "TestInstance",
            DefaultDatabase = 0
        };
        _configuration = Options.Create(redisConfig);

        _mockConnectionMultiplexer.Setup(x => x.GetDatabase(It.IsAny<int>(), It.IsAny<object>()))
            .Returns(_mockDatabase.Object);

        _cacheService = new RedisCacheService(_mockConnectionMultiplexer.Object, _configuration, _mockLogger.Object);
    }

    [Fact]
    public async Task GetAsync_WithExistingKey_ReturnsDeserializedObject()
    {
        // Arrange
        var key = "test_key";
        var testObject = new TestObject { Id = 1, Name = "Test" };
        var serializedValue = JsonSerializer.Serialize(testObject);

        _mockDatabase.Setup(x => x.StringGetAsync(key, It.IsAny<CommandFlags>()))
            .ReturnsAsync(new RedisValue(serializedValue));

        // Act
        var result = await _cacheService.GetAsync<TestObject>(key);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(testObject.Id, result.Id);
        Assert.Equal(testObject.Name, result.Name);
    }

    [Fact]
    public async Task GetAsync_WithNonExistingKey_ReturnsNull()
    {
        // Arrange
        var key = "non_existing_key";

        _mockDatabase.Setup(x => x.StringGetAsync(key, It.IsAny<CommandFlags>()))
            .ReturnsAsync(RedisValue.Null);

        // Act
        var result = await _cacheService.GetAsync<TestObject>(key);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task SetAsync_WithValidObject_CallsStringSetAsync()
    {
        // Arrange
        var key = "test_key";
        var testObject = new TestObject { Id = 1, Name = "Test" };
        var expiration = TimeSpan.FromMinutes(5);

        // Act
        await _cacheService.SetAsync(key, testObject, expiration);

        // Assert
        _mockDatabase.Verify(x => x.StringSetAsync(
            key,
            It.IsAny<RedisValue>(),
            expiration,
            It.IsAny<When>(),
            It.IsAny<CommandFlags>()), Times.Once);
    }

    [Fact]
    public async Task RemoveAsync_WithValidKey_CallsKeyDeleteAsync()
    {
        // Arrange
        var key = "test_key";

        // Act
        await _cacheService.RemoveAsync(key);

        // Assert
        _mockDatabase.Verify(x => x.KeyDeleteAsync(key, It.IsAny<CommandFlags>()), Times.Once);
    }

    [Fact]
    public async Task RemoveAsync_WithMultipleKeys_CallsKeyDeleteAsyncWithArray()
    {
        // Arrange
        var keys = new[] { "key1", "key2", "key3" };

        // Act
        await _cacheService.RemoveAsync(keys);

        // Assert
        _mockDatabase.Verify(x => x.KeyDeleteAsync(
            It.Is<RedisKey[]>(k => k.Length == 3),
            It.IsAny<CommandFlags>()), Times.Once);
    }

    [Fact]
    public async Task ExistsAsync_WithExistingKey_ReturnsTrue()
    {
        // Arrange
        var key = "existing_key";

        _mockDatabase.Setup(x => x.KeyExistsAsync(key, It.IsAny<CommandFlags>()))
            .ReturnsAsync(true);

        // Act
        var result = await _cacheService.ExistsAsync(key);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public async Task ExistsAsync_WithNonExistingKey_ReturnsFalse()
    {
        // Arrange
        var key = "non_existing_key";

        _mockDatabase.Setup(x => x.KeyExistsAsync(key, It.IsAny<CommandFlags>()))
            .ReturnsAsync(false);

        // Act
        var result = await _cacheService.ExistsAsync(key);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task GetOrSetAsync_WithCachedValue_ReturnsFromCache()
    {
        // Arrange
        var key = "test_key";
        var cachedObject = new TestObject { Id = 1, Name = "Cached" };
        var serializedValue = JsonSerializer.Serialize(cachedObject);

        _mockDatabase.Setup(x => x.StringGetAsync(key, It.IsAny<CommandFlags>()))
            .ReturnsAsync(new RedisValue(serializedValue));

        var getItemCalled = false;
        Func<Task<TestObject>> getItem = () =>
        {
            getItemCalled = true;
            return Task.FromResult(new TestObject { Id = 2, Name = "Fresh" });
        };

        // Act
        var result = await _cacheService.GetOrSetAsync(key, getItem);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(cachedObject.Id, result.Id);
        Assert.Equal(cachedObject.Name, result.Name);
        Assert.False(getItemCalled);
    }

    [Fact]
    public async Task GetOrSetAsync_WithoutCachedValue_ReturnsFromSourceAndCaches()
    {
        // Arrange
        var key = "test_key";
        var freshObject = new TestObject { Id = 2, Name = "Fresh" };

        _mockDatabase.Setup(x => x.StringGetAsync(key, It.IsAny<CommandFlags>()))
            .ReturnsAsync(RedisValue.Null);

        var getItemCalled = false;
        Func<Task<TestObject>> getItem = () =>
        {
            getItemCalled = true;
            return Task.FromResult(freshObject);
        };

        // Act
        var result = await _cacheService.GetOrSetAsync(key, getItem);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(freshObject.Id, result.Id);
        Assert.Equal(freshObject.Name, result.Name);
        Assert.True(getItemCalled);

        // Verify that the value was cached
        _mockDatabase.Verify(x => x.StringSetAsync(
            key,
            It.IsAny<RedisValue>(),
            It.IsAny<TimeSpan?>(),
            It.IsAny<When>(),
            It.IsAny<CommandFlags>()), Times.Once);
    }

    [Fact]
    public async Task ExpireAsync_WithValidKey_CallsKeyExpireAsync()
    {
        // Arrange
        var key = "test_key";
        var expiration = TimeSpan.FromMinutes(10);

        // Act
        await _cacheService.ExpireAsync(key, expiration);

        // Assert
        _mockDatabase.Verify(x => x.KeyExpireAsync(key, expiration, It.IsAny<CommandFlags>()), Times.Once);
    }

    [Fact]
    public async Task GetTtlAsync_WithValidKey_ReturnsTimeSpan()
    {
        // Arrange
        var key = "test_key";
        var expectedTtl = TimeSpan.FromMinutes(5);

        _mockDatabase.Setup(x => x.KeyTimeToLiveAsync(key, It.IsAny<CommandFlags>()))
            .ReturnsAsync(expectedTtl);

        // Act
        var result = await _cacheService.GetTtlAsync(key);

        // Assert
        Assert.Equal(expectedTtl, result);
    }

    private class TestObject
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }
}