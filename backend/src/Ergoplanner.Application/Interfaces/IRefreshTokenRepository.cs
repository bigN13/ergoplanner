using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Ergoplanner.Domain.Entities;

namespace Ergoplanner.Application.Interfaces
{
    /// <summary>
    /// Repository interface for refresh token operations
    /// </summary>
    public interface IRefreshTokenRepository : IRepository<RefreshToken>
    {
        /// <summary>
        /// Get refresh token by token value
        /// </summary>
        Task<RefreshToken?> GetByTokenAsync(string token, CancellationToken cancellationToken = default);

        /// <summary>
        /// Get all active refresh tokens for a user
        /// </summary>
        Task<IEnumerable<RefreshToken>> GetActiveTokensByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);

        /// <summary>
        /// Clean up expired refresh tokens
        /// </summary>
        Task<int> CleanupExpiredTokensAsync(CancellationToken cancellationToken = default);
    }
}