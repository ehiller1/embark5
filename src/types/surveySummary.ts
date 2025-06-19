export interface SurveySentiment {
  overall: string;
  summary_text: string;
}

export interface SurveyRiskOpportunityItem {
  items: string[];
  number_of_persons_identifying_risks?: number; // Optional as it's only in risks
  number_of_persons_identifying_opportunities?: number; // Optional as it's only in opportunities
}

export interface SurveySummaryData {
  key_themes: string[];
  sentiment: SurveySentiment;
  potential_risks: SurveyRiskOpportunityItem;
  potential_opportunities: SurveyRiskOpportunityItem;
  dreams_and_aspirations: string[];
  fears_and_concerns: string[];
}

export interface FullSurveySummary {
  summary: SurveySummaryData;
}
