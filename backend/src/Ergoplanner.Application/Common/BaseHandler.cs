using Microsoft.Extensions.Logging;
using System.Diagnostics;

namespace Ergoplanner.Application.Common;

public abstract class BaseHandler<T> where T : class
{
    protected readonly ILogger<T> Logger;

    protected BaseHandler(ILogger<T> logger)
    {
        Logger = logger;
    }

    protected void LogHandlerStart(string operationName, object? request = null)
    {
        var correlationId = Activity.Current?.Id ?? Guid.NewGuid().ToString();

        Logger.LogInformation("Starting {OperationName} with correlation ID {CorrelationId}",
            operationName, correlationId);

        if (request != null)
        {
            Logger.LogDebug("Request details for {OperationName}: {@Request}",
                operationName, request);
        }
    }

    protected void LogHandlerSuccess(string operationName, object? result = null, long? elapsedMs = null)
    {
        var correlationId = Activity.Current?.Id ?? Guid.NewGuid().ToString();

        if (elapsedMs.HasValue)
        {
            Logger.LogInformation("Completed {OperationName} successfully with correlation ID {CorrelationId} in {ElapsedMs}ms",
                operationName, correlationId, elapsedMs.Value);
        }
        else
        {
            Logger.LogInformation("Completed {OperationName} successfully with correlation ID {CorrelationId}",
                operationName, correlationId);
        }

        if (result != null)
        {
            Logger.LogDebug("Result for {OperationName}: {@Result}",
                operationName, result);
        }
    }

    protected void LogHandlerError(string operationName, Exception exception, object? request = null, long? elapsedMs = null)
    {
        var correlationId = Activity.Current?.Id ?? Guid.NewGuid().ToString();

        if (elapsedMs.HasValue)
        {
            Logger.LogError(exception, "Error in {OperationName} with correlation ID {CorrelationId} after {ElapsedMs}ms: {ErrorMessage}",
                operationName, correlationId, elapsedMs.Value, exception.Message);
        }
        else
        {
            Logger.LogError(exception, "Error in {OperationName} with correlation ID {CorrelationId}: {ErrorMessage}",
                operationName, correlationId, exception.Message);
        }

        if (request != null)
        {
            Logger.LogDebug("Request that caused error in {OperationName}: {@Request}",
                operationName, request);
        }
    }

    protected void LogValidationError(string operationName, string validationError, object? request = null)
    {
        var correlationId = Activity.Current?.Id ?? Guid.NewGuid().ToString();

        Logger.LogWarning("Validation error in {OperationName} with correlation ID {CorrelationId}: {ValidationError}",
            operationName, correlationId, validationError);

        if (request != null)
        {
            Logger.LogDebug("Invalid request for {OperationName}: {@Request}",
                operationName, request);
        }
    }

    protected void LogBusinessRuleViolation(string operationName, string businessRule, object? context = null)
    {
        var correlationId = Activity.Current?.Id ?? Guid.NewGuid().ToString();

        Logger.LogWarning("Business rule violation in {OperationName} with correlation ID {CorrelationId}: {BusinessRule}",
            operationName, correlationId, businessRule);

        if (context != null)
        {
            Logger.LogDebug("Business rule context for {OperationName}: {@Context}",
                operationName, context);
        }
    }
}