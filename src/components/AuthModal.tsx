import { useState, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Import from the new auth provider
import { useAuth } from "@/integrations/lib/auth/AuthProvider";
import { supabase } from "@/integrations/lib/supabase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  console.log('[AuthModal] Rendering modal with isOpen:', isOpen);
  
  const [activeTab, setActiveTab] = useState<string>("signin");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [churches, setChurches] = useState<{ church_id: string; church_name: string }[]>([]);
  const [selectedChurch, setSelectedChurch] = useState<string>("");
  const [churchesLoading, setChurchesLoading] = useState<boolean>(false);
  
  // Define all state variables at the top, before they are used in useEffect
  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'Clergy' | 'Parish'>('Clergy');
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [churchName, setChurchName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  
  const { toast } = useToast();
  const { login, signup, isAuthenticated } = useAuth();
  
  // Log role changes
  useEffect(() => {
    console.log('[AuthModal] Role changed:', role);
  }, [role]);

  // Reset form state when modal is opened/closed or tab is changed
  useEffect(() => {
    console.log('[AuthModal] Modal visibility changed:', { isOpen, activeTab, role });
    
    if (isOpen) {
      // Reset form state when opening modal, but preserve role if just switching tabs
      setFormError(null);
      setSigninEmail('');
      setSigninPassword('');
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setAddress('');
      setCity('');
      setState('');
      setChurchName('');
      setPhone('');
      setSelectedChurch('');
    }
  }, [isOpen]); // Remove activeTab dependency to prevent role reset on tab switch

  // Initialize role when modal first opens
  useEffect(() => {
    if (isOpen && activeTab === 'signup') {
      setRole('Clergy'); // Set default role only when signup tab is active
    }
  }, [isOpen, activeTab]);

  // Separate effect for tab changes that doesn't reset role
  useEffect(() => {
    if (isOpen) {
      setFormError(null);
    }
  }, [activeTab]);

  // Fetch churches when the modal opens and role is Parish
  useEffect(() => {
    async function fetchChurches() {
      console.log('[AuthModal] fetchChurches called', { isOpen, role });
      if (isOpen && role === 'Parish') {
        console.log('[AuthModal] Starting to fetch churches...');
        setChurchesLoading(true);
        
        // Fetch from Supabase
        try {
          console.log('[AuthModal] Executing Supabase query...');
          
          // First, let's see what data exists in the profiles table
          console.log('[AuthModal] Diagnostic: Checking all profiles data...');
          const { data: allProfiles, error: allError } = await supabase
            .from('profiles')
            .select('id, church_id, church_name, role')
            .limit(10);
          
          console.log('[AuthModal] All profiles sample:', allProfiles);
          console.log('[AuthModal] All profiles error:', allError);
          
          // Check profiles with church_id
          const { data: withChurchId, error: churchIdError } = await supabase
            .from('profiles')
            .select('id, church_id, church_name, role')
            .not('church_id', 'is', null)
            .limit(10);
          
          console.log('[AuthModal] Profiles with church_id:', withChurchId);
          
          // Check profiles with church_name
          const { data: withChurchName, error: churchNameError } = await supabase
            .from('profiles')
            .select('id, church_id, church_name, role')
            .not('church_name', 'is', null)
            .limit(10);
          
          console.log('[AuthModal] Profiles with church_name:', withChurchName);
          
          // Original query
          const { data, error, status } = await supabase
            .from('profiles')
            .select('church_id, church_name')
            .not('church_id', 'is', null)
            .not('church_name', 'is', null);
          
          console.log('[AuthModal] Supabase response:', { data, error, status });
          
          if (error) {
            console.error('Error fetching churches:', error);
            // Fallback to test data only if there's an error
            console.log('[AuthModal] Using fallback test churches due to error');
            const testChurches = [
              { church_id: 'test1', church_name: 'St. Mary\'s Parish' },
              { church_id: 'test2', church_name: 'Grace Community Church' },
              { church_id: 'test3', church_name: 'First Baptist Church' },
            ];
            setChurches(testChurches);
            setChurchesLoading(false);
            return;
          }
          
          // If no data found, use test data for now
          if (!data || data.length === 0) {
            console.log('[AuthModal] No church data found in database, using test data');
            const testChurches = [
              { church_id: 'test1', church_name: 'St. Mary\'s Parish' },
              { church_id: 'test2', church_name: 'Grace Community Church' },
              { church_id: 'test3', church_name: 'First Baptist Church' },
            ];
            setChurches(testChurches);
            setChurchesLoading(false);
            return;
          }
          
          // Get distinct church names (normalize by removing dots and converting to lowercase for comparison)
          const uniqueChurches = data.reduce((acc: { church_id: string; church_name: string }[], current) => {
            const normalizedName = current.church_name?.toLowerCase().replace(/\./g, '') || '';
            const exists = acc.some(church => 
              church.church_name?.toLowerCase().replace(/\./g, '') === normalizedName
            );
            
            if (!exists && current.church_name) {
              acc.push({
                church_id: current.church_id || '',
                church_name: current.church_name
              });
            }
            return acc;
          }, []);
          
          console.log('[AuthModal] Unique churches found:', uniqueChurches);
          setChurches(uniqueChurches);
        } catch (err) {
          console.error('Unexpected error fetching churches:', err);
          // Fallback to test data on unexpected error
          console.log('[AuthModal] Using fallback test churches due to unexpected error');
          const testChurches = [
            { church_id: 'test1', church_name: 'St. Mary\'s Parish' },
            { church_id: 'test2', church_name: 'Grace Community Church' },
            { church_id: 'test3', church_name: 'First Baptist Church' },
          ];
          setChurches(testChurches);
        } finally {
          console.log('[AuthModal] Finished loading churches');
          setChurchesLoading(false);
        }
      } else {
        console.log('[AuthModal] Not fetching churches - condition not met', { isOpen, role });
        // Clear churches when role is not Parish
        if (role !== 'Parish') {
          setChurches([]);
          setSelectedChurch('');
        }
      }
    }
    
    fetchChurches();
  }, [isOpen, role]);

  useEffect(() => {
    if (role === 'Parish') {
      console.log('[AuthModal] Rendering church dropdown - role:', role, 'churches:', churches.length);
    }
  }, [role, churches.length]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Basic validation
    if (!signinEmail || !signinPassword) {
      setFormError('Please fill in all required fields');
      return;
    }
    
    console.log('[AuthModal] Sign in attempt with email:', signinEmail);
    setIsLoading(true);
    
    try {
      console.log('[AuthModal] Calling login function');
      const { error } = await login(signinEmail, signinPassword);
      
      if (error) {
        console.error('[AuthModal] Login error:', error);
        setFormError(error.message || 'Invalid email or password');
        return;
      }
      
      console.log('[AuthModal] Login successful, closing modal');
      
      // Don't check isAuthenticated immediately - wait for auth state to properly update
      // The auth state change listener in AuthProvider will handle the state update
      toast({
        title: "Sign in successful!",
        description: "Welcome back to your journey.",
      });
      
      // Close the modal immediately - the auth state change will happen asynchronously
      onClose();
    } catch (err) {
      console.error('[AuthModal] Unexpected error during login:', err);
      setFormError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Basic validation - now all fields are required
    if (!firstName || !lastName || !email || !password || !churchName || !address || !city || !state || !phone || !role) {
      setFormError('Please fill in all required fields');
      return;
    }
    
    // Validate church selection for Parish users
    if (role === 'Parish' && !selectedChurch) {
      setFormError('Please select a church to associate with your account');
      return;
    }
    
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long');
      return;
    }
    
    console.log('[AuthModal] Sign up attempt with email:', email);
    setIsLoading(true);
    
    let churchId: string | undefined = undefined;
    if (role === 'Clergy') {
      // Generate new church_id for Clergy users
      churchId = uuidv4();
    } else if (role === 'Parish') {
      // Use selected church_id for Parish users
      churchId = selectedChurch;
    }

    const userData: any = {
      firstName,
      lastName,
      email,
      password,
      churchName,
      address,
      city,
      state,
      phone,
      role
    };
    if (churchId) {
      userData.church_id = churchId;
    }
    
    try {
      console.log('[AuthModal] Calling signup function');
      const { error } = await signup(email, password, userData);
      
      if (error) {
        console.error('[AuthModal] Signup error:', error);
        
        // Handle specific error types with better user messaging
        if (error.message?.includes('User already registered') || 
            error.message?.includes('already been registered') ||
            error.message?.includes('422')) {
          setFormError('An account with this email address already exists. Please sign in instead or use a different email address.');
        } else if (error.message?.includes('Invalid email')) {
          setFormError('Please enter a valid email address.');
        } else if (error.message?.includes('Password')) {
          setFormError('Password must be at least 6 characters long.');
        } else if (error.message?.includes('email rate limit')) {
          setFormError('Too many signup attempts. Please wait a few minutes before trying again.');
        } else {
          setFormError(error.message || 'Failed to create account. Please try again.');
        }
        return;
      }
      
      console.log('[AuthModal] Signup successful, checking authentication state...');
      
      // Wait a moment for auth state to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (isAuthenticated) {
        console.log('[AuthModal] User is authenticated after signup, closing modal');
        toast({
          title: "Account created!",
          description: "Your account has been successfully created.",
        });
        onClose();
      } else {
        console.warn('[AuthModal] Signup successful but user is not authenticated');
        // Even if not immediately authenticated, we can still close the modal
        // as the user might need to verify their email first
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
        onClose();
      }
    } catch (err) {
      console.error('[AuthModal] Unexpected error during signup:', err);
      setFormError('An unexpected error occurred. Please try again.');
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
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
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
                  <Label>Role <span className="text-red-500">*</span></Label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="role"
                        value="Clergy"
                        checked={role === 'Clergy'}
                        onChange={() => {
                          console.log('[AuthModal] Role changed to Clergy');
                          setRole('Clergy');
                        }}
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
                        onChange={() => {
                          console.log('[AuthModal] Role changed to Parish');
                          setRole('Parish');
                        }}
                        disabled={isLoading}
                        required
                      />
                      <span className="ml-2">Parish</span>
                    </label>
                  </div>
                </div>
                
                {/* Church selection dropdown for Parish users */}
                {role === 'Parish' && (
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
                )}
                
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
                    placeholder="your church name"
                    value={churchName}
                    onChange={(e) => setChurchName(e.target.value)}
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
