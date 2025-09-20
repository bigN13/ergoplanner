using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using Ergoplanner.Application.Common;
using Ergoplanner.Application.Common.Models;
using Ergoplanner.Application.DTOs.Teams;
using Ergoplanner.Application.Interfaces;

namespace Ergoplanner.Application.Queries.Teams
{
    /// <summary>
    /// Query to get paginated list of teams
    /// </summary>
    public class GetTeamsQuery : IRequest<Result<PagedList<TeamSummaryDto>>>
    {
        public Guid OrganizationId { get; set; }
        public Guid? ProjectId { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? SearchTerm { get; set; }
        public bool? IsActive { get; set; }
        public string? OrderBy { get; set; }
        public bool OrderByDescending { get; set; } = true;
        public Guid? UserId { get; set; }  // For filtering user's teams

        public GetTeamsQuery(Guid organizationId)
        {
            OrganizationId = organizationId;
        }
    }

    /// <summary>
    /// Handler for getting paginated list of teams
    /// </summary>
    public class GetTeamsQueryHandler : IRequestHandler<GetTeamsQuery, Result<PagedList<TeamSummaryDto>>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public GetTeamsQueryHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Result<PagedList<TeamSummaryDto>>> Handle(GetTeamsQuery request, CancellationToken cancellationToken)
        {
            var query = _context.Teams
                .Include(t => t.Project)
                .Include(t => t.Members)
                .Where(t => t.OrganizationId == request.OrganizationId);

            // Apply filters
            if (request.ProjectId.HasValue)
            {
                query = query.Where(t => t.ProjectId == request.ProjectId.Value);
            }

            if (!string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                var searchTerm = request.SearchTerm.ToLower();
                query = query.Where(t => t.Name.ToLower().Contains(searchTerm) ||
                                         (t.Description != null && t.Description.ToLower().Contains(searchTerm)) ||
                                         t.Project.Name.ToLower().Contains(searchTerm));
            }

            if (request.IsActive.HasValue)
            {
                query = query.Where(t => t.IsActive == request.IsActive.Value);
            }

            // Filter by user if specified
            if (request.UserId.HasValue)
            {
                query = query.Where(t => t.Members.Any(m => m.UserId == request.UserId.Value));
            }

            // Apply sorting
            query = request.OrderBy?.ToLower() switch
            {
                "name" => request.OrderByDescending ? query.OrderByDescending(t => t.Name) : query.OrderBy(t => t.Name),
                "project" => request.OrderByDescending ? query.OrderByDescending(t => t.Project.Name) : query.OrderBy(t => t.Project.Name),
                "membercount" => request.OrderByDescending ? query.OrderByDescending(t => t.Members.Count) : query.OrderBy(t => t.Members.Count),
                "createdat" => request.OrderByDescending ? query.OrderByDescending(t => t.CreatedAt) : query.OrderBy(t => t.CreatedAt),
                _ => request.OrderByDescending ? query.OrderByDescending(t => t.UpdatedAt) : query.OrderBy(t => t.UpdatedAt)
            };

            // Project to DTO and paginate
            var projectedQuery = query.Select(t => new TeamSummaryDto
            {
                Id = t.Id,
                ProjectId = t.ProjectId,
                Name = t.Name,
                Description = t.Description,
                ProjectName = t.Project.Name,
                MembersCount = t.Members.Count,
                IsActive = t.IsActive,
                UpdatedAt = t.UpdatedAt
            });

            var pagedList = await PagedList<TeamSummaryDto>.CreateAsync(projectedQuery, request.PageNumber, request.PageSize);

            return Result<PagedList<TeamSummaryDto>>.Success(pagedList);
        }
    }
}