import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserProfile } from '@/integrations/lib/auth/UserProfileProvider';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProtectedAccountingRouteProps {
  children: ReactNode;
  redirectPath?: string;
  loadingComponent?: ReactNode;
}

export function ProtectedAccountingRoute({
  children,
  redirectPath = '/unauthorized',
  loadingComponent = (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-journey-purple" />
      <p className="text-journey-darkBlue">Verifying accounting access...</p>
    </div>
  ),
}: ProtectedAccountingRouteProps) {
  const { profile, isLoading } = useUserProfile();
  const { toast } = useToast();
  const location = useLocation();
  
  // Show toast when access is denied
  useEffect(() => {
    if (!isLoading && profile && profile.accounting_access === false) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access the Accounting module. Please contact your administrator if you believe this is an error.',
        variant: 'destructive',
      });
    }
  }, [profile, isLoading, toast]);
  
  // If still loading, show loading component
  if (isLoading || !profile) {
    return <>{loadingComponent}</>;
  }

  // Check if user has accounting access
  const hasAccountingAccess = profile.accounting_access === true;
  
  // If user doesn't have accounting access, redirect to unauthorized page
  if (!hasAccountingAccess) {
    console.log(`[ProtectedAccountingRoute] User ${profile.id} does not have accounting access. Redirecting...`);
    return <Navigate to={redirectPath} state={{ 
      from: location,
      message: 'You do not have permission to access the Accounting module.',
      showBackButton: true
    }} replace />;
  }

  // If user has accounting access, render the children
  return <>{children}</>;
}
