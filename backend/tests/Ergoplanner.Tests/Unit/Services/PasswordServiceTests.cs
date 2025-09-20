using Xunit;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Ergoplanner.Infrastructure.Services;

namespace Ergoplanner.Tests.Unit.Services
{
    public class PasswordServiceTests
    {
        private readonly PasswordService _passwordService;
        private readonly Mock<ILogger<PasswordService>> _loggerMock;

        public PasswordServiceTests()
        {
            _loggerMock = new Mock<ILogger<PasswordService>>();
            _passwordService = new PasswordService(_loggerMock.Object);
        }

        [Fact]
        public void HashPassword_ShouldReturnDifferentHashForSamePassword()
        {
            // Arrange
            var password = "TestPassword123!";

            // Act
            var hash1 = _passwordService.HashPassword(password);
            var hash2 = _passwordService.HashPassword(password);

            // Assert
            hash1.Should().NotBeNullOrWhiteSpace();
            hash2.Should().NotBeNullOrWhiteSpace();
            hash1.Should().NotBe(hash2); // BCrypt generates different salts
        }

        [Fact]
        public void VerifyPassword_ShouldReturnTrueForCorrectPassword()
        {
            // Arrange
            var password = "TestPassword123!";
            var hash = _passwordService.HashPassword(password);

            // Act
            var result = _passwordService.VerifyPassword(password, hash);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public void VerifyPassword_ShouldReturnFalseForIncorrectPassword()
        {
            // Arrange
            var password = "TestPassword123!";
            var wrongPassword = "WrongPassword123!";
            var hash = _passwordService.HashPassword(password);

            // Act
            var result = _passwordService.VerifyPassword(wrongPassword, hash);

            // Assert
            result.Should().BeFalse();
        }

        [Theory]
        [InlineData("short", false)] // Too short
        [InlineData("nouppercase123!", false)] // No uppercase
        [InlineData("NOLOWERCASE123!", false)] // No lowercase
        [InlineData("NoNumbers!", false)] // No numbers
        [InlineData("NoSpecialChars123", false)] // No special characters
        [InlineData("ValidPassword123!", true)] // Valid password
        [InlineData("Complex!Pass123Word", true)] // Complex valid password
        public void ValidatePasswordStrength_ShouldValidateCorrectly(string password, bool expectedValid)
        {
            // Act
            var result = _passwordService.ValidatePasswordStrength(password);

            // Assert
            result.IsValid.Should().Be(expectedValid);
            if (!expectedValid)
            {
                result.Errors.Should().NotBeEmpty();
            }
        }

        [Fact]
        public void ValidatePasswordStrength_ShouldDetectCommonPasswords()
        {
            // Arrange
            var commonPassword = "Password123!"; // Contains "password"

            // Act
            var result = _passwordService.ValidatePasswordStrength(commonPassword);

            // Assert
            result.IsValid.Should().BeFalse();
            result.Errors.Should().Contain(e => e.Contains("too common"));
        }

        [Theory]
        [InlineData("short123!", PasswordStrength.Weak)]
        [InlineData("ValidPass123!", PasswordStrength.Strong)]
        [InlineData("Complex!Pass123Word@#$", PasswordStrength.VeryStrong)]
        public void ValidatePasswordStrength_ShouldCalculateStrengthCorrectly(string password, PasswordStrength expectedStrength)
        {
            // Act
            var result = _passwordService.ValidatePasswordStrength(password);

            // Assert
            result.Strength.Should().BeGreaterThanOrEqualTo(expectedStrength);
        }

        [Theory]
        [InlineData(8)]
        [InlineData(16)]
        [InlineData(24)]
        public void GenerateRandomPassword_ShouldGeneratePasswordWithCorrectLength(int length)
        {
            // Act
            var password = _passwordService.GenerateRandomPassword(length);

            // Assert
            password.Should().NotBeNullOrWhiteSpace();
            password.Length.Should().Be(length);
        }

        [Fact]
        public void GenerateRandomPassword_ShouldGenerateValidPassword()
        {
            // Act
            var password = _passwordService.GenerateRandomPassword(16);
            var validationResult = _passwordService.ValidatePasswordStrength(password);

            // Assert
            validationResult.IsValid.Should().BeTrue();
            validationResult.Strength.Should().BeGreaterThanOrEqualTo(PasswordStrength.Strong);
        }

        [Fact]
        public void GenerateRandomPassword_ShouldGenerateDifferentPasswords()
        {
            // Act
            var password1 = _passwordService.GenerateRandomPassword();
            var password2 = _passwordService.GenerateRandomPassword();

            // Assert
            password1.Should().NotBe(password2);
        }

        [Fact]
        public void GeneratePasswordResetToken_ShouldGenerateUrlSafeToken()
        {
            // Act
            var token = _passwordService.GeneratePasswordResetToken();

            // Assert
            token.Should().NotBeNullOrWhiteSpace();
            token.Should().NotContain("+");
            token.Should().NotContain("/");
            token.Should().NotContain("=");
        }

        [Fact]
        public void GeneratePasswordResetToken_ShouldGenerateUniqueTokens()
        {
            // Act
            var token1 = _passwordService.GeneratePasswordResetToken();
            var token2 = _passwordService.GeneratePasswordResetToken();

            // Assert
            token1.Should().NotBe(token2);
        }

        [Theory]
        [InlineData(5, 8)] // Too short, should default to 8
        [InlineData(200, 128)] // Too long, should cap at 128
        public void GenerateRandomPassword_ShouldEnforceLengthLimits(int requestedLength, int expectedLength)
        {
            // Act
            var password = _passwordService.GenerateRandomPassword(requestedLength);

            // Assert
            password.Length.Should().Be(expectedLength);
        }
    }
}