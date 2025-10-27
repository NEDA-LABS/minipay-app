/**
 * KYC Status Email Template
 * Notifies users about their KYC verification status
 */

import { BaseEmailTemplate } from './base';
import { KYCStatusEmailData, EmailTemplateType, KYCStatus } from '../types';

export class KYCStatusEmailTemplate extends BaseEmailTemplate<KYCStatusEmailData> {
  getType(): EmailTemplateType {
    return EmailTemplateType.KYC_STATUS;
  }

  protected getSubject(data: KYCStatusEmailData): string {
    switch (data.status) {
      case KYCStatus.APPROVED:
        return '✅ KYC Verification Approved - NedaPay';
      case KYCStatus.REJECTED:
        return '❌ KYC Verification Update - NedaPay';
      case KYCStatus.PENDING_REVIEW:
        return '⏳ KYC Verification Under Review - NedaPay';
      case KYCStatus.REQUIRES_ADDITIONAL_INFO:
        return '📋 Additional Information Required - NedaPay';
      default:
        return 'KYC Verification Status Update - NedaPay';
    }
  }

  protected generateHtml(data: KYCStatusEmailData): string {
    const statusContent = this.generateStatusContent(data);

    const content = `
      <div class="header">
        ${this.getHeaderContent(data.status)}
      </div>

      <div class="content">
        <!-- Greeting -->
        <div style="margin-bottom: 32px;">
          <h2 style="color: #1f2937; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">
            Hi ${data.firstName},
          </h2>
          ${statusContent}
        </div>
      </div>
    `;

    return this.wrapWithLayout(content);
  }

  private getHeaderContent(status: KYCStatus): string {
    switch (status) {
      case KYCStatus.APPROVED:
        return `
          <h1>🎉 Verification Approved!</h1>
          <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px;">
            Your account is now fully verified
          </p>
        `;
      case KYCStatus.REJECTED:
        return `
          <h1>KYC Verification Status</h1>
          <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px;">
            Your verification requires attention
          </p>
        `;
      case KYCStatus.PENDING_REVIEW:
        return `
          <h1>⏳ Under Review</h1>
          <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px;">
            Your verification is being processed
          </p>
        `;
      case KYCStatus.REQUIRES_ADDITIONAL_INFO:
        return `
          <h1>📋 Action Required</h1>
          <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px;">
            Additional information needed
          </p>
        `;
      default:
        return `
          <h1>KYC Verification Update</h1>
          <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px;">
            Status update on your verification
          </p>
        `;
    }
  }

  private generateStatusContent(data: KYCStatusEmailData): string {
    switch (data.status) {
      case KYCStatus.APPROVED:
        return this.generateApprovedContent(data);
      case KYCStatus.REJECTED:
        return this.generateRejectedContent(data);
      case KYCStatus.PENDING_REVIEW:
        return this.generatePendingContent(data);
      case KYCStatus.REQUIRES_ADDITIONAL_INFO:
        return this.generateAdditionalInfoContent(data);
      default:
        return this.generateDefaultContent(data);
    }
  }

  private generateApprovedContent(data: KYCStatusEmailData): string {
    const dashboardLink = data.dashboardUrl || 'https://merchant.nedapay.com/dashboard';

    return `
      <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Great news! Your KYC verification has been <strong style="color: #10b981;">approved</strong>. 
        Your NedaPay merchant account is now fully verified and all features are unlocked! 🚀
      </p>

      <!-- Success Message -->
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px; padding: 24px; margin-bottom: 32px; color: white;">
        <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
          ✨ You Now Have Full Access To:
        </h3>
        <ul style="margin: 0; padding-left: 24px; line-height: 1.8;">
          <li><strong>Unlimited Transaction Limits:</strong> No restrictions on payment amounts</li>
          <li><strong>Off-Ramp to Fiat:</strong> Convert crypto to local currency instantly</li>
          <li><strong>All Premium Features:</strong> Payment links, invoices, analytics & more</li>
          <li><strong>Priority Support:</strong> Dedicated assistance when you need it</li>
          <li><strong>Advanced Tools:</strong> API access, webhooks, and integrations</li>
        </ul>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin-bottom: 32px;">
        <p style="color: #6b7280; font-size: 16px; margin: 0 0 20px 0;">
          <strong>Ready to start using your verified account?</strong>
        </p>
        <a href="${dashboardLink}" class="button">
          Go to Dashboard
        </a>
      </div>

      <!-- Footer Message -->
      <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; text-align: center;">
        <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0;">
          Thank you for completing your verification. We're excited to support your business growth! 💪
        </p>
      </div>
    `;
  }

