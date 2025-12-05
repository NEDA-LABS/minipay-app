/**
 * Email Service Module
 * Main entry point for email service
 * Exports service instance and helper functions
 */

import { EmailService } from './service';
import { ResendProvider } from './providers/resend';
import { getEmailConfig } from './config';
import {
  EmailTemplateType,
  InvoiceEmailData,
  WelcomeEmailData,
  EmailProviderResponse,
} from './types';

// Singleton instance of email service
let emailServiceInstance: EmailService | null = null;

/**
 * Get or create email service instance (Singleton pattern)
 * @returns EmailService instance
 */
export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    const config = getEmailConfig();

    // Create Resend provider
    const resendProvider = new ResendProvider({
      apiKey: config.resendApiKey,
      defaultFrom: {
        email: config.defaultFromEmail,
        name: config.defaultFromName,
      },
    });

    // Create email service
    emailServiceInstance = new EmailService({
      provider: resendProvider,
      defaultFromEmail: config.defaultFromEmail,
      defaultFromName: config.defaultFromName,
      isDevelopment: config.isDevelopment,
    });

    console.log('[Email] ✅ Email service initialized successfully');
  }

  return emailServiceInstance;
}

/**
 * Reset email service instance (mainly for testing)
 */
export function resetEmailService(): void {
  emailServiceInstance = null;
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Send an invoice email
 */
export async function sendInvoiceEmail(
  data: InvoiceEmailData
): Promise<EmailProviderResponse> {
  const service = getEmailService();
  return service.sendEmail({
    templateType: EmailTemplateType.INVOICE,
    data,
  });
}

/**
 * Send a welcome email
 */
export async function sendWelcomeEmail(
  data: WelcomeEmailData
): Promise<EmailProviderResponse> {
  const service = getEmailService();
  return service.sendEmail({
    templateType: EmailTemplateType.WELCOME,
    data,
  });
}

// ============================================================================
// Re-export types and utilities
// ============================================================================

export * from './types';
export { EmailService } from './service';
export { getEmailConfig } from './config';
export { EmailTemplateFactory } from './templates/factory';
