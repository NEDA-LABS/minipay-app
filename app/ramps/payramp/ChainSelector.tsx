import React, { useMemo, useState } from 'react';
import TokenBalanceCard from './TokenBalanceCard';
import { ChainConfig } from './offrampHooks/constants';
import { useBalances } from './offrampHooks/useBalance';
import { useWallets } from '@privy-io/react-auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { stablecoins } from '../../data/stablecoins';

interface ChainSelectorProps {
  chains: ChainConfig[];
  onSelectChain: (chain: ChainConfig, token: string) => void;
  userAddress: string;
}

const ChainSelector: React.FC<ChainSelectorProps> = ({ chains, onSelectChain, userAddress }) => {
  const { balances, loading } = useBalances(chains, userAddress);
  const { wallets } = useWallets();

  const [selectedTokens, setSelectedTokens] = useState<Record<string, string>>({});
  const [activeChainId, setActiveChainId] = useState<string>(() => (chains?.[0]?.id ?? 0).toString());

  const activeChain = useMemo(() => {
    return chains.find(c => c.id === Number(activeChainId)) ?? chains[0];
  }, [activeChainId, chains]);

  // Helper function to get token icon
  const getTokenIcon = (token: string) => {
    const stablecoin = stablecoins.find(s => s.baseToken === token);
    return stablecoin?.flag || '/default-token-icon.png';
  };

  const handleChainChange = (chainId: string) => {
    setActiveChainId(chainId);
    const chain = chains.find(c => c.id === Number(chainId));
    if (chain) {
      // Get the selected token for this chain, or default to first token
      const token = selectedTokens[chainId] || chain.tokens[0];
      console.log(`Chain changed to: ${chain.name}, token: ${token}`);
      onSelectChain(chain, token);
    }
  };

  const handleTokenSelect = async (chainId: string, token: string) => {
    setSelectedTokens(prev => ({ ...prev, [chainId]: token }));

    const chain = chains.find(c => c.id === Number(chainId)) || chains[0];
    if (chain) {
      try {
        if (wallets && wallets[0] && typeof wallets[0].switchChain === 'function') {
          await wallets[0].switchChain(chain.id);
        }
      } catch (e) {
        // handle chain switch errors gracefully
      }
      console.log(`Token selected: ${token} on ${chain.name}`);
      onSelectChain(chain, token);
    }
  };

  const currentSelectedToken = selectedTokens[activeChainId] || activeChain?.tokens[0] || '';

  return (
    <div className="bg-gradient-to-br from-slate-800/80 via-slate-800/60 to-slate-900/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-700/50 hover:border-slate-600/60 transition-all duration-300">
      <div className="mb-4 sm:mb-5">
        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          Select Network & Token
        </h2>
        <p className="text-slate-400 text-[10px] sm:text-xs mt-1.5">Choose your blockchain network and token to cash-out</p>
      </div>

      {/* Network and Token Selection - Responsive Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-5">
        {/* Network Dropdown */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-slate-200 mb-2">
            Network
          </label>
          <Select value={activeChainId} onValueChange={handleChainChange}>
            <SelectTrigger className="w-full rounded-xl bg-slate-900/70 border border-slate-600/60 px-2.5 sm:px-3.5 py-2 sm:py-3 text-white focus:ring-2 focus:ring-blue-500/50 hover:bg-slate-900/90 hover:border-blue-500/50 transition-all duration-200 h-auto shadow-sm">
              <SelectValue placeholder="Select network">
                {activeChain && (
                  <div className="flex items-center gap-2">
                    <img src={activeChain.icon} alt={activeChain.name} className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full" />
                    <span className="text-xs sm:text-sm">{activeChain.name}</span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/60 rounded-xl shadow-2xl">
              {chains.map((chain) => (
                <SelectItem 
                  key={chain.id} 
                  value={chain.id.toString()}
                  className="text-white hover:bg-blue-500/10 focus:bg-blue-500/15 cursor-pointer rounded-lg transition-colors my-0.5"
                >
                  <div className="flex items-center gap-2">
                    <img src={chain.icon} alt={chain.name} className="w-4 h-4 rounded-full" />
                    <span>{chain.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Token Dropdown */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-slate-200 mb-2">
            Token
          </label>
          <Select 
            value={currentSelectedToken} 
            onValueChange={(token) => handleTokenSelect(activeChainId, token)}
          >
            <SelectTrigger className="w-full rounded-xl bg-slate-900/70 border border-slate-600/60 px-2.5 sm:px-3.5 py-2 sm:py-3 text-white focus:ring-2 focus:ring-purple-500/50 hover:bg-slate-900/90 hover:border-purple-500/50 transition-all duration-200 h-auto shadow-sm">
              <SelectValue placeholder="Select token">
                {currentSelectedToken && (
                  <div className="flex items-center justify-between gap-1.5 sm:gap-2 w-full">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <img src={getTokenIcon(currentSelectedToken)} alt={currentSelectedToken} className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full" />
                      <span className="text-xs sm:text-sm">{currentSelectedToken}</span>
                    </div>
                    <span className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[60px] sm:max-w-none">
                      {loading ? '...' : parseFloat(balances[activeChain.id]?.[currentSelectedToken] || '0').toFixed(2)}
                    </span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/60 rounded-xl shadow-2xl">
              {activeChain?.tokens.map((token) => (
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
                      {loading ? '...' : parseFloat(balances[activeChain.id]?.[token] || '0').toFixed(4)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-700/40 text-center">
        <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium">Powered by secure off-chain protocols</p>
      </div> */}
    </div>
  );
};

export default ChainSelector;
