using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Diagnostics;
using System.Security.Claims;

namespace Ergoplanner.API.Controllers;

[ApiController]
public abstract class BaseController<T> : ControllerBase where T : class
{
    protected readonly ILogger<T> Logger;

    protected BaseController(ILogger<T> logger)
    {
        Logger = logger;
    }

    protected string? UserId => User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    protected string? UserEmail => User?.FindFirst(ClaimTypes.Email)?.Value;
    protected string? UserName => User?.FindFirst(ClaimTypes.Name)?.Value;
    protected string? OrganizationId => User?.FindFirst("OrganizationId")?.Value;

    protected void LogControllerAction(string actionName, object? parameters = null)
    {
        var correlationId = Activity.Current?.Id ?? Guid.NewGuid().ToString();

        Logger.LogInformation("Controller action {ActionName} started by user {UserId} with correlation ID {CorrelationId}",
            actionName, UserId ?? "Anonymous", correlationId);

        if (parameters != null)
        {
            Logger.LogDebug("Action parameters for {ActionName}: {@Parameters}",
                actionName, parameters);
        }
    }

    protected void LogControllerSuccess(string actionName, object? result = null, long? elapsedMs = null)
    {
        var correlationId = Activity.Current?.Id ?? Guid.NewGuid().ToString();

        if (elapsedMs.HasValue)
        {
            Logger.LogInformation("Controller action {ActionName} completed successfully by user {UserId} with correlation ID {CorrelationId} in {ElapsedMs}ms",
                actionName, UserId ?? "Anonymous", correlationId, elapsedMs.Value);
        }
        else
        {
            Logger.LogInformation("Controller action {ActionName} completed successfully by user {UserId} with correlation ID {CorrelationId}",
                actionName, UserId ?? "Anonymous", correlationId);
        }

        if (result != null)
        {
            Logger.LogDebug("Action result for {ActionName}: {@Result}",
                actionName, result);
        }
    }

    protected void LogControllerError(string actionName, Exception exception, object? parameters = null, long? elapsedMs = null)
    {
        var correlationId = Activity.Current?.Id ?? Guid.NewGuid().ToString();

        if (elapsedMs.HasValue)
        {
            Logger.LogError(exception, "Controller action {ActionName} failed for user {UserId} with correlation ID {CorrelationId} after {ElapsedMs}ms: {ErrorMessage}",
                actionName, UserId ?? "Anonymous", correlationId, elapsedMs.Value, exception.Message);
        }
        else
        {
            Logger.LogError(exception, "Controller action {ActionName} failed for user {UserId} with correlation ID {CorrelationId}: {ErrorMessage}",
                actionName, UserId ?? "Anonymous", correlationId, exception.Message);
        }

        if (parameters != null)
        {
            Logger.LogDebug("Action parameters that caused error in {ActionName}: {@Parameters}",
                actionName, parameters);
        }
    }

    protected void LogUnauthorizedAccess(string actionName, string? reason = null)
    {
        var correlationId = Activity.Current?.Id ?? Guid.NewGuid().ToString();

        Logger.LogWarning("Unauthorized access attempt to {ActionName} by user {UserId} with correlation ID {CorrelationId}: {Reason}",
            actionName, UserId ?? "Anonymous", correlationId, reason ?? "No specific reason");
    }

    protected void LogValidationError(string actionName, string validationError, object? model = null)
    {
        var correlationId = Activity.Current?.Id ?? Guid.NewGuid().ToString();

        Logger.LogWarning("Validation error in {ActionName} for user {UserId} with correlation ID {CorrelationId}: {ValidationError}",
            actionName, UserId ?? "Anonymous", correlationId, validationError);

        if (model != null)
        {
            Logger.LogDebug("Invalid model for {ActionName}: {@Model}",
                actionName, model);
        }
    }

    protected IActionResult HandleException(Exception exception, string actionName, object? parameters = null)
    {
        LogControllerError(actionName, exception, parameters);

        return exception switch
        {
            ArgumentException argEx => BadRequest(new { error = argEx.Message }),
            UnauthorizedAccessException => Unauthorized(new { error = "Access denied" }),
            KeyNotFoundException => NotFound(new { error = "Resource not found" }),
            InvalidOperationException invOpEx => Conflict(new { error = invOpEx.Message }),
            _ => StatusCode(500, new { error = "An unexpected error occurred" })
        };
    }

    protected async Task<IActionResult> ExecuteWithLogging<TResult>(
        string actionName,
        Func<Task<TResult>> operation,
        object? parameters = null)
    {
        var stopwatch = Stopwatch.StartNew();

        try
        {
            LogControllerAction(actionName, parameters);

            var result = await operation();

            stopwatch.Stop();
            LogControllerSuccess(actionName, result, stopwatch.ElapsedMilliseconds);

            return Ok(result);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            return HandleException(ex, actionName, parameters);
        }
    }

    protected async Task<IActionResult> ExecuteWithLogging(
        string actionName,
        Func<Task> operation,
        object? parameters = null)
    {
        var stopwatch = Stopwatch.StartNew();

        try
        {
            LogControllerAction(actionName, parameters);

            await operation();

            stopwatch.Stop();
            LogControllerSuccess(actionName, null, stopwatch.ElapsedMilliseconds);

            return Ok();
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            return HandleException(ex, actionName, parameters);
        }
    }

    protected string GetClientIpAddress()
    {
        // Check for X-Forwarded-For header (load balancer/proxy)
        var xForwardedFor = Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(xForwardedFor))
        {
            return xForwardedFor.Split(',')[0].Trim();
        }

        // Check for X-Real-IP header
        var xRealIp = Request.Headers["X-Real-IP"].FirstOrDefault();
        if (!string.IsNullOrEmpty(xRealIp))
        {
            return xRealIp;
        }

        // Fall back to remote IP address
        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
    }
}