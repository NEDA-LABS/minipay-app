/**
 * Email Service Types and Interfaces
 * Follows SOLID principles and provides type-safe email operations
 */

// ============================================================================
// Base Email Types
// ============================================================================

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType: string;
}

export interface BaseEmailData {
  to: EmailAddress[];
  subject: string;
  html?: string;
  text?: string;
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  attachments?: EmailAttachment[];
  replyTo?: EmailAddress;
}

// ============================================================================
// Email Template Types
// ============================================================================

export enum EmailTemplateType {
  INVOICE = 'invoice',
  WELCOME = 'welcome',
  PAYMENT_SETTLED = 'payment_settled',
  PAYMENT_REFUNDED = 'payment_refunded',
}

// Invoice Email Data
export interface InvoiceLineItem {
  description: string;
  amount: number;
}

export interface InvoiceEmailData {
  recipientEmail: string; // Email address of the recipient
  recipient: string; // Name of the recipient
  sender: string;
  invoiceId: string;
  merchantId: string;
  paymentCollection: string;
  dueDate: Date;
  currency: string;
  lineItems: InvoiceLineItem[];
  totalAmount: number;
  paymentLink?: string;
}

// Welcome Email Data
export interface WelcomeEmailData {
  recipientEmail: string;
  firstName: string;
  walletAddress: string;
  dashboardUrl?: string;
}

// Payment Settlement Email Data
export interface PaymentSettledEmailData {
  recipientEmail: string;
  firstName: string;
  transactionId: string;
  amount: string;
  currency: string;
  accountName: string;
  accountNumber: string;
  institution: string;
  rate: string;
  settledAt: Date;
  dashboardUrl?: string;
}

// Payment Refund Email Data
export interface PaymentRefundedEmailData {
  recipientEmail: string;
  firstName: string;
  transactionId: string;
  amount: string;
  currency: string;
  accountName: string;
  accountNumber: string;
  refundReason?: string;
  refundedAt: Date;
  dashboardUrl?: string;
}

// Union type for all email data
export type EmailTemplateData =
  | InvoiceEmailData
  | WelcomeEmailData
  | PaymentSettledEmailData
  | PaymentRefundedEmailData;

// ============================================================================
// Provider Interfaces
// ============================================================================

export interface EmailProviderResponse {
  success: boolean;
  messageId?: string;
  error?: Error;
  data?: any;
}

export interface IEmailProvider {
  send(emailData: BaseEmailData): Promise<EmailProviderResponse>;
  validateConfig(): boolean;
}

// ============================================================================
// Template Interfaces
// ============================================================================

export interface IEmailTemplate<T extends EmailTemplateData> {
  generate(data: T): BaseEmailData;
  getType(): EmailTemplateType;
}

// ============================================================================
// Service Interfaces
// ============================================================================

export interface EmailServiceConfig {
  provider: IEmailProvider;
  defaultFromEmail: string;
  defaultFromName: string;
  isDevelopment?: boolean;
}

export interface SendEmailOptions {
  templateType: EmailTemplateType;
  data: EmailTemplateData;
  overrides?: Partial<BaseEmailData>;
}

// ============================================================================
// Error Types
// ============================================================================

export class EmailServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'EmailServiceError';
  }
}

export class EmailProviderError extends EmailServiceError {
  constructor(message: string, originalError?: Error) {
    super(message, 'PROVIDER_ERROR', originalError);
    this.name = 'EmailProviderError';
  }
}

export class EmailTemplateError extends EmailServiceError {
  constructor(message: string, originalError?: Error) {
    super(message, 'TEMPLATE_ERROR', originalError);
    this.name = 'EmailTemplateError';
  }
}

export class EmailValidationError extends EmailServiceError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'EmailValidationError';
  }
}
