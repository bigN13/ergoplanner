# File Structure Templates - Ergoplanner AI Suite

## Table of Contents
1. [Backend Templates](#backend-templates)
2. [Frontend Templates](#frontend-templates)
3. [Test Templates](#test-templates)
4. [Configuration Templates](#configuration-templates)

---

## 1. Backend Templates

### 1.1 Entity Class Template

```csharp
// File: Ergoplanner.Domain/Entities/{EntityName}.cs
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Ergoplanner.Domain.Common;
using Ergoplanner.Domain.Enums;
using Ergoplanner.Domain.Interfaces;

namespace Ergoplanner.Domain.Entities
{
    /// <summary>
    /// Represents a {EntityName} in the P&ID system
    /// </summary>
    [Table("{EntityName}s")]
    public class {EntityName} : BaseEntity, IAuditable, ISoftDeletable, IValidatable
    {
        #region Properties

        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Required]
        [Column("name")]
        [StringLength(255, MinimumLength = 1)]
        public string Name { get; set; }

        [Column("code")]
        [StringLength(50)]
        [RegularExpression(@"^[A-Z]{2,5}-\d{4}-\d{3}$")]
        public string Code { get; set; }

        [Column("description")]
        [StringLength(2000)]
        public string Description { get; set; }

        [Column("metadata", TypeName = "jsonb")]
        public Dictionary<string, object> Metadata { get; set; } = new();

        #endregion

        #region Audit Properties

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("created_by")]
        [StringLength(255)]
        public string CreatedBy { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        [Column("updated_by")]
        [StringLength(255)]
        public string UpdatedBy { get; set; }

        [Column("deleted_at")]
        public DateTime? DeletedAt { get; set; }

        [Column("deleted_by")]
        [StringLength(255)]
        public string DeletedBy { get; set; }

        [Column("is_deleted")]
        public bool IsDeleted { get; set; }

        [Column("version")]
        [ConcurrencyCheck]
        public int Version { get; set; }

        #endregion

        #region Navigation Properties

        [ForeignKey("ProjectId")]
        public virtual Project Project { get; set; }

        [Column("project_id")]
        public Guid ProjectId { get; set; }

        public virtual ICollection<RelatedEntity> RelatedEntities { get; set; } = new List<RelatedEntity>();

        #endregion

        #region Business Logic

        /// <summary>
        /// Validates the entity state
        /// </summary>
        public ValidationResult Validate()
        {
            var errors = new List<string>();

            if (string.IsNullOrWhiteSpace(Name))
                errors.Add("Name is required");

            if (CreatedAt > DateTime.UtcNow)
                errors.Add("Created date cannot be in the future");

            // Add custom validation rules
            ValidateBusinessRules(errors);

            return errors.Any()
                ? ValidationResult.Failure(errors)
                : ValidationResult.Success;
        }

        protected virtual void ValidateBusinessRules(List<string> errors)
        {
            // Override in derived classes for specific validation
        }

        /// <summary>
        /// Updates the entity with new values
        /// </summary>
        public void Update(string name, string description, string updatedBy)
        {
            Name = name ?? throw new ArgumentNullException(nameof(name));
            Description = description;
            UpdatedAt = DateTime.UtcNow;
            UpdatedBy = updatedBy;
            Version++;
        }

        /// <summary>
        /// Marks the entity as deleted (soft delete)
        /// </summary>
        public void Delete(string deletedBy)
        {
            IsDeleted = true;
            DeletedAt = DateTime.UtcNow;
            DeletedBy = deletedBy;
        }

        #endregion
    }
}
```

### 1.2 API Controller Template

```csharp
// File: Ergoplanner.API/Controllers/{EntityName}Controller.cs
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.AspNetCore.OData.Routing.Controllers;
using Microsoft.Extensions.Logging;
using MediatR;
using Ergoplanner.Application.Commands.{EntityName};
using Ergoplanner.Application.Queries.{EntityName};
using Ergoplanner.Application.DTOs.{EntityName};
using Ergoplanner.API.Filters;
using Ergoplanner.API.Models.Responses;

namespace Ergoplanner.API.Controllers
{
    /// <summary>
    /// Manages {EntityName} operations
    /// </summary>
    [ApiController]
    [ApiVersion("1.0")]
    [Route("api/v{version:apiVersion}/[controller]")]
    [Authorize]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status500InternalServerError)]
    public class {EntityName}Controller : ODataController
    {
        private readonly IMediator _mediator;
        private readonly ILogger<{EntityName}Controller> _logger;

        public {EntityName}Controller(
            IMediator mediator,
            ILogger<{EntityName}Controller> logger)
        {
            _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Gets all {EntityName}s with OData query support
        /// </summary>
        [HttpGet]
        [EnableQuery(PageSize = 100, MaxExpansionDepth = 3)]
        [ProducesResponseType(typeof(IEnumerable<{EntityName}Dto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> Get([FromQuery] {EntityName}QueryParameters parameters)
        {
            try
            {
                var query = new Get{EntityName}sQuery
                {
                    PageNumber = parameters.PageNumber,
                    PageSize = parameters.PageSize,
                    SearchTerm = parameters.SearchTerm,
                    SortBy = parameters.SortBy,
                    SortDescending = parameters.SortDescending,
                    IncludeDeleted = parameters.IncludeDeleted
                };

                var result = await _mediator.Send(query);

                // Add pagination headers
                Response.Headers.Add("X-Total-Count", result.TotalCount.ToString());
                Response.Headers.Add("X-Page-Number", result.PageNumber.ToString());
                Response.Headers.Add("X-Page-Size", result.PageSize.ToString());

                return Ok(result.Items);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving {EntityName}s");
                return StatusCode(500, new ErrorResponse
                {
                    Message = "An error occurred while retrieving {EntityName}s",
                    ErrorCode = "GET_{ENTITYNAME}_ERROR"
                });
            }
        }

        /// <summary>
        /// Gets a specific {EntityName} by ID
        /// </summary>
        [HttpGet("{id:guid}")]
        [ProducesResponseType(typeof({EntityName}Dto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Get(Guid id)
        {
            try
            {
                var query = new Get{EntityName}ByIdQuery { Id = id };
                var result = await _mediator.Send(query);

                if (result == null)
                {
                    return NotFound(new ErrorResponse
                    {
                        Message = $"{EntityName} with ID {id} not found",
                        ErrorCode = "{ENTITYNAME}_NOT_FOUND"
                    });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving {EntityName} with ID {Id}", id);
                return StatusCode(500, new ErrorResponse
                {
                    Message = $"An error occurred while retrieving {EntityName}",
                    ErrorCode = "GET_{ENTITYNAME}_ERROR"
                });
            }
        }

        /// <summary>
        /// Creates a new {EntityName}
        /// </summary>
        [HttpPost]
        [ValidateModel]
        [ProducesResponseType(typeof({EntityName}Dto), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ValidationErrorResponse), StatusCodes.Status422UnprocessableEntity)]
        public async Task<IActionResult> Post([FromBody] Create{EntityName}Request request)
        {
            try
            {
                var command = new Create{EntityName}Command
                {
                    Name = request.Name,
                    Code = request.Code,
                    Description = request.Description,
                    ProjectId = request.ProjectId,
                    Metadata = request.Metadata,
                    CreatedBy = User.Identity?.Name ?? "System"
                };

                var result = await _mediator.Send(command);

                return CreatedAtAction(
                    nameof(Get),
                    new { id = result.Id, version = HttpContext.GetRequestedApiVersion()?.ToString() },
                    result
                );
            }
            catch (ValidationException ex)
            {
                return UnprocessableEntity(new ValidationErrorResponse
                {
                    Message = "Validation failed",
                    Errors = ex.Errors
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating {EntityName}");
                return StatusCode(500, new ErrorResponse
                {
                    Message = "An error occurred while creating {EntityName}",
                    ErrorCode = "CREATE_{ENTITYNAME}_ERROR"
                });
            }
        }

        /// <summary>
        /// Updates an existing {EntityName}
        /// </summary>
        [HttpPut("{id:guid}")]
        [ValidateModel]
        [ProducesResponseType(typeof({EntityName}Dto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ValidationErrorResponse), StatusCodes.Status422UnprocessableEntity)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Put(Guid id, [FromBody] Update{EntityName}Request request)
        {
            try
            {
                var command = new Update{EntityName}Command
                {
                    Id = id,
                    Name = request.Name,
                    Description = request.Description,
                    Metadata = request.Metadata,
                    Version = request.Version,
                    UpdatedBy = User.Identity?.Name ?? "System"
                };

                var result = await _mediator.Send(command);

                if (result == null)
                {
                    return NotFound(new ErrorResponse
                    {
                        Message = $"{EntityName} with ID {id} not found",
                        ErrorCode = "{ENTITYNAME}_NOT_FOUND"
                    });
                }

                return Ok(result);
            }
            catch (ConcurrencyException ex)
            {
                return Conflict(new ErrorResponse
                {
                    Message = "The {EntityName} has been modified by another user",
                    ErrorCode = "CONCURRENCY_CONFLICT"
                });
            }
            catch (ValidationException ex)
            {
                return UnprocessableEntity(new ValidationErrorResponse
                {
                    Message = "Validation failed",
                    Errors = ex.Errors
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating {EntityName} with ID {Id}", id);
                return StatusCode(500, new ErrorResponse
                {
                    Message = "An error occurred while updating {EntityName}",
                    ErrorCode = "UPDATE_{ENTITYNAME}_ERROR"
                });
            }
        }

        /// <summary>
        /// Deletes a {EntityName} (soft delete)
        /// </summary>
        [HttpDelete("{id:guid}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                var command = new Delete{EntityName}Command
                {
                    Id = id,
                    DeletedBy = User.Identity?.Name ?? "System"
                };

                var result = await _mediator.Send(command);

                if (!result)
                {
                    return NotFound(new ErrorResponse
                    {
                        Message = $"{EntityName} with ID {id} not found",
                        ErrorCode = "{ENTITYNAME}_NOT_FOUND"
                    });
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting {EntityName} with ID {Id}", id);
                return StatusCode(500, new ErrorResponse
                {
                    Message = "An error occurred while deleting {EntityName}",
                    ErrorCode = "DELETE_{ENTITYNAME}_ERROR"
                });
            }
        }

        /// <summary>
        /// Bulk operations for {EntityName}s
        /// </summary>
        [HttpPost("bulk")]
        [ValidateModel]
        [ProducesResponseType(typeof(BulkOperationResponse), StatusCodes.Status200OK)]
        public async Task<IActionResult> BulkOperation([FromBody] Bulk{EntityName}Request request)
        {
            try
            {
                var command = new Bulk{EntityName}Command
                {
                    Operation = request.Operation,
                    EntityIds = request.EntityIds,
                    UpdateData = request.UpdateData,
                    PerformedBy = User.Identity?.Name ?? "System"
                };

                var result = await _mediator.Send(command);

                return Ok(new BulkOperationResponse
                {
                    SuccessCount = result.SuccessCount,
                    FailureCount = result.FailureCount,
                    Errors = result.Errors
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error performing bulk operation on {EntityName}s");
                return StatusCode(500, new ErrorResponse
                {
                    Message = "An error occurred during bulk operation",
                    ErrorCode = "BULK_OPERATION_ERROR"
                });
            }
        }
    }
}
```

### 1.3 Repository Template

```csharp
// File: Ergoplanner.Infrastructure/Repositories/{EntityName}Repository.cs
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Ergoplanner.Domain.Entities;
using Ergoplanner.Domain.Interfaces;
using Ergoplanner.Infrastructure.Data;

namespace Ergoplanner.Infrastructure.Repositories
{
    public class {EntityName}Repository : BaseRepository<{EntityName}>, I{EntityName}Repository
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<{EntityName}Repository> _logger;

        public {EntityName}Repository(
            ApplicationDbContext context,
            ILogger<{EntityName}Repository> logger) : base(context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<{EntityName}> GetByIdAsync(Guid id, bool includeDeleted = false)
        {
            var query = _context.{EntityName}s.AsQueryable();

            if (!includeDeleted)
                query = query.Where(e => !e.IsDeleted);

            return await query
                .Include(e => e.Project)
                .Include(e => e.RelatedEntities)
                .FirstOrDefaultAsync(e => e.Id == id);
        }

        public async Task<IEnumerable<{EntityName}>> GetAllAsync(
            int pageNumber = 1,
            int pageSize = 50,
            string searchTerm = null,
            bool includeDeleted = false)
        {
            var query = _context.{EntityName}s.AsQueryable();

            if (!includeDeleted)
                query = query.Where(e => !e.IsDeleted);

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                query = query.Where(e =>
                    e.Name.Contains(searchTerm) ||
                    e.Code.Contains(searchTerm) ||
                    e.Description.Contains(searchTerm));
            }

            return await query
                .OrderBy(e => e.Name)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<IEnumerable<{EntityName}>> FindAsync(
            Expression<Func<{EntityName}, bool>> predicate)
        {
            return await _context.{EntityName}s
                .Where(predicate)
                .Where(e => !e.IsDeleted)
                .ToListAsync();
        }

        public async Task<{EntityName}> AddAsync({EntityName} entity)
        {
            entity.CreatedAt = DateTime.UtcNow;
            entity.Version = 1;

            await _context.{EntityName}s.AddAsync(entity);
            await _context.SaveChangesAsync();

            _logger.LogInformation("{EntityName} created with ID {Id}", entity.Id);

            return entity;
        }

        public async Task<{EntityName}> UpdateAsync({EntityName} entity)
        {
            var existing = await _context.{EntityName}s
                .FirstOrDefaultAsync(e => e.Id == entity.Id && !e.IsDeleted);

            if (existing == null)
                return null;

            // Check for concurrency conflicts
            if (existing.Version != entity.Version)
            {
                throw new DbUpdateConcurrencyException(
                    "The entity has been modified by another user");
            }

            entity.UpdatedAt = DateTime.UtcNow;
            entity.Version++;

            _context.Entry(existing).CurrentValues.SetValues(entity);
            await _context.SaveChangesAsync();

            _logger.LogInformation("{EntityName} updated with ID {Id}", entity.Id);

            return entity;
        }

        public async Task<bool> DeleteAsync(Guid id, string deletedBy)
        {
            var entity = await _context.{EntityName}s
                .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted);

            if (entity == null)
                return false;

            entity.IsDeleted = true;
            entity.DeletedAt = DateTime.UtcNow;
            entity.DeletedBy = deletedBy;

            await _context.SaveChangesAsync();

            _logger.LogInformation("{EntityName} soft deleted with ID {Id}", id);

            return true;
        }

        public async Task<int> CountAsync(Expression<Func<{EntityName}, bool>> predicate = null)
        {
            var query = _context.{EntityName}s.Where(e => !e.IsDeleted);

            if (predicate != null)
                query = query.Where(predicate);

            return await query.CountAsync();
        }

        public async Task<bool> ExistsAsync(Expression<Func<{EntityName}, bool>> predicate)
        {
            return await _context.{EntityName}s
                .Where(e => !e.IsDeleted)
                .AnyAsync(predicate);
        }
    }
}
```

### 1.4 Service Template

```csharp
// File: Ergoplanner.Application/Services/{EntityName}Service.cs
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Caching.Memory;
using Ergoplanner.Application.DTOs.{EntityName};
using Ergoplanner.Application.Interfaces;
using Ergoplanner.Domain.Entities;
using Ergoplanner.Domain.Interfaces;
using Ergoplanner.Domain.Specifications;

namespace Ergoplanner.Application.Services
{
    public class {EntityName}Service : I{EntityName}Service
    {
        private readonly I{EntityName}Repository _repository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IMemoryCache _cache;
        private readonly ILogger<{EntityName}Service> _logger;
        private readonly IValidationService _validationService;
        private readonly IEventPublisher _eventPublisher;

        private const string CacheKeyPrefix = "{ENTITYNAME}_";
        private const int CacheExpirationMinutes = 10;

        public {EntityName}Service(
            I{EntityName}Repository repository,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IMemoryCache cache,
            ILogger<{EntityName}Service> logger,
            IValidationService validationService,
            IEventPublisher eventPublisher)
        {
            _repository = repository ?? throw new ArgumentNullException(nameof(repository));
            _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
            _cache = cache ?? throw new ArgumentNullException(nameof(cache));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _validationService = validationService ?? throw new ArgumentNullException(nameof(validationService));
            _eventPublisher = eventPublisher ?? throw new ArgumentNullException(nameof(eventPublisher));
        }

        public async Task<{EntityName}Dto> GetByIdAsync(Guid id)
        {
            var cacheKey = $"{CacheKeyPrefix}{id}";

            if (_cache.TryGetValue(cacheKey, out {EntityName}Dto cached))
            {
                _logger.LogDebug("Cache hit for {EntityName} with ID {Id}", id);
                return cached;
            }

            var entity = await _repository.GetByIdAsync(id);

            if (entity == null)
            {
                _logger.LogWarning("{EntityName} with ID {Id} not found", id);
                return null;
            }

            var dto = _mapper.Map<{EntityName}Dto>(entity);

            _cache.Set(cacheKey, dto, TimeSpan.FromMinutes(CacheExpirationMinutes));

            return dto;
        }

        public async Task<PagedResult<{EntityName}Dto>> GetAllAsync(
            int pageNumber,
            int pageSize,
            string searchTerm = null,
            string sortBy = null,
            bool sortDescending = false)
        {
            var specification = new {EntityName}Specification
            {
                PageNumber = pageNumber,
                PageSize = pageSize,
                SearchTerm = searchTerm,
                SortBy = sortBy,
                SortDescending = sortDescending
            };

            var entities = await _repository.FindAsync(specification);
            var totalCount = await _repository.CountAsync(specification.Criteria);

            var dtos = _mapper.Map<IEnumerable<{EntityName}Dto>>(entities);

            return new PagedResult<{EntityName}Dto>
            {
                Items = dtos,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            };
        }

        public async Task<{EntityName}Dto> CreateAsync(Create{EntityName}Dto dto)
        {
            // Validate
            var validationResult = await _validationService.ValidateAsync(dto);
            if (!validationResult.IsValid)
            {
                throw new ValidationException(validationResult.Errors);
            }

            // Check for duplicates
            if (await _repository.ExistsAsync(e => e.Code == dto.Code))
            {
                throw new BusinessException($"{EntityName} with code {dto.Code} already exists");
            }

            // Map and create
            var entity = _mapper.Map<{EntityName}>(dto);
            entity.Id = Guid.NewGuid();

            await _unitOfWork.BeginTransactionAsync();

            try
            {
                var created = await _repository.AddAsync(entity);
                await _unitOfWork.CommitAsync();

                // Publish event
                await _eventPublisher.PublishAsync(new {EntityName}CreatedEvent
                {
                    EntityId = created.Id,
                    CreatedBy = dto.CreatedBy,
                    CreatedAt = created.CreatedAt
                });

                var result = _mapper.Map<{EntityName}Dto>(created);

                // Invalidate related caches
                InvalidateRelatedCaches(entity.ProjectId);

                _logger.LogInformation("{EntityName} created successfully with ID {Id}", created.Id);

                return result;
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackAsync();
                _logger.LogError(ex, "Error creating {EntityName}");
                throw;
            }
        }

        public async Task<{EntityName}Dto> UpdateAsync(Guid id, Update{EntityName}Dto dto)
        {
            // Validate
            var validationResult = await _validationService.ValidateAsync(dto);
            if (!validationResult.IsValid)
            {
                throw new ValidationException(validationResult.Errors);
            }

            var entity = await _repository.GetByIdAsync(id);
            if (entity == null)
            {
                throw new NotFoundException($"{EntityName} with ID {id} not found");
            }

            // Check version for optimistic concurrency
            if (entity.Version != dto.Version)
            {
                throw new ConcurrencyException("The entity has been modified by another user");
            }

            // Update entity
            _mapper.Map(dto, entity);

            await _unitOfWork.BeginTransactionAsync();

            try
            {
                var updated = await _repository.UpdateAsync(entity);
                await _unitOfWork.CommitAsync();

                // Publish event
                await _eventPublisher.PublishAsync(new {EntityName}UpdatedEvent
                {
                    EntityId = updated.Id,
                    UpdatedBy = dto.UpdatedBy,
                    UpdatedAt = updated.UpdatedAt.Value
                });

                var result = _mapper.Map<{EntityName}Dto>(updated);

                // Invalidate cache
                _cache.Remove($"{CacheKeyPrefix}{id}");
                InvalidateRelatedCaches(entity.ProjectId);

                _logger.LogInformation("{EntityName} updated successfully with ID {Id}", id);

                return result;
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackAsync();
                _logger.LogError(ex, "Error updating {EntityName} with ID {Id}", id);
                throw;
            }
        }

        public async Task<bool> DeleteAsync(Guid id, string deletedBy)
        {
            var exists = await _repository.ExistsAsync(e => e.Id == id);
            if (!exists)
            {
                throw new NotFoundException($"{EntityName} with ID {id} not found");
            }

            await _unitOfWork.BeginTransactionAsync();

            try
            {
                var result = await _repository.DeleteAsync(id, deletedBy);
                await _unitOfWork.CommitAsync();

                // Publish event
                await _eventPublisher.PublishAsync(new {EntityName}DeletedEvent
                {
                    EntityId = id,
                    DeletedBy = deletedBy,
                    DeletedAt = DateTime.UtcNow
                });

                // Invalidate cache
                _cache.Remove($"{CacheKeyPrefix}{id}");

                _logger.LogInformation("{EntityName} deleted successfully with ID {Id}", id);

                return result;
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackAsync();
                _logger.LogError(ex, "Error deleting {EntityName} with ID {Id}", id);
                throw;
            }
        }

        private void InvalidateRelatedCaches(Guid projectId)
        {
            _cache.Remove($"PROJECT_{projectId}_ENTITIES");
            // Add more related cache invalidation as needed
        }
    }
}
```

---

## 2. Frontend Templates

### 2.1 React Component Template

```typescript
// File: src/components/{ComponentName}/{ComponentName}.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '@/lib/api';
import type { {ComponentName}Props, {ComponentName}Data } from '@/types/{componentName}';

// Validation schema
const {componentName}Schema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(2000).optional(),
  value: z.number().min(0).max(1000),
  isActive: z.boolean().default(true),
});

type {ComponentName}FormData = z.infer<typeof {componentName}Schema>;

/**
 * {ComponentName} component for managing {description}
 */
export const {ComponentName}: React.FC<{ComponentName}Props> = ({
  id,
  initialData,
  onSuccess,
  onCancel,
  className,
  ...props
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Local state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm<{ComponentName}FormData>({
    resolver: zodResolver({componentName}Schema),
    defaultValues: initialData || {
      name: '',
      description: '',
      value: 0,
      isActive: true,
    },
  });

  // Watch form values for conditional rendering
  const watchedValue = watch('value');

  // Fetch data query
  const { data, isLoading, error: queryError } = useQuery({
    queryKey: ['{componentName}', id],
    queryFn: () => api.get{ComponentName}(id),
    enabled: !!id,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: {ComponentName}FormData) => api.create{ComponentName}(data),
    onSuccess: (result) => {
      toast.success('{ComponentName} created successfully');
      queryClient.invalidateQueries({ queryKey: ['{componentName}s'] });
      onSuccess?.(result);
      reset();
    },
    onError: (error: Error) => {
      toast.error(`Failed to create: ${error.message}`);
      setError(error.message);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: {ComponentName}FormData) =>
      api.update{ComponentName}(id!, data),
    onSuccess: (result) => {
      toast.success('{ComponentName} updated successfully');
      queryClient.invalidateQueries({ queryKey: ['{componentName}', id] });
      onSuccess?.(result);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
      setError(error.message);
    },
  });

  // Form submission handler
  const onSubmit = useCallback(
    async (data: {ComponentName}FormData) => {
      setIsSubmitting(true);
      setError(null);

      try {
        if (id) {
          await updateMutation.mutateAsync(data);
        } else {
          await createMutation.mutateAsync(data);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [id, createMutation, updateMutation]
  );

  // Cancel handler
  const handleCancel = useCallback(() => {
    if (isDirty) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        reset();
        onCancel?.();
      }
    } else {
      onCancel?.();
    }
  }, [isDirty, reset, onCancel]);

  // Computed values
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  // Effects
  useEffect(() => {
    if (data) {
      reset(data);
    }
  }, [data, reset]);

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn('w-full', className)} {...props}>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (queryError) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertDescription>
          Failed to load data: {queryError.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={cn('w-full', className)} {...props}>
      <CardHeader>
        <CardTitle>
          {id ? 'Edit' : 'Create'} {ComponentName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {/* Name field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Enter name"
                disabled={isSubmitting}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Description field */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                id="description"
                {...register('description')}
                placeholder="Enter description"
                disabled={isSubmitting}
                className={cn(
                  'w-full px-3 py-2 border rounded-md',
                  errors.description ? 'border-red-500' : 'border-gray-300'
                )}
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Value field */}
            <div>
              <label htmlFor="value" className="block text-sm font-medium mb-1">
                Value
              </label>
              <Input
                id="value"
                type="number"
                {...register('value', { valueAsNumber: true })}
                placeholder="Enter value"
                disabled={isSubmitting}
                className={errors.value ? 'border-red-500' : ''}
              />
              {errors.value && (
                <p className="text-sm text-red-500 mt-1">{errors.value.message}</p>
              )}
              {watchedValue > 500 && (
                <p className="text-sm text-yellow-600 mt-1">
                  Warning: High value detected
                </p>
              )}
            </div>

            {/* Active checkbox */}
            <div className="flex items-center space-x-2">
              <input
                id="isActive"
                type="checkbox"
                {...register('isActive')}
                disabled={isSubmitting}
                className="h-4 w-4"
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Active
              </label>
            </div>
          </div>

          {/* Form actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty || !isValid}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                <span>{id ? 'Update' : 'Create'}</span>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// Display name for debugging
{ComponentName}.displayName = '{ComponentName}';

// Default export
export default {ComponentName};
```

### 2.2 Custom Hook Template

```typescript
// File: src/hooks/use{HookName}.ts
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { {HookName}Options, {HookName}Result } from '@/types/hooks';

/**
 * Custom hook for {description}
 *
 * @param options - Configuration options for the hook
 * @returns Hook result with data and methods
 *
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = use{HookName}({
 *   enabled: true,
 *   onSuccess: (data) => console.log(data),
 * });
 * ```
 */
export function use{HookName}(options: {HookName}Options = {}): {HookName}Result {
  const {
    enabled = true,
    initialData,
    onSuccess,
    onError,
    debounceMs = 300,
  } = options;

  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController>();
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Local state
  const [localData, setLocalData] = useState(initialData);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch data
  const {
    data: remoteData,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['{hookName}', options],
    queryFn: async ({ signal }) => {
      const response = await api.fetch{HookName}Data({
        ...options,
        signal,
      });
      return response;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    onSuccess: (data) => {
      setLocalData(data);
      onSuccess?.(data);
    },
    onError: (error: Error) => {
      setError(error);
      onError?.(error);
      toast.error(`Failed to load: ${error.message}`);
    },
  });

  // Process data mutation
  const processMutation = useMutation({
    mutationFn: async (input: any) => {
      setIsProcessing(true);
      return api.process{HookName}(input);
    },
    onSuccess: (result) => {
      setLocalData(result);
      queryClient.invalidateQueries({ queryKey: ['{hookName}'] });
      toast.success('Processing completed');
      onSuccess?.(result);
    },
    onError: (error: Error) => {
      setError(error);
      onError?.(error);
      toast.error(`Processing failed: ${error.message}`);
    },
    onSettled: () => {
      setIsProcessing(false);
    },
  });

  // Debounced update function
  const debouncedUpdate = useCallback(
    (value: any) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        processMutation.mutate(value);
      }, debounceMs);
    },
    [debounceMs, processMutation]
  );

  // Cancel ongoing operations
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = undefined;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    setIsProcessing(false);
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setLocalData(initialData);
    setError(null);
    setIsProcessing(false);
    cancel();
  }, [initialData, cancel]);

  // Computed values
  const hasError = useMemo(() => {
    return !!(error || queryError);
  }, [error, queryError]);

  const isEmpty = useMemo(() => {
    if (!localData) return true;
    if (Array.isArray(localData)) return localData.length === 0;
    if (typeof localData === 'object') return Object.keys(localData).length === 0;
    return false;
  }, [localData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  // Sync remote data with local data
  useEffect(() => {
    if (remoteData && !isProcessing) {
      setLocalData(remoteData);
    }
  }, [remoteData, isProcessing]);

  return {
    // Data
    data: localData,
    remoteData,

    // State
    isLoading: isLoading || isProcessing,
    error: error || queryError,
    hasError,
    isEmpty,

    // Methods
    refetch,
    update: debouncedUpdate,
    cancel,
    reset,

    // Utilities
    setData: setLocalData,
    mutate: processMutation.mutate,
  };
}

// Re-export for convenience
export default use{HookName};
```

---

## 3. Test Templates

### 3.1 Unit Test Template

```typescript
// File: src/__tests__/{ComponentName}.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { {ComponentName} } from '@/components/{ComponentName}';
import { api } from '@/lib/api';
import type { {ComponentName}Props } from '@/types/{componentName}';

// Mock the API module
vi.mock('@/lib/api', () => ({
  api: {
    get{ComponentName}: vi.fn(),
    create{ComponentName}: vi.fn(),
    update{ComponentName}: vi.fn(),
    delete{ComponentName}: vi.fn(),
  },
}));

// Mock data
const mockData = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test {ComponentName}',
  description: 'Test description',
  value: 100,
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-02T00:00:00Z',
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Render helper
const renderComponent = (props: Partial<{ComponentName}Props> = {}) => {
  const defaultProps: {ComponentName}Props = {
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
    ...props,
  };

  return render(
    <TestWrapper>
      <{ComponentName} {...defaultProps} />
    </TestWrapper>
  );
};

describe('{ComponentName}', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render correctly in create mode', () => {
      renderComponent();

      expect(screen.getByText('Create {ComponentName}')).toBeInTheDocument();
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/value/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should render correctly in edit mode', async () => {
      vi.mocked(api.get{ComponentName}).mockResolvedValue(mockData);

      renderComponent({ id: mockData.id });

      await waitFor(() => {
        expect(screen.getByText('Edit {ComponentName}')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
      expect(nameInput.value).toBe(mockData.name);
    });

    it('should show loading state while fetching data', () => {
      vi.mocked(api.get{ComponentName}).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderComponent({ id: mockData.id });

      expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
    });

    it('should show error state when fetching fails', async () => {
      const errorMessage = 'Failed to fetch data';
      vi.mocked(api.get{ComponentName}).mockRejectedValue(new Error(errorMessage));

      renderComponent({ id: mockData.id });

      await waitFor(() => {
        expect(screen.getByText(new RegExp(errorMessage))).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should show validation error for empty name', async () => {
      const user = userEvent.setup();
      renderComponent();

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for invalid value', async () => {
      const user = userEvent.setup();
      renderComponent();

      const valueInput = screen.getByLabelText(/value/i);
      await user.type(valueInput, '-1');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/must be greater than or equal to 0/i)).toBeInTheDocument();
      });
    });

    it('should show warning for high values', async () => {
      const user = userEvent.setup();
      renderComponent();

      const valueInput = screen.getByLabelText(/value/i);
      await user.clear(valueInput);
      await user.type(valueInput, '600');

      await waitFor(() => {
        expect(screen.getByText(/warning: high value detected/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should create new item successfully', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      const createdData = { ...mockData, id: 'new-id' };

      vi.mocked(api.create{ComponentName}).mockResolvedValue(createdData);

      renderComponent({ onSuccess });

      // Fill form
      const nameInput = screen.getByLabelText(/name/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const valueInput = screen.getByLabelText(/value/i);

      await user.type(nameInput, 'New {ComponentName}');
      await user.type(descriptionInput, 'New description');
      await user.clear(valueInput);
      await user.type(valueInput, '150');

      // Submit
      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(api.create{ComponentName}).toHaveBeenCalledWith({
          name: 'New {ComponentName}',
          description: 'New description',
          value: 150,
          isActive: true,
        });
        expect(onSuccess).toHaveBeenCalledWith(createdData);
      });
    });

    it('should update existing item successfully', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      const updatedData = { ...mockData, name: 'Updated Name' };

      vi.mocked(api.get{ComponentName}).mockResolvedValue(mockData);
      vi.mocked(api.update{ComponentName}).mockResolvedValue(updatedData);

      renderComponent({ id: mockData.id, onSuccess });

      await waitFor(() => {
        expect(screen.getByDisplayValue(mockData.name)).toBeInTheDocument();
      });

      // Update form
      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      // Submit
      const submitButton = screen.getByRole('button', { name: /update/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(api.update{ComponentName}).toHaveBeenCalledWith(
          mockData.id,
          expect.objectContaining({
            name: 'Updated Name',
          })
        );
        expect(onSuccess).toHaveBeenCalledWith(updatedData);
      });
    });

    it('should handle submission errors', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Server error';

      vi.mocked(api.create{ComponentName}).mockRejectedValue(new Error(errorMessage));

      renderComponent();

      // Fill and submit form
      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Test');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(new RegExp(errorMessage))).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should confirm before canceling with unsaved changes', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      renderComponent({ onCancel });

      // Make changes
      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Changes');

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(confirmSpy).toHaveBeenCalledWith(
        'You have unsaved changes. Are you sure you want to cancel?'
      );
      expect(onCancel).toHaveBeenCalled();
    });

    it('should not confirm when canceling without changes', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      const confirmSpy = vi.spyOn(window, 'confirm');

      renderComponent({ onCancel });

      // Click cancel without making changes
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(confirmSpy).not.toHaveBeenCalled();
      expect(onCancel).toHaveBeenCalled();
    });

    it('should disable submit button when form is invalid', async () => {
      const user = userEvent.setup();
      renderComponent();

      const submitButton = screen.getByRole('button', { name: /create/i });

      // Initially disabled (empty form)
      expect(submitButton).toBeDisabled();

      // Type invalid name (too long)
      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'a'.repeat(256));

      // Should still be disabled
      expect(submitButton).toBeDisabled();
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();

      vi.mocked(api.create{ComponentName}).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockData), 100))
      );

      renderComponent();

      // Fill form
      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Test');

      // Submit
      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      // Check loading state
      expect(screen.getByText(/saving/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.queryByText(/saving/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderComponent();

      expect(screen.getByLabelText(/name/i)).toHaveAttribute('id', 'name');
      expect(screen.getByLabelText(/description/i)).toHaveAttribute('id', 'description');
      expect(screen.getByLabelText(/value/i)).toHaveAttribute('id', 'value');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Tab through form
      await user.tab();
      expect(screen.getByLabelText(/name/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/description/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/value/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/active/i)).toHaveFocus();
    });

    it('should announce errors to screen readers', async () => {
      const user = userEvent.setup();
      renderComponent();

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(/name is required/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });
  });
});
```

---

## 4. Configuration Templates

### 4.1 Database Migration Template

```csharp
// File: Ergoplanner.Infrastructure/Migrations/{Timestamp}_{MigrationName}.cs
using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Ergoplanner.Infrastructure.Migrations
{
    public partial class {MigrationName} : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Create table
            migrationBuilder.CreateTable(
                name: "{TableName}s",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    description = table.Column<string>(type: "text", maxLength: 2000, nullable: true),
                    metadata = table.Column<string>(type: "jsonb", nullable: true),

                    // Foreign keys
                    project_id = table.Column<Guid>(type: "uuid", nullable: false),

                    // Audit columns
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    deleted_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    version = table.Column<int>(type: "integer", nullable: false, defaultValue: 1)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_{TableName}s", x => x.id);
                    table.ForeignKey(
                        name: "FK_{TableName}s_Projects_project_id",
                        column: x => x.project_id,
                        principalTable: "Projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            // Create indexes
            migrationBuilder.CreateIndex(
                name: "IX_{TableName}s_project_id",
                table: "{TableName}s",
                column: "project_id");

            migrationBuilder.CreateIndex(
                name: "IX_{TableName}s_code",
                table: "{TableName}s",
                column: "code",
                unique: true,
                filter: "is_deleted = false");

            migrationBuilder.CreateIndex(
                name: "IX_{TableName}s_name",
                table: "{TableName}s",
                column: "name");

            migrationBuilder.CreateIndex(
                name: "IX_{TableName}s_created_at",
                table: "{TableName}s",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "IX_{TableName}s_is_deleted",
                table: "{TableName}s",
                column: "is_deleted");

            // Create GIN index for JSONB column
            migrationBuilder.Sql(
                "CREATE INDEX \"IX_{TableName}s_metadata\" ON \"{TableName}s\" USING gin (metadata);");

            // Create audit trigger
            migrationBuilder.Sql($@"
                CREATE OR REPLACE FUNCTION update_{TableName.ToLower()}_updated_at()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.updated_at = CURRENT_TIMESTAMP;
                    NEW.version = OLD.version + 1;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;

                CREATE TRIGGER update_{TableName.ToLower()}_timestamp
                BEFORE UPDATE ON ""{TableName}s""
                FOR EACH ROW
                EXECUTE FUNCTION update_{TableName.ToLower()}_updated_at();
            ");

            // Seed initial data
            migrationBuilder.InsertData(
                table: "{TableName}s",
                columns: new[] { "id", "name", "code", "description", "project_id", "created_at", "created_by" },
                values: new object[,]
                {
                    {
                        Guid.Parse("11111111-1111-1111-1111-111111111111"),
                        "Default {TableName}",
                        "DEFAULT",
                        "System default {TableName}",
                        Guid.Parse("00000000-0000-0000-0000-000000000001"),
                        DateTime.UtcNow,
                        "System"
                    }
                });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop trigger and function
            migrationBuilder.Sql($@"
                DROP TRIGGER IF EXISTS update_{TableName.ToLower()}_timestamp ON ""{TableName}s"";
                DROP FUNCTION IF EXISTS update_{TableName.ToLower()}_updated_at();
            ");

            // Drop indexes
            migrationBuilder.DropIndex(
                name: "IX_{TableName}s_project_id",
                table: "{TableName}s");

            migrationBuilder.DropIndex(
                name: "IX_{TableName}s_code",
                table: "{TableName}s");

            migrationBuilder.DropIndex(
                name: "IX_{TableName}s_name",
                table: "{TableName}s");

            migrationBuilder.DropIndex(
                name: "IX_{TableName}s_created_at",
                table: "{TableName}s");

            migrationBuilder.DropIndex(
                name: "IX_{TableName}s_is_deleted",
                table: "{TableName}s");

            // Drop table
            migrationBuilder.DropTable(
                name: "{TableName}s");
        }
    }
}
```

---

This file structure templates document provides comprehensive, production-ready templates for all major file types in the Ergoplanner AI Suite, with complete implementations including validation, error handling, testing, and best practices.