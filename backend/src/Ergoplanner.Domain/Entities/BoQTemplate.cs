using System;
using System.Collections.Generic;
using System.Linq;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.Enums;
using Ergoplanner.Domain.ValueObjects;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// BoQ Template entity for reusable BoQ structures
    /// </summary>
    public class BoQTemplate : BaseEntity, IOrganizationScoped, ISoftDelete
    {
        public Guid OrganizationId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Industry { get; set; }
        public string? ProjectType { get; set; }
        public MaterialCategoryType? PrimaryCategory { get; set; }
        public string Currency { get; set; } = "USD";
        public bool IsPublic { get; set; } = false;
        public bool IsStandard { get; set; } = false;
        public string? Version { get; set; } = "1.0";
        public DateTime? EffectiveDate { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public Dictionary<string, object> Structure { get; set; } = new(); // JSON structure of sections and items
        public Dictionary<string, object> DefaultSettings { get; set; } = new();
        public Dictionary<string, object> Metadata { get; set; } = new();
        public List<string> Tags { get; set; } = new();
        public int UsageCount { get; set; } = 0;
        public decimal? Rating { get; set; }

        // Soft delete
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }
        public Guid? DeletedBy { get; set; }

        // Navigation properties
        public virtual Organization Organization { get; set; } = null!;
        public virtual ICollection<BoQ> BoQs { get; set; } = new List<BoQ>();
        public virtual ICollection<BoQTemplateSection> Sections { get; set; } = new List<BoQTemplateSection>();
        public virtual ICollection<BoQTemplateFeedback> Feedback { get; set; } = new List<BoQTemplateFeedback>();
        public virtual User? CreatedByUser { get; set; }
        public virtual User? UpdatedByUser { get; set; }
        public virtual User? DeletedByUser { get; set; }

        /// <summary>
        /// Create BoQ from this template
        /// </summary>
        public BoQ CreateBoQ(Guid projectId, string boqName, Guid? drawingId = null)
        {
            var boq = new BoQ
            {
                ProjectId = projectId,
                DrawingId = drawingId,
                BoQNumber = GenerateBoQNumber(),
                Name = boqName,
                Description = $"Created from template: {Name}",
                Currency = Currency,
                TemplateId = Id,
                OrganizationId = OrganizationId
            };

            // Copy sections and items from template
            CopySectionsToBoQ(boq);

            // Increment usage count
            UsageCount++;

            return boq;
        }

        /// <summary>
        /// Copy template sections to BoQ
        /// </summary>
        private void CopySectionsToBoQ(BoQ boq)
        {
            var sectionMapping = new Dictionary<Guid, Guid>();

            // First pass: create all sections
            foreach (var templateSection in Sections)
            {
                var section = new BoQSection
                {
                    BoQId = boq.Id,
                    SectionCode = templateSection.SectionCode,
                    Name = templateSection.Name,
                    Description = templateSection.Description,
                    CategoryType = templateSection.CategoryType,
                    SortOrder = templateSection.SortOrder,
                    Metadata = new Dictionary<string, object>(templateSection.Metadata)
                };

                boq.Sections.Add(section);
                sectionMapping[templateSection.Id] = section.Id;
            }

            // Second pass: set parent relationships
            foreach (var templateSection in Sections)
            {
                if (templateSection.ParentSectionId.HasValue &&
                    sectionMapping.TryGetValue(templateSection.ParentSectionId.Value, out var parentId))
                {
                    var section = boq.Sections.First(s => sectionMapping[templateSection.Id] == s.Id);
                    section.ParentSectionId = parentId;
                }
            }

            // Third pass: copy template items
            foreach (var templateSection in Sections)
            {
                var section = boq.Sections.First(s => sectionMapping[templateSection.Id] == s.Id);

                foreach (var templateItem in templateSection.Items)
                {
                    var item = new BoQItem
                    {
                        ProjectId = boq.ProjectId,
                        DrawingId = boq.DrawingId,
                        SectionId = section.Id,
                        ItemCode = templateItem.ItemCode,
                        Description = templateItem.Description,
                        Specification = templateItem.Specification,
                        Unit = templateItem.Unit,
                        Quantity = new Quantity(0, templateItem.Unit ?? "ea"),
                        UnitPrice = templateItem.UnitPrice,
                        CostType = templateItem.CostType,
                        Metadata = new Dictionary<string, object>(templateItem.Metadata)
                    };

                    section.Items.Add(item);
                }
            }
        }

        /// <summary>
        /// Generate unique BoQ number
        /// </summary>
        private string GenerateBoQNumber()
        {
            // This would typically follow organization's numbering convention
            return $"BOQ-{DateTime.UtcNow:yyyyMM}-{Guid.NewGuid().ToString("N")[..8].ToUpper()}";
        }

        /// <summary>
        /// Validate template structure
        /// </summary>
        public bool IsValid()
        {
            // Check for circular references in sections
            foreach (var section in Sections)
            {
                if (HasCircularReference(section, new HashSet<Guid>()))
                    return false;
            }

            // Check for duplicate section codes
            var sectionCodes = Sections.Select(s => s.SectionCode).ToList();
            if (sectionCodes.Count != sectionCodes.Distinct().Count())
                return false;

            return true;
        }

        /// <summary>
        /// Check for circular references in section hierarchy
        /// </summary>
        private bool HasCircularReference(BoQTemplateSection section, HashSet<Guid> visited)
        {
            if (visited.Contains(section.Id))
                return true;

            visited.Add(section.Id);

            if (section.ParentSectionId.HasValue)
            {
                var parent = Sections.FirstOrDefault(s => s.Id == section.ParentSectionId.Value);
                if (parent != null && HasCircularReference(parent, new HashSet<Guid>(visited)))
                    return true;
            }

            return false;
        }
    }
}