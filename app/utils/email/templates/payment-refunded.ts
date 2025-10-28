/**
 * Payment Refunded Email Template
 * Notifies users when their payment order has been refunded
 */

import { BaseEmailTemplate } from './base';
import { PaymentRefundedEmailData, EmailTemplateType, EmailAddress } from '../types';
import { buildEmailAddress } from '../config';

export class PaymentRefundedEmailTemplate extends BaseEmailTemplate<PaymentRefundedEmailData> {
  getType(): EmailTemplateType {
    return EmailTemplateType.PAYMENT_REFUNDED;
  }

  protected getRecipients(data: PaymentRefundedEmailData): EmailAddress[] {
    return [buildEmailAddress(data.recipientEmail, data.firstName)];
  }

  protected getSubject(data: PaymentRefundedEmailData): string {
    return `🔄 Payment Refunded - ${data.amount} ${data.currency}`;
  }

  protected generateHtml(data: PaymentRefundedEmailData): string {
    const logoUrl = 'https://nedapay.xyz/NEDApayLogo.png';
    const dashboardUrl = data.dashboardUrl || 'https://nedapay.xyz/dashboard';
    
    const content = `
      <div class="header">
        <h1>Payment Refunded</h1>
        <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px;">Your funds have been returned</p>
      </div>

      <div class="content">
        <!-- Greeting -->
        <div style="margin-bottom: 32px;">
          <h2 style="color: #1f2937; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">
            Hi ${this.escapeHtml(data.firstName)},
          </h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0;">
            Your payment order has been refunded and the funds have been returned to your wallet.
          </p>
        </div>

        <!-- Refund Badge -->
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 12px; padding: 24px; margin-bottom: 32px; text-align: center;">
          <div style="background: rgba(255, 255, 255, 0.2); border-radius: 50%; width: 64px; height: 64px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 32px;">🔄</span>
          </div>
          <h3 style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">
            Refund Processed
          </h3>
          <p style="color: rgba(255, 255, 255, 0.9); font-size: 14px; margin: 0;">
            Processed on ${this.formatDate(data.refundedAt)}
          </p>
        </div>

        <!-- Transaction Details -->
        <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
          <h3 style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 20px 0;">
            Refund Details
          </h3>
          
          <div style="margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="color: #6b7280; font-size: 14px;">Transaction ID</span>
              <span style="color: #1f2937; font-size: 14px; font-weight: 500; font-family: 'Courier New', monospace;">${this.escapeHtml(data.transactionId)}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="color: #6b7280; font-size: 14px;">Refunded Amount</span>
              <span style="color: #1f2937; font-size: 16px; font-weight: 600;">${this.escapeHtml(data.amount)} ${this.escapeHtml(data.currency)}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="color: #6b7280; font-size: 14px;">Account Name</span>
              <span style="color: #1f2937; font-size: 14px; font-weight: 500;">${this.escapeHtml(data.accountName)}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; padding: 12px 0;">
              <span style="color: #6b7280; font-size: 14px;">Account Number</span>
              <span style="color: #1f2937; font-size: 14px; font-weight: 500; font-family: 'Courier New', monospace;">${this.escapeHtml(data.accountNumber)}</span>
            </div>
          </div>
        </div>

        ${data.refundReason ? `
        <!-- Refund Reason -->
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 32px;">
          <h4 style="color: #92400e; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">
            Refund Reason
          </h4>
          <p style="color: #92400e; font-size: 14px; line-height: 1.6; margin: 0;">
            ${this.escapeHtml(data.refundReason)}
          </p>
        </div>
        ` : ''}

        <!-- Next Steps -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 12px; padding: 24px; margin-bottom: 32px;">
          <h3 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">
            What Happens Next?
          </h3>
          <ul style="color: rgba(255, 255, 255, 0.95); font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li>The funds have been returned to your wallet</li>
            <li>You can initiate a new withdrawal if needed</li>
            <li>Check your dashboard for updated balance</li>
          </ul>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${dashboardUrl}" class="button" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            View Dashboard
          </a>
        </div>

        <!-- Support Info -->
        <div style="background: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 16px; margin-bottom: 32px;">
          <p style="color: #1e40af; font-size: 14px; line-height: 1.6; margin: 0;">
            <strong>Need Help?</strong><br>
            If you have questions about this refund or need assistance with a new withdrawal, please contact our support team.
          </p>
        </div>

        <!-- Footer Note -->
        <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0;">
            This is an automated notification from NedaPay. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    return this.wrapInLayout(content, logoUrl);
  }

  private wrapInLayout(content: string, logoUrl: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Refunded</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f3f4f6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          .header {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            padding: 40px 32px;
            text-align: center;
          }
          .header h1 {
            color: #ffffff;
            font-size: 28px;
            font-weight: 700;
            margin: 0;
          }
          .content {
            padding: 40px 32px;
          }
          .button {
            transition: transform 0.2s;
          }
          .button:hover {
            transform: translateY(-2px);
          }
          @media only screen and (max-width: 600px) {
            .content {
              padding: 24px 20px;
            }
            .header {
              padding: 32px 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div style="text-align: center; padding: 24px 0;">
            <img src="${logoUrl}" alt="NedaPay Logo" style="height: 40px; width: auto;">
          </div>
          ${content}
        </div>
      </body>
      </html>
    `;
  }
}
