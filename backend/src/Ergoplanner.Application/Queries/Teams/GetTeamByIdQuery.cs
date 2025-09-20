using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using Ergoplanner.Application.Common;
using Ergoplanner.Application.DTOs.Teams;
using Ergoplanner.Application.Interfaces;

namespace Ergoplanner.Application.Queries.Teams
{
    /// <summary>
    /// Query to get a team by ID with members
    /// </summary>
    public class GetTeamByIdQuery : IRequest<Result<TeamDto>>
    {
        public Guid TeamId { get; set; }
        public Guid OrganizationId { get; set; }

        public GetTeamByIdQuery(Guid teamId, Guid organizationId)
        {
            TeamId = teamId;
            OrganizationId = organizationId;
        }
    }

    /// <summary>
    /// Handler for getting a team by ID
    /// </summary>
    public class GetTeamByIdQueryHandler : IRequestHandler<GetTeamByIdQuery, Result<TeamDto>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public GetTeamByIdQueryHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Result<TeamDto>> Handle(GetTeamByIdQuery request, CancellationToken cancellationToken)
        {
            var team = await _context.Teams
                .Include(t => t.Project)
                .Include(t => t.Members)
                .ThenInclude(m => m.User)
                .FirstOrDefaultAsync(t => t.Id == request.TeamId &&
                                          t.OrganizationId == request.OrganizationId, cancellationToken);

            if (team == null)
            {
                return Result<TeamDto>.Failure("Team not found", "TEAM_NOT_FOUND");
            }

            var teamDto = _mapper.Map<TeamDto>(team);
            return Result<TeamDto>.Success(teamDto);
        }
    }
}