import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


/**
 * GET /api/admin/settings/bank-withdrawals?currency=TZS
 * Check if bank withdrawals are allowed for a specific currency
 * This endpoint is public (no auth required) as it's used by the offramp flow
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const currency = searchParams.get('currency');

    if (!currency) {
      return NextResponse.json(
        { error: 'Currency parameter is required' },
        { status: 400 }
      );
    }

    // Get settings
    const settings = await prisma.adminSettings.findFirst();
    
    if (!settings) {
      // If no settings exist, return default (banks disabled for TZS, enabled for others)
      const defaultSettings: Record<string, boolean> = {
        TZS: false,
        KES: true,
        UGX: true,
        NGN: true,
        GHS: true,
      };
      
      return NextResponse.json({
        currency,
        allowBankWithdrawals: defaultSettings[currency] ?? true,
      });
    }

    const allowBankWithdrawals = settings.allowBankWithdrawals as Record<string, boolean>;
    
    return NextResponse.json({
      currency,
      allowBankWithdrawals: allowBankWithdrawals[currency] ?? true,
    });
  } catch (error) {
    console.error('Error checking bank withdrawal status:', error);
    return NextResponse.json(
      { error: 'Failed to check bank withdrawal status' },
      { status: 500 }
    );
  }
}
