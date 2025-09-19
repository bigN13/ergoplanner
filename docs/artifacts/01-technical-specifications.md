# Ergoplanner AI Suite - Technical Specifications
## P&ID Management System

**Document Version:** 1.0.0
**Last Updated:** 2025-01-19
**Classification:** Technical Reference

---

## Table of Contents

1. [API Endpoint Specifications](#1-api-endpoint-specifications)
2. [Database Schema Specifications](#2-database-schema-specifications)
3. [ReactFlow Data Structure Specifications](#3-reactflow-data-structure-specifications)
4. [WebSocket Event Specifications](#4-websocket-event-specifications)
5. [Message Queue Contracts](#5-message-queue-contracts)
6. [Redis Cache Specifications](#6-redis-cache-specifications)

---

## 1. API Endpoint Specifications

### 1.1 Authentication & Headers

All API requests require authentication via JWT token in the Authorization header.

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-Request-ID: <uuid_v4>
X-Client-Version: 1.0.0
```

### 1.2 Rate Limiting

| Endpoint Category | Rate Limit | Window | Burst |
|------------------|------------|---------|-------|
| Authentication | 5 req/min | 60s | 10 |
| Read Operations | 100 req/min | 60s | 200 |
| Write Operations | 30 req/min | 60s | 50 |
| Export Operations | 5 req/min | 60s | 10 |
| AI Processing | 10 req/min | 60s | 20 |

Rate limit headers returned:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642518000
```

### 1.3 Project Management Endpoints

#### GET /api/v1/projects
**Description:** Retrieve all projects for authenticated user

**Query Parameters:**
```typescript
{
  page?: number;          // Default: 1, Min: 1, Max: 1000
  limit?: number;         // Default: 20, Min: 1, Max: 100
  sort?: string;          // Enum: ['created_at', 'updated_at', 'name']
  order?: string;         // Enum: ['asc', 'desc']
  search?: string;        // Max length: 255
  status?: string;        // Enum: ['active', 'archived', 'draft']
  tag?: string[];         // Max items: 10, Item max length: 50
}
```

**Response Schema:**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Refinery Unit A P&ID",
        "description": "Main distillation unit process and instrumentation diagram",
        "client_name": "PetroChemical Corp",
        "project_code": "PC-2025-001",
        "status": "active",
        "tags": ["refinery", "distillation", "critical"],
        "metadata": {
          "industry": "oil_gas",
          "location": "Houston, TX",
          "estimated_completion": "2025-06-30",
          "compliance_standards": ["API", "ASME", "ISO 14001"]
        },
        "settings": {
          "auto_save": true,
          "version_control": true,
          "collaboration_enabled": true,
          "default_units": "metric"
        },
        "statistics": {
          "total_drawings": 24,
          "total_components": 1847,
          "last_activity": "2025-01-19T10:30:00Z"
        },
        "permissions": {
          "can_edit": true,
          "can_delete": false,
          "can_share": true,
          "can_export": true
        },
        "created_at": "2025-01-10T08:00:00Z",
        "updated_at": "2025-01-19T10:30:00Z",
        "created_by": "user_550e8400",
        "updated_by": "user_550e8400"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "total_pages": 3
    }
  },
  "timestamp": "2025-01-19T14:30:00Z",
  "request_id": "req_123456789"
}
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid query parameters
- `401 Unauthorized` - Missing or invalid token
- `429 Too Many Requests` - Rate limit exceeded

**Example Request:**
```bash
curl -X GET "https://api.ergoplanner.com/api/v1/projects?page=1&limit=10&status=active&sort=updated_at&order=desc" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: 550e8400-e29b-41d4-a716-446655440001"
```

#### POST /api/v1/projects
**Description:** Create a new project

**Request Body Schema:**
```json
{
  "name": "string",              // Required, Min: 3, Max: 255 chars
  "description": "string",       // Optional, Max: 1000 chars
  "client_name": "string",       // Required, Max: 255 chars
  "project_code": "string",      // Required, Pattern: /^[A-Z]{2,5}-\d{4}-\d{3}$/
  "tags": ["string"],           // Optional, Max: 10 items, Item max: 50 chars
  "metadata": {
    "industry": "string",        // Enum: ['oil_gas', 'chemical', 'pharma', 'food_bev', 'water_treatment']
    "location": "string",        // Max: 255 chars
    "estimated_completion": "date", // ISO 8601 format
    "compliance_standards": ["string"] // Max: 20 items
  },
  "settings": {
    "auto_save": "boolean",      // Default: true
    "version_control": "boolean", // Default: true
    "collaboration_enabled": "boolean", // Default: false
    "default_units": "string"    // Enum: ['metric', 'imperial']
  }
}
```

**Validation Rules:**
- `name`: Alphanumeric with spaces, hyphens, underscores
- `project_code`: Must be unique across organization
- `estimated_completion`: Must be future date
- `tags`: No duplicate values allowed

**Response:** Same as GET /api/v1/projects/{id}

**Status Codes:**
- `201 Created` - Project created successfully
- `400 Bad Request` - Validation errors
- `409 Conflict` - Project code already exists

#### PUT /api/v1/projects/{id}
**Description:** Update existing project

**Path Parameters:**
- `id`: UUID v4 format

**Request Body:** Same as POST (all fields optional)

**Status Codes:**
- `200 OK` - Updated successfully
- `404 Not Found` - Project not found
- `403 Forbidden` - No permission to update
- `409 Conflict` - Concurrent update conflict

#### DELETE /api/v1/projects/{id}
**Description:** Soft delete a project

**Path Parameters:**
- `id`: UUID v4 format

**Query Parameters:**
- `permanent`: boolean (default: false) - Hard delete if true

**Status Codes:**
- `204 No Content` - Deleted successfully
- `404 Not Found` - Project not found
- `403 Forbidden` - No permission to delete
- `400 Bad Request` - Project has active dependencies

### 1.4 Drawing Management Endpoints

#### GET /api/v1/projects/{projectId}/drawings
**Description:** Get all drawings for a project

**Response Schema:**
```json
{
  "success": true,
  "data": {
    "drawings": [
      {
        "id": "drawing_550e8400",
        "project_id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Distillation Column P&ID",
        "drawing_number": "PC-2025-001-DWG-001",
        "revision": "A",
        "sheet_size": "A1",
        "scale": "1:100",
        "status": "in_review",
        "type": "pid",
        "viewport": {
          "x": 0,
          "y": 0,
          "zoom": 1.0,
          "width": 841,
          "height": 594
        },
        "grid_settings": {
          "enabled": true,
          "size": 10,
          "snap_to_grid": true,
          "visible": true
        },
        "layers": [
          {
            "id": "layer_1",
            "name": "Process Equipment",
            "visible": true,
            "locked": false,
            "opacity": 1.0,
            "z_index": 1
          }
        ],
        "statistics": {
          "total_components": 127,
          "total_connections": 89,
          "total_annotations": 34
        },
        "validation_status": {
          "is_valid": true,
          "errors": [],
          "warnings": [
            {
              "code": "W001",
              "message": "Unconnected port on V-101",
              "component_id": "comp_123"
            }
          ]
        },
        "lock_status": {
          "is_locked": false,
          "locked_by": null,
          "locked_at": null
        },
        "created_at": "2025-01-12T10:00:00Z",
        "updated_at": "2025-01-19T14:00:00Z",
        "created_by": "user_550e8400",
        "updated_by": "user_550e8401"
      }
    ]
  }
}
```

#### POST /api/v1/projects/{projectId}/drawings
**Description:** Create a new drawing

**Request Body Schema:**
```json
{
  "name": "string",                    // Required, Max: 255 chars
  "drawing_number": "string",          // Required, Pattern: /^[A-Z0-9-]+$/
  "type": "string",                    // Enum: ['pid', 'pfd', 'isometric', 'layout']
  "sheet_size": "string",              // Enum: ['A0', 'A1', 'A2', 'A3', 'A4']
  "scale": "string",                   // Pattern: /^\d+:\d+$/
  "template_id": "uuid",               // Optional, UUID v4
  "copy_from_drawing_id": "uuid",     // Optional, UUID v4
  "grid_settings": {
    "enabled": true,
    "size": 10,                        // Min: 5, Max: 100
    "snap_to_grid": true
  }
}
```

### 1.5 Component Management Endpoints

#### GET /api/v1/drawings/{drawingId}/components
**Description:** Get all components in a drawing

**Response Schema:**
```json
{
  "success": true,
  "data": {
    "components": [
      {
        "id": "comp_550e8400",
        "drawing_id": "drawing_550e8400",
        "type": "vessel",
        "subtype": "vertical_drum",
        "tag": "V-101",
        "name": "Flash Drum",
        "position": {
          "x": 350.5,
          "y": 200.75
        },
        "dimensions": {
          "width": 80,
          "height": 120,
          "rotation": 0
        },
        "style": {
          "fill": "#ffffff",
          "stroke": "#000000",
          "strokeWidth": 2,
          "opacity": 1.0
        },
        "ports": [
          {
            "id": "port_1",
            "name": "inlet",
            "type": "process",
            "position": "top",
            "offset": { "x": 0, "y": 0 },
            "connected_to": "edge_123"
          }
        ],
        "properties": {
          "design_pressure": {
            "value": 10.5,
            "unit": "bar",
            "min": 0,
            "max": 15
          },
          "design_temperature": {
            "value": 150,
            "unit": "celsius",
            "min": -20,
            "max": 200
          },
          "material": "SS316L",
          "volume": {
            "value": 5000,
            "unit": "liters"
          },
          "manufacturer": "VesselTech Inc",
          "model": "VT-5000"
        },
        "metadata": {
          "specification": "SPEC-V-001",
          "data_sheet": "DS-V-101",
          "pid_reference": "PC-2025-001-DWG-001"
        },
        "validation": {
          "is_valid": true,
          "errors": [],
          "warnings": []
        },
        "layer_id": "layer_1",
        "locked": false,
        "visible": true,
        "created_at": "2025-01-15T09:00:00Z",
        "updated_at": "2025-01-19T11:00:00Z"
      }
    ]
  }
}
```

#### POST /api/v1/drawings/{drawingId}/components
**Description:** Add component to drawing

**Request Body Schema:**
```json
{
  "type": "string",              // Required, Enum: ['vessel', 'pump', 'valve', 'instrument', 'pipe', 'exchanger']
  "subtype": "string",           // Required based on type
  "tag": "string",               // Required, Pattern: /^[A-Z]{1,3}-\d{3,4}[A-Z]?$/
  "name": "string",              // Required, Max: 255 chars
  "position": {
    "x": "number",               // Required, Min: 0, Max: 10000
    "y": "number"                // Required, Min: 0, Max: 10000
  },
  "dimensions": {
    "width": "number",           // Required, Min: 10, Max: 500
    "height": "number",          // Required, Min: 10, Max: 500
    "rotation": "number"         // Optional, Min: 0, Max: 360
  },
  "symbol_id": "uuid",          // Required, must exist in symbol library
  "layer_id": "uuid",           // Optional, defaults to active layer
  "properties": "object"        // Component-specific properties
}
```

**Validation Rules:**
- Tag must be unique within drawing
- Position must be within drawing bounds
- Symbol_id must match component type

#### PUT /api/v1/components/{componentId}
**Description:** Update component properties

**Request Body:** Partial update allowed, only provided fields are updated

**Special Operations:**
```json
{
  "operation": "move",
  "delta": { "x": 10, "y": -5 }
}
```

```json
{
  "operation": "rotate",
  "angle": 45,
  "center": { "x": 400, "y": 300 }
}
```

### 1.6 Symbol Library Endpoints

#### GET /api/v1/symbols
**Description:** Get available P&ID symbols

**Query Parameters:**
```typescript
{
  category?: string;      // Enum: ['vessels', 'pumps', 'valves', 'instruments', 'misc']
  standard?: string;      // Enum: ['ISA', 'ISO', 'DIN', 'JIS', 'CUSTOM']
  search?: string;        // Max: 100 chars
}
```

**Response Schema:**
```json
{
  "success": true,
  "data": {
    "symbols": [
      {
        "id": "symbol_550e8400",
        "name": "Centrifugal Pump",
        "category": "pumps",
        "subcategory": "centrifugal",
        "standard": "ISA",
        "tags": ["pump", "centrifugal", "rotating"],
        "svg_content": "<svg>...</svg>",
        "svg_size": 2456,  // bytes
        "default_dimensions": {
          "width": 60,
          "height": 60
        },
        "connection_points": [
          {
            "id": "cp_1",
            "name": "inlet",
            "position": { "x": 0, "y": 30 },
            "direction": "left",
            "type": "process"
          },
          {
            "id": "cp_2",
            "name": "outlet",
            "position": { "x": 60, "y": 30 },
            "direction": "right",
            "type": "process"
          }
        ],
        "properties_template": {
          "flow_rate": {
            "type": "number",
            "unit": "m3/h",
            "required": true,
            "min": 0,
            "max": 10000
          },
          "head": {
            "type": "number",
            "unit": "m",
            "required": true
          },
          "power": {
            "type": "number",
            "unit": "kW",
            "required": false
          }
        },
        "usage_count": 1247,
        "is_custom": false,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-12-01T00:00:00Z"
      }
    ]
  }
}
```

#### POST /api/v1/symbols
**Description:** Create custom symbol

**Request Body Schema:**
```json
{
  "name": "string",                  // Required, Max: 255 chars
  "category": "string",              // Required
  "svg_content": "string",           // Required, Max: 100KB
  "tags": ["string"],               // Max: 10 items
  "connection_points": [{
    "name": "string",
    "position": { "x": "number", "y": "number" },
    "direction": "string",           // Enum: ['left', 'right', 'top', 'bottom']
    "type": "string"                // Enum: ['process', 'electric', 'pneumatic', 'hydraulic']
  }],
  "properties_template": "object"
}
```

**Validation:**
- SVG content must be valid XML
- SVG must not contain scripts
- File size limit: 100KB

### 1.7 Bill of Quantities (BoQ) Endpoints

#### POST /api/v1/projects/{projectId}/boq/generate
**Description:** Generate BoQ from drawings

**Request Body Schema:**
```json
{
  "drawing_ids": ["uuid"],          // Required, Min: 1, Max: 100
  "include_spares": true,
  "spare_percentage": 10,           // Min: 0, Max: 50
  "grouping": "category",           // Enum: ['category', 'drawing', 'tag_prefix']
  "format": "standard",             // Enum: ['standard', 'detailed', 'summary']
  "include_costs": false,
  "currency": "USD"                 // ISO 4217 code
}
```

**Response Schema:**
```json
{
  "success": true,
  "data": {
    "boq_id": "boq_550e8400",
    "status": "processing",
    "estimated_time": 30,           // seconds
    "job_id": "job_123456"
  }
}
```

#### GET /api/v1/boq/{boqId}
**Description:** Get generated BoQ

**Response Schema:**
```json
{
  "success": true,
  "data": {
    "id": "boq_550e8400",
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "generated_at": "2025-01-19T15:00:00Z",
    "items": [
      {
        "item_id": "item_001",
        "category": "Vessels",
        "tag": "V-101",
        "description": "Vertical Flash Drum, SS316L, 5000L",
        "specification": "SPEC-V-001",
        "quantity": 1,
        "unit": "EA",
        "spare_quantity": 0,
        "total_quantity": 1,
        "unit_cost": 45000.00,
        "total_cost": 45000.00,
        "currency": "USD",
        "lead_time_days": 120,
        "supplier": "VesselTech Inc",
        "drawing_references": ["PC-2025-001-DWG-001"],
        "notes": "Design pressure: 10.5 bar"
      }
    ],
    "summary": {
      "total_items": 247,
      "total_cost": 1250000.00,
      "currency": "USD",
      "categories": [
        {
          "name": "Vessels",
          "count": 12,
          "cost": 540000.00
        },
        {
          "name": "Pumps",
          "count": 18,
          "cost": 360000.00
        }
      ]
    },
    "metadata": {
      "drawing_count": 5,
      "generation_time_ms": 2847,
      "includes_spares": true,
      "spare_percentage": 10
    }
  }
}
```

### 1.8 Export Endpoints

#### POST /api/v1/drawings/{drawingId}/export
**Description:** Export drawing to various formats

**Request Body Schema:**
```json
{
  "format": "string",              // Enum: ['pdf', 'dwg', 'dxf', 'svg', 'png']
  "options": {
    "scale": "string",             // For PDF: 'fit', '1:1', '1:100'
    "quality": "string",           // For PNG: Enum: ['low', 'medium', 'high', 'maximum']
    "dpi": 300,                   // For raster formats, Min: 72, Max: 600
    "layers": "string",           // Enum: ['all', 'visible', 'selected']
    "include_grid": false,
    "include_annotations": true,
    "color_mode": "string",       // Enum: ['color', 'grayscale', 'black_white']
    "paper_size": "string",       // For PDF: 'A0', 'A1', 'A2', 'A3', 'A4'
    "orientation": "string"       // Enum: ['portrait', 'landscape', 'auto']
  }
}
```

**Response Schema:**
```json
{
  "success": true,
  "data": {
    "export_id": "exp_550e8400",
    "status": "processing",
    "format": "pdf",
    "estimated_size_kb": 2456,
    "download_url": null,
    "expires_at": null
  }
}
```

#### GET /api/v1/exports/{exportId}/status
**Description:** Check export status

**Response Schema:**
```json
{
  "success": true,
  "data": {
    "export_id": "exp_550e8400",
    "status": "completed",         // Enum: ['processing', 'completed', 'failed']
    "progress": 100,
    "file_size_kb": 2387,
    "download_url": "https://storage.ergoplanner.com/exports/exp_550e8400.pdf",
    "expires_at": "2025-01-20T15:00:00Z",
    "error": null
  }
}
```

### 1.9 AI Processing Endpoints

#### POST /api/v1/ai/analyze-drawing
**Description:** AI analysis of P&ID drawing

**Request Body Schema:**
```json
{
  "drawing_id": "uuid",
  "analysis_types": ["string"],    // Enum: ['compliance', 'optimization', 'safety', 'completeness']
  "standards": ["string"],         // Enum: ['ISA', 'ISO', 'API', 'ASME']
  "options": {
    "include_recommendations": true,
    "severity_threshold": "medium", // Enum: ['low', 'medium', 'high']
    "max_recommendations": 20
  }
}
```

**Response Schema:**
```json
{
  "success": true,
  "data": {
    "analysis_id": "ai_550e8400",
    "drawing_id": "drawing_550e8400",
    "timestamp": "2025-01-19T16:00:00Z",
    "results": {
      "compliance": {
        "score": 92,
        "status": "pass",
        "issues": [
          {
            "id": "issue_001",
            "severity": "medium",
            "standard": "ISA",
            "rule": "ISA-5.1-2009-4.2.1",
            "description": "Instrument tag format non-compliant",
            "affected_components": ["FIC-101", "PIC-102"],
            "recommendation": "Update tags to format: XX-NNNA"
          }
        ]
      },
      "optimization": {
        "opportunities": [
          {
            "id": "opt_001",
            "type": "piping_route",
            "potential_savings": "15%",
            "description": "Optimize pipe routing between V-101 and P-102",
            "current_length_m": 45.5,
            "optimized_length_m": 38.7
          }
        ]
      },
      "safety": {
        "risk_score": 3.2,
        "hazards": [
          {
            "id": "hazard_001",
            "type": "missing_relief",
            "severity": "high",
            "description": "No pressure relief valve on vessel V-103",
            "mitigation": "Add PSV with set pressure 12 bar"
          }
        ]
      }
    },
    "processing_time_ms": 3456
  }
}
```

---

## 2. Database Schema Specifications

### 2.1 Core Tables

#### projects
```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_name VARCHAR(255) NOT NULL,
    project_code VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived', 'completed')),
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{"auto_save": true, "version_control": true}',
    statistics JSONB DEFAULT '{}',

    -- Audit columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),

    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES users(id),

    -- Constraints
    CONSTRAINT project_code_format CHECK (project_code ~ '^[A-Z]{2,5}-[0-9]{4}-[0-9]{3}$'),
    CONSTRAINT name_length CHECK (char_length(name) >= 3),

    -- Indexes
    INDEX idx_projects_status ON projects(status) WHERE deleted_at IS NULL,
    INDEX idx_projects_project_code ON projects(project_code) WHERE deleted_at IS NULL,
    INDEX idx_projects_created_by ON projects(created_by),
    INDEX idx_projects_tags ON projects USING gin(tags),
    INDEX idx_projects_metadata ON projects USING gin(metadata),
    INDEX idx_projects_search ON projects USING gin(
        to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || client_name)
    )
);

-- Trigger for updated_at
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

#### drawings
```sql
CREATE TABLE drawings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    drawing_number VARCHAR(100) NOT NULL,
    revision VARCHAR(10) NOT NULL DEFAULT 'A',
    sheet_size VARCHAR(10) NOT NULL CHECK (sheet_size IN ('A0', 'A1', 'A2', 'A3', 'A4')),
    scale VARCHAR(20) NOT NULL DEFAULT '1:100',
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'in_progress', 'in_review', 'approved', 'as_built')),
    type VARCHAR(20) NOT NULL CHECK (type IN ('pid', 'pfd', 'isometric', 'layout')),

    -- Drawing specific data
    viewport JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "zoom": 1.0, "width": 841, "height": 594}',
    grid_settings JSONB DEFAULT '{"enabled": true, "size": 10, "snap_to_grid": true}',
    layers JSONB DEFAULT '[]',
    statistics JSONB DEFAULT '{}',
    validation_status JSONB DEFAULT '{"is_valid": true, "errors": [], "warnings": []}',

    -- Locking mechanism
    locked_by UUID REFERENCES users(id),
    locked_at TIMESTAMP WITH TIME ZONE,
    lock_expires_at TIMESTAMP WITH TIME ZONE,

    -- Audit columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),

    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES users(id),

    -- Constraints
    CONSTRAINT unique_drawing_number UNIQUE(project_id, drawing_number) WHERE deleted_at IS NULL,
    CONSTRAINT drawing_number_format CHECK (drawing_number ~ '^[A-Z0-9-]+$'),
    CONSTRAINT scale_format CHECK (scale ~ '^[0-9]+:[0-9]+$'),

    -- Indexes
    INDEX idx_drawings_project_id ON drawings(project_id) WHERE deleted_at IS NULL,
    INDEX idx_drawings_status ON drawings(status) WHERE deleted_at IS NULL,
    INDEX idx_drawings_type ON drawings(type),
    INDEX idx_drawings_locked_by ON drawings(locked_by) WHERE locked_by IS NOT NULL
);
```

#### components
```sql
CREATE TABLE components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drawing_id UUID NOT NULL REFERENCES drawings(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    subtype VARCHAR(50) NOT NULL,
    tag VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,

    -- Positioning and dimensions
    position_x DECIMAL(10,2) NOT NULL CHECK (position_x >= 0 AND position_x <= 10000),
    position_y DECIMAL(10,2) NOT NULL CHECK (position_y >= 0 AND position_y <= 10000),
    width DECIMAL(10,2) NOT NULL CHECK (width > 0 AND width <= 500),
    height DECIMAL(10,2) NOT NULL CHECK (height > 0 AND height <= 500),
    rotation DECIMAL(5,2) DEFAULT 0 CHECK (rotation >= 0 AND rotation < 360),

    -- Visual properties
    style JSONB DEFAULT '{"fill": "#ffffff", "stroke": "#000000", "strokeWidth": 2}',

    -- Component data
    symbol_id UUID REFERENCES symbols(id),
    ports JSONB DEFAULT '[]',
    properties JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    validation JSONB DEFAULT '{"is_valid": true, "errors": [], "warnings": []}',

    -- Layer management
    layer_id UUID,
    z_index INTEGER DEFAULT 0,
    locked BOOLEAN DEFAULT false,
    visible BOOLEAN DEFAULT true,

    -- Audit columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),

    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES users(id),

    -- Constraints
    CONSTRAINT unique_component_tag UNIQUE(drawing_id, tag) WHERE deleted_at IS NULL,
    CONSTRAINT tag_format CHECK (tag ~ '^[A-Z]{1,3}-[0-9]{3,4}[A-Z]?$'),

    -- Indexes
    INDEX idx_components_drawing_id ON components(drawing_id) WHERE deleted_at IS NULL,
    INDEX idx_components_type ON components(type),
    INDEX idx_components_tag ON components(tag),
    INDEX idx_components_position ON components(position_x, position_y),
    INDEX idx_components_properties ON components USING gin(properties)
);
```

#### edges (connections)
```sql
CREATE TABLE edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drawing_id UUID NOT NULL REFERENCES drawings(id) ON DELETE CASCADE,
    source_component_id UUID NOT NULL REFERENCES components(id) ON DELETE CASCADE,
    target_component_id UUID NOT NULL REFERENCES components(id) ON DELETE CASCADE,
    source_port VARCHAR(50),
    target_port VARCHAR(50),

    -- Connection type and properties
    type VARCHAR(50) NOT NULL DEFAULT 'process'
        CHECK (type IN ('process', 'electrical', 'pneumatic', 'hydraulic', 'signal')),

    -- Routing information
    routing_points JSONB DEFAULT '[]', -- Array of {x, y} points
    path_style VARCHAR(20) DEFAULT 'straight' CHECK (path_style IN ('straight', 'orthogonal', 'curved')),

    -- Visual properties
    style JSONB DEFAULT '{"stroke": "#000000", "strokeWidth": 2, "strokeDasharray": ""}',

    -- Line properties
    line_size VARCHAR(50), -- e.g., "2 inch", "DN50"
    flow_direction VARCHAR(20) CHECK (flow_direction IN ('forward', 'reverse', 'bidirectional')),

    -- Metadata
    properties JSONB DEFAULT '{}',
    validation JSONB DEFAULT '{"is_valid": true, "errors": [], "warnings": []}',

    -- Layer management
    layer_id UUID,
    z_index INTEGER DEFAULT 0,
    locked BOOLEAN DEFAULT false,
    visible BOOLEAN DEFAULT true,

    -- Audit columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),

    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES users(id),

    -- Constraints
    CONSTRAINT no_self_connection CHECK (source_component_id != target_component_id),

    -- Indexes
    INDEX idx_edges_drawing_id ON edges(drawing_id) WHERE deleted_at IS NULL,
    INDEX idx_edges_source ON edges(source_component_id),
    INDEX idx_edges_target ON edges(target_component_id),
    INDEX idx_edges_type ON edges(type)
);
```

#### symbols
```sql
CREATE TABLE symbols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(50),
    standard VARCHAR(20) NOT NULL CHECK (standard IN ('ISA', 'ISO', 'DIN', 'JIS', 'CUSTOM')),

    -- SVG data
    svg_content TEXT NOT NULL,
    svg_checksum VARCHAR(64) NOT NULL, -- SHA-256 hash
    svg_size_bytes INTEGER NOT NULL CHECK (svg_size_bytes <= 102400), -- Max 100KB

    -- Symbol properties
    default_width DECIMAL(10,2) NOT NULL,
    default_height DECIMAL(10,2) NOT NULL,
    tags TEXT[],

    -- Connection points definition
    connection_points JSONB DEFAULT '[]',
    properties_template JSONB DEFAULT '{}',

    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,

    -- Ownership
    is_custom BOOLEAN DEFAULT false,
    organization_id UUID REFERENCES organizations(id),

    -- Audit columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),

    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES users(id),

    -- Constraints
    CONSTRAINT unique_symbol_name UNIQUE(name, organization_id) WHERE deleted_at IS NULL,

    -- Indexes
    INDEX idx_symbols_category ON symbols(category),
    INDEX idx_symbols_standard ON symbols(standard),
    INDEX idx_symbols_tags ON symbols USING gin(tags),
    INDEX idx_symbols_checksum ON symbols(svg_checksum)
);
```

#### boq_items
```sql
CREATE TABLE boq_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boq_id UUID NOT NULL REFERENCES bill_of_quantities(id) ON DELETE CASCADE,

    -- Item identification
    item_number VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    tag VARCHAR(50),

    -- Description
    description TEXT NOT NULL,
    specification VARCHAR(255),

    -- Quantities
    quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(20) NOT NULL,
    spare_quantity DECIMAL(10,2) DEFAULT 0 CHECK (spare_quantity >= 0),
    total_quantity DECIMAL(10,2) GENERATED ALWAYS AS (quantity + spare_quantity) STORED,

    -- Costing
    unit_cost DECIMAL(15,2),
    total_cost DECIMAL(15,2) GENERATED ALWAYS AS ((quantity + spare_quantity) * unit_cost) STORED,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Procurement
    lead_time_days INTEGER,
    supplier VARCHAR(255),
    supplier_part_number VARCHAR(100),

    -- References
    component_ids UUID[],
    drawing_references TEXT[],

    -- Additional data
    properties JSONB DEFAULT '{}',
    notes TEXT,

    -- Audit columns
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),

    -- Indexes
    INDEX idx_boq_items_boq_id ON boq_items(boq_id),
    INDEX idx_boq_items_category ON boq_items(category),
    INDEX idx_boq_items_tag ON boq_items(tag)
);
```

### 2.2 Audit and Version Control Tables

#### audit_log
```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('create', 'update', 'delete', 'restore')),

    -- Change details
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],

    -- Context
    user_id UUID NOT NULL REFERENCES users(id),
    user_ip INET,
    user_agent TEXT,
    session_id UUID,

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_audit_entity ON audit_log(entity_type, entity_id),
    INDEX idx_audit_user ON audit_log(user_id),
    INDEX idx_audit_created ON audit_log(created_at DESC)
);
```

#### drawing_versions
```sql
CREATE TABLE drawing_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drawing_id UUID NOT NULL REFERENCES drawings(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    revision VARCHAR(10) NOT NULL,

    -- Snapshot data
    snapshot_data JSONB NOT NULL, -- Complete drawing state
    snapshot_size_bytes INTEGER NOT NULL,

    -- Version metadata
    change_description TEXT,
    change_type VARCHAR(50) CHECK (change_type IN ('minor', 'major', 'revision')),

    -- Approval workflow
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected')),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_notes TEXT,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),

    -- Constraints
    CONSTRAINT unique_version UNIQUE(drawing_id, version_number),

    -- Indexes
    INDEX idx_versions_drawing ON drawing_versions(drawing_id),
    INDEX idx_versions_created ON drawing_versions(created_at DESC)
);
```

### 2.3 Example Data

#### Projects Table
```sql
INSERT INTO projects (id, name, description, client_name, project_code, status, tags, metadata, created_by, updated_by)
VALUES
    ('550e8400-e29b-41d4-a716-446655440000',
     'Refinery Unit A P&ID',
     'Main distillation unit process and instrumentation diagram',
     'PetroChemical Corp',
     'PC-2025-001',
     'active',
     ARRAY['refinery', 'distillation', 'critical'],
     '{"industry": "oil_gas", "location": "Houston, TX", "estimated_completion": "2025-06-30"}'::jsonb,
     '550e8400-e29b-41d4-a716-446655440001',
     '550e8400-e29b-41d4-a716-446655440001');
