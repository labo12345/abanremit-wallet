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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          agent_code: string | null
          commission_rate: number
          created_at: string
          id: string
          profile_id: string
          status: Database["public"]["Enums"]["agent_status"]
          updated_at: string
          wallet_balance: number
        }
        Insert: {
          agent_code?: string | null
          commission_rate?: number
          created_at?: string
          id?: string
          profile_id: string
          status?: Database["public"]["Enums"]["agent_status"]
          updated_at?: string
          wallet_balance?: number
        }
        Update: {
          agent_code?: string | null
          commission_rate?: number
          created_at?: string
          id?: string
          profile_id?: string
          status?: Database["public"]["Enums"]["agent_status"]
          updated_at?: string
          wallet_balance?: number
        }
        Relationships: [
          {
            foreignKeyName: "agents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          balance_after: number | null
          balance_before: number | null
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          profile_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          balance_after?: number | null
          balance_before?: number | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          profile_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          balance_after?: number | null
          balance_before?: number | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          profile_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          agent_id: string
          amount: number
          created_at: string
          id: string
          withdrawal_id: string
        }
        Insert: {
          agent_id: string
          amount: number
          created_at?: string
          id?: string
          withdrawal_id: string
        }
        Update: {
          agent_id?: string
          amount?: number
          created_at?: string
          id?: string
          withdrawal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_withdrawal_id_fkey"
            columns: ["withdrawal_id"]
            isOneToOne: false
            referencedRelation: "withdrawals"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_transaction_totals: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          total_sent: number
          total_withdrawn: number
          transaction_count: number
          transaction_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          total_sent?: number
          total_withdrawn?: number
          transaction_count?: number
          transaction_date?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          total_sent?: number
          total_withdrawn?: number
          transaction_count?: number
          transaction_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_transaction_totals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deposits: {
        Row: {
          amount: number
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          external_reference: string | null
          id: string
          metadata: Json | null
          profile_id: string
          provider: string
          reference_code: string
          status: string
        }
        Insert: {
          amount: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          external_reference?: string | null
          id?: string
          metadata?: Json | null
          profile_id: string
          provider?: string
          reference_code?: string
          status?: string
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          external_reference?: string | null
          id?: string
          metadata?: Json | null
          profile_id?: string
          provider?: string
          reference_code?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposits_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_change_logs: {
        Row: {
          changed_by: string | null
          created_at: string
          fee_config_id: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          fee_config_id?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          fee_config_id?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_change_logs_fee_config_id_fkey"
            columns: ["fee_config_id"]
            isOneToOne: false
            referencedRelation: "fee_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_configurations: {
        Row: {
          created_at: string
          description: string | null
          fee_type: string
          flat_amount: number
          id: string
          is_active: boolean
          percentage_rate: number
          tier_config: Json | null
          transaction_type: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          fee_type?: string
          flat_amount?: number
          id?: string
          is_active?: boolean
          percentage_rate?: number
          tier_config?: Json | null
          transaction_type: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          fee_type?: string
          flat_amount?: number
          id?: string
          is_active?: boolean
          percentage_rate?: number
          tier_config?: Json | null
          transaction_type?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      notification_queue: {
        Row: {
          channel: string
          created_at: string
          error_message: string | null
          id: string
          payload: Json
          profile_id: string | null
          recipient: string
          retry_count: number
          sent_at: string | null
          status: string
          template_name: string
        }
        Insert: {
          channel: string
          created_at?: string
          error_message?: string | null
          id?: string
          payload?: Json
          profile_id?: string | null
          recipient: string
          retry_count?: number
          sent_at?: string | null
          status?: string
          template_name: string
        }
        Update: {
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          payload?: Json
          profile_id?: string | null
          recipient?: string
          retry_count?: number
          sent_at?: string | null
          status?: string
          template_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_queue_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          kyc_consent_at: string | null
          kyc_verified: boolean
          kyc_verified_at: string | null
          national_id: string | null
          phone_number: string
          phone_verified: boolean
          phone_verified_at: string | null
          pin_hash: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          kyc_consent_at?: string | null
          kyc_verified?: boolean
          kyc_verified_at?: string | null
          national_id?: string | null
          phone_number: string
          phone_verified?: boolean
          phone_verified_at?: string | null
          pin_hash?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          kyc_consent_at?: string | null
          kyc_verified?: boolean
          kyc_verified_at?: string | null
          national_id?: string | null
          phone_number?: string
          phone_verified?: boolean
          phone_verified_at?: string | null
          pin_hash?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_status: {
        Row: {
          component: string
          error_message: string | null
          id: string
          last_check_at: string
          metadata: Json | null
          response_time_ms: number | null
          status: string
          updated_at: string
        }
        Insert: {
          component: string
          error_message?: string | null
          id?: string
          last_check_at?: string
          metadata?: Json | null
          response_time_ms?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          component?: string
          error_message?: string | null
          id?: string
          last_check_at?: string
          metadata?: Json | null
          response_time_ms?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      transaction_limits: {
        Row: {
          created_at: string
          daily_limit: number | null
          description: string | null
          id: string
          is_active: boolean
          limit_type: string
          max_amount: number
          min_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_limit?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          limit_type: string
          max_amount?: number
          min_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_limit?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          limit_type?: string
          max_amount?: number
          min_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          fee_amount: number
          id: string
          recipient_name: string | null
          recipient_phone: string | null
          reference_code: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          fee_amount?: number
          id?: string
          recipient_name?: string | null
          recipient_phone?: string | null
          reference_code?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          fee_amount?: number
          id?: string
          recipient_name?: string | null
          recipient_phone?: string | null
          reference_code?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type?: Database["public"]["Enums"]["transaction_type"]
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
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
      user_sessions: {
        Row: {
          created_at: string
          device_info: string | null
          expires_at: string
          id: string
          ip_address: string | null
          is_active: boolean
          last_active_at: string
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: string | null
          expires_at: string
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_active_at?: string
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_active_at?: string
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          profile_id: string
          updated_at: string
          wallet_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          profile_id: string
          updated_at?: string
          wallet_id?: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          profile_id?: string
          updated_at?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          external_reference: string
          id: string
          payload: Json
          processed_at: string | null
          provider: string
          retry_count: number
          signature: string | null
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          external_reference: string
          id?: string
          payload: Json
          processed_at?: string | null
          provider: string
          retry_count?: number
          signature?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          external_reference?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          provider?: string
          retry_count?: number
          signature?: string | null
          status?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          agent_id: string | null
          amount: number
          confirmed_at: string | null
          created_at: string
          id: string
          profile_id: string
          reference_code: string | null
          status: Database["public"]["Enums"]["withdrawal_status"]
        }
        Insert: {
          agent_id?: string | null
          amount: number
          confirmed_at?: string | null
          created_at?: string
          id?: string
          profile_id: string
          reference_code?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
        }
        Update: {
          agent_id?: string | null
          amount?: number
          confirmed_at?: string | null
          created_at?: string
          id?: string
          profile_id?: string
          reference_code?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      credit_wallet: {
        Args: {
          p_amount: number
          p_description?: string
          p_profile_id: string
          p_reference: string
        }
        Returns: Json
      }
      debit_wallet: {
        Args: {
          p_amount: number
          p_description?: string
          p_profile_id: string
          p_reference: string
          p_type?: string
        }
        Returns: Json
      }
      get_profile_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      transfer_wallet: {
        Args: {
          p_amount: number
          p_description?: string
          p_from_profile_id: string
          p_reference: string
          p_to_profile_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      agent_status: "pending" | "approved" | "suspended"
      app_role: "user" | "agent" | "admin"
      transaction_status: "pending" | "completed" | "failed" | "cancelled"
      transaction_type:
        | "deposit"
        | "withdrawal"
        | "send"
        | "receive"
        | "airtime"
        | "commission"
        | "fee"
      withdrawal_status: "pending" | "confirmed" | "rejected" | "cancelled"
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
      agent_status: ["pending", "approved", "suspended"],
      app_role: ["user", "agent", "admin"],
      transaction_status: ["pending", "completed", "failed", "cancelled"],
      transaction_type: [
        "deposit",
        "withdrawal",
        "send",
        "receive",
        "airtime",
        "commission",
        "fee",
      ],
      withdrawal_status: ["pending", "confirmed", "rejected", "cancelled"],
    },
  },
} as const
