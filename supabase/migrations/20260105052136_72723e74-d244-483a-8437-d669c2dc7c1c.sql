-- Transaction logs table for audit trail
CREATE TABLE public.transaction_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  intent_id TEXT NOT NULL,
  intent_type TEXT NOT NULL,
  trigger TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  recipient_name TEXT,
  recipient_id TEXT,
  merchant_name TEXT,
  merchant_id TEXT,
  rail_used TEXT,
  status TEXT NOT NULL,
  note TEXT,
  reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transaction_logs ENABLE ROW LEVEL SECURITY;

-- Users can only view their own logs
CREATE POLICY "Users can view their own transaction logs"
ON public.transaction_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own logs
CREATE POLICY "Users can insert their own transaction logs"
ON public.transaction_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- User settings table for kill switch and preferences
CREATE TABLE public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  flow_paused BOOLEAN NOT NULL DEFAULT false,
  paused_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Users can view their own settings
CREATE POLICY "Users can view their own settings"
ON public.user_settings
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own settings
CREATE POLICY "Users can insert their own settings"
ON public.user_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update their own settings"
ON public.user_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for faster user lookups
CREATE INDEX idx_transaction_logs_user_id ON public.transaction_logs(user_id);
CREATE INDEX idx_transaction_logs_created_at ON public.transaction_logs(created_at DESC);