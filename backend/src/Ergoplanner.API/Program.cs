using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using MediatR;
using Ergoplanner.Infrastructure.Persistence;
using Ergoplanner.Application.Interfaces;
using Ergoplanner.Infrastructure.Persistence.Repositories;
using Ergoplanner.Infrastructure.Services;
using Ergoplanner.Infrastructure.Configuration;
using Ergoplanner.Application.Commands.Authentication;
using Ergoplanner.Infrastructure.SignalR;
using Ergoplanner.Infrastructure.SignalR.Configuration;
using Ergoplanner.Infrastructure.SignalR.Filters;
using Ergoplanner.Infrastructure.SignalR.Middleware;
using Ergoplanner.Infrastructure.SignalR.Authentication;
using Ergoplanner.API.Extensions;
using Ergoplanner.Application.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog with full logging configuration
builder.AddSerilogConfiguration();
builder.Services.AddLoggingConfiguration(builder.Configuration);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Configure Swagger with JWT support
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new()
    {
        Title = "Ergoplanner API",
        Version = "v1",
        Description = "AI-powered P&ID management system API"
    });

    // Add JWT authentication to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    // Include XML comments for API documentation
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }
});

// Configure Database
builder.Services.AddDbContext<ErgoplannerDbContext>(options =>
{
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        b => b.MigrationsAssembly("Ergoplanner.Infrastructure"));
});

// Configure Application Services (MediatR, AutoMapper, Behaviors)
builder.Services.AddApplicationServices();

// Configure Settings
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>();
if (jwtSettings == null)
{
    throw new InvalidOperationException("JWT settings are not configured properly");
}

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = jwtSettings.ValidateIssuer,
        ValidateAudience = jwtSettings.ValidateAudience,
        ValidateLifetime = jwtSettings.ValidateLifetime,
        ValidateIssuerSigningKey = jwtSettings.ValidateIssuerSigningKey,
        ValidIssuer = jwtSettings.Issuer,
        ValidAudience = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey)),
        ClockSkew = TimeSpan.FromMinutes(jwtSettings.ClockSkewMinutes)
    };

    options.Events = new JwtBearerEvents
    {
        OnAuthenticationFailed = context =>
        {
            if (context.Exception.GetType() == typeof(SecurityTokenExpiredException))
            {
                context.Response.Headers.Add("Token-Expired", "true");
            }
            return Task.CompletedTask;
        },
        OnTokenValidated = context =>
        {
            Log.Debug("Token validated for user: {UserId}",
                context.Principal?.Identity?.Name);
            return Task.CompletedTask;
        },
        OnMessageReceived = context =>
        {
            // Support token from query string for SignalR
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;

            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }

            return Task.CompletedTask;
        }
    };
});

// Configure Authorization Policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireAdmin", policy =>
        policy.RequireRole("Admin"));

    options.AddPolicy("RequireManager", policy =>
        policy.RequireRole("Admin", "Manager"));

    options.AddPolicy("RequireEngineer", policy =>
        policy.RequireRole("Admin", "Manager", "Engineer"));

    options.AddPolicy("RequireViewer", policy =>
        policy.RequireRole("Admin", "Manager", "Engineer", "Viewer"));
});

// Configure Repositories
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();

// Configure Redis Caching
builder.Services.AddRedisCaching(builder.Configuration);
builder.Services.AddCacheHealthChecks(builder.Configuration);

// Configure Services
builder.Services.AddScoped<ITokenService, JwtTokenService>();
builder.Services.AddScoped<IPasswordService, PasswordService>();
builder.Services.AddScoped<IEmailService, EmailService>();

// Configure SignalR Services
builder.Services.AddScoped<IConnectionManagerService, ConnectionManagerService>();
builder.Services.AddScoped<ISignalRService, SignalRService>();
builder.Services.AddSingleton<SignalRJwtAuthenticationService>();
builder.Services.AddSingleton<SignalRRateLimitingMiddleware>();
builder.Services.AddSingleton<SignalRSecurityMiddleware>();

// Configure SignalR with Redis backplane
builder.Services.AddSignalRWithRedis(builder.Configuration);
builder.Services.AddRedisHealthChecks(builder.Configuration);

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigins",
        policy =>
        {
            policy.WithOrigins(
                    "http://localhost:3000",
                    "https://localhost:3000",
                    "http://localhost:5173",
                    "https://localhost:5173")
                   .AllowAnyMethod()
                   .AllowAnyHeader()
                   .AllowCredentials()
                   .SetIsOriginAllowed(_ => true); // Required for SignalR
        });

    options.AddPolicy("AllowAll",
        policy =>
        {
            policy.AllowAnyOrigin()
                   .AllowAnyMethod()
                   .AllowAnyHeader();
        });
});

// Configure Monitoring and Logging Services
builder.Services.AddMonitoringServices(builder.Configuration);

// Configure Response Caching
builder.Services.AddResponseCaching();

// Configure Response Compression
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
});

var app = builder.Build();

// Initialize Database
using (var scope = app.Services.CreateScope())
{
    try
    {
        var context = scope.ServiceProvider.GetRequiredService<ErgoplannerDbContext>();
        await context.Database.MigrateAsync();

        // Seed data if needed
        await SeedData.InitializeAsync(scope.ServiceProvider);
    }
    catch (Exception ex)
    {
        Log.Fatal(ex, "An error occurred while initializing the database");
        throw;
    }
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Ergoplanner API V1");
        c.RoutePrefix = string.Empty; // Set Swagger UI at the root
    });
}
else
{
    // Production error handling
    app.UseExceptionHandler("/error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseResponseCompression();
app.UseResponseCaching();

// Use appropriate CORS policy based on environment
if (app.Environment.IsDevelopment())
{
    app.UseCors("AllowAll");
}
else
{
    app.UseCors("AllowSpecificOrigins");
}

// Add monitoring middleware pipeline
app.UseMonitoringMiddleware();

// Authentication must come before Authorization
app.UseAuthentication();
app.UseAuthorization();

// Map endpoints
app.MapControllers();

// Map SignalR Hubs
app.MapHub<DrawingHub>("/hubs/drawing");
app.MapHub<NotificationHub>("/hubs/notification");
app.MapHub<WorkflowHub>("/hubs/workflow");

// Global error handling endpoint
app.Map("/error", (HttpContext context) =>
{
    var feature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();
    var error = feature?.Error;

    Log.Error(error, "Unhandled exception occurred");

    return Results.Problem(
        detail: app.Environment.IsDevelopment() ? error?.Message : "An error occurred",
        statusCode: 500,
        title: "Internal Server Error"
    );
});

Log.Information("Starting Ergoplanner API");
app.Run();