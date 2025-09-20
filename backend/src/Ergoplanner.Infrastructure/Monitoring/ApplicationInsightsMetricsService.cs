using Microsoft.ApplicationInsights;
using Microsoft.ApplicationInsights.DataContracts;
using Microsoft.Extensions.Logging;

namespace Ergoplanner.Infrastructure.Monitoring;

public class ApplicationInsightsMetricsService : IMetricsService
{
    private readonly TelemetryClient _telemetryClient;
    private readonly ILogger<ApplicationInsightsMetricsService> _logger;

    public ApplicationInsightsMetricsService(TelemetryClient telemetryClient, ILogger<ApplicationInsightsMetricsService> logger)
    {
        _telemetryClient = telemetryClient;
        _logger = logger;
    }

    // Business Metrics
    public void IncrementDrawingCreated(string organizationId, string projectId)
    {
        var properties = new Dictionary<string, string>
        {
            ["OrganizationId"] = organizationId,
            ["ProjectId"] = projectId
        };

        _telemetryClient.TrackEvent("DrawingCreated", properties);
        _telemetryClient.GetMetric("Drawings.Created").TrackValue(1);
        _telemetryClient.GetMetric("Drawings.Created.ByOrganization", "OrganizationId").TrackValue(1, organizationId);

        _logger.LogInformation("Drawing created for organization {OrganizationId} in project {ProjectId}", organizationId, projectId);
    }

    public void IncrementDrawingUpdated(string organizationId, string projectId)
    {
        var properties = new Dictionary<string, string>
        {
            ["OrganizationId"] = organizationId,
            ["ProjectId"] = projectId
        };

        _telemetryClient.TrackEvent("DrawingUpdated", properties);
        _telemetryClient.GetMetric("Drawings.Updated").TrackValue(1);
        _telemetryClient.GetMetric("Drawings.Updated.ByOrganization", "OrganizationId").TrackValue(1, organizationId);
    }

    public void IncrementDrawingDeleted(string organizationId, string projectId)
    {
        var properties = new Dictionary<string, string>
        {
            ["OrganizationId"] = organizationId,
            ["ProjectId"] = projectId
        };

        _telemetryClient.TrackEvent("DrawingDeleted", properties);
        _telemetryClient.GetMetric("Drawings.Deleted").TrackValue(1);
        _telemetryClient.GetMetric("Drawings.Deleted.ByOrganization", "OrganizationId").TrackValue(1, organizationId);
    }

    public void IncrementUserLogin(string userId, bool successful)
    {
        var properties = new Dictionary<string, string>
        {
            ["UserId"] = userId,
            ["Successful"] = successful.ToString()
        };

        _telemetryClient.TrackEvent("UserLogin", properties);
        _telemetryClient.GetMetric("Users.Login.Total").TrackValue(1);
        _telemetryClient.GetMetric("Users.Login.Success").TrackValue(successful ? 1 : 0);

        if (!successful)
        {
            _telemetryClient.GetMetric("Users.Login.Failed").TrackValue(1);
            _logger.LogWarning("Failed login attempt for user {UserId}", userId);
        }
    }

    public void IncrementUserRegistration(string organizationId)
    {
        var properties = new Dictionary<string, string>
        {
            ["OrganizationId"] = organizationId
        };

        _telemetryClient.TrackEvent("UserRegistration", properties);
        _telemetryClient.GetMetric("Users.Registration").TrackValue(1);
        _telemetryClient.GetMetric("Users.Registration.ByOrganization", "OrganizationId").TrackValue(1, organizationId);
    }

    public void IncrementBoQGenerated(string organizationId, string projectId, int componentCount)
    {
        var properties = new Dictionary<string, string>
        {
            ["OrganizationId"] = organizationId,
            ["ProjectId"] = projectId,
            ["ComponentCount"] = componentCount.ToString()
        };

        _telemetryClient.TrackEvent("BoQGenerated", properties);
        _telemetryClient.GetMetric("BoQ.Generated").TrackValue(1);
        _telemetryClient.GetMetric("BoQ.ComponentCount").TrackValue(componentCount);
    }

