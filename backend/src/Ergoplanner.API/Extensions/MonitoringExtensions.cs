using Ergoplanner.Infrastructure.Monitoring;
using Ergoplanner.Infrastructure.Services;
using Ergoplanner.Infrastructure.HealthChecks;

namespace Ergoplanner.API.Extensions;

public static class MonitoringExtensions
{
    public static IServiceCollection AddMonitoringServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Add monitoring services
        services.Configure<LogRetentionOptions>(configuration.GetSection("LogRetention"));

        // Register monitoring services
        services.AddTransient<IMetricsService, ApplicationInsightsMetricsService>();
        services.AddTransient<ISecurityAuditLogger, SecurityAuditLogger>();
        services.AddTransient<ILogRetentionService, LogRetentionService>();

        // Register health check services
        services.AddTransient<DatabaseHealthCheck>();
        services.AddTransient<RedisHealthCheck>();
        services.AddTransient<SignalRHealthCheck>();

        // Add Application Insights
        var enableApplicationInsights = !string.IsNullOrEmpty(configuration["ApplicationInsights:InstrumentationKey"]) ||
                                       !string.IsNullOrEmpty(configuration["ApplicationInsights:ConnectionString"]);

        if (enableApplicationInsights)
        {
            services.AddApplicationInsightsTelemetry(configuration);
        }

        // Add distributed tracing
        if (configuration.GetValue<bool>("Monitoring:EnableDistributedTracing", true))
        {
            services.AddDistributedTracing(configuration);
        }

        // Add health checks
        if (configuration.GetValue<bool>("HealthChecks:Enabled", true))
        {
            services.AddHealthCheckConfiguration(configuration);
        }

        return services;
    }

    public static WebApplication UseMonitoringMiddleware(this WebApplication app)
    {
        var configuration = app.Configuration;

        // Add correlation ID middleware (first in pipeline)
        app.UseMiddleware<CorrelationIdMiddleware>();

        // Add distributed tracing middleware
        if (configuration.GetValue<bool>("Monitoring:EnableDistributedTracing", true))
        {
            app.UseMiddleware<DistributedTracingMiddleware>();
        }

        // Add metrics middleware
        if (configuration.GetValue<bool>("Monitoring:EnableCustomMetrics", true))
        {
            app.UseMiddleware<MetricsMiddleware>();
        }

        // Add security audit middleware
        if (configuration.GetValue<bool>("Monitoring:EnableSecurityAuditLogging", true))
        {
            app.UseMiddleware<SecurityAuditMiddleware>();
        }

        // Add request/response logging middleware
        if (configuration.GetValue<bool>("Monitoring:EnablePerformanceLogging", true))
        {
            app.UseMiddleware<RequestResponseLoggingMiddleware>();
        }

        // Add exception handling middleware (last in error handling chain)
        app.UseMiddleware<ExceptionHandlingMiddleware>();

        // Configure health checks
        if (configuration.GetValue<bool>("HealthChecks:Enabled", true))
        {
            app.UseHealthCheckConfiguration();
        }

        return app;
    }
}