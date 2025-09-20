using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Mail;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;
using SendGrid;
using SendGrid.Helpers.Mail;
using Ergoplanner.Application.Interfaces;
using Ergoplanner.Infrastructure.Configuration;

namespace Ergoplanner.Infrastructure.Services
{
    /// <summary>
    /// Email service implementation supporting multiple providers
    /// </summary>
    public class EmailService : IEmailService
    {
        private readonly EmailSettings _emailSettings;
        private readonly ILogger<EmailService> _logger;
        private readonly ISendGridClient? _sendGridClient;

        public EmailService(
            IOptions<EmailSettings> emailSettings,
            ILogger<EmailService> logger)
        {
            _emailSettings = emailSettings.Value;
            _logger = logger;

            // Initialize SendGrid client if configured
            if (_emailSettings.Provider.Equals("SendGrid", StringComparison.OrdinalIgnoreCase) &&
                !string.IsNullOrEmpty(_emailSettings.SendGridApiKey))
            {
                _sendGridClient = new SendGridClient(_emailSettings.SendGridApiKey);
            }
        }

        public async Task<bool> SendEmailAsync(
            string to,
            string subject,
            string body,
            bool isHtml = true,
            CancellationToken cancellationToken = default)
        {
            return await SendEmailAsync(new List<string> { to }, subject, body, isHtml, cancellationToken);
        }

        public async Task<bool> SendEmailAsync(
            List<string> to,
            string subject,
            string body,
            bool isHtml = true,
            CancellationToken cancellationToken = default)
        {
            try
            {
                // Check if emails are enabled
                if (!_emailSettings.EnableEmails)
                {
                    _logger.LogInformation("Email sending is disabled. Email to {Recipients} with subject '{Subject}' was not sent",
                        string.Join(", ", to), subject);
                    return true; // Return true to prevent errors in development
                }

                // Override recipients in development mode
                if (!string.IsNullOrEmpty(_emailSettings.DevelopmentEmail))
                {
                    _logger.LogInformation("Development mode: Redirecting email from {OriginalRecipients} to {DevEmail}",
                        string.Join(", ", to), _emailSettings.DevelopmentEmail);
                    to = new List<string> { _emailSettings.DevelopmentEmail };
                }

                // Send using configured provider
                bool result = _emailSettings.Provider.ToUpperInvariant() switch
                {
                    "SENDGRID" => await SendViaSendGridAsync(to, subject, body, isHtml, cancellationToken),
                    "SMTP" => await SendViaSmtpAsync(to, subject, body, isHtml, cancellationToken),
                    _ => throw new NotSupportedException($"Email provider '{_emailSettings.Provider}' is not supported")
                };

                if (result)
                {
                    _logger.LogInformation("Successfully sent email to {Recipients} with subject '{Subject}'",
                        string.Join(", ", to), subject);
                }
                else
                {
                    _logger.LogWarning("Failed to send email to {Recipients} with subject '{Subject}'",
                        string.Join(", ", to), subject);
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending email to {Recipients} with subject '{Subject}'",
                    string.Join(", ", to), subject);
                return false;
            }
        }

        public async Task<bool> SendTemplatedEmailAsync(
            string to,
            string templateName,
            Dictionary<string, string> templateData,
            CancellationToken cancellationToken = default)
        {
            try
            {
                // Load template (simplified implementation)
                var template = await LoadEmailTemplateAsync(templateName, cancellationToken);

                // Replace template variables
                foreach (var data in templateData)
                {
                    template = template.Replace($"{{{{{data.Key}}}}}", data.Value);
                }

                // Extract subject from template (assuming first line is subject)
                var lines = template.Split('\n', 2);
                var subject = lines[0].Replace("Subject:", "").Trim();
                var body = lines.Length > 1 ? lines[1] : "";

                return await SendEmailAsync(to, subject, body, true, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending templated email '{Template}' to {Recipient}",
                    templateName, to);
                return false;
            }
        }

