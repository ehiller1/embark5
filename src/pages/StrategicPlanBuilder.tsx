import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ArrowLeft, Download, Save, FileText } from 'lucide-react';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { useUserProfile } from '@/integrations/lib/auth/UserProfileProvider';
import { useOpenAI } from '@/hooks/useOpenAI';
import { usePrompts } from '@/hooks/usePrompts';
import { useSelectedCompanion } from '@/hooks/useSelectedCompanion';
import { toast } from '@/hooks/use-toast';
import { StrategicPlanEditor } from '@/components/strategic-plan/StrategicPlanEditor';
import { StrategicPlanPDF } from '@/components/strategic-plan/StrategicPlanPDF';
import { pdf } from '@react-pdf/renderer';

interface StrategicPlan {
  plan_metadata: {
    church_name: string;
    plan_date: string;
    author: string;
    version: string;
  };
  executive_summary: string;
  mission_vision_values: {
    mission: string;
    vision: string;
    values: string[];
  };
  community_membership_transformation: {
    current_definition: string;
    redefined_membership_strategy: string;
    engagement_methods: string[];
    community_demographics: string;
    target_outcomes: string;
  };
  economic_sustainability_plan: {
    current_financial_challenges: string;
    proposed_revenue_streams: Array<{
      type: string;
      description: string;
      expected_outcomes: string;
    }>;
    sustainability_measures: string;
  };
  innovative_ministry_development: {
    traditional_ministry_limitations: string;
    proposed_innovations: Array<{
      name: string;
      description: string;
      implementation_steps: string;
      impact: string;
    }>;
  };
  environmental_scan: {
    swot: {
      strengths: string[];
      weaknesses: string[];
      opportunities: string[];
      threats: string[];
    };
    external_context: {
      social: string;
      cultural: string;
      economic: string;
      technological: string;
      political_legal: string;
    };
  };
  implementation_timeline: Array<{
    initiative: string;
    timeline: string;
    owner: string;
  }>;
  scenario_planning_risk_mitigation: Array<{
    scenario: string;
    implications: string;
    contingency_strategies: string[];
  }>;
  measurement_evaluation_adjustment: {
    key_performance_indicators: string[];
    monitoring_process: string;
    review_frequency: string;
    adjustment_process: string;
  };
  narrative: {
    mission_vision_values: string;
    community_membership_transformation: string;
    economic_sustainability_plan: string;
    innovative_ministry_development: string;
    environmental_scan: string;
    implementation_timeline: string;
    scenario_planning_risk_mitigation: string;
    measurement_evaluation_adjustment: string;
  };
}

