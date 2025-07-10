import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { 
  Star, 
  StarHalf, 
  StarOff, 
  MessageSquare, 
  Check, 
  X, 
  Filter, 
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Reply,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

type ReviewStatus = 'all' | 'pending' | 'replied' | 'reported';
type RatingValue = 'all' | '5' | '4' | '3' | '2' | '1';

interface Review {
  id: string;
  service_id: string;
  service: {
    id: string;
    title: string;
  };
  user_id: string;
  user: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  rating: number;
  comment: string;
  provider_response?: string;
  provider_response_date?: string;
  is_reported: boolean;
  report_reason?: string;
  created_at: string;
  updated_at: string;
}

type DashboardContext = {
  provider: any;
  stats: any;
};

const ReviewsManagement = () => {
  const { provider } = useOutletContext<DashboardContext>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus>('all');
  const [ratingFilter, setRatingFilter] = useState<RatingValue>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    average: 0,
    count_5: 0,
    count_4: 0,
    count_3: 0,
    count_2: 0,
    count_1: 0,
    pending_responses: 0,
  });

  const reviewsPerPage = 10;

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        
        // Calculate offset for pagination
        const from = (currentPage - 1) * reviewsPerPage;
        const to = from + reviewsPerPage - 1;
        
        // Build the query
        let query = supabase
          .from('service_reviews')
          .select(`
            *,
            service:services(id, title)
          `, { count: 'exact' })
          .eq('provider_id', provider.id)
          .order('created_at', { ascending: false })
          .range(from, to);
        
        // Apply status filter
        if (statusFilter === 'pending') {
          query = query.is('provider_response', null);
        } else if (statusFilter === 'replied') {
          query = query.not('provider_response', 'is', null);
        } else if (statusFilter === 'reported') {
          query = query.eq('is_reported', true);
        }
        
        // Apply rating filter
        if (ratingFilter !== 'all') {
          query = query.eq('rating', parseInt(ratingFilter));
        }
        
        // Apply search
        if (searchQuery) {
          query = query.or(
            `service.title.ilike.%${searchQuery}%,user.full_name.ilike.%${searchQuery}%,comment.ilike.%${searchQuery}%`
          );
        }
        
        const { data, count, error } = await query;
        
        if (error) throw error;
        
        setReviews(data || []);
        
        // Calculate total pages
        const total = count || 0;
        setTotalPages(Math.ceil(total / reviewsPerPage));
      } catch (error) {
        console.error('Error fetching reviews:', error);
        toast({
          title: 'Error',
          description: 'Failed to load reviews. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchReviews();
  }, [provider.id, statusFilter, ratingFilter, searchQuery, currentPage]);
  
  // Fetch review stats
  useEffect(() => {
    const fetchReviewStats = async () => {
      try {
        // Get total reviews and average rating
        const { data: statsData, error: statsError } = await supabase
          .rpc('get_review_stats', { provider_id_param: provider.id });
          
        if (statsError) throw statsError;
        
        if (statsData) {
          setStats({
            total: statsData[0]?.total_reviews || 0,
            average: statsData[0]?.average_rating || 0,
            count_5: statsData[0]?.count_5 || 0,
            count_4: statsData[0]?.count_4 || 0,
            count_3: statsData[0]?.count_3 || 0,
            count_2: statsData[0]?.count_2 || 0,
            count_1: statsData[0]?.count_1 || 0,
            pending_responses: statsData[0]?.pending_responses || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching review stats:', error);
      }
    };
    
    fetchReviewStats();
  }, [provider.id]);
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Toggle review expansion
  const toggleReviewExpansion = (reviewId: string) => {
    setExpandedReview(prev => prev === reviewId ? null : reviewId);
    setReplyingTo(null);
  };
  
  // Toggle reply form
  const toggleReplyForm = (reviewId: string) => {
    setReplyingTo(prev => prev === reviewId ? null : reviewId);
    setReplyText('');
  };
  
  // Handle reply submission
  const handleReplySubmit = async (reviewId: string) => {
    if (!replyText.trim()) return;
    
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('service_reviews')
        .update({
          provider_response: replyText,
          provider_response_date: new Date().toISOString()
        })
        .eq('id', reviewId);
        
      if (error) throw error;
      
      // Update local state
      setReviews(prevReviews => 
        prevReviews.map(review => 
          review.id === reviewId
            ? { 
                ...review, 
                provider_response: replyText,
                provider_response_date: new Date().toISOString() 
              }
            : review
        )
      );
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pending_responses: Math.max(0, prev.pending_responses - 1)
      }));
      
      toast({
        title: 'Success',
        description: 'Your response has been published.',
      });
      
      // Reset form
      setReplyingTo(null);
      setReplyText('');
    } catch (error) {
      console.error('Error submitting reply:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit your response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle review report
  const handleReportReview = async (reviewId: string, report: boolean) => {
    try {
      const { error } = await supabase
        .from('service_reviews')
        .update({ 
          is_reported: report,
          report_reason: report ? 'Inappropriate content' : null
        })
        .eq('id', reviewId);
        
      if (error) throw error;
      
      // Update local state
      setReviews(prevReviews => 
        prevReviews.map(review => 
          review.id === reviewId
            ? { 
                ...review, 
                is_reported: report,
                report_reason: report ? 'Inappropriate content' : undefined
              }
            : review
        )
      );
      
      toast({
        title: 'Success',
        description: report 
          ? 'Review has been reported and will be reviewed by our team.' 
          : 'Report has been removed.',
      });
    } catch (error) {
      console.error('Error updating review report status:', error);
      toast({
        title: 'Error',
        description: `Failed to ${report ? 'report' : 'unreport'} review. Please try again.`,
        variant: 'destructive',
      });
    }
  };
  
  // Render star rating
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }
    
    // Half star
    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }
    
    // Empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-muted-foreground/30" />);
    }
    
    return (
      <div className="flex items-center">
        {stars}
        <span className="ml-1 text-sm text-muted-foreground">({rating.toFixed(1)})</span>
      </div>
    );
  };
  
  // Render rating distribution bar
  const renderRatingBar = (count: number, total: number, rating: number) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center w-8">
          {rating} <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 ml-0.5" />
        </div>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-yellow-400" 
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="w-8 text-right text-sm text-muted-foreground">
          {count}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Customer Reviews</h2>
        <p className="text-muted-foreground">
          Manage and respond to reviews from your clients
        </p>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                <div className="flex items-baseline mt-1">
                  <span className="text-3xl font-bold">{stats.average.toFixed(1)}</span>
                  <span className="text-muted-foreground ml-1">/ 5</span>
                </div>
                <div className="mt-1">
                  {renderStars(stats.average)}
                </div>
              </div>
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Star className="h-8 w-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Reviews</p>
                <p className="text-3xl font-bold mt-1">{stats.total}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.pending_responses} pending response{stats.pending_responses !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">5-Star Reviews</p>
                <p className="text-3xl font-bold mt-1">{stats.count_5}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.total > 0 ? ((stats.count_5 / stats.total) * 100).toFixed(0) : 0}% of total
                </p>
              </div>
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-green-600 text-green-600 dark:fill-green-400 dark:text-green-400" />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reported Reviews</p>
                <p className="text-3xl font-bold mt-1">
                  {reviews.filter(r => r.is_reported).length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.total > 0 ? ((reviews.filter(r => r.is_reported).length / stats.total) * 100).toFixed(0) : 0}% of total
                </p>
              </div>
              <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters and Rating Distribution */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <Select 
                  value={statusFilter} 
                  onValueChange={(value) => {
                    setStatusFilter(value as ReviewStatus);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reviews</SelectItem>
                    <SelectItem value="pending">Needs Response</SelectItem>
                    <SelectItem value="replied">Replied</SelectItem>
                    <SelectItem value="reported">Reported</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                <Select 
                  value={ratingFilter} 
                  onValueChange={(value) => {
                    setRatingFilter(value as RatingValue);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Ratings" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="1">1 Star</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search reviews..." 
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { rating: 5, count: stats.count_5 },
                { rating: 4, count: stats.count_4 },
                { rating: 3, count: stats.count_3 },
                { rating: 2, count: stats.count_2 },
                { rating: 1, count: stats.count_1 },
              ].map(({ rating, count }) => (
                <div key={rating} className="space-y-1">
                  {renderRatingBar(count, stats.total, rating)}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        
        {/* Reviews List */}
        <div className="lg:col-span-3 space-y-4">
          {loading ? (
            // Loading skeleton
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : reviews.length > 0 ? (
            // Reviews list
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card 
                  key={review.id} 
                  className={`overflow-hidden ${
                    review.is_reported ? 'border-destructive/20 bg-destructive/5' : ''
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={review.user?.avatar_url} alt={review.user?.full_name} />
                        <AvatarFallback>
                          {review.user?.full_name
                            ?.split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">
                            {review.user?.full_name || 'Anonymous'}
                          </h4>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(review.created_at), 'MMM d, yyyy')}
                          </div>
                        </div>
                        
                        <div className="mt-1">
                          {renderStars(review.rating)}
                        </div>
                        
                        <div className="mt-2">
                          <p className="whitespace-pre-line">{review.comment}</p>
                          
                          {review.is_reported && (
                            <div className="mt-2 flex items-center text-sm text-destructive">
                              <AlertTriangle className="h-4 w-4 mr-1.5" />
                              <span>Reported: {review.report_reason || 'Inappropriate content'}</span>
                            </div>
                          )}
                          
                          {review.service && (
                            <div className="mt-2 text-sm">
                              <span className="text-muted-foreground">Service: </span>
                              <span className="font-medium">{review.service.title}</span>
                            </div>
                          )}
                          
                          {/* Provider Response */}
                          {review.provider_response && (
                            <div className="mt-4 pl-4 border-l-2 border-primary/30">
                              <div className="flex items-center justify-between">
                                <div className="font-medium text-sm text-primary flex items-center">
                                  <span className="h-2 w-2 rounded-full bg-primary mr-2"></span>
                                  Your Response
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {review.provider_response_date && 
                                    format(new Date(review.provider_response_date), 'MMM d, yyyy')}
                                </div>
                              </div>
                              <p className="mt-1 text-sm whitespace-pre-line">
                                {review.provider_response}
                              </p>
                            </div>
                          )}
                          
                          {/* Reply Form */}
                          {replyingTo === review.id && (
                            <div className="mt-4">
                              <Textarea
                                placeholder="Write your response..."
                                className="min-h-[100px]"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                disabled={isSubmitting}
                              />
                              <div className="mt-2 flex justify-end space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => setReplyingTo(null)}
                                  disabled={isSubmitting}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleReplySubmit(review.id)}
                                  disabled={isSubmitting || !replyText.trim()}
                                >
                                  {isSubmitting ? 'Publishing...' : 'Publish Response'}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => toggleReviewExpansion(review.id)}
                        >
                          {expandedReview === review.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          <span className="sr-only">Toggle details</span>
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">More options</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!review.provider_response && (
                              <DropdownMenuItem onClick={() => toggleReplyForm(review.id)}>
                                <Reply className="h-4 w-4 mr-2" />
                                {replyingTo === review.id ? 'Hide Reply' : 'Reply to Review'}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleReportReview(review.id, !review.is_reported)}
                              className={review.is_reported ? 'text-destructive' : ''}
                            >
                              {review.is_reported ? (
                                <>
                                  <Check className="h-4 w-4 mr-2" />
                                  Remove Report
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Report Review
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Review
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            // No reviews found
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">No reviews found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {statusFilter === 'all' 
                  ? 'You don\'t have any reviews yet.' 
                  : `You don't have any ${statusFilter} reviews.`}
              </p>
              <Button onClick={() => {
                setStatusFilter('all');
                setRatingFilter('all');
                setSearchQuery('');
              }}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewsManagement;
