using System;

namespace Ergoplanner.Domain.Enums
{
    /// <summary>
    /// Symbol type categorization for P&ID symbols
    /// </summary>
    public enum SymbolType
    {
        Equipment = 1,
        Instrumentation = 2,
        Piping = 3,
        Valve = 4,
        Pump = 5,
        Tank = 6,
        HeatExchanger = 7,
        Compressor = 8,
        Filter = 9,
        Separator = 10,
        Reactor = 11,
        Control = 12,
        Safety = 13,
        Electrical = 14,
        Civil = 15,
        Structural = 16,
        Connector = 17,
        Annotation = 18,
        Custom = 99
    }

    /// <summary>
    /// Symbol status in the approval workflow
    /// </summary>
    public enum SymbolStatus
    {
        Draft = 1,
        UnderReview = 2,
        Approved = 3,
        Rejected = 4,
        Archived = 5,
        Obsolete = 6,
        Published = 7
    }

    /// <summary>
    /// Access level for symbol sharing
    /// </summary>
    public enum AccessLevel
    {
        Private = 1,
        Team = 2,
        Organization = 3,
        Public = 4
    }

    /// <summary>
    /// Industry standards for P&ID symbols
    /// </summary>
    public enum IndustryStandard
    {
        ISA_5_1 = 1,
        ISO_14617 = 2,
        BS_5070 = 3,
        DIN_2481 = 4,
        API_RP_551 = 5,
        ANSI_Y32_11 = 6,
        IEC_60617 = 7,
        JIS_B_0001 = 8,
        GOST_21_404 = 9,
        Custom = 99
    }


    /// <summary>
    /// Symbol change types for audit tracking
    /// </summary>
    public enum SymbolChangeType
    {
        Created = 1,
        Updated = 2,
        VersionCreated = 3,
        StatusChanged = 4,
        PropertiesChanged = 5,
        MetadataChanged = 6,
        SvgChanged = 7,
        CategoryChanged = 8,
        TagsChanged = 9,
        SpecificationAdded = 10,
        SpecificationRemoved = 11,
        StandardAdded = 12,
        StandardRemoved = 13,
        Deleted = 14,
        Restored = 15
    }

    /// <summary>
    /// Symbol property data types
    /// </summary>
    public enum PropertyDataType
    {
        String = 1,
        Integer = 2,
        Decimal = 3,
        Boolean = 4,
        Date = 5,
        DateTime = 6,
        List = 7,
        Dictionary = 8,
        File = 9,
        Color = 10,
        Dimension = 11,
        Pressure = 12,
        Temperature = 13,
        Flow = 14,
        Volume = 15,
        Mass = 16,
        Energy = 17,
        Power = 18,
        Frequency = 19,
        Voltage = 20,
        Current = 21
    }

    /// <summary>
    /// Symbol feedback types
    /// </summary>
    public enum FeedbackType
    {
        Rating = 1,
        Bug = 2,
        Improvement = 3,
        Question = 4,
        Compliment = 5,
        Complaint = 6
    }

    /// <summary>
    /// Symbol variant relationship types
    /// </summary>
    public enum VariantType
    {
        SizeVariant = 1,
        OrientationVariant = 2,
        StyleVariant = 3,
        DetailVariant = 4,
        StandardVariant = 5,
        RegionalVariant = 6,
        CustomVariant = 7
    }
}