export default function StrategicPlanBuilder() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { profile } = useUserProfile();
  const { generateResponse } = useOpenAI();
  const { getAndPopulatePrompt } = usePrompts();
  const { selectedCompanion } = useSelectedCompanion();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [strategicPlan, setStrategicPlan] = useState<StrategicPlan | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Get data from localStorage
  const getStoredData = () => {
    try {
      const planMessages = localStorage.getItem('plan_assessment_messages');
      const researchSummary = localStorage.getItem('research_summary') || '';
      const vocationalStatement = localStorage.getItem('vocational_statement') || '';
      const scenarioDetails = localStorage.getItem('scenario_details') || '';
      
      // Get SWOT data from plan assessment messages or localStorage
      let swotData = {
        strengths: '',
        weaknesses: '',
        opportunities: '',
        threats: ''
      };

      if (planMessages) {
        const messages = JSON.parse(planMessages);
        const userMessages = messages.filter((msg: any) => msg.sender === 'user');
        if (userMessages.length > 0) {
          const firstMessage = userMessages[0].content;
          // Parse SWOT from the formatted message
          const strengthsMatch = firstMessage.match(/\*\*Strengths:\*\* (.+?)(?=\n\*\*|$)/s);
          const weaknessesMatch = firstMessage.match(/\*\*Weaknesses:\*\* (.+?)(?=\n\*\*|$)/s);
          const opportunitiesMatch = firstMessage.match(/\*\*Opportunities:\*\* (.+?)(?=\n\*\*|$)/s);
          const threatsMatch = firstMessage.match(/\*\*Threats:\*\* (.+?)(?=\n\*\*|$)/s);
          
          swotData = {
            strengths: strengthsMatch ? strengthsMatch[1].trim() : '',
            weaknesses: weaknessesMatch ? weaknessesMatch[1].trim() : '',
            opportunities: opportunitiesMatch ? opportunitiesMatch[1].trim() : '',
            threats: threatsMatch ? threatsMatch[1].trim() : ''
          };
        }
      }

      // Get clean message history
      const messageHistory = planMessages ? 
        JSON.parse(planMessages)
          .filter((msg: any) => msg.content !== 'Thinking...')
          .map((msg: any) => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
          .join('\n\n') : '';

      return {
        research_summary: researchSummary,
        vocational_statement: vocationalStatement,
        scenario_details: scenarioDetails,
        user_strengths: swotData.strengths,
        user_weaknesses: swotData.weaknesses,
        user_opportunities: swotData.opportunities,
        user_threats: swotData.threats,
        message_history: messageHistory
      };
    } catch (error) {
      console.error('Error getting stored data:', error);
      return {
        research_summary: '',
        vocational_statement: '',
        scenario_details: '',
        user_strengths: '',
        user_weaknesses: '',
        user_opportunities: '',
        user_threats: '',
        message_history: ''
      };
    }
  };

  // Generate strategic plan using OpenAI
  const generateStrategicPlan = async () => {
    setIsGenerating(true);
    
    try {
      const storedData = getStoredData();
      
      // Get the strategic_plan prompt
      const { success, data, error } = await getAndPopulatePrompt(
        'strategic_plan',
        {
          companion_avatar: selectedCompanion?.companion ?? '',
          companion_type: selectedCompanion?.companion_type ?? '',
          companion_traits: Array.isArray(selectedCompanion?.traits) ? selectedCompanion.traits.join(', ') : '',
          companion_speech_pattern: selectedCompanion?.speech_pattern ?? '',
          companion_knowledge_domains: Array.isArray(selectedCompanion?.knowledge_domains) ? selectedCompanion.knowledge_domains.join(', ') : '',
          ...storedData
        }
      );

      if (!success || !data) {
        throw new Error(error as string || 'Failed to get strategic plan prompt');
      }

      // Generate the strategic plan
      const response = await generateResponse({
        messages: [
          { role: 'system', content: data.prompt }
        ],
        maxTokens: 4000,
        temperature: 0.7
      });

      if (!response.text) {
        throw new Error(response.error || 'Failed to generate strategic plan');
      }

      // Parse the JSON response
      try {
        const planData = JSON.parse(response.text);
        setStrategicPlan(planData);
        toast({
          title: "Strategic Plan Generated",
          description: "Your strategic plan has been created successfully!"
        });
      } catch (parseError) {
        console.error('Error parsing strategic plan JSON:', parseError);
        toast({
          title: "Generation Error",
          description: "The strategic plan was generated but couldn't be parsed. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error generating strategic plan:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate strategic plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Save strategic plan to resource_library
  const saveStrategicPlan = async () => {
    if (!strategicPlan || !session?.user?.id) return;
    
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          resource_type: 'strategic_plan',
          title: `Strategic Plan - ${strategicPlan.plan_metadata.church_name}`,
          content: JSON.stringify(strategicPlan),
          user_id: session.user.id,
          church_id: profile?.church_id || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save strategic plan');
      }

      toast({
        title: "Plan Saved",
        description: "Your strategic plan has been saved to your resource library!"
      });
    } catch (error) {
      console.error('Error saving strategic plan:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save strategic plan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Generate PDF
  const generatePDF = async () => {
    if (!strategicPlan) return;
    
    try {
      const blob = await pdf(<StrategicPlanPDF plan={strategicPlan} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Strategic-Plan-${strategicPlan.plan_metadata.church_name}-${strategicPlan.plan_metadata.plan_date}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "PDF Downloaded",
        description: "Your strategic plan PDF has been downloaded!"
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "PDF Generation Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/plan-assessment')}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Plan Assessment
          </Button>
          
          <h1 className="text-4xl font-serif font-semibold bg-clip-text text-transparent bg-gradient-journey mb-4">
            Strategic Plan Builder
          </h1>
          <p className="text-lg text-muted-foreground">
            Generate, edit, and export your organization's comprehensive strategic plan.
          </p>
        </div>

        {/* Generation Section */}
        {!strategicPlan && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Generate Your Strategic Plan</CardTitle>
              <CardDescription>
                Based on your research, discernment, and strategic planning interview, we'll create a comprehensive strategic plan for your organization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={generateStrategicPlan}
                disabled={isGenerating}
                className="bg-green-600 hover:bg-green-700"
              >
                {isGenerating ? (
                  <>
                    <LoadingSpinner className="mr-2" />
                    Generating Strategic Plan...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Strategic Plan
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Plan Editor */}
        {strategicPlan && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Your Strategic Plan</h2>
              <div className="flex gap-3">
                <Button
                  onClick={saveStrategicPlan}
                  disabled={isSaving}
                  variant="outline"
                >
                  {isSaving ? (
                    <>
                      <LoadingSpinner className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save to Library
                    </>
                  )}
                </Button>
                <Button
                  onClick={generatePDF}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>
            
            <StrategicPlanEditor 
              plan={strategicPlan}
              onPlanChange={setStrategicPlan}
            />
          </>
        )}
      </div>
    </div>
  );
}
