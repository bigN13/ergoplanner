using MediatR;
using Ergoplanner.Application.DTOs.Authentication;
using Ergoplanner.Application.Common;

namespace Ergoplanner.Application.Commands.Authentication
{
    /// <summary>
    /// Command for refreshing authentication tokens
    /// </summary>
    public class RefreshTokenCommand : IRequest<Result<AuthenticationResponseDto>>
    {
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;

        public RefreshTokenCommand(RefreshTokenDto refreshTokenDto)
        {
            AccessToken = refreshTokenDto.AccessToken;
            RefreshToken = refreshTokenDto.RefreshToken;
        }
    }
}