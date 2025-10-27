/**
 * KYC Email Requirement Service
 * Ensures users have email before starting KYC verification
 * Follows Single Responsibility Principle
 */

import { PrismaClient } from '@prisma/client';

export interface EmailRequirementResult {
  hasEmail: boolean;
  email?: string;
  message?: string;
}

/**
 * Service to check and enforce email requirement for KYC
 */
export class KYCEmailRequirementService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Check if user has email address
   */
  async checkUserEmail(privyUserId: string): Promise<EmailRequirementResult> {
    const user = await this.prisma.user.findUnique({
      where: { privyUserId },
      select: { email: true },
    });

    if (!user) {
      return {
        hasEmail: false,
        message: 'User not found',
      };
    }

    if (!user.email) {
      return {
        hasEmail: false,
        message: 'Email address is required for KYC verification. Please add your email address to continue.',
      };
    }

    return {
      hasEmail: true,
      email: user.email,
    };
  }

  /**
   * Update user email address
   */
  async updateUserEmail(privyUserId: string, email: string): Promise<boolean> {
    try {
      await this.prisma.user.update({
        where: { privyUserId },
        data: { email },
      });
      return true;
    } catch (error) {
      console.error('Failed to update user email:', error);
      return false;
    }
  }

  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
