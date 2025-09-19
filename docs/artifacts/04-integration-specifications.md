# Ergoplanner AI Suite - Integration Specifications

**Document Version:** 1.0.0
**Last Updated:** 2025-09-19
**Classification:** Technical Specification
**Audience:** Development Team, System Integrators, Solution Architects

## Table of Contents

1. [AutoCAD DWG/DXF Import/Export Specifications](#1-autocad-dwgdxf-importexport-specifications)
2. [ISA-5.1 and ISO 14617 Symbol Standards Integration](#2-isa-51-and-iso-14617-symbol-standards-integration)
3. [Microsoft Teams Integration](#3-microsoft-teams-integration)
4. [SharePoint Integration](#4-sharepoint-integration)
5. [ERP System Integration](#5-erp-system-integration)
6. [Authentication Provider Specifications](#6-authentication-provider-specifications)
7. [File Format Specifications](#7-file-format-specifications)
8. [External Service Integration](#8-external-service-integration)

---

## 1. AutoCAD DWG/DXF Import/Export Specifications

### 1.1 DWG Version Support

| Version | Format Code | Binary Version | Features Supported |
|---------|------------|----------------|-------------------|
| AutoCAD 2018 | AC1032 | DWG 2018 | Full entity support, extended data |
| AutoCAD 2021 | AC1034 | DWG 2021 | Enhanced 3D support, cloud references |
| AutoCAD 2024 | AC1038 | DWG 2024 | Latest features, ML components |

### 1.2 Layer Mapping Tables

```json
{
  "layerMapping": {
    "importRules": [
      {
        "sourceLayer": "0",
        "targetLayer": "DEFAULT",
        "colorIndex": 7,
        "lineWeight": 0.25
      },
      {
        "sourceLayer": "P&ID-*",
        "targetLayer": "PROCESS",
        "colorIndex": 1,
        "lineWeight": 0.35
      },
      {
        "sourceLayer": "ELECTRICAL-*",
        "targetLayer": "ELECTRICAL",
        "colorIndex": 5,
        "lineWeight": 0.30
      }
    ],
    "exportRules": [
      {
        "sourceLayer": "PROCESS",
        "targetLayer": "P&ID-PROCESS",
        "locked": false,
        "frozen": false,
        "plotable": true
      }
    ]
  }
}
```

### 1.3 Block to Symbol Conversion

```json
{
  "blockConversion": {
    "mappings": [
      {
        "dwgBlock": "VALVE_GATE",
        "ergoSymbol": "valve.gate.manual",
        "attributeMapping": {
          "TAG": "tagNumber",
          "SIZE": "nominalSize",
          "RATING": "pressureRating"
        }
      },
      {
        "dwgBlock": "PUMP_CENTRIFUGAL",
        "ergoSymbol": "pump.centrifugal.horizontal",
        "attributeMapping": {
          "TAG": "tagNumber",
          "FLOW": "flowRate",
          "HEAD": "totalHead"
        }
      }
    ]
  }
}
```

### 1.4 Color Index Mapping

| AutoCAD Color Index | RGB Value | Ergoplanner Color Name |
|---------------------|-----------|------------------------|
| 1 (Red) | #FF0000 | process-red |
| 2 (Yellow) | #FFFF00 | highlight-yellow |
| 3 (Green) | #00FF00 | safety-green |
| 4 (Cyan) | #00FFFF | water-cyan |
| 5 (Blue) | #0000FF | electrical-blue |
| 7 (White/Black) | #FFFFFF/#000000 | default |

### 1.5 Text Style Mapping

```json
{
  "textStyles": {
    "standard": {
      "fontFamily": "Arial",
      "fontSize": 2.5,
      "widthFactor": 1.0,
      "oblique": 0
    },
    "annotative": {
      "fontFamily": "Arial Narrow",
      "fontSize": 3.0,
      "widthFactor": 0.8,
      "oblique": 0
    }
  }
}
```

### 1.6 API Implementation

```typescript
interface DWGImportOptions {
  version: 'AC1032' | 'AC1034' | 'AC1038';
  preserveLayers: boolean;
  convertBlocks: boolean;
  maintainScale: boolean;
  coordSystem: 'WCS' | 'UCS';
}

// Import endpoint
POST /api/v1/cad/import
Headers:
  Content-Type: multipart/form-data
  Authorization: Bearer {token}
Body:
  file: binary
  options: DWGImportOptions

// Export endpoint
POST /api/v1/cad/export
Headers:
  Content-Type: application/json
  Authorization: Bearer {token}
Body:
  {
    "projectId": "string",
    "format": "DWG" | "DXF",
    "version": "AC1032" | "AC1034" | "AC1038",
    "layers": ["array of layer names"],
    "includeXrefs": boolean
  }
```

---

## 2. ISA-5.1 and ISO 14617 Symbol Standards Integration

### 2.1 Symbol Mapping Matrices

#### ISA-5.1 Instrumentation Symbols

```json
{
  "ISA_5_1_Symbols": {
    "instruments": {
      "FT": {
        "description": "Flow Transmitter",
        "symbol": "circle",
        "size": {"width": 40, "height": 40},
        "connectionPoints": [
          {"id": "in", "x": 0, "y": 20},
          {"id": "out", "x": 40, "y": 20}
        ]
      },
      "FIC": {
        "description": "Flow Indicating Controller",
        "symbol": "circle_with_line",
        "size": {"width": 40, "height": 40},
        "connectionPoints": [
          {"id": "process", "x": 20, "y": 40},
          {"id": "signal_in", "x": 0, "y": 20},
          {"id": "signal_out", "x": 40, "y": 20}
        ]
      }
    }
  }
}
```

#### ISO 14617 Process Symbols

```json
{
  "ISO_14617_Symbols": {
    "valves": {
      "2.1.1.1": {
        "description": "Gate Valve",
        "category": "Valves",
        "svgPath": "M10,20 L30,20 M20,10 L20,30 M15,10 L25,10",
        "defaultSize": {"width": 40, "height": 40},
        "rotatable": true,
        "scaleFactor": 1.0
      },
      "2.1.2.1": {
        "description": "Globe Valve",
        "category": "Valves",
        "svgPath": "M10,20 L30,20 M20,10 A10,10 0 0,1 20,30",
        "defaultSize": {"width": 40, "height": 40},
        "rotatable": true,
        "scaleFactor": 1.0
      }
    }
  }
}
```

### 2.2 Tag Format Conversions

```json
{
  "tagFormats": {
    "ISA": {
      "pattern": "^[A-Z]{1,4}-[0-9]{3,4}[A-Z]?$",
      "example": "FIC-1001A",
      "components": {
        "variable": "[A-Z]{1,2}",
        "function": "[A-Z]{1,2}",
        "loop": "[0-9]{3,4}",
        "suffix": "[A-Z]?"
      }
    },
    "IEC": {
      "pattern": "^[=+-][A-Z0-9]+\\.[A-Z0-9]+$",
      "example": "=P101.FT001",
      "components": {
        "prefix": "[=+-]",
        "unit": "[A-Z0-9]+",
        "tag": "[A-Z0-9]+"
      }
    }
  }
}
```

### 2.3 Symbol Rotation Rules

```typescript
interface RotationRules {
  snapAngles: number[]; // [0, 45, 90, 135, 180, 225, 270, 315]
  preserveText: boolean;
  rotateConnections: boolean;
  mirrorAllowed: boolean;
}

const symbolRotation = {
  valves: {
    snapAngles: [0, 90, 180, 270],
    preserveText: true,
    rotateConnections: true,
    mirrorAllowed: false
  },
  instruments: {
    snapAngles: [0],
    preserveText: true,
    rotateConnections: false,
    mirrorAllowed: false
  }
};
```

---

## 3. Microsoft Teams Integration

### 3.1 Graph API Endpoints

```typescript
// Base URL
const GRAPH_API_BASE = "https://graph.microsoft.com/v1.0";

// Authentication endpoint
const AUTH_ENDPOINT = "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token";

// Teams specific endpoints
const TEAMS_ENDPOINTS = {
  listTeams: "/me/joinedTeams",
  getTeam: "/teams/{teamId}",
  listChannels: "/teams/{teamId}/channels",
  postMessage: "/teams/{teamId}/channels/{channelId}/messages",
  uploadFile: "/teams/{teamId}/channels/{channelId}/filesFolder",
  createMeeting: "/me/onlineMeetings"
};
```

### 3.2 Authentication Flow (OAuth 2.0)

```typescript
interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  redirectUri: string;
  scope: string[];
}

const teamsOAuthConfig: OAuth2Config = {
  clientId: "{your-app-client-id}",
  clientSecret: "{your-app-client-secret}",
  tenantId: "{your-tenant-id}",
  redirectUri: "https://ergoplanner.com/auth/callback",
  scope: [
    "User.Read",
    "Team.ReadBasic.All",
    "Channel.ReadWrite.All",
    "Files.ReadWrite.All",
    "OnlineMeetings.ReadWrite"
  ]
};

// Authorization request
GET https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize
  ?client_id={client_id}
  &response_type=code
  &redirect_uri={redirect_uri}
  &scope={scope}
  &state={state}

// Token exchange
POST https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token
Headers:
  Content-Type: application/x-www-form-urlencoded
Body:
  client_id={client_id}
  &client_secret={client_secret}
  &code={authorization_code}
  &grant_type=authorization_code
  &redirect_uri={redirect_uri}
```

### 3.3 Channel Posting Format

```typescript
// Post message to channel
POST https://graph.microsoft.com/v1.0/teams/{teamId}/channels/{channelId}/messages
Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/json
Body:
{
  "body": {
    "contentType": "html",
    "content": "<div>Project Update: <b>P&ID Review Complete</b></div>
                <attachment id=\"74d20c7f34a44a78b7d3f9c5d65e7f8a\"></attachment>"
  },
  "attachments": [
    {
      "id": "74d20c7f34a44a78b7d3f9c5d65e7f8a",
      "contentType": "application/vnd.microsoft.card.adaptive",
      "contentUrl": null,
      "content": {
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "type": "AdaptiveCard",
        "version": "1.2",
        "body": [
          {
            "type": "TextBlock",
            "text": "P&ID Drawing Updated",
            "weight": "bolder",
            "size": "medium"
          },
          {
            "type": "FactSet",
            "facts": [
              {"title": "Project:", "value": "Refinery Unit A"},
              {"title": "Drawing:", "value": "PID-001-R3"},
              {"title": "Updated by:", "value": "John Smith"},
              {"title": "Status:", "value": "Ready for Review"}
            ]
          }
        ],
        "actions": [
          {
            "type": "Action.OpenUrl",
            "title": "View in Ergoplanner",
            "url": "https://ergoplanner.com/project/123/drawing/PID-001"
          }
        ]
      }
    }
  ]
}
```

### 3.4 Notification Webhooks

```typescript
// Webhook subscription
POST https://graph.microsoft.com/v1.0/subscriptions
Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/json
Body:
{
  "changeType": "created,updated",
  "notificationUrl": "https://ergoplanner.com/webhooks/teams",
  "resource": "/teams/{teamId}/channels/{channelId}/messages",
  "expirationDateTime": "2025-12-31T23:59:59Z",
  "clientState": "secretClientValue"
}

// Webhook payload reception
POST https://ergoplanner.com/webhooks/teams
Headers:
  Content-Type: application/json
Body:
{
  "value": [
    {
      "subscriptionId": "7f105c7d-2dc5-4530-97cd-4e7ae6534c07",
      "clientState": "secretClientValue",
      "changeType": "created",
      "resource": "teams/{teamId}/channels/{channelId}/messages/{messageId}",
      "tenantId": "84bd8158-6d4d-4958-8b9f-9d6445542f95"
    }
  ]
}
```

---

## 4. SharePoint Integration

### 4.1 Document Library APIs

```typescript
// SharePoint REST API endpoints
const SHAREPOINT_API = {
  site: "https://{tenant}.sharepoint.com/sites/{site}/_api",
  lists: "/web/lists",
  library: "/web/lists/getbytitle('{library}')",
  items: "/web/lists/getbytitle('{library}')/items",
  upload: "/web/GetFolderByServerRelativeUrl('{folder}')/Files/add(url='{filename}',overwrite=true)"
};

// Get document library
GET https://{tenant}.sharepoint.com/sites/{site}/_api/web/lists/getbytitle('Documents')
Headers:
  Authorization: Bearer {access_token}
  Accept: application/json;odata=verbose

// Upload document
POST https://{tenant}.sharepoint.com/sites/{site}/_api/web/GetFolderByServerRelativeUrl('/sites/{site}/Shared Documents')/Files/add(url='drawing.pdf',overwrite=true)
Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/octet-stream
  X-RequestDigest: {form_digest_value}
Body: [binary file data]
```

### 4.2 Version Sync Protocols

```typescript
interface VersionSyncConfig {
  enableMajorVersions: boolean;
  enableMinorVersions: boolean;
  majorVersionLimit: number;
  minorVersionLimit: number;
  requireCheckout: boolean;
}

// Check out file
POST https://{tenant}.sharepoint.com/sites/{site}/_api/web/GetFileByServerRelativeUrl('{fileUrl}')/CheckOut()
Headers:
  Authorization: Bearer {access_token}
  X-RequestDigest: {form_digest_value}

// Check in file
POST https://{tenant}.sharepoint.com/sites/{site}/_api/web/GetFileByServerRelativeUrl('{fileUrl}')/CheckIn(comment='{comment}',checkintype={type})
Headers:
  Authorization: Bearer {access_token}
  X-RequestDigest: {form_digest_value}

// checkintype: 0 = Minor, 1 = Major, 2 = Overwrite
```

### 4.3 Metadata Mapping

```json
{
  "metadataMapping": {
    "ergoplanner": {
      "projectId": "ProjectID",
      "drawingNumber": "DrawingNo",
      "revision": "RevisionNo",
      "discipline": "Discipline",
      "status": "ApprovalStatus",
      "createdBy": "Author",
      "modifiedBy": "Editor",
      "tags": "Keywords"
    },
    "sharepoint": {
      "Title": "{drawingNumber} - Rev {revision}",
      "ProjectID": "{projectId}",
      "DrawingNo": "{drawingNumber}",
      "RevisionNo": "{revision}",
      "Discipline": {
        "type": "Choice",
        "values": ["Process", "Electrical", "Instrumentation", "Mechanical"]
      },
      "ApprovalStatus": {
        "type": "Choice",
        "values": ["Draft", "For Review", "Approved", "As-Built"]
      }
    }
  }
}
```

### 4.4 Permission Inheritance

```typescript
// Break permission inheritance
POST https://{tenant}.sharepoint.com/sites/{site}/_api/web/lists/getbytitle('{library}')/items({itemId})/breakroleinheritance(copyRoleAssignments=false,clearSubscopes=true)

// Grant permissions
POST https://{tenant}.sharepoint.com/sites/{site}/_api/web/lists/getbytitle('{library}')/items({itemId})/roleassignments/addroleassignment(principalid={userId},roledefid={roleId})

// Role definitions
const ROLE_DEFINITIONS = {
  fullControl: 1073741829,
  design: 1073741828,
  edit: 1073741830,
  contribute: 1073741827,
  read: 1073741826,
  viewOnly: 1073741924
};
```

---

## 5. ERP System Integration

### 5.1 SAP Integration

#### REST API Endpoints

```typescript
// SAP OData Service endpoints
const SAP_ENDPOINTS = {
  base: "https://{sap-server}/sap/opu/odata/sap",
  materials: "/MM_MATERIAL_SRV/MaterialSet",
  equipment: "/PM_EQUIPMENT_SRV/EquipmentSet",
  workOrders: "/PM_WORKORDER_SRV/WorkOrderSet",
  projects: "/PS_PROJECT_SRV/ProjectSet",
  documents: "/DMS_DOCUMENT_SRV/DocumentSet"
};

// Get material master data
GET https://{sap-server}/sap/opu/odata/sap/MM_MATERIAL_SRV/MaterialSet('VALVE-001')
Headers:
  Authorization: Basic {base64(username:password)}
  Accept: application/json
  X-CSRF-Token: Fetch

Response:
{
  "d": {
    "Material": "VALVE-001",
    "MaterialDescription": "Gate Valve DN100 PN16",
    "MaterialType": "ERSA",
    "MaterialGroup": "VALVES",
    "BaseUnitOfMeasure": "PC",
    "Weight": 25.5,
    "WeightUnit": "KG"
  }
}
```

#### Data Field Mappings

```json
{
  "sapToErgoplanner": {
    "material": {
      "Material": "materialCode",
      "MaterialDescription": "description",
      "MaterialType": "type",
      "MaterialGroup": "category",
      "BaseUnitOfMeasure": "unitOfMeasure",
      "Weight": "weight",
      "WeightUnit": "weightUnit",
      "Manufacturer": "manufacturer",
      "ManufacturerPartNumber": "manufacturerPartNumber"
    },
    "equipment": {
      "Equipment": "equipmentTag",
      "EquipmentDescription": "description",
      "FunctionalLocation": "location",
      "EquipmentCategory": "category",
      "TechnicalObjectType": "type",
      "ManufacturerSerialNumber": "serialNumber",
      "ConstructionYear": "yearBuilt"
    }
  }
}
```

### 5.2 Oracle EBS Integration

#### REST API Endpoints

```typescript
// Oracle REST Data Services
const ORACLE_ENDPOINTS = {
  base: "https://{oracle-server}/ords/ebs",
  items: "/inv/items",
  bomStructure: "/bom/structures",
  purchaseOrders: "/po/orders",
  projects: "/pa/projects",
  assets: "/fa/assets"
};

// Create item in Oracle
POST https://{oracle-server}/ords/ebs/inv/items
Headers:
  Authorization: Bearer {oauth_token}
  Content-Type: application/json
Body:
{
  "organizationId": 101,
  "itemNumber": "PUMP-CF-001",
  "description": "Centrifugal Pump 100m3/h",
  "itemType": "FG",
  "uomCode": "EA",
  "listPrice": 5000.00,
  "attributes": {
    "flowRate": "100",
    "head": "50",
    "power": "30"
  }
}
```

### 5.3 Error Handling

```typescript
interface ERPErrorResponse {
  error: {
    code: string;
    message: string;
    details: Array<{
      field: string;
      message: string;
    }>;
  };
  timestamp: string;
  path: string;
}

// Standard error codes
const ERP_ERROR_CODES = {
  "ERP_001": "Connection timeout",
  "ERP_002": "Authentication failed",
  "ERP_003": "Invalid data format",
  "ERP_004": "Duplicate entry",
  "ERP_005": "Resource not found",
  "ERP_006": "Insufficient permissions",
  "ERP_007": "Rate limit exceeded",
  "ERP_008": "Service unavailable"
};

// Retry policy
const retryPolicy = {
  maxRetries: 3,
  retryDelay: 1000, // ms
  retryMultiplier: 2,
  retryableErrors: ["ERP_001", "ERP_007", "ERP_008"]
};
```

### 5.4 Batch Processing

```typescript
// Batch request format
POST https://{sap-server}/sap/opu/odata/sap/$batch
Headers:
  Content-Type: multipart/mixed; boundary=batch_boundary
  Authorization: Basic {credentials}

Body:
--batch_boundary
Content-Type: application/http
Content-Transfer-Encoding: binary

GET MM_MATERIAL_SRV/MaterialSet('VALVE-001') HTTP/1.1

--batch_boundary
Content-Type: application/http
Content-Transfer-Encoding: binary

GET MM_MATERIAL_SRV/MaterialSet('PUMP-001') HTTP/1.1

--batch_boundary--

// Batch configuration
const batchConfig = {
  maxBatchSize: 100,
  parallelRequests: 5,
  timeout: 30000,
  retryFailedItems: true
};
```

---

## 6. Authentication Provider Specifications

### 6.1 JWT Token Structure

```typescript
interface JWTPayload {
  // Header
  alg: "RS256" | "HS256";
  typ: "JWT";
  kid: string; // Key ID for key rotation

  // Payload
  sub: string; // Subject (user ID)
  iss: string; // Issuer
  aud: string[]; // Audience
  exp: number; // Expiration time
  nbf: number; // Not before
  iat: number; // Issued at
  jti: string; // JWT ID (unique identifier)

  // Custom claims
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
  tenantId: string;
  sessionId: string;
}

// Token generation
const generateToken = (user: User): string => {
  const payload: JWTPayload = {
    sub: user.id,
    iss: "https://auth.ergoplanner.com",
    aud: ["api.ergoplanner.com"],
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
    nbf: Math.floor(Date.now() / 1000),
    iat: Math.floor(Date.now() / 1000),
    jti: generateUUID(),
    email: user.email,
    name: user.name,
    roles: user.roles,
    permissions: user.permissions,
    tenantId: user.tenantId,
    sessionId: generateSessionId()
  };

  return jwt.sign(payload, privateKey, { algorithm: 'RS256' });
};
```

### 6.2 OAuth 2.0 Flows

```typescript
// Authorization Code Flow
interface OAuth2AuthCodeFlow {
  // Step 1: Authorization request
  authorizationUrl: "https://auth.ergoplanner.com/oauth/authorize";
  params: {
    response_type: "code";
    client_id: string;
    redirect_uri: string;
    scope: string;
    state: string;
    code_challenge?: string; // PKCE
    code_challenge_method?: "S256";
  };

  // Step 2: Token exchange
  tokenUrl: "https://auth.ergoplanner.com/oauth/token";
  tokenRequest: {
    grant_type: "authorization_code";
    code: string;
    client_id: string;
    client_secret?: string;
    redirect_uri: string;
    code_verifier?: string; // PKCE
  };
}

// Client Credentials Flow
POST https://auth.ergoplanner.com/oauth/token
Headers:
  Content-Type: application/x-www-form-urlencoded
  Authorization: Basic {base64(client_id:client_secret)}
Body:
  grant_type=client_credentials
  &scope=api.read api.write

// Refresh Token Flow
POST https://auth.ergoplanner.com/oauth/token
Headers:
  Content-Type: application/x-www-form-urlencoded
Body:
  grant_type=refresh_token
  &refresh_token={refresh_token}
  &client_id={client_id}
  &client_secret={client_secret}
```

### 6.3 SAML 2.0 Configuration

```xml
<!-- Service Provider Metadata -->
<EntityDescriptor entityID="https://ergoplanner.com">
  <SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <KeyDescriptor use="signing">
      <KeyInfo>
        <X509Data>
          <X509Certificate>MIIDEzCCAfugAwIBAgIJAKoK...</X509Certificate>
        </X509Data>
      </KeyInfo>
    </KeyDescriptor>
    <SingleLogoutService
      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
      Location="https://auth.ergoplanner.com/saml/logout"/>
    <AssertionConsumerService
      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
      Location="https://auth.ergoplanner.com/saml/acs"
      index="0"
      isDefault="true"/>
  </SPSSODescriptor>
</EntityDescriptor>

<!-- SAML Assertion Structure -->
<saml:Assertion ID="_8e8dc5f69a98cc4c1ff3427e5ce34606fd672f91e6"
                Version="2.0"
                IssueInstant="2025-01-19T03:19:00Z">
  <saml:Subject>
    <saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">
      user@company.com
    </saml:NameID>
  </saml:Subject>
  <saml:AttributeStatement>
    <saml:Attribute Name="email">
      <saml:AttributeValue>user@company.com</saml:AttributeValue>
    </saml:Attribute>
    <saml:Attribute Name="groups">
      <saml:AttributeValue>Engineers</saml:AttributeValue>
      <saml:AttributeValue>ProjectManagers</saml:AttributeValue>
    </saml:Attribute>
  </saml:AttributeStatement>
</saml:Assertion>
```

### 6.4 Active Directory Integration

```typescript
// LDAP Configuration
const ldapConfig = {
  url: "ldap://dc.company.com:389",
  bindDN: "CN=Service Account,OU=Service Accounts,DC=company,DC=com",
  bindPassword: "{encrypted_password}",
  searchBase: "DC=company,DC=com",
  searchFilter: "(&(objectClass=user)(sAMAccountName={{username}}))",
  attributes: [
    "sAMAccountName",
    "displayName",
    "mail",
    "memberOf",
    "department",
    "title"
  ],
  tlsOptions: {
    rejectUnauthorized: true,
    ca: [fs.readFileSync('ca-cert.pem')]
  }
};

// AD Group mapping
const groupMapping = {
  "CN=Ergoplanner-Admins,OU=Groups,DC=company,DC=com": "admin",
  "CN=Ergoplanner-Engineers,OU=Groups,DC=company,DC=com": "engineer",
  "CN=Ergoplanner-Viewers,OU=Groups,DC=company,DC=com": "viewer"
};
```

### 6.5 Multi-Factor Authentication

```typescript
interface MFAConfiguration {
  methods: {
    totp: {
      enabled: boolean;
      issuer: "Ergoplanner";
      algorithm: "SHA1" | "SHA256" | "SHA512";
      digits: 6 | 8;
      period: 30 | 60;
    };
    sms: {
      enabled: boolean;
      provider: "twilio" | "aws-sns";
      codeLength: 6;
      validity: 300; // seconds
    };
    email: {
      enabled: boolean;
      codeLength: 6;
      validity: 600; // seconds
    };
    webauthn: {
      enabled: boolean;
      rpId: "ergoplanner.com";
      rpName: "Ergoplanner AI Suite";
      attestation: "none" | "indirect" | "direct";
    };
  };
  policy: {
    required: boolean;
    gracePeriod: number; // days
    trustedDevices: boolean;
    rememberDuration: 2592000; // 30 days in seconds
  };
}

// TOTP verification
POST /api/v1/auth/mfa/verify
Headers:
  Content-Type: application/json
  Authorization: Bearer {partial_token}
Body:
{
  "method": "totp",
  "code": "123456",
  "trustDevice": true
}
```

### 6.6 Session Management

```typescript
interface SessionConfig {
  storage: "redis" | "memory" | "database";
  ttl: {
    access: 3600;    // 1 hour
    refresh: 604800; // 7 days
    idle: 1800;      // 30 minutes
  };
  cookie: {
    name: "ergoplanner_session";
    httpOnly: true;
    secure: true;
    sameSite: "strict";
    domain: ".ergoplanner.com";
  };
  concurrent: {
    maxSessions: 5;
    strategy: "newest" | "oldest" | "prompt";
  };
}

// Session validation endpoint
GET /api/v1/auth/session/validate
Headers:
  Authorization: Bearer {access_token}
  X-Session-Id: {session_id}

Response:
{
  "valid": true,
  "user": {
    "id": "user123",
    "email": "user@company.com",
    "roles": ["engineer", "reviewer"]
  },
  "session": {
    "id": "sess_abc123",
    "createdAt": "2025-01-19T10:00:00Z",
    "lastActivity": "2025-01-19T10:30:00Z",
    "expiresAt": "2025-01-19T11:00:00Z"
  }
}
```

---

## 7. File Format Specifications

### 7.1 PDF Generation with Layers

```typescript
interface PDFLayerConfig {
  layers: Array<{
    name: string;
    visible: boolean;
    printable: boolean;
    locked: boolean;
    elements: string[]; // Element IDs to include in layer
  }>;
  settings: {
    format: "A0" | "A1" | "A2" | "A3" | "A4";
    orientation: "portrait" | "landscape";
    dpi: 150 | 300 | 600;
    compression: "none" | "jpeg" | "zip";
    embedFonts: boolean;
    colorSpace: "RGB" | "CMYK";
  };
}

// PDF generation API
POST /api/v1/export/pdf
Headers:
  Content-Type: application/json
  Authorization: Bearer {token}
Body:
{
  "drawingId": "PID-001",
  "layers": [
    {
      "name": "Process",
      "visible": true,
      "printable": true,
      "locked": false,
      "elements": ["pipes", "vessels", "pumps"]
    },
    {
      "name": "Instrumentation",
      "visible": true,
      "printable": true,
      "locked": false,
      "elements": ["instruments", "control-loops"]
    },
    {
      "name": "Annotations",
      "visible": true,
      "printable": false,
      "locked": true,
      "elements": ["comments", "redlines"]
    }
  ],
  "settings": {
    "format": "A1",
    "orientation": "landscape",
    "dpi": 300,
    "compression": "jpeg",
    "embedFonts": true,
    "colorSpace": "RGB"
  }
}
```

### 7.2 SVG Export Format

```xml
<!-- SVG Export Structure -->
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:ergo="https://ergoplanner.com/svg/extensions"
     width="1189mm" height="841mm"
     viewBox="0 0 1189 841">

  <defs>
    <!-- Symbol definitions -->
    <symbol id="valve-gate" ergo:type="valve" ergo:standard="ISA-5.1">
      <path d="M10,20 L30,20 M20,10 L20,30 M15,10 L25,10"/>
    </symbol>
  </defs>

  <!-- Layers -->
  <g id="layer-process" ergo:layer="process">
    <use href="#valve-gate" x="100" y="200"
         ergo:tag="V-101"
         ergo:size="DN100"
         ergo:material="CS"/>
  </g>

  <g id="layer-electrical" ergo:layer="electrical" style="display:none">
    <!-- Electrical components -->
  </g>

  <!-- Metadata -->
  <metadata>
    <ergo:project id="PROJ-001" name="Refinery Unit A"/>
    <ergo:drawing number="PID-001" revision="3"/>
    <ergo:created date="2025-01-19" by="user@company.com"/>
  </metadata>
</svg>
```

### 7.3 Image Export Compression

```typescript
interface ImageExportConfig {
  format: "PNG" | "JPG" | "WEBP";
  quality: number; // 0-100 for JPG/WEBP
  resolution: {
    width: number;
    height: number;
    maintainAspectRatio: boolean;
  };
  png: {
    compressionLevel: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
    filters: "none" | "sub" | "up" | "average" | "paeth" | "all";
  };
  jpg: {
    progressive: boolean;
    chromaSubsampling: "4:4:4" | "4:2:2" | "4:2:0";
  };
  webp: {
    lossless: boolean;
    method: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  };
}

// Image export endpoint
POST /api/v1/export/image
Headers:
  Content-Type: application/json
  Authorization: Bearer {token}
Body:
{
  "drawingId": "PID-001",
  "format": "PNG",
  "resolution": {
    "width": 4096,
    "height": 2896,
    "maintainAspectRatio": true
  },
  "png": {
    "compressionLevel": 9,
    "filters": "all"
  }
}
```

### 7.4 Excel Export Templates

```typescript
interface ExcelExportTemplate {
  worksheets: Array<{
    name: string;
    type: "data" | "chart" | "pivot";
    data: {
      source: string; // Data source identifier
      columns: Array<{
        field: string;
        header: string;
        width: number;
        format: string; // Excel format string
      }>;
      filters: boolean;
      freezePanes: { row: number; column: number };
    };
  }>;
  styles: {
    header: {
      font: { bold: boolean; size: number; color: string };
      fill: { type: "pattern"; pattern: string; fgColor: string };
      alignment: { horizontal: string; vertical: string };
    };
    data: {
      font: { size: number };
      borders: { style: string; color: string };
    };
  };
}

// Equipment list export template
const equipmentListTemplate: ExcelExportTemplate = {
  worksheets: [
    {
      name: "Equipment List",
      type: "data",
      data: {
        source: "equipment",
        columns: [
          { field: "tag", header: "Tag Number", width: 15, format: "@" },
          { field: "description", header: "Description", width: 40, format: "@" },
          { field: "type", header: "Type", width: 20, format: "@" },
          { field: "capacity", header: "Capacity", width: 15, format: "#,##0.00" },
          { field: "units", header: "Units", width: 10, format: "@" },
          { field: "material", header: "Material", width: 15, format: "@" },
          { field: "vendor", header: "Vendor", width: 25, format: "@" }
        ],
        filters: true,
        freezePanes: { row: 1, column: 2 }
      }
    }
  ],
  styles: {
    header: {
      font: { bold: true, size: 11, color: "#FFFFFF" },
      fill: { type: "pattern", pattern: "solid", fgColor: "#366092" },
      alignment: { horizontal: "center", vertical: "center" }
    },
    data: {
      font: { size: 10 },
      borders: { style: "thin", color: "#D3D3D3" }
    }
  }
};
```

### 7.5 CSV Field Definitions

```typescript
interface CSVExportConfig {
  delimiter: "," | ";" | "\t" | "|";
  encoding: "UTF-8" | "UTF-16" | "ISO-8859-1";
  lineEnding: "CRLF" | "LF";
  quote: '"' | "'";
  escapeQuote: boolean;
  includeHeader: boolean;
  dateFormat: string;
  nullValue: string;
  booleanFormat: {
    true: string;
    false: string;
  };
}

// Standard CSV export configurations
const csvConfigs = {
  standard: {
    delimiter: ",",
    encoding: "UTF-8",
    lineEnding: "CRLF",
    quote: '"',
    escapeQuote: true,
    includeHeader: true,
    dateFormat: "YYYY-MM-DD",
    nullValue: "",
    booleanFormat: { true: "TRUE", false: "FALSE" }
  },
  european: {
    delimiter: ";",
    encoding: "ISO-8859-1",
    lineEnding: "CRLF",
    quote: '"',
    escapeQuote: true,
    includeHeader: true,
    dateFormat: "DD/MM/YYYY",
    nullValue: "",
    booleanFormat: { true: "1", false: "0" }
  }
};
```

### 7.6 JSON Schema Definitions

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://ergoplanner.com/schemas/drawing.json",
  "type": "object",
  "title": "Ergoplanner Drawing Schema",
  "required": ["id", "projectId", "number", "revision", "elements"],
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "projectId": {
      "type": "string",
      "format": "uuid"
    },
    "number": {
      "type": "string",
      "pattern": "^[A-Z]{3}-[0-9]{3,4}$"
    },
    "revision": {
      "type": "integer",
      "minimum": 0
    },
    "title": {
      "type": "string",
      "maxLength": 200
    },
    "discipline": {
      "type": "string",
      "enum": ["process", "electrical", "instrumentation", "mechanical", "civil"]
    },
    "elements": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "type", "geometry"],
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "type": {
            "type": "string",
            "enum": ["pipe", "valve", "pump", "vessel", "instrument", "text"]
          },
          "geometry": {
            "type": "object",
            "properties": {
              "x": { "type": "number" },
              "y": { "type": "number" },
              "width": { "type": "number" },
              "height": { "type": "number" },
              "rotation": { "type": "number" },
              "points": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "x": { "type": "number" },
                    "y": { "type": "number" }
                  }
                }
              }
            }
          },
          "properties": {
            "type": "object",
            "additionalProperties": true
          }
        }
      }
    },
    "metadata": {
      "type": "object",
      "properties": {
        "createdAt": {
          "type": "string",
          "format": "date-time"
        },
        "createdBy": {
          "type": "string"
        },
        "modifiedAt": {
          "type": "string",
          "format": "date-time"
        },
        "modifiedBy": {
          "type": "string"
        },
        "status": {
          "type": "string",
          "enum": ["draft", "review", "approved", "archived"]
        }
      }
    }
  }
}
```

---

## 8. External Service Integration

### 8.1 Weather Service APIs

```typescript
// OpenWeatherMap Integration
const WEATHER_API = {
  base: "https://api.openweathermap.org/data/2.5",
  endpoints: {
    current: "/weather",
    forecast: "/forecast",
    historical: "/onecall/timemachine"
  },
  apiKey: process.env.OPENWEATHER_API_KEY
};

