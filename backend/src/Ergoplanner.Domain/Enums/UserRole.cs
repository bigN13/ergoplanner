namespace Ergoplanner.Domain.Enums
{
    /// <summary>
    /// Defines user roles for role-based access control
    /// </summary>
    public enum UserRole
    {
        /// <summary>
        /// Viewer role - Read-only access to drawings and projects
        /// </summary>
        Viewer = 0,

        /// <summary>
        /// Engineer role - Can create and edit drawings, submit for approval
        /// </summary>
        Engineer = 1,

        /// <summary>
        /// Manager role - Can approve drawings and manage projects
        /// </summary>
        Manager = 2,

        /// <summary>
        /// Admin role - Full system access including user management
        /// </summary>
        Admin = 3
    }
}