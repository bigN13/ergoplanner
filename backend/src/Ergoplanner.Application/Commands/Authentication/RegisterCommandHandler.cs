using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.Extensions.Logging;
using Ergoplanner.Application.Common;
using Ergoplanner.Application.DTOs.Authentication;
using Ergoplanner.Application.Interfaces;
using Ergoplanner.Domain.Entities;
using AutoMapper;

namespace Ergoplanner.Application.Commands.Authentication
{
    /// <summary>
    /// Handler for user registration command
    /// </summary>
    public class RegisterCommandHandler : IRequestHandler<RegisterCommand, Result<AuthenticationResponse>>
    {
        private readonly IUserRepository _userRepository;
        private readonly IPasswordService _passwordService;
        private readonly ITokenService _tokenService;
        private readonly IEmailService _emailService;
        private readonly IMapper _mapper;
        private readonly ILogger<RegisterCommandHandler> _logger;

        public RegisterCommandHandler(
            IUserRepository userRepository,
            IPasswordService passwordService,
            ITokenService tokenService,
            IEmailService emailService,
            IMapper mapper,
            ILogger<RegisterCommandHandler> logger)
        {
            _userRepository = userRepository;
            _passwordService = passwordService;
            _tokenService = tokenService;
            _emailService = emailService;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<Result<AuthenticationResponse>> Handle(RegisterCommand request, CancellationToken cancellationToken)
        {
            try
            {
                // Check if user already exists
                var existingUserByEmail = await _userRepository.GetByEmailAsync(request.Email, cancellationToken);
                if (existingUserByEmail != null)
                {
                    _logger.LogWarning("Registration attempt with existing email: {Email}", request.Email);
                    return Result<AuthenticationResponse>.Failure("Email already registered", "EMAIL_EXISTS");
                }

                var existingUserByUsername = await _userRepository.GetByUsernameAsync(request.Username, cancellationToken);
                if (existingUserByUsername != null)
                {
                    _logger.LogWarning("Registration attempt with existing username: {Username}", request.Username);
                    return Result<AuthenticationResponse>.Failure("Username already taken", "USERNAME_EXISTS");
                }

                // Create new user
                var user = new User
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = request.OrganizationId,
                    Email = request.Email.ToLowerInvariant(),
                    Username = request.Username,
                    PasswordHash = _passwordService.HashPassword(request.Password),
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    DisplayName = request.DisplayName ?? $"{request.FirstName} {request.LastName}".Trim(),
                    Role = request.Role,
                    IsActive = true,
                    IsVerified = false, // Email verification required
                    VerificationToken = GenerateVerificationToken(),
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "SYSTEM"
                };

                // Set default permissions based on role
                user.Permissions = GetDefaultPermissionsForRole(user.Role);

                // Save user to database
                await _userRepository.AddAsync(user, cancellationToken);

                // Send verification email
                await SendVerificationEmailAsync(user, cancellationToken);

                // Generate tokens (for immediate login if desired)
                var accessToken = _tokenService.GenerateAccessToken(user, 1); // 1 day expiry
                var refreshToken = await _tokenService.GenerateRefreshTokenAsync(
                    user.Id,
                    7, // 7 days expiry
                    cancellationToken);

                // Map user to DTO
                var userDto = _mapper.Map<UserDto>(user);

                var response = new AuthenticationResponse
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshToken.Token,
                    ExpiresIn = 24 * 3600, // 1 day in seconds
                    RefreshTokenExpires = refreshToken.ExpiresAt,
                    User = userDto
                };

                _logger.LogInformation("User {UserId} successfully registered with email {Email}",
                    user.Id, user.Email);

                return Result<AuthenticationResponse>.Success(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during registration for email {Email}", request.Email);
                return Result<AuthenticationResponse>.Failure("An error occurred during registration", "REGISTRATION_ERROR");
            }
        }

        private List<string> GetDefaultPermissionsForRole(Domain.Enums.UserRole role)
        {
            var permissions = new List<string>();

            switch (role)
            {
                case Domain.Enums.UserRole.Admin:
                    permissions.AddRange(new[]
                    {
                        "users.read", "users.write", "users.delete",
                        "projects.read", "projects.write", "projects.delete",
                        "drawings.read", "drawings.write", "drawings.delete", "drawings.approve",
                        "boq.read", "boq.write", "boq.export",
                        "symbols.read", "symbols.write", "symbols.delete",
                        "workflows.read", "workflows.write", "workflows.approve",
                        "reports.read", "reports.generate",
                        "settings.read", "settings.write"
                    });
                    break;

                case Domain.Enums.UserRole.Manager:
                    permissions.AddRange(new[]
                    {
                        "projects.read", "projects.write",
                        "drawings.read", "drawings.write", "drawings.approve",
                        "boq.read", "boq.write", "boq.export",
                        "symbols.read", "symbols.write",
                        "workflows.read", "workflows.write", "workflows.approve",
                        "reports.read", "reports.generate"
                    });
                    break;

                case Domain.Enums.UserRole.Engineer:
                    permissions.AddRange(new[]
                    {
                        "projects.read",
                        "drawings.read", "drawings.write",
                        "boq.read", "boq.write",
                        "symbols.read",
                        "workflows.read", "workflows.write",
                        "reports.read"
                    });
                    break;

                case Domain.Enums.UserRole.Viewer:
                    permissions.AddRange(new[]
                    {
                        "projects.read",
                        "drawings.read",
                        "boq.read",
                        "symbols.read",
                        "workflows.read",
                        "reports.read"
                    });
                    break;
            }

            return permissions;
        }

        private string GenerateVerificationToken()
        {
            // Generate a secure random token
            var bytes = new byte[32];
            using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
            {
                rng.GetBytes(bytes);
            }
            return Convert.ToBase64String(bytes).Replace("+", "-").Replace("/", "_").TrimEnd('=');
        }

        private async Task SendVerificationEmailAsync(User user, CancellationToken cancellationToken)
        {
            var verificationUrl = $"https://ergoplanner.ai/verify-email?token={user.VerificationToken}";

            var emailContent = $@"
                <h2>Welcome to Ergoplanner AI Suite!</h2>
                <p>Hello {user.FirstName},</p>
                <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
                <p><a href='{verificationUrl}' style='display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;'>Verify Email</a></p>
                <p>Or copy and paste this URL into your browser:</p>
                <p>{verificationUrl}</p>
                <p>This link will expire in 24 hours.</p>
                <p>Best regards,<br>The Ergoplanner Team</p>
            ";

            await _emailService.SendEmailAsync(
                user.Email,
                "Verify your Ergoplanner account",
                emailContent,
                true,
                cancellationToken);
        }
    }
}