using Xunit;
using Ergoplanner.Infrastructure.Caching.Common;

namespace Ergoplanner.UnitTests.Infrastructure.Caching;

public class CacheKeyBuilderTests
{
    [Fact]
    public void Build_WithSingleSegment_ReturnsFormattedKey()
    {
        // Act
        var result = CacheKeyBuilder.Build("test");

        // Assert
        Assert.Equal("ergoplanner:test", result);
    }

    [Fact]
    public void Build_WithMultipleSegments_ReturnsFormattedKey()
    {
        // Act
        var result = CacheKeyBuilder.Build("user", "123", "profile");

        // Assert
        Assert.Equal("ergoplanner:user:123:profile", result);
    }

    [Fact]
    public void Build_WithEmptySegments_IgnoresEmptySegments()
    {
        // Act
        var result = CacheKeyBuilder.Build("user", "", "123", null, "profile");

        // Assert
        Assert.Equal("ergoplanner:user:123:profile", result);
    }

    [Fact]
    public void ForUser_WithUserId_ReturnsUserKey()
    {
        // Arrange
        var userId = Guid.NewGuid();

        // Act
        var result = CacheKeyBuilder.ForUser(userId);

        // Assert
        Assert.Equal($"ergoplanner:user:{userId}", result);
    }

    [Fact]
    public void ForUser_WithUserIdAndAdditionalSegments_ReturnsExtendedUserKey()
    {
        // Arrange
        var userId = Guid.NewGuid();

        // Act
        var result = CacheKeyBuilder.ForUser(userId, "settings", "theme");

        // Assert
        Assert.Equal($"ergoplanner:user:{userId}:settings:theme", result);
    }

    [Fact]
    public void ForProject_WithProjectId_ReturnsProjectKey()
    {
        // Arrange
        var projectId = Guid.NewGuid();

        // Act
        var result = CacheKeyBuilder.ForProject(projectId);

        // Assert
        Assert.Equal($"ergoplanner:project:{projectId}", result);
    }

    [Fact]
    public void ForDrawing_WithDrawingId_ReturnsDrawingKey()
    {
        // Arrange
        var drawingId = Guid.NewGuid();

        // Act
        var result = CacheKeyBuilder.ForDrawing(drawingId);

        // Assert
        Assert.Equal($"ergoplanner:drawing:{drawingId}", result);
    }

    [Fact]
    public void ForSession_WithUserId_ReturnsSessionKey()
    {
        // Arrange
        var userId = Guid.NewGuid();

        // Act
        var result = CacheKeyBuilder.ForSession(userId);

        // Assert
        Assert.Equal($"ergoplanner:session:{userId}:main", result);
    }

    [Fact]
    public void ForSession_WithUserIdAndSessionType_ReturnsCustomSessionKey()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var sessionType = "admin";

        // Act
        var result = CacheKeyBuilder.ForSession(userId, sessionType);

