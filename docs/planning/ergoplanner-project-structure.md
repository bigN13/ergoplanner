# Ergoplanner AI Suite - Project Structure

## Complete Repository Organization

```
ergoplanner-ai-suite/
├── .github/
│   ├── workflows/
│   │   ├── backend-ci.yml
│   │   ├── frontend-ci.yml
│   │   ├── ml-services-ci.yml
│   │   ├── integration-tests.yml
│   │   ├── security-scan.yml
│   │   └── release.yml
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   └── security_vulnerability.md
│   └── pull_request_template.md
│
├── backend/
│   ├── src/
│   │   ├── Ergoplanner.API/
│   │   │   ├── Controllers/
│   │   │   │   ├── DrawingController.cs
│   │   │   │   ├── ProjectController.cs
│   │   │   │   ├── BoQController.cs
│   │   │   │   ├── SymbolController.cs
│   │   │   │   ├── WorkflowController.cs
│   │   │   │   └── AuthController.cs
│   │   │   ├── Middleware/
│   │   │   ├── Filters/
│   │   │   ├── Extensions/
│   │   │   ├── Program.cs
│   │   │   ├── Startup.cs
│   │   │   └── appsettings.json
│   │   │
│   │   ├── Ergoplanner.Application/
│   │   │   ├── Commands/
│   │   │   ├── Queries/
│   │   │   ├── Handlers/
│   │   │   ├── Services/
│   │   │   ├── Validators/
│   │   │   ├── Mappings/
│   │   │   └── Interfaces/
│   │   │
│   │   ├── Ergoplanner.Domain/
│   │   │   ├── Entities/
│   │   │   │   ├── Drawing.cs
│   │   │   │   ├── Project.cs
│   │   │   │   ├── Component.cs
│   │   │   │   ├── Symbol.cs
│   │   │   │   ├── BoQItem.cs
│   │   │   │   └── User.cs
│   │   │   ├── ValueObjects/
│   │   │   ├── Enums/
│   │   │   ├── Events/
│   │   │   └── Specifications/
│   │   │
│   │   ├── Ergoplanner.Infrastructure/
│   │   │   ├── Persistence/
│   │   │   │   ├── Contexts/
│   │   │   │   ├── Configurations/
│   │   │   │   ├── Migrations/
│   │   │   │   └── Repositories/
│   │   │   ├── Services/
│   │   │   │   ├── DrawingService/
│   │   │   │   ├── BoQService/
│   │   │   │   ├── VersionControlService/
│   │   │   │   └── WorkflowService/
│   │   │   ├── Caching/
│   │   │   ├── MessageBroker/
│   │   │   └── ExternalServices/
│   │   │
│   │   └── Ergoplanner.Shared/
│   │       ├── DTOs/
│   │       ├── Constants/
│   │       ├── Exceptions/
│   │       └── Extensions/
│   │
│   ├── tests/
│   │   ├── Ergoplanner.UnitTests/
│   │   │   ├── Application/
│   │   │   ├── Domain/
│   │   │   ├── Infrastructure/
│   │   │   └── API/
│   │   ├── Ergoplanner.IntegrationTests/
│   │   │   ├── API/
│   │   │   ├── Database/
│   │   │   └── Services/
│   │   └── Ergoplanner.PerformanceTests/
│   │       ├── LoadTests/
│   │       ├── StressTests/
│   │       └── BenchmarkTests/
│   │
│   ├── Ergoplanner.Backend.sln
│   ├── .editorconfig
│   ├── Directory.Build.props
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   └── layout.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── projects/
│   │   │   │   ├── drawings/
│   │   │   │   ├── boq/
│   │   │   │   └── layout.tsx
│   │   │   ├── api/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── drawing/
│   │   │   │   ├── Canvas/
│   │   │   │   ├── Toolbar/
│   │   │   │   ├── PropertyPanel/
│   │   │   │   ├── SymbolLibrary/
│   │   │   │   └── ReactFlowWrapper/
│   │   │   ├── boq/
│   │   │   │   ├── DataGrid/
│   │   │   │   ├── Filters/
│   │   │   │   └── ExportTools/
│   │   │   ├── collaboration/
│   │   │   │   ├── Comments/
│   │   │   │   ├── Presence/
│   │   │   │   └── Notifications/
│   │   │   ├── ui/
│   │   │   └── shared/
│   │   │
│   │   ├── lib/
│   │   │   ├── api/
│   │   │   ├── store/
│   │   │   ├── hooks/
│   │   │   ├── utils/
│   │   │   └── constants/
│   │   │
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   └── variables.css
│   │   │
│   │   └── types/
│   │       ├── drawing.ts
│   │       ├── project.ts
│   │       └── api.ts
│   │
│   ├── public/
│   │   ├── symbols/
│   │   │   ├── isa/
│   │   │   ├── iso/
│   │   │   └── uk-water/
│   │   └── assets/
│   │
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── utils/
│   │   ├── integration/
│   │   │   └── api/
│   │   └── e2e/
│   │       ├── fixtures/
│   │       ├── pages/
│   │       └── specs/
│   │
│   ├── .env.local
│   ├── .env.production
│   ├── .eslintrc.json
│   ├── jest.config.js
│   ├── next.config.js
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── README.md
│
├── ml-services/
│   ├── drawing-generator/
│   │   ├── src/
│   │   │   ├── models/
│   │   │   │   ├── nlp/
│   │   │   │   ├── layout/
│   │   │   │   └── routing/
│   │   │   ├── preprocessing/
│   │   │   ├── training/
│   │   │   ├── inference/
│   │   │   ├── api/
│   │   │   └── utils/
│   │   ├── data/
│   │   │   ├── raw/
│   │   │   ├── processed/
│   │   │   └── models/
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   └── integration/
│   │   ├── notebooks/
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   ├── symbol-recognition/
│   │   ├── src/
│   │   │   ├── ocr/
│   │   │   ├── detection/
│   │   │   ├── classification/
│   │   │   ├── api/
│   │   │   └── utils/
│   │   ├── models/
│   │   ├── tests/
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   ├── validation-engine/
│   │   ├── src/
│   │   │   ├── rules/
│   │   │   ├── validators/
│   │   │   ├── api/
│   │   │   └── config/
│   │   ├── tests/
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   ├── intelligent-assistant/
│   │   ├── src/
│   │   │   ├── recommendation/
│   │   │   ├── autocomplete/
│   │   │   ├── anomaly/
│   │   │   └── api/
│   │   ├── tests/
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   └── docker-compose.ml.yml
│
├── infrastructure/
│   ├── terraform/
│   │   ├── environments/
│   │   │   ├── dev/
│   │   │   ├── staging/
│   │   │   └── production/
│   │   ├── modules/
│   │   │   ├── aks/
│   │   │   ├── database/
│   │   │   ├── redis/
│   │   │   ├── storage/
│   │   │   └── networking/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   ├── kubernetes/
│   │   ├── base/
│   │   │   ├── namespace.yaml
│   │   │   ├── configmaps/
│   │   │   └── secrets/
│   │   ├── apps/
│   │   │   ├── backend/
│   │   │   ├── frontend/
│   │   │   └── ml-services/
│   │   ├── monitoring/
│   │   │   ├── prometheus/
│   │   │   ├── grafana/
│   │   │   └── alerts/
│   │   └── ingress/
│   │
│   ├── helm/
│   │   ├── ergoplanner/
│   │   │   ├── charts/
│   │   │   ├── templates/
│   │   │   ├── values.yaml
│   │   │   └── Chart.yaml
│   │   └── README.md
│   │
│   └── scripts/
│       ├── deploy.sh
│       ├── rollback.sh
│       └── backup.sh
│
├── docker/
│   ├── backend/
│   │   ├── Dockerfile
│   │   ├── Dockerfile.dev
│   │   └── .dockerignore
│   ├── frontend/
│   │   ├── Dockerfile
│   │   ├── Dockerfile.dev
│   │   └── .dockerignore
│   ├── nginx/
│   │   ├── Dockerfile
│   │   └── nginx.conf
│   └── docker-compose.yml
│
├── testing/
│   ├── load-testing/
│   │   ├── k6/
│   │   │   ├── scenarios/
│   │   │   ├── utils/
│   │   │   └── config.js
│   │   └── jmeter/
│   │       └── test-plans/
│   │
│   ├── security-testing/
│   │   ├── owasp/
│   │   ├── penetration/
│   │   └── vulnerability-scans/
│   │
│   ├── test-data/
│   │   ├── drawings/
│   │   ├── symbols/
│   │   └── mock-api/
│   │
│   └── test-reports/
│       ├── coverage/
│       ├── performance/
│       └── security/
│
├── docs/
│   ├── architecture/
│   │   ├── system-design.md
│   │   ├── database-schema.md
│   │   ├── api-design.md
│   │   └── diagrams/
│   │
│   ├── api/
│   │   ├── openapi.yaml
│   │   ├── postman/
│   │   └── examples/
│   │
│   ├── user-guides/
│   │   ├── getting-started.md
│   │   ├── drawing-guide.md
│   │   ├── boq-management.md
│   │   └── tutorials/
│   │
│   ├── development/
│   │   ├── setup.md
│   │   ├── coding-standards.md
│   │   ├── contributing.md
│   │   └── troubleshooting.md
│   │
│   ├── deployment/
│   │   ├── installation.md
│   │   ├── configuration.md
│   │   ├── monitoring.md
│   │   └── maintenance.md
│   │
│   └── training/
│       ├── videos/
│       ├── workshops/
│       └── certification/
│
├── monitoring/
│   ├── dashboards/
│   │   ├── application.json
│   │   ├── infrastructure.json
│   │   └── business.json
│   ├── alerts/
│   │   ├── rules.yml
│   │   └── notifications.yml
│   └── logs/
│       └── logstash.conf
│
├── scripts/
│   ├── development/
│   │   ├── setup-dev.sh
│   │   ├── seed-data.sh
│   │   └── clean.sh
│   ├── deployment/
│   │   ├── pre-deploy.sh
│   │   ├── deploy.sh
│   │   └── post-deploy.sh
│   ├── database/
│   │   ├── migrate.sh
│   │   ├── backup.sh
│   │   └── restore.sh
│   └── ml/
│       ├── train-models.sh
│       ├── evaluate.sh
│       └── deploy-models.sh
│
├── .vscode/
│   ├── launch.json
│   ├── settings.json
│   ├── tasks.json
│   └── extensions.json
│
├── .env.example
├── .gitignore
├── .dockerignore
├── docker-compose.yml
├── docker-compose.dev.yml
├── docker-compose.test.yml
├── Makefile
├── LICENSE
└── README.md
```

