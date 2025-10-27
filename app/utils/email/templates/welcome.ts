/**
 * Welcome Email Template
 * Sent to new users when they join NedaPay
 */

import { BaseEmailTemplate } from './base';
import { WelcomeEmailData, EmailTemplateType } from '../types';

export class WelcomeEmailTemplate extends BaseEmailTemplate<WelcomeEmailData> {
  getType(): EmailTemplateType {
    return EmailTemplateType.WELCOME;
  }

  protected getSubject(data: WelcomeEmailData): string {
    return `Welcome to NedaPay, ${data.firstName}! 🎉`;
  }

  protected generateHtml(data: WelcomeEmailData): string {
    const dashboardLink = data.dashboardUrl || 'https://merchant.nedapay.com/dashboard';

    const content = `
      <div class="header">
        <h1>Welcome to NedaPay! 🎉</h1>
        <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px;">
          Your merchant account is ready
        </p>
      </div>

      <div class="content">
        <!-- Greeting -->
        <div style="margin-bottom: 32px;">
          <h2 style="color: #1f2937; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">
            Hi ${data.firstName}! 👋
          </h2>
          <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0;">
            Welcome to NedaPay Merchant Portal! We're thrilled to have you join our platform 
            for seamless crypto payment processing across multiple blockchains.
          </p>
        </div>

        <!-- Wallet Info -->
        <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #667eea;">
          <h3 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">
            Your Wallet Address
          </h3>
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 12px 0;">
            Your merchant wallet address:
          </p>
          <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; word-break: break-all;">
            <code style="color: #667eea; font-size: 14px; font-family: monospace;">
              ${data.walletAddress}
            </code>
          </div>
        </div>

        <!-- Features -->
        <div style="margin-bottom: 32px;">
          <h3 style="color: #1f2937; font-size: 18px; font-weight: 600; margin: 0 0 20px 0;">
            What You Can Do Now
          </h3>
          <ul style="color: #6b7280; font-size: 16px; line-height: 1.8; margin: 0; padding-left: 24px;">
            <li><strong>Accept Payments:</strong> Start receiving crypto payments from customers worldwide</li>
            <li><strong>Multi-Chain Support:</strong> Accept payments on Base, Arbitrum, Polygon, BNB, Celo, Scroll, and Optimism</li>
            <li><strong>Create Invoices:</strong> Generate and send professional invoices to your clients</li>
            <li><strong>Payment Links:</strong> Create shareable payment links for quick transactions</li>
            <li><strong>Off-Ramp to Fiat:</strong> Convert crypto to fiat currency via IDRX integration</li>
            <li><strong>Real-time Dashboard:</strong> Track all your transactions and balances in one place</li>
          </ul>
        </div>

        <!-- Next Steps -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 24px; margin-bottom: 32px; color: white;">
          <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
            🚀 Next Steps
          </h3>
          <ol style="margin: 0; padding-left: 24px; line-height: 1.8;">
            <li><strong>Complete KYC Verification:</strong> Verify your identity to unlock full features</li>
            <li><strong>Set Up Your Profile:</strong> Add your business information and preferences</li>
            <li><strong>Create Your First Payment Link:</strong> Start accepting payments immediately</li>
            <li><strong>Explore the Dashboard:</strong> Familiarize yourself with all available features</li>
          </ol>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin-bottom: 32px;">
          <p style="color: #6b7280; font-size: 16px; margin: 0 0 20px 0;">
            Ready to get started?
          </p>
          <a href="${dashboardLink}" class="button">
            Go to Dashboard
          </a>
        </div>

        <!-- Support Info -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; text-align: center;">
          <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
            Need help getting started? Check out our documentation or reach out to our support team.
          </p>
          <p style="color: #9ca3af; font-size: 14px; margin: 0;">
            We're here to help you succeed! 💪
          </p>
        </div>
      </div>
    `;

    return this.wrapWithLayout(content);
  }
}
