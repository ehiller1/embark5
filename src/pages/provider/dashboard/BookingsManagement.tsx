import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { supabase } from '@/integrations/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  MoreVertical,
  Search,
  Filter,
  Download,
  Mail,
  MessageSquare,
  Phone,
  MapPin,
  User,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { toast } from '@/components/ui/use-toast';

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';

interface Booking {
  id: string;
  service_id: string;
  service: {
    id: string;
    title: string;
    price: number;
    price_unit: string;
  };
  user_id: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
  };
  provider_id: string;
  status: BookingStatus;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  notes?: string;
  special_requests?: string;
  created_at: string;
  updated_at: string;
  is_paid: boolean;
  payment_amount?: number;
  payment_method?: string;
  location_type: 'online' | 'in_person';
  location_details?: string;
  meeting_link?: string;
}

type DashboardContext = {
  provider: any;
  stats: any;
};

const BookingsManagement = () => {
  const { provider } = useOutletContext<DashboardContext>();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [isBulkActionOpen, setIsBulkActionOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);

  // Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        
        let query = supabase
          .from('service_bookings')
          .select(`
            *,
            service:services(id, title, price, price_unit)
          `)
          .eq('provider_id', provider.id);
          
        // Apply status filter
        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }
        
        // Apply date range filter
        const now = new Date().toISOString();
        if (dateRange === 'upcoming') {
          query = query.gte('scheduled_date', now.split('T')[0]);
        } else if (dateRange === 'past') {
          query = query.lt('scheduled_date', now.split('T')[0]);
        }
        
        // Apply search
        if (searchQuery) {
          query = query.or(
            `service.title.ilike.%${searchQuery}%,user.full_name.ilike.%${searchQuery}%,notes.ilike.%${searchQuery}%`
          );
        }
        
        // Order by date
        query = query.order('scheduled_date', { ascending: dateRange !== 'past' });
        query = query.order('scheduled_time', { ascending: dateRange !== 'past' });
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        setBookings(data || []);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load bookings. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookings();
  }, [provider.id, statusFilter, dateRange, searchQuery]);
  
  // Toggle booking selection
  const toggleBookingSelection = (bookingId: string) => {
    setSelectedBookings(prev => 
      prev.includes(bookingId)
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    );
  };
  
  // Toggle select all bookings
  const toggleSelectAllBookings = () => {
    if (selectedBookings.length === bookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(bookings.map(booking => booking.id));
    }
  };
  
  // Update booking status
  const updateBookingStatus = async (bookingId: string, newStatus: BookingStatus) => {
    try {
      const { error } = await supabase
        .from('service_bookings')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString() 
        })
        .eq('id', bookingId);
        
      if (error) throw error;
      
      // Update local state
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: newStatus, updated_at: new Date().toISOString() } 
            : booking
        )
      );
      
      // Remove from selected if in bulk selection
      setSelectedBookings(prev => prev.filter(id => id !== bookingId));
      
      toast({
        title: 'Success',
        description: `Booking ${newStatus} successfully.`,
      });
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update booking status. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Bulk update booking statuses
  const bulkUpdateBookingStatus = async (newStatus: BookingStatus) => {
    if (selectedBookings.length === 0) return;
    
    try {
      const { error } = await supabase
        .from('service_bookings')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString() 
        })
        .in('id', selectedBookings);
        
      if (error) throw error;
      
      // Update local state
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          selectedBookings.includes(booking.id)
            ? { ...booking, status: newStatus, updated_at: new Date().toISOString() } 
            : booking
        )
      );
      
      // Clear selection
      setSelectedBookings([]);
      
      toast({
        title: 'Success',
        description: `${selectedBookings.length} booking(s) updated to ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error updating bookings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update bookings. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Toggle expanded booking details
  const toggleExpandedBooking = (bookingId: string) => {
    setExpandedBooking(prev => prev === bookingId ? null : bookingId);
  };
  
  // Get status badge
  const getStatusBadge = (status: BookingStatus) => {
    const statusMap = {
      pending: { label: 'Pending', variant: 'outline' as const, icon: <Clock className="h-3 w-3 mr-1" /> },
      confirmed: { label: 'Confirmed', variant: 'default' as const, icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
      completed: { label: 'Completed', variant: 'success' as const, icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
      cancelled: { label: 'Cancelled', variant: 'destructive' as const, icon: <XCircle className="h-3 w-3 mr-1" /> },
      rejected: { label: 'Rejected', variant: 'destructive' as const, icon: <XCircle className="h-3 w-3 mr-1" /> },
    };
    
    const { label, variant, icon } = statusMap[status] || 
      { label: status, variant: 'outline' as const, icon: <AlertCircle className="h-3 w-3 mr-1" /> };
    
    return (
      <Badge variant={variant} className="text-xs capitalize gap-1">
        {icon}
        {label}
      </Badge>
    );
  };
  
  // Format date and time
  const formatDateTime = (dateStr: string, timeStr: string) => {
    try {
      const date = new Date(`${dateStr}T${timeStr}`);
      return {
        date: format(date, 'MMM d, yyyy'),
        time: format(date, 'h:mm a'),
        relative: formatDistanceToNow(date, { addSuffix: true })
      };
    } catch (error) {
      console.error('Error formatting date:', error);
      return { date: 'Invalid date', time: '', relative: '' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bookings</h2>
          <p className="text-muted-foreground">
            Manage your service appointments and client bookings
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}>
            {viewMode === 'list' ? 'Calendar View' : 'List View'}
          </Button>
          <Button size="sm" asChild>
            <Link to="/services">
              View Services
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search bookings..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as BookingStatus | 'all')}>
              <SelectTrigger>
                <Filter className="h-4 w-4 text-muted-foreground mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</Selection>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateRange} onValueChange={(value) => setDateRange(value as 'upcoming' | 'past' | 'all')}>
              <SelectTrigger>
                <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
                <SelectItem value="all">All Dates</SelectItem>
              </SelectContent>
            </Select>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Export as CSV</DropdownMenuItem>
                <DropdownMenuItem>Export as Excel</DropdownMenuItem>
                <DropdownMenuItem>Print</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
      
      {/* Bulk Actions */}
      {selectedBookings.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center">
                <Checkbox 
                  id="select-all"
                  checked={selectedBookings.length === bookings.length && bookings.length > 0}
                  onCheckedChange={toggleSelectAllBookings}
                  className="mr-3"
                />
                <label htmlFor="select-all" className="text-sm font-medium">
                  {selectedBookings.length} booking{selectedBookings.length !== 1 ? 's' : ''} selected
                </label>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <DropdownMenu open={isBulkActionOpen} onOpenChange={setIsBulkActionOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Update Status
                      <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isBulkActionOpen ? 'rotate-180' : ''}`} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => bulkUpdateBookingStatus('confirmed')}>
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                      Confirm
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => bulkUpdateBookingStatus('completed')}>
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                      Mark as Completed
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => bulkUpdateBookingStatus('cancelled')}
                      className="text-destructive focus:text-destructive"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => bulkUpdateBookingStatus('rejected')}
                      className="text-destructive focus:text-destructive"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedBookings([])}
                  className="text-muted-foreground"
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Bookings List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bookings</CardTitle>
              <CardDescription>
                {bookings.length} booking{bookings.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              {dateRange === 'upcoming' ? 'Upcoming' : dateRange === 'past' ? 'Past' : 'All'} bookings
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : bookings.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={selectedBookings.length === bookings.length && bookings.length > 0}
                        onCheckedChange={toggleSelectAllBookings}
                        className="translate-y-[2px]"
                      />
                    </TableHead>
                    <TableHead>Service & Client</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => {
                    const { date, time, relative } = formatDateTime(booking.scheduled_date, booking.scheduled_time);
                    const isExpanded = expandedBooking === booking.id;
                    
                    return (
                      <React.Fragment key={booking.id}>
                        <TableRow 
                          className={`${isExpanded ? 'bg-muted/50' : ''} cursor-pointer`}
                          onClick={() => toggleExpandedBooking(booking.id)}
                        >
                          <TableCell>
                            <Checkbox 
                              checked={selectedBookings.includes(booking.id)}
                              onClick={(e) => e.stopPropagation()}
                              onCheckedChange={() => toggleBookingSelection(booking.id)}
                              className="translate-y-[2px]"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{booking.service?.title || 'Service'}</div>
                            <div className="text-sm text-muted-foreground flex items-center">
                              <User className="h-3.5 w-3.5 mr-1.5" />
                              {booking.user?.full_name || 'Client'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>{date}</div>
                            <div className="text-sm text-muted-foreground">{time}</div>
                            <div className="text-xs text-muted-foreground">{relative}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm">
                              {booking.location_type === 'online' ? (
                                <span className="flex items-center">
                                  <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                                  Online
                                </span>
                              ) : (
                                <span className="flex items-center">
                                  <MapPin className="h-3.5 w-3.5 mr-1.5" />
                                  {booking.location_details || 'In Person'}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(booking.status)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${booking.payment_amount || booking.service?.price || '0.00'}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpandedBooking(booking.id);
                              }}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                              <span className="sr-only">Toggle details</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                        
                        {/* Expanded details */}
                        {isExpanded && (
                          <TableRow className="bg-muted/20">
                            <TableCell colSpan={7} className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Client Details */}
                                <div>
                                  <h4 className="font-medium mb-3 flex items-center">
                                    <User className="h-4 w-4 mr-2" />
                                    Client Details
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex items-center">
                                      <span className="w-24 text-muted-foreground">Name:</span>
                                      <span>{booking.user?.full_name || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <span className="w-24 text-muted-foreground">Email:</span>
                                      <a 
                                        href={`mailto:${booking.user?.email}`} 
                                        className="text-primary hover:underline flex items-center"
                                      >
                                        <Mail className="h-3.5 w-3.5 mr-1.5" />
                                        {booking.user?.email || 'N/A'}
                                      </a>
                                    </div>
                                    {booking.user?.phone && (
                                      <div className="flex items-center">
                                        <span className="w-24 text-muted-foreground">Phone:</span>
                                        <a 
                                          href={`tel:${booking.user.phone}`}
                                          className="text-primary hover:underline flex items-center"
                                        >
                                          <Phone className="h-3.5 w-3.5 mr-1.5" />
                                          {booking.user.phone}
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="mt-4 pt-4 border-t">
                                    <h4 className="font-medium mb-3 flex items-center">
                                      <MessageSquare className="h-4 w-4 mr-2" />
                                      Special Requests
                                    </h4>
                                    <p className="text-sm">
                                      {booking.special_requests || 'No special requests provided.'}
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Booking Details */}
                                <div>
                                  <h4 className="font-medium mb-3">Booking Details</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex">
                                      <span className="w-28 text-muted-foreground">Date:</span>
                                      <span>{date}</span>
                                    </div>
                                    <div className="flex">
                                      <span className="w-28 text-muted-foreground">Time:</span>
                                      <span>{time}</span>
                                    </div>
                                    <div className="flex">
                                      <span className="w-28 text-muted-foreground">Duration:</span>
                                      <span>{booking.duration_minutes || 60} minutes</span>
                                    </div>
                                    <div className="flex">
                                      <span className="w-28 text-muted-foreground">Location:</span>
                                      <div>
                                        <div className="flex items-center">
                                          {booking.location_type === 'online' ? (
                                            <>
                                              <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                                              Online
                                            </>
                                          ) : (
                                            <>
                                              <MapPin className="h-3.5 w-3.5 mr-1.5" />
                                              {booking.location_details || 'In Person'}
                                            </>
                                          )}
                                        </div>
                                        {booking.meeting_link && (
                                          <a 
                                            href={booking.meeting_link} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline text-xs mt-1 block"
                                          >
                                            Join Meeting
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex">
                                      <span className="w-28 text-muted-foreground">Status:</span>
                                      <div className="flex items-center">
                                        {getStatusBadge(booking.status)}
                                        {booking.is_paid && (
                                          <Badge variant="outline" className="ml-2">
                                            Paid
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex">
                                      <span className="w-28 text-muted-foreground">Booked On:</span>
                                      <span>{format(parseISO(booking.created_at), 'MMM d, yyyy h:mm a')}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Actions */}
                                <div>
                                  <h4 className="font-medium mb-3">Actions</h4>
                                  <div className="space-y-2">
                                    {booking.status === 'pending' && (
                                      <>
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="w-full justify-start"
                                          onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                        >
                                          <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                                          Confirm Booking
                                        </Button>
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="w-full justify-start text-destructive"
                                          onClick={() => updateBookingStatus(booking.id, 'rejected')}
                                        >
                                          <XCircle className="h-4 w-4 mr-2" />
                                          Reject Booking
                                        </Button>
                                      </>
                                    )}
                                    
                                    {booking.status === 'confirmed' && (
                                      <>
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="w-full justify-start"
                                          onClick={() => updateBookingStatus(booking.id, 'completed')}
                                        >
                                          <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                                          Mark as Completed
                                        </Button>
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="w-full justify-start text-destructive"
                                          onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                        >
                                          <XCircle className="h-4 w-4 mr-2" />
                                          Cancel Booking
                                        </Button>
                                      </>
                                    )}
                                    
                                    <Button variant="outline" size="sm" className="w-full justify-start">
                                      <Mail className="h-4 w-4 mr-2" />
                                      Send Message
                                    </Button>
                                    
                                    {booking.location_type === 'online' && booking.meeting_link && (
                                      <Button 
                                        variant="default" 
                                        size="sm" 
                                        className="w-full justify-start"
                                        asChild
                                      >
                                        <a href={booking.meeting_link} target="_blank" rel="noopener noreferrer">
                                          <MessageSquare className="h-4 w-4 mr-2" />
                                          Start Video Call
                                        </a>
                                      </Button>
                                    )}
                                    
                                    <div className="pt-2 mt-4 border-t">
                                      <h4 className="font-medium mb-2">Notes</h4>
                                      <p className="text-sm text-muted-foreground">
                                        {booking.notes || 'No notes added.'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">No bookings found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {statusFilter === 'all' 
                  ? 'You don\'t have any bookings yet.' 
                  : `You don't have any ${statusFilter} bookings.`}
              </p>
              <Button asChild>
                <Link to="/services">
                  View Services
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingsManagement;
