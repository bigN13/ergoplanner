# Technical Specification Documents - Ergoplanner AI Suite
## Version 1.0.0 | Last Updated: 2024

---

## 1. API Contract Definitions

### 1.1 Authentication Endpoints

#### POST /api/auth/login
```yaml
endpoint: /api/auth/login
method: POST
description: Authenticate user and receive JWT tokens
request:
  headers:
    Content-Type: application/json
    X-Request-ID: string (UUID v4) # Required for request tracing
  body:
    type: object
    required: [email, password]
    properties:
      email:
        type: string
        format: email
        minLength: 5
        maxLength: 255
        pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        example: "user@example.com"
      password:
        type: string
        minLength: 8
        maxLength: 128
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]'
        example: "SecureP@ss123"
responses:
  200:
    description: Authentication successful
    headers:
      X-Request-ID: string
      X-Rate-Limit-Remaining: integer
    body:
      accessToken:
        type: string
        format: JWT
        example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        expiresIn: 900 # seconds (15 minutes)
      refreshToken:
        type: string
        format: JWT
        example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        expiresIn: 604800 # seconds (7 days)
      user:
        id: string (UUID v4)
        email: string
        firstName: string
        lastName: string
        role: enum [admin, engineer, reviewer, viewer]
        organizationId: string (UUID v4)
  400:
    description: Invalid request format
    body:
      error:
        code: "VALIDATION_ERROR"
        message: "Validation failed"
        details:
          - field: "email"
            message: "Invalid email format"
  401:
    description: Invalid credentials
    body:
      error:
        code: "INVALID_CREDENTIALS"
        message: "Email or password is incorrect"
  429:
    description: Rate limit exceeded
    headers:
      Retry-After: integer # seconds
    body:
      error:
        code: "RATE_LIMIT_EXCEEDED"
        message: "Too many requests"
        retryAfter: integer
```

#### POST /api/auth/refresh
```yaml
endpoint: /api/auth/refresh
method: POST
description: Refresh access token using refresh token
request:
  headers:
    Content-Type: application/json
    Authorization: "Bearer {refresh_token}"
responses:
  200:
    body:
      accessToken: string (JWT)
      expiresIn: 900
  401:
    body:
      error:
        code: "INVALID_REFRESH_TOKEN"
        message: "Refresh token is invalid or expired"
```

### 1.2 Drawing Management Endpoints

#### GET /api/drawings
```yaml
endpoint: /api/drawings
method: GET
description: List all drawings with pagination and filtering
request:
  headers:
    Authorization: "Bearer {access_token}"
  query:
    page:
      type: integer
      minimum: 1
      maximum: 10000
      default: 1
    pageSize:
      type: integer
      minimum: 10
      maximum: 100
      default: 20
    projectId:
      type: string
      format: UUID v4
      required: true
    status:
      type: string
      enum: [draft, in_review, approved, published, archived]
    search:
      type: string
      maxLength: 100
    sortBy:
      type: string
      enum: [name, createdAt, updatedAt, status]
      default: updatedAt
    sortOrder:
      type: string
      enum: [asc, desc]
      default: desc
responses:
  200:
    body:
      data:
        type: array
        items:
          id: string (UUID v4)
          name: string
          description: string
          status: string
          version: string
          createdAt: string (ISO 8601)
          updatedAt: string (ISO 8601)
          createdBy:
            id: string
            name: string
          componentCount: integer
          thumbnailUrl: string
      pagination:
        page: integer
        pageSize: integer
        total: integer
        totalPages: integer
      links:
        self: string
        next: string | null
        prev: string | null
        first: string
        last: string
```

#### POST /api/drawings
```yaml
endpoint: /api/drawings
method: POST
description: Create a new drawing
request:
  headers:
    Authorization: "Bearer {access_token}"
    Content-Type: application/json
  body:
    type: object
    required: [projectId, name, type]
    properties:
      projectId:
        type: string
        format: UUID v4
      name:
        type: string
        minLength: 3
        maxLength: 255
        pattern: '^[a-zA-Z0-9][a-zA-Z0-9-_ ]*[a-zA-Z0-9]$'
        example: "Pump Station 01 - Main Process"
      description:
        type: string
        maxLength: 1000
      type:
        type: string
        enum: [pid, pfd, electrical, instrumentation]
      template:
        type: string
        enum: [blank, pump_station, treatment_plant, distribution]
      standard:
        type: string
        enum: [ISA, ISO, DIN, TW, STW, DCWW, UU, NWC]
        default: ISA
      gridSettings:
        type: object
        properties:
          enabled:
            type: boolean
            default: true
          size:
            type: integer
            minimum: 5
            maximum: 100
            default: 20
          type:
            type: string
            enum: [orthogonal, isometric, polar]
            default: orthogonal
responses:
  201:
    body:
      id: string (UUID v4)
      name: string
      status: "draft"
      version: "1.0.0"
      createdAt: string (ISO 8601)
      reactFlowData:
        nodes: array
        edges: array
        viewport:
          x: 0
          y: 0
          zoom: 1
```

