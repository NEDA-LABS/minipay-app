/**
 * Contacts API - Individual Contact Route
 * GET: Get single contact
 * PUT: Update contact
 * DELETE: Delete contact
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/utils/privyUserIdFromRequest';
import prisma from '@/lib/prisma';

// Helper to verify contact ownership
async function verifyContactOwnership(privyUserId: string, contactId: string) {
  const user = await prisma.user.findUnique({
    where: { privyUserId },
    select: { id: true }
  });

  if (!user) return null;

  const contact = await prisma.contact.findFirst({
    where: {
      id: contactId,
      userId: user.id
    }
  });

  return { user, contact };
}

// GET /api/contacts/[id] - Get single contact
export async function GET(
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

    const verification = await verifyContactOwnership(privyUserId, params.id);
    
    if (!verification?.contact) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Contact not found' } },
        { status: 404 }
      );
    }

    // Fetch full contact details
    const contact = await prisma.contact.findUnique({
      where: { id: params.id },
      include: {
        bankAccounts: true,
        phoneNumbers: true,
        cryptoAddresses: true,
        linkedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            wallet: true,
            isActive: true,
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      contact
    });

  } catch (error) {
    console.error('Error fetching contact:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch contact' } },
      { status: 500 }
    );
  }
}

// PUT /api/contacts/[id] - Update contact
export async function PUT(
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

    const verification = await verifyContactOwnership(privyUserId, params.id);
    
    if (!verification?.contact) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Contact not found' } },
        { status: 404 }
      );
    }

    const data = await request.json();
    const {
      name,
      nickname,
      country,
      notes,
      linkedUserId,
      isNedaPayUser,
      favorite
    } = data;

    // Update contact (basic fields only - payment methods have their own routes)
    const contact = await prisma.contact.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(nickname !== undefined && { nickname }),
        ...(country && { country }),
        ...(notes !== undefined && { notes }),
        ...(linkedUserId !== undefined && { linkedUserId }),
        ...(isNedaPayUser !== undefined && { isNedaPayUser }),
        ...(favorite !== undefined && { favorite }),
      },
      include: {
        bankAccounts: true,
        phoneNumbers: true,
        cryptoAddresses: true,
        linkedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            wallet: true,
            isActive: true,
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      contact,
      message: 'Contact updated successfully'
    });

  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update contact' } },
      { status: 500 }
    );
  }
}

// DELETE /api/contacts/[id] - Delete contact
export async function DELETE(
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

    const verification = await verifyContactOwnership(privyUserId, params.id);
    
    if (!verification?.contact) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Contact not found' } },
        { status: 404 }
      );
    }

    // Delete contact (cascade will handle related records)
    await prisma.contact.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Contact deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete contact' } },
      { status: 500 }
    );
  }
}
