using Microsoft.Extensions.Logging;
using Serilog;
using System.Text.Json;

namespace Ergoplanner.Infrastructure.Services;

public class SecurityAuditLogger : ISecurityAuditLogger
{
    private readonly ILogger<SecurityAuditLogger> _logger;

    public SecurityAuditLogger(ILogger<SecurityAuditLogger> logger)
    {
        _logger = logger;
    }

    #region Authentication Events

    public async Task LogUserLoginAttempt(string email, string ipAddress, string userAgent, bool successful, string? failureReason = null)
    {
        var auditEvent = new
        {
            EventType = "UserLoginAttempt",
            Email = email,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            Successful = successful,
            FailureReason = failureReason,
            Timestamp = DateTimeOffset.UtcNow,
            EventId = Guid.NewGuid()
        };

        if (successful)
        {
            Log.ForContext("SecurityAuditEvent", auditEvent, destructureObjects: true)
               .Information("User login successful for {Email} from {IpAddress}", email, ipAddress);
        }
        else
        {
            Log.ForContext("SecurityAuditEvent", auditEvent, destructureObjects: true)
               .Warning("User login failed for {Email} from {IpAddress}: {FailureReason}", email, ipAddress, failureReason);
        }

        await Task.CompletedTask;
    }

    public async Task LogUserLogout(string userId, string email, string ipAddress)
    {
        var auditEvent = new
        {
            EventType = "UserLogout",
            UserId = userId,
            Email = email,
            IpAddress = ipAddress,
            Timestamp = DateTimeOffset.UtcNow,
            EventId = Guid.NewGuid()
        };

        Log.ForContext("SecurityAuditEvent", auditEvent, destructureObjects: true)
           .Information("User logout for {Email} (ID: {UserId}) from {IpAddress}", email, userId, ipAddress);

        await Task.CompletedTask;
    }

    public async Task LogPasswordChange(string userId, string email, string ipAddress, bool successful)
    {
        var auditEvent = new
        {
            EventType = "PasswordChange",
            UserId = userId,
            Email = email,
            IpAddress = ipAddress,
            Successful = successful,
            Timestamp = DateTimeOffset.UtcNow,
            EventId = Guid.NewGuid()
        };

        if (successful)
        {
            Log.ForContext("SecurityAuditEvent", auditEvent, destructureObjects: true)
               .Information("Password changed successfully for {Email} (ID: {UserId}) from {IpAddress}", email, userId, ipAddress);
        }
        else
        {
            Log.ForContext("SecurityAuditEvent", auditEvent, destructureObjects: true)
               .Warning("Password change failed for {Email} (ID: {UserId}) from {IpAddress}", email, userId, ipAddress);
        }

        await Task.CompletedTask;
    }

    public async Task LogPasswordReset(string email, string ipAddress, bool successful)
    {
        var auditEvent = new
        {
            EventType = "PasswordReset",
            Email = email,
            IpAddress = ipAddress,
            Successful = successful,
            Timestamp = DateTimeOffset.UtcNow,
            EventId = Guid.NewGuid()
        };

        if (successful)
        {
            Log.ForContext("SecurityAuditEvent", auditEvent, destructureObjects: true)
               .Information("Password reset initiated for {Email} from {IpAddress}", email, ipAddress);
        }
        else
        {
            Log.ForContext("SecurityAuditEvent", auditEvent, destructureObjects: true)
               .Warning("Password reset failed for {Email} from {IpAddress}", email, ipAddress);
        }

        await Task.CompletedTask;
    }

    public async Task LogUserRegistration(string email, string organizationId, string ipAddress, bool successful)
    {
        var auditEvent = new
        {
            EventType = "UserRegistration",
            Email = email,
            OrganizationId = organizationId,
            IpAddress = ipAddress,
            Successful = successful,
            Timestamp = DateTimeOffset.UtcNow,
            EventId = Guid.NewGuid()
        };

        if (successful)
        {
            Log.ForContext("SecurityAuditEvent", auditEvent, destructureObjects: true)
               .Information("User registration successful for {Email} in organization {OrganizationId} from {IpAddress}", email, organizationId, ipAddress);
        }
        else
        {
            Log.ForContext("SecurityAuditEvent", auditEvent, destructureObjects: true)
               .Warning("User registration failed for {Email} in organization {OrganizationId} from {IpAddress}", email, organizationId, ipAddress);
        }

        await Task.CompletedTask;
    }

