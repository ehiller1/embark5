import { supabase } from '@/integrations/lib/supabase';

type QueryOptions = {
  limit?: number;
  offset?: number;
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending: boolean };
};

export const marketplaceService = {
  // Fetch all services with optional filtering and pagination
  async getServices(options: QueryOptions = {}) {
    const { limit = 10, offset = 0, filters = {}, orderBy } = options;
    
    let query = supabase
      .from('services')
      .select(`
        *,
        provider:service_providers(*),
        category:service_categories(*),
        reviews:service_reviews(*)
      `, { count: 'exact' })
      .eq('is_available', true)
      .range(offset, offset + limit - 1);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    // Apply sorting
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending });
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { data, count };
  },

  // Get a single service by ID
  async getServiceById(id: string) {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        provider:service_providers(*),
        category:service_categories(*),
        reviews:service_reviews(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Get all service categories
  async getCategories() {
    try {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      
      // Ensure all categories have at least a default icon
      return data?.map(category => ({
        ...category,
        // If icon is missing, provide a default based on category name
        icon: category.icon || this.getDefaultIconForCategory(category.name)
      })) || [];
    } catch (err) {
      console.error('Error fetching categories:', err);
      return [];
    }
  },
  
  // Helper function to assign default icons based on category name
  getDefaultIconForCategory(categoryName: string): string {
    const name = categoryName.toLowerCase();
    if (name.includes('consult')) return 'MessageSquare';
    if (name.includes('design')) return 'Palette';
    if (name.includes('tech')) return 'Laptop';
    if (name.includes('market')) return 'TrendingUp';
    if (name.includes('content')) return 'FileText';
    if (name.includes('education') || name.includes('training')) return 'GraduationCap';
    if (name.includes('finance')) return 'DollarSign';
    if (name.includes('legal')) return 'Scale';
    return 'Package'; // Default icon
  },

  // Get featured services
  async getFeaturedServices(limit = 6) {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        provider:service_providers(*),
        category:service_categories(*)
      `)
      .eq('is_featured', true)
      .eq('is_available', true)
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Search services
  async searchServices(query: string, options: QueryOptions = {}) {
    const { limit = 10, offset = 0 } = options;
    
    const { data, error, count } = await supabase
      .from('services')
      .select(`
        *,
        provider:service_providers(*),
        category:service_categories(*)
      `, { count: 'exact' })
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .eq('is_available', true)
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { data, count };
  },

  // Add a review to a service
  async addReview(serviceId: string, rating: number, comment?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('service_reviews')
      .insert([
        {
          service_id: serviceId,
          user_id: user.id,
          rating,
          comment: comment || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get services by category
  async getServicesByCategory(categoryId: string, options: QueryOptions = {}) {
    const { limit = 10, offset = 0 } = options;
    
    const { data, error, count } = await supabase
      .from('services')
      .select(`
        *,
        provider:service_providers(*),
        category:service_categories(*)
      `, { count: 'exact' })
      .eq('category_id', categoryId)
      .eq('is_available', true)
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { data, count };
  },

  // Get services by provider
  async getServicesByProvider(providerId: string, options: QueryOptions = {}) {
    const { limit = 10, offset = 0 } = options;
    
    const { data, error, count } = await supabase
      .from('services')
      .select(`
        *,
        provider:service_providers(*),
        category:service_categories(*)
      `, { count: 'exact' })
      .eq('provider_id', providerId)
      .eq('is_available', true)
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { data, count };
  },

  // Get provider by ID
  async getProviderById(id: string) {
    const { data, error } = await supabase
      .from('service_providers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },
};