        public async Task<bool> SendBulkEmailAsync(
            List<string> recipients,
            string subject,
            string body,
            bool isHtml = true,
            CancellationToken cancellationToken = default)
        {
            try
            {
                // For bulk emails, we should batch them to avoid rate limits
                const int batchSize = 50;
                var batches = recipients
                    .Select((recipient, index) => new { recipient, index })
                    .GroupBy(x => x.index / batchSize)
                    .Select(group => group.Select(x => x.recipient).ToList())
                    .ToList();

                var results = new List<bool>();

                foreach (var batch in batches)
                {
                    var result = await SendEmailAsync(batch, subject, body, isHtml, cancellationToken);
                    results.Add(result);

                    // Add delay between batches to respect rate limits
                    if (batches.IndexOf(batch) < batches.Count - 1)
                    {
                        await Task.Delay(1000, cancellationToken);
                    }
                }

                return results.All(r => r);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending bulk email with subject '{Subject}' to {Count} recipients",
                    subject, recipients.Count);
                return false;
            }
        }

        private async Task<bool> SendViaSendGridAsync(
            List<string> to,
            string subject,
            string body,
            bool isHtml,
            CancellationToken cancellationToken)
        {
            if (_sendGridClient == null)
            {
                _logger.LogError("SendGrid client is not configured");
                return false;
            }

            try
            {
                var from = new EmailAddress(_emailSettings.FromEmail, _emailSettings.FromName);
                var recipients = to.Select(email => new EmailAddress(email)).ToList();

                var msg = MailHelper.CreateSingleEmailToMultipleRecipients(
                    from,
                    recipients,
                    subject,
                    isHtml ? null : body,
                    isHtml ? body : null);

                if (!string.IsNullOrEmpty(_emailSettings.ReplyToEmail))
                {
                    msg.ReplyTo = new EmailAddress(_emailSettings.ReplyToEmail);
                }

                var response = await _sendGridClient.SendEmailAsync(msg, cancellationToken);

                if (response.StatusCode == HttpStatusCode.Accepted || response.StatusCode == HttpStatusCode.OK)
                {
                    return true;
                }

                var responseBody = await response.Body.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning("SendGrid returned status {StatusCode}: {Response}",
                    response.StatusCode, responseBody);

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending email via SendGrid");
                return false;
            }
        }

        private async Task<bool> SendViaSmtpAsync(
            List<string> to,
            string subject,
            string body,
            bool isHtml,
            CancellationToken cancellationToken)
        {
            try
            {
                using var message = new MailMessage
                {
                    From = new MailAddress(_emailSettings.FromEmail, _emailSettings.FromName),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = isHtml
                };

                foreach (var recipient in to)
                {
                    message.To.Add(recipient);
                }

                if (!string.IsNullOrEmpty(_emailSettings.ReplyToEmail))
                {
                    message.ReplyToList.Add(_emailSettings.ReplyToEmail);
                }

                using var client = new SmtpClient(_emailSettings.SmtpHost, _emailSettings.SmtpPort)
                {
                    EnableSsl = _emailSettings.SmtpEnableSsl,
                    Credentials = new NetworkCredential(_emailSettings.SmtpUsername, _emailSettings.SmtpPassword)
                };

                await client.SendMailAsync(message, cancellationToken);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending email via SMTP");
                return false;
            }
        }

        private async Task<string> LoadEmailTemplateAsync(string templateName, CancellationToken cancellationToken)
        {
            // This is a simplified implementation
            // In production, you would load from file system, database, or embedded resources
            var templates = new Dictionary<string, string>
            {
                ["welcome"] = @"Subject: Welcome to Ergoplanner AI Suite
<h2>Welcome {{name}}!</h2>
<p>Thank you for joining Ergoplanner AI Suite.</p>
<p>Get started by creating your first P&ID project.</p>",

                ["password-reset"] = @"Subject: Reset Your Password
<h2>Password Reset Request</h2>
<p>Hello {{name}},</p>
<p>We received a request to reset your password.</p>
<p><a href='{{resetLink}}'>Click here to reset your password</a></p>
<p>This link will expire in {{expiry}} hours.</p>",

                ["email-verification"] = @"Subject: Verify Your Email
<h2>Email Verification</h2>
<p>Hello {{name}},</p>
<p>Please verify your email address by clicking the link below:</p>
<p><a href='{{verificationLink}}'>Verify Email</a></p>"
            };

            if (templates.TryGetValue(templateName.ToLowerInvariant(), out var template))
            {
                return await Task.FromResult(template);
            }

            throw new ArgumentException($"Email template '{templateName}' not found");
        }
    }
}