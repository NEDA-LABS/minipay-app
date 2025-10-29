/**
 * Minipay Detection Utilities
 * Detect when app is running inside Minipay wallet
 */

interface MiniPayProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  isMiniPay?: boolean;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  removeListener?: (event: string, handler: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: MiniPayProvider;
  }
}

/**
 * Check if app is running inside Minipay
 */
export function isMiniPay(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.ethereum && window.ethereum.isMiniPay);
}

/**
 * Get Minipay provider
 */
export function getProvider(): MiniPayProvider | null {
  if (typeof window === 'undefined') return null;
  return window.ethereum || null;
}

/**
 * Require Minipay environment
 * Throws error if not in Minipay
 */
export function requireMiniPay(): void {
  if (!isMiniPay()) {
    throw new Error(
      'This feature requires Minipay wallet. Please open this app in Minipay.'
    );
  }
}

/**
 * Get user address directly from provider
 */
export async function getConnectedAddress(): Promise<string | null> {
  const provider = getProvider();
  if (!provider) return null;

  try {
    const accounts = await provider.request({
      method: 'eth_requestAccounts',
      params: [],
    });
    return accounts[0] || null;
  } catch (error) {
    console.error('Failed to get connected address:', error);
    return null;
  }
}

/**
 * Get environment info for debugging
 */
export function getMiniPayInfo() {
  return {
    isMiniPay: isMiniPay(),
    hasProvider: !!getProvider(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
  };
}
