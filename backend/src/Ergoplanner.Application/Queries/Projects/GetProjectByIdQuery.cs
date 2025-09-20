using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using Ergoplanner.Application.Common;
using Ergoplanner.Application.DTOs.Projects;
using Ergoplanner.Application.Interfaces;

namespace Ergoplanner.Application.Queries.Projects
{
    /// <summary>
    /// Query to get a project by ID
    /// </summary>
    public class GetProjectByIdQuery : IRequest<Result<ProjectDto>>
    {
        public Guid ProjectId { get; set; }
        public Guid OrganizationId { get; set; }

        public GetProjectByIdQuery(Guid projectId, Guid organizationId)
        {
            ProjectId = projectId;
            OrganizationId = organizationId;
        }
    }

    /// <summary>
    /// Handler for getting a project by ID
    /// </summary>
    public class GetProjectByIdQueryHandler : IRequestHandler<GetProjectByIdQuery, Result<ProjectDto>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public GetProjectByIdQueryHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Result<ProjectDto>> Handle(GetProjectByIdQuery request, CancellationToken cancellationToken)
        {
            var project = await _context.Projects
                .Include(p => p.CreatedByUser)
                .Include(p => p.UpdatedByUser)
                .FirstOrDefaultAsync(p => p.Id == request.ProjectId &&
                                          p.OrganizationId == request.OrganizationId &&
                                          !p.IsDeleted, cancellationToken);

            if (project == null)
            {
                return Result<ProjectDto>.Failure("Project not found", "PROJECT_NOT_FOUND");
            }

            var projectDto = _mapper.Map<ProjectDto>(project);

            // Get additional counts
            projectDto.DrawingsCount = await _context.Drawings
                .CountAsync(d => d.ProjectId == project.Id && !d.IsDeleted, cancellationToken);

            projectDto.TeamsCount = await _context.Teams
                .CountAsync(t => t.ProjectId == project.Id && t.IsActive, cancellationToken);

            // Map user names
            if (project.CreatedByUser != null)
            {
                projectDto.CreatedByName = project.CreatedByUser.DisplayName ?? project.CreatedByUser.FullName;
            }

            if (project.UpdatedByUser != null)
            {
                projectDto.UpdatedByName = project.UpdatedByUser.DisplayName ?? project.UpdatedByUser.FullName;
            }

            return Result<ProjectDto>.Success(projectDto);
        }
    }
}