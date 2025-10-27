/**
 * KYC Reminder Email Template
 * Reminds users to complete their KYC verification
 */

import { BaseEmailTemplate } from './base';
import { KYCReminderEmailData, EmailTemplateType } from '../types';

export class KYCReminderEmailTemplate extends BaseEmailTemplate<KYCReminderEmailData> {
  getType(): EmailTemplateType {
    return EmailTemplateType.KYC_REMINDER;
  }

  protected getSubject(data: KYCReminderEmailData): string {
    return `Complete Your KYC Verification - NedaPay`;
  }

  protected generateHtml(data: KYCReminderEmailData): string {
    const urgencyMessage = this.getUrgencyMessage(data.daysRemaining);

    const content = `
      <div class="header">
        <h1>📋 KYC Verification Required</h1>
        <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px;">
          Complete your verification to unlock all features
        </p>
      </div>

      <div class="content">
        <!-- Greeting -->
        <div style="margin-bottom: 32px;">
          <h2 style="color: #1f2937; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">
            Hi ${data.firstName},
          </h2>
          <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0;">
            We noticed that you haven't completed your KYC (Know Your Customer) verification yet. 
            Completing this process will unlock the full potential of your NedaPay merchant account.
          </p>
        </div>

        ${urgencyMessage}

        <!-- Benefits of KYC -->
        <div style="margin-bottom: 32px;">
          <h3 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 20px 0;">
            🎯 What You'll Unlock
          </h3>
          <ul style="color: #6b7280; font-size: 16px; line-height: 1.8; margin: 0; padding-left: 24px;">
            <li><strong>Higher Transaction Limits:</strong> Process larger payments without restrictions</li>
            <li><strong>Off-Ramp to Fiat:</strong> Convert crypto to local currency via IDRX</li>
            <li><strong>Advanced Features:</strong> Access payment links, invoicing, and more</li>
            <li><strong>Faster Settlements:</strong> Priority processing for verified merchants</li>
            <li><strong>Enhanced Security:</strong> Better protection for you and your customers</li>
          </ul>
        </div>

        <!-- KYC Process -->
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #667eea;">
          <h3 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">
            ⚡ Quick & Easy Process
          </h3>
          <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 12px 0;">
            The verification process takes just a few minutes:
          </p>
          <ol style="color: #6b7280; font-size: 16px; line-height: 1.8; margin: 0; padding-left: 24px;">
            <li>Click the button below to start verification</li>
            <li>Upload a valid government-issued ID</li>
            <li>Take a quick selfie for identity confirmation</li>
            <li>Wait for approval (usually within 24-48 hours)</li>
          </ol>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin-bottom: 32px;">
          <p style="color: #6b7280; font-size: 16px; margin: 0 0 20px 0;">
            <strong>Ready to verify your account?</strong>
          </p>
          <a href="${data.kycUrl}" class="button">
            Start KYC Verification
          </a>
        </div>

        <!-- Security Note -->
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
          <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
            <strong>🔒 Your Privacy Matters:</strong> All your personal information is encrypted and stored securely. 
            We comply with international data protection regulations and will never share your data without your consent.
          </p>
        </div>

        <!-- Footer Message -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; text-align: center;">
          <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
            Have questions about the KYC process? Our support team is here to help!
          </p>
          <p style="color: #9ca3af; font-size: 14px; margin: 0;">
            Contact us at support@nedapay.com
          </p>
        </div>
      </div>
    `;

    return this.wrapWithLayout(content);
  }

  private getUrgencyMessage(daysRemaining?: number): string {
    if (!daysRemaining) {
      return '';
    }

    let bgColor = '#fef3c7';
    let borderColor = '#f59e0b';
    let textColor = '#92400e';
    let urgencyText = '';

    if (daysRemaining <= 3) {
      bgColor = '#fee2e2';
      borderColor = '#dc2626';
      textColor = '#7f1d1d';
      urgencyText = `⚠️ <strong>Urgent:</strong> You have only ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining to complete your KYC verification. Please act now to avoid account restrictions.`;
    } else if (daysRemaining <= 7) {
      urgencyText = `⏰ <strong>Reminder:</strong> You have ${daysRemaining} days remaining to complete your KYC verification.`;
    } else {
      urgencyText = `📅 You have ${daysRemaining} days to complete your KYC verification.`;
    }

    return `
      <div style="background-color: ${bgColor}; border-left: 4px solid ${borderColor}; padding: 16px; border-radius: 4px; margin-bottom: 32px;">
        <p style="color: ${textColor}; font-size: 14px; margin: 0; line-height: 1.6;">
          ${urgencyText}
        </p>
      </div>
    `;
  }
}
