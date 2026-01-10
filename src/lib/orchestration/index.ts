/**
 * FLOW Orchestration Engine
 * 
 * The brain of FLOW - rules-based payment resolution.
 * No ML. Pure deterministic logic.
 */

// Types
export type {
  FundingRailType,
  FundingSource,
  PaymentRequest,
  ResolutionAction,
  ResolutionStep,
  PaymentResolution,
  GuardrailConfig,
  UserPaymentState,
} from './types';

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

export type { FallbackPreference } from './resolver';
