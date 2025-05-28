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
      admin_staff_financials: {
        Row: {
          base_salary: number
          commission: number
          created_at: string
          id: string
          month: number
          name: string
          role: string
          updated_at: string
          year: number
        }
        Insert: {
          base_salary?: number
          commission?: number
          created_at?: string
          id?: string
          month: number
          name: string
          role: string
          updated_at?: string
          year: number
        }
        Update: {
          base_salary?: number
          commission?: number
          created_at?: string
          id?: string
          month?: number
          name?: string
          role?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
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
      clinic_rates: {
        Row: {
          clinic_type: string
          created_at: string
          id: string
          meeting_type: string
          rate: number
          staff_role: string
          updated_at: string
        }
        Insert: {
          clinic_type: string
          created_at?: string
          id?: string
          meeting_type: string
          rate?: number
          staff_role: string
          updated_at?: string
        }
        Update: {
          clinic_type?: string
          created_at?: string
          id?: string
          meeting_type?: string
          rate?: number
          staff_role?: string
          updated_at?: string
        }
        Relationships: []
      }
      clinical_sessions: {
        Row: {
          clinic_type: string
          count: number
          created_at: string
          duration: number
          id: string
          meeting_type: string
          month: number
          service_age_group: string
          show_status: string
          staff_id: string
          updated_at: string
          year: number
        }
        Insert: {
          clinic_type: string
          count?: number
          created_at?: string
          duration?: number
          id?: string
          meeting_type: string
          month: number
          service_age_group?: string
          show_status: string
          staff_id: string
          updated_at?: string
          year: number
        }
        Update: {
          clinic_type?: string
          count?: number
          created_at?: string
          duration?: number
          id?: string
          meeting_type?: string
          month?: number
          service_age_group?: string
          show_status?: string
          staff_id?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "clinical_sessions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_staff_rates: {
        Row: {
          admin_rate: number
          adult_follow_up_rate: number | null
          adult_intake_rate: number | null
          adult_no_show_follow_up_rate: number | null
          adult_no_show_intake_rate: number | null
          availability_retainer_rate: number
          child_follow_up_rate: number | null
          child_intake_rate: number | null
          child_no_show_follow_up_rate: number | null
          child_no_show_intake_rate: number | null
          contract_type_identifier: string | null
          created_at: string
          effective_date: string
          follow_up_session_rate: number
          id: string
          intake_session_rate: number
          no_show_follow_up_rate: number
          no_show_intake_rate: number
          staff_id: string
          training_rate: number
          updated_at: string
        }
        Insert: {
          admin_rate: number
          adult_follow_up_rate?: number | null
          adult_intake_rate?: number | null
          adult_no_show_follow_up_rate?: number | null
          adult_no_show_intake_rate?: number | null
          availability_retainer_rate: number
          child_follow_up_rate?: number | null
          child_intake_rate?: number | null
          child_no_show_follow_up_rate?: number | null
          child_no_show_intake_rate?: number | null
          contract_type_identifier?: string | null
          created_at?: string
          effective_date?: string
          follow_up_session_rate: number
          id?: string
          intake_session_rate: number
          no_show_follow_up_rate: number
          no_show_intake_rate: number
          staff_id: string
          training_rate: number
          updated_at?: string
        }
        Update: {
          admin_rate?: number
          adult_follow_up_rate?: number | null
          adult_intake_rate?: number | null
          adult_no_show_follow_up_rate?: number | null
          adult_no_show_intake_rate?: number | null
          availability_retainer_rate?: number
          child_follow_up_rate?: number | null
          child_intake_rate?: number | null
          child_no_show_follow_up_rate?: number | null
          child_no_show_intake_rate?: number | null
          contract_type_identifier?: string | null
          created_at?: string
          effective_date?: string
          follow_up_session_rate?: number
          id?: string
          intake_session_rate?: number
          no_show_follow_up_rate?: number
          no_show_intake_rate?: number
          staff_id?: string
          training_rate?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_staff_rates_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_staff_work: {
        Row: {
          admin_hours: number
          availability_retainer_hours: number
          created_at: string
          follow_up_units_completed: number
          id: string
          intakes_completed: number
          month: number
          no_show_hours: number
          quarterly_gross_fees: number
          staff_id: string
          training_hours: number
          updated_at: string
          year: number
        }
        Insert: {
          admin_hours?: number
          availability_retainer_hours?: number
          created_at?: string
          follow_up_units_completed?: number
          id?: string
          intakes_completed?: number
          month: number
          no_show_hours?: number
          quarterly_gross_fees?: number
          staff_id: string
          training_hours?: number
          updated_at?: string
          year: number
        }
        Update: {
          admin_hours?: number
          availability_retainer_hours?: number
          created_at?: string
          follow_up_units_completed?: number
          id?: string
          intakes_completed?: number
          month?: number
          no_show_hours?: number
          quarterly_gross_fees?: number
          staff_id?: string
          training_hours?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "clinical_staff_work_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
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
      financial_settings: {
        Row: {
          bonus_csat_threshold_level1: number
          bonus_csat_threshold_level2: number
          bonus_csat_threshold_level3: number
          bonus_hours_threshold_level1: number | null
          bonus_hours_threshold_level2: number | null
          bonus_hours_threshold_level3: number | null
          bonus_no_show_threshold_level1: number
          bonus_no_show_threshold_level2: number
          bonus_no_show_threshold_level3: number
          created_at: string
          id: string
          target_clinical_payroll_to_revenue_ratio: number
          target_total_payroll_to_revenue_ratio: number
          updated_at: string
          vat_rate: number
        }
        Insert: {
          bonus_csat_threshold_level1: number
          bonus_csat_threshold_level2: number
          bonus_csat_threshold_level3: number
          bonus_hours_threshold_level1?: number | null
          bonus_hours_threshold_level2?: number | null
          bonus_hours_threshold_level3?: number | null
          bonus_no_show_threshold_level1: number
          bonus_no_show_threshold_level2: number
          bonus_no_show_threshold_level3: number
          created_at?: string
          id?: string
          target_clinical_payroll_to_revenue_ratio: number
          target_total_payroll_to_revenue_ratio: number
          updated_at?: string
          vat_rate: number
        }
        Update: {
          bonus_csat_threshold_level1?: number
          bonus_csat_threshold_level2?: number
          bonus_csat_threshold_level3?: number
          bonus_hours_threshold_level1?: number | null
          bonus_hours_threshold_level2?: number | null
          bonus_hours_threshold_level3?: number | null
          bonus_no_show_threshold_level1?: number
          bonus_no_show_threshold_level2?: number
          bonus_no_show_threshold_level3?: number
          created_at?: string
          id?: string
          target_clinical_payroll_to_revenue_ratio?: number
          target_total_payroll_to_revenue_ratio?: number
          updated_at?: string
          vat_rate?: number
        }
        Relationships: []
      }
      fixed_overheads: {
        Row: {
          created_at: string
          id: string
          month: number
          monthly_cost: number
          name: string
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          month: number
          monthly_cost: number
          name: string
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          month?: number
          monthly_cost?: number
          name?: string
          updated_at?: string
          year?: number
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
      revenue_sources: {
        Row: {
          created_at: string
          id: string
          month: number
          name: string
          quantity: number
          rate_per_unit: number
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          month: number
          name: string
          quantity: number
          rate_per_unit: number
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          month?: number
          name?: string
          quantity?: number
          rate_per_unit?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      staff_members: {
        Row: {
          active: boolean
          created_at: string
          end_date: string | null
          id: string
          name: string
          role: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          end_date?: string | null
          id?: string
          name: string
          role: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          end_date?: string | null
          id?: string
          name?: string
          role?: string
          start_date?: string | null
          updated_at?: string
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
