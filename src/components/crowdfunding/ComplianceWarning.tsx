import { Info, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { ComplianceCheckResult } from '@/types/Compliance';

interface ComplianceWarningProps {
  complianceResult: ComplianceCheckResult;
  proposedAmount: number;
}

export const ComplianceWarning = ({ complianceResult, proposedAmount }: ComplianceWarningProps) => {
  if (complianceResult.compliant) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <Info className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Investment Compliant</AlertTitle>
        <AlertDescription className="text-green-700">
          <div className="space-y-2">
            <p>This investment is within your annual limits.</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Annual Limit:</span> ${complianceResult.current_limit.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">YTD Invested:</span> ${complianceResult.ytd_invested.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">This Investment:</span> ${proposedAmount.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Remaining After:</span> ${(complianceResult.remaining_capacity || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive" className="border-red-200 bg-red-50">
      <XCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        Investment Limit Exceeded
        <Badge variant="destructive">Reg CF Violation</Badge>
      </AlertTitle>
      <AlertDescription>
        <div className="space-y-2">
          <p>This investment would exceed your annual investment limit under Regulation Crowdfunding.</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Annual Limit:</span> ${complianceResult.current_limit.toLocaleString()}
            </div>
            <div>
              <span className="font-medium">YTD Invested:</span> ${complianceResult.ytd_invested.toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Proposed Amount:</span> ${(complianceResult.proposed_amount || 0).toLocaleString()}
            </div>
            <div>
              <span className="font-medium text-green-600">Max Available:</span> ${(complianceResult.available_amount || 0).toLocaleString()}
            </div>
          </div>
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Regulation CF Limits:</strong> Annual investment limits are based on your income and net worth to protect retail investors. 
              These limits reset each calendar year.
            </p>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};
