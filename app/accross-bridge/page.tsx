"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useAccount, useWalletClient, useBalance, usePublicClient, useSwitchChain } from "wagmi";
import { useWallet, useWallets } from "@/hooks/useWallet";
import { useSearchParams } from "next/navigation";
import { parseEther, formatUnits, isAddress, parseUnits } from "viem";
import { acrossClient } from "@/utils/acrossProtocol";
import { type TransactionProgress } from '@across-protocol/app-sdk';
import toast, { Toaster } from 'react-hot-toast';
import {
  ChevronDownIcon,
  ArrowsUpDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ClockIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { ArrowRightIcon } from "@heroicons/react/24/solid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import { withDashboardLayout } from "@/utils/withDashboardLayout";
import { type Address } from "viem";
import Image from "next/image";
import { chainConfig, explorerConfig, TOKENS, TokenSymbol, getTokenDecimals, CompletedBridge } from "./utils/bridgeConfig";

// Additional types for bridge progress
type ProgressStep = "approve" | "deposit" | "fill";
type ProgressStatus = "pending" | "txSuccess" | "txReverted";

interface Progress {
  step: ProgressStep;
  status: ProgressStatus;
  txReceipt?: any;
  depositId?: string;
  fillTxTimestamp?: number;
  actionSuccess?: boolean;
}

// Export the bridge content component for use in tabs
export function BridgePageContent() {
  const searchParams = useSearchParams();
  const isEmbedded = true; // Always embedded when used in tab
  const { connect, authenticated, ready } = useWallet();
  const { wallets } = useWallets();
  const { address } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  // Form state
  const [fromChainId, setFromChainId] = useState<number>(42161);
  const [toChainId, setToChainId] = useState<number>(10);
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [selectedToken, setSelectedToken] = useState<TokenSymbol>("ETH");

  // UI state
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [quote, setQuote] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [progress, setProgress] = useState<TransactionProgress | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [needsChainSwitch, setNeedsChainSwitch] = useState(false);
  const [isSwitchingChain, setIsSwitchingChain] = useState(false);
  const [supportedChains, setSupportedChains] = useState<any[]>([]);
  const [routeSupported, setRouteSupported] = useState(true);
  const [tokenSupported, setTokenSupported] = useState(true);
  
  // Bridge completion modal state
  const [isBridgeComplete, setIsBridgeComplete] = useState(false);
  const [completedBridge, setCompletedBridge] = useState<CompletedBridge | null>(null);
  const [stepProgress, setStepProgress] = useState<TransactionProgress[]>([]);

  // Compute available tokens
  const availableTokens = useMemo(() => {
    return Object.values(TOKENS).filter(
      (token) => token.addresses[fromChainId as keyof typeof token.addresses] && token.addresses[toChainId as keyof typeof token.addresses]
    );
  }, [fromChainId, toChainId]);

  // Reset selectedToken if not available
  useEffect(() => {
    if (availableTokens.length > 0 && !availableTokens.some((t) => t.symbol === selectedToken)) {
      setSelectedToken(availableTokens[0].symbol as TokenSymbol);
    }
  }, [availableTokens, selectedToken]);

  // Token options for custom select
  const tokenOptions = useMemo(
    () =>
      availableTokens.map((token) => ({
        value: token.symbol,
        label: token.symbol,
        icon: token.icon,
        name: token.name,
      })),
    [availableTokens]
  );

  // Get token details
  const tokenDetails = TOKENS[selectedToken];
  const tokenAddress = tokenDetails.addresses[fromChainId as keyof typeof tokenDetails.addresses] as `0x${string}`;
  
  // Get token decimals for current chain
  const tokenDecimals = useMemo(() => 
    getTokenDecimals(tokenDetails, fromChainId), 
    [tokenDetails, fromChainId]
  );

  // Balance fetching
  const { data: balance } = useBalance({
    address,
    chainId: fromChainId,
    token: tokenAddress === "0x0000000000000000000000000000000000000000" ? undefined : tokenAddress,
  });

  const wallet = wallets?.[0];

  // Handle automatic chain switching with delay for better UX
  const autoSwitchChain = useCallback(async () => {
    if (!address || isSwitchingChain) return;
    
    // Add a small delay to make the switch feel more natural
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsSwitchingChain(true);
    setError("");
    try {
      await switchChainAsync({ chainId: fromChainId });
      setNeedsChainSwitch(false);
      toast.success(`Automatically switched to ${chainConfig[fromChainId as keyof typeof chainConfig]?.name}`);
    } catch (err: any) {
      const errorMsg = `Failed to switch chain: ${err.message || "Unknown error"}`;
      setError(errorMsg);
      toast.error(errorMsg);
      setNeedsChainSwitch(true);
    } finally {
      setIsSwitchingChain(false);
    }
  }, [switchChainAsync, fromChainId, address, isSwitchingChain]);

  // Automatically switch to the "from" chain when needed
  useEffect(() => {
    if (wallet?.chainId && wallet.chainId.toString() !== fromChainId.toString() && wallet && address && ready && authenticated) {
      autoSwitchChain();
    } else if (wallet?.chainId && wallet.chainId.toString() === fromChainId.toString()) {
      setNeedsChainSwitch(false);
    }
  }, [wallet?.chainId, fromChainId, wallet, address, ready, authenticated, autoSwitchChain]);

  // Fetch supported chains
  useEffect(() => {
    const fetchSupportedChains = async () => {
      try {
        const chains = await acrossClient.getSupportedChains({});
        setSupportedChains(chains);
      } catch (err) {
        console.error("Failed to fetch supported chains:", err);
        toast.error("Failed to fetch supported chains");
      }
    };
    if (ready && authenticated) {
      fetchSupportedChains();
    }
  }, [ready, authenticated]);

  // Clear states when chains or token changes
  useEffect(() => {
    setQuote(null);
    setError("");
    setSuccess("");
    
    // Check if route is supported
    const fromSupported = supportedChains.some(chain => chain.chainId === fromChainId);
    const toSupported = supportedChains.some(chain => chain.chainId === toChainId);
    setRouteSupported(fromSupported && toSupported);
    
    // Check if token is supported on both chains
    const tokenSupported = availableTokens.some(token => token.symbol === selectedToken);
    setTokenSupported(tokenSupported);
  }, [fromChainId, toChainId, amount, selectedToken, supportedChains, availableTokens]);

  // Validation
  const validation = useMemo(() => {
    const errors: string[] = [];
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      errors.push("Please enter a valid amount");
    }
    if (fromChainId === toChainId) {
      errors.push("Source and destination chains must be different");
    }
    if (recipient && !isAddress(recipient)) {
      errors.push("Invalid recipient address");
    }
    if (balance && amount) {
      const balanceValue = Number(formatUnits(balance.value, tokenDecimals));
      if (Number(amount) > balanceValue) {
        errors.push("Insufficient balance");
      }
    }
    if (!routeSupported) {
      errors.push("This route is not supported by Across Protocol");
    }
    if (!tokenSupported) {
      errors.push("This token is not supported on selected chains");
    }
    return { isValid: errors.length === 0, errors };
  }, [amount, fromChainId, toChainId, recipient, balance, tokenDecimals, routeSupported, tokenSupported]);

  // Helper function to get token address
  const getTokenAddress = useCallback((token: typeof tokenDetails, chainId: number): string => {
    const address = token.addresses[chainId as keyof typeof token.addresses];
    if (!address) {
      throw new Error(`Token ${token.symbol} not supported on chain ${chainId}`);
    }
    return address;
  }, []);

  // Get quote
  const getQuote = useCallback(async () => {
    if (!validation.isValid || !amount || needsChainSwitch) return;
    setLoading(true);
    setError("");
    setQuote(null);
    
    try {
      const inputToken = getTokenAddress(tokenDetails, fromChainId);
      const outputToken = getTokenAddress(tokenDetails, toChainId);
      
      // Get decimals for both chains
      const inputDecimals = getTokenDecimals(tokenDetails, fromChainId);
      const outputDecimals = getTokenDecimals(tokenDetails, toChainId);

      const quoteParams = {
        route: {
          originChainId: fromChainId,
          destinationChainId: toChainId,
          inputToken: inputToken as Address,
          outputToken: outputToken as Address,
        },
        inputAmount: parseUnits(amount.toString(), inputDecimals),
      };

      const q = await acrossClient.getQuote(quoteParams);
      
      if (q.isAmountTooLow) {
        throw new Error(`Amount too low. Minimum: ${formatUnits(q.limits.minDeposit, inputDecimals)} ${tokenDetails.symbol}`);
      }
      
      setQuote(q);
      toast.success("Quote received successfully");
    } catch (err: any) {
      const errorMessage = err.message || "Failed to get quote";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [amount, fromChainId, toChainId, validation.isValid, tokenDetails, needsChainSwitch, getTokenAddress]);

   //fetch quote when amount changes
   useEffect(() => {
    if (!amount || !validation.isValid || needsChainSwitch) return;
    
    const timeoutId = setTimeout(() => {
      getQuote();
    }, 800);
    
    return () => clearTimeout(timeoutId);
  }, [amount, getQuote, validation.isValid, needsChainSwitch]);

  // Execute bridge
  const executeBridge = useCallback(async () => {
    if (!quote || !walletClient || !address || needsChainSwitch) return;
    
    setExecuting(true);
    setError("");
    setSuccess("");
    setProgress(null);
    setStepProgress([]); // Reset step progress
    
    try {
      const deposit = { ...quote.deposit, recipient: recipient || address };
      await acrossClient.executeQuote({
        walletClient,
        deposit,
        onProgress: (p: TransactionProgress) => {
          setProgress(p);
          setStepProgress(prev => [...prev, p]); // Track all progress steps
          
          if (p.step === "approve" && p.status === "txSuccess") {
            const msg = "Token approval successful! 🎉";
            setSuccess(msg);
            toast.success(msg);
          }
          if (p.step === "deposit" && p.status === "txSuccess") {
            const msg = "Deposit successful! Waiting for fill... ⏳";
            setSuccess(msg);
            toast.success(msg);
          }
          if (p.step === "fill" && p.status === "txSuccess") {
            const msg = "Bridge complete! Funds received ✅";
            setSuccess(msg);
            toast.success(msg);
            
            // Capture deposit transaction from step history
            const depositStep = stepProgress.find(step => step.step === 'deposit' && step.status === 'txSuccess');
            
            // Set completed bridge data for modal
            setCompletedBridge({
              fromChainId,
              toChainId,
              tokenSymbol: selectedToken,
              amountSent: amount,
              amountReceived: formatUnits(quote.deposit.outputAmount, getTokenDecimals(tokenDetails, toChainId)),
              depositTxHash: depositStep?.txReceipt?.transactionHash,
              fillTxHash: p.txReceipt?.transactionHash,
            });
            
            // Show completion modal
            setIsBridgeComplete(true);
            
            // Reset form
            setQuote(null);
            setAmount("");
            setProgress(null);
          }
          if (p.status === "txError") {
            const errorMsg = `Transaction failed at ${p.step} step`;
            setError(errorMsg);
            setProgress(null);
            toast.error(errorMsg);
          }
        },
      });
    } catch (err: any) {
      const errorMsg = err.message || "Bridge execution failed";
      setError(errorMsg);
      setProgress(null);
      toast.error(errorMsg);
    } finally {
      setExecuting(false);
    }
  }, [quote, walletClient, address, recipient, needsChainSwitch, fromChainId, toChainId, selectedToken, stepProgress, tokenDetails]);

  // Swap chains
  const swapChains = () => {
    const temp = fromChainId;
    setFromChainId(toChainId);
    setToChainId(temp);
    toast("Chains swapped", { icon: "🔄" });
  };

  // Set max amount
  const setMaxAmount = useCallback(() => {
    if (!balance) return;
    const buffer = selectedToken === "ETH" ? 0.001 : 0;
    const balanceValue = Number(formatUnits(balance.value, tokenDecimals));
    const maxAmount = Math.max(0, balanceValue - buffer);
    setAmount(maxAmount.toFixed(tokenDecimals > 6 ? 6 : tokenDecimals));
    toast("Max amount set", { icon: "⬆️" });
  }, [balance, tokenDecimals, selectedToken]);

  // Chain selection component
  const ChainSelect = ({ value, onChange, label, disabled }: { 
    value: number; 
    onChange: (value: number) => void; 
    label: string;
    disabled?: boolean;
  }) => (
    <div className="space-y-1 md:space-y-2">
      <Label className="text-xs md:text-sm font-medium text-gray-300">{label}</Label>
      <Select 
        value={value.toString()} 
        onValueChange={(val) => onChange(Number(val))}
        disabled={disabled}
      >
        <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700 h-8 md:h-10 px-2 md:px-3">
          <SelectValue>
            <div className="flex items-center gap-1 md:gap-3">
              {chainConfig[value as keyof typeof chainConfig]?.icon}
              <span className="font-medium text-white text-xs md:text-sm truncate">{chainConfig[value as keyof typeof chainConfig]?.name}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-700">
          {Object.entries(chainConfig).map(([id, chain]) => (
            <SelectItem 
              key={id} 
              value={id}
              className="text-gray-200 focus:bg-gray-700 focus:text-blue-300"
            >
              <div className="flex items-center gap-2 md:gap-3">
                {chain.icon}
                <span className="text-xs md:text-sm">{chain.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  // Token selection component
  const TokenSelect = ({ value, onChange, disabled }: { 
    value: TokenSymbol; 
    onChange: (value: TokenSymbol) => void; 
    disabled?: boolean;
  }) => (
    <Select 
      value={value} 
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
        <SelectValue>
          <div className="flex items-center gap-3">
            {TOKENS[value].icon}
            <span className="font-medium text-white">{value}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-gray-800 border-gray-700">
        {tokenOptions.map((token) => (
          <SelectItem 
            key={token.value} 
            value={token.value}
            className="text-gray-200 focus:bg-gray-700 focus:text-blue-300"
          >
            <div className="flex items-center gap-3">
              {token.icon}
              <span>{token.label} - {token.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  // Render loading state
  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Render login state
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-xl p-8 text-center border border-gray-700">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome to Across Bridge</h1>
            <p className="text-gray-400">Connect your wallet to start bridging assets across chains</p>
          </div>
          <button
            onClick={connect}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  // Bridge Completion Modal
  const BridgeCompleteModal = () => {
    return (
      <Dialog open={isBridgeComplete} onOpenChange={setIsBridgeComplete}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-md">
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircleIcon className="h-16 w-16 text-green-500" />
            </div>
            <DialogTitle className="text-2xl font-bold text-white">Bridge Complete!</DialogTitle>
            <DialogDescription className="text-gray-400 mt-2">
              {completedBridge && (
                <>
                  You have successfully bridged {completedBridge.amountSent} {completedBridge.tokenSymbol} from {chainConfig[completedBridge.fromChainId as keyof typeof chainConfig]?.name} to {chainConfig[completedBridge.toChainId as keyof typeof chainConfig]?.name}.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {completedBridge && (
            <div className="mt-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sent:</span>
                    <span className="text-white">{completedBridge.amountSent} {completedBridge.tokenSymbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Received:</span>
                    <span className="text-white">{completedBridge.amountReceived} {completedBridge.tokenSymbol}</span>
                  </div>
                  <Separator className="bg-gray-700" />
                  {completedBridge.depositTxHash && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Deposit TX:</span>
                      <a 
                        href={`${explorerConfig[completedBridge.fromChainId]}${completedBridge.depositTxHash}`} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        View
                      </a>
                    </div>
                  )}
                  
                  {completedBridge.fillTxHash && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Fill TX:</span>
                      <a 
                        href={`${explorerConfig[completedBridge.toChainId]}${completedBridge.fillTxHash}`} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        View
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Button
                onClick={() => setIsBridgeComplete(false)}
                className="mt-6 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700"
                size="lg"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1F2937',
            color: '#F9FAFB',
            border: '1px solid #374151',
            borderRadius: '0.75rem',
            padding: '16px',
          },
        }}
      />
      <Card className="!bg-gray-900/90 border-gray-700 shadow-2xl !rounded-3xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-base md:text-2xl font-bold text-white">Cross-Chain Bridge</CardTitle>
            <CardDescription className="text-sm text-gray-400">Transfer assets between networks instantly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 md:space-y-6">
            
            {/* Chain Selection */}
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-2 md:gap-4 items-center">
                <div className="col-span-2">
                  <ChainSelect 
                    value={fromChainId} 
                    onChange={setFromChainId} 
                    label="From" 
                    disabled={executing || isSwitchingChain}
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  <Button
                    onClick={swapChains}
                    variant="outline"
                    size="icon"
                    className="p-2 md:p-3 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600"
                    disabled={loading || executing || isSwitchingChain}
                  >
                    <ArrowsUpDownIcon className="h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                </div>
                <div className="col-span-2">
                  <ChainSelect 
                    value={toChainId} 
                    onChange={setToChainId} 
                    label="To" 
                    disabled={executing || isSwitchingChain}
                  />
                </div>
              </div>
              
              {!routeSupported && (
                <Alert className="bg-yellow-900/30 border-yellow-700">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <AlertDescription className="text-yellow-300">
                    This route is not supported by Across Protocol. Please select different chains.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            {/* Token Selection */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium text-gray-300">Token</Label>
                <Badge variant="secondary" className="bg-gray-700 text-gray-300 border-gray-600">
                  <InformationCircleIcon className="h-4 w-4 mr-1" />
                  Supported on both chains
                </Badge>
              </div>
              <TokenSelect 
                value={selectedToken} 
                onChange={setSelectedToken as (value: string) => void} 
                disabled={executing || isSwitchingChain || !routeSupported}
              />
              
              {!tokenSupported && (
                <Alert className="bg-red-900/30 border-red-700">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <AlertDescription className="text-red-300">
                    {selectedToken} is not supported on both selected chains. Please choose a different token.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            {/* Amount Input */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium text-gray-300">Amount</Label>
                {balance && (
                  <div className="flex items-center">
                    <span className="text-sm text-gray-400">
                      Balance: {Number(formatUnits(balance.value, tokenDecimals)).toFixed(6)} {tokenDetails.symbol}
                    </span>
                    <Button
                      onClick={setMaxAmount}
                      variant="outline"
                      size="sm"
                      className="ml-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-xs text-gray-300 border-gray-600"
                      disabled={executing || isSwitchingChain || !balance || !routeSupported || !tokenSupported}
                    >
                      MAX
                    </Button>
                  </div>
                )}
              </div>
              <div className="relative flex">
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-gray-800 border-2 border-gray-700 rounded-xl py-2 md:py-4 px-4 text-xl font-semibold text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={executing || isSwitchingChain || !routeSupported || !tokenSupported}
                />
              </div>
            </div>
            
            {/* Advanced Options */}
            <div className="border-t border-gray-700 pt-4">
              <Button
                onClick={() => setShowAdvanced(!showAdvanced)}
                variant="ghost"
                className="flex items-center text-sm text-gray-400 hover:text-gray-300 p-0 h-auto"
              >
                <span>Advanced Options</span>
                <ChevronDownIcon className={`ml-2 h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </Button>
              {showAdvanced && (
                <div className="mt-4 space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-300">
                      Recipient Address (Optional)
                    </Label>
                    <Input
                      type="text"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="0x... (defaults to your address)"
                      className="w-full bg-gray-800 border-2 border-gray-700 rounded-xl py-3 px-4 text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={executing || isSwitchingChain}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Auto Chain Switch Notice */}
            {isSwitchingChain && (
              <Alert className="bg-blue-900/30 border-blue-700">
                <ArrowPathIcon className="animate-spin h-4 w-4" />
                <AlertDescription className="text-blue-300">
                  <p className="text-sm">
                    Automatically switching to {chainConfig[fromChainId as keyof typeof chainConfig]?.name}...
                  </p>
                </AlertDescription>
              </Alert>
            )}
            
            {needsChainSwitch && !isSwitchingChain && (
              <Alert className="bg-red-900/30 border-red-700">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <AlertDescription className="text-red-300">
                  <p className="text-sm">
                    Failed to automatically switch to {chainConfig[fromChainId as keyof typeof chainConfig]?.name}. Please switch manually in your wallet.
                  </p>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Validation Errors */}
            {!validation.isValid && !needsChainSwitch && (
              <Alert className="bg-red-900/30 border-red-700">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <AlertDescription className="text-red-300">
                  <div className="space-y-1">
                    {validation.errors.map((error, index) => (
                      <p key={index} className="text-sm">{error}</p>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Quote Display */}
            {loading && !quote && (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4 flex items-center justify-center">
                  <ArrowPathIcon className="animate-spin h-5 w-5 mr-2 text-blue-400" />
                  <span className="text-gray-400">Fetching Quote...</span>
                </CardContent>
              </Card>
            )}
            
            {quote && (
              <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-700">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base md:text-lg font-semibold text-white">Bridge Quote</CardTitle>
                    <Badge variant="secondary" className="bg-green-900/50 text-green-400 border-green-700">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      ~{Math.round(quote.estimatedFillTimeSec / 60)} min
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-gray-800 border-gray-700">
                      <CardContent className="p-4">
                        <div className="text-sm text-gray-400 mb-1">You'll Receive</div>
                        <div className="text-base font-bold text-white">
                          {Number(formatUnits(quote.deposit.outputAmount, getTokenDecimals(tokenDetails, toChainId))).toFixed(6)} {tokenDetails.symbol}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          on {chainConfig[toChainId as keyof typeof chainConfig]?.name}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gray-800 border-gray-700">
                      <CardContent className="p-4">
                        <div className="text-sm text-gray-400 mb-1">Bridge Fee</div>
                        <div className="text-base font-bold text-white">
                          {Number(formatUnits(quote.fees.totalRelayFee.total, tokenDecimals)).toFixed(6)} {tokenDetails.symbol}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          ~{((Number(formatUnits(quote.fees.totalRelayFee.total, tokenDecimals)) / Number(amount)) * 100).toFixed(3)}%
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <Button
                    onClick={executeBridge}
                    disabled={executing || needsChainSwitch || !validation.isValid}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-200 shadow-lg"
                    size="lg"
                  >
                    {executing ? (
                      <>
                        <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                        {progress?.step === "approve" && "Approving..."}
                        {progress?.step === "deposit" && "Depositing..."}
                        {progress?.step === "fill" && "Completing..."}
                      </>
                    ) : (
                      <>
                        Bridge Now
                        <ArrowRightIcon className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {/* Progress Display */}
            {progress && (
              <Card className="bg-blue-900/30 border-blue-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-blue-300">Bridge Progress</CardTitle>
                    <Badge variant="secondary" className="bg-blue-900/50 text-blue-400 border-blue-700">
                      <ArrowPathIcon className="animate-spin h-4 w-4 mr-1" />
                      <span className="capitalize">{progress.step}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm">
                    <div className={`flex items-center ${progress.step === "approve" ? "text-blue-400" : progress.status === "txSuccess" ? "text-green-400" : "text-gray-500"}`}>
                      {progress.step === "approve" ? 
                        <ArrowPathIcon className="animate-spin h-4 w-4 mr-1" /> : 
                        progress.status === "txSuccess" ? 
                        <CheckCircleIcon className="h-4 w-4 mr-1" /> : 
                        <div className="h-4 w-4 mr-1 rounded-full border-2 border-gray-500" />
                      }
                      Approve
                    </div>
                    <div className={`flex items-center ${progress.step === "deposit" ? "text-blue-400" : progress.status === "txSuccess" ? "text-green-400" : "text-gray-500"}`}>
                      {progress.step === "deposit" ? 
                        <ArrowPathIcon className="animate-spin h-4 w-4 mr-1" /> : 
                        progress.status === "txSuccess" ? 
                        <CheckCircleIcon className="h-4 w-4 mr-1" /> : 
                        <div className="h-4 w-4 mr-1 rounded-full border-2 border-gray-500" />
                      }
                      Deposit
                    </div>
                    <div className={`flex items-center ${progress.step === "fill" ? "text-blue-400" : progress.status === "txSuccess" ? "text-green-400" : "text-gray-500"}`}>
                      {progress.step === "fill" ? 
                        <ArrowPathIcon className="animate-spin h-4 w-4 mr-1" /> : 
                        progress.status === "txSuccess" ? 
                        <CheckCircleIcon className="h-4 w-4 mr-1" /> : 
                        <div className="h-4 w-4 mr-1 rounded-full border-2 border-gray-500" />
                      }
                      Complete
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      
      {/* Bridge Completion Modal */}
      <BridgeCompleteModal />
    </>
  );
}

// Wrapper for the standalone page route
function BridgePage() {
  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto p-1 md:pt-8">
        <BridgePageContent />
      </main>
    </>
  );
}

function BridgePageWithSuspense() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    }>
      <BridgePage />
    </Suspense>
  );
}

export default withDashboardLayout(BridgePageWithSuspense);