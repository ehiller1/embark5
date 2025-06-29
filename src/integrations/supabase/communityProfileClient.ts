import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const SUPABASE_URL = "https://jeezilcobzdayekigzvf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplZXppbGNvYnpkYXlla2lnenZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3OTY2ODMsImV4cCI6MjA1OTM3MjY4M30.mjyNOhoEumZQL9Wwd146xmXM1xXTV-dqrq1iYz6f2-w";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
