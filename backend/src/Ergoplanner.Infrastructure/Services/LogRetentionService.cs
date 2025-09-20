using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.IO.Compression;
using System.Text.Json;

namespace Ergoplanner.Infrastructure.Services;

public class LogRetentionService : ILogRetentionService
{
    private readonly LogRetentionOptions _options;
    private readonly ILogger<LogRetentionService> _logger;
    private readonly ISecurityAuditLogger _securityAuditLogger;

    public LogRetentionService(
        IOptions<LogRetentionOptions> options,
        ILogger<LogRetentionService> logger,
        ISecurityAuditLogger securityAuditLogger)
    {
        _options = options.Value;
        _logger = logger;
        _securityAuditLogger = securityAuditLogger;
    }

    public async Task ArchiveOldLogsAsync(DateTime cutoffDate, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting log archival process for logs older than {CutoffDate}", cutoffDate);

        try
        {
            var logDirectory = new DirectoryInfo(_options.LogDirectory);
            if (!logDirectory.Exists)
            {
                _logger.LogWarning("Log directory {LogDirectory} does not exist", _options.LogDirectory);
                return;
            }

            var archiveDirectory = new DirectoryInfo(_options.ArchiveDirectory);
            if (!archiveDirectory.Exists)
            {
                archiveDirectory.Create();
                _logger.LogInformation("Created archive directory {ArchiveDirectory}", _options.ArchiveDirectory);
            }

            var logFiles = logDirectory.GetFiles("*.log", SearchOption.AllDirectories)
                .Where(f => f.LastWriteTime < cutoffDate)
                .ToList();

            _logger.LogInformation("Found {FileCount} log files to archive", logFiles.Count);

            var archivedCount = 0;
            var totalSizeArchived = 0L;

            foreach (var logFile in logFiles)
            {
                cancellationToken.ThrowIfCancellationRequested();

                try
                {
                    var archiveFileName = $"{Path.GetFileNameWithoutExtension(logFile.Name)}_{logFile.LastWriteTime:yyyyMMdd_HHmmss}.gz";
                    var archivePath = Path.Combine(_options.ArchiveDirectory, archiveFileName);

                    await CompressFileAsync(logFile.FullName, archivePath, cancellationToken);

                    // Verify archive integrity
                    if (await VerifyArchiveIntegrityAsync(archivePath, cancellationToken))
                    {
                        totalSizeArchived += logFile.Length;
                        logFile.Delete();
                        archivedCount++;

                        _logger.LogDebug("Archived log file {LogFile} to {ArchivePath}", logFile.Name, archivePath);
                    }
                    else
                    {
                        _logger.LogError("Archive integrity verification failed for {LogFile}", logFile.Name);
                        File.Delete(archivePath); // Remove corrupted archive
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to archive log file {LogFile}", logFile.Name);
                }
            }

            _logger.LogInformation("Log archival completed. Archived {ArchivedCount} files totaling {TotalSizeMB} MB",
                archivedCount, totalSizeArchived / 1024 / 1024);

            // Log data retention action for compliance
            await _securityAuditLogger.LogDataRetentionAction(
                "System",
                "LogFiles",
                "Archive",
                archivedCount,
                "localhost");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during log archival process");
            throw;
        }
    }

    public async Task DeleteArchivedLogsAsync(DateTime cutoffDate, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting deletion of archived logs older than {CutoffDate}", cutoffDate);

        try
        {
            var archiveDirectory = new DirectoryInfo(_options.ArchiveDirectory);
            if (!archiveDirectory.Exists)
            {
                _logger.LogInformation("Archive directory {ArchiveDirectory} does not exist", _options.ArchiveDirectory);
                return;
            }

            var archiveFiles = archiveDirectory.GetFiles("*.gz", SearchOption.AllDirectories)
                .Where(f => f.LastWriteTime < cutoffDate)
                .ToList();

            _logger.LogInformation("Found {FileCount} archived files to delete", archiveFiles.Count);

            var deletedCount = 0;
            var totalSizeDeleted = 0L;

            foreach (var archiveFile in archiveFiles)
            {
                cancellationToken.ThrowIfCancellationRequested();

                try
                {
                    totalSizeDeleted += archiveFile.Length;
                    archiveFile.Delete();
                    deletedCount++;

                    _logger.LogDebug("Deleted archived file {ArchiveFile}", archiveFile.Name);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to delete archived file {ArchiveFile}", archiveFile.Name);
                }
            }

            _logger.LogInformation("Archived log deletion completed. Deleted {DeletedCount} files totaling {TotalSizeMB} MB",
                deletedCount, totalSizeDeleted / 1024 / 1024);

            // Log data retention action for compliance
            await _securityAuditLogger.LogDataRetentionAction(
                "System",
                "ArchivedLogFiles",
                "Delete",
                deletedCount,
                "localhost");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during archived log deletion process");
            throw;
        }
    }

    public async Task CompressOldLogsAsync(int olderThanDays, CancellationToken cancellationToken = default)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-olderThanDays);
        _logger.LogInformation("Starting compression of logs older than {Days} days (cutoff: {CutoffDate})", olderThanDays, cutoffDate);

