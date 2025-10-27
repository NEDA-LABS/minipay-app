/**
 * Email Service Configuration
 * Centralized configuration for email services
 */

import { EmailValidationError } from './types';

export interface EmailConfig {
  resendApiKey: string;
  defaultFromEmail: string;
  defaultFromName: string;
  invoiceFromEmail?: string;
  kycFromEmail?: string;
  isDevelopment: boolean;
}

/**
 * Get email configuration from environment variables
 * @throws {EmailValidationError} if required config is missing
 */
export function getEmailConfig(): EmailConfig {
  const resendApiKey = process.env.RESEND_API_KEY;
  const defaultFromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@nedapay.com';
  const defaultFromName = process.env.RESEND_FROM_NAME || 'NedaPay';
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Validate required configuration
  if (!resendApiKey) {
    throw new EmailValidationError(
      'RESEND_API_KEY is not set in environment variables'
    );
  }

  return {
    resendApiKey,
    defaultFromEmail,
    defaultFromName,
    invoiceFromEmail: process.env.RESEND_INVOICE_EMAIL || defaultFromEmail,
    kycFromEmail: process.env.RESEND_KYC_EMAIL || defaultFromEmail,
    isDevelopment,
  };
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Build email address object
 */
export function buildEmailAddress(
  email: string,
  name?: string
): { email: string; name?: string } {
  if (!isValidEmail(email)) {
    throw new EmailValidationError(`Invalid email address: ${email}`);
  }

  return {
    email: sanitizeEmail(email),
    ...(name && { name }),
  };
}
