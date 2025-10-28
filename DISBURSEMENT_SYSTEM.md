# Influencer Referral Disbursement System

## Overview
Complete multi-currency disbursement system for paying influencers their referral earnings through blockchain transactions.

## Features Implemented

### 1. Database Schema (`prisma/schema.prisma`)
**New Models:**
- `InfluencerEarning`: Tracks individual earnings from each eligible referral
  - Links to specific referral and transaction
  - Supports multiple currencies
  - Tracks disbursement status (PENDING, DISBURSED, CANCELLED)
  
- `InfluencerDisbursement`: Records actual payment transactions
  - Stores blockchain transaction hash
  - Links to multiple earnings being paid
  - Tracks disbursement status (PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED)
  - Records admin who initiated payment

**Relations:**
- `InfluencerProfile` has many earnings and disbursements
- `InfluencerEarning` belongs to one disbursement (when paid)

### 2. API Endpoints

#### `/api/admin/disbursement/token-info` (GET)
- Returns contract address, decimals, and chainId for a given currency
- Supports USDC, USDT, USD (mapped to USDC)
- Used by frontend to construct payment transactions

#### `/api/admin/disbursement/earnings` (GET)
- Fetches pending earnings for a specific influencer
- Groups earnings by currency with totals
- Returns earning IDs for batch processing
- Query param: `influencerProfileId`

#### `/api/admin/disbursement/record` (POST)
- Records completed disbursement in database
- Updates associated earnings to DISBURSED status
- Stores transaction hash and payment details
- Creates audit trail with admin user ID

**Body params:**
```json
{
  "influencerProfileId": "uuid",
  "amount": "10.5",
  "currency": "USDC",
  "transactionHash": "0x...",
  "recipientAddress": "0x...",
  "notes": "Optional notes",
  "earningIds": ["uuid1", "uuid2", ...]
}
```

### 3. Admin UI Components

#### `DisbursementDialog.tsx`
**Features:**
- Currency selection dropdown (shows pending balance per currency)
- Amount input with max validation
- Notes field for admin records
- Real-time transaction status (processing, success, error)
- Privy integration for sending ERC20 transfers
- Auto-constructs transfer data for contract calls

**Flow:**
1. Admin clicks "Pay" button on influencer row
2. Fetches pending earnings from API
3. Shows dialog with currency options
4. Admin reviews amount and adds notes
5. Sends blockchain transaction via Privy
6. Records disbursement in database
7. Updates earnings to DISBURSED status

#### `Referrals.tsx` (Admin Dashboard)
**Enhancements:**
- Added "Actions" column with "Pay" button
- Integrated DisbursementDialog
- Fetches pending earnings on Pay click
- Shows eligibility criteria notice
- Passes influencer data to dialog

### 4. Multi-Currency Support

**Current Tokens (Base Network):**
- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (6 decimals)
- USDT: `0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2` (6 decimals)
- USD: Mapped to USDC for off-ramp settlements

**Expandable:**
- Add more tokens in `token-info/route.ts` TOKEN_INFO mapping
- System automatically groups and displays by currency
- Each currency can be paid independently

## Next Steps

### 1. Run Prisma Migration
```bash
npx prisma migrate dev --name add_disbursement_system
npx prisma generate
```

This will:
- Create `influencer_earnings` table
- Create `influencer_disbursements` table
- Add enums for statuses
- Update relationships

### 2. Implement Earning Creation Logic

**When to create earnings:**
When a referred user completes their first off-ramp transaction AND:
- Referrer has completed KYC
- Referred user has completed KYC
- Transaction status is SETTLED

**Implementation location:**
Create a webhook handler or cron job that:
1. Monitors `OffRampTransaction` for SETTLED status
2. Checks if transaction is first for user (via referral)
3. Validates KYC eligibility (both parties)
4. Creates `InfluencerEarning` record with 10% commission

**Example code:**
```typescript
// In webhook/cron handler
async function processSettledTransaction(transaction: OffRampTransaction) {
  // Get referral for this user
  const referral = await prisma.referral.findFirst({
    where: { userId: transaction.userId },
    include: { influencerProfile: true }
  });

  if (!referral) return;

  // Check if first settled transaction
  const existingEarning = await prisma.influencerEarning.findFirst({
    where: { referralId: referral.id }
  });

  if (existingEarning) return; // Already paid

  // Validate KYC eligibility (both referrer and referral)
  const eligibilityCheck = await checkKYCEligibility(
    referral.influencerProfile.userId,
    transaction.userId
  );

  if (!eligibilityCheck.eligible) return;

  // Calculate 10% commission
  const amount = parseFloat(transaction.amount) * 0.1;

  // Create earning record
  await prisma.influencerEarning.create({
    data: {
      influencerProfileId: referral.influencerProfile.id,
      referralId: referral.id,
      amount: amount.toString(),
      currency: transaction.currency,
      transactionId: transaction.id,
      status: 'PENDING'
    }
  });
}
```

### 3. Add Admin Role Management

Currently, admin checks are commented out. Implement proper admin roles:

**Option A: Add isAdmin field to User model**
```prisma
model User {
  // ... existing fields
  isAdmin Boolean @default(false)
}
```