        // Assert
        Assert.Equal($"ergoplanner:session:{userId}:{sessionType}", result);
    }

    [Fact]
    public void ForRefreshToken_WithUserId_ReturnsRefreshTokenKey()
    {
        // Arrange
        var userId = Guid.NewGuid();

        // Act
        var result = CacheKeyBuilder.ForRefreshToken(userId);

        // Assert
        Assert.Equal($"ergoplanner:token:refresh:{userId}", result);
    }

    [Fact]
    public void ForBlacklistedToken_WithTokenId_ReturnsBlacklistKey()
    {
        // Arrange
        var tokenId = "abc123def456";

        // Act
        var result = CacheKeyBuilder.ForBlacklistedToken(tokenId);

        // Assert
        Assert.Equal($"ergoplanner:token:blacklist:{tokenId}", result);
    }

    [Fact]
    public void ForUserPreferences_WithUserId_ReturnsUserPreferencesKey()
    {
        // Arrange
        var userId = Guid.NewGuid();

        // Act
        var result = CacheKeyBuilder.ForUserPreferences(userId);

        // Assert
        Assert.Equal($"ergoplanner:user:{userId}:preferences", result);
    }

    [Fact]
    public void ForUserProjects_WithUserId_ReturnsUserProjectsKey()
    {
        // Arrange
        var userId = Guid.NewGuid();

        // Act
        var result = CacheKeyBuilder.ForUserProjects(userId);

        // Assert
        Assert.Equal($"ergoplanner:user:{userId}:projects", result);
    }

    [Fact]
    public void ForProjectDrawings_WithProjectId_ReturnsProjectDrawingsKey()
    {
        // Arrange
        var projectId = Guid.NewGuid();

        // Act
        var result = CacheKeyBuilder.ForProjectDrawings(projectId);

        // Assert
        Assert.Equal($"ergoplanner:project:{projectId}:drawings", result);
    }

    [Fact]
    public void ForDrawingMetadata_WithDrawingId_ReturnsDrawingMetadataKey()
    {
        // Arrange
        var drawingId = Guid.NewGuid();

        // Act
        var result = CacheKeyBuilder.ForDrawingMetadata(drawingId);

        // Assert
        Assert.Equal($"ergoplanner:drawing:{drawingId}:metadata", result);
    }

    [Fact]
    public void ForDrawingData_WithDrawingId_ReturnsDrawingDataKey()
    {
        // Arrange
        var drawingId = Guid.NewGuid();

        // Act
        var result = CacheKeyBuilder.ForDrawingData(drawingId);

        // Assert
        Assert.Equal($"ergoplanner:drawing:{drawingId}:data", result);
    }

    [Fact]
    public void ForDrawingCollaboration_WithDrawingIdOnly_ReturnsCollaborationKey()
    {
        // Arrange
        var drawingId = Guid.NewGuid();

        // Act
        var result = CacheKeyBuilder.ForDrawingCollaboration(drawingId);

        // Assert
        Assert.Equal($"ergoplanner:drawing:{drawingId}:collab", result);
    }

    [Fact]
    public void ForDrawingCollaboration_WithDrawingIdAndUserId_ReturnsUserSpecificCollaborationKey()
    {
        // Arrange
        var drawingId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        // Act
        var result = CacheKeyBuilder.ForDrawingCollaboration(drawingId, userId);

        // Assert
        Assert.Equal($"ergoplanner:drawing:{drawingId}:collab:{userId}", result);
    }

    [Fact]
    public void ForDrawingLock_WithDrawingId_ReturnsDrawingLockKey()
    {
        // Arrange
        var drawingId = Guid.NewGuid();

        // Act
        var result = CacheKeyBuilder.ForDrawingLock(drawingId);

        // Assert
        Assert.Equal($"ergoplanner:drawing:{drawingId}:lock", result);
    }

    [Fact]
    public void ForSymbolLibrary_WithStandard_ReturnsSymbolLibraryKey()
    {
        // Arrange
        var standard = "ISA-5.1";

        // Act
        var result = CacheKeyBuilder.ForSymbolLibrary(standard);

        // Assert
        Assert.Equal("ergoplanner:symbols:isa-5.1", result);
    }

    [Fact]
    public void BuildPattern_WithSegments_ReturnsPatternWithWildcard()
    {
        // Act
        var result = CacheKeyBuilder.BuildPattern("user", "123");

        // Assert
        Assert.Equal("ergoplanner:user:123*", result);
    }

    [Fact]
    public void BuildPattern_WithSegmentsEndingInWildcard_DoesNotDuplicateWildcard()
    {
        // Act
        var result = CacheKeyBuilder.BuildPattern("user", "123*");

        // Assert
        Assert.Equal("ergoplanner:user:123*", result);
    }

    [Fact]
    public void ForUserPattern_WithUserId_ReturnsUserPattern()
    {
        // Arrange
        var userId = Guid.NewGuid();

        // Act
        var result = CacheKeyBuilder.ForUserPattern(userId);

        // Assert
        Assert.Equal($"ergoplanner:user:{userId}*", result);
    }

    [Fact]
    public void ForProjectPattern_WithProjectId_ReturnsProjectPattern()
    {
        // Arrange
        var projectId = Guid.NewGuid();

        // Act
        var result = CacheKeyBuilder.ForProjectPattern(projectId);

        // Assert
        Assert.Equal($"ergoplanner:project:{projectId}*", result);
    }

    [Fact]
    public void ForDrawingPattern_WithDrawingId_ReturnsDrawingPattern()
    {
        // Arrange
        var drawingId = Guid.NewGuid();

        // Act
        var result = CacheKeyBuilder.ForDrawingPattern(drawingId);

        // Assert
        Assert.Equal($"ergoplanner:drawing:{drawingId}*", result);
    }

    [Fact]
    public void Hash_WithInput_ReturnsConsistentHash()
    {
        // Arrange
        var input = "test input string";

        // Act
        var result1 = CacheKeyBuilder.Hash(input);
        var result2 = CacheKeyBuilder.Hash(input);

        // Assert
        Assert.Equal(result1, result2);
        Assert.NotNull(result1);
        Assert.NotEmpty(result1);
    }

    [Fact]
    public void Hash_WithDifferentInputs_ReturnsDifferentHashes()
    {
        // Arrange
        var input1 = "test input 1";
        var input2 = "test input 2";

        // Act
        var result1 = CacheKeyBuilder.Hash(input1);
        var result2 = CacheKeyBuilder.Hash(input2);

        // Assert
        Assert.NotEqual(result1, result2);
    }

    [Fact]
    public void ForComplexKey_WithObject_ReturnsHashedKey()
    {
        // Arrange
        var keyObject = new { UserId = Guid.NewGuid(), ProjectId = Guid.NewGuid(), Type = "test" };

        // Act
        var result = CacheKeyBuilder.ForComplexKey(keyObject, "complex", "key");

        // Assert
        Assert.StartsWith("ergoplanner:complex:key:", result);
        Assert.Contains(":", result);
    }
}