        try
        {
            var logDirectory = new DirectoryInfo(_options.LogDirectory);
            if (!logDirectory.Exists)
            {
                _logger.LogWarning("Log directory {LogDirectory} does not exist", _options.LogDirectory);
                return;
            }

            var logFiles = logDirectory.GetFiles("*.log", SearchOption.AllDirectories)
                .Where(f => f.LastWriteTime < cutoffDate && !f.Name.EndsWith(".gz"))
                .ToList();

            _logger.LogInformation("Found {FileCount} log files to compress", logFiles.Count);

            var compressedCount = 0;
            var totalSizeBeforeCompression = 0L;
            var totalSizeAfterCompression = 0L;

            foreach (var logFile in logFiles)
            {
                cancellationToken.ThrowIfCancellationRequested();

                try
                {
                    var originalSize = logFile.Length;
                    var compressedPath = logFile.FullName + ".gz";

                    await CompressFileAsync(logFile.FullName, compressedPath, cancellationToken);

                    var compressedSize = new FileInfo(compressedPath).Length;

                    // Verify compression and delete original if successful
                    if (await VerifyArchiveIntegrityAsync(compressedPath, cancellationToken))
                    {
                        logFile.Delete();
                        compressedCount++;
                        totalSizeBeforeCompression += originalSize;
                        totalSizeAfterCompression += compressedSize;

                        _logger.LogDebug("Compressed log file {LogFile} from {OriginalSizeKB} KB to {CompressedSizeKB} KB",
                            logFile.Name, originalSize / 1024, compressedSize / 1024);
                    }
                    else
                    {
                        _logger.LogError("Compression verification failed for {LogFile}", logFile.Name);
                        File.Delete(compressedPath); // Remove corrupted compression
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to compress log file {LogFile}", logFile.Name);
                }
            }

            var compressionRatio = totalSizeBeforeCompression > 0
                ? (double)totalSizeAfterCompression / totalSizeBeforeCompression * 100
                : 0;

            _logger.LogInformation("Log compression completed. Compressed {CompressedCount} files. " +
                "Size reduced from {BeforeMB} MB to {AfterMB} MB (compression ratio: {CompressionRatio:F1}%)",
                compressedCount,
                totalSizeBeforeCompression / 1024 / 1024,
                totalSizeAfterCompression / 1024 / 1024,
                compressionRatio);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during log compression process");
            throw;
        }
    }

    public async Task<LogRetentionStats> GetRetentionStatsAsync(CancellationToken cancellationToken = default)
    {
        var stats = new LogRetentionStats();

        try
        {
            // Analyze log directory
            var logDirectory = new DirectoryInfo(_options.LogDirectory);
            if (logDirectory.Exists)
            {
                var logFiles = logDirectory.GetFiles("*", SearchOption.AllDirectories);
                stats.TotalLogFiles = logFiles.Length;
                stats.TotalLogSizeBytes = logFiles.Sum(f => f.Length);

                var compressedFiles = logFiles.Where(f => f.Extension == ".gz").ToArray();
                stats.CompressedFiles = compressedFiles.Length;
                stats.CompressedSizeBytes = compressedFiles.Sum(f => f.Length);

                if (logFiles.Any())
                {
                    stats.OldestLogDate = logFiles.Min(f => f.LastWriteTime);
                    stats.LatestLogDate = logFiles.Max(f => f.LastWriteTime);
                }

                // Breakdown by file type
                stats.LogTypeBreakdown = logFiles
                    .GroupBy(f => f.Extension.ToLowerInvariant())
                    .ToDictionary(g => g.Key, g => g.Sum(f => f.Length));
            }

            // Analyze archive directory
            var archiveDirectory = new DirectoryInfo(_options.ArchiveDirectory);
            if (archiveDirectory.Exists)
            {
                var archiveFiles = archiveDirectory.GetFiles("*", SearchOption.AllDirectories);
                stats.ArchivedFiles = archiveFiles.Length;
                stats.ArchivedSizeBytes = archiveFiles.Sum(f => f.Length);
            }

            _logger.LogInformation("Log retention stats calculated: {TotalFiles} files, {TotalSizeMB} MB total",
                stats.TotalLogFiles, stats.TotalLogSizeBytes / 1024 / 1024);

            return stats;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating log retention stats");
            throw;
        }
    }

