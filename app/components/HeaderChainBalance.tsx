"use client";
import React, { useState, useEffect, useCallback } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { stablecoins } from "../data/stablecoins";
import { SUPPORTED_CHAINS } from "@/data/platformSupportedChains";
import { Loader2, ChevronDown, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChainSwitcher from "@/components/ChainSwitcher";
import { StablecoinBalanceTracker } from "@/components/StablecoinBalanceTracker";
import { useChain } from "@/contexts/ChainContext";

type ChainId = 8453 | 42161 | 137 | 42220 | 56 | 534352 | 10 | 1135;

interface Chain {
  id: number;
  name: string;
  rpcUrl?: string;
}

interface StablecoinBalances {
  [token: string]: number;
}

interface ExchangeRates {
  [currency: string]: number;
}

export const HeaderChainBalance = () => {
  const { user, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { selectedChain: globalSelectedChain, setSelectedChain: setGlobalSelectedChain } = useChain();
  const [currentChain, setCurrentChain] = useState<Chain | null>(null);
  const [balances, setBalances] = useState<StablecoinBalances>({});
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<ethers.providers.Provider | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [totalBalance, setTotalBalance] = useState(0);

  const address = wallets[0]?.address || null;

  const currencies = [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "TZS", symbol: "TSh", name: "Tanzania Shilling" },
    { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
    { code: "ZAR", symbol: "R", name: "South African Rand" },
    { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
    { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
    { code: "BRL", symbol: "R$", name: "Brazilian Real" },
    { code: "TRY", symbol: "₺", name: "Turkish Lira" },
    { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
    { code: "MXN", symbol: "$", name: "Mexican Peso" },
  ];

  const initializeProvider = useCallback(async () => {
    if (!authenticated || !address || wallets.length === 0) {
      setCurrentChain(null);
      return;
    }

    const wallet = wallets[0];
    
    try {
      const chainId = wallet.chainId.split(":")[1];
      const chainIdNum = parseInt(chainId, 10);
      
      const matchedChain = SUPPORTED_CHAINS.find(c => c.id === chainIdNum) || null;
      setCurrentChain(matchedChain);

      // Sync with global chain context - find matching payramp chain
      // Only sync if global context is null or if wallet chain actually changed
      if (matchedChain && (!globalSelectedChain || globalSelectedChain?.id !== matchedChain.id)) {
        const payrampChains = await import('@/ramps/payramp/offrampHooks/constants');
        const matchingPayrampChain = payrampChains.SUPPORTED_CHAINS.find(
          (c: any) => c.id === matchedChain.id
        );
        if (matchingPayrampChain) {
          console.log('HeaderChainBalance: Syncing wallet chain to context:', matchingPayrampChain.name);
          setGlobalSelectedChain(matchingPayrampChain);
        }
      }

      if (!matchedChain) {
        return;
      }

      const ethereumProvider = await wallet.getEthereumProvider();
      const newProvider = new ethers.providers.Web3Provider(ethereumProvider);
      
      setProvider(newProvider);
    } catch (error) {
      console.error("Error initializing provider:", error);
      if (retryCount < 3) {
        setTimeout(() => setRetryCount(c => c + 1), 2000);
      }
    }
  }, [authenticated, address, wallets, retryCount, globalSelectedChain, setGlobalSelectedChain]);

  const fetchExchangeRates = useCallback(async () => {
    try {
      const response = await fetch(
        "https://api.exchangerate-api.com/v4/latest/USD"
      );
      const data = await response.json();

      const filteredRates: ExchangeRates = {};
      currencies.forEach((currency) => {
        if (data.rates[currency.code]) {
          filteredRates[currency.code] = data.rates[currency.code];
        }
      });

      filteredRates["USD"] = 1;
      setExchangeRates(filteredRates);
    } catch (error) {
      console.error("Failed to fetch exchange rates:", error);
      setExchangeRates({ USD: 1 });
    }
  }, [currencies]);

  const fetchAllBalances = useCallback(async () => {
    if (!address || !authenticated || !provider || !currentChain) return;

    setLoading(true);

    try {
      const newBalances: StablecoinBalances = {};
      const contractCalls = [];

      for (const coin of stablecoins) {
        if (!coin.chainIds.includes(currentChain.id)) continue;

        const tokenAddress = (coin.addresses as Record<string, string | undefined>)[currentChain.id.toString()];
        if (!tokenAddress) continue;

        let decimals = 18;
        if (typeof coin.decimals === "number") {
          decimals = coin.decimals;
        } else if (typeof coin.decimals === "object" && (currentChain.id as ChainId) in coin.decimals) {
          decimals = coin.decimals[currentChain.id as keyof typeof coin.decimals];
        }

        if (tokenAddress === ethers.constants.AddressZero) {
          contractCalls.push(provider.getBalance(address));
        } else {
          const contract = new ethers.Contract(
            tokenAddress,
            ["function balanceOf(address) view returns (uint256)"],
            provider
          );
          contractCalls.push(contract.balanceOf(address));
        }
      }

      const results = await Promise.allSettled(contractCalls);

      let index = 0;
      for (const coin of stablecoins) {
        if (!coin.chainIds.includes(currentChain.id)) continue;
        
        const tokenAddress = (coin.addresses as Record<string, string | undefined>)[currentChain.id.toString()];
        if (!tokenAddress) continue;

        let decimals = 18;
        if (typeof coin.decimals === "number") {
          decimals = coin.decimals;
        } else if (typeof coin.decimals === "object" && (currentChain.id as ChainId) in coin.decimals) {
          decimals = coin.decimals[currentChain.id as keyof typeof coin.decimals];
        }

        const result = results[index++];
        if (result.status === "fulfilled") {
          const balance = ethers.utils.formatUnits(result.value, decimals);
          newBalances[coin.baseToken] = parseFloat(balance);
        }
      }

      setBalances(newBalances);
    } catch (error) {
      console.error("Error fetching balances:", error);
    } finally {
      setLoading(false);
    }
  }, [address, authenticated, provider, currentChain]);

  const calculateTotalBalance = useCallback(() => {
    let total = 0;

    stablecoins.forEach((coin) => {
      const balance = balances[coin.baseToken] || 0;
      if (balance > 0) {
        const fromRate = exchangeRates[coin.currency] || 1;
        const toRate = exchangeRates[selectedCurrency] || 1;

        const usdAmount = balance / fromRate;
        const convertedBalance = usdAmount * toRate;
        total += convertedBalance;
      }
    });

    setTotalBalance(total);
    return total;
  }, [balances, exchangeRates, selectedCurrency]);

  useEffect(() => {
    fetchExchangeRates();
  }, [fetchExchangeRates]);

  useEffect(() => {
    if (retryCount > 0) {
      initializeProvider();
    }
  }, [retryCount, initializeProvider]);

  useEffect(() => {
    if (wallets.length > 0) {
      initializeProvider();
    }
  }, [wallets[0]?.chainId, initializeProvider]);

  useEffect(() => {
    if (authenticated && address && provider && currentChain) {
      fetchAllBalances();
    }
  }, [authenticated, address, provider, currentChain, fetchAllBalances]);

  useEffect(() => {
    calculateTotalBalance();
  }, [calculateTotalBalance]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (authenticated && address && provider && currentChain) {
        fetchAllBalances();
        fetchExchangeRates();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [authenticated, address, provider, currentChain, fetchAllBalances, fetchExchangeRates]);

  if (!authenticated) return null;

  return (
    <>
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Chain Switcher */}
        <ChainSwitcher />
        
        {/* Balance Display Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1 sm:gap-2 bg-slate-800/80 border border-slate-600/50 hover:bg-slate-700/80 transition-all duration-200 rounded-full px-2 sm:px-3"
        >
          {/* <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" /> */}
          {loading ? (
            <Loader2 className="animate-spin w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
          ) : (
            <span className="text-[10px] sm:text-sm font-semibold text-slate-100">
              ${totalBalance.toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </span>
          )}
        </Button>
      </div>

      {/* Stablecoins Dialog */}
      <StablecoinBalanceTracker
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        setTotalBalance={setTotalBalance}
        setLoading={setLoading}
      />
    </>
  );
};
