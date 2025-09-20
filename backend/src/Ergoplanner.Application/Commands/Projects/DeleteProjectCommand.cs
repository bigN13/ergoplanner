using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Ergoplanner.Application.Common;
using Ergoplanner.Application.Interfaces;

namespace Ergoplanner.Application.Commands.Projects
{
    /// <summary>
    /// Command to delete a project (soft delete)
    /// </summary>
    public class DeleteProjectCommand : IRequest<Result>
    {
        public Guid ProjectId { get; set; }
        public Guid OrganizationId { get; set; }
        public Guid UserId { get; set; }

        public DeleteProjectCommand(Guid projectId, Guid organizationId, Guid userId)
        {
            ProjectId = projectId;
            OrganizationId = organizationId;
            UserId = userId;
        }
    }

    /// <summary>
    /// Handler for deleting a project
    /// </summary>
    public class DeleteProjectCommandHandler : IRequestHandler<DeleteProjectCommand, Result>
    {
        private readonly IApplicationDbContext _context;

        public DeleteProjectCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Result> Handle(DeleteProjectCommand request, CancellationToken cancellationToken)
        {
            var project = await _context.Projects
                .FirstOrDefaultAsync(p => p.Id == request.ProjectId &&
                                          p.OrganizationId == request.OrganizationId &&
                                          !p.IsDeleted, cancellationToken);

            if (project == null)
            {
                return Result.Failure("Project not found", "PROJECT_NOT_FOUND");
            }

            // Check if project has active drawings
            var hasActiveDrawings = await _context.Drawings
                .AnyAsync(d => d.ProjectId == request.ProjectId && !d.IsDeleted, cancellationToken);

            if (hasActiveDrawings)
            {
                return Result.Failure("Cannot delete project with active drawings. Archive the project instead.", "PROJECT_HAS_DRAWINGS");
            }

            // Soft delete the project
            project.IsDeleted = true;
            project.DeletedAt = DateTime.UtcNow;
            project.DeletedBy = request.UserId;
            project.UpdatedBy = request.UserId;
            project.UpdatedAt = DateTime.UtcNow;

            // Also deactivate related teams
            var teams = await _context.Teams
                .Where(t => t.ProjectId == request.ProjectId)
                .ToListAsync(cancellationToken);

            foreach (var team in teams)
            {
                team.IsActive = false;
                team.UpdatedAt = DateTime.UtcNow;
                team.UpdatedBy = request.UserId;
            }

            await _context.SaveChangesAsync(cancellationToken);

            return Result.Success();
        }
    }
}