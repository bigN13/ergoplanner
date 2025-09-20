using FluentValidation;
using Ergoplanner.Application.DTOs;
using Ergoplanner.Domain.Enums;
using System.Text.RegularExpressions;

namespace Ergoplanner.Application.Validators
{
    /// <summary>
    /// Validator for CreateSymbolDto
    /// </summary>
    public class CreateSymbolDtoValidator : AbstractValidator<CreateSymbolDto>
    {
        public CreateSymbolDtoValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Symbol name is required")
                .MaximumLength(255).WithMessage("Symbol name cannot exceed 255 characters")
                .Must(BeValidName).WithMessage("Symbol name contains invalid characters");

            RuleFor(x => x.Code)
                .NotEmpty().WithMessage("Symbol code is required")
                .MaximumLength(100).WithMessage("Symbol code cannot exceed 100 characters")
                .Must(BeValidCode).WithMessage("Symbol code must contain only alphanumeric characters, underscores, and hyphens");

            RuleFor(x => x.Description)
                .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters")
                .When(x => !string.IsNullOrEmpty(x.Description));

            RuleFor(x => x.SvgContent)
                .NotEmpty().WithMessage("SVG content is required")
                .Must(BeValidSvg).WithMessage("Invalid SVG content");

            RuleFor(x => x.SymbolType)
                .IsInEnum().WithMessage("Invalid symbol type");

            RuleFor(x => x.AccessLevel)
                .IsInEnum().WithMessage("Invalid access level");

            RuleFor(x => x.Tags)
                .Must(BeValidTags).WithMessage("Tags cannot contain more than 20 items or have items longer than 50 characters")
                .When(x => x.Tags != null && x.Tags.Count > 0);

            RuleFor(x => x.Properties)
                .Must(BeValidProperties).WithMessage("Properties dictionary cannot exceed 100 items")
                .When(x => x.Properties != null);

            RuleFor(x => x.Metadata)
                .Must(BeValidMetadata).WithMessage("Metadata dictionary cannot exceed 50 items")
                .When(x => x.Metadata != null);
        }

        private bool BeValidName(string name)
        {
            // Allow letters, numbers, spaces, and common punctuation
            return Regex.IsMatch(name, @"^[a-zA-Z0-9\s\-_().,]+$");
        }

        private bool BeValidCode(string code)
        {
            // Allow only alphanumeric characters, underscores, and hyphens
            return Regex.IsMatch(code, @"^[a-zA-Z0-9_-]+$");
        }

        private bool BeValidSvg(string svgContent)
        {
            // Basic SVG validation - check if it starts with SVG tag
            if (string.IsNullOrEmpty(svgContent))
                return false;

            var trimmed = svgContent.Trim();
            return trimmed.StartsWith("<svg", StringComparison.OrdinalIgnoreCase) &&
                   trimmed.EndsWith("</svg>", StringComparison.OrdinalIgnoreCase);
        }

        private bool BeValidTags(List<string> tags)
        {
            if (tags.Count > 20)
                return false;

            return tags.All(tag => !string.IsNullOrWhiteSpace(tag) && tag.Length <= 50);
        }

        private bool BeValidProperties(Dictionary<string, object> properties)
        {
            return properties.Count <= 100;
        }

