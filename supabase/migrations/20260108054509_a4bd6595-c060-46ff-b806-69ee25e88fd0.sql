-- Create enum for payment surface types
CREATE TYPE public.payment_surface_type AS ENUM ('camera', 'share_sheet', 'identity_card');

-- Create PaymentSurfaces table
CREATE TABLE public.payment_surfaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  surface_type public.payment_surface_type NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique surface per user
  UNIQUE(user_id, surface_type)
);

-- Enable Row Level Security
ALTER TABLE public.payment_surfaces ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own payment surfaces"
ON public.payment_surfaces
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment surfaces"
ON public.payment_surfaces
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment surfaces"
ON public.payment_surfaces
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment surfaces"
ON public.payment_surfaces
FOR DELETE
USING (auth.uid() = user_id);