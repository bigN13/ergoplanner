using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Ergoplanner.Application.DTOs.SignalR;
using Ergoplanner.Application.Interfaces;

namespace Ergoplanner.Infrastructure.SignalR
{
    /// <summary>
    /// SignalR Hub for workflow and approval process updates
    /// </summary>
    [Authorize]
    public class WorkflowHub : Hub
    {
        private readonly IConnectionManagerService _connectionManager;
        private readonly ILogger<WorkflowHub> _logger;

        public WorkflowHub(
            IConnectionManagerService connectionManager,
            ILogger<WorkflowHub> logger)
        {
            _connectionManager = connectionManager;
            _logger = logger;
        }

        /// <summary>
        /// Joins a workflow group to receive updates
        /// </summary>
        public async Task JoinWorkflow(string workflowId)
        {
            try
            {
                var userId = GetUserId();
                var userName = GetUserName();

                _logger.LogInformation("User {UserId} ({UserName}) joining workflow {WorkflowId}",
                    userId, userName, workflowId);

                await Groups.AddToGroupAsync(Context.ConnectionId, $"workflow_{workflowId}");

                // Register connection
                await _connectionManager.AddConnectionAsync(
                    Context.ConnectionId, userId, "WorkflowHub");

                await Clients.Caller.SendAsync("WorkflowJoined", workflowId);

                _logger.LogInformation("User {UserId} successfully joined workflow {WorkflowId}",
                    userId, workflowId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error joining workflow {WorkflowId} for user {UserId}",
                    workflowId, GetUserId());
                await Clients.Caller.SendAsync("WorkflowJoinFailed", "Failed to join workflow");
            }
        }

        /// <summary>
        /// Leaves a workflow group
        /// </summary>
        public async Task LeaveWorkflow(string workflowId)
        {
            try
            {
                var userId = GetUserId();
                var userName = GetUserName();

                _logger.LogInformation("User {UserId} ({UserName}) leaving workflow {WorkflowId}",
                    userId, userName, workflowId);

                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"workflow_{workflowId}");

                await Clients.Caller.SendAsync("WorkflowLeft", workflowId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error leaving workflow {WorkflowId} for user {UserId}",
                    workflowId, GetUserId());
            }
        }

        /// <summary>
        /// Joins project workflow notifications
        /// </summary>
        public async Task JoinProjectWorkflows(string projectId)
        {
            try
            {
                var userId = GetUserId();
                var userName = GetUserName();

                _logger.LogInformation("User {UserId} ({UserName}) joining project workflows for {ProjectId}",
                    userId, userName, projectId);

                await Groups.AddToGroupAsync(Context.ConnectionId, $"project_workflows_{projectId}");

                await Clients.Caller.SendAsync("ProjectWorkflowsJoined", projectId);

                _logger.LogInformation("User {UserId} successfully joined project workflows for {ProjectId}",
                    userId, projectId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error joining project workflows for project {ProjectId} and user {UserId}",
                    projectId, GetUserId());
                await Clients.Caller.SendAsync("ProjectWorkflowsJoinFailed", "Failed to join project workflows");
            }
        }

        /// <summary>
        /// Submits an approval action (approve, reject, etc.)
        /// </summary>
        public async Task SubmitApprovalAction(string workflowId, string action, string? comments = null)
        {
            try
            {
                var userId = GetUserId();
                var userName = GetUserName();

                _logger.LogInformation("User {UserId} ({UserName}) submitting approval action {Action} for workflow {WorkflowId}",
                    userId, userName, action, workflowId);

                var actionData = new
                {
                    WorkflowId = workflowId,
                    Action = action,
                    UserId = userId,
                    UserName = userName,
                    Comments = comments,
                    Timestamp = DateTime.UtcNow
                };

                // Broadcast to all users in the workflow
                await Clients.Group($"workflow_{workflowId}")
                    .SendAsync("ApprovalActionSubmitted", actionData);

                await Clients.Caller.SendAsync("ApprovalActionSuccess", actionData);

                _logger.LogInformation("Approval action {Action} submitted successfully for workflow {WorkflowId}",
                    action, workflowId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting approval action for workflow {WorkflowId} by user {UserId}",
                    workflowId, GetUserId());
                await Clients.Caller.SendAsync("ApprovalActionFailed", "Failed to submit approval action");
            }
        }

