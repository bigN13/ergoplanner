# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ergoplanner AI Suite is an advanced P&ID (Piping & Instrumentation Diagram) management system for engineering companies in construction and water treatment industries. The system features AI-driven design assistance, automated Bill of Quantities (BoQ) generation, and comprehensive collaboration capabilities using ReactFlow for diagram creation.

## Technology Stack

### Backend
- **Framework**: C# .NET Core 8.0 with Clean Architecture
- **API**: ASP.NET Core Web API with OData support
- **Database**: PostgreSQL with Entity Framework Core
- **Caching**: Redis
- **Real-time**: SignalR for collaboration
- **Message Queue**: RabbitMQ for async processing

### Frontend
- **Framework**: Next.js latest with TypeScript
- **UI**: Tailwind CSS / FlowBite components
- **Drawing Engine**: ReactFlow library
- **State Management**: Redux Toolkit or Zustand
- **Data Fetching**: React Query/SWR

### ML/AI Services
- **Drawing Generation**: C#-based NLP to P&ID conversion
- **Symbol Recognition**: Computer vision with OpenCV
- **Validation Engine**: Engineering rules validation
- **Deployment**: Containerized with Docker/Kubernetes

## Development Commands

### Backend (.NET Core)
```bash
# Build the solution
dotnet build

# Run database migrations
dotnet ef database update --project src/Ergoplanner.Infrastructure --startup-project src/Ergoplanner.API

# Run tests
dotnet test

# Run the API
dotnet run --project src/Ergoplanner.API

# Add a new migration
dotnet ef migrations add MigrationName --project src/Ergoplanner.Infrastructure --startup-project src/Ergoplanner.API
```

### Frontend (Next.js)
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Type checking
npm run type-check

# Linting
npm run lint

# Run tests
npm run test
npm run test:e2e
```

### Docker Operations
```bash
# Build all services
docker-compose build

# Start development environment
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Run with specific environment
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## Architecture Overview

### Clean Architecture Layers

1. **Domain Layer**: Core business logic, entities, and domain rules
   - Drawing, Project, Component, Symbol, BoQItem entities
   - No external dependencies

2. **Application Layer**: Use cases and application logic
   - CQRS pattern with MediatR
   - DTOs and mapping
   - Business orchestration

3. **Infrastructure Layer**: External concerns
   - EF Core implementations
   - Redis caching
   - SignalR hubs
   - External service integrations

4. **API Layer**: HTTP endpoints and controllers
   - JWT authentication
   - API versioning
   - OData query support
   - Swagger documentation

### Frontend Architecture

- **App Router**: Next.js latest app directory structure
- **Server Components**: Default for data fetching
- **Client Components**: For interactivity (marked with "use client")
- **API Routes**: Backend for frontend pattern
- **Middleware**: Authentication and route protection

## Key Features & Implementation Notes

### ReactFlow Drawing Engine
- Custom nodes for P&ID symbols (pumps, valves, instruments)
- Smart routing for pipes with collision detection
- Layer management and visibility controls
- Real-time collaboration with cursor tracking
- Symbol library supporting ISA-5.1, ISO 14617, and UK water standards

### Bill of Quantities (BoQ)
- Bidirectional sync between drawing and BoQ grid
- Automatic component property extraction
- Advanced filtering and aggregation
- Export to Excel/CSV/PDF
- Cost estimation and procurement integration

### AI/ML Capabilities
- Natural language to P&ID generation
- Symbol recognition from scanned drawings
- Engineering validation rules
- Pattern learning from organizational library
- On-premise deployment for data security

### Version Control & Workflow
- Git-like branching for drawings
- Component-level change tracking
- Linear approval workflow (Author → Checker → Reviewer → Approver)
- Audit trail with digital signatures
- Redlining and markup tools

## Database Schema Highlights

