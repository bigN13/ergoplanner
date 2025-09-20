using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;
using Ergoplanner.Infrastructure.Persistence;
using Microsoft.Extensions.Logging;

namespace Ergoplanner.Infrastructure.HealthChecks;

public class DatabaseHealthCheck : IHealthCheck
{
    private readonly ErgoplannerDbContext _dbContext;
    private readonly ILogger<DatabaseHealthCheck> _logger;

    public DatabaseHealthCheck(ErgoplannerDbContext dbContext, ILogger<DatabaseHealthCheck> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            var startTime = DateTime.UtcNow;

            // Test database connection
            await _dbContext.Database.CanConnectAsync(cancellationToken);

            // Test a simple query
            var organizationCount = await _dbContext.Organizations.CountAsync(cancellationToken);

            var duration = DateTime.UtcNow - startTime;

            var data = new Dictionary<string, object>
            {
                ["database_name"] = _dbContext.Database.GetDbConnection().Database,
                ["server"] = _dbContext.Database.GetDbConnection().DataSource,
                ["organizations_count"] = organizationCount,
                ["response_time_ms"] = duration.TotalMilliseconds,
                ["connection_state"] = _dbContext.Database.GetDbConnection().State.ToString()
            };

            _logger.LogInformation("Database health check completed successfully in {Duration}ms", duration.TotalMilliseconds);

            return duration.TotalMilliseconds > 5000
                ? HealthCheckResult.Degraded("Database is responding slowly", data: data)
                : HealthCheckResult.Healthy("Database is healthy", data: data);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database health check failed");

            var data = new Dictionary<string, object>
            {
                ["error"] = ex.Message,
                ["exception_type"] = ex.GetType().Name
            };

            return HealthCheckResult.Unhealthy("Database is not accessible", ex, data);
        }
    }
}