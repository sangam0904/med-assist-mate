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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          thread_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      health_logs: {
        Row: {
          created_at: string
          id: string
          kind: string
          logged_on: string
          meta: Json
          unit: string | null
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          logged_on?: string
          meta?: Json
          unit?: string | null
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          logged_on?: string
          meta?: Json
          unit?: string | null
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      lab_reports: {
        Row: {
          ai_summary: string | null
          created_at: string
          extracted_text: string | null
          file_name: string
          file_path: string
          file_type: string | null
          findings: Json
          id: string
          status: string
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          created_at?: string
          extracted_text?: string | null
          file_name: string
          file_path: string
          file_type?: string | null
          findings?: Json
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          created_at?: string
          extracted_text?: string | null
          file_name?: string
          file_path?: string
          file_type?: string | null
          findings?: Json
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      medicine_logs: {
        Row: {
          created_at: string
          id: string
          medicine_id: string
          scheduled_for: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          medicine_id: string
          scheduled_for: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          medicine_id?: string
          scheduled_for?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicine_logs_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      medicines: {
        Row: {
          active: boolean
          created_at: string
          dosage: string | null
          end_date: string | null
          frequency: string
          id: string
          name: string
          notes: string | null
          start_date: string
          times: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          dosage?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          name: string
          notes?: string | null
          start_date?: string
          times?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          dosage?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          name?: string
          notes?: string | null
          start_date?: string
          times?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          allergies: string | null
          avatar_url: string | null
          blood_group: string | null
          created_at: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string | null
          gender: string | null
          height_cm: number | null
          id: string
          language: string
          medical_history: string | null
          notifications_enabled: boolean
          theme: string
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          age?: number | null
          allergies?: string | null
          avatar_url?: string | null
          blood_group?: string | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id: string
          language?: string
          medical_history?: string | null
          notifications_enabled?: boolean
          theme?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          age?: number | null
          allergies?: string | null
          avatar_url?: string | null
          blood_group?: string | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          gender?: string | null
          height_cm?: number | null
          id?: string
          language?: string
          medical_history?: string | null
          notifications_enabled?: boolean
          theme?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      symptom_checks: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          possible_conditions: Json
          red_flags: Json
          risk_level: string
          self_care: Json
          summary: string | null
          symptoms: string[]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          possible_conditions?: Json
          red_flags?: Json
          risk_level?: string
          self_care?: Json
          summary?: string | null
          symptoms?: string[]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          possible_conditions?: Json
          red_flags?: Json
          risk_level?: string
          self_care?: Json
          summary?: string | null
          symptoms?: string[]
          user_id?: string
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
