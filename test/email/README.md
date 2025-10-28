# Email Testing Scripts

Test scripts for sending email notifications during development.

## 📋 Prerequisites

1. **Prisma Client Generated**
   ```bash
   npx prisma generate
   ```

2. **Environment Variables Set**
   ```bash
   RESEND_API_KEY=re_your_api_key
   RESEND_FROM_EMAIL=noreply@nedapay.xyz
   RESEND_FROM_NAME=NedaPay
   ```

3. **Database Running**
   Ensure your PostgreSQL database is running and accessible.

## 🧪 Available Tests

### 1. Payment Settled Email Test

**File:** `send-payment-settled-test.ts`

**What it tests:**
- Payment settlement notification
- Transaction details display
- Bank account information
- Exchange rate display
- Email tracking in database

**How to run:**
```bash
# 1. Update TEST_EMAIL in the file
# 2. Run the test
npx ts-node test/email/send-payment-settled-test.ts
```

### 2. Payment Refunded Email Test

**File:** `send-payment-refunded-test.ts`

**What it tests:**
- Payment refund notification
- Refund reason display
- Transaction details
- Email tracking in database

**How to run:**
```bash
# 1. Update TEST_EMAIL in the file
# 2. Run the test
npx ts-node test/email/send-payment-refunded-test.ts
```

## 🔧 Configuration

### Update Test Email

Open the test file and update the `TEST_EMAIL` constant:

```typescript
const TEST_EMAIL = 'your-email@example.com'; // ⚠️ UPDATE THIS!
```

### Test Wallet Address

The scripts use a default test wallet address. You can change it if needed:

```typescript
const TEST_WALLET_ADDRESS = '0x1234567890123456789012345678901234567890';
```

## 📊 What Happens During Test

1. **User Check/Creation**
   - Checks if test user exists with the wallet address
   - Creates user if doesn't exist
   - Updates email if different

2. **Email Sending**
   - Creates payment notification service
   - Sends email using Resend
   - Returns success/failure result

3. **Database Tracking**
   - Stores email notification in database
   - Tracks send status and timestamp
   - Records provider message ID

4. **Result Display**
   - Shows success/failure status
   - Displays message ID
   - Shows database tracking info

## ✅ Verification Steps

After running a test:

1. **Check Email Inbox**
   - Look for email from `noreply@nedapay.xyz`
   - Check spam folder if not in inbox
   - Verify email content and styling

2. **Check Database**
   ```sql
   SELECT * FROM email_notifications 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```

3. **Verify Content**
   - Transaction details are correct
   - Amounts and currency are correct
   - Links work properly
   - Logo displays correctly
   - Mobile responsive

## 🐛 Troubleshooting

### Error: RESEND_API_KEY not set

**Solution:** Add to your `.env` file:
```bash
RESEND_API_KEY=re_your_api_key
```

### Error: Please update TEST_EMAIL

**Solution:** Open the test file and change:
```typescript
const TEST_EMAIL = 'your-actual-email@example.com';
```

### Error: Database connection failed

**Solution:** 
1. Check if PostgreSQL is running
2. Verify DATABASE_URL in `.env`
3. Run `npx prisma generate`

### Email not received

**Possible causes:**
1. Check spam folder
2. Verify Resend API key is valid
3. Check Resend dashboard for delivery status
4. Verify sender domain is configured in Resend

### TypeScript errors

**Solution:**
```bash
# Regenerate Prisma client
npx prisma generate

# Install dependencies
npm install
```

## 📝 Example Output

```
╔════════════════════════════════════════════════════════════╗
║       Payment Settled Email Test                          ║
╚════════════════════════════════════════════════════════════╝

🚀 Starting Payment Settled Email Test...

📋 Step 1: Checking for test user...
✅ Test user found: clx123abc456

📧 Step 2: Sending payment settled email...
To: your-email@example.com
Transaction: test-tx-1698425600000
Amount: 100.00 NGN

📊 Step 3: Checking result...
✅ Email sent successfully!
📬 Message ID: abc123def456
✅ Email tracked in database
   - ID: clx789xyz012
   - Status: SENT
   - Sent At: 2025-10-28T01:00:00.000Z

✅ Test completed!

📝 Next Steps:
1. Check your email inbox: your-email@example.com
2. Check spam folder if not in inbox
3. Verify email content and styling
4. Check database: SELECT * FROM email_notifications ORDER BY created_at DESC LIMIT 1;
```

## 🔐 Security Notes

- Test scripts create/update users in your database
- Use a test database for development
- Don't commit API keys to version control
- Test emails are sent to real email addresses

## 📚 Related Documentation

- [Email Notifications Implementation](../../docs/EMAIL_NOTIFICATIONS_IMPLEMENTATION.md)
- [Email Service README](../../app/utils/email/README.md)
- [Resend Documentation](https://resend.com/docs)

---

**Need help?** Check the main documentation or contact the development team.
