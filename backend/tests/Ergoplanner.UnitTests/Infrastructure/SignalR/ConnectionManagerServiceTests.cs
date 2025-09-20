using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using FluentAssertions;
using Ergoplanner.Infrastructure.Services;
using Ergoplanner.Application.DTOs.SignalR;
using System.Collections.Generic;

namespace Ergoplanner.UnitTests.Infrastructure.SignalR
{
    public class ConnectionManagerServiceTests
    {
        private readonly Mock<IDistributedCache> _mockCache;
        private readonly Mock<ILogger<ConnectionManagerService>> _mockLogger;
        private readonly ConnectionManagerService _service;

        public ConnectionManagerServiceTests()
        {
            _mockCache = new Mock<IDistributedCache>();
            _mockLogger = new Mock<ILogger<ConnectionManagerService>>();
            _service = new ConnectionManagerService(_mockCache.Object, _mockLogger.Object);
        }

        [Fact]
        public async Task AddConnectionAsync_ShouldStoreConnection_WhenValidParameters()
        {
            // Arrange
            var connectionId = "connection123";
            var userId = Guid.NewGuid();
            var hubName = "DrawingHub";
            var drawingId = "drawing123";

            _mockCache.Setup(c => c.SetStringAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<DistributedCacheEntryOptions>(),
                default))
                .Returns(Task.CompletedTask);

            _mockCache.Setup(c => c.GetStringAsync(It.IsAny<string>(), default))
                .ReturnsAsync((string?)null);

            // Act
            await _service.AddConnectionAsync(connectionId, userId, hubName, drawingId);

            // Assert
            _mockCache.Verify(c => c.SetStringAsync(
                $"connection:{connectionId}",
                It.IsAny<string>(),
                It.IsAny<DistributedCacheEntryOptions>(),
                default), Times.Once);

            _mockCache.Verify(c => c.SetStringAsync(
                $"user_connections:{userId}",
                It.IsAny<string>(),
                It.IsAny<DistributedCacheEntryOptions>(),
                default), Times.Once);

            _mockCache.Verify(c => c.SetStringAsync(
                $"drawing_connections:{drawingId}",
                It.IsAny<string>(),
                It.IsAny<DistributedCacheEntryOptions>(),
                default), Times.Once);
        }

        [Fact]
        public async Task RemoveConnectionAsync_ShouldRemoveConnection_WhenConnectionExists()
        {
            // Arrange
            var connectionId = "connection123";
            var userId = Guid.NewGuid();
            var drawingId = "drawing123";

            var connectionJson = $@"{{
                ""Id"": ""{Guid.NewGuid()}"",
                ""ConnectionId"": ""{connectionId}"",
                ""UserId"": ""{userId}"",
                ""HubName"": ""DrawingHub"",
                ""DrawingId"": ""{drawingId}"",
                ""ConnectedAt"": ""{DateTime.UtcNow:O}"",
                ""LastActivity"": ""{DateTime.UtcNow:O}"",
                ""IsActive"": true,
                ""CreatedAt"": ""{DateTime.UtcNow:O}"",
                ""UpdatedAt"": ""{DateTime.UtcNow:O}""
            }}";

            _mockCache.Setup(c => c.GetStringAsync($"connection:{connectionId}", default))
                .ReturnsAsync(connectionJson);

            _mockCache.Setup(c => c.GetStringAsync($"user_connections:{userId}", default))
                .ReturnsAsync($"[\"{connectionId}\"]");

            _mockCache.Setup(c => c.GetStringAsync($"drawing_connections:{drawingId}", default))
                .ReturnsAsync($"[\"{connectionId}\"]");

            _mockCache.Setup(c => c.RemoveAsync(It.IsAny<string>(), default))
                .Returns(Task.CompletedTask);

            _mockCache.Setup(c => c.SetStringAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<DistributedCacheEntryOptions>(),
                default))
                .Returns(Task.CompletedTask);

            // Act
            await _service.RemoveConnectionAsync(connectionId);

            // Assert
            _mockCache.Verify(c => c.RemoveAsync($"connection:{connectionId}", default), Times.Once);
        }

        [Fact]
        public async Task UpdateUserPresenceAsync_ShouldUpdatePresence_WhenValidParameters()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var status = "online";
            var drawingId = "drawing123";

            _mockCache.Setup(c => c.GetStringAsync($"presence:{userId}", default))
                .ReturnsAsync((string?)null);

            _mockCache.Setup(c => c.SetStringAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<DistributedCacheEntryOptions>(),
                default))
                .Returns(Task.CompletedTask);

            // Act
            await _service.UpdateUserPresenceAsync(userId, status, drawingId);

            // Assert
            _mockCache.Verify(c => c.SetStringAsync(
                $"presence:{userId}",
                It.IsAny<string>(),
                It.IsAny<DistributedCacheEntryOptions>(),
                default), Times.Once);
        }

        [Fact]
        public async Task GetUserPresenceAsync_ShouldReturnNull_WhenPresenceNotFound()
        {
            // Arrange
            var userId = Guid.NewGuid();

            _mockCache.Setup(c => c.GetStringAsync($"presence:{userId}", default))
                .ReturnsAsync((string?)null);

            // Act
            var result = await _service.GetUserPresenceAsync(userId);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task GetUserPresenceAsync_ShouldReturnPresence_WhenPresenceExists()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var userName = "Test User";
            var status = "online";

            var presenceJson = $@"{{
                ""UserId"": ""{userId}"",
                ""UserName"": ""{userName}"",
                ""DisplayName"": ""{userName}"",
                ""Status"": ""{status}"",
                ""LastSeen"": ""{DateTime.UtcNow:O}""
            }}";

            _mockCache.Setup(c => c.GetStringAsync($"presence:{userId}", default))
                .ReturnsAsync(presenceJson);

            // Act
            var result = await _service.GetUserPresenceAsync(userId);

            // Assert
            result.Should().NotBeNull();
            result!.UserId.Should().Be(userId);
            result.UserName.Should().Be(userName);
            result.Status.Should().Be(status);
        }
    }
}