```

#### Components Table
```sql
INSERT INTO components (id, drawing_id, type, subtype, tag, name, position_x, position_y, width, height, properties, created_by, updated_by)
VALUES
    ('comp_550e8400',
     'drawing_550e8400',
     'vessel',
     'vertical_drum',
     'V-101',
     'Flash Drum',
     350.5,
     200.75,
     80,
     120,
     '{"design_pressure": {"value": 10.5, "unit": "bar"}, "material": "SS316L"}'::jsonb,
     'user_550e8400',
     'user_550e8400');
```

---

## 3. ReactFlow Data Structure Specifications

### 3.1 Node Data Structure

```typescript
interface PIDNode {
  id: string;                    // UUID v4 format
  type: 'pidComponent';          // Custom node type
  position: {
    x: number;                   // Min: 0, Max: 10000, Precision: 0.01
    y: number;                   // Min: 0, Max: 10000, Precision: 0.01
  };
  data: {
    // Component identification
    componentId: string;         // UUID v4
    tag: string;                 // Pattern: /^[A-Z]{1,3}-[0-9]{3,4}[A-Z]?$/
    name: string;                // Max: 255 chars
    type: ComponentType;         // Enum
    subtype: string;

    // Visual properties
    width: number;               // Min: 10, Max: 500
    height: number;              // Min: 10, Max: 500
    rotation: number;            // 0-359 degrees

    // Symbol reference
    symbolId: string;            // UUID v4
    symbolSvg: string;           // SVG content

    // Styling
    style: {
      fill: string;              // Hex color
      stroke: string;            // Hex color
      strokeWidth: number;       // 1-10
      opacity: number;           // 0-1
      filter?: string;           // CSS filter
    };

    // Ports for connections
    ports: Port[];

    // Component properties
    properties: Record<string, any>;

    // Metadata
    metadata: {
      specification?: string;
      dataSheet?: string;
      manufacturer?: string;
      model?: string;
    };

    // State flags
    isLocked: boolean;
    isSelected: boolean;
    isHovered: boolean;
    isValid: boolean;

    // Validation
    errors: ValidationError[];
    warnings: ValidationWarning[];
  };

