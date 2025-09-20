using System;
using System.Collections.Generic;

namespace Ergoplanner.Domain.ValueObjects
{
    /// <summary>
    /// Position value object for component placement
    /// </summary>
    public class Position
    {
        public decimal X { get; set; }
        public decimal Y { get; set; }
        public decimal? Z { get; set; }

        public Position() { }

        public Position(decimal x, decimal y, decimal? z = null)
        {
            X = x;
            Y = y;
            Z = z;
        }
    }

    /// <summary>
    /// Scale value object for component sizing
    /// </summary>
    public class Scale
    {
        public decimal X { get; set; } = 1;
        public decimal Y { get; set; } = 1;

        public Scale() { }

        public Scale(decimal x, decimal y)
        {
            X = x;
            Y = y;
        }
    }

    /// <summary>
    /// Connection value object for component connections
    /// </summary>
    public class Connection
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string SourceId { get; set; } = string.Empty;
        public string TargetId { get; set; } = string.Empty;
        public string SourcePort { get; set; } = string.Empty;
        public string TargetPort { get; set; } = string.Empty;
        public string ConnectionType { get; set; } = string.Empty;
        public Dictionary<string, object> Properties { get; set; } = new();
    }

    /// <summary>
    /// Attachment value object for comments
    /// </summary>
    public class Attachment
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string FileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Money value object for monetary values with currency
    /// </summary>
    public class Money
    {
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "USD";

        public Money() { }

        public Money(decimal amount, string currency = "USD")
        {
            Amount = amount;
            Currency = currency;
        }

        public Money Add(Money other)
        {
            if (Currency != other.Currency)
                throw new InvalidOperationException($"Cannot add different currencies: {Currency} and {other.Currency}");

            return new Money(Amount + other.Amount, Currency);
        }

        public Money Multiply(decimal factor)
        {
            return new Money(Amount * factor, Currency);
        }

        public override string ToString()
        {
            return $"{Amount:C} {Currency}";
        }
    }

    /// <summary>
    /// Quantity value object for measurements with units
    /// </summary>
    public class Quantity
    {
        public decimal Value { get; set; }
        public string Unit { get; set; } = string.Empty;
        public string? UnitSymbol { get; set; }

        public Quantity() { }

        public Quantity(decimal value, string unit, string? unitSymbol = null)
        {
            Value = value;
            Unit = unit;
            UnitSymbol = unitSymbol;
        }

        public override string ToString()
        {
            return $"{Value} {UnitSymbol ?? Unit}";
        }
    }

    /// <summary>
    /// Price range value object for cost estimation
    /// </summary>
    public class PriceRange
    {
        public Money MinPrice { get; set; } = new();
        public Money MaxPrice { get; set; } = new();
        public Money? EstimatedPrice { get; set; }

        public PriceRange() { }

        public PriceRange(Money minPrice, Money maxPrice, Money? estimatedPrice = null)
        {
            MinPrice = minPrice;
            MaxPrice = maxPrice;
            EstimatedPrice = estimatedPrice;
        }
    }

    /// <summary>
    /// Dimensions value object for physical measurements
    /// </summary>
    public class Dimensions
    {
        public decimal? Length { get; set; }
        public decimal? Width { get; set; }
        public decimal? Height { get; set; }
        public decimal? Diameter { get; set; }
        public decimal? Thickness { get; set; }
        public string Unit { get; set; } = "mm";

        public Dimensions() { }

        public Dimensions(decimal? length = null, decimal? width = null, decimal? height = null,
                         decimal? diameter = null, decimal? thickness = null, string unit = "mm")
        {
            Length = length;
            Width = width;
            Height = height;
            Diameter = diameter;
            Thickness = thickness;
            Unit = unit;
        }
    }

    /// <summary>
    /// Lead time value object for delivery scheduling
    /// </summary>
    public class LeadTime
    {
        public int Days { get; set; }
        public DateTime? EarliestDelivery { get; set; }
        public DateTime? LatestDelivery { get; set; }
        public bool IsEstimated { get; set; } = true;

        public LeadTime() { }

        public LeadTime(int days, bool isEstimated = true)
        {
            Days = days;
            IsEstimated = isEstimated;
            EarliestDelivery = DateTime.UtcNow.AddDays(days);
            LatestDelivery = DateTime.UtcNow.AddDays(days + 7); // Add buffer
        }
    }

    /// <summary>
    /// Formula value object for calculation formulas
    /// </summary>
    public class Formula
    {
        public string Expression { get; set; } = string.Empty;
        public Dictionary<string, string> Variables { get; set; } = new();
        public string? Description { get; set; }
        public string? ValidationRules { get; set; }

        public Formula() { }

        public Formula(string expression, Dictionary<string, string>? variables = null,
                      string? description = null)
        {
            Expression = expression;
            Variables = variables ?? new Dictionary<string, string>();
            Description = description;
        }
    }
}