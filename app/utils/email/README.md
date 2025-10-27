# NedaPay Email Service

A scalable, well-architected email service for NedaPay merchant portal built with **Resend** and following **SOLID principles** and **design patterns**.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Features](#features)
- [Setup](#setup)
- [Usage](#usage)
- [Email Templates](#email-templates)
- [API Reference](#api-reference)
- [Design Patterns](#design-patterns)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture Overview

The email service follows a **layered architecture** with clear separation of concerns:

```
app/utils/email/
├── index.ts                  # Main entry point & convenience functions
├── types.ts                  # TypeScript interfaces & types
├── config.ts                 # Configuration management
├── service.ts                # Main EmailService class
├── providers/
│   ├── base.ts              # Abstract base provider
│   └── resend.ts            # Resend implementation
└── templates/
    ├── base.ts              # Abstract base template
    ├── factory.ts           # Template factory (Factory Pattern)
    ├── invoice.ts           # Invoice email template
    ├── welcome.ts           # Welcome email template
    ├── kyc-reminder.ts      # KYC reminder template
    ├── kyc-status.ts        # KYC status update template
    └── index.ts             # Template exports
```

### Design Principles

1. **Single Responsibility Principle (SRP)**: Each class has one reason to change
2. **Open/Closed Principle (OCP)**: Open for extension, closed for modification
3. **Liskov Substitution Principle (LSP)**: Providers/templates are interchangeable
4. **Interface Segregation Principle (ISP)**: Clean, focused interfaces
5. **Dependency Inversion Principle (DIP)**: Depend on abstractions, not concretions

---

## ✨ Features

- ✅ **Multiple Email Templates**: Invoice, Welcome, KYC Reminder, KYC Status
- ✅ **Provider Abstraction**: Easy to switch between email providers (currently Resend)
- ✅ **Type-Safe**: Full TypeScript support with comprehensive type definitions
- ✅ **Template Factory**: Clean template instantiation using Factory Pattern
- ✅ **Singleton Service**: Single instance throughout the application
- ✅ **Error Handling**: Custom error classes with proper error propagation
- ✅ **Validation**: Email address and data validation
- ✅ **Development Mode**: Enhanced logging for development
- ✅ **Extensible**: Easy to add new templates or providers

---

## 🚀 Setup

### 1. Environment Variables

Add the following to your `.env` file:

```bash
# Required
RESEND_API_KEY="re_your_resend_api_key"

# Optional (with defaults)
RESEND_FROM_EMAIL="noreply@nedapay.com"
RESEND_FROM_NAME="NedaPay"
RESEND_INVOICE_EMAIL="invoices@nedapay.com"
RESEND_KYC_EMAIL="kyc@nedapay.com"
NODE_ENV="development"
```

### 2. Get Resend API Key

1. Sign up at [https://resend.com](https://resend.com)
2. Verify your domain
3. Generate an API key
4. Add to your `.env` file

### 3. Install Dependencies

The `resend` package is already included in `package.json`:

```bash
npm install
```

---

## 📧 Usage

### Basic Usage (Convenience Functions)

```typescript
import {
  sendInvoiceEmail,
  sendWelcomeEmail,
  sendKYCReminderEmail,
  sendKYCStatusEmail,
} from '@/app/utils/email';

// Send an invoice email
const result = await sendInvoiceEmail({
  recipientEmail: 'customer@example.com',
  recipient: 'John Doe',
  sender: 'Acme Corp',
  invoiceId: 'INV-001',
  merchantId: '0x...',
  paymentCollection: 'Crypto',
  dueDate: new Date('2024-12-31'),
  currency: 'USDC',
  lineItems: [
    { description: 'Service A', amount: 100 },
    { description: 'Service B', amount: 50 },
  ],
  totalAmount: 150,
  paymentLink: 'https://pay.nedapay.com/link123',
});

if (result.success) {
  console.log('Email sent!', result.messageId);
} else {
  console.error('Email failed:', result.error);
}
```

### Advanced Usage (Email Service)

```typescript
import { getEmailService, EmailTemplateType } from '@/app/utils/email';

const emailService = getEmailService();

// Send email with custom options
const result = await emailService.sendEmail({
  templateType: EmailTemplateType.INVOICE,
  data: {
    recipientEmail: 'customer@example.com',
    recipient: 'John Doe',
    // ... other data
  },
  overrides: {
    // Override template-generated values
    cc: [{ email: 'manager@example.com', name: 'Manager' }],
    bcc: [{ email: 'audit@example.com' }],
    replyTo: { email: 'support@nedapay.com', name: 'Support' },
  },
});
```

### Raw Email (No Template)

```typescript
import { getEmailService } from '@/app/utils/email';

const emailService = getEmailService();

const result = await emailService.sendRawEmail({
  to: [{ email: 'user@example.com', name: 'User' }],
  subject: 'Custom Email',
  html: '<h1>Hello!</h1>',
  text: 'Hello!',
});
```

---

## 📝 Email Templates

### 1. Invoice Email

Professional invoice email with payment link support.

```typescript
await sendInvoiceEmail({
  recipientEmail: 'customer@example.com',
  recipient: 'John Doe',
  sender: 'Acme Corp',
  invoiceId: 'INV-001',
  merchantId: '0x1234...',
  paymentCollection: 'Crypto',
  dueDate: new Date('2024-12-31'),
  currency: 'USDC',
  lineItems: [
    { description: 'Consulting Services', amount: 1000 },
    { description: 'Development Work', amount: 2500 },
  ],
  totalAmount: 3500,
  paymentLink: 'https://pay.nedapay.com/inv001', // Optional
});
```

### 2. Welcome Email

Sent when a new user joins the platform.

```typescript
await sendWelcomeEmail({
  recipientEmail: 'newuser@example.com',
  firstName: 'Jane',
  walletAddress: '0x1234567890abcdef...',
  dashboardUrl: 'https://merchant.nedapay.com/dashboard', // Optional
});
```

### 3. KYC Reminder Email

Reminds users to complete KYC verification.

```typescript
await sendKYCReminderEmail({
  recipientEmail: 'user@example.com',
  firstName: 'Jane',
  kycUrl: 'https://merchant.nedapay.com/kyc',
  daysRemaining: 7, // Optional - shows urgency
});
```

### 4. KYC Status Email

Notifies users about KYC verification status.

```typescript
import { KYCStatus } from '@/app/utils/email';

// Approved
await sendKYCStatusEmail({
  recipientEmail: 'user@example.com',
  firstName: 'Jane',
  status: KYCStatus.APPROVED,
  dashboardUrl: 'https://merchant.nedapay.com/dashboard',
});

// Rejected
await sendKYCStatusEmail({
  recipientEmail: 'user@example.com',
  firstName: 'Jane',
  status: KYCStatus.REJECTED,
  rejectionReason: 'Document not clear enough. Please resubmit.',
});

// Requires Additional Info
await sendKYCStatusEmail({
  recipientEmail: 'user@example.com',
  firstName: 'Jane',
  status: KYCStatus.REQUIRES_ADDITIONAL_INFO,
  additionalInfoRequired: 'Please provide a recent utility bill for address verification.',
});
```

---

## 📚 API Reference

### Main Functions

#### `sendInvoiceEmail(data: InvoiceEmailData): Promise<EmailProviderResponse>`

Send an invoice email.

#### `sendWelcomeEmail(data: WelcomeEmailData): Promise<EmailProviderResponse>`

Send a welcome email to new users.

#### `sendKYCReminderEmail(data: KYCReminderEmailData): Promise<EmailProviderResponse>`

Send a KYC reminder email.

#### `sendKYCStatusEmail(data: KYCStatusEmailData): Promise<EmailProviderResponse>`

Send a KYC status update email.

### EmailService Class

#### `sendEmail(options: SendEmailOptions): Promise<EmailProviderResponse>`

Send an email using a template.

#### `sendRawEmail(emailData: BaseEmailData): Promise<EmailProviderResponse>`

Send a raw email without templates.

#### `validateConfiguration(): boolean`

Check if email service is properly configured.

### Response Type

```typescript
interface EmailProviderResponse {
  success: boolean;
  messageId?: string;
  error?: Error;
  data?: any;
}
```

---

## 🎨 Design Patterns

### 1. **Singleton Pattern**

Email service uses a singleton to ensure one instance across the app:

```typescript
let emailServiceInstance: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    // Initialize once
    emailServiceInstance = new EmailService(config);
  }
  return emailServiceInstance;
}
```

### 2. **Factory Pattern**

Template creation uses the Factory pattern:

```typescript
export class EmailTemplateFactory {
  static createTemplate<T>(type: EmailTemplateType): IEmailTemplate<T> {
    switch (type) {
      case EmailTemplateType.INVOICE:
        return new InvoiceEmailTemplate();
      case EmailTemplateType.WELCOME:
        return new WelcomeEmailTemplate();
      // ...
    }
  }
}
```

### 3. **Strategy Pattern**

Different email providers can be swapped:

```typescript
// Current: Resend
const provider = new ResendProvider(config);

// Future: Could be SendGrid, Mailgun, etc.
// const provider = new SendGridProvider(config);

const emailService = new EmailService({ provider });
```

### 4. **Template Method Pattern**

Base template defines the algorithm structure:

```typescript
abstract class BaseEmailTemplate<T> {
  // Template method
  generate(data: T): BaseEmailData {
    return {
      to: this.getRecipients(data),
      subject: this.getSubject(data), // Abstract
      html: this.generateHtml(data), // Abstract
      text: this.generatePlainText(data),
    };
  }

  protected abstract generateHtml(data: T): string;
  protected abstract getSubject(data: T): string;
}
```

---

## 🧪 Testing

### Manual Testing

```typescript
// Test email service configuration
import { getEmailService } from '@/app/utils/email';

const service = getEmailService();
console.log('Valid config:', service.validateConfiguration());

// Test sending an email
const result = await sendWelcomeEmail({
  recipientEmail: 'test@example.com',
  firstName: 'Test User',
  walletAddress: '0x1234...',
});

console.log('Result:', result);
```

### Development Mode

Set `NODE_ENV=development` for enhanced logging:

```bash
[EmailService] Preparing to send invoice email
[EmailService] Template data: { ... }
[2024-01-27T10:30:00.000Z] 📧 Sending email to: customer@example.com
[2024-01-27T10:30:00.000Z] 📝 Subject: Invoice #INV-001...
[2024-01-27T10:30:01.500Z] ✅ Email sent successfully to: customer@example.com
[EmailService] ✅ Email sent successfully - Message ID: abc123
```

---

## 🐛 Troubleshooting

### Error: "RESEND_API_KEY is not set"

**Solution**: Add `RESEND_API_KEY` to your `.env` file.

### Error: "Invalid email address"

**Solution**: Ensure email addresses are properly formatted (user@domain.com).

### Email not sending

1. Check Resend API key is valid
2. Verify domain is verified in Resend dashboard
3. Check development mode logs for errors
4. Ensure `from` email matches verified domain

### TypeScript errors

Run `npm install` to ensure all types are installed.

---

## 🔄 Adding New Templates

1. **Create template class** in `templates/` directory:

```typescript
// templates/password-reset.ts
import { BaseEmailTemplate } from './base';

export class PasswordResetEmailTemplate extends BaseEmailTemplate<PasswordResetEmailData> {
  getType() {
    return EmailTemplateType.PASSWORD_RESET;
  }

  protected getSubject(data: PasswordResetEmailData): string {
    return 'Reset Your Password - NedaPay';
  }

  protected generateHtml(data: PasswordResetEmailData): string {
    // Your HTML template
    return this.wrapWithLayout(content);
  }
}
```

2. **Add type** to `types.ts`:

```typescript
export enum EmailTemplateType {
  // ... existing
  PASSWORD_RESET = 'password_reset',
}

export interface PasswordResetEmailData {
  recipientEmail: string;
  firstName: string;
  resetLink: string;
}
```

3. **Register in factory** (`templates/factory.ts`):

```typescript
case EmailTemplateType.PASSWORD_RESET:
  return new PasswordResetEmailTemplate() as IEmailTemplate<T>;
```

4. **Add convenience function** (`index.ts`):

```typescript
export async function sendPasswordResetEmail(
  data: PasswordResetEmailData
): Promise<EmailProviderResponse> {
  const service = getEmailService();
  return service.sendEmail({
    templateType: EmailTemplateType.PASSWORD_RESET,
    data,
  });
}
```

---

## 📄 License

Part of NedaPay Merchant Portal - Internal Use

---

## 👥 Maintainers

NedaPay Development Team

For questions or issues, contact: dev@nedapay.com
