-- Add 'bnpl' to connector_type enum
ALTER TYPE public.connector_type ADD VALUE IF NOT EXISTS 'bnpl';

-- Add BNPL apps to connector_name enum
ALTER TYPE public.connector_name ADD VALUE IF NOT EXISTS 'Atome';
ALTER TYPE public.connector_name ADD VALUE IF NOT EXISTS 'SPayLater';

-- Add 'bnpl' to funding_source_type enum
ALTER TYPE public.funding_source_type ADD VALUE IF NOT EXISTS 'bnpl';