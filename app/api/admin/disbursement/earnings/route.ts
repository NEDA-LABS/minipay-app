// API endpoint to get pending earnings for an influencer
import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/utils/privyUserIdFromRequest'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Check authorization
    const privyUserId = await getUserIdFromRequest(request)
    if (!privyUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Add admin role check
    const user = await prisma.user.findUnique({
      where: { privyUserId },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get influencer profile ID from query params
    const { searchParams } = new URL(request.url)
    const influencerProfileId = searchParams.get('influencerProfileId')

    if (!influencerProfileId) {
      return NextResponse.json(
        { error: 'influencerProfileId parameter required' },
        { status: 400 }
      )
    }

    // Fetch pending earnings grouped by currency
    const pendingEarnings = await prisma.influencerEarning.findMany({
      where: {
        influencerProfileId,
        status: 'PENDING'
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        createdAt: true,
        referralId: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Group by currency and sum amounts
    const groupedEarnings: Record<string, { amount: number; earningIds: string[]; count: number }> = {}
    
    for (const earning of pendingEarnings) {
      const currency = earning.currency
      if (!groupedEarnings[currency]) {
        groupedEarnings[currency] = {
          amount: 0,
          earningIds: [],
          count: 0
        }
      }
      groupedEarnings[currency].amount += parseFloat(earning.amount)
      groupedEarnings[currency].earningIds.push(earning.id)
      groupedEarnings[currency].count++
    }

    // Convert to array format
    const result = Object.entries(groupedEarnings).map(([currency, data]) => ({
      currency,
      amount: data.amount,
      earningIds: data.earningIds,
      count: data.count
    }))

    return NextResponse.json({
      pendingEarnings: result,
      totalEarnings: pendingEarnings.length
    })
  } catch (error) {
    console.error('Get earnings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch earnings' },
      { status: 500 }
    )
  }
}
