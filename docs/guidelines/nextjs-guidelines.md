# Next.js Development Guidelines - Best Software Engineering Practices

## Table of Contents
1. [Project Setup and Structure](#project-setup-and-structure)
2. [TypeScript Configuration](#typescript-configuration)
3. [Code Organization Principles](#code-organization-principles)
4. [Component Architecture](#component-architecture)
5. [State Management](#state-management)
6. [API Design and Data Fetching](#api-design-and-data-fetching)
7. [Database and ORM Best Practices](#database-and-orm-best-practices)
8. [Testing Strategy](#testing-strategy)
9. [Performance Optimization](#performance-optimization)
10. [Security Best Practices](#security-best-practices)
11. [Error Handling and Logging](#error-handling-and-logging)
12. [CI/CD and Deployment](#cicd-and-deployment)
13. [Documentation Standards](#documentation-standards)
14. [Code Quality and Linting](#code-quality-and-linting)
15. [Monitoring and Observability](#monitoring-and-observability)

## Project Setup and Structure

### Initial Setup
```
npx create-next-app@latest --typescript --tailwind --eslint --app
```

### Recommended Project Structure
```
/src
  /app                    # App Router pages and layouts
    /(auth)              # Route groups for authentication
    /(dashboard)         # Protected routes
    /api                 # API routes
    layout.tsx           # Root layout
    error.tsx           # Error boundary
    not-found.tsx       # 404 page
  /components            # Reusable components
    /ui                 # Basic UI components
    /forms              # Form components
    /layouts            # Layout components
    /features           # Feature-specific components
  /lib                  # Core utilities and logic
    /db                 # Database utilities
    /api                # API helpers
    /auth               # Authentication logic
    /utils              # General utilities
    /constants          # App constants
    /types              # TypeScript types
    /schemas            # Validation schemas
  /hooks                # Custom React hooks
  /services             # External service integrations
  /stores               # State management stores
  /styles               # Global styles
  /tests                # Test files
    /unit              # Unit tests
    /integration       # Integration tests
    /e2e               # End-to-end tests
/public                 # Static assets
/prisma                # Database schema and migrations
/.github               # GitHub Actions workflows
/scripts               # Build and utility scripts
```

### Environment Configuration
```
# .env.local
# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generated-secret"

# External Services
API_KEY="..."
SMTP_HOST="..."

# Feature Flags
ENABLE_ANALYTICS="true"
ENABLE_EXPERIMENTAL_FEATURES="false"
```

## TypeScript Configuration

### Strict TypeScript Config
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"]
    }
  }
}
```

### Type Safety Principles
- Never use `any` - use `unknown` and type guards instead
- Define explicit return types for functions
- Use discriminated unions for complex state
- Leverage type inference where appropriate
- Create shared type definitions in centralized location

## Code Organization Principles

### Single Responsibility Principle
- Each module/component should have one clear purpose
- Separate business logic from UI components
- Keep files under 300 lines
- Extract complex logic into custom hooks or utilities

### Dependency Management
- Use barrel exports for cleaner imports
- Implement dependency injection for testability
- Avoid circular dependencies
- Keep external dependencies minimal

### File Naming Conventions
- Components: PascalCase (e.g., `UserProfile.tsx`)
- Utilities: camelCase (e.g., `formatDate.ts`)
- Types: PascalCase with `.types.ts` suffix
- Tests: Same as source with `.test.ts` suffix
- Constants: SCREAMING_SNAKE_CASE in files

## Component Architecture

### Component Types and Patterns

#### Server Components (Default)
- Use for data fetching and static content
- Minimize client-side JavaScript
- Leverage streaming and suspense
- Keep authentication checks server-side

#### Client Components
- Use only when necessary (interactivity, hooks, browser APIs)
- Mark with "use client" directive
- Optimize bundle size
- Implement proper error boundaries

### Component Best Practices
```typescript
// Good component structure
interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
  className?: string;
}

export function UserCard({ 
  user, 
  onEdit, 
  className 
}: UserCardProps) {
  // Hooks at the top
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Computed values
  const fullName = `${user.firstName} ${user.lastName}`;
  
  // Event handlers
  const handleEdit = useCallback(() => {
    if (onEdit) {
      setIsLoading(true);
      onEdit(user);
    }
  }, [user, onEdit]);
  
  // Early returns for edge cases
  if (!user) return null;
  
  // Main render
  return (
    <div className={cn("user-card", className)}>
      {/* Component content */}
    </div>
  );
}
```

### Composition Patterns
- Prefer composition over inheritance
- Use compound components for complex UIs
- Implement render props for flexibility
- Leverage React Context for component trees

## State Management

### State Management Strategy
1. **Local State**: useState for component-specific state
2. **Context**: For cross-component state (theme, user)
3. **URL State**: Search params for filterable/shareable state
4. **Server State**: React Query or SWR for API data
5. **Global State**: Zustand for complex client state

### State Management Best Practices
- Keep state as close to usage as possible
- Normalize complex data structures
- Use optimistic updates for better UX
- Implement proper state persistence
- Avoid prop drilling with Context or composition

### Example State Architecture
```typescript
// URL State for filters
useSearchParams for pagination, sorting, filtering

// Server State with React Query
useQuery for data fetching
useMutation for data updates
useInfiniteQuery for pagination

// Global UI State with Zustand
useStore for modals, sidebars, notifications

// Form State with React Hook Form
useForm for complex forms with validation
```

## API Design and Data Fetching

### API Route Best Practices
```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Input validation schema
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
});

// Consistent error handling
export async function POST(request: NextRequest) {
  try {
    // Parse and validate input
    const body = await request.json();
    const validated = createUserSchema.parse(body);
    
    // Business logic
    const user = await createUser(validated);
    
    // Consistent response format
    return NextResponse.json({
      success: true,
      data: user,
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      }, { status: 400 });
    }
    
    // Log unexpected errors
    console.error('API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
```

### Data Fetching Patterns
```typescript
// Server Component data fetching
async function Page() {
  const data = await fetchData();
  return <Component data={data} />;
}

// Client-side fetching with React Query
function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Parallel data fetching
const [users, posts] = await Promise.all([
  fetchUsers(),
  fetchPosts(),
]);
```

## Database and ORM Best Practices

### Prisma Best Practices
```typescript
// Efficient queries
const users = await prisma.user.findMany({
  where: { active: true },
  select: {
    id: true,
    name: true,
    email: true,
    // Only select needed fields
  },
  take: 10,
  skip: page * 10,
});

// Use transactions for data consistency
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data });
  await tx.log.create({ data: { userId: user.id } });
  return user;
});

// Connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'error', 'warn'],
});
```

### Database Design Principles
- Normalize data to avoid redundancy
- Use appropriate indexes for query performance
- Implement soft deletes for data recovery
- Version your schema with migrations
- Regular backups and monitoring

## Testing Strategy

### Testing Pyramid
1. **Unit Tests** (70%)
   - Pure functions
   - Custom hooks
   - Utilities
   - Individual components

2. **Integration Tests** (20%)
   - API routes
   - Database operations
   - Component interactions
   - External service mocks

3. **E2E Tests** (10%)
   - Critical user paths
   - Cross-browser testing
   - Performance benchmarks

### Testing Best Practices
```typescript
// Component testing
describe('UserCard', () => {
  it('should render user information', () => {
    const user = createMockUser();
    render(<UserCard user={user} />);
    
    expect(screen.getByText(user.name)).toBeInTheDocument();
    expect(screen.getByText(user.email)).toBeInTheDocument();
  });
  
  it('should handle edit action', async () => {
    const handleEdit = jest.fn();
    const user = createMockUser();
    
    render(<UserCard user={user} onEdit={handleEdit} />);
    
    await userEvent.click(screen.getByRole('button', { name: /edit/i }));
    
    expect(handleEdit).toHaveBeenCalledWith(user);
  });
});

// API testing
describe('POST /api/users', () => {
  it('should create a new user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ email: 'test@example.com', name: 'Test User' });
      
    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('id');
  });
});
```

## Performance Optimization

### Core Web Vitals Optimization
- **LCP**: Optimize largest content paint
  - Use Next.js Image component
  - Implement proper image sizing
  - Preload critical resources
  
- **FID**: Improve first input delay
  - Code split large bundles
  - Lazy load non-critical components
  - Use React.lazy() and Suspense
  
- **CLS**: Minimize cumulative layout shift
  - Set explicit dimensions for media
  - Avoid injecting content above fold
  - Use CSS aspect-ratio

### Performance Best Practices
```typescript
// Dynamic imports for code splitting
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false,
});

// Image optimization
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority
  placeholder="blur"
  blurDataURL={shimmer}
/>

// Memo expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Debounce user input
const debouncedSearch = useDebouncedCallback(
  (value: string) => {
    search(value);
  },
  300
);
```

### Bundle Size Optimization
- Analyze bundle with @next/bundle-analyzer
- Remove unused dependencies
- Use tree-shakeable imports
- Implement progressive enhancement
- Monitor JavaScript budget

## Security Best Practices

### Authentication and Authorization
```typescript
// Middleware for route protection
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token');
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

// Server-side session validation
export async function getServerSession() {
  const session = await auth();
  
  if (!session) {
    throw new Error('Unauthorized');
  }
  
  return session;
}
```

### Security Headers
```typescript
// next.config.js security headers
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim()
  }
];
```

### Input Validation and Sanitization
- Always validate user input
- Use parameterized queries
- Implement rate limiting
- Sanitize file uploads
- Validate environment variables

## Error Handling and Logging

### Structured Error Handling
```typescript
// Custom error classes
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Global error handler
export function errorHandler(error: unknown): Response {
  console.error('Error:', error);
  
  if (error instanceof AppError) {
    return new Response(
      JSON.stringify({
        error: error.message,
        code: error.code,
      }),
      { status: error.statusCode }
    );
  }
  
  if (error instanceof z.ZodError) {
    return new Response(
      JSON.stringify({
        error: 'Validation failed',
        details: error.errors,
      }),
      { status: 400 }
    );
  }
  
  return new Response(
    JSON.stringify({ error: 'Internal server error' }),
    { status: 500 }
  );
}
```

### Logging Strategy
```typescript
// Structured logging
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