#### PUT /api/drawings/{id}
```yaml
endpoint: /api/drawings/{id}
method: PUT
description: Update drawing content
request:
  headers:
    Authorization: "Bearer {access_token}"
    Content-Type: application/json
    If-Match: string # ETag for optimistic locking
  path:
    id:
      type: string
      format: UUID v4
  body:
    type: object
    properties:
      name:
        type: string
        minLength: 3
        maxLength: 255
      description:
        type: string
        maxLength: 1000
      reactFlowData:
        type: object
        required: [nodes, edges, viewport]
        properties:
          nodes:
            type: array
            maxItems: 10000
            items:
              type: object
              required: [id, type, position, data]
              properties:
                id:
                  type: string
                  pattern: '^[a-zA-Z0-9-_]+$'
                type:
                  type: string
                  enum: [symbol, text, shape, group]
                position:
                  type: object
                  required: [x, y]
                  properties:
                    x:
                      type: number
                      minimum: -100000
                      maximum: 100000
                    y:
                      type: number
                      minimum: -100000
                      maximum: 100000
                data:
                  type: object
                  properties:
                    symbolType:
                      type: string
                    tag:
                      type: string
                      maxLength: 50
                    properties:
                      type: object
          edges:
            type: array
            maxItems: 20000
            items:
              type: object
              required: [id, source, target, type]
              properties:
                id:
                  type: string
                source:
                  type: string
                sourceHandle:
                  type: string
                target:
                  type: string
                targetHandle:
                  type: string
                type:
                  type: string
                  enum: [pipe, signal, electrical]
                data:
                  type: object
                  properties:
                    diameter:
                      type: number
                      minimum: 0.5
                      maximum: 2000
                    material:
                      type: string
                    flowDirection:
                      type: string
                      enum: [forward, reverse, bidirectional]
responses:
  200:
    body:
      id: string
      version: string # Incremented version
      updatedAt: string (ISO 8601)
      etag: string # New ETag
  409:
    description: Optimistic locking conflict
    body:
      error:
        code: "VERSION_CONFLICT"
        message: "Drawing has been modified by another user"
        currentVersion: string
```

### 1.3 Symbol Library Endpoints

#### GET /api/symbols
```yaml
endpoint: /api/symbols
method: GET
description: Get available symbols
request:
  headers:
    Authorization: "Bearer {access_token}"
  query:
    category:
      type: string
      enum: [pumps, valves, vessels, instruments, piping, electrical]
    standard:
      type: string
      enum: [ISA, ISO, DIN, TW, STW, DCWW, UU, NWC]
    search:
      type: string
      maxLength: 50
responses:
  200:
    body:
      symbols:
        type: array
        items:
          id: string
          name: string
          category: string
          standard: string
          svgPath: string
          defaultProperties:
            type: object
          connectionPoints:
            type: array
            items:
              id: string
              position:
                x: number
                y: number
              type: string
              direction: string
```

## 2. Data Models

### 2.1 Core Entity Models

