import { Database as GeneratedDatabase } from './supabase';

declare global {
  type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

  interface Database extends GeneratedDatabase {
    public: {
      Tables: {
        church_profile: {
          Row: {
            id: number;
            created_at: string;
            church_id: string;
            number_of_active_members: string | null;
            number_of_pledging_members: string | null;
            parochial_report: string | null;
            dream: string | null;
            accomplish: string | null;
            community_description: string | null;
            name: string | null;
          };
          Insert: {
            id?: number;
            created_at?: string;
            church_id: string;
            number_of_active_members?: string | null;
            number_of_pledging_members?: string | null;
            parochial_report?: string | null;
            dream?: string | null;
            accomplish?: string | null;
            community_description?: string | null;
            name?: string | null;
          };
          Update: {
            id?: number;
            created_at?: string;
            church_id?: string;
            number_of_active_members?: string | null;
            number_of_pledging_members?: string | null;
            parochial_report?: string | null;
            dream?: string | null;
            accomplish?: string | null;
            community_description?: string | null;
            name?: string | null;
          };
          Relationships: [];
        };
      };
      Views: {};
      Functions: {};
      Enums: {};
      CompositeTypes: {
        [_ in never]: never;
      };
    };
  }
}

export type { Database };
