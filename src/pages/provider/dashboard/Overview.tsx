import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { 
  Briefcase, 
  Calendar, 
  Star, 
  MessageSquare, 
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/lib/supabase';
import { format } from 'date-fns';

type DashboardContext = {
  provider: any;
  stats: {
    totalServices: number;
    upcomingBookings: number;
    pendingReviews: number;
    totalEarnings: number;
  };
};

const Overview = () => {
  const { provider, stats } = useOutletContext<DashboardContext>();
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [loading, setLoading] = useState({
    bookings: true,
    reviews: true,
    revenue: true
  });

  // Fetch recent bookings
  useEffect(() => {
    const fetchRecentBookings = async () => {
      try {
        const { data, error } = await supabase
          .from('service_bookings')
          .select(`
            *,
            service:services(title, id)
          `)
          .eq('provider_id', provider.id)
          .order('scheduled_date', { ascending: true })
          .limit(5);
          
        if (error) throw error;
        setRecentBookings(data || []);
      } catch (error) {
        console.error('Error fetching recent bookings:', error);
      } finally {
        setLoading(prev => ({ ...prev, bookings: false }));
      }
    };
    
    fetchRecentBookings();
  }, [provider.id]);
  
  // Fetch recent reviews
  useEffect(() => {
    const fetchRecentReviews = async () => {
      try {
        const { data, error } = await supabase
          .from('service_reviews')
          .select(`
            *,
            service:services(title, id)
          `)
          .eq('service_id', provider.id)
          .order('created_at', { ascending: false })
          .limit(3);
          
        if (error) throw error;
        setRecentReviews(data || []);
      } catch (error) {
        console.error('Error fetching recent reviews:', error);
      } finally {
        setLoading(prev => ({ ...prev, reviews: false }));
      }
    };
    
    fetchRecentReviews();
  }, [provider.id]);
  
  // Fetch revenue data (last 6 months)
  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        const { data, error } = await supabase
          .from('service_bookings')
          .select('created_at, total_price')
          .eq('provider_id', provider.id)
          .eq('status', 'completed')
          .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 5)).toISOString())
          .order('created_at', { ascending: true });
          
        if (error) throw error;
        
        // Process data for the chart
        const monthlyData: Record<string, number> = {};
        const months = [];
        const now = new Date();
        
        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = format(date, 'MMM yyyy');
          monthlyData[monthKey] = 0;
          months.push(monthKey);
        }
        
        // Sum up earnings by month
        data?.forEach(booking => {
          const monthKey = format(new Date(booking.created_at), 'MMM yyyy');
          if (monthlyData[monthKey] !== undefined) {
            monthlyData[monthKey] += booking.total_price || 0;
          }
        });
        
        // Format for recharts
        const chartData = months.map(month => ({
          name: month,
          earnings: parseFloat(monthlyData[month].toFixed(2))
        }));
        
        setRevenueData(chartData);
      } catch (error) {
        console.error('Error fetching revenue data:', error);
      } finally {
        setLoading(prev => ({ ...prev, revenue: false }));
      }
    };
    
    fetchRevenueData();
  }, [provider.id]);
  
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success', icon: React.ReactNode }> = {
      pending: { variant: 'outline', icon: <Clock className="h-3 w-3 mr-1" /> },
      confirmed: { variant: 'default', icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
      completed: { variant: 'success', icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
      cancelled: { variant: 'destructive', icon: <XCircle className="h-3 w-3 mr-1" /> },
      rejected: { variant: 'destructive', icon: <XCircle className="h-3 w-3 mr-1" /> },
    };
    
    const { variant, icon } = statusMap[status] || { variant: 'secondary', icon: <AlertCircle className="h-3 w-3 mr-1" /> };
    
    return (
      <Badge variant={variant} className="text-xs capitalize gap-1">
        {icon}
        {status}
      </Badge>
    );
  };
  
  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={`h-3 w-3 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Welcome back, {provider.contact_name || 'Provider'}!</h2>
        <p className="text-muted-foreground">
          Here's what's happening with your business today.
        </p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Services
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServices}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalServices === 0 ? 'No services yet' : `${stats.totalServices} active service${stats.totalServices !== 1 ? 's' : ''}`}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Bookings
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingBookings}</div>
            <p className="text-xs text-muted-foreground">
              {stats.upcomingBookings === 0 ? 'No upcoming bookings' : `${stats.upcomingBookings} scheduled`}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Reviews
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReviews}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingReviews === 0 ? 'All caught up!' : 'Needs your response'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Earnings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              All time revenue
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {loading.revenue ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : revenueData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={revenueData}
                    margin={{
                      top: 5,
                      right: 10,
                      left: 10,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tickFormatter={(value) => `$${value}`}
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Earnings']}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="earnings" 
                      stroke="#6366f1" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, stroke: '#4f46e5', strokeWidth: 2, fill: '#ffffff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-center p-6">
                <BarChart className="h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">No revenue data yet</h3>
                <p className="text-sm text-muted-foreground">
                  Your revenue data will appear here once you start receiving payments.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Recent Reviews */}
        <Card className="col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Reviews</CardTitle>
              <Button variant="ghost" size="sm" className="text-primary">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading.reviews ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : recentReviews.length > 0 ? (
              <div className="space-y-6">
                {recentReviews.map((review) => (
                  <div key={review.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="font-medium text-sm">
                          {review.reviewer_name || 'Anonymous'}
                        </div>
                        <span className="text-muted-foreground text-xs">
                          {format(new Date(review.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                      {renderStars(review.rating)}
                    </div>
                    <p className="text-sm line-clamp-2">
                      {review.comment || 'No comment provided'}
                    </p>
                    {review.service && (
                      <div className="text-xs text-muted-foreground">
                        For <span className="font-medium">{review.service.title}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-center p-6">
                <Star className="h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">No reviews yet</h3>
                <p className="text-sm text-muted-foreground">
                  Customer reviews will appear here once you receive them.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Upcoming Bookings</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading.bookings ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : recentBookings.length > 0 ? (
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">
                      {booking.service?.title || 'Service'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(booking.scheduled_date), 'MMM d, yyyy • h:mm a')}
                    </div>
                    <div className="text-sm">
                      with <span className="font-medium">{booking.user?.full_name || 'Customer'}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="font-medium">${booking.total_price?.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">
                        {getStatusBadge(booking.status)}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[200px] flex flex-col items-center justify-center text-center p-6">
              <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium">No upcoming bookings</h3>
              <p className="text-sm text-muted-foreground">
                Your upcoming bookings will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Overview;
