/**
 * FLOW Connection Module
 * 
 * Centralized exports for the Connection Intelligence Engine
 */

export {
  ConnectionEngine,
  createConnectionEngine,
  APP_CATALOG,
  getAppByName,
  getAppsByCategory,
  getPopularApps,
  type AppDefinition,
  type ConnectionStatus,
  type ConnectionResult,
  type SyncResult,
} from './connection-engine';
