using Serilog;
using Serilog.Events;
using Serilog.Exceptions;
using Serilog.Filters;
using Microsoft.ApplicationInsights.Extensibility;

namespace Ergoplanner.API.Extensions;

public static class LoggingExtensions
{
    public static IServiceCollection AddLoggingConfiguration(this IServiceCollection services, IConfiguration configuration)
    {
        // Configure Application Insights
        services.AddApplicationInsightsTelemetry(configuration);

        // Configure Serilog
        Log.Logger = CreateSerilogLogger(configuration);

        services.AddSingleton(Log.Logger);

        return services;
    }

    public static WebApplicationBuilder AddSerilogConfiguration(this WebApplicationBuilder builder)
    {
        builder.Host.UseSerilog((context, services, configuration) =>
        {
            configuration
                .ReadFrom.Configuration(context.Configuration)
                .ReadFrom.Services(services)
                .Enrich.FromLogContext()
                .Enrich.WithEnvironmentName()
                .Enrich.WithMachineName()
                .Enrich.WithThreadId()
                .Enrich.WithCorrelationId()
                .Enrich.WithProperty("Application", "Ergoplanner.API")
                .Enrich.WithProperty("Version", GetVersion())
                .Enrich.WithExceptionDetails()
                .Filter.ByExcluding(Matching.FromSource("Microsoft.AspNetCore.Hosting"))
                .Filter.ByExcluding(Matching.FromSource("Microsoft.AspNetCore.Mvc"))
                .Filter.ByExcluding(Matching.FromSource("Microsoft.AspNetCore.Routing"))
                .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
                .WriteTo.File(
                    path: "logs/ergoplanner-.log",
                    rollingInterval: RollingInterval.Day,
                    retainedFileCountLimit: 30,
                    outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {CorrelationId} {Message:lj} {Properties:j}{NewLine}{Exception}"
                );

            // Add Application Insights if instrumentation key is configured
            var instrumentationKey = context.Configuration["ApplicationInsights:InstrumentationKey"];
            if (!string.IsNullOrEmpty(instrumentationKey))
            {
                configuration.WriteTo.ApplicationInsights(
                    services.GetService<TelemetryConfiguration>()!,
                    TelemetryConverter.Traces,
                    LogEventLevel.Information
                );
            }
        });

        return builder;
    }

    private static ILogger CreateSerilogLogger(IConfiguration configuration)
    {
        var loggerConfiguration = new LoggerConfiguration()
            .MinimumLevel.Information()
            .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
            .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
            .MinimumLevel.Override("Microsoft.EntityFrameworkCore.Database.Command", LogEventLevel.Warning)
            .MinimumLevel.Override("System", LogEventLevel.Warning)
            .Enrich.FromLogContext()
            .Enrich.WithEnvironmentName()
            .Enrich.WithMachineName()
            .Enrich.WithThreadId()
            .Enrich.WithCorrelationId()
            .Enrich.WithProperty("Application", "Ergoplanner.API")
            .Enrich.WithProperty("Version", GetVersion())
            .Enrich.WithExceptionDetails()
            .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
            .WriteTo.File(
                path: "logs/ergoplanner-.log",
                rollingInterval: RollingInterval.Day,
                retainedFileCountLimit: 30,
                outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {CorrelationId} {Message:lj} {Properties:j}{NewLine}{Exception}"
            );

        // Add Application Insights if instrumentation key is configured
        var instrumentationKey = configuration["ApplicationInsights:InstrumentationKey"];
        if (!string.IsNullOrEmpty(instrumentationKey))
        {
            loggerConfiguration.WriteTo.ApplicationInsights(
                instrumentationKey,
                TelemetryConverter.Traces,
                LogEventLevel.Information
            );
        }

        return loggerConfiguration.CreateLogger();
    }

    private static string GetVersion()
    {
        return typeof(LoggingExtensions).Assembly.GetName().Version?.ToString() ?? "1.0.0";
    }
}