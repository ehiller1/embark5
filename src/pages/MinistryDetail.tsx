
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InvestmentProForma } from '@/components/crowdfunding/InvestmentProForma';
import { InvestmentModal } from '@/components/crowdfunding/InvestmentModal';
import { 
  MapPin,
  ArrowLeft,
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  Eye,
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/lib/supabase';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Temporary local Ministry type for type safety
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

interface MinistryUpdate {
  id: string;
  title: string;
  content: string;
  update_type: string;
  created_at: string;
}

const MinistryDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ministry, setMinistry] = useState<Ministry | null>(null);
  const [updates, setUpdates] = useState<MinistryUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);

  useEffect(() => {
    fetchMinistryData();
  }, [id]);

  const fetchMinistryData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Fetch ministry details
      const { data: ministryData, error: ministryError } = await supabase
        .from('ministries')
        .select('*')
        .eq('id', id)
        .single();

      if (ministryError) throw ministryError;

      // Fetch ministry updates
      const { data: updatesData, error: updatesError } = await supabase
        .from('ministry_updates')
        .select('*')
        .eq('ministry_id', id)
        .order('created_at', { ascending: false });

      if (updatesError) throw updatesError;

      setMinistry(ministryData as Ministry);
      setUpdates(updatesData || []);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-48">
          <LoadingSpinner size="lg" text="Loading ministry details..." />
        </div>
      </MainLayout>
    );
  }

  if (error || !ministry) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-red-600">Error Loading Ministry</h2>
          <p className="text-muted-foreground mt-2">{error || 'Ministry not found'}</p>
          <Button onClick={() => navigate('/crowdfunding')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>
        </div>
      </MainLayout>
    );
  }

  const progressPercentage = (ministry.current_amount / ministry.target_amount) * 100;
  const daysRemaining = Math.ceil((new Date(ministry.campaign_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/crowdfunding')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-journey-darkRed font-serif">
            {ministry.title}
          </h1>
          <p className="text-muted-foreground mt-4 text-lg flex items-center justify-center">
            <MapPin className="h-4 w-4 mr-1" />
            {ministry.church_name} • {ministry.location}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="financials">Financials</TabsTrigger>
                <TabsTrigger value="updates">Updates</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">Mission Statement</CardTitle>
                        <Badge variant={ministry.status === 'active' ? 'default' : 'secondary'} className="mt-2">
                          {ministry.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{ministry.mission_statement}</p>
                    <Separator />
                    <div className="mt-4">
                      <h3 className="font-semibold mb-2">Description</h3>
                      <p className="text-muted-foreground">{ministry.description}</p>
                    </div>
                  </CardContent>
                </Card>

                {ministry.impact_metrics && Object.keys(ministry.impact_metrics).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Expected Impact</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(ministry.impact_metrics).map(([key, value]) => (
                          <div key={key} className="text-center p-4 bg-muted rounded-lg">
                            <div className="text-2xl font-bold text-journey-darkRed">{value as string}</div>
                            <div className="text-sm text-muted-foreground capitalize">
                              {key.replace('_', ' ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="financials">
                <InvestmentProForma ministry={ministry} />
              </TabsContent>

              <TabsContent value="updates" className="space-y-4">
                {updates.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground">No updates available yet.</p>
                    </CardContent>
                  </Card>
                ) : (
                  updates.map((update) => (
                    <Card key={update.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{update.title}</CardTitle>
                          <Badge variant="outline">{update.update_type}</Badge>
                        </div>
                        <CardDescription>
                          {new Date(update.created_at).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{update.content}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="documents">
                <Card>
                  <CardHeader>
                    <CardTitle>Available Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded">
                            <Eye className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">Financial Projections</p>
                            <p className="text-sm text-muted-foreground">5-year financial forecast</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-green-100 rounded">
                            <Eye className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">Impact Assessment</p>
                            <p className="text-sm text-muted-foreground">Community impact analysis</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-purple-100 rounded">
                            <Eye className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium">Ministry Plan</p>
                            <p className="text-sm text-muted-foreground">Detailed implementation plan</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Investment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{progressPercentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="mb-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>${ministry.current_amount.toLocaleString()} raised</span>
                    <span>of ${ministry.target_amount.toLocaleString()}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div className="flex justify-between w-full">
                      <span className="text-sm">Minimum Investment:</span>
                      <span className="font-semibold">${ministry.minimum_investment.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="flex justify-between w-full">
                      <span className="text-sm">Days Remaining:</span>
                      <span className="font-semibold">{daysRemaining} days</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div className="flex justify-between w-full">
                      <span className="text-sm">Investors:</span>
                      <span className="font-semibold">12 investors</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <div className="flex justify-between w-full">
                      <span className="text-sm">Expected Return:</span>
                      <span className="font-semibold text-green-600">5-8% annually</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <Button 
                  onClick={() => setShowInvestmentModal(true)}
                  disabled={ministry.status !== 'active'}
                  className="w-full"
                  size="lg"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Invest Now
                </Button>

                <Button 
                  variant="secondary"
                  className="w-full mt-2"
                  onClick={() => navigate('/investment-dashboard')}
                >
                  Go to Investor Dashboard
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  By investing, you agree to our terms and conditions. Investments are subject to risk.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Church Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>{ministry.church_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{ministry.church_name}</div>
                    {ministry.diocese && (
                      <div className="text-sm text-muted-foreground">{ministry.diocese}</div>
                    )}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center">
                    <MapPin className="h-3 w-3 mr-2" />
                    {ministry.location}
                  </p>
                  <p className="text-muted-foreground">
                    Established congregation with a strong commitment to community service and outreach.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <InvestmentModal
          ministry={ministry}
          isOpen={showInvestmentModal}
          onClose={(investmentId?: string) => {
            setShowInvestmentModal(false);
            // If an investmentId is returned, navigate to InvestmentSuccess
            if (investmentId) {
              navigate(`/investment-success?id=${investmentId}`);
            }
          }}
        />
      </div>
    </MainLayout>
  );
};

export default MinistryDetail;
