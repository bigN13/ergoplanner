using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using FluentAssertions;
using Ergoplanner.Infrastructure.Services;
using Ergoplanner.Infrastructure.SignalR;
using Ergoplanner.Application.DTOs.SignalR;
using Ergoplanner.Application.Interfaces;

namespace Ergoplanner.UnitTests.Infrastructure.SignalR
{
    public class SignalRServiceTests
    {
        private readonly Mock<IHubContext<DrawingHub>> _mockDrawingHubContext;
        private readonly Mock<IHubContext<NotificationHub>> _mockNotificationHubContext;
        private readonly Mock<IHubContext<WorkflowHub>> _mockWorkflowHubContext;
        private readonly Mock<IConnectionManagerService> _mockConnectionManager;
        private readonly Mock<ILogger<SignalRService>> _mockLogger;
        private readonly SignalRService _service;

        private readonly Mock<IHubCallerClients> _mockClients;
        private readonly Mock<IClientProxy> _mockClientProxy;

        public SignalRServiceTests()
        {
            _mockDrawingHubContext = new Mock<IHubContext<DrawingHub>>();
            _mockNotificationHubContext = new Mock<IHubContext<NotificationHub>>();
            _mockWorkflowHubContext = new Mock<IHubContext<WorkflowHub>>();
            _mockConnectionManager = new Mock<IConnectionManagerService>();
            _mockLogger = new Mock<ILogger<SignalRService>>();

            _mockClients = new Mock<IHubCallerClients>();
            _mockClientProxy = new Mock<IClientProxy>();

            _service = new SignalRService(
                _mockDrawingHubContext.Object,
                _mockNotificationHubContext.Object,
                _mockWorkflowHubContext.Object,
                _mockConnectionManager.Object,
                _mockLogger.Object);
        }

