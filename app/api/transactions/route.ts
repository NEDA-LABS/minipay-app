import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch all transactions for a merchant (by merchantId query param)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const merchantId = searchParams.get('merchantId');
  const appAccess = req.headers.get('x-app-secret');
  if (!merchantId || appAccess !== process.env.NEXT_PUBLIC_APP_ACCESS) {
    // Return 404 to prevent build/static analysis failures
    return new NextResponse('Not Found', { status: 404 });
  }
  // Limit payload and select only used fields for faster first load
  const transactions = await prisma.transaction.findMany({
    where: { merchantId },
    orderBy: { createdAt: 'desc' },
    take: 50, // latest 50
    select: {
      txHash: true,
      createdAt: true,
      amount: true,
      currency: true,
      status: true,
      wallet: true,
    },
  });

  const res = NextResponse.json({ success: true, data: transactions });
  // Short-lived browser caching to speed up navigation and Safari reloads
  res.headers.set('Cache-Control', 'private, max-age=15, stale-while-revalidate=120');
  return res;
}

// POST: Add a new transaction
export async function POST(req: NextRequest) {
  const data = await req.json();
  const { merchantId, wallet, amount, currency, status, txHash } = data;
  if (!merchantId || !wallet || !amount || !currency || !status || !txHash) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount)) {
    return NextResponse.json({ error: 'Invalid amount format' }, { status: 400 });
  }

  const transaction = await prisma.transaction.create({
    data: {
      merchantId,
      wallet,
      amount: parsedAmount,
      currency,
      status,
      txHash,
    },
  });
  return NextResponse.json(transaction, { status: 201 });
}

// PUT: Update a transaction by txHash
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const txHash = searchParams.get('txHash');

    if (!txHash) {
      return NextResponse.json({ error: 'txHash is required' }, { status: 400 });
    }

    const data = await req.json();
    const { merchantId, wallet, amount, currency, status } = data;

    if (!merchantId || !wallet || !amount || !currency || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      return NextResponse.json({ error: 'Invalid amount format' }, { status: 400 });
    }

    // Check for exactly one Pending transaction with the given txHash
    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        txHash,
        status: 'Pending',
      },
    });

    if (pendingTransactions.length === 0) {
      return NextResponse.json(
        { error: 'No Pending transaction found for this txHash' },
        { status: 404 }
      );
    }

    if (pendingTransactions.length > 1) {
      return NextResponse.json(
        { error: 'Multiple Pending transactions found for this txHash' },
        { status: 400 }
      );
    }

    // Update the single Pending transaction
    const updatedTransaction = await prisma.transaction.updateMany({
      where: {
        txHash,
        status: 'Pending',
      },
      data: {
        merchantId,
        wallet,
        amount: parsedAmount,
        currency,
        status,
      },
    });

    if (updatedTransaction.count === 0) {
      return NextResponse.json(
        { error: 'Failed to update transaction' },
        { status: 500 }
      );
    }

    // Fetch the updated transaction to return it
    const transaction = await prisma.transaction.findFirst({
      where: { txHash, status },
    });

    return NextResponse.json(transaction, { status: 200 });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}