---

## Docker Configuration Details

### 1. Main Docker Compose (docker-compose.yml)
Orchestrates all services for local development:
- Backend API service
- Frontend Next.js service
- PostgreSQL database
- Redis cache
- RabbitMQ message broker
- Nginx reverse proxy
- ML services gateway

### 2. Backend Dockerfile Structure
```
docker/backend/
├── Dockerfile           # Multi-stage production build
├── Dockerfile.dev       # Development with hot-reload
└── .dockerignore       # Exclude unnecessary files
```

**Key Features:**
- Multi-stage builds for optimization
- Non-root user execution
- Health checks configured
- Environment-specific configurations
- Volume mounts for development

### 3. Frontend Dockerfile Structure
```
docker/frontend/
├── Dockerfile          # Optimized Next.js production
├── Dockerfile.dev      # Development with fast refresh
└── .dockerignore      # Exclude node_modules, etc.
```

**Key Features:**
- Node.js alpine images
- Build-time environment variables
- Static asset optimization
- CDN-ready output

### 4. ML Services Docker Configuration
```
ml-services/
├── drawing-generator/Dockerfile
├── symbol-recognition/Dockerfile
├── validation-engine/Dockerfile
├── intelligent-assistant/Dockerfile
└── docker-compose.ml.yml
```

