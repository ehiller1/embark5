
import { ReactNode, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
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
  allowedRoles = ['Clergy', 'Parish'],
  redirectPath = '/',
  unauthorizedPath = '/unauthorized',
  loadingComponent = (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-journey-purple" />
      <p className="text-journey-darkBlue">Loading your session...</p>
    </div>
  ),
}: ProtectedRouteProps) {
  // Use our new combined hook that leverages both AuthProvider and UserProfileProvider
  const { 
    user, 
    role, 
    isLoading, 
    error, 
    isAuthenticated 
  } = useUserRole();
  const location = useLocation();

  // Log authentication state for debugging
  useEffect(() => {
    console.log(`%c[ProtectedRoute] State Update for ${location.pathname}`, 'color: blue; font-weight: bold;', {
      isLoading,
      isAuthenticated,
      user: user ? { id: user.id, email: user.email } : null,
      role,
      allowedRoles,
      error: error?.message,
    });
  }, [isLoading, isAuthenticated, user, role, location.pathname, error, allowedRoles]);

  // Show loading state
  if (isLoading) {
    return <>{loadingComponent}</>;
  }

  // User not authenticated
  if (!isAuthenticated || !user) {
    console.log(`%c[ProtectedRoute] NOT AUTHENTICATED for ${location.pathname}. Redirecting to ${redirectPath}`, 'color: red; font-weight: bold;');
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // If we're still loading but past initial load, show a minimal loader
  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-journey-purple" />
      </div>
    );
  }

  // Handle errors but try to continue if we have a user
  if (error && !role) {
    console.error('[ProtectedRoute] Error:', error);
    // If we have a user but role fetch failed, try to continue with a default role
    if (user) {
      console.warn('[ProtectedRoute] Continuing with default role due to error');
      const fallbackRole = allowedRoles[0];
      if (fallbackRole) {
        return children ? <>{children}</> : <Outlet />;
      }
    }
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  const userRole = role;
  if (!userRole) {
    console.log(`%c[ProtectedRoute] ROLE NOT FOUND for ${location.pathname}.`, 'color: red; font-weight: bold;');
    const fallbackRole = allowedRoles[0];
    if (fallbackRole) {
      console.warn('[ProtectedRoute] Continuing with default role due to error');
    } else {
      console.error('[ProtectedRoute] No role available and no fallback role. Redirecting to unauthorized.');
      return <Navigate to={unauthorizedPath} state={{ from: location }} replace />;
    }
  }

  // Check if user's role is allowed
  if (userRole && allowedRoles && !allowedRoles.includes(userRole)) {
    console.log(`%c[ProtectedRoute] ROLE MISMATCH for ${location.pathname}. User role: '${userRole}', Allowed roles: [${allowedRoles.join(', ')}]. Redirecting to unauthorized.`, 'color: red; font-weight: bold;');
    return <Navigate to={unauthorizedPath} state={{ from: location }} replace />;
  }

  // User is authenticated and has an allowed role
  return children ? <>{children}</> : <Outlet />;
}

