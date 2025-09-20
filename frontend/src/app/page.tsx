import { redirect } from 'next/navigation';
import { routes } from '@/config';

// Root page - redirect to dashboard for authenticated users
export default function HomePage() {
  // This will be handled by middleware for auth checking
  // If user is authenticated, middleware will allow access and we redirect to dashboard
  // If user is not authenticated, middleware will redirect to login
  redirect(routes.dashboard);
}