  // ReactFlow properties
  draggable: boolean;
  selectable: boolean;
  connectable: boolean;
  deletable: boolean;

  // Custom handlers
  dragHandle?: string;           // CSS selector
  sourcePosition?: Position;
  targetPosition?: Position;

  // Performance optimization
  extent?: CoordinateExtent;
  parentNode?: string;
  zIndex?: number;
}

interface Port {
  id: string;                    // Unique within component
  name: string;
  type: 'source' | 'target' | 'both';
  position: 'top' | 'bottom' | 'left' | 'right';
  offset: {
    x: number;                   // Relative to position
    y: number;
  };
  connectionType: 'process' | 'electrical' | 'pneumatic' | 'signal';
  isConnected: boolean;
  connectedEdges: string[];      // Edge IDs
  maxConnections?: number;       // Default: 1
  validation?: {
    allowedTypes?: string[];     // Component types that can connect
    required?: boolean;
  };
}
```

### 3.2 Edge Data Structure

```typescript
interface PIDEdge {
  id: string;                    // UUID v4
  type: 'pidConnection';         // Custom edge type
  source: string;                // Node ID
  target: string;                // Node ID
  sourceHandle?: string;         // Port ID
  targetHandle?: string;         // Port ID

  data: {
    // Connection properties
    connectionType: 'process' | 'electrical' | 'pneumatic' | 'signal';
    lineSize?: string;           // e.g., "2 inch", "DN50"
    flowDirection?: 'forward' | 'reverse' | 'bidirectional';

    // Visual styling
    style: {
      stroke: string;            // Hex color
      strokeWidth: number;       // 1-10
      strokeDasharray?: string;  // e.g., "5 5" for dashed
      strokeLinecap?: 'butt' | 'round' | 'square';
      strokeLinejoin?: 'miter' | 'round' | 'bevel';
      opacity?: number;          // 0-1
    };

    // Routing
    routingStyle: 'straight' | 'orthogonal' | 'smooth' | 'step';
    routingPoints?: Point[];    // Manual routing points

    // Labels
    label?: string;
    labelStyle?: {
      fill: string;
      fontSize: number;
      fontFamily: string;
    };
    labelBgStyle?: {
      fill: string;
      fillOpacity: number;
    };

    // Arrow markers
    markerStart?: {
      type: MarkerType;
      width?: number;
      height?: number;
      color?: string;
    };
    markerEnd?: {
      type: MarkerType;
      width?: number;
      height?: number;
      color?: string;
    };

    // Metadata
    properties: Record<string, any>;

    // State
    isSelected: boolean;
    isHovered: boolean;
    isValid: boolean;

    // Validation
    errors: ValidationError[];
    warnings: ValidationWarning[];
  };

