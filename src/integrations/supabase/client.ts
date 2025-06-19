// Attempting manual type override due to CLI type generation issues.
// If this file is overwritten by a build process, this change may be temporary.
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase'; // Ensure this path is correct for your project structure

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("VITE_SUPABASE_URL is not defined. Please check your .env file.");
}

if (!supabaseAnonKey) {
  throw new Error("VITE_SUPABASE_ANON_KEY is not defined. Please check your .env file.");
}

// Type the client with our custom Database interface
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
});

// Usage example (optional, for clarity):
// import { supabase } from "@/integrations/supabase/client";