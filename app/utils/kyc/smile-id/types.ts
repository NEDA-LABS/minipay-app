/**
 * Smile ID KYC Integration Types
 * Based on the NEDA aggregator implementation and Smile ID documentation
 */

export interface SmileIDConfig {
  partnerId: string;
  apiKey: string;
  baseUrl: string;
  webhookSecret?: string;
}

export interface SmileIDVerificationRequest {
  walletAddress: string;
  signature: string;
  nonce: string;
  country?: string;
  idType?: string;
}

export interface SmileIDVerificationResponse {
  verificationUrl: string;
  referenceId: string;
  expiresAt: Date;
}

export interface SmileIDVerificationStatus {
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';
  verificationUrl?: string;
  resultCode?: string;
  resultText?: string;
  completedAt?: Date;
}

export interface SmileIDWebhookPayload {
  ResultCode: string;
  ResultText?: string;
  PartnerParams: {
    user_id: string;
    job_id?: string;
  };
  signature: string;
  timestamp: string;
  // Additional fields from Smile ID webhook
  [key: string]: any;
}

export interface SmileIDCountry {
  name: string;
  code: string;
  idTypes: SmileIDType[];
}

export interface SmileIDType {
  type: string;
  verificationMethod: 'doc_verification' | 'biometric_kyc';
}

export interface SmileIDSupportedTypesResponse {
  countries: SmileIDCountry[];
}

export interface SmileIDLinkRequest {
  partner_id: string;
  signature: string;
  timestamp: string;
  name: string;
  company_name: string;
  id_types: Array<{
    country: string;
    id_type: string;
    verification_method: string;
  }>;
  callback_url: string;
  data_privacy_policy_url: string;
  logo_url: string;
  is_single_use: boolean;
  user_id: string;
  expires_at: string;
}

export interface SmileIDLinkResponse {
  link: string;
  ref_id: string;
}

// Result codes from Smile ID documentation
export const SMILE_ID_SUCCESS_CODES = [
  '0810', // Document Verified
  '1020', // Exact Match (Basic KYC and Enhanced KYC)
  '1012', // Valid ID / ID Number Validated (Enhanced KYC)
  '0820', // Authenticate User Machine Judgement - PASS
  '0840', // Enroll User PASS - Machine Judgement
] as const;

export const SMILE_ID_FAILED_CODES = [
  '0811', // No Face Match
  '0812', // Filed Security Features Check
  '0813', // Document Not Verified - Machine Judgement
  '1022', // No Match
  '1023', // No Found
  '1011', // Invalid ID / ID Number Invalid
  '1013', // ID Number Not Found
  '1014', // Unsupported ID Type
  '0821', // Images did not match
  '0911', // No Face Found
  '0912', // Face Not Matching
  '0921', // Face Not Found
  '0922', // Selfie Quality Too Poor
  '0841', // Enroll User FAIL
  '0941', // Face Not Found
  '0942', // Face Poor Quality
] as const;

export type SmileIDSuccessCode = typeof SMILE_ID_SUCCESS_CODES[number];
export type SmileIDFailedCode = typeof SMILE_ID_FAILED_CODES[number];

// Error types
export class SmileIDError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'SmileIDError';
  }
}

export class SmileIDSignatureError extends SmileIDError {
  constructor(message: string = 'Invalid signature') {
    super(message, 'INVALID_SIGNATURE');
    this.name = 'SmileIDSignatureError';
  }
}

export class SmileIDProviderError extends SmileIDError {
  constructor(message: string, public originalError?: Error) {
    super(message, 'PROVIDER_ERROR');
    this.name = 'SmileIDProviderError';
  }
}

export class SmileIDWebhookError extends SmileIDError {
  constructor(message: string) {
    super(message, 'WEBHOOK_ERROR');
    this.name = 'SmileIDWebhookError';
  }
}