    public async Task LogUserAccountLocked(string userId, string email, string reason, string ipAddress)
    {
        var auditEvent = new
        {
            EventType = "UserAccountLocked",
            UserId = userId,
            Email = email,
            Reason = reason,
            IpAddress = ipAddress,
            Timestamp = DateTimeOffset.UtcNow,
            EventId = Guid.NewGuid()
        };

        Log.ForContext("SecurityAuditEvent", auditEvent, destructureObjects: true)
           .Warning("User account locked for {Email} (ID: {UserId}) from {IpAddress}: {Reason}", email, userId, ipAddress, reason);

        await Task.CompletedTask;
    }

    public async Task LogUserAccountUnlocked(string userId, string email, string adminUserId, string ipAddress)
    {
        var auditEvent = new
        {
            EventType = "UserAccountUnlocked",
            UserId = userId,
            Email = email,
            AdminUserId = adminUserId,
            IpAddress = ipAddress,
            Timestamp = DateTimeOffset.UtcNow,
            EventId = Guid.NewGuid()
        };

        Log.ForContext("SecurityAuditEvent", auditEvent, destructureObjects: true)
           .Information("User account unlocked for {Email} (ID: {UserId}) by admin {AdminUserId} from {IpAddress}", email, userId, adminUserId, ipAddress);

        await Task.CompletedTask;
    }

    #endregion

    #region Authorization Events

    public async Task LogUnauthorizedAccess(string? userId, string resource, string action, string ipAddress, string? reason = null)
    {
        var auditEvent = new
        {
            EventType = "UnauthorizedAccess",
            UserId = userId,
            Resource = resource,
            Action = action,
            IpAddress = ipAddress,
            Reason = reason,
            Timestamp = DateTimeOffset.UtcNow,
            EventId = Guid.NewGuid()
        };

        Log.ForContext("SecurityAuditEvent", auditEvent, destructureObjects: true)
           .Warning("Unauthorized access attempt by user {UserId} to {Resource} for action {Action} from {IpAddress}: {Reason}",
               userId ?? "Anonymous", resource, action, ipAddress, reason);

        await Task.CompletedTask;
    }

    public async Task LogPrivilegeEscalation(string userId, string fromRole, string toRole, string adminUserId, string ipAddress)
    {
        var auditEvent = new
        {
            EventType = "PrivilegeEscalation",
            UserId = userId,
            FromRole = fromRole,
            ToRole = toRole,
            AdminUserId = adminUserId,
            IpAddress = ipAddress,
            Timestamp = DateTimeOffset.UtcNow,
            EventId = Guid.NewGuid()
        };

        Log.ForContext("SecurityAuditEvent", auditEvent, destructureObjects: true)
           .Warning("Privilege escalation for user {UserId} from {FromRole} to {ToRole} by admin {AdminUserId} from {IpAddress}",
               userId, fromRole, toRole, adminUserId, ipAddress);

        await Task.CompletedTask;
    }

    public async Task LogRoleAssignment(string userId, string role, string adminUserId, string ipAddress)
    {
        var auditEvent = new
        {
            EventType = "RoleAssignment",
            UserId = userId,
            Role = role,
            AdminUserId = adminUserId,
            IpAddress = ipAddress,
            Timestamp = DateTimeOffset.UtcNow,
            EventId = Guid.NewGuid()
        };

        Log.ForContext("SecurityAuditEvent", auditEvent, destructureObjects: true)
           .Information("Role {Role} assigned to user {UserId} by admin {AdminUserId} from {IpAddress}",
               role, userId, adminUserId, ipAddress);

        await Task.CompletedTask;
    }

    public async Task LogRoleRemoval(string userId, string role, string adminUserId, string ipAddress)
    {
        var auditEvent = new
        {
            EventType = "RoleRemoval",
            UserId = userId,
            Role = role,
            AdminUserId = adminUserId,
            IpAddress = ipAddress,
            Timestamp = DateTimeOffset.UtcNow,
            EventId = Guid.NewGuid()
        };

        Log.ForContext("SecurityAuditEvent", auditEvent, destructureObjects: true)
           .Information("Role {Role} removed from user {UserId} by admin {AdminUserId} from {IpAddress}",
               role, userId, adminUserId, ipAddress);

        await Task.CompletedTask;
    }

