export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      apple_health_data: {
        Row: {
          created_at: string
          data_type: string
          end_date: string | null
          id: string
          metadata: Json | null
          source_bundle_id: string | null
          source_name: string | null
          start_date: string
          unit: string | null
          updated_at: string
          user_id: string
          value: number | null
        }
        Insert: {
          created_at?: string
          data_type: string
          end_date?: string | null
          id?: string
          metadata?: Json | null
          source_bundle_id?: string | null
          source_name?: string | null
          start_date: string
          unit?: string | null
          updated_at?: string
          user_id: string
          value?: number | null
        }
        Update: {
          created_at?: string
          data_type?: string
          end_date?: string | null
          id?: string
          metadata?: Json | null
          source_bundle_id?: string | null
          source_name?: string | null
          start_date?: string
          unit?: string | null
          updated_at?: string
          user_id?: string
          value?: number | null
        }
        Relationships: []
      }
      favorite_meals: {
        Row: {
          calories: number
          carbs: number
          created_at: string
          fats: number
          id: string
          meal_type: string | null
          name: string
          protein: number
          updated_at: string
          user_id: string
        }
        Insert: {
          calories: number
          carbs?: number
          created_at?: string
          fats?: number
          id?: string
          meal_type?: string | null
          name: string
          protein?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string
          fats?: number
          id?: string
          meal_type?: string | null
          name?: string
          protein?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fitness_plans: {
        Row: {
          created_at: string
          end_date: string | null
          goals: Json
          id: string
          is_active: boolean
          macros: Json
          plan_name: string
          plan_type: string
          schedule: Json
          start_date: string
          tracking_metrics: Json
          updated_at: string
          user_id: string
          workout_structure: Json
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          goals: Json
          id?: string
          is_active?: boolean
          macros: Json
          plan_name: string
          plan_type: string
          schedule: Json
          start_date: string
          tracking_metrics: Json
          updated_at?: string
          user_id: string
          workout_structure: Json
        }
        Update: {
          created_at?: string
          end_date?: string | null
          goals?: Json
          id?: string
          is_active?: boolean
          macros?: Json
          plan_name?: string
          plan_type?: string
          schedule?: Json
          start_date?: string
          tracking_metrics?: Json
          updated_at?: string
          user_id?: string
          workout_structure?: Json
        }
        Relationships: []
      }
      food_items: {
        Row: {
          api_source: string
          barcode: string | null
          brand: string | null
          calories_per_100g: number
          carbs_per_100g: number
          created_at: string
          external_id: string
          fats_per_100g: number
          fiber_per_100g: number | null
          id: string
          name: string
          protein_per_100g: number
          search_terms: string[] | null
          serving_description: string | null
          serving_size_g: number | null
          sodium_per_100g: number | null
          sugar_per_100g: number | null
          updated_at: string
        }
        Insert: {
          api_source: string
          barcode?: string | null
          brand?: string | null
          calories_per_100g: number
          carbs_per_100g?: number
          created_at?: string
          external_id: string
          fats_per_100g?: number
          fiber_per_100g?: number | null
          id?: string
          name: string
          protein_per_100g?: number
          search_terms?: string[] | null
          serving_description?: string | null
          serving_size_g?: number | null
          sodium_per_100g?: number | null
          sugar_per_100g?: number | null
          updated_at?: string
        }
        Update: {
          api_source?: string
          barcode?: string | null
          brand?: string | null
          calories_per_100g?: number
          carbs_per_100g?: number
          created_at?: string
          external_id?: string
          fats_per_100g?: number
          fiber_per_100g?: number | null
          id?: string
          name?: string
          protein_per_100g?: number
          search_terms?: string[] | null
          serving_description?: string | null
          serving_size_g?: number | null
          sodium_per_100g?: number | null
          sugar_per_100g?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      plan_modifications: {
        Row: {
          created_at: string
          date: string
          id: string
          modification_type: string
          original_value: Json | null
          plan_id: string
          reasoning: string
          status: string
          suggested_value: Json | null
          updated_at: string
          user_id: string
          whoop_data: Json | null
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          modification_type: string
          original_value?: Json | null
          plan_id: string
          reasoning: string
          status?: string
          suggested_value?: Json | null
          updated_at?: string
          user_id: string
          whoop_data?: Json | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          modification_type?: string
          original_value?: Json | null
          plan_id?: string
          reasoning?: string
          status?: string
          suggested_value?: Json | null
          updated_at?: string
          user_id?: string
          whoop_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_modifications_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "fitness_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_progress: {
        Row: {
          adherence_score: number | null
          calories_consumed: number | null
          carbs_consumed: number | null
          created_at: string
          date: string
          fasted_training: boolean | null
          fats_consumed: number | null
          id: string
          meal_cutoff_time: string | null
          notes: string | null
          plan_id: string
          protein_consumed: number | null
          updated_at: string
          user_id: string
          weight: number | null
          workout_completed: boolean | null
          workout_type: string | null
        }
        Insert: {
          adherence_score?: number | null
          calories_consumed?: number | null
          carbs_consumed?: number | null
          created_at?: string
          date: string
          fasted_training?: boolean | null
          fats_consumed?: number | null
          id?: string
          meal_cutoff_time?: string | null
          notes?: string | null
          plan_id: string
          protein_consumed?: number | null
          updated_at?: string
          user_id: string
          weight?: number | null
          workout_completed?: boolean | null
          workout_type?: string | null
        }
        Update: {
          adherence_score?: number | null
          calories_consumed?: number | null
          carbs_consumed?: number | null
          created_at?: string
          date?: string
          fasted_training?: boolean | null
          fats_consumed?: number | null
          id?: string
          meal_cutoff_time?: string | null
          notes?: string | null
          plan_id?: string
          protein_consumed?: number | null
          updated_at?: string
          user_id?: string
          weight?: number | null
          workout_completed?: boolean | null
          workout_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_progress_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "fitness_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_food_logs: {
        Row: {
          calories: number
          carbs: number
          created_at: string
          custom_food_name: string | null
          date: string
          fats: number
          food_item_id: string | null
          id: string
          meal_type: string | null
          protein: number
          serving_amount: number
          serving_unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          calories: number
          carbs?: number
          created_at?: string
          custom_food_name?: string | null
          date?: string
          fats?: number
          food_item_id?: string | null
          id?: string
          meal_type?: string | null
          protein?: number
          serving_amount?: number
          serving_unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string
          custom_food_name?: string | null
          date?: string
          fats?: number
          food_item_id?: string | null
          id?: string
          meal_type?: string | null
          protein?: number
          serving_amount?: number
          serving_unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_food_logs_food_item_id_fkey"
            columns: ["food_item_id"]
            isOneToOne: false
            referencedRelation: "food_items"
            referencedColumns: ["id"]
          },
        ]
      }
      whoop_data: {
        Row: {
          created_at: string
          data: Json
          data_type: string
          date: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data: Json
          data_type: string
          date: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          data_type?: string
          date?: string
          id?: string
          updated_at?: string
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
