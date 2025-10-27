/**
 * Email Service
 * Main service class for sending emails
 * Follows Dependency Injection and Single Responsibility Principle
 */

import {
  IEmailProvider,
  SendEmailOptions,
  EmailProviderResponse,
  EmailServiceConfig,
  BaseEmailData,
  EmailServiceError,
} from './types';
import { EmailTemplateFactory } from './templates/factory';

/**
 * Email Service Class
 * Orchestrates email sending using providers and templates
 */
export class EmailService {
  private provider: IEmailProvider;
  private defaultFromEmail: string;
  private defaultFromName: string;
  private isDevelopment: boolean;

  constructor(config: EmailServiceConfig) {
    this.provider = config.provider;
    this.defaultFromEmail = config.defaultFromEmail;
    this.defaultFromName = config.defaultFromName;
    this.isDevelopment = config.isDevelopment || false;

    // Validate provider configuration
    if (!this.provider.validateConfig()) {
      throw new EmailServiceError(
        'Email provider configuration is invalid',
        'INVALID_CONFIG'
      );
    }
  }

  /**
   * Send an email using a template
   * @param options Email sending options including template type and data
   * @returns Promise with email provider response
   */
  async sendEmail(options: SendEmailOptions): Promise<EmailProviderResponse> {
    try {
      const { templateType, data, overrides } = options;

      // Log in development
      if (this.isDevelopment) {
        console.log(`[EmailService] Preparing to send ${templateType} email`);
        console.log('[EmailService] Template data:', JSON.stringify(data, null, 2));
      }

      // Create template and generate email data
      const template = EmailTemplateFactory.createTemplate(templateType);
      const baseEmailData = template.generate(data);

      // Merge with overrides
      const emailData: BaseEmailData = {
        ...baseEmailData,
        ...overrides,
      };

      // Send email via provider
      const result = await this.provider.send(emailData);

      // Log result
      if (this.isDevelopment) {
        if (result.success) {
          console.log(`[EmailService] ✅ Email sent successfully - Message ID: ${result.messageId}`);
        } else {
          console.error(`[EmailService] ❌ Failed to send email:`, result.error);
        }
      }

      return result;
    } catch (error) {
      console.error('[EmailService] Unexpected error:', error);
      
      return {
        success: false,
        error: new EmailServiceError(
          'Failed to send email',
          'SEND_ERROR',
          error as Error
        ),
      };
    }
  }

  /**
   * Send a raw email without using templates
   * @param emailData Raw email data
   * @returns Promise with email provider response
   */
  async sendRawEmail(emailData: BaseEmailData): Promise<EmailProviderResponse> {
    try {
      if (this.isDevelopment) {
        console.log('[EmailService] Sending raw email');
      }

      return await this.provider.send(emailData);
    } catch (error) {
      console.error('[EmailService] Failed to send raw email:', error);
      
      return {
        success: false,
        error: new EmailServiceError(
          'Failed to send raw email',
          'SEND_RAW_ERROR',
          error as Error
        ),
      };
    }
  }

  /**
   * Get the underlying email provider (for advanced usage)
   */
  getProvider(): IEmailProvider {
    return this.provider;
  }

  /**
   * Get service configuration
   */
  getConfig() {
    return {
      defaultFromEmail: this.defaultFromEmail,
      defaultFromName: this.defaultFromName,
      isDevelopment: this.isDevelopment,
    };
  }

  /**
   * Test email service configuration
   * @returns true if configuration is valid
   */
  validateConfiguration(): boolean {
    try {
      return this.provider.validateConfig();
    } catch (error) {
      console.error('[EmailService] Configuration validation failed:', error);
      return false;
    }
  }
}
