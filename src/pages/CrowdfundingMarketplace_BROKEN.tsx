
import { useState, useEffect } from 'react';
import { InvestmentModal } from '@/components/crowdfunding/InvestmentModal';
import { SECFilingDisplay } from '@/components/crowdfunding/SECFilingDisplay';
import { useDiscernmentPlanContent } from '@/components/crowdfunding/useDiscernmentPlanContent';
import { CampaignWizard } from '@/components/campaign/CampaignWizard';
import { MediaUploadModal } from '@/components/campaign/MediaUploadModal';
import { ProspectusGeneratorModal } from '@/components/campaign/ProspectusGeneratorModal';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { useUserProfile } from '@/integrations/lib/auth/UserProfileProvider';
import { useOpenAI } from '@/hooks/useOpenAI';
import { setupCampaignMediaStorage } from '@/utils/storageSetup';

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
import { Plus, ImageIcon, FileText } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('all');
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [recommendations, setRecommendations] = useState<Ministry[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [showProspectusGenerator, setShowProspectusGenerator] = useState(false);
  const [selectedCampaignForProspectus, setSelectedCampaignForProspectus] = useState<Ministry | null>(null);
  const [campaignMediaUrls, setCampaignMediaUrls] = useState<{
    logos: string[];
    communityPhotos: string[];
  }>({ logos: [], communityPhotos: [] });
  const navigate = useNavigate();
  
  // Auth and profile hooks
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { generateResponse } = useOpenAI();

  useEffect(() => {
    fetchMinistries();
    generateRecommendations();
  }, [user, profile]);

  const fetchMinistries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ministries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setMinistries(data || []);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async () => {
    if (!user || !profile) return;
    
    try {
      setLoadingRecommendations(true);
      setRecommendationsError(null);
      
      // Get community research data from localStorage
      const communityResearch = localStorage.getItem('community_research_notes');
      const communityAssessment = localStorage.getItem('community_assessment_data');
      
      const prompt = `
You are an expert ministry consultant helping churches identify impactful crowdfunding opportunities. Based on the church profile and community data provided, generate 3-5 personalized ministry recommendations that would be suitable for crowdfunding campaigns.

Church Profile:
- Church Name: ${profile.church_name || 'Not specified'}
- Location: ${profile.city}, ${profile.state}
- Denomination: ${profile.denomination || 'Not specified'}
- Size: ${profile.church_size || 'Not specified'}
- Mission Focus: ${profile.mission_focus || 'Not specified'}

Community Research: ${communityResearch ? JSON.stringify(JSON.parse(communityResearch), null, 2) : 'No community research available'}

Community Assessment: ${communityAssessment || 'No community assessment available'}

Generate ministry recommendations in the following JSON format:
[
  {
    "title": "Ministry Name",
    "mission_statement": "Brief mission statement",
    "description": "Detailed description of the ministry and its impact",
    "target_amount": 50000,
    "minimum_investment": 100,
    "impact_metrics": {
      "people_served": 200,
      "community_benefit": "Specific community benefit",
      "success_indicators": ["Indicator 1", "Indicator 2"]
    }
  }
]
`;

      const response = await generateResponse(prompt, { maxTokens: 1000 });
      
      if (response && typeof response === 'string') {
        try {
          const recommendationsData = JSON.parse(response);
          if (recommendationsData && Array.isArray(recommendationsData)) {
            // Transform AI recommendations into Ministry format
            const transformedRecommendations: Ministry[] = recommendationsData.map((rec: any, index: number) => ({
              id: `ai-rec-${index}`,
              created_at: new Date().toISOString(),
              title: rec.title,
              mission_statement: rec.mission_statement,
              description: rec.description,
              target_amount: rec.target_amount,
              current_amount: 0,
              minimum_investment: rec.minimum_investment,
              campaign_start_date: new Date().toISOString(),
              campaign_end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'draft' as const,
              church_name: rec.church_name || profile?.church_name || 'Your Church',
              diocese: profile?.diocese || null,
              location: `${profile?.city || 'Unknown'}, ${profile?.state || 'Unknown'}`,
              impact_metrics: rec.impact_metrics,
              media_urls: [],
              user_id: user?.id || '',
            }));
            
            setRecommendations(transformedRecommendations);
          }
        } catch (parseError) {
          console.error('Error parsing AI recommendations:', parseError);
          setRecommendationsError('Failed to parse AI recommendations');
        }
      }
    } catch (err: any) {
      console.error('Error generating recommendations:', err);
      setRecommendationsError(err.message || 'Failed to generate recommendations');
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const filteredMinistries = ministries.filter(ministry =>
    ministry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ministry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ministry.church_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'create') {
      setShowCreateWizard(true);
    } else {
      setShowCreateWizard(false);
    }
  };

  const handleCampaignComplete = (campaignData: CampaignData) => {
    toast({
      title: "Campaign Created",
      description: "Your campaign has been successfully created and saved.",
    });
    setShowCreateWizard(false);
    setActiveTab('all');
    // Refresh the ministries list to show the new campaign
    fetchMinistries();
  };

  const handleCampaignCancel = () => {
    setShowCreateWizard(false);
    setActiveTab('all');
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
        
        <div className="mb-6">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Ministries</TabsTrigger>
              <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Campaign
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="create" className="mt-6">
              {showCreateWizard && (
                <CampaignWizard
                  onComplete={handleCampaignComplete}
                  onCancel={handleCampaignCancel}
                />
              )}
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
            </TabsContent>
            
            <TabsContent value="recommendations" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">AI-Powered Ministry Recommendations</h3>
                  <Button 
                    onClick={generateRecommendations} 
                    disabled={loadingRecommendations}
                    variant="outline"
                    size="sm"
                  >
                    {loadingRecommendations ? 'Generating...' : 'Refresh Recommendations'}
                  </Button>
                </div>
                <p className="text-muted-foreground">
                  Personalized ministry suggestions based on your church profile and community research.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <Separator className="my-2" />

        {!showCreateWizard && activeTab === 'all' && (
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
                                      operations: 0.4,
                                      marketing: 0.3,
                                      development: 0.2,
                                      legal: 0.1
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
    </>
  );
}

export default CrowdfundingMarketplace;
