# Docker Setup Guide - Ergoplanner AI Suite

## Overview

This guide provides instructions for setting up and running the Ergoplanner AI Suite using Docker containers.

## Prerequisites

- Docker Desktop 4.0+ (Windows/Mac) or Docker Engine 20.10+ (Linux)
- Docker Compose v2.0+
- Minimum 8GB RAM allocated to Docker
- 20GB free disk space

## Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/ergoplanner/ergoplanner-suite.git
cd ergoplanner-suite
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Edit with your settings
# Important: Update passwords and secrets for production
```

### 3. Start All Services
```bash
# Development mode (with hot reload)
docker-compose up -d

# Production mode
docker-compose -f docker-compose.yml up -d

# With development tools (pgAdmin, Redis Commander)
docker-compose --profile dev-tools up -d
```

### 4. Verify Services
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f [service-name]

# Health check
curl http://localhost/health
```

## Service URLs

| Service | Development URL | Purpose |
|---------|-----------------|---------|
| Frontend | http://localhost:3000 | Next.js application |
| Backend API | http://localhost:5000 | .NET Core API |
| ML Service | http://localhost:8000 | Python ML service |
| pgAdmin | http://localhost:5050 | PostgreSQL management |
| RabbitMQ Management | http://localhost:15672 | Message queue management |
| Redis Commander | http://localhost:8081 | Redis management |

## Default Credentials

**Development Only** - Change these in production!

- **Database:** ergoplanner / ergoplanner_dev_2024
- **RabbitMQ:** ergoplanner / ergoplanner_dev_2024
- **pgAdmin:** admin@ergoplanner.com / admin_dev_2024
- **Demo User:** admin@ergoplanner.com / Admin123!

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   Frontend  │────▶│    Nginx    │────▶│   Backend    │
│  (Next.js)  │     │   (Proxy)   │     │ (.NET Core)  │
└─────────────┘     └─────────────┘     └──────────────┘
                            │                     │
                            ▼                     ▼
                    ┌──────────────┐     ┌──────────────┐
                    │  ML Service  │     │  PostgreSQL  │
                    │   (Python)   │     │  Database    │
                    └──────────────┘     └──────────────┘
                            │                     │
                            ▼                     ▼
                    ┌──────────────┐     ┌──────────────┐
                    │    Redis     │     │  RabbitMQ    │
                    │    Cache     │     │   Message    │
                    └──────────────┘     └──────────────┘
```

## Common Docker Commands

### Container Management
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart a service
docker-compose restart [service-name]

# View service logs
docker-compose logs -f [service-name]

# Execute command in container
docker-compose exec [service-name] [command]
```

### Database Operations
```bash
# Access PostgreSQL
docker-compose exec postgres psql -U ergoplanner -d ergoplanner_dev

# Backup database
docker-compose exec postgres pg_dump -U ergoplanner ergoplanner_dev > backup.sql

# Restore database
docker-compose exec -T postgres psql -U ergoplanner ergoplanner_dev < backup.sql
```

### Development Workflow
```bash
# Rebuild a service
docker-compose build [service-name]

# Rebuild without cache
docker-compose build --no-cache [service-name]

# Update dependencies
docker-compose exec backend dotnet restore
docker-compose exec frontend npm install
docker-compose exec ml-service pip install -r requirements.txt
```

## Troubleshooting

### Port Conflicts
If you encounter port conflicts:
1. Check running services: `netstat -an | grep LISTEN`
2. Modify ports in `.env.local`
3. Restart Docker Compose

### Database Connection Issues
```bash
# Check PostgreSQL status
docker-compose exec postgres pg_isready

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

### Container Won't Start
```bash
# Check logs
docker-compose logs [service-name]

# Rebuild image
docker-compose build --no-cache [service-name]

# Remove and recreate
docker-compose rm -f [service-name]
docker-compose up -d [service-name]
```

### Memory Issues
1. Increase Docker memory allocation:
   - Docker Desktop: Settings → Resources → Memory
   - Linux: Check `docker system info`

2. Clean up resources:
```bash
docker system prune -a --volumes
```

## Performance Optimization

### Development
- Use volume caching: `cached` for read-heavy, `delegated` for write-heavy
- Limit service resources in `docker-compose.override.yml`
- Use `.dockerignore` to exclude unnecessary files

### Production
- Use multi-stage builds to minimize image size
- Enable BuildKit: `export DOCKER_BUILDKIT=1`
- Use health checks and restart policies
- Configure resource limits:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

## Security Best Practices

1. **Never use default passwords in production**
2. **Use secrets management:**
```yaml
secrets:
  db_password:
    file: ./secrets/db_password.txt
```

3. **Network isolation:**
```yaml
networks:
  frontend:
    internal: false
  backend:
    internal: true
```

4. **Read-only containers where possible:**
```yaml
services:
  nginx:
    read_only: true
    tmpfs:
      - /var/run
      - /var/cache/nginx
```

5. **Run as non-root user:**
```dockerfile
USER 1001:1001
```

## Monitoring

### Service Health
```bash
# Check all health endpoints
for port in 3000 5000 8000; do
  echo "Checking port $port:"
  curl -f http://localhost:$port/health || echo "Failed"
done
```

### Resource Usage
```bash
# Monitor container stats
docker stats

# Check disk usage
docker system df
```

### Logs Aggregation
Configure centralized logging:
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## Backup and Recovery

### Full Backup
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/$DATE"

mkdir -p $BACKUP_DIR

# Database
docker-compose exec -T postgres pg_dumpall -U ergoplanner > $BACKUP_DIR/postgres.sql

# Redis
docker-compose exec -T redis redis-cli --rdb $BACKUP_DIR/redis.rdb

# Volumes
docker run --rm -v ergoplanner_uploads:/data -v $(pwd)/$BACKUP_DIR:/backup alpine tar czf /backup/uploads.tar.gz -C /data .

echo "Backup completed: $BACKUP_DIR"
```

### Restore
```bash
#!/bin/bash
# restore.sh
BACKUP_DIR=$1

# Stop services
docker-compose down

# Restore database
docker-compose up -d postgres
docker-compose exec -T postgres psql -U ergoplanner < $BACKUP_DIR/postgres.sql

# Restore Redis
docker-compose up -d redis
docker-compose exec -T redis redis-cli --rdb $BACKUP_DIR/redis.rdb

# Restore volumes
docker run --rm -v ergoplanner_uploads:/data -v $(pwd)/$BACKUP_DIR:/backup alpine tar xzf /backup/uploads.tar.gz -C /data

# Start all services
docker-compose up -d

echo "Restore completed from: $BACKUP_DIR"
```

## Support

For issues and questions:
- Check logs: `docker-compose logs [service-name]`
- GitHub Issues: https://github.com/ergoplanner/ergoplanner-suite/issues
- Documentation: https://docs.ergoplanner.com