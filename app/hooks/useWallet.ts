/**
 * Wallet hook for MiniPay
 * Replaces Privy's usePrivy and useWallets with wagmi equivalents
 * This provides a unified interface for wallet operations in MiniPay
 */

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useCallback, useMemo } from 'react';

export interface WalletState {
  // Authentication state
  authenticated: boolean;
  ready: boolean;
  
  // Wallet info
  address: `0x${string}` | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  
  // For compatibility with code expecting Privy's getAccessToken
  getAccessToken: () => Promise<string | null>;
}

/**
 * Main wallet hook - replaces usePrivy
 */
export function useWallet(): WalletState {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnect = useCallback(() => {
    const injectedConnector = connectors.find((c) => c.id === 'injected') || connectors[0];
    if (injectedConnector) {
      connect({ connector: injectedConnector });
    }
  }, [connect, connectors]);

  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  // For compatibility - MiniPay doesn't need access tokens
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    // In MiniPay, we don't use JWT tokens - authentication is via wallet signature
    // Return the wallet address as a pseudo-token for API calls that need it
    return address || null;
  }, [address]);

  return useMemo(() => ({
    authenticated: isConnected,
    ready: true,
    address,
    isConnected,
    isConnecting,
    connect: handleConnect,
    disconnect: handleDisconnect,
    getAccessToken,
  }), [address, isConnected, isConnecting, handleConnect, handleDisconnect, getAccessToken]);
}

/**
 * Wallet list hook - replaces useWallets from Privy
 * Returns array of connected wallets (in MiniPay, there's only one)
 */
export function useWallets() {
  const { address, isConnected, connector } = useAccount();

  const wallets = useMemo(() => {
    if (!isConnected || !address) return [];
    
    return [{
      address,
      chainId: 42220, // Celo mainnet
      connectorType: connector?.id || 'injected',
      // Compatibility methods
      getEthereumProvider: async () => {
        if (typeof window !== 'undefined' && window.ethereum) {
          return window.ethereum;
        }
        return null;
      },
    }];
  }, [address, isConnected, connector]);

  return { wallets };
}

/**
 * Hook to get the current wallet address
 * Simple helper for components that just need the address
 */
export function useWalletAddress(): `0x${string}` | undefined {
  const { address } = useAccount();
  return address;
}

// Re-export for convenience
export { useAccount, useConnect, useDisconnect } from 'wagmi';
