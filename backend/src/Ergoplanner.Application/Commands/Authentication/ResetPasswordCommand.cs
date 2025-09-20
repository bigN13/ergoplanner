using MediatR;
using Ergoplanner.Application.Common;

namespace Ergoplanner.Application.Commands.Authentication
{
    /// <summary>
    /// Command for resetting user password
    /// </summary>
    public class ResetPasswordCommand : IRequest<Result>
    {
        public string Token { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;

        public ResetPasswordCommand(string token, string newPassword, string confirmPassword)
        {
            Token = token;
            NewPassword = newPassword;
            ConfirmPassword = confirmPassword;
        }
    }
}