/**
 * Smile ID Supported Types Endpoint
 * GET /api/kyc/smile-id/supported-types
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { SmileIDService } from '@/utils/kyc/smile-id';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');

    // Create Smile ID service instance
    const smileIdService = new SmileIDService(prisma);

    // Get supported types
    const supportedTypes = smileIdService.getSupportedTypes(country || undefined);

    return NextResponse.json({
      success: true,
      data: supportedTypes,
    });
  } catch (error) {
    console.error('Failed to get supported types:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Handle other HTTP methods
export async function POST() {
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
