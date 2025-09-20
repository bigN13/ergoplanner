namespace Ergoplanner.Infrastructure.Configuration
{
    /// <summary>
    /// Email service configuration settings
    /// </summary>
    public class EmailSettings
    {
        /// <summary>
        /// Email provider type (SendGrid, SMTP, etc.)
        /// </summary>
        public string Provider { get; set; } = "SendGrid";

        /// <summary>
        /// SendGrid API key
        /// </summary>
        public string SendGridApiKey { get; set; } = string.Empty;

        /// <summary>
        /// SMTP server host
        /// </summary>
        public string SmtpHost { get; set; } = string.Empty;

        /// <summary>
        /// SMTP server port
        /// </summary>
        public int SmtpPort { get; set; } = 587;

        /// <summary>
        /// SMTP username
        /// </summary>
        public string SmtpUsername { get; set; } = string.Empty;

        /// <summary>
        /// SMTP password
        /// </summary>
        public string SmtpPassword { get; set; } = string.Empty;

        /// <summary>
        /// Enable SSL for SMTP
        /// </summary>
        public bool SmtpEnableSsl { get; set; } = true;

        /// <summary>
        /// From email address
        /// </summary>
        public string FromEmail { get; set; } = "noreply@ergoplanner.ai";

        /// <summary>
        /// From display name
        /// </summary>
        public string FromName { get; set; } = "Ergoplanner AI Suite";

        /// <summary>
        /// Reply-to email address
        /// </summary>
        public string ReplyToEmail { get; set; } = "support@ergoplanner.ai";

        /// <summary>
        /// Enable email sending (false for development)
        /// </summary>
        public bool EnableEmails { get; set; } = true;

        /// <summary>
        /// Development email address (all emails sent here in dev mode)
        /// </summary>
        public string DevelopmentEmail { get; set; } = string.Empty;

        /// <summary>
        /// Email template base path
        /// </summary>
        public string TemplateBasePath { get; set; } = "EmailTemplates";
    }
}