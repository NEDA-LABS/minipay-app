// API endpoint to get token contract information for disbursements
import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/utils/privyUserIdFromRequest'
import prisma from '@/lib/prisma'

// Token contract addresses by currency and chain
const TOKEN_INFO: Record<string, { contractAddress: string; decimals: number; chainId: number; symbol: string }> = {
  'USDC': {
    contractAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base USDC
    decimals: 6,
    chainId: 8453,
    symbol: 'USDC'
  },
  'USDT': {
    contractAddress: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2', // Base USDT
    decimals: 6,
    chainId: 8453,
    symbol: 'USDT'
  },
  'USD': { // For off-ramp USD, we'll use USDC
    contractAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    decimals: 6,
    chainId: 8453,
    symbol: 'USDC'
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const privyUserId = await getUserIdFromRequest(request)
    if (!privyUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Implement proper admin role management
    // For now, check if user exists
    const user = await prisma.user.findUnique({
      where: { privyUserId },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // TODO: Add admin role check here
    // if (!user.isAdmin) {
    //   return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    // }

    // Get currency from query params
    const { searchParams } = new URL(request.url)
    const currency = searchParams.get('currency')?.toUpperCase()

    if (!currency) {
      return NextResponse.json({ error: 'Currency parameter required' }, { status: 400 })
    }

    const tokenInfo = TOKEN_INFO[currency]
    if (!tokenInfo) {
      return NextResponse.json(
        { error: `Unsupported currency: ${currency}` },
        { status: 400 }
      )
    }

    return NextResponse.json(tokenInfo)
  } catch (error) {
    console.error('Token info error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
