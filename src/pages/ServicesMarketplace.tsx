import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search, Filter, Plus, ArrowLeft } from 'lucide-react';
import { useMarketplace } from '@/hooks/useMarketplace';
import { ServiceCard } from '@/components/marketplace/ServiceCard';
import { CategoryFilter } from '@/components/marketplace/CategoryFilter';

export const ServicesMarketplace = () => {
  const navigate = useNavigate();
  
  // Local state for search query to improve user experience
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const {
    services,
    categories,
    selectedCategory,
    searchQuery,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    handleCategoryChange,
    handleSearch,
    loadMore,
    refresh,
  } = useMarketplace();
  
  // Initialize localSearchQuery with searchQuery when it changes
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);
  
  // Debounce search query to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearchQuery !== searchQuery) {
        setIsSearching(true);
        handleSearch(localSearchQuery);
      }
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timer);
  }, [localSearchQuery, handleSearch, searchQuery]);
  
  // Reset searching state when services are loaded
  useEffect(() => {
    setIsSearching(false);
  }, [services]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          className="mr-4"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Services Marketplace</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => {
                    // Update local state immediately for responsive UI
                    setLocalSearchQuery(e.target.value);
                  }}
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategoryChange}
          />

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Price Range</h3>
                  <div className="flex items-center space-x-2">
                    <Input placeholder="Min" type="number" />
                    <span>to</span>
                    <Input placeholder="Max" type="number" />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Service Type</h3>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span>One-time</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span>Subscription</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span>Consultation</span>
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="all" className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <TabsList>
                <TabsTrigger value="all">All Services</TabsTrigger>
                <TabsTrigger value="featured">Featured</TabsTrigger>
                <TabsTrigger value="popular">Most Popular</TabsTrigger>
                <TabsTrigger value="new">Newest</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Sort
                </Button>
                <Button size="sm" onClick={() => navigate('/services/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </div>
            </div>

            <TabsContent value="all" className="space-y-6">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-destructive">{error}</p>
                  <Button variant="outline" className="mt-4" onClick={refresh}>
                    Try Again
                  </Button>
                </div>
              ) : services.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No services found. Try adjusting your search or filters.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {services.map((service) => (
                      <ServiceCard key={service.id} service={service} />
                    ))}
                  </div>
                  
                  {hasMore && (
                    <div className="flex justify-center mt-8">
                      <Button 
                        variant="outline" 
                        onClick={loadMore}
                        disabled={isLoadingMore}
                      >
                        {isLoadingMore ? 'Loading...' : 'Load More'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="featured">
              <p>Featured services coming soon.</p>
            </TabsContent>
            
            <TabsContent value="popular">
              <p>Most popular services coming soon.</p>
            </TabsContent>
            
            <TabsContent value="new">
              <p>Newest services coming soon.</p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ServicesMarketplace;
