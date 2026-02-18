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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      bank_accounts: {
        Row: {
          account_type: string
          balance: number
          bank_name: string
          color: string | null
          created_at: string
          household_id: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type?: string
          balance?: number
          bank_name: string
          color?: string | null
          created_at?: string
          household_id?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: string
          balance?: number
          bank_name?: string
          color?: string | null
          created_at?: string
          household_id?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      card_bills: {
        Row: {
          billing_month: string
          card_id: string
          closed_at: string | null
          created_at: string
          due_date: string
          household_id: string | null
          id: string
          paid_at: string | null
          status: string
          total_amount: number
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_month: string
          card_id: string
          closed_at?: string | null
          created_at?: string
          due_date: string
          household_id?: string | null
          id?: string
          paid_at?: string | null
          status?: string
          total_amount?: number
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_month?: string
          card_id?: string
          closed_at?: string | null
          created_at?: string
          due_date?: string
          household_id?: string | null
          id?: string
          paid_at?: string | null
          status?: string
          total_amount?: number
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_bills_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_bills_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_bills_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      card_transactions: {
        Row: {
          amount: number
          billing_month: string
          card_id: string
          created_at: string
          description: string
          household_id: string | null
          id: string
          installment_number: number
          is_paid: boolean
          parent_card_transaction_id: string | null
          purchase_date: string
          total_installments: number
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          billing_month: string
          card_id: string
          created_at?: string
          description: string
          household_id?: string | null
          id?: string
          installment_number?: number
          is_paid?: boolean
          parent_card_transaction_id?: string | null
          purchase_date?: string
          total_installments?: number
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          billing_month?: string
          card_id?: string
          created_at?: string
          description?: string
          household_id?: string | null
          id?: string
          installment_number?: number
          is_paid?: boolean
          parent_card_transaction_id?: string | null
          purchase_date?: string
          total_installments?: number
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_transactions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_transactions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_transactions_parent_card_transaction_id_fkey"
            columns: ["parent_card_transaction_id"]
            isOneToOne: false
            referencedRelation: "card_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_transactions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          brand: string | null
          closing_day: number
          color: string | null
          created_at: string
          credit_limit: number
          due_day: number
          household_id: string | null
          id: string
          is_active: boolean
          last_four_digits: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand?: string | null
          closing_day: number
          color?: string | null
          created_at?: string
          credit_limit?: number
          due_day: number
          household_id?: string | null
          id?: string
          is_active?: boolean
          last_four_digits?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string | null
          closing_day?: number
          color?: string | null
          created_at?: string
          credit_limit?: number
          due_day?: number
          household_id?: string | null
          id?: string
          is_active?: boolean
          last_four_digits?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_items: {
        Row: {
          category: string | null
          created_at: string
          due_date: string | null
          estimated_amount: number
          goal_id: string
          id: string
          is_paid: boolean
          pix_key: string | null
          supplier: string | null
          title: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          due_date?: string | null
          estimated_amount?: number
          goal_id: string
          id?: string
          is_paid?: boolean
          pix_key?: string | null
          supplier?: string | null
          title: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          due_date?: string | null
          estimated_amount?: number
          goal_id?: string
          id?: string
          is_paid?: boolean
          pix_key?: string | null
          supplier?: string | null
          title?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_items_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          car_value: number | null
          color: string | null
          created_at: string
          deadline: string | null
          event_date: string | null
          household_id: string | null
          icon: string
          id: string
          status: string
          target_amount: number
          template_type: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          car_value?: number | null
          color?: string | null
          created_at?: string
          deadline?: string | null
          event_date?: string | null
          household_id?: string | null
          icon?: string
          id?: string
          status?: string
          target_amount?: number
          template_type?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          car_value?: number | null
          color?: string | null
          created_at?: string
          deadline?: string | null
          event_date?: string | null
          household_id?: string | null
          icon?: string
          id?: string
          status?: string
          target_amount?: number
          template_type?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      household_invites: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string
          household_id: string
          id: string
          invite_code: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string
          household_id: string
          id?: string
          invite_code?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string
          household_id?: string
          id?: string
          invite_code?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "household_invites_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      "N8N Fila de Mensagem": {
        Row: {
          created_at: string
          id: number
          id_mensagem: string | null
          mensagem: string | null
          telefone: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          id_mensagem?: string | null
          mensagem?: string | null
          telefone?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          id_mensagem?: string | null
          mensagem?: string | null
          telefone?: number | null
        }
        Relationships: []
      }
      "N8N Historico de Mensagem": {
        Row: {
          created_at: string
          id: number
          mensagem: Json | null
          session_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          mensagem?: Json | null
          session_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          mensagem?: Json | null
          session_id?: string | null
        }
        Relationships: []
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          household_id: string | null
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          household_id?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          household_id?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          app_mode: string | null
          avatar_url: string | null
          created_at: string
          current_balance: number | null
          full_name: string | null
          household_id: string | null
          id: string
          monthly_income: number | null
          onboarding_completed: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          app_mode?: string | null
          avatar_url?: string | null
          created_at?: string
          current_balance?: number | null
          full_name?: string | null
          household_id?: string | null
          id?: string
          monthly_income?: number | null
          onboarding_completed?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          app_mode?: string | null
          avatar_url?: string | null
          created_at?: string
          current_balance?: number | null
          full_name?: string | null
          household_id?: string | null
          id?: string
          monthly_income?: number | null
          onboarding_completed?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_private: {
        Row: {
          created_at: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recurring_series: {
        Row: {
          id: string
          user_id: string
          household_id: string | null
          description: string
          amount: number
          category: string
          type: string
          interval: string
          start_date: string
          tag: string | null
          payment_method: string | null
          bank_account_id: string | null
          card_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          household_id?: string | null
          description: string
          amount: number
          category: string
          type: string
          interval?: string
          start_date: string
          tag?: string | null
          payment_method?: string | null
          bank_account_id?: string | null
          card_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          household_id?: string | null
          description?: string
          amount?: number
          category?: string
          type?: string
          interval?: string
          start_date?: string
          tag?: string | null
          payment_method?: string | null
          bank_account_id?: string | null
          card_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_series_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_series_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_series_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          bank_account_id: string | null
          card_id: string | null
          category: string
          created_at: string
          date: string
          description: string
          goal_id: string | null
          household_id: string | null
          id: string
          is_recurring: boolean | null
          paid_date: string | null
          parent_transaction_id: string | null
          payment_method: string | null
          recurring_interval: string | null
          recurring_series_id: string | null
          status: string
          tag: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          card_id?: string | null
          category: string
          created_at?: string
          date?: string
          description: string
          goal_id?: string | null
          household_id?: string | null
          id?: string
          is_recurring?: boolean | null
          paid_date?: string | null
          parent_transaction_id?: string | null
          payment_method?: string | null
          recurring_interval?: string | null
          recurring_series_id?: string | null
          status?: string
          tag?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          card_id?: string | null
          category?: string
          created_at?: string
          date?: string
          description?: string
          goal_id?: string | null
          household_id?: string | null
          id?: string
          is_recurring?: boolean | null
          paid_date?: string | null
          parent_transaction_id?: string | null
          payment_method?: string | null
          recurring_interval?: string | null
          recurring_series_id?: string | null
          status?: string
          tag?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_parent_transaction_id_fkey"
            columns: ["parent_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_recurring_series_id_fkey"
            columns: ["recurring_series_id"]
            isOneToOne: false
            referencedRelation: "recurring_series"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          active_modules: Json
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_modules?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_modules?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vapid_keys: {
        Row: {
          created_at: string
          id: string
          private_key: string
          public_key: string
        }
        Insert: {
          created_at?: string
          id?: string
          private_key: string
          public_key: string
        }
        Update: {
          created_at?: string
          id?: string
          private_key?: string
          public_key?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_household_invite: {
        Args: { p_invite_code: string }
        Returns: Json
      }
      calculate_billing_month: {
        Args: { p_closing_day: number; p_purchase_date: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      leave_household: { Args: never; Returns: Json }
      user_household_id: { Args: { _user_id: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
