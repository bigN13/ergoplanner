using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Ergoplanner.Application.Common;
using Ergoplanner.Application.DTOs.Organizations;
using Ergoplanner.Application.Interfaces;
using AutoMapper;

namespace Ergoplanner.Application.Commands.Organizations
{
    /// <summary>
    /// Command to update an organization
    /// </summary>
    public class UpdateOrganizationCommand : IRequest<Result<OrganizationDto>>
    {
        public Guid OrganizationId { get; set; }
        public Guid UserId { get; set; }
        public UpdateOrganizationDto UpdateData { get; set; } = null!;

        public UpdateOrganizationCommand(Guid organizationId, Guid userId, UpdateOrganizationDto updateData)
        {
            OrganizationId = organizationId;
            UserId = userId;
            UpdateData = updateData;
        }
    }

    /// <summary>
    /// Handler for updating an organization
    /// </summary>
    public class UpdateOrganizationCommandHandler : IRequestHandler<UpdateOrganizationCommand, Result<OrganizationDto>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;

        public UpdateOrganizationCommandHandler(IApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Result<OrganizationDto>> Handle(UpdateOrganizationCommand request, CancellationToken cancellationToken)
        {
            var organization = await _context.Organizations
                .Include(o => o.Users.Where(u => u.IsActive))
                .Include(o => o.Projects.Where(p => !p.IsDeleted))
                .FirstOrDefaultAsync(o => o.Id == request.OrganizationId && !o.IsDeleted, cancellationToken);

            if (organization == null)
            {
                return Result<OrganizationDto>.Failure("Organization not found", "ORGANIZATION_NOT_FOUND");
            }

            // Check if new code conflicts with existing (if changed)
            if (!string.IsNullOrEmpty(request.UpdateData.Code) && request.UpdateData.Code != organization.Code)
            {
                var codeExists = await _context.Organizations
                    .AnyAsync(o => o.Code == request.UpdateData.Code &&
                                  o.Id != request.OrganizationId &&
                                  !o.IsDeleted, cancellationToken);

                if (codeExists)
                {
                    return Result<OrganizationDto>.Failure("Organization code already exists", "ORGANIZATION_CODE_EXISTS");
                }
            }

            // Update properties
            if (!string.IsNullOrEmpty(request.UpdateData.Name))
                organization.Name = request.UpdateData.Name;
            if (!string.IsNullOrEmpty(request.UpdateData.Code))
                organization.Code = request.UpdateData.Code;
            if (request.UpdateData.Description != null)
                organization.Description = request.UpdateData.Description;
            if (request.UpdateData.Industry != null)
                organization.Industry = request.UpdateData.Industry;
            if (request.UpdateData.Website != null)
                organization.Website = request.UpdateData.Website;
            if (request.UpdateData.Email != null)
                organization.Email = request.UpdateData.Email;
            if (request.UpdateData.Phone != null)
                organization.Phone = request.UpdateData.Phone;
            if (request.UpdateData.Address != null)
                organization.Address = request.UpdateData.Address;
            if (request.UpdateData.TaxId != null)
                organization.TaxId = request.UpdateData.TaxId;
            if (request.UpdateData.RegistrationNumber != null)
                organization.RegistrationNumber = request.UpdateData.RegistrationNumber;
            if (request.UpdateData.MaxUsers.HasValue)
                organization.MaxUsers = request.UpdateData.MaxUsers.Value;
            if (request.UpdateData.MaxProjects.HasValue)
                organization.MaxProjects = request.UpdateData.MaxProjects.Value;
            if (request.UpdateData.Settings != null)
                organization.Settings = request.UpdateData.Settings;
            if (request.UpdateData.Features != null)
                organization.Features = request.UpdateData.Features;
            if (request.UpdateData.IsActive.HasValue)
                organization.IsActive = request.UpdateData.IsActive.Value;

            organization.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);

            var organizationDto = _mapper.Map<OrganizationDto>(organization);
            organizationDto.ActiveProjectsCount = organization.Projects.Count(p => !p.IsArchived);

            return Result<OrganizationDto>.Success(organizationDto);
        }
    }
}