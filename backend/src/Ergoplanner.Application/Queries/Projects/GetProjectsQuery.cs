using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Ergoplanner.Application.Common;
using Ergoplanner.Application.Common.Models;
using Ergoplanner.Application.DTOs.Projects;
using Ergoplanner.Application.Interfaces;
using Ergoplanner.Domain.Enums;

namespace Ergoplanner.Application.Queries.Projects
{
    /// <summary>
    /// Query to get paginated list of projects
    /// </summary>
    public class GetProjectsQuery : IRequest<Result<PagedList<ProjectSummaryDto>>>
    {
        public Guid OrganizationId { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? SearchTerm { get; set; }
        public ProjectStatus? Status { get; set; }
        public bool? IsArchived { get; set; }
        public string? OrderBy { get; set; }
        public bool OrderByDescending { get; set; } = true;
        public Guid? UserId { get; set; }  // For filtering user's projects

        public GetProjectsQuery(Guid organizationId)
        {
            OrganizationId = organizationId;
        }
    }

    /// <summary>
    /// Handler for getting paginated list of projects
    /// </summary>
    public class GetProjectsQueryHandler : IRequestHandler<GetProjectsQuery, Result<PagedList<ProjectSummaryDto>>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public GetProjectsQueryHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Result<PagedList<ProjectSummaryDto>>> Handle(GetProjectsQuery request, CancellationToken cancellationToken)
        {
            var query = _context.Projects
                .Include(p => p.Teams)
                .Include(p => p.Drawings)
                .Where(p => p.OrganizationId == request.OrganizationId && !p.IsDeleted);

            // Apply filters
            if (!string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                var searchTerm = request.SearchTerm.ToLower();
                query = query.Where(p => p.Name.ToLower().Contains(searchTerm) ||
                                         p.Code.ToLower().Contains(searchTerm) ||
                                         (p.Description != null && p.Description.ToLower().Contains(searchTerm)) ||
                                         (p.ClientName != null && p.ClientName.ToLower().Contains(searchTerm)));
            }

            if (request.Status.HasValue)
            {
                query = query.Where(p => p.Status == request.Status.Value);
            }

            if (request.IsArchived.HasValue)
            {
                query = query.Where(p => p.IsArchived == request.IsArchived.Value);
            }

            // Filter by user if specified
            if (request.UserId.HasValue)
            {
                query = query.Where(p => p.Teams.Any(t => t.Members.Any(m => m.UserId == request.UserId.Value)));
            }

            // Apply sorting
            query = request.OrderBy?.ToLower() switch
            {
                "name" => request.OrderByDescending ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name),
                "code" => request.OrderByDescending ? query.OrderByDescending(p => p.Code) : query.OrderBy(p => p.Code),
                "status" => request.OrderByDescending ? query.OrderByDescending(p => p.Status) : query.OrderBy(p => p.Status),
                "startdate" => request.OrderByDescending ? query.OrderByDescending(p => p.StartDate) : query.OrderBy(p => p.StartDate),
                "enddate" => request.OrderByDescending ? query.OrderByDescending(p => p.EndDate) : query.OrderBy(p => p.EndDate),
                "createdat" => request.OrderByDescending ? query.OrderByDescending(p => p.CreatedAt) : query.OrderBy(p => p.CreatedAt),
                _ => request.OrderByDescending ? query.OrderByDescending(p => p.UpdatedAt) : query.OrderBy(p => p.UpdatedAt)
            };

            // Project to DTO and paginate
            var projectedQuery = query.Select(p => new ProjectSummaryDto
            {
                Id = p.Id,
                Name = p.Name,
                Code = p.Code,
                Description = p.Description,
                Status = p.Status,
                StartDate = p.StartDate,
                EndDate = p.EndDate,
                ClientName = p.ClientName,
                DrawingsCount = p.Drawings.Count(d => !d.IsDeleted),
                TeamsCount = p.Teams.Count(t => t.IsActive),
                IsArchived = p.IsArchived,
                UpdatedAt = p.UpdatedAt
            });

            var pagedList = await PagedList<ProjectSummaryDto>.CreateAsync(projectedQuery, request.PageNumber, request.PageSize);

            return Result<PagedList<ProjectSummaryDto>>.Success(pagedList);
        }
    }
}