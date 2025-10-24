/**
 * Smile ID Signature Generation and Validation
 * Based on HMAC-SHA256 implementation from the aggregator service
 */

import { createHmac } from 'crypto';
import { SmileIDConfig, SmileIDSignatureError } from './types';
import { SMILE_ID_CONSTANTS } from './config';

/**
 * Generate HMAC-SHA256 signature for Smile ID requests
 * @param timestamp - ISO timestamp string
 * @param config - Smile ID configuration
 * @returns Base64 encoded signature
 */
export function generateSmileIDSignature(timestamp: string, config: SmileIDConfig): string {
  try {
    const hmac = createHmac(SMILE_ID_CONSTANTS.SIGNATURE_ALGORITHM, config.apiKey);
    
    // Order matters: timestamp + partner_id + signature_type
    hmac.update(timestamp);
    hmac.update(config.partnerId);
    hmac.update(SMILE_ID_CONSTANTS.SIGNATURE_TYPE);
    
    return hmac.digest('base64');
  } catch (error) {
    throw new SmileIDSignatureError(`Failed to generate signature: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verify webhook signature from Smile ID
 * @param payload - Webhook payload with signature and timestamp
 * @param config - Smile ID configuration
 * @returns True if signature is valid
 */
export function verifyWebhookSignature(
  payload: { signature: string; timestamp: string },
  config: SmileIDConfig
): boolean {
  try {
    if (!config.webhookSecret) {
      console.warn('No webhook secret configured, skipping signature verification');
      return true; // Allow if no secret is configured (for development)
    }

    const expectedSignature = generateSmileIDSignature(payload.timestamp, config);
    return payload.signature === expectedSignature;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}

/**
 * Generate timestamp in the format expected by Smile ID
 * @returns ISO timestamp string with nanosecond precision
 */
export function generateTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Validate timestamp to prevent replay attacks
 * @param timestamp - Timestamp to validate
 * @param maxAgeMinutes - Maximum age in minutes (default: 5)
 * @returns True if timestamp is valid
 */
export function validateTimestamp(timestamp: string, maxAgeMinutes: number = 5): boolean {
  try {
    const timestampDate = new Date(timestamp);
    const now = new Date();
    const ageMinutes = (now.getTime() - timestampDate.getTime()) / (1000 * 60);
    
    return ageMinutes <= maxAgeMinutes && ageMinutes >= 0;
  } catch (error) {
    return false;
  }
}
