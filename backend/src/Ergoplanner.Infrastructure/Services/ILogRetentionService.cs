namespace Ergoplanner.Infrastructure.Services;

public interface ILogRetentionService
{
    /// <summary>
    /// Archive old log files to cold storage
    /// </summary>
    Task ArchiveOldLogsAsync(DateTime cutoffDate, CancellationToken cancellationToken = default);

    /// <summary>
    /// Delete archived logs older than specified date
    /// </summary>
    Task DeleteArchivedLogsAsync(DateTime cutoffDate, CancellationToken cancellationToken = default);

    /// <summary>
    /// Compress log files older than specified days
    /// </summary>
    Task CompressOldLogsAsync(int olderThanDays, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get log retention statistics
    /// </summary>
    Task<LogRetentionStats> GetRetentionStatsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Cleanup Application Insights logs based on retention policy
    /// </summary>
    Task CleanupApplicationInsightsLogsAsync(int retentionDays, CancellationToken cancellationToken = default);

    /// <summary>
    /// Export logs for compliance/audit purposes
    /// </summary>
    Task<string> ExportLogsForComplianceAsync(DateTime fromDate, DateTime toDate, string exportPath, CancellationToken cancellationToken = default);
}

public class LogRetentionStats
{
    public long TotalLogFiles { get; set; }
    public long TotalLogSizeBytes { get; set; }
    public long CompressedFiles { get; set; }
    public long CompressedSizeBytes { get; set; }
    public long ArchivedFiles { get; set; }
    public long ArchivedSizeBytes { get; set; }
    public DateTime OldestLogDate { get; set; }
    public DateTime LatestLogDate { get; set; }
    public Dictionary<string, long> LogTypeBreakdown { get; set; } = new();
}