    public async Task LogPermissionDenied(string userId, string resource, string action, string ipAddress)
    {
        var auditEvent = new
        {
            EventType = "PermissionDenied",
            UserId = userId,
            Resource = resource,
            Action = action,
            IpAddress = ipAddress,
            Timestamp = DateTimeOffset.UtcNow,
            EventId = Guid.NewGuid()
        };

        Log.ForContext("SecurityAuditEvent", auditEvent, destructureObjects: true)
           .Warning("Permission denied for user {UserId} to {Resource} for action {Action} from {IpAddress}",
               userId, resource, action, ipAddress);

        await Task.CompletedTask;
    }

    #endregion

    #region Data Access Events

    public async Task LogSensitiveDataAccess(string userId, string resourceType, string resourceId, string operation, string ipAddress)
    {
        var auditEvent = new
        {
            EventType = "SensitiveDataAccess",
            UserId = userId,
            ResourceType = resourceType,
            ResourceId = resourceId,
            Operation = operation,
            IpAddress = ipAddress,
            Timestamp = DateTimeOffset.UtcNow,
            EventId = Guid.NewGuid()
        };

        Log.ForContext("SecurityAuditEvent", auditEvent, destructureObjects: true)
           .Information("Sensitive data access by user {UserId} to {ResourceType} {ResourceId} for {Operation} from {IpAddress}",
               userId, resourceType, resourceId, operation, ipAddress);

        await Task.CompletedTask;
    }

    public async Task LogDataExport(string userId, string dataType, int recordCount, string ipAddress)
    {
        var auditEvent = new
        {
            EventType = "DataExport",
            UserId = userId,
            DataType = dataType,
            RecordCount = recordCount,
            IpAddress = ipAddress,
            Timestamp = DateTimeOffset.UtcNow,
            EventId = Guid.NewGuid()
        };

        Log.ForContext("SecurityAuditEvent", auditEvent, destructureObjects: true)
           .Information("Data export by user {UserId} of {DataType} ({RecordCount} records) from {IpAddress}",
               userId, dataType, recordCount, ipAddress);

        await Task.CompletedTask;
    }

    public async Task LogDataImport(string userId, string dataType, int recordCount, string ipAddress)
    {
        var auditEvent = new
        {
            EventType = "DataImport",
            UserId = userId,
            DataType = dataType,
            RecordCount = recordCount,
            IpAddress = ipAddress,
            Timestamp = DateTimeOffset.UtcNow,
            EventId = Guid.NewGuid()
        };

        Log.ForContext("SecurityAuditEvent", auditEvent, destructureObjects: true)
           .Information("Data import by user {UserId} of {DataType} ({RecordCount} records) from {IpAddress}",
               userId, dataType, recordCount, ipAddress);

        await Task.CompletedTask;
    }

    public async Task LogDataDeletion(string userId, string resourceType, string resourceId, string ipAddress)
    {
        var auditEvent = new
        {
            EventType = "DataDeletion",
            UserId = userId,
            ResourceType = resourceType,
            ResourceId = resourceId,
            IpAddress = ipAddress,
            Timestamp = DateTimeOffset.UtcNow,
            EventId = Guid.NewGuid()
        };

        Log.ForContext("SecurityAuditEvent", auditEvent, destructureObjects: true)
           .Warning("Data deletion by user {UserId} of {ResourceType} {ResourceId} from {IpAddress}",
               userId, resourceType, resourceId, ipAddress);

        await Task.CompletedTask;
    }

    public async Task LogBulkDataOperation(string userId, string operation, string resourceType, int affectedRecords, string ipAddress)
    {
        var auditEvent = new
        {
            EventType = "BulkDataOperation",
            UserId = userId,
            Operation = operation,
            ResourceType = resourceType,
            AffectedRecords = affectedRecords,
            IpAddress = ipAddress,
            Timestamp = DateTimeOffset.UtcNow,
            EventId = Guid.NewGuid()
        };

        Log.ForContext("SecurityAuditEvent", auditEvent, destructureObjects: true)
           .Warning("Bulk data operation by user {UserId}: {Operation} on {ResourceType} affecting {AffectedRecords} records from {IpAddress}",
               userId, operation, resourceType, affectedRecords, ipAddress);

        await Task.CompletedTask;
    }

