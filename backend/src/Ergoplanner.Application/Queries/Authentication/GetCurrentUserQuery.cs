using System;
using MediatR;
using Ergoplanner.Application.Common;
using Ergoplanner.Application.DTOs.Authentication;

namespace Ergoplanner.Application.Commands.Authentication
{
    /// <summary>
    /// Query for getting current user information
    /// </summary>
    public class GetCurrentUserQuery : IRequest<Result<UserDto>>
    {
        public Guid UserId { get; set; }
    }
}