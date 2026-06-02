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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      annual_plans: {
        Row: {
          baseline: number
          created_at: string
          created_by: string | null
          id: string
          indicator: string
          indicator_code: string
          program_area: string
          sub_program: string
          target: number
          unit: string
          updated_at: string
          year: number
        }
        Insert: {
          baseline?: number
          created_at?: string
          created_by?: string | null
          id?: string
          indicator: string
          indicator_code: string
          program_area: string
          sub_program: string
          target?: number
          unit?: string
          updated_at?: string
          year: number
        }
        Update: {
          baseline?: number
          created_at?: string
          created_by?: string | null
          id?: string
          indicator?: string
          indicator_code?: string
          program_area?: string
          sub_program?: string
          target?: number
          unit?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          error_message: string | null
          id: string
          resource: string
          status: string
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string
          error_message?: string | null
          id?: string
          resource: string
          status?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string
          error_message?: string | null
          id?: string
          resource?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string | null
          head_name: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          head_name?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          head_name?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      hospital_plan_and_performance: {
        Row: {
          category: string
          created_at: string | null
          fiscal_year: string
          id: number
          indicator_name: string
          metric_type: string
          metric_value: number | null
          percentage_value: number | null
          remark: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          fiscal_year: string
          id?: number
          indicator_name: string
          metric_type: string
          metric_value?: number | null
          percentage_value?: number | null
          remark?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          fiscal_year?: string
          id?: number
          indicator_name?: string
          metric_type?: string
          metric_value?: number | null
          percentage_value?: number | null
          remark?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      indicators: {
        Row: {
          actual_value: number | null
          amharic_name: string | null
          category: string | null
          created_at: string | null
          direction: string | null
          id: string
          name: string
          status: string | null
          target_value: number | null
          unit: string | null
        }
        Insert: {
          actual_value?: number | null
          amharic_name?: string | null
          category?: string | null
          created_at?: string | null
          direction?: string | null
          id?: string
          name: string
          status?: string | null
          target_value?: number | null
          unit?: string | null
        }
        Update: {
          actual_value?: number | null
          amharic_name?: string | null
          category?: string | null
          created_at?: string | null
          direction?: string | null
          id?: string
          name?: string
          status?: string | null
          target_value?: number | null
          unit?: string | null
        }
        Relationships: []
      }
      monthly_data: {
        Row: {
          actual: number
          created_at: string
          entered_by: string | null
          id: string
          indicator_code: string
          month: number
          remarks: string | null
          updated_at: string
          year: number
        }
        Insert: {
          actual?: number
          created_at?: string
          entered_by?: string | null
          id?: string
          indicator_code: string
          month: number
          remarks?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          actual?: number
          created_at?: string
          entered_by?: string | null
          id?: string
          indicator_code?: string
          month?: number
          remarks?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      assessment_items: {
        Row: {
          created_at: string | null
          guide_notes: string | null
          id: string
          item_description: string
          max_score: number
          section_name: string
          sort_order: number
          weighting: number | null
        }
        Insert: {
          created_at?: string | null
          guide_notes?: string | null
          id?: string
          item_description: string
          max_score: number
          section_name: string
          sort_order?: number
          weighting?: number | null
        }
        Update: {
          created_at?: string | null
          guide_notes?: string | null
          id?: string
          item_description?: string
          max_score?: number
          section_name?: string
          sort_order?: number
          weighting?: number | null
        }
        Relationships: []
      }
      facilities: {
        Row: {
          code: string
          created_at: string | null
          id: string
          name: string
          region: string | null
          updated_at: string | null
          woreda: string | null
          zone: string | null
        }
        Insert: {
          code?: string
          created_at?: string | null
          id?: string
          name: string
          region?: string | null
          updated_at?: string | null
          woreda?: string | null
          zone?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          name?: string
          region?: string | null
          updated_at?: string | null
          woreda?: string | null
          zone?: string | null
        }
        Relationships: []
      }
      assessments: {
        Row: {
          assessment_date: string
          created_at: string | null
          created_by: string | null
          facility_id: string
          id: string
          quarter: string
          total_score: number | null
          updated_at: string | null
        }
        Insert: {
          assessment_date: string
          created_at?: string | null
          created_by?: string | null
          facility_id: string
          id?: string
          quarter: string
          total_score?: number | null
          updated_at?: string | null
        }
        Update: {
          assessment_date?: string
          created_at?: string | null
          created_by?: string | null
          facility_id?: string
          id?: string
          quarter?: string
          total_score?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      responses: {
        Row: {
          assessment_id: string
          created_at: string | null
          id: string
          item_id: string
          remarks: string | null
          score_achieved: number
        }
        Insert: {
          assessment_id: string
          created_at?: string | null
          id?: string
          item_id: string
          remarks?: string | null
          score_achieved: number
        }
        Update: {
          assessment_id?: string
          created_at?: string | null
          id?: string
          item_id?: string
          remarks?: string | null
          score_achieved?: number
        }
        Relationships: []
      }
      ipc_assessments: {
        Row: {
          assessment_date: string
          assessor_names: string | null
          created_at: string | null
          created_by: string | null
          hospital_location: string | null
          hospital_name: string
          hospital_profile: Json | null
          id: string
          responses: Json | null
          score_percentage: number | null
          section_i_score: number | null
          section_ii_score: number | null
          status: string | null
          total_score: number | null
          updated_at: string | null
        }
        Insert: {
          assessment_date: string
          assessor_names?: string | null
          created_at?: string | null
          created_by?: string | null
          hospital_location?: string | null
          hospital_name: string
          hospital_profile?: Json | null
          id?: string
          responses?: Json | null
          score_percentage?: number | null
          section_i_score?: number | null
          section_ii_score?: number | null
          status?: string | null
          total_score?: number | null
          updated_at?: string | null
        }
        Update: {
          assessment_date?: string
          assessor_names?: string | null
          created_at?: string | null
          created_by?: string | null
          hospital_location?: string | null
          hospital_name?: string
          hospital_profile?: Json | null
          id?: string
          responses?: Json | null
          score_percentage?: number | null
          section_i_score?: number | null
          section_ii_score?: number | null
          status?: string | null
          total_score?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
          created_at: string
          department: Database["public"]["Enums"]["department"]
          display_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department: Database["public"]["Enums"]["department"]
          display_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: Database["public"]["Enums"]["department"]
          display_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      get_user_department: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["department"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "department_head" | "data_entry" | "viewer"
      department:
        | "Maternal & Child Health"
        | "Child Health"
        | "Nutrition"
        | "HIV/AIDS & STI"
        | "Tuberculosis"
        | "Malaria"
        | "WASH"
        | "NCD"
        | "Health System Strengthening"
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
    Enums: {
      app_role: ["admin", "department_head", "data_entry", "viewer"],
      department: [
        "Maternal & Child Health",
        "Child Health",
        "Nutrition",
        "HIV/AIDS & STI",
        "Tuberculosis",
        "Malaria",
        "WASH",
        "NCD",
        "Health System Strengthening",
      ],
    },
  },
} as const
