using System;
using System.Collections.Generic;
using System.Linq;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.Enums;
using Ergoplanner.Domain.ValueObjects;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// BoQ Section entity for hierarchical organization of BoQ items
    /// </summary>
    public class BoQSection : BaseEntity, ISoftDelete
    {
        public Guid BoQId { get; set; }
        public Guid? ParentSectionId { get; set; }
        public string SectionCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public MaterialCategoryType CategoryType { get; set; }
        public int SortOrder { get; set; }
        public bool IsExpanded { get; set; } = true;
        public Money? SectionTotal { get; set; } = new();
        public Dictionary<string, object> Metadata { get; set; } = new();
        public List<string> Tags { get; set; } = new();

        // Soft delete
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }
        public Guid? DeletedBy { get; set; }

        // Navigation properties
        public virtual BoQ BoQ { get; set; } = null!;
        public virtual BoQSection? ParentSection { get; set; }
        public virtual ICollection<BoQSection> ChildSections { get; set; } = new List<BoQSection>();
        public virtual ICollection<BoQItem> Items { get; set; } = new List<BoQItem>();
        public virtual User? CreatedByUser { get; set; }
        public virtual User? UpdatedByUser { get; set; }
        public virtual User? DeletedByUser { get; set; }

        /// <summary>
        /// Calculate section total from all items and child sections
        /// </summary>
        public void CalculateTotal()
        {
            var total = 0m;
            var currency = BoQ?.Currency ?? "USD";

            // Sum direct items
            foreach (var item in Items.Where(i => !i.IsDeleted))
            {
                if (item.TotalCost?.Amount > 0)
                {
                    total += item.TotalCost.Amount;
                }
            }

            // Sum child sections
            foreach (var childSection in ChildSections.Where(s => !s.IsDeleted))
            {
                childSection.CalculateTotal();
                if (childSection.SectionTotal?.Amount > 0)
                {
                    total += childSection.SectionTotal.Amount;
                }
            }

            SectionTotal = new Money(total, currency);
        }

        /// <summary>
        /// Get full section path (e.g., "01.01.02")
        /// </summary>
        public string GetFullPath()
        {
            var path = SectionCode;
            var current = ParentSection;

            while (current != null)
            {
                path = $"{current.SectionCode}.{path}";
                current = current.ParentSection;
            }

            return path;
        }

        /// <summary>
        /// Get section depth level
        /// </summary>
        public int GetDepthLevel()
        {
            var level = 0;
            var current = ParentSection;

            while (current != null)
            {
                level++;
                current = current.ParentSection;
            }

            return level;
        }

        /// <summary>
        /// Get all descendant sections
        /// </summary>
        public IEnumerable<BoQSection> GetAllDescendants()
        {
            var descendants = new List<BoQSection>();

            foreach (var child in ChildSections.Where(s => !s.IsDeleted))
            {
                descendants.Add(child);
                descendants.AddRange(child.GetAllDescendants());
            }

            return descendants;
        }

        /// <summary>
        /// Get all items including items from child sections
        /// </summary>
        public IEnumerable<BoQItem> GetAllItems()
        {
            var allItems = Items.Where(i => !i.IsDeleted).ToList();

            foreach (var childSection in ChildSections.Where(s => !s.IsDeleted))
            {
                allItems.AddRange(childSection.GetAllItems());
            }

            return allItems;
        }

        /// <summary>
        /// Move section to new parent
        /// </summary>
        public void MoveTo(BoQSection? newParent)
        {
            if (newParent != null)
            {
                // Prevent circular references
                if (newParent.IsDescendantOf(this))
                    throw new InvalidOperationException("Cannot move section to its own descendant");

                // Check if new parent is in the same BoQ
                if (newParent.BoQId != BoQId)
                    throw new InvalidOperationException("Cannot move section to different BoQ");
            }

            ParentSectionId = newParent?.Id;
            ParentSection = newParent;
        }

        /// <summary>
        /// Check if this section is a descendant of another section
        /// </summary>
        private bool IsDescendantOf(BoQSection potentialAncestor)
        {
            var current = ParentSection;

            while (current != null)
            {
                if (current.Id == potentialAncestor.Id)
                    return true;

                current = current.ParentSection;
            }

            return false;
        }
    }
}