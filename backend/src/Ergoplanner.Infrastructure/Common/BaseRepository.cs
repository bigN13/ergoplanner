using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;
using System.Linq.Expressions;

namespace Ergoplanner.Infrastructure.Common;

public abstract class BaseRepository<T> where T : class
{
    protected readonly DbContext Context;
    protected readonly DbSet<T> DbSet;
    protected readonly ILogger Logger;

    protected BaseRepository(DbContext context, ILogger logger)
    {
        Context = context;
        DbSet = context.Set<T>();
        Logger = logger;
    }

    protected async Task<TResult> ExecuteWithLogging<TResult>(
        string operationName,
        Func<Task<TResult>> operation,
        object? parameters = null)
    {
        var stopwatch = Stopwatch.StartNew();
        var correlationId = Activity.Current?.Id ?? Guid.NewGuid().ToString();

        try
        {
            Logger.LogDebug("Starting database operation {OperationName} with correlation ID {CorrelationId}",
                operationName, correlationId);

            if (parameters != null)
            {
                Logger.LogTrace("Database operation parameters for {OperationName}: {@Parameters}",
                    operationName, parameters);
            }

            var result = await operation();

            stopwatch.Stop();

            Logger.LogDebug("Completed database operation {OperationName} with correlation ID {CorrelationId} in {ElapsedMs}ms",
                operationName, correlationId, stopwatch.ElapsedMilliseconds);

            // Log slow queries
            if (stopwatch.ElapsedMilliseconds > 1000)
            {
                Logger.LogWarning("Slow database operation detected: {OperationName} with correlation ID {CorrelationId} took {ElapsedMs}ms",
                    operationName, correlationId, stopwatch.ElapsedMilliseconds);
            }

            return result;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();

            Logger.LogError(ex, "Database operation failed: {OperationName} with correlation ID {CorrelationId} after {ElapsedMs}ms: {ErrorMessage}",
                operationName, correlationId, stopwatch.ElapsedMilliseconds, ex.Message);

            if (parameters != null)
            {
                Logger.LogTrace("Failed operation parameters for {OperationName}: {@Parameters}",
                    operationName, parameters);
            }

            throw;
        }
    }

    protected async Task ExecuteWithLogging(
        string operationName,
        Func<Task> operation,
        object? parameters = null)
    {
        var stopwatch = Stopwatch.StartNew();
        var correlationId = Activity.Current?.Id ?? Guid.NewGuid().ToString();

        try
        {
            Logger.LogDebug("Starting database operation {OperationName} with correlation ID {CorrelationId}",
                operationName, correlationId);

            if (parameters != null)
            {
                Logger.LogTrace("Database operation parameters for {OperationName}: {@Parameters}",
                    operationName, parameters);
            }

            await operation();

            stopwatch.Stop();

            Logger.LogDebug("Completed database operation {OperationName} with correlation ID {CorrelationId} in {ElapsedMs}ms",
                operationName, correlationId, stopwatch.ElapsedMilliseconds);

            // Log slow queries
            if (stopwatch.ElapsedMilliseconds > 1000)
            {
                Logger.LogWarning("Slow database operation detected: {OperationName} with correlation ID {CorrelationId} took {ElapsedMs}ms",
                    operationName, correlationId, stopwatch.ElapsedMilliseconds);
            }
        }
        catch (Exception ex)
        {
            stopwatch.Stop();

            Logger.LogError(ex, "Database operation failed: {OperationName} with correlation ID {CorrelationId} after {ElapsedMs}ms: {ErrorMessage}",
                operationName, correlationId, stopwatch.ElapsedMilliseconds, ex.Message);

            if (parameters != null)
            {
                Logger.LogTrace("Failed operation parameters for {OperationName}: {@Parameters}",
                    operationName, parameters);
            }

            throw;
        }
    }

    protected virtual async Task<T?> GetByIdAsync(object id)
    {
        return await ExecuteWithLogging(
            $"GetById{typeof(T).Name}",
            async () => await DbSet.FindAsync(id),
            new { Id = id });
    }

    protected virtual async Task<IEnumerable<T>> GetAllAsync()
    {
        return await ExecuteWithLogging(
            $"GetAll{typeof(T).Name}",
            async () => await DbSet.ToListAsync());
    }

    protected virtual async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
    {
        return await ExecuteWithLogging(
            $"Find{typeof(T).Name}",
            async () => await DbSet.Where(predicate).ToListAsync(),
            new { Predicate = predicate.ToString() });
    }

    protected virtual async Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate)
    {
        return await ExecuteWithLogging(
            $"FirstOrDefault{typeof(T).Name}",
            async () => await DbSet.FirstOrDefaultAsync(predicate),
            new { Predicate = predicate.ToString() });
    }

    protected virtual async Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null)
    {
        return await ExecuteWithLogging(
            $"Count{typeof(T).Name}",
            async () => predicate == null ? await DbSet.CountAsync() : await DbSet.CountAsync(predicate),
            new { Predicate = predicate?.ToString() });
    }

    protected virtual async Task<bool> AnyAsync(Expression<Func<T, bool>> predicate)
    {
        return await ExecuteWithLogging(
            $"Any{typeof(T).Name}",
            async () => await DbSet.AnyAsync(predicate),
            new { Predicate = predicate.ToString() });
    }

    protected virtual async Task<T> AddAsync(T entity)
    {
        return await ExecuteWithLogging(
            $"Add{typeof(T).Name}",
            async () =>
            {
                var entry = await DbSet.AddAsync(entity);
                await Context.SaveChangesAsync();
                return entry.Entity;
            },
            new { Entity = entity });
    }

    protected virtual async Task UpdateAsync(T entity)
    {
        await ExecuteWithLogging(
            $"Update{typeof(T).Name}",
            async () =>
            {
                DbSet.Update(entity);
                await Context.SaveChangesAsync();
            },
            new { Entity = entity });
    }

    protected virtual async Task DeleteAsync(T entity)
    {
        await ExecuteWithLogging(
            $"Delete{typeof(T).Name}",
            async () =>
            {
                DbSet.Remove(entity);
                await Context.SaveChangesAsync();
            },
            new { Entity = entity });
    }

    protected virtual async Task DeleteByIdAsync(object id)
    {
        await ExecuteWithLogging(
            $"DeleteById{typeof(T).Name}",
            async () =>
            {
                var entity = await DbSet.FindAsync(id);
                if (entity != null)
                {
                    DbSet.Remove(entity);
                    await Context.SaveChangesAsync();
                }
            },
            new { Id = id });
    }
}