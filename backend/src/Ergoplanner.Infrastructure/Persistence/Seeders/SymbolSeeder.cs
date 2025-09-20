using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Ergoplanner.Domain.Entities;
using Ergoplanner.Domain.Enums;

namespace Ergoplanner.Infrastructure.Persistence.Seeders
{
    /// <summary>
    /// Seed data for symbol categories and templates
    /// </summary>
    public static class SymbolSeeder
    {
        public static async Task SeedAsync(ErgoplannerDbContext context)
        {
            // Get the system organization (should be created by OrganizationSeeder)
            var systemOrg = await context.Organizations
                .FirstOrDefaultAsync(o => o.Code == "SYSTEM");

            if (systemOrg == null)
            {
                throw new InvalidOperationException("System organization not found. Please run OrganizationSeeder first.");
            }

            await SeedSymbolCategoriesAsync(context, systemOrg.Id);
            await SeedSymbolTemplatesAsync(context, systemOrg.Id);
            await SaveChangesAsync(context);
        }

        private static async Task SeedSymbolCategoriesAsync(DbContext context, Guid organizationId)
        {
            var categories = new List<SymbolCategory>
            {
                // Root categories
                new SymbolCategory
                {
                    Id = Guid.Parse("11111111-1111-1111-1111-111111111101"),
                    OrganizationId = organizationId,
                    Name = "Equipment",
                    Code = "EQUIPMENT",
                    Description = "Process equipment symbols",
                    IconSvg = "<svg>...</svg>",
                    Color = "#2563eb",
                    SortOrder = 1,
                    Level = 0,
                    Path = "/EQUIPMENT",
                    IsStandard = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new SymbolCategory
                {
                    Id = Guid.Parse("11111111-1111-1111-1111-111111111102"),
                    OrganizationId = organizationId,
                    Name = "Instrumentation",
                    Code = "INSTRUMENTATION",
                    Description = "Instrumentation and control symbols",
                    IconSvg = "<svg>...</svg>",
                    Color = "#dc2626",
                    SortOrder = 2,
                    Level = 0,
                    Path = "/INSTRUMENTATION",
                    IsStandard = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new SymbolCategory
                {
                    Id = Guid.Parse("11111111-1111-1111-1111-111111111103"),
                    OrganizationId = organizationId,
                    Name = "Piping",
                    Code = "PIPING",
                    Description = "Piping and fittings symbols",
                    IconSvg = "<svg>...</svg>",
                    Color = "#059669",
                    SortOrder = 3,
                    Level = 0,
                    Path = "/PIPING",
                    IsStandard = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new SymbolCategory
                {
                    Id = Guid.Parse("11111111-1111-1111-1111-111111111104"),
                    OrganizationId = organizationId,
                    Name = "Valves",
                    Code = "VALVES",
                    Description = "Control and isolation valves",
                    IconSvg = "<svg>...</svg>",
                    Color = "#7c3aed",
                    SortOrder = 4,
                    Level = 0,
                    Path = "/VALVES",
                    IsStandard = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },

                // Equipment subcategories
                new SymbolCategory
                {
                    Id = Guid.Parse("11111111-1111-1111-1111-111111111201"),
                    OrganizationId = organizationId,
                    ParentCategoryId = Guid.Parse("11111111-1111-1111-1111-111111111101"),
                    Name = "Pumps",
                    Code = "PUMPS",
                    Description = "Centrifugal, positive displacement, and specialty pumps",
                    SortOrder = 1,
                    Level = 1,
                    Path = "/EQUIPMENT/PUMPS",
                    IsStandard = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new SymbolCategory
                {
                    Id = Guid.Parse("11111111-1111-1111-1111-111111111202"),
                    OrganizationId = organizationId,
                    ParentCategoryId = Guid.Parse("11111111-1111-1111-1111-111111111101"),
                    Name = "Tanks & Vessels",
                    Code = "TANKS_VESSELS",
                    Description = "Storage tanks, pressure vessels, and reactors",
                    SortOrder = 2,
                    Level = 1,
                    Path = "/EQUIPMENT/TANKS_VESSELS",
                    IsStandard = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new SymbolCategory
                {
                    Id = Guid.Parse("11111111-1111-1111-1111-111111111203"),
                    OrganizationId = organizationId,
                    ParentCategoryId = Guid.Parse("11111111-1111-1111-1111-111111111101"),
                    Name = "Heat Exchangers",
                    Code = "HEAT_EXCHANGERS",
                    Description = "Shell and tube, plate, and air coolers",
                    SortOrder = 3,
                    Level = 1,
                    Path = "/EQUIPMENT/HEAT_EXCHANGERS",
                    IsStandard = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },

                // Instrumentation subcategories
                new SymbolCategory
                {
                    Id = Guid.Parse("11111111-1111-1111-1111-111111111301"),
                    OrganizationId = organizationId,
                    ParentCategoryId = Guid.Parse("11111111-1111-1111-1111-111111111102"),
                    Name = "Flow Instruments",
                    Code = "FLOW_INSTRUMENTS",
                    Description = "Flow meters, transmitters, and indicators",
                    SortOrder = 1,
                    Level = 1,
                    Path = "/INSTRUMENTATION/FLOW_INSTRUMENTS",
                    IsStandard = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new SymbolCategory
                {
                    Id = Guid.Parse("11111111-1111-1111-1111-111111111302"),
                    OrganizationId = organizationId,
                    ParentCategoryId = Guid.Parse("11111111-1111-1111-1111-111111111102"),
                    Name = "Pressure Instruments",
                    Code = "PRESSURE_INSTRUMENTS",
                    Description = "Pressure gauges, transmitters, and switches",
                    SortOrder = 2,
                    Level = 1,
                    Path = "/INSTRUMENTATION/PRESSURE_INSTRUMENTS",
                    IsStandard = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new SymbolCategory
                {
                    Id = Guid.Parse("11111111-1111-1111-1111-111111111303"),
                    OrganizationId = organizationId,
                    ParentCategoryId = Guid.Parse("11111111-1111-1111-1111-111111111102"),
                    Name = "Temperature Instruments",
                    Code = "TEMPERATURE_INSTRUMENTS",
                    Description = "Temperature sensors, transmitters, and indicators",
                    SortOrder = 3,
                    Level = 1,
                    Path = "/INSTRUMENTATION/TEMPERATURE_INSTRUMENTS",
                    IsStandard = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },

                // Valve subcategories
                new SymbolCategory
                {
                    Id = Guid.Parse("11111111-1111-1111-1111-111111111401"),
                    OrganizationId = organizationId,
                    ParentCategoryId = Guid.Parse("11111111-1111-1111-1111-111111111104"),
                    Name = "Control Valves",
                    Code = "CONTROL_VALVES",
                    Description = "Pneumatic, electric, and manual control valves",
                    SortOrder = 1,
                    Level = 1,
                    Path = "/VALVES/CONTROL_VALVES",
                    IsStandard = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new SymbolCategory
                {
                    Id = Guid.Parse("11111111-1111-1111-1111-111111111402"),
                    OrganizationId = organizationId,
                    ParentCategoryId = Guid.Parse("11111111-1111-1111-1111-111111111104"),
                    Name = "Safety Valves",
                    Code = "SAFETY_VALVES",
                    Description = "Relief valves, safety valves, and rupture discs",
                    SortOrder = 2,
                    Level = 1,
                    Path = "/VALVES/SAFETY_VALVES",
                    IsStandard = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new SymbolCategory
                {
                    Id = Guid.Parse("11111111-1111-1111-1111-111111111403"),
                    OrganizationId = organizationId,
                    ParentCategoryId = Guid.Parse("11111111-1111-1111-1111-111111111104"),
                    Name = "Isolation Valves",
                    Code = "ISOLATION_VALVES",
                    Description = "Gate, ball, and butterfly valves",
                    SortOrder = 3,
                    Level = 1,
                    Path = "/VALVES/ISOLATION_VALVES",
                    IsStandard = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            foreach (var category in categories)
            {
                var existing = await context.Set<SymbolCategory>()
                    .FirstOrDefaultAsync(c => c.Code == category.Code && c.OrganizationId == organizationId);

                if (existing == null)
                {
                    await context.Set<SymbolCategory>().AddAsync(category);
                }
            }
        }

        private static async Task SeedSymbolTemplatesAsync(DbContext context, Guid organizationId)
        {
            var templates = new List<SymbolTemplate>
            {
                new SymbolTemplate
                {
                    Id = Guid.Parse("22222222-2222-2222-2222-222222222201"),
                    OrganizationId = organizationId,
                    CategoryId = Guid.Parse("11111111-1111-1111-1111-111111111201"), // Pumps
                    Name = "Centrifugal Pump",
                    Code = "PUMP_CENTRIFUGAL",
                    Description = "Standard centrifugal pump symbol template",
                    SymbolType = SymbolType.Pump,
                    BaseSvgContent = GetCentrifugalPumpSvg(),
                    DefaultProperties = new Dictionary<string, object>
                    {
                        { "FlowRate", "100 m³/h" },
                        { "Head", "50 m" },
                        { "Power", "15 kW" },
                        { "Efficiency", "75%" },
                        { "Material", "Cast Iron" }
                    },
                    Tags = new List<string> { "pump", "centrifugal", "equipment" },
                    IsStandard = true,
                    AccessLevel = AccessLevel.Public,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new SymbolTemplate
                {
                    Id = Guid.Parse("22222222-2222-2222-2222-222222222202"),
                    OrganizationId = organizationId,
                    CategoryId = Guid.Parse("11111111-1111-1111-1111-111111111202"), // Tanks & Vessels
                    Name = "Storage Tank",
                    Code = "TANK_STORAGE",
                    Description = "Standard storage tank symbol template",
                    SymbolType = SymbolType.Tank,
                    BaseSvgContent = GetStorageTankSvg(),
                    DefaultProperties = new Dictionary<string, object>
                    {
                        { "Volume", "1000 m³" },
                        { "Diameter", "10 m" },
                        { "Height", "12 m" },
                        { "Material", "Carbon Steel" },
                        { "Design Pressure", "Atmospheric" }
                    },
                    Tags = new List<string> { "tank", "storage", "vessel" },
                    IsStandard = true,
                    AccessLevel = AccessLevel.Public,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new SymbolTemplate
                {
                    Id = Guid.Parse("22222222-2222-2222-2222-222222222203"),
                    OrganizationId = organizationId,
                    CategoryId = Guid.Parse("11111111-1111-1111-1111-111111111401"), // Control Valves
                    Name = "Control Valve",
                    Code = "VALVE_CONTROL",
                    Description = "Standard control valve symbol template",
                    SymbolType = SymbolType.Valve,
                    BaseSvgContent = GetControlValveSvg(),
                    DefaultProperties = new Dictionary<string, object>
                    {
                        { "Size", "4 inch" },
                        { "Cv", "100" },
                        { "Material", "Stainless Steel" },
                        { "Actuator", "Pneumatic" },
                        { "FailPosition", "Fail Close" }
                    },
                    Tags = new List<string> { "valve", "control", "pneumatic" },
                    IsStandard = true,
                    AccessLevel = AccessLevel.Public,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new SymbolTemplate
                {
                    Id = Guid.Parse("22222222-2222-2222-2222-222222222204"),
                    OrganizationId = organizationId,
                    CategoryId = Guid.Parse("11111111-1111-1111-1111-111111111301"), // Flow Instruments
                    Name = "Flow Transmitter",
                    Code = "FT_ORIFICE",
                    Description = "Orifice plate flow transmitter",
                    SymbolType = SymbolType.Instrumentation,
                    BaseSvgContent = GetFlowTransmitterSvg(),
                    DefaultProperties = new Dictionary<string, object>
                    {
                        { "Range", "0-1000 m³/h" },
                        { "Accuracy", "±0.5%" },
                        { "Output", "4-20 mA" },
                        { "Material", "Stainless Steel" },
                        { "Connection", "Flanged" }
                    },
                    Tags = new List<string> { "flow", "transmitter", "orifice", "instrument" },
                    IsStandard = true,
                    AccessLevel = AccessLevel.Public,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            foreach (var template in templates)
            {
                var existing = await context.Set<SymbolTemplate>()
                    .FirstOrDefaultAsync(t => t.Code == template.Code && t.OrganizationId == organizationId);

                if (existing == null)
                {
                    await context.Set<SymbolTemplate>().AddAsync(template);
                }
            }
        }

        private static string GetCentrifugalPumpSvg()
        {
            return @"<svg width=""80"" height=""60"" viewBox=""0 0 80 60"" xmlns=""http://www.w3.org/2000/svg"">
  <circle cx=""30"" cy=""30"" r=""20"" fill=""none"" stroke=""black"" stroke-width=""2""/>
  <path d=""M50 30 L70 30"" stroke=""black"" stroke-width=""2""/>
  <path d=""M10 30 L30 30"" stroke=""black"" stroke-width=""2""/>
  <text x=""30"" y=""35"" text-anchor=""middle"" font-size=""12"">P</text>
</svg>";
        }

        private static string GetStorageTankSvg()
        {
            return @"<svg width=""60"" height=""80"" viewBox=""0 0 60 80"" xmlns=""http://www.w3.org/2000/svg"">
  <rect x=""10"" y=""20"" width=""40"" height=""50"" fill=""none"" stroke=""black"" stroke-width=""2""/>
  <ellipse cx=""30"" cy=""20"" rx=""20"" ry=""5"" fill=""none"" stroke=""black"" stroke-width=""2""/>
  <ellipse cx=""30"" cy=""70"" rx=""20"" ry=""5"" fill=""none"" stroke=""black"" stroke-width=""2""/>
  <text x=""30"" y=""48"" text-anchor=""middle"" font-size=""12"">T</text>
</svg>";
        }

        private static string GetControlValveSvg()
        {
            return @"<svg width=""80"" height=""40"" viewBox=""0 0 80 40"" xmlns=""http://www.w3.org/2000/svg"">
  <path d=""M10 20 L30 20"" stroke=""black"" stroke-width=""2""/>
  <path d=""M50 20 L70 20"" stroke=""black"" stroke-width=""2""/>
  <polygon points=""30,10 50,10 45,20 35,20"" fill=""none"" stroke=""black"" stroke-width=""2""/>
  <polygon points=""30,30 50,30 45,20 35,20"" fill=""none"" stroke=""black"" stroke-width=""2""/>
  <rect x=""37"" y=""5"" width=""6"" height=""10"" fill=""none"" stroke=""black"" stroke-width=""1""/>
  <text x=""40"" y=""23"" text-anchor=""middle"" font-size=""8"">CV</text>
</svg>";
        }

        private static string GetFlowTransmitterSvg()
        {
            return @"<svg width=""60"" height=""40"" viewBox=""0 0 60 40"" xmlns=""http://www.w3.org/2000/svg"">
  <path d=""M5 20 L25 20"" stroke=""black"" stroke-width=""2""/>
  <path d=""M35 20 L55 20"" stroke=""black"" stroke-width=""2""/>
  <circle cx=""30"" cy=""20"" r=""10"" fill=""none"" stroke=""black"" stroke-width=""2""/>
  <circle cx=""30"" cy=""20"" r=""3"" fill=""black""/>
  <path d=""M30 10 L30 5"" stroke=""black"" stroke-width=""1""/>
  <rect x=""25"" y=""2"" width=""10"" height=""6"" fill=""none"" stroke=""black"" stroke-width=""1""/>
  <text x=""30"" y=""6"" text-anchor=""middle"" font-size=""6"">FT</text>
</svg>";
        }

        private static async Task SaveChangesAsync(DbContext context)
        {
            await context.SaveChangesAsync();
        }
    }
}