using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Ergoplanner.Application.Common;
using Ergoplanner.Application.DTOs.Projects;
using Ergoplanner.Application.Interfaces;
using Ergoplanner.Domain.Entities;
using AutoMapper;

namespace Ergoplanner.Application.Commands.Projects
{
    /// <summary>
    /// Command to create a new project
    /// </summary>
    public class CreateProjectCommand : IRequest<Result<ProjectDto>>
    {
        public Guid OrganizationId { get; set; }
        public Guid UserId { get; set; }
        public CreateProjectDto ProjectData { get; set; } = null!;

        public CreateProjectCommand(Guid organizationId, Guid userId, CreateProjectDto projectData)
        {
            OrganizationId = organizationId;
            UserId = userId;
            ProjectData = projectData;
        }
    }

    /// <summary>
    /// Handler for creating a new project
    /// </summary>
    public class CreateProjectCommandHandler : IRequestHandler<CreateProjectCommand, Result<ProjectDto>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public CreateProjectCommandHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Result<ProjectDto>> Handle(CreateProjectCommand request, CancellationToken cancellationToken)
        {
            // Check if organization exists
            var organizationExists = await _context.Organizations
                .AnyAsync(o => o.Id == request.OrganizationId && !o.IsDeleted, cancellationToken);

            if (!organizationExists)
            {
                return Result<ProjectDto>.Failure("Organization not found", "ORGANIZATION_NOT_FOUND");
            }

            // Check if project code already exists
            var codeExists = await _context.Projects
                .AnyAsync(p => p.OrganizationId == request.OrganizationId &&
                              p.Code == request.ProjectData.Code &&
                              !p.IsDeleted, cancellationToken);

            if (codeExists)
            {
                return Result<ProjectDto>.Failure("Project code already exists", "PROJECT_CODE_EXISTS");
            }

            // Check project limit
            var projectCount = await _context.Projects
                .CountAsync(p => p.OrganizationId == request.OrganizationId && !p.IsDeleted, cancellationToken);

            var organization = await _context.Organizations
                .FirstAsync(o => o.Id == request.OrganizationId, cancellationToken);

            if (projectCount >= organization.MaxProjects)
            {
                return Result<ProjectDto>.Failure($"Project limit reached. Maximum projects: {organization.MaxProjects}", "PROJECT_LIMIT_REACHED");
            }

            // Create project
            var project = new Project
            {
                OrganizationId = request.OrganizationId,
                Name = request.ProjectData.Name,
                Code = request.ProjectData.Code,
                Description = request.ProjectData.Description,
                ProjectType = request.ProjectData.ProjectType,
                Status = request.ProjectData.Status,
                StartDate = request.ProjectData.StartDate,
                EndDate = request.ProjectData.EndDate,
                Budget = request.ProjectData.Budget,
                Currency = request.ProjectData.Currency,
                ClientName = request.ProjectData.ClientName,
                ClientContact = request.ProjectData.ClientContact,
                Metadata = request.ProjectData.Metadata,
                Tags = request.ProjectData.Tags,
                CreatedBy = request.UserId,
                UpdatedBy = request.UserId
            };

            _context.Projects.Add(project);
            await _context.SaveChangesAsync(cancellationToken);

            var projectDto = _mapper.Map<ProjectDto>(project);
            return Result<ProjectDto>.Success(projectDto);
        }
    }
}