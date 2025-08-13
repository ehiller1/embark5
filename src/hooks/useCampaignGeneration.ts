import { useState } from 'react';
import { useOpenAI } from '@/hooks/useOpenAI';
import { usePrompts } from '@/hooks/usePrompts';
import { CampaignData, GenerateCampaignRequest, GenerateCampaignResponse } from '@/types/campaign';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/integrations/lib/auth/UserProfileProvider';
import { cleanFinancialData } from '@/utils/financialTextUtils';

export const useCampaignGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCampaign, setGeneratedCampaign] = useState<CampaignData | null>(null);
  const { generateResponse } = useOpenAI();
  const { getPromptByType } = usePrompts();
  const { toast } = useToast();
  const { profile } = useUserProfile();

  const generateCampaign = async (request?: GenerateCampaignRequest): Promise<CampaignData | null> => {
    setIsGenerating(true);
    
    try {
      // Provide default values if request is not provided
      const defaultRequest = {
        research_summary: request?.research_summary || 'General community research and analysis',
        vocational_statement: request?.vocational_statement || 'Committed to serving our community through faith-based initiatives',
        scenario_details: request?.scenario_details || 'Standard ministry funding scenario for community outreach and growth'
      };

      // Step 1: Get the original prompt from database and populate it
      let originalPrompt: string;
      let useDatabase = false;
      
      try {
        // Use the fundraise prompt for campaign generation
        const promptResult = await getPromptByType('fundraise');
        
        if (promptResult.success && 'data' in promptResult && promptResult.data?.prompt) {
          originalPrompt = promptResult.data.prompt
            .replace('$(research_summary)', defaultRequest.research_summary)
            .replace('$(vocational_statement)', defaultRequest.vocational_statement)
            .replace('$(scenario_details)', defaultRequest.scenario_details);
          useDatabase = true;
        } else {
          throw new Error('Prompt not available');
        }
      } catch (promptError) {
        console.warn('Could not retrieve fundraise prompt, using fallback:', promptError);
        
        // Fallback prompt - comprehensive but manageable
        originalPrompt = `Generate a comprehensive ministry fundraising campaign based on the following information:

Research Summary: ${defaultRequest.research_summary}
Vocational Statement: ${defaultRequest.vocational_statement}
Scenario Details: ${defaultRequest.scenario_details}
Church Name: ${profile?.church_name || 'Community Church'}

Create a detailed fundraising campaign with ALL the following components. Each field must have both a "value" and "justification":

1. Basic Information: title, mission statement, description, church name
2. Financial Details: target amount, minimum investment, funding breakdown, use of funds
3. Timeline: campaign start/end dates
4. Contact Information: email, phone, website
5. Team Members: name, role, bio for key team members
6. Testimonials: author and quote from supporters
7. Impact Metrics: quantifiable outcomes and measures
8. Donation Tiers: different giving levels with descriptions
9. Project Plan: detailed steps with owners and timelines
10. Pro Forma Financials: assumptions, revenue/expense projections, KPIs, scenario analysis
11. Marketing Campaign: mission objectives, action plans, resistance management
12. Reporting Commitments: frequency and types of reports
13. Media Assets: logos and community photos (placeholder URLs)

Return your response as a comprehensive JSON object with the "Ministry" structure containing all fields with value/justification pairs.`;
      }

      console.log(`Using ${useDatabase ? 'database' : 'fallback'} prompt for campaign generation`);

      // Step 2: First, create a summary of the context to reduce token usage
      const summaryPrompt = `Summarize the following campaign context into key points for fundraising campaign generation:

${originalPrompt}

Provide a concise summary (under 500 words) that captures the essential information needed for generating a ministry fundraising campaign.`;

      console.log('Step 1: Creating summary of campaign context...');
      
      const summaryResponse = await generateResponse({
        messages: [
          {
            role: 'user',
            content: summaryPrompt
          }
        ],
        temperature: 0.3,
        maxTokens: 600
      });

      if (!summaryResponse.text) {
        throw new Error('Failed to generate campaign context summary');
      }

      console.log('Step 2: Generating campaign using summary...');

      // Step 3: Use the summary to generate the actual campaign
      const campaignPrompt = `Based on this campaign context summary:

${summaryResponse.text}

Generate a comprehensive ministry fundraising campaign as JSON with this EXACT structure:
{
"Ministry": {
  "title": { "value": "Campaign Title", "justification": "Why this title" },
  "mission_statement": { "value": "Mission statement", "justification": "Why this mission" },
  "description": { "value": "Detailed description", "justification": "Why this approach" },
  "target_amount": { "value": 50000, "justification": "Why this amount" },
  "current_amount": { "value": 0, "justification": "Starting amount" },
  "minimum_investment": { "value": 25, "justification": "Why this minimum" },
  "campaign_start_date": { "value": "2024-02-01T00:00", "justification": "Why this start date" },
  "campaign_end_date": { "value": "2024-11-30T23:59", "justification": "Why this duration" },
  "church_name": { "value": "${profile?.church_name || 'Community Church'}", "justification": "Church identity" },
  "contact_info": { "value": { "email": "info@church.org", "phone": "555-0100", "website": "www.church.org" }, "justification": "Contact rationale" },
  "impact_metrics": { "value": { "people_served": 200, "programs_launched": 2, "community_impact_score": 75 }, "justification": "Expected measurable impact" },
  "media_urls": { "value": ["https://example.com/photo1.jpg"], "justification": "Visual storytelling assets" },
  "logo": { "value": ["https://example.com/logo.png"], "justification": "Brand identity" },
  "funding_breakdown": { "value": { "programs": 30000, "staff": 15000, "admin": 5000 }, "justification": "Fund allocation" },
  "use_of_funds": { "value": "Community programs and ministry operations", "justification": "Clear purpose" },
  "testimonials": { "value": [{ "author": "Community Member", "quote": "Great ministry impact" }], "justification": "Social proof" },
  "team": { "value": [{ "name": "Ministry Leader", "role": "Director", "bio": "Experienced in community work" }], "justification": "Leadership" },
  "donation_tiers": { "value": [{ "label": "Supporter", "amount": 50, "description": "Basic support" }, { "label": "Partner", "amount": 250, "description": "Major support" }], "justification": "Giving options" },
  "reporting_commitments": { "value": { "frequency": "Quarterly", "report_types": ["Financial", "Impact"] }, "justification": "Accountability" },
  "project_plan": { "value": [{ "step": "Setup", "description": "Initial planning", "owner": "Team", "timeline": "Month 1" }], "justification": "Implementation plan" },
  "pro_forma_financials": { "value": { "assumptions": { "growth_rate": 0.1 }, "revenue_projection": [{ "year": 1, "total_revenue": 50000 }], "expense_projection": [{ "year": 1, "total_expenses": 45000 }] }, "justification": "Financial planning" },
  "marketing_campaign": { "value": { "objectives": { "mission_statement": "Community outreach", "core_values": ["Faith", "Service"] }, "action_plan": { "objectives_and_goals": ["Reach 100 people"] }, "dealing_with_resistance": { "strategy": ["Clear communication"] } }, "justification": "Outreach strategy" }
}
}`;

      // Generate the campaign using OpenAI with the summarized context
      const response = await generateResponse({
        messages: [
          {
            role: 'user',
            content: campaignPrompt
          }
        ],
        temperature: 0.7,
        maxTokens: 2500
      });

      if (!response.text) {
        throw new Error('No response received from OpenAI');
      }

      // Parse the JSON response
      let parsedResponse: GenerateCampaignResponse;
      try {
        parsedResponse = JSON.parse(response.text);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', response.text);
        throw new Error('Invalid JSON response from OpenAI');
      }

      if (!parsedResponse.Ministry) {
        throw new Error('Invalid response structure: missing Ministry object');
      }

      // Clean the campaign data to remove underscores and fix formatting
      const campaignData = cleanFinancialData(parsedResponse.Ministry);
      setGeneratedCampaign(campaignData);

      toast({
        title: 'Campaign Generated Successfully',
        description: 'Your fundraising campaign has been generated and is ready for review.',
      });

      return campaignData;

    } catch (error) {
      console.error('Error generating campaign:', error);
      
      toast({
        title: 'Campaign Generation Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });

      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const clearGeneratedCampaign = () => {
    setGeneratedCampaign(null);
  };

  return {
    generateCampaign,
    isGenerating,
    generatedCampaign,
    clearGeneratedCampaign,
  };
};
