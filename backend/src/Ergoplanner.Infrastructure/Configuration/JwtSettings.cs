namespace Ergoplanner.Infrastructure.Configuration
{
    /// <summary>
    /// JWT authentication configuration settings
    /// </summary>
    public class JwtSettings
    {
        /// <summary>
        /// Secret key for signing JWT tokens
        /// </summary>
        public string SecretKey { get; set; } = string.Empty;

        /// <summary>
        /// Token issuer (typically the API URL)
        /// </summary>
        public string Issuer { get; set; } = string.Empty;

        /// <summary>
        /// Valid audiences for the token
        /// </summary>
        public string Audience { get; set; } = string.Empty;

        /// <summary>
        /// Access token expiration time in minutes
        /// </summary>
        public int AccessTokenExpirationMinutes { get; set; } = 60;

        /// <summary>
        /// Refresh token expiration time in days
        /// </summary>
        public int RefreshTokenExpirationDays { get; set; } = 7;

        /// <summary>
        /// Whether to validate the issuer
        /// </summary>
        public bool ValidateIssuer { get; set; } = true;

        /// <summary>
        /// Whether to validate the audience
        /// </summary>
        public bool ValidateAudience { get; set; } = true;

        /// <summary>
        /// Whether to validate the lifetime
        /// </summary>
        public bool ValidateLifetime { get; set; } = true;

        /// <summary>
        /// Whether to validate the signing key
        /// </summary>
        public bool ValidateIssuerSigningKey { get; set; } = true;

        /// <summary>
        /// Clock skew in minutes for token expiration
        /// </summary>
        public int ClockSkewMinutes { get; set; } = 5;
    }
}