namespace Ergoplanner.Infrastructure.Services;

public interface ISecurityAuditLogger
{
    // Authentication Events
    Task LogUserLoginAttempt(string email, string ipAddress, string userAgent, bool successful, string? failureReason = null);
    Task LogUserLogout(string userId, string email, string ipAddress);
    Task LogPasswordChange(string userId, string email, string ipAddress, bool successful);
    Task LogPasswordReset(string email, string ipAddress, bool successful);
    Task LogUserRegistration(string email, string organizationId, string ipAddress, bool successful);
    Task LogUserAccountLocked(string userId, string email, string reason, string ipAddress);
    Task LogUserAccountUnlocked(string userId, string email, string adminUserId, string ipAddress);

    // Authorization Events
    Task LogUnauthorizedAccess(string? userId, string resource, string action, string ipAddress, string? reason = null);
    Task LogPrivilegeEscalation(string userId, string fromRole, string toRole, string adminUserId, string ipAddress);
    Task LogRoleAssignment(string userId, string role, string adminUserId, string ipAddress);
    Task LogRoleRemoval(string userId, string role, string adminUserId, string ipAddress);
    Task LogPermissionDenied(string userId, string resource, string action, string ipAddress);

    // Data Access Events
    Task LogSensitiveDataAccess(string userId, string resourceType, string resourceId, string operation, string ipAddress);
    Task LogDataExport(string userId, string dataType, int recordCount, string ipAddress);
    Task LogDataImport(string userId, string dataType, int recordCount, string ipAddress);
    Task LogDataDeletion(string userId, string resourceType, string resourceId, string ipAddress);
    Task LogBulkDataOperation(string userId, string operation, string resourceType, int affectedRecords, string ipAddress);

    // System Events
    Task LogSystemConfigurationChange(string userId, string setting, string? oldValue, string newValue, string ipAddress);
    Task LogSecurityPolicyChange(string userId, string policyName, string change, string ipAddress);
    Task LogApiKeyGeneration(string userId, string apiKeyId, string scope, string ipAddress);
    Task LogApiKeyRevocation(string userId, string apiKeyId, string reason, string ipAddress);

    // Suspicious Activities
    Task LogSuspiciousActivity(string? userId, string activityType, string description, string ipAddress, Dictionary<string, object>? additionalData = null);
    Task LogBruteForceAttempt(string email, string ipAddress, int attemptCount, TimeSpan timeWindow);
    Task LogUnusualAccessPattern(string userId, string pattern, string description, string ipAddress);
    Task LogMultipleFailedAuthorizations(string userId, string resource, int attemptCount, string ipAddress);

    // Compliance Events
    Task LogGdprDataRequest(string userId, string requestType, string dataSubject, string ipAddress);
    Task LogDataRetentionAction(string adminUserId, string dataType, string action, int affectedRecords, string ipAddress);
    Task LogAuditLogAccess(string userId, string query, string ipAddress);
}