using System;
using System.Collections.Concurrent;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace Ergoplanner.Infrastructure.SignalR.Middleware
{
    /// <summary>
    /// Rate limiting middleware for SignalR hubs
    /// </summary>
    public class SignalRRateLimitingMiddleware
    {
        private readonly IDistributedCache _cache;
        private readonly ILogger<SignalRRateLimitingMiddleware> _logger;
        private const int DefaultRequestsPerMinute = 60;
        private const int DefaultRequestsPerSecond = 10;

        public SignalRRateLimitingMiddleware(
            IDistributedCache cache,
            ILogger<SignalRRateLimitingMiddleware> logger)
        {
            _cache = cache;
            _logger = logger;
        }

        /// <summary>
        /// Checks if the user has exceeded the rate limit
        /// </summary>
        public async Task<bool> IsRateLimitExceededAsync(string userId, string action, int requestsPerMinute = DefaultRequestsPerMinute, int requestsPerSecond = DefaultRequestsPerSecond)
        {
            try
            {
                var now = DateTime.UtcNow;
                var minuteKey = $"rate_limit:{userId}:{action}:minute:{now:yyyyMMddHHmm}";
                var secondKey = $"rate_limit:{userId}:{action}:second:{now:yyyyMMddHHmmss}";

                // Check per-second limit
                var secondCount = await GetRequestCountAsync(secondKey);
                if (secondCount >= requestsPerSecond)
                {
                    _logger.LogWarning("Rate limit exceeded for user {UserId}, action {Action}: {Count} requests per second",
                        userId, action, secondCount);
                    return true;
                }

                // Check per-minute limit
                var minuteCount = await GetRequestCountAsync(minuteKey);
                if (minuteCount >= requestsPerMinute)
                {
                    _logger.LogWarning("Rate limit exceeded for user {UserId}, action {Action}: {Count} requests per minute",
                        userId, action, minuteCount);
                    return true;
                }

                // Increment counters
                await IncrementRequestCountAsync(secondKey, TimeSpan.FromSeconds(1));
                await IncrementRequestCountAsync(minuteKey, TimeSpan.FromMinutes(1));

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking rate limit for user {UserId}, action {Action}", userId, action);
                // In case of error, allow the request to proceed
                return false;
            }
        }

        /// <summary>
        /// Gets the current request count for a cache key
        /// </summary>
        private async Task<int> GetRequestCountAsync(string cacheKey)
        {
            try
            {
                var countString = await _cache.GetStringAsync(cacheKey);
                return string.IsNullOrEmpty(countString) ? 0 : int.Parse(countString);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting request count for key {CacheKey}", cacheKey);
                return 0;
            }
        }

        /// <summary>
        /// Increments the request count for a cache key
        /// </summary>
        private async Task IncrementRequestCountAsync(string cacheKey, TimeSpan expiry)
        {
            try
            {
                var currentCount = await GetRequestCountAsync(cacheKey);
                var newCount = currentCount + 1;

                var options = new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = expiry
                };

                await _cache.SetStringAsync(cacheKey, newCount.ToString(), options);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error incrementing request count for key {CacheKey}", cacheKey);
            }
        }
    }

    /// <summary>
    /// Security validation middleware for SignalR connections
    /// </summary>
    public class SignalRSecurityMiddleware
    {
        private readonly ILogger<SignalRSecurityMiddleware> _logger;
        private readonly ConcurrentDictionary<string, DateTime> _suspiciousConnections;

        public SignalRSecurityMiddleware(ILogger<SignalRSecurityMiddleware> logger)
        {
            _logger = logger;
            _suspiciousConnections = new ConcurrentDictionary<string, DateTime>();
        }

        /// <summary>
        /// Validates input data for potential security threats
        /// </summary>
        public bool ValidateInput(object input, string inputType)
        {
            try
            {
                if (input == null)
                {
                    return false;
                }

                var inputString = input.ToString();

                // Check for excessively long input
                if (inputString?.Length > 10000)
                {
                    _logger.LogWarning("Input validation failed: Input too long ({Length} characters) for type {InputType}",
                        inputString.Length, inputType);
                    return false;
                }

                // Check for potential injection attacks
                if (ContainsSuspiciousContent(inputString))
                {
                    _logger.LogWarning("Input validation failed: Suspicious content detected in {InputType}", inputType);
                    return false;
                }

                // Additional validation based on input type
                switch (inputType.ToLower())
                {
                    case "drawingid":
                    case "projectid":
                    case "workflowid":
                        return ValidateId(inputString);
                    case "coordinates":
                        return ValidateCoordinates(input);
                    case "comment":
                        return ValidateComment(inputString);
                    default:
                        return ValidateGenericInput(inputString);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating input for type {InputType}", inputType);
                return false;
            }
        }

        /// <summary>
        /// Marks a connection as suspicious
        /// </summary>
        public void MarkConnectionAsSuspicious(string connectionId, string reason)
        {
            _suspiciousConnections.TryAdd(connectionId, DateTime.UtcNow);
            _logger.LogWarning("Connection {ConnectionId} marked as suspicious: {Reason}", connectionId, reason);
        }

        /// <summary>
        /// Checks if a connection is marked as suspicious
        /// </summary>
        public bool IsConnectionSuspicious(string connectionId)
        {
            return _suspiciousConnections.ContainsKey(connectionId);
        }

        /// <summary>
        /// Cleans up old suspicious connection records
        /// </summary>
        public void CleanupSuspiciousConnections()
        {
            var cutoffTime = DateTime.UtcNow.AddHours(-24);
            var keysToRemove = new List<string>();

            foreach (var kvp in _suspiciousConnections)
            {
                if (kvp.Value < cutoffTime)
                {
                    keysToRemove.Add(kvp.Key);
                }
            }

            foreach (var key in keysToRemove)
            {
                _suspiciousConnections.TryRemove(key, out _);
            }
        }

        #region Private Helper Methods

        private bool ContainsSuspiciousContent(string? input)
        {
            if (string.IsNullOrEmpty(input))
                return false;

            var suspiciousPatterns = new[]
            {
                "<script", "</script>", "javascript:", "vbscript:",
                "onload=", "onerror=", "onclick=", "onmouseover=",
                "eval(", "setTimeout(", "setInterval(",
                "document.cookie", "document.location", "window.location",
                "SELECT ", "INSERT ", "UPDATE ", "DELETE ", "DROP ",
                "UNION ", "WHERE ", "EXEC ", "EXECUTE ",
                "--", "/*", "*/", "xp_", "sp_"
            };

            var lowerInput = input.ToLowerInvariant();

            foreach (var pattern in suspiciousPatterns)
            {
                if (lowerInput.Contains(pattern.ToLowerInvariant()))
                {
                    return true;
                }
            }

            return false;
        }

        private bool ValidateId(string? input)
        {
            if (string.IsNullOrEmpty(input))
                return false;

            return Guid.TryParse(input, out _);
        }

        private bool ValidateCoordinates(object input)
        {
            try
            {
                if (input is double x && input is double y)
                {
                    // Check for reasonable coordinate ranges
                    return x >= -100000 && x <= 100000 && y >= -100000 && y <= 100000;
                }

                // Handle coordinate objects
                var coordinateString = input.ToString();
                if (string.IsNullOrEmpty(coordinateString))
                    return false;

                // Basic validation - in a real implementation, you'd want more sophisticated coordinate validation
                return coordinateString.Length < 100 && !ContainsSuspiciousContent(coordinateString);
            }
            catch
            {
                return false;
            }
        }

        private bool ValidateComment(string? input)
        {
            if (string.IsNullOrEmpty(input))
                return false;

            // Check length
            if (input.Length > 5000)
                return false;

            // Check for suspicious content
            return !ContainsSuspiciousContent(input);
        }

        private bool ValidateGenericInput(string? input)
        {
            if (string.IsNullOrEmpty(input))
                return false;

            // Basic validation for generic input
            return input.Length <= 1000 && !ContainsSuspiciousContent(input);
        }

        #endregion
    }
}