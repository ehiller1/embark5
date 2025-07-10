import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/lib/supabase';
import { Edit, Trash2, Eye, BarChart4, FileText } from 'lucide-react';

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
}

interface MinistryListProps {
  ministries: Ministry[];
  onRefresh: () => void;
  isOwner: boolean;
  onCreateNew?: () => void;
}

export const MinistryList = ({ ministries, onRefresh, isOwner, onCreateNew }: MinistryListProps) => {
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePublish = async (ministry: Ministry) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('ministries')
        .update({ status: 'active' })
        .eq('id', ministry.id);
        
      if (error) throw error;
      onRefresh();
    } catch (error) {
      console.error('Error publishing ministry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMinistry) return;
    
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('ministries')
        .delete()
        .eq('id', selectedMinistry.id);
        
      if (error) throw error;
      setShowDeleteDialog(false);
      onRefresh();
    } catch (error) {
      console.error('Error deleting ministry:', error);
    } finally {
      setIsLoading(false);
      setSelectedMinistry(null);
    }
  };

  const confirmDelete = (ministry: Ministry) => {
    setSelectedMinistry(ministry);
    setShowDeleteDialog(true);
  };

  const viewDetails = (ministry: Ministry) => {
    setSelectedMinistry(ministry);
    setShowDetailsDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-200 text-gray-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFundingTypeLabel = (type: string) => {
    switch (type) {
      case 'equity': return 'Equity Investment';
      case 'loan': return 'Loan';
      case 'donation': return 'Donation';
      default: return type;
    }
  };

  if (ministries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No ministry campaigns found.</p>
        <Button 
          className="mt-4" 
          onClick={onCreateNew ? onCreateNew : () => window.location.hash = '#create-campaign'}
        >
          Create Your First Campaign
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ministries.map((ministry) => (
          <Card key={ministry.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{ministry.title}</CardTitle>
                <Badge className={getStatusColor(ministry.status)}>
                  {ministry.status.charAt(0).toUpperCase() + ministry.status.slice(1)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{ministry.church_name}</p>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="space-y-4">
                <p className="text-sm line-clamp-2">{ministry.description}</p>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Funding Goal</span>
                    <span>${ministry.target_amount.toLocaleString()}</span>
                  </div>
                  <Progress value={(ministry.current_amount / ministry.target_amount) * 100} />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>${ministry.current_amount.toLocaleString()} raised</span>
                    <span>{Math.round((ministry.current_amount / ministry.target_amount) * 100)}%</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <p>{getFundingTypeLabel(ministry.funding_type)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Min Investment:</span>
                    <p>${ministry.minimum_investment.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Start Date:</span>
                    <p>{formatDate(ministry.campaign_start_date)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">End Date:</span>
                    <p>{formatDate(ministry.campaign_end_date)}</p>
                  </div>
                </div>
                
                <Separator />
                
                {isOwner && (
                  <div className="flex justify-between">
                    <Button variant="outline" size="sm" onClick={() => viewDetails(ministry)}>
                      <Eye className="h-4 w-4 mr-1" /> View
                    </Button>
                    
                    {ministry.status === 'draft' && (
                      <>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => confirmDelete(ministry)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </>
                    )}
                    
                    {ministry.status === 'draft' && (
                      <Button 
                        size="sm"
                        onClick={() => handlePublish(ministry)}
                        disabled={isLoading}
                      >
                        Publish
                      </Button>
                    )}
                    
                    {ministry.status === 'active' && (
                      <Button variant="outline" size="sm">
                        <BarChart4 className="h-4 w-4 mr-1" /> Analytics
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the campaign "{selectedMinistry?.title}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Ministry Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedMinistry?.title}</DialogTitle>
          </DialogHeader>
          
          {selectedMinistry && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium">Ministry Details</h3>
                  <div className="mt-2 space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Church:</span>
                      <p>{selectedMinistry.church_name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Location:</span>
                      <p>{selectedMinistry.location}</p>
                    </div>
                    {selectedMinistry.diocese && (
                      <div>
                        <span className="text-sm text-muted-foreground">Diocese:</span>
                        <p>{selectedMinistry.diocese}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm text-muted-foreground">Mission Statement:</span>
                      <p>{selectedMinistry.mission_statement}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Funding Details</h3>
                  <div className="mt-2 space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Target Amount:</span>
                      <p>${selectedMinistry.target_amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Current Amount:</span>
                      <p>${selectedMinistry.current_amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Minimum Investment:</span>
                      <p>${selectedMinistry.minimum_investment.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Funding Type:</span>
                      <p>{getFundingTypeLabel(selectedMinistry.funding_type)}</p>
                    </div>
                    {selectedMinistry.funding_type === 'equity' && selectedMinistry.equity_percentage && (
                      <div>
                        <span className="text-sm text-muted-foreground">Equity Percentage:</span>
                        <p>{selectedMinistry.equity_percentage}%</p>
                      </div>
                    )}
                    {selectedMinistry.funding_type === 'loan' && (
                      <>
                        {selectedMinistry.interest_rate && (
                          <div>
                            <span className="text-sm text-muted-foreground">Interest Rate:</span>
                            <p>{selectedMinistry.interest_rate}%</p>
                          </div>
                        )}
                        {selectedMinistry.term_length && (
                          <div>
                            <span className="text-sm text-muted-foreground">Term Length:</span>
                            <p>{selectedMinistry.term_length} months</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">Description</h3>
                <p className="mt-2 whitespace-pre-line">{selectedMinistry.description}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">Campaign Timeline</h3>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Start Date:</span>
                    <p>{formatDate(selectedMinistry.campaign_start_date)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">End Date:</span>
                    <p>{formatDate(selectedMinistry.campaign_end_date)}</p>
                  </div>
                </div>
              </div>
              
              {selectedMinistry.impact_metrics && selectedMinistry.impact_metrics.description && (
                <div>
                  <h3 className="text-lg font-medium">Impact Metrics</h3>
                  <p className="mt-2">{selectedMinistry.impact_metrics.description}</p>
                </div>
              )}
              
              <div>
                <h3 className="text-lg font-medium">SEC Compliance Status</h3>
                <div className="mt-2 p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-yellow-600 mr-2" />
                    <span className="font-medium text-yellow-800">
                      {selectedMinistry.status === 'draft' ? 'Pending Submission' : 'Under Review'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
            {selectedMinistry?.status === 'draft' && (
              <Button 
                onClick={() => {
                  setShowDetailsDialog(false);
                  handlePublish(selectedMinistry);
                }}
                disabled={isLoading}
              >
                Publish Campaign
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
