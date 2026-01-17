/**
 * Flow Card Eligibility Hook
 * 
 * Checks user eligibility for Flow Card activation and determines tier.
 * - Lite tier: Wallet only (manual top-up)
 * - Full tier: Wallet + Bank linked (auto top-up enabled)
 */

import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFundingSources } from '@/hooks/useFundingSources';

export type FlowCardTier = 'lite' | 'full';

export interface EligibilityCriteria {
  id: string;
  label: string;
  description: string;
  met: boolean;
  required: boolean; // true = blocks activation, false = blocks full tier
}

export interface EligibilityResult {
  canActivate: boolean;
  tier: FlowCardTier;
  criteria: EligibilityCriteria[];
  missingForActivation: EligibilityCriteria[];
  missingForFullTier: EligibilityCriteria[];
  walletBalance: number;
  hasBankLinked: boolean;
  hasWalletLinked: boolean;
}

const MINIMUM_WALLET_BALANCE = 5; // RM 5 minimum

export function useFlowCardEligibility(): EligibilityResult & { loading: boolean } {
  const { user } = useAuth();
  const { sources, walletBalance, loading } = useFundingSources();

  const result = useMemo((): EligibilityResult => {
    // Check linked sources
    const linkedSources = sources.filter(s => s.isLinked && s.isAvailable);
    const hasWalletLinked = linkedSources.some(s => s.type === 'wallet');
    const hasBankLinked = linkedSources.some(s => s.type === 'bank');
    const hasAnyFundingSource = linkedSources.length > 0;

    // Build criteria list
    const criteria: EligibilityCriteria[] = [
      {
        id: 'identity_verified',
        label: 'Identity Verified',
        description: 'Complete identity verification',
        met: !!user, // In prototype, having a user = verified
        required: true,
      },
      {
        id: 'funding_source_linked',
        label: 'Funding Source Linked',
        description: 'Link at least one wallet or bank',
        met: hasAnyFundingSource,
        required: true,
      },
      {
        id: 'minimum_balance',
        label: `Minimum Balance (RM ${MINIMUM_WALLET_BALANCE})`,
        description: 'Maintain minimum wallet balance',
        met: walletBalance >= MINIMUM_WALLET_BALANCE,
        required: true,
      },
      {
        id: 'wallet_linked',
        label: 'Wallet Linked',
        description: 'Link an e-wallet for payments',
        met: hasWalletLinked,
        required: true,
      },
      {
        id: 'bank_linked',
        label: 'Bank Account Linked',
        description: 'Link a bank for auto top-up',
        met: hasBankLinked,
        required: false, // Only required for full tier
      },
    ];

    // Calculate eligibility
    const missingForActivation = criteria.filter(c => c.required && !c.met);
    const missingForFullTier = criteria.filter(c => !c.required && !c.met);
    const canActivate = missingForActivation.length === 0;
    const tier: FlowCardTier = canActivate && hasBankLinked ? 'full' : 'lite';

    return {
      canActivate,
      tier,
      criteria,
      missingForActivation,
      missingForFullTier,
      walletBalance,
      hasBankLinked,
      hasWalletLinked,
    };
  }, [user, sources, walletBalance]);

  return { ...result, loading };
}
