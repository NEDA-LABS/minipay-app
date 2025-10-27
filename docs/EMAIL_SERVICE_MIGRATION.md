# Email Service Migration Guide

## Migration from Mailtrap to Resend

This document outlines the migration from the old Mailtrap email service to the new scalable Resend-based email service.

---

## 📋 Summary of Changes

### What Changed

1. **Email Provider**: Mailtrap → Resend
2. **Architecture**: Inline HTML templates → Template-based architecture
3. **Code Organization**: Single file → Modular, layered structure
4. **Dependencies**: Removed `mailtrap` and `nodemailer` packages
5. **Environment Variables**: Updated configuration keys

### Why We Migrated

1. **Scalability**: New architecture supports multiple email types easily
2. **Maintainability**: Separation of concerns and SOLID principles
3. **Type Safety**: Full TypeScript support with comprehensive types
4. **Extensibility**: Easy to add new templates or switch providers
5. **Production Ready**: Resend offers better deliverability and analytics

---

## 🚀 Migration Steps

### Step 1: Update Environment Variables

**Before (.env):**
```bash
MAILTRAP_USER="your-mailtrap-user"
MAILTRAP_PASS="your-mailtrap-password"
MAILTRAP_INVOICE_EMAIL="invoices@yourdomain.com"
MAILTRAP_NEDAPAY_DOMAIN_TOKEN="your-mailtrap-domain-token"
MAILTRAP_TOKEN="your-mailtrap-api-token"
```

**After (.env):**
```bash
# Required
RESEND_API_KEY="re_your_resend_api_key"

# Optional (defaults shown)
RESEND_FROM_EMAIL="noreply@nedapay.com"
RESEND_FROM_NAME="NedaPay"
RESEND_INVOICE_EMAIL="invoices@nedapay.com"
RESEND_KYC_EMAIL="kyc@nedapay.com"
```

### Step 2: Get Resend API Key

