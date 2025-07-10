import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { supabase } from '@/integrations/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Star, 
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';

type Service = {
  id: string;
  title: string;
  description: string;
  price: number;
  status: 'active' | 'draft' | 'paused';
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  images: string[];
  category_id: string;
  service_type: string;
  total_bookings: number;
  average_rating: number;
};

type DashboardContext = {
  provider: any;
  stats: any;
};

const ServicesManagement = () => {
  const { provider } = useOutletContext<DashboardContext>();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'paused'>('all');

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        
        let query = supabase
          .from('services')
          .select('*')
          .eq('provider_id', provider.id)
          .order('created_at', { ascending: false });
          
        // Apply status filter if not 'all'
        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        // For each service, fetch additional data like bookings count and average rating
        const servicesWithStats = await Promise.all(
          (data || []).map(async (service) => {
            const [bookingsRes, reviewsRes] = await Promise.all([
              supabase
                .from('service_bookings')
                .select('*', { count: 'exact', head: true })
                .eq('service_id', service.id),
                
              supabase
                .from('service_reviews')
                .select('rating')
                .eq('service_id', service.id)
            ]);
            
            const totalBookings = bookingsRes.count || 0;
            const ratings = reviewsRes.data?.map(r => r.rating) || [];
            const avgRating = ratings.length > 0 
              ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
              : 0;
              
            return {
              ...service,
              total_bookings: totalBookings,
              average_rating: parseFloat(avgRating.toFixed(1))
            };
          })
        );
        
        setServices(servicesWithStats);
      } catch (error) {
        console.error('Error fetching services:', error);
        toast({
          title: 'Error',
          description: 'Failed to load services. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchServices();
  }, [provider.id, statusFilter]);
  
  // Handle service status toggle
  const toggleServiceStatus = async (serviceId: string, currentStatus: 'active' | 'draft' | 'paused') => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      
      const { error } = await supabase
        .from('services')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', serviceId);
        
      if (error) throw error;
      
      // Update local state
      setServices(prevServices => 
        prevServices.map(service => 
          service.id === serviceId 
            ? { ...service, status: newStatus, updated_at: new Date().toISOString() } 
            : service
        )
      );
      
      toast({
        title: 'Success',
        description: `Service ${newStatus === 'active' ? 'activated' : 'paused'} successfully.`,
      });
    } catch (error) {
      console.error('Error updating service status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update service status. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle service deletion
  const handleDeleteClick = (serviceId: string) => {
    setServiceToDelete(serviceId);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!serviceToDelete) return;
    
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceToDelete);
        
      if (error) throw error;
      
      // Update local state
      setServices(prevServices => 
        prevServices.filter(service => service.id !== serviceToDelete)
      );
      
      toast({
        title: 'Success',
        description: 'Service deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete service. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
    }
  };
  
  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: 'Active', variant: 'default' as const, icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
      draft: { label: 'Draft', variant: 'outline' as const, icon: <Clock className="h-3 w-3 mr-1" /> },
      paused: { label: 'Paused', variant: 'secondary' as const, icon: <XCircle className="h-3 w-3 mr-1" /> },
    };
    
    const { label, variant, icon } = statusMap[status as keyof typeof statusMap] || 
      { label: status, variant: 'outline' as const, icon: null };
    
    return (
      <Badge variant={variant} className="text-xs capitalize gap-1">
        {icon}
        {label}
      </Badge>
    );
  };
  
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        <Star className={`h-3 w-3 ${rating > 0 ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
        <span className="text-xs font-medium ml-1">{rating > 0 ? rating.toFixed(1) : 'N/A'}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Services</h2>
          <p className="text-muted-foreground">
            Manage your service listings and availability
          </p>
        </div>
        <Button asChild>
          <Link to="/provider/services/new">
            <Plus className="h-4 w-4 mr-2" />
            Add New Service
          </Link>
        </Button>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Button 
          variant={statusFilter === 'all' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setStatusFilter('all')}
        >
          All
        </Button>
        <Button 
          variant={statusFilter === 'active' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setStatusFilter('active')}
        >
          Active
        </Button>
        <Button 
          variant={statusFilter === 'draft' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setStatusFilter('draft')}
        >
          Drafts
        </Button>
        <Button 
          variant={statusFilter === 'paused' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setStatusFilter('paused')}
        >
          Paused
        </Button>
      </div>
      
      {/* Services Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Services</CardTitle>
              <CardDescription>
                {services.length} service{services.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : services.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Bookings</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          {service.images?.[0] ? (
                            <img 
                              src={service.images[0]} 
                              alt={service.title}
                              className="h-10 w-10 rounded-md object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                              <Briefcase className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium line-clamp-1">{service.title}</div>
                            <div className="text-xs text-muted-foreground capitalize">
                              {service.service_type?.replace('_', ' ')}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>${service.price.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(service.status)}</TableCell>
                      <TableCell>{service.total_bookings}</TableCell>
                      <TableCell>{renderStars(service.average_rating)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(service.updated_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/services/${service.id}`} className="cursor-pointer">
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/provider/services/edit/${service.id}`} className="cursor-pointer">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => toggleServiceStatus(service.id, service.status)}
                              className="cursor-pointer"
                            >
                              {service.status === 'active' ? (
                                <>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Pause
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(service.id)}
                              className="text-destructive focus:text-destructive cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">No services found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {statusFilter === 'all' 
                  ? 'You haven\'t created any services yet.' 
                  : `You don't have any ${statusFilter} services.`}
              </p>
              <Button asChild>
                <Link to="/provider/services/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Service
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the service and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ServicesManagement;
