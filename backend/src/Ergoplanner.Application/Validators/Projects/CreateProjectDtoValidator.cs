using FluentValidation;
using Ergoplanner.Application.DTOs.Projects;
using Ergoplanner.Domain.Enums;

namespace Ergoplanner.Application.Validators.Projects
{
    /// <summary>
    /// Validator for CreateProjectDto
    /// </summary>
    public class CreateProjectDtoValidator : AbstractValidator<CreateProjectDto>
    {
        public CreateProjectDtoValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Project name is required.")
                .Length(1, 200).WithMessage("Project name must be between 1 and 200 characters.");

            RuleFor(x => x.Code)
                .NotEmpty().WithMessage("Project code is required.")
                .Length(1, 50).WithMessage("Project code must be between 1 and 50 characters.")
                .Matches(@"^[A-Z0-9-_]+$").WithMessage("Project code can only contain uppercase letters, numbers, hyphens, and underscores.");

            RuleFor(x => x.Description)
                .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters.")
                .When(x => !string.IsNullOrEmpty(x.Description));

            RuleFor(x => x.ProjectType)
                .MaximumLength(100).WithMessage("Project type cannot exceed 100 characters.")
                .When(x => !string.IsNullOrEmpty(x.ProjectType));

            RuleFor(x => x.Status)
                .IsInEnum().WithMessage("Invalid project status.");

            RuleFor(x => x.StartDate)
                .LessThanOrEqualTo(x => x.EndDate).WithMessage("Start date must be before or equal to end date.")
                .When(x => x.StartDate.HasValue && x.EndDate.HasValue);

            RuleFor(x => x.EndDate)
                .GreaterThanOrEqualTo(x => x.StartDate).WithMessage("End date must be after or equal to start date.")
                .When(x => x.StartDate.HasValue && x.EndDate.HasValue);

            RuleFor(x => x.Budget)
                .GreaterThan(0).WithMessage("Budget must be greater than zero.")
                .When(x => x.Budget.HasValue);

            RuleFor(x => x.Currency)
                .NotEmpty().WithMessage("Currency is required when budget is specified.")
                .Length(3, 3).WithMessage("Currency must be a 3-character ISO code.")
                .When(x => x.Budget.HasValue);

            RuleFor(x => x.ClientName)
                .MaximumLength(200).WithMessage("Client name cannot exceed 200 characters.")
                .When(x => !string.IsNullOrEmpty(x.ClientName));

            RuleFor(x => x.Tags)
                .Must(tags => tags.Count <= 20).WithMessage("Cannot have more than 20 tags.")
                .When(x => x.Tags?.Count > 0);

            RuleForEach(x => x.Tags)
                .NotEmpty().WithMessage("Tag cannot be empty.")
                .MaximumLength(50).WithMessage("Each tag cannot exceed 50 characters.")
                .When(x => x.Tags?.Count > 0);
        }
    }
}