import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserProfile } from '@/integrations/lib/auth/UserProfileProvider';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AccountingAuthGuardProps {
  children: ReactNode;
  loadingComponent?: ReactNode;
}

export function AccountingAuthGuard({
  children,
  loadingComponent = (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-journey-purple" />
      <p className="text-journey-darkBlue">Verifying accounting access...</p>
    </div>
  ),
}: AccountingAuthGuardProps) {
  const { profile, isLoading } = useUserProfile();
  const { toast } = useToast();
  const location = useLocation();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user has accounting session
  const hasAccountingSession = () => {
    const authFlag = sessionStorage.getItem('accounting_authenticated');
    const authTime = sessionStorage.getItem('accounting_auth_time');
    
    if (!authFlag || !authTime) {
      return false;
    }

    // Check if session is still valid (24 hours)
    const authTimestamp = parseInt(authTime);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    if (now - authTimestamp > twentyFourHours) {
      // Session expired, clear it
      sessionStorage.removeItem('accounting_authenticated');
      sessionStorage.removeItem('accounting_auth_time');
      return false;
    }

    return true;
  };

  useEffect(() => {
    if (!isLoading) {
      setIsCheckingAuth(false);
    }
  }, [isLoading]);

  // Show loading while checking authentication
  if (isLoading || isCheckingAuth) {
    return <>{loadingComponent}</>;
  }

  // Check if user has accounting access permission
  if (!profile || profile.accounting_access !== true) {
    toast({
      title: 'Access Denied',
      description: 'You do not have permission to access the Accounting module. Please contact your administrator.',
      variant: 'destructive',
    });
    return <Navigate to="/clergy-home" replace />;
  }

  // Check if user has completed accounting authentication
  if (!hasAccountingSession()) {
    console.log('[AccountingAuthGuard] No valid accounting session found. Redirecting to accounting login.');
    return <Navigate 
      to="/accounting-login" 
      state={{ from: location }} 
      replace 
    />;
  }

  // User has both permissions and accounting authentication
  return <>{children}</>;
}
