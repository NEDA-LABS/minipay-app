/**
 * Smile ID Webhook Endpoint
 * POST /api/kyc/smile-id/webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createSmileIDWebhookHandler } from '@/utils/kyc/smile-id';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Create webhook handler
    const webhookHandler = createSmileIDWebhookHandler(prisma);

    // Process webhook
    const result = await webhookHandler.handleWebhook(request);

    if (result.success) {
      return NextResponse.json(
        { message: result.message },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
