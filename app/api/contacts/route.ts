/**
 * Contacts API - Main Route
 * GET: List all contacts for authenticated user
 * POST: Create new contact
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/utils/privyUserIdFromRequest';
import prisma from '@/lib/prisma';

// GET /api/contacts - List contacts
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from Privy token
    const privyUserId = await getUserIdFromRequest(request);
    
    if (!privyUserId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Get user from database
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const country = searchParams.get('country');
    const favorite = searchParams.get('favorite');
    const isNedaPayUser = searchParams.get('isNedaPayUser');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {
      userId: user.id,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nickname: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (country) where.country = country;
    if (favorite !== null) where.favorite = favorite === 'true';
    if (isNedaPayUser !== null) where.isNedaPayUser = isNedaPayUser === 'true';

    // Fetch contacts with relations
    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
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
        },
        orderBy: [
          { favorite: 'desc' },
          { lastUsed: 'desc' },
          { name: 'asc' }
        ],
        take: limit,
        skip: offset,
      }),
      prisma.contact.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      contacts,
      total,
      hasMore: offset + contacts.length < total,
    });

  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to fetch contacts',
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      },
      { status: 500 }
    );
  }
}

// POST /api/contacts - Create new contact
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from Privy token
    const privyUserId = await getUserIdFromRequest(request);
    
    if (!privyUserId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

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

    // Parse request body
    const data = await request.json();
    const {
      name,
      nickname,
      country,
      notes,
      linkedUserId,
      isNedaPayUser,
      bankAccounts = [],
      phoneNumbers = [],
      cryptoAddresses = []
    } = data;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Name is required' 
          } 
        },
        { status: 400 }
      );
    }

    // Create contact with nested relations
    const contact = await prisma.contact.create({
      data: {
        userId: user.id,
        name,
        nickname,
        // country: country || 'US',
        notes,
        linkedUserId,
        isNedaPayUser: isNedaPayUser || false,
        bankAccounts: {
          create: bankAccounts.map((acc: any) => ({
            accountNumber: acc.accountNumber,
            accountName: acc.accountName,
            bankName: acc.bankName,
            bankCode: acc.bankCode,
            currency: acc.currency || 'TZS',
            isPrimary: acc.isPrimary || false,
            label: acc.label,
          }))
        },
        phoneNumbers: {
          create: phoneNumbers.map((phone: any) => ({
            phoneNumber: phone.phoneNumber,
            provider: phone.provider,
            country: phone.country,
            isPrimary: phone.isPrimary || false,
            label: phone.label,
          }))
        },
        cryptoAddresses: {
          create: cryptoAddresses.map((addr: any) => ({
            address: addr.address,
            ensName: addr.ensName,
            chainId: addr.chainId,
            isPrimary: addr.isPrimary || false,
            label: addr.label,
          }))
        }
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
      message: 'Contact created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to create contact',
          details: error instanceof Error ? error.message : 'Unknown error'
        } 
      },
      { status: 500 }
    );
  }
}