**Option B: Create separate Admin table**
```prisma
model Admin {
  id        String   @id @default(uuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id])
  role      AdminRole @default(MODERATOR)
  createdAt DateTime @default(now())
}

enum AdminRole {
  SUPER_ADMIN
  MODERATOR
  VIEWER
}
```

Then uncomment admin checks in:
- `/api/admin/disbursement/token-info/route.ts`
- `/api/admin/disbursement/record/route.ts`
- `/api/admin/disbursement/earnings/route.ts`

### 4. Add Disbursement History View

Create admin page to view past disbursements:
```typescript
// /app/admin/disbursements/page.tsx
// Shows:
// - List of all disbursements
// - Filter by influencer, status, date
// - Transaction hash links to block explorer
// - Breakdown of earnings included
```

### 5. Add Influencer Earnings Dashboard

Create influencer-facing page to view their earnings:
```typescript
// /app/earnings/page.tsx
// Shows:
// - Pending earnings by currency
// - Disbursement history
// - Total lifetime earnings
// - Estimated next payment date
```

### 6. Implement Automatic Disbursement Threshold

Add configuration for automatic payments:
```typescript
// When pending earnings reach threshold
const AUTO_PAY_THRESHOLD = {
  USDC: 100, // Auto-pay at $100
  USDT: 100
};

// Cron job checks and creates pending disbursements
// Admin reviews and approves batch payments
```

### 7. Add Multi-Chain Support

Extend to support payments on different networks:
```typescript
const TOKEN_INFO_BY_CHAIN = {
  base: {
    USDC: { address: '0x833...', decimals: 6, chainId: 8453 }
  },
  arbitrum: {
    USDC: { address: '0xaf88...', decimals: 6, chainId: 42161 }
  },
  // ... more chains
};
```

### 8. Add Transaction Monitoring

Monitor blockchain transactions for confirmation:
```typescript
// After sending transaction
// Poll for confirmation
// Update disbursement status
// Send notification to influencer
```

### 9. Security Enhancements

- **Rate limiting**: Prevent abuse of disbursement endpoints
- **2FA for admins**: Require additional auth for large payments
- **Transaction signing**: Use hardware wallet for production
- **Audit logging**: Log all disbursement actions
- **Withdrawal limits**: Set daily/monthly limits per influencer

### 10. Notifications

Send notifications for:
- New earning created (to influencer)
- Disbursement initiated (to influencer)
- Disbursement completed (to influencer)
- Failed transactions (to admin and influencer)

## Testing Checklist

### Database
- [ ] Run Prisma migration successfully
- [ ] Verify table creation
- [ ] Test foreign key constraints
- [ ] Seed test data

### API Endpoints
- [ ] `/token-info` returns correct contract addresses
- [ ] `/earnings` groups currencies correctly
- [ ] `/record` creates disbursement and updates earnings
- [ ] Admin authorization works
- [ ] Error handling for missing params

### UI Components
- [ ] DisbursementDialog opens with correct data
- [ ] Currency selection updates amount
- [ ] Pay button disabled when no wallet
- [ ] Transaction succeeds on testnet
- [ ] Success/error messages display correctly
- [ ] Dialog closes after success

### Integration
- [ ] Earnings created when transaction settles
- [ ] KYC eligibility checked correctly
- [ ] Only first transaction creates earning
- [ ] Multi-currency earnings tracked separately
- [ ] Disbursement updates all associated earnings

## Architecture Diagram

```
┌─────────────────┐
│ Off-Ramp TX     │
│ (SETTLED)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Eligibility     │
│ Check           │
│ - Referral KYC  │
│ - Invitee KYC   │
│ - First TX      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Create Earning  │
│ - 10% of amount │
│ - PENDING       │
│ - Link to TX    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Admin Dashboard │
│ - View earnings │
│ - Click Pay     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Disbursement    │
│ Dialog          │
│ - Select        │
│ - Review        │
│ - Send TX       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Blockchain TX   │
│ - ERC20 transfer│
│ - Privy/Wagmi   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Record          │
│ Disbursement    │
│ - Save TX hash  │
│ - Update status │
│ - Mark DISBURSED│
└─────────────────┘
```

## Security Considerations

1. **Smart Contract Security**: Ensure token contracts are legitimate
2. **Private Key Management**: Use secure wallet for admin payments
3. **Transaction Verification**: Verify TX on blockchain before marking complete
4. **Audit Trail**: All actions logged with timestamps and admin IDs
5. **Access Control**: Only authorized admins can access disbursement features
6. **Input Validation**: Validate all amounts, addresses, and currencies
7. **Error Recovery**: Handle failed transactions gracefully
8. **Gas Management**: Monitor gas prices, retry with higher gas if needed

## Compliance

- **Tax Reporting**: Export disbursement data for tax purposes
- **KYC/AML**: Ensure influencers meet KYC requirements
- **Record Keeping**: Maintain 7-year history of disbursements
- **Audit Support**: Provide reports for internal/external audits

## Support & Maintenance

- Monitor failed transactions daily
- Review pending earnings weekly
- Reconcile blockchain vs database monthly
- Update contract addresses when networks change
- Test on testnets before mainnet deployments
