-- Make transaction_logs immutable (no updates or deletes allowed)
-- This ensures financial audit trail integrity

-- Explicitly deny UPDATE on transaction_logs
CREATE POLICY "Transaction logs cannot be updated"
ON public.transaction_logs
FOR UPDATE
USING (false);

-- Explicitly deny DELETE on transaction_logs
CREATE POLICY "Transaction logs cannot be deleted"
ON public.transaction_logs
FOR DELETE
USING (false);

-- Allow users to delete their own settings (controlled)
CREATE POLICY "Users can delete their own settings"
ON public.user_settings
FOR DELETE
USING (auth.uid() = user_id);