/**
 * Smile ID KYC Status Endpoint
 * GET /api/kyc/smile-id/status
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { SmileIDService, SmileIDError } from '@/utils/kyc/smile-id';
import { getUserIdFromRequest }from '@/utils/privyUserIdFromRequest';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
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

    if (!user || !user.wallet) {
      return NextResponse.json(
        { error: 'User or wallet not found' },
        { status: 404 }
      );
    }

    // Create Smile ID service instance
    const smileIdService = new SmileIDService(prisma);

    // Check verification status
    const status = await smileIdService.checkStatus(user.wallet);

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    if (error instanceof SmileIDError) {
      if (error.code === 'NOT_FOUND') {
        // This is expected for new users - don't log as error
        return NextResponse.json(
          { error: error.message, code: error.code },
          { status: 404 }
        );
      }
      
      // Log other SmileID errors
      console.error('Smile ID status check failed:', error);
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    // Log unexpected errors
    console.error('Smile ID status check failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
