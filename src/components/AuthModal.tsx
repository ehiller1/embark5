import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// These imports are used in the commented-out form sections
// Keeping them to make it easier to restore the form fields if needed
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { useUserProfile } from '@/integrations/lib/auth/UserProfileProvider';

import { supabase } from '@/integrations/lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const { login, signup, isAuthenticated } = useAuth();
  const { hasProfile, isLoading: profileLoading } = useUserProfile();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  // These state variables are used in the commented-out form sections
  // Keeping them to maintain the component's functionality when form fields are restored
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [churches, setChurches] = useState<{ church_id: string; church_name: string }[]>([]);
  const [selectedChurch, setSelectedChurch] = useState<string>('');
  const [churchesLoading, setChurchesLoading] = useState(false);

  const [signinEmail, setSigninEmail] = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  // Default role is set to 'Clergy' and no longer selectable
  const [role, setRole] = useState<'Clergy' | 'Parish'>('Clergy');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [churchName, setChurchName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Close modal once authentication is complete and profile is loaded
  useEffect(() => {
    // When user is authenticated and has a profile (not loading), close the modal
    if (isAuthenticated && hasProfile && !profileLoading && isOpen) {
      console.log(`[AuthModal] Auth complete and profile loaded. Closing modal.`);
      toast({
        title: 'Signed in successfully',
        description: 'Welcome back!',
        duration: 3000,
      });
      onLoginSuccess?.();
      onClose();
    }
  }, [isAuthenticated, hasProfile, profileLoading, isOpen, onClose, toast, onLoginSuccess]);
  
  // Monitor auth state changes for debugging
  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`[AuthModal] [${timestamp}] Auth state updated:`, {
      isAuthenticated,
      hasProfile,
      profileLoading,
      isOpen,
      isLoading,
    });
  }, [isAuthenticated, hasProfile, profileLoading, isOpen, isLoading]);

  // Reset form when modal opens/closes or tab changes
  useEffect(() => {
    if (isOpen) {
      setFormError(null);
      setSigninEmail('');
      setSigninPassword('');
      setFirstName('');
      setLastName('');
      setPreferredName('');
      setEmail('');
      setPassword('');
      setAddress('');
      setCity('');
      setState('');
      setChurchName('');
      setPhone('');
      setSelectedChurch('');
      // Default role on signup
      if (activeTab === 'signup') setRole('Clergy');
    }
  }, [isOpen, activeTab]);
  // Fetch churches when opening signup as Parish
  useEffect(() => {
    if (!isOpen || activeTab !== 'signup' || role !== 'Parish') {
      setChurches([]);
      return;
    }

    const load = async () => {
      setChurchesLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('church_id,church_name')
          .not('church_id', 'is', null)
          .not('church_name', 'is', null);
        if (error) throw error;
        const map = new Map<string, string>();
        data?.forEach(c => {
          if (c.church_id && c.church_name) {
            map.set(c.church_id, c.church_name.trim());
          }
        });
        setChurches(Array.from(map.entries()).map(([church_id, church_name]) => ({ church_id, church_name })));
      } catch {
        // fallback test data
        setChurches([
          { church_id: 'test1', church_name: "St. Mary's Parish" },
          { church_id: 'test2', church_name: 'Grace Community Church' },
          { church_id: 'test3', church_name: 'First Baptist Church' }
        ]);
      } finally {
        setChurchesLoading(false);
      }
    };
    load();
  }, [isOpen, activeTab, role]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!signinEmail || !signinPassword) {
      setFormError('Please fill in all required fields');
      return;
    }
    setIsLoading(true);
    try {
      console.log('[AuthModal] Attempting login with email:', signinEmail);
      const { error, session } = await login(signinEmail, signinPassword);
      
      if (error) {
        console.error('[AuthModal] Login error:', error.message);
        setFormError(error.message || 'Invalid email or password');
        toast({ 
          title: 'Sign in failed', 
          description: error.message || 'Invalid email or password', 
          duration: 5000,
          variant: 'destructive'
        });
      } else {
        console.log('[AuthModal] Login successful, session established:', { 
          hasSession: !!session, 
          userId: session?.user?.id 
        });
        
        // Show toast with loading indicator
        toast({ 
          title: 'Sign in successful', 
          description: 'Loading your profile...', 
          duration: 3000 
        });
        
        // The new provider structure handles profile fetching automatically.
        // The useEffect hook will close the modal when the state is ready.
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.error('[AuthModal] Unexpected login error:', err);
      setFormError(errorMsg);
      toast({ 
        title: 'Authentication Error', 
        description: errorMsg, 
        duration: 5000,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!firstName || !lastName || !email || !password || !churchName || !address || !city || !state || !phone) {
      setFormError('Please fill in all required fields');
      return;
    }
    if (role === 'Parish' && !selectedChurch) {
      setFormError('Please select a church to associate with your account');
      return;
    }
    setIsLoading(true);
    const church_id = role === 'Clergy' ? uuidv4() : selectedChurch;
    
    try {
      console.log('[AuthModal] Attempting signup with email:', email, 'role:', role, 'church_id:', church_id);
      const { error, session, user } = await signup(email, password, {
        email, 
        firstName, 
        lastName, 
        preferredName, 
        churchName, 
        address, 
        city, 
        state, 
        phone, 
        role, 
        church_id,
      });
      
      if (error) {
        console.error('[AuthModal] Signup error:', error.message);
        setFormError(
          error.message.includes('registered') ?
            'An account with this email already exists.' :
            error.message
        );
        toast({ 
          title: 'Signup failed', 
          description: error.message.includes('registered') ? 
            'An account with this email already exists.' : 
            error.message, 
          duration: 5000,
          variant: 'destructive'
        });
      } else {
        console.log('[AuthModal] Signup successful:', { 
          hasSession: !!session, 
          userId: user?.id,
          userEmail: user?.email,
          role: role
        });
        
        toast({ 
          title: 'Account created!', 
          description: 'Setting up your profile...', 
          duration: 4000 
        });
        
        // The new provider structure handles profile fetching automatically.
        // The useEffect hook will close the modal when the state is ready.
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.error('[AuthModal] Unexpected signup error:', err);
      setFormError(errorMsg);
      toast({ 
        title: 'Signup Error', 
        description: errorMsg, 
        duration: 5000,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            {activeTab === 'signin' ? 'Sign In to Your Account' : 'Create a New Account'}
          </DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "signin" | "signup")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          {/* Sign In Tab */}
          <TabsContent value="signin" className="mt-6">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="your@email.com"
                  value={signinEmail}
                  onChange={(e) => setSigninEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="••••••••"
                  value={signinPassword}
                  onChange={(e) => setSigninPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              {formError && (
                <div className="text-sm text-red-500">
                  {formError}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : 'Sign In'}
              </Button>
            </form>
          </TabsContent>

          {/* Sign Up Tab */}
          <TabsContent value="signup" className="mt-6">
            <ScrollArea className="h-[60vh] pr-4 overflow-visible">
              <form onSubmit={handleSignUp} className="space-y-4 overflow-visible">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferredName">Preferred Name</Label>
                  <Input
                    id="preferredName"
                    type="text"
                    placeholder="How you'd like to be addressed (optional)"
                    value={preferredName}
                    onChange={(e) => setPreferredName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                {/* Role selection commented out - default is 'Clergy' */}
                {/* <div className="space-y-2">
                  <Label>Role <span className="text-red-500">*</span></Label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="role"
                        value="Clergy"
                        checked={role === 'Clergy'}
                        onChange={() => setRole('Clergy')}
                        disabled={isLoading}
                        required
                      />
                      <span className="ml-2">Clergy</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="role"
                        value="Parish"
                        checked={role === 'Parish'}
                        onChange={() => setRole('Parish')}
                        disabled={isLoading}
                        required
                      />
                      <span className="ml-2">Parish</span>
                    </label>
                  </div>
                </div> */}
                {/* Church selection dropdown for Parish users - commented out */}
                {/* {role === 'Parish' && (
                  <div className="space-y-2 relative z-50">
                    <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-300 shadow-md">
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="churchSelect" className="block text-sm font-medium text-gray-700">
                          Select Church <span className="text-red-500">*</span>
                        </Label>
                        <span className="text-xs text-blue-600 bg-white px-2 py-1 rounded font-semibold">
                          {churches.length} churches available
                        </span>
                      </div>
                      <div className="relative z-50">
                        <Select 
                          value={selectedChurch} 
                          onValueChange={setSelectedChurch}
                          disabled={isLoading || churchesLoading}
                        >
                          <SelectTrigger className="w-full bg-white border-2 border-blue-400 rounded-md shadow-sm py-2 px-3 text-base hover:border-blue-500 focus:border-blue-600">
                            <SelectValue placeholder={churchesLoading ? "Loading churches..." : "Select a church"} />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-2 border-gray-300 rounded-md shadow-xl max-h-60 overflow-auto z-[9999] relative">
                            {churchesLoading ? (
                              <div className="px-4 py-2 text-sm text-gray-500">
                                Loading churches...
                              </div>
                            ) : churches.length > 0 ? (
                              churches.map((church) => (
                                <SelectItem 
                                  key={church.church_id} 
                                  value={church.church_id}
                                  className="px-4 py-2 hover:bg-blue-100 cursor-pointer text-sm"
                                >
                                  {church.church_name}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="px-4 py-2 text-sm text-gray-500">
                                No churches available
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )} */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="churchName">Church/Organization Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="churchName"
                    type="text"
                    placeholder="your church, faith community or organization name"
                    value={churchName}
                    onChange={(e) => setChurchName(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address <span className="text-red-500">*</span></Label>
                  <Input
                    id="address"
                    type="text"
                    placeholder="123 Main St"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City <span className="text-red-500">*</span></Label>
                    <Input
                      id="city"
                      type="text"
                      placeholder="your town"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State <span className="text-red-500">*</span></Label>
                    <Input
                      id="state"
                      type="text"
                      placeholder="your state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(123) 456-7890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                {formError && (
                  <div className="text-sm text-red-500">
                    {formError}
                  </div>
                )}
                <Button type="submit" className="w-full mt-4" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : 'Create Account'}
                </Button>
              </form>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
