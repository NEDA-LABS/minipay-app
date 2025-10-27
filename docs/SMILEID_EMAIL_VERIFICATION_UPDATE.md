# SmileID Email Verification Update

## Overview

Updated the SmileID KYC verification flow to require email verification **before** users can start the KYC process, following the same pattern as the existing Sumsub implementation.

---

## ✅ Changes Implemented

### 1. **SmileIDVerificationFlow Component** (`app/components/kyc/smile-id/SmileIDVerificationFlow.tsx`)

#### Added Email Verification Check

**New Imports:**
```typescript
import { useLinkAccount } from '@privy-io/react-auth';
import { useUserSync } from '@/hooks/useUserSync';
import toast from 'react-hot-toast';
```

**New State Variables:**
```typescript
const { hasEmail, isLoading: userSyncLoading } = useUserSync();
const { linkEmail } = useLinkAccount({
  onSuccess: () => {
    toast.success('Email linked successfully!');
    window.location.reload();
  },
  onError: (error) => {
    console.error('Email linking failed:', error);
    toast.error('Failed to link email. Please try again.');
  },
});

const [linkingEmail, setLinkingEmail] = useState<boolean>(false);
const [initialLoadComplete, setInitialLoadComplete] = useState<boolean>(false);
```

#### Updated Flow Logic

**Before:**
- Component immediately checked verification status
- Users could start KYC without email

**After:**
- Component waits for user sync to complete
- Checks if user has email
- Shows email requirement screen if no email
- Only proceeds to KYC after email is verified

**New useEffect for Initial Load:**
```typescript
useEffect(() => {
  if (!user || userSyncLoading) return;

  const timer = setTimeout(() => {
    setInitialLoadComplete(true);
  }, 1000); // Minimum 1 second wait to prevent flash

  return () => clearTimeout(timer);
}, [user, userSyncLoading]);
```

**Updated Verification Status Check:**
```typescript
useEffect(() => {
  if (!initialLoadComplete || !hasEmail) return;
  checkVerificationStatus();
}, [initialLoadComplete, hasEmail]);
```

#### New Email Requirement UI

When user doesn't have email, shows:

```tsx
<Card className={`${className} bg-slate-900/90 border-slate-700 !rounded-3xl`}>
  <CardHeader>
    <CardTitle className="flex items-center gap-2 text-white">
      <span className="text-base">Email Verification Required</span>
    </CardTitle>
    <CardDescription className="text-slate-300">
      Please add and verify your email address to continue with identity verification
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-6">
    {/* Info box explaining why email is needed */}
    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div className="bg-blue-500/20 rounded-full h-12 w-12 flex items-center justify-center flex-shrink-0">
          {/* Email icon SVG */}
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-blue-200 mb-2">
            Why do we need your email?
          </h3>
          <p className="text-sm text-blue-100/80 leading-relaxed">
            Your email address is required to send you important updates about your KYC verification status, 
            including approval or rejection notifications. This helps ensure the security of your account.
          </p>
        </div>
      </div>
    </div>

    {/* Add Email Button */}
    <Button
      onClick={handleEmailLink}
      disabled={linkingEmail}
      className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {linkingEmail ? (
        <span className="flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Verifying Email...
        </span>
      ) : (
        'Add Email Address'
      )}
    </Button>

    <p className="text-slate-400 text-sm text-center leading-relaxed">
      You'll receive a verification code to confirm your email address. 
      The process typically takes less than a minute.
    </p>
  </CardContent>
</Card>
```

### 2. **Removed Wallet Signature Requirement**

**Before:**
```typescript
const startVerification = async () => {
  const walletAddress = user?.wallet?.address;
  
  if (!walletAddress || !selectedCountry || !selectedIdType) {
    console.error('Missing required data:', { walletAddress, selectedCountry, selectedIdType });
    return;
  }

  setVerificationState({ status: 'loading' });

  try {
    // Generate nonce and sign message
    const nonce = Math.random().toString(36).substring(7);
    const message = `I accept the KYC Policy and hereby request an identity verification check for ${walletAddress} with nonce ${nonce}`;
    
    if (!message || message.trim() === '') {
      throw new Error('Message cannot be empty');
    }
    
    const signature = await signMessage({ message });

    // Request verification
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Authentication required. Please sign in again.');
    }
    
    const response = await fetch('/api/kyc/smile-id/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        signature,
        nonce,
        country: selectedCountry,
        idType: selectedIdType,
      }),
    });
```

