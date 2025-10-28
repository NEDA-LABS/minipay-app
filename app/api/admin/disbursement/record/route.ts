// API endpoint to record disbursement transactions
import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest } from '@/utils/privyUserIdFromRequest'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const privyUserId = await getUserIdFromRequest(request)
    if (!privyUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Implement proper admin role management
    const user = await prisma.user.findUnique({
      where: { privyUserId },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // TODO: Add admin role check here

    const body = await request.json()
    const {
      influencerProfileId,
      amount,
      currency,
      transactionHash,
      recipientAddress,
      notes,
      earningIds
    } = body

    // Validate required fields
    if (!influencerProfileId || !amount || !currency || !transactionHash || !recipientAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create disbursement record and update earnings in a transaction
    const disbursement = await prisma.$transaction(async (tx) => {
      // Create the disbursement
      const newDisbursement = await tx.influencerDisbursement.create({
        data: {
          influencerProfileId,
          amount,
          currency,
          transactionHash,
          recipientAddress,
          adminUserId: user.id,
          notes: notes || null,
          status: 'COMPLETED' // Mark as completed since transaction already sent
        }
      })

      // Update associated earnings to mark as disbursed
      if (earningIds && earningIds.length > 0) {
        await tx.influencerEarning.updateMany({
          where: {
            id: { in: earningIds },
            influencerProfileId
          },
          data: {
            status: 'DISBURSED',
            disbursementId: newDisbursement.id
          }
        })
      }

      return newDisbursement
    })

    return NextResponse.json({
      success: true,
      disbursement
    })
  } catch (error) {
    console.error('Record disbursement error:', error)
    return NextResponse.json(
      { error: 'Failed to record disbursement' },
      { status: 500 }
    )
  }
}