    #endregion

    #region System Events

    public async Task LogSystemConfigurationChange(string userId, string setting, string? oldValue, string newValue, string ipAddress)
    {
        var auditEvent = new
        {
            EventType = "SystemConfigurationChange",
            UserId = userId,
            Setting = setting,
            OldValue = oldValue,
            NewValue = newValue,
            IpAddress = ipAddress,
            Timestamp = DateTimeOffset.UtcNow,
            EventId = Guid.NewGuid()
        };

        Log.ForContext("SecurityAuditEvent", auditEvent, destructureObjects: true)
           .Warning("System configuration change by user {UserId}: {Setting} changed from {OldValue} to {NewValue} from {IpAddress}",
               userId, setting, oldValue, newValue, ipAddress);

        await Task.CompletedTask;
    }

    public async Task LogSecurityPolicyChange(string userId, string policyName, string change, string ipAddress)
    {
        var auditEvent = new
        {
            EventType = "SecurityPolicyChange",
            UserId = userId,
            PolicyName = policyName,
            Change = change,
            IpAddress = ipAddress,
            Timestamp = DateTimeOffset.UtcNow,
            EventId = Guid.NewGuid()
        };

        Log.ForContext("SecurityAuditEvent", auditEvent, destructureObjects: true)
           .Warning("Security policy change by user {UserId}: {PolicyName} - {Change} from {IpAddress}",
               userId, policyName, change, ipAddress);

        await Task.CompletedTask;
    }

    public async Task LogApiKeyGeneration(string userId, string apiKeyId, string scope, string ipAddress)
    {
        var auditEvent = new
        {
            EventType = "ApiKeyGeneration",
            UserId = userId,
            ApiKeyId = apiKeyId,
            Scope = scope,
            IpAddress = ipAddress,
            Timestamp = DateTimeOffset.UtcNow,
            EventId = Guid.NewGuid()
        };

        Log.ForContext("SecurityAuditEvent", auditEvent, destructureObjects: true)
           .Information("API key generated by user {UserId}: {ApiKeyId} with scope {Scope} from {IpAddress}",
               userId, apiKeyId, scope, ipAddress);

        await Task.CompletedTask;
    }

    public async Task LogApiKeyRevocation(string userId, string apiKeyId, string reason, string ipAddress)
    {
        var auditEvent = new
        {
            EventType = "ApiKeyRevocation",
            UserId = userId,
            ApiKeyId = apiKeyId,
            Reason = reason,
            IpAddress = ipAddress,
            Timestamp = DateTimeOffset.UtcNow,
            EventId = Guid.NewGuid()
        };

        Log.ForContext("SecurityAuditEvent", auditEvent, destructureObjects: true)
           .Warning("API key revoked by user {UserId}: {ApiKeyId} for reason {Reason} from {IpAddress}",
               userId, apiKeyId, reason, ipAddress);

        await Task.CompletedTask;
    }

    #endregion

    #region Suspicious Activities

    public async Task LogSuspiciousActivity(string? userId, string activityType, string description, string ipAddress, Dictionary<string, object>? additionalData = null)
    {
        var auditEvent = new
        {
            EventType = "SuspiciousActivity",
            UserId = userId,
            ActivityType = activityType,
            Description = description,
            IpAddress = ipAddress,
            AdditionalData = additionalData,
            Timestamp = DateTimeOffset.UtcNow,
            EventId = Guid.NewGuid()
        };

        Log.ForContext("SecurityAuditEvent", auditEvent, destructureObjects: true)
           .Error("Suspicious activity detected: {ActivityType} by user {UserId} from {IpAddress}: {Description}",
               activityType, userId ?? "Anonymous", ipAddress, description);

        await Task.CompletedTask;
    }

