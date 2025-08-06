import React, { useState, useEffect } from 'react';
import { InvestmentModal } from '@/components/crowdfunding/InvestmentModal';
import { SECFilingDisplay } from '@/components/crowdfunding/SECFilingDisplay';
import { useDiscernmentPlanContent } from '@/components/crowdfunding/useDiscernmentPlanContent';
import { CampaignWizardComprehensive } from '@/components/CampaignWizardComprehensive';
import { MediaUploadModal } from '@/components/campaign/MediaUploadModal';
import { ProspectusGeneratorModal } from '@/components/campaign/ProspectusGeneratorModal';
import { MinistryDetailsModal } from '@/components/ministry/MinistryDetailsModal';
import { ProspectusGeneratorAdmin } from '@/components/admin/ProspectusGeneratorAdmin';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { useUserProfile } from '@/integrations/lib/auth/UserProfileProvider';
import { useOpenAI } from '@/hooks/useOpenAI';
import { setupCampaignMediaStorage } from '@/utils/storageSetup';
import { generateProspectusForMinistry } from '@/scripts/generateProspectuses';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Plus, ImageIcon, FileText, Edit } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CampaignData } from '@/types/campaign';

interface Ministry {
  id: string;
  created_at: string;
  title: string;
  mission_statement: string;
  description: string;
  target_amount: number;
  current_amount: number;
  minimum_investment: number;
  campaign_start_date: string;
  campaign_end_date: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  church_name: string;
  diocese: string | null;
  location: string;
  impact_metrics: any;
  media_urls: string[];
  user_id: string | null;
  funding_type: 'equity' | 'loan' | 'donation';
  interest_rate?: number;
  equity_percentage?: number;
  term_length?: number;
  prospectus_url?: string; // URL to stored prospectus PDF
  prospectus_generated_at?: string; // When prospectus was last generated
  campaign_data?: CampaignData; // Campaign data from wizard
}

