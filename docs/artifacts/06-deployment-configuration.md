# Ergoplanner AI Suite - Deployment Configuration

## Table of Contents
1. [Docker Configuration](#1-docker-configuration)
2. [Kubernetes Manifests](#2-kubernetes-manifests)
3. [Environment Variables](#3-environment-variables)
4. [Database Configuration](#4-database-configuration)
5. [CI/CD Pipeline](#5-cicd-pipeline)
6. [Monitoring and Alerting](#6-monitoring-and-alerting)
7. [Infrastructure as Code](#7-infrastructure-as-code)
8. [Backup and Recovery](#8-backup-and-recovery)

---

## 1. Docker Configuration

### 1.1 Backend Dockerfile (.NET Core 8.0)

```dockerfile
# Ergoplanner.API.Dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

# Install culture data for globalization
RUN apk add --no-cache icu-libs
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false

FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src

# Copy csproj files and restore dependencies
COPY ["src/Ergoplanner.API/Ergoplanner.API.csproj", "Ergoplanner.API/"]
COPY ["src/Ergoplanner.Core/Ergoplanner.Core.csproj", "Ergoplanner.Core/"]
COPY ["src/Ergoplanner.Infrastructure/Ergoplanner.Infrastructure.csproj", "Ergoplanner.Infrastructure/"]
COPY ["src/Ergoplanner.Application/Ergoplanner.Application.csproj", "Ergoplanner.Application/"]
RUN dotnet restore "Ergoplanner.API/Ergoplanner.API.csproj"

# Copy everything and build
COPY src/ .
WORKDIR "/src/Ergoplanner.API"
RUN dotnet build "Ergoplanner.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Ergoplanner.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app

# Create non-root user
RUN addgroup -g 1000 -S appgroup && \
    adduser -u 1000 -S appuser -G appgroup

# Copy published files
COPY --from=publish /app/publish .

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

# Resource limits are set via Docker Compose or Kubernetes
USER appuser
ENTRYPOINT ["dotnet", "Ergoplanner.API.dll"]
```

### 1.2 Frontend Dockerfile (Next.js)

```dockerfile
# Ergoplanner.Web.Dockerfile
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/.next/cache ./.next/cache

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD node healthcheck.js || exit 1

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### 1.3 ML Services Dockerfile (C# Based)

```dockerfile
# Ergoplanner.MLService.Dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS base
WORKDIR /app
EXPOSE 5000

# Install ML dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    libgomp \
    && pip3 install --no-cache-dir onnxruntime

FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src

# Copy and restore
COPY ["src/Ergoplanner.MLService/Ergoplanner.MLService.csproj", "Ergoplanner.MLService/"]
COPY ["src/Ergoplanner.Core/Ergoplanner.Core.csproj", "Ergoplanner.Core/"]
RUN dotnet restore "Ergoplanner.MLService/Ergoplanner.MLService.csproj"

# Build
COPY src/ .
WORKDIR "/src/Ergoplanner.MLService"
RUN dotnet build "Ergoplanner.MLService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Ergoplanner.MLService.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app

# Create non-root user
RUN addgroup -g 1000 -S mlgroup && \
    adduser -u 1000 -S mluser -G mlgroup

COPY --from=publish /app/publish .

# Copy ML models
COPY models/ ./models/

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

USER mluser
ENTRYPOINT ["dotnet", "Ergoplanner.MLService.dll"]
```

### 1.4 Docker Compose Files

#### Development Environment (docker-compose.dev.yml)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: ergoplanner-postgres-dev
    environment:
      POSTGRES_DB: ergoplanner_dev
      POSTGRES_USER: ergoplanner_user
      POSTGRES_PASSWORD: ${DB_PASSWORD:-DevPassword123!}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data_dev:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ergoplanner_user"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G

  redis:
    image: redis:7-alpine
    container_name: ergoplanner-redis-dev
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD:-DevRedis123!}
    volumes:
      - redis_data_dev:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  api:
    build:
      context: .
      dockerfile: Ergoplanner.API.Dockerfile
    container_name: ergoplanner-api-dev
    environment:
      ASPNETCORE_ENVIRONMENT: Development
      ConnectionStrings__DefaultConnection: "Host=postgres;Database=ergoplanner_dev;Username=ergoplanner_user;Password=${DB_PASSWORD:-DevPassword123!}"
      ConnectionStrings__Redis: "redis:6379,password=${REDIS_PASSWORD:-DevRedis123!}"
      JWT__Secret: ${JWT_SECRET:-DevJwtSecret123!@#}
      JWT__Issuer: "https://localhost:5001"
      JWT__Audience: "https://localhost:3000"
    ports:
      - "5001:80"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./logs/api:/app/logs
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G

  web:
    build:
      context: ./src/Ergoplanner.Web
      dockerfile: Ergoplanner.Web.Dockerfile
    container_name: ergoplanner-web-dev
    environment:
      NODE_ENV: development
      NEXT_PUBLIC_API_URL: http://localhost:5001
      NEXT_PUBLIC_WS_URL: ws://localhost:5001
    ports:
      - "3000:3000"
    depends_on:
      - api
    volumes:
      - ./src/Ergoplanner.Web:/app
      - /app/node_modules
      - /app/.next
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G

  ml-service:
    build:
      context: .
      dockerfile: Ergoplanner.MLService.Dockerfile
    container_name: ergoplanner-ml-dev
    environment:
      ASPNETCORE_ENVIRONMENT: Development
      MODEL_PATH: /app/models
      API_ENDPOINT: http://api:80
    ports:
      - "5002:5000"
    depends_on:
      - api
    volumes:
      - ./models:/app/models
      - ./logs/ml:/app/logs
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 4G
        reservations:
          cpus: '2'
          memory: 2G

volumes:
  postgres_data_dev:
  redis_data_dev:

networks:
  default:
    name: ergoplanner-network-dev
```

#### Staging Environment (docker-compose.staging.yml)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: ergoplanner-postgres-staging
    environment:
      POSTGRES_DB: ergoplanner_staging
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_MAX_CONNECTIONS: 200
      POSTGRES_SHARED_BUFFERS: 256MB
    ports:
      - "5432:5432"
    volumes:
      - postgres_data_staging:/var/lib/postgresql/data
      - ./backup:/backup
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 30s
      timeout: 10s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 4G
        reservations:
          cpus: '2'
          memory: 2G

  redis:
    image: redis:7-alpine
    container_name: ergoplanner-redis-staging
    ports:
      - "6379:6379"
    command: >
      redis-server
      --appendonly yes
      --requirepass ${REDIS_PASSWORD}
      --maxmemory 1gb
      --maxmemory-policy allkeys-lru
    volumes:
      - redis_data_staging:/data
    healthcheck:
      test: ["CMD", "redis-cli", "--auth", "${REDIS_PASSWORD}", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G

  api:
    image: ${REGISTRY}/ergoplanner-api:${VERSION:-latest}
    container_name: ergoplanner-api-staging
    environment:
      ASPNETCORE_ENVIRONMENT: Staging
      ConnectionStrings__DefaultConnection: ${DB_CONNECTION_STRING}
      ConnectionStrings__Redis: ${REDIS_CONNECTION_STRING}
      JWT__Secret: ${JWT_SECRET}
      JWT__Issuer: ${JWT_ISSUER}
      JWT__Audience: ${JWT_AUDIENCE}
      ApplicationInsights__ConnectionString: ${APP_INSIGHTS_CONNECTION}
    ports:
      - "5001:80"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./logs/api:/app/logs
      - ./certificates:/app/certificates:ro
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '2'
          memory: 2G
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3

  web:
    image: ${REGISTRY}/ergoplanner-web:${VERSION:-latest}
    container_name: ergoplanner-web-staging
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: ${API_URL}
      NEXT_PUBLIC_WS_URL: ${WS_URL}
    ports:
      - "3000:3000"
    depends_on:
      - api
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 1G
      restart_policy:
        condition: on-failure

  ml-service:
    image: ${REGISTRY}/ergoplanner-ml:${VERSION:-latest}
    container_name: ergoplanner-ml-staging
    environment:
      ASPNETCORE_ENVIRONMENT: Staging
      MODEL_PATH: /app/models
      API_ENDPOINT: http://api:80
    ports:
      - "5002:5000"
    depends_on:
      - api
    volumes:
      - ./models:/app/models:ro
      - ./logs/ml:/app/logs
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 4G

volumes:
  postgres_data_staging:
    external: true
  redis_data_staging:
    external: true

networks:
  default:
    name: ergoplanner-network-staging
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16
```

#### Production Environment (docker-compose.prod.yml)

```yaml
version: '3.8'

services:
  postgres-primary:
    image: postgres:15-alpine
    container_name: ergoplanner-postgres-primary
    environment:
      POSTGRES_DB: ergoplanner_prod
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_MAX_CONNECTIONS: 500
      POSTGRES_SHARED_BUFFERS: 1GB
      POSTGRES_EFFECTIVE_CACHE_SIZE: 3GB
      POSTGRES_MAINTENANCE_WORK_MEM: 256MB
      POSTGRES_WAL_BUFFERS: 16MB
      POSTGRES_CHECKPOINT_COMPLETION_TARGET: 0.9
      POSTGRES_RANDOM_PAGE_COST: 1.1
    ports:
      - "5432:5432"
    volumes:
      - postgres_data_prod:/var/lib/postgresql/data
      - ./backup:/backup
      - ./postgresql.conf:/etc/postgresql/postgresql.conf
    command: postgres -c config_file=/etc/postgresql/postgresql.conf
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 30s
      timeout: 10s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: '8'
          memory: 8G
        reservations:
          cpus: '4'
          memory: 4G

  postgres-replica:
    image: postgres:15-alpine
    container_name: ergoplanner-postgres-replica
    environment:
      POSTGRES_DB: ergoplanner_prod
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_PRIMARY_HOST: postgres-primary
      POSTGRES_PRIMARY_PORT: 5432
      POSTGRES_PRIMARY_USER: ${REPLICATION_USER}
      POSTGRES_PRIMARY_PASSWORD: ${REPLICATION_PASSWORD}
    ports:
      - "5433:5432"
    volumes:
      - postgres_replica_data_prod:/var/lib/postgresql/data
    depends_on:
      - postgres-primary
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 4G

  redis-master:
    image: redis:7-alpine
    container_name: ergoplanner-redis-master
    ports:
      - "6379:6379"
    command: >
      redis-server
      --appendonly yes
      --requirepass ${REDIS_PASSWORD}
      --maxmemory 2gb
      --maxmemory-policy allkeys-lru
      --save 900 1
      --save 300 10
      --save 60 10000
    volumes:
      - redis_master_data_prod:/data
    healthcheck:
      test: ["CMD", "redis-cli", "--auth", "${REDIS_PASSWORD}", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G

  redis-slave:
    image: redis:7-alpine
    container_name: ergoplanner-redis-slave
    ports:
      - "6380:6379"
    command: >
      redis-server
      --replicaof redis-master 6379
      --masterauth ${REDIS_PASSWORD}
      --requirepass ${REDIS_PASSWORD}
      --appendonly yes
    volumes:
      - redis_slave_data_prod:/data
    depends_on:
      - redis-master
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G

  api:
    image: ${REGISTRY}/ergoplanner-api:${VERSION}
    environment:
      ASPNETCORE_ENVIRONMENT: Production
      ConnectionStrings__DefaultConnection: ${DB_CONNECTION_STRING}
      ConnectionStrings__ReadOnlyConnection: ${DB_READONLY_CONNECTION_STRING}
      ConnectionStrings__Redis: ${REDIS_CONNECTION_STRING}
      JWT__Secret: ${JWT_SECRET}
      JWT__Issuer: ${JWT_ISSUER}
      JWT__Audience: ${JWT_AUDIENCE}
      ApplicationInsights__ConnectionString: ${APP_INSIGHTS_CONNECTION}
      KeyVault__Uri: ${KEYVAULT_URI}
    ports:
      - "5001:80"
      - "5443:443"
    depends_on:
      postgres-primary:
        condition: service_healthy
      redis-master:
        condition: service_healthy
    volumes:
      - ./logs/api:/app/logs
      - ./certificates:/app/certificates:ro
    deploy:
      replicas: 4
      resources:
        limits:
          cpus: '4'
          memory: 4G
        reservations:
          cpus: '2'
          memory: 2G
      restart_policy:
        condition: any
        delay: 5s
        max_attempts: 5
      update_config:
        parallelism: 1
        delay: 10s
        order: start-first

  web:
    image: ${REGISTRY}/ergoplanner-web:${VERSION}
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: ${API_URL}
      NEXT_PUBLIC_WS_URL: ${WS_URL}
      NEXT_PUBLIC_CDN_URL: ${CDN_URL}
    ports:
      - "3000:3000"
    depends_on:
      - api
    deploy:
      replicas: 4
      resources:
        limits:
          cpus: '2'
          memory: 2G
      restart_policy:
        condition: any
      update_config:
        parallelism: 2
        delay: 10s

  ml-service:
    image: ${REGISTRY}/ergoplanner-ml:${VERSION}
    environment:
      ASPNETCORE_ENVIRONMENT: Production
      MODEL_PATH: /app/models
      API_ENDPOINT: http://api:80
      GPU_ENABLED: ${GPU_ENABLED:-false}
    ports:
      - "5002:5000"
    depends_on:
      - api
    volumes:
      - ./models:/app/models:ro
      - ./logs/ml:/app/logs
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '8'
          memory: 8G
        reservations:
          cpus: '4'
          memory: 4G
      placement:
        constraints:
          - node.labels.gpu == true

  nginx:
    image: nginx:alpine
    container_name: ergoplanner-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
      - web
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G

volumes:
  postgres_data_prod:
    external: true
  postgres_replica_data_prod:
    external: true
  redis_master_data_prod:
    external: true
  redis_slave_data_prod:
    external: true

networks:
  default:
    name: ergoplanner-network-prod
    driver: overlay
    attachable: true
    ipam:
      config:
        - subnet: 10.0.0.0/24
```

---

## 2. Kubernetes Manifests

### 2.1 Namespace Configuration

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ergoplanner
  labels:
    name: ergoplanner
    environment: production
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: ergoplanner-quota
  namespace: ergoplanner
spec:
  hard:
    requests.cpu: "100"
    requests.memory: 200Gi
    limits.cpu: "200"
    limits.memory: 400Gi
    persistentvolumeclaims: "10"
    services.loadbalancers: "2"
---
apiVersion: v1
kind: LimitRange
metadata:
  name: ergoplanner-limit-range
  namespace: ergoplanner
spec:
  limits:
  - max:
      cpu: "4"
      memory: 8Gi
    min:
      cpu: 100m
      memory: 128Mi
    default:
      cpu: "1"
      memory: 1Gi
    defaultRequest:
      cpu: 500m
      memory: 512Mi
    type: Container
```

### 2.2 API Deployment

```yaml
# api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ergoplanner-api
  namespace: ergoplanner
  labels:
    app: ergoplanner-api
    version: v1
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: ergoplanner-api
  template:
    metadata:
      labels:
        app: ergoplanner-api
        version: v1
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "80"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: ergoplanner-api
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
      - name: api
        image: ergoplanner.azurecr.io/ergoplanner-api:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 80
          name: http
          protocol: TCP
        - containerPort: 443
          name: https
          protocol: TCP
        env:
        - name: ASPNETCORE_ENVIRONMENT
          value: "Production"
        - name: ConnectionStrings__DefaultConnection
          valueFrom:
            secretKeyRef:
              name: ergoplanner-secrets
              key: db-connection-string
        - name: ConnectionStrings__Redis
          valueFrom:
            secretKeyRef:
              name: ergoplanner-secrets
              key: redis-connection-string
        - name: JWT__Secret
          valueFrom:
            secretKeyRef:
              name: ergoplanner-secrets
              key: jwt-secret
        envFrom:
        - configMapRef:
            name: ergoplanner-config
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health/live
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 30
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        startupProbe:
          httpGet:
            path: /health/startup
            port: 80
          initialDelaySeconds: 0
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 30
        volumeMounts:
        - name: app-logs
          mountPath: /app/logs
        - name: certificates
          mountPath: /app/certificates
          readOnly: true
      volumes:
      - name: app-logs
        persistentVolumeClaim:
          claimName: api-logs-pvc
      - name: certificates
        secret:
          secretName: ergoplanner-certificates
      imagePullSecrets:
      - name: acr-secret
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - ergoplanner-api
              topologyKey: kubernetes.io/hostname
```

### 2.3 Web Frontend Deployment

```yaml
# web-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ergoplanner-web
  namespace: ergoplanner
  labels:
    app: ergoplanner-web
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: ergoplanner-web
  template:
    metadata:
      labels:
        app: ergoplanner-web
    spec:
      containers:
      - name: web
        image: ergoplanner.azurecr.io/ergoplanner-web:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: NODE_ENV
          value: "production"
        - name: NEXT_PUBLIC_API_URL
          valueFrom:
            configMapKeyRef:
              name: ergoplanner-config
              key: api-url
        - name: NEXT_PUBLIC_WS_URL
          valueFrom:
            configMapKeyRef:
              name: ergoplanner-config
              key: ws-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
      imagePullSecrets:
      - name: acr-secret
```

### 2.4 ML Service Deployment

```yaml
# ml-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ergoplanner-ml
  namespace: ergoplanner
  labels:
    app: ergoplanner-ml
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: ergoplanner-ml
  template:
    metadata:
      labels:
        app: ergoplanner-ml
    spec:
      nodeSelector:
        gpu: "true"
      containers:
      - name: ml-service
        image: ergoplanner.azurecr.io/ergoplanner-ml:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 5000
          name: http
        env:
        - name: ASPNETCORE_ENVIRONMENT
          value: "Production"
        - name: MODEL_PATH
          value: "/models"
        - name: GPU_ENABLED
          value: "true"
        resources:
          requests:
            memory: "4Gi"
            cpu: "2000m"
            nvidia.com/gpu: 1
          limits:
            memory: "8Gi"
            cpu: "4000m"
            nvidia.com/gpu: 1
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 120
          periodSeconds: 60
          timeoutSeconds: 10
        volumeMounts:
        - name: models
          mountPath: /models
          readOnly: true
      volumes:
      - name: models
        persistentVolumeClaim:
          claimName: ml-models-pvc
      imagePullSecrets:
      - name: acr-secret
      tolerations:
      - key: nvidia.com/gpu
        operator: Exists
        effect: NoSchedule
```

### 2.5 Services

```yaml
# services.yaml
apiVersion: v1
kind: Service
metadata:
  name: ergoplanner-api-service
  namespace: ergoplanner
  labels:
    app: ergoplanner-api
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 80
    protocol: TCP
    name: http
  - port: 443
    targetPort: 443
    protocol: TCP
    name: https
  selector:
    app: ergoplanner-api
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 3600
---
apiVersion: v1
kind: Service
metadata:
  name: ergoplanner-web-service
  namespace: ergoplanner
  labels:
    app: ergoplanner-web
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
    name: http
  selector:
    app: ergoplanner-web
---
apiVersion: v1
kind: Service
metadata:
  name: ergoplanner-ml-service
  namespace: ergoplanner
  labels:
    app: ergoplanner-ml
spec:
  type: ClusterIP
  ports:
  - port: 5000
    targetPort: 5000
    protocol: TCP
    name: http
  selector:
    app: ergoplanner-ml
```

### 2.6 ConfigMap

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ergoplanner-config
  namespace: ergoplanner
data:
  api-url: "https://api.ergoplanner.com"
  ws-url: "wss://api.ergoplanner.com"
  jwt-issuer: "https://api.ergoplanner.com"
  jwt-audience: "https://ergoplanner.com"
  log-level: "Information"
  cors-origins: "https://ergoplanner.com,https://www.ergoplanner.com"
  max-upload-size: "104857600"
  enable-swagger: "false"
  enable-metrics: "true"
  cache-duration: "3600"
  rate-limit-requests: "100"
  rate-limit-window: "60"
```

### 2.7 Secrets

```yaml
# secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: ergoplanner-secrets
  namespace: ergoplanner
type: Opaque
stringData:
  db-connection-string: "Host=postgres-service;Database=ergoplanner;Username=ergoplanner_user;Password=ProdPassword#2024!"
  redis-connection-string: "redis-service:6379,password=RedisPassword#2024!,ssl=true"
  jwt-secret: "YourVeryLongJWTSecretKeyThatShouldBeAtLeast256BitsLong#2024!"
  storage-connection-string: "DefaultEndpointsProtocol=https;AccountName=ergoplannerstore;AccountKey=..."
  app-insights-key: "InstrumentationKey=..."
---
apiVersion: v1
kind: Secret
metadata:
  name: acr-secret
  namespace: ergoplanner
type: kubernetes.io/dockerconfigjson
data:
  .dockerconfigjson: <base64-encoded-docker-config>
```

### 2.8 Ingress Configuration

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ergoplanner-ingress
  namespace: ergoplanner
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "100m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "600"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/limit-rps: "50"
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/cors-allow-methods: "GET, POST, PUT, DELETE, OPTIONS"
    nginx.ingress.kubernetes.io/cors-allow-headers: "DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization"
spec:
  tls:
  - hosts:
    - ergoplanner.com
    - www.ergoplanner.com
    - api.ergoplanner.com
    secretName: ergoplanner-tls
  rules:
  - host: ergoplanner.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ergoplanner-web-service
            port:
              number: 80
  - host: www.ergoplanner.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ergoplanner-web-service
            port:
              number: 80
  - host: api.ergoplanner.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ergoplanner-api-service
            port:
              number: 80
      - path: /ml
        pathType: Prefix
        backend:
          service:
            name: ergoplanner-ml-service
            port:
              number: 5000
```

### 2.9 HPA Configuration

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ergoplanner-api-hpa
  namespace: ergoplanner
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ergoplanner-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
      - type: Pods
        value: 2
        periodSeconds: 60
      selectPolicy: Min
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 60
      - type: Pods
        value: 2
        periodSeconds: 60
      selectPolicy: Max
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ergoplanner-web-hpa
  namespace: ergoplanner
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ergoplanner-web
  minReplicas: 2
  maxReplicas: 8
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ergoplanner-ml-hpa
  namespace: ergoplanner
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ergoplanner-ml
  minReplicas: 1
  maxReplicas: 4
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 80
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 85
```

### 2.10 Persistent Volume Claims

```yaml
# pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: api-logs-pvc
  namespace: ergoplanner
spec:
  accessModes:
  - ReadWriteMany
  storageClassName: azurefile-premium
  resources:
    requests:
      storage: 100Gi
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ml-models-pvc
  namespace: ergoplanner
spec:
  accessModes:
  - ReadOnlyMany
  storageClassName: azurefile-premium
  resources:
    requests:
      storage: 50Gi
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data-pvc
  namespace: ergoplanner
spec:
  accessModes:
  - ReadWriteOnce
  storageClassName: managed-premium
  resources:
    requests:
      storage: 500Gi
```

---

## 3. Environment Variables

### 3.1 Complete Environment Variables List

| Variable Name | Description | Default Value | Secret | Validation Rules |
|--------------|-------------|---------------|--------|------------------|
| **Database Configuration** |
| `DB_HOST` | PostgreSQL host address | localhost | No | Valid hostname/IP |
| `DB_PORT` | PostgreSQL port | 5432 | No | 1-65535 |
| `DB_NAME` | Database name | ergoplanner | No | Alphanumeric + underscore |
| `DB_USER` | Database username | ergoplanner_user | No | Non-empty string |
| `DB_PASSWORD` | Database password | - | Yes | Min 12 characters, mixed case, numbers, special chars |
| `DB_CONNECTION_STRING` | Full connection string | - | Yes | Valid PostgreSQL connection string |
| `DB_MAX_POOL_SIZE` | Maximum connection pool size | 100 | No | 10-500 |
| `DB_MIN_POOL_SIZE` | Minimum connection pool size | 10 | No | 1-50 |
| `DB_CONNECTION_TIMEOUT` | Connection timeout in seconds | 30 | No | 5-120 |
| `DB_COMMAND_TIMEOUT` | Command timeout in seconds | 60 | No | 10-300 |
| **Redis Configuration** |
| `REDIS_HOST` | Redis host address | localhost | No | Valid hostname/IP |
| `REDIS_PORT` | Redis port | 6379 | No | 1-65535 |
| `REDIS_PASSWORD` | Redis password | - | Yes | Non-empty string |
| `REDIS_DATABASE` | Redis database number | 0 | No | 0-15 |
| `REDIS_CONNECTION_STRING` | Full Redis connection string | - | Yes | Valid Redis connection string |
| `REDIS_SSL_ENABLED` | Enable SSL for Redis | false | No | true/false |
| `REDIS_CONNECT_TIMEOUT` | Connection timeout in ms | 5000 | No | 1000-30000 |
| `REDIS_SYNC_TIMEOUT` | Sync operation timeout in ms | 5000 | No | 1000-30000 |
| **JWT Configuration** |
| `JWT_SECRET` | JWT signing secret | - | Yes | Min 256 bits (32 chars) |
| `JWT_ISSUER` | JWT issuer | https://api.ergoplanner.com | No | Valid URI |
| `JWT_AUDIENCE` | JWT audience | https://ergoplanner.com | No | Valid URI |
| `JWT_EXPIRY_MINUTES` | Access token expiry in minutes | 60 | No | 5-1440 |
| `JWT_REFRESH_EXPIRY_DAYS` | Refresh token expiry in days | 30 | No | 1-365 |
| **Application Configuration** |
| `ASPNETCORE_ENVIRONMENT` | ASP.NET Core environment | Production | No | Development/Staging/Production |
| `LOG_LEVEL` | Minimum log level | Information | No | Trace/Debug/Information/Warning/Error/Critical |
| `CORS_ORIGINS` | Allowed CORS origins | * | No | Comma-separated URLs |
| `ENABLE_SWAGGER` | Enable Swagger UI | false | No | true/false |
| `ENABLE_METRICS` | Enable Prometheus metrics | true | No | true/false |
| `MAX_REQUEST_SIZE` | Max request size in bytes | 104857600 | No | 1048576-1073741824 |
| `REQUEST_TIMEOUT` | Request timeout in seconds | 300 | No | 30-600 |
| **Storage Configuration** |
| `STORAGE_PROVIDER` | Storage provider type | Azure | No | Azure/AWS/Local |
| `STORAGE_CONNECTION_STRING` | Azure Storage connection string | - | Yes | Valid connection string |
| `STORAGE_CONTAINER_NAME` | Storage container name | ergoplanner-files | No | Valid container name |
| `STORAGE_CDN_URL` | CDN URL for static files | - | No | Valid URL |
| **ML Service Configuration** |
| `ML_SERVICE_URL` | ML service endpoint | http://ml-service:5000 | No | Valid URL |
| `ML_API_KEY` | ML service API key | - | Yes | Non-empty string |
| `ML_MODEL_PATH` | Path to ML models | /models | No | Valid path |
| `ML_BATCH_SIZE` | ML batch processing size | 32 | No | 1-128 |
| `ML_TIMEOUT` | ML service timeout in seconds | 120 | No | 30-600 |
| `GPU_ENABLED` | Enable GPU acceleration | false | No | true/false |
| **Monitoring Configuration** |
| `APP_INSIGHTS_CONNECTION` | Application Insights connection | - | Yes | Valid connection string |
| `APP_INSIGHTS_ENABLED` | Enable Application Insights | true | No | true/false |
| `PROMETHEUS_PORT` | Prometheus metrics port | 9090 | No | 1024-65535 |
| `HEALTH_CHECK_PATH` | Health check endpoint path | /health | No | Valid path |
| **Email Configuration** |
| `SMTP_HOST` | SMTP server host | smtp.sendgrid.net | No | Valid hostname |
| `SMTP_PORT` | SMTP server port | 587 | No | 25/465/587/2525 |
| `SMTP_USERNAME` | SMTP username | - | Yes | Non-empty string |
| `SMTP_PASSWORD` | SMTP password | - | Yes | Non-empty string |
| `SMTP_FROM_EMAIL` | Default from email | noreply@ergoplanner.com | No | Valid email |
| `SMTP_FROM_NAME` | Default from name | Ergoplanner | No | Non-empty string |
| **Rate Limiting** |
| `RATE_LIMIT_ENABLED` | Enable rate limiting | true | No | true/false |
| `RATE_LIMIT_REQUESTS` | Max requests per window | 100 | No | 10-10000 |
| `RATE_LIMIT_WINDOW` | Time window in seconds | 60 | No | 1-3600 |
| **Feature Flags** |
| `FEATURE_ADVANCED_ANALYTICS` | Enable advanced analytics | true | No | true/false |
| `FEATURE_ML_PREDICTIONS` | Enable ML predictions | true | No | true/false |
| `FEATURE_REALTIME_COLLAB` | Enable real-time collaboration | true | No | true/false |
| `FEATURE_EXPORT_PDF` | Enable PDF export | true | No | true/false |

### 3.2 Environment-Specific Overrides

#### Development Environment
```env
# .env.development
ASPNETCORE_ENVIRONMENT=Development
DB_HOST=localhost
DB_PASSWORD=DevPassword123!
REDIS_PASSWORD=DevRedis123!
JWT_SECRET=DevJwtSecret123!@#
ENABLE_SWAGGER=true
LOG_LEVEL=Debug
CORS_ORIGINS=http://localhost:3000,http://localhost:5001
RATE_LIMIT_ENABLED=false
```

#### Staging Environment
```env
# .env.staging
ASPNETCORE_ENVIRONMENT=Staging
DB_HOST=ergoplanner-staging.postgres.database.azure.com
DB_PASSWORD=${AZURE_DB_PASSWORD_STAGING}
REDIS_PASSWORD=${AZURE_REDIS_PASSWORD_STAGING}
JWT_SECRET=${AZURE_JWT_SECRET_STAGING}
ENABLE_SWAGGER=true
LOG_LEVEL=Information
CORS_ORIGINS=https://staging.ergoplanner.com
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=500
```

#### Production Environment
```env
# .env.production
ASPNETCORE_ENVIRONMENT=Production
DB_HOST=ergoplanner-prod.postgres.database.azure.com
DB_PASSWORD=${AZURE_DB_PASSWORD_PROD}
REDIS_PASSWORD=${AZURE_REDIS_PASSWORD_PROD}
JWT_SECRET=${AZURE_JWT_SECRET_PROD}
ENABLE_SWAGGER=false
LOG_LEVEL=Warning
CORS_ORIGINS=https://ergoplanner.com,https://www.ergoplanner.com
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
APP_INSIGHTS_ENABLED=true
```

---

## 4. Database Configuration

### 4.1 PostgreSQL 15 Setup

#### Primary Server Configuration (postgresql.conf)

```conf
# Connection Settings
listen_addresses = '*'
port = 5432
max_connections = 500
superuser_reserved_connections = 5

# Memory Settings
shared_buffers = 4GB
effective_cache_size = 12GB
maintenance_work_mem = 1GB
work_mem = 20MB
huge_pages = try

# Checkpoint Settings
checkpoint_segments = 32
checkpoint_completion_target = 0.9
wal_buffers = 16MB
min_wal_size = 2GB
max_wal_size = 8GB

# Query Planner
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
parallel_workers_per_gather = 4
max_parallel_workers = 8
max_parallel_maintenance_workers = 4

# Logging
logging_collector = on
log_directory = 'pg_log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 1GB
log_min_duration_statement = 1000
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
log_temp_files = 0
log_autovacuum_min_duration = 0

# Replication
wal_level = replica
max_wal_senders = 10
wal_keep_segments = 64
max_replication_slots = 10
hot_standby = on
hot_standby_feedback = on

# Autovacuum
autovacuum = on
autovacuum_max_workers = 4
autovacuum_naptime = 30s
autovacuum_vacuum_threshold = 50
autovacuum_analyze_threshold = 50
autovacuum_vacuum_scale_factor = 0.1
autovacuum_analyze_scale_factor = 0.05

# SSL
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
ssl_ca_file = 'ca.crt'
ssl_ciphers = 'HIGH:MEDIUM:+3DES:!aNULL'
ssl_prefer_server_ciphers = on
```

### 4.2 Connection Pooling (PgBouncer)

```ini
# pgbouncer.ini
[databases]
ergoplanner = host=postgres-primary port=5432 dbname=ergoplanner
ergoplanner_readonly = host=postgres-replica port=5432 dbname=ergoplanner

[pgbouncer]
listen_addr = *
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
admin_users = postgres, admin
stats_users = stats, postgres

# Pool settings
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
min_pool_size = 10
reserve_pool_size = 5
reserve_pool_timeout = 3
max_db_connections = 100
max_user_connections = 100

# Timeouts
server_lifetime = 3600
server_idle_timeout = 600
server_connect_timeout = 15
server_login_retry = 15
query_timeout = 0
query_wait_timeout = 120
client_idle_timeout = 0
client_login_timeout = 60

# TLS settings
server_tls_sslmode = require
server_tls_ca_file = /etc/ssl/certs/ca.crt
server_tls_cert_file = /etc/ssl/certs/server.crt
server_tls_key_file = /etc/ssl/private/server.key

# Logging
logfile = /var/log/pgbouncer/pgbouncer.log
pidfile = /var/run/pgbouncer/pgbouncer.pid
```

### 4.3 Backup Configuration

#### Backup Script (backup.sh)

```bash
#!/bin/bash
# PostgreSQL Backup Script

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-ergoplanner}"
DB_USER="${DB_USER:-ergoplanner_user}"
BACKUP_DIR="${BACKUP_DIR:-/backup}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
AZURE_STORAGE_ACCOUNT="${AZURE_STORAGE_ACCOUNT}"
AZURE_STORAGE_CONTAINER="${AZURE_STORAGE_CONTAINER:-backups}"

# Timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Perform backup
echo "Starting backup of ${DB_NAME} at ${TIMESTAMP}"
export PGPASSWORD="${DB_PASSWORD}"

# Full backup with compression
pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --verbose \
    --no-owner \
    --no-privileges \
    --format=custom \
    --compress=9 \
    --file="$BACKUP_FILE" \
    2>&1 | tee -a "$BACKUP_DIR/backup.log"

if [ $? -eq 0 ]; then
    echo "Backup completed successfully: $BACKUP_FILE"

    # Calculate checksum
    CHECKSUM=$(sha256sum "$BACKUP_FILE" | awk '{print $1}')
    echo "$CHECKSUM  $BACKUP_FILE" >> "$BACKUP_DIR/checksums.txt"

    # Upload to Azure Storage if configured
    if [ -n "$AZURE_STORAGE_ACCOUNT" ]; then
        echo "Uploading to Azure Storage..."
        az storage blob upload \
            --account-name "$AZURE_STORAGE_ACCOUNT" \
            --container-name "$AZURE_STORAGE_CONTAINER" \
            --name "$(basename $BACKUP_FILE)" \
            --file "$BACKUP_FILE" \
            --metadata checksum="$CHECKSUM" \
            2>&1 | tee -a "$BACKUP_DIR/backup.log"
    fi

    # Clean up old backups
    echo "Cleaning up backups older than $RETENTION_DAYS days..."
    find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

    # Send notification
    curl -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{\"text\":\"Backup completed: ${DB_NAME} - Size: $(du -h $BACKUP_FILE | cut -f1)\"}"
else
    echo "Backup failed!" >&2

    # Send alert
    curl -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{\"text\":\"ALERT: Backup failed for ${DB_NAME}!\"}"

    exit 1
fi
```

#### Backup CronJob (Kubernetes)

```yaml
# backup-cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: ergoplanner
spec:
  schedule: "0 */6 * * *"  # Every 6 hours
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 3
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: backup-sa
          containers:
          - name: backup
            image: ergoplanner.azurecr.io/postgres-backup:15
            env:
            - name: DB_HOST
              value: postgres-service
            - name: DB_NAME
              value: ergoplanner
            - name: DB_USER
              valueFrom:
                secretKeyRef:
                  name: ergoplanner-secrets
                  key: db-username
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: ergoplanner-secrets
                  key: db-password
            - name: AZURE_STORAGE_ACCOUNT
              valueFrom:
                secretKeyRef:
                  name: azure-storage
                  key: account-name
            - name: AZURE_STORAGE_KEY
              valueFrom:
                secretKeyRef:
                  name: azure-storage
                  key: account-key
            volumeMounts:
            - name: backup-storage
              mountPath: /backup
            resources:
              requests:
                memory: "512Mi"
                cpu: "500m"
              limits:
                memory: "2Gi"
                cpu: "2000m"
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: backup-pvc
          restartPolicy: OnFailure
```

### 4.4 Migration Procedures

#### Migration Script (migrate.sh)

```bash
#!/bin/bash
# Database Migration Script

set -e

# Configuration
CONNECTION_STRING="${ConnectionStrings__DefaultConnection}"
MIGRATION_PATH="/app/Migrations"
BACKUP_BEFORE_MIGRATION="${BACKUP_BEFORE_MIGRATION:-true}"

echo "Starting database migration..."

# Create backup before migration
if [ "$BACKUP_BEFORE_MIGRATION" = "true" ]; then
    echo "Creating pre-migration backup..."
    ./backup.sh
fi

# Run Entity Framework migrations
echo "Applying EF Core migrations..."
dotnet ef database update \
    --connection "$CONNECTION_STRING" \
    --project /app/Ergoplanner.Infrastructure.csproj \
    --startup-project /app/Ergoplanner.API.csproj \
    --verbose

# Verify migration
echo "Verifying migration status..."
dotnet ef migrations list \
    --connection "$CONNECTION_STRING" \
    --project /app/Ergoplanner.Infrastructure.csproj \
    --startup-project /app/Ergoplanner.API.csproj

echo "Migration completed successfully!"
```

---

## 5. CI/CD Pipeline

### 5.1 GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
    tags:
      - 'v*'
  pull_request:
    branches: [main]

env:
  REGISTRY: ergoplanner.azurecr.io
  DOTNET_VERSION: '8.0.x'
  NODE_VERSION: '20.x'
  SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

jobs:
  # Build and Test .NET
  build-api:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0

    - name: Setup .NET
      uses: actions/setup-dotnet@v4
      with:
        dotnet-version: ${{ env.DOTNET_VERSION }}

    - name: Cache NuGet packages
      uses: actions/cache@v3
      with:
        path: ~/.nuget/packages
        key: ${{ runner.os }}-nuget-${{ hashFiles('**/packages.lock.json') }}
        restore-keys: |
          ${{ runner.os }}-nuget-

    - name: Restore dependencies
      run: dotnet restore

    - name: Build
      run: dotnet build --no-restore --configuration Release

    - name: Run unit tests
      run: |
        dotnet test --no-build --configuration Release \
          --collect:"XPlat Code Coverage" \
          --logger:"trx;LogFileName=test-results.trx" \
          --results-directory ./TestResults

    - name: SonarQube Analysis
      uses: SonarSource/sonarcloud-github-action@master
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
      with:
        args: >
          -Dsonar.projectKey=ergoplanner
          -Dsonar.organization=ergoplanner-org
          -Dsonar.cs.opencover.reportsPaths=TestResults/**/coverage.opencover.xml

    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: test-results
        path: TestResults

    - name: Build Docker image
      run: |
        docker build -t ${{ env.REGISTRY }}/ergoplanner-api:${{ github.sha }} \
          -f Ergoplanner.API.Dockerfile .

    - name: Run Trivy security scan
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: ${{ env.REGISTRY }}/ergoplanner-api:${{ github.sha }}
        format: 'sarif'
        output: 'trivy-results.sarif'

    - name: Upload Trivy results
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'

  # Build and Test Frontend
  build-web:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
        cache-dependency-path: 'src/Ergoplanner.Web/package-lock.json'

    - name: Install dependencies
      run: |
        cd src/Ergoplanner.Web
        npm ci

    - name: Lint code
      run: |
        cd src/Ergoplanner.Web
        npm run lint

    - name: Run tests
      run: |
        cd src/Ergoplanner.Web
        npm run test:ci

    - name: Build application
      run: |
        cd src/Ergoplanner.Web
        npm run build

    - name: Run E2E tests
      run: |
        cd src/Ergoplanner.Web
        npx playwright install
        npm run test:e2e

    - name: Build Docker image
      run: |
        cd src/Ergoplanner.Web
        docker build -t ${{ env.REGISTRY }}/ergoplanner-web:${{ github.sha }} \
          -f Ergoplanner.Web.Dockerfile .

  # Integration Tests
  integration-tests:
    needs: [build-api, build-web]
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v4

    - name: Setup .NET
      uses: actions/setup-dotnet@v4
      with:
        dotnet-version: ${{ env.DOTNET_VERSION }}

    - name: Run integration tests
      env:
        ConnectionStrings__DefaultConnection: "Host=localhost;Port=5432;Database=ergoplanner_test;Username=postgres;Password=postgres"
        ConnectionStrings__Redis: "localhost:6379"
      run: |
        dotnet test tests/Ergoplanner.IntegrationTests \
          --configuration Release \
          --logger:"trx;LogFileName=integration-tests.trx"

  # Security Scanning
  security-scan:
    needs: [build-api, build-web]
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - name: Run OWASP dependency check
      uses: dependency-check/Dependency-Check_Action@main
      with:
        project: 'Ergoplanner'
        path: '.'
        format: 'ALL'
        args: >
          --enableRetired
          --enableExperimental

    - name: Upload OWASP results
      uses: actions/upload-artifact@v3
      with:
        name: owasp-results
        path: reports

    - name: Run CodeQL analysis
      uses: github/codeql-action/analyze@v2

  # Deploy to Staging
  deploy-staging:
    if: github.ref == 'refs/heads/develop' && github.event_name == 'push'
    needs: [integration-tests, security-scan]
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging.ergoplanner.com
    steps:
    - uses: actions/checkout@v4

    - name: Azure Login
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS_STAGING }}

    - name: Login to ACR
      run: |
        az acr login --name ergoplanner

    - name: Push images to registry
      run: |
        docker tag ${{ env.REGISTRY }}/ergoplanner-api:${{ github.sha }} \
          ${{ env.REGISTRY }}/ergoplanner-api:staging
        docker tag ${{ env.REGISTRY }}/ergoplanner-web:${{ github.sha }} \
          ${{ env.REGISTRY }}/ergoplanner-web:staging

        docker push ${{ env.REGISTRY }}/ergoplanner-api:staging
        docker push ${{ env.REGISTRY }}/ergoplanner-web:staging

    - name: Deploy to AKS
      run: |
        az aks get-credentials --resource-group ergoplanner-staging --name ergoplanner-aks-staging

        kubectl set image deployment/ergoplanner-api \
          api=${{ env.REGISTRY }}/ergoplanner-api:staging \
          -n ergoplanner-staging

        kubectl set image deployment/ergoplanner-web \
          web=${{ env.REGISTRY }}/ergoplanner-web:staging \
          -n ergoplanner-staging

        kubectl rollout status deployment/ergoplanner-api -n ergoplanner-staging
        kubectl rollout status deployment/ergoplanner-web -n ergoplanner-staging

    - name: Run smoke tests
      run: |
        npm run test:smoke -- --url https://staging.ergoplanner.com

  # Deploy to Production
  deploy-production:
    if: startsWith(github.ref, 'refs/tags/v')
    needs: [integration-tests, security-scan]
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://ergoplanner.com
    steps:
    - uses: actions/checkout@v4

    - name: Azure Login
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS_PROD }}

    - name: Login to ACR
      run: |
        az acr login --name ergoplanner

    - name: Push images to registry
      run: |
        VERSION=${GITHUB_REF#refs/tags/}

        docker tag ${{ env.REGISTRY }}/ergoplanner-api:${{ github.sha }} \
          ${{ env.REGISTRY }}/ergoplanner-api:$VERSION
        docker tag ${{ env.REGISTRY }}/ergoplanner-web:${{ github.sha }} \
          ${{ env.REGISTRY }}/ergoplanner-web:$VERSION

        docker push ${{ env.REGISTRY }}/ergoplanner-api:$VERSION
        docker push ${{ env.REGISTRY }}/ergoplanner-web:$VERSION

        # Also tag as latest
        docker tag ${{ env.REGISTRY }}/ergoplanner-api:$VERSION \
          ${{ env.REGISTRY }}/ergoplanner-api:latest
        docker tag ${{ env.REGISTRY }}/ergoplanner-web:$VERSION \
          ${{ env.REGISTRY }}/ergoplanner-web:latest

        docker push ${{ env.REGISTRY }}/ergoplanner-api:latest
        docker push ${{ env.REGISTRY }}/ergoplanner-web:latest

    - name: Deploy to AKS (Blue-Green)
      run: |
        az aks get-credentials --resource-group ergoplanner-prod --name ergoplanner-aks-prod

        VERSION=${GITHUB_REF#refs/tags/}

        # Deploy to green environment
        kubectl set image deployment/ergoplanner-api-green \
          api=${{ env.REGISTRY }}/ergoplanner-api:$VERSION \
          -n ergoplanner

        kubectl set image deployment/ergoplanner-web-green \
          web=${{ env.REGISTRY }}/ergoplanner-web:$VERSION \
          -n ergoplanner

        # Wait for green deployment
        kubectl rollout status deployment/ergoplanner-api-green -n ergoplanner
        kubectl rollout status deployment/ergoplanner-web-green -n ergoplanner

        # Run health checks
        ./scripts/health-check.sh green

        # Switch traffic to green
        kubectl patch service ergoplanner-api-service \
          -p '{"spec":{"selector":{"version":"green"}}}' \
          -n ergoplanner

        kubectl patch service ergoplanner-web-service \
          -p '{"spec":{"selector":{"version":"green"}}}' \
          -n ergoplanner

        # Update blue environment for next deployment
        kubectl set image deployment/ergoplanner-api-blue \
          api=${{ env.REGISTRY }}/ergoplanner-api:$VERSION \
          -n ergoplanner

        kubectl set image deployment/ergoplanner-web-blue \
          web=${{ env.REGISTRY }}/ergoplanner-web:$VERSION \
          -n ergoplanner

    - name: Create release notes
      uses: actions/create-release@v1
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        tag_name: ${{ github.ref }}
        release_name: Release ${{ github.ref }}
        draft: false
        prerelease: false

  # Rollback Job
  rollback:
    if: failure()
    needs: [deploy-staging, deploy-production]
    runs-on: ubuntu-latest
    steps:
    - name: Rollback deployment
      run: |
        if [[ "${{ github.ref }}" == "refs/heads/develop" ]]; then
          NAMESPACE="ergoplanner-staging"
        else
          NAMESPACE="ergoplanner"
        fi

        kubectl rollout undo deployment/ergoplanner-api -n $NAMESPACE
        kubectl rollout undo deployment/ergoplanner-web -n $NAMESPACE

        # Send notification
        curl -X POST ${{ secrets.WEBHOOK_URL }} \
          -H 'Content-Type: application/json' \
          -d '{"text":"Deployment rollback initiated for '"$NAMESPACE"'"}'
```

---

## 6. Monitoring and Alerting

### 6.1 Application Insights Configuration

```csharp
// Program.cs
builder.Services.AddApplicationInsightsTelemetry(options =>
{
    options.ConnectionString = builder.Configuration["ApplicationInsights:ConnectionString"];
    options.EnableAdaptiveSampling = true;
    options.EnableQuickPulseMetricStream = true;
    options.EnableDependencyTrackingTelemetryModule = true;
    options.EnablePerformanceCounterCollectionModule = true;
    options.EnableEventCounterCollectionModule = true;
    options.EnableDiagnosticsTelemetryModule = true;
    options.EnableAzureInstanceMetadataTelemetryModule = true;
});

builder.Services.Configure<TelemetryConfiguration>(config =>
{
    config.TelemetryProcessorChainBuilder
        .UseAdaptiveSampling(maxTelemetryItemsPerSecond: 5)
        .UseSampling(10)
        .Build();
});

builder.Services.AddSingleton<ITelemetryInitializer, CustomTelemetryInitializer>();
```

### 6.2 Prometheus Metrics Configuration

```csharp
// MetricsConfiguration.cs
public static class MetricsConfiguration
{
    public static readonly Counter RequestCounter = Metrics
        .CreateCounter("ergoplanner_http_requests_total",
            "Total HTTP requests",
            new CounterConfiguration
            {
                LabelNames = new[] { "method", "endpoint", "status" }
            });

    public static readonly Histogram RequestDuration = Metrics
        .CreateHistogram("ergoplanner_http_request_duration_seconds",
            "HTTP request duration in seconds",
            new HistogramConfiguration
            {
                LabelNames = new[] { "method", "endpoint" },
                Buckets = Histogram.LinearBuckets(0.001, 0.001, 100)
            });

    public static readonly Gauge ActiveConnections = Metrics
        .CreateGauge("ergoplanner_active_connections",
            "Number of active connections");

    public static readonly Counter DatabaseQueries = Metrics
        .CreateCounter("ergoplanner_database_queries_total",
            "Total database queries",
            new CounterConfiguration
            {
                LabelNames = new[] { "query_type", "table" }
            });

    public static readonly Histogram QueryDuration = Metrics
        .CreateHistogram("ergoplanner_database_query_duration_seconds",
            "Database query duration in seconds",
            new HistogramConfiguration
            {
                LabelNames = new[] { "query_type" },
                Buckets = Histogram.ExponentialBuckets(0.001, 2, 10)
            });

    public static readonly Counter CacheHits = Metrics
        .CreateCounter("ergoplanner_cache_hits_total",
            "Total cache hits",
            new CounterConfiguration
            {
                LabelNames = new[] { "cache_type" }
            });

    public static readonly Counter CacheMisses = Metrics
        .CreateCounter("ergoplanner_cache_misses_total",
            "Total cache misses",
            new CounterConfiguration
            {
                LabelNames = new[] { "cache_type" }
            });
}
```

### 6.3 Grafana Dashboard Configuration

```json
{
  "dashboard": {
    "title": "Ergoplanner Production Dashboard",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(ergoplanner_http_requests_total[5m])",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(ergoplanner_http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.99, rate(ergoplanner_http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "99th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(ergoplanner_http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "5xx errors"
          },
          {
            "expr": "rate(ergoplanner_http_requests_total{status=~\"4..\"}[5m])",
            "legendFormat": "4xx errors"
          }
        ]
      },
      {
        "title": "Database Performance",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(ergoplanner_database_query_duration_seconds_bucket[5m]))",
            "legendFormat": "Query time (p95)"
          },
          {
            "expr": "rate(ergoplanner_database_queries_total[5m])",
            "legendFormat": "Query rate"
          }
        ]
      },
      {
        "title": "Cache Performance",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(ergoplanner_cache_hits_total[5m]) / (rate(ergoplanner_cache_hits_total[5m]) + rate(ergoplanner_cache_misses_total[5m]))",
            "legendFormat": "Hit ratio"
          }
        ]
      },
      {
        "title": "Pod Resources",
        "type": "graph",
        "targets": [
          {
            "expr": "container_memory_usage_bytes{pod=~\"ergoplanner-.*\"}",
            "legendFormat": "Memory: {{pod}}"
          },
          {
            "expr": "rate(container_cpu_usage_seconds_total{pod=~\"ergoplanner-.*\"}[5m])",
            "legendFormat": "CPU: {{pod}}"
          }
        ]
      }
    ]
  }
}
```

### 6.4 Alert Rules

```yaml
# prometheus-alerts.yaml
groups:
- name: ergoplanner_alerts
  interval: 30s
  rules:
  - alert: HighRequestRate
    expr: rate(ergoplanner_http_requests_total[5m]) > 1000
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: High request rate detected
      description: "Request rate is {{ $value }} req/s"

  - alert: HighErrorRate
    expr: rate(ergoplanner_http_requests_total{status=~"5.."}[5m]) > 0.05
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: High error rate detected
      description: "Error rate is {{ $value | humanizePercentage }}"

  - alert: SlowResponseTime
    expr: histogram_quantile(0.95, rate(ergoplanner_http_request_duration_seconds_bucket[5m])) > 1
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: Slow response time
      description: "95th percentile response time is {{ $value }}s"

  - alert: DatabaseConnectionPoolExhausted
    expr: ergoplanner_database_connections_active / ergoplanner_database_connections_max > 0.9
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: Database connection pool nearly exhausted
      description: "{{ $value | humanizePercentage }} of connections in use"

  - alert: LowCacheHitRatio
    expr: |
      rate(ergoplanner_cache_hits_total[5m]) /
      (rate(ergoplanner_cache_hits_total[5m]) + rate(ergoplanner_cache_misses_total[5m])) < 0.8
    for: 15m
    labels:
      severity: warning
    annotations:
      summary: Low cache hit ratio
      description: "Cache hit ratio is {{ $value | humanizePercentage }}"

  - alert: PodMemoryUsageHigh
    expr: |
      container_memory_usage_bytes{pod=~"ergoplanner-.*"} /
      container_spec_memory_limit_bytes{pod=~"ergoplanner-.*"} > 0.9
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: Pod memory usage is high
      description: "Pod {{ $labels.pod }} memory usage is {{ $value | humanizePercentage }}"

  - alert: PodCPUUsageHigh
    expr: |
      rate(container_cpu_usage_seconds_total{pod=~"ergoplanner-.*"}[5m]) > 0.9
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: Pod CPU usage is high
      description: "Pod {{ $labels.pod }} CPU usage is {{ $value | humanizePercentage }}"

  - alert: PodRestartingFrequently
    expr: rate(kube_pod_container_status_restarts_total{pod=~"ergoplanner-.*"}[1h]) > 0.5
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: Pod restarting frequently
      description: "Pod {{ $labels.pod }} has restarted {{ $value }} times in the last hour"
```

### 6.5 ELK Stack Configuration

```yaml
# elasticsearch.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: elasticsearch-config
  namespace: ergoplanner
data:
  elasticsearch.yml: |
    cluster.name: ergoplanner-logs
    node.name: ${HOSTNAME}
    network.host: 0.0.0.0
    discovery.seed_hosts: ["elasticsearch-0", "elasticsearch-1", "elasticsearch-2"]
    cluster.initial_master_nodes: ["elasticsearch-0", "elasticsearch-1", "elasticsearch-2"]
    xpack.security.enabled: true
    xpack.security.transport.ssl.enabled: true
    xpack.security.transport.ssl.verification_mode: certificate
    xpack.monitoring.collection.enabled: true
---
# logstash-pipeline.conf
input {
  beats {
    port => 5044
    ssl => true
    ssl_certificate => "/etc/pki/tls/certs/logstash.crt"
    ssl_key => "/etc/pki/tls/private/logstash.key"
  }
}

filter {
  if [kubernetes][labels][app] == "ergoplanner-api" {
    grok {
      match => {
        "message" => "%{TIMESTAMP_ISO8601:timestamp} \[%{DATA:thread}\] %{LOGLEVEL:level} %{DATA:logger} - %{GREEDYDATA:message}"
      }
    }

    mutate {
      add_field => { "service" => "api" }
    }
  }

  if [kubernetes][labels][app] == "ergoplanner-web" {
    json {
      source => "message"
    }

    mutate {
      add_field => { "service" => "web" }
    }
  }

  date {
    match => [ "timestamp", "ISO8601" ]
    target => "@timestamp"
  }

  mutate {
    remove_field => [ "host", "agent" ]
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "ergoplanner-%{service}-%{+YYYY.MM.dd}"
    user => "elastic"
    password => "${ELASTIC_PASSWORD}"
    ssl => true
    ssl_certificate_verification => true
  }
}
```

---

## 7. Infrastructure as Code

### 7.1 Terraform Main Configuration

```hcl
# main.tf
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.75.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "ergoplannerterraform"
    container_name       = "tfstate"
    key                  = "ergoplanner.tfstate"
  }
}

provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = true
    }
    key_vault {
      purge_soft_delete_on_destroy = false
    }
  }
}

locals {
  common_tags = {
    Environment = var.environment
    Project     = "Ergoplanner"
    ManagedBy   = "Terraform"
    Owner       = "DevOps Team"
    CostCenter  = "Engineering"
  }
}
```

### 7.2 Resource Group and Networking

```hcl
# networking.tf
resource "azurerm_resource_group" "main" {
  name     = "rg-ergoplanner-${var.environment}"
  location = var.location
  tags     = local.common_tags
}

resource "azurerm_virtual_network" "main" {
  name                = "vnet-ergoplanner-${var.environment}"
  address_space       = [var.vnet_address_space]
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.common_tags
}

resource "azurerm_subnet" "aks" {
  name                 = "snet-aks"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.aks_subnet_address_prefix]

  service_endpoints = [
    "Microsoft.Storage",
    "Microsoft.Sql",
    "Microsoft.KeyVault",
    "Microsoft.ContainerRegistry"
  ]
}

resource "azurerm_subnet" "database" {
  name                 = "snet-database"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.database_subnet_address_prefix]

  delegation {
    name = "fs"
    service_delegation {
      name = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = [
        "Microsoft.Network/virtualNetworks/subnets/join/action",
      ]
    }
  }
}

resource "azurerm_network_security_group" "aks" {
  name                = "nsg-aks-${var.environment}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.common_tags

  security_rule {
    name                       = "AllowHTTPS"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "AllowHTTP"
    priority                   = 101
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

resource "azurerm_subnet_network_security_group_association" "aks" {
  subnet_id                 = azurerm_subnet.aks.id
  network_security_group_id = azurerm_network_security_group.aks.id
}
```

### 7.3 AKS Cluster

```hcl
# aks.tf
resource "azurerm_kubernetes_cluster" "main" {
  name                = "aks-ergoplanner-${var.environment}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  dns_prefix          = "ergoplanner-${var.environment}"
  kubernetes_version  = var.kubernetes_version

  default_node_pool {
    name                = "system"
    node_count          = var.system_node_count
    vm_size             = var.system_node_vm_size
    vnet_subnet_id      = azurerm_subnet.aks.id
    max_pods            = 110
    os_disk_size_gb     = 100
    type                = "VirtualMachineScaleSets"
    enable_auto_scaling = true
    min_count           = var.system_node_min_count
    max_count           = var.system_node_max_count

    node_labels = {
      "nodepool-type" = "system"
      "environment"   = var.environment
      "nodepoolmode"  = "system"
    }

    tags = local.common_tags
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin    = "azure"
    network_policy    = "calico"
    load_balancer_sku = "standard"
    outbound_type     = "loadBalancer"

    load_balancer_profile {
      managed_outbound_ip_count = 2
    }
  }

  addon_profile {
    oms_agent {
      enabled                    = true
      log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
    }

    azure_policy {
      enabled = true
    }

    ingress_application_gateway {
      enabled      = true
      gateway_name = "agw-ergoplanner-${var.environment}"
      subnet_id    = azurerm_subnet.appgw.id
    }
  }

  auto_scaler_profile {
    balance_similar_node_groups      = false
    expander                         = "random"
    max_graceful_termination_sec     = 600
    max_node_provisioning_time       = "15m"
    max_unready_nodes                = 3
    max_unready_percentage           = 45
    new_pod_scale_up_delay           = "30s"
    scale_down_delay_after_add       = "10m"
    scale_down_delay_after_delete    = "10s"
    scale_down_delay_after_failure   = "3m"
    scan_interval                    = "10s"
    scale_down_unneeded              = "10m"
    scale_down_unready               = "20m"
    scale_down_utilization_threshold = "0.5"
  }

  tags = local.common_tags
}

resource "azurerm_kubernetes_cluster_node_pool" "user" {
  name                  = "user"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size               = var.user_node_vm_size
  node_count            = var.user_node_count
  vnet_subnet_id        = azurerm_subnet.aks.id
  max_pods              = 110
  os_disk_size_gb       = 100
  enable_auto_scaling   = true
  min_count             = var.user_node_min_count
  max_count             = var.user_node_max_count

  node_labels = {
    "nodepool-type" = "user"
    "environment"   = var.environment
    "workload-type" = "general"
  }

  node_taints = [
    "workload=general:NoSchedule"
  ]

  tags = local.common_tags
}

resource "azurerm_kubernetes_cluster_node_pool" "gpu" {
  count                 = var.enable_gpu_nodes ? 1 : 0
  name                  = "gpu"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size               = var.gpu_node_vm_size
  node_count            = var.gpu_node_count
  vnet_subnet_id        = azurerm_subnet.aks.id
  max_pods              = 110
  os_disk_size_gb       = 200
  enable_auto_scaling   = true
  min_count             = var.gpu_node_min_count
  max_count             = var.gpu_node_max_count

  node_labels = {
    "nodepool-type"      = "gpu"
    "environment"        = var.environment
    "workload-type"      = "ml"
    "gpu"                = "true"
    "accelerator"        = "nvidia"
  }

  node_taints = [
    "nvidia.com/gpu=true:NoSchedule"
  ]

  tags = local.common_tags
}
```

### 7.4 PostgreSQL Database

```hcl
# database.tf
resource "azurerm_postgresql_flexible_server" "main" {
  name                = "psql-ergoplanner-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  version             = "15"
  delegated_subnet_id = azurerm_subnet.database.id
  private_dns_zone_id = azurerm_private_dns_zone.postgresql.id

  administrator_login    = var.db_admin_username
  administrator_password = random_password.db_admin.result

  storage_mb = var.db_storage_mb
  sku_name   = var.db_sku_name

  backup_retention_days        = var.db_backup_retention_days
  geo_redundant_backup_enabled = var.db_geo_redundant_backup
  auto_grow_enabled            = true

  high_availability {
    mode                      = "ZoneRedundant"
    standby_availability_zone = "2"
  }

  maintenance_window {
    day_of_week  = 0
    start_hour   = 23
    start_minute = 0
  }

  tags = local.common_tags
}

resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = "ergoplanner"
  server_id = azurerm_postgresql_flexible_server.main.id
  collation = "en_US.utf8"
  charset   = "utf8"
}

resource "azurerm_postgresql_flexible_server_configuration" "configs" {
  for_each = var.postgresql_configurations

  name      = each.key
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = each.value
}

resource "azurerm_postgresql_flexible_server_firewall_rule" "aks" {
  name             = "allow-aks"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = azurerm_public_ip.aks_egress.ip_address
  end_ip_address   = azurerm_public_ip.aks_egress.ip_address
}

resource "random_password" "db_admin" {
  length  = 32
  special = true
}

resource "azurerm_key_vault_secret" "db_admin_password" {
  name         = "db-admin-password"
  value        = random_password.db_admin.result
  key_vault_id = azurerm_key_vault.main.id

  tags = local.common_tags
}
```

### 7.5 Redis Cache

```hcl
# redis.tf
resource "azurerm_redis_cache" "main" {
  name                = "redis-ergoplanner-${var.environment}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  capacity            = var.redis_capacity
  family              = var.redis_family
  sku_name            = var.redis_sku

  enable_non_ssl_port = false
  minimum_tls_version = "1.2"

  redis_configuration {
    enable_authentication           = true
    maxmemory_reserved              = var.redis_maxmemory_reserved
    maxmemory_delta                 = var.redis_maxmemory_delta
    maxmemory_policy                = "allkeys-lru"
    notify_keyspace_events          = ""
    rdb_backup_enabled              = var.redis_backup_enabled
    rdb_backup_frequency            = var.redis_backup_frequency
    rdb_backup_max_snapshot_count   = var.redis_backup_max_snapshots
    rdb_storage_connection_string   = azurerm_storage_account.main.primary_blob_connection_string
  }

  patch_schedule {
    day_of_week    = "Sunday"
    start_hour_utc = 23
  }

  tags = local.common_tags
}

resource "azurerm_redis_firewall_rule" "aks" {
  name                = "allow-aks"
  redis_cache_name    = azurerm_redis_cache.main.name
  resource_group_name = azurerm_resource_group.main.name
  start_ip            = azurerm_public_ip.aks_egress.ip_address
  end_ip              = azurerm_public_ip.aks_egress.ip_address
}
```

### 7.6 Storage Account

```hcl
# storage.tf
resource "azurerm_storage_account" "main" {
  name                     = "stergoplanner${var.environment}"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = var.storage_replication_type

  min_tls_version                 = "TLS1_2"
  enable_https_traffic_only       = true
  allow_nested_items_to_be_public = false

  blob_properties {
    cors_rule {
      allowed_origins    = var.cors_allowed_origins
      allowed_methods    = ["GET", "HEAD", "POST", "PUT", "DELETE"]
      allowed_headers    = ["*"]
      exposed_headers    = ["*"]
      max_age_in_seconds = 3600
    }

    delete_retention_policy {
      days = 30
    }

    versioning_enabled = true

    container_delete_retention_policy {
      days = 30
    }
  }

  network_rules {
    default_action             = "Deny"
    ip_rules                   = var.allowed_ip_ranges
    virtual_network_subnet_ids = [azurerm_subnet.aks.id]
    bypass                     = ["AzureServices"]
  }

  tags = local.common_tags
}

resource "azurerm_storage_container" "drawings" {
  name                  = "drawings"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "backups" {
  name                  = "backups"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "exports" {
  name                  = "exports"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}
```

### 7.7 Application Gateway

```hcl
# application-gateway.tf
resource "azurerm_public_ip" "appgw" {
  name                = "pip-appgw-ergoplanner-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  allocation_method   = "Static"
  sku                 = "Standard"
  zones               = ["1", "2", "3"]

  tags = local.common_tags
}

resource "azurerm_application_gateway" "main" {
  name                = "agw-ergoplanner-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  sku {
    name     = "WAF_v2"
    tier     = "WAF_v2"
    capacity = var.appgw_capacity
  }

  gateway_ip_configuration {
    name      = "gateway-ip-configuration"
    subnet_id = azurerm_subnet.appgw.id
  }

  frontend_port {
    name = "http"
    port = 80
  }

  frontend_port {
    name = "https"
    port = 443
  }

  frontend_ip_configuration {
    name                 = "frontend-ip"
    public_ip_address_id = azurerm_public_ip.appgw.id
  }

  backend_address_pool {
    name = "aks-backend-pool"
  }

  backend_http_settings {
    name                  = "backend-http-settings"
    cookie_based_affinity = "Enabled"
    port                  = 80
    protocol              = "Http"
    request_timeout       = 60

    probe_name = "health-probe"
  }

  http_listener {
    name                           = "http-listener"
    frontend_ip_configuration_name = "frontend-ip"
    frontend_port_name             = "http"
    protocol                       = "Http"
  }

  http_listener {
    name                           = "https-listener"
    frontend_ip_configuration_name = "frontend-ip"
    frontend_port_name             = "https"
    protocol                       = "Https"
    ssl_certificate_name           = "ergoplanner-ssl"
  }

  request_routing_rule {
    name                       = "http-routing-rule"
    rule_type                  = "Basic"
    http_listener_name         = "http-listener"
    backend_address_pool_name  = "aks-backend-pool"
    backend_http_settings_name = "backend-http-settings"
    priority                   = 100
  }

  request_routing_rule {
    name                       = "https-routing-rule"
    rule_type                  = "Basic"
    http_listener_name         = "https-listener"
    backend_address_pool_name  = "aks-backend-pool"
    backend_http_settings_name = "backend-http-settings"
    priority                   = 101
  }

  probe {
    name                = "health-probe"
    protocol            = "Http"
    path                = "/health"
    host                = "127.0.0.1"
    interval            = 30
    timeout             = 30
    unhealthy_threshold = 3
  }

  ssl_certificate {
    name     = "ergoplanner-ssl"
    data     = filebase64(var.ssl_certificate_path)
    password = var.ssl_certificate_password
  }

  waf_configuration {
    enabled          = true
    firewall_mode    = "Prevention"
    rule_set_type    = "OWASP"
    rule_set_version = "3.2"

    disabled_rule_group {
      rule_group_name = "REQUEST-920-PROTOCOL-ENFORCEMENT"
      rules           = [920350]
    }
  }

  autoscale_configuration {
    min_capacity = var.appgw_min_capacity
    max_capacity = var.appgw_max_capacity
  }

  tags = local.common_tags
}
```

---

## 8. Backup and Recovery

### 8.1 Backup Strategy

#### Database Backup Configuration

```yaml
# backup-strategy.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: backup-config
  namespace: ergoplanner
data:
  backup-policy.yaml: |
    backupPolicy:
      frequency:
        full: "0 2 * * *"        # Daily at 2 AM
        incremental: "0 */6 * * *" # Every 6 hours
        wal: "*/15 * * * *"      # Every 15 minutes

      retention:
        daily: 7
        weekly: 4
        monthly: 12
        yearly: 5

      storage:
        primary: azure-blob
        secondary: azure-file
        archive: azure-archive

      encryption:
        enabled: true
        algorithm: AES-256
        keyVault: ergoplanner-keyvault

      verification:
        enabled: true
        schedule: "0 4 * * *"
        restore_test: weekly
```

### 8.2 Automated Backup Script

```bash
#!/bin/bash
# comprehensive-backup.sh

set -euo pipefail

# Configuration
BACKUP_TYPE="${1:-full}"
ENVIRONMENT="${ENVIRONMENT:-production}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_ROOT="/backup"
LOG_FILE="${BACKUP_ROOT}/logs/backup_${TIMESTAMP}.log"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    send_alert "Backup Failed" "$1"
    exit 1
}

# Send notification
send_alert() {
    local subject="$1"
    local message="$2"

    curl -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{
            \"subject\": \"${subject}\",
            \"message\": \"${message}\",
            \"environment\": \"${ENVIRONMENT}\",
            \"timestamp\": \"${TIMESTAMP}\"
        }" || true
}

# Perform PostgreSQL backup
backup_postgres() {
    local backup_file="${BACKUP_ROOT}/postgres/ergoplanner_${ENVIRONMENT}_${TIMESTAMP}.dump"

    log "Starting PostgreSQL backup..."

    pg_dump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --format=custom \
        --verbose \
        --no-owner \
        --no-privileges \
        --compress=9 \
        --file="$backup_file" \
        2>&1 | tee -a "$LOG_FILE" || error_exit "PostgreSQL backup failed"

    # Calculate and store checksum
    local checksum=$(sha256sum "$backup_file" | awk '{print $1}')
    echo "${checksum}  ${backup_file}" >> "${BACKUP_ROOT}/postgres/checksums.txt"

    log "PostgreSQL backup completed: $backup_file (${checksum})"

    echo "$backup_file"
}

# Perform Redis backup
backup_redis() {
    local backup_file="${BACKUP_ROOT}/redis/redis_${ENVIRONMENT}_${TIMESTAMP}.rdb"

    log "Starting Redis backup..."

    redis-cli \
        -h "$REDIS_HOST" \
        -p "$REDIS_PORT" \
        -a "$REDIS_PASSWORD" \
        --rdb "$backup_file" \
        2>&1 | tee -a "$LOG_FILE" || error_exit "Redis backup failed"

    log "Redis backup completed: $backup_file"

    echo "$backup_file"
}

# Backup file storage
backup_files() {
    local backup_file="${BACKUP_ROOT}/files/files_${ENVIRONMENT}_${TIMESTAMP}.tar.gz"

    log "Starting file storage backup..."

    tar czf "$backup_file" \
        -C "$FILE_STORAGE_PATH" \
        --exclude='*.tmp' \
        --exclude='cache/*' \
        . 2>&1 | tee -a "$LOG_FILE" || error_exit "File backup failed"

    log "File storage backup completed: $backup_file"

    echo "$backup_file"
}

# Upload to cloud storage
upload_to_cloud() {
    local file_path="$1"
    local storage_type="${2:-primary}"

    log "Uploading to cloud storage: $file_path"

    case "$storage_type" in
        primary)
            az storage blob upload \
                --account-name "$AZURE_STORAGE_ACCOUNT" \
                --container-name "backups" \
                --name "$(basename "$file_path")" \
                --file "$file_path" \
                --metadata "environment=${ENVIRONMENT}" "timestamp=${TIMESTAMP}" \
                2>&1 | tee -a "$LOG_FILE" || error_exit "Cloud upload failed"
            ;;
        archive)
            az storage blob upload \
                --account-name "$AZURE_STORAGE_ACCOUNT" \
                --container-name "archive" \
                --tier Archive \
                --name "$(basename "$file_path")" \
                --file "$file_path" \
                2>&1 | tee -a "$LOG_FILE" || error_exit "Archive upload failed"
            ;;
    esac

    log "Upload completed: $file_path"
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"
    local backup_type="$2"

    log "Verifying backup integrity: $backup_file"

    case "$backup_type" in
        postgres)
            pg_restore --list "$backup_file" > /dev/null 2>&1 || error_exit "PostgreSQL backup verification failed"
            ;;
        redis)
            redis-cli --rdb-check "$backup_file" 2>&1 | tee -a "$LOG_FILE" || error_exit "Redis backup verification failed"
            ;;
        files)
            tar tzf "$backup_file" > /dev/null 2>&1 || error_exit "File backup verification failed"
            ;;
    esac

    log "Backup verification successful: $backup_file"
}

# Cleanup old backups
cleanup_old_backups() {
    local retention_days="${1:-30}"

    log "Cleaning up backups older than ${retention_days} days..."

    find "${BACKUP_ROOT}" -type f -name "*.dump" -mtime +${retention_days} -delete
    find "${BACKUP_ROOT}" -type f -name "*.rdb" -mtime +${retention_days} -delete
    find "${BACKUP_ROOT}" -type f -name "*.tar.gz" -mtime +${retention_days} -delete

    log "Cleanup completed"
}

# Main execution
main() {
    log "Starting backup process: Type=${BACKUP_TYPE}, Environment=${ENVIRONMENT}"

    # Create directories
    mkdir -p "${BACKUP_ROOT}"/{postgres,redis,files,logs}

    # Perform backups based on type
    case "$BACKUP_TYPE" in
        full)
            postgres_backup=$(backup_postgres)
            redis_backup=$(backup_redis)
            files_backup=$(backup_files)

            # Verify backups
            verify_backup "$postgres_backup" "postgres"
            verify_backup "$redis_backup" "redis"
            verify_backup "$files_backup" "files"

            # Upload to cloud
            upload_to_cloud "$postgres_backup" "primary"
            upload_to_cloud "$redis_backup" "primary"
            upload_to_cloud "$files_backup" "primary"

            # Archive monthly backups
            if [[ $(date +%d) == "01" ]]; then
                upload_to_cloud "$postgres_backup" "archive"
                upload_to_cloud "$files_backup" "archive"
            fi
            ;;

        incremental)
            postgres_backup=$(backup_postgres)
            verify_backup "$postgres_backup" "postgres"
            upload_to_cloud "$postgres_backup" "primary"
            ;;

        wal)
            # WAL archiving for point-in-time recovery
            pg_receivewal \
                --host="$DB_HOST" \
                --port="$DB_PORT" \
                --username="$DB_USER" \
                --directory="${BACKUP_ROOT}/wal" \
                --compress=9 \
                --synchronous \
                2>&1 | tee -a "$LOG_FILE" || error_exit "WAL archiving failed"
            ;;
    esac

    # Cleanup old backups
    cleanup_old_backups 30

    # Send success notification
    send_alert "Backup Successful" "Backup completed successfully for ${ENVIRONMENT}"

    log "Backup process completed successfully"
}

# Run main function
main
```

### 8.3 Disaster Recovery Procedures

```yaml
# disaster-recovery.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: dr-procedures
  namespace: ergoplanner
data:
  recovery-plan.md: |
    # Disaster Recovery Plan

    ## RTO: 1 hour | RPO: 6 hours

    ## Recovery Procedures

    ### 1. Database Recovery
    ```bash
    # Restore from latest backup
    kubectl exec -it postgres-0 -n ergoplanner -- bash
    pg_restore \
      --host=localhost \
      --port=5432 \
      --username=postgres \
      --dbname=ergoplanner_recovery \
      --verbose \
      --clean \
      --if-exists \
      /backup/latest/ergoplanner.dump

    # Point-in-time recovery
    pg_basebackup \
      --pgdata=/var/lib/postgresql/data_recovery \
      --host=backup-server \
      --port=5432 \
      --username=replication \
      --verbose \
      --progress \
      --checkpoint=fast \
      --write-recovery-conf

    # Verify data integrity
    psql -U postgres -d ergoplanner_recovery -c "SELECT COUNT(*) FROM drawings;"
    ```

    ### 2. Application Recovery
    ```bash
    # Scale down current deployment
    kubectl scale deployment ergoplanner-api --replicas=0 -n ergoplanner

    # Update database connection
    kubectl set env deployment/ergoplanner-api \
      ConnectionStrings__DefaultConnection="Host=postgres-recovery;..." \
      -n ergoplanner

    # Scale up with new configuration
    kubectl scale deployment ergoplanner-api --replicas=3 -n ergoplanner

    # Verify application health
    kubectl get pods -n ergoplanner
    kubectl logs -f deployment/ergoplanner-api -n ergoplanner
    ```

    ### 3. Data Validation
    ```sql
    -- Check data consistency
    SELECT
      'drawings' as table_name,
      COUNT(*) as record_count,
      MAX(updated_at) as last_update
    FROM drawings
    UNION ALL
    SELECT
      'users',
      COUNT(*),
      MAX(updated_at)
    FROM users
    UNION ALL
    SELECT
      'projects',
      COUNT(*),
      MAX(updated_at)
    FROM projects;

    -- Verify foreign key constraints
    SELECT
      conname,
      conrelid::regclass AS table_name,
      confrelid::regclass AS referenced_table
    FROM pg_constraint
    WHERE contype = 'f'
    ORDER BY conrelid::regclass::text, contype DESC;
    ```

  test-restore.sh: |
    #!/bin/bash
    # Test restoration procedure

    set -e

    BACKUP_FILE="$1"
    TEST_DB="ergoplanner_restore_test_$(date +%s)"

    echo "Testing restore with backup: $BACKUP_FILE"

    # Create test database
    createdb -h localhost -U postgres "$TEST_DB"

    # Restore backup
    pg_restore \
      --host=localhost \
      --port=5432 \
      --username=postgres \
      --dbname="$TEST_DB" \
      --verbose \
      "$BACKUP_FILE"

    # Run validation queries
    psql -U postgres -d "$TEST_DB" <<EOF
    -- Check table counts
    SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = 'public';

    -- Check data integrity
    SELECT COUNT(*) FROM drawings;
    SELECT COUNT(*) FROM users;
    SELECT COUNT(*) FROM projects;

    -- Test application queries
    SELECT d.id, d.name, p.name as project_name
    FROM drawings d
    JOIN projects p ON d.project_id = p.id
    LIMIT 10;
    EOF

    # Cleanup
    dropdb -h localhost -U postgres "$TEST_DB"

    echo "Restore test completed successfully"
```

### 8.4 Backup Monitoring

```yaml
# backup-monitoring.yaml
apiVersion: v1
kind: ServiceMonitor
metadata:
  name: backup-metrics
  namespace: ergoplanner
spec:
  selector:
    matchLabels:
      app: backup-exporter
  endpoints:
  - port: metrics
    interval: 60s
    path: /metrics
---
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: backup-alerts
  namespace: ergoplanner
spec:
  groups:
  - name: backup_alerts
    interval: 5m
    rules:
    - alert: BackupFailed
      expr: backup_last_success_timestamp < (time() - 86400)
      for: 15m
      labels:
        severity: critical
      annotations:
        summary: Backup has not succeeded in 24 hours
        description: "Last successful backup was {{ $value | humanizeTimestamp }}"

    - alert: BackupSizeTooSmall
      expr: backup_size_bytes < 1000000000  # Less than 1GB
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: Backup size unexpectedly small
        description: "Backup size is {{ $value | humanize1024 }}"

    - alert: BackupDurationHigh
      expr: backup_duration_seconds > 3600  # More than 1 hour
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: Backup taking too long
        description: "Backup duration is {{ $value | humanizeDuration }}"

    - alert: RestoreTestFailed
      expr: backup_restore_test_success == 0
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: Backup restore test failed
        description: "Restore test failed for backup {{ $labels.backup_file }}"
```

---

## Deployment Commands Summary

### Local Development
```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f api

# Run migrations
docker-compose -f docker-compose.dev.yml exec api dotnet ef database update

# Stop all services
docker-compose -f docker-compose.dev.yml down
```

### Kubernetes Deployment
```bash
# Deploy to staging
kubectl apply -f k8s/ -n ergoplanner-staging

# Deploy to production
kubectl apply -f k8s/ -n ergoplanner

# Check deployment status
kubectl rollout status deployment/ergoplanner-api -n ergoplanner

# View pod logs
kubectl logs -f deployment/ergoplanner-api -n ergoplanner

# Scale deployment
kubectl scale deployment/ergoplanner-api --replicas=5 -n ergoplanner

# Update image
kubectl set image deployment/ergoplanner-api \
  api=ergoplanner.azurecr.io/ergoplanner-api:v2.0.0 \
  -n ergoplanner
```

### Terraform Deployment
```bash
# Initialize Terraform
terraform init

# Plan changes
terraform plan -var-file=environments/production.tfvars

# Apply changes
terraform apply -var-file=environments/production.tfvars -auto-approve

# Destroy resources (careful!)
terraform destroy -var-file=environments/production.tfvars
```

### Backup Operations
```bash
# Manual backup
./scripts/backup.sh full

# Restore from backup
./scripts/restore.sh /backup/ergoplanner_20240115_020000.dump

# Test restore
./scripts/test-restore.sh /backup/ergoplanner_20240115_020000.dump

# Verify backup
pg_restore --list /backup/ergoplanner_20240115_020000.dump
```

---

This comprehensive deployment configuration provides production-ready setup for the Ergoplanner AI Suite with enterprise-grade reliability, security, and scalability.