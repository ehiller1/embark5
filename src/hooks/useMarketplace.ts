import { useState, useEffect, useCallback } from 'react';
import { Service, ServiceCategory } from '@/types/marketplace';
import { marketplaceService } from '@/services/marketplace';

type UseMarketplaceProps = {
  initialCategory?: string;
  initialSearch?: string;
  featuredOnly?: boolean;
  limit?: number;
};

export const useMarketplace = ({
  initialCategory = '',
  initialSearch = '',
  featuredOnly = false,
  limit = 12,
}: UseMarketplaceProps = {}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const hasMore = page * limit < totalCount;

  // Fetch services based on current filters
  const fetchServices = useCallback(async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setPage(1);
      }

      const options = {
        limit,
        offset: isLoadMore ? page * limit : 0,
        filters: {},
      };

      let result;

      if (searchQuery) {
        result = await marketplaceService.searchServices(searchQuery, options);
      } else if (selectedCategory) {
        result = await marketplaceService.getServicesByCategory(selectedCategory, options);
      } else if (featuredOnly) {
        const data = await marketplaceService.getFeaturedServices(limit);
        result = { data, count: data.length };
      } else {
        result = await marketplaceService.getServices(options);
      }

      if (isLoadMore) {
        setServices(prev => [...prev, ...(result.data || [])]);
      } else {
        setServices(result.data || []);
      }
      
      setTotalCount(result.count || 0);
      setError(null);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError('Failed to load services. Please try again later.');
      setServices([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [selectedCategory, searchQuery, page, limit, featuredOnly]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const data = await marketplaceService.getCategories();
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories.');
    }
  }, []);

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchServices(), fetchCategories()]);
    };
    loadData();
  }, [fetchServices, fetchCategories]);

  // Handle category change
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? '' : categoryId);
    setPage(1);
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  // Load more items
  const loadMore = () => {
    if (!isLoading && !isLoadingMore && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  // Refresh data
  const refresh = () => {
    fetchServices();
  };

  return {
    services,
    categories,
    selectedCategory,
    searchQuery,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    totalCount,
    handleCategoryChange,
    handleSearch,
    loadMore,
    refresh,
  };
};
