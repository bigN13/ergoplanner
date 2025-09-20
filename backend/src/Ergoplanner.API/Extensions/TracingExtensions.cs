using System.Diagnostics;

namespace Ergoplanner.API.Extensions;

public static class TracingExtensions
{
    public const string ServiceName = "Ergoplanner.API";
    public const string ServiceVersion = "1.0.0";

    public static ActivitySource ActivitySource { get; } = new(ServiceName, ServiceVersion);

    public static IServiceCollection AddDistributedTracing(this IServiceCollection services, IConfiguration configuration)
    {
        // Register ActivitySource as singleton
        services.AddSingleton(ActivitySource);

        // Add OpenTelemetry if configured
        var useOpenTelemetry = configuration.GetValue<bool>("OpenTelemetry:Enabled", false);
        if (useOpenTelemetry)
        {
            // Note: OpenTelemetry packages would need to be added for full implementation
            // For now, we'll use the built-in Activity tracing
        }

        return services;
    }

    public static Activity? StartActivity(string operationName, ActivityKind kind = ActivityKind.Internal)
    {
        return ActivitySource.StartActivity(operationName, kind);
    }

    public static Activity? StartActivityWithTags(string operationName, Dictionary<string, object?> tags, ActivityKind kind = ActivityKind.Internal)
    {
        var activity = ActivitySource.StartActivity(operationName, kind);
        if (activity != null)
        {
            foreach (var tag in tags)
            {
                activity.SetTag(tag.Key, tag.Value);
            }
        }
        return activity;
    }

    public static void SetActivityError(this Activity? activity, Exception exception)
    {
        if (activity != null)
        {
            activity.SetStatus(ActivityStatusCode.Error, exception.Message);
            activity.SetTag("error", true);
            activity.SetTag("exception.type", exception.GetType().FullName);
            activity.SetTag("exception.message", exception.Message);
            activity.SetTag("exception.stacktrace", exception.StackTrace);
        }
    }

    public static void SetActivitySuccess(this Activity? activity)
    {
        if (activity != null)
        {
            activity.SetStatus(ActivityStatusCode.Ok);
            activity.SetTag("error", false);
        }
    }

    public static void AddActivityEvent(this Activity? activity, string eventName, Dictionary<string, object?>? attributes = null)
    {
        if (activity != null)
        {
            var tags = attributes?.Select(kvp => new KeyValuePair<string, object?>(kvp.Key, kvp.Value)).ToArray()
                      ?? Array.Empty<KeyValuePair<string, object?>>();

            activity.AddEvent(new ActivityEvent(eventName, DateTimeOffset.UtcNow, new ActivityTagsCollection(tags)));
        }
    }
}