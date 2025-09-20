using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using Microsoft.Extensions.Logging;
using Ergoplanner.Application.Queries.Users;
using Ergoplanner.Application.DTOs.Users;
using Ergoplanner.Application.Common.Models;
using Ergoplanner.Domain.Enums;

namespace Ergoplanner.API.Controllers
{
    /// <summary>
    /// Controller for user management operations
    /// </summary>
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public class UsersController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ILogger<UsersController> _logger;

        public UsersController(IMediator mediator, ILogger<UsersController> logger)
        {
            _mediator = mediator;
            _logger = logger;
        }

        /// <summary>
        /// Get a paginated list of users in the organization
        /// </summary>
        /// <param name="pageNumber">Page number (default: 1)</param>
        /// <param name="pageSize">Page size (default: 10, max: 100)</param>
        /// <param name="searchTerm">Search term for email, username, name</param>
        /// <param name="role">Filter by user role</param>
        /// <param name="isActive">Filter by active status</param>
        /// <param name="isVerified">Filter by verified status</param>
        /// <param name="orderBy">Order by field (email, username, name, role, lastlogin, createdat)</param>
        /// <param name="orderByDescending">Order direction (default: false)</param>
        /// <response code="200">Users retrieved successfully</response>
        /// <response code="400">Invalid parameters</response>
        /// <response code="401">Unauthorized</response>
        /// <response code="403">Forbidden - Manager or Admin role required</response>
        [HttpGet]
        [Authorize(Roles = "Manager,Admin")]
        [ProducesResponseType(typeof(PagedResponse<UserSummaryDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetUsers(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? searchTerm = null,
            [FromQuery] UserRole? role = null,
            [FromQuery] bool? isActive = null,
            [FromQuery] bool? isVerified = null,
            [FromQuery] string? orderBy = null,
            [FromQuery] bool orderByDescending = false)
        {
            try
            {
                var organizationId = GetOrganizationId();
                if (organizationId == Guid.Empty)
                {
                    return Forbid();
                }

                var query = new GetUsersQuery(organizationId)
                {
                    PageNumber = pageNumber,
                    PageSize = Math.Min(pageSize, 100),
                    SearchTerm = searchTerm,
                    Role = role,
                    IsActive = isActive,
                    IsVerified = isVerified,
                    OrderBy = orderBy,
                    OrderByDescending = orderByDescending
                };

                var result = await _mediator.Send(query);

                if (result.IsSuccess)
                {
                    return Ok(result.Value!.ToPagedResponse());
                }

                return BadRequest(new ProblemDetails
                {
                    Title = "Failed to retrieve users",
                    Detail = result.Error,
                    Status = StatusCodes.Status400BadRequest
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error retrieving users");
                return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
                {
                    Title = "Internal Server Error",
                    Detail = "An unexpected error occurred",
                    Status = StatusCodes.Status500InternalServerError
                });
            }
        }

        /// <summary>
        /// Get current user profile with detailed information
        /// </summary>
        /// <response code="200">Profile retrieved successfully</response>
        /// <response code="401">Unauthorized</response>
        /// <response code="404">User not found</response>
        [HttpGet("me")]
        [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetMyProfile()
        {
            try
            {
                var organizationId = GetOrganizationId();
                var userId = GetUserId();

                if (organizationId == Guid.Empty || userId == Guid.Empty)
                {
                    return Forbid();
                }

                var query = new GetUserProfileQuery(userId, organizationId);
                var result = await _mediator.Send(query);

                if (result.IsSuccess)
                {
                    return Ok(result.Value);
                }

                return result.ErrorCode switch
                {
                    "USER_NOT_FOUND" => NotFound(new ProblemDetails
                    {
                        Title = "User Not Found",
                        Detail = result.Error,
                        Status = StatusCodes.Status404NotFound
                    }),
                    _ => BadRequest(new ProblemDetails
                    {
                        Title = "Failed to retrieve profile",
                        Detail = result.Error,
                        Status = StatusCodes.Status400BadRequest
                    })
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error retrieving user profile");
                return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
                {
                    Title = "Internal Server Error",
                    Detail = "An unexpected error occurred",
                    Status = StatusCodes.Status500InternalServerError
                });
            }
        }

        /// <summary>
        /// Update current user profile
        /// </summary>
        /// <param name="updateProfileDto">Profile update data</param>
        /// <response code="200">Profile updated successfully</response>
        /// <response code="400">Invalid data or validation error</response>
        /// <response code="401">Unauthorized</response>
        /// <response code="404">User not found</response>
        [HttpPut("me")]
        [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateUserProfileDto updateProfileDto)
        {
            try
            {
                var organizationId = GetOrganizationId();
                var userId = GetUserId();

                if (organizationId == Guid.Empty || userId == Guid.Empty)
                {
                    return Forbid();
                }

                var command = new UpdateUserProfileCommand(userId, organizationId, updateProfileDto);
                var result = await _mediator.Send(command);

                if (result.IsSuccess)
                {
                    return Ok(result.Value);
                }

                return result.ErrorCode switch
                {
                    "USER_NOT_FOUND" => NotFound(new ProblemDetails
                    {
                        Title = "User Not Found",
                        Detail = result.Error,
                        Status = StatusCodes.Status404NotFound
                    }),
                    _ => BadRequest(new ProblemDetails
                    {
                        Title = "Failed to update profile",
                        Detail = result.Error,
                        Status = StatusCodes.Status400BadRequest
                    })
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error updating user profile");
                return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
                {
                    Title = "Internal Server Error",
                    Detail = "An unexpected error occurred",
                    Status = StatusCodes.Status500InternalServerError
                });
            }
        }

        private Guid GetOrganizationId()
        {
            var organizationIdClaim = User.FindFirst("OrganizationId")?.Value;
            return Guid.TryParse(organizationIdClaim, out var orgId) ? orgId : Guid.Empty;
        }

        private Guid GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
        }
    }

    // Placeholder classes for missing queries/commands that would need to be implemented
    public class GetUserProfileQuery : IRequest<Result<UserProfileDto>>
    {
        public Guid UserId { get; set; }
        public Guid OrganizationId { get; set; }

        public GetUserProfileQuery(Guid userId, Guid organizationId)
        {
            UserId = userId;
            OrganizationId = organizationId;
        }
    }

    public class UpdateUserProfileCommand : IRequest<Result<UserProfileDto>>
    {
        public Guid UserId { get; set; }
        public Guid OrganizationId { get; set; }
        public UpdateUserProfileDto UpdateData { get; set; }

        public UpdateUserProfileCommand(Guid userId, Guid organizationId, UpdateUserProfileDto updateData)
        {
            UserId = userId;
            OrganizationId = organizationId;
            UpdateData = updateData;
        }
    }
}