        /// <summary>
        /// Requests workflow status update
        /// </summary>
        public async Task RequestWorkflowStatus(string workflowId)
        {
            try
            {
                var userId = GetUserId();

                _logger.LogDebug("User {UserId} requesting status for workflow {WorkflowId}",
                    userId, workflowId);

                // In a real implementation, you would fetch the current workflow status from the database
                // For now, we'll send a mock status
                var mockStatus = new
                {
                    WorkflowId = workflowId,
                    Status = "pending_review",
                    CurrentStage = "reviewer",
                    PendingApprovers = new[] { "user1", "user2" },
                    CompletedStages = new[] { "author", "checker" },
                    LastUpdate = DateTime.UtcNow
                };

                await Clients.Caller.SendAsync("WorkflowStatus", mockStatus);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error requesting workflow status for workflow {WorkflowId} by user {UserId}",
                    workflowId, GetUserId());
            }
        }

        /// <summary>
        /// Escalates a workflow to the next stage or management
        /// </summary>
        public async Task EscalateWorkflow(string workflowId, string reason)
        {
            try
            {
                var userId = GetUserId();
                var userName = GetUserName();

                _logger.LogInformation("User {UserId} ({UserName}) escalating workflow {WorkflowId}. Reason: {Reason}",
                    userId, userName, workflowId, reason);

                var escalationData = new
                {
                    WorkflowId = workflowId,
                    EscalatedBy = userId,
                    EscalatedByName = userName,
                    Reason = reason,
                    Timestamp = DateTime.UtcNow
                };

                // Broadcast to all users in the workflow
                await Clients.Group($"workflow_{workflowId}")
                    .SendAsync("WorkflowEscalated", escalationData);

                await Clients.Caller.SendAsync("WorkflowEscalationSuccess", escalationData);

                _logger.LogInformation("Workflow {WorkflowId} escalated successfully by user {UserId}",
                    workflowId, userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error escalating workflow {WorkflowId} by user {UserId}",
                    workflowId, GetUserId());
                await Clients.Caller.SendAsync("WorkflowEscalationFailed", "Failed to escalate workflow");
            }
        }

        /// <summary>
        /// Adds a comment to a workflow
        /// </summary>
        public async Task AddWorkflowComment(string workflowId, string comment, string? parentCommentId = null)
        {
            try
            {
                var userId = GetUserId();
                var userName = GetUserName();

                _logger.LogDebug("User {UserId} ({UserName}) adding comment to workflow {WorkflowId}",
                    userId, userName, workflowId);

                var commentData = new
                {
                    Id = Guid.NewGuid(),
                    WorkflowId = workflowId,
                    UserId = userId,
                    UserName = userName,
                    Comment = comment,
                    ParentCommentId = parentCommentId,
                    Timestamp = DateTime.UtcNow
                };

                // Broadcast to all users in the workflow
                await Clients.Group($"workflow_{workflowId}")
                    .SendAsync("WorkflowCommentAdded", commentData);

                await Clients.Caller.SendAsync("WorkflowCommentSuccess", commentData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding comment to workflow {WorkflowId} by user {UserId}",
                    workflowId, GetUserId());
                await Clients.Caller.SendAsync("WorkflowCommentFailed", "Failed to add comment");
            }
        }

        /// <summary>
        /// Requests list of pending approvals for the current user
        /// </summary>
        public async Task GetPendingApprovals()
        {
            try
            {
                var userId = GetUserId();

                _logger.LogDebug("User {UserId} requesting pending approvals", userId);

                // In a real implementation, you would query the database for pending approvals
                // For now, we'll return a mock list
                var mockPendingApprovals = new[]
                {
                    new
                    {
                        WorkflowId = Guid.NewGuid(),
                        DrawingId = Guid.NewGuid(),
                        DrawingName = "P&ID Drawing 001",
                        RequiredAction = "review",
                        SubmittedBy = "John Doe",
                        SubmittedAt = DateTime.UtcNow.AddHours(-2),
                        Priority = "normal"
                    }
                };

                await Clients.Caller.SendAsync("PendingApprovals", mockPendingApprovals);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting pending approvals for user {UserId}", GetUserId());
            }
        }

        public override async Task OnConnectedAsync()
        {
            var userId = GetUserId();
            var userName = GetUserName();

            _logger.LogInformation("User {UserId} ({UserName}) connected to WorkflowHub with connection {ConnectionId}",
                userId, userName, Context.ConnectionId);

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = GetUserId();
            var userName = GetUserName();

            _logger.LogInformation("User {UserId} ({UserName}) disconnected from WorkflowHub. Connection: {ConnectionId}",
                userId, userName, Context.ConnectionId);

            if (exception != null)
            {
                _logger.LogError(exception, "User {UserId} disconnected with error", userId);
            }

            // Clean up connection
            await _connectionManager.RemoveConnectionAsync(Context.ConnectionId);

            await base.OnDisconnectedAsync(exception);
        }

        private Guid GetUserId()
        {
            var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
        }

        private string GetUserName()
        {
            return Context.User?.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown User";
        }
    }
}