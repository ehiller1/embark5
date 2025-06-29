// Type declarations for Compliance (for .d.ts consumers)
export interface ComplianceCheckResult {
  status: string;
  details?: string;
}

export interface SECFiling {
  id: string;
  title: string;
  date: string;
  url: string;
}
