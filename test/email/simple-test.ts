/**
 * Simple Payment Settled Email Test
 * Standalone script with minimal dependencies
 */

import { PrismaClient, EmailNotificationStatus } from '@prisma/client';

const TEST_EMAIL = 'barackjimmy1@gmail.com'; // ⚠️ UPDATE THIS!
const TEST_WALLET_ADDRESS = '0x1234567890123456789012345678901234567890';

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║       Payment Settled Email Test (Simple)                 ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Check environment
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }

    console.log('📋 Step 1: Checking/Creating test user...');
    
    // Try to find user by email first
    let user = await prisma.user.findUnique({
      where: { email: TEST_EMAIL },
    });

    if (!user) {
      // Try to find by wallet
      user = await prisma.user.findUnique({
        where: { wallet: TEST_WALLET_ADDRESS },
      });
      
      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            wallet: TEST_WALLET_ADDRESS,
            email: TEST_EMAIL,
            name: 'Test User',
            privyUserId: 'test-privy-' + Date.now(),
          },
        });
        console.log('✅ User created:', user.id);
      } else {
        console.log('✅ User found by wallet:', user.id);
        if (user.email !== TEST_EMAIL) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { email: TEST_EMAIL },
          });
          console.log('✅ Email updated');
        }
      }
    } else {
      console.log('✅ User found by email:', user.id);
    }

    console.log('\n📧 Step 2: Sending email via Resend API...');
    
    // Send email directly via Resend
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #f3f4f6; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px; text-align: center; }
          .content { padding: 40px; }
          .details { background: #f9fafb; padding: 20px; border-radius: 8px; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Payment Settled Successfully</h1>
            <p>Your withdrawal has been completed</p>
          </div>
          <div class="content">
            <h2>Hi Test User,</h2>
            <p>Great news! Your payment order has been successfully settled and the funds have been sent to your bank account.</p>
            
            <div class="details">
              <h3>Transaction Details</h3>
              <div class="detail-row">
                <span>Transaction ID</span>
                <span><strong>test-tx-${Date.now()}</strong></span>
              </div>
              <div class="detail-row">
                <span>Amount</span>
                <span><strong>100.00 NGN</strong></span>
              </div>
              <div class="detail-row">
                <span>Exchange Rate</span>
                <span><strong>1500.00</strong></span>
              </div>
              <div class="detail-row">
                <span>Account Name</span>
                <span><strong>John Doe</strong></span>
              </div>
              <div class="detail-row">
                <span>Account Number</span>
                <span><strong>1234567890</strong></span>
              </div>
              <div class="detail-row">
                <span>Bank</span>
                <span><strong>First Bank of Nigeria</strong></span>
              </div>
            </div>

            <p style="margin-top: 20px;">The funds should reflect in your bank account within a few minutes.</p>
            <a href="https://nedapay.xyz/dashboard" class="button">View Dashboard</a>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: 'noreply@nedapay.xyz',
      to: TEST_EMAIL,
      subject: '✅ Payment Settled - 100.00 NGN',
      html: emailHtml,
    });

    if (result.error) {
      throw result.error;
    }

    console.log('✅ Email sent successfully!');
    console.log('📬 Message ID:', result.data?.id);

    console.log('\n📊 Step 3: Tracking in database...');
    
    // Track in database
    const notification = await prisma.emailNotification.create({
      data: {
        userId: user.id,
        type: 'PAYMENT_SETTLED',
        recipientEmail: TEST_EMAIL,
        subject: '✅ Payment Settled - 100.00 NGN',
        status: EmailNotificationStatus.SENT,
        providerMessageId: result.data?.id,
        metadata: {
          transactionId: `test-tx-${Date.now()}`,
          amount: '100.00',
          currency: 'NGN',
        },
        sentAt: new Date(),
      },
    });

    console.log('✅ Email tracked in database');
    console.log('   - ID:', notification.id);
    console.log('   - Status:', notification.status);

    console.log('\n✅ Test completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('1. Check your email inbox:', TEST_EMAIL);
    console.log('2. Check spam folder if not in inbox');
    console.log('3. Verify email content and styling');

  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
