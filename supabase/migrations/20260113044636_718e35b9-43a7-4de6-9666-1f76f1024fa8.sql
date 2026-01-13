-- Add virtual card credentials to flow_card_profiles
ALTER TABLE public.flow_card_profiles
ADD COLUMN card_number TEXT,
ADD COLUMN card_cvv TEXT,
ADD COLUMN card_expiry TEXT,
ADD COLUMN card_last_four TEXT,
ADD COLUMN card_brand TEXT DEFAULT 'visa';

-- Add comment for clarity
COMMENT ON COLUMN public.flow_card_profiles.card_number IS 'Full 16-digit virtual card number (prototype only - production would use tokenization)';
COMMENT ON COLUMN public.flow_card_profiles.card_cvv IS '3-digit CVV code';
COMMENT ON COLUMN public.flow_card_profiles.card_expiry IS 'Expiry in MM/YY format';
COMMENT ON COLUMN public.flow_card_profiles.card_last_four IS 'Last 4 digits for masked display';
COMMENT ON COLUMN public.flow_card_profiles.card_brand IS 'Card brand: visa or mastercard';