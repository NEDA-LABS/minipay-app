/**
 * Base Email Provider
 * Abstract class for email provider implementations
 * Follows Open/Closed Principle - open for extension, closed for modification
 */

import {
  IEmailProvider,
  BaseEmailData,
  EmailProviderResponse,
  EmailValidationError,
} from '../types';
import { isValidEmail } from '../config';

export abstract class BaseEmailProvider implements IEmailProvider {
  protected config: Record<string, any>;

  constructor(config: Record<string, any>) {
    this.config = config;
    
    if (!this.validateConfig()) {
      throw new EmailValidationError('Invalid email provider configuration');
    }
  }

  /**
   * Abstract method to send email - must be implemented by subclasses
   */
  abstract send(emailData: BaseEmailData): Promise<EmailProviderResponse>;

  /**
   * Abstract method to validate provider configuration
   */
  abstract validateConfig(): boolean;

  /**
   * Validate email data before sending
   * @protected
   */
  protected validateEmailData(emailData: BaseEmailData): void {
    if (!emailData.to || emailData.to.length === 0) {
      throw new EmailValidationError('Email must have at least one recipient');
    }

    if (!emailData.subject || emailData.subject.trim() === '') {
      throw new EmailValidationError('Email subject is required');
    }

    if (!emailData.html && !emailData.text) {
      throw new EmailValidationError('Email must have either HTML or text content');
    }

    // Validate all email addresses
    const allEmails = [
      ...emailData.to,
      ...(emailData.cc || []),
      ...(emailData.bcc || []),
      ...(emailData.replyTo ? [emailData.replyTo] : []),
    ];

    for (const emailObj of allEmails) {
      if (!isValidEmail(emailObj.email)) {
        throw new EmailValidationError(`Invalid email address: ${emailObj.email}`);
      }
    }
  }

  /**
   * Log email sending attempt
   * @protected
   */
  protected logEmail(emailData: BaseEmailData, status: 'sending' | 'success' | 'error'): void {
    const recipients = emailData.to.map(t => t.email).join(', ');
    const timestamp = new Date().toISOString();

    switch (status) {
      case 'sending':
        console.log(`[${timestamp}] 📧 Sending email to: ${recipients}`);
        console.log(`[${timestamp}] 📝 Subject: ${emailData.subject}`);
        break;
      case 'success':
        console.log(`[${timestamp}] ✅ Email sent successfully to: ${recipients}`);
        break;
      case 'error':
        console.error(`[${timestamp}] ❌ Failed to send email to: ${recipients}`);
        break;
    }
  }

  /**
   * Sanitize HTML content
   * @protected
   */
  protected sanitizeHtml(html: string): string {
    // Basic sanitization - in production, use a library like DOMPurify
    return html.trim();
  }
}