```typescript
// Exact TypeScript definitions with all constraints

export interface User {
  id: string; // UUID v4, immutable
  email: string; // 5-255 chars, unique in system
  passwordHash: string; // bcrypt hash, never exposed to API
  firstName: string; // 1-50 chars, letters, spaces, hyphens, apostrophes
  lastName: string; // 1-50 chars, letters, spaces, hyphens, apostrophes
  role: UserRole; // enum: admin | engineer | reviewer | viewer
  organizationId: string; // UUID v4, foreign key
  isActive: boolean; // default: true
  emailVerified: boolean; // default: false
  createdAt: Date; // ISO 8601, immutable
  updatedAt: Date; // ISO 8601, auto-updated
  lastLoginAt: Date | null; // ISO 8601, nullable
  deletedAt: Date | null; // ISO 8601, soft delete
}

export enum UserRole {
  ADMIN = 'admin',
  ENGINEER = 'engineer',
  REVIEWER = 'reviewer',
  VIEWER = 'viewer'
}

export interface Organization {
  id: string; // UUID v4, immutable
  name: string; // 2-100 chars, unique
  slug: string; // 2-50 chars, lowercase, hyphens, unique
  type: OrganizationType; // enum: enterprise | team | trial
  subscriptionTier: SubscriptionTier; // enum: free | professional | enterprise
  maxUsers: number; // 1-10000, based on subscription
  maxProjects: number; // 1-1000, based on subscription
  maxStorageGB: number; // 1-10000, based on subscription
  settings: OrganizationSettings;
  createdAt: Date; // ISO 8601
  updatedAt: Date; // ISO 8601
  expiresAt: Date | null; // For trial accounts
}

export interface Project {
  id: string; // UUID v4, immutable
  organizationId: string; // UUID v4, foreign key
  name: string; // 3-255 chars
  code: string; // 2-20 chars, uppercase, numbers, hyphens
  description: string; // 0-2000 chars
  type: ProjectType; // enum: water_treatment | pumping_station | distribution
  status: ProjectStatus; // enum: planning | design | construction | completed
  startDate: Date; // ISO 8601
  endDate: Date | null; // ISO 8601, nullable
  budget: Money | null; // { amount: number, currency: string }
  settings: ProjectSettings;
  metadata: Record<string, any>; // JSON, max 10KB
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
}

export interface Drawing {
  id: string; // UUID v4, immutable
  projectId: string; // UUID v4, foreign key
  name: string; // 3-255 chars
  description: string; // 0-1000 chars
  type: DrawingType; // enum: pid | pfd | electrical | instrumentation
  status: DrawingStatus; // enum: draft | in_review | approved | published | archived
  version: string; // Semantic version: major.minor.patch
  standard: DrawingStandard; // enum: ISA | ISO | DIN | TW | STW | DCWW | UU | NWC
  reactFlowData: ReactFlowData; // JSON, max 50MB
  gridSettings: GridSettings;
  layers: Layer[]; // max 100 layers
  componentCount: number; // 0-10000
  edgeCount: number; // 0-20000
  fileSize: number; // bytes, max 100MB
  thumbnailUrl: string | null; // URL to thumbnail image
  lockedBy: string | null; // User ID if locked
  lockedAt: Date | null; // Lock timestamp
  createdBy: string; // User ID
  createdAt: Date;
  updatedBy: string; // User ID
  updatedAt: Date;
  publishedAt: Date | null;
  deletedAt: Date | null; // Soft delete
}

export interface ReactFlowData {
  nodes: ReactFlowNode[]; // max 10000 nodes
  edges: ReactFlowEdge[]; // max 20000 edges
  viewport: Viewport;
}

export interface ReactFlowNode {
  id: string; // alphanumeric, hyphens, underscores, max 50 chars
  type: NodeType; // enum: symbol | text | shape | group
  position: Position; // { x: number, y: number }
  data: NodeData;
  width?: number; // 1-10000 pixels
  height?: number; // 1-10000 pixels
  selected?: boolean;
  dragging?: boolean;
  style?: React.CSSProperties; // Subset of allowed styles
  className?: string; // CSS class name
  parentNode?: string; // For nested nodes
  zIndex?: number; // -1000 to 1000
}

export interface ReactFlowEdge {
  id: string; // unique identifier
  source: string; // Node ID
  sourceHandle?: string; // Handle ID
  target: string; // Node ID
  targetHandle?: string; // Handle ID
  type: EdgeType; // enum: pipe | signal | electrical
  animated?: boolean;
  style?: EdgeStyle;
  data?: EdgeData;
  label?: string; // max 100 chars
  labelStyle?: React.CSSProperties;
  labelBgStyle?: React.CSSProperties;
  markerEnd?: string; // Arrow type
  markerStart?: string; // Arrow type
}

export interface Component {
  id: string; // UUID v4
  drawingId: string; // UUID v4, foreign key
  nodeId: string; // ReactFlow node ID
  type: ComponentType; // pump | valve | vessel | instrument | etc.
  subType: string; // Specific subtype
  tag: string; // 1-50 chars, unique in drawing
  description: string; // 0-500 chars
  manufacturer: string | null; // 0-100 chars
  model: string | null; // 0-100 chars
  specifications: ComponentSpecifications;
  properties: ComponentProperties;
  status: ComponentStatus; // enum: active | spare | removed
  maintenanceSchedule: MaintenanceSchedule | null;
  documents: Document[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ComponentSpecifications {
  // Mechanical specifications
  pressure: {
    operating: number | null; // bar
    design: number | null; // bar
    test: number | null; // bar
  };
  temperature: {
    operating: number | null; // °C
    design: number | null; // °C
    min: number | null; // °C
    max: number | null; // °C
  };
  flow: {
    normal: number | null; // m³/h
    min: number | null; // m³/h
    max: number | null; // m³/h
  };
  dimensions: {
    length: number | null; // mm
    width: number | null; // mm
    height: number | null; // mm
    weight: number | null; // kg
  };
  materials: {
    body: string | null;
    seals: string | null;
    internals: string | null;
  };
  connections: {
    inlet: ConnectionSpec | null;
    outlet: ConnectionSpec | null;
    auxiliary: ConnectionSpec[] | null;
  };
}

export interface BoQItem {
  id: string; // UUID v4
  projectId: string; // UUID v4, foreign key
  drawingId: string | null; // UUID v4, nullable
  componentId: string | null; // UUID v4, nullable
  itemNumber: string; // Sequential number
  description: string; // 1-500 chars
  specification: string; // 0-2000 chars
  quantity: number; // 0.001-999999
  unit: UnitOfMeasure; // enum: each | meter | kg | liter | etc.
  unitPrice: Money | null;
  totalPrice: Money | null; // Calculated: quantity * unitPrice
  supplier: string | null; // 0-200 chars
  leadTime: number | null; // days
  category: BoQCategory; // enum: equipment | piping | electrical | etc.
  status: BoQStatus; // enum: estimated | quoted | ordered | delivered
  notes: string | null; // 0-1000 chars
  createdAt: Date;
  updatedAt: Date;
}
```

