import { authMiddleware } from '@/middleware/auth';

// Export the auth middleware as the main middleware
export { authMiddleware as middleware } from '@/middleware/auth';

// Export the config for the middleware
export { config_middleware as config } from '@/middleware/auth';