    public void IncrementSymbolUsage(string symbolId, string symbolType)
    {
        var properties = new Dictionary<string, string>
        {
            ["SymbolId"] = symbolId,
            ["SymbolType"] = symbolType
        };

        _telemetryClient.TrackEvent("SymbolUsed", properties);
        _telemetryClient.GetMetric("Symbols.Usage").TrackValue(1);
        _telemetryClient.GetMetric("Symbols.Usage.ByType", "SymbolType").TrackValue(1, symbolType);
    }

    public void IncrementCollaborativeSession(string drawingId, int userCount)
    {
        var properties = new Dictionary<string, string>
        {
            ["DrawingId"] = drawingId,
            ["UserCount"] = userCount.ToString()
        };

        _telemetryClient.TrackEvent("CollaborativeSession", properties);
        _telemetryClient.GetMetric("Collaboration.Sessions").TrackValue(1);
        _telemetryClient.GetMetric("Collaboration.ConcurrentUsers").TrackValue(userCount);
    }

    public void IncrementWorkflowTransition(string drawingId, string fromStatus, string toStatus)
    {
        var properties = new Dictionary<string, string>
        {
            ["DrawingId"] = drawingId,
            ["FromStatus"] = fromStatus,
            ["ToStatus"] = toStatus
        };

        _telemetryClient.TrackEvent("WorkflowTransition", properties);
        _telemetryClient.GetMetric("Workflow.Transitions").TrackValue(1);
        _telemetryClient.GetMetric("Workflow.StatusChanges", "ToStatus").TrackValue(1, toStatus);
    }

    // Technical Metrics
    public void RecordApiRequestDuration(string endpoint, string method, int statusCode, double durationMs)
    {
        var properties = new Dictionary<string, string>
        {
            ["Endpoint"] = endpoint,
            ["Method"] = method,
            ["StatusCode"] = statusCode.ToString()
        };

        _telemetryClient.TrackDependency("HTTP", endpoint, endpoint, DateTime.UtcNow.AddMilliseconds(-durationMs), TimeSpan.FromMilliseconds(durationMs), statusCode >= 200 && statusCode < 400);
        _telemetryClient.GetMetric("API.RequestDuration", "Endpoint", "Method").TrackValue(durationMs, endpoint, method);
        _telemetryClient.GetMetric("API.Requests").TrackValue(1);

        if (statusCode >= 400)
        {
            _telemetryClient.GetMetric("API.Errors", "StatusCode").TrackValue(1, statusCode.ToString());
        }
    }

    public void RecordDatabaseQueryDuration(string queryType, double durationMs)
    {
        _telemetryClient.TrackDependency("SQL", queryType, queryType, DateTime.UtcNow.AddMilliseconds(-durationMs), TimeSpan.FromMilliseconds(durationMs), true);
        _telemetryClient.GetMetric("Database.QueryDuration", "QueryType").TrackValue(durationMs, queryType);
        _telemetryClient.GetMetric("Database.Queries").TrackValue(1);

        if (durationMs > 1000) // Log slow queries
        {
            _logger.LogWarning("Slow database query detected: {QueryType} took {Duration}ms", queryType, durationMs);
        }
    }

    public void RecordCacheHit(string cacheKey, string cacheType)
    {
        var properties = new Dictionary<string, string>
        {
            ["CacheKey"] = cacheKey,
            ["CacheType"] = cacheType
        };

        _telemetryClient.TrackEvent("CacheHit", properties);
        _telemetryClient.GetMetric("Cache.Hits", "CacheType").TrackValue(1, cacheType);
        _telemetryClient.GetMetric("Cache.Operations").TrackValue(1);
    }