        [Fact]
        public async Task SendDrawingUpdateAsync_ShouldSendToDrawingGroup_WhenCalled()
        {
            // Arrange
            var drawingId = "drawing123";
            var update = new DrawingUpdateDto
            {
                DrawingId = Guid.Parse("12345678-1234-1234-1234-123456789012"),
                UserId = Guid.NewGuid(),
                UserName = "Test User",
                UpdateType = "component_added",
                UpdateData = new Dictionary<string, object> { { "componentId", "comp123" } },
                Timestamp = DateTime.UtcNow
            };

            _mockDrawingHubContext.Setup(h => h.Clients).Returns(_mockClients.Object);
            _mockClients.Setup(c => c.Group($"drawing_{drawingId}")).Returns(_mockClientProxy.Object);
            _mockClientProxy.Setup(p => p.SendCoreAsync(
                "DrawingUpdate",
                It.IsAny<object[]>(),
                It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            // Act
            await _service.SendDrawingUpdateAsync(drawingId, update);

            // Assert
            _mockClientProxy.Verify(p => p.SendCoreAsync(
                "DrawingUpdate",
                It.Is<object[]>(args => args.Length == 1 && args[0] == update),
                It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task SendNotificationToUserAsync_ShouldSendToUserGroup_WhenCalled()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var notification = new NotificationDto
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Type = "info",
                Title = "Test Notification",
                Message = "Test message",
                CreatedAt = DateTime.UtcNow
            };

            _mockNotificationHubContext.Setup(h => h.Clients).Returns(_mockClients.Object);
            _mockClients.Setup(c => c.Group($"user_{userId}")).Returns(_mockClientProxy.Object);
            _mockClientProxy.Setup(p => p.SendCoreAsync(
                "NotificationReceived",
                It.IsAny<object[]>(),
                It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            // Act
            await _service.SendNotificationToUserAsync(userId, notification);

            // Assert
            _mockClientProxy.Verify(p => p.SendCoreAsync(
                "NotificationReceived",
                It.Is<object[]>(args => args.Length == 1 && args[0] == notification),
                It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task SendCursorUpdateAsync_ShouldSendToDrawingGroup_WhenCalled()
        {
            // Arrange
            var drawingId = "drawing123";
            var cursorPosition = new CursorPositionDto
            {
                UserId = Guid.NewGuid(),
                UserName = "Test User",
                X = 100.5,
                Y = 200.3,
                Timestamp = DateTime.UtcNow
            };

            _mockDrawingHubContext.Setup(h => h.Clients).Returns(_mockClients.Object);
            _mockClients.Setup(c => c.Group($"drawing_{drawingId}")).Returns(_mockClientProxy.Object);
            _mockClientProxy.Setup(p => p.SendCoreAsync(
                "CursorUpdate",
                It.IsAny<object[]>(),
                It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            // Act
            await _service.SendCursorUpdateAsync(drawingId, cursorPosition);

            // Assert
            _mockClientProxy.Verify(p => p.SendCoreAsync(
                "CursorUpdate",
                It.Is<object[]>(args => args.Length == 1 && args[0] == cursorPosition),
                It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task SendWorkflowUpdateAsync_ShouldSendToMultipleGroups_WhenCalled()
        {
            // Arrange
            var workflowUpdate = new WorkflowUpdateDto
            {
                WorkflowId = Guid.NewGuid(),
                DrawingId = Guid.NewGuid(),
                WorkflowType = "approval",
                Status = "pending",
                UpdateType = "stage_completed",
                Timestamp = DateTime.UtcNow
            };

            // Setup workflow hub
            _mockWorkflowHubContext.Setup(h => h.Clients).Returns(_mockClients.Object);
            _mockClients.Setup(c => c.Group($"workflow_{workflowUpdate.WorkflowId}")).Returns(_mockClientProxy.Object);
            _mockClients.Setup(c => c.Group($"project_workflows_{workflowUpdate.DrawingId}")).Returns(_mockClientProxy.Object);

            // Setup drawing hub
            _mockDrawingHubContext.Setup(h => h.Clients).Returns(_mockClients.Object);
            _mockClients.Setup(c => c.Group($"drawing_{workflowUpdate.DrawingId}")).Returns(_mockClientProxy.Object);

            _mockClientProxy.Setup(p => p.SendCoreAsync(
                "WorkflowUpdate",
                It.IsAny<object[]>(),
                It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            // Act
            await _service.SendWorkflowUpdateAsync(workflowUpdate);

            // Assert
            _mockClientProxy.Verify(p => p.SendCoreAsync(
                "WorkflowUpdate",
                It.Is<object[]>(args => args.Length == 1 && args[0] == workflowUpdate),
                It.IsAny<CancellationToken>()), Times.AtLeast(3)); // Should be sent to at least 3 groups
        }

        [Fact]
        public async Task SendSystemAnnouncementAsync_ShouldSendToAllClients_WhenCalled()
        {
            // Arrange
            var announcement = new NotificationDto
            {
                Id = Guid.NewGuid(),
                Type = "system",
                Title = "System Maintenance",
                Message = "System will be down for maintenance",
                CreatedAt = DateTime.UtcNow
            };

            // Setup all hub contexts
            _mockNotificationHubContext.Setup(h => h.Clients).Returns(_mockClients.Object);
            _mockDrawingHubContext.Setup(h => h.Clients).Returns(_mockClients.Object);
            _mockWorkflowHubContext.Setup(h => h.Clients).Returns(_mockClients.Object);

            _mockClients.Setup(c => c.All).Returns(_mockClientProxy.Object);
            _mockClientProxy.Setup(p => p.SendCoreAsync(
                "SystemAnnouncement",
                It.IsAny<object[]>(),
                It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            // Act
            await _service.SendSystemAnnouncementAsync(announcement);

            // Assert
            _mockClientProxy.Verify(p => p.SendCoreAsync(
                "SystemAnnouncement",
                It.Is<object[]>(args => args.Length == 1 && args[0] == announcement),
                It.IsAny<CancellationToken>()), Times.Exactly(3)); // Should be sent to all 3 hubs
        }
    }
}