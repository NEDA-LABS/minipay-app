/**
 * Email Template Factory
 * Creates appropriate email template instances based on type
 * Follows Factory Pattern
 */

import {
  EmailTemplateType,
  IEmailTemplate,
  EmailTemplateData,
  InvoiceEmailData,
  WelcomeEmailData,
  KYCReminderEmailData,
  KYCStatusEmailData,
  PaymentSettledEmailData,
  PaymentRefundedEmailData,
  EmailTemplateError,
} from '../types';
import { InvoiceEmailTemplate } from './invoice';
import { WelcomeEmailTemplate } from './welcome';
import { KYCReminderEmailTemplate } from './kyc-reminder';
import { KYCStatusEmailTemplate } from './kyc-status';
import { PaymentSettledEmailTemplate } from './payment-settled';
import { PaymentRefundedEmailTemplate } from './payment-refunded';

/**
 * Template Factory Class
 * Creates email template instances based on the template type
 */
export class EmailTemplateFactory {
  /**
   * Create an email template instance
   * @param type The type of email template to create
   * @returns An instance of the requested template
   * @throws {EmailTemplateError} if template type is unknown
   */
  static createTemplate<T extends EmailTemplateData>(
    type: EmailTemplateType
  ): IEmailTemplate<T> {
    switch (type) {
      case EmailTemplateType.INVOICE:
        return new InvoiceEmailTemplate() as IEmailTemplate<T>;

      case EmailTemplateType.WELCOME:
        return new WelcomeEmailTemplate() as IEmailTemplate<T>;

      case EmailTemplateType.KYC_REMINDER:
        return new KYCReminderEmailTemplate() as IEmailTemplate<T>;

      case EmailTemplateType.KYC_STATUS:
        return new KYCStatusEmailTemplate() as IEmailTemplate<T>;

      case EmailTemplateType.PAYMENT_SETTLED:
        return new PaymentSettledEmailTemplate() as IEmailTemplate<T>;

      case EmailTemplateType.PAYMENT_REFUNDED:
        return new PaymentRefundedEmailTemplate() as IEmailTemplate<T>;

      default:
        throw new EmailTemplateError(
          `Unknown email template type: ${type}`
        );
    }
  }

  /**
   * Get all available template types
   */
  static getAvailableTypes(): EmailTemplateType[] {
    return Object.values(EmailTemplateType);
  }

  /**
   * Check if a template type is supported
   */
  static isTemplateSupported(type: string): type is EmailTemplateType {
    return Object.values(EmailTemplateType).includes(type as EmailTemplateType);
  }
}
