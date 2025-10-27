/**
 * Email Service Usage Examples
 * Demonstrates how to use all email templates
 */

import {
  sendInvoiceEmail,
  sendWelcomeEmail,
  sendKYCReminderEmail,
  sendKYCStatusEmail,
  KYCStatus,
} from './index';

// ============================================================================
// Example 1: Send Invoice Email
// ============================================================================

export async function exampleSendInvoice() {
  const result = await sendInvoiceEmail({
    recipientEmail: 'customer@example.com',
    recipient: 'John Doe',
    sender: 'Acme Corporation',
    invoiceId: 'INV-2024-001',
    merchantId: '0x1234567890abcdef1234567890abcdef12345678',
    paymentCollection: 'Cryptocurrency',
    dueDate: new Date('2024-12-31'),
    currency: 'USDC',
    lineItems: [
      {
        description: 'Web Development Services - 40 hours',
        amount: 4000,
      },
      {
        description: 'Consulting Services - 10 hours',
        amount: 1500,
      },
      {
        description: 'Project Management',
        amount: 500,
      },
    ],
    totalAmount: 6000,
    paymentLink: 'https://merchant.nedapay.com/pay/inv-2024-001',
  });

  if (result.success) {
    console.log('✅ Invoice email sent successfully!');
    console.log('Message ID:', result.messageId);
  } else {
    console.error('❌ Failed to send invoice email:', result.error);
  }

  return result;
}

// ============================================================================
// Example 2: Send Welcome Email
// ============================================================================

export async function exampleSendWelcome() {
  const result = await sendWelcomeEmail({
    recipientEmail: 'newuser@example.com',
    firstName: 'Jane',
    walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    dashboardUrl: 'https://merchant.nedapay.com/dashboard',
  });

  if (result.success) {
    console.log('✅ Welcome email sent successfully!');
    console.log('Message ID:', result.messageId);
  } else {
    console.error('❌ Failed to send welcome email:', result.error);
  }

  return result;
}

// ============================================================================
// Example 3: Send KYC Reminder Email
// ============================================================================

export async function exampleSendKYCReminder() {
  const result = await sendKYCReminderEmail({
    recipientEmail: 'user@example.com',
    firstName: 'Bob',
    kycUrl: 'https://merchant.nedapay.com/kyc',
    daysRemaining: 7, // Optional - shows urgency banner
  });

  if (result.success) {
    console.log('✅ KYC reminder email sent successfully!');
    console.log('Message ID:', result.messageId);
  } else {
    console.error('❌ Failed to send KYC reminder:', result.error);
  }

  return result;
}

// ============================================================================
// Example 4a: Send KYC Status Email - Approved
// ============================================================================

export async function exampleSendKYCApproved() {
  const result = await sendKYCStatusEmail({
    recipientEmail: 'user@example.com',
    firstName: 'Alice',
    status: KYCStatus.APPROVED,
    dashboardUrl: 'https://merchant.nedapay.com/dashboard',
  });

  if (result.success) {
    console.log('✅ KYC approval email sent successfully!');
    console.log('Message ID:', result.messageId);
  } else {
    console.error('❌ Failed to send KYC approval email:', result.error);
  }

  return result;
}

// ============================================================================
// Example 4b: Send KYC Status Email - Rejected
// ============================================================================

export async function exampleSendKYCRejected() {
  const result = await sendKYCStatusEmail({
    recipientEmail: 'user@example.com',
    firstName: 'Charlie',
    status: KYCStatus.REJECTED,
    rejectionReason:
      'The submitted ID document appears to be expired. Please submit a valid, non-expired government-issued ID.',
    dashboardUrl: 'https://merchant.nedapay.com/kyc',
  });

  if (result.success) {
    console.log('✅ KYC rejection email sent successfully!');
    console.log('Message ID:', result.messageId);
  } else {
    console.error('❌ Failed to send KYC rejection email:', result.error);
  }

  return result;
}

// ============================================================================
// Example 4c: Send KYC Status Email - Pending Review
// ============================================================================

export async function exampleSendKYCPending() {
  const result = await sendKYCStatusEmail({
    recipientEmail: 'user@example.com',
    firstName: 'David',
    status: KYCStatus.PENDING_REVIEW,
  });

  if (result.success) {
    console.log('✅ KYC pending email sent successfully!');
    console.log('Message ID:', result.messageId);
  } else {
    console.error('❌ Failed to send KYC pending email:', result.error);
  }

  return result;
}

// ============================================================================
// Example 4d: Send KYC Status Email - Additional Info Required
// ============================================================================

