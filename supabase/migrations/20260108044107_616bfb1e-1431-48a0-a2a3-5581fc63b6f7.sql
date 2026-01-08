
-- FLOW v1.0 Foundation - Step 1: Data Collections
-- ================================================

-- Create enum types
CREATE TYPE public.app_mode AS ENUM ('Prototype', 'Pilot', 'Production');
CREATE TYPE public.identity_status AS ENUM ('pending', 'active', 'suspended', 'revoked');
CREATE TYPE public.funding_source_type AS ENUM ('wallet', 'bank', 'debit_card', 'credit_card');
CREATE TYPE public.linked_status AS ENUM ('unlinked', 'linked', 'error');
CREATE TYPE public.connector_name AS ENUM ('TouchNGo', 'GrabPay', 'Boost', 'DuitNow', 'BankTransfer', 'Maybank', 'VisaMastercard', 'Maxis', 'Unifi', 'TNB', 'Contacts');
CREATE TYPE public.connector_type AS ENUM ('wallet', 'bank', 'card', 'biller', 'contacts');
CREATE TYPE public.connector_status AS ENUM ('available', 'unavailable', 'degraded');
CREATE TYPE public.consent_status AS ENUM ('active', 'revoked', 'expired');
CREATE TYPE public.app_discovery_type AS ENUM ('wallet', 'bank', 'biller');
CREATE TYPE public.discovery_source AS ENUM ('simulated', 'manual', 'native');
CREATE TYPE public.biller_status AS ENUM ('linked', 'unlinked', 'error');
CREATE TYPE public.default_wallet AS ENUM ('TouchNGo', 'GrabPay', 'None');
CREATE TYPE public.intent_type AS ENUM ('PayMerchant', 'SendMoney', 'RequestMoney', 'PayBill');
CREATE TYPE public.execution_mode AS ENUM ('sync', 'async');
CREATE TYPE public.risk_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.transaction_status AS ENUM ('success', 'failed', 'cancelled', 'pending');
CREATE TYPE public.failure_type AS ENUM ('insufficient_funds', 'connector_unavailable', 'user_paused', 'risk_blocked', 'identity_blocked', 'unknown');

-- ========================================
-- 1. Users
-- ========================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  device_id TEXT,
  biometric_enabled BOOLEAN NOT NULL DEFAULT false,
  session_timeout_minutes INTEGER NOT NULL DEFAULT 15,
  app_mode public.app_mode NOT NULL DEFAULT 'Prototype',
  paused BOOLEAN NOT NULL DEFAULT false,
  identity_status public.identity_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own record" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own record" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own record" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ========================================
-- 2. TrustedDevices
-- ========================================
CREATE TABLE public.trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  trusted BOOLEAN NOT NULL DEFAULT false,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trusted devices" ON public.trusted_devices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trusted devices" ON public.trusted_devices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trusted devices" ON public.trusted_devices
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trusted devices" ON public.trusted_devices
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 3. FundingSources
-- ========================================
CREATE TABLE public.funding_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type public.funding_source_type NOT NULL,
  name TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  linked_status public.linked_status NOT NULL DEFAULT 'unlinked',
  available BOOLEAN NOT NULL DEFAULT false,
  balance NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'MYR',
  max_auto_topup_amount NUMERIC NOT NULL DEFAULT 200,
  require_extra_confirm_amount NUMERIC NOT NULL DEFAULT 300,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.funding_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own funding sources" ON public.funding_sources
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own funding sources" ON public.funding_sources
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own funding sources" ON public.funding_sources
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own funding sources" ON public.funding_sources
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 4. Connectors
-- ========================================
CREATE TABLE public.connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name public.connector_name NOT NULL,
  type public.connector_type NOT NULL,
  mode public.app_mode NOT NULL DEFAULT 'Prototype',
  status public.connector_status NOT NULL DEFAULT 'available',
  capabilities JSONB NOT NULL DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  error_code TEXT
);

