using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using Ergoplanner.Application.Common;
using Ergoplanner.Application.DTOs.Organizations;
using Ergoplanner.Application.Interfaces;

namespace Ergoplanner.Application.Queries.Organizations
{
    /// <summary>
    /// Query to get an organization by ID
    /// </summary>
    public class GetOrganizationByIdQuery : IRequest<Result<OrganizationDto>>
    {
        public Guid OrganizationId { get; set; }

        public GetOrganizationByIdQuery(Guid organizationId)
        {
            OrganizationId = organizationId;
        }
    }

    /// <summary>
    /// Handler for getting an organization by ID
    /// </summary>
    public class GetOrganizationByIdQueryHandler : IRequestHandler<GetOrganizationByIdQuery, Result<OrganizationDto>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public GetOrganizationByIdQueryHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Result<OrganizationDto>> Handle(GetOrganizationByIdQuery request, CancellationToken cancellationToken)
        {
            var organization = await _context.Organizations
                .Include(o => o.Users.Where(u => u.IsActive))
                .Include(o => o.Projects.Where(p => !p.IsDeleted))
                .FirstOrDefaultAsync(o => o.Id == request.OrganizationId && !o.IsDeleted, cancellationToken);

            if (organization == null)
            {
                return Result<OrganizationDto>.Failure("Organization not found", "ORGANIZATION_NOT_FOUND");
            }

            var organizationDto = _mapper.Map<OrganizationDto>(organization);

            // Calculate active projects count
            organizationDto.ActiveProjectsCount = organization.Projects.Count(p => !p.IsArchived);

            return Result<OrganizationDto>.Success(organizationDto);
        }
    }
}