        private bool BeValidMetadata(Dictionary<string, object> metadata)
        {
            return metadata.Count <= 50;
        }
    }

    /// <summary>
    /// Validator for UpdateSymbolDto
    /// </summary>
    public class UpdateSymbolDtoValidator : AbstractValidator<UpdateSymbolDto>
    {
        public UpdateSymbolDtoValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Symbol name is required")
                .MaximumLength(255).WithMessage("Symbol name cannot exceed 255 characters")
                .Must(BeValidName).WithMessage("Symbol name contains invalid characters");

            RuleFor(x => x.Description)
                .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters")
                .When(x => !string.IsNullOrEmpty(x.Description));

            RuleFor(x => x.SvgContent)
                .Must(BeValidSvg).WithMessage("Invalid SVG content")
                .When(x => !string.IsNullOrEmpty(x.SvgContent));

            RuleFor(x => x.AccessLevel)
                .IsInEnum().WithMessage("Invalid access level");

            RuleFor(x => x.Tags)
                .Must(BeValidTags).WithMessage("Tags cannot contain more than 20 items or have items longer than 50 characters")
                .When(x => x.Tags != null && x.Tags.Count > 0);

            RuleFor(x => x.Properties)
                .Must(BeValidProperties).WithMessage("Properties dictionary cannot exceed 100 items")
                .When(x => x.Properties != null);

            RuleFor(x => x.Metadata)
                .Must(BeValidMetadata).WithMessage("Metadata dictionary cannot exceed 50 items")
                .When(x => x.Metadata != null);

            RuleFor(x => x.VersionNotes)
                .MaximumLength(1000).WithMessage("Version notes cannot exceed 1000 characters")
                .When(x => !string.IsNullOrEmpty(x.VersionNotes));
        }

        private bool BeValidName(string name)
        {
            return Regex.IsMatch(name, @"^[a-zA-Z0-9\s\-_().,]+$");
        }

        private bool BeValidSvg(string svgContent)
        {
            var trimmed = svgContent.Trim();
            return trimmed.StartsWith("<svg", StringComparison.OrdinalIgnoreCase) &&
                   trimmed.EndsWith("</svg>", StringComparison.OrdinalIgnoreCase);
        }

        private bool BeValidTags(List<string> tags)
        {
            if (tags.Count > 20)
                return false;

            return tags.All(tag => !string.IsNullOrWhiteSpace(tag) && tag.Length <= 50);
        }

        private bool BeValidProperties(Dictionary<string, object> properties)
        {
            return properties.Count <= 100;
        }

        private bool BeValidMetadata(Dictionary<string, object> metadata)
        {
            return metadata.Count <= 50;
        }
    }

    /// <summary>
    /// Validator for CreateSymbolCategoryDto
    /// </summary>
    public class CreateSymbolCategoryDtoValidator : AbstractValidator<CreateSymbolCategoryDto>
    {
        public CreateSymbolCategoryDtoValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Category name is required")
                .MaximumLength(255).WithMessage("Category name cannot exceed 255 characters")
                .Must(BeValidName).WithMessage("Category name contains invalid characters");

            RuleFor(x => x.Code)
                .NotEmpty().WithMessage("Category code is required")
                .MaximumLength(100).WithMessage("Category code cannot exceed 100 characters")
                .Must(BeValidCode).WithMessage("Category code must contain only uppercase letters, numbers, and underscores");

            RuleFor(x => x.Description)
                .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters")
                .When(x => !string.IsNullOrEmpty(x.Description));

            RuleFor(x => x.IconSvg)
                .Must(BeValidSvg).WithMessage("Invalid SVG content for icon")
                .When(x => !string.IsNullOrEmpty(x.IconSvg));

            RuleFor(x => x.Color)
                .Must(BeValidColor).WithMessage("Color must be a valid hex color code (#RRGGBB)")
                .When(x => !string.IsNullOrEmpty(x.Color));

            RuleFor(x => x.SortOrder)
                .GreaterThanOrEqualTo(0).WithMessage("Sort order must be non-negative");

            RuleFor(x => x.Metadata)
                .Must(BeValidMetadata).WithMessage("Metadata dictionary cannot exceed 50 items")
                .When(x => x.Metadata != null);
        }

        private bool BeValidName(string name)
        {
            return Regex.IsMatch(name, @"^[a-zA-Z0-9\s\-_().,&]+$");
        }

        private bool BeValidCode(string code)
        {
            return Regex.IsMatch(code, @"^[A-Z0-9_]+$");
        }

        private bool BeValidSvg(string svgContent)
        {
            var trimmed = svgContent.Trim();
            return trimmed.StartsWith("<svg", StringComparison.OrdinalIgnoreCase) &&
                   trimmed.EndsWith("</svg>", StringComparison.OrdinalIgnoreCase);
        }

        private bool BeValidColor(string color)
        {
            return Regex.IsMatch(color, @"^#[0-9A-Fa-f]{6}$");
        }

        private bool BeValidMetadata(Dictionary<string, object> metadata)
        {
            return metadata.Count <= 50;
        }
    }

    /// <summary>
    /// Validator for SymbolSearchDto
    /// </summary>
    public class SymbolSearchDtoValidator : AbstractValidator<SymbolSearchDto>
    {
        public SymbolSearchDtoValidator()
        {
            RuleFor(x => x.SearchTerm)
                .MaximumLength(255).WithMessage("Search term cannot exceed 255 characters")
                .When(x => !string.IsNullOrEmpty(x.SearchTerm));

            RuleFor(x => x.SymbolType)
                .IsInEnum().WithMessage("Invalid symbol type")
                .When(x => x.SymbolType.HasValue);

            RuleFor(x => x.Status)
                .IsInEnum().WithMessage("Invalid symbol status")
                .When(x => x.Status.HasValue);

            RuleFor(x => x.Tags)
                .Must(BeValidTags).WithMessage("Tags cannot contain more than 10 items or have items longer than 50 characters")
                .When(x => x.Tags != null && x.Tags.Count > 0);

            RuleFor(x => x.Standard)
                .IsInEnum().WithMessage("Invalid industry standard")
                .When(x => x.Standard.HasValue);

            RuleFor(x => x.MinRating)
                .InclusiveBetween(0, 5).WithMessage("Minimum rating must be between 0 and 5")
                .When(x => x.MinRating.HasValue);

            RuleFor(x => x.Page)
                .GreaterThan(0).WithMessage("Page must be greater than 0");

            RuleFor(x => x.PageSize)
                .InclusiveBetween(1, 100).WithMessage("Page size must be between 1 and 100");

            RuleFor(x => x.SortBy)
                .Must(BeValidSortField).WithMessage("Invalid sort field")
                .When(x => !string.IsNullOrEmpty(x.SortBy));
        }

        private bool BeValidTags(List<string> tags)
        {
            if (tags.Count > 10)
                return false;

            return tags.All(tag => !string.IsNullOrWhiteSpace(tag) && tag.Length <= 50);
        }

        private bool BeValidSortField(string sortBy)
        {
            var validSortFields = new[] { "name", "code", "createdAt", "updatedAt", "usageCount", "rating" };
            return validSortFields.Contains(sortBy.ToLowerInvariant());
        }
    }

    /// <summary>
    /// Validator for CreateSymbolFeedbackDto
    /// </summary>
    public class CreateSymbolFeedbackDtoValidator : AbstractValidator<CreateSymbolFeedbackDto>
    {
        public CreateSymbolFeedbackDtoValidator()
        {
            RuleFor(x => x.FeedbackType)
                .IsInEnum().WithMessage("Invalid feedback type");

            RuleFor(x => x.Rating)
                .InclusiveBetween(1, 5).WithMessage("Rating must be between 1 and 5")
                .When(x => x.Rating.HasValue);

            RuleFor(x => x.Title)
                .MaximumLength(255).WithMessage("Title cannot exceed 255 characters")
                .When(x => !string.IsNullOrEmpty(x.Title));

            RuleFor(x => x.Comment)
                .MaximumLength(2000).WithMessage("Comment cannot exceed 2000 characters")
                .When(x => !string.IsNullOrEmpty(x.Comment));

            RuleFor(x => x.Tags)
                .Must(BeValidTags).WithMessage("Tags cannot contain more than 10 items or have items longer than 50 characters")
                .When(x => x.Tags != null && x.Tags.Count > 0);

            // For rating feedback, rating is required
            RuleFor(x => x.Rating)
                .NotNull().WithMessage("Rating is required for rating feedback")
                .When(x => x.FeedbackType == FeedbackType.Rating);

            // For bug reports and improvements, comment is required
            RuleFor(x => x.Comment)
                .NotEmpty().WithMessage("Comment is required for bug reports and improvement suggestions")
                .When(x => x.FeedbackType == FeedbackType.Bug || x.FeedbackType == FeedbackType.Improvement);
        }

        private bool BeValidTags(List<string> tags)
        {
            if (tags.Count > 10)
                return false;

            return tags.All(tag => !string.IsNullOrWhiteSpace(tag) && tag.Length <= 50);
        }
    }
}