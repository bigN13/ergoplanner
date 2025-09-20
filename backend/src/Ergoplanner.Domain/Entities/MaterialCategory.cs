using System;
using System.Collections.Generic;
using System.Linq;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.Enums;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Material Category entity for hierarchical categorization
    /// </summary>
    public class MaterialCategory : BaseEntity, IOrganizationScoped, ISoftDelete
    {
        public Guid OrganizationId { get; set; }
        public Guid? ParentCategoryId { get; set; }
        public string CategoryCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public MaterialCategoryType CategoryType { get; set; }
        public string? Icon { get; set; }
        public string? Color { get; set; }
        public int SortOrder { get; set; }
        public bool IsSystem { get; set; } = false; // System categories cannot be deleted
        public bool IsActive { get; set; } = true;
        public Dictionary<string, object> DefaultProperties { get; set; } = new(); // Default properties for materials in this category
        public Dictionary<string, object> RequiredSpecifications { get; set; } = new(); // Required specs for materials
        public Dictionary<string, object> Metadata { get; set; } = new();
        public List<string> Tags { get; set; } = new();

        // Soft delete
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }
        public Guid? DeletedBy { get; set; }

        // Navigation properties
        public virtual Organization Organization { get; set; } = null!;
        public virtual MaterialCategory? ParentCategory { get; set; }
        public virtual ICollection<MaterialCategory> ChildCategories { get; set; } = new List<MaterialCategory>();
        public virtual ICollection<Material> Materials { get; set; } = new List<Material>();
        public virtual User? CreatedByUser { get; set; }
        public virtual User? UpdatedByUser { get; set; }
        public virtual User? DeletedByUser { get; set; }

        /// <summary>
        /// Get full category path (e.g., "Equipment > Pumps > Centrifugal")
        /// </summary>
        public string GetFullPath(string separator = " > ")
        {
            var path = Name;
            var current = ParentCategory;

            while (current != null)
            {
                path = $"{current.Name}{separator}{path}";
                current = current.ParentCategory;
            }

            return path;
        }

        /// <summary>
        /// Get category code path (e.g., "EQ.PUMP.CENT")
        /// </summary>
        public string GetCodePath(string separator = ".")
        {
            var path = CategoryCode;
            var current = ParentCategory;

            while (current != null)
            {
                path = $"{current.CategoryCode}{separator}{path}";
                current = current.ParentCategory;
            }

            return path;
        }

        /// <summary>
        /// Get category depth level
        /// </summary>
        public int GetDepthLevel()
        {
            var level = 0;
            var current = ParentCategory;

            while (current != null)
            {
                level++;
                current = current.ParentCategory;
            }

            return level;
        }

        /// <summary>
        /// Get all descendant categories
        /// </summary>
        public IEnumerable<MaterialCategory> GetAllDescendants()
        {
            var descendants = new List<MaterialCategory>();

            foreach (var child in ChildCategories.Where(c => !c.IsDeleted && c.IsActive))
            {
                descendants.Add(child);
                descendants.AddRange(child.GetAllDescendants());
            }

            return descendants;
        }

        /// <summary>
        /// Get all materials including materials from child categories
        /// </summary>
        public IEnumerable<Material> GetAllMaterials()
        {
            var allMaterials = Materials.Where(m => !m.IsDeleted && m.IsActive).ToList();

            foreach (var childCategory in ChildCategories.Where(c => !c.IsDeleted && c.IsActive))
            {
                allMaterials.AddRange(childCategory.GetAllMaterials());
            }

            return allMaterials;
        }

        /// <summary>
        /// Move category to new parent
        /// </summary>
        public void MoveTo(MaterialCategory? newParent)
        {
            if (newParent != null)
            {
                // Prevent circular references
                if (newParent.IsDescendantOf(this))
                    throw new InvalidOperationException("Cannot move category to its own descendant");

                // Check if new parent is in the same organization
                if (newParent.OrganizationId != OrganizationId)
                    throw new InvalidOperationException("Cannot move category to different organization");
            }

            ParentCategoryId = newParent?.Id;
            ParentCategory = newParent;
        }

        /// <summary>
        /// Check if this category is a descendant of another category
        /// </summary>
        private bool IsDescendantOf(MaterialCategory potentialAncestor)
        {
            var current = ParentCategory;

            while (current != null)
            {
                if (current.Id == potentialAncestor.Id)
                    return true;

                current = current.ParentCategory;
            }

            return false;
        }

        /// <summary>
        /// Check if category can be deleted
        /// </summary>
        public bool CanDelete()
        {
            if (IsSystem)
                return false;

            // Cannot delete if it has active materials or child categories
            return !Materials.Any(m => !m.IsDeleted) &&
                   !ChildCategories.Any(c => !c.IsDeleted);
        }

        /// <summary>
        /// Get material count including child categories
        /// </summary>
        public int GetMaterialCount(bool includeChildren = true)
        {
            var count = Materials.Count(m => !m.IsDeleted && m.IsActive);

            if (includeChildren)
            {
                foreach (var child in ChildCategories.Where(c => !c.IsDeleted && c.IsActive))
                {
                    count += child.GetMaterialCount(true);
                }
            }

            return count;
        }

        /// <summary>
        /// Generate next category code for child categories
        /// </summary>
        public string GenerateChildCategoryCode()
        {
            var existingCodes = ChildCategories
                .Where(c => !c.IsDeleted)
                .Select(c => c.CategoryCode)
                .ToList();

            var counter = 1;
            string newCode;

            do
            {
                newCode = $"{CategoryCode}{counter:D2}";
                counter++;
            }
            while (existingCodes.Contains(newCode));

            return newCode;
        }
    }
}