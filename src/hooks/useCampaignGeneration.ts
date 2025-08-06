import { useState } from 'react';
import { useOpenAI } from '@/hooks/useOpenAI';
import { usePrompts } from '@/hooks/usePrompts';
import { CampaignData, GenerateCampaignRequest, GenerateCampaignResponse } from '@/types/campaign';
import { useToast } from '@/hooks/use-toast';

export const useCampaignGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCampaign, setGeneratedCampaign] = useState<CampaignData | null>(null);
  const { generateResponse } = useOpenAI();
  const { getPromptByType } = usePrompts();
  const { toast } = useToast();

  const generateCampaign = async (request?: GenerateCampaignRequest): Promise<CampaignData | null> => {
    setIsGenerating(true);
    
    try {
      // Provide default values if request is not provided
      const defaultRequest = {
        research_summary: request?.research_summary || 'General community research and analysis',
        vocational_statement: request?.vocational_statement || 'Committed to serving our community through faith-based initiatives',
        scenario_details: request?.scenario_details || 'Standard ministry funding scenario for community outreach and growth'
      };

      // Try to get a fundraising-related prompt, fallback to a custom prompt
      let populatedPrompt: string;
      
      try {
        // Use the fundraise prompt for campaign generation
        const promptResult = await getPromptByType('fundraise');
        
        if (promptResult.success && 'data' in promptResult && promptResult.data?.prompt) {
          populatedPrompt = promptResult.data.prompt
            .replace('{research_summary}', defaultRequest.research_summary)
            .replace('{vocational_statement}', defaultRequest.vocational_statement)
            .replace('{scenario_details}', defaultRequest.scenario_details);
        } else {
          throw new Error('Prompt not available');
        }
      } catch (promptError) {
        console.warn('Could not retrieve discernment_plan prompt, using fallback:', promptError);
        
        // Fallback to a comprehensive fundraising prompt
        populatedPrompt = `
Generate a comprehensive ministry fundraising campaign based on the following information:

Research Summary: ${defaultRequest.research_summary}
Vocational Statement: ${defaultRequest.vocational_statement}
Scenario Details: ${defaultRequest.scenario_details}

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

Return a comprehensive JSON response with this EXACT structure:
{
"Ministry": {
  "title": { "value": "Campaign Title", "justification": "Why this title" },
  "mission_statement": { "value": "Mission statement", "justification": "Why this mission" },
  "description": { "value": "Detailed description", "justification": "Why this approach" },
  "target_amount": { "value": 100000, "justification": "Why this amount" },
  "current_amount": { "value": 0, "justification": "Starting amount" },
  "minimum_investment": { "value": 100, "justification": "Why this minimum" },
  "campaign_start_date": { "value": "2024-01-01T00:00", "justification": "Why this start date" },
  "campaign_end_date": { "value": "2024-12-31T23:59", "justification": "Why this duration" },
  "church_name": { "value": "Church Name", "justification": "Church identity" },
  "contact_info": { "value": { "email": "contact@church.org", "phone": "555-0123", "website": "www.church.org" }, "justification": "Contact rationale" },
  "impact_metrics": { "value": { "people_served": 500, "programs_launched": 3, "community_impact_score": 85 }, "justification": "Expected measurable impact" },
  "media_urls": { "value": ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"], "justification": "Visual storytelling assets" },
  "logo": { "value": ["https://example.com/logo.png"], "justification": "Brand identity" },
  "funding_breakdown": { "value": { "program_costs": 60000, "staff_salaries": 25000, "administrative": 10000, "marketing": 5000 }, "justification": "Transparent fund allocation" },
  "use_of_funds": { "value": "Detailed explanation of how funds will be used for maximum community impact", "justification": "Transparency builds trust" },
  "testimonials": { "value": [{ "author": "John Smith", "quote": "This ministry has transformed our community" }, { "author": "Mary Johnson", "quote": "I've seen firsthand the positive impact" }], "justification": "Social proof from community members" },
  "team": { "value": [{ "name": "Pastor John", "role": "Lead Pastor", "bio": "20 years of ministry experience" }, { "name": "Sarah Wilson", "role": "Program Director", "bio": "Expert in community outreach" }], "justification": "Experienced leadership team" },
  "donation_tiers": { "value": [{ "label": "Supporter", "amount": 100, "description": "Help fund basic programs" }, { "label": "Partner", "amount": 500, "description": "Support major initiatives" }, { "label": "Champion", "amount": 1000, "description": "Enable transformational impact" }], "justification": "Multiple giving levels for different capacities" },
  "reporting_commitments": { "value": { "frequency": "Quarterly", "report_types": ["Financial Report", "Impact Assessment", "Program Updates"] }, "justification": "Regular accountability and transparency" },
  "project_plan": { "value": [{ "step": "Phase 1: Setup", "description": "Establish infrastructure and hire staff", "owner": "Pastor John", "timeline": "Months 1-2" }, { "step": "Phase 2: Launch", "description": "Begin community programs", "owner": "Sarah Wilson", "timeline": "Months 3-6" }], "justification": "Clear execution roadmap" },
  "pro_forma_financials": {
    "value": {
      "assumptions": { "growth_rate": 0.15, "donor_retention_rate": 0.80, "inflation_rate": 0.03, "program_expansion_rate": 0.20 },
      "revenue_projection": [{ "year": 1, "donations": 80000, "grants": 15000, "earned_income": 5000, "total_revenue": 100000 }, { "year": 2, "donations": 92000, "grants": 20000, "earned_income": 8000, "total_revenue": 120000 }],
      "expense_projection": [{ "year": 1, "staffing": 40000, "program_costs": 35000, "admin": 15000, "marketing": 10000, "total_expenses": 100000 }],
      "net_income_projection": [{ "year": 1, "net_income": 0 }, { "year": 2, "net_income": 20000 }],
      "cash_flow_projection": [{ "year": 1, "beginning_cash": 0, "net_cash_flow": 0, "ending_cash": 0 }],
      "kpi_metrics": { "program_ratio": 0.75, "admin_ratio": 0.15, "fundraising_efficiency": 0.10, "cash_reserve_months": 3 },
      "scenario_analysis": { "base_case": "Expected 15% annual growth", "worst_case": "5% growth with economic downturn", "best_case": "25% growth with major donor support" }
    },
    "justification": "Data-driven financial planning"
  },
  "marketing_campaign": {
    "value": {
      "objectives": {
        "mission_statement": "Spread awareness and build community support",
        "theological_foundations": [{ "verse": "Matthew 25:40", "explanation": "Serving the least of these" }],
        "core_values": ["Compassion", "Integrity", "Community"],
        "key_messages": ["Transform lives", "Build community", "Create lasting impact"],
        "objectives_narrative": "Our marketing focuses on authentic storytelling and community engagement"
      },
      "action_plan": {
        "objectives_and_goals_narrative": "Build awareness and engage 1000+ community members",
        "objectives_and_goals": ["Increase social media followers by 200%", "Host 12 community events", "Generate 500 leads"],
        "action_steps_narrative": "Multi-channel approach using digital and in-person strategies",
        "action_steps": [{ "description": "Launch social media campaign" }, { "description": "Host community open houses" }, { "description": "Partner with local organizations" }]
      },
      "dealing_with_resistance": {
        "change_management_challenge": "Overcoming skepticism about new ministry initiatives",
        "strategy": ["Transparent communication", "Community testimonials", "Gradual implementation"],
        "action_steps_narrative": "Address concerns proactively through education and engagement",
        "action_steps": [{ "description": "Host Q&A sessions" }, { "description": "Share success stories" }]
      }
    },
    "justification": "Comprehensive marketing strategy for community engagement"
  }
}
}
`;
      }

      console.log('Generating campaign with prompt:', populatedPrompt);

      // Generate the campaign using OpenAI - use only the fundraise prompt as user message
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

      const campaignData = parsedResponse.Ministry;
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
