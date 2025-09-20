using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using FluentAssertions;
using Ergoplanner.Infrastructure.SignalR;
using Ergoplanner.Application.Interfaces;
using Ergoplanner.Application.DTOs.SignalR;

namespace Ergoplanner.UnitTests.Infrastructure.SignalR
{
    public class DrawingHubTests
    {
        private readonly Mock<IConnectionManagerService> _mockConnectionManager;
        private readonly Mock<ILogger<DrawingHub>> _mockLogger;
        private readonly Mock<HubCallerContext> _mockContext;
        private readonly Mock<IHubCallerClients> _mockClients;
        private readonly Mock<IGroupManager> _mockGroups;
        private readonly Mock<IClientProxy> _mockClientProxy;
        private readonly DrawingHub _hub;

        public DrawingHubTests()
        {
            _mockConnectionManager = new Mock<IConnectionManagerService>();
            _mockLogger = new Mock<ILogger<DrawingHub>>();
            _mockContext = new Mock<HubCallerContext>();
            _mockClients = new Mock<IHubCallerClients>();
            _mockGroups = new Mock<IGroupManager>();
            _mockClientProxy = new Mock<IClientProxy>();

            _hub = new DrawingHub(_mockConnectionManager.Object, _mockLogger.Object);

            // Setup hub context
            _mockContext.Setup(c => c.ConnectionId).Returns("connection123");
            _mockContext.Setup(c => c.User).Returns(CreateTestUser());

            _hub.Context = _mockContext.Object;
            _hub.Clients = _mockClients.Object;
            _hub.Groups = _mockGroups.Object;

            // Setup client proxies
            _mockClients.Setup(c => c.Caller).Returns(_mockClientProxy.Object);
            _mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(_mockClientProxy.Object);
            _mockClients.Setup(c => c.GroupExcept(It.IsAny<string>(), It.IsAny<string>())).Returns(_mockClientProxy.Object);

            _mockClientProxy.Setup(p => p.SendCoreAsync(
                It.IsAny<string>(),
                It.IsAny<object[]>(),
                It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            _mockGroups.Setup(g => g.AddToGroupAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            _mockGroups.Setup(g => g.RemoveFromGroupAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);
        }

        [Fact]
        public async Task JoinDrawing_ShouldAddToGroup_WhenValidDrawingId()
        {
            // Arrange
            var drawingId = "drawing123";
            var userId = Guid.Parse("12345678-1234-1234-1234-123456789012");

            _mockConnectionManager.Setup(cm => cm.GetActiveUsersInDrawingAsync(drawingId))
                .ReturnsAsync(new List<UserPresenceDto>());

            _mockConnectionManager.Setup(cm => cm.AddConnectionAsync(
                It.IsAny<string>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()))
                .Returns(Task.CompletedTask);

            _mockConnectionManager.Setup(cm => cm.UpdateUserPresenceAsync(
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()))
                .Returns(Task.CompletedTask);

            _mockConnectionManager.Setup(cm => cm.GetUserPresenceAsync(It.IsAny<Guid>()))
                .ReturnsAsync(new UserPresenceDto
                {
                    UserId = userId,
                    UserName = "Test User",
                    Status = "online"
                });

            // Act
            await _hub.JoinDrawing(drawingId);

            // Assert
            _mockGroups.Verify(g => g.AddToGroupAsync(
                "connection123",
                $"drawing_{drawingId}",
                It.IsAny<CancellationToken>()), Times.Once);

            _mockConnectionManager.Verify(cm => cm.AddConnectionAsync(
                "connection123",
                userId,
                "DrawingHub",
                drawingId,
                null), Times.Once);

            _mockClientProxy.Verify(p => p.SendCoreAsync(
                "DrawingJoinSuccess",
                It.Is<object[]>(args => args.Length == 1 && args[0].ToString() == drawingId),
                It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task JoinDrawing_ShouldRejectJoin_WhenMaxEditorsReached()
        {
            // Arrange
            var drawingId = "drawing123";
            var activeUsers = new List<UserPresenceDto>();

            // Create 10 active users (max limit)
            for (int i = 0; i < 10; i++)
            {
                activeUsers.Add(new UserPresenceDto
                {
                    UserId = Guid.NewGuid(),
                    UserName = $"User{i}",
                    Status = "online"
                });
            }

            _mockConnectionManager.Setup(cm => cm.GetActiveUsersInDrawingAsync(drawingId))
                .ReturnsAsync(activeUsers);

            // Act
            await _hub.JoinDrawing(drawingId);

            // Assert
            _mockClientProxy.Verify(p => p.SendCoreAsync(
                "DrawingJoinFailed",
                It.Is<object[]>(args => args.Length == 1 && args[0].ToString().Contains("Maximum number")),
                It.IsAny<CancellationToken>()), Times.Once);

            _mockGroups.Verify(g => g.AddToGroupAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()), Times.Never);
        }

        [Fact]
        public async Task SendDrawingUpdate_ShouldBroadcastToGroup_WhenCalled()
        {
            // Arrange
            var drawingId = "drawing123";
            var updateData = new Dictionary<string, object> { { "componentId", "comp123" } };
            var updateType = "component_added";

            // Act
            await _hub.SendDrawingUpdate(drawingId, updateData, updateType);

            // Assert
            _mockClients.Verify(c => c.GroupExcept($"drawing_{drawingId}", "connection123"), Times.Once);
            _mockClientProxy.Verify(p => p.SendCoreAsync(
                "DrawingUpdate",
                It.Is<object[]>(args => args.Length == 1),
                It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task UpdateCursorPosition_ShouldBroadcastCursorPosition_WhenCalled()
        {
            // Arrange
            var drawingId = "drawing123";
            var x = 100.5;
            var y = 200.3;

            // Act
            await _hub.UpdateCursorPosition(drawingId, x, y);

            // Assert
            _mockClients.Verify(c => c.GroupExcept($"drawing_{drawingId}", "connection123"), Times.Once);
            _mockClientProxy.Verify(p => p.SendCoreAsync(
                "CursorUpdate",
                It.Is<object[]>(args => args.Length == 1),
                It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task RequestComponentLock_ShouldBroadcastLockRequest_WhenCalled()
        {
            // Arrange
            var drawingId = "drawing123";
            var componentId = "component456";

            // Act
            await _hub.RequestComponentLock(drawingId, componentId);

            // Assert
            _mockClients.Verify(c => c.Group($"drawing_{drawingId}"), Times.Once);
            _mockClientProxy.Verify(p => p.SendCoreAsync(
                "ComponentLockRequested",
                It.Is<object[]>(args => args.Length == 1),
                It.IsAny<CancellationToken>()), Times.Once);

            _mockClients.Verify(c => c.Caller, Times.Once);
            _mockClientProxy.Verify(p => p.SendCoreAsync(
                "ComponentLockGranted",
                It.Is<object[]>(args => args.Length == 1),
                It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task OnConnectedAsync_ShouldLogConnection_WhenCalled()
        {
            // Act
            await _hub.OnConnectedAsync();

            // Assert
            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("connected to DrawingHub")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception, string>>()),
                Times.Once);
        }

        [Fact]
        public async Task OnDisconnectedAsync_ShouldCleanupConnection_WhenCalled()
        {
            // Arrange
            _mockConnectionManager.Setup(cm => cm.RemoveConnectionAsync(It.IsAny<string>()))
                .Returns(Task.CompletedTask);

            // Act
            await _hub.OnDisconnectedAsync(null);

            // Assert
            _mockConnectionManager.Verify(cm => cm.RemoveConnectionAsync("connection123"), Times.Once);

            _mockLogger.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString().Contains("disconnected from DrawingHub")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception, string>>()),
                Times.Once);
        }

        private ClaimsPrincipal CreateTestUser()
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "12345678-1234-1234-1234-123456789012"),
                new Claim(ClaimTypes.Name, "Test User"),
                new Claim(ClaimTypes.Email, "test@example.com"),
                new Claim("OrganizationId", "87654321-4321-4321-4321-210987654321")
            };

            return new ClaimsPrincipal(new ClaimsIdentity(claims, "test"));
        }
    }
}