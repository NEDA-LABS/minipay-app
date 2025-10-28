/**
 * Test Script: Send Payment Settled Email
 * 
 * Usage:
 * 1. Update the TEST_EMAIL constant with your email
 * 2. Run: npx ts-node test/email/send-payment-settled-test.ts
 */

import { PrismaClient, EmailNotificationType } from '@prisma/client';
import { createPaymentNotificationService } from '../../app/utils/email/services/index';

// ============================================================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================================================

const TEST_EMAIL = 'barackjimmy1@gmail.com'; // ⚠️ UPDATE THIS!
const TEST_WALLET_ADDRESS = '0x1234567890123456789012345678901234567890';

// ============================================================================
// TEST DATA
// ============================================================================

const testPaymentData = {
  transactionId: 'test-tx-' + Date.now(),
  walletAddress: TEST_WALLET_ADDRESS,
  amount: '100.00',
  currency: 'NGN',
  accountName: 'John Doe',
  accountNumber: '1234567890',
  institution: 'First Bank of Nigeria',
  rate: '1500.00',
};

// ============================================================================
// MAIN TEST FUNCTION
// ============================================================================

async function sendTestEmail() {
  const prisma = new PrismaClient();

  try {
    console.log('🚀 Starting Payment Settled Email Test...\n');

    // Step 1: Check if test user exists
    console.log('📋 Step 1: Checking for test user...');
    let user = await prisma.user.findUnique({
      where: { wallet: TEST_WALLET_ADDRESS },
    });

    // Step 2: Create test user if doesn't exist
    if (!user) {
      console.log('👤 Creating test user...');
      user = await prisma.user.create({
        data: {
          wallet: TEST_WALLET_ADDRESS,
          email: TEST_EMAIL,
          name: 'Test User',
          privyUserId: 'test-privy-' + Date.now(),
        },
      });
      console.log('✅ Test user created:', user.id);
    } else {
      console.log('✅ Test user found:', user.id);
      
      // Update email if different
      if (user.email !== TEST_EMAIL) {
        console.log('📧 Updating user email...');
        user = await prisma.user.update({
          where: { id: user.id },
          data: { email: TEST_EMAIL },
        });
        console.log('✅ Email updated to:', TEST_EMAIL);
      }
    }

    // Step 3: Send email
    console.log('\n📧 Step 2: Sending payment settled email...');
    console.log('To:', TEST_EMAIL);
    console.log('Transaction:', testPaymentData.transactionId);
    console.log('Amount:', testPaymentData.amount, testPaymentData.currency);

    const paymentNotificationService = createPaymentNotificationService(prisma);
    const result = await paymentNotificationService.sendPaymentSettledEmail(testPaymentData);

    // Step 4: Check result
    console.log('\n📊 Step 3: Checking result...');
    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log('📬 Message ID:', result.messageId);
      
      // Check database
      const emailNotification = await prisma.emailNotification.findFirst({
        where: {
          userId: user.id,
          type: EmailNotificationType.PAYMENT_SETTLED,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (emailNotification) {
        console.log('✅ Email tracked in database');
        console.log('   - ID:', emailNotification.id);
        console.log('   - Status:', emailNotification.status);
        console.log('   - Sent At:', emailNotification.sentAt);
      }
    } else {
      console.error('❌ Failed to send email');
      console.error('Error:', result.error?.message);
    }

    console.log('\n✅ Test completed!');
    console.log('\n📝 Next Steps:');
    console.log('1. Check your email inbox:', TEST_EMAIL);
    console.log('2. Check spam folder if not in inbox');
    console.log('3. Verify email content and styling');
    console.log('4. Check database: SELECT * FROM email_notifications ORDER BY created_at DESC LIMIT 1;');

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================================================
// RUN TEST
// ============================================================================

// Check if email is configured
if (!TEST_EMAIL || TEST_EMAIL.includes('your-email')) {
  console.error('❌ ERROR: Please update TEST_EMAIL in the script before running!');
  console.error('   Open test/email/send-payment-settled-test.ts and set your email address.');
  process.exit(1);
}

// Check environment variables
if (!process.env.RESEND_API_KEY) {
  console.error('❌ ERROR: RESEND_API_KEY environment variable is not set!');
  console.error('   Add it to your .env file: RESEND_API_KEY=re_your_api_key');
  process.exit(1);
}

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║       Payment Settled Email Test                          ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

sendTestEmail();
