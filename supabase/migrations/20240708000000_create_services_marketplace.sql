-- Create service categories
CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Create service providers (vendors)
CREATE TABLE IF NOT EXISTS public.service_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  business_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  address JSONB,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  average_rating NUMERIC(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Create services
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES public.service_providers(id) NOT NULL,
  category_id UUID REFERENCES public.service_categories(id) NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  price_unit TEXT NOT NULL, -- 'hour', 'project', 'session', etc.
  service_type TEXT NOT NULL, -- 'one_time', 'subscription', 'consultation'
  duration_minutes INTEGER, -- For time-based services
  is_online BOOLEAN DEFAULT true,
  is_in_person BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  tags TEXT[],
  images TEXT[],
  average_rating NUMERIC(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE(provider_id, slug)
);

-- Create service reviews
CREATE TABLE IF NOT EXISTS public.service_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE(service_id, user_id)
);

-- Create service bookings
CREATE TABLE IF NOT EXISTS public.service_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID REFERENCES public.services(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  provider_id UUID REFERENCES public.service_providers(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled', 'rejected'
  scheduled_date TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  total_price NUMERIC(10, 2) NOT NULL,
  notes TEXT,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Create favorites/saved services
CREATE TABLE IF NOT EXISTS public.saved_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE(user_id, service_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_provider ON public.services(provider_id);
CREATE INDEX IF NOT EXISTS idx_services_search ON public.services USING GIN (to_tsvector('english', title || ' ' || description));
CREATE INDEX IF NOT EXISTS idx_service_reviews_service ON public.service_reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_user ON public.service_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_provider ON public.service_bookings(provider_id);

-- Enable Row Level Security
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_services ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic example - adjust based on your security requirements)
-- Service Categories (public read)
CREATE POLICY "Enable read access for all users" ON public.service_categories
  FOR SELECT USING (true);

-- Service Providers (public read, write for owners/admins)
CREATE POLICY "Enable read access for all users" ON public.service_providers
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.service_providers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for owners" ON public.service_providers
  FOR UPDATE USING (auth.uid() = user_id);

-- Services (public read, write for owners/admins)
CREATE POLICY "Enable read access for all users" ON public.services
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.services
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for service providers" ON public.services
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.service_providers 
    WHERE id = provider_id AND user_id = auth.uid()
  ));

-- Service Reviews (public read, write for authenticated users)
CREATE POLICY "Enable read access for all users" ON public.service_reviews
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.service_reviews
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for review owners" ON public.service_reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Service Bookings (private to users and providers)
CREATE POLICY "Enable read for booking users and providers" ON public.service_bookings
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() = provider_id
  );

CREATE POLICY "Enable insert for authenticated users" ON public.service_bookings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for booking users and providers" ON public.service_bookings
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    auth.uid() = provider_id
  );

-- Saved Services (private to users)
CREATE POLICY "Enable all for users based on user_id" ON public.saved_services
  USING (auth.uid() = user_id);

-- Create a function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update timestamps
CREATE TRIGGER update_service_categories_updated_at
  BEFORE UPDATE ON public.service_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_providers_updated_at
  BEFORE UPDATE ON public.service_providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_reviews_updated_at
  BEFORE UPDATE ON public.service_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_bookings_updated_at
  BEFORE UPDATE ON public.service_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to update average ratings
CREATE OR REPLACE FUNCTION update_service_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update service rating
  UPDATE public.services
  SET 
    average_rating = (
      SELECT AVG(rating) 
      FROM public.service_reviews 
      WHERE service_id = COALESCE(NEW.service_id, OLD.service_id)
      AND is_approved = true
    ),
    total_reviews = (
      SELECT COUNT(*) 
      FROM public.service_reviews 
      WHERE service_id = COALESCE(NEW.service_id, OLD.service_id)
      AND is_approved = true
    )
  WHERE id = COALESCE(NEW.service_id, OLD.service_id);
  
  -- Update provider rating
  UPDATE public.service_providers sp
  SET 
    average_rating = subquery.avg_rating,
    total_reviews = subquery.total
  FROM (
    SELECT 
      s.provider_id,
      AVG(sr.rating) as avg_rating,
      COUNT(*) as total
    FROM public.services s
    JOIN public.service_reviews sr ON s.id = sr.service_id
    WHERE s.provider_id = (
      SELECT provider_id 
      FROM public.services 
      WHERE id = COALESCE(NEW.service_id, OLD.service_id)
    )
    AND sr.is_approved = true
    GROUP BY s.provider_id
  ) as subquery
  WHERE sp.id = subquery.provider_id;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for review changes
CREATE TRIGGER update_ratings_after_review
  AFTER INSERT OR UPDATE OR DELETE ON public.service_reviews
  FOR EACH ROW EXECUTE FUNCTION update_service_rating();

-- Create a function to generate slugs
CREATE OR REPLACE FUNCTION generate_slug(text_value TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN regexp_replace(
    lower(
      regexp_replace(
        unaccent(trim(text_value)),
        '[^a-z0-9\-_]+', '-', 'g'
      )
    ),
    '--+', '-', 'g'
  );
END;
$$ LANGUAGE plpgsql;
