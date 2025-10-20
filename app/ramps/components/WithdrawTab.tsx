"use client";

import { useState, useMemo, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useChain } from "@/contexts/ChainContext";
import { 
  ArrowRight, 
  Check, 
  ChevronRight, 
  Globe, 
  Wallet,
  AlertCircle,
  Sparkles,
  DollarSign,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import ChainSelector from "@/ramps/payramp/ChainSelector";
import OffRampForm from "@/ramps/payramp/OffRampForm";
import { RedeemForm } from "@/ramps/idrxco/components/RedeemForm";
import { WalletType } from "@/utils/biconomyExternal";
import { SUPPORTED_CHAINS, DEFAULT_CHAIN, ChainConfig } from "@/ramps/payramp/offrampHooks/constants";
import { motion, AnimatePresence } from "framer-motion";

interface Country {
  id: string;
  name: string;
  currency: string;
  currencySymbol: string;
  flag: string;
  route: string;
}

const countries: Country[] = [
  {
    id: "tanzania",
    name: "Tanzania",
    currency: "Tanzanian Shilling",
    currencySymbol: "TZS",
    flag: "🇹🇿",
    route: "/ramps/payramp",
  },
  {
    id: "indonesia",
    name: "Indonesia",
    currency: "Indonesian Rupiah",
    currencySymbol: "IDR",
    flag: "🇮🇩",
    route: "/ramps/idrxco",
  },
  {
    id: "nigeria",
    name: "Nigeria",
    currency: "Nigerian Naira",
    currencySymbol: "NGN",
    flag: "🇳🇬",
    route: "/ramps/payramp",
  },
  {
    id: "kenya",
    name: "Kenya",
    currency: "Kenyan Shilling",
    currencySymbol: "KES",
    flag: "🇰🇪",
    route: "/ramps/payramp",
  },
  {
    id: "uganda",
    name: "Uganda",
    currency: "Ugandan Shilling",
    currencySymbol: "UGX",
    flag: "🇺🇬",
    route: "/ramps/payramp",
  },
];

type SupportedToken = 'USDC' | 'USDT';

interface WithdrawTabProps {
  walletAddress?: string;
}

export default function WithdrawTab({ walletAddress }: WithdrawTabProps) {
  const { authenticated, login, connectWallet } = usePrivy();
  const { wallets } = useWallets();
  const activeWallet = wallets[0] as WalletType | undefined;

  const { selectedChain, setSelectedChain, selectedToken, setSelectedToken } = useChain();
  const [currentStep, setCurrentStep] = useState<1 | 2>(1); // 1: Country & Chain, 2: Form
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(countries[0]); // Default to Tanzania
  const [isAccountVerified, setIsAccountVerified] = useState(false);
  const [isChainSwitching, setIsChainSwitching] = useState(false);
  const [targetChainId, setTargetChainId] = useState<number | null>(null);

  // Debug: Log context changes and clear loading when chain matches
  useEffect(() => {
    console.log('Context updated - selectedChain:', selectedChain?.name, 'selectedToken:', selectedToken);
    console.log('Context updated - selectedChain FULL OBJECT:', selectedChain);
    console.log('Context updated - selectedChain type:', typeof selectedChain);
    
    // Clear loading state when global context syncs with target chain
    if (isChainSwitching && targetChainId && selectedChain?.id === targetChainId) {
      console.log('Chain switch completed - context synced!');
      setIsChainSwitching(false);
      setTargetChainId(null);
    }
  }, [selectedChain, selectedToken, isChainSwitching, targetChainId]);

  // Timeout fallback: Clear loading after 10 seconds if chain hasn't synced
  useEffect(() => {
    if (isChainSwitching) {
      const timeout = setTimeout(() => {
        console.warn('Chain switch timeout - clearing loading state');
        setIsChainSwitching(false);
        setTargetChainId(null);
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [isChainSwitching]);

  // Sync wallet chain changes to global context (when user switches via header)
  useEffect(() => {
    // Use wallets[0] directly to access chainId (Privy wallet type has chainId property)
    const currentWalletChainId = wallets[0]?.chainId;
    
    if (currentWalletChainId && selectedChain) {
      const walletChainIdNum = typeof currentWalletChainId === 'string' 
        ? parseInt(currentWalletChainId.replace('eip155:', ''))
        : currentWalletChainId;
      
      // If wallet chain differs from global context, update context (unless we're in the middle of switching)
      if (!isChainSwitching && walletChainIdNum !== selectedChain.id) {
        const matchingChain = SUPPORTED_CHAINS.find(c => c.id === walletChainIdNum);
        if (matchingChain) {
          console.log(`Wallet chain changed externally to ${matchingChain.name} - syncing global context`);
          setSelectedChain(matchingChain);
          // Keep the same token if supported, otherwise use first token
          if (!matchingChain.tokens.includes(selectedToken)) {
            setSelectedToken(matchingChain.tokens[0] as "USDC" | "USDT" | "CNGN");
          }
        }
      }
    }
  }, [wallets, selectedChain, isChainSwitching, selectedToken, setSelectedChain, setSelectedToken]);

  // Detect user's country on mount
  useEffect(() => {
    const detectCountry = async () => {
      try {
        // Try to get country from IP geolocation
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const countryCode = data.country_code?.toLowerCase();
        
        // Map country codes to our country IDs
        const countryMap: Record<string, string> = {
          'tz': 'tanzania',
          'id': 'indonesia',
          'ng': 'nigeria',
          'ke': 'kenya',
          'ug': 'uganda'
        };
        
        const detectedCountryId = countryMap[countryCode];
        if (detectedCountryId) {
          const detectedCountry = countries.find(c => c.id === detectedCountryId);
          if (detectedCountry) {
            setSelectedCountry(detectedCountry);
            return;
          }
        }
        
        // If country not in list or detection failed, keep Tanzania as default
        setSelectedCountry(countries[0]); // Tanzania
      } catch (error) {
        console.log('Country detection failed, using Tanzania as default');
        setSelectedCountry(countries[0]); // Tanzania
      }
    };

    detectCountry();
  }, []);

  const handleCountrySelect = (country: Country) => {
    console.log('handleCountrySelect - Current selectedChain:', selectedChain?.name);
    console.log('handleCountrySelect - Current selectedToken:', selectedToken);
    console.log('handleCountrySelect - selectedChain object:', selectedChain);
    
    // Always use the chain from global context (should already be set)
    // The chain selection happens in ChainSelector which updates global context
    if (!selectedChain) {
      console.warn('No chain selected - this should not happen if ChainSelector was used');
      // Fallback to default chain if somehow no chain is selected
      const defaultChain = SUPPORTED_CHAINS.find(c => c.name === 'Base') || SUPPORTED_CHAINS[0];
      console.log(`Fallback: Auto-selecting chain:`, defaultChain);
      setSelectedChain(defaultChain);
      setSelectedToken('USDC');
    } else {
      console.log(`Using selected chain from context: ${selectedChain.name}, token: ${selectedToken}`);
    }
    
    // Move to form step (step 2)
    setCurrentStep(2);
  };

  const handleChainSelect = async (chain: ChainConfig, token: string) => {
    console.log(`handleChainSelect called with: ${chain.name}, token: ${token}`);
    console.log(`Before update - selectedChain:`, selectedChain?.name);
    
    // Set loading state and target chain BEFORE updating context
    setIsChainSwitching(true);
    setTargetChainId(chain.id);
    
    // Update global context (this will trigger the header ChainSwitcher to update)
    if (chain.tokens.includes(token)) {
      setSelectedChain(chain);
      setSelectedToken(token as "USDC" | "USDT" | "CNGN");
      console.log(`Chain selected: ${chain.name}, token: ${token}`);
    } else {
      const defaultToken = chain.tokens[0];
      setSelectedChain(chain);
      setSelectedToken(defaultToken as "USDC" | "USDT" | "CNGN");
      console.log(`Chain selected: ${chain.name}, token: ${defaultToken} (default)`);
    }
    
    // Also switch the wallet's chain to keep them in sync with the global context
    try {
      if (activeWallet && typeof activeWallet.switchChain === 'function') {
        console.log(`Switching wallet to chain: ${chain.name} (${chain.id})`);
        await activeWallet.switchChain(chain.id);
        console.log(`Wallet chain switched successfully to ${chain.name}`);
      }
    } catch (error) {
      console.warn('Failed to switch wallet chain:', error);
      // Continue anyway - the loading state will clear when context syncs
      // User can manually switch if needed via the header chain switcher
    }
    
    console.log(`Chain selection complete - waiting for global context to sync`);
  };

  const handleStepBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  // Authentication checks
  if (!authenticated) {
    return (
      <div className="max-w-4xl mx-auto">
      <Card className="bg-slate-800/90 backdrop-blur-sm border-slate-700/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 text-base">
                Authentication Required
              </h3>
              <p className="text-amber-700 text-sm mt-1">
                Please login to access the withdrawal service
              </p>
            </div>
            <Button
              onClick={login}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium shadow-lg"
            >
              Login
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    );
  }

  if (!activeWallet) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="bg-slate-800/90 backdrop-blur-sm border-slate-700/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-100 to-red-100">
                <Wallet className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 text-base">
                  Wallet Connection Required
                </h3>
                <p className="text-orange-700 text-sm mt-1">
                  Please connect a wallet to proceed with withdrawal
                </p>
              </div>
              <Button
                onClick={connectWallet}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-medium shadow-lg"
              >
                Connect Wallet
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Single Card with Progressive Steps */}
      <Card className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-800/95 backdrop-blur-xl border border-slate-700/60 shadow-2xl !rounded-3xl overflow-hidden">
        <CardHeader className="pb-6 pt-7 px-7 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent">
          <CardTitle className="text-lg text-white flex items-center gap-3 font-semibold">
            {/* <div className="p-2 bg-gradient-to-br from-purple-500/20 to-violet-500/20 rounded-xl border border-purple-500/30">
              <Globe className="w-5 h-5 text-purple-400" />
            </div> */}
            Withdraw to Fiat
          </CardTitle>
          <CardDescription className="text-slate-400 text-sm mt-2">
            {currentStep === 1 && ''}
            {currentStep === 2 && ''}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 px-7 pb-7">
          {/* Step 1: Country & Chain Selection */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Country Selection */}
              <div className="space-y-3">
                {/* <label className="text-sm font-semibold text-slate-200">
                  Destination Country
                </label> */}
                <Select
                  value={selectedCountry?.id || ""}
                  onValueChange={(value) => {
                    const country = countries.find(c => c.id === value);
                    if (country) setSelectedCountry(country);
                  }}
                >
                  <SelectTrigger className="w-full bg-slate-800/60 border-slate-600/60 text-slate-100 hover:bg-slate-800/80 hover:border-purple-500/60 focus:border-purple-500 transition-all duration-200 h-12 rounded-xl shadow-sm hover:shadow-purple-500/10">
                    <SelectValue placeholder="Select a country">
                      {selectedCountry && (
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{selectedCountry.flag}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{selectedCountry.name}</span>
                            <span className="text-slate-400 text-sm">({selectedCountry.currencySymbol})</span>
                          </div>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800/95 backdrop-blur-xl border-slate-700/60 rounded-xl shadow-2xl">
                    {countries.map((country) => (
                      <SelectItem 
                        key={country.id} 
                        value={country.id}
                        className="text-slate-100 focus:bg-purple-500/10 hover:bg-purple-500/5 focus:text-white cursor-pointer rounded-lg transition-colors my-0.5"
                      >
                        <div className="flex items-center gap-3 py-1">
                          <span className="text-xl">{country.flag}</span>
                          <div className="flex-1">
                            <div className="font-medium">{country.name}</div>
                            <div className="text-xs text-slate-400">{country.currency}</div>
                          </div>
                          <Badge className="bg-gradient-to-r from-purple-500/20 to-violet-500/20 text-purple-300 border-purple-500/40 font-medium">
                            {country.currencySymbol}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Chain & Token Selection (only for non-Indonesia) */}
              {selectedCountry && selectedCountry.id !== 'indonesia' && (
                <div className="space-y-3">
                  {/* <label className="text-sm font-semibold text-slate-200">
                    Blockchain Network & Token
                  </label> */}
                  <ChainSelector
                    chains={SUPPORTED_CHAINS}
                    onSelectChain={handleChainSelect}
                    userAddress={activeWallet?.address || ''}
                    initialChain={selectedChain}
                  />
                </div>
              )}

              {/* Continue Button */}
              {selectedCountry && (selectedCountry.id === 'indonesia' || selectedChain) && (
                <Button
                  onClick={() => handleCountrySelect(selectedCountry)}
                  disabled={isChainSwitching}
                  className="w-full bg-gradient-to-r from-purple-600 via-purple-500 to-violet-600 hover:from-purple-700 hover:via-purple-600 hover:to-violet-700 text-white font-semibold py-6 rounded-xl shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <span className="flex items-center justify-center gap-2 text-base">
                    {isChainSwitching ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Switching Chain...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </span>
                </Button>
              )}
            </motion.div>
          )}

          {/* Step 2: Form (Amount & Details) */}
          {currentStep === 2 && selectedCountry && (selectedCountry.id === 'indonesia' || selectedChain) && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Offramp Form - Conditional based on country */}
              {selectedCountry.id === 'indonesia' ? (
                <RedeemForm />
              ) : isChainSwitching ? (
                // Show loading state while chain is switching
                <Card className="bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border-slate-700/50">
                  <CardContent className="flex flex-col items-center justify-center py-16 px-6">
                    <div className="relative mb-6">
                      <Loader2 className="w-16 h-16 text-purple-500 animate-spin" />
                      <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full animate-pulse" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Switching Chain</h3>
                    <p className="text-slate-400 text-center max-w-md">
                      Waiting for network to sync with your wallet...
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      Target: {SUPPORTED_CHAINS.find(c => c.id === targetChainId)?.name}
                    </p>
                  </CardContent>
                </Card>
              ) : selectedChain ? (
                <>
                  {console.log('Rendering OffRampForm with:', { 
                    chain: selectedChain.name, 
                    token: selectedToken,
                    currency: selectedCountry.currencySymbol 
                  })}
                  <OffRampForm
                    chain={selectedChain}
                    token={selectedToken}
                    onTokenChange={(token) => {
                      setSelectedToken(token);
                    }}
                    onBack={handleStepBack}
                    isAccountVerified={isAccountVerified}
                    setIsAccountVerified={setIsAccountVerified}
                    preselectedCurrency={selectedCountry.currencySymbol}
                  />
                </>
              ) : null}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
