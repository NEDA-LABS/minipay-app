/**
 * Smile ID KYC Status Endpoint
 * GET /api/kyc/smile-id/status - Get current user's KYC status
 * POST /api/kyc/smile-id/status - Get KYC status for a specific wallet address
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

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create Smile ID service instance
    const smileIdService = new SmileIDService(prisma);

    // Check verification status (use privyUserId, not wallet address)
    const status = await smileIdService.checkStatus(privyUserId);

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

export async function POST(request: NextRequest) {
  try {
    // Get user from request (for authorization)
    const privyUserId = await getUserIdFromRequest(request);
    if (!privyUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'walletAddress is required' },
        { status: 400 }
      );
    }

    // Find user by wallet address
    const targetUser = await prisma.user.findUnique({
      where: { wallet: walletAddress.toLowerCase() },
    });

    if (!targetUser) {
      return NextResponse.json({
        verified: false,
        status: null,
        error: 'User not found'
      });
    }

    // Create Smile ID service instance
    const smileIdService = new SmileIDService(prisma);

    // Check verification status for target user
    try {
      const status = await smileIdService.checkStatus(targetUser.privyUserId);
      
      return NextResponse.json({
        verified: status.verified || false,
        status: status.status || null,
        data: status
      });
    } catch (statusError) {
      if (statusError instanceof SmileIDError && statusError.code === 'NOT_FOUND') {
        // User hasn't started KYC yet
        return NextResponse.json({
          verified: false,
          status: null,
          error: 'KYC not started'
        });
      }
      throw statusError;
    }
  } catch (error) {
    if (error instanceof SmileIDError) {
      console.error('Smile ID status check failed for wallet:', error);
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    console.error('Smile ID status check failed for wallet:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
