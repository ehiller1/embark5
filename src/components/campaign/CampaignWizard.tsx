import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, ArrowLeft, ArrowRight, Save, Wand2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useCampaignGeneration } from '@/hooks/useCampaignGeneration';
import { ProjectDescriptionStep } from './ProjectDescriptionStep';
import { FinancialsStep } from './FinancialsStep';
import { FundraisingPlanStep } from './FundraisingPlanStep';
import { CampaignData } from '@/types/campaign';
import { supabase } from '@/integrations/lib/supabase';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';

interface CampaignWizardProps {
  onComplete?: (campaignData: CampaignData) => void;
  onCancel?: () => void;
  initialData?: any; // AI-generated campaign data
}

const steps = [
  { id: 1, title: 'Project Description', description: 'Define your ministry mission and team' },
  { id: 2, title: 'Financial Projections', description: 'Set funding goals and projections' },
  { id: 3, title: 'Fundraising Plan', description: 'Strategy and compliance requirements' },
];

export const CampaignWizard: React.FC<CampaignWizardProps> = ({
  onComplete,
  onCancel,
  initialData,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [campaignData, setCampaignData] = useState<CampaignData>({
    title: { value: '', justification: '' },
    mission_statement: { value: '', justification: '' },
    description: { value: '', justification: '' },
    church_name: { value: '', justification: '' },
    target_amount: { value: 0, justification: '' },
    current_amount: { value: 0, justification: '' },
    minimum_investment: { value: 0, justification: '' },
    campaign_start_date: { value: new Date().toISOString().split('T')[0], justification: '' },
    campaign_end_date: { value: '', justification: '' },
    media_urls: { value: [], justification: '' },
    logo: { value: [], justification: '' },
    impact_metrics: { value: {}, justification: '' },
    pro_forma_financials: {
      assumptions: { value: {
        growth_rate: 0,
        donor_retention_rate: 0,
        inflation_rate: 0,
        program_expansion_rate: 0
      }, justification: '' },
      revenue_projection: { value: [], justification: '' },
      expense_projection: { value: [], justification: '' },
      net_income_projection: { value: [], justification: '' },
      cash_flow_projection: { value: [], justification: '' },
      kpi_metrics: { value: {}, justification: '' },
      scenario_analysis: { value: {}, justification: '' }
    },
    donation_tiers: { value: [], justification: '' },
    reporting_commitments: { value: { frequency: '', report_types: [] }, justification: '' },
    project_plan: { value: [], justification: '' }
  });
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const { generateCampaign, isGenerating } = useCampaignGeneration();

  // Populate wizard with AI-generated data if provided
  useEffect(() => {
    if (initialData) {
      console.log('[CampaignWizard] Populating with AI-generated data:', initialData);
      
      // Transform AI data to CampaignData format
      const transformedData: CampaignData = {
        // Project Description
        title: { value: initialData.projectDescription?.title || '', justification: 'AI-generated campaign title' },
        mission_statement: { value: initialData.projectDescription?.missionStatement || '', justification: 'AI-generated mission statement' },
        description: { value: initialData.projectDescription?.description || '', justification: 'AI-generated description' },
        // Team members are not part of the CampaignData interface
        testimonials: { value: initialData.projectDescription?.testimonials || [], justification: 'AI-generated testimonials' },
        
        // Financials
        target_amount: { value: initialData.financials?.targetAmount || 100000, justification: 'AI-calculated target amount' },
        minimum_investment: { value: initialData.financials?.minimumInvestment || 5000, justification: 'AI-determined minimum investment' },
        campaign_start_date: { value: initialData.financials?.campaignStartDate || new Date().toISOString().split('T')[0], justification: 'AI-suggested campaign start date' },
        campaign_end_date: { value: initialData.financials?.campaignEndDate || '', justification: 'AI-suggested campaign end date' },
        impact_metrics: { value: initialData.financials?.impactMetrics || {}, justification: 'AI-projected impact metrics' },
        
        // Fundraising Plan
        risk_assessment: { value: initialData.fundraisingPlan?.riskAssessment || '', justification: 'AI-analyzed risk assessment' },
        timeline: { value: initialData.fundraisingPlan?.timeline || '', justification: 'AI-created timeline' },
      };
      
      setCampaignData(transformedData);
      
      toast({
        title: "AI Content Loaded",
        description: "Campaign has been pre-populated with AI-generated content. Review and edit as needed.",
      });
    }
  }, [initialData]);

  const updateCampaignData = (updates: Partial<CampaignData>) => {
    setCampaignData(prev => ({
      ...prev,
      ...updates,
    }));
  };

  const handleGenerateWithAI = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to generate campaign data.",
        variant: "destructive",
      });
      return;
    }

    try {
      const generatedData = await generateCampaign();
      if (generatedData) {
        setCampaignData(generatedData);
        toast({
          title: "Campaign Generated",
          description: "AI has generated your campaign data. Review and edit as needed.",
        });
      }
    } catch (error) {
      console.error('Error generating campaign:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate campaign data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          campaignData.title?.value &&
          campaignData.church_name?.value &&
          campaignData.mission_statement?.value &&
          campaignData.description?.value &&
          campaignData.contact_info?.value?.email
        );
      case 2:
        return !!(
          campaignData.target_amount?.value &&
          campaignData.minimum_investment?.value &&
          campaignData.campaign_start_date?.value &&
          campaignData.campaign_end_date?.value
        );
      case 3:
        return !!(
          campaignData.fundraising_strategy?.value ||
          campaignData.target_investors?.value
        );
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      toast({
        title: "Incomplete Step",
        description: "Please fill in all required fields before proceeding.",
        variant: "destructive",
      });
      return;
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const saveCampaign = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save your campaign.",
        variant: "destructive",
      });
      return;
    }

    if (!validateStep(1) || !validateStep(2)) {
      toast({
        title: "Validation Error",
        description: "Please complete all required fields in the first two steps.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Transform campaign data for database storage
      const campaignForDb = {
        title: campaignData.title?.value,
        mission_statement: campaignData.mission_statement?.value,
        description: campaignData.description?.value,
        target_amount: campaignData.target_amount?.value,
        current_amount: campaignData.current_amount?.value || 0,
        minimum_investment: campaignData.minimum_investment?.value,
        campaign_start_date: campaignData.campaign_start_date?.value,
        campaign_end_date: campaignData.campaign_end_date?.value,
        status: 'draft' as const,
        church_name: campaignData.church_name?.value,
        location: campaignData.contact_info?.value?.website || '',
        impact_metrics: campaignData.impact_metrics?.value || {},
        media_urls: campaignData.media_urls?.value || [],
        user_id: user.id,
        // Store the full justified data in a JSON field
        campaign_data: campaignData,
      };

      const { data, error } = await supabase
        .from('ministries')
        .insert([campaignForDb])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Campaign Saved",
        description: "Your campaign has been successfully saved as a draft.",
      });

      if (onComplete) {
        onComplete(campaignData);
      }
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save your campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ProjectDescriptionStep
            data={campaignData}
            onUpdate={updateCampaignData}
          />
        );
      case 2:
        return (
          <FinancialsStep
            data={campaignData}
            onUpdate={updateCampaignData}
          />
        );
      case 3:
        return (
          <FundraisingPlanStep
            data={campaignData}
            onUpdate={updateCampaignData}
          />
        );
      default:
        return null;
    }
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Create Campaign</h1>
        <p className="text-muted-foreground">
          Build a comprehensive fundraising campaign with AI assistance
        </p>
        <p className="text-xl text-muted-foreground">
          All your research, discernment planning, selected ministries and mission will now be converted into a funding campaign
        </p>
        {/* AI Generation Button */}
        <Button
          onClick={handleGenerateWithAI}
          disabled={isGenerating}
          className="mb-6"
          variant="outline"
        >
          <Wand2 className="h-4 w-4 mr-2" />
          {isGenerating ? 'Generating...' : 'Generate the Campaign'}
        </Button>
      </div>

      {/* Progress Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center space-x-2 ${
                    step.id === currentStep
                      ? 'text-primary'
                      : step.id < currentStep
                      ? 'text-green-600'
                      : 'text-muted-foreground'
                  }`}
                >
                  {step.id < currentStep ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                  <div className="text-center">
                    <div className="font-medium">{step.title}</div>
                    <div className="text-xs">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Step Content */}
      <div className="min-h-[600px]">
        {renderCurrentStep()}
      </div>

      {/* Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              {currentStep > 1 && (
                <Button variant="outline" onClick={handlePrevious}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>

            <div className="flex space-x-2">
              {currentStep < steps.length ? (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={saveCampaign} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Campaign'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-800">
              <strong>Error:</strong> {error}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
