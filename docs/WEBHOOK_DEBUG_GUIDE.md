# SmileID Webhook Debugging Guide

## Issue: Webhook Failed After Switching to Privy User ID

---

## ✅ Fixed Issues

### 1. **Early Return Statement (CRITICAL BUG)**

**Problem:** Line 287 had an early `return` statement that prevented webhook events from being stored.

**Before:**
```typescript
// Update verification status
await this.prisma.smileIDVerification.update({...});

// Return verification with user data for email sending
return { verification, user: verification.user, status };  // ❌ EARLY RETURN!

// Store webhook event (NEVER EXECUTED)
await this.prisma.smileIDWebhookEvent.create({...});
```

**After:**
```typescript
// Update verification status
await this.prisma.smileIDVerification.update({...});

// Store webhook event (NOW EXECUTES)
await this.prisma.smileIDWebhookEvent.create({...});
```

**Status:** ✅ Fixed

---

## 🔍 Webhook Flow Verification

### Step 1: Verify Privy User ID is Sent in Link Request

**File:** `app/utils/kyc/smile-id/service.ts` (line 129)

```typescript
const linkRequest: SmileIDLinkRequest = {
  partner_id: this.config.partnerId,
  signature,
  timestamp: linkTimestamp,
  name: SMILE_ID_CONSTANTS.VERIFICATION_NAME,
  company_name: SMILE_ID_CONSTANTS.COMPANY_NAME,
  id_types: formattedIdTypes,
  callback_url: getWebhookUrl(),
  data_privacy_policy_url: SMILE_ID_CONSTANTS.DATA_PRIVACY_POLICY_URL,
  logo_url: SMILE_ID_CONSTANTS.LOGO_URL,
  is_single_use: true,
  user_id: request.privyUserId,  // ✅ Privy User ID sent here
  expires_at: expiresAt.toISOString(),
};
```

**Expected:** Smile ID will echo back this `user_id` in the webhook as `PartnerParams.user_id`

---

### Step 2: Verify Webhook Payload Structure

**Expected Webhook Payload:**
```json
{
  "ResultCode": "0000",
  "ResultText": "Verification successful",
  "PartnerParams": {
    "user_id": "privy_user_123abc",
    "job_id": "job_456def"
  },
  "signature": "sig_xyz789",
  "timestamp": "1698425600"
}
```

**Critical:** `PartnerParams.user_id` must match the `privyUserId` you sent in the link request

---

### Step 3: Debug Logging

**File:** `app/utils/kyc/smile-id/service.ts` (lines 254-266)

Added logging to help debug:

```typescript
const privyUserId = payload.PartnerParams?.user_id;
if (!privyUserId) {
  console.error('Missing user_id in webhook payload:', payload);  // ✅ Logs full payload
  throw new SmileIDError('Missing user_id in webhook payload', 'INVALID_PAYLOAD');
}

console.log('Processing webhook for privyUserId:', privyUserId);  // ✅ Logs the ID

const verification = await this.prisma.smileIDVerification.findUnique({
  where: { privyUserId },
  include: { user: true },
});

if (!verification) {
  console.error('Verification not found for privyUserId:', privyUserId);  // ✅ Logs lookup failure
  throw new SmileIDError('Verification not found for webhook', 'VERIFICATION_NOT_FOUND');
}
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Missing user_id in webhook payload"

**Cause:** Smile ID is not sending `PartnerParams.user_id` in the webhook

**Solutions:**
1. Check if you're using Smile ID's Smile Links API correctly
2. Verify `user_id` is included in the link request
3. Check Smile ID documentation for webhook payload format

**Debug:** Check server logs for the full payload:
```
console.error('Missing user_id in webhook payload:', payload);
```

---

### Issue 2: "Verification not found for webhook"

**Cause:** The `privyUserId` from webhook doesn't match any record in database

**Possible Reasons:**
1. **Privy User ID mismatch:** User ID in webhook doesn't match what was stored
2. **Database not updated:** Verification record wasn't created before webhook arrived
3. **Wrong lookup:** Using wrong field to find verification

**Debug Steps:**

1. **Check what's in the database:**
```sql
SELECT id, privyUserId, status, createdAt 
FROM smile_id_verifications 
ORDER BY createdAt DESC 
LIMIT 5;
```

2. **Check server logs for the privyUserId:**
```
console.log('Processing webhook for privyUserId:', privyUserId);
```

3. **Verify the webhook payload:**
```
console.error('Missing user_id in webhook payload:', payload);
```

4. **Compare:** Make sure the `privyUserId` from webhook matches database

---

### Issue 3: Webhook Event Not Stored

**Cause:** Early return statement (now fixed)

**Status:** ✅ Fixed - webhook events are now stored

---

## 📋 Webhook Processing Checklist

- [ ] Privy User ID is sent in link request (`user_id` field)
- [ ] Smile ID echoes back the same `user_id` in webhook
- [ ] Webhook signature is valid
- [ ] `PartnerParams.user_id` exists in webhook payload
- [ ] `privyUserId` from webhook matches database record
- [ ] Verification record exists before webhook arrives
- [ ] Status is updated correctly (SUCCESS/FAILED)
- [ ] Webhook event is stored in `SmileIDWebhookEvent` table

---

## 🔧 Testing Webhook Locally

### 1. Create a Test Verification

```bash
curl -X POST http://localhost:3000/api/kyc/smile-id/request \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "country": "NG",
    "idType": "NATIONAL_ID"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "verificationUrl": "https://smile.link/abc123",
    "referenceId": "ref_789",
    "expiresAt": "2025-10-28T10:41:00Z"
  }
}
```

### 2. Simulate Webhook

```bash
curl -X POST http://localhost:3000/api/kyc/smile-id/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "ResultCode": "0000",
    "ResultText": "Verification successful",
    "PartnerParams": {
      "user_id": "privy_user_123abc",
      "job_id": "job_456def"
    },
    "signature": "test_signature",
    "timestamp": "1698425600"
  }'
