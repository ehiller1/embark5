// Campaign creation wizard types based on OpenAI JSON structure

export interface JustifiedValue<T> {
  value: T;
  justification: string;
}

export interface ContactInfo {
  email: string;
  phone: string;
  website: string;
}

export interface TeamMember {
  name: string;
  role: string;
  bio: string;
}

export interface Testimonial {
  author: string;
  quote: string;
}

export interface DonationTier {
  label: string;
  amount: number;
  description: string;
}

export interface ProjectStep {
  step: string;
  description: string;
  owner: string;
  timeline: string;
}

export interface ReportingCommitments {
  frequency: string;
  report_types: string[];
}

export interface ImpactMetrics {
  [key: string]: string | number;
}

export interface FundingBreakdown {
  [category: string]: number;
}

export interface FinancialAssumptions {
  growth_rate: number;
  donor_retention_rate: number;
  inflation_rate: number;
  program_expansion_rate: number;
}

export interface YearlyFinancials {
  year: number;
  donations?: number;
  grants?: number;
  earned_income?: number;
  total_revenue?: number;
  staffing?: number;
  program_costs?: number;
  admin?: number;
  marketing?: number;
  total_expenses?: number;
  net_income?: number;
  beginning_cash?: number;
  net_cash_flow?: number;
  ending_cash?: number;
}

export interface KPIMetrics {
  program_ratio: number;
  admin_ratio: number;
  fundraising_efficiency: number;
  cash_reserve_months: number;
}

export interface ScenarioAnalysis {
  base_case: string;
  worst_case: string;
  best_case: string;
}

export interface CampaignData {
  // Basic Information
  title: JustifiedValue<string>;
  mission_statement: JustifiedValue<string>;
  description: JustifiedValue<string>;
  church_name: JustifiedValue<string>;
  
  // Campaign Details
  target_amount: JustifiedValue<number>;
  current_amount: JustifiedValue<number>;
  minimum_investment: JustifiedValue<number>;
  campaign_start_date: JustifiedValue<string>;
  campaign_end_date: JustifiedValue<string>;
  
  // Visual Assets
  media_urls: JustifiedValue<string[]>;
  logo: JustifiedValue<string[]>;
  
  // Impact & Team
  impact_metrics: JustifiedValue<ImpactMetrics>;
  team: JustifiedValue<TeamMember[]>;
  testimonials: JustifiedValue<Testimonial[]>;
  contact_info: JustifiedValue<ContactInfo>;
  
  // Financial Planning
  funding_breakdown: JustifiedValue<FundingBreakdown>;
  use_of_funds: JustifiedValue<string>;
  
  // Fundraising Strategy
  donation_tiers: JustifiedValue<DonationTier[]>;
  reporting_commitments: JustifiedValue<ReportingCommitments>;
  project_plan: JustifiedValue<ProjectStep[]>;
  
  // Pro Forma Financials
  pro_forma_financials: {
    assumptions: JustifiedValue<FinancialAssumptions>;
    revenue_projection: JustifiedValue<YearlyFinancials[]>;
    expense_projection: JustifiedValue<YearlyFinancials[]>;
    net_income_projection: JustifiedValue<YearlyFinancials[]>;
    cash_flow_projection: JustifiedValue<YearlyFinancials[]>;
    kpi_metrics: JustifiedValue<KPIMetrics>;
    scenario_analysis: JustifiedValue<ScenarioAnalysis>;
  };
}

export interface CampaignWizardStep {
  id: string;
  title: string;
  description: string;
  fields: string[];
}

export interface CampaignFormData {
  // Flattened form data for easier handling
  [key: string]: any;
}

export interface GenerateCampaignRequest {
  research_summary: string;
  vocational_statement: string;
  scenario_details: string;
}

export interface GenerateCampaignResponse {
  Ministry: CampaignData;
}
