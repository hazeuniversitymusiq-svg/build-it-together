/**
 * FLOW Core System
 * 
 * Central export for all core system rules and functions.
 * Phase 1: Foundation Only
 */

// Gates
export {
  checkIdentityGate,
  checkDeviceTrustGate,
  checkConsentGate,
  checkIntentCreationGates,
  checkResolutionGates,
  type GateResult,
} from './gates';

// Intent Creators
export {
  createIntentFromQR,
  createIntentSendMoney,
  createIntentPayBill,
  createIntentRequestMoney,
  type IntentInput,
  type IntentResult,
} from './intent-creators';

// Resolve Engine
export {
  resolveIntent,
  explainPlan,
} from './resolve-engine';

// Re-export types from centralized location
export type {
  ResolutionStep,
  ResolutionPlan,
  ResolveResult,
} from '@/types';

// Execute Plan
export {
  executePlan,
  cancelTransaction,
  type ExecutionResult,
} from './execute-plan';

// Security Service
export {
  checkRateLimit,
  recordRateLimitAction,
  signTransaction,
  verifyTransactionSignature,
  createAuditLog,
  prePaymentSecurityCheck,
  postPaymentAuditLog,
  type RateLimitResult,
  type TransactionSignature,
  type AuditLogResult,
} from './security-service';