// Get current weather for project site
GET https://api.openweathermap.org/data/2.5/weather
  ?lat={latitude}
  &lon={longitude}
  &units=metric
  &appid={api_key}

Response:
{
  "weather": [{
    "id": 800,
    "main": "Clear",
    "description": "clear sky"
  }],
  "main": {
    "temp": 25.5,
    "feels_like": 24.8,
    "pressure": 1013,
    "humidity": 65
  },
  "wind": {
    "speed": 3.5,
    "deg": 180
  },
  "visibility": 10000,
  "dt": 1642598400
}

// Rate limits
const weatherRateLimits = {
  free: {
    callsPerMinute: 60,
    callsPerDay: 1000
  },
  professional: {
    callsPerMinute: 600,
    callsPerDay: 100000
  }
};
```

### 8.2 Currency Exchange APIs

```typescript
// Exchange Rate API Integration
const EXCHANGE_API = {
  base: "https://v6.exchangerate-api.com/v6",
  apiKey: process.env.EXCHANGE_RATE_API_KEY
};

// Get exchange rates
GET https://v6.exchangerate-api.com/v6/{api_key}/latest/USD

Response:
{
  "result": "success",
  "base_code": "USD",
  "conversion_rates": {
    "EUR": 0.92,
    "GBP": 0.79,
    "JPY": 148.25,
    "CAD": 1.35,
    "AUD": 1.52
  },
  "time_last_update_utc": "2025-01-19 00:00:00"
}