// Log with context
logger.info({
  userId: user.id,
  action: 'login',
  ip: request.ip,
}, 'User logged in successfully');

// Error logging
logger.error({
  err: error,
  userId: user?.id,
  request: {
    method: request.method,
    url: request.url,
  },
}, 'Request failed');
```

## CI/CD and Deployment

### GitHub Actions Workflow
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run build

  e2e:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e

  deploy:
    needs: [test, e2e]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - uses: vercel/action@v28
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### Deployment Checklist
- Environment variables configured
- Database migrations applied
- SSL certificates valid
- CDN configured for assets
- Monitoring and alerts set up
- Backup strategy implemented
- Rollback plan documented

## Documentation Standards

### Code Documentation
```typescript
/**
 * Processes user registration with email verification
 * 
 * @param data - Registration form data
 * @param options - Additional options
 * @returns Created user object or throws ValidationError
 * 
 * @example
 * ```typescript
 * const user = await registerUser({
 *   email: 'user@example.com',
 *   password: 'secure-password',
 *   name: 'John Doe'
 * });
 * ```
 * 
 * @throws {ValidationError} If input data is invalid
 * @throws {ConflictError} If email already exists
 */
export async function registerUser(
  data: RegisterData,
  options?: RegisterOptions
): Promise<User> {
  // Implementation
}
```

### Project Documentation
- README.md with setup instructions
- CONTRIBUTING.md for contribution guidelines
- Architecture Decision Records (ADRs)
- API documentation with examples
- Deployment procedures
- Troubleshooting guide

### Documentation Tools
- TypeDoc for API documentation
- Storybook for component library
- OpenAPI/Swagger for REST APIs
- Mermaid for diagrams
- JSDoc for inline documentation

## Code Quality and Linting

### ESLint Configuration
```javascript
module.exports = {
  extends: [
    'next/core-web-vitals',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  }
};
```

### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml}": [
      "prettier --write"
    ]
  }
}
```

