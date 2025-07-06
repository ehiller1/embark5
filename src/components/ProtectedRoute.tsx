
import { ReactNode, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { useUserProfile } from '@/integrations/lib/auth/UserProfileProvider';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children?: ReactNode;
  allowedRoles?: string[];
  redirectPath?: string;
  unauthorizedPath?: string;
  loadingComponent?: ReactNode;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  redirectPath = '/',
  unauthorizedPath = '/unauthorized',
  loadingComponent = (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-journey-purple" />
      <p className="text-journey-darkBlue">Loading your session...</p>
    </div>
  ),
}: ProtectedRouteProps) {
    const { loading: authLoading, isAuthenticated } = useAuth();
  const { profile, isLoading: profileLoading } = useUserProfile();

  const isLoading = authLoading || profileLoading;
  const role = profile?.role;
  const location = useLocation();

  useEffect(() => {
    console.log(`%c[ProtectedRoute] State Update for ${location.pathname}`, 'color: blue; font-weight: bold;', {
      isLoading,
      isAuthenticated,
      role,
      allowedRoles,
      timestamp: new Date().toISOString(),
    });
  }, [isLoading, isAuthenticated, role, location.pathname, allowedRoles]);

  // Primary loading state check
  if (isLoading) {
    return <>{loadingComponent}</>;
  }

  // If not authenticated, redirect to the specified path
  if (!isAuthenticated) {
    console.log(`%c[ProtectedRoute] NOT AUTHENTICATED for ${location.pathname}. Redirecting to ${redirectPath}`, 'color: red; font-weight: bold;');
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // If authenticated and role restrictions are specified, check for role-based access
  if (allowedRoles && allowedRoles.length > 0) {
    // DEVELOPMENT MODE: Allow access to survey-build regardless of role
    if (location.pathname === '/survey-build') {
      console.log(`%c[ProtectedRoute] DEV MODE: Bypassing role check for ${location.pathname}`, 'color: purple; font-weight: bold;');
    } else if (!role || !allowedRoles.includes(role)) {
      console.log(`%c[ProtectedRoute] UNAUTHORIZED for ${location.pathname}. Role '${role}' not in allowed roles: [${allowedRoles.join(', ')}]`, 'color: orange; font-weight: bold;');
      return <Navigate to={unauthorizedPath} replace />;
    }
  }

  // If authenticated and (no roles are required OR the user has the required role)
  console.log(`%c[ProtectedRoute] AUTHORIZED for ${location.pathname}. Role '${role}' is permitted.`, 'color: green; font-weight: bold;');
  return children ? <>{children}</> : <Outlet />;
}
