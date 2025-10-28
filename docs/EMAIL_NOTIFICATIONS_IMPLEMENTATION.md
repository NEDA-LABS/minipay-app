# Email Notifications Implementation

## Overview

Implemented comprehensive email notification system for payment settlements, refunds, and KYC verification results using Resend email service. Follows SOLID principles and software engineering best practices.

---

## 🎯 Features Implemented

### 1. **Payment Notifications (Paycrest Webhook)**
- ✅ Payment Settled Email
- ✅ Payment Refunded Email
- ✅ Automatic email sending on webhook events
- ✅ Email tracking in database

### 2. **KYC Verification Notifications (SmileID)**
- ✅ KYC Approved Email
- ✅ KYC Rejected Email
- ✅ KYC Pending Review Email
- ✅ Email requirement check (aborts if no email)
- ✅ Email tracking in database

---

## 📁 Files Created/Modified

### **New Files Created:**

1. **`app/utils/email/templates/payment-settled.ts`**
   - Professional email template for payment settlement
   - Includes transaction details, account info, exchange rate
   - NedaPay logo integration
   - Mobile-responsive design

2. **`app/utils/email/templates/payment-refunded.ts`**
   - Professional email template for payment refunds
   - Includes refund reason (optional)
   - Transaction details and next steps
   - Mobile-responsive design

3. **`app/utils/email/services/payment-notification-service.ts`**
   - Service class for payment email notifications
   - Follows Single Responsibility Principle
   - Checks user email before sending
   - Tracks emails in database

4. **`app/utils/email/services/index.ts`**
   - Factory functions for email services
   - Centralized service creation
   - Environment variable configuration

### **Modified Files:**

1. **`app/utils/email/types.ts`**
   - Added `PaymentSettledEmailData` interface
   - Added `PaymentRefundedEmailData` interface
   - Added `PAYMENT_SETTLED` and `PAYMENT_REFUNDED` to `EmailTemplateType` enum

2. **`app/utils/email/templates/base.ts`**
   - Added `escapeHtml()` method for XSS protection
   - Enhanced security for user-generated content

3. **`app/utils/email/templates/factory.ts`**
   - Added payment template cases
   - Imported new template classes

4. **`prisma/schema.prisma`**
   - Added `PAYMENT_SETTLED` to `EmailNotificationType` enum
   - Added `PAYMENT_REFUNDED` to `EmailNotificationType` enum

5. **`app/api/paycrest/webhook/route.ts`**
   - Integrated payment notification service
   - Sends emails on `payment_order.settled` event
   - Sends emails on `payment_order.refunded` event
   - Error handling to prevent webhook failure

6. **`app/utils/kyc/smile-id/service.ts`**
   - Added `sendKYCStatusEmail()` private method
   - Integrated email service
   - Checks user email before sending
   - Maps SmileID status to KYC status
   - Tracks emails in database

---

## 🏗️ Architecture & Design Patterns

### **1. Single Responsibility Principle (SRP)**
Each service class has one responsibility:
- `PaymentNotificationService`: Handles payment-related emails only
- `SmileIDService`: Handles KYC verification (including email notifications)
- `EmailService`: Handles generic email sending
- `EmailTemplateFactory`: Creates email templates

### **2. Dependency Injection**
Services receive dependencies through constructors:
```typescript
constructor(emailService: EmailService, prisma: PrismaClient) {
  this.emailService = emailService;
  this.prisma = prisma;
}
```

### **3. Factory Pattern**
Centralized service creation:
```typescript
export function createPaymentNotificationService(prisma: PrismaClient) {
  const emailService = createEmailService();
  return new PaymentNotificationService(emailService, prisma);
}
```

### **4. Template Method Pattern**
Base email template with abstract methods:
```typescript
export abstract class BaseEmailTemplate<T extends EmailTemplateData> {
  protected abstract generateHtml(data: T): string;
  protected abstract getSubject(data: T): string;
  abstract getType(): EmailTemplateType;
}
```

### **5. Error Handling**
- Email failures don't break webhook processing
- Comprehensive error logging
- Database tracking of failed emails

---

## 📧 Email Templates

### **Payment Settled Email**
**Subject:** `✅ Payment Settled - {amount} {currency}`