## Monitoring and Observability

### Application Monitoring
- **Performance Monitoring**: Vercel Analytics, Sentry
- **Error Tracking**: Sentry with source maps
- **Uptime Monitoring**: Better Uptime, Pingdom
- **Real User Monitoring**: Web Vitals tracking
- **Custom Metrics**: Application-specific KPIs

### Logging and Debugging
```typescript
// Development debugging
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', { data });
}

// Production logging
logger.info('Operation completed', {
  duration: performance.now() - startTime,
  userId: session.user.id,
  result: 'success'
});

// Performance tracking
export async function trackPerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    
    analytics.track('function_performance', {
      name,
      duration,
      success: true,
    });
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    
    analytics.track('function_performance', {
      name,
      duration,
      success: false,
      error: error.message,
    });
    
    throw error;
  }
}
```

### Health Checks
```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    external: await checkExternalServices(),
  };
  
  const healthy = Object.values(checks).every(check => check.status === 'ok');
  
  return NextResponse.json({
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks,
  }, {
    status: healthy ? 200 : 503,
  });
}
```

## Conclusion

These guidelines provide a comprehensive framework for building production-ready Next.js applications. Key principles to remember:

1. **Prioritize Developer Experience**: Clear structure, good tooling, comprehensive documentation
2. **Build for Scale**: Performance optimization, proper architecture, monitoring
3. **Maintain Quality**: Testing, code reviews, continuous improvement
4. **Security First**: Authentication, input validation, secure defaults
5. **User-Centric**: Fast load times, accessible UI, error recovery

Regular review and updates of these guidelines ensure they remain relevant as Next.js and the ecosystem evolve.