### Core Tables
- **Organizations**: Multi-tenant support with branches
- **Projects**: Container for drawings and team assignments
- **Drawings**: ReactFlow JSON storage with metadata
- **Components**: Individual P&ID elements with properties
- **Symbols**: Reusable templates with standards compliance
- **BoQItems**: Linked to components with specifications
- **Versions**: Drawing history and branching
- **Workflows**: Approval process tracking

### Key Relationships
- Projects → Organizations (many-to-one)
- Drawings → Projects (many-to-one)
- Components → Drawings (many-to-one)
- BoQItems ↔ Components (one-to-one)
- Versions → Drawings (version history)

## API Design Patterns

### RESTful Endpoints
```
GET    /api/v1/projects          # List projects
POST   /api/v1/projects          # Create project
GET    /api/v1/drawings/{id}     # Get drawing with ReactFlow data
PUT    /api/v1/drawings/{id}     # Update drawing
POST   /api/v1/drawings/{id}/boq # Generate BoQ
```

### OData Queries
```
/odata/drawings?$filter=projectId eq 123&$expand=components
/odata/components?$select=id,name,type&$orderby=createdAt desc
```

### SignalR Hubs
- DrawingHub: Real-time drawing collaboration
- NotificationHub: System notifications
- WorkflowHub: Approval process updates

## Security Considerations

- JWT authentication with refresh tokens
- Role-based access control (Author, Checker, Reviewer, Approver, Viewer)
- Project-level permissions
- Input validation with FluentValidation
- API rate limiting
- HTTPS enforcement
- Secrets in Azure Key Vault

## Performance Targets

- Support 500+ components per drawing
- Handle 2-3 concurrent editors
- Sub-second response for operations
- 60 FPS pan/zoom performance
- 10-50 users (MVP), scalable to hundreds

## Testing Strategy

### Backend
- xUnit for unit tests
- WebApplicationFactory for integration tests
- Moq for mocking
- FluentAssertions for readable assertions

### Frontend
- Jest + React Testing Library for components
- Playwright/Cypress for E2E tests
- MSW for API mocking
- Visual regression testing

## Deployment

### Development
- Local Docker Compose setup
- Hot reload for both frontend and backend
- Seeded test data

### Production
- Azure Kubernetes Service (AKS)
- PostgreSQL with read replicas
- Redis cluster for caching
- CDN for static assets
- Application Insights monitoring

## Common Development Tasks

### Adding a New P&ID Symbol
1. Create SVG in `frontend/public/symbols/{standard}/`
2. Add symbol configuration to symbol library
3. Create custom ReactFlow node component
4. Add to symbol palette in drawing interface
5. Map properties for BoQ extraction

### Implementing a New Drawing Feature
1. Update ReactFlow canvas component
2. Add toolbar controls
3. Implement undo/redo support
4. Add SignalR events for real-time sync
5. Update drawing validation rules

### Adding API Endpoint
1. Create request/response DTOs in Shared project
2. Add command/query in Application layer
3. Implement handler with business logic
4. Create controller action in API layer
5. Add integration tests
6. Update Swagger documentation

## Important Files & Locations

- **API Guidelines**: `docs/guidelines/webapi_guidelines.md`
- **Frontend Guidelines**: `docs/guidelines/nextjs-guidelines.md`
- **System Overview**: `docs/planning/ergoplanner-ai-pid-system-overview.md`
- **Project Structure**: `docs/planning/ergoplanner-project-structure.md`
- **Drawing Specifications**: `docs/planning/ergoplanner-drawing-component-specification.md`

## Critical Implementation Notes

1. **ReactFlow State Management**: Drawing state must be persisted to database on every significant change with debouncing to prevent overwhelming the server

2. **Symbol Standards**: Support one-click conversion between different standards (ISA, ISO, UK water companies) - maintain mapping tables

3. **Concurrent Editing**: Use optimistic locking with version numbers to handle conflicts

4. **BoQ Sync**: Component property changes in drawing must trigger BoQ updates via domain events

5. **Performance**: Implement virtual scrolling for large drawings, lazy load symbols, use Web Workers for complex calculations

6. **Security**: All drawing operations require project membership verification, implement row-level security in database