  // ReactFlow properties
  animated?: boolean;
  hidden?: boolean;
  deletable?: boolean;
  focusable?: boolean;
  interactionWidth?: number;     // Click detection width
  zIndex?: number;
}

interface Point {
  x: number;
  y: number;
}
```

### 3.3 Viewport Specifications

```typescript
interface Viewport {
  x: number;                     // Pan X position
  y: number;                     // Pan Y position
  zoom: number;                  // Min: 0.1, Max: 4, Default: 1
}

interface ViewportSettings {
  minZoom: number;               // Default: 0.1
  maxZoom: number;               // Default: 4
  viewport: Viewport;
  fitView: boolean;
  fitViewPadding: number;        // Default: 0.1
  attributionPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}
```

### 3.4 Custom Node Types

```typescript
// Custom node component registration
const nodeTypes = {
  pidComponent: PIDComponentNode,
  pidInstrument: PIDInstrumentNode,
  pidValve: PIDValveNode,
  pidPump: PIDPumpNode,
  pidVessel: PIDVesselNode,
  pidAnnotation: PIDAnnotationNode,
  pidTextBox: PIDTextBoxNode,
  pidLegend: PIDLegendNode
};

// Custom edge types
const edgeTypes = {
  pidConnection: PIDConnectionEdge,
  pidSignal: PIDSignalEdge,
  pidElectrical: PIDElectricalEdge,
  pidPneumatic: PIDPneumaticEdge
};
```

### 3.5 Grid and Snapping

```typescript
interface GridSettings {
  enabled: boolean;
  size: number;                  // Grid cell size in pixels, Min: 5, Max: 100
  gap: number;                   // Visual grid line spacing
  color: string;                 // Hex color
  opacity: number;               // 0-1
  snapToGrid: boolean;
  snapThreshold: number;         // Pixels, Default: 5
  showDots: boolean;             // Dots vs lines
}
```

---

## 4. WebSocket Event Specifications

### 4.1 Connection Management

```typescript
// WebSocket connection URL
ws://api.ergoplanner.com/ws/drawings/{drawingId}?token={jwt_token}

