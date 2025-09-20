namespace Ergoplanner.Domain.Enums
{
    /// <summary>
    /// BoQ status enumeration
    /// </summary>
    public enum BoQStatus
    {
        Draft = 1,
        InProgress = 2,
        PendingReview = 3,
        PendingApproval = 4,
        Approved = 5,
        Rejected = 6,
        Archived = 7,
        Cancelled = 8
    }

    /// <summary>
    /// BoQ item status enumeration
    /// </summary>
    public enum BoQItemStatus
    {
        Pending = 1,
        Estimated = 2,
        Quoted = 3,
        Ordered = 4,
        Delivered = 5,
        Installed = 6,
        Cancelled = 7
    }

    /// <summary>
    /// BoQ revision type enumeration
    /// </summary>
    public enum BoQRevisionType
    {
        Initial = 1,
        Preliminary = 2,
        IssueForQuotation = 3,
        IssueForConstruction = 4,
        AsBuilt = 5,
        ChangeOrder = 6
    }

    /// <summary>
    /// Material category type enumeration
    /// </summary>
    public enum MaterialCategoryType
    {
        Equipment = 1,
        Piping = 2,
        Instrumentation = 3,
        Electrical = 4,
        Civil = 5,
        Structural = 6,
        HVAC = 7,
        Safety = 8,
        Consumables = 9,
        Services = 10
    }

    /// <summary>
    /// Material specification type enumeration
    /// </summary>
    public enum MaterialSpecificationType
    {
        Technical = 1,
        Performance = 2,
        Quality = 3,
        Safety = 4,
        Environmental = 5,
        Compliance = 6
    }

    /// <summary>
    /// Pricing rule type enumeration
    /// </summary>
    public enum PricingRuleType
    {
        Markup = 1,
        Discount = 2,
        VolumeDiscount = 3,
        EarlyPaymentDiscount = 4,
        SeasonalAdjustment = 5,
        RiskPremium = 6,
        LocationAdjustment = 7
    }

    /// <summary>
    /// Cost type enumeration
    /// </summary>
    public enum CostType
    {
        Material = 1,
        Labor = 2,
        Equipment = 3,
        Overhead = 4,
        Profit = 5,
        Contingency = 6,
        Escalation = 7,
        Risk = 8
    }

    /// <summary>
    /// BoQ export format enumeration
    /// </summary>
    public enum BoQExportFormat
    {
        Excel = 1,
        PDF = 2,
        CSV = 3,
        XML = 4,
        JSON = 5,
        CXML = 6,
        EDI = 7
    }

    /// <summary>
    /// Quantity calculation method enumeration
    /// </summary>
    public enum QuantityCalculationMethod
    {
        Manual = 1,
        Automatic = 2,
        Formula = 3,
        Drawing = 4,
        CAD = 5,
        AI = 6
    }

    /// <summary>
    /// ERP integration type enumeration
    /// </summary>
    public enum ERPIntegrationType
    {
        SAP = 1,
        Oracle = 2,
        MicrosoftDynamics = 3,
        NetSuite = 4,
        Sage = 5,
        QuickBooks = 6,
        Custom = 7
    }

    /// <summary>
    /// Currency type enumeration
    /// </summary>
    public enum CurrencyType
    {
        USD = 1,
        EUR = 2,
        GBP = 3,
        JPY = 4,
        CAD = 5,
        AUD = 6,
        CHF = 7,
        CNY = 8,
        INR = 9,
        Custom = 99
    }

    /// <summary>
    /// Unit of measurement enumeration
    /// </summary>
    public enum UnitOfMeasurement
    {
        // Length
        Millimeter = 1,
        Centimeter = 2,
        Meter = 3,
        Kilometer = 4,
        Inch = 5,
        Foot = 6,
        Yard = 7,
        Mile = 8,

        // Area
        SquareMillimeter = 10,
        SquareCentimeter = 11,
        SquareMeter = 12,
        SquareKilometer = 13,
        SquareInch = 14,
        SquareFoot = 15,
        SquareYard = 16,
        Acre = 17,
        Hectare = 18,

        // Volume
        CubicMillimeter = 20,
        CubicCentimeter = 21,
        CubicMeter = 22,
        Liter = 23,
        Milliliter = 24,
        CubicInch = 25,
        CubicFoot = 26,
        CubicYard = 27,
        Gallon = 28,
        Quart = 29,
        Pint = 30,

        // Weight
        Gram = 40,
        Kilogram = 41,
        Ton = 42,
        Ounce = 43,
        Pound = 44,
        Stone = 45,

        // Count
        Each = 50,
        Pair = 51,
        Dozen = 52,
        Hundred = 53,
        Thousand = 54,

        // Time
        Hour = 60,
        Day = 61,
        Week = 62,
        Month = 63,
        Year = 64,

        // Power/Energy
        Watt = 70,
        Kilowatt = 71,
        Horsepower = 72,
        BTU = 73,
        Joule = 74,
        KilowattHour = 75,

        // Pressure
        Pascal = 80,
        Bar = 81,
        PSI = 82,
        Atmosphere = 83,

        // Temperature
        Celsius = 90,
        Fahrenheit = 91,
        Kelvin = 92,

        // Custom
        Custom = 999
    }
}