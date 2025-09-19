# Ergoplanner AI Suite

## 🚀 Advanced P&ID Management System

Ergoplanner AI Suite is an enterprise-grade Piping & Instrumentation Diagram (P&ID) management system designed for engineering companies in the construction and water treatment industries. Built with cutting-edge technology and AI-driven features, it revolutionizes how teams create, manage, and collaborate on engineering drawings.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-Proprietary-red)
![Build Status](https://img.shields.io/badge/build-pending-yellow)
![Coverage](https://img.shields.io/badge/coverage-0%25-red)

## ✨ Key Features

### 🎨 Advanced Drawing Engine
- **ReactFlow-based canvas** with professional P&ID capabilities
- **500+ industry-standard symbols** (ISA-5.1, ISO 14617, UK water standards)
- **Intelligent pipe routing** with collision detection
- **Real-time collaboration** with live cursors and concurrent editing

### 📊 Bill of Quantities (BoQ) Management
- **Bidirectional synchronization** between drawings and BoQ
- **Automatic component extraction** with property management
- **Cost estimation** and procurement integration
- **Excel/CSV export** with customizable templates

### 🤖 AI-Powered Intelligence
- **Natural language to P&ID** generation
- **Smart validation** with engineering rule checking
- **Intelligent suggestions** and auto-completion
- **OCR capabilities** for legacy drawing import

### 🔄 Enterprise Workflow
- **Git-like version control** for drawings
- **Approval workflows** (Author → Checker → Reviewer → Approver)
- **Digital signatures** and audit trails
- **Redlining and markup** tools

### 🔗 Seamless Integration
- **AutoCAD DWG/DXF** import/export
- **Microsoft Teams** and SharePoint integration
- **SAP/Oracle ERP** connectivity
- **Multi-standard support** with one-click conversion

## 🛠️ Technology Stack

### Backend
- **Framework:** .NET Core 8.0 with Clean Architecture
- **API:** ASP.NET Core Web API with OData
- **Database:** PostgreSQL 15 with Entity Framework Core
- **Caching:** Redis
- **Real-time:** SignalR
- **Message Queue:** RabbitMQ

### Frontend
- **Framework:** Next.js 14 with TypeScript
- **UI Library:** Tailwind CSS / FlowBite
- **Drawing Engine:** ReactFlow
- **State Management:** Redux Toolkit / Zustand
- **Data Fetching:** React Query

### Infrastructure
- **Container:** Docker & Kubernetes
- **Cloud:** Microsoft Azure (AKS)
- **CI/CD:** GitHub Actions
- **Monitoring:** Application Insights, Prometheus, Grafana

## 📋 Prerequisites

- **Docker Desktop** 4.20+
- **Node.js** 20 LTS
- **.NET SDK** 8.0+
- **PostgreSQL** 15+ (or use Docker)
- **Redis** 7+ (or use Docker)
- **Git** 2.40+

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/ergoplanner-ai-suite.git
cd ergoplanner-ai-suite
```

### 2. Set Up Environment Variables
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

### 3. Start with Docker Compose
```bash
docker-compose up -d
```

### 4. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/swagger

## 🏗️ Project Structure

```
ergoplanner-ai-suite/
├── backend/                 # .NET Core backend services
│   ├── src/
│   │   ├── Ergoplanner.API/          # Web API layer
│   │   ├── Ergoplanner.Application/   # Business logic
│   │   ├── Ergoplanner.Domain/        # Domain entities
│   │   ├── Ergoplanner.Infrastructure/# Data access & external services
│   │   └── Ergoplanner.Shared/        # Shared DTOs and utilities
│   └── tests/                         # Backend tests
├── frontend/                # Next.js frontend application
│   ├── src/
│   │   ├── app/                       # App router pages
│   │   ├── components/                # React components
│   │   ├── lib/                       # Utilities and helpers
│   │   └── styles/                    # Global styles
│   └── tests/                         # Frontend tests
├── ml-services/            # Machine learning services
├── infrastructure/         # IaC and deployment configs
├── docker/                 # Docker configurations
└── docs/                   # Documentation
    ├── artifacts/                     # Technical specifications
    ├── guidelines/                    # Development guidelines
    └── planning/                      # Project planning docs
```

## 📖 Documentation

Comprehensive documentation is available in the `/docs` folder:

- [System Overview](docs/planning/ergoplanner-ai-pid-system-overview.md)
- [Technical Specifications](docs/artifacts/01-technical-specifications.md)
- [API Guidelines](docs/guidelines/webapi_guidelines.md)
- [Frontend Guidelines](docs/guidelines/nextjs-guidelines.md)
- [Development Strategy](docs/planning/ergoplanner-development-strategy.md)
- [Task Breakdown](docs/artifacts/project-task-breakdown.md)

## 🧪 Testing

### Run All Tests
```bash
# Backend tests
cd backend
dotnet test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

### Code Coverage
```bash
# Generate coverage report
npm run test:coverage
```

## 🚢 Deployment

### Development Environment
```bash
docker-compose -f docker-compose.dev.yml up
```

### Production Deployment
```bash
# Build and deploy to Azure
./scripts/deploy-production.sh
```

## 📊 Performance Targets

- **Drawing Performance:** 500+ components at 60 FPS
- **API Response:** <100ms for CRUD operations
- **Real-time Sync:** <50ms latency
- **Concurrent Users:** 500+ simultaneous editors
- **Uptime SLA:** 99.9% availability

## 🔒 Security

- JWT authentication with refresh tokens
- Role-based access control (RBAC)
- OWASP Top 10 compliance
- Input validation and sanitization
- TLS 1.3 encryption
- Regular security audits

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 👥 Team

- **Project Lead:** [Your Name]
- **Tech Lead:** [Tech Lead Name]
- **Contributors:** See [Contributors](https://github.com/yourusername/ergoplanner-ai-suite/contributors)

## 📞 Support

For support, email support@ergoplanner.com or join our Slack channel.

## 🗺️ Roadmap

### Phase 1 (Q1 2024) ✅
- Core infrastructure setup
- Basic drawing engine
- Authentication system

### Phase 2 (Q2 2024) 🚧
- P&ID symbol library
- BoQ synchronization
- Basic AI features

### Phase 3 (Q3 2024) 📋
- Real-time collaboration
- Advanced workflows
- Integration APIs

### Phase 4 (Q4 2024) 🔮
- ML-powered features
- Mobile support
- Industry-specific modules

## 🙏 Acknowledgments

- ReactFlow team for the excellent drawing library
- Microsoft for .NET Core and Azure
- The open-source community

---

Built with ❤️ by the Ergoplanner Team