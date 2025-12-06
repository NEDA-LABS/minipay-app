import { useState, useCallback } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { celo } from 'wagmi/chains';

// MiniPay only supports Celo
const CELO_CHAIN = {
  id: celo.id,
  name: celo.name,
  nativeCurrency: celo.nativeCurrency,
  rpcUrl: 'https://forno.celo.org',
};

interface ChainConfig {
  id: number;
  name: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrl: string;
}

interface UseChainReturn {
  currentChain: ChainConfig;
  supportedChains: ChainConfig[];
  switchChain: (chainId: number) => Promise<void>;
  isConnected: boolean;
  isSwitching: boolean;
  isInitializing: boolean;
  error: string | null;
  clearError: () => void;
}

export const useChain = (): UseChainReturn => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending } = useSwitchChain();
  const [error, setError] = useState<string | null>(null);

  // MiniPay is Celo-only, so we always return Celo chain
  const currentChain = CELO_CHAIN;

  const handleSwitchChain = useCallback(async (targetChainId: number) => {
    // MiniPay only supports Celo, so switching is a no-op
    if (targetChainId !== celo.id) {
      setError('MiniPay only supports Celo network');
      return;
    }
    
    try {
      await switchChainAsync({ chainId: targetChainId });
    } catch (err: any) {
      setError(err.message || 'Failed to switch chain');
    }
  }, [switchChainAsync]);

  const clearError = useCallback(() => setError(null), []);

  return {
    currentChain,
    supportedChains: [CELO_CHAIN],
    switchChain: handleSwitchChain,
    isConnected,
    isSwitching: isPending,
    isInitializing: false,
    error,
    clearError,
  };
};