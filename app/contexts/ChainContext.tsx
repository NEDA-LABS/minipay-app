"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ChainConfig, SUPPORTED_CHAINS, DEFAULT_CHAIN } from '@/ramps/payramp/offrampHooks/constants';
import { TOKEN_ADDRESSES } from '@/ramps/payramp/offrampHooks/tokenConfig';

type SupportedToken = keyof typeof TOKEN_ADDRESSES;

interface ChainContextType {
  selectedChain: ChainConfig | null;
  setSelectedChain: (chain: ChainConfig | null) => void;
  selectedToken: SupportedToken;
  setSelectedToken: (token: SupportedToken) => void;
}

const ChainContext = createContext<ChainContextType | undefined>(undefined);

export function ChainProvider({ children }: { children: ReactNode }) {
  const [selectedChain, setSelectedChain] = useState<ChainConfig | null>(DEFAULT_CHAIN);
  const [selectedToken, setSelectedToken] = useState<SupportedToken>(() => {
    return (DEFAULT_CHAIN.tokens[0] as SupportedToken) || 'USDC';
  });

  // Sync token when chain changes
  useEffect(() => {
    if (selectedChain && !selectedChain.tokens.includes(selectedToken)) {
      setSelectedToken((selectedChain.tokens[0] as SupportedToken) || 'USDC');
    }
  }, [selectedChain, selectedToken]);

  return (
    <ChainContext.Provider value={{ selectedChain, setSelectedChain, selectedToken, setSelectedToken }}>
      {children}
    </ChainContext.Provider>
  );
}

export function useChain() {
  const context = useContext(ChainContext);
  if (context === undefined) {
    throw new Error('useChain must be used within a ChainProvider');
  }
  return context;
}
