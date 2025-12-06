/**
 * Get wallet address from request headers
 * For MiniPay, the authorization token is the wallet address
 */
import { NextRequest } from 'next/server';

export async function getWalletFromRequest(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return null;
    }

    // For MiniPay, the token is the wallet address
    if (token.startsWith('0x') && token.length === 42) {
      return token;
    }

    // Fallback: try to decode as JWT
    try {
      const jwt = await import('jsonwebtoken');
      const decoded = jwt.default.decode(token) as any;
      if (decoded?.sub) {
        return decoded.sub;
      }
    } catch {
      // Not a valid JWT
    }

    return null;
  } catch (error) {
    console.error('Error getting wallet from request:', error);
    return null;
  }
}

// Legacy alias for backward compatibility
export const getUserIdFromRequest = getWalletFromRequest;
