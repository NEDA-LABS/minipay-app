/**
 * Smile ID KYC Integration
 * Main export file for Smile ID services
 */

export * from './types';
export * from './config';
export * from './signature';
export * from './service';
export * from './webhook-handler';

// Re-export main classes for convenience
export { SmileIDService } from './service';
export { SmileIDWebhookHandler, createSmileIDWebhookHandler } from './webhook-handler';
