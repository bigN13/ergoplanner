import { NextRequest, NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import { config, routes } from '@/config';

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/projects',
  '/drawings',
  '/symbols',
  '/workflows',
  '/settings',
  '/profile',
  '/admin',
];

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/confirm-email',
];

// Define admin-only routes
const adminRoutes = [
  '/admin',
];

// Helper function to check if route is protected
const isProtectedRoute = (pathname: string): boolean => {
  return protectedRoutes.some(route => pathname.startsWith(route));
};

// Helper function to check if route is public
const isPublicRoute = (pathname: string): boolean => {
  return publicRoutes.some(route => pathname === route || pathname.startsWith(route));
};

// Helper function to check if route is admin-only
const isAdminRoute = (pathname: string): boolean => {
  return adminRoutes.some(route => pathname.startsWith(route));
};

// Helper function to validate JWT token
const isValidToken = (token: string): boolean => {
  try {
    const decoded: any = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch {
    return false;
  }
};

// Helper function to get user role from token
const getUserRole = (token: string): string | null => {
  try {
    const decoded: any = jwtDecode(token);
    return decoded.role || null;
  } catch {
    return null;
  }
};

// Helper function to check if user has admin role
const isAdmin = (role: string): boolean => {
  return role === 'Admin';
};

// Auth middleware function
export function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from cookies
  const token = request.cookies.get(config.auth.tokenKey)?.value;

  // If the route is public and user is not authenticated, allow access
  if (isPublicRoute(pathname)) {
    // If user is authenticated and trying to access auth pages, redirect to dashboard
    if (token && isValidToken(token) && pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL(routes.dashboard, request.url));
    }
    return NextResponse.next();
  }

  // If the route is protected and user is not authenticated, redirect to login
  if (isProtectedRoute(pathname)) {
    if (!token || !isValidToken(token)) {
      const loginUrl = new URL(routes.login, request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check admin routes
    if (isAdminRoute(pathname)) {
      const userRole = getUserRole(token);
      if (!userRole || !isAdmin(userRole)) {
        // Redirect to dashboard if user is not admin
        return NextResponse.redirect(new URL(routes.dashboard, request.url));
      }
    }
  }

  // Allow the request to proceed
  return NextResponse.next();
}

// Middleware configuration
export const config_middleware = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logo|icons|images).*)',
  ],
};

export default authMiddleware;