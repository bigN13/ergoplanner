using Microsoft.Extensions.Diagnostics.HealthChecks;
using Ergoplanner.Infrastructure.HealthChecks;
using Ergoplanner.Infrastructure.Persistence;
using HealthChecks.UI.Client;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;

namespace Ergoplanner.API.Extensions;

public static class HealthCheckExtensions
{
    public static IServiceCollection AddHealthCheckConfiguration(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHealthChecks()
            .AddCheck<DatabaseHealthCheck>("database", HealthStatus.Unhealthy, new[] { "database", "sql", "postgresql" })
            .AddCheck<RedisHealthCheck>("redis", HealthStatus.Unhealthy, new[] { "cache", "redis" })
            .AddCheck<SignalRHealthCheck>("signalr", HealthStatus.Degraded, new[] { "signalr", "realtime" })
            .AddDbContextCheck<ErgoplannerDbContext>("dbcontext", HealthStatus.Unhealthy, new[] { "database", "ef", "dbcontext" });

        // Add Health Checks UI
        services.AddHealthChecksUI(options =>
        {
            options.SetEvaluationTimeInSeconds(30); // Evaluate every 30 seconds
            options.MaximumHistoryEntriesPerEndpoint(50); // Keep 50 history entries
            options.SetApiMaxActiveRequests(1); // Maximum concurrent requests
            options.AddHealthCheckEndpoint("Ergoplanner API", "/health");
        }).AddInMemoryStorage();

        return services;
    }

    public static WebApplication UseHealthCheckConfiguration(this WebApplication app)
    {
        // Basic health check endpoint
        app.MapHealthChecks("/health", new HealthCheckOptions
        {
            ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse,
            ResultStatusCodes =
            {
                [HealthStatus.Healthy] = StatusCodes.Status200OK,
                [HealthStatus.Degraded] = StatusCodes.Status200OK,
                [HealthStatus.Unhealthy] = StatusCodes.Status503ServiceUnavailable
            }
        });

        // Detailed health check endpoint
        app.MapHealthChecks("/health/detailed", new HealthCheckOptions
        {
            ResponseWriter = WriteDetailedHealthCheckResponse,
            ResultStatusCodes =
            {
                [HealthStatus.Healthy] = StatusCodes.Status200OK,
                [HealthStatus.Degraded] = StatusCodes.Status200OK,
                [HealthStatus.Unhealthy] = StatusCodes.Status503ServiceUnavailable
            }
        });

        // Ready check (startup probe)
        app.MapHealthChecks("/health/ready", new HealthCheckOptions
        {
            Predicate = check => check.Tags.Contains("database"),
            ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
        });

        // Live check (liveness probe)
        app.MapHealthChecks("/health/live", new HealthCheckOptions
        {
            Predicate = _ => false, // No checks, just returns 200 if app is running
            ResponseWriter = (context, result) =>
            {
                context.Response.ContentType = "application/json";
                return context.Response.WriteAsync("""{"status":"Healthy","timestamp":"{{DateTime.UtcNow:yyyy-MM-ddTHH:mm:ssZ}}"}""");
            }
        });

        // Health Checks UI
        app.MapHealthChecksUI(options =>
        {
            options.UIPath = "/health-ui";
            options.ApiPath = "/health-ui-api";
        });

        return app;
    }

    private static async Task WriteDetailedHealthCheckResponse(HttpContext context, HealthReport result)
    {
        context.Response.ContentType = "application/json";

        var response = new
        {
            status = result.Status.ToString(),
            timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ"),
            duration = result.TotalDuration.TotalMilliseconds,
            checks = result.Entries.Select(kvp => new
            {
                name = kvp.Key,
                status = kvp.Value.Status.ToString(),
                duration = kvp.Value.Duration.TotalMilliseconds,
                description = kvp.Value.Description,
                data = kvp.Value.Data,
                exception = kvp.Value.Exception?.Message,
                tags = kvp.Value.Tags
            }).ToList(),
            environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
            version = typeof(HealthCheckExtensions).Assembly.GetName().Version?.ToString()
        };

        await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(response, new System.Text.Json.JsonSerializerOptions
        {
            PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase,
            WriteIndented = true
        }));
    }
}