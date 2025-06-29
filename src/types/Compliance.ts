// Placeholder types for Compliance
export interface ComplianceCheckResult {
  compliant: boolean;
  current_limit: number;
  ytd_invested: number;
  remaining_capacity: number;
  available_amount?: number;
  proposed_amount?: number;
  status?: string;
  details?: string;
}

export interface SECFiling {
  id: string;
  title: string;
  date: string;
  url: string;
  filing_date?: string;
  filing_status?: string;
  submission_id?: string;
  filing_type?: string;
  filing_data?: {
    target_amount?: number;
    minimum_investment?: number;
    use_of_funds?: Record<string, string>;
    risk_factors?: string[];
  };
  compliance_notes?: string;
}