## 3. Database Schema

```sql
-- Complete PostgreSQL DDL with all constraints

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- For exclusion constraints

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'engineer', 'reviewer', 'viewer');
CREATE TYPE organization_type AS ENUM ('enterprise', 'team', 'trial');
CREATE TYPE subscription_tier AS ENUM ('free', 'professional', 'enterprise');
CREATE TYPE project_type AS ENUM ('water_treatment', 'pumping_station', 'distribution', 'other');
CREATE TYPE project_status AS ENUM ('planning', 'design', 'construction', 'completed', 'cancelled');
CREATE TYPE drawing_type AS ENUM ('pid', 'pfd', 'electrical', 'instrumentation', 'other');
CREATE TYPE drawing_status AS ENUM ('draft', 'in_review', 'approved', 'published', 'archived');
CREATE TYPE drawing_standard AS ENUM ('ISA', 'ISO', 'DIN', 'TW', 'STW', 'DCWW', 'UU', 'NWC');
CREATE TYPE component_status AS ENUM ('active', 'spare', 'removed', 'planned');
CREATE TYPE boq_category AS ENUM ('equipment', 'piping', 'electrical', 'instrumentation', 'civil', 'other');
CREATE TYPE boq_status AS ENUM ('estimated', 'quoted', 'ordered', 'delivered', 'installed');

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    type organization_type NOT NULL DEFAULT 'team',
    subscription_tier subscription_tier NOT NULL DEFAULT 'free',
    max_users INTEGER NOT NULL DEFAULT 5 CHECK (max_users BETWEEN 1 AND 10000),
    max_projects INTEGER NOT NULL DEFAULT 10 CHECK (max_projects BETWEEN 1 AND 1000),
    max_storage_gb INTEGER NOT NULL DEFAULT 10 CHECK (max_storage_gb BETWEEN 1 AND 10000),
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ,
    CONSTRAINT org_name_length CHECK (char_length(name) >= 2),
    CONSTRAINT org_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role user_role NOT NULL DEFAULT 'viewer',
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT first_name_format CHECK (first_name ~ '^[A-Za-z \-'']+$'),
    CONSTRAINT last_name_format CHECK (last_name ~ '^[A-Za-z \-'']+$')
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) NOT NULL,
    description TEXT,
    type project_type NOT NULL,
    status project_status NOT NULL DEFAULT 'planning',
    start_date DATE NOT NULL,
    end_date DATE,
    budget_amount DECIMAL(15, 2),
    budget_currency VARCHAR(3),
    settings JSONB NOT NULL DEFAULT '{}',
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMPTZ,
    CONSTRAINT project_name_length CHECK (char_length(name) >= 3),
    CONSTRAINT project_code_format CHECK (code ~ '^[A-Z0-9-]+$'),
    CONSTRAINT project_dates CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT project_budget CHECK (budget_amount IS NULL OR budget_amount >= 0),
    CONSTRAINT metadata_size CHECK (pg_column_size(metadata) <= 10240), -- 10KB limit
    UNIQUE (organization_id, code)
);

-- Drawings table
CREATE TABLE drawings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type drawing_type NOT NULL,
    status drawing_status NOT NULL DEFAULT 'draft',
    version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    standard drawing_standard NOT NULL DEFAULT 'ISA',
    reactflow_data JSONB NOT NULL DEFAULT '{"nodes":[],"edges":[],"viewport":{"x":0,"y":0,"zoom":1}}',
    grid_settings JSONB NOT NULL DEFAULT '{"enabled":true,"size":20,"type":"orthogonal"}',
    layers JSONB NOT NULL DEFAULT '[]',
    component_count INTEGER NOT NULL DEFAULT 0 CHECK (component_count >= 0 AND component_count <= 10000),
    edge_count INTEGER NOT NULL DEFAULT 0 CHECK (edge_count >= 0 AND edge_count <= 20000),
    file_size INTEGER NOT NULL DEFAULT 0 CHECK (file_size >= 0 AND file_size <= 104857600), -- 100MB max
    thumbnail_url TEXT,
    locked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    locked_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID NOT NULL REFERENCES users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT drawing_name_length CHECK (char_length(name) >= 3),
    CONSTRAINT drawing_name_format CHECK (name ~ '^[a-zA-Z0-9][a-zA-Z0-9-_ ]*[a-zA-Z0-9]$'),
    CONSTRAINT version_format CHECK (version ~ '^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$'),
    CONSTRAINT reactflow_data_size CHECK (pg_column_size(reactflow_data) <= 52428800), -- 50MB limit
    CONSTRAINT layers_count CHECK (jsonb_array_length(layers) <= 100),
    UNIQUE (project_id, name, deleted_at)
);

-- Components table
CREATE TABLE components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drawing_id UUID NOT NULL REFERENCES drawings(id) ON DELETE CASCADE,
    node_id VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    sub_type VARCHAR(50),
    tag VARCHAR(50) NOT NULL,
    description TEXT,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    specifications JSONB NOT NULL DEFAULT '{}',
    properties JSONB NOT NULL DEFAULT '{}',
    status component_status NOT NULL DEFAULT 'active',
    maintenance_schedule JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tag_format CHECK (tag ~ '^[A-Z0-9-]+$'),
    UNIQUE (drawing_id, tag)
);

-- Bill of Quantities table
CREATE TABLE boq_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    drawing_id UUID REFERENCES drawings(id) ON DELETE SET NULL,
    component_id UUID REFERENCES components(id) ON DELETE SET NULL,
    item_number VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    specification TEXT,
    quantity DECIMAL(10, 3) NOT NULL CHECK (quantity > 0 AND quantity <= 999999),
    unit VARCHAR(20) NOT NULL,
    unit_price_amount DECIMAL(12, 2),
    unit_price_currency VARCHAR(3),
    total_price_amount DECIMAL(15, 2) GENERATED ALWAYS AS (quantity * unit_price_amount) STORED,
    supplier VARCHAR(200),
    lead_time_days INTEGER CHECK (lead_time_days >= 0 AND lead_time_days <= 1000),
    category boq_category NOT NULL,
    status boq_status NOT NULL DEFAULT 'estimated',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT description_length CHECK (char_length(description) >= 1 AND char_length(description) <= 500),
    UNIQUE (project_id, item_number)
);

-- Drawing versions table for history
CREATE TABLE drawing_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drawing_id UUID NOT NULL REFERENCES drawings(id) ON DELETE CASCADE,
    version VARCHAR(20) NOT NULL,
    reactflow_data JSONB NOT NULL,
    change_description TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT version_format CHECK (version ~ '^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$'),
    UNIQUE (drawing_id, version)
);

-- Audit log table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_organization ON users(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_organization ON projects(organization_id) WHERE archived_at IS NULL;
CREATE INDEX idx_drawings_project ON drawings(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_drawings_status ON drawings(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_drawings_locked ON drawings(locked_by) WHERE locked_by IS NOT NULL;
CREATE INDEX idx_components_drawing ON components(drawing_id);
CREATE INDEX idx_components_tag ON components(drawing_id, tag);
CREATE INDEX idx_boq_project ON boq_items(project_id);
CREATE INDEX idx_boq_status ON boq_items(status);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- Full text search indexes
CREATE INDEX idx_drawings_search ON drawings USING gin(
    to_tsvector('english', name || ' ' || COALESCE(description, ''))
) WHERE deleted_at IS NULL;

CREATE INDEX idx_components_search ON components USING gin(
    to_tsvector('english', tag || ' ' || COALESCE(description, ''))
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drawings_updated_at BEFORE UPDATE ON drawings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_components_updated_at BEFORE UPDATE ON components
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boq_items_updated_at BEFORE UPDATE ON boq_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security policies (example)
ALTER TABLE drawings ENABLE ROW LEVEL SECURITY;

CREATE POLICY drawings_organization_policy ON drawings
    FOR ALL
    USING (project_id IN (
        SELECT id FROM projects 
        WHERE organization_id = current_setting('app.current_organization_id')::uuid
    ));
```

