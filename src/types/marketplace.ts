// Types for the marketplace feature
export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  created_at: string;
}

export interface ServiceProvider {
  id: string;
  name: string;
  description: string;
  website: string | null;
  logo_url: string | null;
  contact_email: string;
  contact_phone: string | null;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  provider_id: string;
  category_id: string;
  title: string;
  description: string;
  price: number;
  price_unit: string; // 'hour', 'project', 'month', etc.
  service_type: 'one_time' | 'subscription' | 'consultation';
  is_featured: boolean;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  // Relations that will be joined
  provider?: ServiceProvider;
  category?: ServiceCategory;
}

export interface ServiceReview {
  id: string;
  service_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  // Relations
  user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

// Database types for Supabase
export type Tables = {
  service_categories: ServiceCategory;
  service_providers: ServiceProvider;
  services: Service;
  service_reviews: ServiceReview;
};

export type TableName = keyof Tables;
