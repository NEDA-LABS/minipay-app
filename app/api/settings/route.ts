import { NextRequest, NextResponse } from 'next/server';
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// GET handler
export async function GET(request: NextRequest) {
  try {
    // Extract user ID from authentication
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with settings and API keys
    const user = await prisma.user.findUnique({
      where: { privyUserId: userId },
      include: {
        merchantSettings: true,
        apiKeys: {
          where: { isActive: true },
          select: {
            id: true,
            keyId: true,
            environment: true,
            name: true,
            lastUsed: true,
            createdAt: true,
            // Don't return the actual hashed key
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If no settings exist, create default ones
    let settings = user.merchantSettings;
    if (!settings) {
      settings = await prisma.merchantSettings.create({
        data: {
          userId: user.id,
          businessName: '',
          businessEmail: user.email || '',
          businessPhone: '',
          businessCategory: 'retail',
          businessDescription: '',
        }
      });
    }

    return NextResponse.json({
      settings: {
        businessName: settings.businessName,
        businessEmail: settings.businessEmail,
        businessPhone: settings.businessPhone,
        businessCategory: settings.businessCategory,
        businessDescription: settings.businessDescription,
        autoSettlement: settings.autoSettlement,
        settlementThreshold: settings.settlementThreshold,
        settlementCurrency: settings.settlementCurrency,
        paymentExpiry: settings.paymentExpiry,
        twoFactorEnabled: settings.twoFactorEnabled,
        withdrawalConfirmation: settings.withdrawalConfirmation,
        transactionNotifications: settings.transactionNotifications,
        settlementNotifications: settings.settlementNotifications,
        securityAlerts: settings.securityAlerts,
        marketingUpdates: settings.marketingUpdates,
        webhookUrl: settings.webhookUrl,
      },
      apiKeys: user.apiKeys
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT handler
export async function PUT(request: NextRequest) {
  try {
    // Extract user ID from authentication
    const userId = await getUserIdFromRequest(request);
    console.log('User ID:', userId); //debugg
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      businessName,
      businessEmail,
      businessPhone,
      businessCategory,
      businessDescription,
      autoSettlement,
      settlementThreshold,
      settlementCurrency,
      paymentExpiry,
      twoFactorEnabled,
      withdrawalConfirmation,
      transactionNotifications,
      settlementNotifications,
      securityAlerts,
      marketingUpdates,
      webhookUrl,
    } = body;

    // Validate required fields
    if (!businessName || !businessEmail) {
      return NextResponse.json({ error: 'Business name and email are required' }, { status: 400 });
    }

    // Validate business category
    const validCategories = ['retail', 'food', 'services', 'technology', 'education', 'other'];
    if (businessCategory && !validCategories.includes(businessCategory)) {
      return NextResponse.json({ error: 'Invalid business category' }, { status: 400 });
    }

    // Validate settlement threshold
    if (settlementThreshold && (isNaN(settlementThreshold) || settlementThreshold < 0)) {
      return NextResponse.json({ error: 'Invalid settlement threshold' }, { status: 400 });
    }

    // Validate payment expiry
    if (paymentExpiry && (isNaN(paymentExpiry) || paymentExpiry < 1 || paymentExpiry > 1440)) {
      return NextResponse.json({ error: 'Payment expiry must be between 1 and 1440 minutes' }, { status: 400 });
    }

    // First find the user to get their id
    const user = await prisma.user.findUnique({
      where: { privyUserId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update or create settings
    const settings = await prisma.merchantSettings.upsert({
      where: { userId: user.id },
      update: {
        businessName,
        businessEmail,
        businessPhone,
        businessCategory,
        businessDescription,
        autoSettlement: autoSettlement ?? undefined,
        settlementThreshold: settlementThreshold ? parseFloat(settlementThreshold) : undefined,
        settlementCurrency,
        paymentExpiry: paymentExpiry ? parseInt(paymentExpiry) : undefined,
        twoFactorEnabled: twoFactorEnabled ?? undefined,
        withdrawalConfirmation: withdrawalConfirmation ?? undefined,
        transactionNotifications: transactionNotifications ?? undefined,
        settlementNotifications: settlementNotifications ?? undefined,
        securityAlerts: securityAlerts ?? undefined,
        marketingUpdates: marketingUpdates ?? undefined,
        webhookUrl,
        updatedAt: new Date(),
      },
      create: {
        userId,
        businessName,
        businessEmail,
        businessPhone,
        businessCategory,
        businessDescription,
        autoSettlement: autoSettlement ?? true,
        settlementThreshold: settlementThreshold ? parseFloat(settlementThreshold) : 1000,
        settlementCurrency: settlementCurrency || 'TSHC',
        paymentExpiry: paymentExpiry ? parseInt(paymentExpiry) : 60,
        twoFactorEnabled: twoFactorEnabled ?? false,
        withdrawalConfirmation: withdrawalConfirmation ?? true,
        transactionNotifications: transactionNotifications ?? true,
        settlementNotifications: settlementNotifications ?? true,
        securityAlerts: securityAlerts ?? true,
        marketingUpdates: marketingUpdates ?? false,
        webhookUrl,
      }
    });

    return NextResponse.json({ 
      message: 'Settings updated successfully',
      settings: {
        businessName: settings.businessName,
        businessEmail: settings.businessEmail,
        businessPhone: settings.businessPhone,
        businessCategory: settings.businessCategory,
        businessDescription: settings.businessDescription,
        autoSettlement: settings.autoSettlement,
        settlementThreshold: settings.settlementThreshold,
        settlementCurrency: settings.settlementCurrency,
        paymentExpiry: settings.paymentExpiry,
        twoFactorEnabled: settings.twoFactorEnabled,
        withdrawalConfirmation: settings.withdrawalConfirmation,
        transactionNotifications: settings.transactionNotifications,
        settlementNotifications: settings.settlementNotifications,
        securityAlerts: settings.securityAlerts,
        marketingUpdates: settings.marketingUpdates,
        webhookUrl: settings.webhookUrl,
      }
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to extract user ID from request
export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      console.log('No token provided');
      return null;
    }

    // For MiniPay, the token is the wallet address
    // No JWT verification needed - wallet signature provides auth
    try {
      // Check if token is a wallet address (starts with 0x)
      if (token.startsWith('0x') && token.length === 42) {
        return token;
      }
      
      // Fallback: decode JWT if provided
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.sub) {
        return decoded.sub;
      }
      
    } catch (jwtError) {
      console.log('JWT decode error:', jwtError);
    }
    
    // Fallback: For custom JWT tokens
    // if (process.env.JWT_SECRET) {
    //   try {
    //     const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    //     return decoded.userId || decoded.sub;
    //   } catch (verifyError) {
    //     console.log('JWT verification failed:', verifyError);
    //   }
    // }

    console.log('Could not extract user ID from token');
    return null;
    
  } catch (error) {
    console.error('Error extracting user ID:', error);
    return null;
  }
}