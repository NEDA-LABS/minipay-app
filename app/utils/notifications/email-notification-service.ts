/**
 * Email Notification Service
 * Handles email sending with database tracking
 * Follows Single Responsibility and Dependency Inversion principles
 */

import { PrismaClient, EmailNotificationType, EmailNotificationStatus } from '@prisma/client';
import {
  sendInvoiceEmail,
  sendWelcomeEmail,
  EmailProviderResponse,
} from '@/utils/email';

export interface SendEmailNotificationOptions {
  userId?: string;
  recipientEmail: string;
  recipientName?: string;
  type: EmailNotificationType;
  subject: string;
  metadata?: Record<string, any>;
}

export interface EmailNotificationResult {
  success: boolean;
  notificationId: string;
  messageId?: string;
  error?: string;
}

/**
 * Email Notification Service
 * Manages email sending with database tracking and retry logic
 */
export class EmailNotificationService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Send email notification with database tracking
   */
  async sendNotification(
    options: SendEmailNotificationOptions
  ): Promise<EmailNotificationResult> {
    // Create email notification record
    const notification = await this.prisma.emailNotification.create({
      data: {
        userId: options.userId,
        recipientEmail: options.recipientEmail,
        recipientName: options.recipientName,
        type: options.type,
        subject: options.subject,
        status: EmailNotificationStatus.PENDING,
        metadata: options.metadata || {},
      },
    });

    try {
      // Send email based on type
      const emailResult = await this.sendEmailByType(options);

      if (emailResult.success) {
        // Update notification as sent
        await this.prisma.emailNotification.update({
          where: { id: notification.id },
          data: {
            status: EmailNotificationStatus.SENT,
            providerMessageId: emailResult.messageId,
            providerResponse: emailResult.data || {},
            sentAt: new Date(),
          },
        });

        return {
          success: true,
          notificationId: notification.id,
          messageId: emailResult.messageId,
        };
      } else {
        // Update notification as failed
        await this.prisma.emailNotification.update({
          where: { id: notification.id },
          data: {
            status: EmailNotificationStatus.FAILED,
            errorMessage: emailResult.error?.message || 'Unknown error',
            failedAt: new Date(),
          },
        });

        return {
          success: false,
          notificationId: notification.id,
          error: emailResult.error?.message || 'Failed to send email',
        };
      }
    } catch (error) {
      // Update notification as failed
      await this.prisma.emailNotification.update({
        where: { id: notification.id },
        data: {
          status: EmailNotificationStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          failedAt: new Date(),
        },
      });

      return {
        success: false,
        notificationId: notification.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send email based on notification type
   * @private
   */
  private async sendEmailByType(
    options: SendEmailNotificationOptions
  ): Promise<EmailProviderResponse> {
    const metadata = options.metadata || {};

    switch (options.type) {
      case EmailNotificationType.WELCOME:
        return await sendWelcomeEmail({
          recipientEmail: options.recipientEmail,
          firstName: options.recipientName || 'User',
          walletAddress: metadata.walletAddress || '',
          dashboardUrl: metadata.dashboardUrl,
        });

      case EmailNotificationType.INVOICE_SENT:
        return await sendInvoiceEmail({
          recipientEmail: options.recipientEmail,
          recipient: options.recipientName || 'Customer',
          sender: metadata.sender || 'Merchant',
          invoiceId: metadata.invoiceId || '',
          merchantId: metadata.merchantId || '',
          paymentCollection: metadata.paymentCollection || 'Crypto',
          dueDate: new Date(metadata.dueDate),
          currency: metadata.currency || 'USDC',
          lineItems: metadata.lineItems || [],
          totalAmount: metadata.totalAmount || 0,
          paymentLink: metadata.paymentLink,
        });

      default:
        throw new Error(`Unsupported email notification type: ${options.type}`);
    }
  }

  /**
   * Retry failed email notification
   */
  async retryFailedNotification(notificationId: string): Promise<EmailNotificationResult> {
    const notification = await this.prisma.emailNotification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return {
        success: false,
        notificationId,
        error: 'Notification not found',
      };
    }

    if (notification.status !== EmailNotificationStatus.FAILED) {
      return {
        success: false,
        notificationId,
        error: 'Notification is not in failed state',
      };
    }

    if (notification.retryCount >= notification.maxRetries) {
      return {
        success: false,
        notificationId,
        error: 'Max retries exceeded',
      };
    }

    // Update retry count
    await this.prisma.emailNotification.update({
      where: { id: notificationId },
      data: {
        retryCount: notification.retryCount + 1,
        status: EmailNotificationStatus.PENDING,
      },
    });

    // Retry sending
    return await this.sendNotification({
      userId: notification.userId || undefined,
      recipientEmail: notification.recipientEmail,
      recipientName: notification.recipientName || undefined,
      type: notification.type,
      subject: notification.subject,
      metadata: (notification.metadata as Record<string, any>) || {},
    });
  }

  /**
   * Get notification history for a user
   */
  async getNotificationHistory(
    userId: string,
    options?: {
      type?: EmailNotificationType;
      status?: EmailNotificationStatus;
      limit?: number;
    }
  ) {
    return await this.prisma.emailNotification.findMany({
      where: {
        userId,
        ...(options?.type && { type: options.type }),
        ...(options?.status && { status: options.status }),
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
    });
  }
}