// Currency conversion for cost estimates
interface CurrencyConversion {
  convertCost(amount: number, from: string, to: string): Promise<{
    originalAmount: number;
    originalCurrency: string;
    convertedAmount: number;
    convertedCurrency: string;
    exchangeRate: number;
    timestamp: string;
  }>;
}

// Caching strategy
const currencyCacheConfig = {
  ttl: 3600, // 1 hour
  updateInterval: 3600000, // milliseconds
  fallbackRates: {
    "USD": { "EUR": 0.92, "GBP": 0.79 } // Offline fallback
  }
};
```

### 8.3 Email Service (SMTP/SendGrid)

```typescript
// SMTP Configuration
const smtpConfig = {
  host: "smtp.office365.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  }
};

// SendGrid API Integration
const SENDGRID_API = {
  base: "https://api.sendgrid.com/v3",
  apiKey: process.env.SENDGRID_API_KEY
};

// Send notification email
POST https://api.sendgrid.com/v3/mail/send
Headers:
  Authorization: Bearer {api_key}
  Content-Type: application/json
Body:
{
  "personalizations": [{
    "to": [{"email": "engineer@company.com"}],
    "subject": "P&ID Review Required - {project_name}",
    "substitutions": {
      "{project_name}": "Refinery Unit A",
      "{drawing_number}": "PID-001-R3",
      "{reviewer}": "John Smith",
      "{due_date}": "2025-01-25"
    }
  }],
  "from": {
    "email": "notifications@ergoplanner.com",
    "name": "Ergoplanner AI Suite"
  },
  "template_id": "d-f43daeeaef504760851f727007e0b5d0",
  "categories": ["drawing-review", "notification"],
  "tracking_settings": {
    "click_tracking": { "enable": true },
    "open_tracking": { "enable": true }
  }
}

