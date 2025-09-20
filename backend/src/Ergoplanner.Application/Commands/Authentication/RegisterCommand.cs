using MediatR;
using Ergoplanner.Application.DTOs.Authentication;
using Ergoplanner.Application.Common;
using Ergoplanner.Domain.Enums;

namespace Ergoplanner.Application.Commands.Authentication
{
    /// <summary>
    /// Command for user registration
    /// </summary>
    public class RegisterCommand : IRequest<Result<AuthenticationResponse>>
    {
        public string Email { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? DisplayName { get; set; }
        public Guid OrganizationId { get; set; }
        public UserRole Role { get; set; }

        public RegisterCommand(RegisterDto registerDto)
        {
            Email = registerDto.Email;
            Username = registerDto.Username;
            Password = registerDto.Password;
            ConfirmPassword = registerDto.ConfirmPassword;
            FirstName = registerDto.FirstName;
            LastName = registerDto.LastName;
            DisplayName = registerDto.DisplayName;
            OrganizationId = registerDto.OrganizationId;
            Role = registerDto.Role;
        }
    }
}