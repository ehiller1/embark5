import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { supabase } from '@/integrations/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ArrowLeft } from 'lucide-react';

// Import the marketplace components
import { CampaignCreationForm } from '@/components/marketplace/CampaignCreationForm';
import { MinistryList } from '@/components/marketplace/MinistryList';
import { ComplianceChecklist } from '@/components/marketplace/ComplianceChecklist';
import { ResourceLibrary } from '@/components/marketplace/ResourceLibrary';

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

const ClergyMarketplace = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('my-campaigns');
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchMinistries();
    }
  }, [user]);

  const fetchMinistries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ministries')
        .select('*')
        .eq('user_id', user?.id)
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

  const handleCreateCampaign = async (campaignData: Partial<Ministry>) => {
    try {
      setLoading(true);
      
      // Add user_id to the campaign data
      const newCampaign = {
        ...campaignData,
        user_id: user?.id,
        current_amount: 0,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('ministries')
        .insert([newCampaign])
        .select();

      if (error) throw error;
      
      // Refresh the ministries list
      fetchMinistries();
      
      // Switch to my-campaigns tab
      setActiveTab('my-campaigns');
      
      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <header className="bg-white mb-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/clergy-home')}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </header>
      
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-journey-darkRed font-serif">
          Ministry Funding Platform
        </h1>
        <p className="text-muted-foreground mt-4 text-lg">
          Create and manage funding opportunities for your ministry
        </p>
        <p className="text-muted-foreground mt-4">
          Access new funding models tied to investment and lending for growing your ministry
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="my-campaigns">My Funding Programs</TabsTrigger>
          <TabsTrigger value="create-campaign">Create A Community Funding Program</TabsTrigger>
          <TabsTrigger value="resources">Resources & Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="my-campaigns">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <LoadingSpinner size="lg" text="Loading campaigns..." />
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-8">Error: {error}</div>
          ) : (
            <MinistryList 
              ministries={ministries} 
              onRefresh={fetchMinistries} 
              isOwner={true}
              onCreateNew={() => setActiveTab('create-campaign')}
            />
          )}
        </TabsContent>

        <TabsContent value="create-campaign">
          <CampaignCreationForm onSubmit={handleCreateCampaign} />
        </TabsContent>

        <TabsContent value="resources">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>SEC Compliance Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <ComplianceChecklist />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Resource Library</CardTitle>
              </CardHeader>
              <CardContent>
                <ResourceLibrary />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClergyMarketplace;
