/**
 * FLOW Protocol - Index Export
 * 
 * All the "secret sauce" components and hooks for the FLOW Protocol.
 */

// Layer 1: Balance Sync (AI-powered screenshot extraction)
export { useScreenshotBalance } from '@/hooks/useScreenshotBalance';
export type { BalanceExtraction } from '@/hooks/useScreenshotBalance';
export { ScreenshotBalanceSync } from '@/components/balance/ScreenshotBalanceSync';

// Layer 2: Handoff + Confirmation
export { usePaymentHandoff } from '@/hooks/usePaymentHandoff';
export type { HandoffState, HandoffContext } from '@/hooks/usePaymentHandoff';
export { PaymentConfirmation } from '@/components/handoff/PaymentConfirmation';
