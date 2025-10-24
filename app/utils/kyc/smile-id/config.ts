/**
 * Smile ID Configuration Management
 */

import { SmileIDConfig } from './types';

export function getSmileIDConfig(): SmileIDConfig {
  const partnerId = process.env.SMILE_ID_PARTNER_ID;
  const apiKey = process.env.SMILE_ID_API_KEY;
  const baseUrl = process.env.SMILE_ID_BASE_URL || 'https://api.smileidentity.com';
  const webhookSecret = process.env.SMILE_ID_WEBHOOK_SECRET;

  if (!partnerId || !apiKey) {
    throw new Error('Missing required Smile ID configuration. Please set SMILE_ID_PARTNER_ID and SMILE_ID_API_KEY environment variables.');
  }

  return {
    partnerId,
    apiKey,
    baseUrl,
    webhookSecret,
  };
}

export const SMILE_ID_CONSTANTS = {
  // URLs
  SANDBOX_BASE_URL: 'https://testapi.smileidentity.com',
  PRODUCTION_BASE_URL: 'https://api.smileidentity.com',
  
  // Endpoints
  SMILE_LINKS_ENDPOINT: '/v1/smile_links',
  
  // Timeouts
  DEFAULT_TIMEOUT: 30000, // 30 seconds
  
  // Verification settings
  VERIFICATION_EXPIRY_HOURS: 1,
  URL_EXPIRY_MINUTES: 15,
  
  // Company details for Smile Links
  COMPANY_NAME: 'NedaPay',
  VERIFICATION_NAME: 'NedaPay KYC Verification',
  DATA_PRIVACY_POLICY_URL: 'https://nedapay.com/privacy-policy',
  LOGO_URL: 'https://nedapay.com/logo.png', // Update with actual logo URL
  
  // Signature settings
  SIGNATURE_ALGORITHM: 'sha256',
  SIGNATURE_TYPE: 'sid_request',
} as const;

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function getWebhookUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
  if (!baseUrl) {
    throw new Error('Missing NEXT_PUBLIC_APP_URL or VERCEL_URL environment variable for webhook URL');
  }
  
  const url = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
  return `${url}/api/kyc/smile-id/webhook`;
}
