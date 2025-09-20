using FluentValidation;
using Ergoplanner.Application.Commands.Authentication;

namespace Ergoplanner.Application.Validators.Authentication
{
    /// <summary>
    /// Validator for login command
    /// </summary>
    public class LoginCommandValidator : AbstractValidator<LoginCommand>
    {
        public LoginCommandValidator()
        {
            RuleFor(x => x.EmailOrUsername)
                .NotEmpty().WithMessage("Email or username is required")
                .MinimumLength(3).WithMessage("Email or username must be at least 3 characters");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Password is required");
        }
    }
}