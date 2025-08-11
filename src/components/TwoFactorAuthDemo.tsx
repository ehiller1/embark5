import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, Smartphone, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { shouldGrantClergyAccess } from '@/config/demoConfig';

interface TwoFactorAuthDemoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userRole?: string;
}

export function TwoFactorAuthDemo({ isOpen, onClose, onSuccess, userRole }: TwoFactorAuthDemoProps) {
  const [step, setStep] = useState<'setup' | 'verify' | 'success'>('setup');
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(30);

  // Demo 2FA code for demonstration purposes
  const DEMO_CODE = '123456';

  // Only show 2FA demo for clergy users when demo mode is enabled
  const shouldShow = userRole === 'Clergy' && shouldGrantClergyAccess();

  useEffect(() => {
    if (step === 'setup' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, countdown]);

  const handleSetup = () => {
    setStep('verify');
    setCountdown(30);
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    setError('');

    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (code === DEMO_CODE) {
      setStep('success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } else {
      setError('Invalid code. For demo purposes, use: 123456');
    }

    setIsVerifying(false);
  };

  const handleResendCode = () => {
    setCountdown(30);
    setError('');
    // In a real implementation, this would trigger a new SMS/email
  };

  if (!shouldShow || !isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Two-Factor Authentication Demo
          </DialogTitle>
          <DialogDescription>
            Enhanced security demonstration for Clergy users in demo mode
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Badge variant="outline" className="w-fit">
            <Shield className="h-3 w-3 mr-1" />
            Demo Mode Active
          </Badge>

          {step === 'setup' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Setup Two-Factor Authentication
                </CardTitle>
                <CardDescription>
                  Secure your account with an additional layer of protection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Demo Mode:</strong> In production, you would scan a QR code with your authenticator app or receive an SMS code.
                  </AlertDescription>
                </Alert>

                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="w-32 h-32 bg-gray-200 mx-auto mb-3 rounded flex items-center justify-center">
                    <span className="text-gray-500 text-sm">QR Code Placeholder</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Scan this QR code with your authenticator app
                  </p>
                </div>

                <Button onClick={handleSetup} className="w-full">
                  Continue to Verification
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 'verify' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Enter Verification Code</CardTitle>
                <CardDescription>
                  Enter the 6-digit code from your authenticator app
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Demo Code:</strong> Use <code className="bg-gray-100 px-1 rounded">123456</code> for this demonstration
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                  {error && (
                    <p className="text-sm text-red-600">{error}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleVerify} 
                    disabled={code.length !== 6 || isVerifying}
                    className="flex-1"
                  >
                    {isVerifying ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify Code'
                    )}
                  </Button>
                </div>

                <div className="text-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleResendCode}
                    disabled={countdown > 0}
                  >
                    {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'success' && (
            <Card>
              <CardContent className="pt-6 text-center space-y-4">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-green-700">
                    2FA Setup Complete!
                  </h3>
                  <p className="text-gray-600">
                    Your account is now secured with two-factor authentication
                  </p>
                </div>
                <Badge variant="default" className="bg-green-500">
                  Enhanced Security Active
                </Badge>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
