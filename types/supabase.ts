export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admin_accounts: {
        Row: {
          company: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          introduction: string | null
          is_active: boolean | null
          last_login_at: string | null
          password_hash: string
          phone: string | null
          profile_image_url: string | null
          role: string | null
          role_id: number | null
          updated_at: string | null
          username: string
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          introduction?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          password_hash: string
          phone?: string | null
          profile_image_url?: string | null
          role?: string | null
          role_id?: number | null
          updated_at?: string | null
          username: string
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          introduction?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          password_hash?: string
          phone?: string | null
          profile_image_url?: string | null
          role?: string | null
          role_id?: number | null
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_accounts_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_profiles: {
        Row: {
          created_at: string | null
          department: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          position: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email: string
          full_name: string
          id: string
          phone?: string | null
          position?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          position?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      business_cards: {
        Row: {
          affiliation: string | null
          company: string | null
          contact: string | null
          created_at: string | null
          email: string | null
          external_link: string | null
          full_name: string
          hobby_keywords: string[] | null
          id: string
          interest_keywords: string[] | null
          introduction: string | null
          is_public: boolean | null
          job_title: string | null
          keywords: string[] | null
          mbti: string | null
          personality_keywords: string[] | null
          profile_image_url: string | null
          qr_code_url: string | null
          role: string | null
          updated_at: string | null
          user_id: string | null
          work_field: string | null
        }
        Insert: {
          affiliation?: string | null
          company?: string | null
          contact?: string | null
          created_at?: string | null
          email?: string | null
          external_link?: string | null
          full_name: string
          hobby_keywords?: string[] | null
          id?: string
          interest_keywords?: string[] | null
          introduction?: string | null
          is_public?: boolean | null
          job_title?: string | null
          keywords?: string[] | null
          mbti?: string | null
          personality_keywords?: string[] | null
          profile_image_url?: string | null
          qr_code_url?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
          work_field?: string | null
        }
        Update: {
          affiliation?: string | null
          company?: string | null
          contact?: string | null
          created_at?: string | null
          email?: string | null
          external_link?: string | null
          full_name?: string
          hobby_keywords?: string[] | null
          id?: string
          interest_keywords?: string[] | null
          introduction?: string | null
          is_public?: boolean | null
          job_title?: string | null
          keywords?: string[] | null
          mbti?: string | null
          personality_keywords?: string[] | null
          profile_image_url?: string | null
          qr_code_url?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
          work_field?: string | null
        }
        Relationships: []
      }
      collected_cards: {
        Row: {
          card_id: string | null
          collected_at: string | null
          collector_id: string | null
          id: string
          is_favorite: boolean | null
        }
        Insert: {
          card_id?: string | null
          collected_at?: string | null
          collector_id?: string | null
          id?: string
          is_favorite?: boolean | null
        }
        Update: {
          card_id?: string | null
          collected_at?: string | null
          collector_id?: string | null
          id?: string
          is_favorite?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "collected_cards_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "business_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          event_id: string | null
          id: string
          joined_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          event_id?: string | null
          id?: string
          joined_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          event_id?: string | null
          id?: string
          joined_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_user_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          created_by: string | null
          current_participants: number | null
          description: string | null
          end_date: string
          event_code: string | null
          id: string
          image_url: string | null
          location: string | null
          max_participants: number | null
          organizer_email: string | null
          organizer_kakao: string | null
          organizer_name: string | null
          organizer_phone: string | null
          overview_points: string[] | null
          special_benefits: string[] | null
          start_date: string
          status: string | null
          target_audience: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          current_participants?: number | null
          description?: string | null
          end_date: string
          event_code?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          max_participants?: number | null
          organizer_email?: string | null
          organizer_kakao?: string | null
          organizer_name?: string | null
          organizer_phone?: string | null
          overview_points?: string[] | null
          special_benefits?: string[] | null
          start_date: string
          status?: string | null
          target_audience?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          current_participants?: number | null
          description?: string | null
          end_date?: string
          event_code?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          max_participants?: number | null
          organizer_email?: string | null
          organizer_kakao?: string | null
          organizer_name?: string | null
          organizer_phone?: string | null
          overview_points?: string[] | null
          special_benefits?: string[] | null
          start_date?: string
          status?: string | null
          target_audience?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          created_at: string | null
          event_id: string | null
          feedback: string | null
          id: string
          rating: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          feedback?: string | null
          id?: string
          rating: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          feedback?: string | null
          id?: string
          rating?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          notification_type: string | null
          read_at: string | null
          related_business_card_id: string | null
          related_event_id: string | null
          related_user_id: string | null
          sent_by: string | null
          target_event_id: string | null
          target_type: string
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          notification_type?: string | null
          read_at?: string | null
          related_business_card_id?: string | null
          related_event_id?: string | null
          related_user_id?: string | null
          sent_by?: string | null
          target_event_id?: string | null
          target_type: string
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          notification_type?: string | null
          read_at?: string | null
          related_business_card_id?: string | null
          related_event_id?: string | null
          related_user_id?: string | null
          sent_by?: string | null
          target_event_id?: string | null
          target_type?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_target_event_id_fkey"
            columns: ["target_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_backup: {
        Row: {
          created_at: string | null
          delivered_count: number | null
          id: string | null
          message: string | null
          read_count: number | null
          sent_at: string | null
          sent_by: string | null
          status: string | null
          target_event_id: string | null
          target_ids: string[] | null
          target_type: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          delivered_count?: number | null
          id?: string | null
          message?: string | null
          read_count?: number | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
          target_event_id?: string | null
          target_ids?: string[] | null
          target_type?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          delivered_count?: number | null
          id?: string | null
          message?: string | null
          read_count?: number | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string | null
          target_event_id?: string | null
          target_ids?: string[] | null
          target_type?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          affiliation: string | null
          affiliation_type: string | null
          birth_date: string | null
          company: string | null
          contact: string | null
          created_at: string | null
          email: string
          external_link: string | null
          full_name: string | null
          has_business_card: boolean | null
          hobby_keywords: string[] | null
          id: string
          interest_keywords: string[] | null
          introduction: string | null
          job_title: string | null
          keywords: string[] | null
          mbti: string | null
          nickname: string | null
          personality_keywords: string[] | null
          profile_image_url: string | null
          qr_code_url: string | null
          role: string | null
          role_id: number
          updated_at: string | null
          work_field: string | null
        }
        Insert: {
          affiliation?: string | null
          affiliation_type?: string | null
          birth_date?: string | null
          company?: string | null
          contact?: string | null
          created_at?: string | null
          email: string
          external_link?: string | null
          full_name?: string | null
          has_business_card?: boolean | null
          hobby_keywords?: string[] | null
          id: string
          interest_keywords?: string[] | null
          introduction?: string | null
          job_title?: string | null
          keywords?: string[] | null
          mbti?: string | null
          nickname?: string | null
          personality_keywords?: string[] | null
          profile_image_url?: string | null
          qr_code_url?: string | null
          role?: string | null
          role_id: number
          updated_at?: string | null
          work_field?: string | null
        }
        Update: {
          affiliation?: string | null
          affiliation_type?: string | null
          birth_date?: string | null
          company?: string | null
          contact?: string | null
          created_at?: string | null
          email?: string
          external_link?: string | null
          full_name?: string | null
          has_business_card?: boolean | null
          hobby_keywords?: string[] | null
          id?: string
          interest_keywords?: string[] | null
          introduction?: string | null
          job_title?: string | null
          keywords?: string[] | null
          mbti?: string | null
          nickname?: string | null
          personality_keywords?: string[] | null
          profile_image_url?: string | null
          qr_code_url?: string | null
          role?: string | null
          role_id?: number
          updated_at?: string | null
          work_field?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      handle_new_user_signup: {
        Args: { user_email: string; user_id: string; user_name?: string }
        Returns: Json
      }
      send_notification_to_event_participants: {
        Args: {
          event_id: string
          notification_message: string
          notification_title: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
