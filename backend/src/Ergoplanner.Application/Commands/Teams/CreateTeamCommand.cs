using System;
using System.Linq;
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
    /// Command to create a new team
    /// </summary>
    public class CreateTeamCommand : IRequest<Result<TeamDto>>
    {
        public Guid OrganizationId { get; set; }
        public Guid UserId { get; set; }
        public CreateTeamDto TeamData { get; set; } = null!;

        public CreateTeamCommand(Guid organizationId, Guid userId, CreateTeamDto teamData)
        {
            OrganizationId = organizationId;
            UserId = userId;
            TeamData = teamData;
        }
    }

    /// <summary>
    /// Handler for creating a new team
    /// </summary>
    public class CreateTeamCommandHandler : IRequestHandler<CreateTeamCommand, Result<TeamDto>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public CreateTeamCommandHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Result<TeamDto>> Handle(CreateTeamCommand request, CancellationToken cancellationToken)
        {
            // Verify project exists and belongs to organization
            var project = await _context.Projects
                .FirstOrDefaultAsync(p => p.Id == request.TeamData.ProjectId &&
                                          p.OrganizationId == request.OrganizationId &&
                                          !p.IsDeleted, cancellationToken);

            if (project == null)
            {
                return Result<TeamDto>.Failure("Project not found", "PROJECT_NOT_FOUND");
            }

            // Check if team name already exists in project
            var nameExists = await _context.Teams
                .AnyAsync(t => t.ProjectId == request.TeamData.ProjectId &&
                              t.Name == request.TeamData.Name &&
                              t.IsActive, cancellationToken);

            if (nameExists)
            {
                return Result<TeamDto>.Failure("Team name already exists in this project", "TEAM_NAME_EXISTS");
            }

            // Create team
            var team = new Team
            {
                OrganizationId = request.OrganizationId,
                ProjectId = request.TeamData.ProjectId,
                Name = request.TeamData.Name,
                Description = request.TeamData.Description,
                CreatedBy = request.UserId,
                UpdatedBy = request.UserId
            };

            _context.Teams.Add(team);
            await _context.SaveChangesAsync(cancellationToken);

            // Add initial members if specified
            if (request.TeamData.InitialMemberIds?.Any() == true)
            {
                var users = await _context.Users
                    .Where(u => request.TeamData.InitialMemberIds.Contains(u.Id) &&
                               u.OrganizationId == request.OrganizationId &&
                               u.IsActive)
                    .ToListAsync(cancellationToken);

                foreach (var user in users)
                {
                    var teamMember = new TeamMember
                    {
                        TeamId = team.Id,
                        UserId = user.Id,
                        Role = "member",
                        CreatedBy = request.UserId,
                        UpdatedBy = request.UserId
                    };
                    _context.TeamMembers.Add(teamMember);
                }

                await _context.SaveChangesAsync(cancellationToken);
            }

            // Load the created team with related data
            var createdTeam = await _context.Teams
                .Include(t => t.Project)
                .Include(t => t.Members)
                .ThenInclude(m => m.User)
                .FirstAsync(t => t.Id == team.Id, cancellationToken);

            var teamDto = _mapper.Map<TeamDto>(createdTeam);
            return Result<TeamDto>.Success(teamDto);
        }
    }
}