import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { supabase } from '@/integrations/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutDashboard, 
  Briefcase, 
  Calendar, 
  Star, 
  MessageSquare, 
  Settings, 
  BarChart3,
  Plus,
  ChevronDown,
  Bell,
  LogOut,
  User
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type TabValue = 'overview' | 'services' | 'bookings' | 'reviews' | 'messages' | 'analytics' | 'settings';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabValue>('overview');
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalServices: 0,
    upcomingBookings: 0,
    pendingReviews: 0,
    totalEarnings: 0,
  });

  // Set active tab based on URL
  useEffect(() => {
    const path = location.pathname.split('/').pop() || 'overview';
    if (['overview', 'services', 'bookings', 'reviews', 'messages', 'analytics', 'settings'].includes(path)) {
      setActiveTab(path as TabValue);
    }
  }, [location]);

  // Fetch provider profile and stats
  useEffect(() => {
    const fetchProviderData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch provider profile
        const { data: providerData } = await supabase
          .from('service_providers')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (providerData) {
          setProvider(providerData);
          
          // Fetch stats
          const [servicesRes, bookingsRes, reviewsRes] = await Promise.all([
            supabase
              .from('services')
              .select('*', { count: 'exact', head: true })
              .eq('provider_id', providerData.id),
              
            supabase
              .from('service_bookings')
              .select('*', { count: 'exact' })
              .eq('provider_id', providerData.id)
              .gte('scheduled_date', new Date().toISOString())
              .eq('status', 'confirmed'),
              
            supabase
              .from('service_reviews')
              .select('*', { count: 'exact' })
              .eq('service_id', providerData.id)
              .is('provider_response', null)
          ]);
          
          // Calculate earnings (simplified - would need actual payment data)
          const { data: earningsData } = await supabase
            .from('service_bookings')
            .select('total_price')
            .eq('provider_id', providerData.id)
            .eq('status', 'completed');
            
          const totalEarnings = earningsData?.reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0;
          
          setStats({
            totalServices: servicesRes.count || 0,
            upcomingBookings: bookingsRes.count || 0,
            pendingReviews: reviewsRes.count || 0,
            totalEarnings,
          });
        }
      } catch (error) {
        console.error('Error fetching provider data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProviderData();
  }, [user, toast]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Provider Profile Not Found</h2>
        <p className="text-muted-foreground mb-6">
          You need to set up your provider profile before accessing the dashboard.
        </p>
        <Button onClick={() => navigate('/provider/onboarding')}>
          Set Up Provider Profile
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold">Provider Dashboard</h1>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback>
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline-flex items-center">
                    {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate('/provider/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <Card className="overflow-hidden">
              <CardHeader className="bg-primary/5 p-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={provider.logo_url} />
                    <AvatarFallback>
                      {provider.business_name?.charAt(0) || 'P'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold line-clamp-1">{provider.business_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {provider.average_rating ? `${provider.average_rating.toFixed(1)} ★` : 'No ratings yet'}
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <Tabs 
                  value={activeTab} 
                  onValueChange={(value) => {
                    setActiveTab(value as TabValue);
                    navigate(`/provider/dashboard/${value}`);
                  }}
                  orientation="vertical"
                  className="w-full"
                >
                  <TabsList className="flex-col h-auto w-full p-0">
                    <TabsTrigger value="overview" className="w-full justify-start px-4 py-3">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="services" className="w-full justify-start px-4 py-3">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Services
                      <span className="ml-auto bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
                        {stats.totalServices}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger value="bookings" className="w-full justify-start px-4 py-3">
                      <Calendar className="h-4 w-4 mr-2" />
                      Bookings
                      {stats.upcomingBookings > 0 && (
                        <span className="ml-auto bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                          {stats.upcomingBookings}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="reviews" className="w-full justify-start px-4 py-3">
                      <Star className="h-4 w-4 mr-2" />
                      Reviews
                      {stats.pendingReviews > 0 && (
                        <span className="ml-auto bg-amber-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                          {stats.pendingReviews} new
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="messages" className="w-full justify-start px-4 py-3">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Messages
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="w-full justify-start px-4 py-3">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Analytics
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="w-full justify-start px-4 py-3">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <div className="p-4 border-t">
                  <Button className="w-full" onClick={() => navigate('/services/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Service
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Quick Stats */}
            <Card className="mt-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Total Earnings</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-lg font-semibold">{stats.upcomingBookings}</p>
                      <p className="text-xs text-muted-foreground">Bookings</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">
                        {provider.average_rating ? `${provider.average_rating.toFixed(1)}/5` : 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground">Avg. Rating</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
          
          {/* Main Content */}
          <main className="flex-1">
            <Outlet context={{ provider, stats }} />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