// Email templates
const emailTemplates = {
  drawingReview: {
    subject: "P&ID Review Required - {{project}}",
    html: `
      <h2>Drawing Review Request</h2>
      <p>A new drawing is ready for your review:</p>
      <ul>
        <li>Project: {{project}}</li>
        <li>Drawing: {{drawing}}</li>
        <li>Submitted by: {{submitter}}</li>
        <li>Due date: {{dueDate}}</li>
      </ul>
      <a href="{{reviewLink}}">Review Drawing</a>
    `
  }
};
```

### 8.4 SMS Notifications (Twilio)

```typescript
// Twilio Configuration
const TWILIO_CONFIG = {
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  fromNumber: process.env.TWILIO_PHONE_NUMBER,
  apiBase: "https://api.twilio.com/2010-04-01"
};

// Send SMS notification
POST https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json
Headers:
  Authorization: Basic {base64(AccountSid:AuthToken)}
  Content-Type: application/x-www-form-urlencoded
Body:
  To=+1234567890
  &From=+0987654321
  &Body=Urgent: P&ID PID-001 requires immediate review. Login to Ergoplanner to review.

// SMS templates and rate limits
const smsConfig = {
  templates: {
    reviewAlert: "{{project}}: Drawing {{drawing}} needs review by {{deadline}}",
    approvalNotice: "{{drawing}} has been approved by {{approver}}",
    systemAlert: "System Alert: {{message}}"
  },
  rateLimits: {
    perNumber: {
      hourly: 10,
      daily: 50
    },
    global: {
      perSecond: 10,
      perMinute: 100
    }
  },
  retryPolicy: {
    maxRetries: 3,
    backoffMultiplier: 2,
    initialDelay: 1000
  }
};

