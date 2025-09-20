using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.Enums;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// ERP Integration entity for managing external ERP system connections
    /// </summary>
    public class ERPIntegration : BaseEntity, IOrganizationScoped, ISoftDelete
    {
        public Guid OrganizationId { get; set; }
        public string IntegrationName { get; set; } = string.Empty;
        public ERPIntegrationType IntegrationType { get; set; }
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
        public string? EndpointUrl { get; set; }
        public string? ApiKey { get; set; }
        public string? Username { get; set; }
        public string? PasswordHash { get; set; }
        public string? AuthenticationType { get; set; } // API Key, OAuth, Basic, etc.
        public string? TokenEndpoint { get; set; }
        public string? ClientId { get; set; }
        public string? ClientSecret { get; set; }
        public string? AccessToken { get; set; }
        public string? RefreshToken { get; set; }
        public DateTime? TokenExpiresAt { get; set; }
        public string? Version { get; set; }
        public string? Environment { get; set; } // Production, Staging, Development
        public bool IsTestConnection { get; set; } = false;
        public DateTime? LastSyncAt { get; set; }
        public DateTime? LastTestAt { get; set; }
        public string? LastSyncStatus { get; set; }
        public string? LastErrorMessage { get; set; }
        public int SyncIntervalMinutes { get; set; } = 60;
        public bool AutoSync { get; set; } = false;
        public Dictionary<string, object> ConnectionSettings { get; set; } = new();
        public Dictionary<string, object> MappingConfiguration { get; set; } = new(); // Field mappings
        public Dictionary<string, object> SyncSettings { get; set; } = new();
        public Dictionary<string, object> Metadata { get; set; } = new();
        public List<string> Tags { get; set; } = new();

        // Soft delete
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }
        public Guid? DeletedBy { get; set; }

        // Navigation properties
        public virtual Organization Organization { get; set; } = null!;
        public virtual ICollection<ERPSyncLog> SyncLogs { get; set; } = new List<ERPSyncLog>();
        public virtual ICollection<ERPDataMapping> DataMappings { get; set; } = new List<ERPDataMapping>();
        public virtual User? CreatedByUser { get; set; }
        public virtual User? UpdatedByUser { get; set; }
        public virtual User? DeletedByUser { get; set; }

        /// <summary>
        /// Test connection to ERP system
        /// </summary>
        public async Task<bool> TestConnectionAsync()
        {
            LastTestAt = DateTime.UtcNow;

            try
            {
                // Implementation would depend on the ERP type
                // This is a placeholder for the actual connection test logic
                var isConnected = await PerformConnectionTestAsync();

                if (isConnected)
                {
                    LastSyncStatus = "Connected";
                    LastErrorMessage = null;
                }
                else
                {
                    LastSyncStatus = "Connection Failed";
                    LastErrorMessage = "Unable to connect to ERP system";
                }

                return isConnected;
            }
            catch (Exception ex)
            {
                LastSyncStatus = "Error";
                LastErrorMessage = ex.Message;
                return false;
            }
        }

        /// <summary>
        /// Refresh access token if needed
        /// </summary>
        public async Task<bool> RefreshTokenIfNeededAsync()
        {
            if (AuthenticationType != "OAuth" || string.IsNullOrEmpty(RefreshToken))
                return true;

            if (TokenExpiresAt.HasValue && TokenExpiresAt > DateTime.UtcNow.AddMinutes(5))
                return true; // Token is still valid

            try
            {
                // Implementation would depend on the specific OAuth flow
                var tokenResponse = await RefreshAccessTokenAsync();

                AccessToken = tokenResponse.AccessToken;
                RefreshToken = tokenResponse.RefreshToken;
                TokenExpiresAt = DateTime.UtcNow.AddSeconds(tokenResponse.ExpiresIn);

                return true;
            }
            catch (Exception ex)
            {
                LastErrorMessage = $"Token refresh failed: {ex.Message}";
                return false;
            }
        }

        /// <summary>
        /// Log sync operation
        /// </summary>
        public void LogSync(string operation, string status, string? details = null,
                           int? recordsProcessed = null, int? recordsSuccessful = null, int? recordsErrored = null)
        {
            var syncLog = new ERPSyncLog
            {
                ERPIntegrationId = Id,
                Operation = operation,
                Status = status,
                StartTime = DateTime.UtcNow,
                EndTime = DateTime.UtcNow,
                Details = details,
                RecordsProcessed = recordsProcessed,
                RecordsSuccessful = recordsSuccessful,
                RecordsErrored = recordsErrored
            };

            SyncLogs.Add(syncLog);

            LastSyncAt = DateTime.UtcNow;
            LastSyncStatus = status;

            if (status == "Error" && !string.IsNullOrEmpty(details))
            {
                LastErrorMessage = details;
            }
            else if (status == "Success")
            {
                LastErrorMessage = null;
            }
        }

        /// <summary>
        /// Get connection status
        /// </summary>
        public string GetConnectionStatus()
        {
            if (!IsActive) return "Inactive";
            if (IsDeleted) return "Deleted";

            if (string.IsNullOrEmpty(LastSyncStatus))
                return "Not Tested";

            if (LastSyncStatus == "Connected" || LastSyncStatus == "Success")
            {
                if (LastTestAt.HasValue)
                {
                    var hoursSinceTest = (DateTime.UtcNow - LastTestAt.Value).TotalHours;
                    if (hoursSinceTest > 24)
                        return "Connection Stale";
                }
                return "Connected";
            }

            return LastSyncStatus;
        }

        /// <summary>
        /// Check if sync is due
        /// </summary>
        public bool IsSyncDue()
        {
            if (!AutoSync || !IsActive) return false;

            if (!LastSyncAt.HasValue) return true;

            var minutesSinceLastSync = (DateTime.UtcNow - LastSyncAt.Value).TotalMinutes;
            return minutesSinceLastSync >= SyncIntervalMinutes;
        }

        /// <summary>
        /// Get ERP system display name
        /// </summary>
        public string GetERPSystemName()
        {
            return IntegrationType switch
            {
                ERPIntegrationType.SAP => "SAP",
                ERPIntegrationType.Oracle => "Oracle ERP",
                ERPIntegrationType.MicrosoftDynamics => "Microsoft Dynamics",
                ERPIntegrationType.NetSuite => "NetSuite",
                ERPIntegrationType.Sage => "Sage",
                ERPIntegrationType.QuickBooks => "QuickBooks",
                ERPIntegrationType.Custom => "Custom ERP",
                _ => "Unknown ERP"
            };
        }

        /// <summary>
        /// Placeholder for actual connection test implementation
        /// </summary>
        private async Task<bool> PerformConnectionTestAsync()
        {
            // This would be implemented based on the specific ERP system
            await Task.Delay(100); // Simulate network call
            return true; // Placeholder return
        }

        /// <summary>
        /// Placeholder for token refresh implementation
        /// </summary>
        private async Task<TokenResponse> RefreshAccessTokenAsync()
        {
            // This would be implemented based on the specific OAuth flow
            await Task.Delay(100); // Simulate network call
            return new TokenResponse
            {
                AccessToken = "new_access_token",
                RefreshToken = RefreshToken,
                ExpiresIn = 3600
            };
        }
    }

    /// <summary>
    /// ERP Sync Log entity for tracking sync operations
    /// </summary>
    public class ERPSyncLog : BaseEntity
    {
        public Guid ERPIntegrationId { get; set; }
        public string Operation { get; set; } = string.Empty; // Export, Import, Sync, Test
        public string Status { get; set; } = string.Empty; // Success, Error, Warning
        public DateTime StartTime { get; set; } = DateTime.UtcNow;
        public DateTime? EndTime { get; set; }
        public string? Details { get; set; }
        public int? RecordsProcessed { get; set; }
        public int? RecordsSuccessful { get; set; }
        public int? RecordsErrored { get; set; }
        public Dictionary<string, object> ErrorDetails { get; set; } = new();
        public Dictionary<string, object> Metadata { get; set; } = new();

        // Navigation properties
        public virtual ERPIntegration ERPIntegration { get; set; } = null!;

        /// <summary>
        /// Get operation duration
        /// </summary>
        public TimeSpan? GetDuration()
        {
            if (!EndTime.HasValue) return null;
            return EndTime.Value - StartTime;
        }

        /// <summary>
        /// Get success rate
        /// </summary>
        public decimal? GetSuccessRate()
        {
            if (!RecordsProcessed.HasValue || RecordsProcessed <= 0) return null;
            if (!RecordsSuccessful.HasValue) return 0;

            return ((decimal)RecordsSuccessful.Value / RecordsProcessed.Value) * 100;
        }
    }

    /// <summary>
    /// ERP Data Mapping entity for field mappings between systems
    /// </summary>
    public class ERPDataMapping : BaseEntity
    {
        public Guid ERPIntegrationId { get; set; }
        public string EntityType { get; set; } = string.Empty; // Material, Supplier, BoQ, etc.
        public string SourceField { get; set; } = string.Empty;
        public string TargetField { get; set; } = string.Empty;
        public string? DataType { get; set; }
        public bool IsRequired { get; set; } = false;
        public string? DefaultValue { get; set; }
        public string? TransformationRule { get; set; }
        public bool IsActive { get; set; } = true;
        public Dictionary<string, object> Metadata { get; set; } = new();

        // Navigation properties
        public virtual ERPIntegration ERPIntegration { get; set; } = null!;
    }

    /// <summary>
    /// Token response model for OAuth implementations
    /// </summary>
    public class TokenResponse
    {
        public string AccessToken { get; set; } = string.Empty;
        public string? RefreshToken { get; set; }
        public int ExpiresIn { get; set; }
        public string? TokenType { get; set; } = "Bearer";
    }
}