ALTER TABLE public.connectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own connectors" ON public.connectors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connectors" ON public.connectors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connectors" ON public.connectors
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connectors" ON public.connectors
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 5. Consents
-- ========================================
CREATE TABLE public.consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  connector_id UUID NOT NULL REFERENCES public.connectors(id) ON DELETE CASCADE,
  scope JSONB NOT NULL DEFAULT '[]',
  status public.consent_status NOT NULL DEFAULT 'active',
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consents" ON public.consents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consents" ON public.consents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consents" ON public.consents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own consents" ON public.consents
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 6. DiscoveredApps
-- ========================================
CREATE TABLE public.discovered_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  app_name TEXT NOT NULL,
  app_type public.app_discovery_type NOT NULL,
  discovery_source public.discovery_source NOT NULL DEFAULT 'simulated',
  detected BOOLEAN NOT NULL DEFAULT false,
  confidence NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.discovered_apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own discovered apps" ON public.discovered_apps
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own discovered apps" ON public.discovered_apps
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own discovered apps" ON public.discovered_apps
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own discovered apps" ON public.discovered_apps
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 7. BillerAccounts
-- ========================================
CREATE TABLE public.biller_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  biller_name TEXT NOT NULL,
  account_reference TEXT NOT NULL,
  status public.biller_status NOT NULL DEFAULT 'unlinked',
  last_sync_at TIMESTAMPTZ
);

ALTER TABLE public.biller_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own biller accounts" ON public.biller_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own biller accounts" ON public.biller_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own biller accounts" ON public.biller_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own biller accounts" ON public.biller_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 8. Contacts
-- ========================================
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  supported_wallets JSONB NOT NULL DEFAULT '[]',
  default_wallet public.default_wallet NOT NULL DEFAULT 'None',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contacts" ON public.contacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contacts" ON public.contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts" ON public.contacts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts" ON public.contacts
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 9. QrPayloads
-- ========================================
CREATE TABLE public.qr_payloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  raw_payload TEXT NOT NULL,
  merchant_name TEXT,
  amount NUMERIC,
  reference_id TEXT,
  rails_available JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.qr_payloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own QR payloads" ON public.qr_payloads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own QR payloads" ON public.qr_payloads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own QR payloads" ON public.qr_payloads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own QR payloads" ON public.qr_payloads
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 10. Intents
-- ========================================
CREATE TABLE public.intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type public.intent_type NOT NULL,
  payee_name TEXT NOT NULL,
  payee_identifier TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'MYR',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own intents" ON public.intents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own intents" ON public.intents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own intents" ON public.intents
  FOR UPDATE USING (auth.uid() = user_id);

-- Intents should not be deleted (audit trail)
CREATE POLICY "Intents cannot be deleted" ON public.intents
  FOR DELETE USING (false);

-- ========================================
-- 11. ResolutionPlans
-- ========================================
CREATE TABLE public.resolution_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  intent_id UUID NOT NULL REFERENCES public.intents(id) ON DELETE CASCADE,
  chosen_rail TEXT NOT NULL,
  fallback_rail TEXT,
  topup_needed BOOLEAN NOT NULL DEFAULT false,
  topup_amount NUMERIC NOT NULL DEFAULT 0,
  execution_mode public.execution_mode NOT NULL DEFAULT 'sync',
  pending_reason TEXT,
  steps JSONB NOT NULL DEFAULT '[]',
  reason_codes JSONB NOT NULL DEFAULT '[]',
  risk_level public.risk_level NOT NULL DEFAULT 'low',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.resolution_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own resolution plans" ON public.resolution_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own resolution plans" ON public.resolution_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resolution plans" ON public.resolution_plans
  FOR UPDATE USING (auth.uid() = user_id);

-- Resolution plans should not be deleted (audit trail)
CREATE POLICY "Resolution plans cannot be deleted" ON public.resolution_plans
  FOR DELETE USING (false);

-- ========================================
-- 12. Transactions
-- ========================================
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  intent_id UUID NOT NULL REFERENCES public.intents(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.resolution_plans(id) ON DELETE CASCADE,
  status public.transaction_status NOT NULL DEFAULT 'pending',
  failure_type public.failure_type,
  receipt JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- Transactions should not be deleted (audit trail)
CREATE POLICY "Transactions cannot be deleted" ON public.transactions
  FOR DELETE USING (false);

-- ========================================
-- 13. ExecutionLogs
-- ========================================
CREATE TABLE public.execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  intent_snapshot JSONB NOT NULL DEFAULT '{}',
  plan_snapshot JSONB NOT NULL DEFAULT '{}',
  connector_calls JSONB NOT NULL DEFAULT '[]',
  outcome JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.execution_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own execution logs" ON public.execution_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own execution logs" ON public.execution_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Execution logs are immutable
CREATE POLICY "Execution logs cannot be updated" ON public.execution_logs
  FOR UPDATE USING (false);

CREATE POLICY "Execution logs cannot be deleted" ON public.execution_logs
  FOR DELETE USING (false);

-- ========================================
-- Trigger for updated_at on Users
-- ========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
