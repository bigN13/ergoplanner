using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Ergoplanner.Application.Common;
using Ergoplanner.Application.DTOs.Projects;
using Ergoplanner.Application.Interfaces;
using AutoMapper;

namespace Ergoplanner.Application.Commands.Projects
{
    /// <summary>
    /// Command to update an existing project
    /// </summary>
    public class UpdateProjectCommand : IRequest<Result<ProjectDto>>
    {
        public Guid ProjectId { get; set; }
        public Guid OrganizationId { get; set; }
        public Guid UserId { get; set; }
        public UpdateProjectDto UpdateData { get; set; } = null!;

        public UpdateProjectCommand(Guid projectId, Guid organizationId, Guid userId, UpdateProjectDto updateData)
        {
            ProjectId = projectId;
            OrganizationId = organizationId;
            UserId = userId;
            UpdateData = updateData;
        }
    }

    /// <summary>
    /// Handler for updating a project
    /// </summary>
    public class UpdateProjectCommandHandler : IRequestHandler<UpdateProjectCommand, Result<ProjectDto>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public UpdateProjectCommandHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Result<ProjectDto>> Handle(UpdateProjectCommand request, CancellationToken cancellationToken)
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

            // Check if new code conflicts with existing
            if (!string.IsNullOrEmpty(request.UpdateData.Code) && request.UpdateData.Code != project.Code)
            {
                var codeExists = await _context.Projects
                    .AnyAsync(p => p.OrganizationId == request.OrganizationId &&
                                  p.Code == request.UpdateData.Code &&
                                  p.Id != request.ProjectId &&
                                  !p.IsDeleted, cancellationToken);

                if (codeExists)
                {
                    return Result<ProjectDto>.Failure("Project code already exists", "PROJECT_CODE_EXISTS");
                }
            }

            // Update properties
            if (!string.IsNullOrEmpty(request.UpdateData.Name))
                project.Name = request.UpdateData.Name;
            if (!string.IsNullOrEmpty(request.UpdateData.Code))
                project.Code = request.UpdateData.Code;
            if (request.UpdateData.Description != null)
                project.Description = request.UpdateData.Description;
            if (request.UpdateData.ProjectType != null)
                project.ProjectType = request.UpdateData.ProjectType;
            if (request.UpdateData.Status.HasValue)
                project.Status = request.UpdateData.Status.Value;
            if (request.UpdateData.StartDate.HasValue)
                project.StartDate = request.UpdateData.StartDate;
            if (request.UpdateData.EndDate.HasValue)
                project.EndDate = request.UpdateData.EndDate;
            if (request.UpdateData.Budget.HasValue)
                project.Budget = request.UpdateData.Budget;
            if (!string.IsNullOrEmpty(request.UpdateData.Currency))
                project.Currency = request.UpdateData.Currency;
            if (request.UpdateData.ClientName != null)
                project.ClientName = request.UpdateData.ClientName;
            if (request.UpdateData.ClientContact != null)
                project.ClientContact = request.UpdateData.ClientContact;
            if (request.UpdateData.Metadata != null)
                project.Metadata = request.UpdateData.Metadata;
            if (request.UpdateData.Tags != null)
                project.Tags = request.UpdateData.Tags;
            if (request.UpdateData.IsArchived.HasValue)
                project.IsArchived = request.UpdateData.IsArchived.Value;

            project.UpdatedBy = request.UserId;
            project.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            var projectDto = _mapper.Map<ProjectDto>(project);

            // Get counts
            projectDto.DrawingsCount = await _context.Drawings
                .CountAsync(d => d.ProjectId == project.Id && !d.IsDeleted, cancellationToken);
            projectDto.TeamsCount = await _context.Teams
                .CountAsync(t => t.ProjectId == project.Id, cancellationToken);

            return Result<ProjectDto>.Success(projectDto);
        }
    }
}