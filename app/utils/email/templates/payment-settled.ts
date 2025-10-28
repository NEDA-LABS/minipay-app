/**
 * Payment Settlement Email Template
 * Notifies users when their payment order has been successfully settled
 */

import { BaseEmailTemplate } from './base';
import { PaymentSettledEmailData, EmailTemplateType, EmailAddress } from '../types';
import { buildEmailAddress } from '../config';

export class PaymentSettledEmailTemplate extends BaseEmailTemplate<PaymentSettledEmailData> {
  getType(): EmailTemplateType {
    return EmailTemplateType.PAYMENT_SETTLED;
  }

  protected getRecipients(data: PaymentSettledEmailData): EmailAddress[] {
    return [buildEmailAddress(data.recipientEmail, data.firstName)];
  }

  protected getSubject(data: PaymentSettledEmailData): string {
    return `✅ Payment Settled - ${data.amount} ${data.currency}`;
  }

  protected generateHtml(data: PaymentSettledEmailData): string {
    const logoUrl = 'https://nedapay.xyz/NEDApayLogo.png';
    const dashboardUrl = data.dashboardUrl || 'https://nedapay.xyz/dashboard';
    
    const content = `
      <div class="header">
        <h1>Payment Settled Successfully</h1>
        <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px;">Your withdrawal has been completed</p>
      </div>

      <div class="content">
        <!-- Greeting -->
        <div style="margin-bottom: 32px;">
          <h2 style="color: #1f2937; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">
            Hi ${this.escapeHtml(data.firstName)},
          </h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0;">
            Great news! Your payment order has been successfully settled and the funds have been sent to your bank account.
          </p>
        </div>

        <!-- Success Badge -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 24px; margin-bottom: 32px; text-align: center;">
          <div style="background: rgba(255, 255, 255, 0.2); border-radius: 50%; width: 64px; height: 64px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 32px;">✓</span>
          </div>
          <h3 style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">
            Settlement Complete
          </h3>
          <p style="color: rgba(255, 255, 255, 0.9); font-size: 14px; margin: 0;">
            Processed on ${this.formatDate(data.settledAt)}
          </p>
        </div>

        <!-- Transaction Details -->
        <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
          <h3 style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0 0 20px 0;">
            Transaction Details
          </h3>
          
          <div style="margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="color: #6b7280; font-size: 14px;">Transaction ID</span>
              <span style="color: #1f2937; font-size: 14px; font-weight: 500; font-family: 'Courier New', monospace;">${this.escapeHtml(data.transactionId)}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="color: #6b7280; font-size: 14px;">Amount</span>
              <span style="color: #1f2937; font-size: 16px; font-weight: 600;">${this.escapeHtml(data.amount)} ${this.escapeHtml(data.currency)}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="color: #6b7280; font-size: 14px;">Exchange Rate</span>
              <span style="color: #1f2937; font-size: 14px; font-weight: 500;">${this.escapeHtml(data.rate)}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="color: #6b7280; font-size: 14px;">Account Name</span>
              <span style="color: #1f2937; font-size: 14px; font-weight: 500;">${this.escapeHtml(data.accountName)}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="color: #6b7280; font-size: 14px;">Account Number</span>
              <span style="color: #1f2937; font-size: 14px; font-weight: 500; font-family: 'Courier New', monospace;">${this.escapeHtml(data.accountNumber)}</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; padding: 12px 0;">
              <span style="color: #6b7280; font-size: 14px;">Bank</span>
              <span style="color: #1f2937; font-size: 14px; font-weight: 500;">${this.escapeHtml(data.institution)}</span>
            </div>
          </div>
        </div>

        <!-- Next Steps -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 12px; padding: 24px; margin-bottom: 32px;">
          <h3 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">
            What's Next?
          </h3>
          <ul style="color: rgba(255, 255, 255, 0.95); font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li>The funds should reflect in your bank account within a few minutes</li>
            <li>You can view this transaction in your dashboard</li>
            <li>Keep this email for your records</li>
          </ul>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${dashboardUrl}" class="button" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            View Dashboard
          </a>
        </div>

        <!-- Support Info -->
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 32px;">
          <p style="color: #92400e; font-size: 14px; line-height: 1.6; margin: 0;">
            <strong>Need Help?</strong><br>
            If you have any questions about this transaction, please contact our support team or check your dashboard for more details.
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
        <title>Payment Settled</title>
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
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
