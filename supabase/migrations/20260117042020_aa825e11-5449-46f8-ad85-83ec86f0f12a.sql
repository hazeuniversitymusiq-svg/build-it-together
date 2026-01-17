-- Add tier column to flow_card_profiles
ALTER TABLE public.flow_card_profiles 
ADD COLUMN tier TEXT NOT NULL DEFAULT 'lite' CHECK (tier IN ('lite', 'full'));

-- Add comment explaining tiers
COMMENT ON COLUMN public.flow_card_profiles.tier IS 'lite = wallet only (no auto top-up), full = wallet + bank (auto top-up enabled)';