const ClergyMarketplace = () => {
  // State management
  const [activeTab, setActiveTab] = useState('create');
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [recommendations, setRecommendations] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [showProspectusGenerator, setShowProspectusGenerator] = useState(false);
  const [selectedCampaignForProspectus, setSelectedCampaignForProspectus] = useState<Ministry | null>(null);
  const [selectedCampaignForEdit, setSelectedCampaignForEdit] = useState<Ministry | null>(null);
  const [showMinistryDetails, setShowMinistryDetails] = useState(false);
  const [selectedMinistryForDetails, setSelectedMinistryForDetails] = useState<Ministry | null>(null);
  const [showProspectusAdmin, setShowProspectusAdmin] = useState(false);
  const [campaignMediaUrls, setCampaignMediaUrls] = useState<{
    logos: string[];
    communityPhotos: string[];
  }>({ logos: [], communityPhotos: [] });
  const navigate = useNavigate();
  
  // Auth and profile hooks
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { generateResponse } = useOpenAI();
  
  // Debug logging
  console.log('[ClergyMarketplace] NEW COMPONENT VERSION LOADED');
  console.log('[ClergyMarketplace] User:', { id: user?.id, email: user?.email });
  console.log('[ClergyMarketplace] Profile:', { role: profile?.role, churchId: profile?.church_id });
  console.log('[ClergyMarketplace] Component state:', {
    activeTab,
    showCreateWizard,
    loading,
    ministries: ministries.length,
    recommendations: recommendations.length
  });

  useEffect(() => {
    fetchMinistries();
    generateRecommendations();
  }, [user, profile]);

  const fetchMinistries = async () => {
    console.log('[ClergyMarketplace] fetchMinistries called');
    try {
      setLoading(true);
      console.log('[ClergyMarketplace] Querying Supabase ministries table...');
      
      const { data, error } = await supabase
        .from('ministries')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('[ClergyMarketplace] Supabase response:', { data: data?.length, error });
      
      if (error) {
        console.error('[ClergyMarketplace] Supabase error:', error);
        setError(error.message);
      } else {
        console.log('[ClergyMarketplace] Ministries fetched:', data?.length || 0);
        setMinistries(data || []);
      }
    } catch (err) {
      console.error('[ClergyMarketplace] fetchMinistries error:', err);
      setError('Failed to fetch ministries');
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async () => {
    console.log('[ClergyMarketplace] generateRecommendations called');
    console.log('[ClergyMarketplace] User/Profile check:', { user: !!user, profile: !!profile });
    
    if (!user || !profile) {
      console.log('[ClergyMarketplace] Missing user or profile, skipping recommendations');
      return;
    }
    
    try {
      console.log('[ClergyMarketplace] Starting AI recommendation generation...');
      setLoadingRecommendations(true);
      setRecommendationsError(null);
      
      // Create a comprehensive prompt for ministry recommendations
      const prompt = `
Based on the following church profile, generate 3-5 specific ministry investment opportunities that would be suitable for crowdfunding. Return valid JSON only.

Church Profile:
- Church Name: ${profile.church_name || 'Unknown'}
- Location: ${profile.city || 'Unknown'}, ${profile.state || 'Unknown'}
- Diocese: ${profile.diocese || 'N/A'}
- Church Size: ${profile.church_size || 'Unknown'}
- Mission Focus: ${profile.mission_focus || 'General ministry'}

Please generate ministry recommendations that:
1. Align with the church's location and community needs
2. Are realistic for the church size and resources
3. Have clear funding goals between $10,000 - $500,000
4. Include specific impact metrics
5. Align with the church's mission and capabilities
`;

      console.log('[ClergyMarketplace] Sending OpenAI request with prompt length:', prompt.length);
      
      const response = await generateResponse({
        messages: [
          { role: 'system', content: 'You are an AI assistant helping to generate ministry investment recommendations. Return valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        maxTokens: 2000,
        temperature: 0.7
      });
      
      console.log('[ClergyMarketplace] OpenAI response received:', {
        hasResponse: !!response,
        hasText: !!response?.text,
        textLength: response?.text?.length,
        hasError: !!response?.error
      });
      
      if (response && response.text) {
        try {
          const parsed = JSON.parse(response.text);
          if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
            // Transform AI recommendations into Ministry format
            const transformedRecommendations: Ministry[] = parsed.recommendations.map((rec: any, index: number) => ({
              id: `ai-rec-${index}`,
              created_at: new Date().toISOString(),
              title: rec.title,
              mission_statement: rec.mission_statement,
              description: rec.description,
              target_amount: rec.target_amount,
              current_amount: 0,
              minimum_investment: rec.minimum_investment,
              campaign_start_date: new Date().toISOString(),
              campaign_end_date: new Date(Date.now() + (rec.campaign_duration_days || 90) * 24 * 60 * 60 * 1000).toISOString(),
              status: 'draft' as const,
              church_name: profile.church_name || 'Your Church',
              diocese: profile.diocese || null,
              location: `${profile?.city || 'Unknown'}, ${profile?.state || 'Unknown'}`,
              impact_metrics: rec.impact_metrics,
              media_urls: [],
              user_id: user.id,
              funding_type: rec.funding_type || 'donation',
              interest_rate: rec.interest_rate,
              equity_percentage: rec.equity_percentage,
              term_length: rec.term_length
            }));
            
            setRecommendations(transformedRecommendations);
          }
        } catch (parseError) {
          console.error('Failed to parse AI response:', parseError);
          setRecommendationsError('Failed to parse AI recommendations');
        }
      } else {
        setRecommendationsError(response?.error || 'Failed to generate recommendations');
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      setRecommendationsError('Failed to generate recommendations');
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'create') {
      setShowCreateWizard(true);
    } else {
      setShowCreateWizard(false);
    }
  };

  const handleCampaignComplete = (campaignData: CampaignData) => {
    console.log('Campaign completed:', campaignData);
    setShowCreateWizard(false);
    setActiveTab('all');
    fetchMinistries(); // Refresh the list
    toast({
      title: "Campaign Created",
      description: "Your ministry campaign has been successfully created.",
    });
  };

  const handleCampaignCancel = () => {
    setShowCreateWizard(false);
    setSelectedCampaignForEdit(null);
    setActiveTab('create');
  };

  const handleViewDetails = (ministry: Ministry) => {
    setSelectedMinistryForDetails(ministry);
    setShowMinistryDetails(true);
  };

  const handleViewProspectus = async (ministry: Ministry) => {
    console.log('[ClergyMarketplace] handleViewProspectus called for ministry:', ministry.id);
    
    try {
      // If prospectus exists, try to open it directly
      if (ministry.prospectus_url) {
        console.log('[ClergyMarketplace] Opening existing prospectus:', ministry.prospectus_url);
        
        // Test if the URL is accessible before opening
        try {
          const response = await fetch(ministry.prospectus_url, { method: 'HEAD' });
          if (response.ok) {
            window.open(ministry.prospectus_url, '_blank');
            return;
          } else {
            console.warn('[ClergyMarketplace] Existing prospectus URL not accessible, regenerating...');
          }
        } catch (fetchError) {
          console.warn('[ClergyMarketplace] Error checking existing prospectus, regenerating:', fetchError);
        }
      }
      
      // If no prospectus exists or existing one is inaccessible, generate one
      console.log('[ClergyMarketplace] Generating new prospectus...');
      const prospectusUrl = await generateAndStoreProspectus(ministry);
      
      if (prospectusUrl) {
        console.log('[ClergyMarketplace] Opening newly generated prospectus:', prospectusUrl);
        window.open(prospectusUrl, '_blank');
      } else {
        throw new Error('Failed to generate prospectus');
      }
    } catch (error) {
      console.error('[ClergyMarketplace] Error in handleViewProspectus:', error);
      toast({
        title: "Prospectus Error",
        description: "Failed to open or generate prospectus. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateProspectusFromWizard = (ministry: Ministry) => {
    // This function is only used from the campaign creation wizard
    setSelectedCampaignForProspectus(ministry);
    setShowProspectusGenerator(true);
  };



  const generateAndStoreProspectus = async (ministry: Ministry): Promise<string | null> => {
    try {
      console.log('[ClergyMarketplace] Generating prospectus for ministry:', ministry.id);
      
      // Import PDF generation components dynamically
      const { pdf } = await import('@react-pdf/renderer');
      const ProspectusPDFTemplate = (await import('@/components/campaign/ProspectusPDFTemplate')).default;
      
      // Get campaign media URLs
      const campaignMediaUrls = {
        logos: ministry.campaign_data?.logo?.value || [],
        communityPhotos: ministry.campaign_data?.media_urls?.value || []
      };
      
      // Prepare prospectus data in the correct format for ProspectusPDF component
      const prospectusData = {
        title: ministry.title,
        subtitle: ministry.church_name,
        logos: campaignMediaUrls.logos,
        communityPhotos: campaignMediaUrls.communityPhotos,
        campaignData: ministry,
        sections: [
          {
            id: 'executive-summary',
            title: 'Executive Summary',
            type: 'text' as const,
            content: ministry.description,
            order: 1
          },
          {
            id: 'financial-overview',
            title: 'Financial Overview',
            type: 'text' as const,
            content: `Target Amount: $${ministry.target_amount.toLocaleString()}\nMinimum Investment: $${ministry.minimum_investment.toLocaleString()}\nFunding Type: ${ministry.funding_type}`,
            order: 2
          },
          {
            id: 'impact-goals',
            title: 'Impact & Ministry Goals',
            type: 'text' as const,
            content: ministry.mission_statement,
            order: 3
          }
        ]
      };
      
      // Generate PDF blob using the correct data structure
      console.log('[ClergyMarketplace] Generating PDF blob...');
      let pdfBlob: Blob;
      
      try {
        pdfBlob = await pdf(
          React.createElement(ProspectusPDFTemplate, {
            data: prospectusData
          })
        ).toBlob();
        
        console.log('[ClergyMarketplace] PDF blob generated, size:', pdfBlob.size, 'bytes');
        
        // Validate the blob is actually a PDF
        if (pdfBlob.type !== 'application/pdf' && pdfBlob.size === 0) {
          throw new Error('Generated blob is not a valid PDF');
        }
      } catch (pdfError) {
        console.error('[ClergyMarketplace] Error generating PDF blob:', pdfError);
        throw new Error(`PDF generation failed: ${pdfError.message}`);
      }
      
      // Upload to Supabase storage with proper error handling
      const fileName = `prospectus-${ministry.id}-${Date.now()}.pdf`;
      console.log('[ClergyMarketplace] Uploading to storage as:', fileName);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('campaign-media')
        .upload(`prospectuses/${fileName}`, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true,
          cacheControl: '3600'
        });
      
      if (uploadError) {
        console.error('[ClergyMarketplace] Error uploading prospectus:', uploadError);
        console.error('[ClergyMarketplace] Upload error details:', JSON.stringify(uploadError, null, 2));
        throw new Error(`Failed to upload prospectus: ${uploadError.message}`);
      }
      
      console.log('[ClergyMarketplace] Upload successful:', uploadData);
      
      // Get public URL with error handling
      const { data: urlData, error: urlError } = supabase.storage
        .from('campaign-media')
        .getPublicUrl(`prospectuses/${fileName}`);
      
      if (urlError) {
        console.error('[ClergyMarketplace] Error getting public URL:', urlError);
        throw new Error(`Failed to get prospectus URL: ${urlError.message}`);
      }
      
      const prospectusUrl = urlData.publicUrl;
      console.log('[ClergyMarketplace] Public URL generated:', prospectusUrl);
      
      // Update ministry record with prospectus URL
      const { error: updateError } = await supabase
        .from('ministries')
        .update({
          prospectus_url: prospectusUrl,
          prospectus_generated_at: new Date().toISOString()
        })
        .eq('id', ministry.id);
      
      if (updateError) {
        console.error('Error updating ministry with prospectus URL:', updateError);
        throw updateError;
      }
      
      console.log('[ClergyMarketplace] Prospectus generated and stored:', prospectusUrl);
      
      // Refresh ministries to show updated prospectus info
      fetchMinistries();
      
      toast({
        title: "Prospectus Generated",
        description: "Ministry prospectus has been generated and saved.",
      });
      
      return prospectusUrl;
      
    } catch (error) {
      console.error('Error generating prospectus:', error);
      toast({
        title: "Prospectus Generation Failed",
        description: "Failed to generate prospectus. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleCreateCampaign = async (campaignData: Partial<Ministry>) => {
    try {
      setLoading(true);
      
      // Add user_id to the campaign data
      const newCampaign = {
        ...campaignData,
        user_id: user?.id,
        current_amount: 0,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('ministries')
        .insert([newCampaign])
        .select();

      if (error) throw error;
      
      // Refresh the ministries list
      fetchMinistries();
      
      // Switch to my-campaigns tab
      setActiveTab('my-campaigns');
      
      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Setup storage on component mount
  useEffect(() => {
    setupCampaignMediaStorage();
  }, []);

  // Debug render logging
  console.log('[ClergyMarketplace] RENDERING NEW COMPONENT with tabs and features');
  console.log('[ClergyMarketplace] Render state:', {
    activeTab,
    showCreateWizard,
    showMediaUpload,
    showProspectusGenerator,
    loading,
    ministries: ministries.length,
    recommendations: recommendations.length
  });

  return (
    <>
      <div className="flex flex-col space-y-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Pursuing Ministry Investment
          </h1>
          <p className="text-muted-foreground mt-4 text-lg">
            Build your fund-raising materials and plan and view other ministry investment opportunities.
          </p>
          
          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-6">
            <Button 
              onClick={() => setShowMediaUpload(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ImageIcon className="h-4 w-4" />
              Upload Media Assets
            </Button>
            <Button 
              onClick={() => setShowProspectusGenerator(true)}
              variant="outline"
              className="flex items-center gap-2"
              disabled={!selectedCampaignForProspectus}
            >
              <FileText className="h-4 w-4" />
              Generate Prospectus
            </Button>
          </div>
        </div>
        
        <div className="mb-6">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Campaign
              </TabsTrigger>
              <TabsTrigger value="all">All Ministries</TabsTrigger>
              <TabsTrigger value="my-campaigns">My Campaigns</TabsTrigger>
            </TabsList>
            
            <TabsContent value="create" className="mt-6">
              <CampaignWizardComprehensive
                onComplete={handleCampaignComplete}
                onCancel={handleCampaignCancel}
                initialData={selectedCampaignForEdit?.campaign_data}
              />
            </TabsContent>
            
            <TabsContent value="all" className="mt-6">
              <div className="max-w-md mb-4">
                <Input
                  type="search"
                  placeholder="Search ministries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <LoadingSpinner size="lg" text="Loading ministries..." />
                </div>
              ) : error ? (
                <div className="text-red-500 text-center py-8">Error: {error}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ministries
                    .filter(ministry => 
                      ministry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      ministry.description.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((ministry) => (
                      <Card key={ministry.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{ministry.title}</CardTitle>
                            <Badge variant={ministry.status === 'active' ? 'default' : 'secondary'}>
                              {ministry.status}
                            </Badge>
                          </div>
                          <CardDescription className="text-sm text-muted-foreground">
                            {ministry.church_name} • {ministry.location}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm mb-4 line-clamp-3">{ministry.description}</p>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{((ministry.current_amount / ministry.target_amount) * 100).toFixed(1)}%</span>
                            </div>
                            <Progress value={(ministry.current_amount / ministry.target_amount) * 100} className="h-2" />
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>${ministry.current_amount.toLocaleString()}</span>
                              <span>${ministry.target_amount.toLocaleString()}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="default" 
                              className="flex-1"
                              onClick={() => handleViewDetails(ministry)}
                            >
                              View Details
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewProspectus(ministry)}
                              title="View ministry prospectus"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Prospectus
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  }
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="my-campaigns" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">My Campaigns</h3>
                  <Button 
                    onClick={fetchMinistries}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                  >
                    {loading ? 'Loading...' : 'Refresh'}
                  </Button>
                </div>
                
                {loading ? (
                  <div className="flex items-center justify-center h-48">
                    <LoadingSpinner size="lg" text="Loading your campaigns..." />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ministries.filter(ministry => ministry.user_id === user?.id).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ministries.filter(ministry => ministry.user_id === user?.id).map((campaign) => (
                          <Card key={campaign.id} className="hover:shadow-lg transition-shadow border-green-200">
                            <CardHeader>
                              <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">{campaign.title}</CardTitle>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  My Campaign
                                </Badge>
                              </div>
                              <CardDescription className="text-sm text-muted-foreground">
                                {campaign.church_name} • {campaign.location}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm mb-4 line-clamp-3">{campaign.description}</p>
                              
                              <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-sm">
                                  <span>Target Amount</span>
                                  <span className="font-medium">${campaign.target_amount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Current Amount</span>
                                  <span>${campaign.current_amount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Min Investment</span>
                                  <span>${campaign.minimum_investment.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Progress</span>
                                  <span>{Math.round((campaign.current_amount / campaign.target_amount) * 100)}%</span>
                                </div>
                              </div>
                              
                              {/* Progress Bar */}
                              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                                <div 
                                  className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                                  style={{ width: `${Math.min((campaign.current_amount / campaign.target_amount) * 100, 100)}%` }}
                                ></div>
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex gap-2 mt-4">
                                <Button 
                                  size="sm" 
                                  variant="default" 
                                  className="flex-1"
                                  onClick={() => {
                                    setSelectedCampaignForEdit(campaign);
                                    setShowCreateWizard(true);
                                    setActiveTab('create');
                                  }}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit Campaign
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleViewProspectus(campaign)}
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  Prospectus
                                </Button>
                              </div>
                              
                              {/* Campaign Status */}
                              <div className="mt-3 text-xs text-muted-foreground">
                                Created: {new Date(campaign.created_at).toLocaleDateString()}
                                {campaign.campaign_data && (
                                  <span className="ml-2 text-green-600">• AI Generated</span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="max-w-md mx-auto">
                          <div className="mb-4">
                            <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          </div>
                          <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
                          <p className="text-muted-foreground mb-6">
                            You haven't created any campaigns yet. Get started by creating your first fundraising campaign.
                          </p>
                          <Button 
                            onClick={() => {
                              setActiveTab('create');
                              setShowCreateWizard(true);
                            }}
                            className="flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Create Your First Campaign
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Media Upload Modal */}
      <MediaUploadModal
        open={showMediaUpload}
        onClose={() => setShowMediaUpload(false)}
        onMediaUploaded={(mediaUrls) => {
          setCampaignMediaUrls(prev => ({
            logos: [...prev.logos, ...mediaUrls.logos],
            communityPhotos: [...prev.communityPhotos, ...mediaUrls.communityPhotos]
          }));
          setShowMediaUpload(false);
        }}
        existingMedia={campaignMediaUrls}
      />
      
      {/* Prospectus Generator Modal */}
      <ProspectusGeneratorModal
        open={showProspectusGenerator}
        onClose={() => {
          setShowProspectusGenerator(false);
          setSelectedCampaignForProspectus(null);
        }}
        campaignData={selectedCampaignForProspectus}
        mediaUrls={{
          logos: campaignMediaUrls.logos,
          communityPhotos: campaignMediaUrls.communityPhotos
        }}
      />
      
      {/* Ministry Details Modal */}
      <MinistryDetailsModal
        open={showMinistryDetails}
        onClose={() => {
          setShowMinistryDetails(false);
          setSelectedMinistryForDetails(null);
        }}
        ministry={selectedMinistryForDetails}
        onViewProspectus={handleViewProspectus}
      />
    </>
  );
};

export default ClergyMarketplace;