**Features:**
- Success badge with checkmark
- Transaction details table
- Exchange rate information
- Bank account details
- Next steps section
- Dashboard CTA button
- NedaPay logo (https://nedapay.xyz/NEDApayLogo.png)

### **Payment Refunded Email**
**Subject:** `🔄 Payment Refunded - {amount} {currency}`

**Features:**
- Refund badge
- Transaction details
- Optional refund reason
- What happens next section
- Dashboard CTA button
- Support information
- NedaPay logo

### **KYC Status Emails**
Uses existing `KYCStatusEmailTemplate`:
- **Approved:** Green success theme
- **Rejected:** Red rejection theme with reason
- **Pending:** Yellow pending theme

---

## 🔐 Security Features

### **1. XSS Protection**
```typescript
protected escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
```

### **2. Email Validation**
- Checks if user exists before sending
- Checks if user has email address
- Aborts operation if no email (SmileID)
- Logs warnings for missing emails

### **3. Error Isolation**
- Email failures don't break webhooks
- Try-catch blocks around email sending
- Comprehensive error logging

---

## 📊 Database Tracking

All emails tracked in `EmailNotification` table:

```prisma
model EmailNotification {
  id                    String                      @id @default(cuid())
  userId                String?
  recipientEmail        String
  recipientName         String?
  type                  EmailNotificationType
  subject               String
  status                EmailNotificationStatus     @default(PENDING)
  providerMessageId     String?
  providerResponse      Json?
  errorMessage          String?
  retryCount            Int                         @default(0)
  maxRetries            Int                         @default(3)
  metadata              Json?
  createdAt             DateTime                    @default(now())
  sentAt                DateTime?
  deliveredAt           DateTime?
  failedAt              DateTime?
  user                  User?                       @relation(...)
}
```

**Tracked Information:**
- Email type (PAYMENT_SETTLED, PAYMENT_REFUNDED, KYC_STATUS_*)
- Recipient details
- Send status
- Provider message ID (from Resend)
- Metadata (transaction ID, amount, currency, etc.)
- Timestamps

---

## 🚀 Deployment Steps

### **1. Update Prisma Schema**
```bash
npx prisma generate
npx prisma migrate dev --name add_payment_email_types
```

### **2. Environment Variables**
Ensure these are set:
```bash
RESEND_API_KEY="re_your_api_key"
RESEND_FROM_EMAIL="noreply@nedapay.xyz"
RESEND_FROM_NAME="NedaPay"
```

### **3. Test Email Sending**
```bash
# Test payment settled email
curl -X POST http://localhost:3000/api/paycrest/webhook \
  -H "Content-Type: application/json" \
  -H "x-paycrest-signature: YOUR_SIGNATURE" \
  -d '{
    "event": "payment_order.settled",
    "data": {
      "id": "test-123",
      "amount": "100.00",
      "rate": "1500",
      "fromAddress": "0x123...",
      "recipient": {
        "currency": "NGN",
        "accountName": "John Doe",
        "accountIdentifier": "1234567890",
        "institution": "FBNINGLA"
      }
    }
  }'
```

### **4. Verify Email Delivery**
Check database:
```sql
SELECT * FROM email_notifications 
WHERE type IN ('PAYMENT_SETTLED', 'PAYMENT_REFUNDED', 'KYC_STATUS_APPROVED')
ORDER BY createdAt DESC 
LIMIT 10;
```

---

## 🧪 Testing Checklist

### **Payment Notifications**
- [ ] Payment settled email sent on webhook
- [ ] Payment refunded email sent on webhook
- [ ] Email contains correct transaction details
- [ ] Email contains correct bank account info
- [ ] Email contains NedaPay logo
- [ ] Email is mobile-responsive
- [ ] Email tracked in database
- [ ] Webhook doesn't fail if email fails

### **KYC Notifications**
- [ ] KYC approved email sent on success
- [ ] KYC rejected email sent on failure
- [ ] Email contains rejection reason (if failed)
- [ ] Email only sent if user has email address
- [ ] Email tracked in database
- [ ] Webhook doesn't fail if email fails

### **Security**
- [ ] User input is HTML-escaped
- [ ] No XSS vulnerabilities
- [ ] Email addresses validated
- [ ] Error messages don't expose sensitive data

---

## 📈 Monitoring & Logging

### **Success Logs**
```
[PaymentNotificationService] KYC status email sent to user@example.com
[SmileIDService] KYC status email sent to user@example.com
```

### **Warning Logs**
```
[PaymentNotificationService] User not found for wallet: 0x123...
[PaymentNotificationService] User abc123 has no email address
[SmileIDService] User has no email, skipping notification
```

### **Error Logs**
```
Failed to send payment settled email: Error message
[SmileIDService] Failed to send KYC status email: Error message
```

---

## 🔄 Future Enhancements

1. **Email Templates**
   - Add more customization options
   - Support multiple languages
   - Add email preferences

2. **Retry Logic**
   - Implement automatic retry for failed emails
   - Use job queue (Bull, BullMQ)
   - Exponential backoff

3. **Analytics**
   - Track email open rates
   - Track click-through rates
   - A/B testing for templates

4. **User Preferences**
   - Allow users to opt-out of certain emails
   - Email frequency settings
   - Notification preferences

---

## 📚 Related Documentation

- [Email Service README](../app/utils/email/README.md)
- [Resend Provider Documentation](../app/utils/email/providers/resend.ts)
- [SmileID Integration](./SMILEID_STATUS_FLOW.md)
- [Paycrest Webhook](../app/api/paycrest/webhook/route.ts)

---

## ✅ Summary

Successfully implemented comprehensive email notification system with:
- ✅ Payment settlement notifications
- ✅ Payment refund notifications
- ✅ KYC verification status notifications
- ✅ Professional email templates with NedaPay branding
- ✅ Database tracking for all emails
- ✅ SOLID principles and best practices
- ✅ XSS protection and security measures
- ✅ Error handling to prevent webhook failures
- ✅ Email requirement checks for SmileID

**Status:** ✅ Ready for testing and deployment

**Next Steps:**
1. Run `npx prisma generate` to update Prisma client
2. Run `npx prisma migrate dev` to apply schema changes
3. Configure Resend API key in environment variables
4. Test email sending in development
5. Deploy to production

---

For questions or issues, contact the development team.