// Connection events
interface ConnectionEvent {
  type: 'connection';
  event: 'open' | 'close' | 'error' | 'reconnect';
  data: {
    sessionId: string;           // UUID v4
    userId: string;
    drawingId: string;
    timestamp: string;           // ISO 8601
    reconnectAttempt?: number;
  };
}
```

### 4.2 Real-time Drawing Collaboration Events

#### Component Events
```typescript
interface ComponentEvent {
  type: 'component';
  action: 'add' | 'update' | 'delete' | 'move' | 'rotate' | 'resize';
  data: {
    drawingId: string;
    componentId: string;
    component?: PIDNode;         // Full component data for add/update
    changes?: Partial<PIDNode>;  // Only changed fields for update
    delta?: {                    // For move operations
      x: number;
      y: number;
    };
    angle?: number;              // For rotate operations
    dimensions?: {               // For resize operations
      width: number;
      height: number;
    };
    userId: string;
    sessionId: string;
    timestamp: string;
    version: number;             // For conflict resolution
  };
}
```

#### Edge Events
```typescript
interface EdgeEvent {
  type: 'edge';
  action: 'add' | 'update' | 'delete' | 'reroute';
  data: {
    drawingId: string;
    edgeId: string;
    edge?: PIDEdge;              // Full edge data
    changes?: Partial<PIDEdge>;
    routingPoints?: Point[];     // For reroute
    userId: string;
    sessionId: string;
    timestamp: string;
    version: number;
  };
}
```

### 4.3 Cursor Tracking Events

```typescript
interface CursorEvent {
  type: 'cursor';
  action: 'move' | 'enter' | 'leave';
  data: {
    userId: string;
    sessionId: string;
    userName: string;
    userColor: string;           // Hex color for cursor
    position?: {
      x: number;                 // Canvas coordinates
      y: number;
      viewport: Viewport;        // User's current viewport
    };
    timestamp: string;
  };
}
```

### 4.4 Selection Events

```typescript
interface SelectionEvent {
  type: 'selection';
  action: 'select' | 'deselect' | 'multiselect';
  data: {
    userId: string;
    sessionId: string;
    selectedIds: string[];       // Component/Edge IDs
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    timestamp: string;
  };
}
```

### 4.5 Lock/Unlock Events

```typescript
interface LockEvent {
  type: 'lock';
  action: 'acquire' | 'release' | 'force_release';
  data: {
    drawingId: string;
    entityType: 'drawing' | 'component' | 'edge' | 'area';
    entityId: string;
    userId: string;
    sessionId: string;
    userName: string;
    expiresAt: string;           // ISO 8601
    area?: {                     // For area locks
      x: number;
      y: number;
      width: number;
      height: number;
    };
    timestamp: string;
  };
}
```

### 4.6 User Presence Events

```typescript
interface PresenceEvent {
  type: 'presence';
  action: 'join' | 'leave' | 'update';
  data: {
    drawingId: string;
    users: Array<{
      userId: string;
      sessionId: string;
      userName: string;
      userAvatar?: string;
      userColor: string;
      status: 'active' | 'idle' | 'away';
      lastActivity: string;      // ISO 8601
      viewport?: Viewport;
      permissions: {
        canEdit: boolean;
        canComment: boolean;
      };
    }>;
    timestamp: string;
  };
}
```

### 4.7 Drawing State Sync

```typescript
interface SyncEvent {
  type: 'sync';
  action: 'request' | 'response' | 'patch';
  data: {
    drawingId: string;
    version: number;
    checksum?: string;           // SHA-256 of current state
    fullState?: {                // For full sync
      nodes: PIDNode[];
      edges: PIDEdge[];
      viewport: Viewport;
      metadata: Record<string, any>;
    };
    patches?: Array<{            // For incremental sync
      op: 'add' | 'remove' | 'replace' | 'move' | 'copy';
      path: string;              // JSON pointer
      value?: any;
      from?: string;             // For move/copy
    }>;
    userId: string;
    sessionId: string;
    timestamp: string;
  };
}
```

### 4.8 Notification Events

```typescript
interface NotificationEvent {
  type: 'notification';
  severity: 'info' | 'warning' | 'error' | 'success';
  data: {
    id: string;
    title: string;
    message: string;
    details?: Record<string, any>;
    actions?: Array<{
      label: string;
      action: string;
      payload?: any;
    }>;
    userId?: string;             // Specific user or broadcast
    timestamp: string;
    expiresAt?: string;
  };
}
```

### 4.9 WebSocket Message Format

```typescript
// Client to Server
interface ClientMessage {
  id: string;                   // Message ID for correlation
  type: string;                  // Event type
  action: string;                // Event action
  data: any;                     // Event-specific data
  timestamp: string;             // Client timestamp
}

