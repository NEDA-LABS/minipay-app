/**
 * Base Email Template
 * Abstract class for email template implementations
 * Follows Template Method Pattern
 */

import {
  IEmailTemplate,
  BaseEmailData,
  EmailTemplateData,
  EmailTemplateType,
  EmailAddress,
} from '../types';
import { buildEmailAddress } from '../config';

export abstract class BaseEmailTemplate<T extends EmailTemplateData>
  implements IEmailTemplate<T>
{
  /**
   * Abstract method to generate email HTML - must be implemented by subclasses
   */
  protected abstract generateHtml(data: T): string;

  /**
   * Abstract method to get email subject - must be implemented by subclasses
   */
  protected abstract getSubject(data: T): string;

  /**
   * Abstract method to get template type - must be implemented by subclasses
   */
  abstract getType(): EmailTemplateType;

  /**
   * Generate complete email data
   */
  generate(data: T): BaseEmailData {
    const html = this.generateHtml(data);
    const subject = this.getSubject(data);
    const to = this.getRecipients(data);

    return {
      to,
      subject,
      html,
      text: this.generatePlainText(data),
    };
  }

  /**
   * Get recipients from template data
   * Can be overridden by subclasses
   * @protected
   */
  protected getRecipients(data: T): EmailAddress[] {
    // Default implementation - subclasses can override
    const email = (data as any).recipientEmail || (data as any).email;
    if (!email) {
      throw new Error('No recipient email found in template data');
    }

    const name = (data as any).firstName || (data as any).recipient;
    return [buildEmailAddress(email, name)];
  }

  /**
   * Generate plain text version of email
   * Can be overridden by subclasses
   * @protected
   */
  protected generatePlainText(data: T): string {
    // Default: strip HTML tags from HTML content
    const html = this.generateHtml(data);
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Generate common email wrapper
   * @protected
   */
  protected wrapWithLayout(content: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f5;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
          }
          .footer {
            text-align: center;
            padding: 30px;
            color: #71717a;
            font-size: 14px;
            border-top: 1px solid #e4e4e7;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white !important;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 8px;
            margin: 24px 0;
            font-weight: 600;
          }
          .button:hover {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${content}
          <div class="footer">
            <p>© ${new Date().getFullYear()} NedaPay. All rights reserved.</p>
            <p style="margin-top: 8px; font-size: 12px;">
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Format currency amount
   * @protected
   */
  protected formatCurrency(amount: number, currency: string): string {
    return `${currency} ${amount.toFixed(2)}`;
  }

  /**
   * Format date
   * @protected
   */
  protected formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
