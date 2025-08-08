import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, ArrowLeft } from 'lucide-react';
import { useUserProfile } from '@/integrations/lib/auth/UserProfileProvider';

const AccountingLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { profile, isLoading: profileLoading } = useUserProfile();
  
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [demoStep, setDemoStep] = useState<'initial' | 'authenticating' | 'verifying' | 'complete'>('initial');
  const [demoMessage, setDemoMessage] = useState('');

  // Redirect if user doesn't have accounting access permission
  useEffect(() => {
    if (!profileLoading && profile && profile.accounting_access !== true) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access the Accounting module. Please contact your administrator.',
        variant: 'destructive',
      });
      navigate('/clergy-home');
    }
  }, [profile, profileLoading, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Demo simulation of two-factor authentication process
      setDemoStep('authenticating');
      setDemoMessage('🔐 Verifying primary credentials...');
      
      // Simulate first authentication step
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setDemoStep('verifying');
      setDemoMessage('🛡️ Performing secondary authentication...');
      
      // Simulate second authentication step
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, accept any non-empty password
      if (!password.trim()) {
        throw new Error('Please enter a password for the demo');
      }

      setDemoStep('complete');
      setDemoMessage('✅ Two-factor authentication successful!');
      
      // Brief pause to show success message
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Store accounting session in sessionStorage (expires when browser closes)
      sessionStorage.setItem('accounting_authenticated', 'true');
      sessionStorage.setItem('accounting_auth_time', Date.now().toString());

      toast({
        title: 'Demo: Accounting Access Granted',
        description: 'Two-factor authentication simulation completed successfully.',
      });

      // Navigate to accounting page
      const from = location.state?.from?.pathname || '/accounting';
      navigate(from, { replace: true });

    } catch (error) {
      console.error('Demo authentication error:', error);
      setError(error instanceof Error ? error.message : 'Authentication failed');
      setDemoStep('initial');
      setDemoMessage('');
      toast({
        title: 'Demo Authentication Failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/clergy-home');
  };

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-journey-purple" />
        <p className="text-journey-darkBlue">Verifying permissions...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-journey-lightBlue/20 to-journey-purple/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-journey-purple/10 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-journey-purple" />
          </div>
          <CardTitle className="text-2xl font-serif text-journey-darkBlue">
            {demoStep === 'initial' ? 'Demo: Accounting Access' : 'Two-Factor Authentication'}
          </CardTitle>
          <CardDescription className="text-journey-darkBlue/70">
            {demoStep === 'initial' 
              ? 'Demo simulation of two-factor authentication for accounting access.' 
              : 'Simulating enhanced security verification process...'}
          </CardDescription>
          {demoStep !== 'initial' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-800">{demoMessage}</p>
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="accounting-password" className="text-journey-darkBlue font-medium">
                Demo Password
              </Label>
              <Input
                id="accounting-password"
                type="password"
                placeholder="Enter any password for demo"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                className="w-full"
              />
              <p className="text-xs text-journey-darkBlue/60">
                For demo purposes, enter any password to simulate two-factor authentication.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <Button 
                type="submit" 
                className="w-full bg-journey-purple hover:bg-journey-purple/90" 
                disabled={isLoading || !password.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {demoStep === 'authenticating' && 'Verifying Primary...'}
                    {demoStep === 'verifying' && 'Secondary Auth...'}
                    {demoStep === 'complete' && 'Success!'}
                    {demoStep === 'initial' && 'Authenticating...'}
                  </>
                ) : (
                  'Start Demo Authentication'
                )}
              </Button>

              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={handleBack}
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
            <h4 className="text-sm font-medium text-amber-800 mb-2">🎭 Demo Mode</h4>
            <p className="text-xs text-amber-700">
              This is a simulation of two-factor authentication for demonstration purposes. 
              In production, this would involve real security verification steps and secure password validation.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountingLogin;