// Webhook for delivery status
POST https://ergoplanner.com/webhooks/twilio/status
Body:
{
  "MessageSid": "SM1234567890",
  "MessageStatus": "delivered",
  "To": "+1234567890",
  "ErrorCode": null,
  "ErrorMessage": null
}
```

### 8.5 Cloud Storage Integration

#### Azure Blob Storage

```typescript
// Azure Blob Storage Configuration
const AZURE_STORAGE = {
  accountName: process.env.AZURE_STORAGE_ACCOUNT,
  accountKey: process.env.AZURE_STORAGE_KEY,
  containerName: "ergoplanner-drawings",
  sasToken: process.env.AZURE_SAS_TOKEN,
  endpoints: {
    blob: `https://${process.env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net`,
    table: `https://${process.env.AZURE_STORAGE_ACCOUNT}.table.core.windows.net`,
    queue: `https://${process.env.AZURE_STORAGE_ACCOUNT}.queue.core.windows.net`
  }
};

// Upload drawing to Azure Blob
PUT https://{account}.blob.core.windows.net/{container}/{blob}
Headers:
  x-ms-blob-type: BlockBlob
  x-ms-version: 2020-10-02
  x-ms-meta-project: {projectId}
  x-ms-meta-drawing: {drawingNumber}
  x-ms-meta-revision: {revision}
  Authorization: SharedKey {account}:{signature}
  Content-Type: application/pdf
  Content-Length: {size}
