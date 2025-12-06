// utils/userService.ts
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface WalletUser {
  wallet: string;
  email?: string;
}

export interface UserData {
  id: string;
  email: string | null;
  wallet: string | null;
  privyUserId: string;
  name: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Create or update user when they connect wallet (MiniPay)
export async function syncWalletUser(walletAddress: string): Promise<UserData> {
  try {
    const userData = {
      privyUserId: walletAddress, // Use wallet address as unique ID
      wallet: walletAddress,
      name: null,
      isActive: true,
    };

    const user = await prisma.user.upsert({
      where: { wallet: walletAddress },
      update: {
        updatedAt: new Date(),
      },
      create: userData,
    });

    return user;
  } catch (error) {
    console.error('Error syncing wallet user:', error);
    throw new Error('Failed to sync user data');
  }
}

// Legacy alias for backward compatibility
export const syncPrivyUser = async (privyUser: { id: string; wallet?: { address: string } }): Promise<UserData> => {
  const walletAddress = privyUser.wallet?.address || privyUser.id;
  return syncWalletUser(walletAddress);
};

// Get user by wallet address (primary lookup for MiniPay)
export async function getUserByWalletId(walletAddress: string): Promise<UserData | null> {
  try {
    return await prisma.user.findUnique({
      where: { wallet: walletAddress },
    });
  } catch (error) {
    console.error('Error fetching user by wallet:', error);
    return null;
  }
}

// Legacy alias
export const getUserByPrivyId = getUserByWalletId;

// Get user by email
export async function getUserByEmail(email: string): Promise<UserData | null> {
  try {
    return await prisma.user.findUnique({
      where: { email },
    });
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
}

// Get user by wallet address
export async function getUserByWallet(wallet: string): Promise<UserData | null> {
  try {
    return await prisma.user.findUnique({
      where: { wallet },
    });
  } catch (error) {
    console.error('Error fetching user by wallet:', error);
    return null;
  }
}

// Update user profile
export async function updateUserProfile(
  privyUserId: string, 
  updates: { name?: string; email?: string }
): Promise<UserData> {
  try {
    const user = await prisma.user.update({
      where: { privyUserId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    console.log('User profile updated:', user.id);
    return user;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update user profile');
  }
}

