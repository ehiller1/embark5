import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, DollarSign, Users, Target, FileText, ExternalLink } from 'lucide-react';

interface Ministry {
  id: string;
  created_at: string;
  title: string;
  mission_statement: string;
  description: string;
  target_amount: number;
  current_amount: number;
  minimum_investment: number;
  campaign_start_date: string;
  campaign_end_date: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  church_name: string;
  diocese: string | null;
  location: string;
  impact_metrics: any;
  media_urls: string[];
  user_id: string | null;
  funding_type: 'equity' | 'loan' | 'donation';
  interest_rate?: number;
  equity_percentage?: number;
  term_length?: number;
  prospectus_url?: string;
  prospectus_generated_at?: string;
}

interface MinistryDetailsModalProps {
  open: boolean;
  onClose: () => void;
  ministry: Ministry | null;
  onViewProspectus?: (ministry: Ministry) => void;
}

export const MinistryDetailsModal: React.FC<MinistryDetailsModalProps> = ({
  open,
  onClose,
  ministry,
  onViewProspectus
}) => {
  if (!ministry) return null;

  const progressPercentage = (ministry.current_amount / ministry.target_amount) * 100;
  const daysRemaining = Math.ceil((new Date(ministry.campaign_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">{ministry.title}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={ministry.status === 'active' ? 'default' : 'secondary'}>
                  {ministry.status}
                </Badge>
                <Badge variant="outline">{ministry.funding_type}</Badge>
              </div>
            </div>
            {ministry.prospectus_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(ministry.prospectus_url, '_blank')}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                View Prospectus
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Church Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Church Information
              </h3>
              <p><strong>Church:</strong> {ministry.church_name}</p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {ministry.location}
              </p>
              {ministry.diocese && <p><strong>Diocese:</strong> {ministry.diocese}</p>}
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Campaign Timeline
              </h3>
              <p><strong>Start Date:</strong> {new Date(ministry.campaign_start_date).toLocaleDateString()}</p>
              <p><strong>End Date:</strong> {new Date(ministry.campaign_end_date).toLocaleDateString()}</p>
              <p><strong>Days Remaining:</strong> {daysRemaining > 0 ? daysRemaining : 'Campaign ended'}</p>
            </div>
          </div>

          <Separator />

          {/* Mission Statement */}
          <div>
            <h3 className="font-semibold mb-2">Mission Statement</h3>
            <p className="text-muted-foreground">{ministry.mission_statement}</p>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{ministry.description}</p>
          </div>

          <Separator />

          {/* Financial Information */}
          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <DollarSign className="h-4 w-4" />
              Financial Overview
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  ${ministry.current_amount.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Raised</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">
                  ${ministry.target_amount.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Target</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">
                  ${ministry.minimum_investment.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Minimum Investment</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progressPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>

            {/* Additional Financial Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {ministry.interest_rate && (
                <div>
                  <p><strong>Interest Rate:</strong> {ministry.interest_rate}%</p>
                </div>
              )}
              {ministry.equity_percentage && (
                <div>
                  <p><strong>Equity Percentage:</strong> {ministry.equity_percentage}%</p>
                </div>
              )}
              {ministry.term_length && (
                <div>
                  <p><strong>Term Length:</strong> {ministry.term_length} months</p>
                </div>
              )}
            </div>
          </div>

          {/* Impact Metrics */}
          {ministry.impact_metrics && Object.keys(ministry.impact_metrics).length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4" />
                  Impact Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(ministry.impact_metrics).map(([key, value]) => (
                    <p key={key}>
                      <strong>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {String(value)}
                    </p>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Media */}
          {ministry.media_urls && ministry.media_urls.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Media</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {ministry.media_urls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Ministry media ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            {onViewProspectus && (
              <Button
                onClick={() => onViewProspectus(ministry)}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                View Prospectus
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
