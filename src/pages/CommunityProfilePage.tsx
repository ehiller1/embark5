import React, { useState, useEffect, ChangeEvent } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { useChurchProfile } from '@/hooks/useChurchProfile';
import { supabase } from '@/integrations/supabase/client';

import { UploadCloud, Link, CheckCircle, AlertCircle, Database, Loader2, Info, Lightbulb, Users, Save } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';

import { ReactElement } from 'react';

const CommunityProfilePage = (): ReactElement => {
  const { toast } = useToast();
  useUserRole();
  const { profile, churchId, loading: profileLoading, saving, error: profileError, saveChurchProfile, uploadChurchData } = useChurchProfile();

  const [accomplishDescription, setAccomplishDescription] = useState('');
  const [communityDescription, setCommunityDescription] = useState('');
  const [dreamDescription, setDreamDescription] = useState('');
  const [activeMembers, setActiveMembers] = useState('');
  const [pledgingMembers, setPledgingMembers] = useState('');
  const [emailListFile, setEmailListFile] = useState<File | null>(null);
  const [parochialReportFile, setParochialReportFile] = useState<File | null>(null);

  // Realm Integration States
  const [realmModalOpen, setRealmModalOpen] = useState(false);
  const [realmUsername, setRealmUsername] = useState('');
  const [realmPassword, setRealmPassword] = useState('');
  const [realmApiKey, setRealmApiKey] = useState('');
  const [realmIntegrationStep, setRealmIntegrationStep] = useState(0);
  const [realmIntegrationProgress, setRealmIntegrationProgress] = useState(0);
  const [syncOptions, setSyncOptions] = useState({
    members: true,
    groups: true,
    events: true,
    contributions: false,
  });
  const [realmIntegrationStatus, setRealmIntegrationStatus] = useState<'idle' | 'connecting' | 'syncing' | 'completed' | 'error'>('idle');
  const [realmError, setRealmError] = useState<string | null>(null);
  
  // Type assertion to work around missing table types in Supabase
  const supabaseAny = supabase as any;
  
  // Display error message if profile error occurs
  useEffect(() => {
    if (profileError) {
      toast({
        title: 'Error',
        description: `Failed to load church profile: ${profileError}`,
        variant: 'destructive',
      });
    }
  }, [profileError, toast]);

  // Update form state when profile data loads
  useEffect(() => {
    if (profile) {
      setAccomplishDescription(profile.accomplish || '');
      setCommunityDescription(profile.community_description || '');
      setDreamDescription(profile.dream || '');
      setActiveMembers(profile.number_of_active_members?.toString() || '');
      setPledgingMembers(profile.number_of_pledging_members?.toString() || '');
    }
  }, [profile]);

  useEffect(() => {
    if (!churchId) return; // Only load from localStorage if churchId is known, to scope data
    const savedAccomplish = localStorage.getItem(`cp_accomplish_${churchId}`);
    const savedCommunity = localStorage.getItem(`cp_community_${churchId}`);
    const savedDream = localStorage.getItem(`cp_dream_${churchId}`);
    const savedActiveMembers = localStorage.getItem(`cp_activeMembers_${churchId}`);
    const savedPledgingMembers = localStorage.getItem(`cp_pledgingMembers_${churchId}`);

    if (savedAccomplish) setAccomplishDescription(savedAccomplish);
    if (savedCommunity) setCommunityDescription(savedCommunity);
    if (savedDream) setDreamDescription(savedDream);
    if (savedActiveMembers) setActiveMembers(savedActiveMembers);
    if (savedPledgingMembers) setPledgingMembers(savedPledgingMembers);
  }, [churchId]);

  const handleInputChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    storageKeySuffix: string
  ) => (e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const value = e.target.value;
    setter(value);
    if (churchId) {
      localStorage.setItem(`cp_${storageKeySuffix}_${churchId}`, value);
    }
  };

  const handleFileChange = (setFileState: React.Dispatch<React.SetStateAction<File | null>>) => 
    (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files.length > 0) {
        setFileState(event.target.files[0]);
      }
  };

  const handleSave = async () => {
    if (!churchId) {
      toast({ title: "Error", description: "Church ID is missing. Cannot save. Please ensure your user profile is correctly associated with a church.", variant: "destructive" });
      return;
    }

    try {
      // Save profile data
      const profileResult = await saveChurchProfile({
        church_id: churchId,
        community_description: communityDescription,
        accomplish: accomplishDescription,
        dream: dreamDescription,
        number_of_active_members: activeMembers ? parseInt(activeMembers) : null,
        number_of_pledging_members: pledgingMembers ? parseInt(pledgingMembers) : null,
      });

      if (profileResult.success) {
        // Clear localStorage for this church after successful save to DB
        localStorage.removeItem(`cp_accomplish_${churchId}`);
        localStorage.removeItem(`cp_community_${churchId}`);
        localStorage.removeItem(`cp_dream_${churchId}`);
        localStorage.removeItem(`cp_activeMembers_${churchId}`);
        localStorage.removeItem(`cp_pledgingMembers_${churchId}`);
      }

      // Upload email list if available
      if (emailListFile) {
        const emailResult = await uploadChurchData('email_list_upload', emailListFile);
        if (emailResult.success) {
          setEmailListFile(null); // Clear file input state
        }
      }

      // Upload parochial report if available
      if (parochialReportFile) {
        const reportResult = await uploadChurchData('parochial_report_upload', parochialReportFile);
        if (reportResult.success) {
          setParochialReportFile(null); // Clear file input state
        }
      }

    } catch (error) {
      console.error('Error saving profile or uploading documents:', error);
      toast({ title: "Error", description: error instanceof Error ? error.message : 'An unknown error occurred', variant: "destructive" });
    }
  };

  // Realm Integration Handlers
  const handleRealmOpen = () => {
    setRealmModalOpen(true);
  }

  // Reset Realm state variables to initial values
  const resetRealmState = () => {
    setRealmUsername('');
    setRealmPassword('');
    setRealmApiKey('');
    setRealmIntegrationStep(0);
    setRealmIntegrationProgress(0);
    setRealmIntegrationStatus('idle');
    setRealmError(null);
    setSyncOptions({
      members: true,
      groups: true,
      events: true,
      contributions: false,
    });
  };
  
  // This handles controlled closing of the modal
  const handleRealmClose = (open: boolean) => {
    // Only process if we're closing the modal
    if (!open) {
      // Reset state if the user was in the middle of an integration
      if (realmIntegrationStatus === 'connecting' || realmIntegrationStatus === 'syncing') {
        // Ask for confirmation before canceling
        if (window.confirm('Are you sure you want to cancel the integration? Progress will be lost.')) {
          resetRealmState();
          setRealmModalOpen(false);
        }
        // Don't close if they cancel - keep modal open
        return;
      } else {
        resetRealmState();
        setRealmModalOpen(false);
      }
    }
  };

  // Handle checkbox changes for sync options
  const handleSyncOptionChange = (option: keyof typeof syncOptions) => {
    setSyncOptions({ ...syncOptions, [option]: !syncOptions[option] });
  };

  // Simulate Realm API integration
  const simulateRealmIntegration = async () => {
    try {
      // Step 1: Connecting to Realm API
      setRealmIntegrationStatus('connecting');
      setRealmIntegrationStep(1);
      setRealmIntegrationProgress(10);

      // Simulate API connection delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate validation of credentials
      if (!realmUsername || !realmPassword) {
        throw new Error('Invalid Realm credentials. Please check your username and password.');
      }

      setRealmIntegrationProgress(30);

      // Step 2: Validating API Key
      setRealmIntegrationStep(2);
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (!realmApiKey || realmApiKey.length < 8) {
        throw new Error('Invalid API key. Please check your API key and try again.');
      }

      setRealmIntegrationProgress(50);
      setRealmIntegrationStatus('syncing');

      // Step 3: Fetching data from Realm
      setRealmIntegrationStep(3);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setRealmIntegrationProgress(70);

      // Step 4: Processing and importing data
      setRealmIntegrationStep(4);
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate data import based on selected options
      let importedItems = 0;
      if (syncOptions.members) importedItems += Math.floor(Math.random() * 50) + 20; // 20-70 members
      if (syncOptions.groups) importedItems += Math.floor(Math.random() * 10) + 5;  // 5-15 groups
      if (syncOptions.events) importedItems += Math.floor(Math.random() * 15) + 3;  // 3-18 events
      if (syncOptions.contributions) importedItems += Math.floor(Math.random() * 100) + 50; // 50-150 contributions

      setRealmIntegrationProgress(100);
      setRealmIntegrationStatus('completed');

      // Record the integration in the database
      if (churchId) {
        await supabaseAny
          .from('integration_logs')
          .insert({
            church_id: churchId,
            integration_type: 'realm_acs',
            items_imported: importedItems,
            integration_date: new Date().toISOString(),
            sync_options: syncOptions
          });
      }

      toast({ 
        title: "Integration Successful", 
        description: `Successfully imported ${importedItems} items from Realm.`,
      });

      // Delay before closing to show the success state
      setTimeout(() => {
        handleRealmClose(false);
      }, 3000);

    } catch (error) {
      setRealmIntegrationStatus('error');
      setRealmError(error instanceof Error ? error.message : 'An unknown error occurred');
      toast({ 
        title: "Integration Failed", 
        description: error instanceof Error ? error.message : 'Failed to connect to Realm API',
        variant: "destructive"
      });
    }
  };

  const handleRealmConnect = () => {
    simulateRealmIntegration();
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <header className="mb-10 pb-6 border-b border-gray-200">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl gradient-text">
            Your Church & Community Profile
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl">
            This information helps us tailor the discernment journey to your unique context. 
            Your entries are saved locally as you type and will be submitted when you click 'Save Community Profile'.
          </p>
          {profileLoading && (
            <div className="mt-4 flex items-center text-blue-600">
              <Loader2 className="animate-spin mr-2 h-5 w-5" />
              <span>Loading your profile data...</span>
            </div>
          )}
        </header>
        
        {!churchId && (
          <Card className="mb-8 border-yellow-400 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center text-yellow-700">
                <Info className="mr-3 h-6 w-6" /> Important Notice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-yellow-700">
                We couldn't retrieve a Church ID for your profile. This is needed to save your information.
                Please ensure your user account is correctly associated with a church in the system. 
                If this issue persists, please contact support.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-10 max-w-3xl mx-auto">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl font-semibold">
                <Lightbulb className="mr-3 h-7 w-7 text-primary" /> Community Insights
              </CardTitle>
              <CardDescription className="text-md">
                Describe your church's aspirations and the unique characteristics of your surrounding community.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div>
                <Label htmlFor="accomplish" className="text-md font-medium">What does your church hope to accomplish?</Label>
                <Textarea
                  id="accomplish"
                  value={accomplishDescription}
                  onChange={handleInputChange(setAccomplishDescription, 'accomplish')}
                  placeholder="e.g., Deepen spiritual growth, expand outreach programs, foster a more inclusive environment..."
                  rows={4}
                  className="mt-2 text-base border-gray-300 focus:border-primary focus:ring-primary"
                />
              </div>
              <div>
                <Label htmlFor="community" className="text-md font-medium">Tell us about your community</Label>
                <Textarea
                  id="community"
                  value={communityDescription}
                  onChange={handleInputChange(setCommunityDescription, 'community')}
                  placeholder="e.g., Key demographics, local industries, significant challenges, unique cultural aspects, existing community partnerships..."
                  rows={6}
                  className="mt-2 text-base border-gray-300 focus:border-primary focus:ring-primary"
                />
              </div>
              <div>
                <Label htmlFor="dream" className="text-md font-medium">Describe your hopes and dreams for this process, and your church</Label>
                <Textarea
                  id="dream"
                  value={dreamDescription}
                  onChange={handleInputChange(setDreamDescription, 'dream')}
                  placeholder="e.g., Our dreams include becoming a spiritual hub for the community, developing meaningful youth programs, expanding our outreach services..."
                  rows={6}
                  className="mt-2 text-base border-gray-300 focus:border-primary focus:ring-primary"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl font-semibold">
                <Users className="mr-3 h-7 w-7 text-primary" /> Membership Details
              </CardTitle>
              <CardDescription className="text-md">
                Provide a snapshot of your church's active membership.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 pt-4">
              <div>
                <Label htmlFor="activeMembers" className="text-md font-medium">Active Members</Label>
                <Input
                  id="activeMembers"
                  type="number"
                  value={activeMembers}
                  onChange={handleInputChange(setActiveMembers, 'activeMembers')}
                  placeholder="e.g., 150"
                  className="mt-2 text-base border-gray-300 focus:border-primary focus:ring-primary"
                />
              </div>
              <div>
                <Label htmlFor="pledgingMembers" className="text-md font-medium">Pledging Units/Members</Label>
                <Input
                  id="pledgingMembers"
                  type="number"
                  value={pledgingMembers}
                  onChange={handleInputChange(setPledgingMembers, 'pledgingMembers')}
                  placeholder="e.g., 100"
                  className="mt-2 text-base border-gray-300 focus:border-primary focus:ring-primary"
                />
              </div>
            </CardContent>
          </Card>



          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle>
                <div className="flex items-center">
                  <Database className="mr-2 h-5 w-5 text-blue-500" />
                  ACS Realm Integration
                </div>
              </CardTitle>
              <CardDescription>
                Connect your ACS Realm account to import member data, groups, events, and more.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground mb-4">
                Connecting to Realm allows you to keep your community data synchronized. Import your member list, groups, and events in a few clicks.
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={handleRealmOpen}
                variant="outline">
                <Link className="mr-2 h-4 w-4" />
                Integrate with Realm
              </Button>
            </CardFooter>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl font-semibold">
                <UploadCloud className="mr-3 h-7 w-7 text-primary" /> Document Uploads
              </CardTitle>
              <CardDescription className="text-md">
                Share relevant documents. These are optional but can provide valuable context (e.g., email lists for communication, parochial reports for historical data).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div>
                <Label htmlFor="emailListFile" className="text-md font-medium">Email List (.csv, .txt)</Label>
                <Input
                  id="emailListFile"
                  type="file"
                  onChange={handleFileChange(setEmailListFile)}
                  accept=".csv,.txt"
                  className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer border-gray-300 focus:border-primary focus:ring-primary"
                />
                {emailListFile && <p className="mt-2 text-sm text-green-600">Selected: {emailListFile.name}</p>}
              </div>
              <div>
                <Label htmlFor="parochialReportFile" className="text-md font-medium">Parochial Report (.pdf)</Label>
                <Input
                  id="parochialReportFile"
                  type="file"
                  onChange={handleFileChange(setParochialReportFile)}
                  accept=".pdf"
                  className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer border-gray-300 focus:border-primary focus:ring-primary"
                />
                {parochialReportFile && <p className="mt-2 text-sm text-green-600">Selected: {parochialReportFile.name}</p>}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-6">
            <Button 
              onClick={handleSave} 
              disabled={saving || !churchId} 
              size="lg" 
              className="text-lg px-8 py-6 bg-gradient-journey hover:opacity-90 transition-opacity duration-300 shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed"
            >
              <Save className="mr-2 h-5 w-5" />
              {saving ? 'Saving Profile...' : 'Save Community Profile'}
            </Button>
          </div>
        </div>
      
      {/* Realm Integration Modal */}
      <Dialog open={realmModalOpen} onOpenChange={handleRealmClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5 text-blue-500" /> 
              Connect to ACS Realm
            </DialogTitle>
            <DialogDescription>
              Connect your ACS Realm account to import member data and synchronize your community information.
            </DialogDescription>
          </DialogHeader>
          
          {realmIntegrationStatus === 'idle' && (
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="realmUsername">Realm Username</Label>
                <Input
                  id="realmUsername"
                  value={realmUsername}
                  onChange={(e) => setRealmUsername(e.target.value)}
                  placeholder="username@yourchurch.org"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="realmPassword">Realm Password</Label>
                <Input
                  id="realmPassword"
                  type="password"
                  value={realmPassword}
                  onChange={(e) => setRealmPassword(e.target.value)}
                  placeholder="Your password"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="realmApiKey">Realm API Key</Label>
                <Input
                  id="realmApiKey"
                  value={realmApiKey}
                  onChange={(e) => setRealmApiKey(e.target.value)}
                  placeholder="API Key from ACS Technologies"
                />
                <p className="text-xs text-muted-foreground">
                  <a href="https://acstechnologies.com/realm/apis" className="text-blue-500" target="_blank" rel="noreferrer">How to get your API key</a>
                </p>
              </div>
              
              <div className="grid gap-2">
                <Label>Data to Import</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="members" 
                      checked={syncOptions.members}
                      onCheckedChange={() => handleSyncOptionChange('members')}
                    />
                    <Label htmlFor="members">Member Directory</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="groups" 
                      checked={syncOptions.groups}
                      onCheckedChange={() => handleSyncOptionChange('groups')}
                    />
                    <Label htmlFor="groups">Small Groups</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="events" 
                      checked={syncOptions.events}
                      onCheckedChange={() => handleSyncOptionChange('events')}
                    />
                    <Label htmlFor="events">Events Calendar</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="contributions" 
                      checked={syncOptions.contributions}
                      onCheckedChange={() => handleSyncOptionChange('contributions')}
                    />
                    <Label htmlFor="contributions">Giving/Contributions</Label>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {(realmIntegrationStatus === 'connecting' || realmIntegrationStatus === 'syncing') && (
            <div className="py-6 space-y-6">
              <div className="flex items-center justify-center my-6">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{realmIntegrationStatus === 'connecting' ? 'Connecting...' : 'Syncing data...'}</span>
                  <span>{realmIntegrationProgress}%</span>
                </div>
                <Progress value={realmIntegrationProgress} className="h-2" />
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center">
                  {realmIntegrationStep >= 1 ? <CheckCircle className="h-4 w-4 text-green-500 mr-2" /> : <div className="h-4 w-4 rounded-full border border-gray-300 mr-2" />}
                  <span className="text-sm">Connecting to Realm API</span>
                </div>
                
                <div className="flex items-center">
                  {realmIntegrationStep >= 2 ? <CheckCircle className="h-4 w-4 text-green-500 mr-2" /> : <div className="h-4 w-4 rounded-full border border-gray-300 mr-2" />}
                  <span className="text-sm">Validating credentials</span>
                </div>
                
                <div className="flex items-center">
                  {realmIntegrationStep >= 3 ? <CheckCircle className="h-4 w-4 text-green-500 mr-2" /> : <div className="h-4 w-4 rounded-full border border-gray-300 mr-2" />}
                  <span className="text-sm">Fetching data</span>
                </div>
                
                <div className="flex items-center">
                  {realmIntegrationStep >= 4 ? <CheckCircle className="h-4 w-4 text-green-500 mr-2" /> : <div className="h-4 w-4 rounded-full border border-gray-300 mr-2" />}
                  <span className="text-sm">Processing and importing data</span>
                </div>
              </div>
            </div>
          )}
          
          {realmIntegrationStatus === 'completed' && (
            <div className="py-6 space-y-4 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Integration Complete</h3>
                <p className="text-muted-foreground">Your Realm data has been successfully imported.</p>
              </div>
            </div>
          )}
          
          {realmIntegrationStatus === 'error' && (
            <div className="py-6 space-y-4 text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Integration Failed</h3>
                <p className="text-muted-foreground">{realmError}</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            {realmIntegrationStatus === 'idle' && (
              <Button type="submit" onClick={handleRealmConnect}>Connect to Realm</Button>
            )}
            {realmIntegrationStatus === 'error' && (
              <Button variant="outline" onClick={() => handleRealmClose(false)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </MainLayout>
  );
};

export default CommunityProfilePage;