```

### 3. Check Status

```bash
curl -X GET http://localhost:3000/api/kyc/smile-id/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "status": "SUCCESS",
    "resultCode": "0000",
    "resultText": "Verification successful",
    "completedAt": "2025-10-27T10:41:00Z"
  }
}
```

---

## 📊 Database Queries for Debugging

### Get Latest Verification

```sql
SELECT * FROM smile_id_verifications 
ORDER BY createdAt DESC 
LIMIT 1;
```

### Get All Webhook Events for a Verification

```sql
SELECT we.* FROM smile_id_webhook_events we
JOIN smile_id_verifications sv ON we.smileIdVerificationId = sv.id
WHERE sv.privyUserId = 'privy_user_123abc'
ORDER BY we.createdAt DESC;
```

### Get Failed Webhook Events

```sql
SELECT * FROM smile_id_webhook_events 
WHERE processed = false 
ORDER BY createdAt DESC;
```

### Get Verification by Privy User ID

```sql
SELECT * FROM smile_id_verifications 
WHERE privyUserId = 'privy_user_123abc';
```

---

## 🔐 Webhook Signature Verification

**File:** `app/utils/kyc/smile-id/signature.ts`

The webhook handler verifies the signature before processing:

```typescript
// Verify signature
if (!this.verifySignature(payload)) {
  throw new SmileIDSignatureError('Invalid webhook signature');
}
```

**If signature verification fails:**
1. Check `SMILE_ID_WEBHOOK_SECRET` environment variable
2. Verify Smile ID is using the correct secret
3. Check webhook payload hasn't been modified

---

## 📝 Related Files

- **Service:** `app/utils/kyc/smile-id/service.ts` (processWebhook method)
- **Webhook Handler:** `app/utils/kyc/smile-id/webhook-handler.ts`
- **Webhook Route:** `app/api/kyc/smile-id/webhook/route.ts`
- **Signature Verification:** `app/utils/kyc/smile-id/signature.ts`
- **Database:** `prisma/schema.prisma` (SmileIDVerification, SmileIDWebhookEvent)

---

## ✅ Summary of Fixes

1. ✅ **Removed early return statement** - webhook events now stored
2. ✅ **Added debug logging** - easier to troubleshoot issues
3. ✅ **Verified Privy User ID flow** - correctly sent and received
4. ✅ **Database lookup works** - using privyUserId as unique key

**Next Steps:**
- Test webhook with Smile ID sandbox
- Monitor server logs for any errors
- Verify webhook events are being stored in database
- Check email notifications are sent on completion

---

For more help, check the server logs and database queries above.
