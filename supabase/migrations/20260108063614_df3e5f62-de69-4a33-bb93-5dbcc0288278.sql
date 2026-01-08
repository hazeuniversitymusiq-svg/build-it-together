-- =============================================
-- FLOW Grade A Fintech Infrastructure
-- Immutable Audit Logging + Rate Limiting + Risk Scoring
-- =============================================

-- 1. Immutable Audit Log Table (append-only with hash chain)
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  device_id TEXT,
  action TEXT NOT NULL, -- 'intent.created', 'plan.resolved', 'payment.executed', 'auth.login', etc.
  entity_type TEXT NOT NULL, -- 'intent', 'plan', 'transaction', 'user', etc.
  entity_id UUID,
  payload JSONB NOT NULL DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  risk_score INTEGER DEFAULT 0, -- 0-100 risk score
  previous_hash TEXT, -- Hash of previous audit log for chain integrity
  current_hash TEXT NOT NULL -- SHA-256 hash of this record
);

-- Make audit_logs append-only (no updates or deletes)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only allow inserts, no updates or deletes
CREATE POLICY "Audit logs are insert-only by authenticated users"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Rate Limiting Table
CREATE TABLE public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'intent.create', 'payment.execute', 'auth.attempt'
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  request_count INTEGER NOT NULL DEFAULT 1,
  UNIQUE(user_id, action_type, window_start)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own rate limits"
  ON public.rate_limits
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Transaction Signatures Table (HMAC verification chain)
CREATE TABLE public.transaction_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  intent_id UUID REFERENCES public.intents(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.resolution_plans(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  signature_type TEXT NOT NULL, -- 'intent', 'plan', 'execution'
  payload_hash TEXT NOT NULL, -- SHA-256 of the payload
  signature TEXT NOT NULL, -- HMAC-SHA256 signature
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.transaction_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own signatures"
  ON public.transaction_signatures
  FOR SELECT
  TO authenticated
  USING (
    intent_id IN (SELECT id FROM public.intents WHERE user_id = auth.uid()) OR
    plan_id IN (SELECT id FROM public.resolution_plans WHERE user_id = auth.uid()) OR
    transaction_id IN (SELECT id FROM public.transactions WHERE user_id = auth.uid())
  );

-- 4. AI Insights Table (quiet intelligence)
CREATE TABLE public.ai_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  insight_type TEXT NOT NULL, -- 'spending_pattern', 'anomaly', 'prediction', 'recommendation'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence REAL DEFAULT 0.5, -- 0.0 to 1.0
  metadata JSONB DEFAULT '{}',
  dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own insights"
  ON public.ai_insights
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can dismiss their own insights"
  ON public.ai_insights
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Risk Events Table (fraud detection)
CREATE TABLE public.risk_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL, -- 'velocity_exceeded', 'unusual_amount', 'new_device', 'unusual_location', 'unusual_recipient'
  severity TEXT NOT NULL DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  intent_id UUID REFERENCES public.intents(id) ON DELETE SET NULL,
  details JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT
);

ALTER TABLE public.risk_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own risk events"
  ON public.risk_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 6. Function to compute hash chain for audit logs
CREATE OR REPLACE FUNCTION public.compute_audit_hash()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prev_hash TEXT;
  hash_input TEXT;
BEGIN
  -- Get the previous hash
  SELECT current_hash INTO prev_hash
  FROM public.audit_logs
  WHERE user_id = NEW.user_id
  ORDER BY created_at DESC
  LIMIT 1;

  NEW.previous_hash := COALESCE(prev_hash, 'GENESIS');
  
  -- Compute current hash (SHA-256 of concatenated fields)
  hash_input := COALESCE(NEW.previous_hash, '') || 
                NEW.action || 
                NEW.entity_type || 
                COALESCE(NEW.entity_id::TEXT, '') || 
                NEW.payload::TEXT ||
                NEW.created_at::TEXT;
  
  NEW.current_hash := encode(sha256(hash_input::bytea), 'hex');
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-compute hash on insert
CREATE TRIGGER audit_log_hash_trigger
  BEFORE INSERT ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_audit_hash();

-- 7. Index for performance
CREATE INDEX idx_audit_logs_user_action ON public.audit_logs(user_id, action, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_rate_limits_lookup ON public.rate_limits(user_id, action_type, window_start);
CREATE INDEX idx_ai_insights_user_active ON public.ai_insights(user_id, dismissed, expires_at);
CREATE INDEX idx_risk_events_user_severity ON public.risk_events(user_id, severity, resolved);