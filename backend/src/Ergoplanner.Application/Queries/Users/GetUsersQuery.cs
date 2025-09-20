using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using Ergoplanner.Application.Common;
using Ergoplanner.Application.Common.Models;
using Ergoplanner.Application.DTOs.Users;
using Ergoplanner.Application.Interfaces;
using Ergoplanner.Domain.Enums;

namespace Ergoplanner.Application.Queries.Users
{
    /// <summary>
    /// Query to get paginated list of users
    /// </summary>
    public class GetUsersQuery : IRequest<Result<PagedList<UserSummaryDto>>>
    {
        public Guid OrganizationId { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? SearchTerm { get; set; }
        public UserRole? Role { get; set; }
        public bool? IsActive { get; set; }
        public bool? IsVerified { get; set; }
        public string? OrderBy { get; set; }
        public bool OrderByDescending { get; set; } = false;

        public GetUsersQuery(Guid organizationId)
        {
            OrganizationId = organizationId;
        }
    }

    /// <summary>
    /// Handler for getting paginated list of users
    /// </summary>
    public class GetUsersQueryHandler : IRequestHandler<GetUsersQuery, Result<PagedList<UserSummaryDto>>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public GetUsersQueryHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Result<PagedList<UserSummaryDto>>> Handle(GetUsersQuery request, CancellationToken cancellationToken)
        {
            var query = _context.Users
                .Where(u => u.OrganizationId == request.OrganizationId);

            // Apply filters
            if (!string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                var searchTerm = request.SearchTerm.ToLower();
                query = query.Where(u => u.Email.ToLower().Contains(searchTerm) ||
                                         u.Username.ToLower().Contains(searchTerm) ||
                                         (u.FirstName != null && u.FirstName.ToLower().Contains(searchTerm)) ||
                                         (u.LastName != null && u.LastName.ToLower().Contains(searchTerm)) ||
                                         (u.DisplayName != null && u.DisplayName.ToLower().Contains(searchTerm)));
            }

            if (request.Role.HasValue)
            {
                query = query.Where(u => u.Role == request.Role.Value);
            }

            if (request.IsActive.HasValue)
            {
                query = query.Where(u => u.IsActive == request.IsActive.Value);
            }

            if (request.IsVerified.HasValue)
            {
                query = query.Where(u => u.IsVerified == request.IsVerified.Value);
            }

            // Apply sorting
            query = request.OrderBy?.ToLower() switch
            {
                "email" => request.OrderByDescending ? query.OrderByDescending(u => u.Email) : query.OrderBy(u => u.Email),
                "username" => request.OrderByDescending ? query.OrderByDescending(u => u.Username) : query.OrderBy(u => u.Username),
                "name" => request.OrderByDescending ? query.OrderByDescending(u => u.DisplayName ?? u.FirstName + " " + u.LastName) : query.OrderBy(u => u.DisplayName ?? u.FirstName + " " + u.LastName),
                "role" => request.OrderByDescending ? query.OrderByDescending(u => u.Role) : query.OrderBy(u => u.Role),
                "lastlogin" => request.OrderByDescending ? query.OrderByDescending(u => u.LastLoginAt) : query.OrderBy(u => u.LastLoginAt),
                "createdat" => request.OrderByDescending ? query.OrderByDescending(u => u.CreatedAt) : query.OrderBy(u => u.CreatedAt),
                _ => request.OrderByDescending ? query.OrderByDescending(u => u.CreatedAt) : query.OrderBy(u => u.CreatedAt)
            };

            // Project to DTO and paginate
            var projectedQuery = query.Select(u => new UserSummaryDto
            {
                Id = u.Id,
                Email = u.Email,
                Username = u.Username,
                DisplayName = u.DisplayName,
                AvatarUrl = u.AvatarUrl,
                Role = u.Role,
                IsActive = u.IsActive,
                IsVerified = u.IsVerified,
                LastLoginAt = u.LastLoginAt
            });

            var pagedList = await PagedList<UserSummaryDto>.CreateAsync(projectedQuery, request.PageNumber, request.PageSize);

            return Result<PagedList<UserSummaryDto>>.Success(pagedList);
        }
    }
}