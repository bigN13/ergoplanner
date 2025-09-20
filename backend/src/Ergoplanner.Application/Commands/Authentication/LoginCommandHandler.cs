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
    /// Handler for user login command
    /// </summary>
    public class LoginCommandHandler : IRequestHandler<LoginCommand, Result<AuthenticationResponse>>
    {
        private readonly IUserRepository _userRepository;
        private readonly IPasswordService _passwordService;
        private readonly ITokenService _tokenService;
        private readonly IMapper _mapper;
        private readonly ILogger<LoginCommandHandler> _logger;
        private const int MaxLoginAttempts = 5;
        private const int LockoutMinutes = 15;

        public LoginCommandHandler(
            IUserRepository userRepository,
            IPasswordService passwordService,
            ITokenService tokenService,
            IMapper mapper,
            ILogger<LoginCommandHandler> logger)
        {
            _userRepository = userRepository;
            _passwordService = passwordService;
            _tokenService = tokenService;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<Result<AuthenticationResponse>> Handle(LoginCommand request, CancellationToken cancellationToken)
        {
            try
            {
                // Find user by email or username
                var user = await _userRepository.GetByEmailOrUsernameAsync(request.EmailOrUsername, cancellationToken);

                if (user == null)
                {
                    _logger.LogWarning("Login attempt failed: User not found for {EmailOrUsername}", request.EmailOrUsername);
                    return Result<AuthenticationResponse>.Failure("Invalid credentials", "INVALID_CREDENTIALS");
                }

                // Check if user is locked out
                if (user.LockedUntil.HasValue && user.LockedUntil.Value > DateTime.UtcNow)
                {
                    var remainingTime = (user.LockedUntil.Value - DateTime.UtcNow).TotalMinutes;
                    _logger.LogWarning("Login attempt for locked user {UserId}", user.Id);
                    return Result<AuthenticationResponse>.Failure(
                        $"Account is locked. Please try again in {Math.Ceiling(remainingTime)} minutes.",
                        "ACCOUNT_LOCKED");
                }

                // Verify password
                if (!_passwordService.VerifyPassword(request.Password, user.PasswordHash))
                {
                    // Increment login attempts
                    user.LoginAttempts++;

                    if (user.LoginAttempts >= MaxLoginAttempts)
                    {
                        user.LockedUntil = DateTime.UtcNow.AddMinutes(LockoutMinutes);
                        user.LoginAttempts = 0;
                        await _userRepository.UpdateAsync(user, cancellationToken);

                        _logger.LogWarning("User {UserId} locked out after {MaxAttempts} failed login attempts",
                            user.Id, MaxLoginAttempts);

                        return Result<AuthenticationResponse>.Failure(
                            $"Account locked due to multiple failed login attempts. Please try again in {LockoutMinutes} minutes.",
                            "ACCOUNT_LOCKED");
                    }

                    await _userRepository.UpdateAsync(user, cancellationToken);

                    _logger.LogWarning("Invalid password for user {UserId}. Attempts: {Attempts}",
                        user.Id, user.LoginAttempts);

                    return Result<AuthenticationResponse>.Failure(
                        $"Invalid credentials. {MaxLoginAttempts - user.LoginAttempts} attempts remaining.",
                        "INVALID_CREDENTIALS");
                }

                // Check if user is active
                if (!user.IsActive)
                {
                    _logger.LogWarning("Login attempt for inactive user {UserId}", user.Id);
                    return Result<AuthenticationResponse>.Failure("Account is disabled", "ACCOUNT_DISABLED");
                }

                // Check if email is verified (if required)
                if (!user.IsVerified)
                {
                    _logger.LogWarning("Login attempt for unverified user {UserId}", user.Id);
                    return Result<AuthenticationResponse>.Failure(
                        "Please verify your email address before logging in",
                        "EMAIL_NOT_VERIFIED");
                }

                // Reset login attempts on successful authentication
                user.LoginAttempts = 0;
                user.LockedUntil = null;
                user.LastLoginAt = DateTime.UtcNow;
                await _userRepository.UpdateAsync(user, cancellationToken);

                // Generate tokens
                var tokenExpiry = request.RememberMe ? 30 : 1; // Days
                var refreshTokenExpiry = request.RememberMe ? 90 : 7; // Days

                var accessToken = _tokenService.GenerateAccessToken(user, tokenExpiry);
                var refreshToken = await _tokenService.GenerateRefreshTokenAsync(
                    user.Id,
                    refreshTokenExpiry,
                    cancellationToken);

                // Map user to DTO
                var userDto = _mapper.Map<UserDto>(user);

                var response = new AuthenticationResponse
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshToken.Token,
                    ExpiresIn = tokenExpiry * 24 * 3600, // Convert days to seconds
                    RefreshTokenExpires = refreshToken.ExpiresAt,
                    User = userDto
                };

                _logger.LogInformation("User {UserId} successfully logged in", user.Id);

                return Result<AuthenticationResponse>.Success(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login for {EmailOrUsername}", request.EmailOrUsername);
                return Result<AuthenticationResponse>.Failure("An error occurred during login", "LOGIN_ERROR");
            }
        }
    }
}