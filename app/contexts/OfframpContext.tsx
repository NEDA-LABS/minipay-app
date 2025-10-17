'use client';

/**
 * OfframpContext - Centralized state management for offramp flow
 * 
 * This context manages the shared state across the offramp process:
 * - Country selection
 * - Chain selection
 * - Token selection
 * - Amount input
 * - Provider selection
 * 
 * Benefits:
 * - Single source of truth
 * - Prevents duplicate selections
 * - Easy to pass data between components
 * - Enables provider switching without losing data
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Country, OfframpContext as IOfframpContext, IOfframpProvider } from '@/app/ramps/types/offramp.types';
import { ChainConfig } from '@/app/ramps/payramp/offrampHooks/constants';

interface OfframpContextState {
  // Current selections
  country: Country | null;
  chain: ChainConfig | null;
  token: string | null;
  amount: string;
  userAddress: string;
  provider: IOfframpProvider | null;
  
  // Derived data
  currencyCode: string | null;
  
  // Actions
  setCountry: (country: Country) => void;
  setChain: (chain: ChainConfig) => void;
  setToken: (token: string) => void;
  setAmount: (amount: string) => void;
  setUserAddress: (address: string) => void;
  setProvider: (provider: IOfframpProvider | null) => void;
  
  // Utility
  reset: () => void;
  isReady: () => boolean;
  getContext: () => IOfframpContext | null;
}

const OfframpContext = createContext<OfframpContextState | undefined>(undefined);

interface OfframpProviderProps {
  children: ReactNode;
}

export function OfframpProvider({ children }: OfframpProviderProps) {
  const [country, setCountryState] = useState<Country | null>(null);
  const [chain, setChainState] = useState<ChainConfig | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [amount, setAmountState] = useState<string>('');
  const [userAddress, setUserAddressState] = useState<string>('');
  const [provider, setProviderState] = useState<IOfframpProvider | null>(null);

  // Auto-derive currency code from country and provider
  const currencyCode = React.useMemo(() => {
    if (!country || !provider) return null;
    return provider.getCurrencyCode(country.id);
  }, [country, provider]);

  const setCountry = useCallback((newCountry: Country) => {
    setCountryState(newCountry);
  }, []);

  const setChain = useCallback((newChain: ChainConfig) => {
    setChainState(newChain);
  }, []);

  const setToken = useCallback((newToken: string) => {
    setTokenState(newToken);
  }, []);

  const setAmount = useCallback((newAmount: string) => {
    setAmountState(newAmount);
  }, []);

  const setUserAddress = useCallback((address: string) => {
    setUserAddressState(address);
  }, []);

  const setProvider = useCallback((newProvider: IOfframpProvider | null) => {
    setProviderState(newProvider);
  }, []);

  const reset = useCallback(() => {
    setCountryState(null);
    setChainState(null);
    setTokenState(null);
    setAmountState('');
    setProviderState(null);
    // Keep userAddress as it doesn't change
  }, []);

  const isReady = useCallback(() => {
    return !!(country && chain && token && provider);
  }, [country, chain, token, provider]);

  const getContext = useCallback((): IOfframpContext | null => {
    if (!country || !chain || !token || !provider || !currencyCode) {
      return null;
    }

    return {
      country,
      chain,
      token,
      amount,
      userAddress,
      currencyCode,
      onBack: reset,
    };
  }, [country, chain, token, amount, userAddress, currencyCode, provider, reset]);

  const value: OfframpContextState = {
    country,
    chain,
    token,
    amount,
    userAddress,
    provider,
    currencyCode,
    setCountry,
    setChain,
    setToken,
    setAmount,
    setUserAddress,
    setProvider,
    reset,
    isReady,
    getContext,
  };

  return (
    <OfframpContext.Provider value={value}>
      {children}
    </OfframpContext.Provider>
  );
}

export function useOfframpContext() {
  const context = useContext(OfframpContext);
  if (context === undefined) {
    throw new Error('useOfframpContext must be used within an OfframpProvider');
  }
  return context;
}
