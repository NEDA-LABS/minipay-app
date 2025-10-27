import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { sendInvoiceEmail } from '@/utils/email';

export async function POST(req: Request) {
  try {
    const { merchantId, recipient,sender, email, paymentCollection, dueDate, currency, lineItems, paymentLink } = await req.json();

    // Validate payment link if provided
    let paymentLinkRecord = null;
    if (paymentLink) {
      paymentLinkRecord = await prisma.paymentLink.findUnique({
        where: { url: paymentLink },
      });
      if (!paymentLinkRecord) {
        return NextResponse.json({ error: 'Invalid payment link' }, { status: 400 });
      }
      if (paymentLinkRecord.status !== 'Active') {
        return NextResponse.json({ error: 'Payment link is not active' }, { status: 400 });
      }
    }

    // Calculate total amount
    const totalAmount = lineItems.reduce((sum: number, item: any) => sum + parseFloat(item.amount || 0), 0);

    // Create invoice with payment link reference
    const invoice = await prisma.invoice.create({
      data: {
        merchantId,
        recipient,
        sender,
        email,
        paymentCollection,
        dueDate: new Date(dueDate),
        currency,
        totalAmount,
        status: 'draft',
        paymentLinkId: paymentLinkRecord?.id || null,
        lineItems: {
          create: lineItems.map((item: any) => ({
            description: item.description,
            amount: parseFloat(item.amount || 0),
          })),
        },
      },
    });

    // Send invoice email using new email service
    try {
      const emailResult = await sendInvoiceEmail({
        recipientEmail: email,
        recipient,
        sender,
        invoiceId: invoice.id,
        merchantId,
        paymentCollection,
        dueDate: new Date(dueDate),
        currency,
        lineItems: lineItems.map((item: any) => ({
          description: item.description,
          amount: parseFloat(item.amount || 0),
        })),
        totalAmount,
        paymentLink: paymentLink || undefined,
      });

      if (emailResult.success) {
        console.log('✅ Invoice email sent successfully:', emailResult.messageId);
      } else {
        console.error('❌ Invoice email failed:', emailResult.error);
      }

      // Update invoice status to 'sent' and record sentAt timestamp
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
        },
      });

    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Continue with invoice creation even if email fails
    }

    return NextResponse.json({ success: true, invoice });

  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}