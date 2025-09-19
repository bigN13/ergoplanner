# Business Logic Documents - Ergoplanner AI Suite

## Table of Contents
1. [P&ID Validation Rules](#pid-validation-rules)
2. [BoQ Calculation Algorithms](#boq-calculation-algorithms)
3. [Approval Workflow State Machines](#approval-workflow-state-machines)
4. [Version Control Branching Strategies](#version-control-branching-strategies)
5. [Business Rule Validation Matrices](#business-rule-validation-matrices)
6. [Drawing Intelligence Rules](#drawing-intelligence-rules)
7. [Engineering Calculation Formulas](#engineering-calculation-formulas)
8. [Conflict Resolution Algorithms](#conflict-resolution-algorithms)
9. [Data Consistency Rules](#data-consistency-rules)

---

## 1. P&ID Validation Rules

### 1.1 Pipe Continuity Rules

#### Diameter Continuity
```csharp
public class PipeDiameterValidation
{
    public const double DIAMETER_TOLERANCE = 0.05; // 5% tolerance

    public ValidationResult ValidateDiameterContinuity(Pipe upstream, Pipe downstream)
    {
        // Rule: Diameter changes require reducer/expander
        if (Math.Abs(upstream.Diameter - downstream.Diameter) > DIAMETER_TOLERANCE)
        {
            if (!HasReducerBetween(upstream, downstream))
            {
                return new ValidationResult
                {
                    IsValid = false,
                    ErrorCode = "PIPE_001",
                    Message = $"Diameter change from {upstream.Diameter}mm to {downstream.Diameter}mm requires reducer/expander",
                    Severity = ValidationSeverity.Error
                };
            }
        }
        return ValidationResult.Success;
    }
}
```

#### Material Compatibility Matrix
```csharp
public static class MaterialCompatibility
{
    private static readonly Dictionary<string, List<string>> CompatibleMaterials = new()
    {
        ["CS"] = new() { "CS", "SS304", "SS316" },      // Carbon Steel
        ["SS304"] = new() { "CS", "SS304", "SS316" },   // Stainless Steel 304
        ["SS316"] = new() { "CS", "SS304", "SS316" },   // Stainless Steel 316
        ["PVC"] = new() { "PVC", "CPVC" },              // PVC
        ["CPVC"] = new() { "PVC", "CPVC" },             // CPVC
        ["HDPE"] = new() { "HDPE", "PP" },              // HDPE
        ["PP"] = new() { "HDPE", "PP" },                // Polypropylene
        ["GRP"] = new() { "GRP" },                      // Glass Reinforced Plastic
        ["CI"] = new() { "CI", "DI", "CS" },            // Cast Iron
        ["DI"] = new() { "CI", "DI", "CS" }             // Ductile Iron
    };

    public static bool AreCompatible(string material1, string material2)
    {
        return CompatibleMaterials.ContainsKey(material1) &&
               CompatibleMaterials[material1].Contains(material2);
    }
}
```

#### Pressure Rating Validation
```csharp
public class PressureRatingValidation
{
    public ValidationResult ValidatePressureRating(Component component)
    {
        double maxOperatingPressure = component.OperatingPressure * 1.1; // 10% safety margin

        if (component.PressureRating < maxOperatingPressure)
        {
            return new ValidationResult
            {
                IsValid = false,
                ErrorCode = "PRESS_001",
                Message = $"Component {component.Tag} pressure rating ({component.PressureRating} bar) " +
                          $"is insufficient for operating pressure ({component.OperatingPressure} bar)",
                Severity = ValidationSeverity.Critical
            };
        }

        // ANSI Pressure Classes
        double[] ansiClasses = { 150, 300, 600, 900, 1500, 2500 }; // in PSI
        double pressurePsi = component.PressureRating * 14.5038; // Convert bar to PSI

        if (!ansiClasses.Any(c => Math.Abs(c - pressurePsi) < 10))
        {
            return new ValidationResult
            {
                IsValid = false,
                ErrorCode = "PRESS_002",
                Message = $"Non-standard pressure class: {pressurePsi} PSI",
                Severity = ValidationSeverity.Warning
            };
        }

        return ValidationResult.Success;
    }
}
```

### 1.2 Flow Direction Validation

```csharp
public class FlowDirectionValidator
{
    public ValidationResult ValidateFlowDirection(Drawing drawing)
    {
        var violations = new List<string>();

        foreach (var component in drawing.Components)
        {
            switch (component.Type)
            {
                case ComponentType.CheckValve:
                    if (component.FlowDirection == FlowDirection.Bidirectional)
                    {
                        violations.Add($"Check valve {component.Tag} cannot have bidirectional flow");
                    }
                    break;

                case ComponentType.ReliefValve:
                    if (component.InletPressure < component.SetPressure * 0.9)
                    {
                        violations.Add($"Relief valve {component.Tag} inlet pressure too low");
                    }
                    break;

                case ComponentType.Pump:
                    if (component.OutletPressure <= component.InletPressure)
                    {
                        violations.Add($"Pump {component.Tag} must increase pressure");
                    }
                    break;
            }
        }

        return violations.Any()
            ? new ValidationResult { IsValid = false, Messages = violations }
            : ValidationResult.Success;
    }
}
```

### 1.3 Tag Naming Conventions

```csharp
public class TagNamingConvention
{
    // ISA-5.1 Standard Tag Format: [Area]-[Type][Number][Suffix]
    private static readonly Regex TagPattern = new Regex(
        @"^(?<area>[A-Z]{1,2}\d{2})-(?<type>[A-Z]{1,3})(?<number>\d{3,4})(?<suffix>[A-Z])?$",
        RegexOptions.Compiled
    );

    private static readonly Dictionary<string, string> ComponentPrefixes = new()
    {
        ["Pump"] = "P",
        ["Valve"] = "V",
        ["Tank"] = "TK",
        ["HeatExchanger"] = "HX",
        ["Compressor"] = "C",
        ["Vessel"] = "V",
        ["Column"] = "T",
        ["Instrument"] = "I",
        ["ControlValve"] = "CV",
        ["ReliefValve"] = "RV",
        ["FlowMeter"] = "FI",
        ["PressureIndicator"] = "PI",
        ["TemperatureIndicator"] = "TI",
        ["LevelIndicator"] = "LI"
    };

    public ValidationResult ValidateTag(string tag, string componentType)
    {
        if (!TagPattern.IsMatch(tag))
        {
            return new ValidationResult
            {
                IsValid = false,
                ErrorCode = "TAG_001",
                Message = $"Tag '{tag}' does not match ISA-5.1 format",
                Severity = ValidationSeverity.Error
            };
        }

        var match = TagPattern.Match(tag);
        var typePrefix = match.Groups["type"].Value;

        if (ComponentPrefixes.ContainsKey(componentType) &&
            !typePrefix.StartsWith(ComponentPrefixes[componentType]))
        {
            return new ValidationResult
            {
                IsValid = false,
                ErrorCode = "TAG_002",
                Message = $"Component type '{componentType}' should use prefix '{ComponentPrefixes[componentType]}'",
                Severity = ValidationSeverity.Warning
            };
        }

        return ValidationResult.Success;
    }
}
```

### 1.4 Loop Detection Algorithm

```csharp
public class LoopDetector
{
    public List<List<string>> DetectLoops(Dictionary<string, List<string>> connections)
    {
        var loops = new List<List<string>>();
        var visited = new HashSet<string>();
        var recursionStack = new HashSet<string>();
        var path = new Stack<string>();

        foreach (var node in connections.Keys)
        {
            if (!visited.Contains(node))
            {
                DetectLoopsDFS(node, connections, visited, recursionStack, path, loops);
            }
        }

        return loops;
    }

    private void DetectLoopsDFS(
        string node,
        Dictionary<string, List<string>> connections,
        HashSet<string> visited,
        HashSet<string> recursionStack,
        Stack<string> path,
        List<List<string>> loops)
    {
        visited.Add(node);
        recursionStack.Add(node);
        path.Push(node);

        if (connections.ContainsKey(node))
        {
            foreach (var neighbor in connections[node])
            {
                if (!visited.Contains(neighbor))
                {
                    DetectLoopsDFS(neighbor, connections, visited, recursionStack, path, loops);
                }
                else if (recursionStack.Contains(neighbor))
                {
                    // Loop detected
                    var loop = new List<string>();
                    var tempStack = new Stack<string>(path.Reverse());

                    while (tempStack.Count > 0)
                    {
                        var item = tempStack.Pop();
                        loop.Add(item);
                        if (item == neighbor) break;
                    }

                    loops.Add(loop);
                }
            }
        }

        path.Pop();
        recursionStack.Remove(node);
    }
}
```

---

## 2. BoQ Calculation Algorithms

### 2.1 Component Counting Logic

```csharp
public class BoQCalculator
{
    public class BoQItem
    {
        public string ItemCode { get; set; }
        public string Description { get; set; }
        public string Unit { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitCost { get; set; }
        public decimal MarkupPercentage { get; set; } = 15.0m; // Default 15% markup
        public decimal TotalCost => Quantity * UnitCost * (1 + MarkupPercentage / 100);
    }

    public List<BoQItem> CalculateBoQ(Drawing drawing)
    {
        var boqItems = new Dictionary<string, BoQItem>();

        // Group components by type and specifications
        var groupedComponents = drawing.Components
            .GroupBy(c => new
            {
                c.Type,
                c.Size,
                c.Material,
                c.PressureRating,
                c.Specification
            });

        foreach (var group in groupedComponents)
        {
            var key = GenerateItemCode(group.Key);
            var quantity = CalculateQuantity(group);

            boqItems[key] = new BoQItem
            {
                ItemCode = key,
                Description = GenerateDescription(group.Key),
                Unit = GetUnit(group.Key.Type),
                Quantity = quantity,
                UnitCost = GetUnitCost(group.Key)
            };
        }

        // Add piping quantities
        AddPipingQuantities(drawing, boqItems);

        // Add fittings based on connections
        AddFittingQuantities(drawing, boqItems);

        // Add insulation if required
        AddInsulationQuantities(drawing, boqItems);

        return boqItems.Values.OrderBy(i => i.ItemCode).ToList();
    }

    private decimal CalculateQuantity(IGrouping<dynamic, Component> group)
    {
        decimal quantity = group.Count();

        // Apply rounding rules based on component type
        var componentType = group.Key.Type;

        return componentType switch
        {
            ComponentType.Pipe => Math.Ceiling(quantity / 6) * 6, // Round up to nearest 6m length
            ComponentType.Bolt => Math.Ceiling(quantity / 10) * 10, // Round up to nearest 10
            ComponentType.Gasket => Math.Ceiling(quantity * 1.1m), // Add 10% spare
            _ => quantity
        };
    }

    private void AddPipingQuantities(Drawing drawing, Dictionary<string, BoQItem> boqItems)
    {
        var pipes = drawing.Edges.Where(e => e.Type == EdgeType.Pipe);

        var pipingGroups = pipes.GroupBy(p => new
        {
            p.Size,
            p.Material,
            p.Schedule,
            p.PressureRating
        });

        foreach (var group in pipingGroups)
        {
            var totalLength = group.Sum(p => CalculatePipeLength(p));

            // Add 10% for waste and cuts
            totalLength *= 1.1m;

            // Round up to nearest standard pipe length (6m or 12m)
            var standardLength = 6.0m;
            var numberOfPipes = Math.Ceiling(totalLength / standardLength);

            var key = $"PIPE-{group.Key.Size}-{group.Key.Material}-SCH{group.Key.Schedule}";

            boqItems[key] = new BoQItem
            {
                ItemCode = key,
                Description = $"Pipe {group.Key.Size}\" {group.Key.Material} SCH{group.Key.Schedule}",
                Unit = "EA",
                Quantity = numberOfPipes,
                UnitCost = GetPipeCost(group.Key)
            };
        }
    }

    private decimal CalculatePipeLength(Edge pipe)
    {
        // Calculate actual pipe length considering routing
        decimal length = 0;

        foreach (var segment in pipe.RoutePoints)
        {
            if (segment.Previous != null)
            {
                length += CalculateDistance(segment.Previous, segment.Current);
            }
        }

        return length / 1000; // Convert mm to meters
    }
}
```

### 2.2 Cost Calculation Formulas

```csharp
public class CostCalculator
{
    public class CostBreakdown
    {
        public decimal MaterialCost { get; set; }
        public decimal LaborCost { get; set; }
        public decimal EquipmentCost { get; set; }
        public decimal SubcontractorCost { get; set; }
        public decimal Subtotal => MaterialCost + LaborCost + EquipmentCost + SubcontractorCost;
        public decimal OverheadPercentage { get; set; } = 10.0m;
        public decimal OverheadCost => Subtotal * (OverheadPercentage / 100);
        public decimal ProfitPercentage { get; set; } = 15.0m;
        public decimal ProfitCost => Subtotal * (ProfitPercentage / 100);
        public decimal ContingencyPercentage { get; set; } = 5.0m;
        public decimal ContingencyCost => Subtotal * (ContingencyPercentage / 100);
        public decimal TotalCost => Subtotal + OverheadCost + ProfitCost + ContingencyCost;
    }

    public decimal CalculateLaborCost(Component component)
    {
        // Labor hours based on component type and size
        var baseHours = component.Type switch
        {
            ComponentType.Pump => 8.0m + (component.Size / 100 * 2), // Base 8 hours + size factor
            ComponentType.Valve => 2.0m + (component.Size / 100 * 0.5m),
            ComponentType.HeatExchanger => 16.0m + (component.Size / 50 * 4),
            ComponentType.Tank => 12.0m + (component.Capacity / 1000 * 2),
            ComponentType.Instrument => 4.0m,
            _ => 2.0m
        };

        // Complexity factors
        var complexityFactor = component.PressureRating switch
        {
            > 100 => 1.5m,  // High pressure
            > 50 => 1.2m,   // Medium pressure
            _ => 1.0m       // Low pressure
        };

        // Material factors
        var materialFactor = component.Material switch
        {
            "SS316" => 1.3m,  // Stainless steel requires more careful handling
            "SS304" => 1.2m,
            "GRP" => 1.1m,
            _ => 1.0m
        };

        var totalHours = baseHours * complexityFactor * materialFactor;
        var hourlyRate = GetHourlyRate(component.Type); // $50-150/hour depending on skill level

        return totalHours * hourlyRate;
    }
}
```

### 2.3 Unit Conversion Formulas

```csharp
public static class UnitConverter
{
    // Length conversions
    public static decimal MetersToFeet(decimal meters) => meters * 3.28084m;
    public static decimal FeetToMeters(decimal feet) => feet / 3.28084m;
    public static decimal InchesToMillimeters(decimal inches) => inches * 25.4m;
    public static decimal MillimetersToInches(decimal mm) => mm / 25.4m;

    // Pressure conversions
    public static decimal BarToPsi(decimal bar) => bar * 14.5038m;
    public static decimal PsiToBar(decimal psi) => psi / 14.5038m;
    public static decimal BarToKPa(decimal bar) => bar * 100m;
    public static decimal KPaToBar(decimal kpa) => kpa / 100m;

    // Temperature conversions
    public static decimal CelsiusToFahrenheit(decimal celsius) => (celsius * 9 / 5) + 32;
    public static decimal FahrenheitToCelsius(decimal fahrenheit) => (fahrenheit - 32) * 5 / 9;
    public static decimal CelsiusToKelvin(decimal celsius) => celsius + 273.15m;
    public static decimal KelvinToCelsius(decimal kelvin) => kelvin - 273.15m;

    // Flow rate conversions
    public static decimal M3PerHourToGPM(decimal m3h) => m3h * 4.40287m;
    public static decimal GPMToM3PerHour(decimal gpm) => gpm / 4.40287m;
    public static decimal LitersPerSecToM3PerHour(decimal lps) => lps * 3.6m;

    // Pipe size nominal to actual diameter (mm)
    public static readonly Dictionary<string, decimal> NominalPipeSize = new()
    {
        ["1/2\""] = 15m,
        ["3/4\""] = 20m,
        ["1\""] = 25m,
        ["1-1/4\""] = 32m,
        ["1-1/2\""] = 40m,
        ["2\""] = 50m,
        ["2-1/2\""] = 65m,
        ["3\""] = 80m,
        ["4\""] = 100m,
        ["6\""] = 150m,
        ["8\""] = 200m,
        ["10\""] = 250m,
        ["12\""] = 300m,
        ["14\""] = 350m,
        ["16\""] = 400m,
        ["18\""] = 450m,
        ["20\""] = 500m,
        ["24\""] = 600m
    };
}
```

---

## 3. Approval Workflow State Machines

### 3.1 Drawing Approval State Machine

```csharp
public class DrawingApprovalStateMachine
{
    public enum DrawingState
    {
        Draft,
        InternalReview,
        ClientReview,
        Approved,
        Rejected,
        Revision,
        Superseded,
        Archived
    }

    public enum DrawingAction
    {
        Submit,
        Approve,
        Reject,
        RequestRevision,
        Revise,
        Supersede,
        Archive
    }

    private static readonly Dictionary<(DrawingState, DrawingAction), DrawingState> StateTransitions = new()
    {
        // From Draft
        [(DrawingState.Draft, DrawingAction.Submit)] = DrawingState.InternalReview,

        // From InternalReview
        [(DrawingState.InternalReview, DrawingAction.Approve)] = DrawingState.ClientReview,
        [(DrawingState.InternalReview, DrawingAction.Reject)] = DrawingState.Rejected,
        [(DrawingState.InternalReview, DrawingAction.RequestRevision)] = DrawingState.Revision,

        // From ClientReview
        [(DrawingState.ClientReview, DrawingAction.Approve)] = DrawingState.Approved,
        [(DrawingState.ClientReview, DrawingAction.Reject)] = DrawingState.Rejected,
        [(DrawingState.ClientReview, DrawingAction.RequestRevision)] = DrawingState.Revision,

        // From Revision
        [(DrawingState.Revision, DrawingAction.Submit)] = DrawingState.InternalReview,

        // From Rejected
        [(DrawingState.Rejected, DrawingAction.Revise)] = DrawingState.Draft,
        [(DrawingState.Rejected, DrawingAction.Archive)] = DrawingState.Archived,

        // From Approved
        [(DrawingState.Approved, DrawingAction.Supersede)] = DrawingState.Superseded,
        [(DrawingState.Approved, DrawingAction.RequestRevision)] = DrawingState.Revision,

        // From Superseded
        [(DrawingState.Superseded, DrawingAction.Archive)] = DrawingState.Archived
    };

    public class StateTransition
    {
        public DrawingState FromState { get; set; }
        public DrawingState ToState { get; set; }
        public DrawingAction Action { get; set; }
        public string UserId { get; set; }
        public DateTime Timestamp { get; set; }
        public string Comments { get; set; }
        public TimeSpan Duration { get; set; }
    }

    public bool CanTransition(DrawingState currentState, DrawingAction action, string userRole)
    {
        // Check if transition exists
        if (!StateTransitions.ContainsKey((currentState, action)))
            return false;

        // Check role-based permissions
        var requiredRole = GetRequiredRole(currentState, action);
        return HasPermission(userRole, requiredRole);
    }

    private string GetRequiredRole(DrawingState state, DrawingAction action)
    {
        return (state, action) switch
        {
            (DrawingState.Draft, DrawingAction.Submit) => "Author",
            (DrawingState.InternalReview, DrawingAction.Approve) => "Checker",
            (DrawingState.ClientReview, DrawingAction.Approve) => "Approver",
            (DrawingState.InternalReview, DrawingAction.Reject) => "Checker",
            (DrawingState.ClientReview, DrawingAction.Reject) => "Approver",
            (DrawingState.InternalReview, DrawingAction.RequestRevision) => "Checker",
            (DrawingState.ClientReview, DrawingAction.RequestRevision) => "Approver",
            _ => "Admin"
        };
    }
}
```

### 3.2 Automatic Escalation Rules

```csharp
public class EscalationManager
{
    public class EscalationRule
    {
        public string RuleId { get; set; }
        public DrawingState State { get; set; }
        public TimeSpan Timeout { get; set; }
        public string EscalateToRole { get; set; }
        public int MaxEscalations { get; set; } = 3;
        public NotificationTemplate NotificationTemplate { get; set; }
    }

    private static readonly List<EscalationRule> EscalationRules = new()
    {
        new EscalationRule
        {
            RuleId = "ESC_001",
            State = DrawingState.InternalReview,
            Timeout = TimeSpan.FromHours(24),
            EscalateToRole = "LeadChecker",
            NotificationTemplate = new NotificationTemplate
            {
                Subject = "Drawing Review Escalation - 24 Hours Overdue",
                Body = "Drawing {DrawingNumber} has been in Internal Review for over 24 hours."
            }
        },
        new EscalationRule
        {
            RuleId = "ESC_002",
            State = DrawingState.InternalReview,
            Timeout = TimeSpan.FromHours(48),
            EscalateToRole = "ProjectManager",
            NotificationTemplate = new NotificationTemplate
            {
                Subject = "Drawing Review Escalation - 48 Hours Overdue",
                Body = "Drawing {DrawingNumber} has been in Internal Review for over 48 hours. Immediate action required."
            }
        },
        new EscalationRule
        {
            RuleId = "ESC_003",
            State = DrawingState.ClientReview,
            Timeout = TimeSpan.FromDays(3),
            EscalateToRole = "ClientManager",
            NotificationTemplate = new NotificationTemplate
            {
                Subject = "Client Review Pending - 3 Days",
                Body = "Drawing {DrawingNumber} awaiting client approval for 3 days."
            }
        }
    };

    public async Task ProcessEscalations()
    {
        var pendingDrawings = await GetPendingDrawings();

        foreach (var drawing in pendingDrawings)
        {
            var timeInCurrentState = DateTime.UtcNow - drawing.StateChangedAt;
            var applicableRules = EscalationRules
                .Where(r => r.State == drawing.CurrentState && timeInCurrentState > r.Timeout)
                .OrderBy(r => r.Timeout);

            foreach (var rule in applicableRules)
            {
                if (drawing.EscalationCount < rule.MaxEscalations)
                {
                    await EscalateDrawing(drawing, rule);
                    drawing.EscalationCount++;
                    break; // Only apply one escalation at a time
                }
            }
        }
    }
}
```

---

## 4. Version Control Branching Strategies

### 4.1 Drawing Version Management

```csharp
public class DrawingVersionControl
{
    public class DrawingVersion
    {
        public string VersionId { get; set; }
        public string DrawingId { get; set; }
        public int MajorVersion { get; set; }
        public int MinorVersion { get; set; }
        public int PatchVersion { get; set; }
        public string BranchName { get; set; }
        public string ParentVersionId { get; set; }
        public DateTime CreatedAt { get; set; }
        public string CreatedBy { get; set; }
        public string ChangeDescription { get; set; }
        public byte[] DrawingSnapshot { get; set; } // Compressed JSON

        public string VersionNumber => $"{MajorVersion}.{MinorVersion}.{PatchVersion}";
    }

    public class BranchingStrategy
    {
        // Branch naming: [type]/[issue-id]/[description]
        // Examples: feature/PID-123/add-pump-station
        //          hotfix/PID-456/fix-valve-connection
        //          release/v2.0.0

        private static readonly Regex BranchNamePattern = new Regex(
            @"^(main|develop|feature|hotfix|release)\/([A-Z]+-\d+\/)?([a-z0-9-]+)$",
            RegexOptions.Compiled
        );

        public bool IsValidBranchName(string branchName)
        {
            return BranchNamePattern.IsMatch(branchName);
        }

        public string GetBranchType(string branchName)
        {
            var match = BranchNamePattern.Match(branchName);
            return match.Success ? match.Groups[1].Value : null;
        }
    }

    public DrawingVersion CreateNewVersion(Drawing drawing, VersionType versionType)
    {
        var currentVersion = GetCurrentVersion(drawing.Id);
        var newVersion = new DrawingVersion
        {
            VersionId = Guid.NewGuid().ToString(),
            DrawingId = drawing.Id,
            ParentVersionId = currentVersion?.VersionId,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = GetCurrentUser()
        };

        switch (versionType)
        {
            case VersionType.Major: // Breaking changes, major redesign
                newVersion.MajorVersion = currentVersion.MajorVersion + 1;
                newVersion.MinorVersion = 0;
                newVersion.PatchVersion = 0;
                break;

            case VersionType.Minor: // New features, non-breaking changes
                newVersion.MajorVersion = currentVersion.MajorVersion;
                newVersion.MinorVersion = currentVersion.MinorVersion + 1;
                newVersion.PatchVersion = 0;
                break;

            case VersionType.Patch: // Bug fixes, small adjustments
                newVersion.MajorVersion = currentVersion.MajorVersion;
                newVersion.MinorVersion = currentVersion.MinorVersion;
                newVersion.PatchVersion = currentVersion.PatchVersion + 1;
                break;
        }

        // Create snapshot
        newVersion.DrawingSnapshot = CompressDrawing(drawing);

        return newVersion;
    }
}
```

### 4.2 Three-Way Merge Algorithm

```csharp
public class DrawingMerger
{
    public class MergeResult
    {
        public bool Success { get; set; }
        public Drawing MergedDrawing { get; set; }
        public List<MergeConflict> Conflicts { get; set; } = new();
    }

    public class MergeConflict
    {
        public string ComponentId { get; set; }
        public string PropertyName { get; set; }
        public object BaseValue { get; set; }
        public object SourceValue { get; set; }
        public object TargetValue { get; set; }
        public ConflictResolution Resolution { get; set; }
    }

    public MergeResult ThreeWayMerge(Drawing baseDrawing, Drawing sourceDrawing, Drawing targetDrawing)
    {
        var result = new MergeResult { MergedDrawing = new Drawing() };

        // Merge components
        var baseComponents = baseDrawing.Components.ToDictionary(c => c.Id);
        var sourceComponents = sourceDrawing.Components.ToDictionary(c => c.Id);
        var targetComponents = targetDrawing.Components.ToDictionary(c => c.Id);

        var allComponentIds = new HashSet<string>();
        allComponentIds.UnionWith(baseComponents.Keys);
        allComponentIds.UnionWith(sourceComponents.Keys);
        allComponentIds.UnionWith(targetComponents.Keys);

        foreach (var componentId in allComponentIds)
        {
            var hasBase = baseComponents.TryGetValue(componentId, out var baseComp);
            var hasSource = sourceComponents.TryGetValue(componentId, out var sourceComp);
            var hasTarget = targetComponents.TryGetValue(componentId, out var targetComp);

            if (!hasBase && hasSource && !hasTarget)
            {
                // Added in source only - take source
                result.MergedDrawing.Components.Add(sourceComp);
            }
            else if (!hasBase && !hasSource && hasTarget)
            {
                // Added in target only - take target
                result.MergedDrawing.Components.Add(targetComp);
            }
            else if (hasBase && !hasSource && hasTarget)
            {
                // Deleted in source, modified in target - conflict
                result.Conflicts.Add(new MergeConflict
                {
                    ComponentId = componentId,
                    PropertyName = "_existence",
                    BaseValue = baseComp,
                    SourceValue = null,
                    TargetValue = targetComp
                });
            }
            else if (hasBase && hasSource && !hasTarget)
            {
                // Deleted in target, modified in source - conflict
                result.Conflicts.Add(new MergeConflict
                {
                    ComponentId = componentId,
                    PropertyName = "_existence",
                    BaseValue = baseComp,
                    SourceValue = sourceComp,
                    TargetValue = null
                });
            }
            else if (hasBase && hasSource && hasTarget)
            {
                // Present in all three - check for property conflicts
                var mergedComponent = MergeComponent(baseComp, sourceComp, targetComp, result.Conflicts);
                result.MergedDrawing.Components.Add(mergedComponent);
            }
        }

        result.Success = !result.Conflicts.Any();
        return result;
    }

    private Component MergeComponent(Component baseComp, Component sourceComp, Component targetComp, List<MergeConflict> conflicts)
    {
        var merged = new Component { Id = baseComp.Id };
        var properties = typeof(Component).GetProperties();

        foreach (var property in properties)
        {
            var baseValue = property.GetValue(baseComp);
            var sourceValue = property.GetValue(sourceComp);
            var targetValue = property.GetValue(targetComp);

            if (Equals(baseValue, sourceValue) && Equals(baseValue, targetValue))
            {
                // No changes - use base value
                property.SetValue(merged, baseValue);
            }
            else if (Equals(baseValue, sourceValue) && !Equals(baseValue, targetValue))
            {
                // Only target changed - use target value
                property.SetValue(merged, targetValue);
            }
            else if (!Equals(baseValue, sourceValue) && Equals(baseValue, targetValue))
            {
                // Only source changed - use source value
                property.SetValue(merged, sourceValue);
            }
            else if (Equals(sourceValue, targetValue))
            {
                // Both changed to same value - use that value
                property.SetValue(merged, sourceValue);
            }
            else
            {
                // Both changed to different values - conflict
                conflicts.Add(new MergeConflict
                {
                    ComponentId = baseComp.Id,
                    PropertyName = property.Name,
                    BaseValue = baseValue,
                    SourceValue = sourceValue,
                    TargetValue = targetValue
                });

                // Default to source value for automatic resolution
                property.SetValue(merged, sourceValue);
            }
        }

        return merged;
    }
}
```

---

## 5. Business Rule Validation Matrices

### 5.1 Pipe Sizing Rules

```csharp
public class PipeSizingRules
{
    // Velocity limits for different services (m/s)
    private static readonly Dictionary<string, (double Min, double Max)> VelocityLimits = new()
    {
        ["Water"] = (0.5, 3.0),
        ["Steam_Saturated"] = (20.0, 40.0),
        ["Steam_Superheated"] = (30.0, 60.0),
        ["Air_Compressed"] = (10.0, 30.0),
        ["Oil"] = (0.5, 2.0),
        ["Gas_Natural"] = (10.0, 20.0),
        ["Slurry"] = (1.2, 2.5),
        ["Chemical_Corrosive"] = (0.5, 1.5)
    };

    // Pipe schedule selection based on pressure and temperature
    public string SelectPipeSchedule(double pressure, double temperature, string material)
    {
        // ASME B31.3 Process Piping Code
        if (material == "CS") // Carbon Steel
        {
            if (pressure <= 10 && temperature <= 200)
                return "40";
            else if (pressure <= 20 && temperature <= 300)
                return "80";
            else if (pressure <= 40 && temperature <= 400)
                return "160";
            else
                return "XXS";
        }
        else if (material == "SS316") // Stainless Steel
        {
            if (pressure <= 10)
                return "10S";
            else if (pressure <= 20)
                return "40S";
            else
                return "80S";
        }

        return "STD"; // Standard
    }

    public double CalculatePipeDiameter(double flowRate, string service)
    {
        // Q = A × V
        // D = sqrt(4Q / (π × V))

        var velocityLimits = VelocityLimits[service];
        var optimalVelocity = (velocityLimits.Min + velocityLimits.Max) / 2;

        // flowRate in m³/h, convert to m³/s
        var flowRatePerSec = flowRate / 3600;

        // Calculate diameter in meters
        var diameter = Math.Sqrt(4 * flowRatePerSec / (Math.PI * optimalVelocity));

        // Convert to mm and round up to nearest standard size
        var diameterMm = diameter * 1000;
        return RoundToStandardSize(diameterMm);
    }

    private double RoundToStandardSize(double diameter)
    {
        double[] standardSizes = { 15, 20, 25, 32, 40, 50, 65, 80, 100, 125, 150, 200, 250, 300, 350, 400, 450, 500, 600 };
        return standardSizes.FirstOrDefault(s => s >= diameter);
    }
}
```

### 5.2 Pump Selection Criteria

```csharp
public class PumpSelectionCriteria
{
    public class PumpSpecification
    {
        public string PumpType { get; set; }
        public double FlowRate { get; set; } // m³/h
        public double Head { get; set; } // meters
        public double NPSHa { get; set; } // meters
        public double Efficiency { get; set; } // percentage
        public double Power { get; set; } // kW
        public string ImpellerType { get; set; }
    }

    public PumpSpecification SelectPump(double flowRate, double head, string service)
    {
        var spec = new PumpSpecification
        {
            FlowRate = flowRate,
            Head = head
        };

        // Specific speed calculation
        var specificSpeed = CalculateSpecificSpeed(flowRate, head);

        // Select pump type based on specific speed
        if (specificSpeed < 500)
        {
            spec.PumpType = "Positive Displacement";
            spec.ImpellerType = "N/A";
            spec.Efficiency = 85;
        }
        else if (specificSpeed < 1500)
        {
            spec.PumpType = "Centrifugal - Radial";
            spec.ImpellerType = "Closed";
            spec.Efficiency = 75;
        }
        else if (specificSpeed < 4000)
        {
            spec.PumpType = "Centrifugal - Mixed Flow";
            spec.ImpellerType = "Semi-Open";
            spec.Efficiency = 80;
        }
        else
        {
            spec.PumpType = "Centrifugal - Axial";
            spec.ImpellerType = "Open";
            spec.Efficiency = 85;
        }

        // Calculate power requirement
        // P = (ρ × g × Q × H) / (η × 1000)
        var density = GetFluidDensity(service); // kg/m³
        var gravity = 9.81; // m/s²
        var flowRateM3s = flowRate / 3600; // Convert to m³/s

        spec.Power = (density * gravity * flowRateM3s * head) / (spec.Efficiency / 100 * 1000);

        // Add 10% safety margin
        spec.Power *= 1.1;

        // Calculate NPSH required (approximate)
        spec.NPSHa = head * 0.1 + 2; // Simplified formula

        return spec;
    }

    private double CalculateSpecificSpeed(double flowRate, double head)
    {
        // Ns = (N × √Q) / (H^0.75)
        // Assuming standard speed of 1450 RPM
        var speed = 1450;
        var flowRateM3s = flowRate / 3600;

        return (speed * Math.Sqrt(flowRateM3s)) / Math.Pow(head, 0.75);
    }
}
```

---

## 6. Drawing Intelligence Rules

### 6.1 Auto-Routing Algorithms

```csharp
public class PipeRouter
{
    public class RoutingOptions
    {
        public bool OrthogonalOnly { get; set; } = true;
        public double MinBendRadius { get; set; } = 100; // mm
        public double ObstacleMargin { get; set; } = 50; // mm
        public int MaxBends { get; set; } = 6;
        public bool PreferHorizontal { get; set; } = true;
    }

    public List<Point> CalculateRoute(Point start, Point end, List<Rectangle> obstacles, RoutingOptions options)
    {
        if (options.OrthogonalOnly)
        {
            return CalculateOrthogonalRoute(start, end, obstacles, options);
        }

        return CalculateAStarRoute(start, end, obstacles, options);
    }

    private List<Point> CalculateOrthogonalRoute(Point start, Point end, List<Rectangle> obstacles, RoutingOptions options)
    {
        var route = new List<Point> { start };
        var current = start;

        // Try different routing strategies
        var strategies = new List<Func<List<Point>>>
        {
            () => RouteDirectHorizontalFirst(current, end, obstacles, options),
            () => RouteDirectVerticalFirst(current, end, obstacles, options),
            () => RouteAroundObstacles(current, end, obstacles, options)
        };

        foreach (var strategy in strategies)
        {
            var testRoute = strategy();
            if (IsValidRoute(testRoute, obstacles, options))
            {
                return OptimizeRoute(testRoute, options);
            }
        }

        // Fallback to A* if simple strategies fail
        return CalculateAStarRoute(start, end, obstacles, options);
    }

    private List<Point> RouteDirectHorizontalFirst(Point start, Point end, List<Rectangle> obstacles, RoutingOptions options)
    {
        var route = new List<Point> { start };

        // Move horizontally first
        var horizontalPoint = new Point(end.X, start.Y);
        if (!IntersectsObstacle(start, horizontalPoint, obstacles, options.ObstacleMargin))
        {
            route.Add(horizontalPoint);
        }
        else
        {
            // Find intermediate point
            var midY = FindClearHorizontalPath(start, end, obstacles, options);
            route.Add(new Point(start.X, midY));
            route.Add(new Point(end.X, midY));
        }

        route.Add(end);
        return route;
    }
}
```

### 6.2 Collision Detection

```csharp
public class CollisionDetector
{
    public class CollisionResult
    {
        public bool HasCollision { get; set; }
        public List<CollisionPoint> Collisions { get; set; } = new();
    }

    public class CollisionPoint
    {
        public string Component1Id { get; set; }
        public string Component2Id { get; set; }
        public Point Location { get; set; }
        public CollisionType Type { get; set; }
    }

    public enum CollisionType
    {
        Overlap,
        TooClose,
        CrossingPipes,
        InvalidConnection
    }

    public CollisionResult DetectCollisions(Drawing drawing)
    {
        var result = new CollisionResult();
        var components = drawing.Components.ToList();

        // Check component overlaps
        for (int i = 0; i < components.Count - 1; i++)
        {
            for (int j = i + 1; j < components.Count; j++)
            {
                var comp1 = components[i];
                var comp2 = components[j];

                // Check bounding box overlap
                if (BoundingBoxesOverlap(comp1, comp2))
                {
                    result.Collisions.Add(new CollisionPoint
                    {
                        Component1Id = comp1.Id,
                        Component2Id = comp2.Id,
                        Location = GetOverlapCenter(comp1, comp2),
                        Type = CollisionType.Overlap
                    });
                }

                // Check minimum spacing
                var distance = CalculateDistance(comp1.Position, comp2.Position);
                var minSpacing = GetMinimumSpacing(comp1.Type, comp2.Type);

                if (distance < minSpacing)
                {
                    result.Collisions.Add(new CollisionPoint
                    {
                        Component1Id = comp1.Id,
                        Component2Id = comp2.Id,
                        Location = GetMidpoint(comp1.Position, comp2.Position),
                        Type = CollisionType.TooClose
                    });
                }
            }
        }

        // Check pipe crossings
        foreach (var pipe1 in drawing.Edges)
        {
            foreach (var pipe2 in drawing.Edges)
            {
                if (pipe1.Id != pipe2.Id && PipesCross(pipe1, pipe2))
                {
                    result.Collisions.Add(new CollisionPoint
                    {
                        Component1Id = pipe1.Id,
                        Component2Id = pipe2.Id,
                        Location = GetCrossingPoint(pipe1, pipe2),
                        Type = CollisionType.CrossingPipes
                    });
                }
            }
        }

        result.HasCollision = result.Collisions.Any();
        return result;
    }

    private double GetMinimumSpacing(ComponentType type1, ComponentType type2)
    {
        // Minimum spacing matrix (mm)
        var baseSpacing = 100.0;

        // Equipment needs more space
        if (IsEquipment(type1) || IsEquipment(type2))
            baseSpacing = 500.0;

        // Valves need access space
        if (type1 == ComponentType.Valve || type2 == ComponentType.Valve)
            baseSpacing = Math.Max(baseSpacing, 200.0);

        // Safety equipment needs clear access
        if (IsSafetyEquipment(type1) || IsSafetyEquipment(type2))
            baseSpacing = Math.Max(baseSpacing, 1000.0);

        return baseSpacing;
    }
}
```

---

## 7. Engineering Calculation Formulas

### 7.1 Pressure Drop Calculations

```csharp
public class PressureDropCalculator
{
    // Darcy-Weisbach equation: ΔP = f × (L/D) × (ρ × v²/2)
    public double CalculatePressureDrop(PipeSegment pipe, FluidProperties fluid)
    {
        var reynolds = CalculateReynoldsNumber(pipe, fluid);
        var frictionFactor = CalculateFrictionFactor(reynolds, pipe.Roughness / pipe.Diameter);

        var velocity = fluid.FlowRate / (Math.PI * Math.Pow(pipe.Diameter / 2, 2));

        var pressureDrop = frictionFactor *
                          (pipe.Length / pipe.Diameter) *
                          (fluid.Density * Math.Pow(velocity, 2) / 2);

        // Add fitting losses
        var fittingLosses = CalculateFittingLosses(pipe, fluid, velocity);

        return pressureDrop + fittingLosses;
    }

    private double CalculateReynoldsNumber(PipeSegment pipe, FluidProperties fluid)
    {
        // Re = ρ × v × D / μ
        var velocity = fluid.FlowRate / (Math.PI * Math.Pow(pipe.Diameter / 2, 2));
        return fluid.Density * velocity * pipe.Diameter / fluid.Viscosity;
    }

    private double CalculateFrictionFactor(double reynolds, double relativeRoughness)
    {
        if (reynolds < 2300)
        {
            // Laminar flow: f = 64/Re
            return 64.0 / reynolds;
        }
        else if (reynolds < 4000)
        {
            // Transition zone - interpolate
            var laminar = 64.0 / 2300;
            var turbulent = ColebrookWhite(4000, relativeRoughness);
            return laminar + (turbulent - laminar) * (reynolds - 2300) / 1700;
        }
        else
        {
            // Turbulent flow: Colebrook-White equation
            return ColebrookWhite(reynolds, relativeRoughness);
        }
    }

    private double ColebrookWhite(double reynolds, double relativeRoughness)
    {
        // 1/√f = -2.0 × log10(ε/3.7D + 2.51/(Re×√f))
        // Solve iteratively
        double f = 0.02; // Initial guess
        double tolerance = 0.0001;
        int maxIterations = 50;

        for (int i = 0; i < maxIterations; i++)
        {
            double leftSide = 1.0 / Math.Sqrt(f);
            double rightSide = -2.0 * Math.Log10(
                relativeRoughness / 3.7 + 2.51 / (reynolds * Math.Sqrt(f))
            );

            double fNew = Math.Pow(1.0 / rightSide, 2);

            if (Math.Abs(fNew - f) < tolerance)
                return fNew;

            f = fNew;
        }

        return f;
    }

    private double CalculateFittingLosses(PipeSegment pipe, FluidProperties fluid, double velocity)
    {
        double totalK = 0;

        foreach (var fitting in pipe.Fittings)
        {
            totalK += GetResistanceCoefficient(fitting);
        }

        // ΔP = K × (ρ × v²/2)
        return totalK * (fluid.Density * Math.Pow(velocity, 2) / 2);
    }

    private double GetResistanceCoefficient(Fitting fitting)
    {
        // K-values for common fittings
        return fitting.Type switch
        {
            FittingType.Elbow90 => 0.9,
            FittingType.Elbow45 => 0.4,
            FittingType.TeeThrough => 0.4,
            FittingType.TeeBranch => 1.8,
            FittingType.ValveGate_FullOpen => 0.2,
            FittingType.ValveGlobe_FullOpen => 10.0,
            FittingType.ValveBall_FullOpen => 0.05,
            FittingType.ValveButterfly_FullOpen => 0.3,
            FittingType.CheckValve => 2.0,
            FittingType.Reducer => 0.5,
            FittingType.Expander => 1.0,
            FittingType.Entry_Sharp => 0.5,
            FittingType.Entry_Rounded => 0.05,
            FittingType.Exit => 1.0,
            _ => 0.5 // Default
        };
    }
}
```

### 7.2 Heat Transfer Calculations

```csharp
public class HeatTransferCalculator
{
    // Q = U × A × LMTD
    public double CalculateHeatTransfer(HeatExchanger hx)
    {
        var lmtd = CalculateLMTD(
            hx.HotInletTemp,
            hx.HotOutletTemp,
            hx.ColdInletTemp,
            hx.ColdOutletTemp
        );

        var correctionFactor = GetCorrectionFactor(hx.Type, hx.Passes);

        return hx.OverallHTC * hx.Area * lmtd * correctionFactor;
    }

    private double CalculateLMTD(double hotIn, double hotOut, double coldIn, double coldOut)
    {
        var deltaT1 = hotIn - coldOut;
        var deltaT2 = hotOut - coldIn;

        if (Math.Abs(deltaT1 - deltaT2) < 0.01)
            return deltaT1; // When temperature differences are equal

        return (deltaT1 - deltaT2) / Math.Log(deltaT1 / deltaT2);
    }

    private double GetCorrectionFactor(HeatExchangerType type, int passes)
    {
        // TEMA correction factors
        return type switch
        {
            HeatExchangerType.ShellAndTube_1_2 => 0.9,
            HeatExchangerType.ShellAndTube_2_4 => 0.85,
            HeatExchangerType.CrossFlow => 0.95,
            HeatExchangerType.Counterflow => 1.0,
            HeatExchangerType.Parallel => 0.8,
            _ => 0.9
        };
    }
}
```

---

## 8. Conflict Resolution Algorithms

### 8.1 Concurrent Edit Resolution

```csharp
public class ConflictResolver
{
    public enum ResolutionStrategy
    {
        LastWriteWins,
        FirstWriteWins,
        MergeValues,
        HigherPriorityWins,
        Manual
    }

    public class EditConflict
    {
        public string ComponentId { get; set; }
        public string PropertyName { get; set; }
        public string User1Id { get; set; }
        public object User1Value { get; set; }
        public DateTime User1Timestamp { get; set; }
        public string User2Id { get; set; }
        public object User2Value { get; set; }
        public DateTime User2Timestamp { get; set; }
        public ResolutionStrategy Strategy { get; set; }
        public object ResolvedValue { get; set; }
    }

    public object ResolveConflict(EditConflict conflict)
    {
        switch (conflict.Strategy)
        {
            case ResolutionStrategy.LastWriteWins:
                return conflict.User1Timestamp > conflict.User2Timestamp
                    ? conflict.User1Value
                    : conflict.User2Value;

            case ResolutionStrategy.FirstWriteWins:
                return conflict.User1Timestamp < conflict.User2Timestamp
                    ? conflict.User1Value
                    : conflict.User2Value;

            case ResolutionStrategy.MergeValues:
                return MergeValues(conflict);

            case ResolutionStrategy.HigherPriorityWins:
                return GetUserPriority(conflict.User1Id) > GetUserPriority(conflict.User2Id)
                    ? conflict.User1Value
                    : conflict.User2Value;

            case ResolutionStrategy.Manual:
            default:
                return conflict.ResolvedValue; // Set by user
        }
    }

    private object MergeValues(EditConflict conflict)
    {
        // Type-specific merging
        if (conflict.User1Value is string s1 && conflict.User2Value is string s2)
        {
            // For descriptions, concatenate with separator
            if (conflict.PropertyName == "Description")
                return $"{s1} | {s2}";
        }

        if (conflict.User1Value is double d1 && conflict.User2Value is double d2)
        {
            // For numeric values, take average or max based on property
            return conflict.PropertyName switch
            {
                "Pressure" => Math.Max(d1, d2), // Safety: take higher pressure
                "Temperature" => Math.Max(d1, d2), // Safety: take higher temperature
                "FlowRate" => (d1 + d2) / 2, // Average flow rates
                _ => d2 // Default to second value
            };
        }

        // Default to last write wins
        return conflict.User2Value;
    }
}
```

---

## 9. Data Consistency Rules

### 9.1 Referential Integrity

```csharp
public class DataConsistencyValidator
{
    public class ConsistencyCheck
    {
        public bool IsConsistent { get; set; }
        public List<ConsistencyViolation> Violations { get; set; } = new();
    }

    public ConsistencyCheck ValidateDrawingConsistency(Drawing drawing)
    {
        var check = new ConsistencyCheck { IsConsistent = true };

        // Check all edges reference valid components
        foreach (var edge in drawing.Edges)
        {
            if (!drawing.Components.Any(c => c.Id == edge.SourceId))
            {
                check.Violations.Add(new ConsistencyViolation
                {
                    Type = ViolationType.MissingReference,
                    Message = $"Edge {edge.Id} references non-existent source component {edge.SourceId}"
                });
            }

            if (!drawing.Components.Any(c => c.Id == edge.TargetId))
            {
                check.Violations.Add(new ConsistencyViolation
                {
                    Type = ViolationType.MissingReference,
                    Message = $"Edge {edge.Id} references non-existent target component {edge.TargetId}"
                });
            }
        }

        // Check component properties are within valid ranges
        foreach (var component in drawing.Components)
        {
            ValidateComponentProperties(component, check.Violations);
        }

        // Check for orphaned components (not connected to anything)
        var connectedComponents = new HashSet<string>();
        foreach (var edge in drawing.Edges)
        {
            connectedComponents.Add(edge.SourceId);
            connectedComponents.Add(edge.TargetId);
        }

        foreach (var component in drawing.Components)
        {
            if (!connectedComponents.Contains(component.Id) && RequiresConnection(component.Type))
            {
                check.Violations.Add(new ConsistencyViolation
                {
                    Type = ViolationType.OrphanedComponent,
                    Message = $"Component {component.Tag} is not connected to any pipes"
                });
            }
        }

        check.IsConsistent = !check.Violations.Any();
        return check;
    }

    private void ValidateComponentProperties(Component component, List<ConsistencyViolation> violations)
    {
        // Validate pressure rating
        if (component.PressureRating <= 0 || component.PressureRating > 1000)
        {
            violations.Add(new ConsistencyViolation
            {
                Type = ViolationType.InvalidValue,
                Message = $"Component {component.Tag} has invalid pressure rating: {component.PressureRating} bar"
            });
        }

        // Validate temperature range
        if (component.MaxTemperature < component.MinTemperature)
        {
            violations.Add(new ConsistencyViolation
            {
                Type = ViolationType.InvalidValue,
                Message = $"Component {component.Tag} has invalid temperature range"
            });
        }

        // Validate size
        if (component.Size <= 0 || component.Size > 2000)
        {
            violations.Add(new ConsistencyViolation
            {
                Type = ViolationType.InvalidValue,
                Message = $"Component {component.Tag} has invalid size: {component.Size}mm"
            });
        }
    }
}
```

---

## Edge Cases and Error Handling

### Critical Edge Cases

1. **Circular References**: Components referencing themselves
2. **Infinite Loops**: Pipe routing creating endless loops
3. **Precision Errors**: Floating-point comparison issues
4. **Concurrent Modifications**: Multiple users editing same component
5. **Data Migration**: Handling legacy data formats
6. **Network Failures**: Partial updates during disconnection
7. **Memory Limits**: Drawings with >10,000 components
8. **Undo/Redo Conflicts**: Conflicting operation sequences

### Error Recovery Procedures

```csharp
public class ErrorRecovery
{
    public async Task<RecoveryResult> RecoverFromError(Exception error, DrawingContext context)
    {
        return error switch
        {
            DataCorruptionException => await RecoverFromCorruption(context),
            ConcurrentModificationException => await RecoverFromConcurrentEdit(context),
            NetworkException => await RecoverFromNetworkFailure(context),
            OutOfMemoryException => await RecoverFromMemoryIssue(context),
            _ => await GenericRecovery(context)
        };
    }

    private async Task<RecoveryResult> RecoverFromCorruption(DrawingContext context)
    {
        // 1. Attempt to load last known good version
        // 2. Run consistency checks
        // 3. Repair what's possible
        // 4. Mark unrecoverable sections
        // 5. Notify user of data loss

        var backup = await LoadLastBackup(context.DrawingId);
        var repaired = await RepairDrawing(backup);
        await ValidateAndSave(repaired);

        return new RecoveryResult
        {
            Success = true,
            DataLoss = true,
            Message = "Drawing recovered from backup. Some recent changes may be lost."
        };
    }
}
```

---

This comprehensive business logic document provides detailed specifications, algorithms, formulas, and edge case handling for all critical business rules in the Ergoplanner AI Suite. Each section includes working code examples, specific thresholds, and validation patterns that can be directly implemented.