namespace Ergoplanner.Application.DTOs.Authentication
{
    /// <summary>
    /// DTO for refresh token request
    /// </summary>
    public class RefreshTokenDto
    {
        /// <summary>
        /// The expired or expiring access token
        /// </summary>
        public string AccessToken { get; set; } = string.Empty;

        /// <summary>
        /// The refresh token
        /// </summary>
        public string RefreshToken { get; set; } = string.Empty;
    }
}