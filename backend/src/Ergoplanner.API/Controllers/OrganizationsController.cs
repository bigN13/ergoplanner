using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using Microsoft.Extensions.Logging;
using Ergoplanner.Application.Commands.Organizations;
using Ergoplanner.Application.Queries.Organizations;
using Ergoplanner.Application.DTOs.Organizations;

namespace Ergoplanner.API.Controllers
{
    /// <summary>
    /// Controller for organization management operations
    /// </summary>
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public class OrganizationsController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ILogger<OrganizationsController> _logger;

        public OrganizationsController(IMediator mediator, ILogger<OrganizationsController> logger)
        {
            _mediator = mediator;
            _logger = logger;
        }

        /// <summary>
        /// Get current organization details
        /// </summary>
        /// <response code="200">Organization retrieved successfully</response>
        /// <response code="404">Organization not found</response>
        /// <response code="401">Unauthorized</response>
        /// <response code="403">Forbidden</response>
        [HttpGet("current")]
        [ProducesResponseType(typeof(OrganizationDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetCurrentOrganization()
        {
            try
            {
                var organizationId = GetOrganizationId();
                if (organizationId == Guid.Empty)
                {
                    return Forbid();
                }

                var query = new GetOrganizationByIdQuery(organizationId);
                var result = await _mediator.Send(query);

                if (result.IsSuccess)
                {
                    return Ok(result.Value);
                }

                return result.ErrorCode switch
                {
                    "ORGANIZATION_NOT_FOUND" => NotFound(new ProblemDetails
                    {
                        Title = "Organization Not Found",
                        Detail = result.Error,
                        Status = StatusCodes.Status404NotFound
                    }),
                    _ => BadRequest(new ProblemDetails
                    {
                        Title = "Failed to retrieve organization",
                        Detail = result.Error,
                        Status = StatusCodes.Status400BadRequest
                    })
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error retrieving organization");
                return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
                {
                    Title = "Internal Server Error",
                    Detail = "An unexpected error occurred",
                    Status = StatusCodes.Status500InternalServerError
                });
            }
        }

        /// <summary>
        /// Update current organization
        /// </summary>
        /// <param name="updateOrganizationDto">Organization update data</param>
        /// <response code="200">Organization updated successfully</response>
        /// <response code="400">Invalid data or validation error</response>
        /// <response code="401">Unauthorized</response>
        /// <response code="403">Forbidden - Admin role required</response>
        /// <response code="404">Organization not found</response>
        /// <response code="409">Organization code already exists</response>
        [HttpPut("current")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(OrganizationDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
        public async Task<IActionResult> UpdateOrganization([FromBody] UpdateOrganizationDto updateOrganizationDto)
        {
            try
            {
                var organizationId = GetOrganizationId();
                var userId = GetUserId();

                if (organizationId == Guid.Empty || userId == Guid.Empty)
                {
                    return Forbid();
                }

                var command = new UpdateOrganizationCommand(organizationId, userId, updateOrganizationDto);
                var result = await _mediator.Send(command);

                if (result.IsSuccess)
                {
                    return Ok(result.Value);
                }

                return result.ErrorCode switch
                {
                    "ORGANIZATION_NOT_FOUND" => NotFound(new ProblemDetails
                    {
                        Title = "Organization Not Found",
                        Detail = result.Error,
                        Status = StatusCodes.Status404NotFound
                    }),
                    "ORGANIZATION_CODE_EXISTS" => Conflict(new ProblemDetails
                    {
                        Title = "Organization Code Exists",
                        Detail = result.Error,
                        Status = StatusCodes.Status409Conflict
                    }),
                    _ => BadRequest(new ProblemDetails
                    {
                        Title = "Failed to update organization",
                        Detail = result.Error,
                        Status = StatusCodes.Status400BadRequest
                    })
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error updating organization");
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