
import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Wallet, 
  PieChart,
  Bell
} from 'lucide-react';
import { supabase } from '@/integrations/lib/supabase';

interface Investment {
  id: string;
  ministry_id: string;
  amount: number;
  status: string;
  invested_at: string;
  ministries?: {
    title: string;
    church_name: string;
    current_amount: number;
    target_amount: number;
  };
}

const InvestorDashboard = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvestments();
  }, []);

  const fetchInvestments = async () => {
    try {
      const { data, error } = await supabase
        .from('investments')
        .select(`
          *,
          ministries (
            title,
            church_name,
            current_amount,
            target_amount
          )
        `)
        .order('invested_at', { ascending: false });

      if (error) {
        console.error('Error fetching investments:', error);
      } else {
        setInvestments(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate portfolio metrics
  const totalInvested = investments.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const activeInvestments = investments.filter(inv => inv.status === 'completed').length;

  const user = {
    name: "Sample Investor",
    avatar: "/placeholder.svg",
    totalInvested,
    portfolioValue: totalInvested * 1.15, // Simulated 15% growth
    activeInvestments,
    roi: 15.0
  };

  const recentActivity = [
    {
      id: 1,
      type: "investment",
      description: `Invested in ${investments.length > 0 ? investments[0].ministries?.title || 'Ministry' : 'sample ministry'}`,
      date: investments.length > 0 ? new Date(investments[0].invested_at).toLocaleDateString() : "Recent"
    }
  ];

  const reports = [
    {
      id: 1,
      title: "Portfolio Impact Report",
      ministry: investments.length > 0 ? investments[0].ministries?.title || 'Sample Ministry' : "Sample Ministry",
      date: "Recent",
      type: "quarterly"
    }
  ];

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-journey-darkRed font-serif">
              Investor Dashboard
            </h1>
            <p className="text-muted-foreground mt-4 text-lg">Welcome back, {user.name}</p>
          </div>

          <div className="flex items-center justify-end mb-4">
            <div className="flex items-center space-x-4">
              <Button variant="outline">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Avatar>
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>SI</AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Portfolio Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${user.totalInvested.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Across {activeInvestments} investments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${user.portfolioValue.toLocaleString()}</div>
                <p className="text-xs text-green-600">
                  +{user.roi}% total return
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Investments</CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user.activeInvestments}</div>
                <p className="text-xs text-muted-foreground">
                  Ministry campaigns
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average ROI</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user.roi}%</div>
                <p className="text-xs text-green-600">
                  Estimated return
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="investments" className="space-y-4">
            <TabsList>
              <TabsTrigger value="investments">My Investments</TabsTrigger>
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="investments" className="space-y-4">
              <div className="grid gap-4">
                {loading ? (
                  <div className="text-center py-8">Loading investments...</div>
                ) : investments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No investments found. Visit the marketplace to explore opportunities.</p>
                  </div>
                ) : (
                  investments.map((investment) => (
                    <Card key={investment.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h3 className="font-semibold">{investment.ministries?.title || 'Ministry Campaign'}</h3>
                            <p className="text-sm text-muted-foreground">{investment.ministries?.church_name || 'Church'}</p>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="font-semibold">${Number(investment.amount).toLocaleString()}</div>
                            <Badge variant={investment.status === 'completed' ? 'default' : 'secondary'}>
                              {investment.status}
                            </Badge>
                          </div>
                        </div>
                        {investment.ministries && (
                          <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Campaign Progress</span>
                              <span>{Math.round((investment.ministries.current_amount / investment.ministries.target_amount) * 100)}%</span>
                            </div>
                            <Progress value={(investment.ministries.current_amount / investment.ministries.target_amount) * 100} />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-4">
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">{activity.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Impact Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{report.title}</h4>
                          <p className="text-sm text-muted-foreground">{report.ministry}</p>
                          <p className="text-xs text-muted-foreground">{report.date}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default InvestorDashboard;
