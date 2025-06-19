export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      archetypes: {
        Row: {
          attributes: Json | null
          created_at: string
          description: string
          id: string
          name: string
          prompts: Json | null
          type: string
        }
        Insert: {
          attributes?: Json | null
          created_at?: string
          description: string
          id?: string
          name: string
          prompts?: Json | null
          type: string
        }
        Update: {
          attributes?: Json | null
          created_at?: string
          description?: string
          id?: string
          name?: string
          prompts?: Json | null
          type?: string
        }
        Relationships: []
      }
      card_categories: {
        Row: {
          color: string
          created_at: string
          description: string | null
          id: string
          is_formal: boolean
          name: string
          updated_at: string
        }
        Insert: {
          color: string
          created_at?: string
          description?: string | null
          id?: string
          is_formal?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_formal?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      card_connections: {
        Row: {
          bidirectional: boolean
          created_at: string
          id: string
          relationship_type: string
          source_card_id: string
          strength: number
          target_card_id: string
          updated_at: string
        }
        Insert: {
          bidirectional?: boolean
          created_at?: string
          id?: string
          relationship_type: string
          source_card_id: string
          strength: number
          target_card_id: string
          updated_at?: string
        }
        Update: {
          bidirectional?: boolean
          created_at?: string
          id?: string
          relationship_type?: string
          source_card_id?: string
          strength?: number
          target_card_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_connections_source_card_id_fkey"
            columns: ["source_card_id"]
            isOneToOne: false
            referencedRelation: "implementation_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_connections_target_card_id_fkey"
            columns: ["target_card_id"]
            isOneToOne: false
            referencedRelation: "implementation_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      card_conversations: {
        Row: {
          card_id: string
          content: string
          conversation_type: string
          id: string
          sender: string
          timestamp: string
        }
        Insert: {
          card_id: string
          content: string
          conversation_type: string
          id?: string
          sender: string
          timestamp?: string
        }
        Update: {
          card_id?: string
          content?: string
          conversation_type?: string
          id?: string
          sender?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_conversations_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "implementation_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      church_avatars: {
        Row: {
          avatar_name: string
          avatar_point_of_view: string
          avatar_structured_data: Json | null
          created_at: string
          id: string
          image_url: string | null
        }
        Insert: {
          avatar_name: string
          avatar_point_of_view: string
          avatar_structured_data?: Json | null
          created_at?: string
          id?: string
          image_url?: string | null
        }
        Update: {
          avatar_name?: string
          avatar_point_of_view?: string
          avatar_structured_data?: Json | null
          created_at?: string
          id?: string
          image_url?: string | null
        }
        Relationships: []
      }
      community_avatars: {
        Row: {
          avatar_name: string
          avatar_point_of_view: string
          avatar_structured_data: Json | null
          created_at: string
          id: string
          image_url: string | null
        }
        Insert: {
          avatar_name: string
          avatar_point_of_view: string
          avatar_structured_data?: Json | null
          created_at?: string
          id?: string
          image_url?: string | null
        }
        Update: {
          avatar_name?: string
          avatar_point_of_view?: string
          avatar_structured_data?: Json | null
          created_at?: string
          id?: string
          image_url?: string | null
        }
        Relationships: []
      }
      community_research: {
        Row: {
          church_id: string | null
          created_at: string | null
          id: string
          notes: string
          updated_at: string | null
        }
        Insert: {
          church_id?: string | null
          created_at?: string | null
          id?: string
          notes: string
          updated_at?: string | null
        }
        Update: {
          church_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      Companion: {
        Row: {
          avatar_url: string | null
          companion: string | null
          companion_type: string | null
          knowledge_domains: string | null
          memory_threshold: string | null
          speech_pattern: string | null
          traits: string | null
          UUID: number
        }
        Insert: {
          avatar_url?: string | null
          companion?: string | null
          companion_type?: string | null
          knowledge_domains?: string | null
          memory_threshold?: string | null
          speech_pattern?: string | null
          traits?: string | null
          UUID: number
        }
        Update: {
          avatar_url?: string | null
          companion?: string | null
          companion_type?: string | null
          knowledge_domains?: string | null
          memory_threshold?: string | null
          speech_pattern?: string | null
          traits?: string | null
          UUID?: number
        }
        Relationships: []
      }
      implementation_cards: {
        Row: {
          attributes: Json | null
          category_ids: string[] | null
          created_at: string
          description: string
          id: string
          name: string
          position: Json | null
          type: string
          updated_at: string
        }
        Insert: {
          attributes?: Json | null
          category_ids?: string[] | null
          created_at?: string
          description: string
          id?: string
          name: string
          position?: Json | null
          type: string
          updated_at?: string
        }
        Update: {
          attributes?: Json | null
          category_ids?: string[] | null
          created_at?: string
          description?: string
          id?: string
          name?: string
          position?: Json | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      narrative_avatars: {
        Row: {
          avatar_name: string
          avatar_point_of_view: string
          created_at: string
          id: string
          image_url: string | null
        }
        Insert: {
          avatar_name: string
          avatar_point_of_view: string
          created_at?: string
          id?: string
          image_url?: string | null
        }
        Update: {
          avatar_name?: string
          avatar_point_of_view?: string
          created_at?: string
          id?: string
          image_url?: string | null
        }
        Relationships: []
      }
      network_connections: {
        Row: {
          church_similarity_data: Json
          community_similarity_data: Json
          created_at: string
          id: string
          plan_similarity_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          church_similarity_data?: Json
          community_similarity_data?: Json
          created_at?: string
          id?: string
          plan_similarity_data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          church_similarity_data?: Json
          community_similarity_data?: Json
          created_at?: string
          id?: string
          plan_similarity_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          church_name: string | null
          city: string | null
          id: string
          name: string | null
          phone: string | null
          state: string | null
        }
        Insert: {
          address?: string | null
          church_name?: string | null
          city?: string | null
          id: string
          name?: string | null
          phone?: string | null
          state?: string | null
        }
        Update: {
          address?: string | null
          church_name?: string | null
          city?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          state?: string | null
        }
        Relationships: []
      }
      prompts: {
        Row: {
          created_at: string | null
          id: string
          prompt: string
          prompt_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          prompt: string
          prompt_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          prompt?: string
          prompt_type?: string
        }
        Relationships: []
      }
      research_categories: {
        Row: {
          category_group: string
          created_at: string
          id: string
          label: string
          page_type: string
          search_prompt: string
          updated_at: string
        }
        Insert: {
          category_group: string
          created_at?: string
          id?: string
          label: string
          page_type: string
          search_prompt: string
          updated_at?: string
        }
        Update: {
          category_group?: string
          created_at?: string
          id?: string
          label?: string
          page_type?: string
          search_prompt?: string
          updated_at?: string
        }
        Relationships: []
      }
      resource_library: {
        Row: {
          content: string
          created_at: string
          id: string
          resource_type: string | null
          scenario_title: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          resource_type?: string | null
          scenario_title?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          resource_type?: string | null
          scenario_title?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      scenarios: {
        Row: {
          created_at: string
          description: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      scenarios_avatar_mapping: {
        Row: {
          avatar_id: string
          avatar_type: string
          created_at: string
          id: string
          scenario_id: string
        }
        Insert: {
          avatar_id: string
          avatar_type: string
          created_at?: string
          id?: string
          scenario_id: string
        }
        Update: {
          avatar_id?: string
          avatar_type?: string
          created_at?: string
          id?: string
          scenario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_avatar_mapping_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      section_avatars: {
        Row: {
          avatar_url: string | null
          created_at: string
          description: string | null
          id: string
          initial_message: string
          name: string
          page: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          initial_message: string
          name: string
          page: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          initial_message?: string
          name?: string
          page?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