// Server to Client
interface ServerMessage {
  id: string;                    // Message ID
  correlationId?: string;        // Original message ID if response
  type: string;                  // Event type
  action: string;                // Event action
  data: any;                     // Event-specific data
  timestamp: string;             // Server timestamp
  status?: 'success' | 'error';
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

---

## 5. Message Queue Contracts

### 5.1 Queue Configuration

```yaml
# RabbitMQ Configuration
queues:
  - name: ergoplanner.boq.generation
    durable: true
    exclusive: false
    auto_delete: false
    arguments:
      x-message-ttl: 3600000     # 1 hour
      x-max-length: 10000
      x-max-priority: 10

  - name: ergoplanner.drawing.validation
    durable: true
    exclusive: false
    auto_delete: false
    arguments:
      x-message-ttl: 1800000      # 30 minutes
      x-max-length: 5000

  - name: ergoplanner.export.tasks
    durable: true
    exclusive: false
    auto_delete: false
    arguments:
      x-message-ttl: 7200000      # 2 hours
      x-max-length: 1000

  - name: ergoplanner.ai.processing
    durable: true
    exclusive: false
    auto_delete: false
    arguments:
      x-message-ttl: 3600000      # 1 hour
      x-max-length: 500
      x-max-priority: 10

exchanges:
  - name: ergoplanner.tasks
    type: topic
    durable: true
    auto_delete: false

bindings:
  - exchange: ergoplanner.tasks
    queue: ergoplanner.boq.generation
    routing_key: boq.*

  - exchange: ergoplanner.tasks
    queue: ergoplanner.drawing.validation
    routing_key: validation.*

  - exchange: ergoplanner.tasks
    queue: ergoplanner.export.tasks
    routing_key: export.*

  - exchange: ergoplanner.tasks
    queue: ergoplanner.ai.processing
    routing_key: ai.*
```

### 5.2 BoQ Generation Task

```typescript
interface BoQGenerationMessage {
  messageId: string;             // UUID v4
  correlationId: string;         // Request correlation
  timestamp: string;              // ISO 8601
  priority: number;               // 0-10, higher is more important

  task: {
    type: 'boq_generation';
    version: '1.0.0';

    payload: {
      boqId: string;              // UUID v4
      projectId: string;
      drawingIds: string[];       // Array of drawing IDs
      userId: string;
      organizationId: string;

      options: {
        includeSpares: boolean;
        sparePercentage: number;  // 0-50
        grouping: 'category' | 'drawing' | 'tag_prefix';
        format: 'standard' | 'detailed' | 'summary';
        includeCosts: boolean;
        currency?: string;        // ISO 4217
        priceListId?: string;     // Reference to price list
      };

      filters?: {
        componentTypes?: string[];
        tags?: string[];
        excludeTags?: string[];
        minQuantity?: number;
      };
    };

    metadata: {
      retryCount: number;
      maxRetries: number;         // Default: 3
      timeout: number;            // Milliseconds
      callbackUrl?: string;       // Webhook URL
    };
  };
}

interface BoQGenerationResult {
  messageId: string;
  correlationId: string;
  timestamp: string;

  result: {
    status: 'success' | 'failure' | 'partial';
    boqId: string;

    data?: {
      itemCount: number;
      totalCost?: number;
      currency?: string;
      generationTime: number;     // Milliseconds
      warnings?: string[];
    };

    error?: {
      code: string;
      message: string;
      details?: any;
    };
  };
}
```

### 5.3 Drawing Validation Task

```typescript
interface DrawingValidationMessage {
  messageId: string;
  correlationId: string;
  timestamp: string;
  priority: number;

  task: {
    type: 'drawing_validation';
    version: '1.0.0';

    payload: {
      drawingId: string;
      projectId: string;
      userId: string;

      validationTypes: Array<
        'connectivity' |
        'standards_compliance' |
        'completeness' |
        'consistency' |
        'safety'
      >;

      standards?: Array<'ISA' | 'ISO' | 'API' | 'ASME'>;

      rules?: {
        customRules?: Array<{
          id: string;
          name: string;
          expression: string;      // Rule expression
          severity: 'error' | 'warning' | 'info';
        }>;
        ignoreWarnings?: boolean;
      };

      scope?: {
        components?: string[];     // Specific component IDs
        areas?: Array<{
          x: number;
          y: number;
          width: number;
          height: number;
        }>;
      };
    };

    metadata: {
      async: boolean;
      priority: 'low' | 'normal' | 'high';
      notifyOnComplete: boolean;
    };
  };
}

interface DrawingValidationResult {
  messageId: string;
  correlationId: string;
  timestamp: string;

  result: {
    status: 'valid' | 'invalid' | 'warnings';
    drawingId: string;

    validation: {
      score: number;              // 0-100
      passedRules: number;
      failedRules: number;
      totalRules: number;

      errors: Array<{
        id: string;
        type: string;
        severity: 'error';
        rule: string;
        message: string;
        location?: {
          componentId?: string;
          edgeId?: string;
          coordinates?: Point;
        };
        suggestion?: string;
      }>;

      warnings: Array<{
        id: string;
        type: string;
        severity: 'warning';
        rule: string;
        message: string;
        location?: any;
        suggestion?: string;
      }>;

      info: Array<{
        id: string;
        type: string;
        severity: 'info';
        message: string;
      }>;
    };

    processingTime: number;       // Milliseconds
  };
}
```

### 5.4 Export Operations Task

```typescript
interface ExportTaskMessage {
  messageId: string;
  correlationId: string;
  timestamp: string;
  priority: number;

  task: {
    type: 'export_drawing' | 'export_project' | 'export_boq';
    version: '1.0.0';

    payload: {
      exportId: string;
      entityId: string;           // Drawing/Project/BoQ ID
      entityType: 'drawing' | 'project' | 'boq';
      userId: string;

      format: {
        type: 'pdf' | 'dwg' | 'dxf' | 'svg' | 'png' | 'xlsx' | 'csv';
        version?: string;         // Format version
      };

      options: {
        // PDF options
        paperSize?: 'A0' | 'A1' | 'A2' | 'A3' | 'A4';
        orientation?: 'portrait' | 'landscape' | 'auto';
        scale?: string;           // '1:100', 'fit'
        margins?: {
          top: number;
          bottom: number;
          left: number;
          right: number;
        };

        // Raster options
        dpi?: number;             // 72-600
        quality?: 'low' | 'medium' | 'high' | 'maximum';
        compression?: boolean;

        // Content options
        layers?: 'all' | 'visible' | string[];
        includeGrid?: boolean;
        includeAnnotations?: boolean;
        includeMetadata?: boolean;
        colorMode?: 'color' | 'grayscale' | 'black_white';

        // CAD options
        preserveLayers?: boolean;
        explodeBlocks?: boolean;
        convertText?: boolean;
      };

      delivery: {
        method: 'download' | 'email' | 's3' | 'webhook';
        destination?: string;     // Email, S3 path, or webhook URL
        expiryHours?: number;     // For download links
      };
    };

    metadata: {
      estimatedSize?: number;     // Bytes
      priority: 'low' | 'normal' | 'high' | 'urgent';
      maxProcessingTime?: number; // Milliseconds
    };
  };
}

interface ExportTaskResult {
  messageId: string;
  correlationId: string;
  timestamp: string;

  result: {
    status: 'completed' | 'failed' | 'timeout';
    exportId: string;

    file?: {
      url: string;
      size: number;               // Bytes
      checksum: string;           // SHA-256
      mimeType: string;
      expiresAt: string;          // ISO 8601
    };

    error?: {
      code: string;
      message: string;
      details?: any;
    };

    metrics: {
      processingTime: number;     // Milliseconds
      queueTime: number;
      renderTime: number;
      uploadTime?: number;
    };
  };
}
```

### 5.5 AI Processing Task

```typescript
interface AIProcessingMessage {
  messageId: string;
  correlationId: string;
  timestamp: string;
  priority: number;

  task: {
    type: 'ai_analysis' | 'ai_generation' | 'ai_optimization';
    version: '1.0.0';

    payload: {
      taskId: string;
      entityId: string;
      entityType: 'drawing' | 'project' | 'component';
      userId: string;

      operation: {
        type:
          'compliance_check' |
          'safety_analysis' |
          'optimization' |
          'anomaly_detection' |
          'auto_complete' |
          'component_suggestion';

        parameters?: {
          standards?: string[];
          confidenceThreshold?: number; // 0-1
          maxSuggestions?: number;
          optimizationGoals?: string[];
        };

        context?: {
          industry?: string;
          regulations?: string[];
          previousResults?: string[]; // Previous analysis IDs
        };
      };

      input: {
        format: 'drawing' | 'image' | 'data';
        data?: any;               // Structured data
        imageUrl?: string;        // For image processing
        drawingId?: string;       // For drawing analysis
      };

      output: {
        format: 'json' | 'report' | 'suggestions';
        includeVisualizations?: boolean;
        includeExplanations?: boolean;
        language?: string;        // ISO 639-1
      };
    };

    metadata: {
      model?: string;             // AI model to use
      timeout?: number;           // Milliseconds
      costLimit?: number;         // Max cost in credits
      cacheResults?: boolean;
    };
  };
}

interface AIProcessingResult {
  messageId: string;
  correlationId: string;
  timestamp: string;

  result: {
    status: 'success' | 'failed' | 'partial';
    taskId: string;

    analysis?: {
      type: string;
      confidence: number;         // 0-1

      findings: Array<{
        id: string;
        category: string;
        severity: 'critical' | 'high' | 'medium' | 'low';
        confidence: number;
        title: string;
        description: string;
        location?: any;
        evidence?: any[];
        recommendations?: string[];
      }>;

      suggestions?: Array<{
        id: string;
        type: string;
        confidence: number;
        description: string;
        implementation?: any;     // Actionable data
        impact?: string;
        effort?: 'low' | 'medium' | 'high';
      }>;

      metrics?: {
        score?: number;
        improvements?: number;
        risks?: number;
        opportunities?: number;
      };
    };

    usage: {
      creditsUsed: number;
      processingTime: number;
      modelVersion: string;
    };

    error?: {
      code: string;
      message: string;
      details?: any;
    };
  };
}
```

---

## 6. Redis Cache Specifications

### 6.1 Cache Key Patterns

```typescript
// Key naming convention: {prefix}:{type}:{identifier}:{field?}

const CacheKeyPatterns = {
  // Session data
  SESSION: 'session:user:{userId}:{sessionId}',
  SESSION_TTL: 3600,              // 1 hour

  // User data
  USER: 'user:data:{userId}',
  USER_PERMISSIONS: 'user:permissions:{userId}',
  USER_TTL: 1800,                 // 30 minutes

  // Project cache
  PROJECT: 'project:{projectId}',
  PROJECT_LIST: 'projects:user:{userId}:list',
  PROJECT_STATS: 'project:{projectId}:stats',
  PROJECT_TTL: 600,               // 10 minutes

  // Drawing cache
  DRAWING: 'drawing:{drawingId}',
  DRAWING_COMPONENTS: 'drawing:{drawingId}:components',
  DRAWING_EDGES: 'drawing:{drawingId}:edges',
  DRAWING_LOCK: 'drawing:{drawingId}:lock',
  DRAWING_VERSION: 'drawing:{drawingId}:version',
  DRAWING_TTL: 300,               // 5 minutes

  // Component cache
  COMPONENT: 'component:{componentId}',
  COMPONENT_TTL: 300,              // 5 minutes

  // Symbol library
  SYMBOL: 'symbol:{symbolId}',
  SYMBOL_LIBRARY: 'symbols:library:{category}',
  SYMBOL_TTL: 86400,              // 24 hours

  // BoQ cache
  BOQ: 'boq:{boqId}',
  BOQ_ITEMS: 'boq:{boqId}:items',
  BOQ_TTL: 1800,                  // 30 minutes

  // WebSocket connections
  WS_CONNECTION: 'ws:connection:{sessionId}',
  WS_DRAWING_USERS: 'ws:drawing:{drawingId}:users',
  WS_USER_DRAWINGS: 'ws:user:{userId}:drawings',
  WS_TTL: 300,                    // 5 minutes

  // Cursor positions
  CURSOR: 'cursor:{drawingId}:{userId}',
  CURSOR_TTL: 10,                 // 10 seconds

  // Lock management
  LOCK: 'lock:{entityType}:{entityId}',
  LOCK_TTL: 300,                  // 5 minutes

  // Rate limiting
  RATE_LIMIT: 'ratelimit:{userId}:{endpoint}',
  RATE_LIMIT_TTL: 60,             // 1 minute

  // Temporary data
  TEMP_EXPORT: 'temp:export:{exportId}',
  TEMP_UPLOAD: 'temp:upload:{uploadId}',
  TEMP_TTL: 3600,                 // 1 hour

  // Search cache
  SEARCH: 'search:{hash}',
  SEARCH_TTL: 600,                // 10 minutes

  // AI results cache
  AI_ANALYSIS: 'ai:analysis:{taskId}',
  AI_SUGGESTION: 'ai:suggestion:{contextHash}',
  AI_TTL: 3600,                   // 1 hour

  // Validation cache
  VALIDATION: 'validation:{drawingId}:{version}',
  VALIDATION_TTL: 1800,           // 30 minutes
};
```

### 6.2 Cache Data Structures

```typescript
// Session data structure
interface SessionCache {
  userId: string;
  sessionId: string;
  userName: string;
  organizationId: string;
  permissions: string[];
  activeDrawings: string[];
  lastActivity: string;
  metadata: Record<string, any>;
}

// Drawing cache structure
interface DrawingCache {
  id: string;
  version: number;
  lastModified: string;
  checksum: string;
  components: {
    count: number;
    ids: string[];
  };
  edges: {
    count: number;
    ids: string[];
  };
  locks: Array<{
    entityId: string;
    userId: string;
    expiresAt: string;
  }>;
  activeUsers: Array<{
    userId: string;
    sessionId: string;
    cursor?: Point;
  }>;
}

// Rate limiting structure
interface RateLimitCache {
  count: number;
  firstRequest: string;
  lastRequest: string;
  remaining: number;
  resetAt: string;
}
```

### 6.3 Cache Operations

```typescript
// SET operations with TTL
SET session:user:123:abc123 "{...data...}" EX 3600 NX

// GET operations
GET drawing:drawing_550e8400

// Hash operations for partial updates
HSET project:550e8400 name "Updated Project Name"
HGET project:550e8400 statistics
HMGET project:550e8400 name status updated_at

// List operations for collections
LPUSH projects:user:123:recent "project_id_1"
LRANGE projects:user:123:recent 0 9
LTRIM projects:user:123:recent 0 99

// Set operations for unique collections
SADD drawing:123:active_users "user_456"
SREM drawing:123:active_users "user_456"
SMEMBERS drawing:123:active_users
SCARD drawing:123:active_users

// Sorted set for rankings/scores
ZADD symbols:popular 100 "symbol_123"
ZREVRANGE symbols:popular 0 9 WITHSCORES
ZINCRBY symbols:popular 1 "symbol_123"

// Atomic increment for counters
INCR ratelimit:user123:api_endpoint
EXPIRE ratelimit:user123:api_endpoint 60

// Pub/Sub for real-time updates
PUBLISH drawing:123:updates "{\"type\":\"component_added\",...}"
SUBSCRIBE drawing:123:updates

// Pipeline for batch operations
MULTI
SET key1 value1
SET key2 value2
EXPIRE key1 300
EXPIRE key2 300
EXEC

// Lua script for atomic operations
EVAL "
  local current = redis.call('GET', KEYS[1])
  if current == ARGV[1] then
    redis.call('SET', KEYS[1], ARGV[2])
    redis.call('EXPIRE', KEYS[1], ARGV[3])
    return 1
  else
    return 0
  end
" 1 drawing:123:version "old_version" "new_version" 300
```

### 6.4 Invalidation Strategies

```typescript
class CacheInvalidation {
  // Invalidation patterns
  static patterns = {
    // Invalidate on update
    onDrawingUpdate: (drawingId: string) => [
      `drawing:${drawingId}`,
      `drawing:${drawingId}:components`,
      `drawing:${drawingId}:edges`,
      `validation:${drawingId}:*`
    ],

    // Invalidate on project change
    onProjectUpdate: (projectId: string, userId: string) => [
      `project:${projectId}`,
      `project:${projectId}:stats`,
      `projects:user:${userId}:list`
    ],

    // Cascading invalidation
    onComponentDelete: (componentId: string, drawingId: string) => [
      `component:${componentId}`,
      `drawing:${drawingId}:components`,
      `drawing:${drawingId}`,
      `validation:${drawingId}:*`
    ]
  };

  // Invalidation methods
  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  async invalidateWithDependencies(
    key: string,
    dependencies: string[]
  ): Promise<void> {
    const pipeline = redis.pipeline();
    pipeline.del(key);
    dependencies.forEach(dep => pipeline.del(dep));
    await pipeline.exec();
  }

  // Smart invalidation with tags
  async taggedInvalidation(tags: string[]): Promise<void> {
    const pipeline = redis.pipeline();
    for (const tag of tags) {
      const keys = await redis.smembers(`tag:${tag}`);
      keys.forEach(key => pipeline.del(key));
      pipeline.del(`tag:${tag}`);
    }
    await pipeline.exec();
  }
}
```

### 6.5 Memory Management

```typescript
// Redis configuration
const RedisConfig = {
  // Memory limits
  maxmemory: '2gb',
  maxmemory_policy: 'allkeys-lru',

  // Memory optimization
  settings: {
    // String optimization
    'list-max-ziplist-size': -2,
    'list-compress-depth': 0,

    // Hash optimization
    'hash-max-ziplist-entries': 512,
    'hash-max-ziplist-value': 64,

    // Set optimization
    'set-max-intset-entries': 512,

    // Sorted set optimization
    'zset-max-ziplist-entries': 128,
    'zset-max-ziplist-value': 64,

    // Save configuration
    save: '900 1 300 10 60 10000',

    // AOF configuration
    appendonly: 'yes',
    appendfsync: 'everysec'
  },

  // Key expiration scan
  'hz': 10,

  // Lazy free
  'lazyfree-lazy-eviction': 'yes',
  'lazyfree-lazy-expire': 'yes',
  'lazyfree-lazy-server-del': 'yes',
  'replica-lazy-flush': 'yes'
};

// Memory monitoring
interface MemoryStats {
  used_memory: number;
  used_memory_human: string;
  used_memory_rss: number;
  used_memory_peak: number;
  used_memory_overhead: number;
  mem_fragmentation_ratio: number;
  mem_allocator: string;
  keys_count: number;
  expires_count: number;
}

// Memory optimization strategies
class MemoryOptimization {
  // Compress large values
  async compressValue(value: any): Promise<string> {
    const json = JSON.stringify(value);
    if (json.length > 1024) {
      return await gzip(json);
    }
    return json;
  }

  // Batch expiration
  async batchExpire(pattern: string, ttl: number): Promise<void> {
    const cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );

      if (keys.length > 0) {
        const pipeline = redis.pipeline();
        keys.forEach(key => pipeline.expire(key, ttl));
        await pipeline.exec();
      }

      cursor = nextCursor;
    } while (cursor !== '0');
  }

  // Memory report
  async generateMemoryReport(): Promise<MemoryReport> {
    const info = await redis.info('memory');
    const keyspace = await redis.info('keyspace');
    const bigkeys = await redis.eval(
      "return redis.call('MEMORY', 'USAGE', unpack(redis.call('KEYS', '*')))",
      0
    );

    return {
      stats: parseMemoryInfo(info),
      keyspace: parseKeyspaceInfo(keyspace),
      largestKeys: bigkeys.slice(0, 100)
    };
  }
}
```

---

## Document Metadata

**Version:** 1.0.0
**Last Updated:** 2025-01-19
**Status:** Complete
**Review Cycle:** Quarterly

**Change Log:**
- v1.0.0 (2025-01-19): Initial comprehensive technical specifications

**Document Owner:** Engineering Team
**Classification:** Technical Reference
**Distribution:** Internal Development Team

---

**END OF DOCUMENT**