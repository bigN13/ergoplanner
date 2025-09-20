using MediatR;
using Ergoplanner.Application.Common;

namespace Ergoplanner.Application.Commands.Authentication
{
    /// <summary>
    /// Command for requesting a password reset
    /// </summary>
    public class RequestPasswordResetCommand : IRequest<Result>
    {
        public string Email { get; set; } = string.Empty;

        public RequestPasswordResetCommand(string email)
        {
            Email = email;
        }
    }
}