**ML Docker Features:**
- Python 3.11+ base images
- GPU support configuration (CUDA)
- Model volume mounting
- Jupyter notebook integration for development
- Multi-stage builds for smaller images
- Health endpoints for each service

---

## Testing Structure Details

### 1. Backend Testing
```
backend/tests/
├── Ergoplanner.UnitTests/
│   ├── xunit test projects
│   ├── Moq for mocking
│   ├── FluentAssertions
│   └── AutoFixture for test data
├── Ergoplanner.IntegrationTests/
│   ├── WebApplicationFactory
│   ├── TestContainers for DB
│   └── WireMock for external services
└── Ergoplanner.PerformanceTests/
    ├── NBomber for load testing
    └── BenchmarkDotNet
```

### 2. Frontend Testing
```
frontend/tests/
├── unit/
│   ├── Jest for component testing
│   ├── React Testing Library
│   └── MSW for API mocking
├── integration/
│   └── Testing API interactions
└── e2e/
    ├── Playwright or Cypress
    ├── Page Object Model
    └── Visual regression tests
```

### 3. ML Services Testing
```
ml-services/*/tests/
├── unit/
│   ├── pytest framework
│   ├── Model validation tests
│   └── Data preprocessing tests
└── integration/
    ├── API endpoint tests
    ├── Model serving tests
    └── Performance benchmarks
```

