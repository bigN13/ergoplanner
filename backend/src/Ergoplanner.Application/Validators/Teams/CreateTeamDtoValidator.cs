using FluentValidation;
using Ergoplanner.Application.DTOs.Teams;

namespace Ergoplanner.Application.Validators.Teams
{
    /// <summary>
    /// Validator for CreateTeamDto
    /// </summary>
    public class CreateTeamDtoValidator : AbstractValidator<CreateTeamDto>
    {
        public CreateTeamDtoValidator()
        {
            RuleFor(x => x.ProjectId)
                .NotEmpty().WithMessage("Project ID is required.");

            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Team name is required.")
                .Length(1, 100).WithMessage("Team name must be between 1 and 100 characters.");

            RuleFor(x => x.Description)
                .MaximumLength(500).WithMessage("Description cannot exceed 500 characters.")
                .When(x => !string.IsNullOrEmpty(x.Description));

            RuleFor(x => x.InitialMemberIds)
                .Must(ids => ids == null || ids.Count <= 50).WithMessage("Cannot add more than 50 initial members.")
                .When(x => x.InitialMemberIds != null);

            RuleForEach(x => x.InitialMemberIds)
                .NotEmpty().WithMessage("Member ID cannot be empty.")
                .When(x => x.InitialMemberIds != null);
        }
    }
}