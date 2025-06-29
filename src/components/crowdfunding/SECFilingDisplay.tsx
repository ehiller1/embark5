
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import type { SECFiling } from '@/types/Compliance';

interface SECFilingDisplayProps {
  filings: SECFiling[];
  ministryTitle: string;
}

export const SECFilingDisplay = ({ filings, ministryTitle }: SECFilingDisplayProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'submitted':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFilingTypeLabel = (type: string) => {
    switch (type) {
      case 'form_c':
        return 'Form C - Offering Statement';
      case 'form_c_ar':
        return 'Form C-AR - Annual Report';
      case 'form_c_u':
        return 'Form C-U - Progress Update';
      case 'progress_update':
        return 'Progress Update';
      default:
        return type.toUpperCase();
    }
  };

  if (filings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            SEC Filings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No SEC filings available for this ministry.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          SEC Filings for {ministryTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {filings.map((filing) => (
          <div key={filing.id} className="border rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                {getStatusIcon(filing.filing_status || '')}
                <div>
                  <h4 className="font-medium">{getFilingTypeLabel(filing.filing_type || '')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {filing.filing_date ? new Date(filing.filing_date).toLocaleDateString() : 'Not filed'}
                  </p>
                </div>
              </div>
              <Badge className={getStatusColor(filing.filing_status || '')}>
                {(filing.filing_status || '').charAt(0).toUpperCase() + (filing.filing_status || '').slice(1)}
              </Badge>
            </div>

            {filing.submission_id && (
              <div className="text-sm text-muted-foreground mb-3">
                <span className="font-medium">Submission ID:</span> {filing.submission_id}
              </div>
            )}

            {filing.filing_data && Object.keys(filing.filing_data).length > 0 && (
              <div className="space-y-2">
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {filing.filing_data.target_amount && (
                    <div>
                      <span className="font-medium">Target Amount:</span>
                      <div>${filing.filing_data.target_amount.toLocaleString()}</div>
                    </div>
                  )}
                  {filing.filing_data.minimum_investment && (
                    <div>
                      <span className="font-medium">Minimum Investment:</span>
                      <div>${filing.filing_data.minimum_investment.toLocaleString()}</div>
                    </div>
                  )}
                </div>

                {filing.filing_data.use_of_funds && (
                  <div className="mt-3">
                    <h5 className="font-medium text-sm mb-2">Use of Funds:</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(filing.filing_data.use_of_funds).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="capitalize">{key.replace('_', ' ')}:</span>
                          <span>{(typeof value === 'number' ? (value * 100).toFixed(1) : (!isNaN(Number(value)) ? (Number(value) * 100).toFixed(1) : value))}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {filing.filing_data.risk_factors && (
                  <div className="mt-3">
                    <h5 className="font-medium text-sm mb-2 flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" />
                      Risk Factors:
                    </h5>
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                      {(filing.filing_data.risk_factors as string[]).map((risk, index) => (
                        <li key={index}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {filing.compliance_notes && (
              <div className="mt-3 p-2 bg-amber-50 rounded text-sm">
                <span className="font-medium">Compliance Notes:</span> {filing.compliance_notes}
              </div>
            )}

            <div className="flex justify-end mt-3">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-3 w-3 mr-1" />
                View Full Filing
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