    public async Task LogBruteForceAttempt(string email, string ipAddress, int attemptCount, TimeSpan timeWindow)
    {
        var auditEvent = new
        {
            EventType = "BruteForceAttempt",
            Email = email,
            IpAddress = ipAddress,
            AttemptCount = attemptCount,
            TimeWindowMinutes = timeWindow.TotalMinutes,
            Timestamp = DateTimeOffset.UtcNow,
            EventId = Guid.NewGuid()
        };

        Log.ForContext("SecurityAuditEvent", auditEvent, destructureObjects: true)
           .Error("Brute force attack detected: {AttemptCount} failed login attempts for {Email} from {IpAddress} in {TimeWindowMinutes} minutes",
               attemptCount, email, ipAddress, timeWindow.TotalMinutes);

        await Task.CompletedTask;
    }

    public async Task LogUnusualAccessPattern(string userId, string pattern, string description, string ipAddress)
    {
        var auditEvent = new
        {
            EventType = "UnusualAccessPattern",
            UserId = userId,
            Pattern = pattern,
            Description = description,
            IpAddress = ipAddress,
            Timestamp = DateTimeOffset.UtcNow,
            EventId = Guid.NewGuid()
        };

        Log.ForContext("SecurityAuditEvent", auditEvent, destructureObjects: true)
           .Warning("Unusual access pattern detected for user {UserId} from {IpAddress}: {Pattern} - {Description}",
               userId, ipAddress, pattern, description);

        await Task.CompletedTask;
    }

    public async Task LogMultipleFailedAuthorizations(string userId, string resource, int attemptCount, string ipAddress)
    {
        var auditEvent = new
        {
            EventType = "MultipleFailedAuthorizations",
            UserId = userId,
            Resource = resource,
            AttemptCount = attemptCount,
            IpAddress = ipAddress,
            Timestamp = DateTimeOffset.UtcNow,
            EventId = Guid.NewGuid()
        };

        Log.ForContext("SecurityAuditEvent", auditEvent, destructureObjects: true)
           .Warning("Multiple failed authorization attempts by user {UserId} to {Resource} ({AttemptCount} attempts) from {IpAddress}",
               userId, resource, attemptCount, ipAddress);

        await Task.CompletedTask;
    }

    #endregion

    #region Compliance Events

    public async Task LogGdprDataRequest(string userId, string requestType, string dataSubject, string ipAddress)
    {
        var auditEvent = new
        {
            EventType = "GdprDataRequest",
            UserId = userId,
            RequestType = requestType,
            DataSubject = dataSubject,
            IpAddress = ipAddress,
            Timestamp = DateTimeOffset.UtcNow,
            EventId = Guid.NewGuid()
        };

        Log.ForContext("SecurityAuditEvent", auditEvent, destructureObjects: true)
           .Information("GDPR data request by user {UserId}: {RequestType} for data subject {DataSubject} from {IpAddress}",
               userId, requestType, dataSubject, ipAddress);

        await Task.CompletedTask;
    }

    public async Task LogDataRetentionAction(string adminUserId, string dataType, string action, int affectedRecords, string ipAddress)
    {
        var auditEvent = new
        {
            EventType = "DataRetentionAction",
            AdminUserId = adminUserId,
            DataType = dataType,
            Action = action,
            AffectedRecords = affectedRecords,
            IpAddress = ipAddress,
            Timestamp = DateTimeOffset.UtcNow,
            EventId = Guid.NewGuid()
        };

        Log.ForContext("SecurityAuditEvent", auditEvent, destructureObjects: true)
           .Information("Data retention action by admin {AdminUserId}: {Action} on {DataType} affecting {AffectedRecords} records from {IpAddress}",
               adminUserId, action, dataType, affectedRecords, ipAddress);

        await Task.CompletedTask;
    }

    public async Task LogAuditLogAccess(string userId, string query, string ipAddress)
    {
        var auditEvent = new
        {
            EventType = "AuditLogAccess",
            UserId = userId,
            Query = query,
            IpAddress = ipAddress,
            Timestamp = DateTimeOffset.UtcNow,
            EventId = Guid.NewGuid()
        };

        Log.ForContext("SecurityAuditEvent", auditEvent, destructureObjects: true)
           .Information("Audit log access by user {UserId} with query {Query} from {IpAddress}",
               userId, query, ipAddress);

        await Task.CompletedTask;
    }

    #endregion
}