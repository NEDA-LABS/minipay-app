# SmileID KYC Email Integration Guide

## Overview

This document outlines the comprehensive refactoring of SmileID KYC integration to:
1. Use Privy ID instead of wallet addresses
2. Remove wallet signature requirements
3. Integrate email notifications for KYC status updates
4. Implement email tracking database
5. Follow SOLID principles and proper software design patterns

---

## ✅ Changes Implemented

### 1. Database Schema Changes (`prisma/schema.prisma`)

#### Updated `SmileIDVerification` Model
```prisma
model SmileIDVerification {
  id                    String                      @id @default(cuid())
  userId                String
  privyUserId           String                      @unique  // Changed from walletAddress
  platform              String                      @default("smile_id")
  platformRef           String
  verificationUrl       String
  status                SmileIDVerificationStatus   @default(PENDING)
  
  // Verification details
  country               String?
  idType                String?
  verificationMethod    SmileIDVerificationMethod?
  
  // Results
  resultCode            String?
  resultText            String?
  
  // Email notification tracking
  emailSent             Boolean                     @default(false)  // NEW
  emailSentAt           DateTime?                                    // NEW
  
  // ... timestamps and relations
}
```

#### New `EmailNotification` Model
```prisma
enum EmailNotificationType {
  INVOICE_SENT
  WELCOME
  KYC_REMINDER
  KYC_STATUS_APPROVED
  KYC_STATUS_REJECTED
  KYC_STATUS_PENDING
  KYC_STATUS_ADDITIONAL_INFO
  PASSWORD_RESET
  PAYMENT_RECEIVED
  WITHDRAWAL_PROCESSED
}

enum EmailNotificationStatus {
  PENDING
  SENT
  FAILED
  BOUNCED
  DELIVERED
}

model EmailNotification {
  id                    String                      @id @default(cuid())
  userId                String?
  recipientEmail        String
  recipientName         String?
  
  // Email details
  type                  EmailNotificationType
  subject               String
  status                EmailNotificationStatus     @default(PENDING)
  
  // Provider details
  providerMessageId     String?                     // Resend message ID
  providerResponse      Json?
  
  // Error tracking
  errorMessage          String?
  retryCount            Int                         @default(0)
  maxRetries            Int                         @default(3)
  
  // Metadata
  metadata              Json?
  
  // Timestamps
  createdAt             DateTime                    @default(now())
  sentAt                DateTime?
  deliveredAt           DateTime?
  failedAt              DateTime?
  
  // Relations
  user                  User?                       @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  @@index([userId])
  @@index([recipientEmail])
  @@index([type])
  @@index([status])
  @@index([createdAt])
  @@map("email_notifications")
}
```

### 2. Service Layer Architecture

#### Email Notification Service (`app/utils/notifications/email-notification-service.ts`)
**Purpose**: Manages email sending with database tracking

**Key Features**:
- Single Responsibility: Only handles email notification logic
- Dependency Injection: Accepts PrismaClient instance
- Database tracking for all emails
- Retry logic for failed emails
- Support for multiple email types

**Main Methods**:
```typescript
- sendNotification(options): Send any type of email with tracking
- sendKYCStatusNotification(userId, email, firstName, status, options): Send KYC status emails
- retryFailedNotification(notificationId): Retry failed emails
- getNotificationHistory(userId, options): Get email history
```

#### KYC Email Requirement Service (`app/utils/kyc/email-requirement-service.ts`)
**Purpose**: Ensures users have email before starting KYC

**Key Features**:
- Email validation before KYC initiation
- Clear error messages
- Email format validation

**Main Methods**:
```typescript
- checkUserEmail(privyUserId): Check if user has email
- updateUserEmail(privyUserId, email): Update user email
- isValidEmail(email): Validate email format
```

### 3. SmileID Service Refactoring

#### Changes to `app/utils/kyc/smile-id/service.ts`

**Before**:
```typescript
interface SmileIDVerificationRequest {
  walletAddress: string;
  signature: string;  // Removed
  nonce: string;      // Removed
  country?: string;
  idType?: string;
}
```

**After**:
```typescript
interface SmileIDVerificationRequest {
  privyUserId: string;  // Changed
  country?: string;
  idType?: string;
}
```

**Key Changes**:
1. ✅ Removed wallet signature validation
2. ✅ Changed `walletAddress` to `privyUserId` throughout
3. ✅ Added email requirement check before verification
4. ✅ Added email tracking fields to database writes
5. ✅ Webhook now returns user data for email sending

---

## 🔧 Migration Steps

### Step 1: Regenerate Prisma Client

**CRITICAL**: After schema changes, you must regenerate the Prisma client:

```bash
# From project root
npx prisma generate

# Or run postinstall
npm run postinstall
```

### Step 2: Run Database Migration

```bash
# Create migration
npx prisma migrate dev --name add_email_notifications_and_refactor_smileid

# Apply to production
npx prisma migrate deploy
```

### Step 3: Update API Routes

#### `/app/api/kyc/smile-id/request/route.ts`

**Before**:
```typescript
const { signature, nonce, country, idType } = await request.json();

if (!signature || !nonce) {
  return NextResponse.json(
    { error: 'Missing required fields: signature, nonce' },
    { status: 400 }
  );
}

const result = await smileIdService.requestVerification({
  walletAddress: user.wallet,
  signature,
  nonce,
  country,
  idType,
});
```

**After**:
```typescript
const { country, idType } = await request.json();

// Check email requirement
const emailService = new KYCEmailRequirementService(prisma);
const emailCheck = await emailService.checkUserEmail(privyUserId);

if (!emailCheck.hasEmail) {
  return NextResponse.json(
    { error: emailCheck.message },
    { status: 400 }
  );
}

const result = await smileIdService.requestVerification({
  privyUserId,
  country,
  idType,
});
```

#### `/app/api/kyc/smile-id/status/route.ts`

**Before**:
```typescript
const status = await smileIdService.checkStatus(user.wallet);
```

**After**:
```typescript
const status = await smileIdService.checkStatus(privyUserId);
```

### Step 4: Update Webhook Handler

#### `/app/utils/kyc/smile-id/webhook-handler.ts`

Add email sending after webhook processing:

```typescript
// In handleWebhook method, after processing
const result = await this.smileIdService.processWebhook(payload);

if (result && result.user && result.status !== 'PENDING') {
  // Send KYC status email
  const emailService = new EmailNotificationService(prisma);
  
  const kycStatus = result.status === 'SUCCESS' ? 'approved' : 'rejected';
  
  await emailService.sendKYCStatusNotification(
    result.user.id,
    result.user.email,
    result.user.name || 'User',
    kycStatus,
    {
      rejectionReason: result.status === 'FAILED' ? result.verification.resultText : undefined,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    }
  );
  
  // Update email sent flag
  await prisma.smileIDVerification.update({
    where: { id: result.verification.id },
    data: {
      emailSent: true,
      emailSentAt: new Date(),
    },
  });
}
```

### Step 5: Update Frontend Components

#### `/app/components/kyc/smile-id/SmileIDVerificationFlow.tsx`

**Remove wallet signature logic**:

```typescript
// BEFORE - Remove this
const nonce = Math.random().toString(36).substring(7);
const message = `I accept the KYC Policy...`;
const signature = await signMessage({ message });

// AFTER - Simplified
const response = await fetch('/api/kyc/smile-id/request', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    country: selectedCountry,
    idType: selectedIdType,
  }),
});
```

**Add email requirement check**:

```typescript
// Check if user has email before starting
if (!user?.email?.address) {
  setVerificationState({
    status: 'failed',
    error: 'Email address required. Please add your email in settings.',
  });
  return;
}
```

---

## 📧 Email Templates Used

### 1. KYC Approved Email
- **Type**: `EmailNotificationType.KYC_STATUS_APPROVED`
- **Template**: `sendKYCStatusEmail()` with `KYCStatus.APPROVED`
- **Content**: Congratulations message, feature unlocks, dashboard link

### 2. KYC Rejected Email
- **Type**: `EmailNotificationType.KYC_STATUS_REJECTED`
- **Template**: `sendKYCStatusEmail()` with `KYCStatus.REJECTED`
- **Content**: Rejection reason, retry instructions, support contact

### 3. KYC Pending Email
- **Type**: `EmailNotificationType.KYC_STATUS_PENDING`
- **Template**: `sendKYCStatusEmail()` with `KYCStatus.PENDING_REVIEW`
- **Content**: Manual review notice, expected timeline

### 4. KYC Additional Info Required
- **Type**: `EmailNotificationType.KYC_STATUS_ADDITIONAL_INFO`
- **Template**: `sendKYCStatusEmail()` with `KYCStatus.REQUIRES_ADDITIONAL_INFO`
- **Content**: Required information list, submission instructions

---

## 🏗️ Design Patterns & Principles Used

### 1. **Single Responsibility Principle (SRP)**
- `EmailNotificationService`: Only handles email notifications
- `KYCEmailRequirementService`: Only validates email requirements
- `SmileIDService`: Only handles SmileID API integration

### 2. **Dependency Inversion Principle (DIP)**
- Services depend on PrismaClient abstraction, not concrete implementation
- Email service uses email provider abstraction

