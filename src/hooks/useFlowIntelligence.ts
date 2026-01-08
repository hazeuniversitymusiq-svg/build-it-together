/**
 * FLOW Intelligence Hook
 * 
 * Quiet AI that provides smart insights without being intrusive.
 * Works like Apple/Tesla - silently helpful.
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PaymentAnalysis {
  riskScore: number;
  riskFactors: string[];
  recommendation: string | null;
  suggestedSource: string;
  isAnomalous: boolean;
}

interface Insight {
  type: 'spending_pattern' | 'prediction' | 'recommendation' | 'achievement';
  title: string;
  description: string;
  confidence?: number;
  actionable?: boolean;
}

interface FundingRecommendation {
  recommended: string;
  reason: string;
  needsTopup: boolean;
  topupAmount: number;
}

export function useFlowIntelligence() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Analyze a payment before confirmation
  const analyzePayment = useCallback(async (
    amount: number,
    payeeName: string,
    payeeIdentifier: string,
    intentType: string
  ): Promise<PaymentAnalysis | null> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('flow-intelligence', {
        body: {
          action: 'analyze_payment',
          context: { amount, payeeName, payeeIdentifier, intentType },
        },
      });

      if (fnError) throw fnError;
      return data as PaymentAnalysis;
    } catch (err) {
      console.error('Payment analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Generate proactive insights
  const generateInsights = useCallback(async (): Promise<Insight[]> => {
    setIsGeneratingInsights(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('flow-intelligence', {
        body: { action: 'generate_insights' },
      });

      if (fnError) throw fnError;
      return data?.insights || [];
    } catch (err) {
      console.error('Insights generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
      return [];
    } finally {
      setIsGeneratingInsights(false);
    }
  }, []);

  // Get smart funding recommendation
  const getFundingRecommendation = useCallback(async (
    amount: number
  ): Promise<FundingRecommendation | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('flow-intelligence', {
        body: {
          action: 'smart_funding_recommendation',
          context: { amount },
        },
      });

      if (fnError) throw fnError;
      return data as FundingRecommendation;
    } catch (err) {
      console.error('Funding recommendation error:', err);
      return null;
    }
  }, []);

  // Fetch stored insights from database
  const fetchStoredInsights = useCallback(async (): Promise<Insight[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('dismissed', false)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      return (data || []).map(row => ({
        type: row.insight_type as Insight['type'],
        title: row.title,
        description: row.description,
        confidence: row.confidence,
        actionable: (row.metadata as { actionable?: boolean })?.actionable,
      }));
    } catch (err) {
      console.error('Fetch insights error:', err);
      return [];
    }
  }, []);

  // Dismiss an insight
  const dismissInsight = useCallback(async (insightId: string) => {
    try {
      await supabase
        .from('ai_insights')
        .update({ dismissed: true, dismissed_at: new Date().toISOString() })
        .eq('id', insightId);
    } catch (err) {
      console.error('Dismiss insight error:', err);
    }
  }, []);

  return {
    isAnalyzing,
    isGeneratingInsights,
    error,
    analyzePayment,
    generateInsights,
    getFundingRecommendation,
    fetchStoredInsights,
    dismissInsight,
  };
}
