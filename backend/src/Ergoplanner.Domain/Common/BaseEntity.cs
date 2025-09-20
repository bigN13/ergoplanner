using System;

namespace Ergoplanner.Domain.Common
{
    /// <summary>
    /// Base entity class with common properties
    /// </summary>
    public abstract class BaseEntity
    {
        public Guid Id { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public Guid? CreatedBy { get; set; }
        public Guid? UpdatedBy { get; set; }

        protected BaseEntity()
        {
            Id = Guid.NewGuid();
            CreatedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }
    }

    /// <summary>
    /// Interface for soft delete functionality
    /// </summary>
    public interface ISoftDelete
    {
        bool IsDeleted { get; set; }
        DateTime? DeletedAt { get; set; }
        Guid? DeletedBy { get; set; }
    }

    /// <summary>
    /// Interface for entities that belong to an organization
    /// </summary>
    public interface IOrganizationScoped
    {
        Guid OrganizationId { get; set; }
    }
}