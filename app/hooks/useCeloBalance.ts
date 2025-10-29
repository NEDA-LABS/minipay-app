/**
 * Hook to fetch Celo stablecoin balances
 * Fetches cUSD, USDC, and USDT balances on Celo
 */

import { useBalance } from 'wagmi';
import { useAccount } from 'wagmi';
import { celo } from 'wagmi/chains';
import { MINIPAY_STABLECOINS } from '@/data/minipay-stablecoins';

export function useCeloBalances() {
  const { address } = useAccount();

  // Fetch cUSD balance
  const cUSD = useBalance({
    address,
    token: MINIPAY_STABLECOINS.cUSD.address as `0x${string}`,
    chainId: celo.id,
    query: {
      enabled: !!address,
    },
  });

  // Fetch USDC balance
  const USDC = useBalance({
    address,
    token: MINIPAY_STABLECOINS.USDC.address as `0x${string}`,
    chainId: celo.id,
    query: {
      enabled: !!address,
    },
  });

  // Fetch USDT balance
  const USDT = useBalance({
    address,
    token: MINIPAY_STABLECOINS.USDT.address as `0x${string}`,
    chainId: celo.id,
    query: {
      enabled: !!address,
    },
  });

  const isLoading = cUSD.isLoading || USDC.isLoading || USDT.isLoading;
  const isError = cUSD.isError || USDC.isError || USDT.isError;

  return {
    balances: {
      cUSD: cUSD.data,
      USDC: USDC.data,
      USDT: USDT.data,
    },
    raw: {
      cUSD,
      USDC,
      USDT,
    },
    isLoading,
    isError,
    refetch: () => {
      cUSD.refetch();
      USDC.refetch();
      USDT.refetch();
    },
  };
}

/**
 * Hook to fetch a single token balance
 */
export function useCeloTokenBalance(tokenSymbol: 'cUSD' | 'USDC' | 'USDT') {
  const { address } = useAccount();
  const token = MINIPAY_STABLECOINS[tokenSymbol];

  const balance = useBalance({
    address,
    token: token.address as `0x${string}`,
    chainId: celo.id,
    query: {
      enabled: !!address,
    },
  });

  return {
    balance: balance.data,
    isLoading: balance.isLoading,
    isError: balance.isError,
    refetch: balance.refetch,
  };
}
