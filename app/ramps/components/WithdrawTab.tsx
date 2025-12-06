"use client";

import { useState, useMemo, useEffect } from "react";
import { useAccount, useConnect, useSwitchChain } from "wagmi";
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
  isActive?: boolean;
}

export default function WithdrawTab({ walletAddress, isActive = true }: WithdrawTabProps) {
  const { address, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const authenticated = isConnected;
  const login = () => {}; // handled by parent or wallet modal

  const { selectedChain: globalChain, setSelectedChain, selectedToken: globalToken, setSelectedToken } = useChain();
  const [isSwitching, setIsSwitching] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1); // 1: Country & Chain, 2: Form
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(countries[0]); // Default to Tanzania
  const [isAccountVerified, setIsAccountVerified] = useState(false);
  const [autoAdvanceDisabled, setAutoAdvanceDisabled] = useState(false);
  
  // Local state for withdraw tab - independent from global context
  // Initialize with default chain immediately to avoid blank render on first load
  const [withdrawChain, setWithdrawChain] = useState<ChainConfig>(() => 
    SUPPORTED_CHAINS.find(c => c.name === 'Base') || SUPPORTED_CHAINS[0]
  );
  const [withdrawToken, setWithdrawToken] = useState<"USDC" | "USDT" | "CNGN">("USDC");

  // Check KYC prerequisites for withdraw
  // const { 
  //   canWithdraw, 
  //   kyc, 
  //   isLoading: checkingPrerequisites,
  //   refetch: refetchPrerequisites 
  // } = useWithdrawPrerequisites({ enabled: isActive });
  const canWithdraw = true;
  const checkingPrerequisites = false;

  // Context now handles all chain synchronization automatically via priority system

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

  // Auto-advance to step 2 when Indonesia or TZT (test) is selected
  useEffect(() => {
    if ((selectedCountry?.id === 'indonesia' || selectedCountry?.id === 'tzt') && currentStep === 1 && !autoAdvanceDisabled) {
      console.log('Indonesia selected - auto-advancing to RedeemForm');
      setCurrentStep(2);
    }
  }, [selectedCountry, currentStep, autoAdvanceDisabled]);

  // Re-enable auto-advance if user changes country explicitly on step 1
  useEffect(() => {
    if (currentStep === 1) {
      setAutoAdvanceDisabled(false);
    }
  }, [selectedCountry, currentStep]);

  const handleCountrySelect = async (country: Country) => {
    // Use the chain stored in withdraw tab's local state
    const chainToUse = withdrawChain || SUPPORTED_CHAINS.find(c => c.name === 'Base') || SUPPORTED_CHAINS[0];
    
    console.log('=== CONTINUE CLICKED ===');
    console.log('WithdrawTab local state - withdrawChain:', withdrawChain?.name);
    console.log('WithdrawTab local state - withdrawToken:', withdrawToken);
    console.log('Global context - globalChain:', globalChain?.name);
    console.log('Chain to use:', chainToUse.name);
    
    // Switch wallet FIRST to the chain shown in WithdrawTab
    try {
      setIsSwitching(true);
      if (switchChainAsync) {
        // console.log('Switching wallet to:', chainToUse.name, '(ID:', chainToUse.id, ')');
        await switchChainAsync({ chainId: chainToUse.id });
        console.log('✅ Wallet switched successfully to:', chainToUse.name);
        
        // Wait a bit for the wallet chain change to propagate
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('❌ Failed to switch wallet chain:', error);
    } finally {
      setIsSwitching(false);
    }
    
    // Update global context AFTER wallet switches (wallet sync will handle this, but we ensure token is correct)
    setSelectedChain(chainToUse);
    setSelectedToken(withdrawToken);
    console.log('Updated global context to:', chainToUse.name, withdrawToken);
    
    // Move to form step
    setCurrentStep(2);
    console.log('=== MOVING TO STEP 2 ===');
  };

  const handleChainSelect = async (chain: ChainConfig, token: string) => {
    console.log('Chain selected in withdraw tab:', chain.name, token);
    
    // Update local withdraw tab state
    setWithdrawChain(chain);
    const tokenToUse = chain.tokens.includes(token) ? token : chain.tokens[0];
    setWithdrawToken(tokenToUse as "USDC" | "USDT" | "CNGN");
    
    // Also update global context
    setSelectedChain(chain);
    setSelectedToken(tokenToUse as "USDC" | "USDT" | "CNGN");
    
    // Switch wallet chain
    try {
      setIsSwitching(true);
      if (switchChainAsync) {
        await switchChainAsync({ chainId: chain.id });
      }
    } catch (error) {
      console.warn('Failed to switch wallet chain:', error);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleStepBack = () => {
    if (currentStep === 2) {
      setAutoAdvanceDisabled(true);
      // If user is in Yellow Card (TZT) flow, reset to Tanzania so step 1 shows chain/token selectors
      if (selectedCountry?.id === 'tzt') {
        const tz = countries.find(c => c.id === 'tanzania');
        if (tz) setSelectedCountry(tz);
      }
      setCurrentStep(1);
    }
  };

  // Note: No early returns for auth - show full UI with login prompts instead
  // This allows users to explore the interface before signing in

  return (
    <div className="max-w-4xl mx-auto">
      {/* Single Card with Progressive Steps */}
      <Card className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-800/95 backdrop-blur-xl border border-slate-700/60 shadow-2xl !rounded-3xl overflow-hidden">
        <CardHeader className="pb-4 sm:pb-6 pt-5 sm:pt-7 px-4 sm:px-7 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent">
          <CardTitle className="text-lg text-white flex items-center gap-3 font-semibold mx-auto">
            {/* <div className="p-2 bg-gradient-to-br from-purple-500/20 to-violet-500/20 rounded-xl border border-purple-500/30">
              <Globe className="w-5 h-5 text-purple-400" />
            </div> */}
            Send Money Globally
          </CardTitle>
          <CardDescription className="text-slate-400 text-sm mt-2">
            {currentStep === 1 && ''}
            {currentStep === 2 && ''}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-7 pb-5 sm:pb-7">
          {/* Login Banner - Show when not authenticated */}
          {!authenticated && (
            <div className="bg-amber-900/20 border border-amber-500/50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h4 className="text-amber-300 font-medium text-sm">Sign in to Send</h4>
                  <p className="text-amber-200/80 text-xs mt-1">
                    Connect your wallet or email to withdraw funds
                  </p>
                </div>
                <Button
                  onClick={login}
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium px-3 py-1.5 h-auto"
                >
                  Sign In
                </Button>
              </div>
            </div>
          )}

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
                  <SelectTrigger className="w-full rounded-xl bg-slate-900/60 border border-slate-600/60 px-4 py-3 text-white focus:ring-2 focus:ring-purple-500/50 hover:bg-slate-900/80 hover:border-purple-500/50 transition-all duration-200 h-12 shadow-sm">
                    <SelectValue placeholder="Select a country">
                      {selectedCountry && (
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{selectedCountry.flag}</span>
                          <span className="text-base font-medium">{selectedCountry.name}</span>
                          <span className="text-slate-400 text-sm">({selectedCountry.currencySymbol})</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/60 rounded-xl shadow-2xl">
                    {countries.map((country) => (
                      <SelectItem 
                        key={country.id} 
                        value={country.id}
                        className="text-white hover:bg-purple-500/10 focus:bg-purple-500/15 cursor-pointer rounded-lg transition-colors my-0.5 py-2.5"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{country.flag}</span>
                          <span className="text-base font-medium">{country.name}</span>
                          <span className="text-sm text-slate-400">({country.currencySymbol})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Chain & Token Selection (only for non-Indonesia and non-TZT) */}
              {selectedCountry && selectedCountry.id !== 'indonesia' && selectedCountry.id !== 'tzt' && (
                <div className="space-y-3">
                  {/* <label className="text-sm font-semibold text-slate-200">
                    Blockchain Network & Token
                  </label> */}
                  <ChainSelector
                    chains={SUPPORTED_CHAINS}
                    onSelectChain={handleChainSelect}
                    userAddress={address || ''}
                    initialChain={withdrawChain}
                  />
                </div>
              )}

              {/* KYC Alert Banner (only show if authenticated and KYC not completed) */}
              {authenticated && !checkingPrerequisites && !canWithdraw && (
                <div className="bg-amber-900/20 border border-amber-500/50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-amber-300 font-medium text-sm">KYC Verification Required</h4>
                      <p className="text-amber-200/80 text-xs mt-1">
                        Complete identity verification to withdraw/Deposit
                      </p>
                    </div>
                    <Button
                      onClick={() => window.location.href = '/kyc'}
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium px-3 py-1.5 h-auto"
                    >
                      Verify Now
                    </Button>
                  </div>
                </div>
              )}

              {/* Continue Button (only for non-Indonesia and non-TZT) */}
              {selectedCountry && selectedCountry.id !== 'indonesia' && selectedCountry.id !== 'tzt' && (
                <Button
                  onClick={async () => {
                    // Check authentication first
                    if (!authenticated) {
                      login();
                      return;
                    }
                    // Check KYC before proceeding
                    if (!canWithdraw && !checkingPrerequisites) {
                      // Show toast notification
                      const toastDiv = document.createElement('div');
                      toastDiv.className = 'fixed top-4 right-4 bg-amber-900 border border-amber-600 text-amber-100 px-4 py-3 rounded-lg shadow-xl z-50 max-w-md';
                      toastDiv.innerHTML = `
                        <div class="flex items-center gap-3">
                          <svg class="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div>
                            <p class="font-medium text-sm">Please complete KYC verification first</p>
                            <p class="text-xs text-amber-200/80 mt-1">Identity verification is required to withdraw funds</p>
                          </div>
                        </div>
                      `;
                      document.body.appendChild(toastDiv);
                      setTimeout(() => toastDiv.remove(), 4000);
                      return;
                    }
                    await handleCountrySelect(selectedCountry);
                  }}
                  disabled={isSwitching}
                  className="w-full bg-gradient-to-r from-purple-600 via-purple-500 to-violet-600 hover:from-purple-700 hover:via-purple-600 hover:to-violet-700 text-white font-semibold py-6 rounded-xl shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <span className="flex items-center justify-center gap-2 text-base">
                    {isSwitching ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Preparing...
                      </>
                    ) : !authenticated ? (
                      <>
                        Sign In to Continue
                      </>
                    ) : (
                      <>
                        Continue
                      </>
                    )}
                  </span>
                </Button>
              )}
            </motion.div>
          )}

          {/* Step 2: Form (Amount & Details) */}
          {currentStep === 2 && selectedCountry && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Offramp Form - PayRamp */}
              {isSwitching ? (
                // Show simple loading state
                <Card className="bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border-slate-700/50">
                  <CardContent className="flex items-center justify-center py-24">
                    <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                  </CardContent>
                </Card>
              ) : (
                <OffRampForm
                  chain={withdrawChain}
                  token={withdrawToken}
                  onTokenChange={(token) => {
                    setWithdrawToken(token as "USDC" | "USDT" | "CNGN");
                  }}
                  onBack={handleStepBack}
                  isAccountVerified={isAccountVerified}
                  setIsAccountVerified={setIsAccountVerified}
                  preselectedCurrency={selectedCountry.currencySymbol}
                />
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