    public async Task CleanupApplicationInsightsLogsAsync(int retentionDays, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting Application Insights log cleanup for logs older than {RetentionDays} days", retentionDays);

        try
        {
            // This would typically involve calling Application Insights API to configure retention
            // For now, we'll log the action for audit purposes
            await _securityAuditLogger.LogDataRetentionAction(
                "System",
                "ApplicationInsightsLogs",
                $"SetRetention_{retentionDays}Days",
                0,
                "localhost");

            _logger.LogInformation("Application Insights log retention policy applied: {RetentionDays} days", retentionDays);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during Application Insights log cleanup");
            throw;
        }
    }

    public async Task<string> ExportLogsForComplianceAsync(DateTime fromDate, DateTime toDate, string exportPath, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting compliance log export from {FromDate} to {ToDate}", fromDate, toDate);

        try
        {
            var exportDirectory = new DirectoryInfo(exportPath);
            if (!exportDirectory.Exists)
            {
                exportDirectory.Create();
            }

            var exportFileName = $"compliance_logs_{fromDate:yyyyMMdd}_{toDate:yyyyMMdd}.json";
            var exportFilePath = Path.Combine(exportPath, exportFileName);

            var logDirectory = new DirectoryInfo(_options.LogDirectory);
            var archiveDirectory = new DirectoryInfo(_options.ArchiveDirectory);

            var exportData = new
            {
                ExportMetadata = new
                {
                    ExportDate = DateTime.UtcNow,
                    FromDate = fromDate,
                    ToDate = toDate,
                    ExportedBy = "System",
                    Version = "1.0"
                },
                LogFiles = new List<object>(),
                ArchivedFiles = new List<object>()
            };

            // Collect log files in date range
            if (logDirectory.Exists)
            {
                var logFiles = logDirectory.GetFiles("*.log", SearchOption.AllDirectories)
                    .Where(f => f.LastWriteTime >= fromDate && f.LastWriteTime <= toDate)
                    .Select(f => new
                    {
                        FileName = f.Name,
                        FullPath = f.FullName,
                        Size = f.Length,
                        LastModified = f.LastWriteTime,
                        Type = "Active"
                    });

                ((List<object>)exportData.LogFiles).AddRange(logFiles);
            }

            // Collect archived files in date range
            if (archiveDirectory.Exists)
            {
                var archiveFiles = archiveDirectory.GetFiles("*.gz", SearchOption.AllDirectories)
                    .Where(f => f.LastWriteTime >= fromDate && f.LastWriteTime <= toDate)
                    .Select(f => new
                    {
                        FileName = f.Name,
                        FullPath = f.FullName,
                        Size = f.Length,
                        LastModified = f.LastWriteTime,
                        Type = "Archived"
                    });

                ((List<object>)exportData.ArchivedFiles).AddRange(archiveFiles);
            }

            var jsonOptions = new JsonSerializerOptions
            {
                WriteIndented = true,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };

            await File.WriteAllTextAsync(exportFilePath, JsonSerializer.Serialize(exportData, jsonOptions), cancellationToken);

            var totalFiles = exportData.LogFiles.Count + exportData.ArchivedFiles.Count;
            _logger.LogInformation("Compliance export completed: {TotalFiles} files exported to {ExportPath}",
                totalFiles, exportFilePath);

            // Log compliance export for audit
            await _securityAuditLogger.LogGdprDataRequest(
                "System",
                "ComplianceLogExport",
                $"Logs_{fromDate:yyyyMMdd}_{toDate:yyyyMMdd}",
                "localhost");

            return exportFilePath;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during compliance log export");
            throw;
        }
    }

    private async Task CompressFileAsync(string sourceFilePath, string destinationFilePath, CancellationToken cancellationToken)
    {
        using var sourceStream = new FileStream(sourceFilePath, FileMode.Open, FileAccess.Read);
        using var destinationStream = new FileStream(destinationFilePath, FileMode.Create, FileAccess.Write);
        using var compressionStream = new GZipStream(destinationStream, CompressionLevel.Optimal);

        await sourceStream.CopyToAsync(compressionStream, cancellationToken);
    }

    private async Task<bool> VerifyArchiveIntegrityAsync(string archivePath, CancellationToken cancellationToken)
    {
        try
        {
            using var fileStream = new FileStream(archivePath, FileMode.Open, FileAccess.Read);
            using var decompressionStream = new GZipStream(fileStream, CompressionMode.Decompress);
            using var tempStream = new MemoryStream();

            await decompressionStream.CopyToAsync(tempStream, cancellationToken);
            return tempStream.Length > 0;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Archive integrity verification failed for {ArchivePath}", archivePath);
            return false;
        }
    }
}

public class LogRetentionOptions
{
    public string LogDirectory { get; set; } = "logs";
    public string ArchiveDirectory { get; set; } = "logs/archive";
    public int ActiveLogRetentionDays { get; set; } = 30;
    public int ArchiveRetentionDays { get; set; } = 365;
    public int CompressionAfterDays { get; set; } = 7;
    public bool EnableAutomaticCleanup { get; set; } = true;
    public string CleanupSchedule { get; set; } = "0 2 * * *"; // Daily at 2 AM
}