Body: [binary data]

// Generate SAS URL for temporary access
const generateSasUrl = (blobName: string): string => {
  const sasToken = generateSasToken({
    containerName: "ergoplanner-drawings",
    blobName: blobName,
    permissions: "r",
    expiry: new Date(Date.now() + 3600000), // 1 hour
    ipRange: "0.0.0.0-255.255.255.255",
    protocol: "https"
  });

  return `${AZURE_STORAGE.endpoints.blob}/${containerName}/${blobName}?${sasToken}`;
};
```

#### Amazon S3 Integration

```typescript
// AWS S3 Configuration
const AWS_S3 = {
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  bucket: "ergoplanner-drawings",
  endpoints: {
    s3: `https://s3.${process.env.AWS_REGION}.amazonaws.com`
  }
};

// Upload to S3 with multipart support
POST https://s3.amazonaws.com/{bucket}/{key}?uploads
Headers:
  Authorization: AWS4-HMAC-SHA256 Credential={credentials}
  x-amz-storage-class: STANDARD_IA
  x-amz-server-side-encryption: AES256
  x-amz-meta-project: {projectId}
  x-amz-meta-drawing: {drawingNumber}

// S3 lifecycle policies
const s3Lifecycle = {
  rules: [
    {
      id: "archive-old-revisions",
      status: "Enabled",
      transitions: [
        {
          days: 30,
          storageClass: "STANDARD_IA"
        },
        {
          days: 90,
          storageClass: "GLACIER"
        }
      ]
    },
    {
      id: "delete-temp-files",
      status: "Enabled",
      prefix: "temp/",
      expiration: {
        days: 7
      }
    }
  ]
};

