/**
 * Contacts API - Search User
 * POST: Search for existing NedaPay user to link
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/utils/walletFromRequest';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const privyUserId = await getUserIdFromRequest(request);
    
    if (!privyUserId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { query, type } = await request.json();

    if (!query || !type) {
      return NextResponse.json(
        { 
          success: false, 
          error: { code: 'VALIDATION_ERROR', message: 'Query and type are required' } 
        },
        { status: 400 }
      );
    }

    // Build where clause based on type
    let where: any = {};
    
    switch (type) {
      case 'wallet':
        where = { wallet: query };
        break;
      case 'email':
        where = { email: query };
        break;
      case 'privyUserId':
        where = { privyUserId: query };
        break;
      default:
        return NextResponse.json(
          { 
            success: false, 
            error: { code: 'VALIDATION_ERROR', message: 'Invalid search type' } 
          },
          { status: 400 }
        );
    }

    // Search for user
    const user = await prisma.user.findUnique({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        wallet: true,
        isActive: true,
      }
    });

    if (!user) {
      return NextResponse.json({
        success: true,
        user: null,
        message: 'No NedaPay user found with this information'
      });
    }

    return NextResponse.json({
      success: true,
      user,
      message: 'NedaPay user found'
    });

  } catch (error) {
    console.error('Error searching user:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { code: 'INTERNAL_ERROR', message: 'Failed to search user' } 
      },
      { status: 500 }
    );
  }
}