    public void RecordCacheMiss(string cacheKey, string cacheType)
    {
        var properties = new Dictionary<string, string>
        {
            ["CacheKey"] = cacheKey,
            ["CacheType"] = cacheType
        };

        _telemetryClient.TrackEvent("CacheMiss", properties);
        _telemetryClient.GetMetric("Cache.Misses", "CacheType").TrackValue(1, cacheType);
        _telemetryClient.GetMetric("Cache.Operations").TrackValue(1);
    }

    public void RecordSignalRConnection(bool connected)
    {
        var properties = new Dictionary<string, string>
        {
            ["Connected"] = connected.ToString()
        };

        _telemetryClient.TrackEvent(connected ? "SignalRConnected" : "SignalRDisconnected", properties);
        _telemetryClient.GetMetric("SignalR.Connections").TrackValue(connected ? 1 : -1);
    }

    public void RecordSignalRMessage(string hubName, string methodName)
    {
        var properties = new Dictionary<string, string>
        {
            ["HubName"] = hubName,
            ["MethodName"] = methodName
        };

        _telemetryClient.TrackEvent("SignalRMessage", properties);
        _telemetryClient.GetMetric("SignalR.Messages", "HubName", "MethodName").TrackValue(1, hubName, methodName);
    }

    public void IncrementExceptionOccurred(string exceptionType, string endpoint)
    {
        var properties = new Dictionary<string, string>
        {
            ["ExceptionType"] = exceptionType,
            ["Endpoint"] = endpoint
        };

        _telemetryClient.TrackEvent("ExceptionOccurred", properties);
        _telemetryClient.GetMetric("Exceptions.Total").TrackValue(1);
        _telemetryClient.GetMetric("Exceptions.ByType", "ExceptionType").TrackValue(1, exceptionType);
    }

    // Performance Metrics
    public void RecordMemoryUsage(long bytesUsed)
    {
        _telemetryClient.GetMetric("Performance.MemoryUsage").TrackValue(bytesUsed);
    }

    public void RecordActiveConnections(int count)
    {
        _telemetryClient.GetMetric("Performance.ActiveConnections").TrackValue(count);
    }

    public void RecordQueueLength(string queueName, int length)
    {
        _telemetryClient.GetMetric("Performance.QueueLength", "QueueName").TrackValue(length, queueName);
    }

    public void RecordFileUploadSize(long sizeBytes)
    {
        _telemetryClient.GetMetric("Performance.FileUploadSize").TrackValue(sizeBytes);
    }

    public void RecordConcurrentUsers(int count)
    {
        _telemetryClient.GetMetric("Performance.ConcurrentUsers").TrackValue(count);
    }

    // System Health Metrics
    public void RecordHealthCheckResult(string checkName, bool healthy, double durationMs)
    {
        var properties = new Dictionary<string, string>
        {
            ["CheckName"] = checkName,
            ["Healthy"] = healthy.ToString()
        };

        _telemetryClient.TrackEvent("HealthCheck", properties);
        _telemetryClient.GetMetric("HealthCheck.Duration", "CheckName").TrackValue(durationMs, checkName);
        _telemetryClient.GetMetric("HealthCheck.Status", "CheckName").TrackValue(healthy ? 1 : 0, checkName);
    }

    public void RecordBackgroundJobExecution(string jobName, bool successful, double durationMs)
    {
        var properties = new Dictionary<string, string>
        {
            ["JobName"] = jobName,
            ["Successful"] = successful.ToString()
        };

        _telemetryClient.TrackEvent("BackgroundJob", properties);
        _telemetryClient.GetMetric("BackgroundJobs.Duration", "JobName").TrackValue(durationMs, jobName);
        _telemetryClient.GetMetric("BackgroundJobs.Success", "JobName").TrackValue(successful ? 1 : 0, jobName);

        if (!successful)
        {
            _logger.LogError("Background job {JobName} failed after {Duration}ms", jobName, durationMs);
        }
    }
}