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
  
  // Reset form state when modal is opened/closed or tab is changed
  useEffect(() => {
    console.log('[AuthModal] Modal visibility changed:', { isOpen, activeTab });
    
    if (isOpen) {
      // Reset form state when opening modal
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
      setRole('Clergy');
      setSelectedChurch('');
    }
  }, [isOpen, activeTab]);

  // Fetch churches when the modal opens and role is Parish
  useEffect(() => {
    async function fetchChurches() {
      if (isOpen && role === 'Parish') {
        setChurchesLoading(true);
        try {
          // Get unique churches from profiles where role='Clergy'
          const { data, error } = await supabase
            .from('profiles')
            .select('church_id, church_name')
            .eq('role', 'Clergy')
            .not('church_id', 'is', null)
            .not('church_name', 'is', null);
          
          if (error) {
            console.error('Error fetching churches:', error);
            return;
          }
          
          // Filter out any duplicates (by church_id)
          const uniqueChurches = data.filter((church, index, self) =>
            index === self.findIndex((c) => c.church_id === church.church_id)
          );
          
          setChurches(uniqueChurches);
        } catch (err) {
          console.error('Unexpected error fetching churches:', err);
        } finally {
          setChurchesLoading(false);
        }
      }
    }
    
    fetchChurches();
  }, [isOpen, role]);
  
  const [churchName, setChurchName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

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
        setFormError(error.message || 'Failed to create account. Please try again.');
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
            <ScrollArea className="h-[60vh] pr-4">
              <form onSubmit={handleSignUp} className="space-y-4">
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
                </div>
                
                {/* Church selection dropdown for Parish users */}
                {role === 'Parish' && (
                  <div className="space-y-2">
                    <Label htmlFor="churchSelect">Select Church <span className="text-red-500">*</span></Label>
                    <Select 
                      value={selectedChurch} 
                      onValueChange={setSelectedChurch}
                      disabled={isLoading || churchesLoading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={churchesLoading ? "Loading churches..." : "Select a church"} />
                      </SelectTrigger>
                      <SelectContent>
                        {churches.length > 0 ? (
                          churches.map((church) => (
                            <SelectItem key={church.church_id} value={church.church_id}>
                              {church.church_name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>
                            {churchesLoading ? "Loading..." : "No churches available"}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Associate your account with an existing church
                    </p>
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
