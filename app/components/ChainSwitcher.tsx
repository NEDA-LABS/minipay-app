'use client';
import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Check, ChevronDown } from 'lucide-react';
import { useWallets } from '@privy-io/react-auth';
import { polygon, arbitrum, optimism, base, bsc, mainnet, scroll, celo, lisk } from 'viem/chains';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Button } from '../components/ui/button';

// Define supported chains with their metadata
const SUPPORTED_CHAINS = [
  {
    ...polygon,
    icon: '/polygon.svg',
  },
  {
    ...arbitrum,
    icon: '/arbitrum.svg',
  },
  {
    ...optimism,
    icon: '/optimism.svg',
  },
  {
    ...base,
    icon: '/base.svg',
  },
  {
    ...bsc,
    icon: '/bnb.svg',
  },
  {
    ...scroll,
    icon: '/scroll.svg',
  },
  {
    ...celo,
    icon: '/celo.svg',
  },
  {
    ...lisk,
    icon: '/lisk.svg',
  }
];

const DEFAULT_CHAIN = SUPPORTED_CHAINS[3]; // Base

const ChainSwitcher: React.FC = () => {
  const { wallets } = useWallets();
  
  const currentChainId = wallets[0]?.chainId;
  
  const [error, setError] = useState("");
  const [isSwitching, setIsSwitching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Get current chain from supported chains or fallback to default
  const currentChain = SUPPORTED_CHAINS.find(
    chain => chain.id.toString() === currentChainId?.replace('eip155:', '')
  ) || DEFAULT_CHAIN;

  // Monitor chain changes and reset switching state
  useEffect(() => {
    if (isSwitching && currentChainId) {
      // Chain has changed, stop the switching state
      setIsSwitching(false);
      setError("");
    }
  }, [currentChainId, isSwitching]);

  const handleSwitch = async (chainId: number) => {
    const normalizedCurrentChainId = currentChainId?.replace('eip155:', '');
    
    if (chainId.toString() === normalizedCurrentChainId) {
      setIsOpen(false);
      return;
    }
    
    console.log("Switching to chain:", chainId);
    console.log("Current wallet type:", wallets[0]?.walletClientType);
    
    setIsSwitching(true);
    setError("");
    
    try {
      await wallets[0].switchChain(chainId);
      console.log("Successfully switched to chain:", chainId);
      
      // Add a small delay to ensure chain switch is complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIsOpen(false);
    } catch (err) {
      console.error("Chain switch error:", err);
      
      let errorMessage = "Failed to switch chains";
      
      if (err instanceof Error) {
        if (err.message.includes('rejected')) {
          errorMessage = "Chain switch was rejected by user";
        } else if (err.message.includes('4902')) {
          errorMessage = "Chain not found in wallet. Please add it manually.";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsSwitching(false);
    }
  };

  const createFallbackIcon = (chainName: string) => {
    return `data:image/svg+xml;base64,${btoa(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="8" fill="#666"/>
        <text x="8" y="11" text-anchor="middle" fill="white" font-size="8">${chainName.charAt(0)}</text>
      </svg>`
    )}`;
  };

  if (!wallets || wallets.length === 0) {
    return (
      <Button disabled variant="outline" size="sm">
        No Wallet
      </Button>
    );
  }

  return (
    <div className="relative">
      {error && (
        <div className="absolute bottom-full mb-2 left-0 bg-red-50 border border-red-200 p-3 z-50 max-w-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-500 w-4 h-4 flex-shrink-0" />
            <span className="text-red-800 text-sm">{error}</span>
            <button 
              onClick={() => setError("")} 
              className="text-red-400 hover:text-red-600 ml-auto flex-shrink-0"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="secondary" 
            size="sm"
            disabled={isSwitching}
            className="flex items-center gap-2 bg-slate-800/80 border border-slate-600/50 hover:bg-slate-700/80 cursor-pointer w-full rounded-full px-2 sm:px-3"
          >
            {isSwitching ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : (
              <>
                <div className="bg-white rounded-full p-0.5 pointer-events-none">
                  <img 
                    src={currentChain.icon} 
                    alt={currentChain.name}
                    className="w-3 h-3 sm:w-4 sm:h-4 rounded-full pointer-events-none"
                    onError={(e) => {
                      e.currentTarget.src = createFallbackIcon(currentChain.name);
                    }}
                  />
                </div>
                <span className="text-[8px] sm:text-sm font-medium text-slate-100 pointer-events-none hidden sm:inline">{currentChain.name}</span>
                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-slate-100 ml-1 pointer-events-none hidden sm:inline" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="start" className="w-56 bg-slate-800 border-slate-700">
          <DropdownMenuLabel className="text-slate-200">Switch Network</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-700" />
          
          {SUPPORTED_CHAINS.map(chain => {
            const isCurrentChain = chain.id.toString() === currentChainId?.replace('eip155:', '');
            
            return (
              <DropdownMenuItem
                key={chain.id}
                onClick={() => handleSwitch(chain.id)}
                disabled={isCurrentChain || isSwitching}
                className="flex items-center gap-3 cursor-pointer text-slate-100 hover:bg-slate-700 focus:bg-slate-700 focus:text-slate-100"
              >
                <div className="bg-white rounded-full p-1">
                  <img 
                    src={chain.icon} 
                    alt={chain.name}
                    className="w-5 h-5 rounded-full"
                    onError={(e) => {
                      e.currentTarget.src = createFallbackIcon(chain.name);
                    }}
                  />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{chain.name}</div>
                  <div className="text-xs text-slate-400">
                    {chain.nativeCurrency.symbol}
                  </div>
                </div>
                {isCurrentChain && (
                  <Check className="w-4 h-4 text-blue-400" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ChainSwitcher;