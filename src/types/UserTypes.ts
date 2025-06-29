import { User as SupabaseUser } from '@supabase/supabase-js';

export interface ExtendedUser extends SupabaseUser {
  church_id?: string;
}
