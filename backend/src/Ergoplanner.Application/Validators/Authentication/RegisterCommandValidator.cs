using FluentValidation;
using Ergoplanner.Application.Commands.Authentication;

namespace Ergoplanner.Application.Validators.Authentication
{
    /// <summary>
    /// Validator for register command
    /// </summary>
    public class RegisterCommandValidator : AbstractValidator<RegisterCommand>
    {
        public RegisterCommandValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required")
                .EmailAddress().WithMessage("Invalid email format")
                .MaximumLength(255).WithMessage("Email cannot exceed 255 characters");

            RuleFor(x => x.Username)
                .NotEmpty().WithMessage("Username is required")
                .MinimumLength(3).WithMessage("Username must be at least 3 characters")
                .MaximumLength(50).WithMessage("Username cannot exceed 50 characters")
                .Matches("^[a-zA-Z0-9_-]+$").WithMessage("Username can only contain letters, numbers, hyphens, and underscores");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Password is required")
                .MinimumLength(8).WithMessage("Password must be at least 8 characters")
                .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter")
                .Matches("[a-z]").WithMessage("Password must contain at least one lowercase letter")
                .Matches("[0-9]").WithMessage("Password must contain at least one number")
                .Matches("[^a-zA-Z0-9]").WithMessage("Password must contain at least one special character");

            RuleFor(x => x.ConfirmPassword)
                .Equal(x => x.Password).WithMessage("Passwords do not match");

            RuleFor(x => x.FirstName)
                .MaximumLength(100).WithMessage("First name cannot exceed 100 characters")
                .When(x => !string.IsNullOrEmpty(x.FirstName));

            RuleFor(x => x.LastName)
                .MaximumLength(100).WithMessage("Last name cannot exceed 100 characters")
                .When(x => !string.IsNullOrEmpty(x.LastName));

            RuleFor(x => x.OrganizationId)
                .NotEmpty().WithMessage("Organization ID is required");

            RuleFor(x => x.Role)
                .IsInEnum().WithMessage("Invalid user role");
        }
    }
}