-- Add fallback_preference column to user_settings table
-- Options: 'use_card' (prefer default card), 'top_up_wallet' (always top up), 'ask_each_time' (prompt user)
ALTER TABLE public.user_settings 
ADD COLUMN fallback_preference text NOT NULL DEFAULT 'use_card' 
CHECK (fallback_preference IN ('use_card', 'top_up_wallet', 'ask_each_time'));