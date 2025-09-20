namespace Ergoplanner.Infrastructure.Monitoring;

public interface IMetricsService
{
    // Business Metrics
    void IncrementDrawingCreated(string organizationId, string projectId);
    void IncrementDrawingUpdated(string organizationId, string projectId);
    void IncrementDrawingDeleted(string organizationId, string projectId);
    void IncrementUserLogin(string userId, bool successful);
    void IncrementUserRegistration(string organizationId);
    void IncrementBoQGenerated(string organizationId, string projectId, int componentCount);
    void IncrementSymbolUsage(string symbolId, string symbolType);
    void IncrementCollaborativeSession(string drawingId, int userCount);
    void IncrementWorkflowTransition(string drawingId, string fromStatus, string toStatus);

    // Technical Metrics
    void RecordApiRequestDuration(string endpoint, string method, int statusCode, double durationMs);
    void RecordDatabaseQueryDuration(string queryType, double durationMs);
    void RecordCacheHit(string cacheKey, string cacheType);
    void RecordCacheMiss(string cacheKey, string cacheType);
    void RecordSignalRConnection(bool connected);
    void RecordSignalRMessage(string hubName, string methodName);
    void IncrementExceptionOccurred(string exceptionType, string endpoint);

    // Performance Metrics
    void RecordMemoryUsage(long bytesUsed);
    void RecordActiveConnections(int count);
    void RecordQueueLength(string queueName, int length);
    void RecordFileUploadSize(long sizeBytes);
    void RecordConcurrentUsers(int count);

    // System Health Metrics
    void RecordHealthCheckResult(string checkName, bool healthy, double durationMs);
    void RecordBackgroundJobExecution(string jobName, bool successful, double durationMs);
}