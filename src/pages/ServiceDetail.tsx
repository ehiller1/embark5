import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Star, 
  Clock, 
  Calendar, 
  ExternalLink,
  MessageSquare,
  Phone,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Service, ServiceReview } from '@/types/marketplace';
import { supabase } from '@/integrations/lib/supabase';

interface ServiceWithDetails extends Service {
  average_rating?: number;
  total_reviews?: number;
  reviews?: ServiceReview[];
  is_online?: boolean;
  is_in_person?: boolean;
  images?: string[];
  duration_minutes?: number;
  duration?: number;
  features?: string[];
  faqs?: Array<{ question: string; answer: string }>;
}

const ServiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [service, setService] = useState<ServiceWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch service details
        const { data: serviceData, error: serviceError } = await supabase
          .from('services')
          .select(`
            *,
            provider:provider_id(*),
            category:category_id(*)
          `)
          .eq('id', id)
          .single();
          
        if (serviceError) throw serviceError;
        if (!serviceData) throw new Error('Service not found');
        
        // Fetch reviews for this service
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('service_reviews')
          .select(`
            *
          `)
          .eq('service_id', id)
          .order('created_at', { ascending: false });
          
        if (reviewsError) throw reviewsError;
        
        // Calculate average rating
        const avgRating = reviewsData.length > 0
          ? reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length
          : 0;
        
        // Combine data
        setService({
          ...serviceData,
          reviews: reviewsData,
          average_rating: avgRating,
          total_reviews: reviewsData.length,
          // Mock data for demonstration
          is_online: Math.random() > 0.5,
          is_in_person: Math.random() > 0.3,
          images: [
            'https://images.unsplash.com/photo-1501504905252-473c47e087f8',
            'https://images.unsplash.com/photo-1511818966892-d7d671e672a2',
          ],
          duration_minutes: 60,
          features: [
            'Personalized consultation',
            'Follow-up support',
            'Resource materials included',
            'Ongoing mentorship available'
          ],
          faqs: [
            { 
              question: 'How soon can we start?', 
              answer: 'Most services can begin within 1-2 weeks of booking, depending on current availability.'
            },
            { 
              question: 'What preparation is needed?', 
              answer: 'We recommend gathering relevant information about your church needs and goals before our first meeting.'
            },
            { 
              question: 'Is there a satisfaction guarantee?', 
              answer: 'Yes, we offer a 100% satisfaction guarantee for all our services.'
            }
          ]
        });
      } catch (err) {
        console.error('Error fetching service details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load service details');
        toast({
          title: 'Error',
          description: 'Failed to load service details',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchServiceDetails();
  }, [id, supabase, toast]);

  const handleBookService = () => {
    toast({
      title: 'Booking initiated',
      description: 'You will be contacted by the service provider shortly.',
    });
    // In a real app, this would navigate to a booking flow or contact form
  };

  const handleContactProvider = () => {
    toast({
      title: 'Contact request sent',
      description: 'The provider will reach out to you soon.',
    });
    // In a real app, this would open a contact form or messaging interface
  };

  if (isLoading) {
    return <ServiceDetailSkeleton />;
  }

  if (error || !service) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Service Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The service you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/services-marketplace')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Back button */}
      <Button 
        variant="ghost" 
        className="mb-6" 
        onClick={() => navigate('/services-marketplace')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Services
      </Button>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="md:col-span-2">
          {/* Service images */}
          <div className="rounded-lg overflow-hidden mb-6 bg-muted h-64 relative">
            {service.images && service.images.length > 0 ? (
              <img 
                src={service.images[0]} 
                alt={service.title} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-muted">
                <span className="text-muted-foreground">No image available</span>
              </div>
            )}
            
            {/* Service type badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              {service.is_online && (
                <Badge variant="secondary" className="bg-blue-500 text-white hover:bg-blue-600">
                  Online
                </Badge>
              )}
              {service.is_in_person && (
                <Badge variant="secondary" className="bg-green-500 text-white hover:bg-green-600">
                  In-person
                </Badge>
              )}
            </div>
          </div>
          
          {/* Service title and rating */}
          <div className="mb-6">
            <div className="flex justify-between items-start">
              <h1 className="text-3xl font-bold">{service.title}</h1>
              <div className="text-2xl font-bold text-primary">
                ${service.price}{' '}
                <span className="text-sm font-normal text-muted-foreground">
                  {service.price_unit ? `per ${service.price_unit}` : ''}
                </span>
              </div>
            </div>
            
            {/* Rating */}
            <div className="flex items-center mt-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-5 w-5 ${
                      i < Math.round(service.average_rating || 0) 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-muted-foreground/30'
                    }`} 
                  />
                ))}
              </div>
              <span className="ml-2 text-sm text-muted-foreground">
                {service.average_rating?.toFixed(1)} ({service.total_reviews} reviews)
              </span>
            </div>
            
            {/* Provider info */}
            {service.provider && (
              <div className="flex items-center mt-2 text-sm">
                <span className="text-muted-foreground">Provided by </span>
                <Link 
                  to={`/providers/${service.provider.id}`} 
                  className="ml-1 font-medium hover:underline"
                >
                  {service.provider.name}
                </Link>
              </div>
            )}
          </div>
          
          {/* Tabs for different sections */}
          <Tabs defaultValue="description" className="mb-8">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            
            {/* Description tab */}
            <TabsContent value="description" className="pt-4">
              <div className="prose max-w-none">
                <p className="text-base text-foreground">{service.description}</p>
                
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-muted-foreground mr-2" />
                    <span>
                      {service.duration_minutes} minutes
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
                    <span>
                      {service.service_type === 'subscription' ? 'Recurring' : 'One-time'}
                    </span>
                  </div>
                </div>
                
                {/* FAQs */}
                {service.faqs && service.faqs.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold mb-4">Frequently Asked Questions</h3>
                    <div className="space-y-4">
                      {service.faqs.map((faq, index) => (
                        <div key={index} className="border-b pb-4">
                          <h4 className="font-medium mb-2">{faq.question}</h4>
                          <p className="text-muted-foreground">{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Features tab */}
            <TabsContent value="features" className="pt-4">
              <h3 className="text-xl font-semibold mb-4">Service Features</h3>
              <ul className="space-y-3">
                {service.features?.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <div className="mr-3 mt-1 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary text-xs">✓</span>
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </TabsContent>
            
            {/* Reviews tab */}
            <TabsContent value="reviews" className="pt-4">
              <h3 className="text-xl font-semibold mb-4">Client Reviews</h3>
              
              {service.reviews && service.reviews.length > 0 ? (
                <div className="space-y-6">
                  {service.reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start">
                          <Avatar className="h-10 w-10 mr-4">
                            <AvatarImage src={review.user?.avatar_url || ''} />
                            <AvatarFallback>
                              {review.user?.full_name?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">
                                  {review.user?.full_name || 'Anonymous User'}
                                </p>
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`h-4 w-4 ${
                                        i < review.rating 
                                          ? 'fill-yellow-400 text-yellow-400' 
                                          : 'text-muted-foreground/30'
                                      }`} 
                                    />
                                  ))}
                                  <span className="ml-2 text-sm text-muted-foreground">
                                    {format(new Date(review.created_at), 'MMM d, yyyy')}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-sm text-muted-foreground mt-2">
                              {review.comment}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No reviews yet for this service.</p>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Sidebar */}
        <div className="md:col-span-1">
          {/* Booking card */}
          <Card className="mb-6 sticky top-6">
            <CardHeader>
              <CardTitle>Book This Service</CardTitle>
              <CardDescription>
                Get started with {service.title}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full" 
                onClick={handleBookService}
              >
                Book Now
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleContactProvider}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Contact Provider
              </Button>
              
              <Separator className="my-4" />
              
              {/* Provider info */}
              {service.provider && (
                <div className="space-y-3">
                  <h4 className="font-medium">About the Provider</h4>
                  
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={service.provider.logo_url || ''} />
                      <AvatarFallback>
                        {service.provider.name?.[0] || 'P'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{service.provider.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Member since {format(new Date(service.provider.created_at), 'MMM yyyy')}
                      </p>
                    </div>
                  </div>
                  
                  {service.provider.contact_email && (
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <a 
                        href={`mailto:${service.provider.contact_email}`} 
                        className="text-primary hover:underline"
                      >
                        {service.provider.contact_email}
                      </a>
                    </div>
                  )}
                  
                  {service.provider.contact_phone && (
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <a 
                        href={`tel:${service.provider.contact_phone}`} 
                        className="text-primary hover:underline"
                      >
                        {service.provider.contact_phone}
                      </a>
                    </div>
                  )}
                  
                  {service.provider.website && (
                    <div className="flex items-center text-sm">
                      <ExternalLink className="h-4 w-4 mr-2 text-muted-foreground" />
                      <a 
                        href={service.provider.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Category info */}
          {service.category && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Category</CardTitle>
              </CardHeader>
              <CardContent>
                <Link 
                  to={`/services-marketplace?category=${service.category.id}`}
                  className="flex items-center text-primary hover:underline"
                >
                  {service.category.icon && (
                    <div className="mr-2 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary">
                      <span className="text-xs">{service.category.icon}</span>
                    </div>
                  )}
                  {service.category.name}
                </Link>
                <p className="text-sm text-muted-foreground mt-2">
                  {service.category.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

// Loading skeleton
const ServiceDetailSkeleton = () => {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Skeleton className="h-8 w-32" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Skeleton className="h-64 w-full mb-6" />
          
          <Skeleton className="h-10 w-3/4 mb-2" />
          <Skeleton className="h-5 w-1/3 mb-6" />
          
          <div className="mb-8">
            <div className="border-b mb-4">
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-5/6 mb-2" />
          </div>
        </div>
        
        <div className="md:col-span-1">
          <Skeleton className="h-[300px] w-full mb-6" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;