1. Go to [https://resend.com](https://resend.com)
2. Sign up or log in
3. Add and verify your domain
4. Generate an API key
5. Copy to your `.env` file

### Step 3: Remove Old Dependencies

Run:
```bash
npm uninstall mailtrap nodemailer
npm install
```

The `resend` package is already in `package.json`.

### Step 4: Update Code

**Before (Old Way):**
```typescript
import { MailtrapClient } from 'mailtrap';

const client = new MailtrapClient({
  token: process.env.MAILTRAP_NEDAPAY_DOMAIN_TOKEN!
});

// Manual HTML template construction
const htmlContent = `<!DOCTYPE html>...`;

await client.send({
  from: { name: "Invoice Service", email: process.env.MAILTRAP_INVOICE_EMAIL },
  to: [{ email: customerEmail }],
  subject: 'Invoice',
  html: htmlContent,
});
```

**After (New Way):**
```typescript
import { sendInvoiceEmail } from '@/app/utils/email';

await sendInvoiceEmail({
  recipientEmail: customerEmail,
  recipient: 'John Doe',
  sender: 'Acme Corp',
  invoiceId: 'INV-001',
  merchantId: '0x...',
  paymentCollection: 'Crypto',
  dueDate: new Date(),
  currency: 'USDC',
  lineItems: [
    { description: 'Service', amount: 100 }
  ],
  totalAmount: 100,
  paymentLink: 'https://pay.nedapay.com/link',
});
```

---

## 📝 Updated Files

### Modified Files

1. **app/api/send-invoice/route.ts**
   - Removed Mailtrap client initialization
   - Removed inline HTML template
   - Uses `sendInvoiceEmail()` function

2. **package.json**
   - Removed `mailtrap` package
   - Removed `nodemailer` package
   - Kept `resend` package

3. **.env.example**
   - Removed Mailtrap configuration
   - Added Resend configuration

### New Files Created

```
app/utils/email/
├── index.ts                  # Main entry point
├── types.ts                  # TypeScript types
├── config.ts                 # Configuration
├── service.ts                # EmailService class
├── README.md                 # Documentation
├── providers/
│   ├── base.ts              # Base provider
│   └── resend.ts            # Resend implementation
└── templates/
    ├── base.ts              # Base template
    ├── factory.ts           # Template factory
    ├── invoice.ts           # Invoice template
    ├── welcome.ts           # Welcome template
    ├── kyc-reminder.ts      # KYC reminder template
    ├── kyc-status.ts        # KYC status template
    └── index.ts             # Exports
```

### Documentation Added

- `app/utils/email/README.md` - Complete API documentation
- `docs/EMAIL_SERVICE_MIGRATION.md` - This migration guide

---

## 🆕 New Features

### 1. Multiple Email Templates

Now supports 4 email types out of the box:

- **Invoice Email**: Professional invoices with payment links
- **Welcome Email**: Onboarding new users
- **KYC Reminder Email**: Remind users to complete KYC
- **KYC Status Email**: Notify about KYC approval/rejection

### 2. Type-Safe Email Sending

Full TypeScript support with proper interfaces:

```typescript
interface InvoiceEmailData {
  recipientEmail: string;
  recipient: string;
  sender: string;
  invoiceId: string;
  // ... all fields typed
}
```

### 3. Easy Template Addition

Add new templates without modifying existing code:

```typescript
// 1. Create template class
export class MyTemplate extends BaseEmailTemplate<MyData> {
  // ... implementation
}

// 2. Add to factory
case EmailTemplateType.MY_TYPE:
  return new MyTemplate();

// 3. Use it
await sendEmail({
  templateType: EmailTemplateType.MY_TYPE,
  data: myData
});
```

### 4. Provider Abstraction

Easy to switch email providers in the future:

```typescript
// Current: Resend
const provider = new ResendProvider(config);

// Future: Could be any provider
// const provider = new SendGridProvider(config);
// const provider = new MailgunProvider(config);

const service = new EmailService({ provider });
```

---

## ✅ Testing Checklist

After migration, test the following:

- [ ] Environment variables are set correctly
- [ ] Invoice emails send successfully
- [ ] Email templates render correctly
- [ ] Payment links work in emails
- [ ] Error handling works (invalid emails, etc.)
- [ ] Development mode logging works
- [ ] Production emails deliver successfully

### Test Script

```typescript
// Test in development
import { sendInvoiceEmail } from '@/app/utils/email';

const result = await sendInvoiceEmail({
  recipientEmail: 'test@yourdomain.com',
  recipient: 'Test User',
  sender: 'Test Merchant',
  invoiceId: 'TEST-001',
  merchantId: '0x123...',
  paymentCollection: 'Crypto',
  dueDate: new Date(),
  currency: 'USDC',
  lineItems: [{ description: 'Test Service', amount: 10 }],
  totalAmount: 10,
  paymentLink: 'https://test.com/pay',
});

console.log('Test result:', result);
```

---

## 🔧 Troubleshooting

### "Cannot find module '@/app/utils/email'"

**Solution**: Clear Next.js cache and rebuild:
```bash
rm -rf .next
npm run dev
```

### "RESEND_API_KEY is not set"

**Solution**: Add the API key to your `.env` file:
```bash
RESEND_API_KEY="re_YourAPIKey"
```

### Emails not delivering

1. Verify domain in Resend dashboard
2. Check API key is correct
3. Ensure `from` email uses verified domain
4. Check Resend logs for details

### TypeScript errors

**Solution**: Rebuild TypeScript:
```bash
npm run build
```

---

## 📊 Performance Impact

### Before (Mailtrap)
- Inline HTML in route handler
- Manual template construction
- No type safety
- Hard to maintain

### After (Resend)
- Modular template system
- Type-safe operations
- Easy to extend
- Professional templates
- Better deliverability

**No performance degradation** - Email sending is async and doesn't block requests.

---

## 🔄 Rollback Plan

If you need to rollback:

1. **Restore old packages:**
   ```bash
   npm install mailtrap@^4.1.0 nodemailer@^6.10.1
   ```

2. **Restore environment variables** in `.env`

3. **Revert route file:**
   ```bash
   git checkout HEAD -- app/api/send-invoice/route.ts
   ```

4. **Remove new email service:**
   ```bash
   rm -rf app/utils/email
   ```

---

## 📚 Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [Email Service README](../app/utils/email/README.md)
- [Resend Dashboard](https://resend.com/dashboard)

---

## ✨ Future Enhancements

Planned features for the email service:

1. **Email Analytics**: Track open rates, clicks
2. **A/B Testing**: Test different email templates
3. **Scheduled Emails**: Queue emails for later sending
4. **Email Preferences**: User-controlled email settings
5. **Localization**: Multi-language email support
6. **Email Attachments**: PDF invoices, receipts

---

## 🎯 Summary

The migration to Resend with a well-architected email service provides:

- ✅ Better scalability
- ✅ Easier maintenance
- ✅ Type safety
- ✅ Professional templates
- ✅ Future-proof architecture
- ✅ Better developer experience

**Status**: ✅ Migration Complete

**Next Steps**: Test in development, then deploy to production.

---

**Questions?** Contact the development team or check the [Email Service README](../app/utils/email/README.md).
