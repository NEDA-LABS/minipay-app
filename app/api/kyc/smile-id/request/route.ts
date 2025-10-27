/**
 * Smile ID KYC Request Endpoint
 * POST /api/kyc/smile-id/request
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { SmileIDService, SmileIDError } from '@/utils/kyc/smile-id';
import { getUserIdFromRequest } from '@/utils/privyUserIdFromRequest';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Get user from request
    const privyUserId = await getUserIdFromRequest(request);
    if (!privyUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { privyUserId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { country, idType } = body;

    if (!country || !idType) {
      return NextResponse.json(
        { error: 'Missing required fields: country, idType' },
        { status: 400 }
      );
    }

    // Create Smile ID service instance
    const smileIdService = new SmileIDService(prisma);

    // Request verification
    const verificationResponse = await smileIdService.requestVerification({
      privyUserId,
      country,
      idType,
    });

    return NextResponse.json({
      success: true,
      data: verificationResponse,
    });
  } catch (error) {
    console.error('Smile ID verification request failed:', error);

    if (error instanceof SmileIDError) {
      const statusCode = error.code === 'ALREADY_VERIFIED' ? 409 : 400;
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
