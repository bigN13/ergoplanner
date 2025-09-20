using MediatR;
using Ergoplanner.Application.DTOs.Authentication;
using Ergoplanner.Application.Common;

namespace Ergoplanner.Application.Commands.Authentication
{
    /// <summary>
    /// Command for user login
    /// </summary>
    public class LoginCommand : IRequest<Result<AuthenticationResponse>>
    {
        public string EmailOrUsername { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public bool RememberMe { get; set; }

        public LoginCommand(LoginDto loginDto)
        {
            EmailOrUsername = loginDto.EmailOrUsername;
            Password = loginDto.Password;
            RememberMe = loginDto.RememberMe;
        }
    }
}