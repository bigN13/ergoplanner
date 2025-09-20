using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.Enums;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// BoQ Template Section entity for template section structure
    /// </summary>
    public class BoQTemplateSection : BaseEntity
    {
        public Guid TemplateId { get; set; }
        public Guid? ParentSectionId { get; set; }
        public string SectionCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public MaterialCategoryType CategoryType { get; set; }
        public int SortOrder { get; set; }
        public bool IsRequired { get; set; } = false;
        public Dictionary<string, object> Metadata { get; set; } = new();
        public List<string> Tags { get; set; } = new();

        // Navigation properties
        public virtual BoQTemplate Template { get; set; } = null!;
        public virtual BoQTemplateSection? ParentSection { get; set; }
        public virtual ICollection<BoQTemplateSection> ChildSections { get; set; } = new List<BoQTemplateSection>();
        public virtual ICollection<BoQTemplateItem> Items { get; set; } = new List<BoQTemplateItem>();
    }
}