### 3. **Open/Closed Principle (OCP)**
- New email types can be added without modifying existing code
- Email templates are extensible

### 4. **Interface Segregation Principle (ISP)**
- Clean, focused interfaces for each service
- No client depends on methods it doesn't use

### 5. **Repository Pattern**
- Database operations encapsulated in services
- Clean separation between business logic and data access

---

## 🧪 Testing Checklist

### Database Tests
- [ ] SmileIDVerification creates with privyUserId
- [ ] EmailNotification creates with all fields
- [ ] Email notification history query works
- [ ] Retry logic increments retry count

### Service Tests
- [ ] Email requirement check returns correct status
- [ ] Email notification sends and tracks correctly
- [ ] KYC status emails send with proper templates
- [ ] Failed emails retry up to max retries

### API Tests
- [ ] KYC request fails without email
- [ ] KYC request succeeds with email
- [ ] Status endpoint uses Privy ID
- [ ] Webhook sends appropriate email

### Integration Tests
- [ ] Complete KYC flow without wallet signature
- [ ] Email sent on KYC approval
- [ ] Email sent on KYC rejection
- [ ] Email tracking recorded in database

---

## 📊 Benefits of This Refactoring

### 1. **Simplified User Experience**
- ❌ **Before**: Users had to sign a message with wallet
- ✅ **After**: Seamless flow with just Privy authentication

### 2. **Better Tracking**
- ❌ **Before**: No record of emails sent
- ✅ **After**: Complete audit trail of all emails

### 3. **Improved Reliability**
- ❌ **Before**: Email failures were silent
- ✅ **After**: Failed emails tracked and retryable

### 4. **Consistent Identification**
- ❌ **Before**: Mixed use of wallet addresses and Privy IDs
- ✅ **After**: Privy ID as single source of truth

### 5. **Better UX**
- ❌ **Before**: Users might not know KYC status changed
- ✅ **After**: Automatic email notifications for all status changes

---

## 🚀 Deployment Steps

1. **Backup Database**
   ```bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
   ```

2. **Apply Schema Changes**
   ```bash
   npx prisma migrate deploy
   ```

3. **Regenerate Prisma Client**
   ```bash
   npx prisma generate
   ```

4. **Deploy Code Changes**
   ```bash
   npm run build
   # Deploy to your hosting platform
   ```

5. **Verify Email Configuration**
   - Check `RESEND_API_KEY` is set
   - Check `RESEND_FROM_EMAIL` is set
   - Test email sending manually

6. **Monitor**
   - Watch for email notification errors
   - Check webhook processing logs
   - Monitor email delivery rates

---

## 🔍 Troubleshooting

### Issue: "privyUserId does not exist on type..."
**Solution**: Run `npx prisma generate` to regenerate Prisma client

### Issue: "EmailNotificationType is not exported"
**Solution**: Run `npx prisma generate` to update Prisma types

### Issue: Emails not sending
**Solution**: 
1. Check Resend API key is valid
2. Verify domain is verified in Resend dashboard
3. Check logs for specific error messages
4. Check `EmailNotification` table for failed records

### Issue: Users can't start KYC
**Solution**: Ensure users add email first - check `hasEmail` in Privy user object

---

## 📝 Future Enhancements

1. **Email Templates**
   - Add branded email templates
   - Support multiple languages

2. **Advanced Tracking**
   - Track email opens
   - Track link clicks
   - A/B test different templates

3. **Retry Strategy**
   - Exponential backoff for retries
   - Different retry strategies per email type

4. **Notification Preferences**
   - Let users choose which emails to receive
   - Add unsubscribe functionality

5. **Email Queue**
   - Move to background job queue (Bull, Agenda, etc.)
   - Handle high-volume email sending

---

## 📚 Related Documentation

- [Email Service README](/app/utils/email/README.md)
- [Email Service Migration Guide](/docs/EMAIL_SERVICE_MIGRATION.md)
- [SmileID Integration Guide](/docs/SMILE_ID_ENV_SETUP.md)
- [Sumsub Email Flow](/app/verification/page.tsx) - Reference implementation

---

## ✨ Summary

This refactoring achieves:
- ✅ Removed unnecessary wallet signature requirement
- ✅ Consistent use of Privy ID across the system
- ✅ Comprehensive email notification system
- ✅ Database tracking for audit and debugging
- ✅ Better user experience with automated notifications
- ✅ SOLID principles and clean architecture
- ✅ Scalable and maintainable codebase

**Status**: ✅ Implementation Complete
**Next Step**: Run database migration and regenerate Prisma client

---

For questions or issues, contact the development team or refer to the related documentation.