## 4. Service Interfaces

```typescript
// Complete service interface definitions

export interface IDrawingService {
  // Create operations
  createDrawing(data: CreateDrawingDto, userId: string): Promise<Drawing>;
  createFromTemplate(templateId: string, data: CreateDrawingDto, userId: string): Promise<Drawing>;
  
  // Read operations
  findById(id: string, userId: string): Promise<Drawing>;
  findByProject(projectId: string, options: PaginationOptions): Promise<PaginatedResult<Drawing>>;
  search(query: SearchQuery, userId: string): Promise<Drawing[]>;
  
  // Update operations
  update(id: string, data: UpdateDrawingDto, userId: string): Promise<Drawing>;
  updateReactFlowData(id: string, data: ReactFlowData, userId: string): Promise<void>;
  
  // Delete operations
  softDelete(id: string, userId: string): Promise<void>;
  permanentDelete(id: string, userId: string): Promise<void>;
  
  // Locking operations
  acquireLock(id: string, userId: string): Promise<LockResult>;
  releaseLock(id: string, userId: string): Promise<void>;
  checkLock(id: string): Promise<LockStatus>;
  
  // Version operations
  createVersion(id: string, description: string, userId: string): Promise<DrawingVersion>;
  getVersions(id: string): Promise<DrawingVersion[]>;
  restoreVersion(id: string, versionId: string, userId: string): Promise<Drawing>;
  
  // Export operations
  exportToPDF(id: string, options: PDFExportOptions): Promise<Buffer>;
  exportToDWG(id: string, options: DWGExportOptions): Promise<Buffer>;
  exportToSVG(id: string): Promise<string>;
  
  // Validation
  validate(data: ReactFlowData, standard: DrawingStandard): Promise<ValidationResult>;
  checkEngineringRules(data: ReactFlowData): Promise<RuleCheckResult>;
  
  // Collaboration
  addComment(id: string, comment: CommentData, userId: string): Promise<Comment>;
  getComments(id: string): Promise<Comment[]>;
  
  // Workflow
  submitForReview(id: string, reviewers: string[], userId: string): Promise<void>;
  approve(id: string, userId: string): Promise<void>;
  reject(id: string, reason: string, userId: string): Promise<void>;
  publish(id: string, userId: string): Promise<void>;
}

export interface IComponentService {
  // CRUD operations
  create(drawingId: string, data: CreateComponentDto): Promise<Component>;
  findById(id: string): Promise<Component>;
  findByDrawing(drawingId: string): Promise<Component[]>;
  update(id: string, data: UpdateComponentDto): Promise<Component>;
  delete(id: string): Promise<void>;
  
  // Bulk operations
  bulkCreate(drawingId: string, components: CreateComponentDto[]): Promise<Component[]>;
  bulkUpdate(updates: BulkUpdateDto[]): Promise<void>;
  bulkDelete(ids: string[]): Promise<void>;
  
  // Tag management
  generateTag(type: ComponentType, drawingId: string): Promise<string>;
  validateTag(tag: string, drawingId: string): Promise<boolean>;
  renumberTags(drawingId: string, prefix: string): Promise<void>;
  
  // Specifications
  updateSpecifications(id: string, specs: ComponentSpecifications): Promise<void>;
  validateSpecifications(specs: ComponentSpecifications, type: ComponentType): Promise<ValidationResult>;
  
  // BoQ synchronization
  syncToBoQ(componentId: string): Promise<BoQItem>;
  syncFromBoQ(boqItemId: string): Promise<Component>;
  
  // Search and filter
  search(query: ComponentSearchQuery): Promise<Component[]>;
  findByTag(tag: string, projectId: string): Promise<Component[]>;
  findByType(type: ComponentType, drawingId: string): Promise<Component[]>;
}

export interface IBoQService {
  // CRUD operations
  create(data: CreateBoQItemDto): Promise<BoQItem>;
  findById(id: string): Promise<BoQItem>;
  findByProject(projectId: string, options: PaginationOptions): Promise<PaginatedResult<BoQItem>>;
  update(id: string, data: UpdateBoQItemDto): Promise<BoQItem>;
  delete(id: string): Promise<void>;
  
  // Bulk operations
  bulkImport(projectId: string, data: ImportBoQData): Promise<ImportResult>;
  bulkUpdate(updates: BulkBoQUpdateDto[]): Promise<void>;
  
  // Calculations
  calculateTotalCost(projectId: string): Promise<Money>;
  calculateByCategory(projectId: string): Promise<CategoryTotals>;
  updatePrices(projectId: string, priceList: PriceList): Promise<void>;
  
  // Export operations
  exportToExcel(projectId: string, options: ExcelExportOptions): Promise<Buffer>;
  exportToCSV(projectId: string): Promise<string>;
  exportToPDF(projectId: string, options: PDFOptions): Promise<Buffer>;
  
  // Synchronization
  syncFromDrawings(projectId: string): Promise<SyncResult>;
  validateQuantities(projectId: string): Promise<ValidationResult>;
  
  // Procurement
  generatePurchaseOrder(items: string[], supplier: string): Promise<PurchaseOrder>;
  updateDeliveryStatus(items: string[], status: BoQStatus): Promise<void>;
}
```

