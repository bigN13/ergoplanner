using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Ergoplanner.Application.Common;
using Ergoplanner.Application.Interfaces;

namespace Ergoplanner.Application.Commands.Teams
{
    /// <summary>
    /// Command to remove a member from a team
    /// </summary>
    public class RemoveTeamMemberCommand : IRequest<Result>
    {
        public Guid TeamId { get; set; }
        public Guid UserId { get; set; }
        public Guid OrganizationId { get; set; }
        public Guid RequestorUserId { get; set; }

        public RemoveTeamMemberCommand(Guid teamId, Guid userId, Guid organizationId, Guid requestorUserId)
        {
            TeamId = teamId;
            UserId = userId;
            OrganizationId = organizationId;
            RequestorUserId = requestorUserId;
        }
    }

    /// <summary>
    /// Handler for removing a team member
    /// </summary>
    public class RemoveTeamMemberCommandHandler : IRequestHandler<RemoveTeamMemberCommand, Result>
    {
        private readonly IApplicationDbContext _context;

        public RemoveTeamMemberCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Result> Handle(RemoveTeamMemberCommand request, CancellationToken cancellationToken)
        {
            // Verify team exists and belongs to organization
            var team = await _context.Teams
                .FirstOrDefaultAsync(t => t.Id == request.TeamId &&
                                          t.OrganizationId == request.OrganizationId &&
                                          t.IsActive, cancellationToken);

            if (team == null)
            {
                return Result.Failure("Team not found", "TEAM_NOT_FOUND");
            }

            // Find the team member
            var teamMember = await _context.TeamMembers
                .FirstOrDefaultAsync(tm => tm.TeamId == request.TeamId &&
                                           tm.UserId == request.UserId, cancellationToken);

            if (teamMember == null)
            {
                return Result.Failure("User is not a member of this team", "USER_NOT_MEMBER");
            }

            // Remove the team member
            _context.TeamMembers.Remove(teamMember);
            await _context.SaveChangesAsync(cancellationToken);

            return Result.Success();
        }
    }
}