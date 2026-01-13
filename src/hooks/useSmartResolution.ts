/**
 * useSmartResolution Hook
 * 
 * Provides smart payment rail recommendations for UI components.
 * Uses the smart resolver to score and rank available payment methods.
 */

import { useState, useCallback } from 'react';
import { 
  smartResolve, 
  getResolutionSummary,
  type SmartResolutionResult,
  type ScoredRail,
} from '@/lib/orchestration/smart-resolver';

interface UseSmartResolutionOptions {
  userId: string | null;
}

interface UseSmartResolutionReturn {
  isLoading: boolean;
  result: SmartResolutionResult | null;
  recommendedRail: ScoredRail | null;
  alternatives: ScoredRail[];
  summary: string;
  getRecommendation: (params: {
    amount: number;
    intentType: 'PayMerchant' | 'SendMoney' | 'RequestMoney' | 'PayBill';
    merchantRails?: string[];
    recipientWallets?: string[];
    recipientPreferredWallet?: string;
  }) => Promise<SmartResolutionResult | null>;
  clearRecommendation: () => void;
}

export function useSmartResolution({ userId }: UseSmartResolutionOptions): UseSmartResolutionReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SmartResolutionResult | null>(null);

  const getRecommendation = useCallback(async (params: {
    amount: number;
    intentType: 'PayMerchant' | 'SendMoney' | 'RequestMoney' | 'PayBill';
    merchantRails?: string[];
    recipientWallets?: string[];
    recipientPreferredWallet?: string;
  }) => {
    if (!userId) return null;

    setIsLoading(true);
    try {
      const resolution = await smartResolve({
        userId,
        ...params,
      });
      setResult(resolution);
      return resolution;
    } catch (error) {
      console.error('Smart resolution error:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const clearRecommendation = useCallback(() => {
    setResult(null);
  }, []);

  return {
    isLoading,
    result,
    recommendedRail: result?.recommendedRail || null,
    alternatives: result?.alternatives || [],
    summary: result ? getResolutionSummary(result) : '',
    getRecommendation,
    clearRecommendation,
  };
}

/**
 * Format score for display (0-100 → percentage or grade)
 */
export function formatScore(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 50) return 'Fair';
  if (score >= 25) return 'Low';
  return 'Poor';
}

/**
 * Get score breakdown for debugging/display
 */
export function getScoreBreakdown(rail: ScoredRail): string[] {
  const { scores } = rail;
  const breakdown: string[] = [];

  if (scores.compatibility === 100) {
    breakdown.push('✓ Compatible');
  } else if (scores.compatibility > 0) {
    breakdown.push(`⚠ Partial compatibility (${scores.compatibility}%)`);
  }

  if (scores.balance === 100) {
    breakdown.push('✓ Sufficient balance');
  } else if (scores.balance > 0) {
    breakdown.push('⚠ Needs top-up');
  } else {
    breakdown.push('✗ Insufficient funds');
  }

  if (scores.priority <= 2) {
    breakdown.push('★ Preferred method');
  }

  if (scores.history >= 50) {
    breakdown.push('↻ Frequently used');
  }

  if (scores.health === 100) {
    breakdown.push('● Available');
  } else if (scores.health >= 50) {
    breakdown.push('◐ Degraded');
  }

  return breakdown;
}