## 5. Event Schemas

```typescript
// Domain events for event-driven architecture

export interface DomainEvent {
  id: string; // UUID v4
  type: string;
  aggregateId: string;
  aggregateType: string;
  payload: any;
  metadata: EventMetadata;
  timestamp: Date;
  version: number;
}

export interface EventMetadata {
  userId: string;
  correlationId: string;
  causationId: string;
  ipAddress?: string;
  userAgent?: string;
}

// Drawing events
export const DrawingCreated = z.object({
  type: z.literal('drawing.created'),
  aggregateId: z.string().uuid(),
  payload: z.object({
    projectId: z.string().uuid(),
    name: z.string(),
    type: z.enum(['pid', 'pfd', 'electrical', 'instrumentation']),
    createdBy: z.string().uuid()
  })
});

export const DrawingUpdated = z.object({
  type: z.literal('drawing.updated'),
  aggregateId: z.string().uuid(),
  payload: z.object({
    changes: z.record(z.any()),
    updatedBy: z.string().uuid(),
    version: z.string()
  })
});

export const DrawingLocked = z.object({
  type: z.literal('drawing.locked'),
  aggregateId: z.string().uuid(),
  payload: z.object({
    lockedBy: z.string().uuid(),
    lockedAt: z.string().datetime(),
    duration: z.number() // seconds
  })
});

export const DrawingSubmittedForReview = z.object({
  type: z.literal('drawing.submitted_for_review'),
  aggregateId: z.string().uuid(),
  payload: z.object({
    submittedBy: z.string().uuid(),
    reviewers: z.array(z.string().uuid()),
    deadline: z.string().datetime().optional()
  })
});

// Component events
export const ComponentAdded = z.object({
  type: z.literal('component.added'),
  aggregateId: z.string().uuid(), // Drawing ID
  payload: z.object({
    componentId: z.string().uuid(),
    nodeId: z.string(),
    type: z.string(),
    tag: z.string(),
    position: z.object({
      x: z.number(),
      y: z.number()
    })
  })
});

export const ComponentPropertyChanged = z.object({
  type: z.literal('component.property_changed'),
  aggregateId: z.string().uuid(), // Component ID
  payload: z.object({
    property: z.string(),
    oldValue: z.any(),
    newValue: z.any(),
    changedBy: z.string().uuid()
  })
});

// WebSocket events for real-time collaboration
export const CollaborationEvent = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('cursor.moved'),
    userId: z.string().uuid(),
    drawingId: z.string().uuid(),
    position: z.object({ x: z.number(), y: z.number() })
  }),
  z.object({
    type: z.literal('selection.changed'),
    userId: z.string().uuid(),
    drawingId: z.string().uuid(),
    selectedNodes: z.array(z.string())
  }),
  z.object({
    type: z.literal('user.joined'),
    userId: z.string().uuid(),
    drawingId: z.string().uuid(),
    userInfo: z.object({
      name: z.string(),
      avatar: z.string().optional()
    })
  }),
  z.object({
    type: z.literal('user.left'),
    userId: z.string().uuid(),
    drawingId: z.string().uuid()
  }),
  z.object({
    type: z.literal('drawing.changed'),
    drawingId: z.string().uuid(),
    changes: z.object({
      nodes: z.array(z.any()).optional(),
      edges: z.array(z.any()).optional()
    })
  })
]);
```

