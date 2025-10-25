'use client';

import React, { useState } from 'react';
import { Chain } from 'viem/chains';
import { Search, X } from 'lucide-react';
import Image from 'next/image';
import { getTokenIcon } from '@/utils/tokenIcons';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Token {
  symbol: string;
  balance: string;
  decimals: number;
  address?: string;
  isNative?: boolean;
}

interface TokenSelectorProps {
  open: boolean;
  onClose: () => void;
  tokens: Token[];
  onSelect: (symbol: string) => void;
  activeChain: Chain;
  selectedToken?: string;
}

export default function TokenSelector({
  open,
  onClose,
  tokens,
  onSelect,
  activeChain,
  selectedToken,
}: TokenSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTokens = tokens.filter((token) =>
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (symbol: string) => {
    onSelect(symbol);
    onClose();
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md rounded-2xl p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-xl font-semibold">Select a Token</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or symbol"
              className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 rounded-xl focus-visible:ring-blue-500"
            />
          </div>
        </div>

        {/* Token List */}
        <ScrollArea className="h-[400px] px-2">
          <div className="space-y-1 pb-4">
            {filteredTokens.length > 0 ? (
              filteredTokens.map((token) => (
                <button
                  key={token.symbol}
                  onClick={() => handleSelect(token.symbol)}
                  disabled={token.symbol === selectedToken}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                    token.symbol === selectedToken
                      ? 'bg-blue-600/20 cursor-not-allowed'
                      : 'hover:bg-slate-700/50 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src={getTokenIcon(token.symbol, activeChain.id)}
                      alt={token.symbol}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    <div className="text-left">
                      <div className="font-semibold text-white">{token.symbol}</div>
                      <div className="text-xs text-slate-400">
                        {token.isNative ? 'Native' : 'ERC20'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-white">{token.balance}</div>
                    <div className="text-xs text-slate-400">Balance</div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-400">No tokens found</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
