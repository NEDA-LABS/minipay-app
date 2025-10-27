# SmileID Status Update Flow

## Overview

This document explains how SmileID verification status is updated and fetched in the NedaPay merchant portal.

---

## 📊 Database Table: `SmileIDVerification`

**Location:** `prisma/schema.prisma` (lines 535-573)

**Table Name:** `smile_id_verifications`

### Schema

```prisma
model SmileIDVerification {
  id                    String                      @id @default(cuid())
  userId                String
  privyUserId           String                      @unique // Primary lookup key
  platform              String                      @default("smile_id")
  platformRef           String                      // Smile ID reference ID
  verificationUrl       String                      // Smile Link URL
  status                SmileIDVerificationStatus   @default(PENDING)
  
  // Verification details
  country               String?                     // ISO country code
  idType                String?                     // ID document type
  verificationMethod    SmileIDVerificationMethod?  // Verification method used
  
  // Results
  resultCode            String?                     // Smile ID result code
  resultText            String?                     // Smile ID result description
  
  // Email notification tracking
  emailSent             Boolean                     @default(false)
  emailSentAt           DateTime?
  
  // Timestamps
  expiresAt             DateTime                    // When verification URL expires
  createdAt             DateTime                    @default(now())
  updatedAt             DateTime                    @updatedAt
  submittedAt           DateTime?                   // When user submitted documents
  completedAt           DateTime?                   // When verification completed
  
  // Relations
  user                  User                        @relation(fields: [userId], references: [id], onDelete: Cascade)
  webhookEvents         SmileIDWebhookEvent[]
  
  @@index([privyUserId])
  @@index([userId])
  @@index([status])
  @@index([platformRef])
  @@map("smile_id_verifications")
}
```

### Status Values

```prisma
enum SmileIDVerificationStatus {
  PENDING   // Verification in progress
  SUCCESS   // Verification approved
  FAILED    // Verification rejected
  EXPIRED   // Verification URL expired
}
```

---

## 🔄 Status Update Flow

### 1️⃣ **Initial Status: PENDING**

When user starts verification:

```
POST /api/kyc/smile-id/request
  ↓
SmileIDService.requestVerification()
  ↓
Creates SmileIDVerification record with status = PENDING
  ↓
Returns verification URL to client
```

**Database Insert:**
```sql
INSERT INTO smile_id_verifications (
  userId, privyUserId, platform, platformRef, verificationUrl, 
  status, country, idType, expiresAt, createdAt, updatedAt
) VALUES (
  'user_123', 'privy_user_456', 'smile_id', 'ref_789', 
  'https://smile.link/abc123', 'PENDING', 'NG', 'NATIONAL_ID',
  NOW() + INTERVAL '24 hours', NOW(), NOW()
);
```

---

### 2️⃣ **Webhook Update: SUCCESS or FAILED**

When Smile ID completes verification, it sends a webhook:

```
POST /api/kyc/smile-id/webhook (from Smile ID servers)
  ↓
SmileIDWebhookHandler.handleWebhook()
  ↓
Verify webhook signature
  ↓
SmileIDService.processWebhook()
  ↓
Update SmileIDVerification status based on ResultCode
  ↓
Create SmileIDWebhookEvent record
```

**Status Determination Logic:**

```typescript
// From service.ts lines 266-273
let status: 'SUCCESS' | 'FAILED' | 'PENDING' = 'PENDING';

if (SMILE_ID_SUCCESS_CODES.includes(payload.ResultCode)) {
  status = 'SUCCESS';
} else if (SMILE_ID_FAILED_CODES.includes(payload.ResultCode)) {
  status = 'FAILED';
}
```

**Database Update:**
```sql
UPDATE smile_id_verifications SET
  status = 'SUCCESS',  -- or 'FAILED'
  resultCode = '0000',  -- Smile ID result code
  resultText = 'Verification successful',
  completedAt = NOW(),
  updatedAt = NOW()
WHERE privyUserId = 'privy_user_456';
```

