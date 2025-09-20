using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Ergoplanner.Domain.Entities;
using Ergoplanner.Domain.Enums;
using BC = BCrypt.Net.BCrypt;

namespace Ergoplanner.Infrastructure.Persistence
{
    public static class SeedData
    {
        public static async Task InitializeAsync(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ErgoplannerDbContext>();
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<ErgoplannerDbContext>>();

            try
            {
                // Ensure database is created and migrations applied
                await context.Database.MigrateAsync();
                logger.LogInformation("Database migration completed");

                // Seed data only if database is empty
                if (!await context.Organizations.AnyAsync())
                {
                    await SeedOrganizationsAsync(context);
                    logger.LogInformation("Organizations seeded");
                }

                if (!await context.Users.AnyAsync())
                {
                    await SeedUsersAsync(context);
                    logger.LogInformation("Users seeded");
                }

                if (!await context.Projects.AnyAsync())
                {
                    await SeedProjectsAsync(context);
                    logger.LogInformation("Projects seeded");
                }

                if (!await context.Symbols.AnyAsync())
                {
                    await SeedSymbolsAsync(context);
                    logger.LogInformation("Symbols seeded");
                }

                await context.SaveChangesAsync();
                logger.LogInformation("Seed data initialization completed");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An error occurred while seeding the database");
                throw;
            }
        }

        private static async Task SeedOrganizationsAsync(ErgoplannerDbContext context)
        {
            var organizations = new List<Organization>
            {
                new Organization
                {
                    Id = Guid.Parse("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"),
                    Name = "Demo Engineering Corp",
                    Code = "DEMO",
                    Description = "Demo organization for development and testing",
                    Industry = "Water Treatment",
                    Size = "Medium",
                    Country = "USA",
                    Timezone = "America/New_York",
                    IsActive = true,
                    Settings = new Dictionary<string, object>
                    {
                        ["defaultDrawingStandard"] = "ISA-5.1",
                        ["requireApproval"] = true,
                        ["maxFileSize"] = 10485760
                    }
                },
                new Organization
                {
                    Id = Guid.NewGuid(),
                    Name = "Construction Solutions Ltd",
                    Code = "CSL",
                    Description = "Construction and infrastructure projects",
                    Industry = "Construction",
                    Size = "Large",
                    Country = "UK",
                    Timezone = "Europe/London",
                    IsActive = true
                }
            };

            await context.Organizations.AddRangeAsync(organizations);
        }

