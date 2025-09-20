/**
 * Application Configuration
 * Centralized configuration for the Ergoplanner AI Suite frontend
 */

// Environment variables with defaults
export const config = {
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
  },

  // WebSocket Configuration
  signalr: {
    hubUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000',
    hubs: {
      drawing: '/hubs/drawing',
      notification: '/hubs/notification',
      workflow: '/hubs/workflow',
    },
    reconnectAttempts: 5,
    reconnectInterval: 5000,
  },

  // Authentication
  auth: {
    tokenKey: 'ergoplanner_token',
    refreshTokenKey: 'ergoplanner_refresh_token',
    userKey: 'ergoplanner_user',
    tokenExpiryBuffer: 5 * 60 * 1000, // 5 minutes in milliseconds
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  },

  // Application Settings
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Ergoplanner AI Suite',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
    logo: '/logo.svg',
    favicon: '/favicon.ico',
    defaultTheme: 'light',
    defaultLocale: 'en',
  },

  // Drawing Engine
  drawing: {
    defaultViewport: {
      x: 0,
      y: 0,
      zoom: 1,
    },
    maxZoom: 4,
    minZoom: 0.1,
    snapToGrid: true,
    gridSize: 20,
    autoSave: {
      enabled: true,
      interval: 30000, // 30 seconds
      maxRetries: 3,
    },
    collaboration: {
      cursorUpdateInterval: 100, // ms
      selectionUpdateInterval: 200, // ms
    },
  },

  // File Upload
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'],
    allowedDocumentTypes: ['application/pdf', 'application/dwg'],
    maxFiles: 10,
  },

  // Pagination
  pagination: {
    defaultPageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
    maxPageSize: 100,
  },

  // UI Settings
  ui: {
    toastDuration: 5000,
    debounceDelay: 300,
    animationDuration: 200,
    breakpoints: {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536,
    },
  },

  // Development
  dev: {
    enableDevTools: process.env.NODE_ENV === 'development',
    logLevel: process.env.NEXT_PUBLIC_LOG_LEVEL || 'info',
    mockApiEnabled: process.env.NEXT_PUBLIC_MOCK_API === 'true',
  },

  // Features Flags
  features: {
    aiAssistant: process.env.NEXT_PUBLIC_FEATURE_AI === 'true',
    realTimeCollaboration: process.env.NEXT_PUBLIC_FEATURE_REALTIME === 'true',
    advancedWorkflows: process.env.NEXT_PUBLIC_FEATURE_WORKFLOWS === 'true',
    exportPDF: process.env.NEXT_PUBLIC_FEATURE_PDF_EXPORT === 'true',
    importCAD: process.env.NEXT_PUBLIC_FEATURE_CAD_IMPORT === 'true',
  },

  // Performance
  performance: {
    virtualScrollThreshold: 100,
    debounceSearchDelay: 300,
    imageLoadingStrategy: 'lazy',
    preloadPages: 2,
  },

  // Security
  security: {
    csrfEnabled: true,
    contentSecurityPolicy: {
      enabled: process.env.NODE_ENV === 'production',
      reportOnly: false,
    },
    rateLimiting: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
    },
  },
} as const;

// API Endpoints
export const endpoints = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
    profile: '/api/auth/profile',
    changePassword: '/api/auth/change-password',
    forgotPassword: '/api/auth/forgot-password',
    resetPassword: '/api/auth/reset-password',
    confirmEmail: '/api/auth/confirm-email',
  },
  users: {
    list: '/api/users',
    create: '/api/users',
    update: (id: string) => `/api/users/${id}`,
    delete: (id: string) => `/api/users/${id}`,
    profile: (id: string) => `/api/users/${id}/profile`,
  },
  organizations: {
    list: '/api/organizations',
    create: '/api/organizations',
    update: (id: string) => `/api/organizations/${id}`,
    delete: (id: string) => `/api/organizations/${id}`,
    members: (id: string) => `/api/organizations/${id}/members`,
  },
  projects: {
    list: '/api/projects',
    create: '/api/projects',
    get: (id: string) => `/api/projects/${id}`,
    update: (id: string) => `/api/projects/${id}`,
    delete: (id: string) => `/api/projects/${id}`,
    members: (id: string) => `/api/projects/${id}/members`,
    drawings: (id: string) => `/api/projects/${id}/drawings`,
  },
  drawings: {
    list: '/api/drawings',
    create: '/api/drawings',
    get: (id: string) => `/api/drawings/${id}`,
    update: (id: string) => `/api/drawings/${id}`,
    delete: (id: string) => `/api/drawings/${id}`,
    components: (id: string) => `/api/drawings/${id}/components`,
    boq: (id: string) => `/api/drawings/${id}/boq`,
    export: (id: string) => `/api/drawings/${id}/export`,
    versions: (id: string) => `/api/drawings/${id}/versions`,
    workflow: (id: string) => `/api/drawings/${id}/workflow`,
  },
  components: {
    list: '/api/components',
    create: '/api/components',
    get: (id: string) => `/api/components/${id}`,
    update: (id: string) => `/api/components/${id}`,
    delete: (id: string) => `/api/components/${id}`,
    properties: (id: string) => `/api/components/${id}/properties`,
  },
  symbols: {
    list: '/api/symbols',
    create: '/api/symbols',
    get: (id: string) => `/api/symbols/${id}`,
    update: (id: string) => `/api/symbols/${id}`,
    delete: (id: string) => `/api/symbols/${id}`,
    library: '/api/symbols/library',
    standards: '/api/symbols/standards',
  },
  workflows: {
    list: '/api/workflows',
    create: '/api/workflows',
    get: (id: string) => `/api/workflows/${id}`,
    update: (id: string) => `/api/workflows/${id}`,
    approve: (id: string) => `/api/workflows/${id}/approve`,
    reject: (id: string) => `/api/workflows/${id}/reject`,
    comments: (id: string) => `/api/workflows/${id}/comments`,
  },
  boq: {
    list: '/api/boq',
    create: '/api/boq',
    get: (id: string) => `/api/boq/${id}`,
    update: (id: string) => `/api/boq/${id}`,
    delete: (id: string) => `/api/boq/${id}`,
    export: (drawingId: string) => `/api/boq/export/${drawingId}`,
    import: '/api/boq/import',
  },
} as const;

// Route Paths
export const routes = {
  home: '/',
  login: '/auth/login',
  register: '/auth/register',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',
  dashboard: '/dashboard',
  projects: '/projects',
  project: (id: string) => `/projects/${id}`,
  drawings: '/drawings',
  drawing: (id: string) => `/drawings/${id}`,
  boq: (drawingId: string) => `/drawings/${drawingId}/boq`,
  symbols: '/symbols',
  workflows: '/workflows',
  settings: '/settings',
  profile: '/profile',
  admin: '/admin',
} as const;

// Default values for forms and components
export const defaults = {
  user: {
    role: 'Author',
    isActive: true,
  },
  project: {
    status: 'Draft',
  },
  drawing: {
    status: 'Draft',
    version: 1,
    reactFlowData: {
      nodes: [],
      edges: [],
      viewport: config.drawing.defaultViewport,
    },
  },
  component: {
    position: { x: 0, y: 0 },
    properties: [],
  },
} as const;

export type Config = typeof config;
export type Endpoints = typeof endpoints;
export type Routes = typeof routes;
export type Defaults = typeof defaults;