/**
 * Contacts API - Toggle Favorite
 * POST: Toggle favorite status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/utils/walletFromRequest';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const privyUserId = await getUserIdFromRequest(request);
    
    if (!privyUserId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { privyUserId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    // Get current contact
    const contact = await prisma.contact.findFirst({
      where: {
        id: params.id,
        userId: user.id
      },
      select: { favorite: true }
    });

    if (!contact) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Contact not found' } },
        { status: 404 }
      );
    }

    // Toggle favorite
    const updatedContact = await prisma.contact.update({
      where: { id: params.id },
      data: { favorite: !contact.favorite },
      select: { id: true, favorite: true }
    });

    return NextResponse.json({
      success: true,
      favorite: updatedContact.favorite
    });

  } catch (error) {
    console.error('Error toggling favorite:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to toggle favorite' } },
      { status: 500 }
    );
  }
}
