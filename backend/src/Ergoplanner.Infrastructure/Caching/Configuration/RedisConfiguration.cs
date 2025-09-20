namespace Ergoplanner.Infrastructure.Caching.Configuration;

/// <summary>
/// Redis configuration options
/// </summary>
public class RedisConfiguration
{
    public const string Section = "Redis";

    /// <summary>
    /// Redis connection string
    /// </summary>
    public string ConnectionString { get; set; } = "localhost:6379";

    /// <summary>
    /// Redis instance name for distributed caching
    /// </summary>
    public string InstanceName { get; set; } = "Ergoplanner";

    /// <summary>
    /// Default database number
    /// </summary>
    public int DefaultDatabase { get; set; } = 0;

    /// <summary>
    /// Connection timeout in milliseconds
    /// </summary>
    public int ConnectTimeoutMs { get; set; } = 5000;

    /// <summary>
    /// Command timeout in milliseconds
    /// </summary>
    public int CommandTimeoutMs { get; set; } = 5000;

    /// <summary>
    /// Number of reconnect retries
    /// </summary>
    public int ConnectRetry { get; set; } = 3;

    /// <summary>
    /// Whether to abort connection on failure
    /// </summary>
    public bool AbortOnConnectFail { get; set; } = false;

    /// <summary>
    /// SSL/TLS configuration
    /// </summary>
    public bool UseSsl { get; set; } = false;

    /// <summary>
    /// Password for Redis authentication
    /// </summary>
    public string? Password { get; set; }

    /// <summary>
    /// Enable Redis key compression
    /// </summary>
    public bool EnableCompression { get; set; } = true;

    /// <summary>
    /// Default cache expiration times in minutes
    /// </summary>
    public CacheExpirationOptions Expiration { get; set; } = new();

    /// <summary>
    /// Circuit breaker configuration
    /// </summary>
    public CircuitBreakerOptions CircuitBreaker { get; set; } = new();
}

/// <summary>
/// Cache expiration configuration
/// </summary>
public class CacheExpirationOptions
{
    /// <summary>
    /// Default expiration for user sessions (minutes)
    /// </summary>
    public int UserSessionMinutes { get; set; } = 60;

    /// <summary>
    /// Default expiration for project metadata (minutes)
    /// </summary>
    public int ProjectMetadataMinutes { get; set; } = 30;

    /// <summary>
    /// Default expiration for drawing metadata (minutes)
    /// </summary>
    public int DrawingMetadataMinutes { get; set; } = 15;

    /// <summary>
    /// Default expiration for drawing data (minutes)
    /// </summary>
    public int DrawingDataMinutes { get; set; } = 10;

    /// <summary>
    /// Default expiration for symbol libraries (hours)
    /// </summary>
    public int SymbolLibraryHours { get; set; } = 24;

    /// <summary>
    /// Default expiration for user preferences (hours)
    /// </summary>
    public int UserPreferencesHours { get; set; } = 12;

    /// <summary>
    /// Default expiration for collaboration data (minutes)
    /// </summary>
    public int CollaborationDataMinutes { get; set; } = 5;

    /// <summary>
    /// Default expiration for drawing locks (minutes)
    /// </summary>
    public int DrawingLockMinutes { get; set; } = 30;

    /// <summary>
    /// Default expiration for blacklisted tokens (hours)
    /// </summary>
    public int BlacklistedTokenHours { get; set; } = 24;
}

/// <summary>
/// Circuit breaker configuration for Redis operations
/// </summary>
public class CircuitBreakerOptions
{
    /// <summary>
    /// Enable circuit breaker
    /// </summary>
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// Number of failures before opening circuit
    /// </summary>
    public int FailureThreshold { get; set; } = 5;

    /// <summary>
    /// Time to wait before attempting to close circuit (seconds)
    /// </summary>
    public int RecoveryTimeoutSeconds { get; set; } = 30;

    /// <summary>
    /// Monitoring period for failure count (seconds)
    /// </summary>
    public int MonitoringPeriodSeconds { get; set; } = 60;
}