### 4. Load & Performance Testing
```
testing/load-testing/
├── k6/
│   ├── Drawing creation scenarios
│   ├── Concurrent user simulations
│   └── BoQ calculation stress tests
└── jmeter/
    └── Complex workflow tests
```

---

## Key Configuration Files

### 1. Docker Compose Services
- **ergoplanner-api**: .NET Core API
- **ergoplanner-frontend**: Next.js application
- **ergoplanner-db**: PostgreSQL with PostGIS
- **ergoplanner-cache**: Redis
- **ergoplanner-mq**: RabbitMQ
- **ergoplanner-ml-gateway**: ML services proxy
- **ergoplanner-drawing-ai**: Drawing generation service
- **ergoplanner-symbol-ai**: Symbol recognition service
- **ergoplanner-validation**: Validation engine
- **ergoplanner-assistant**: Intelligent assistant

### 2. Development Tools Integration
- **VS Code**: Full debugging configuration
- **Docker Desktop**: Compose integration
- **Postman**: API collections
- **Swagger**: Interactive API docs
- **Storybook**: Component library

### 3. CI/CD Pipeline Files
- GitHub Actions workflows for each service
- Automated testing on PR
- Security scanning with Snyk/Trivy
- Container scanning
- Automated deployment to environments

### 4. Monitoring Stack
- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboards
- **ELK Stack**: Log aggregation
- **Jaeger**: Distributed tracing
- **Sentry**: Error tracking

---

## Environment Management

### Development Environment
```
.env.development
├── Database connections (local)
├── Redis configuration
├── API endpoints (localhost)
├── ML service URLs
└── Debug settings
```

### Staging Environment
```
.env.staging
├── Azure SQL connection
├── Azure Redis Cache
├── Staging API endpoints
├── ML service endpoints
└── Limited logging
```

### Production Environment
```
.env.production
├── Production database (with failover)
├── Redis cluster configuration
├── Production API gateway
├── ML service load balancers
└── Full monitoring enabled
```

---

## Makefile Commands

Common development commands:
- `make dev` - Start development environment
- `make test` - Run all tests
- `make build` - Build all Docker images
- `make deploy-staging` - Deploy to staging
- `make db-migrate` - Run database migrations
- `make ml-train` - Train ML models
- `make docs` - Generate documentation
- `make clean` - Clean build artifacts

---

## Security Considerations

### Container Security
- Non-root users in all containers
- Minimal base images (Alpine/Distroless)
- Regular vulnerability scanning
- Secrets management via Azure Key Vault
- Network policies in Kubernetes

### Code Security
- SAST scanning in CI/CD
- Dependency scanning
- Container image scanning
- Infrastructure as Code scanning
- Regular security audits

---

## Scalability Features

### Horizontal Scaling
- Kubernetes HPA for auto-scaling
- Load balancing across pods
- Database read replicas
- Redis cluster for caching
- CDN for static assets

### Performance Optimization
- Image optimization pipeline
- Lazy loading for symbols
- GraphQL for efficient data fetching
- WebSocket connection pooling
- Database query optimization

---

This structure provides a comprehensive, production-ready architecture that supports:
- Microservices architecture
- Full testing coverage
- ML model deployment
- Container orchestration
- CI/CD automation
- Monitoring and observability
- Security best practices
- Scalable deployment