## 6. Error Codes and Responses

```typescript
// Comprehensive error code definitions

export enum ErrorCode {
  // Authentication errors (1000-1099)
  INVALID_CREDENTIALS = 'AUTH_1001',
  TOKEN_EXPIRED = 'AUTH_1002',
  TOKEN_INVALID = 'AUTH_1003',
  REFRESH_TOKEN_EXPIRED = 'AUTH_1004',
  INSUFFICIENT_PERMISSIONS = 'AUTH_1005',
  ACCOUNT_LOCKED = 'AUTH_1006',
  EMAIL_NOT_VERIFIED = 'AUTH_1007',
  MFA_REQUIRED = 'AUTH_1008',
  
  // Validation errors (2000-2099)
  VALIDATION_FAILED = 'VAL_2001',
  REQUIRED_FIELD_MISSING = 'VAL_2002',
  INVALID_FORMAT = 'VAL_2003',
  VALUE_OUT_OF_RANGE = 'VAL_2004',
  DUPLICATE_VALUE = 'VAL_2005',
  
  // Resource errors (3000-3099)
  RESOURCE_NOT_FOUND = 'RES_3001',
  RESOURCE_ALREADY_EXISTS = 'RES_3002',
  RESOURCE_LOCKED = 'RES_3003',
  RESOURCE_DELETED = 'RES_3004',
  
  // Business logic errors (4000-4099)
  INVALID_STATE_TRANSITION = 'BUS_4001',
  QUOTA_EXCEEDED = 'BUS_4002',
  OPERATION_NOT_ALLOWED = 'BUS_4003',
  DEPENDENCY_ERROR = 'BUS_4004',
  
  // Drawing specific errors (5000-5099)
  DRAWING_LOCKED = 'DRW_5001',
  VERSION_CONFLICT = 'DRW_5002',
  INVALID_REACTFLOW_DATA = 'DRW_5003',
  COMPONENT_LIMIT_EXCEEDED = 'DRW_5004',
  INVALID_CONNECTION = 'DRW_5005',
  
  // System errors (9000-9099)
  INTERNAL_SERVER_ERROR = 'SYS_9001',
  DATABASE_ERROR = 'SYS_9002',
  EXTERNAL_SERVICE_ERROR = 'SYS_9003',
  RATE_LIMIT_EXCEEDED = 'SYS_9004'
}

export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetail[];
    timestamp: string; // ISO 8601
    traceId: string; // For debugging
  };
}

export interface ErrorDetail {
  field?: string;
  message: string;
  value?: any;
}

// Error response examples
export const errorResponses = {
  [ErrorCode.VALIDATION_FAILED]: {
    status: 400,
    body: {
      error: {
        code: 'VAL_2001',
        message: 'Validation failed',
        details: [
          {
            field: 'name',
            message: 'Name must be between 3 and 255 characters'
          },
          {
            field: 'email',
            message: 'Invalid email format'
          }
        ],
        timestamp: '2024-01-01T00:00:00Z',
        traceId: 'abc123'
      }
    }
  },
  [ErrorCode.RESOURCE_NOT_FOUND]: {
    status: 404,
    body: {
      error: {
        code: 'RES_3001',
        message: 'Drawing not found',
        timestamp: '2024-01-01T00:00:00Z',
        traceId: 'abc124'
      }
    }
  },
  [ErrorCode.VERSION_CONFLICT]: {
    status: 409,
    body: {
      error: {
        code: 'DRW_5002',
        message: 'Drawing has been modified by another user',
        details: [
          {
            field: 'version',
            message: 'Current version is 1.2.0',
            value: '1.2.0'
          }
        ],
        timestamp: '2024-01-01T00:00:00Z',
        traceId: 'abc125'
      }
    }
  }
};
```