**Webhook Event Stored:**
```sql
INSERT INTO smile_id_webhook_events (
  smileIdVerificationId, resultCode, resultText, payload, 
  signature, processed, processedAt, createdAt
) VALUES (
  'verification_id_123', '0000', 'Verification successful',
  '{...full webhook payload...}', 'sig_abc123', true, NOW(), NOW()
);
```

---

### 3️⃣ **Expiration Check: EXPIRED**

When client polls status and verification is still PENDING but expired:

```
GET /api/kyc/smile-id/status
  ↓
SmileIDService.checkStatus(privyUserId)
  ↓
Check if status === PENDING && expiresAt <= NOW()
  ↓
Update status to EXPIRED
  ↓
Return EXPIRED status to client
```

**Status Check Logic:**

```typescript
// From service.ts lines 197-206
if (verification.status === 'PENDING' && verification.expiresAt <= new Date()) {
  status = 'EXPIRED';
  
  // Update status in database
  await this.prisma.smileIDVerification.update({
    where: { id: verification.id },
    data: { status: 'EXPIRED' },
  });
}
```

**Database Update:**
```sql
UPDATE smile_id_verifications SET
  status = 'EXPIRED',
  updatedAt = NOW()
WHERE privyUserId = 'privy_user_456' 
  AND status = 'PENDING' 
  AND expiresAt <= NOW();
```

---

## 📡 Status Fetch Flow

### Frontend Polling

**Component:** `SmileIDVerificationFlow.tsx` (lines 46-59)

```typescript
// Poll verification status when pending
useEffect(() => {
  let interval: NodeJS.Timeout;
  
  if (verificationState.status === 'pending') {
    interval = setInterval(() => {
      checkVerificationStatus();
    }, 5000); // Poll every 5 seconds
  }

  return () => {
    if (interval) clearInterval(interval);
  };
}, [verificationState.status]);
```

### API Endpoint

**Route:** `GET /api/kyc/smile-id/status`

**Handler:** `app/api/kyc/smile-id/status/route.ts` (lines 13-73)

```typescript
export async function GET(request: NextRequest) {
  // 1. Get user from request (Privy ID from JWT)
  const privyUserId = await getUserIdFromRequest(request);
  
  // 2. Find user in database
  const user = await prisma.user.findUnique({
    where: { privyUserId },
  });
  
  // 3. Create Smile ID service instance
  const smileIdService = new SmileIDService(prisma);
  
  // 4. Check verification status
  const status = await smileIdService.checkStatus(user.wallet);
  
  // 5. Return status to client
  return NextResponse.json({
    success: true,
    data: status,
  });
}
```

### Service Method

**Method:** `SmileIDService.checkStatus(privyUserId)` (lines 185-224)

```typescript
async checkStatus(privyUserId: string): Promise<SmileIDVerificationStatus> {
  // 1. Query database by privyUserId
  const verification = await this.prisma.smileIDVerification.findUnique({
    where: { privyUserId },
  });
  
  // 2. Check if expired
  if (verification.status === 'PENDING' && verification.expiresAt <= new Date()) {
    // Update to EXPIRED
    await this.prisma.smileIDVerification.update({
      where: { id: verification.id },
      data: { status: 'EXPIRED' },
    });
    status = 'EXPIRED';
  }
  
  // 3. Return status object
  return {
    status,
    verificationUrl: verification.verificationUrl,
    resultCode: verification.resultCode,
    resultText: verification.resultText,
    completedAt: verification.completedAt,
  };
}
```

---

## 🗂️ Related Tables

### `SmileIDWebhookEvent`

**Purpose:** Track all webhook events from Smile ID

**Table Name:** `smile_id_webhook_events`

```prisma
model SmileIDWebhookEvent {
  id                    String                @id @default(cuid())
  smileIdVerificationId String                // Foreign key to SmileIDVerification
  correlationId         String?               // For idempotency
  resultCode            String                // Smile ID result code
  resultText            String?               // Result description
  payload               Json                  // Full webhook payload
  signature             String                // Webhook signature for validation
  processed             Boolean               @default(false)
  processedAt           DateTime?
  errorMessage          String?               // If processing failed
  createdAt             DateTime              @default(now())
  
  // Relations
  smileIdVerification   SmileIDVerification   @relation(...)
  
  @@index([smileIdVerificationId])
  @@index([resultCode])
  @@index([createdAt])
  @@map("smile_id_webhook_events")
}
```

