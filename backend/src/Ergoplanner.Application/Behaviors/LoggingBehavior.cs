using MediatR;
using Microsoft.Extensions.Logging;
using System.Diagnostics;
using System.Text.Json;

namespace Ergoplanner.Application.Behaviors;

public class LoggingBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : class, IRequest<TResponse>
{
    private readonly ILogger<LoggingBehavior<TRequest, TResponse>> _logger;

    public LoggingBehavior(ILogger<LoggingBehavior<TRequest, TResponse>> logger)
    {
        _logger = logger;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;
        var correlationId = Activity.Current?.Id ?? Guid.NewGuid().ToString();

        // Log request
        _logger.LogInformation("Handling {RequestName} with correlation ID {CorrelationId}: {Request}",
            requestName, correlationId, JsonSerializer.Serialize(request, new JsonSerializerOptions { WriteIndented = false }));

        var stopwatch = Stopwatch.StartNew();

        try
        {
            var response = await next();
            stopwatch.Stop();

            // Log successful response
            _logger.LogInformation("Completed {RequestName} with correlation ID {CorrelationId} in {ElapsedMs}ms",
                requestName, correlationId, stopwatch.ElapsedMilliseconds);

            // Log slow operations
            if (stopwatch.ElapsedMilliseconds > 1000)
            {
                _logger.LogWarning("Slow operation detected: {RequestName} with correlation ID {CorrelationId} took {ElapsedMs}ms",
                    requestName, correlationId, stopwatch.ElapsedMilliseconds);
            }

            return response;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();

            _logger.LogError(ex, "Error handling {RequestName} with correlation ID {CorrelationId} after {ElapsedMs}ms: {ExceptionMessage}",
                requestName, correlationId, stopwatch.ElapsedMilliseconds, ex.Message);

            throw;
        }
    }
}