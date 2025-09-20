using MediatR;
using Microsoft.Extensions.Logging;
using System.Diagnostics;

namespace Ergoplanner.Application.Behaviors;

public class PerformanceBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : class, IRequest<TResponse>
{
    private readonly ILogger<PerformanceBehavior<TRequest, TResponse>> _logger;

    public PerformanceBehavior(ILogger<PerformanceBehavior<TRequest, TResponse>> logger)
    {
        _logger = logger;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;
        var stopwatch = Stopwatch.StartNew();

        try
        {
            var response = await next();
            stopwatch.Stop();

            // Log performance metrics
            var elapsedMilliseconds = stopwatch.ElapsedMilliseconds;

            if (elapsedMilliseconds > 5000) // Critical performance issue
            {
                _logger.LogCritical("Critical performance issue: {RequestName} took {ElapsedMs}ms to complete",
                    requestName, elapsedMilliseconds);
            }
            else if (elapsedMilliseconds > 2000) // Performance warning
            {
                _logger.LogWarning("Performance warning: {RequestName} took {ElapsedMs}ms to complete",
                    requestName, elapsedMilliseconds);
            }
            else if (elapsedMilliseconds > 500) // Performance information
            {
                _logger.LogInformation("Performance info: {RequestName} took {ElapsedMs}ms to complete",
                    requestName, elapsedMilliseconds);
            }

            // Add performance metrics to current activity
            var activity = Activity.Current;
            if (activity != null)
            {
                activity.SetTag("performance.duration_ms", elapsedMilliseconds);
                activity.SetTag("performance.request_name", requestName);

                if (elapsedMilliseconds > 1000)
                {
                    activity.SetTag("performance.slow_operation", true);
                    activity.AddEvent(new ActivityEvent("slow_operation_detected", DateTimeOffset.UtcNow, new ActivityTagsCollection
                    {
                        ["threshold_ms"] = 1000,
                        ["actual_ms"] = elapsedMilliseconds
                    }));
                }
            }

            return response;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();

            _logger.LogError(ex, "Exception in {RequestName} after {ElapsedMs}ms: {ExceptionMessage}",
                requestName, stopwatch.ElapsedMilliseconds, ex.Message);

            // Add error information to current activity
            var activity = Activity.Current;
            if (activity != null)
            {
                activity.SetTag("performance.duration_ms", stopwatch.ElapsedMilliseconds);
                activity.SetTag("performance.request_name", requestName);
                activity.SetTag("performance.failed", true);
            }

            throw;
        }
    }
}