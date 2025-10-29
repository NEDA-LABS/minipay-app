// Debug script to check email notification issues
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugEmailNotifications() {
  try {
    console.log('🔍 Debugging Email Notifications...\n');

    // 1. Check if EmailNotification table exists and has records
    console.log('1️⃣ Checking EmailNotification table...');
    try {
      const emailNotifications = await prisma.emailNotification.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }
      });
      console.log(`✅ Found ${emailNotifications.length} email notifications in database`);
      
      if (emailNotifications.length > 0) {
        console.log('Recent notifications:');
        emailNotifications.forEach((notif, index) => {
          console.log(`  ${index + 1}. Type: ${notif.type} | Status: ${notif.status} | Recipient: ${notif.recipientEmail}`);
          console.log(`     Subject: ${notif.subject}`);
          console.log(`     Created: ${notif.createdAt}`);
          console.log(`     Message ID: ${notif.providerMessageId || 'None'}\n`);
        });
      }
    } catch (error: any) {
      console.log('❌ EmailNotification table not found or inaccessible');
      console.log('Error:', error?.message || error);
    }

    // 2. Check recent off-ramp transactions
    console.log('2️⃣ Checking recent off-ramp transactions (last 5 settled)...');
    const recentTransactions = await prisma.offRampTransaction.findMany({
      where: { status: 'settled' },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${recentTransactions.length} settled transactions`);
    
    for (const tx of recentTransactions) {
      console.log(`\n📋 Transaction: ${tx.id}`);
      console.log(`   Amount: ${tx.amount} ${tx.currency || 'USD'}`);
      console.log(`   Merchant: ${tx.merchantId}`);
      console.log(`   Status: ${tx.status}`);
      console.log(`   Created: ${tx.createdAt}`);
      
      // Check if user exists with email
      const user = await prisma.user.findUnique({
        where: { wallet: tx.merchantId }
      });
      
      if (user) {
        console.log(`   ✅ User found: ${user.id}`);
        console.log(`   📧 Email: ${user.email || 'NOT SET'}`);
        console.log(`   👤 Name: ${user.name || 'NOT SET'}`);
        
        // Check for corresponding email notification
        const emailNotif = await prisma.emailNotification.findFirst({
          where: {
            userId: user.id,
            metadata: {
              path: [],
              equals: { transactionId: tx.id }
            }
          }
        });
        
        if (emailNotif) {
          console.log(`   📨 Email notification: ${emailNotif.status} (${emailNotif.createdAt})`);
        } else {
          console.log(`   ❌ No email notification found`);
        }
      } else {
        console.log(`   ❌ No user found for wallet: ${tx.merchantId}`);
      }
    }

    // 3. Check environment variables
    console.log('\n3️⃣ Checking environment variables...');
    console.log(`RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`RESEND_FROM_EMAIL: ${process.env.RESEND_FROM_EMAIL || '❌ Missing'}`);
    console.log(`RESEND_FROM_NAME: ${process.env.RESEND_FROM_NAME || '❌ Missing'}`);
    
    // 4. Check if EmailNotification schema exists
    console.log('\n4️⃣ Checking EmailNotification schema...');
    try {
      // This will fail if the table doesn't exist
      await prisma.emailNotification.count();
      console.log('✅ EmailNotification table exists in database');
    } catch (error: any) {
      console.log('❌ EmailNotification table missing in database');
      console.log('Error:', error?.message || error);
      console.log('\n💡 You may need to run: npx prisma migrate deploy');
    }

  } catch (error) {
    console.error('❌ Debug script failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugEmailNotifications();
