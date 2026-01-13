/**
 * FLOW Orchestration Engine
 * 
 * The brain of FLOW - rules-based payment resolution.
 * No ML. Pure deterministic logic.
 */

// Types - re-exported from centralized location
export type {
  FundingRailType,
  FundingSource,
  PaymentRequest,
  ResolutionAction,
  ResolutionStep,
  PaymentResolution,
  GuardrailConfig,
  UserPaymentState,
  FallbackPreference,
} from '@/types';

// Guardrails
export {
  DEFAULT_GUARDRAILS,
  checkGuardrails,
  canAutoTopUp,
  getOrResetDailyState,
  recordAutoApprovedPayment,
} from './guardrails';

// Resolver
export {
  resolvePayment,
  explainResolution,
} from './resolver';

// Smart Resolver
export {
  smartResolve,
  getResolutionSummary,
} from './smart-resolver';

export type {
  RailCandidate,
  ScoredRail,
  SmartResolutionContext,
  SmartResolutionResult,
} from './smart-resolver';
