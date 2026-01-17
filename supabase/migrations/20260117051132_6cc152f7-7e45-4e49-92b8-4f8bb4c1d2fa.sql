-- Add explicit INSERT deny policy to ai_insights table
-- This ensures only edge functions (service role) can insert insights, not users directly
CREATE POLICY "Users cannot insert insights directly" 
ON public.ai_insights 
FOR INSERT 
TO authenticated
WITH CHECK (false);