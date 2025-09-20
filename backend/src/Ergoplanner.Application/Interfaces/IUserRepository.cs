using Ergoplanner.Domain.Entities;

namespace Ergoplanner.Application.Interfaces
{
    /// <summary>
    /// User-specific repository interface
    /// </summary>
    public interface IUserRepository : IRepository<User>
    {
        /// <summary>
        /// Gets a user by email address
        /// </summary>
        Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets a user by username
        /// </summary>
        Task<User?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets a user by email or username
        /// </summary>
        Task<User?> GetByEmailOrUsernameAsync(string emailOrUsername, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets a user by password reset token
        /// </summary>
        Task<User?> GetByPasswordResetTokenAsync(string token, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets a user by verification token
        /// </summary>
        Task<User?> GetByVerificationTokenAsync(string token, CancellationToken cancellationToken = default);

        /// <summary>
        /// Checks if an email is already in use
        /// </summary>
        Task<bool> IsEmailInUseAsync(string email, Guid? excludeUserId = null, CancellationToken cancellationToken = default);

        /// <summary>
        /// Checks if a username is already in use
        /// </summary>
        Task<bool> IsUsernameInUseAsync(string username, Guid? excludeUserId = null, CancellationToken cancellationToken = default);
    }
}