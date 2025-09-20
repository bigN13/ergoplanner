using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using Microsoft.Extensions.Logging;
using Ergoplanner.Application.Commands.Teams;
using Ergoplanner.Application.Queries.Teams;
using Ergoplanner.Application.DTOs.Teams;
using Ergoplanner.Application.Common.Models;

namespace Ergoplanner.API.Controllers
{
    /// <summary>
    /// Controller for team management operations
    /// </summary>
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public class TeamsController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ILogger<TeamsController> _logger;

        public TeamsController(IMediator mediator, ILogger<TeamsController> logger)
        {
            _mediator = mediator;
            _logger = logger;
        }

        /// <summary>
        /// Get a paginated list of teams
        /// </summary>
        /// <param name="pageNumber">Page number (default: 1)</param>
        /// <param name="pageSize">Page size (default: 10, max: 100)</param>
        /// <param name="projectId">Filter by project ID</param>
        /// <param name="searchTerm">Search term for name, description, or project</param>
        /// <param name="isActive">Filter by active status</param>
        /// <param name="orderBy">Order by field (name, project, membercount, createdat, updatedat)</param>
        /// <param name="orderByDescending">Order direction (default: true)</param>
        /// <response code="200">Teams retrieved successfully</response>
        /// <response code="400">Invalid parameters</response>
        /// <response code="401">Unauthorized</response>
        /// <response code="403">Forbidden</response>
        [HttpGet]
        [ProducesResponseType(typeof(PagedResponse<TeamSummaryDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetTeams(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] Guid? projectId = null,
            [FromQuery] string? searchTerm = null,
            [FromQuery] bool? isActive = null,
            [FromQuery] string? orderBy = null,
            [FromQuery] bool orderByDescending = true)
        {
            try
            {
                var organizationId = GetOrganizationId();
                if (organizationId == Guid.Empty)
                {
                    return Forbid();
                }

                var query = new GetTeamsQuery(organizationId)
                {
                    PageNumber = pageNumber,
                    PageSize = Math.Min(pageSize, 100),
                    ProjectId = projectId,
                    SearchTerm = searchTerm,
                    IsActive = isActive,
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
                    Title = "Failed to retrieve teams",
                    Detail = result.Error,
                    Status = StatusCodes.Status400BadRequest
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error retrieving teams");
                return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
                {
                    Title = "Internal Server Error",
                    Detail = "An unexpected error occurred",
                    Status = StatusCodes.Status500InternalServerError
                });
            }
        }

        /// <summary>
        /// Get a team by ID with members
        /// </summary>
        /// <param name="id">Team ID</param>
        /// <response code="200">Team retrieved successfully</response>
        /// <response code="404">Team not found</response>
        /// <response code="401">Unauthorized</response>
        /// <response code="403">Forbidden</response>
        [HttpGet("{id:guid}")]
        [ProducesResponseType(typeof(TeamDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetTeam(Guid id)
        {
            try
            {
                var organizationId = GetOrganizationId();
                if (organizationId == Guid.Empty)
                {
                    return Forbid();
                }

                var query = new GetTeamByIdQuery(id, organizationId);
                var result = await _mediator.Send(query);

                if (result.IsSuccess)
                {
                    return Ok(result.Value);
                }

                return result.ErrorCode switch
                {
                    "TEAM_NOT_FOUND" => NotFound(new ProblemDetails
                    {
                        Title = "Team Not Found",
                        Detail = result.Error,
                        Status = StatusCodes.Status404NotFound
                    }),
                    _ => BadRequest(new ProblemDetails
                    {
                        Title = "Failed to retrieve team",
                        Detail = result.Error,
                        Status = StatusCodes.Status400BadRequest
                    })
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error retrieving team {TeamId}", id);
                return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
                {
                    Title = "Internal Server Error",
                    Detail = "An unexpected error occurred",
                    Status = StatusCodes.Status500InternalServerError
                });
            }
        }

        /// <summary>
        /// Create a new team
        /// </summary>
        /// <param name="createTeamDto">Team creation data</param>
        /// <response code="201">Team created successfully</response>
        /// <response code="400">Invalid data or validation error</response>
        /// <response code="401">Unauthorized</response>
        /// <response code="403">Forbidden</response>
        /// <response code="409">Team name already exists</response>
        [HttpPost]
        [Authorize(Roles = "Engineer,Manager,Admin")]
        [ProducesResponseType(typeof(TeamDto), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
        public async Task<IActionResult> CreateTeam([FromBody] CreateTeamDto createTeamDto)
        {
            try
            {
                var organizationId = GetOrganizationId();
                var userId = GetUserId();

                if (organizationId == Guid.Empty || userId == Guid.Empty)
                {
                    return Forbid();
                }

                var command = new CreateTeamCommand(organizationId, userId, createTeamDto);
                var result = await _mediator.Send(command);

                if (result.IsSuccess)
                {
                    return CreatedAtAction(nameof(GetTeam), new { id = result.Value!.Id }, result.Value);
                }

                return result.ErrorCode switch
                {
                    "TEAM_NAME_EXISTS" => Conflict(new ProblemDetails
                    {
                        Title = "Team Name Exists",
                        Detail = result.Error,
                        Status = StatusCodes.Status409Conflict
                    }),
                    "PROJECT_NOT_FOUND" => BadRequest(new ProblemDetails
                    {
                        Title = "Project Not Found",
                        Detail = result.Error,
                        Status = StatusCodes.Status400BadRequest
                    }),
                    _ => BadRequest(new ProblemDetails
                    {
                        Title = "Failed to create team",
                        Detail = result.Error,
                        Status = StatusCodes.Status400BadRequest
                    })
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error creating team");
                return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
                {
                    Title = "Internal Server Error",
                    Detail = "An unexpected error occurred",
                    Status = StatusCodes.Status500InternalServerError
                });
            }
        }

        /// <summary>
        /// Add a member to a team
        /// </summary>
        /// <param name="id">Team ID</param>
        /// <param name="addMemberDto">Member data</param>
        /// <response code="201">Member added successfully</response>
        /// <response code="400">Invalid data or validation error</response>
        /// <response code="401">Unauthorized</response>
        /// <response code="403">Forbidden</response>
        /// <response code="404">Team or user not found</response>
        /// <response code="409">User already a member</response>
        [HttpPost("{id:guid}/members")]
        [Authorize(Roles = "Manager,Admin")]
        [ProducesResponseType(typeof(TeamMemberDto), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
        public async Task<IActionResult> AddTeamMember(Guid id, [FromBody] AddTeamMemberDto addMemberDto)
        {
            try
            {
                var organizationId = GetOrganizationId();
                var userId = GetUserId();

                if (organizationId == Guid.Empty || userId == Guid.Empty)
                {
                    return Forbid();
                }

                var command = new AddTeamMemberCommand(id, organizationId, userId, addMemberDto);
                var result = await _mediator.Send(command);

                if (result.IsSuccess)
                {
                    return CreatedAtAction(nameof(GetTeam), new { id }, result.Value);
                }

                return result.ErrorCode switch
                {
                    "TEAM_NOT_FOUND" => NotFound(new ProblemDetails
                    {
                        Title = "Team Not Found",
                        Detail = result.Error,
                        Status = StatusCodes.Status404NotFound
                    }),
                    "USER_NOT_FOUND" => NotFound(new ProblemDetails
                    {
                        Title = "User Not Found",
                        Detail = result.Error,
                        Status = StatusCodes.Status404NotFound
                    }),
                    "USER_ALREADY_MEMBER" => Conflict(new ProblemDetails
                    {
                        Title = "User Already Member",
                        Detail = result.Error,
                        Status = StatusCodes.Status409Conflict
                    }),
                    _ => BadRequest(new ProblemDetails
                    {
                        Title = "Failed to add team member",
                        Detail = result.Error,
                        Status = StatusCodes.Status400BadRequest
                    })
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error adding team member to team {TeamId}", id);
                return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
                {
                    Title = "Internal Server Error",
                    Detail = "An unexpected error occurred",
                    Status = StatusCodes.Status500InternalServerError
                });
            }
        }

        /// <summary>
        /// Remove a member from a team
        /// </summary>
        /// <param name="id">Team ID</param>
        /// <param name="userId">User ID to remove</param>
        /// <response code="204">Member removed successfully</response>
        /// <response code="400">Invalid request</response>
        /// <response code="401">Unauthorized</response>
        /// <response code="403">Forbidden</response>
        /// <response code="404">Team or member not found</response>
        [HttpDelete("{id:guid}/members/{userId:guid}")]
        [Authorize(Roles = "Manager,Admin")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> RemoveTeamMember(Guid id, Guid userId)
        {
            try
            {
                var organizationId = GetOrganizationId();
                var requestorUserId = GetUserId();

                if (organizationId == Guid.Empty || requestorUserId == Guid.Empty)
                {
                    return Forbid();
                }

                var command = new RemoveTeamMemberCommand(id, userId, organizationId, requestorUserId);
                var result = await _mediator.Send(command);

                if (result.IsSuccess)
                {
                    return NoContent();
                }

                return result.ErrorCode switch
                {
                    "TEAM_NOT_FOUND" => NotFound(new ProblemDetails
                    {
                        Title = "Team Not Found",
                        Detail = result.Error,
                        Status = StatusCodes.Status404NotFound
                    }),
                    "USER_NOT_MEMBER" => NotFound(new ProblemDetails
                    {
                        Title = "User Not Member",
                        Detail = result.Error,
                        Status = StatusCodes.Status404NotFound
                    }),
                    _ => BadRequest(new ProblemDetails
                    {
                        Title = "Failed to remove team member",
                        Detail = result.Error,
                        Status = StatusCodes.Status400BadRequest
                    })
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error removing team member {UserId} from team {TeamId}", userId, id);
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
}