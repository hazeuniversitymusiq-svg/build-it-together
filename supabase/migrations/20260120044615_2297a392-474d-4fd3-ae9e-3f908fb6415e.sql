-- 1. Add unique constraint on cached_balances.connector_id for proper upsert
CREATE UNIQUE INDEX IF NOT EXISTS cached_balances_connector_unique 
ON public.cached_balances (connector_id);

-- 2. Add expires_at index for efficient stale balance queries
CREATE INDEX IF NOT EXISTS idx_cached_balances_expires 
ON public.cached_balances (expires_at) 
WHERE expires_at IS NOT NULL;

-- 3. Add last_health_check timestamp to connectors for scheduler tracking
ALTER TABLE public.connectors 
ADD COLUMN IF NOT EXISTS last_health_check_at TIMESTAMP WITH TIME ZONE;

-- 4. Create index for health scheduler queries
CREATE INDEX IF NOT EXISTS idx_connectors_health_check 
ON public.connectors (last_health_check_at) 
WHERE status = 'available';