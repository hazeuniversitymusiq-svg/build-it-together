-- ============================================
-- FLOW CARD MVP - Lean Schema
-- ============================================

-- Flow Card Profiles (core identity)
CREATE TABLE public.flow_card_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'not_created' CHECK (status IN ('not_created', 'created', 'suspended', 'terminated')),
  mode TEXT NOT NULL DEFAULT 'in_app' CHECK (mode IN ('in_app', 'network_placeholder', 'network_live')),
  device_binding_status TEXT NOT NULL DEFAULT 'unbound' CHECK (device_binding_status IN ('unbound', 'bound', 'rotated')),
  last_device_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Card Payment Events (audit trail)
CREATE TABLE public.card_payment_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('simulate_authorisation', 'simulate_settlement', 'online_checkout', 'terminal_tap')),
  event_status TEXT NOT NULL DEFAULT 'received' CHECK (event_status IN ('received', 'evaluating', 'approved', 'declined')),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'MYR',
  merchant_name TEXT,
  merchant_category TEXT,
  device_id TEXT,
  intent_id UUID,
  decision_json JSONB NOT NULL DEFAULT '{}',
  result_json JSONB NOT NULL DEFAULT '{}',
  explainability_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Card Provisioning (stubs for Apple/Google Pay)
CREATE TABLE public.card_provisioning (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  apple_status TEXT NOT NULL DEFAULT 'not_available' CHECK (apple_status IN ('not_available', 'ready', 'pending', 'verified', 'provisioned', 'failed')),
  google_status TEXT NOT NULL DEFAULT 'not_available' CHECK (google_status IN ('not_available', 'ready', 'pending', 'verified', 'provisioned', 'failed')),
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Feature Flags (simple key-value per user)
CREATE TABLE public.feature_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  flag_name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, flag_name)
);

-- Enable RLS on all tables
ALTER TABLE public.flow_card_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_provisioning ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- RLS Policies: flow_card_profiles
CREATE POLICY "Users can view their own flow card profile" 
ON public.flow_card_profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own flow card profile" 
ON public.flow_card_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flow card profile" 
ON public.flow_card_profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies: card_payment_events
CREATE POLICY "Users can view their own card payment events" 
ON public.card_payment_events FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own card payment events" 
ON public.card_payment_events FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own card payment events" 
ON public.card_payment_events FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies: card_provisioning
CREATE POLICY "Users can view their own card provisioning" 
ON public.card_provisioning FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own card provisioning" 
ON public.card_provisioning FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own card provisioning" 
ON public.card_provisioning FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies: feature_flags
CREATE POLICY "Users can view their own feature flags" 
ON public.feature_flags FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feature flags" 
ON public.feature_flags FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feature flags" 
ON public.feature_flags FOR UPDATE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_card_payment_events_user_id ON public.card_payment_events(user_id);
CREATE INDEX idx_card_payment_events_created_at ON public.card_payment_events(created_at DESC);
CREATE INDEX idx_feature_flags_user_flag ON public.feature_flags(user_id, flag_name);