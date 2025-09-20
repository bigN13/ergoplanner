using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace Ergoplanner.Infrastructure.SignalR.Filters
{
    /// <summary>
    /// Global exception filter for SignalR hubs
    /// </summary>
    public class SignalRExceptionFilter : IHubFilter
    {
        private readonly ILogger<SignalRExceptionFilter> _logger;

        public SignalRExceptionFilter(ILogger<SignalRExceptionFilter> logger)
        {
            _logger = logger;
        }

        public async ValueTask<object?> InvokeMethodAsync(
            HubInvocationContext invocationContext,
            Func<HubInvocationContext, ValueTask<object?>> next)
        {
            try
            {
                return await next(invocationContext);
            }
            catch (HubException hubEx)
            {
                // Hub exceptions are already meant to be sent to the client
                _logger.LogWarning(hubEx,
                    "Hub exception in {HubName}.{MethodName} for connection {ConnectionId}: {Message}",
                    invocationContext.Hub.GetType().Name,
                    invocationContext.HubMethodName,
                    invocationContext.Context.ConnectionId,
                    hubEx.Message);
                throw;
            }
            catch (UnauthorizedAccessException unauthorizedEx)
            {
                _logger.LogWarning(unauthorizedEx,
                    "Unauthorized access in {HubName}.{MethodName} for connection {ConnectionId}",
                    invocationContext.Hub.GetType().Name,
                    invocationContext.HubMethodName,
                    invocationContext.Context.ConnectionId);

                throw new HubException("Unauthorized access");
            }
            catch (ArgumentException argEx)
            {
                _logger.LogWarning(argEx,
                    "Invalid argument in {HubName}.{MethodName} for connection {ConnectionId}: {Message}",
                    invocationContext.Hub.GetType().Name,
                    invocationContext.HubMethodName,
                    invocationContext.Context.ConnectionId,
                    argEx.Message);

                throw new HubException("Invalid arguments provided");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Unhandled exception in {HubName}.{MethodName} for connection {ConnectionId}",
                    invocationContext.Hub.GetType().Name,
                    invocationContext.HubMethodName,
                    invocationContext.Context.ConnectionId);

                // Don't expose internal errors to clients
                throw new HubException("An error occurred while processing your request");
            }
        }

        public async Task OnConnectedAsync(HubLifetimeContext context, Func<HubLifetimeContext, Task> next)
        {
            try
            {
                _logger.LogInformation(
                    "Client connecting to {HubName}: {ConnectionId} from {UserAgent}",
                    context.Hub.GetType().Name,
                    context.Context.ConnectionId,
                    context.Context.GetHttpContext()?.Request.Headers["User-Agent"].ToString() ?? "Unknown");

                await next(context);

                _logger.LogInformation(
                    "Client connected to {HubName}: {ConnectionId}",
                    context.Hub.GetType().Name,
                    context.Context.ConnectionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error during connection to {HubName} for connection {ConnectionId}",
                    context.Hub.GetType().Name,
                    context.Context.ConnectionId);
                throw;
            }
        }

        public async Task OnDisconnectedAsync(HubLifetimeContext context, Exception? exception, Func<HubLifetimeContext, Exception?, Task> next)
        {
            try
            {
                if (exception != null)
                {
                    _logger.LogWarning(exception,
                        "Client disconnected from {HubName} with error: {ConnectionId}",
                        context.Hub.GetType().Name,
                        context.Context.ConnectionId);
                }
                else
                {
                    _logger.LogInformation(
                        "Client disconnected from {HubName}: {ConnectionId}",
                        context.Hub.GetType().Name,
                        context.Context.ConnectionId);
                }

                await next(context, exception);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error during disconnection from {HubName} for connection {ConnectionId}",
                    context.Hub.GetType().Name,
                    context.Context.ConnectionId);
            }
        }
    }

    /// <summary>
    /// Logging filter for SignalR hubs to track method invocations
    /// </summary>
    public class SignalRLoggingFilter : IHubFilter
    {
        private readonly ILogger<SignalRLoggingFilter> _logger;

        public SignalRLoggingFilter(ILogger<SignalRLoggingFilter> logger)
        {
            _logger = logger;
        }

        public async ValueTask<object?> InvokeMethodAsync(
            HubInvocationContext invocationContext,
            Func<HubInvocationContext, ValueTask<object?>> next)
        {
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();

            try
            {
                _logger.LogDebug(
                    "Invoking {HubName}.{MethodName} for connection {ConnectionId} with {ArgumentCount} arguments",
                    invocationContext.Hub.GetType().Name,
                    invocationContext.HubMethodName,
                    invocationContext.Context.ConnectionId,
                    invocationContext.HubMethodArguments?.Count ?? 0);

                var result = await next(invocationContext);

                stopwatch.Stop();

                _logger.LogDebug(
                    "Completed {HubName}.{MethodName} for connection {ConnectionId} in {ElapsedMs}ms",
                    invocationContext.Hub.GetType().Name,
                    invocationContext.HubMethodName,
                    invocationContext.Context.ConnectionId,
                    stopwatch.ElapsedMilliseconds);

                return result;
            }
            catch (Exception)
            {
                stopwatch.Stop();

                _logger.LogWarning(
                    "Failed {HubName}.{MethodName} for connection {ConnectionId} in {ElapsedMs}ms",
                    invocationContext.Hub.GetType().Name,
                    invocationContext.HubMethodName,
                    invocationContext.Context.ConnectionId,
                    stopwatch.ElapsedMilliseconds);

                throw;
            }
        }
    }

    /// <summary>
    /// Performance monitoring filter for SignalR hubs
    /// </summary>
    public class SignalRPerformanceFilter : IHubFilter
    {
        private readonly ILogger<SignalRPerformanceFilter> _logger;
        private const int SlowOperationThresholdMs = 1000; // 1 second

        public SignalRPerformanceFilter(ILogger<SignalRPerformanceFilter> logger)
        {
            _logger = logger;
        }

        public async ValueTask<object?> InvokeMethodAsync(
            HubInvocationContext invocationContext,
            Func<HubInvocationContext, ValueTask<object?>> next)
        {
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();

            try
            {
                var result = await next(invocationContext);

                stopwatch.Stop();

                // Log slow operations
                if (stopwatch.ElapsedMilliseconds > SlowOperationThresholdMs)
                {
                    _logger.LogWarning(
                        "Slow operation detected: {HubName}.{MethodName} for connection {ConnectionId} took {ElapsedMs}ms",
                        invocationContext.Hub.GetType().Name,
                        invocationContext.HubMethodName,
                        invocationContext.Context.ConnectionId,
                        stopwatch.ElapsedMilliseconds);
                }

                return result;
            }
            catch (Exception)
            {
                stopwatch.Stop();
                throw;
            }
        }
    }
}