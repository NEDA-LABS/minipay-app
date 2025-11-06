import React, { useState } from 'react';
import TokenBalanceCard from './TokenBalanceCard';
import { ChainConfig } from './offrampHooks/constants';
import { useBalances } from './offrampHooks/useBalance';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { stablecoins } from '../../data/stablecoins';

interface TokenSelectorProps {
  chain: ChainConfig;
  onSelectToken: (chain: ChainConfig, token: string) => void;
  userAddress: string;
  initialToken?: string;
}

const TokenSelector: React.FC<TokenSelectorProps> = ({ chain, onSelectToken, userAddress, initialToken }) => {
  const { balances, loading } = useBalances([chain], userAddress);
  const [selectedToken, setSelectedToken] = useState<string>(initialToken || chain.tokens[0]);

  // Helper function to get token icon
  const getTokenIcon = (token: string) => {
    const stablecoin = stablecoins.find(s => s.baseToken === token);
    return stablecoin?.flag || '/default-token-icon.png';
  };

  const handleTokenSelect = (token: string) => {
    setSelectedToken(token);
    console.log(`Token selected: ${token} on ${chain.name}`);
    onSelectToken(chain, token);
  };

  return (
    <div className="bg-gradient-to-br from-slate-800/80 via-slate-800/60 to-slate-900/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-700/50 hover:border-slate-600/60 transition-all duration-300">
      <div className="mb-4 sm:mb-5">
        <h2 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
          <img src={chain.icon} alt={chain.name} className="w-4 h-4 sm:w-5 sm:h-5 rounded-full" />
          Select Token on {chain.name}
        </h2>
        <p className="text-slate-400 text-[10px] sm:text-xs mt-1.5">Choose the stablecoin you want to cash-out</p>
      </div>

      {/* Token Selection */}
      <div className="mb-4 sm:mb-5">
        <label className="block text-xs sm:text-sm font-medium text-slate-200 mb-2">
          Token
        </label>
        <Select 
          value={selectedToken} 
          onValueChange={handleTokenSelect}
        >
          <SelectTrigger className="w-full rounded-xl bg-slate-900/70 border border-slate-600/60 px-2.5 sm:px-3.5 py-2 sm:py-3 text-white focus:ring-2 focus:ring-purple-500/50 hover:bg-slate-900/90 hover:border-purple-500/50 transition-all duration-200 h-auto shadow-sm">
            <SelectValue placeholder="Select token">
              {selectedToken && (
                <div className="flex items-center justify-between gap-1.5 sm:gap-2 w-full">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <img src={getTokenIcon(selectedToken)} alt={selectedToken} className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full" />
                    <span className="text-xs sm:text-sm">{selectedToken}</span>
                  </div>
                  <span className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[60px] sm:max-w-none">
                    {loading ? '...' : parseFloat(balances[chain.id]?.[selectedToken] || '0').toFixed(2)}
                  </span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/60 rounded-xl shadow-2xl">
            {chain.tokens.map((token) => (
              <SelectItem 
                key={token} 
                value={token}
                className="text-white hover:bg-purple-500/10 focus:bg-purple-500/15 cursor-pointer rounded-lg transition-colors my-0.5"
              >
                <div className="flex items-center justify-between gap-3 w-full">
                  <div className="flex items-center gap-2">
                    <img src={getTokenIcon(token)} alt={token} className="w-4 h-4 rounded-full" />
                    <span>{token}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {loading ? '...' : parseFloat(balances[chain.id]?.[token] || '0').toFixed(4)}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Token Balance Cards */}
      {/* <div className="grid grid-cols-1 gap-2 sm:gap-3">
        {chain.tokens.map((token) => (
          <div
            key={token}
            onClick={() => handleTokenSelect(token)}
            className={`cursor-pointer p-3 rounded-lg border transition-all ${
              selectedToken === token
                ? 'bg-purple-500/20 border-purple-500/50'
                : 'bg-slate-900/50 border-slate-700/50 hover:border-slate-600/80'
            }`}
          >
            <TokenBalanceCard
              token={token}
              balance={balances[chain.id]?.[token] || '0'}
              loading={loading}
              isSelected={selectedToken === token}
              compactView={true}
            />
          </div>
        ))}
      </div> */}
    </div>
  );
};

export default TokenSelector;
