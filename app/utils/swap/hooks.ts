'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { stablecoins } from '@/data/stablecoins';
import { SwapService } from './service';
import { SwapState, SwapQuote, SwapError } from './types';
import { Chain } from 'viem/chains';

const QUOTE_DEBOUNCE_MS = 300;
const RPC_BY_CHAIN: Record<number, string> = {
  56: 'https://bsc-dataseed.binance.org',
  8453: 'https://mainnet.base.org',
  1: 'https://rpc.ankr.com/eth',
  137: 'https://polygon-rpc.com',
  42161: 'https://arb1.arbitrum.io/rpc',
  10: 'https://mainnet.optimism.io',
  534352: 'https://rpc.scroll.io',
  42220: 'https://forno.celo.org',
};
const getPublicRpcUrl = (chainId: number) => RPC_BY_CHAIN[chainId];

export function useSwap(activeChain: Chain) {
  const { address } = useAccount();
  const { wallets } = useWallets();
  const publicClient = usePublicClient();

  const [state, setState] = useState<SwapState>(() => ({
    fromToken: null,
    toToken: null,
    amount: '',
    quote: null,
    isLoading: false,
    isSwapping: false,
    error: null,
    poolType: 'volatile',
  }));

  const quoteTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  /**
   * Get available tokens for current chain
   */
  const availableTokens = useCallback(
    (excludeSymbol?: string) => {
      return stablecoins.filter(
        (token) =>
          token.chainIds.includes(activeChain.id) &&
          (!excludeSymbol || token.baseToken !== excludeSymbol)
      );
    },
    [activeChain.id]
  );

  /**
   * Get token decimals for current chain
   */
  const getTokenDecimals = useCallback(
    (symbol: string) => {
      const token = stablecoins.find((t) => t.baseToken === symbol);
      if (!token) return 18;
      return typeof token.decimals === 'object'
        ? (token.decimals as any)[activeChain.id] ?? 18
        : token.decimals;
    },
    [activeChain.id]
  );

  /**
   * Get token address for current chain
   */
  const getTokenAddress = useCallback(
    (symbol: string) => {
      const token = stablecoins.find((t) => t.baseToken === symbol);
      if (!token) return null;
      return token.addresses[activeChain.id as keyof typeof token.addresses];
    },
    [activeChain.id]
  );

  /**
   * Fetch quote with debouncing
   */
  const fetchQuote = useCallback(async () => {
    if (!state.fromToken || !state.toToken || !state.amount || !wallets[0]) {
      setState((prev) => ({ ...prev, quote: null, error: null }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const walletProvider = new ethers.providers.Web3Provider(
        await wallets[0].getEthereumProvider()
      );
      const network = await walletProvider.getNetwork();
      const rpcUrl = getPublicRpcUrl(activeChain.id);
      const provider =
        network.chainId === activeChain.id
          ? walletProvider
          : rpcUrl
          ? new ethers.providers.JsonRpcProvider(rpcUrl)
          : walletProvider;

      const fromAddr = getTokenAddress(state.fromToken) as `0x${string}`;
      const toAddr = getTokenAddress(state.toToken) as `0x${string}`;

      if (!fromAddr || !toAddr) {
        throw new SwapError('Token not available on this chain', 'TOKEN_NOT_FOUND');
      }

      const quote = await SwapService.getQuote(
        provider,
        {
          fromToken: fromAddr,
          toToken: toAddr,
          amount: state.amount,
          userAddress: address as `0x${string}`,
        },
        {
          from: getTokenDecimals(state.fromToken),
          to: getTokenDecimals(state.toToken),
        },
        state.poolType,
        activeChain.id
      );

      setState((prev) => ({ ...prev, quote, isLoading: false }));
    } catch (error: any) {
      const message =
        error instanceof SwapError ? error.message : 'Failed to fetch quote';
      setState((prev) => ({ ...prev, error: message, quote: null, isLoading: false }));
    }
  }, [state.fromToken, state.toToken, state.amount, state.poolType, wallets, address, getTokenAddress, getTokenDecimals, activeChain.id]);

  /**
   * Debounced quote fetching
   */
  useEffect(() => {
    if (quoteTimeoutRef.current) {
      clearTimeout(quoteTimeoutRef.current);
    }

    quoteTimeoutRef.current = setTimeout(() => {
      fetchQuote();
    }, QUOTE_DEBOUNCE_MS);

    return () => {
      if (quoteTimeoutRef.current) {
        clearTimeout(quoteTimeoutRef.current);
      }
    };
  }, [fetchQuote]);

  /**
   * Execute swap
   */
  const executeSwap = useCallback(async () => {
    if (!state.fromToken || !state.toToken || !state.quote || !address || !wallets[0]) {
      throw new SwapError('Swap not ready', 'NOT_READY');
    }

    setState((prev) => ({ ...prev, isSwapping: true, error: null }));

    try {
      const provider = new ethers.providers.Web3Provider(
        await wallets[0].getEthereumProvider()
      );
      const signer = provider.getSigner();
      const net = await provider.getNetwork();
      if (net.chainId !== activeChain.id) {
        throw new SwapError(`Wrong wallet network. Please switch to ${activeChain.name}`, 'WRONG_NETWORK');
      }

      const fromAddr = getTokenAddress(state.fromToken) as `0x${string}`;
      const toAddr = getTokenAddress(state.toToken) as `0x${string}`;

      const result = await SwapService.executeSwap(
        signer,
        {
          fromToken: fromAddr,
          toToken: toAddr,
          amount: state.amount,
          userAddress: address as `0x${string}`,
        },
        state.quote,
        {
          from: getTokenDecimals(state.fromToken),
          to: getTokenDecimals(state.toToken),
        },
        state.poolType,
        activeChain.id
      );

      setState((prev) => ({
        ...prev,
        isSwapping: false,
        fromToken: null,
        toToken: null,
        amount: '',
        quote: null,
      }));

      return result;
    } catch (error: any) {
      const message =
        error instanceof SwapError ? error.message : 'Swap failed';
      setState((prev) => ({ ...prev, isSwapping: false, error: message }));
      throw error;
    }
  }, [state, address, wallets, getTokenAddress, getTokenDecimals]);

  /**
   * Reverse swap direction
   */
  const reverseSwap = useCallback(() => {
    setState((prev) => ({
      ...prev,
      fromToken: prev.toToken,
      toToken: prev.fromToken,
      amount: prev.quote?.amountOut || '',
      quote: null,
    }));
  }, []);

  /**
   * Reset swap state
   */
  const reset = useCallback(() => {
    setState({
      fromToken: null,
      toToken: null,
      amount: '',
      quote: null,
      isLoading: false,
      isSwapping: false,
      error: null,
      poolType: 'volatile',
    });
  }, []);

  return {
    state,
    setState,
    availableTokens,
    getTokenDecimals,
    getTokenAddress,
    fetchQuote,
    executeSwap,
    reverseSwap,
    reset,
  };
}
