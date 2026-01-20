-- ============================================
-- AUTO SYNC DATA MODEL MIGRATION
-- ============================================

-- 1. Create auth_method enum for connectors
CREATE TYPE public.auth_method AS ENUM ('oauth', 'open_banking', 'deep_link');

-- 2. Create balance_confidence enum
CREATE TYPE public.balance_confidence AS ENUM ('high', 'medium', 'low');

-- 3. Add auth_method column to connectors table
ALTER TABLE public.connectors 
ADD COLUMN auth_method public.auth_method DEFAULT 'oauth';

-- 4. Add last_verified_at column to connectors (for health tracking)
ALTER TABLE public.connectors 
ADD COLUMN last_verified_at TIMESTAMP WITH TIME ZONE;

-- 5. Create cached_balances table for balance caching with confidence
CREATE TABLE public.cached_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connector_id UUID NOT NULL REFERENCES public.connectors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'MYR',
  confidence_level public.balance_confidence NOT NULL DEFAULT 'medium',
  source TEXT, -- Where balance was fetched from (api, statement, manual)
  last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE, -- When this cached value becomes stale
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Add revocable column to consents table (for permissions)
ALTER TABLE public.consents 
ADD COLUMN revocable BOOLEAN NOT NULL DEFAULT true;

-- 7. Add description column to consents for permission clarity
ALTER TABLE public.consents 
ADD COLUMN description TEXT;

-- 8. Create connector_health table for tracking health over time
CREATE TABLE public.connector_health (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connector_id UUID NOT NULL REFERENCES public.connectors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  check_type TEXT NOT NULL, -- 'auth', 'balance', 'transaction'
  status TEXT NOT NULL DEFAULT 'healthy', -- 'healthy', 'degraded', 'unhealthy'
  latency_ms INTEGER,
  error_message TEXT,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 9. Enable RLS on new tables
ALTER TABLE public.cached_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connector_health ENABLE ROW LEVEL SECURITY;

-- 10. RLS policies for cached_balances
CREATE POLICY "Users can view their own cached balances"
ON public.cached_balances
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cached balances"
ON public.cached_balances
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cached balances"
ON public.cached_balances
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cached balances"
ON public.cached_balances
FOR DELETE
USING (auth.uid() = user_id);

-- 11. RLS policies for connector_health
CREATE POLICY "Users can view their own connector health"
ON public.connector_health
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connector health"
ON public.connector_health
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Health logs should not be updated or deleted (audit trail)
CREATE POLICY "Connector health cannot be updated"
ON public.connector_health
FOR UPDATE
USING (false);

CREATE POLICY "Connector health cannot be deleted"
ON public.connector_health
FOR DELETE
USING (false);

-- 12. Create index for efficient balance lookups
CREATE INDEX idx_cached_balances_connector ON public.cached_balances(connector_id);
CREATE INDEX idx_cached_balances_user ON public.cached_balances(user_id);
CREATE INDEX idx_cached_balances_confidence ON public.cached_balances(confidence_level);

-- 13. Create index for health tracking
CREATE INDEX idx_connector_health_connector ON public.connector_health(connector_id);
CREATE INDEX idx_connector_health_user ON public.connector_health(user_id);
CREATE INDEX idx_connector_health_checked_at ON public.connector_health(checked_at DESC);

-- 14. Create function to update connector's last_verified_at when health check passes
CREATE OR REPLACE FUNCTION public.update_connector_verified_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'healthy' THEN
    UPDATE public.connectors 
    SET last_verified_at = NEW.checked_at 
    WHERE id = NEW.connector_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 15. Create trigger to auto-update last_verified_at
CREATE TRIGGER on_health_check_update_connector
AFTER INSERT ON public.connector_health
FOR EACH ROW
EXECUTE FUNCTION public.update_connector_verified_at();