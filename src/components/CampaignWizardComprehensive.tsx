import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Minus, Info, ArrowLeft, ArrowRight, Save, X, Wand2, CheckCircle, Circle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/lib/supabase';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { useUserProfile } from '@/integrations/lib/auth/UserProfileProvider';
import { useCampaignGeneration } from '@/hooks/useCampaignGeneration';
import { useOpenAI } from '@/hooks/useOpenAI';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MediaUploadModal } from '@/components/campaign/MediaUploadModal';

// Comprehensive campaign data structure matching fundraise prompt
interface ComprehensiveCampaignData {
  title: { value: string; justification: string };
  mission_statement: { value: string; justification: string };
  description: { value: string; justification: string };
  target_amount: { value: number; justification: string };
  current_amount: { value: number; justification: string };
  minimum_investment: { value: number; justification: string };
  campaign_start_date: { value: string; justification: string };
  campaign_end_date: { value: string; justification: string };
  church_name: { value: string; justification: string };
  impact_metrics: { value: Record<string, number | string>; justification: string };
  media_urls: { value: string[]; justification: string };
  logo: { value: string[]; justification: string };
  funding_breakdown: { value: Record<string, number>; justification: string };
  use_of_funds: { value: string; justification: string };
  testimonials: { value: Array<{ author: string; quote: string }>; justification: string };
  team: { value: Array<{ name: string; role: string; bio: string }>; justification: string };
  contact_info: { value: { email: string; phone: string; website: string }; justification: string };
  donation_tiers: { value: Array<{ label: string; amount: number; description: string }>; justification: string };
  reporting_commitments: { value: { frequency: string; report_types: string[] }; justification: string };
  project_plan: { value: Array<{ step: string; description: string; owner: string; timeline: string }>; justification: string };
  marketing_campaign: {
    value: {
      objectives: {
        mission_statement: string;
        theological_foundations: Array<{ verse: string; explanation: string }>;
        core_values: string[];
        key_messages: string[];
        objectives_narrative: string;
      };
      action_plan: {
        objectives_and_goals_narrative: string;
        objectives_and_goals: string[];
        action_steps_narrative: string;
        action_steps: Array<{ description: string }>;
      };
      dealing_with_resistance: {
        change_management_challenge: string;
        strategy: string[];
        action_steps_narrative: string;
        action_steps: Array<{ description: string }>;
      };
    };
    justification: string;
  };
  pro_forma_financials: {
    value: {
      assumptions: {
        growth_rate: number;
        donor_retention_rate: number;
        inflation_rate: number;
        program_expansion_rate: number;
      };
      revenue_projection: Array<{
        year: number;
        donations: number;
        grants: number;
        earned_income: number;
        total_revenue: number;
      }>;
      expense_projection: Array<{
        year: number;
        staffing: number;
        program_costs: number;
        admin: number;
        marketing: number;
        total_expenses: number;
      }>;
      net_income_projection: Array<{
        year: number;
        net_income: number;
      }>;
      cash_flow_projection: Array<{
        year: number;
        beginning_cash: number;
        net_cash_flow: number;
        ending_cash: number;
      }>;
      kpi_metrics: {
        program_ratio: number;
        admin_ratio: number;
        fundraising_efficiency: number;
        cash_reserve_months: number;
      };
      scenario_analysis: {
        base_case: string;
        worst_case: string;
        best_case: string;
      };
    };
    justification: string;
  };
}

interface CampaignWizardComprehensiveProps {
  onComplete: (data: any) => void;
  onCancel: () => void;
  initialData?: ComprehensiveCampaignData;
}

const JustifiedFieldInput: React.FC<{
  label: string;
  value: string;
  justification: string;
  onChange: (value: string) => void;
  type?: 'text' | 'textarea' | 'number' | 'date';
  placeholder?: string;
}> = ({ label, value, justification, onChange, type = 'text', placeholder }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <Label>{label}</Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="inline-flex">
            <Info className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{justification}</p>
        </TooltipContent>
      </Tooltip>
    </div>
    {type === 'textarea' ? (
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
      />
    ) : type === 'number' ? (
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    ) : type === 'date' ? (
      <Input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    ) : (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    )}
  </div>
);

