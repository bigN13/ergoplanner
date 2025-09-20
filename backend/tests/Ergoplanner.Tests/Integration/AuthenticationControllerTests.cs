using System;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Xunit;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Ergoplanner.Application.DTOs.Authentication;
using Ergoplanner.Infrastructure.Persistence;
using Ergoplanner.Domain.Entities;
using Ergoplanner.Domain.Enums;
using Ergoplanner.Application.Interfaces;

namespace Ergoplanner.Tests.Integration
{
    public class AuthenticationControllerTests : IClassFixture<WebApplicationFactory<Program>>, IAsyncLifetime
    {
        private readonly WebApplicationFactory<Program> _factory;
        private readonly HttpClient _client;

        public AuthenticationControllerTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Remove existing DbContext registration
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<ErgoplannerDbContext>));
                    if (descriptor != null)
                    {
                        services.Remove(descriptor);
                    }

                    // Add in-memory database for testing
                    services.AddDbContext<ErgoplannerDbContext>(options =>
                    {
                        options.UseInMemoryDatabase("TestDb_" + Guid.NewGuid());
                    });

                    // Override email service to prevent actual emails
                    services.AddScoped<IEmailService, MockEmailService>();
                });
            });

            _client = _factory.CreateClient();
        }

        public async Task InitializeAsync()
        {
            // Seed test data if needed
            using var scope = _factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ErgoplannerDbContext>();
            await dbContext.Database.EnsureCreatedAsync();

            // Add test organization
            var organization = new Organization
            {
                Id = Guid.NewGuid(),
                Name = "Test Organization",
                Code = "TEST",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = "SYSTEM"
            };

            dbContext.Organizations.Add(organization);
            await dbContext.SaveChangesAsync();
        }

        public Task DisposeAsync()
        {
            return Task.CompletedTask;
        }

        [Fact]
        public async Task Register_ShouldCreateNewUser_WhenValidData()
        {
            // Arrange
            using var scope = _factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ErgoplannerDbContext>();
            var organization = await dbContext.Organizations.FirstAsync();

            var registerDto = new RegisterDto
            {
                Email = "newuser@test.com",
                Username = "newuser",
                Password = "ValidPass123!",
                ConfirmPassword = "ValidPass123!",
                FirstName = "New",
                LastName = "User",
                OrganizationId = organization.Id,
                Role = UserRole.Engineer
            };

            // Act
            var response = await _client.PostAsJsonAsync("/api/v1/authentication/register", registerDto);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.Created);

            var content = await response.Content.ReadFromJsonAsync<AuthenticationResponse>();
            content.Should().NotBeNull();
            content!.AccessToken.Should().NotBeNullOrWhiteSpace();
            content.RefreshToken.Should().NotBeNullOrWhiteSpace();
            content.User.Should().NotBeNull();
            content.User.Email.Should().Be(registerDto.Email.ToLowerInvariant());
        }

        [Fact]
        public async Task Register_ShouldReturnConflict_WhenEmailExists()
        {
            // Arrange
            using var scope = _factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ErgoplannerDbContext>();
            var organization = await dbContext.Organizations.FirstAsync();

            var existingUser = new User
            {
                Id = Guid.NewGuid(),
                OrganizationId = organization.Id,
                Email = "existing@test.com",
                Username = "existinguser",
                PasswordHash = "hashedpassword",
                Role = UserRole.Engineer,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = "SYSTEM"
            };

            dbContext.Users.Add(existingUser);
            await dbContext.SaveChangesAsync();

            var registerDto = new RegisterDto
            {
                Email = "existing@test.com",
                Username = "newusername",
                Password = "ValidPass123!",
                ConfirmPassword = "ValidPass123!",
                FirstName = "New",
                LastName = "User",
                OrganizationId = organization.Id,
                Role = UserRole.Engineer
            };

            // Act
            var response = await _client.PostAsJsonAsync("/api/v1/authentication/register", registerDto);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        }

        [Fact]
        public async Task Login_ShouldReturnTokens_WhenValidCredentials()
        {
            // Arrange
            using var scope = _factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ErgoplannerDbContext>();
            var passwordService = scope.ServiceProvider.GetRequiredService<IPasswordService>();
            var organization = await dbContext.Organizations.FirstAsync();

            var user = new User
            {
                Id = Guid.NewGuid(),
                OrganizationId = organization.Id,
                Email = "login@test.com",
                Username = "loginuser",
                PasswordHash = passwordService.HashPassword("ValidPass123!"),
                Role = UserRole.Engineer,
                IsActive = true,
                IsVerified = true,
                Permissions = new List<string> { "drawings.read", "drawings.write" },
                CreatedAt = DateTime.UtcNow,
                CreatedBy = "SYSTEM"
            };

            dbContext.Users.Add(user);
            await dbContext.SaveChangesAsync();

            var loginDto = new LoginDto
            {
                EmailOrUsername = "login@test.com",
                Password = "ValidPass123!",
                RememberMe = false
            };

            // Act
            var response = await _client.PostAsJsonAsync("/api/v1/authentication/login", loginDto);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var content = await response.Content.ReadFromJsonAsync<AuthenticationResponse>();
            content.Should().NotBeNull();
            content!.AccessToken.Should().NotBeNullOrWhiteSpace();
            content.RefreshToken.Should().NotBeNullOrWhiteSpace();
            content.User.Should().NotBeNull();
            content.User.Email.Should().Be(user.Email);
        }

        [Fact]
        public async Task Login_ShouldReturnUnauthorized_WhenInvalidCredentials()
        {
            // Arrange
            var loginDto = new LoginDto
            {
                EmailOrUsername = "nonexistent@test.com",
                Password = "WrongPassword123!",
                RememberMe = false
            };

            // Act
            var response = await _client.PostAsJsonAsync("/api/v1/authentication/login", loginDto);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }

        [Fact]
        public async Task Login_ShouldReturnUnauthorized_WhenUserNotVerified()
        {
            // Arrange
            using var scope = _factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ErgoplannerDbContext>();
            var passwordService = scope.ServiceProvider.GetRequiredService<IPasswordService>();
            var organization = await dbContext.Organizations.FirstAsync();

            var user = new User
            {
                Id = Guid.NewGuid(),
                OrganizationId = organization.Id,
                Email = "unverified@test.com",
                Username = "unverifieduser",
                PasswordHash = passwordService.HashPassword("ValidPass123!"),
                Role = UserRole.Engineer,
                IsActive = true,
                IsVerified = false, // Not verified
                CreatedAt = DateTime.UtcNow,
                CreatedBy = "SYSTEM"
            };

            dbContext.Users.Add(user);
            await dbContext.SaveChangesAsync();

            var loginDto = new LoginDto
            {
                EmailOrUsername = "unverified@test.com",
                Password = "ValidPass123!",
                RememberMe = false
            };

            // Act
            var response = await _client.PostAsJsonAsync("/api/v1/authentication/login", loginDto);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }

        [Fact]
        public async Task GetCurrentUser_ShouldReturnUnauthorized_WhenNotAuthenticated()
        {
            // Act
            var response = await _client.GetAsync("/api/v1/authentication/me");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        }

        [Fact]
        public async Task GetCurrentUser_ShouldReturnUserData_WhenAuthenticated()
        {
            // Arrange
            using var scope = _factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ErgoplannerDbContext>();
            var passwordService = scope.ServiceProvider.GetRequiredService<IPasswordService>();
            var organization = await dbContext.Organizations.FirstAsync();

            var user = new User
            {
                Id = Guid.NewGuid(),
                OrganizationId = organization.Id,
                Email = "authuser@test.com",
                Username = "authuser",
                PasswordHash = passwordService.HashPassword("ValidPass123!"),
                FirstName = "Auth",
                LastName = "User",
                Role = UserRole.Engineer,
                IsActive = true,
                IsVerified = true,
                Permissions = new List<string> { "drawings.read" },
                CreatedAt = DateTime.UtcNow,
                CreatedBy = "SYSTEM"
            };

            dbContext.Users.Add(user);
            await dbContext.SaveChangesAsync();

            // Login to get token
            var loginDto = new LoginDto
            {
                EmailOrUsername = "authuser@test.com",
                Password = "ValidPass123!",
                RememberMe = false
            };

            var loginResponse = await _client.PostAsJsonAsync("/api/v1/authentication/login", loginDto);
            var authResponse = await loginResponse.Content.ReadFromJsonAsync<AuthenticationResponse>();

            // Set authorization header
            _client.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authResponse!.AccessToken);

            // Act
            var response = await _client.GetAsync("/api/v1/authentication/me");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);

            var userDto = await response.Content.ReadFromJsonAsync<UserDto>();
            userDto.Should().NotBeNull();
            userDto!.Email.Should().Be(user.Email);
            userDto.FirstName.Should().Be(user.FirstName);
            userDto.LastName.Should().Be(user.LastName);
        }
    }

    // Mock email service for testing
    public class MockEmailService : IEmailService
    {
        public Task<bool> SendEmailAsync(string to, string subject, string body, bool isHtml = true, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(true);
        }

        public Task<bool> SendEmailAsync(List<string> to, string subject, string body, bool isHtml = true, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(true);
        }

        public Task<bool> SendTemplatedEmailAsync(string to, string templateName, Dictionary<string, string> templateData, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(true);
        }

        public Task<bool> SendBulkEmailAsync(List<string> recipients, string subject, string body, bool isHtml = true, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(true);
        }
    }
}