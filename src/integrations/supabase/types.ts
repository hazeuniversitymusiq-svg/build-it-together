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
      biller_accounts: {
        Row: {
          account_reference: string
          biller_name: string
          id: string
          last_sync_at: string | null
          status: Database["public"]["Enums"]["biller_status"]
          user_id: string
        }
        Insert: {
          account_reference: string
          biller_name: string
          id?: string
          last_sync_at?: string | null
          status?: Database["public"]["Enums"]["biller_status"]
          user_id: string
        }
        Update: {
          account_reference?: string
          biller_name?: string
          id?: string
          last_sync_at?: string | null
          status?: Database["public"]["Enums"]["biller_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "biller_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      connectors: {
        Row: {
          capabilities: Json
          error_code: string | null
          id: string
          last_sync_at: string | null
          mode: Database["public"]["Enums"]["app_mode"]
          name: Database["public"]["Enums"]["connector_name"]
          status: Database["public"]["Enums"]["connector_status"]
          type: Database["public"]["Enums"]["connector_type"]
          user_id: string
        }
        Insert: {
          capabilities?: Json
          error_code?: string | null
          id?: string
          last_sync_at?: string | null
          mode?: Database["public"]["Enums"]["app_mode"]
          name: Database["public"]["Enums"]["connector_name"]
          status?: Database["public"]["Enums"]["connector_status"]
          type: Database["public"]["Enums"]["connector_type"]
          user_id: string
        }
        Update: {
          capabilities?: Json
          error_code?: string | null
          id?: string
          last_sync_at?: string | null
          mode?: Database["public"]["Enums"]["app_mode"]
          name?: Database["public"]["Enums"]["connector_name"]
          status?: Database["public"]["Enums"]["connector_status"]
          type?: Database["public"]["Enums"]["connector_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connectors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      consents: {
        Row: {
          connector_id: string
          granted_at: string
          id: string
          scope: Json
          status: Database["public"]["Enums"]["consent_status"]
          user_id: string
        }
        Insert: {
          connector_id: string
          granted_at?: string
          id?: string
          scope?: Json
          status?: Database["public"]["Enums"]["consent_status"]
          user_id: string
        }
        Update: {
          connector_id?: string
          granted_at?: string
          id?: string
          scope?: Json
          status?: Database["public"]["Enums"]["consent_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consents_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "connectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string
          default_wallet: Database["public"]["Enums"]["default_wallet"]
          id: string
          name: string
          phone: string
          supported_wallets: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          default_wallet?: Database["public"]["Enums"]["default_wallet"]
          id?: string
          name: string
          phone: string
          supported_wallets?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          default_wallet?: Database["public"]["Enums"]["default_wallet"]
          id?: string
          name?: string
          phone?: string
          supported_wallets?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      discovered_apps: {
        Row: {
          app_name: string
          app_type: Database["public"]["Enums"]["app_discovery_type"]
          confidence: number
          created_at: string
          detected: boolean
          discovery_source: Database["public"]["Enums"]["discovery_source"]
          id: string
          user_id: string
        }
        Insert: {
          app_name: string
          app_type: Database["public"]["Enums"]["app_discovery_type"]
          confidence?: number
          created_at?: string
          detected?: boolean
          discovery_source?: Database["public"]["Enums"]["discovery_source"]
          id?: string
          user_id: string
        }
        Update: {
          app_name?: string
          app_type?: Database["public"]["Enums"]["app_discovery_type"]
          confidence?: number
          created_at?: string
          detected?: boolean
          discovery_source?: Database["public"]["Enums"]["discovery_source"]
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discovered_apps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_logs: {
        Row: {
          connector_calls: Json
          created_at: string
          id: string
          intent_snapshot: Json
          outcome: Json
          plan_snapshot: Json
          transaction_id: string
          user_id: string
        }
        Insert: {
          connector_calls?: Json
          created_at?: string
          id?: string
          intent_snapshot?: Json
          outcome?: Json
          plan_snapshot?: Json
          transaction_id: string
          user_id: string
        }
        Update: {
          connector_calls?: Json
          created_at?: string
          id?: string
          intent_snapshot?: Json
          outcome?: Json
          plan_snapshot?: Json
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "execution_logs_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execution_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      funding_sources: {
        Row: {
          available: boolean
          balance: number
          created_at: string
          currency: string
          id: string
          linked_status: Database["public"]["Enums"]["linked_status"]
          max_auto_topup_amount: number
          name: string
          priority: number
          require_extra_confirm_amount: number
          type: Database["public"]["Enums"]["funding_source_type"]
          user_id: string
        }
        Insert: {
          available?: boolean
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          linked_status?: Database["public"]["Enums"]["linked_status"]
          max_auto_topup_amount?: number
          name: string
          priority?: number
          require_extra_confirm_amount?: number
          type: Database["public"]["Enums"]["funding_source_type"]
          user_id: string
        }
        Update: {
          available?: boolean
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          linked_status?: Database["public"]["Enums"]["linked_status"]
          max_auto_topup_amount?: number
          name?: string
          priority?: number
          require_extra_confirm_amount?: number
          type?: Database["public"]["Enums"]["funding_source_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funding_sources_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      intents: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          metadata: Json
          payee_identifier: string
          payee_name: string
          type: Database["public"]["Enums"]["intent_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          payee_identifier: string
          payee_name: string
          type: Database["public"]["Enums"]["intent_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          payee_identifier?: string
          payee_name?: string
          type?: Database["public"]["Enums"]["intent_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_payloads: {
        Row: {
          amount: number | null
          created_at: string
          id: string
          merchant_name: string | null
          rails_available: Json
          raw_payload: string
          reference_id: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          id?: string
          merchant_name?: string | null
          rails_available?: Json
          raw_payload: string
          reference_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          id?: string
          merchant_name?: string | null
          rails_available?: Json
          raw_payload?: string
          reference_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_payloads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      resolution_plans: {
        Row: {
          chosen_rail: string
          created_at: string
          execution_mode: Database["public"]["Enums"]["execution_mode"]
          fallback_rail: string | null
          id: string
          intent_id: string
          pending_reason: string | null
          reason_codes: Json
          risk_level: Database["public"]["Enums"]["risk_level"]
          steps: Json
          topup_amount: number
          topup_needed: boolean
          user_id: string
        }
        Insert: {
          chosen_rail: string
          created_at?: string
          execution_mode?: Database["public"]["Enums"]["execution_mode"]
          fallback_rail?: string | null
          id?: string
          intent_id: string
          pending_reason?: string | null
          reason_codes?: Json
          risk_level?: Database["public"]["Enums"]["risk_level"]
          steps?: Json
          topup_amount?: number
          topup_needed?: boolean
          user_id: string
        }
        Update: {
          chosen_rail?: string
          created_at?: string
          execution_mode?: Database["public"]["Enums"]["execution_mode"]
          fallback_rail?: string | null
          id?: string
          intent_id?: string
          pending_reason?: string | null
          reason_codes?: Json
          risk_level?: Database["public"]["Enums"]["risk_level"]
          steps?: Json
          topup_amount?: number
          topup_needed?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resolution_plans_intent_id_fkey"
            columns: ["intent_id"]
            isOneToOne: false
            referencedRelation: "intents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resolution_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_logs: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          intent_id: string
          intent_type: string
          merchant_id: string | null
          merchant_name: string | null
          note: string | null
          rail_used: string | null
          recipient_id: string | null
          recipient_name: string | null
          reference: string | null
          status: string
          trigger: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          intent_id: string
          intent_type: string
          merchant_id?: string | null
          merchant_name?: string | null
          note?: string | null
          rail_used?: string | null
          recipient_id?: string | null
          recipient_name?: string | null
          reference?: string | null
          status: string
          trigger: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          intent_id?: string
          intent_type?: string
          merchant_id?: string | null
          merchant_name?: string | null
          note?: string | null
          rail_used?: string | null
          recipient_id?: string | null
          recipient_name?: string | null
          reference?: string | null
          status?: string
          trigger?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          created_at: string
          failure_type: Database["public"]["Enums"]["failure_type"] | null
          id: string
          intent_id: string
          plan_id: string
          receipt: Json
          status: Database["public"]["Enums"]["transaction_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          failure_type?: Database["public"]["Enums"]["failure_type"] | null
          id?: string
          intent_id: string
          plan_id: string
          receipt?: Json
          status?: Database["public"]["Enums"]["transaction_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          failure_type?: Database["public"]["Enums"]["failure_type"] | null
          id?: string
          intent_id?: string
          plan_id?: string
          receipt?: Json
          status?: Database["public"]["Enums"]["transaction_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_intent_id_fkey"
            columns: ["intent_id"]
            isOneToOne: false
            referencedRelation: "intents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "resolution_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      trusted_devices: {
        Row: {
          device_id: string
          id: string
          last_seen_at: string
          trusted: boolean
          user_id: string
        }
        Insert: {
          device_id: string
          id?: string
          last_seen_at?: string
          trusted?: boolean
          user_id: string
        }
        Update: {
          device_id?: string
          id?: string
          last_seen_at?: string
          trusted?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trusted_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          flow_paused: boolean
          id: string
          paused_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          flow_paused?: boolean
          id?: string
          paused_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          flow_paused?: boolean
          id?: string
          paused_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          app_mode: Database["public"]["Enums"]["app_mode"]
          biometric_enabled: boolean
          created_at: string
          device_id: string | null
          id: string
          identity_status: Database["public"]["Enums"]["identity_status"]
          paused: boolean
          phone: string
          session_timeout_minutes: number
          updated_at: string
        }
        Insert: {
          app_mode?: Database["public"]["Enums"]["app_mode"]
          biometric_enabled?: boolean
          created_at?: string
          device_id?: string | null
          id?: string
          identity_status?: Database["public"]["Enums"]["identity_status"]
          paused?: boolean
          phone: string
          session_timeout_minutes?: number
          updated_at?: string
        }
        Update: {
          app_mode?: Database["public"]["Enums"]["app_mode"]
          biometric_enabled?: boolean
          created_at?: string
          device_id?: string | null
          id?: string
          identity_status?: Database["public"]["Enums"]["identity_status"]
          paused?: boolean
          phone?: string
          session_timeout_minutes?: number
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
      app_discovery_type: "wallet" | "bank" | "biller"
      app_mode: "Prototype" | "Pilot" | "Production"
      biller_status: "linked" | "unlinked" | "error"
      connector_name:
        | "TouchNGo"
        | "GrabPay"
        | "Boost"
        | "DuitNow"
        | "BankTransfer"
        | "Maybank"
        | "VisaMastercard"
        | "Maxis"
        | "Unifi"
        | "TNB"
        | "Contacts"
      connector_status: "available" | "unavailable" | "degraded"
      connector_type: "wallet" | "bank" | "card" | "biller" | "contacts"
      consent_status: "active" | "revoked" | "expired"
      default_wallet: "TouchNGo" | "GrabPay" | "None"
      discovery_source: "simulated" | "manual" | "native"
      execution_mode: "sync" | "async"
      failure_type:
        | "insufficient_funds"
        | "connector_unavailable"
        | "user_paused"
        | "risk_blocked"
        | "identity_blocked"
        | "unknown"
      funding_source_type: "wallet" | "bank" | "debit_card" | "credit_card"
      identity_status: "pending" | "active" | "suspended" | "revoked"
      intent_type: "PayMerchant" | "SendMoney" | "RequestMoney" | "PayBill"
      linked_status: "unlinked" | "linked" | "error"
      risk_level: "low" | "medium" | "high"
      transaction_status: "success" | "failed" | "cancelled" | "pending"
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
      app_discovery_type: ["wallet", "bank", "biller"],
      app_mode: ["Prototype", "Pilot", "Production"],
      biller_status: ["linked", "unlinked", "error"],
      connector_name: [
        "TouchNGo",
        "GrabPay",
        "Boost",
        "DuitNow",
        "BankTransfer",
        "Maybank",
        "VisaMastercard",
        "Maxis",
        "Unifi",
        "TNB",
        "Contacts",
      ],
      connector_status: ["available", "unavailable", "degraded"],
      connector_type: ["wallet", "bank", "card", "biller", "contacts"],
      consent_status: ["active", "revoked", "expired"],
      default_wallet: ["TouchNGo", "GrabPay", "None"],
      discovery_source: ["simulated", "manual", "native"],
      execution_mode: ["sync", "async"],
      failure_type: [
        "insufficient_funds",
        "connector_unavailable",
        "user_paused",
        "risk_blocked",
        "identity_blocked",
        "unknown",
      ],
      funding_source_type: ["wallet", "bank", "debit_card", "credit_card"],
      identity_status: ["pending", "active", "suspended", "revoked"],
      intent_type: ["PayMerchant", "SendMoney", "RequestMoney", "PayBill"],
      linked_status: ["unlinked", "linked", "error"],
      risk_level: ["low", "medium", "high"],
      transaction_status: ["success", "failed", "cancelled", "pending"],
    },
  },
} as const
