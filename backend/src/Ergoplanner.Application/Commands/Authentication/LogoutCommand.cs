using MediatR;
using Ergoplanner.Application.Common;

namespace Ergoplanner.Application.Commands.Authentication
{
    /// <summary>
    /// Command for user logout
    /// </summary>
    public class LogoutCommand : IRequest<Result>
    {
        public string RefreshToken { get; set; } = string.Empty;
    }
}