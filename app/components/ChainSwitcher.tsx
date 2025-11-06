'use client';
import React from 'react';
import { useAccount } from 'wagmi';
import { celo } from 'viem/chains';
import { Button } from '../components/ui/button';

// MiniPay only supports Celo - no chain switching needed
const CELO_CHAIN = {
  ...celo,
  icon: '/celo.svg',
};

const ChainSwitcher: React.FC = () => {
  const { isConnected } = useAccount();

  const createFallbackIcon = (chainName: string) => {
    return `data:image/svg+xml;base64,${btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="8" fill="#FCFF52"/>
        <text x="8" y="11" text-anchor="middle" fill="#35D07F" font-size="8">${chainName.charAt(0)}</text>
      </svg>`
    )}`;
  };

  if (!isConnected) {
    return (
      <Button disabled variant="outline" size="sm">
        No Wallet
      </Button>
    );
  }

  // MiniPay is always on Celo, just display the current network
  return (
    <div className="relative">
      <Button 
        variant="secondary" 
        size="sm"
        disabled
        className="flex items-center gap-2 border border-slate-600/50 bg-slate-700/80 w-full rounded-full px-2 sm:px-3"
      >
        <div className="bg-white rounded-full p-0.5 pointer-events-none">
          <img 
            src={CELO_CHAIN.icon} 
            alt={CELO_CHAIN.name}
            className="w-4 h-4 sm:w-4 sm:h-4 rounded-full pointer-events-none"
            onError={(e) => {
              e.currentTarget.src = createFallbackIcon(CELO_CHAIN.name);
            }}
          />
        </div>
        <span className="text-[8px] sm:text-sm font-medium text-slate-100 pointer-events-none hidden sm:inline">
          {CELO_CHAIN.name}
        </span>
      </Button>
    </div>
  );
};

export default ChainSwitcher;