using FluentValidation;
using Ergoplanner.Application.DTOs.Teams;

namespace Ergoplanner.Application.Validators.Teams
{
    /// <summary>
    /// Validator for AddTeamMemberDto
    /// </summary>
    public class AddTeamMemberDtoValidator : AbstractValidator<AddTeamMemberDto>
    {
        public AddTeamMemberDtoValidator()
        {
            RuleFor(x => x.UserId)
                .NotEmpty().WithMessage("User ID is required.");

            RuleFor(x => x.Role)
                .NotEmpty().WithMessage("Role is required.")
                .Length(1, 50).WithMessage("Role must be between 1 and 50 characters.")
                .Must(BeValidRole).WithMessage("Role must be one of: member, lead, admin.");

            RuleFor(x => x.Permissions)
                .Must(permissions => permissions.Count <= 20).WithMessage("Cannot have more than 20 permissions.")
                .When(x => x.Permissions?.Count > 0);

            RuleForEach(x => x.Permissions)
                .NotEmpty().WithMessage("Permission cannot be empty.")
                .MaximumLength(100).WithMessage("Each permission cannot exceed 100 characters.")
                .When(x => x.Permissions?.Count > 0);
        }

        private static bool BeValidRole(string role)
        {
            var validRoles = new[] { "member", "lead", "admin" };
            return validRoles.Contains(role.ToLower());
        }
    }
}