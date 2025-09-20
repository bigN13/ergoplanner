using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using Ergoplanner.Application.Commands.Authentication;
using Ergoplanner.Application.DTOs.Authentication;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace Ergoplanner.API.Controllers
{
    /// <summary>
    /// Controller for authentication operations
    /// </summary>
    [ApiController]
    [Route("api/v1/[controller]")]
    [Produces("application/json")]
    public class AuthenticationController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ILogger<AuthenticationController> _logger;

        public AuthenticationController(IMediator mediator, ILogger<AuthenticationController> logger)
        {
            _mediator = mediator;
            _logger = logger;
        }

        /// <summary>
        /// Authenticate user and receive JWT tokens
        /// </summary>
        /// <param name="loginDto">Login credentials</param>
        /// <returns>Authentication tokens and user information</returns>
        /// <response code="200">Successfully authenticated</response>
        /// <response code="400">Invalid request or validation error</response>
        /// <response code="401">Invalid credentials</response>
        /// <response code="423">Account locked due to multiple failed attempts</response>
        [HttpPost("login")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(AuthenticationResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status423Locked)]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            try
            {
                var command = new LoginCommand(loginDto);
                var result = await _mediator.Send(command);

                if (result.IsSuccess)
                {
                    SetRefreshTokenCookie(result.Value!.RefreshToken);
                    return Ok(result.Value);
                }

                return result.ErrorCode switch
                {
                    "ACCOUNT_LOCKED" => StatusCode(StatusCodes.Status423Locked, new ProblemDetails
                    {
                        Title = "Account Locked",
                        Detail = result.Error,
                        Status = StatusCodes.Status423Locked
                    }),
                    "INVALID_CREDENTIALS" or "EMAIL_NOT_VERIFIED" or "ACCOUNT_DISABLED" => Unauthorized(new ProblemDetails
                    {
                        Title = "Authentication Failed",
                        Detail = result.Error,
                        Status = StatusCodes.Status401Unauthorized
                    }),
                    "VALIDATION_ERROR" => BadRequest(new ValidationProblemDetails(result.ValidationErrors)
                    {
                        Title = "Validation Failed",
                        Status = StatusCodes.Status400BadRequest
                    }),
                    _ => BadRequest(new ProblemDetails
                    {
                        Title = "Login Failed",
                        Detail = result.Error,
                        Status = StatusCodes.Status400BadRequest
                    })
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during login");
                return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
                {
                    Title = "Internal Server Error",
                    Detail = "An unexpected error occurred",
                    Status = StatusCodes.Status500InternalServerError
                });
            }
        }

        /// <summary>
        /// Register a new user account
        /// </summary>
        /// <param name="registerDto">Registration information</param>
        /// <returns>Authentication tokens and user information</returns>
        /// <response code="201">Successfully registered</response>
        /// <response code="400">Invalid request or validation error</response>
        /// <response code="409">Email or username already exists</response>
        [HttpPost("register")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(AuthenticationResponse), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
        {
            try
            {
                var command = new RegisterCommand(registerDto);
                var result = await _mediator.Send(command);

                if (result.IsSuccess)
                {
                    SetRefreshTokenCookie(result.Value!.RefreshToken);
                    return CreatedAtAction(nameof(GetCurrentUser), result.Value);
                }

                return result.ErrorCode switch
                {
                    "EMAIL_EXISTS" or "USERNAME_EXISTS" => Conflict(new ProblemDetails
                    {
                        Title = "Registration Failed",
                        Detail = result.Error,
                        Status = StatusCodes.Status409Conflict
                    }),
                    "VALIDATION_ERROR" => BadRequest(new ValidationProblemDetails(result.ValidationErrors)
                    {
                        Title = "Validation Failed",
                        Status = StatusCodes.Status400BadRequest
                    }),
                    _ => BadRequest(new ProblemDetails
                    {
                        Title = "Registration Failed",
                        Detail = result.Error,
                        Status = StatusCodes.Status400BadRequest
                    })
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during registration");
                return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
                {
                    Title = "Internal Server Error",
                    Detail = "An unexpected error occurred",
                    Status = StatusCodes.Status500InternalServerError
                });
            }
        }

        /// <summary>
        /// Refresh access token using refresh token
        /// </summary>
        /// <param name="refreshTokenDto">Refresh token information</param>
        /// <returns>New authentication tokens</returns>
        /// <response code="200">Successfully refreshed tokens</response>
        /// <response code="401">Invalid or expired refresh token</response>
        [HttpPost("refresh-token")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(AuthenticationResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenDto refreshTokenDto)
        {
            try
            {
                // Try to get refresh token from cookie if not provided
                var refreshToken = refreshTokenDto.RefreshToken;
                if (string.IsNullOrEmpty(refreshToken))
                {
                    refreshToken = Request.Cookies["refreshToken"];
                }

                if (string.IsNullOrEmpty(refreshToken))
                {
                    return Unauthorized(new ProblemDetails
                    {
                        Title = "Refresh Failed",
                        Detail = "Refresh token is required",
                        Status = StatusCodes.Status401Unauthorized
                    });
                }

                var command = new RefreshTokenCommand { RefreshToken = refreshToken };
                var result = await _mediator.Send(command);

                if (result.IsSuccess)
                {
                    SetRefreshTokenCookie(result.Value!.RefreshToken);
                    return Ok(result.Value);
                }

                return Unauthorized(new ProblemDetails
                {
                    Title = "Refresh Failed",
                    Detail = result.Error,
                    Status = StatusCodes.Status401Unauthorized
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during token refresh");
                return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
                {
                    Title = "Internal Server Error",
                    Detail = "An unexpected error occurred",
                    Status = StatusCodes.Status500InternalServerError
                });
            }
        }

        /// <summary>
        /// Request password reset email
        /// </summary>
        /// <param name="requestDto">Password reset request information</param>
        /// <returns>Success message</returns>
        /// <response code="200">Password reset email sent (always returns success for security)</response>
        [HttpPost("request-password-reset")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        public async Task<IActionResult> RequestPasswordReset([FromBody] PasswordResetRequestDto requestDto)
        {
            try
            {
                var command = new RequestPasswordResetCommand { Email = requestDto.Email };
                await _mediator.Send(command);

                // Always return success to prevent email enumeration
                return Ok(new
                {
                    message = "If an account exists with this email, a password reset link has been sent."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during password reset request");
                // Still return success for security
                return Ok(new
                {
                    message = "If an account exists with this email, a password reset link has been sent."
                });
            }
        }

        /// <summary>
        /// Reset password using reset token
        /// </summary>
        /// <param name="resetDto">Password reset information</param>
        /// <returns>Success message</returns>
        /// <response code="200">Password successfully reset</response>
        /// <response code="400">Invalid or expired reset token</response>
        [HttpPost("reset-password")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ResetPassword([FromBody] PasswordResetDto resetDto)
        {
            try
            {
                var command = new ResetPasswordCommand
                {
                    Token = resetDto.Token,
                    NewPassword = resetDto.NewPassword,
                    ConfirmPassword = resetDto.ConfirmPassword
                };

                var result = await _mediator.Send(command);

                if (result.IsSuccess)
                {
                    return Ok(new { message = "Password has been successfully reset" });
                }

                return BadRequest(new ProblemDetails
                {
                    Title = "Password Reset Failed",
                    Detail = result.Error,
                    Status = StatusCodes.Status400BadRequest
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during password reset");
                return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
                {
                    Title = "Internal Server Error",
                    Detail = "An unexpected error occurred",
                    Status = StatusCodes.Status500InternalServerError
                });
            }
        }

        /// <summary>
        /// Logout and invalidate refresh token
        /// </summary>
        /// <returns>Success message</returns>
        /// <response code="200">Successfully logged out</response>
        [HttpPost("logout")]
        [Authorize]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        public async Task<IActionResult> Logout()
        {
            try
            {
                var refreshToken = Request.Cookies["refreshToken"];

                if (!string.IsNullOrEmpty(refreshToken))
                {
                    // Revoke the refresh token
                    var command = new LogoutCommand { RefreshToken = refreshToken };
                    await _mediator.Send(command);
                }

                // Clear the refresh token cookie
                Response.Cookies.Delete("refreshToken");

                return Ok(new { message = "Successfully logged out" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during logout");
                // Still clear cookie and return success
                Response.Cookies.Delete("refreshToken");
                return Ok(new { message = "Successfully logged out" });
            }
        }

        /// <summary>
        /// Get current authenticated user information
        /// </summary>
        /// <returns>Current user information</returns>
        /// <response code="200">User information retrieved</response>
        /// <response code="401">Not authenticated</response>
        [HttpGet("me")]
        [Authorize]
        [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetCurrentUser()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new ProblemDetails
                    {
                        Title = "Unauthorized",
                        Detail = "User not authenticated",
                        Status = StatusCodes.Status401Unauthorized
                    });
                }

                var query = new GetCurrentUserQuery { UserId = Guid.Parse(userId) };
                var result = await _mediator.Send(query);

                if (result.IsSuccess)
                {
                    return Ok(result.Value);
                }

                return Unauthorized(new ProblemDetails
                {
                    Title = "Unauthorized",
                    Detail = result.Error,
                    Status = StatusCodes.Status401Unauthorized
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error getting current user");
                return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
                {
                    Title = "Internal Server Error",
                    Detail = "An unexpected error occurred",
                    Status = StatusCodes.Status500InternalServerError
                });
            }
        }

        /// <summary>
        /// Verify email address using verification token
        /// </summary>
        /// <param name="token">Email verification token</param>
        /// <returns>Success message</returns>
        /// <response code="200">Email successfully verified</response>
        /// <response code="400">Invalid or expired verification token</response>
        [HttpPost("verify-email")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> VerifyEmail([FromQuery] string token)
        {
            try
            {
                var command = new VerifyEmailCommand { Token = token };
                var result = await _mediator.Send(command);

                if (result.IsSuccess)
                {
                    return Ok(new { message = "Email successfully verified" });
                }

                return BadRequest(new ProblemDetails
                {
                    Title = "Verification Failed",
                    Detail = result.Error,
                    Status = StatusCodes.Status400BadRequest
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during email verification");
                return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
                {
                    Title = "Internal Server Error",
                    Detail = "An unexpected error occurred",
                    Status = StatusCodes.Status500InternalServerError
                });
            }
        }

        /// <summary>
        /// Change password for authenticated user
        /// </summary>
        /// <param name="changePasswordDto">Password change information</param>
        /// <returns>Success message</returns>
        /// <response code="200">Password successfully changed</response>
        /// <response code="400">Invalid current password or validation error</response>
        /// <response code="401">Not authenticated</response>
        [HttpPost("change-password")]
        [Authorize]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto changePasswordDto)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new ProblemDetails
                    {
                        Title = "Unauthorized",
                        Detail = "User not authenticated",
                        Status = StatusCodes.Status401Unauthorized
                    });
                }

                var command = new ChangePasswordCommand
                {
                    UserId = Guid.Parse(userId),
                    CurrentPassword = changePasswordDto.CurrentPassword,
                    NewPassword = changePasswordDto.NewPassword,
                    ConfirmPassword = changePasswordDto.ConfirmPassword
                };

                var result = await _mediator.Send(command);

                if (result.IsSuccess)
                {
                    return Ok(new { message = "Password successfully changed" });
                }

                return BadRequest(new ProblemDetails
                {
                    Title = "Password Change Failed",
                    Detail = result.Error,
                    Status = StatusCodes.Status400BadRequest
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during password change");
                return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
                {
                    Title = "Internal Server Error",
                    Detail = "An unexpected error occurred",
                    Status = StatusCodes.Status500InternalServerError
                });
            }
        }

        private void SetRefreshTokenCookie(string refreshToken)
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddDays(7)
            };

            Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
        }
    }
}