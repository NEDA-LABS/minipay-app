/**
 * Email Services Index
 * Exports all email service classes and factory functions
 */

import { PrismaClient } from '@prisma/client';
import { EmailService } from '../service';
import { ResendProvider } from '../providers/resend';
import { PaymentNotificationService } from './payment-notification-service';

/**
 * Create Email Service instance with Resend provider
 * @returns Configured EmailService instance
 */
export function createEmailService(): EmailService {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@nedapay.xyz';
  const fromName = process.env.RESEND_FROM_NAME || 'NedaPay';

  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }

  const provider = new ResendProvider({
    apiKey: resendApiKey,
    defaultFrom: {
      email: fromEmail,
      name: fromName,
    },
  });

  return new EmailService({
    provider,
    defaultFromEmail: fromEmail,
    defaultFromName: fromName,
    isDevelopment: process.env.NODE_ENV !== 'production',
  });
}

/**
 * Create Payment Notification Service instance
 * @param prisma Prisma client instance
 * @returns Configured PaymentNotificationService instance
 */
export function createPaymentNotificationService(prisma: PrismaClient): PaymentNotificationService {
  const emailService = createEmailService();
  return new PaymentNotificationService(emailService, prisma);
}

// Export all services
export { PaymentNotificationService } from './payment-notification-service';
export { EmailService } from '../service';
