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
      appointments: {
        Row: {
          additional_info: string | null
          alternate_date: string | null
          created_at: string
          documents: Json | null
          email: string
          full_name: string
          id: string
          phone: string
          preferred_date: string
          preferred_time: string
          status: string
          subject: string
          urgency: boolean | null
        }
        Insert: {
          additional_info?: string | null
          alternate_date?: string | null
          created_at?: string
          documents?: Json | null
          email: string
          full_name: string
          id?: string
          phone: string
          preferred_date: string
          preferred_time: string
          status?: string
          subject: string
          urgency?: boolean | null
        }
        Update: {
          additional_info?: string | null
          alternate_date?: string | null
          created_at?: string
          documents?: Json | null
          email?: string
          full_name?: string
          id?: string
          phone?: string
          preferred_date?: string
          preferred_time?: string
          status?: string
          subject?: string
          urgency?: boolean | null
        }
        Relationships: []
      }
      course_registrations: {
        Row: {
          comments: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string
          specialization: string | null
          workplace: string | null
        }
        Insert: {
          comments?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone: string
          specialization?: string | null
          workplace?: string | null
        }
        Update: {
          comments?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string
          specialization?: string | null
          workplace?: string | null
        }
        Relationships: []
      }
      emails: {
        Row: {
          action_items: Json | null
          created_at: string | null
          decisions: Json | null
          id: number
          key_points: Json | null
          received_date: string | null
          sender: Json | null
          subject: string | null
        }
        Insert: {
          action_items?: Json | null
          created_at?: string | null
          decisions?: Json | null
          id?: number
          key_points?: Json | null
          received_date?: string | null
          sender?: Json | null
          subject?: string | null
        }
        Update: {
          action_items?: Json | null
          created_at?: string | null
          decisions?: Json | null
          id?: number
          key_points?: Json | null
          received_date?: string | null
          sender?: Json | null
          subject?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          audio_url: string | null
          content_id: string
          content_type: string
          corrected_value: string
          created_at: string
          feedback_type: string
          id: string
          original_value: string
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          content_id: string
          content_type: string
          corrected_value: string
          created_at?: string
          feedback_type: string
          id?: string
          original_value: string
          user_id: string
        }
        Update: {
          audio_url?: string | null
          content_id?: string
          content_type?: string
          corrected_value?: string
          created_at?: string
          feedback_type?: string
          id?: string
          original_value?: string
          user_id?: string
        }
        Relationships: []
      }
      "Landing page": {
        Row: {
          "alternative date": string | null
          created_at: string
          "Full name": string | null
          id: number
          info: string | null
          mail: string | null
          "Phone number": number | null
          "preffered date": string | null
          "preffered hour": string | null
          subject: string | null
        }
        Insert: {
          "alternative date"?: string | null
          created_at?: string
          "Full name"?: string | null
          id?: number
          info?: string | null
          mail?: string | null
          "Phone number"?: number | null
          "preffered date"?: string | null
          "preffered hour"?: string | null
          subject?: string | null
        }
        Update: {
          "alternative date"?: string | null
          created_at?: string
          "Full name"?: string | null
          id?: number
          info?: string | null
          mail?: string | null
          "Phone number"?: number | null
          "preffered date"?: string | null
          "preffered hour"?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      Meetings: {
        Row: {
          action_items: string | null
          created_at: string | null
          date: string | null
          description: string | null
          id: number
          participants: string | null
          summary: string | null
          title: string
        }
        Insert: {
          action_items?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: number
          participants?: string | null
          summary?: string | null
          title: string
        }
        Update: {
          action_items?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: number
          participants?: string | null
          summary?: string | null
          title?: string
        }
        Relationships: []
      }
      metrics: {
        Row: {
          id: string
          kpi: string
          notes: string | null
          period: string
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          id?: string
          kpi: string
          notes?: string | null
          period: string
          updated_at?: string
          user_id: string
          value: number
        }
        Update: {
          id?: string
          kpi?: string
          notes?: string | null
          period?: string
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: { role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