## 7. WebSocket Protocol

```typescript
// Real-time collaboration protocol

export interface WebSocketMessage {
  id: string; // Message ID
  type: MessageType;
  payload: any;
  timestamp: number; // Unix timestamp
}

export enum MessageType {
  // Connection management
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  PING = 'ping',
  PONG = 'pong',
  
  // Drawing collaboration
  JOIN_DRAWING = 'join_drawing',
  LEAVE_DRAWING = 'leave_drawing',
  DRAWING_UPDATE = 'drawing_update',
  
  // User presence
  CURSOR_MOVE = 'cursor_move',
  SELECTION_CHANGE = 'selection_change',
  USER_STATE = 'user_state',
  
  // Synchronization
  SYNC_REQUEST = 'sync_request',
  SYNC_RESPONSE = 'sync_response',
  
  // Conflict resolution
  CONFLICT_DETECTED = 'conflict_detected',
  CONFLICT_RESOLVED = 'conflict_resolved'
}

// Protocol examples
export const wsProtocolExamples = {
  joinDrawing: {
    id: 'msg_123',
    type: 'join_drawing',
    payload: {
      drawingId: 'uuid',
      userId: 'uuid',
      userInfo: {
        name: 'John Doe',
        color: '#3B82F6' // User cursor color
      }
    },
    timestamp: 1234567890
  },
  
  drawingUpdate: {
    id: 'msg_124',
    type: 'drawing_update',
    payload: {
      operation: 'add_node',
      data: {
        node: {
          id: 'node_1',
          type: 'symbol',
          position: { x: 100, y: 200 },
          data: { symbolType: 'pump' }
        }
      },
      version: 5 // Operation version for ordering
    },
    timestamp: 1234567891
  },
  
  cursorMove: {
    id: 'msg_125',
    type: 'cursor_move',
    payload: {
      userId: 'uuid',
      position: { x: 250, y: 350 },
      viewport: { x: 0, y: 0, zoom: 1 }
    },
    timestamp: 1234567892
  }
};
```

## 8. Dependency Versions

```json
{
  "dependencies": {
    // Backend (.NET)
    "Microsoft.AspNetCore.App": "8.0.0",
    "Microsoft.EntityFrameworkCore": "8.0.0",
    "Microsoft.EntityFrameworkCore.PostgreSQL": "8.0.0",
    "Microsoft.AspNetCore.Authentication.JwtBearer": "8.0.0",
    "Microsoft.AspNetCore.OData": "8.0.0",
    "Microsoft.AspNetCore.SignalR": "8.0.0",
    "Swashbuckle.AspNetCore": "6.5.0",
    "AutoMapper": "12.0.1",
    "FluentValidation": "11.9.0",
    "Serilog.AspNetCore": "8.0.0",
    "Polly": "8.2.0",
    "MediatR": "12.2.0",
    "StackExchange.Redis": "2.7.10",
    
    // Frontend (React/Next.js)
    "next": "14.1.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "reactflow": "11.10.2",
    "typescript": "5.3.3",
    "@reduxjs/toolkit": "2.0.1",
    "react-redux": "9.1.0",
    "axios": "1.6.5",
    "@tanstack/react-query": "5.17.9",
    "zod": "3.22.4",
    "react-hook-form": "7.48.2",
    "@hookform/resolvers": "3.3.4",
    "tailwindcss": "3.4.1",
    "@headlessui/react": "1.7.17",
    "@heroicons/react": "2.1.1",
    "date-fns": "3.2.0",
    "lodash": "4.17.21",
    "uuid": "9.0.1",
    
    // Testing
    "jest": "29.7.0",
    "@testing-library/react": "14.1.2",
    "@testing-library/jest-dom": "6.2.0",
    "cypress": "13.6.3",
    "msw": "2.0.11",
    
    // ML/Python services
    "fastapi": "0.109.0",
    "uvicorn": "0.25.0",
    "pydantic": "2.5.3",
    "sqlalchemy": "2.0.25",
    "tensorflow": "2.15.0",
    "torch": "2.1.2",
    "opencv-python": "4.9.0.80",
    "numpy": "1.26.3",
    "pandas": "2.1.4",
    "scikit-learn": "1.4.0"
  }
}
```

---

This Technical Specification Document provides:
1. **Exact API contracts** with all request/response formats
2. **Complete data models** with all constraints and validations
3. **Full database schema** with indexes, triggers, and constraints
4. **Service interfaces** defining all operations
5. **Event schemas** for domain events and real-time collaboration
6. **Comprehensive error codes** with response formats
7. **WebSocket protocol** for real-time features
8. **Exact dependency versions** to ensure consistency

Every type, constraint, and behavior is explicitly defined to eliminate ambiguity during implementation.