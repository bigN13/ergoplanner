using MediatR;
using FluentValidation;
using Ergoplanner.Application.Behaviors;
using Microsoft.Extensions.DependencyInjection;
using System.Reflection;

namespace Ergoplanner.Application.Extensions;

public static class ApplicationExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Add MediatR
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly()));

        // Add pipeline behaviors
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(PerformanceBehavior<,>));

        // Add FluentValidation
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

        // Add AutoMapper if needed
        // services.AddAutoMapper(Assembly.GetExecutingAssembly());

        return services;
    }
}