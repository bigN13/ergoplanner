using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using Microsoft.Extensions.Logging;
using Ergoplanner.Application.Commands.Projects;
using Ergoplanner.Application.Queries.Projects;
using Ergoplanner.Application.DTOs.Projects;
using Ergoplanner.Application.Common.Models;
using Ergoplanner.Domain.Enums;

namespace Ergoplanner.API.Controllers
{
    /// <summary>
    /// Controller for project management operations
    /// </summary>
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public class ProjectsController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ILogger<ProjectsController> _logger;

        public ProjectsController(IMediator mediator, ILogger<ProjectsController> logger)
        {
            _mediator = mediator;
            _logger = logger;
        }

        /// <summary>
        /// Get a paginated list of projects
        /// </summary>
        /// <param name="pageNumber">Page number (default: 1)</param>
        /// <param name="pageSize">Page size (default: 10, max: 100)</param>
        /// <param name="searchTerm">Search term for name, code, description, or client</param>
        /// <param name="status">Filter by project status</param>
        /// <param name="isArchived">Filter by archived status</param>
        /// <param name="orderBy">Order by field (name, code, status, startdate, enddate, createdat, updatedat)</param>
        /// <param name="orderByDescending">Order direction (default: true)</param>
        /// <response code="200">Projects retrieved successfully</response>
        /// <response code="400">Invalid parameters</response>
        /// <response code="401">Unauthorized</response>
        /// <response code="403">Forbidden</response>
        [HttpGet]
        [ProducesResponseType(typeof(PagedResponse<ProjectSummaryDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetProjects(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? searchTerm = null,
            [FromQuery] ProjectStatus? status = null,
            [FromQuery] bool? isArchived = null,
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

                var query = new GetProjectsQuery(organizationId)
                {
                    PageNumber = pageNumber,
                    PageSize = Math.Min(pageSize, 100), // Cap at 100
                    SearchTerm = searchTerm,
                    Status = status,
                    IsArchived = isArchived,
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
                    Title = "Failed to retrieve projects",
                    Detail = result.Error,
                    Status = StatusCodes.Status400BadRequest
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error retrieving projects");
                return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
                {
                    Title = "Internal Server Error",
                    Detail = "An unexpected error occurred",
                    Status = StatusCodes.Status500InternalServerError
                });
            }
        }

        /// <summary>
        /// Get a project by ID
        /// </summary>
        /// <param name="id">Project ID</param>
        /// <response code="200">Project retrieved successfully</response>
        /// <response code="404">Project not found</response>
        /// <response code="401">Unauthorized</response>
        /// <response code="403">Forbidden</response>
        [HttpGet("{id:guid}")]
        [ProducesResponseType(typeof(ProjectDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetProject(Guid id)
        {
            try
            {
                var organizationId = GetOrganizationId();
                if (organizationId == Guid.Empty)
                {
                    return Forbid();
                }

                var query = new GetProjectByIdQuery(id, organizationId);
                var result = await _mediator.Send(query);

                if (result.IsSuccess)
                {
                    return Ok(result.Value);
                }

                return result.ErrorCode switch
                {
                    "PROJECT_NOT_FOUND" => NotFound(new ProblemDetails
                    {
                        Title = "Project Not Found",
                        Detail = result.Error,
                        Status = StatusCodes.Status404NotFound
                    }),
                    _ => BadRequest(new ProblemDetails
                    {
                        Title = "Failed to retrieve project",
                        Detail = result.Error,
                        Status = StatusCodes.Status400BadRequest
                    })
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error retrieving project {ProjectId}", id);
                return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
                {
                    Title = "Internal Server Error",
                    Detail = "An unexpected error occurred",
                    Status = StatusCodes.Status500InternalServerError
                });
            }
        }

        /// <summary>
        /// Create a new project
        /// </summary>
        /// <param name="createProjectDto">Project creation data</param>
        /// <response code="201">Project created successfully</response>
        /// <response code="400">Invalid data or validation error</response>
        /// <response code="401">Unauthorized</response>
        /// <response code="403">Forbidden</response>
        /// <response code="409">Project code already exists</response>
        [HttpPost]
        [Authorize(Roles = "Engineer,Manager,Admin")]
        [ProducesResponseType(typeof(ProjectDto), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
        public async Task<IActionResult> CreateProject([FromBody] CreateProjectDto createProjectDto)
        {
            try
            {
                var organizationId = GetOrganizationId();
                var userId = GetUserId();

                if (organizationId == Guid.Empty || userId == Guid.Empty)
                {
                    return Forbid();
                }

                var command = new CreateProjectCommand(organizationId, userId, createProjectDto);
                var result = await _mediator.Send(command);

                if (result.IsSuccess)
                {
                    return CreatedAtAction(nameof(GetProject), new { id = result.Value!.Id }, result.Value);
                }

                return result.ErrorCode switch
                {
                    "PROJECT_CODE_EXISTS" => Conflict(new ProblemDetails
                    {
                        Title = "Project Code Exists",
                        Detail = result.Error,
                        Status = StatusCodes.Status409Conflict
                    }),
                    "PROJECT_LIMIT_REACHED" => BadRequest(new ProblemDetails
                    {
                        Title = "Project Limit Reached",
                        Detail = result.Error,
                        Status = StatusCodes.Status400BadRequest
                    }),
                    "ORGANIZATION_NOT_FOUND" => BadRequest(new ProblemDetails
                    {
                        Title = "Organization Not Found",
                        Detail = result.Error,
                        Status = StatusCodes.Status400BadRequest
                    }),
                    _ => BadRequest(new ProblemDetails
                    {
                        Title = "Failed to create project",
                        Detail = result.Error,
                        Status = StatusCodes.Status400BadRequest
                    })
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error creating project");
                return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
                {
                    Title = "Internal Server Error",
                    Detail = "An unexpected error occurred",
                    Status = StatusCodes.Status500InternalServerError
                });
            }
        }

        /// <summary>
        /// Update an existing project
        /// </summary>
        /// <param name="id">Project ID</param>
        /// <param name="updateProjectDto">Project update data</param>
        /// <response code="200">Project updated successfully</response>
        /// <response code="400">Invalid data or validation error</response>
        /// <response code="401">Unauthorized</response>
        /// <response code="403">Forbidden</response>
        /// <response code="404">Project not found</response>
        /// <response code="409">Project code already exists</response>
        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Engineer,Manager,Admin")]
        [ProducesResponseType(typeof(ProjectDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
        public async Task<IActionResult> UpdateProject(Guid id, [FromBody] UpdateProjectDto updateProjectDto)
        {
            try
            {
                var organizationId = GetOrganizationId();
                var userId = GetUserId();

                if (organizationId == Guid.Empty || userId == Guid.Empty)
                {
                    return Forbid();
                }

                var command = new UpdateProjectCommand(id, organizationId, userId, updateProjectDto);
                var result = await _mediator.Send(command);

                if (result.IsSuccess)
                {
                    return Ok(result.Value);
                }

                return result.ErrorCode switch
                {
                    "PROJECT_NOT_FOUND" => NotFound(new ProblemDetails
                    {
                        Title = "Project Not Found",
                        Detail = result.Error,
                        Status = StatusCodes.Status404NotFound
                    }),
                    "PROJECT_CODE_EXISTS" => Conflict(new ProblemDetails
                    {
                        Title = "Project Code Exists",
                        Detail = result.Error,
                        Status = StatusCodes.Status409Conflict
                    }),
                    _ => BadRequest(new ProblemDetails
                    {
                        Title = "Failed to update project",
                        Detail = result.Error,
                        Status = StatusCodes.Status400BadRequest
                    })
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error updating project {ProjectId}", id);
                return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
                {
                    Title = "Internal Server Error",
                    Detail = "An unexpected error occurred",
                    Status = StatusCodes.Status500InternalServerError
                });
            }
        }

        /// <summary>
        /// Delete a project (soft delete)
        /// </summary>
        /// <param name="id">Project ID</param>
        /// <response code="204">Project deleted successfully</response>
        /// <response code="400">Cannot delete project with drawings</response>
        /// <response code="401">Unauthorized</response>
        /// <response code="403">Forbidden</response>
        /// <response code="404">Project not found</response>
        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Manager,Admin")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteProject(Guid id)
        {
            try
            {
                var organizationId = GetOrganizationId();
                var userId = GetUserId();

                if (organizationId == Guid.Empty || userId == Guid.Empty)
                {
                    return Forbid();
                }

                var command = new DeleteProjectCommand(id, organizationId, userId);
                var result = await _mediator.Send(command);

                if (result.IsSuccess)
                {
                    return NoContent();
                }

                return result.ErrorCode switch
                {
                    "PROJECT_NOT_FOUND" => NotFound(new ProblemDetails
                    {
                        Title = "Project Not Found",
                        Detail = result.Error,
                        Status = StatusCodes.Status404NotFound
                    }),
                    "PROJECT_HAS_DRAWINGS" => BadRequest(new ProblemDetails
                    {
                        Title = "Cannot Delete Project",
                        Detail = result.Error,
                        Status = StatusCodes.Status400BadRequest
                    }),
                    _ => BadRequest(new ProblemDetails
                    {
                        Title = "Failed to delete project",
                        Detail = result.Error,
                        Status = StatusCodes.Status400BadRequest
                    })
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error deleting project {ProjectId}", id);
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