  private generateRejectedContent(data: KYCStatusEmailData): string {
    const reason = data.rejectionReason || 'Unable to verify the submitted documents';

    return `
      <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        We've reviewed your KYC verification submission. Unfortunately, we were unable to approve 
        your verification at this time.
      </p>

      <!-- Rejection Reason -->
      <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 4px; margin-bottom: 32px;">
        <h3 style="color: #7f1d1d; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">
          Reason for Non-Approval:
        </h3>
        <p style="color: #7f1d1d; font-size: 14px; margin: 0; line-height: 1.6;">
          ${reason}
        </p>
      </div>

      <!-- Next Steps -->
      <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #667eea;">
        <h3 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">
          📋 What to Do Next
        </h3>
        <ol style="color: #6b7280; font-size: 16px; line-height: 1.8; margin: 0; padding-left: 24px;">
          <li>Review the reason for non-approval carefully</li>
          <li>Gather the required documents or information</li>
          <li>Ensure all documents are clear, valid, and not expired</li>
          <li>Resubmit your KYC verification with corrected information</li>
        </ol>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin-bottom: 32px;">
        <p style="color: #6b7280; font-size: 16px; margin: 0 0 20px 0;">
          <strong>Ready to resubmit your verification?</strong>
        </p>
        <a href="${data.dashboardUrl || 'https://merchant.nedapay.com/kyc'}" class="button">
          Retry KYC Verification
        </a>
      </div>

      <!-- Support -->
      <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; text-align: center;">
        <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0;">
          Need help? Contact our support team at <strong>support@nedapay.com</strong>
        </p>
      </div>
    `;
  }

  private generatePendingContent(data: KYCStatusEmailData): string {
    return `
      <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Thank you for submitting your KYC verification! We've received your documents and 
        our team is currently reviewing them.
      </p>

      <!-- Status Info -->
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin-bottom: 32px;">
        <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
          <strong>⏰ Current Status:</strong> Your verification is under review. This typically takes 24-48 hours, 
          but may take longer during peak periods. We'll notify you as soon as we have an update.
        </p>
      </div>

      <!-- What Happens Next -->
      <div style="margin-bottom: 32px;">
        <h3 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 20px 0;">
          🔍 What Happens Next
        </h3>
        <ul style="color: #6b7280; font-size: 16px; line-height: 1.8; margin: 0; padding-left: 24px;">
          <li>Our compliance team will verify your submitted documents</li>
          <li>We'll check that all information matches and is valid</li>
          <li>You'll receive an email notification with the outcome</li>
          <li>If approved, all features will be immediately unlocked</li>
        </ul>
      </div>

      <!-- Meanwhile -->
      <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
        <h3 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">
          💡 In the Meantime
        </h3>
        <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0;">
          You can still use basic features of your NedaPay account while we process your verification. 
          Explore the dashboard and familiarize yourself with the platform!
        </p>
      </div>

      <!-- Footer Message -->
      <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; text-align: center;">
        <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0;">
          Thank you for your patience! We'll be in touch soon. 🙏
        </p>
      </div>
    `;
  }

  private generateAdditionalInfoContent(data: KYCStatusEmailData): string {
    const additionalInfo = data.additionalInfoRequired || 'Additional verification documents';

    return `
      <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        We've reviewed your KYC submission and need some additional information to complete 
        your verification.
      </p>

      <!-- Required Info -->
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin-bottom: 32px;">
        <h3 style="color: #92400e; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">
          📋 What We Need:
        </h3>
        <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
          ${additionalInfo}
        </p>
      </div>

      <!-- Instructions -->
      <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #667eea;">
        <h3 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">
          ✅ How to Proceed
        </h3>
        <ol style="color: #6b7280; font-size: 16px; line-height: 1.8; margin: 0; padding-left: 24px;">
          <li>Review the required information listed above</li>
          <li>Prepare the necessary documents or details</li>
          <li>Return to your dashboard to submit the information</li>
          <li>We'll review and update you within 24-48 hours</li>
        </ol>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin-bottom: 32px;">
        <p style="color: #6b7280; font-size: 16px; margin: 0 0 20px 0;">
          <strong>Ready to provide the requested information?</strong>
        </p>
        <a href="${data.dashboardUrl || 'https://merchant.nedapay.com/kyc'}" class="button">
          Update KYC Information
        </a>
      </div>

      <!-- Support -->
      <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; text-align: center;">
        <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0;">
          Questions? We're here to help at <strong>support@nedapay.com</strong>
        </p>
      </div>
    `;
  }

  private generateDefaultContent(data: KYCStatusEmailData): string {
    return `
      <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Your KYC verification status has been updated. Please check your dashboard for more details.
      </p>

      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${data.dashboardUrl || 'https://merchant.nedapay.com/dashboard'}" class="button">
          View Dashboard
        </a>
      </div>
    `;
  }
}
