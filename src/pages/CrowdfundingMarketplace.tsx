
import { useState, useEffect } from 'react';
import { InvestmentModal } from '@/components/crowdfunding/InvestmentModal';
import { SECFilingDisplay } from '@/components/crowdfunding/SECFilingDisplay';
import { useDiscernmentPlanContent } from '@/components/crowdfunding/useDiscernmentPlanContent';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

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
}

const CrowdfundingMarketplace = () => {
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const [showSecFiling, setShowSecFiling] = useState<string | null>(null);
  const { plans } = useDiscernmentPlanContent();
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMinistries();
  }, []);

  const fetchMinistries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ministries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setMinistries(data || []);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filteredMinistries = ministries.filter(ministry =>
    ministry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ministry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ministry.church_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const navigateToDetail = (id: string) => {
    // For now, show an alert since we don't have a dedicated ministry detail page
    // In a real implementation, this would navigate to a detailed view
    alert(`Viewing details for ministry ID: ${id}`);
    console.log(`Would navigate to /ministry/${id}`);
  };

  return (
    <>
      <div className="flex flex-col space-y-4">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-journey-darkRed font-serif">
            Mission Crowdfunding Opportunities
          </h1>
          <p className="text-muted-foreground mt-4 text-lg">
            Discover and support ministries that align with your values.
          </p>
        </div>
        
        <div className="mb-6">
          <Tabs defaultValue="all" className="w-full" onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="all">All Ministries</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="max-w-md mt-4">
            <Input
              type="search"
              placeholder="Search ministries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <Separator className="my-2" />

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <LoadingSpinner size="lg" text="Loading ministries..." />
          </div>
        ) : error ? (
          <div className="text-red-500">Error: {error}</div>
        ) : ministries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No ministries found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMinistries
              .filter(ministry => {
                if (activeTab === 'all') return true;
                return ministry.status === activeTab;
              })
              .map(ministry => (
                <Card key={ministry.id} className="bg-white shadow-md rounded-lg overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      {ministry.title}
                      {/* Discernment Plan badge/tooltip if available */}
                      {plans && plans.length > 0 && (
                        <Badge variant="outline" title={`Discernment Plan: ${plans[0].title}`}>Plan</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-gray-500">{ministry.church_name}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-700">{ministry.description.substring(0, 100)}...</p>
                      <Progress value={(ministry.current_amount / ministry.target_amount) * 100} />
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">
                          ${ministry.current_amount.toLocaleString()} raised of ${ministry.target_amount.toLocaleString()}
                        </span>
                        <Badge variant="secondary">{ministry.status}</Badge>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="default" onClick={() => setSelectedMinistry(ministry)}>
                          Invest
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => navigateToDetail(ministry.id)}>
                          More
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => setShowSecFiling(showSecFiling === ministry.id ? null : ministry.id)}
                        >
                          {showSecFiling === ministry.id ? 'Hide' : 'View'} SEC Filings
                        </Button>
                      </div>
                      {showSecFiling === ministry.id && (
                        <div className="mt-2">
                          <SECFilingDisplay 
                            filings={[
                              {
                                id: 'mock-1',
                                filing_type: 'form_c',
                                filing_date: new Date().toISOString(),
                                filing_status: 'accepted',
                                submission_id: 'SUB-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                                filing_data: {
                                  target_amount: ministry.target_amount,
                                  minimum_investment: ministry.minimum_investment,
                                  use_of_funds: {
                                    operations: 0.4,
                                    marketing: 0.3,
                                    development: 0.2,
                                    legal: 0.1
                                  },
                                  risk_factors: [
                                    'Early stage investment with potential for loss of principal',
                                    'Market conditions may affect ministry success',
                                    'Regulatory changes could impact operations'
                                  ]
                                },
                                compliance_notes: 'Filing meets all SEC Regulation CF requirements.'
                              }
                            ]} 
                            ministryTitle={ministry.title} 
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    
      {/* Investment Modal for selected ministry */}
      {selectedMinistry && (
        <InvestmentModal
          ministry={selectedMinistry}
          isOpen={!!selectedMinistry}
          onClose={() => setSelectedMinistry(null)}
        />
      )}
    </>
  );
}

export default CrowdfundingMarketplace;
