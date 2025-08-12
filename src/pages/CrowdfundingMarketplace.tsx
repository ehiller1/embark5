import { useState, useEffect } from 'react';
import { InvestmentModal } from '@/components/crowdfunding/InvestmentModal';
import { SECFilingDisplay } from '@/components/crowdfunding/SECFilingDisplay';
import { useDiscernmentPlanContent } from '@/components/crowdfunding/useDiscernmentPlanContent';
import { CampaignWizardComprehensive } from '@/components/CampaignWizardComprehensive';
import { MediaUploadModal } from '@/components/campaign/MediaUploadModal';
import { ProspectusGeneratorModal } from '@/components/campaign/ProspectusGeneratorModal';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { useUserProfile } from '@/integrations/lib/auth/UserProfileProvider';
import { useOpenAI } from '@/hooks/useOpenAI';
import { setupCampaignMediaStorage } from '@/utils/storageSetup';
import { shouldShowDemoModals, shouldUseDemoData, getDemoChurchId } from '@/config/demoConfig';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Plus, ImageIcon, FileText, AlertCircle } from 'lucide-react';
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
}

const CrowdfundingMarketplace = () => {
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const [showSecFiling, setShowSecFiling] = useState<string | null>(null);
  const { plans } = useDiscernmentPlanContent();
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [aiGeneratedCampaign, setAiGeneratedCampaign] = useState<CampaignData | null>(null);
  const [loadingAiGeneration, setLoadingAiGeneration] = useState(false);
  const [aiGenerationError, setAiGenerationError] = useState<string | null>(null);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [showProspectusGenerator, setShowProspectusGenerator] = useState(false);
  const [selectedCampaignForProspectus, setSelectedCampaignForProspectus] = useState<Ministry | null>(null);
  const [campaignMediaUrls, setCampaignMediaUrls] = useState<{
    logos: string[];
    communityPhotos: string[];
  }>({ logos: [], communityPhotos: [] });
  const [activeTab, setActiveTab] = useState('all');
  const [recommendations, setRecommendations] = useState<Ministry[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);
  const [showDemoModal, setShowDemoModal] = useState<boolean>(false);
  const [isUsingDemoData, setIsUsingDemoData] = useState<boolean>(false);
  const navigate = useNavigate();
  
  // Auth and profile hooks
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { generateResponse } = useOpenAI();
  
  // Debug logging
  console.log('[CrowdfundingMarketplace] NEW COMPONENT VERSION LOADED');
  console.log('[CrowdfundingMarketplace] User:', { id: user?.id, email: user?.email });
  console.log('[CrowdfundingMarketplace] Profile:', { role: profile?.role, churchId: profile?.church_id });
  console.log('[CrowdfundingMarketplace] Component state:', {
    activeTab,
    showCreateWizard,
    loading,
    ministries: ministries.length,
    recommendations: recommendations.length
  });

  useEffect(() => {
    fetchMinistries();
  }, [user, profile]);

  const fetchMinistries = async () => {
    console.log('[CrowdfundingMarketplace] fetchMinistries called');
    try {
      setLoading(true);
      console.log('[CrowdfundingMarketplace] Querying Supabase ministries table...');
      
      // First, check if there are any ministries for the current user's church
      let churchId = profile?.church_id;
      if (churchId) {
        const { data: currentChurchMinistries } = await supabase
          .from('ministries')
          .select('*')
          .eq('church_id', churchId)
          .order('created_at', { ascending: false });
        
        // If no ministries exist for current church, use demo data if demo mode is enabled
        if ((!currentChurchMinistries || currentChurchMinistries.length === 0) && shouldUseDemoData()) {
          churchId = getDemoChurchId();
          setIsUsingDemoData(true);
          // Show demo modal with delay to prevent rendering conflicts
          if (shouldShowDemoModals()) {
            setTimeout(() => {
              setShowDemoModal(true);
            }, 300);
          }
        } else {
          setIsUsingDemoData(false);
        }
      }
      
      // Fetch all ministries (for general browsing) but prioritize user's church data
      const { data, error } = await supabase
        .from('ministries')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('[CrowdfundingMarketplace] Supabase response:', { data: data?.length, error });
      
      if (error) {
        console.error('[CrowdfundingMarketplace] Supabase error:', error);
        setError(error.message);
      } else {
        console.log('[CrowdfundingMarketplace] Ministries fetched:', data?.length || 0);
        setMinistries(data || []);
      }
    } catch (err) {
      console.error('[CrowdfundingMarketplace] fetchMinistries error:', err);
      setError('Failed to fetch ministries');
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async () => {
    console.log('[CrowdfundingMarketplace] generateRecommendations called');
    console.log('[CrowdfundingMarketplace] User/Profile check:', { user: !!user, profile: !!profile });
    
    if (!user || !profile) {
      console.log('[CrowdfundingMarketplace] Missing user or profile, skipping recommendations');
      return;
    }
    
    try {
      console.log('[CrowdfundingMarketplace] Starting AI recommendation generation...');
      setLoadingRecommendations(true);
      setRecommendationsError(null);
      
      // Get community research data from localStorage
      const communityResearch = localStorage.getItem('community_research_notes');
      const communityAssessment = localStorage.getItem('community_assessment_data');
      
      // Use the same fundraise prompt for recommendations
      let populatedPrompt: string;
      
      try {
        console.log('[CrowdfundingMarketplace] Attempting to retrieve fundraise prompt for recommendations...');
        const { getPromptByType } = await import('@/utils/scenarioPrompts');
        const promptResult = await getPromptByType('fundraise');
        
        if (promptResult.success && promptResult.data?.prompt) {
          console.log('[CrowdfundingMarketplace] Successfully retrieved fundraise prompt for recommendations');
          populatedPrompt = promptResult.data.prompt
            .replace('{research_summary}', communityResearch || 'General community research and analysis')
            .replace('{vocational_statement}', 'Committed to serving our community through faith-based initiatives')
            .replace('{scenario_details}', `Ministry funding scenario for ${profile.church_name || 'Community Church'} in ${profile.location || 'Local Community'}`);
        } else {
          throw new Error('Fundraise prompt not available');
        }
      } catch (promptError) {
        console.warn('[CrowdfundingMarketplace] Could not retrieve fundraise prompt for recommendations, skipping:', promptError);
        setLoadingRecommendations(false);
        setRecommendationsError('Unable to load fundraise prompt');
        return;
      }

      console.log('[CrowdfundingMarketplace] Sending prompt to OpenAI...');
      
      const response = await generateResponse({
        messages: [
          { role: 'user', content: populatedPrompt }
        ],
        maxTokens: 4000,
        temperature: 0.7
      });
      console.log('[CrowdfundingMarketplace] OpenAI response received');

      if (!response?.text) {
        throw new Error('No response from AI service');
      }

      // Parse the JSON response
      let parsedCampaign;
      try {
        // Clean the response to extract JSON
        const jsonMatch = response.text.match(/\{([\s\S]*?)\}/);
        if (jsonMatch) {
          parsedCampaign = JSON.parse(jsonMatch[0]);
        } else {
          parsedCampaign = JSON.parse(response.text);
        }
      } catch (parseError) {
        console.error('[CrowdfundingMarketplace] JSON parse error:', parseError);
        throw new Error('Failed to parse AI response as JSON');
      }

      console.log('[CrowdfundingMarketplace] Parsed AI campaign:', parsedCampaign);
      setAiGeneratedCampaign(parsedCampaign);
      
      // Open the wizard with AI-generated content
      setShowCreateWizard(true);
      
      toast({
        title: "AI Campaign Generated",
        description: "Campaign details generated successfully. You can now edit and customize them.",
      });

    } catch (error) {
      console.error('[CrowdfundingMarketplace] Error generating AI campaign:', error);
      setAiGenerationError(error instanceof Error ? error.message : 'Failed to generate campaign');
      
      toast({
        title: "Generation Failed",
        description: "Failed to generate AI campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingAiGeneration(false);
    }
  };

  const filteredMinistries = ministries.filter(ministry =>
    ministry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ministry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ministry.church_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateCampaign = () => {
    console.log('[CrowdfundingMarketplace] Opening campaign creation');
    setAiGeneratedCampaign(null); // Reset any AI content
    setShowCreateWizard(true);
  };

  const generateAiCampaign = async () => {
  setLoadingAiGeneration(true);
  setAiGenerationError(null);
  
  try {
    // Get community research data from localStorage
    const communityResearch = localStorage.getItem('community_research_notes');
    const communityAssessment = localStorage.getItem('community_assessment_data');
    const vocationalStatement = localStorage.getItem('vocational_statement');
    
    // Prepare request data for the fundraise prompt
    const defaultRequest = {
      research_summary: communityResearch || 'General community research and analysis',
      vocational_statement: vocationalStatement || 'Committed to serving our community through faith-based initiatives',
      scenario_details: `Ministry funding scenario for ${profile?.church_name || 'Community Church'} in ${profile?.location || 'Local Community'}`
    };

    // Try to get the fundraise prompt from the database
    let populatedPrompt: string;
    
    try {
      console.log('[CrowdfundingMarketplace] Attempting to retrieve fundraise prompt...');
      const { getPromptByType } = await import('@/utils/scenarioPrompts');
      const promptResult = await getPromptByType('fundraise');
      
      if (promptResult.success && promptResult.data?.prompt) {
        console.log('[CrowdfundingMarketplace] Successfully retrieved fundraise prompt');
        populatedPrompt = promptResult.data.prompt
          .replace('{research_summary}', defaultRequest.research_summary)
          .replace('{vocational_statement}', defaultRequest.vocational_statement)
          .replace('{scenario_details}', defaultRequest.scenario_details);
      } else {
        throw new Error('Fundraise prompt not available');
      }
    } catch (promptError) {
      console.warn('[CrowdfundingMarketplace] Could not retrieve fundraise prompt, using fallback:', promptError);
      
      // Fallback prompt that matches the expected fundraise structure
      populatedPrompt = `
Using the following information: 

Research Summary: ${defaultRequest.research_summary}
Vocational Statement: ${defaultRequest.vocational_statement}
Scenario Details: ${defaultRequest.scenario_details}

Formulate a Regulation CF compliant fundraising plan that includes extensive details on the program, fundraising plans, financials including cashflows and balance sheet. Return your proposal as JSON in the following format:
{
  "Ministry": {
    "title": {
      "value": "Ministry Name",
      "justification": "Descriptive and mission-aligned name that captures the focus of the ministry."
    },
    "mission_statement": {
      "value": "Mission statement here",
      "justification": "Clearly defines the purpose and vision of the ministry in a compelling, donor-friendly way."
    },
    "description": {
      "value": "Detailed description of the ministry initiative",
      "justification": "Expanded detail beyond the mission to help funders understand the specific activities and audience served."
    },
    "target_amount": {
      "value": 250000,
      "justification": "Calculated based on operational budget across staffing, facilities, programming, and admin costs."
    },
    "current_amount": {
      "value": 0,
      "justification": "Starting amount for new campaign."
    },
    "minimum_investment": {
      "value": 500,
      "justification": "Encourages meaningful participation while remaining accessible to mid-level donors."
    },
    "campaign_start_date": {
      "value": "2025-08-15T00:00:00Z",
      "justification": "Allows time for pre-campaign marketing and preparation."
    },
    "campaign_end_date": {
      "value": "2025-12-31T00:00:00Z",
      "justification": "End of calendar year maximizes holiday giving cycles."
    },
    "church_name": {
      "value": "${profile?.church_name || 'Community Church'}",
      "justification": "The parent or sponsoring church provides legitimacy and trust for donors."
    },
    "impact_metrics": {
      "value": {
        "people_served": 100,
        "volunteer_hours": 2000,
        "programs_launched": 2
      },
      "justification": "Measurable outcomes that demonstrate ministry effectiveness."
    },
    "media_urls": {
      "value": [],
      "justification": "Visual content to be added during campaign setup."
    },
    "logo": {
      "value": [],
      "justification": "Ministry branding to be uploaded during setup."
    },
    "funding_breakdown": {
      "value": {
        "programming": 150000,
        "staffing": 60000,
        "facilities": 25000,
        "admin": 15000
      },
      "justification": "Provides transparency into how the target funding amount will be spent across categories."
    },
    "use_of_funds": {
      "value": "Detailed explanation of how funds will be used to expand ministry impact",
      "justification": "Clear vision of how the funding will tangibly grow impact and serve more people."
    },
    "testimonials": {
      "value": [],
      "justification": "Community testimonials to be added during campaign setup."
    },
    "team": {
      "value": [],
      "justification": "Team member details to be added during campaign setup."
    },
    "contact_info": {
      "value": {
        "email": "info@ministry.org",
        "phone": "+1-555-0123",
        "website": "https://ministry.org"
      },
      "justification": "Contact information for donor inquiries and transparency."
    },
    "donation_tiers": {
      "value": [
        {
          "label": "Supporter",
          "amount": 100,
          "description": "Basic support level"
        },
        {
          "label": "Champion",
          "amount": 1000,
          "description": "Significant impact level"
        }
      ],
      "justification": "Framing investment options helps funders understand impact at different levels of giving."
    },
    "reporting_commitments": {
      "value": {
        "frequency": "quarterly",
        "report_types": ["financial", "impact", "narrative"]
      },
      "justification": "Commitment to transparency and accountability builds long-term funder relationships."
    },
    "project_plan": {
      "value": [
        {
          "step": "Strategic Planning",
          "description": "Define scope, target, timeline, and messaging.",
          "owner": "Program Director",
          "timeline": "2025-07-20 to 2025-08-10"
        },
        {
          "step": "Campaign Launch",
          "description": "Go live with fundraising portal and marketing campaign.",
          "owner": "Marketing Lead",
          "timeline": "2025-08-15"
        }
      ],
      "justification": "Clear project timeline demonstrates organized approach to campaign execution."
    }
  }
}
`;
    }

    console.log('[CrowdfundingMarketplace] Generating campaign with fundraise prompt');
    
    // Use only the fundraise prompt - no system prompts
    const response = await generateResponse({
      messages: [
        {
          role: 'user',
          content: populatedPrompt
        }
      ],
      temperature: 0.7,
      maxTokens: 4000
    });

    if (!response?.text) {
      throw new Error('No response from AI service');
    }

    console.log('[CrowdfundingMarketplace] Raw AI response:', response.text.substring(0, 200) + '...');

    // Parse the JSON response
    let parsedResponse;
    try {
      // Try to extract JSON from the response
      const cleanedResponse = response.text.trim();
      
      // Look for JSON object boundaries
      const startIndex = cleanedResponse.indexOf('{');
      const endIndex = cleanedResponse.lastIndexOf('}') + 1;
      
      if (startIndex !== -1 && endIndex > startIndex) {
        const jsonString = cleanedResponse.substring(startIndex, endIndex);
        parsedResponse = JSON.parse(jsonString);
      } else {
        // Fallback: try parsing the entire response
        parsedResponse = JSON.parse(cleanedResponse);
      }
    } catch (parseError) {
      console.error('[CrowdfundingMarketplace] JSON parse error:', parseError);
      console.error('[CrowdfundingMarketplace] Raw response:', response.text);
      throw new Error('Failed to parse AI response as JSON. Please try again.');
    }

    // Validate the response structure - expect Ministry object with comprehensive fields
    if (!parsedResponse.Ministry) {
      console.error('[CrowdfundingMarketplace] Invalid response structure - missing Ministry object:', parsedResponse);
      throw new Error('AI response missing Ministry object. Please try again.');
    }

    const ministryData = parsedResponse.Ministry;
    
    // Validate required fields
    const requiredFields = ['title', 'mission_statement', 'description', 'target_amount'];
    const missingFields = requiredFields.filter(field => !ministryData[field]);
    
    if (missingFields.length > 0) {
      console.error('[CrowdfundingMarketplace] Missing required fields:', missingFields);
      throw new Error(`AI response missing required fields: ${missingFields.join(', ')}`);
    }

    console.log('[CrowdfundingMarketplace] Successfully parsed AI campaign with Ministry data:', ministryData);
    setAiGeneratedCampaign(ministryData);
    
    // Open the wizard with AI-generated content
    setShowCreateWizard(true);
    
    toast({
      title: "AI Campaign Generated",
      description: "Comprehensive campaign details generated successfully. You can now edit and customize them.",
    });

  } catch (error) {
    console.error('[CrowdfundingMarketplace] Error generating AI campaign:', error);
    setAiGenerationError(error instanceof Error ? error.message : 'Failed to generate campaign');
    
    toast({
      title: "Generation Failed",
      description: "Failed to generate AI campaign. Please try again.",
      variant: "destructive",
    });
  } finally {
    setLoadingAiGeneration(false);
  }
};

  const handleCreateWithAI = () => {
    console.log('[CrowdfundingMarketplace] Creating campaign with AI');
    generateAiCampaign();
  };

  const handleCampaignComplete = (campaignData: CampaignData) => {
    console.log('[CrowdfundingMarketplace] Campaign completed:', campaignData);
    setShowCreateWizard(false);
    setAiGeneratedCampaign(null); // Reset AI content
    // Refresh ministries to show the new campaign
    fetchMinistries();
    toast({
      title: "Campaign Created",
      description: "Your ministry campaign has been created successfully.",
    });
  };

  const handleCampaignCancel = () => {
    console.log('[CrowdfundingMarketplace] Campaign creation cancelled');
    setShowCreateWizard(false);
    setAiGeneratedCampaign(null); // Reset AI content
  };

  const navigateToDetail = (id: string) => {
    // For now, show an alert since we don't have a dedicated ministry detail page
    // In a real implementation, this would navigate to a detailed view
    alert(`Viewing details for ministry ID: ${id}`);
    console.log(`Would navigate to /ministry/${id}`);
  };

  const handleMediaUploaded = (mediaUrls: { logos: string[], communityPhotos: string[] }) => {
    setCampaignMediaUrls(mediaUrls);
    toast({
      title: "Media Uploaded",
      description: `${mediaUrls.logos.length} logos and ${mediaUrls.communityPhotos.length} community photos uploaded successfully.`
    });
  };

  const handleGenerateProspectus = (campaign: Ministry) => {
    setSelectedCampaignForProspectus(campaign);
    setShowProspectusGenerator(true);
  };

  // Initialize storage on component mount
  useEffect(() => {
    setupCampaignMediaStorage();
  }, []);

  // Debug render logging
  console.log('[CrowdfundingMarketplace] RENDERING NEW COMPONENT with tabs and features');
  console.log('[CrowdfundingMarketplace] Render state:', {
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
            Ministry Investment Marketplace
          </h1>
          <p className="text-muted-foreground mt-4 text-lg">
            Discover and support ministries that align with your values.
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
        
        {/* Campaign Creation Section */}
        {showCreateWizard ? (
          <CampaignWizardComprehensive
            onComplete={handleCampaignComplete}
            onCancel={handleCampaignCancel}
            initialData={(aiGeneratedCampaign ?? undefined) as any}
          />
        ) : (
          <div className="mb-6">
            {/* Campaign Creation Actions */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Create New Ministry Campaign</h2>
              <p className="text-gray-600 mb-4">
                Start a new fundraising campaign for your ministry. You can generate content with AI or create manually.
              </p>
              
              <div className="flex gap-3">
                <Button 
                  onClick={handleCreateWithAI}
                  disabled={loadingAiGeneration}
                  className="flex items-center gap-2"
                >
                  {loadingAiGeneration ? (
                    <LoadingSpinner className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {loadingAiGeneration ? 'Generating with AI...' : 'Generate with AI'}
                </Button>
                
                <Button 
                  onClick={handleCreateCampaign}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Create Manually
                </Button>
              </div>
              
              {aiGenerationError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{aiGenerationError}</p>
                </div>
              )}
            </div>
            
            {/* Ministry Search and Listing */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Active Ministry Campaigns</h2>
                <div className="max-w-md">
                  <Input
                    type="search"
                    placeholder="Search ministries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        
        <Separator className="my-2" />

        {!showCreateWizard && (
          loading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-center text-red-600">
              <p>Error loading ministries: {error}</p>
              <Button onClick={fetchMinistries} className="mt-2">
                Retry
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMinistries.map((ministry) => (
                  <Card key={ministry.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center justify-between">
                        {ministry.title}
                        {plans && plans.length > 0 && (
                          <Badge variant="outline" title={`Discernment Plan: ${plans[0].title}`}>Plan</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-gray-500">{ministry.church_name}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <p className="text-sm text-gray-700">{ministry.description.substring(0, 100)}...</p>
                        <Progress value={(ministry.current_amount / ministry.target_amount) * 100} />
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">
                            ${ministry.current_amount.toLocaleString()} raised of ${ministry.target_amount.toLocaleString()}
                          </span>
                          <Badge variant="secondary">{ministry.status}</Badge>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="default" onClick={() => setSelectedMinistry(ministry)}>
                            Invest
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => navigateToDetail(ministry.id)}>
                            More
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleGenerateProspectus(ministry)}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Prospectus
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => setShowSecFiling(showSecFiling === ministry.id ? null : ministry.id)}
                          >
                            {showSecFiling === ministry.id ? 'Hide' : 'View'} SEC Filings
                          </Button>
                        </div>
                        {showSecFiling === ministry.id && (
                          <div className="mt-2">
                            <SECFilingDisplay 
                              filings={[
                                {
                                  id: 'mock-1',
                                  filing_type: 'form_c',
                                  filing_date: new Date().toISOString(),
                                  filing_status: 'accepted',
                                  submission_id: 'SUB-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                                  filing_data: {
                                    target_amount: ministry.target_amount,
                                    minimum_investment: ministry.minimum_investment,
                                    use_of_funds: {
                                      operations: '0.4',
                                      marketing: '0.3',
                                      development: '0.2',
                                      legal: '0.1'
                                    },
                                    risk_factors: [
                                      'Early stage investment with potential for loss of principal',
                                      'Market conditions may affect ministry success',
                                      'Regulatory changes could impact operations'
                                    ]
                                  },
                                  compliance_notes: 'Filing meets all SEC Regulation CF requirements.'
                                }
                              ]} 
                              ministryTitle={ministry.title} 
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )
        )}
        
        {/* AI Recommendations Display */}
        {!showCreateWizard && activeTab === 'recommendations' && (
          loadingRecommendations ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner />
              <span className="ml-2">Generating personalized recommendations...</span>
            </div>
          ) : recommendationsError ? (
            <div className="text-center text-red-600">
              <p>Error generating recommendations: {recommendationsError}</p>
              <Button onClick={generateRecommendations} className="mt-2">
                Try Again
              </Button>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <p className="text-lg mb-4">No recommendations available yet.</p>
              <p className="mb-4">Complete your community research and church profile for personalized suggestions.</p>
              <Button onClick={generateRecommendations} variant="default">
                Generate Recommendations
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((recommendation) => (
                <Card key={recommendation.id} className="hover:shadow-lg transition-shadow border-2 border-primary/20">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                        <CardDescription className="text-gray-500">{recommendation.church_name}</CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                        AI Suggested
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700">{recommendation.description.substring(0, 150)}...</p>
                      
                      {/* Mission Statement */}
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-xs font-medium text-gray-600 mb-1">Mission Statement</p>
                        <p className="text-sm italic">{recommendation.mission_statement}</p>
                      </div>
                      
                      {/* Funding Info */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Target Amount:</span>
                          <span className="font-medium">${recommendation.target_amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Min Investment:</span>
                          <span className="font-medium">${recommendation.minimum_investment.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      {/* Impact Metrics */}
                      {recommendation.impact_metrics && (
                        <div className="bg-blue-50 p-3 rounded-md">
                          <p className="text-xs font-medium text-blue-800 mb-2">Expected Impact</p>
                          <div className="space-y-1 text-sm text-blue-700">
                            {recommendation.impact_metrics.people_served && (
                              <p>• {recommendation.impact_metrics.people_served} people served</p>
                            )}
                            {recommendation.impact_metrics.community_benefit && (
                              <p>• {recommendation.impact_metrics.community_benefit}</p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* AI Justification */}
                      {(recommendation as any).justification && (
                        <div className="bg-amber-50 p-3 rounded-md">
                          <p className="text-xs font-medium text-amber-800 mb-1">Why This Ministry?</p>
                          <p className="text-xs text-amber-700">{(recommendation as any).justification}</p>
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="default" className="flex-1">
                          Create This Campaign
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleGenerateProspectus(recommendation)}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          Prospectus
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        )}
      </div>
    
      {/* Investment Modal for selected ministry */}
      {selectedMinistry && (
        <InvestmentModal
          ministry={selectedMinistry}
          isOpen={!!selectedMinistry}
          onClose={() => setSelectedMinistry(null)}
        />
      )}
      
      {/* Media Upload Modal */}
      <MediaUploadModal
        open={showMediaUpload}
        onClose={() => setShowMediaUpload(false)}
        onMediaUploaded={handleMediaUploaded}
        existingMedia={campaignMediaUrls}
      />
      
      {/* Prospectus Generator Modal */}
      {selectedCampaignForProspectus && (
        <ProspectusGeneratorModal
          open={showProspectusGenerator}
          onClose={() => {
            setShowProspectusGenerator(false);
            setSelectedCampaignForProspectus(null);
          }}
          campaignData={selectedCampaignForProspectus}
          mediaUrls={campaignMediaUrls}
        />
      )}
      
      {/* Demo Modal */}
      {showDemoModal && (
        <Dialog open={showDemoModal} onOpenChange={setShowDemoModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                Demo Data Notice
              </DialogTitle>
              <DialogDescription className="text-left">
                For demo purposes we are showing you sample ministry campaigns that will be replaced when you create your own campaigns.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setShowDemoModal(false)} className="w-full">
                Continue with Demo Data
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export default CrowdfundingMarketplace;