export async function exampleSendKYCAdditionalInfo() {
  const result = await sendKYCStatusEmail({
    recipientEmail: 'user@example.com',
    firstName: 'Emma',
    status: KYCStatus.REQUIRES_ADDITIONAL_INFO,
    additionalInfoRequired:
      'Please provide a recent utility bill (water, electricity, or gas) dated within the last 3 months for address verification.',
    dashboardUrl: 'https://merchant.nedapay.com/kyc',
  });

  if (result.success) {
    console.log('✅ KYC additional info email sent successfully!');
    console.log('Message ID:', result.messageId);
  } else {
    console.error('❌ Failed to send KYC additional info email:', result.error);
  }

  return result;
}

// ============================================================================
// Example 5: Batch Email Sending
// ============================================================================

export async function exampleBatchSend() {
  const users = [
    { email: 'user1@example.com', firstName: 'User 1', walletAddress: '0x111...' },
    { email: 'user2@example.com', firstName: 'User 2', walletAddress: '0x222...' },
    { email: 'user3@example.com', firstName: 'User 3', walletAddress: '0x333...' },
  ];

  const results = await Promise.allSettled(
    users.map(user =>
      sendWelcomeEmail({
        recipientEmail: user.email,
        firstName: user.firstName,
        walletAddress: user.walletAddress,
      })
    )
  );

  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  console.log(`📊 Batch send results: ${successful} successful, ${failed} failed`);

  return results;
}

// ============================================================================
// Example 6: Using EmailService Directly (Advanced)
// ============================================================================

export async function exampleAdvancedUsage() {
  const { getEmailService, EmailTemplateType } = await import('./index');
  
  const emailService = getEmailService();

  // Send with custom overrides
  const result = await emailService.sendEmail({
    templateType: EmailTemplateType.INVOICE,
    data: {
      recipientEmail: 'customer@example.com',
      recipient: 'John Doe',
      sender: 'Acme Corp',
      invoiceId: 'INV-001',
      merchantId: '0x123...',
      paymentCollection: 'Crypto',
      dueDate: new Date(),
      currency: 'USDC',
      lineItems: [{ description: 'Service', amount: 100 }],
      totalAmount: 100,
    },
    overrides: {
      // Add CC and BCC
      cc: [{ email: 'manager@example.com', name: 'Manager' }],
      bcc: [{ email: 'accounting@example.com', name: 'Accounting' }],
      // Add reply-to
      replyTo: { email: 'support@nedapay.com', name: 'NedaPay Support' },
    },
  });

  console.log('Advanced send result:', result);

  return result;
}

// ============================================================================
// Example 7: Error Handling
// ============================================================================

export async function exampleErrorHandling() {
  try {
    const result = await sendInvoiceEmail({
      recipientEmail: 'invalid-email', // Invalid email format
      recipient: 'Test',
      sender: 'Test',
      invoiceId: 'TEST-001',
      merchantId: '0x123',
      paymentCollection: 'Test',
      dueDate: new Date(),
      currency: 'USDC',
      lineItems: [],
      totalAmount: 0,
    });

    if (!result.success) {
      console.error('Email validation failed:', result.error?.message);
      
      // Handle specific error types
      if (result.error?.name === 'EmailValidationError') {
        console.log('Fix the email address format');
      } else if (result.error?.name === 'EmailProviderError') {
        console.log('Email provider issue - check configuration');
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// ============================================================================
// Example 8: Testing Email Service Configuration
// ============================================================================

export async function exampleTestConfiguration() {
  const { getEmailService } = await import('./index');
  
  const emailService = getEmailService();

  // Check if configuration is valid
  const isValid = emailService.validateConfiguration();
  
  console.log('Email service configuration is valid:', isValid);

  // Get configuration details
  const config = emailService.getConfig();
  console.log('Configuration:', {
    defaultFromEmail: config.defaultFromEmail,
    defaultFromName: config.defaultFromName,
    isDevelopment: config.isDevelopment,
  });

  return isValid;
}

// ============================================================================
// Run Examples (for testing)
// ============================================================================

export async function runAllExamples() {
  console.log('🚀 Running email service examples...\n');

  try {
    console.log('1️⃣  Testing configuration...');
    await exampleTestConfiguration();

    console.log('\n2️⃣  Sending invoice email...');
    await exampleSendInvoice();

    console.log('\n3️⃣  Sending welcome email...');
    await exampleSendWelcome();

    console.log('\n4️⃣  Sending KYC reminder...');
    await exampleSendKYCReminder();

    console.log('\n5️⃣  Sending KYC approval...');
    await exampleSendKYCApproved();

    console.log('\n6️⃣  Testing error handling...');
    await exampleErrorHandling();

    console.log('\n✅ All examples completed!');
  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}

// Uncomment to run examples:
// runAllExamples();
