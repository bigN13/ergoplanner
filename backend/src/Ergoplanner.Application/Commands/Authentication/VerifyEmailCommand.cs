using MediatR;
using Ergoplanner.Application.Common;

namespace Ergoplanner.Application.Commands.Authentication
{
    /// <summary>
    /// Command for email verification
    /// </summary>
    public class VerifyEmailCommand : IRequest<Result>
    {
        public string Token { get; set; } = string.Empty;
    }
}