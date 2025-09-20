using System;
using System.Collections.Generic;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.ValueObjects;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Cost Center entity for budget allocation and cost tracking
    /// </summary>
    public class CostCenter : BaseEntity, IOrganizationScoped, ISoftDelete
    {
        public Guid OrganizationId { get; set; }
        public Guid? ProjectId { get; set; }
        public Guid? ParentCostCenterId { get; set; }
        public string CostCenterCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? CostCenterType { get; set; } // Project, Department, Activity, etc.
        public string Currency { get; set; } = "USD";
        public Money? BudgetAmount { get; set; }
        public Money? AllocatedAmount { get; set; }
        public Money? CommittedAmount { get; set; }
        public Money? ActualAmount { get; set; }
        public Money? VarianceAmount { get; set; }
        public decimal? VariancePercentage { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime? BudgetStartDate { get; set; }
        public DateTime? BudgetEndDate { get; set; }
        public Guid? ResponsibleUser { get; set; }
        public string? ApprovalLevel { get; set; }
        public Dictionary<string, object> Metadata { get; set; } = new();
        public List<string> Tags { get; set; } = new();

        // Soft delete
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }
        public Guid? DeletedBy { get; set; }

        // Navigation properties
        public virtual Organization Organization { get; set; } = null!;
        public virtual Project? Project { get; set; }
        public virtual CostCenter? ParentCostCenter { get; set; }
        public virtual ICollection<CostCenter> ChildCostCenters { get; set; } = new List<CostCenter>();
        public virtual ICollection<CostBreakdown> CostBreakdowns { get; set; } = new List<CostBreakdown>();
        public virtual User? ResponsibleUserEntity { get; set; }
        public virtual User? CreatedByUser { get; set; }
        public virtual User? UpdatedByUser { get; set; }
        public virtual User? DeletedByUser { get; set; }

        /// <summary>
        /// Calculate current utilization percentage
        /// </summary>
        public decimal GetUtilizationPercentage()
        {
            if (BudgetAmount?.Amount <= 0) return 0;

            var utilized = (AllocatedAmount?.Amount ?? 0) + (CommittedAmount?.Amount ?? 0);
            return (utilized / BudgetAmount.Amount) * 100;
        }

        /// <summary>
        /// Calculate remaining budget
        /// </summary>
        public Money GetRemainingBudget()
        {
            var currency = BudgetAmount?.Currency ?? Currency;
            var budgetTotal = BudgetAmount?.Amount ?? 0;
            var utilized = (AllocatedAmount?.Amount ?? 0) + (CommittedAmount?.Amount ?? 0);

            return new Money(Math.Max(0, budgetTotal - utilized), currency);
        }

        /// <summary>
        /// Check if amount can be allocated
        /// </summary>
        public bool CanAllocate(Money amount)
        {
            if (amount.Currency != Currency)
                return false;

            var remaining = GetRemainingBudget();
            return remaining.Amount >= amount.Amount;
        }

        /// <summary>
        /// Allocate budget amount
        /// </summary>
        public void AllocateBudget(Money amount, string? reference = null)
        {
            if (!CanAllocate(amount))
                throw new InvalidOperationException($"Insufficient budget. Available: {GetRemainingBudget()}, Requested: {amount}");

            AllocatedAmount = AllocatedAmount?.Add(amount) ?? amount;
            CalculateVariance();

            if (!string.IsNullOrEmpty(reference))
            {
                var allocations = Metadata.ContainsKey("Allocations")
                    ? (List<object>)Metadata["Allocations"]
                    : new List<object>();

                allocations.Add(new
                {
                    Amount = amount.Amount,
                    Currency = amount.Currency,
                    Reference = reference,
                    Date = DateTime.UtcNow
                });

                Metadata["Allocations"] = allocations;
            }
        }

        /// <summary>
        /// Commit allocated amount
        /// </summary>
        public void CommitAmount(Money amount)
        {
            if (amount.Currency != Currency)
                throw new ArgumentException("Currency mismatch");

            if (AllocatedAmount == null || AllocatedAmount.Amount < amount.Amount)
                throw new InvalidOperationException("Cannot commit more than allocated amount");

            AllocatedAmount = new Money(AllocatedAmount.Amount - amount.Amount, Currency);
            CommittedAmount = CommittedAmount?.Add(amount) ?? amount;
        }

        /// <summary>
        /// Record actual spending
        /// </summary>
        public void RecordActual(Money amount)
        {
            if (amount.Currency != Currency)
                throw new ArgumentException("Currency mismatch");

            ActualAmount = ActualAmount?.Add(amount) ?? amount;
            CalculateVariance();
        }

        /// <summary>
        /// Calculate budget variance
        /// </summary>
        public void CalculateVariance()
        {
            if (BudgetAmount?.Amount > 0 && ActualAmount?.Amount > 0)
            {
                VarianceAmount = new Money(ActualAmount.Amount - BudgetAmount.Amount, Currency);
                VariancePercentage = (VarianceAmount.Amount / BudgetAmount.Amount) * 100;
            }
        }

        /// <summary>
        /// Check if cost center is over budget
        /// </summary>
        public bool IsOverBudget()
        {
            if (BudgetAmount?.Amount <= 0) return false;

            var totalSpent = (ActualAmount?.Amount ?? 0) + (CommittedAmount?.Amount ?? 0);
            return totalSpent > BudgetAmount.Amount;
        }

        /// <summary>
        /// Get budget status description
        /// </summary>
        public string GetBudgetStatus()
        {
            var utilization = GetUtilizationPercentage();

            if (utilization <= 75) return "On Track";
            if (utilization <= 90) return "Caution";
            if (utilization <= 100) return "Near Limit";
            return "Over Budget";
        }

        /// <summary>
        /// Get full cost center path
        /// </summary>
        public string GetFullPath(string separator = " > ")
        {
            var path = Name;
            var current = ParentCostCenter;

            while (current != null)
            {
                path = $"{current.Name}{separator}{path}";
                current = current.ParentCostCenter;
            }

            return path;
        }

        /// <summary>
        /// Get all child cost centers recursively
        /// </summary>
        public IEnumerable<CostCenter> GetAllChildren()
        {
            var children = new List<CostCenter>();

            foreach (var child in ChildCostCenters.Where(c => !c.IsDeleted && c.IsActive))
            {
                children.Add(child);
                children.AddRange(child.GetAllChildren());
            }

            return children;
        }

        /// <summary>
        /// Roll up budget from child cost centers
        /// </summary>
        public void RollUpBudget()
        {
            var totalBudget = BudgetAmount?.Amount ?? 0;
            var totalAllocated = AllocatedAmount?.Amount ?? 0;
            var totalCommitted = CommittedAmount?.Amount ?? 0;
            var totalActual = ActualAmount?.Amount ?? 0;

            foreach (var child in ChildCostCenters.Where(c => !c.IsDeleted && c.IsActive))
            {
                child.RollUpBudget();

                totalBudget += child.BudgetAmount?.Amount ?? 0;
                totalAllocated += child.AllocatedAmount?.Amount ?? 0;
                totalCommitted += child.CommittedAmount?.Amount ?? 0;
                totalActual += child.ActualAmount?.Amount ?? 0;
            }

            // Update rolled-up amounts (optional - depends on business logic)
            if (ChildCostCenters.Any())
            {
                Metadata["RolledUpBudget"] = totalBudget;
                Metadata["RolledUpAllocated"] = totalAllocated;
                Metadata["RolledUpCommitted"] = totalCommitted;
                Metadata["RolledUpActual"] = totalActual;
            }
        }
    }
}