// Pre-signed URL generation
const getPresignedUrl = (operation: 'getObject' | 'putObject', key: string): string => {
  const params = {
    Bucket: AWS_S3.bucket,
    Key: key,
    Expires: 3600, // 1 hour
    ContentType: operation === 'putObject' ? 'application/pdf' : undefined
  };

  return s3.getSignedUrl(operation, params);
};
```

### 8.6 Error Handling and Retry Policies

```typescript
// Universal retry configuration
interface RetryConfig {
  maxRetries: number;
  retryDelays: number[]; // milliseconds
  retryableStatusCodes: number[];
  retryableErrorCodes: string[];
  backoffMultiplier: number;
  maxBackoffDelay: number;
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  retryDelays: [1000, 2000, 4000],
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableErrorCodes: ['ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND'],
  backoffMultiplier: 2,
  maxBackoffDelay: 30000
};

// Circuit breaker implementation
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime: Date | null = null;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000,
    private resetTimeout: number = 30000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime!.getTime() > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}
```

### 8.7 Rate Limiting Configuration

```typescript
// API rate limiting rules
const rateLimits = {
  global: {
    windowMs: 60000, // 1 minute
    maxRequests: 1000
  },
  endpoints: {
    "/api/v1/auth/login": {
      windowMs: 900000, // 15 minutes
      maxRequests: 5,
      skipSuccessfulRequests: false
    },
    "/api/v1/export/pdf": {
      windowMs: 60000,
      maxRequests: 10,
      skipSuccessfulRequests: true
    },
    "/api/v1/cad/import": {
      windowMs: 60000,
      maxRequests: 5,
      skipSuccessfulRequests: true
    }
  },
  headers: {
    remaining: "X-RateLimit-Remaining",
    reset: "X-RateLimit-Reset",
    limit: "X-RateLimit-Limit",
    retryAfter: "Retry-After"
  }
};
```

---

## Appendices

### A. HTTP Status Codes

| Code | Description | Usage |
|------|-------------|-------|
| 200 | OK | Successful GET, PUT |
| 201 | Created | Successful POST |
| 202 | Accepted | Async operation initiated |
| 204 | No Content | Successful DELETE |
| 304 | Not Modified | Cached content valid |
| 400 | Bad Request | Invalid request format |
| 401 | Unauthorized | Missing/invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource state conflict |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 502 | Bad Gateway | Upstream service error |
| 503 | Service Unavailable | Service temporarily down |
| 504 | Gateway Timeout | Upstream service timeout |

### B. Common Error Response Format

```json
{
  "error": {
    "code": "ERR_VALIDATION_FAILED",
    "message": "Validation failed for the provided input",
    "details": [
      {
        "field": "drawing.number",
        "code": "INVALID_FORMAT",
        "message": "Drawing number must match pattern XXX-000"
      }
    ],
    "timestamp": "2025-01-19T12:00:00Z",
    "requestId": "req_abc123def456",
    "documentation": "https://docs.ergoplanner.com/errors/ERR_VALIDATION_FAILED"
  }
}
```

### C. Security Headers

```typescript
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()"
};
```

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-01-19 | Technical Writer | Initial comprehensive integration specifications |

## References

- [AutoCAD DXF Reference](https://www.autodesk.com/techpubs/autocad/dxf/)
- [ISA-5.1-2009 Standard](https://www.isa.org/standards-and-publications/isa-standards/isa-standards-committees/isa5-1)
- [ISO 14617 Standard](https://www.iso.org/standard/41845.html)
- [Microsoft Graph API](https://docs.microsoft.com/en-us/graph/)
- [SharePoint REST API](https://docs.microsoft.com/en-us/sharepoint/dev/sp-add-ins/sharepoint-rest-service)
- [SAP OData Services](https://help.sap.com/docs/SAP_NETWEAVER_750/68bf513362174d54b58cddec28794093/7be13cf0fa014897b3d07f1ad65e5328.html)
- [OAuth 2.0 RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749)
- [SAML 2.0 Specifications](https://docs.oasis-open.org/security/saml/v2.0/)
- [JWT RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519)