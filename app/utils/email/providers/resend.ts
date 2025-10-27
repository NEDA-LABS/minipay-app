/**
 * Resend Email Provider Implementation
 * Implements IEmailProvider using Resend API
 */

import { Resend } from 'resend';
import { BaseEmailProvider } from './base';
import {
  BaseEmailData,
  EmailProviderResponse,
  EmailProviderError,
} from '../types';

export interface ResendConfig {
  apiKey: string;
  defaultFrom: {
    email: string;
    name: string;
  };
}

export class ResendProvider extends BaseEmailProvider {
  private resend: Resend;
  private defaultFrom: { email: string; name: string };

  constructor(config: ResendConfig) {
    super(config);
    this.resend = new Resend(config.apiKey);
    this.defaultFrom = config.defaultFrom;
  }

  /**
   * Validate Resend configuration
   */
  validateConfig(): boolean {
    const config = this.config as ResendConfig;
    
    if (!config.apiKey || config.apiKey.trim() === '') {
      console.error('Resend API key is missing');
      return false;
    }

    if (!config.defaultFrom || !config.defaultFrom.email) {
      console.error('Default from email is missing');
      return false;
    }

    return true;
  }

  /**
   * Send email using Resend API
   */
  async send(emailData: BaseEmailData): Promise<EmailProviderResponse> {
    try {
      // Validate email data
      this.validateEmailData(emailData);

      // Log sending attempt
      this.logEmail(emailData, 'sending');

      // Prepare Resend email payload
      const resendPayload: any = {
        from: `${this.defaultFrom.name} <${this.defaultFrom.email}>`,
        to: emailData.to.map(t => t.email),
        subject: emailData.subject,
        html: emailData.html,
        ...(emailData.text && { text: emailData.text }),
        ...(emailData.cc && emailData.cc.length > 0 && {
          cc: emailData.cc.map(c => c.email),
        }),
        ...(emailData.bcc && emailData.bcc.length > 0 && {
          bcc: emailData.bcc.map(b => b.email),
        }),
        ...(emailData.replyTo && {
          replyTo: emailData.replyTo.email,
        }),
        ...(emailData.attachments && emailData.attachments.length > 0 && {
          attachments: emailData.attachments.map(att => ({
            filename: att.filename,
            content: att.content,
          })),
        }),
      };

      // Send email via Resend
      const { data, error } = await this.resend.emails.send(resendPayload);

      if (error) {
        this.logEmail(emailData, 'error');
        console.error('Resend API error:', error);
        
        return {
          success: false,
          error: new EmailProviderError(
            `Failed to send email via Resend: ${error.message}`,
            error
          ),
        };
      }

      // Log success
      this.logEmail(emailData, 'success');

      return {
        success: true,
        messageId: data?.id,
        data,
      };
    } catch (error) {
      this.logEmail(emailData, 'error');
      console.error('Unexpected error sending email:', error);

      return {
        success: false,
        error: new EmailProviderError(
          'Unexpected error occurred while sending email',
          error as Error
        ),
      };
    }
  }

  /**
   * Get Resend client instance (for advanced usage)
   */
  getClient(): Resend {
    return this.resend;
  }
}
