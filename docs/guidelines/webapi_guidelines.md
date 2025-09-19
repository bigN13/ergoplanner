# HazopFlow Web API Development Guidance
## Clean Architecture Implementation with Best Practices

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Clean Architecture Layers](#clean-architecture)
3. [SOLID Principles Implementation](#solid-principles)
4. [Repository and Unit of Work Patterns](#repository-uow)
5. [Entity Framework Core Configuration](#ef-core)
6. [ASP.NET Core API Design](#api-design)
7. [JWT Authentication Implementation](#jwt-auth)
8. [API Versioning Strategy](#api-versioning)
9. [OData Implementation](#odata)
10. [CRUD Operations Pattern](#crud-operations)
11. [Dependency Injection Configuration](#dependency-injection)
12. [Unit Testing Strategy](#unit-testing)
13. [Best Practices and Guidelines](#best-practices)

---

## 1. Architecture Overview {#architecture-overview}

### Solution Structure

The HazopFlow API follows Clean Architecture principles with clear separation of concerns across multiple projects:

```
HazopFlow/
├── src/
│   ├── HazopFlow.Domain/           # Enterprise business rules
│   ├── HazopFlow.Application/      # Application business rules
│   ├── HazopFlow.Infrastructure/   # External concerns
│   ├── HazopFlow.API/             # Presentation layer
│   └── HazopFlow.Shared/          # Cross-cutting concerns
├── tests/
│   ├── HazopFlow.Domain.Tests/
│   ├── HazopFlow.Application.Tests/
│   ├── HazopFlow.Infrastructure.Tests/
│   └── HazopFlow.API.Tests/
└── docs/
```

### Key Architectural Principles

**Dependency Rule**: Dependencies point inward. Inner layers know nothing about outer layers.

**Separation of Concerns**: Each layer has a specific responsibility and doesn't overlap with others.

**Testability**: Business logic is independent of external frameworks, making it easily testable.

**Independence**: The architecture is independent of frameworks, UI, database, and external agencies.

---

## 2. Clean Architecture Layers {#clean-architecture}

### Domain Layer (Core Business Logic)

**Purpose**: Contains enterprise-wide business rules and entities that are application-agnostic.

**Contents**:
- Domain Entities
- Value Objects
- Domain Events
- Domain Exceptions
- Enumerations
- Interfaces (for repositories and services)

**Key Characteristics**:
- No dependencies on other layers
- Pure business logic
- POCO classes
- Domain-driven design concepts

**Domain Entity Example Structure**:
- Study entity with business rules
- Node entity with validation logic
- Deviation entity with risk calculations
- Action entity with workflow states

### Application Layer (Use Cases)

**Purpose**: Contains application-specific business rules and orchestrates the flow of data.

**Contents**:
- Application Services
- DTOs (Data Transfer Objects)
- Application Interfaces
- Mappers
- Validators
- Command and Query Handlers (CQRS)
- Application Exceptions

**Key Characteristics**:
- Depends only on Domain layer
- Implements use cases
- Coordinates entity interactions
- Contains no business logic (only orchestration)

**Use Case Examples**:
- CreateStudyUseCase
- RecordDeviationUseCase
- AssignActionUseCase
- GenerateReportUseCase

### Infrastructure Layer (External Concerns)

**Purpose**: Implements interfaces defined in Domain and Application layers, handles external concerns.

**Contents**:
- Data Access Implementation (EF Core)
- Repository Implementations
- Unit of Work Implementation
- External Service Integrations
- File System Operations
- Email Services
- AI Service Integration
- Caching Implementation

**Key Characteristics**:
- Depends on Domain and Application layers
- Implements abstractions
- Contains all external dependencies
- Handles cross-cutting concerns

### API Layer (Presentation)

**Purpose**: Handles HTTP requests/responses and coordinates with Application layer.

**Contents**:
- Controllers
- API Models (Request/Response)
- Filters and Middleware
- API Versioning Configuration
- Authentication/Authorization
- OData Configuration
- Swagger Documentation

**Key Characteristics**:
- Thin controllers (no business logic)
- Maps between API models and Application DTOs
- Handles HTTP-specific concerns
- Implements security policies

---

## 3. SOLID Principles Implementation {#solid-principles}

### Single Responsibility Principle (SRP)

**Implementation Strategy**:
- Each class has one reason to change
- Separate concerns into focused classes
- Controllers only handle HTTP concerns
- Services handle specific business operations
- Repositories handle data access only

**Examples**:
- StudyController: Only handles Study-related HTTP requests
- StudyService: Only handles Study business logic
- StudyRepository: Only handles Study data access
- EmailNotificationService: Only handles email sending

### Open-Closed Principle (OCP)

**Implementation Strategy**:
- Use abstractions (interfaces) for extensibility
- Strategy pattern for varying behaviors
- Template method pattern for algorithms
- Plugin architecture for integrations

**Examples**:
- INotificationService with multiple implementations (Email, SMS, Push)
- IRiskCalculationStrategy with different calculation methods
- IDocumentProcessor with various file type processors

### Liskov Substitution Principle (LSP)

**Implementation Strategy**:
- Derived classes must be substitutable for base classes
- Avoid breaking invariants in derived classes
- Use composition over inheritance where appropriate
- Ensure consistent behavior across implementations

**Examples**:
- All repository implementations honor IRepository contract
- Authentication providers maintain same security guarantees
- Document processors handle errors consistently

### Interface Segregation Principle (ISP)

**Implementation Strategy**:
- Create focused, cohesive interfaces
- Avoid "fat" interfaces with unused methods
- Split large interfaces into smaller, specific ones
- Client-specific interfaces

**Examples**:
- IReadRepository<T> for read operations
- IWriteRepository<T> for write operations
- IAuthenticationService separate from IAuthorizationService
- IStudyQueryService separate from IStudyCommandService

### Dependency Inversion Principle (DIP)

**Implementation Strategy**:
- Depend on abstractions, not concretions
- High-level modules don't depend on low-level modules
- Both depend on abstractions
- Dependency injection for all dependencies

**Examples**:
- Controllers depend on IStudyService, not StudyService
- Application layer defines IStudyRepository, Infrastructure implements it
- Domain defines interfaces, outer layers implement them

---

## 4. Repository and Unit of Work Patterns {#repository-uow}

### Repository Pattern Implementation

**Generic Repository Interface**:
- Provides common CRUD operations
- Supports specification pattern for queries
- Enables testability through abstraction
- Supports async operations

**Specific Repository Interfaces**:
- Extend generic repository
- Add domain-specific queries
- Encapsulate complex data access logic
- Support eager loading strategies

**Repository Implementation Guidelines**:
- One repository per aggregate root
- No business logic in repositories
- Return domain entities, not data models
- Support both sync and async operations
- Implement pagination and sorting

### Unit of Work Pattern Implementation

**Purpose**:
- Manage transactions across multiple repositories
- Ensure data consistency
- Coordinate changes to multiple entities
- Provide single save point

**Implementation Strategy**:
- Wraps DbContext transaction management
- Coordinates multiple repository operations
- Implements rollback on failure
- Supports nested transactions

**Usage Patterns**:
- Begin unit of work at use case boundary
- Commit at successful completion
- Rollback on any failure
- Dispose to release resources

---

## 5. Entity Framework Core Configuration {#ef-core}

### DbContext Configuration

**Context Setup**:
- Separate contexts for bounded contexts
- Configuration through IEntityTypeConfiguration
- Lazy loading disabled by default
- Query tracking configuration

**Connection Management**:
- Connection string from configuration
- Connection resiliency for cloud deployment
- Multiple database support
- Read/write splitting support

### Entity Configuration

**Configuration Approach**:
- Fluent API over data annotations
- Separate configuration classes
- Convention-based configuration
- Override conventions where needed

**Mapping Strategies**:
- Table per hierarchy (TPH) for inheritance
- Owned types for value objects
- Shadow properties for audit fields
- Computed columns for calculations

### Migration Strategy

**Development Migrations**:
- Automatic migrations in development
- Seed data for testing
- Migration rollback support
- Schema versioning

**Production Migrations**:
- Script generation for review
- Staged deployment approach
- Zero-downtime migrations
- Rollback procedures

### Performance Optimization

**Query Optimization**:
- Appropriate use of Include/ThenInclude
- Projection for read-only queries
- Compiled queries for hot paths
- Batch operations for bulk updates

**Caching Strategy**:
- Second-level cache implementation
- Query result caching
- Entity caching
- Cache invalidation policies

---

## 6. ASP.NET Core API Design {#api-design}

### Controller Design

**RESTful Principles**:
- Resource-based URLs
- HTTP verbs for actions
- Status codes for responses
- HATEOAS where appropriate

**Controller Structure**:
- Inherit from ControllerBase
- Route attributes for URL mapping
- Action filters for cross-cutting concerns
- Model validation attributes

**Response Formatting**:
- Consistent response structure
- Problem Details for errors
- Pagination metadata in headers
- Content negotiation support

### Request/Response Models

**Request Models**:
- Separate from domain entities
- Validation attributes
- Custom validation logic
- Binding source specification

**Response Models**:
- DTOs for data transfer
- Exclude sensitive information
- Include necessary relationships
- Support partial responses

### Error Handling

**Global Exception Handling**:
- Exception middleware
- Structured error responses
- Logging integration
- Development vs. production responses

**Validation Errors**:
- Model state validation
- Custom validation messages
- Field-level error details
- Localization support

### Middleware Pipeline

**Pipeline Configuration**:
- CORS configuration
- Authentication/Authorization
- Request/Response logging
- Performance monitoring
- Rate limiting

---

## 7. JWT Authentication Implementation {#jwt-auth}

### Token Generation

**JWT Structure**:
- Header with algorithm and type
- Payload with claims
- Signature for verification
- Expiration management

**Claims Management**:
- User identity claims
- Role-based claims
- Custom claims for permissions
- Claim transformation

### Token Validation

**Validation Parameters**:
- Issuer validation
- Audience validation
- Lifetime validation
- Signature validation

**Security Considerations**:
- Secure key storage
- Key rotation strategy
- Token revocation
- Refresh token implementation

### Authorization Policies

**Policy-Based Authorization**:
- Role-based policies
- Claim-based policies
- Custom requirement handlers
- Resource-based authorization

**Implementation Strategy**:
- Authorize attributes on controllers
- Policy configuration in startup
- Custom authorization handlers
- Hierarchical permissions

---

## 8. API Versioning Strategy {#api-versioning}

### Versioning Approaches

**URL Path Versioning**:
- /api/v1/studies
- /api/v2/studies
- Clear and explicit
- Easy to route

**Header Versioning**:
- Custom header: api-version
- Clean URLs
- Client flexibility
- Default version support

**Query String Versioning**:
- /api/studies?api-version=1.0
- Optional parameter
- Backward compatible
- Easy testing

### Version Management

**Deprecation Strategy**:
- Sunset headers
- Deprecation notices
- Migration guides
- Grace period policy

**Breaking Changes**:
- Major version increments
- Compatibility documentation
- Migration tools
- Parallel operation period

---

## 9. OData Implementation {#odata}

### OData Configuration

**Entity Data Model**:
- EDM builder configuration
- Entity set definition
- Navigation properties
- Actions and functions

**Query Options**:
- $select for field selection
- $filter for data filtering
- $orderby for sorting
- $expand for related data
- $top and $skip for pagination
- $count for total counts

### OData Controllers

**Controller Implementation**:
- Inherit from ODataController
- EnableQuery attribute
- OData routing
- Action selection

**Query Capabilities**:
- Server-side filtering
- Dynamic sorting
- Projection support
- Aggregation queries

### Security Considerations

**Query Validation**:
- Max expansion depth
- Max node count
- Allowed functions
- Property access control

**Performance Guards**:
- Query complexity limits
- Result size limits
- Timeout configuration
- Resource throttling

---

## 10. CRUD Operations Pattern {#crud-operations}

### Create Operations

**Pattern Implementation**:
- POST endpoint
- Request validation
- Business rule validation
- Entity creation
- Response with created resource

**Considerations**:
- Idempotency
- Duplicate detection
- Default values
- Audit trail

### Read Operations

**Query Patterns**:
- GET by ID
- GET collection
- Search/filter operations
- Pagination support
- Sorting options

**Performance Optimization**:
- Projection for efficiency
- Caching strategies
- Lazy vs. eager loading
- Query optimization

### Update Operations

**Update Strategies**:
- PUT for full updates
- PATCH for partial updates
- Optimistic concurrency
- Validation rules

**Implementation Considerations**:
- Concurrency handling
- Partial update complexity
- Audit logging
- Change tracking

### Delete Operations

**Delete Patterns**:
- Soft delete vs. hard delete
- Cascade delete rules
- Validation before deletion
- Audit trail

**Safety Measures**:
- Confirmation requirements
- Recovery mechanisms
- Referential integrity
- Archive before delete

---

## 11. Dependency Injection Configuration {#dependency-injection}

### Service Registration

**Lifetime Management**:
- Transient for stateless services
- Scoped for per-request services
- Singleton for shared services
- Factory patterns for complex creation

**Registration Patterns**:
- Interface to implementation mapping
- Generic service registration
- Conditional registration
- Module-based registration

### Service Resolution

**Constructor Injection**:
- Preferred approach
- Explicit dependencies
- Compile-time checking
- Easy testing

**Service Locator Anti-Pattern**:
- Avoid when possible
- Hidden dependencies
- Harder to test
- Runtime failures

### Advanced Scenarios

**Multiple Implementations**:
- Named services
- Factory pattern
- Strategy pattern
- Decorator pattern

**Circular Dependencies**:
- Design review
- Lazy resolution
- Property injection
- Refactoring approach

---

## 12. Unit Testing Strategy {#unit-testing}

### Test Organization

**Test Project Structure**:
- Mirror source structure
- One test class per class
- Descriptive test names
- Arrange-Act-Assert pattern

**Test Categories**:
- Unit tests for business logic
- Integration tests for data access
- API tests for endpoints
- Performance tests for critical paths

### Mocking Strategy

**Mock Frameworks**:
- Interface-based mocking
- Behavior verification
- Stub vs. mock distinction
- Test data builders

**What to Mock**:
- External dependencies
- Database access
- File system operations
- Network calls
- Time-based operations

### Test Coverage

**Coverage Goals**:
- 80%+ for business logic
- 90%+ for critical paths
- Edge case coverage
- Error path coverage

**Coverage Metrics**:
- Line coverage
- Branch coverage
- Method coverage
- Complexity coverage

### Test Data Management

**Test Data Strategies**:
- Builder pattern for test objects
- Fixture data for common scenarios
- Random data generation
- Database seeding for integration tests

---

## 13. Best Practices and Guidelines {#best-practices}

### API Design Best Practices

**Resource Naming**:
- Use nouns for resources
- Plural for collections
- Consistent naming convention
- Hierarchical structure for relationships

**HTTP Status Codes**:
- 200 OK for successful GET
- 201 Created for successful POST
- 204 No Content for successful DELETE
- 400 Bad Request for validation errors
- 401 Unauthorized for authentication failures
- 403 Forbidden for authorization failures
- 404 Not Found for missing resources
- 409 Conflict for business rule violations
- 500 Internal Server Error for unhandled exceptions

**API Documentation**:
- OpenAPI/Swagger specification
- Example requests/responses
- Error code documentation
- Authentication guide
- Rate limit information

### Performance Best Practices

**Database Optimization**:
- Appropriate indexing
- Query optimization
- Connection pooling
- Batch operations
- Asynchronous operations

**Caching Strategy**:
- Response caching
- Distributed caching
- Cache-aside pattern
- Cache invalidation
- Cache warming

**API Performance**:
- Compression
- Pagination
- Field filtering
- Async/await throughout
- Connection reuse

### Security Best Practices

**Authentication & Authorization**:
- HTTPS only
- Token expiration
- Refresh token rotation
- Rate limiting
- API key management

**Data Protection**:
- Input validation
- SQL injection prevention
- XSS prevention
- Sensitive data encryption
- Audit logging

**API Security**:
- CORS configuration
- Request size limits
- Timeout configuration
- DDoS protection
- API versioning

### Monitoring and Logging

**Logging Strategy**:
- Structured logging
- Correlation IDs
- Log levels
- Sensitive data exclusion
- Centralized logging

**Monitoring Approach**:
- Health checks
- Performance metrics
- Error tracking
- Usage analytics
- Alerting rules

### Development Workflow

**Code Quality**:
- Code reviews
- Static analysis
- Coding standards
- Documentation requirements
- Refactoring practices

**CI/CD Pipeline**:
- Automated builds
- Automated testing
- Code coverage gates
- Security scanning
- Automated deployment

---

## Conclusion

This guidance provides a comprehensive framework for developing the HazopFlow Web API using Clean Architecture principles and industry best practices. Following these patterns ensures a maintainable, scalable, and testable application that can evolve with changing business requirements while maintaining high quality and performance standards.

The combination of Clean Architecture, SOLID principles, and modern ASP.NET Core features creates a robust foundation for enterprise-grade API development. Regular review and updates of these practices ensure the architecture remains aligned with evolving technology and business needs.

---

*End of HazopFlow Web API Development Guidance*
