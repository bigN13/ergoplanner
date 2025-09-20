using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Ergoplanner.Application.Common;
using Ergoplanner.Application.DTOs.Teams;
using Ergoplanner.Application.Interfaces;
using Ergoplanner.Domain.Entities;
using AutoMapper;

namespace Ergoplanner.Application.Commands.Teams
{
    /// <summary>
    /// Command to add a member to a team
    /// </summary>
    public class AddTeamMemberCommand : IRequest<Result<TeamMemberDto>>
    {
        public Guid TeamId { get; set; }
        public Guid OrganizationId { get; set; }
        public Guid RequestorUserId { get; set; }
        public AddTeamMemberDto MemberData { get; set; } = null!;

        public AddTeamMemberCommand(Guid teamId, Guid organizationId, Guid requestorUserId, AddTeamMemberDto memberData)
        {
            TeamId = teamId;
            OrganizationId = organizationId;
            RequestorUserId = requestorUserId;
            MemberData = memberData;
        }
    }

    /// <summary>
    /// Handler for adding a team member
    /// </summary>
    public class AddTeamMemberCommandHandler : IRequestHandler<AddTeamMemberCommand, Result<TeamMemberDto>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public AddTeamMemberCommandHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Result<TeamMemberDto>> Handle(AddTeamMemberCommand request, CancellationToken cancellationToken)
        {
            // Verify team exists and belongs to organization
            var team = await _context.Teams
                .Include(t => t.Project)
                .FirstOrDefaultAsync(t => t.Id == request.TeamId &&
                                          t.OrganizationId == request.OrganizationId &&
                                          t.IsActive, cancellationToken);

            if (team == null)
            {
                return Result<TeamMemberDto>.Failure("Team not found", "TEAM_NOT_FOUND");
            }

            // Verify user exists and belongs to organization
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == request.MemberData.UserId &&
                                          u.OrganizationId == request.OrganizationId &&
                                          u.IsActive, cancellationToken);

            if (user == null)
            {
                return Result<TeamMemberDto>.Failure("User not found", "USER_NOT_FOUND");
            }

            // Check if user is already a member
            var existingMember = await _context.TeamMembers
                .FirstOrDefaultAsync(tm => tm.TeamId == request.TeamId &&
                                           tm.UserId == request.MemberData.UserId, cancellationToken);

            if (existingMember != null)
            {
                return Result<TeamMemberDto>.Failure("User is already a member of this team", "USER_ALREADY_MEMBER");
            }

            // Create team member
            var teamMember = new TeamMember
            {
                TeamId = request.TeamId,
                UserId = request.MemberData.UserId,
                Role = request.MemberData.Role,
                Permissions = request.MemberData.Permissions,
                CreatedBy = request.RequestorUserId,
                UpdatedBy = request.RequestorUserId
            };

            _context.TeamMembers.Add(teamMember);
            await _context.SaveChangesAsync(cancellationToken);

            // Load the created member with user data
            var createdMember = await _context.TeamMembers
                .Include(tm => tm.User)
                .FirstAsync(tm => tm.Id == teamMember.Id, cancellationToken);

            var memberDto = _mapper.Map<TeamMemberDto>(createdMember);
            return Result<TeamMemberDto>.Success(memberDto);
        }
    }
}