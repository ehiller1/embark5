import { PostgrestError } from '@supabase/supabase-js';
import { ChurchProfile as ChurchProfileRowOriginal } from './communityProfile';

// Ensure 'id' is a number and not null for Supabase primary key compatibility if it's the PK.
// If 'church_id' is the true primary key and unique, adjust accordingly.
// For now, assuming 'id' from ChurchProfileRowOriginal is the intended numeric PK.
export type ChurchProfileRow = Omit<ChurchProfileRowOriginal, 'id'> & { id: number; };

export interface ProfileRow {
  id: string; // Typically UUID, matches auth.users.id
  updated_at: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  website: string | null;
  church_id: string | null; // Foreign key to church_profile.church_id or a similar unique ID
  role: string | null; // User role, e.g., 'Clergy', 'Parish'
}

export interface ChurchDataRow {
  id: number; // Assuming an auto-incrementing primary key
  church_id: string; // Foreign key linking to the church
  data_type: string; // E.g., 'vocational_statement', 'community_assessment'
  content?: Json | null; // Flexible JSON store for various data structures, make optional
  text_data?: string | null; // For storing text content directly (e.g., email lists)
  file_name?: string | null; // Original name of the uploaded file
  mime_type?: string | null; // MIME type of the uploaded file
  file_path?: string | null; // Path in Supabase storage if applicable
  created_at: string;
  updated_at: string | null;
}

export type Json = 
  | string 
  | number 
  | boolean 
  | null 
  | { [key: string]: Json | undefined } 
  | Json[];

export interface Database {
  public: {
    Tables: {
      church_profile: {
        Row: ChurchProfileRow;
        Insert: Partial<ChurchProfileRow>; // All fields optional for insert
        Update: Partial<ChurchProfileRow>; // All fields optional for update
        Relationships: [
          {
            foreignKeyName: "church_profile_church_id_fkey"; // Example FK name
            columns: ["church_id"];
            referencedRelation: "profiles"; // Assuming profiles table has a church_id to link back, or another table
            referencedColumns: ["church_id"];
          }
        ];
      };
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow>;
        Update: Partial<ProfileRow>;
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      church_data: {
        Row: ChurchDataRow;
        Insert: Partial<ChurchDataRow>;
        Update: Partial<ChurchDataRow>;
        Relationships: [
          // Assuming church_data.church_id references church_profile.church_id
          // or another table that uniquely identifies a church.
          // If church_profile.id (numeric) is the PK, then church_data.church_id should align or use a different FK.
        ];
      };
      // ... other tables from your Supabase schema can be added here
    };
    Views: {
      // ... your views
    };
    Functions: {
      // ... your functions
    };
    Enums: {
      // ... your enums
    };
    CompositeTypes: {
      // ... your composite types
    };
  };
}

// Helper type for Supabase query results
export type DbResult<T> = T extends PromiseLike<infer U> ? U : never;
export type DbResultOk<T> = T extends PromiseLike<{ data: infer U }> ? Exclude<U, null> : never;
export type DbResultErr = PostgrestError;
