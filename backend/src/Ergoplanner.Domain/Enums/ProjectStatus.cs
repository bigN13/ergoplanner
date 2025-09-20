namespace Ergoplanner.Domain.Enums
{
    /// <summary>
    /// Defines project status states
    /// </summary>
    public enum ProjectStatus
    {
        /// <summary>
        /// Project is in planning phase
        /// </summary>
        Planning = 0,

        /// <summary>
        /// Project is active and in progress
        /// </summary>
        Active = 1,

        /// <summary>
        /// Project is on hold
        /// </summary>
        OnHold = 2,

        /// <summary>
        /// Project is completed
        /// </summary>
        Completed = 3,

        /// <summary>
        /// Project is cancelled
        /// </summary>
        Cancelled = 4,

        /// <summary>
        /// Project is archived
        /// </summary>
        Archived = 5
    }
}