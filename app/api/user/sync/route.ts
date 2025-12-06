// Sync user with wallet address (MiniPay)
import { NextResponse } from 'next/server';
import { syncWalletUser } from '../../../utils/userService';

export async function POST(req: Request) {
  try {
    const { wallet, privyUser } = await req.json();
    
    // Support both new wallet-based and legacy privyUser format
    const walletAddress = wallet || privyUser?.wallet?.address || privyUser?.id;

    if (!walletAddress) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    const user = await syncWalletUser(walletAddress);
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 });
  }
}