        private static async Task SeedUsersAsync(ErgoplannerDbContext context)
        {
            var demoOrgId = Guid.Parse("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");

            var users = new List<User>
            {
                new User
                {
                    Id = Guid.Parse("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12"),
                    OrganizationId = demoOrgId,
                    Email = "admin@ergoplanner.com",
                    Username = "admin",
                    PasswordHash = BC.HashPassword("Admin123!"),
                    FirstName = "Admin",
                    LastName = "User",
                    DisplayName = "System Administrator",
                    Role = UserRole.Admin,
                    IsActive = true,
                    IsVerified = true,
                    Permissions = new List<string> { "all" }
                },
                new User
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = demoOrgId,
                    Email = "john.engineer@ergoplanner.com",
                    Username = "john.engineer",
                    PasswordHash = BC.HashPassword("Engineer123!"),
                    FirstName = "John",
                    LastName = "Engineer",
                    DisplayName = "John Engineer",
                    Role = UserRole.Engineer,
                    IsActive = true,
                    IsVerified = true,
                    Permissions = new List<string> { "drawing.create", "drawing.edit", "drawing.view" }
                },
                new User
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = demoOrgId,
                    Email = "sarah.manager@ergoplanner.com",
                    Username = "sarah.manager",
                    PasswordHash = BC.HashPassword("Manager123!"),
                    FirstName = "Sarah",
                    LastName = "Manager",
                    DisplayName = "Sarah Manager",
                    Role = UserRole.Manager,
                    IsActive = true,
                    IsVerified = true,
                    Permissions = new List<string> { "project.manage", "team.manage", "approval.manage" }
                },
                new User
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = demoOrgId,
                    Email = "viewer@ergoplanner.com",
                    Username = "viewer",
                    PasswordHash = BC.HashPassword("Viewer123!"),
                    FirstName = "View",
                    LastName = "Only",
                    DisplayName = "Viewer",
                    Role = UserRole.Viewer,
                    IsActive = true,
                    IsVerified = true,
                    Permissions = new List<string> { "*.view" }
                }
            };

            await context.Users.AddRangeAsync(users);
        }

        private static async Task SeedProjectsAsync(ErgoplannerDbContext context)
        {
            var demoOrgId = Guid.Parse("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");
            var adminUserId = Guid.Parse("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12");

            var projects = new List<Project>
            {
                new Project
                {
                    Id = Guid.Parse("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13"),
                    OrganizationId = demoOrgId,
                    Name = "Water Treatment Plant Upgrade",
                    Code = "WTP-2024-001",
                    Description = "Modernization of water treatment facility with advanced filtration systems",
                    ProjectType = "Water Treatment",
                    Status = ProjectStatus.Active,
                    StartDate = DateTime.UtcNow.AddMonths(-1),
                    EndDate = DateTime.UtcNow.AddMonths(11),
                    Budget = 5000000,
                    Currency = "USD",
                    ClientName = "Municipal Water Authority",
                    CreatedBy = adminUserId,
                    UpdatedBy = adminUserId,
                    Tags = new List<string> { "water", "treatment", "municipal", "upgrade" }
                },
                new Project
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = demoOrgId,
                    Name = "Chemical Processing Plant",
                    Code = "CPP-2024-002",
                    Description = "New chemical processing facility for industrial applications",
                    ProjectType = "Chemical",
                    Status = ProjectStatus.Planning,
                    StartDate = DateTime.UtcNow.AddMonths(1),
                    EndDate = DateTime.UtcNow.AddMonths(18),
                    Budget = 8000000,
                    Currency = "USD",
                    ClientName = "ChemCorp Industries",
                    CreatedBy = adminUserId,
                    UpdatedBy = adminUserId,
                    Tags = new List<string> { "chemical", "processing", "industrial" }
                },
                new Project
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = demoOrgId,
                    Name = "Wastewater Treatment Expansion",
                    Code = "WWT-2024-003",
                    Description = "Expansion of existing wastewater treatment capacity",
                    ProjectType = "Wastewater",
                    Status = ProjectStatus.Active,
                    StartDate = DateTime.UtcNow.AddMonths(-2),
                    EndDate = DateTime.UtcNow.AddMonths(10),
                    Budget = 3500000,
                    Currency = "USD",
                    ClientName = "City Utilities Department",
                    CreatedBy = adminUserId,
                    UpdatedBy = adminUserId,
                    Tags = new List<string> { "wastewater", "expansion", "municipal" }
                }
            };

            await context.Projects.AddRangeAsync(projects);
        }

        private static async Task SeedSymbolsAsync(ErgoplannerDbContext context)
        {
            var demoOrgId = Guid.Parse("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");

            var symbols = new List<Symbol>
            {
                new Symbol
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = demoOrgId,
                    Name = "Centrifugal Pump",
                    Code = "PUMP-001",
                    Category = "Pumps",
                    Subcategory = "Centrifugal",
                    Standard = "ISA-5.1",
                    SymbolType = "Equipment",
                    SvgContent = "<svg><!-- Pump SVG content --></svg>",
                    Properties = new Dictionary<string, object>
                    {
                        ["flowRate"] = "m3/h",
                        ["pressure"] = "bar",
                        ["power"] = "kW"
                    },
                    Tags = new List<string> { "pump", "centrifugal", "equipment" },
                    IsActive = true
                },
                new Symbol
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = demoOrgId,
                    Name = "Gate Valve",
                    Code = "VALVE-001",
                    Category = "Valves",
                    Subcategory = "Gate",
                    Standard = "ISA-5.1",
                    SymbolType = "Valve",
                    SvgContent = "<svg><!-- Gate Valve SVG content --></svg>",
                    Properties = new Dictionary<string, object>
                    {
                        ["size"] = "DN",
                        ["pressure"] = "PN",
                        ["material"] = "string"
                    },
                    Tags = new List<string> { "valve", "gate", "isolation" },
                    IsActive = true
                },
                new Symbol
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = demoOrgId,
                    Name = "Storage Tank",
                    Code = "TANK-001",
                    Category = "Vessels",
                    Subcategory = "Storage",
                    Standard = "ISA-5.1",
                    SymbolType = "Vessel",
                    SvgContent = "<svg><!-- Tank SVG content --></svg>",
                    Properties = new Dictionary<string, object>
                    {
                        ["capacity"] = "m3",
                        ["diameter"] = "m",
                        ["height"] = "m",
                        ["material"] = "string"
                    },
                    Tags = new List<string> { "tank", "storage", "vessel" },
                    IsActive = true
                },
                new Symbol
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = demoOrgId,
                    Name = "Heat Exchanger",
                    Code = "HX-001",
                    Category = "Heat Transfer",
                    Subcategory = "Shell and Tube",
                    Standard = "ISA-5.1",
                    SymbolType = "Equipment",
                    SvgContent = "<svg><!-- Heat Exchanger SVG content --></svg>",
                    Properties = new Dictionary<string, object>
                    {
                        ["duty"] = "kW",
                        ["area"] = "m2",
                        ["shells"] = "number",
                        ["passes"] = "number"
                    },
                    Tags = new List<string> { "heat", "exchanger", "thermal" },
                    IsActive = true
                }
            };

            await context.Symbols.AddRangeAsync(symbols);
        }
    }
}