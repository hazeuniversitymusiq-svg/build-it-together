/**
 * FLOW Protocol - Index Export
 * 
 * All the "secret sauce" components and hooks for the FLOW Protocol.
 */

// Layer 1: Discovery
export { useAppDiscovery } from '@/hooks/useAppDiscovery';
export type { DiscoveredApp } from '@/hooks/useAppDiscovery';

// Layer 2: Balance Sync
export { useScreenshotBalance } from '@/hooks/useScreenshotBalance';
export type { BalanceExtraction } from '@/hooks/useScreenshotBalance';
export { ScreenshotBalanceSync } from '@/components/balance/ScreenshotBalanceSync';

// Layers 4 & 5: Handoff + Confirmation
export { usePaymentHandoff } from '@/hooks/usePaymentHandoff';
export type { HandoffState, HandoffContext } from '@/hooks/usePaymentHandoff';
export { PaymentConfirmation } from '@/components/handoff/PaymentConfirmation';
