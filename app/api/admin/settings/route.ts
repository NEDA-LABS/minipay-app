import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

// Helper to check admin authentication
async function isAdminAuthenticated(request: NextRequest): Promise<boolean> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('admin-authenticated');
  console.log('Auth cookie:', authCookie);
  console.log('All cookies:', cookieStore.getAll());
  return authCookie?.value === 'true';
}

/**
 * GET /api/admin/settings
 * Retrieve current admin settings
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    if (!(await isAdminAuthenticated(request))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get or create settings (singleton pattern)
    let settings = await prisma.adminSettings.findFirst();
    
    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.adminSettings.create({
        data: {
          allowBankWithdrawals: {
            TZS: false,
            KES: true,
            UGX: true,
            NGN: true,
            GHS: true,
          },
          maintenanceMode: false,
          allowNewRegistrations: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      settings: {
        id: settings.id,
        allowBankWithdrawals: settings.allowBankWithdrawals,
        maintenanceMode: settings.maintenanceMode,
        allowNewRegistrations: settings.allowNewRegistrations,
        updatedAt: settings.updatedAt,
        lastModifiedBy: settings.lastModifiedBy,
      },
    });
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings
 * Update admin settings
 */
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    if (!(await isAdminAuthenticated(request))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { allowBankWithdrawals, maintenanceMode, allowNewRegistrations, modifiedBy } = body;

    // Get or create settings
    let settings = await prisma.adminSettings.findFirst();
    
    if (!settings) {
      // Create if doesn't exist
      settings = await prisma.adminSettings.create({
        data: {
          allowBankWithdrawals: allowBankWithdrawals || {
            TZS: false,
            KES: true,
            UGX: true,
            NGN: true,
            GHS: true,
          },
          maintenanceMode: maintenanceMode ?? false,
          allowNewRegistrations: allowNewRegistrations ?? true,
          lastModifiedBy: modifiedBy || 'admin',
        },
      });
    } else {
      // Update existing settings
      const updateData: any = {
        lastModifiedBy: modifiedBy || 'admin',
      };

      if (allowBankWithdrawals !== undefined) {
        updateData.allowBankWithdrawals = allowBankWithdrawals;
      }
      if (maintenanceMode !== undefined) {
        updateData.maintenanceMode = maintenanceMode;
      }
      if (allowNewRegistrations !== undefined) {
        updateData.allowNewRegistrations = allowNewRegistrations;
      }

      settings = await prisma.adminSettings.update({
        where: { id: settings.id },
        data: updateData,
      });
    }

    return NextResponse.json({
      success: true,
      settings: {
        id: settings.id,
        allowBankWithdrawals: settings.allowBankWithdrawals,
        maintenanceMode: settings.maintenanceMode,
        allowNewRegistrations: settings.allowNewRegistrations,
        updatedAt: settings.updatedAt,
        lastModifiedBy: settings.lastModifiedBy,
      },
    });
  } catch (error) {
    console.error('Error updating admin settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
