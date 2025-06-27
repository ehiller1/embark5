import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = 'https://jeezilcobzdayekigzvf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplZXppbGNvYnpkYXlla2lnenZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3OTY2ODMsImV4cCI6MjA1OTM3MjY4M30.mjyNOhoEumZQL9Wwd146xmXM1xXTV-dqrq1iYz6f2-w';

export const supabase: SupabaseClient<Database> = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: 'embark-auth-token',
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },
});

console.log('[supabase] Canonical client initialized');

// Compatibility function that returns the same instance
export const getSupabase = (): SupabaseClient => supabase;


// Helper function to convert arrays for PostgreSQL
export const convertArraysForPostgres = (obj: Record<string, any>) => {
  const result = { ...obj };
  for (const key in result) {
    if (Array.isArray(result[key])) {
      result[key] = JSON.stringify(result[key]);
    }
  }
  return result;
};
