-- Add unique constraints to enable upsert operations for the Connection Engine

-- Unique constraint on connectors (user_id, name)
CREATE UNIQUE INDEX IF NOT EXISTS connectors_user_id_name_unique ON public.connectors (user_id, name);

-- Unique constraint on funding_sources (user_id, name)
CREATE UNIQUE INDEX IF NOT EXISTS funding_sources_user_id_name_unique ON public.funding_sources (user_id, name);

-- Unique constraint on biller_accounts (user_id, biller_name)
CREATE UNIQUE INDEX IF NOT EXISTS biller_accounts_user_id_biller_name_unique ON public.biller_accounts (user_id, biller_name);