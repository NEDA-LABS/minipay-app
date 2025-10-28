/**
 * Payment Notification Email Service
 * Handles sending payment-related email notifications
 * Follows Single Responsibility Principle
 */

import { PrismaClient, EmailNotificationType, EmailNotificationStatus } from '@prisma/client';
import { EmailService } from '../service';
import {
  EmailTemplateType,
  PaymentSettledEmailData,
  PaymentRefundedEmailData,
  EmailProviderResponse,
} from '../types';

/**
 * Payment Notification Service
 * Responsible for sending payment settlement and refund notifications
 */
export class PaymentNotificationService {
  private emailService: EmailService;
  private prisma: PrismaClient;

  constructor(emailService: EmailService, prisma: PrismaClient) {
    this.emailService = emailService;
    this.prisma = prisma;
  }

  /**
   * Send payment settled notification
   * @param transactionId The Paycrest transaction ID
   * @param walletAddress The user's wallet address
   * @param amount The settled amount
   * @param currency The currency code
   * @param accountName Recipient account name
   * @param accountNumber Recipient account number
   * @param institution Bank institution code
   * @param rate Exchange rate
   * @returns Email provider response
   */
  async sendPaymentSettledEmail(params: {
    transactionId: string;
    walletAddress: string;
    amount: string;
    currency: string;
    accountName: string;
    accountNumber: string;
    institution: string;
    rate: string;
  }): Promise<EmailProviderResponse> {
    try {
      // Find user by wallet address
      const user = await this.prisma.user.findUnique({
        where: { wallet: params.walletAddress },
      });

      // Check if user exists and has email
      if (!user) {
        console.warn(`[PaymentNotificationService] User not found for wallet: ${params.walletAddress}`);
        return {
          success: false,
          error: new Error('User not found'),
        };
      }

      if (!user.email) {
        console.warn(`[PaymentNotificationService] User ${user.id} has no email address`);
        return {
          success: false,
          error: new Error('User has no email address'),
        };
      }

      // Prepare email data
      const emailData: PaymentSettledEmailData = {
        recipientEmail: user.email,
        firstName: user.name || 'Valued Customer',
        transactionId: params.transactionId,
        amount: params.amount,
        currency: params.currency,
        accountName: params.accountName,
        accountNumber: params.accountNumber,
        institution: params.institution,
        rate: params.rate,
        settledAt: new Date(),
        dashboardUrl: 'https://nedapay.xyz/dashboard',
      };

      // Send email
      const result = await this.emailService.sendEmail({
        templateType: EmailTemplateType.PAYMENT_SETTLED,
        data: emailData,
      });

      // Track email notification in database
      if (result.success) {
        await this.trackEmailNotification({
          userId: user.id,
          type: EmailNotificationType.PAYMENT_SETTLED,
          recipient: user.email,
          subject: `✅ Payment Settled - ${params.amount} ${params.currency}`,
          status: EmailNotificationStatus.SENT,
          providerMessageId: result.messageId,
          metadata: {
            transactionId: params.transactionId,
            amount: params.amount,
            currency: params.currency,
          },
        });
      }

      return result;
    } catch (error) {
      console.error('[PaymentNotificationService] Error sending payment settled email:', error);
      return {
        success: false,
        error: error as Error,
      };
    }
  }

  /**
   * Send payment refunded notification
   * @param transactionId The Paycrest transaction ID
   * @param walletAddress The user's wallet address
   * @param amount The refunded amount
   * @param currency The currency code
   * @param accountName Recipient account name
   * @param accountNumber Recipient account number
   * @param refundReason Optional reason for refund
   * @returns Email provider response
   */
  async sendPaymentRefundedEmail(params: {
    transactionId: string;
    walletAddress: string;
    amount: string;
    currency: string;
    accountName: string;
    accountNumber: string;
    refundReason?: string;
  }): Promise<EmailProviderResponse> {
    try {
      // Find user by wallet address
      const user = await this.prisma.user.findUnique({
        where: { wallet: params.walletAddress },
      });

      // Check if user exists and has email
      if (!user) {
        console.warn(`[PaymentNotificationService] User not found for wallet: ${params.walletAddress}`);
        return {
          success: false,
          error: new Error('User not found'),
        };
      }

      if (!user.email) {
        console.warn(`[PaymentNotificationService] User ${user.id} has no email address`);
        return {
          success: false,
          error: new Error('User has no email address'),
        };
      }

      // Prepare email data
      const emailData: PaymentRefundedEmailData = {
        recipientEmail: user.email,
        firstName: user.name || 'Valued Customer',
        transactionId: params.transactionId,
        amount: params.amount,
        currency: params.currency,
        accountName: params.accountName,
        accountNumber: params.accountNumber,
        refundReason: params.refundReason,
        refundedAt: new Date(),
        dashboardUrl: 'https://nedapay.xyz/dashboard',
      };

      // Send email
      const result = await this.emailService.sendEmail({
        templateType: EmailTemplateType.PAYMENT_REFUNDED,
        data: emailData,
      });

      // Track email notification in database
      if (result.success) {
        await this.trackEmailNotification({
          userId: user.id,
          type: EmailNotificationType.PAYMENT_REFUNDED,
          recipient: user.email,
          subject: `🔄 Payment Refunded - ${params.amount} ${params.currency}`,
          status: EmailNotificationStatus.SENT,
          providerMessageId: result.messageId,
          metadata: {
            transactionId: params.transactionId,
            amount: params.amount,
            currency: params.currency,
            refundReason: params.refundReason,
          },
        });
      }

      return result;
    } catch (error) {
      console.error('[PaymentNotificationService] Error sending payment refunded email:', error);
      return {
        success: false,
        error: error as Error,
      };
    }
  }

  /**
   * Track email notification in database
   * @private
   */
  private async trackEmailNotification(params: {
    userId: string;
    type: EmailNotificationType;
    recipient: string;
    subject: string;
    status: EmailNotificationStatus;
    providerMessageId?: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await this.prisma.emailNotification.create({
        data: {
          userId: params.userId,
          type: params.type,
          recipientEmail: params.recipient,
          subject: params.subject,
          status: params.status,
          providerMessageId: params.providerMessageId,
          metadata: params.metadata,
          sentAt: new Date(),
        },
      });
    } catch (error) {
      console.error('[PaymentNotificationService] Failed to track email notification:', error);
      // Don't throw - tracking failure shouldn't break email sending
    }
  }
}