export const CampaignWizardComprehensive: React.FC<CampaignWizardComprehensiveProps> = ({
  onComplete,
  onCancel,
  initialData
}) => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { generateCampaign, isGenerating } = useCampaignGeneration();
  const [currentStep, setCurrentStep] = useState(0);
  const [loadingAiGeneration, setLoadingAiGeneration] = useState(false);
  const [aiGenerationError, setAiGenerationError] = useState<string | null>(null);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [campaignData, setCampaignData] = useState<ComprehensiveCampaignData>(
    initialData || {
      title: { value: '', justification: '' },
      mission_statement: { value: '', justification: '' },
      description: { value: '', justification: '' },
      target_amount: { value: 0, justification: '' },
      current_amount: { value: 0, justification: '' },
      minimum_investment: { value: 0, justification: '' },
      campaign_start_date: { value: '', justification: '' },
      campaign_end_date: { value: '', justification: '' },
      church_name: { value: profile?.church_name || '', justification: 'Auto-populated from your profile' },
      impact_metrics: { value: {}, justification: '' },
      media_urls: { value: [], justification: '' },
      logo: { value: [], justification: '' },
      funding_breakdown: { value: {}, justification: '' },
      use_of_funds: { value: '', justification: '' },
      testimonials: { value: [], justification: '' },
      team: { value: [], justification: '' },
      contact_info: { value: { email: '', phone: '', website: '' }, justification: '' },
      donation_tiers: { value: [], justification: '' },
      reporting_commitments: { value: { frequency: '', report_types: [] }, justification: '' },
      project_plan: { value: [], justification: '' },
      marketing_campaign: {
        value: {
          objectives: {
            mission_statement: '',
            theological_foundations: [],
            core_values: [],
            key_messages: [],
            objectives_narrative: ''
          },
          action_plan: {
            objectives_and_goals_narrative: '',
            objectives_and_goals: [],
            action_steps_narrative: '',
            action_steps: []
          },
          dealing_with_resistance: {
            change_management_challenge: '',
            strategy: [],
            action_steps_narrative: '',
            action_steps: []
          }
        },
        justification: ''
      },
      pro_forma_financials: {
        value: {
          assumptions: {
            growth_rate: 0,
            donor_retention_rate: 0,
            inflation_rate: 0,
            program_expansion_rate: 0
          },
          revenue_projection: [],
          expense_projection: [],
          net_income_projection: [],
          cash_flow_projection: [],
          kpi_metrics: {
            program_ratio: 0,
            admin_ratio: 0,
            fundraising_efficiency: 0,
            cash_reserve_months: 0
          },
          scenario_analysis: {
            base_case: '',
            worst_case: '',
            best_case: ''
          }
        },
        justification: ''
      }
    }
  );

  const steps = [
    { title: 'Basic Info', description: 'Campaign title, mission, and description' },
    { title: 'Financials', description: 'Funding goals, breakdown, and use of funds' },
    { title: 'Pro Forma', description: 'Financial projections, KPIs, and scenarios' },
    { title: 'Impact & Media', description: 'Impact metrics, logos, and media assets' },
    { title: 'Team & Testimonials', description: 'Team members and testimonials' },
    { title: 'Project Plan', description: 'Timeline and execution steps' },
    { title: 'Marketing Campaign', description: 'Operational plan and marketing strategy' },
    { title: 'Engagement', description: 'Donation tiers, reporting, and contact info' }
  ];

  const updateField = <K extends keyof ComprehensiveCampaignData>(
    field: K,
    value: ComprehensiveCampaignData[K]['value'],
    justification?: string
  ) => {
    setCampaignData(prev => ({
      ...prev,
      [field]: {
        value,
        justification: justification || prev[field].justification
      }
    }));
  };

  const handleGenerateWithAI = async () => {
    try {
      console.log('[CampaignWizardComprehensive] Starting AI generation...');
      const aiData = await generateCampaign();
      
      if (aiData) {
        console.log('[CampaignWizardComprehensive] Raw AI data received:', aiData);
        
        // The AI returns data in the format: { Ministry: { field: { value, justification } } }
        // We need to extract the actual structure from the response
        let ministryData: any = {};
        let proFormaData: any = {};
        
        // Handle different possible response structures
        if ((aiData as any).Ministry) {
          ministryData = (aiData as any).Ministry;
        } else {
          // Fallback: assume aiData itself contains the ministry fields
          ministryData = aiData;
        }
        
        if (aiData.pro_forma_financials) {
          proFormaData = aiData.pro_forma_financials;
        }
        
        console.log('[CampaignWizardComprehensive] Extracted ministry data:', ministryData);
        console.log('[CampaignWizardComprehensive] Extracted pro forma data:', proFormaData);
        
        // Helper function to safely extract value and justification
        const extractField = (field: any, fallback: any = '') => {
          if (field && typeof field === 'object' && 'value' in field) {
            return {
              value: field.value ?? fallback,
              justification: field.justification || 'AI-generated content'
            };
          }
          return {
            value: field ?? fallback,
            justification: 'AI-generated content'
          };
        };
        
        // Transform AI data to comprehensive format
        const transformedData: Partial<ComprehensiveCampaignData> = {
          title: extractField(ministryData.title, ''),
          mission_statement: extractField(ministryData.mission_statement, ''),
          description: extractField(ministryData.description, ''),
          target_amount: extractField(ministryData.target_amount, 100000),
          current_amount: extractField(ministryData.current_amount, 0),
          minimum_investment: extractField(ministryData.minimum_investment, 5000),
          campaign_start_date: extractField(ministryData.campaign_start_date, ''),
          campaign_end_date: extractField(ministryData.campaign_end_date, ''),
          church_name: extractField(ministryData.church_name, ''),
          use_of_funds: extractField(ministryData.use_of_funds, ''),
          team: extractField(ministryData.team, []),
          testimonials: extractField(ministryData.testimonials, []),
          contact_info: extractField(ministryData.contact_info, { email: '', phone: '', website: '' }),
          donation_tiers: extractField(ministryData.donation_tiers, []),
          project_plan: extractField(ministryData.project_plan, []),
          impact_metrics: extractField(ministryData.impact_metrics, {}),
          funding_breakdown: extractField(ministryData.funding_breakdown, {}),
          reporting_commitments: extractField(ministryData.reporting_commitments, {}),
          media_urls: extractField(ministryData.media_urls, []),
          logo: extractField(ministryData.logo, []),
          
          // Pro forma financials
          pro_forma_financials: {
            value: {
              assumptions: extractField(proFormaData.assumptions, {}).value,
              revenue_projection: extractField(proFormaData.revenue_projection, []).value,
              expense_projection: extractField(proFormaData.expense_projection, []).value,
              net_income_projection: extractField(proFormaData.net_income_projection, []).value,
              cash_flow_projection: extractField(proFormaData.cash_flow_projection, []).value,
              kpi_metrics: extractField(proFormaData.kpi_metrics, {}).value,
              scenario_analysis: extractField(proFormaData.scenario_analysis, {}).value
            },
            justification: 'AI-generated comprehensive financial projections'
          },
          
          // Marketing campaign - use default structure for now
          marketing_campaign: {
            value: {
              objectives: {
                mission_statement: '',
                theological_foundations: [],
                core_values: [],
                key_messages: [],
                objectives_narrative: ''
              },
              action_plan: {
                objectives_and_goals_narrative: '',
                objectives_and_goals: [],
                action_steps_narrative: '',
                action_steps: []
              },
              dealing_with_resistance: {
                change_management_challenge: '',
                strategy: [],
                action_steps_narrative: '',
                action_steps: []
              }
            },
            justification: 'AI-generated marketing campaign strategy'
          }
        };
        
        setCampaignData(prev => ({ ...prev, ...transformedData }));
        
        toast({
          title: "AI Content Generated",
          description: "Your campaign has been populated with AI-generated content. Review and customize as needed."
        });
      }
    } catch (error) {
      console.error('[CampaignWizardComprehensive] AI generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate AI content. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save your campaign.",
        variant: "destructive"
      });
      return;
    }

    try {
      const dbData = {
        title: campaignData.title.value,
        mission_statement: campaignData.mission_statement.value,
        description: campaignData.description.value,
        target_amount: campaignData.target_amount.value,
        current_amount: campaignData.current_amount.value,
        minimum_investment: campaignData.minimum_investment.value,
        campaign_start_date: campaignData.campaign_start_date.value,
        campaign_end_date: campaignData.campaign_end_date.value,
        church_name: campaignData.church_name.value,
        contact_info: campaignData.contact_info.value,
        team_members: campaignData.team.value,
        testimonials: campaignData.testimonials.value,
        donation_tiers: campaignData.donation_tiers.value,
        project_plan: campaignData.project_plan.value,
        use_of_funds: campaignData.use_of_funds.value,
        funding_breakdown: campaignData.funding_breakdown.value,
        campaign_data: campaignData,
        user_id: user.id,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('ministries')
        .insert([dbData]);

      if (error) throw error;

      toast({
        title: "Campaign Saved",
        description: "Your comprehensive campaign has been saved successfully.",
      });

      onComplete(dbData);
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save campaign. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle media upload completion
  const handleMediaUploaded = (mediaUrls: { logos: string[], communityPhotos: string[] }) => {
    // Update logo URLs
    if (mediaUrls.logos.length > 0) {
      const currentLogos = campaignData.logo.value;
      const newLogos = [...currentLogos, ...mediaUrls.logos];
      updateField('logo', newLogos);
    }
    
    // Update media URLs
    if (mediaUrls.communityPhotos.length > 0) {
      const currentMedia = campaignData.media_urls.value;
      const newMedia = [...currentMedia, ...mediaUrls.communityPhotos];
      updateField('media_urls', newMedia);
    }
    
    setShowMediaUpload(false);
    toast({
      title: "Media Uploaded Successfully",
      description: `Uploaded ${mediaUrls.logos.length} logos and ${mediaUrls.communityPhotos.length} community photos.`
    });
  };

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <JustifiedFieldInput
        label="Campaign Title"
        value={campaignData.title.value}
        justification={campaignData.title.justification}
        onChange={(value) => updateField('title', value)}
        placeholder="Enter campaign title"
      />
      <JustifiedFieldInput
        label="Mission Statement"
        value={campaignData.mission_statement.value}
        justification={campaignData.mission_statement.justification}
        onChange={(value) => updateField('mission_statement', value)}
        type="textarea"
        placeholder="Brief mission statement"
      />
      <JustifiedFieldInput
        label="Description"
        value={campaignData.description.value}
        justification={campaignData.description.justification}
        onChange={(value) => updateField('description', value)}
        type="textarea"
        placeholder="Detailed description"
      />
      <JustifiedFieldInput
        label="Community"
        value={campaignData.church_name.value}
        justification={campaignData.church_name.justification}
        onChange={(value) => updateField('church_name', value)}
        placeholder="Sponsoring church name"
      />
    </div>
  );

  const renderFinancials = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <JustifiedFieldInput
          label="Target Amount ($)"
          value={campaignData.target_amount.value.toString()}
          justification={campaignData.target_amount.justification}
          onChange={(value) => updateField('target_amount', parseInt(value) || 0)}
          type="number"
        />
        <JustifiedFieldInput
          label="Minimum Investment ($)"
          value={campaignData.minimum_investment.value.toString()}
          justification={campaignData.minimum_investment.justification}
          onChange={(value) => updateField('minimum_investment', parseInt(value) || 0)}
          type="number"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <JustifiedFieldInput
          label="Campaign Start Date"
          value={campaignData.campaign_start_date.value}
          justification={campaignData.campaign_start_date.justification}
          onChange={(value) => updateField('campaign_start_date', value)}
          type="date"
        />
        <JustifiedFieldInput
          label="Campaign End Date"
          value={campaignData.campaign_end_date.value}
          justification={campaignData.campaign_end_date.justification}
          onChange={(value) => updateField('campaign_end_date', value)}
          type="date"
        />
      </div>
      <JustifiedFieldInput
        label="Use of Funds"
        value={campaignData.use_of_funds.value}
        justification={campaignData.use_of_funds.justification}
        onChange={(value) => updateField('use_of_funds', value)}
        type="textarea"
        placeholder="How funds will be used"
      />
    </div>
  );

  // Step 3: Pro Forma Financials
  const renderProForma = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Financial Assumptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Growth Rate (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={(campaignData.pro_forma_financials.value.assumptions.growth_rate * 100).toString()}
                onChange={(e) => {
                  const newAssumptions = {
                    ...campaignData.pro_forma_financials.value.assumptions,
                    growth_rate: parseFloat(e.target.value) / 100 || 0
                  };
                  updateField('pro_forma_financials', {
                    ...campaignData.pro_forma_financials.value,
                    assumptions: newAssumptions
                  });
                }}
                placeholder="10"
              />
            </div>
            <div>
              <Label>Donor/Inventor Retention Rate (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={(campaignData.pro_forma_financials.value.assumptions.donor_retention_rate * 100).toString()}
                onChange={(e) => {
                  const newAssumptions = {
                    ...campaignData.pro_forma_financials.value.assumptions,
                    donor_retention_rate: parseFloat(e.target.value) / 100 || 0
                  };
                  updateField('pro_forma_financials', {
                    ...campaignData.pro_forma_financials.value,
                    assumptions: newAssumptions
                  });
                }}
                placeholder="85"
              />
            </div>
            <div>
              <Label>Inflation Rate (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={(campaignData.pro_forma_financials.value.assumptions.inflation_rate * 100).toString()}
                onChange={(e) => {
                  const newAssumptions = {
                    ...campaignData.pro_forma_financials.value.assumptions,
                    inflation_rate: parseFloat(e.target.value) / 100 || 0
                  };
                  updateField('pro_forma_financials', {
                    ...campaignData.pro_forma_financials.value,
                    assumptions: newAssumptions
                  });
                }}
                placeholder="3"
              />
            </div>
            <div>
              <Label>Program Expansion Rate (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={(campaignData.pro_forma_financials.value.assumptions.program_expansion_rate * 100).toString()}
                onChange={(e) => {
                  const newAssumptions = {
                    ...campaignData.pro_forma_financials.value.assumptions,
                    program_expansion_rate: parseFloat(e.target.value) / 100 || 0
                  };
                  updateField('pro_forma_financials', {
                    ...campaignData.pro_forma_financials.value,
                    assumptions: newAssumptions
                  });
                }}
                placeholder="20"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scenario Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Base Case</Label>
              <Textarea
                value={campaignData.pro_forma_financials.value.scenario_analysis.base_case}
                onChange={(e) => {
                  const newScenarios = {
                    ...campaignData.pro_forma_financials.value.scenario_analysis,
                    base_case: e.target.value
                  };
                  updateField('pro_forma_financials', {
                    ...campaignData.pro_forma_financials.value,
                    scenario_analysis: newScenarios
                  });
                }}
                placeholder="Expected growth scenario"
                rows={2}
              />
            </div>
            <div>
              <Label>Best Case</Label>
              <Textarea
                value={campaignData.pro_forma_financials.value.scenario_analysis.best_case}
                onChange={(e) => {
                  const newScenarios = {
                    ...campaignData.pro_forma_financials.value.scenario_analysis,
                    best_case: e.target.value
                  };
                  updateField('pro_forma_financials', {
                    ...campaignData.pro_forma_financials.value,
                    scenario_analysis: newScenarios
                  });
                }}
                placeholder="Optimistic growth scenario"
                rows={2}
              />
            </div>
            <div>
              <Label>Worst Case</Label>
              <Textarea
                value={campaignData.pro_forma_financials.value.scenario_analysis.worst_case}
                onChange={(e) => {
                  const newScenarios = {
                    ...campaignData.pro_forma_financials.value.scenario_analysis,
                    worst_case: e.target.value
                  };
                  updateField('pro_forma_financials', {
                    ...campaignData.pro_forma_financials.value,
                    scenario_analysis: newScenarios
                  });
                }}
                placeholder="Conservative growth scenario"
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Step 4: Impact & Media
  const renderImpactAndMedia = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Impact Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Define key metrics that demonstrate your ministry's expected impact
            </div>
            {Object.entries(campaignData.impact_metrics.value).map(([key, value], index) => (
              <div key={index} className="grid grid-cols-2 gap-4">
                <Input
                  value={key}
                  onChange={(e) => {
                    const newMetrics = { ...campaignData.impact_metrics.value };
                    delete newMetrics[key];
                    newMetrics[e.target.value] = value;
                    updateField('impact_metrics', newMetrics);
                  }}
                  placeholder="Metric name (e.g., people_served)"
                />
                <Input
                  value={value.toString()}
                  onChange={(e) => {
                    const newMetrics = {
                      ...campaignData.impact_metrics.value,
                      [key]: isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value)
                    };
                    updateField('impact_metrics', newMetrics);
                  }}
                  placeholder="Value"
                />
              </div>
            ))}
            <Button
              onClick={() => {
                const newMetrics = {
                  ...campaignData.impact_metrics.value,
                  [`metric_${Object.keys(campaignData.impact_metrics.value).length + 1}`]: 0
                };
                updateField('impact_metrics', newMetrics);
              }}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Metric
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Media Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Logo URLs</Label>
              {campaignData.logo.value.map((url, index) => (
                <div key={index} className="flex gap-2 mt-2">
                  <Input
                    value={url}
                    onChange={(e) => {
                      const newLogos = [...campaignData.logo.value];
                      newLogos[index] = e.target.value;
                      updateField('logo', newLogos);
                    }}
                    placeholder="Logo URL"
                  />
                  <Button
                    onClick={() => {
                      const newLogos = campaignData.logo.value.filter((_, i) => i !== index);
                      updateField('logo', newLogos);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                onClick={() => setShowMediaUpload(true)}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Upload Logo
              </Button>
            </div>

            <div>
              <Label>Media URLs</Label>
              {campaignData.media_urls.value.map((url, index) => (
                <div key={index} className="flex gap-2 mt-2">
                  <Input
                    value={url}
                    onChange={(e) => {
                      const newMedia = [...campaignData.media_urls.value];
                      newMedia[index] = e.target.value;
                      updateField('media_urls', newMedia);
                    }}
                    placeholder="Media URL"
                  />
                  <Button
                    onClick={() => {
                      const newMedia = campaignData.media_urls.value.filter((_, i) => i !== index);
                      updateField('media_urls', newMedia);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                onClick={() => setShowMediaUpload(true)}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Upload Media
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Step 5: Team & Testimonials
  const renderTeamAndTestimonials = () => (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Team Members</h3>
          <Button
            onClick={() => {
              const newTeam = [...campaignData.team.value, { name: '', role: '', bio: '' }];
              updateField('team', newTeam);
            }}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Team Member
          </Button>
        </div>
        
        {campaignData.team.value.map((member, index) => (
          <Card key={index} className="mb-4">
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={member.name}
                    onChange={(e) => {
                      const newTeam = [...campaignData.team.value];
                      newTeam[index].name = e.target.value;
                      updateField('team', newTeam);
                    }}
                    placeholder="Team member name"
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Input
                    value={member.role}
                    onChange={(e) => {
                      const newTeam = [...campaignData.team.value];
                      newTeam[index].role = e.target.value;
                      updateField('team', newTeam);
                    }}
                    placeholder="Role/Position"
                  />
                </div>
              </div>
              <div className="mb-4">
                <Label>Bio</Label>
                <Textarea
                  value={member.bio}
                  onChange={(e) => {
                    const newTeam = [...campaignData.team.value];
                    newTeam[index].bio = e.target.value;
                    updateField('team', newTeam);
                  }}
                  placeholder="Brief biography"
                  rows={3}
                />
              </div>
              <Button
                onClick={() => {
                  const newTeam = campaignData.team.value.filter((_, i) => i !== index);
                  updateField('team', newTeam);
                }}
                variant="outline"
                size="sm"
              >
                <Minus className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Testimonials</h3>
          <Button
            onClick={() => {
              const newTestimonials = [...campaignData.testimonials.value, { author: '', quote: '' }];
              updateField('testimonials', newTestimonials);
            }}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Testimonial
          </Button>
        </div>
        
        {campaignData.testimonials.value.map((testimonial, index) => (
          <Card key={index} className="mb-4">
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <Label>Author</Label>
                  <Input
                    value={testimonial.author}
                    onChange={(e) => {
                      const newTestimonials = [...campaignData.testimonials.value];
                      newTestimonials[index].author = e.target.value;
                      updateField('testimonials', newTestimonials);
                    }}
                    placeholder="Testimonial author"
                  />
                </div>
                <div>
                  <Label>Quote</Label>
                  <Textarea
                    value={testimonial.quote}
                    onChange={(e) => {
                      const newTestimonials = [...campaignData.testimonials.value];
                      newTestimonials[index].quote = e.target.value;
                      updateField('testimonials', newTestimonials);
                    }}
                    placeholder="Testimonial quote"
                    rows={3}
                  />
                </div>
              </div>
              <Button
                onClick={() => {
                  const newTestimonials = campaignData.testimonials.value.filter((_, i) => i !== index);
                  updateField('testimonials', newTestimonials);
                }}
                variant="outline"
                size="sm"
              >
                <Minus className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Step 6: Project Plan
  const renderProjectPlan = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Project Steps</h3>
        <Button
          onClick={() => {
            const newSteps = [...campaignData.project_plan.value, { 
              step: '', 
              description: '', 
              owner: '', 
              timeline: '' 
            }];
            updateField('project_plan', newSteps);
          }}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Step
        </Button>
      </div>
      
      {campaignData.project_plan.value.map((step, index) => (
        <Card key={index} className="mb-4">
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label>Step Name</Label>
                <Input
                  value={step.step}
                  onChange={(e) => {
                    const newSteps = [...campaignData.project_plan.value];
                    newSteps[index].step = e.target.value;
                    updateField('project_plan', newSteps);
                  }}
                  placeholder="Step name"
                />
              </div>
              <div>
                <Label>Owner</Label>
                <Input
                  value={step.owner}
                  onChange={(e) => {
                    const newSteps = [...campaignData.project_plan.value];
                    newSteps[index].owner = e.target.value;
                    updateField('project_plan', newSteps);
                  }}
                  placeholder="Step owner"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <Label>Description</Label>
                <Textarea
                  value={step.description}
                  onChange={(e) => {
                    const newSteps = [...campaignData.project_plan.value];
                    newSteps[index].description = e.target.value;
                    updateField('project_plan', newSteps);
                  }}
                  placeholder="Step description"
                  rows={3}
                />
              </div>
              <div>
                <Label>Timeline</Label>
                <Input
                  value={step.timeline}
                  onChange={(e) => {
                    const newSteps = [...campaignData.project_plan.value];
                    newSteps[index].timeline = e.target.value;
                    updateField('project_plan', newSteps);
                  }}
                  placeholder="Timeline (e.g., 2025-08-01 to 2025-08-15)"
                />
              </div>
            </div>
            <Button
              onClick={() => {
                const newSteps = campaignData.project_plan.value.filter((_, i) => i !== index);
                updateField('project_plan', newSteps);
              }}
              variant="outline"
              size="sm"
            >
              <Minus className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Step 7: Engagement
  const renderEngagement = () => (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Donation Tiers</h3>
          <Button
            onClick={() => {
              const newTiers = [...campaignData.donation_tiers.value, { 
                label: '', 
                amount: 0, 
                description: '' 
              }];
              updateField('donation_tiers', newTiers);
            }}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Tier
          </Button>
        </div>
        
        {campaignData.donation_tiers.value.map((tier, index) => (
          <Card key={index} className="mb-4">
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>Tier Label</Label>
                  <Input
                    value={tier.label}
                    onChange={(e) => {
                      const newTiers = [...campaignData.donation_tiers.value];
                      newTiers[index].label = e.target.value;
                      updateField('donation_tiers', newTiers);
                    }}
                    placeholder="e.g., Supporter, Champion"
                  />
                </div>
                <div>
                  <Label>Amount ($)</Label>
                  <Input
                    type="number"
                    value={tier.amount.toString()}
                    onChange={(e) => {
                      const newTiers = [...campaignData.donation_tiers.value];
                      newTiers[index].amount = parseInt(e.target.value) || 0;
                      updateField('donation_tiers', newTiers);
                    }}
                    placeholder="100"
                  />
                </div>
              </div>
              <div className="mb-4">
                <Label>Description</Label>
                <Textarea
                  value={tier.description}
                  onChange={(e) => {
                    const newTiers = [...campaignData.donation_tiers.value];
                    newTiers[index].description = e.target.value;
                    updateField('donation_tiers', newTiers);
                  }}
                  placeholder="What this tier provides"
                  rows={2}
                />
              </div>
              <Button
                onClick={() => {
                  const newTiers = campaignData.donation_tiers.value.filter((_, i) => i !== index);
                  updateField('donation_tiers', newTiers);
                }}
                variant="outline"
                size="sm"
              >
                <Minus className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Reporting Commitments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Reporting Frequency</Label>
              <Input
                value={campaignData.reporting_commitments.value.frequency}
                onChange={(e) => {
                  const newCommitments = {
                    ...campaignData.reporting_commitments.value,
                    frequency: e.target.value
                  };
                  updateField('reporting_commitments', newCommitments);
                }}
                placeholder="e.g., quarterly, monthly"
              />
            </div>
            <div>
              <Label>Report Types (comma-separated)</Label>
              <Input
                value={campaignData.reporting_commitments.value.report_types.join(', ')}
                onChange={(e) => {
                  const types = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                  const newCommitments = {
                    ...campaignData.reporting_commitments.value,
                    report_types: types
                  };
                  updateField('reporting_commitments', newCommitments);
                }}
                placeholder="financial, impact, narrative"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={campaignData.contact_info.value.email}
                onChange={(e) => {
                  const newContact = {
                    ...campaignData.contact_info.value,
                    email: e.target.value
                  };
                  updateField('contact_info', newContact);
                }}
                placeholder="info@ministry.org"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={campaignData.contact_info.value.phone}
                onChange={(e) => {
                  const newContact = {
                    ...campaignData.contact_info.value,
                    phone: e.target.value
                  };
                  updateField('contact_info', newContact);
                }}
                placeholder="+1-555-0123"
              />
            </div>
            <div>
              <Label>Website</Label>
              <Input
                type="url"
                value={campaignData.contact_info.value.website}
                onChange={(e) => {
                  const newContact = {
                    ...campaignData.contact_info.value,
                    website: e.target.value
                  };
                  updateField('contact_info', newContact);
                }}
                placeholder="https://ministry.org"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Step 7: Marketing Campaign (incorporates operational plan from discernment_plan prompt)
  const renderMarketingCampaign = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mission & Objectives</CardTitle>
          <p className="text-sm text-muted-foreground">
            Create a comprehensive marketing strategy for your campaign based on the details you've entered in previous sections. This includes vision statements, theological foundations, action plans, and strategies for addressing potential donor concerns.
          </p>
          {aiGenerationError && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {aiGenerationError}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Mission Statement</Label>
              <Textarea
                value={campaignData.marketing_campaign.value.objectives.mission_statement}
                onChange={(e) => {
                  const newObjectives = {
                    ...campaignData.marketing_campaign.value.objectives,
                    mission_statement: e.target.value
                  };
                  updateField('marketing_campaign', {
                    ...campaignData.marketing_campaign.value,
                    objectives: newObjectives
                  });
                }}
                placeholder="Our mission is to..."
                rows={3}
              />
            </div>
            
            <div>
              <Label>Objectives Narrative</Label>
              <Textarea
                value={campaignData.marketing_campaign.value.objectives.objectives_narrative}
                onChange={(e) => {
                  const newObjectives = {
                    ...campaignData.marketing_campaign.value.objectives,
                    objectives_narrative: e.target.value
                  };
                  updateField('marketing_campaign', {
                    ...campaignData.marketing_campaign.value,
                    objectives: newObjectives
                  });
                }}
                placeholder="Describe the overall objectives and vision..."
                rows={4}
              />
            </div>
            
            <div>
              <Label>Theological Foundations</Label>
              {campaignData.marketing_campaign.value.objectives.theological_foundations.map((foundation, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 border rounded">
                  <div>
                    <Label>Bible Verse</Label>
                    <Input
                      value={foundation.verse}
                      onChange={(e) => {
                        const newFoundations = [...campaignData.marketing_campaign.value.objectives.theological_foundations];
                        newFoundations[index].verse = e.target.value;
                        const newObjectives = {
                          ...campaignData.marketing_campaign.value.objectives,
                          theological_foundations: newFoundations
                        };
                        updateField('marketing_campaign', {
                          ...campaignData.marketing_campaign.value,
                          objectives: newObjectives
                        });
                      }}
                      placeholder="e.g., Matthew 28:19-20"
                    />
                  </div>
                  <div>
                    <Label>Explanation</Label>
                    <Textarea
                      value={foundation.explanation}
                      onChange={(e) => {
                        const newFoundations = [...campaignData.marketing_campaign.value.objectives.theological_foundations];
                        newFoundations[index].explanation = e.target.value;
                        const newObjectives = {
                          ...campaignData.marketing_campaign.value.objectives,
                          theological_foundations: newFoundations
                        };
                        updateField('marketing_campaign', {
                          ...campaignData.marketing_campaign.value,
                          objectives: newObjectives
                        });
                      }}
                      placeholder="How this verse supports our mission"
                      rows={2}
                    />
                  </div>
                  <Button
                    onClick={() => {
                      const newFoundations = campaignData.marketing_campaign.value.objectives.theological_foundations.filter((_, i) => i !== index);
                      const newObjectives = {
                        ...campaignData.marketing_campaign.value.objectives,
                        theological_foundations: newFoundations
                      };
                      updateField('marketing_campaign', {
                        ...campaignData.marketing_campaign.value,
                        objectives: newObjectives
                      });
                    }}
                    variant="outline"
                    size="sm"
                    className="col-span-2"
                  >
                    <Minus className="h-4 w-4 mr-2" />
                    Remove Foundation
                  </Button>
                </div>
              ))}
              <Button
                onClick={() => {
                  const newFoundations = [...campaignData.marketing_campaign.value.objectives.theological_foundations, { verse: '', explanation: '' }];
                  const newObjectives = {
                    ...campaignData.marketing_campaign.value.objectives,
                    theological_foundations: newFoundations
                  };
                  updateField('marketing_campaign', {
                    ...campaignData.marketing_campaign.value,
                    objectives: newObjectives
                  });
                }}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Theological Foundation
              </Button>
            </div>
            
            <div>
              <Label>Core Values (comma-separated)</Label>
              <Input
                value={campaignData.marketing_campaign.value.objectives.core_values.join(', ')}
                onChange={(e) => {
                  const values = e.target.value.split(',').map(v => v.trim()).filter(v => v);
                  const newObjectives = {
                    ...campaignData.marketing_campaign.value.objectives,
                    core_values: values
                  };
                  updateField('marketing_campaign', {
                    ...campaignData.marketing_campaign.value,
                    objectives: newObjectives
                  });
                }}
                placeholder="Faith, Community, Service, Compassion"
              />
            </div>
            
            <div>
              <Label>Key Messages (comma-separated)</Label>
              <Input
                value={campaignData.marketing_campaign.value.objectives.key_messages.join(', ')}
                onChange={(e) => {
                  const messages = e.target.value.split(',').map(m => m.trim()).filter(m => m);
                  const newObjectives = {
                    ...campaignData.marketing_campaign.value.objectives,
                    key_messages: messages
                  };
                  updateField('marketing_campaign', {
                    ...campaignData.marketing_campaign.value,
                    objectives: newObjectives
                  });
                }}
                placeholder="Transform lives, Build community, Serve others"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Action Plan</CardTitle>
          <p className="text-sm text-muted-foreground">
            Define specific goals and action steps for your ministry campaign
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Goals & Objectives Narrative</Label>
              <Textarea
                value={campaignData.marketing_campaign.value.action_plan.objectives_and_goals_narrative}
                onChange={(e) => {
                  const newActionPlan = {
                    ...campaignData.marketing_campaign.value.action_plan,
                    objectives_and_goals_narrative: e.target.value
                  };
                  updateField('marketing_campaign', {
                    ...campaignData.marketing_campaign.value,
                    action_plan: newActionPlan
                  });
                }}
                placeholder="Describe the overall goals and objectives..."
                rows={3}
              />
            </div>
            
            <div>
              <Label>Specific Goals (comma-separated)</Label>
              <Input
                value={campaignData.marketing_campaign.value.action_plan.objectives_and_goals.join(', ')}
                onChange={(e) => {
                  const goals = e.target.value.split(',').map(g => g.trim()).filter(g => g);
                  const newActionPlan = {
                    ...campaignData.marketing_campaign.value.action_plan,
                    objectives_and_goals: goals
                  };
                  updateField('marketing_campaign', {
                    ...campaignData.marketing_campaign.value,
                    action_plan: newActionPlan
                  });
                }}
                placeholder="Reach 500 families, Launch 3 programs, Build community center"
              />
            </div>
            
            <div>
              <Label>Action Steps Narrative</Label>
              <Textarea
                value={campaignData.marketing_campaign.value.action_plan.action_steps_narrative}
                onChange={(e) => {
                  const newActionPlan = {
                    ...campaignData.marketing_campaign.value.action_plan,
                    action_steps_narrative: e.target.value
                  };
                  updateField('marketing_campaign', {
                    ...campaignData.marketing_campaign.value,
                    action_plan: newActionPlan
                  });
                }}
                placeholder="Describe the implementation approach..."
                rows={3}
              />
            </div>
            
            <div>
              <Label>Action Steps</Label>
              {campaignData.marketing_campaign.value.action_plan.action_steps.map((step, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    value={step.description}
                    onChange={(e) => {
                      const newSteps = [...campaignData.marketing_campaign.value.action_plan.action_steps];
                      newSteps[index].description = e.target.value;
                      const newActionPlan = {
                        ...campaignData.marketing_campaign.value.action_plan,
                        action_steps: newSteps
                      };
                      updateField('marketing_campaign', {
                        ...campaignData.marketing_campaign.value,
                        action_plan: newActionPlan
                      });
                    }}
                    placeholder="Action step description"
                  />
                  <Button
                    onClick={() => {
                      const newSteps = campaignData.marketing_campaign.value.action_plan.action_steps.filter((_, i) => i !== index);
                      const newActionPlan = {
                        ...campaignData.marketing_campaign.value.action_plan,
                        action_steps: newSteps
                      };
                      updateField('marketing_campaign', {
                        ...campaignData.marketing_campaign.value,
                        action_plan: newActionPlan
                      });
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                onClick={() => {
                  const newSteps = [...campaignData.marketing_campaign.value.action_plan.action_steps, { description: '' }];
                  const newActionPlan = {
                    ...campaignData.marketing_campaign.value.action_plan,
                    action_steps: newSteps
                  };
                  updateField('marketing_campaign', {
                    ...campaignData.marketing_campaign.value,
                    action_plan: newActionPlan
                  });
                }}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Action Step
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Change Management & Resistance</CardTitle>
          <p className="text-sm text-muted-foreground">
            Address potential resistance and change management strategies
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Change Management Challenge</Label>
              <Textarea
                value={campaignData.marketing_campaign.value.dealing_with_resistance.change_management_challenge}
                onChange={(e) => {
                  const newResistance = {
                    ...campaignData.marketing_campaign.value.dealing_with_resistance,
                    change_management_challenge: e.target.value
                  };
                  updateField('marketing_campaign', {
                    ...campaignData.marketing_campaign.value,
                    dealing_with_resistance: newResistance
                  });
                }}
                placeholder="Describe the main challenges expected..."
                rows={3}
              />
            </div>
            
            <div>
              <Label>Resistance Strategies (comma-separated)</Label>
              <Input
                value={campaignData.marketing_campaign.value.dealing_with_resistance.strategy.join(', ')}
                onChange={(e) => {
                  const strategies = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                  const newResistance = {
                    ...campaignData.marketing_campaign.value.dealing_with_resistance,
                    strategy: strategies
                  };
                  updateField('marketing_campaign', {
                    ...campaignData.marketing_campaign.value,
                    dealing_with_resistance: newResistance
                  });
                }}
                placeholder="Open communication, Gradual implementation, Community involvement"
              />
            </div>
            
            <div>
              <Label>Action Steps Narrative</Label>
              <Textarea
                value={campaignData.marketing_campaign.value.dealing_with_resistance.action_steps_narrative}
                onChange={(e) => {
                  const newResistance = {
                    ...campaignData.marketing_campaign.value.dealing_with_resistance,
                    action_steps_narrative: e.target.value
                  };
                  updateField('marketing_campaign', {
                    ...campaignData.marketing_campaign.value,
                    dealing_with_resistance: newResistance
                  });
                }}
                placeholder="How to implement resistance management..."
                rows={3}
              />
            </div>
            
            <div>
              <Label>Resistance Management Steps</Label>
              {campaignData.marketing_campaign.value.dealing_with_resistance.action_steps.map((step, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    value={step.description}
                    onChange={(e) => {
                      const newSteps = [...campaignData.marketing_campaign.value.dealing_with_resistance.action_steps];
                      newSteps[index].description = e.target.value;
                      const newResistance = {
                        ...campaignData.marketing_campaign.value.dealing_with_resistance,
                        action_steps: newSteps
                      };
                      updateField('marketing_campaign', {
                        ...campaignData.marketing_campaign.value,
                        dealing_with_resistance: newResistance
                      });
                    }}
                    placeholder="Resistance management step"
                  />
                  <Button
                    onClick={() => {
                      const newSteps = campaignData.marketing_campaign.value.dealing_with_resistance.action_steps.filter((_, i) => i !== index);
                      const newResistance = {
                        ...campaignData.marketing_campaign.value.dealing_with_resistance,
                        action_steps: newSteps
                      };
                      updateField('marketing_campaign', {
                        ...campaignData.marketing_campaign.value,
                        dealing_with_resistance: newResistance
                      });
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                onClick={() => {
                  const newSteps = [...campaignData.marketing_campaign.value.dealing_with_resistance.action_steps, { description: '' }];
                  const newResistance = {
                    ...campaignData.marketing_campaign.value.dealing_with_resistance,
                    action_steps: newSteps
                  };
                  updateField('marketing_campaign', {
                    ...campaignData.marketing_campaign.value,
                    dealing_with_resistance: newResistance
                  });
                }}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Management Step
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderBasicInfo();
      case 1: return renderFinancials();
      case 2: return renderProForma();
      case 3: return renderImpactAndMedia();
      case 4: return renderTeamAndTestimonials();
      case 5: return renderProjectPlan();
      case 6: return renderMarketingCampaign();
      case 7: return renderEngagement();
      default: return renderBasicInfo();
    }
  };

  return (
    <TooltipProvider>
      <div className="max-w-6xl mx-auto p-4 lg:p-6 space-y-6">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <h1 className="text-3xl font-bold text-gray-900">Campaign Creation Wizard</h1>
              <p className="text-lg text-gray-600 mt-2">Build a comprehensive fundraising campaign with AI assistance</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleGenerateWithAI}
                disabled={isGenerating}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2"
                size="lg"
              >
                <Wand2 className="h-5 w-5 mr-2" />
                {isGenerating ? 'Generating...' : 'Generate'}
              </Button>
              <Button onClick={onCancel} variant="outline" size="lg">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
          
          {/* AI Generation Help Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">AI-Powered Campaign Generation</h3>
                <p className="text-blue-800 text-sm">
                  Click "Generate" to automatically populate all campaign fields with intelligent, 
                  contextual content based on your ministry's needs. You can then customize and refine 
                  each section to match your specific requirements.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Progress</h3>
                <span className="text-sm text-gray-600">
                  Step {currentStep + 1} of {steps.length}
                </span>
              </div>
              <Progress value={((currentStep + 1) / steps.length) * 100} className="h-3" />
              
              {/* Step Navigation */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {steps.map((step, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`p-3 rounded-lg border text-left transition-all hover:shadow-md ${
                      index === currentStep
                        ? 'bg-blue-600 text-white border-blue-600'
                        : index < currentStep
                        ? 'bg-green-50 text-green-800 border-green-200'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      {index < currentStep ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : index === currentStep ? (
                        <Circle className="h-4 w-4 fill-current" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                      <span className="text-xs font-medium">{index + 1}</span>
                    </div>
                    <div className="text-xs font-medium truncate">{step.title}</div>
                    <div className="text-xs opacity-75 truncate">{step.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{steps[currentStep].title}</CardTitle>
            <CardDescription>{steps[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {renderCurrentStep()}
          </CardContent>
        </Card>

        {/* Navigation Footer */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex gap-3">
                <Button
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  variant="outline"
                  size="lg"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              </div>
              
              <div className="flex gap-3">
                {currentStep === steps.length - 1 ? (
                  <Button onClick={handleSave} size="lg" className="bg-green-600 hover:bg-green-700">
                    <Save className="h-4 w-4 mr-2" />
                    Save Campaign
                  </Button>
                ) : (
                  <Button 
                    onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                    size="lg"
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>


      </div>
      
      {/* Media Upload Modal */}
      <MediaUploadModal
        open={showMediaUpload}
        onClose={() => setShowMediaUpload(false)}
        onMediaUploaded={handleMediaUploaded}
        existingMedia={{
          logos: campaignData.logo.value,
          communityPhotos: campaignData.media_urls.value
        }}
      />
    </TooltipProvider>
  );
};
