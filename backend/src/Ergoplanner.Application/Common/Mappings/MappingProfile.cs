using AutoMapper;
using Ergoplanner.Domain.Entities;
using Ergoplanner.Application.DTOs.Projects;
using Ergoplanner.Application.DTOs.Teams;
using Ergoplanner.Application.DTOs.Organizations;
using Ergoplanner.Application.DTOs.Users;

namespace Ergoplanner.Application.Common.Mappings
{
    /// <summary>
    /// AutoMapper profile for entity to DTO mappings
    /// </summary>
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // Project mappings
            CreateMap<Project, ProjectDto>()
                .ForMember(d => d.DrawingsCount, opt => opt.Ignore())
                .ForMember(d => d.TeamsCount, opt => opt.Ignore())
                .ForMember(d => d.CreatedByName, opt => opt.Ignore())
                .ForMember(d => d.UpdatedByName, opt => opt.Ignore());

            CreateMap<Project, ProjectSummaryDto>()
                .ForMember(d => d.DrawingsCount, opt => opt.Ignore())
                .ForMember(d => d.TeamsCount, opt => opt.Ignore());

            CreateMap<CreateProjectDto, Project>()
                .ForMember(d => d.Id, opt => opt.Ignore())
                .ForMember(d => d.CreatedAt, opt => opt.Ignore())
                .ForMember(d => d.UpdatedAt, opt => opt.Ignore());

            // Team mappings
            CreateMap<Team, TeamDto>()
                .ForMember(d => d.ProjectName, opt => opt.MapFrom(s => s.Project.Name))
                .ForMember(d => d.MembersCount, opt => opt.MapFrom(s => s.Members.Count));

            CreateMap<Team, TeamSummaryDto>()
                .ForMember(d => d.ProjectName, opt => opt.MapFrom(s => s.Project.Name))
                .ForMember(d => d.MembersCount, opt => opt.MapFrom(s => s.Members.Count));

            CreateMap<TeamMember, TeamMemberDto>()
                .ForMember(d => d.Email, opt => opt.MapFrom(s => s.User.Email))
                .ForMember(d => d.Username, opt => opt.MapFrom(s => s.User.Username))
                .ForMember(d => d.FirstName, opt => opt.MapFrom(s => s.User.FirstName))
                .ForMember(d => d.LastName, opt => opt.MapFrom(s => s.User.LastName))
                .ForMember(d => d.DisplayName, opt => opt.MapFrom(s => s.User.DisplayName))
                .ForMember(d => d.AvatarUrl, opt => opt.MapFrom(s => s.User.AvatarUrl))
                .ForMember(d => d.UserRole, opt => opt.MapFrom(s => s.User.Role));

            // Organization mappings
            CreateMap<Organization, OrganizationDto>()
                .ForMember(d => d.UsersCount, opt => opt.MapFrom(s => s.Users.Count))
                .ForMember(d => d.ProjectsCount, opt => opt.MapFrom(s => s.Projects.Count))
                .ForMember(d => d.ActiveProjectsCount, opt => opt.MapFrom(s => s.Projects.Count(p => !p.IsArchived && !p.IsDeleted)));

            CreateMap<Organization, OrganizationSummaryDto>()
                .ForMember(d => d.UsersCount, opt => opt.MapFrom(s => s.Users.Count))
                .ForMember(d => d.ProjectsCount, opt => opt.MapFrom(s => s.Projects.Count(p => !p.IsDeleted)));

            CreateMap<OrganizationBranch, OrganizationBranchDto>();

            // User mappings
            CreateMap<User, UserDto>()
                .ForMember(d => d.OrganizationName, opt => opt.MapFrom(s => s.Organization.Name));

            CreateMap<User, UserSummaryDto>();

            CreateMap<User, UserProfileDto>()
                .ForMember(d => d.Organization, opt => opt.MapFrom(s => s.Organization))
                .ForMember(d => d.Teams, opt => opt.Ignore())
                .ForMember(d => d.RecentProjects, opt => opt.Ignore());

            // Nested mappings for UserProfile
            CreateMap<Organization, Users.OrganizationSummaryDto>();
            CreateMap<Team, Users.TeamSummaryDto>()
                .ForMember(d => d.ProjectName, opt => opt.MapFrom(s => s.Project.Name))
                .ForMember(d => d.Role, opt => opt.Ignore());
            CreateMap<Project, Users.ProjectSummaryDto>()
                .ForMember(d => d.LastAccessedAt, opt => opt.Ignore());
        }
    }
}