**After:**
```typescript
const startVerification = async () => {
  if (!selectedCountry || !selectedIdType) {
    console.error('Missing required data:', { selectedCountry, selectedIdType });
    return;
  }

  setVerificationState({ status: 'loading' });

  try {
    // Request verification (no signature needed)
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Authentication required. Please sign in again.');
    }
    
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

**Key Changes:**
- ✅ Removed `signMessage` from Privy hook
- ✅ Removed nonce generation
- ✅ Removed message construction
- ✅ Removed signature from API request
- ✅ Removed wallet address requirement
- ✅ Simplified button disabled condition

---

## 🎯 User Flow

### Before
1. User opens SmileID KYC page
2. Selects country and ID type
3. Signs message with wallet
4. Starts verification
5. ❌ No email notification sent

### After
1. User opens SmileID KYC page
2. ✅ **System checks if user has email**
3. ✅ **If no email: Shows email requirement screen**
4. ✅ **User adds and verifies email via Privy**
5. ✅ **Page reloads with email verified**
6. Selects country and ID type
7. Starts verification (no wallet signature needed)
8. ✅ **Email notifications sent on KYC status changes**

---

## 📧 Email Integration Benefits

### 1. **Automatic Notifications**
Users receive emails when:
- KYC is approved ✅
- KYC is rejected ❌
- KYC requires additional information 📄
- KYC is under manual review ⏳

### 2. **Better User Experience**
- Users don't need to constantly check dashboard
- Clear communication about verification status
- Professional branded emails

### 3. **Audit Trail**
- All emails tracked in `EmailNotification` table
- Retry logic for failed emails
- Provider message IDs for debugging

---

## 🔄 Comparison with Sumsub

Both implementations now follow the **exact same pattern**:

| Feature | Sumsub | SmileID |
|---------|--------|---------|
| Email check before KYC | ✅ | ✅ |
| Email requirement UI | ✅ | ✅ |
| Privy email linking | ✅ | ✅ |
| Loading states | ✅ | ✅ |
| Minimum wait time | ✅ 1.5s | ✅ 1.0s |
| Auto-reload after email | ✅ | ✅ |
| Toast notifications | ✅ | ✅ |

---

## 🧪 Testing Checklist

### Email Verification Flow
- [ ] User without email sees email requirement screen
- [ ] "Add Email Address" button triggers Privy email flow
- [ ] Success toast shows after email verification
- [ ] Page reloads after successful email link
- [ ] Error toast shows if email linking fails
- [ ] Loading state shows during email verification

### KYC Flow
- [ ] User with email can proceed to country selection
- [ ] Country and ID type selection works
- [ ] Start verification button enabled when both selected
- [ ] No wallet signature prompt appears
- [ ] Verification request succeeds
- [ ] Status polling works correctly

### Email Notifications
- [ ] Email sent when KYC approved
- [ ] Email sent when KYC rejected
- [ ] Email sent when KYC pending
- [ ] Email sent when additional info required
- [ ] Emails tracked in database
- [ ] Failed emails can be retried

---

## 🚀 Deployment Notes

### Prerequisites
1. ✅ Prisma schema updated with email tracking
2. ✅ Email service integrated
3. ✅ Resend API key configured
4. ✅ SmileID service refactored to use Privy ID

### Migration Steps
1. Run `npx prisma generate` to update Prisma client
2. Run `npx prisma migrate dev` to apply schema changes
3. Deploy updated components
4. Test email flow in staging
5. Monitor email delivery in production

### Environment Variables Required
```bash
# Resend (for email notifications)
RESEND_API_KEY="re_your_api_key"
RESEND_FROM_EMAIL="noreply@nedapay.com"
RESEND_FROM_NAME="NedaPay"
RESEND_KYC_EMAIL="kyc@nedapay.com"

# SmileID
SMILE_ID_PARTNER_ID="your_partner_id"
SMILE_ID_API_KEY="your_api_key"
SMILE_ID_BASE_URL="https://api.smileidentity.com"
SMILE_ID_WEBHOOK_SECRET="your_webhook_secret"
```

---

## 📝 Related Documentation

- [SmileID Email Integration Guide](./SMILEID_EMAIL_INTEGRATION.md)
- [Email Service README](../app/utils/email/README.md)
- [Email Service Migration Guide](./EMAIL_SERVICE_MIGRATION.md)
- [Sumsub Verification Page](../app/verification/page.tsx) - Reference implementation

---

## ✨ Summary

The SmileID KYC flow now:
- ✅ **Requires email verification before starting KYC**
- ✅ **Follows the same UX pattern as Sumsub**
- ✅ **Removes unnecessary wallet signature requirement**
- ✅ **Sends automatic email notifications**
- ✅ **Provides better user experience**
- ✅ **Maintains comprehensive audit trail**

**Status**: ✅ Complete and ready for testing

---

For questions or issues, refer to the comprehensive integration guide or contact the development team.