---

## 📋 Complete Status Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│ User Starts Verification                                    │
│ POST /api/kyc/smile-id/request                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ SmileIDVerification        │
        │ status = PENDING           │
        │ expiresAt = NOW + 24h      │
        └────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
   User completes      Client polls status
   verification        GET /api/kyc/smile-id/status
   on Smile ID         (every 5 seconds)
        │                         │
        │                         ▼
        │              ┌──────────────────────┐
        │              │ Check if expired     │
        │              │ expiresAt <= NOW?    │
        │              └──────────────────────┘
        │                    │         │
        │              NO    │         │    YES
        │                    │         ▼
        │                    │   status = EXPIRED
        │                    │   (update DB)
        │                    │
        ▼                    ▼
   Smile ID sends      Return EXPIRED
   webhook with        to client
   ResultCode
        │
        ▼
   POST /api/kyc/smile-id/webhook
        │
        ▼
   Verify signature
        │
        ▼
   processWebhook()
        │
        ├─ SUCCESS_CODES?  ──▶ status = SUCCESS
        │
        └─ FAILED_CODES?   ──▶ status = FAILED
                │
                ▼
   Update SmileIDVerification
   Update SmileIDWebhookEvent
   Send email notification
                │
                ▼
   Client polls and gets
   SUCCESS or FAILED status
```

---

## 🔍 Query Examples

### Get Current Verification Status

```sql
SELECT 
  id, privyUserId, status, resultCode, resultText, 
  expiresAt, completedAt, createdAt
FROM smile_id_verifications
WHERE privyUserId = 'privy_user_456'
ORDER BY createdAt DESC
LIMIT 1;
```

### Get All Webhook Events for a Verification

```sql
SELECT 
  we.id, we.resultCode, we.resultText, we.processed, 
  we.processedAt, we.createdAt
FROM smile_id_webhook_events we
JOIN smile_id_verifications sv ON we.smileIdVerificationId = sv.id
WHERE sv.privyUserId = 'privy_user_456'
ORDER BY we.createdAt DESC;
```

### Get Pending Verifications Expiring Soon

```sql
SELECT 
  id, privyUserId, expiresAt, createdAt
FROM smile_id_verifications
WHERE status = 'PENDING'
  AND expiresAt <= NOW() + INTERVAL '1 hour'
  AND expiresAt > NOW()
ORDER BY expiresAt ASC;
```

### Get All Expired Verifications

```sql
SELECT 
  id, privyUserId, expiresAt, createdAt
FROM smile_id_verifications
WHERE status = 'EXPIRED'
ORDER BY expiresAt DESC;
```

---

## 🔐 Key Points

1. **Primary Lookup:** Uses `privyUserId` (Privy user ID) as unique identifier
2. **Status Source:** Status stored in `SmileIDVerification.status` field
3. **Updates Triggered By:**
   - Initial creation (PENDING)
   - Webhook from Smile ID (SUCCESS/FAILED)
   - Client polling (EXPIRED check)
4. **Webhook Events:** All webhooks tracked in `SmileIDWebhookEvent` for audit trail
5. **Expiration:** Automatically marked EXPIRED when `expiresAt <= NOW()` during status check
6. **Email Tracking:** `emailSent` and `emailSentAt` fields track notification delivery

---

## 📝 Related Files

- **Service:** `app/utils/kyc/smile-id/service.ts`
- **Webhook Handler:** `app/utils/kyc/smile-id/webhook-handler.ts`
- **API Routes:**
  - `app/api/kyc/smile-id/request/route.ts` (create)
  - `app/api/kyc/smile-id/status/route.ts` (fetch)
  - `app/api/kyc/smile-id/webhook/route.ts` (update)
- **Component:** `app/components/kyc/smile-id/SmileIDVerificationFlow.tsx`
- **Database:** `prisma/schema.prisma` (lines 520-596)

---

For questions or issues, refer to the SmileID integration documentation or contact the development team.
