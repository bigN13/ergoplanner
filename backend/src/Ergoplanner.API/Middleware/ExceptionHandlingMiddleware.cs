using System.Net;
using System.Text.Json;
using Serilog;
using Serilog.Events;
using Ergoplanner.Shared.DTOs.Common;
using FluentValidation;

namespace Ergoplanner.API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var correlationId = context.Response.Headers["X-Correlation-ID"].FirstOrDefault() ?? Guid.NewGuid().ToString();

        var errorResponse = exception switch
        {
            ValidationException validationEx => new ErrorResponse
            {
                Title = "Validation Failed",
                Status = (int)HttpStatusCode.BadRequest,
                Detail = "One or more validation errors occurred.",
                Errors = validationEx.Errors.GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray()),
                Instance = context.Request.Path,
                CorrelationId = correlationId
            },
            ArgumentException argEx => new ErrorResponse
            {
                Title = "Invalid Argument",
                Status = (int)HttpStatusCode.BadRequest,
                Detail = argEx.Message,
                Instance = context.Request.Path,
                CorrelationId = correlationId
            },
            UnauthorizedAccessException => new ErrorResponse
            {
                Title = "Unauthorized",
                Status = (int)HttpStatusCode.Unauthorized,
                Detail = "You are not authorized to access this resource.",
                Instance = context.Request.Path,
                CorrelationId = correlationId
            },
            KeyNotFoundException => new ErrorResponse
            {
                Title = "Resource Not Found",
                Status = (int)HttpStatusCode.NotFound,
                Detail = "The requested resource was not found.",
                Instance = context.Request.Path,
                CorrelationId = correlationId
            },
            NotImplementedException => new ErrorResponse
            {
                Title = "Not Implemented",
                Status = (int)HttpStatusCode.NotImplemented,
                Detail = "This functionality is not yet implemented.",
                Instance = context.Request.Path,
                CorrelationId = correlationId
            },
            TimeoutException => new ErrorResponse
            {
                Title = "Request Timeout",
                Status = (int)HttpStatusCode.RequestTimeout,
                Detail = "The request timed out. Please try again.",
                Instance = context.Request.Path,
                CorrelationId = correlationId
            },
            _ => new ErrorResponse
            {
                Title = "Internal Server Error",
                Status = (int)HttpStatusCode.InternalServerError,
                Detail = "An unexpected error occurred. Please try again later.",
                Instance = context.Request.Path,
                CorrelationId = correlationId
            }
        };

        // Log the exception with appropriate level
        LogException(exception, context, correlationId);

        // Set response
        context.Response.StatusCode = errorResponse.Status;
        context.Response.ContentType = "application/json";

        var jsonResponse = JsonSerializer.Serialize(errorResponse, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(jsonResponse);
    }

    private void LogException(Exception exception, HttpContext context, string correlationId)
    {
        var logLevel = exception switch
        {
            ValidationException => LogEventLevel.Warning,
            ArgumentException => LogEventLevel.Warning,
            UnauthorizedAccessException => LogEventLevel.Warning,
            KeyNotFoundException => LogEventLevel.Warning,
            NotImplementedException => LogEventLevel.Information,
            TimeoutException => LogEventLevel.Warning,
            _ => LogEventLevel.Error
        };

        var logTemplate = "Exception occurred processing {Method} {Path} with correlation ID {CorrelationId}: {ExceptionType} - {ExceptionMessage}";

        Log.ForContext("CorrelationId", correlationId)
           .ForContext("RequestMethod", context.Request.Method)
           .ForContext("RequestPath", context.Request.Path.Value)
           .ForContext("RequestQuery", context.Request.QueryString.Value)
           .ForContext("UserAgent", context.Request.Headers.UserAgent.ToString())
           .ForContext("RemoteIpAddress", context.Connection.RemoteIpAddress?.ToString())
           .Write(logLevel, exception, logTemplate,
               context.Request.Method,
               context.Request.Path,
               correlationId,
               exception.GetType().Name,
               exception.Message);

        // For critical errors, also log to error level
        if (logLevel == LogEventLevel.Error)
        {
            _logger.LogError(exception, logTemplate,
                context.Request.Method,
                context.Request.Path,
                correlationId,
                exception.GetType().Name,
                exception.Message);
        }
    }
}