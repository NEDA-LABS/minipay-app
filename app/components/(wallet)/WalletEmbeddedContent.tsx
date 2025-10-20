'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAccount, useBalance, useSwitchChain, useChainId, usePublicClient } from 'wagmi';
import { useFundWallet, useSendTransaction, useWallets, usePrivy } from '@privy-io/react-auth';
import { formatUnits, parseEther, parseUnits, isAddress, encodeFunctionData } from 'viem';
import { base, bsc, scroll, celo, arbitrum, polygon, optimism, mainnet, type Chain } from 'viem/chains';
import { Copy, Eye, EyeOff, Download, Send, Plus, Wallet, ArrowUpDown, ExternalLink, X, ChevronDown, AlertTriangle, Shield, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { stablecoins } from '@/data/stablecoins';
import { resolveName } from '@/utils/ensUtils';
import EnsAddressInput from '@/components/(wallet)/EnsAddressInput';
import Image from 'next/image';
import { getTokenIcon, getNativeTokenIcon } from '@/utils/tokenIcons';
import { motion, AnimatePresence } from 'framer-motion';

// shadcn/ui components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

const ERC20_ABI = [
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  }
] as const;

interface TokenBalance {
  symbol: string;
  balance: string;
  usd: string;
  address?: string;
  decimals: number;
  isNative?: boolean;
}

// Mock prices for native tokens (in a real app, use an API)
const NATIVE_TOKEN_PRICES: Record<number, number> = {
  [mainnet.id]: 2000, // ETH
  [base.id]: 0.0005, // BASE (example)
  [bsc.id]: 300, // BNB
  [scroll.id]: 0.0004, // ETH (example)
  [celo.id]: 0.5, // CELO
  [arbitrum.id]: 0.001, // ETH (example)
  [polygon.id]: 0.7, // MATIC
  [optimism.id]: 0.0006, // ETH (example)
};

export default function WalletEmbeddedContent() {
  const { wallets } = useWallets();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();
  const { fundWallet } = useFundWallet();
  const { sendTransaction } = useSendTransaction();
  const { exportWallet, user } = usePrivy();
  
  const isPrivyEmbedded = wallets?.[0]?.walletClientType.toLowerCase() === 'privy';
  const SUPPORTED_CHAINS = [base, bsc, scroll, celo, arbitrum, polygon, optimism, mainnet];
  
  // Use useBalance hook for native balance - always tied to actual wallet chain
  const { data: nativeBalance, refetch: refetchNativeBalance, isLoading: isLoadingNative } = useBalance({
    address,
    chainId: chainId,
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'send' | 'receive' | 'settings'>('overview');
  // Initialize activeChain from current chainId instead of hardcoding to base
  const [activeChain, setActiveChain] = useState<Chain>(() => {
    return SUPPORTED_CHAINS.find(c => c.id === chainId) || base;
  });
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitchingChain, setIsSwitchingChain] = useState(false);
  
  // Keep activeChain synced with actual wallet chainId
  useEffect(() => {
    const chain = SUPPORTED_CHAINS.find(c => c.id === chainId);
    if (chain && chain.id !== activeChain.id) {
      console.log(`Syncing activeChain to wallet chainId: ${chain.name}`);
      setActiveChain(chain);
      setBalances([]); // Clear balances when chain changes
    }
  }, [chainId]);

  // Fund states
  const [fundAmount, setFundAmount] = useState('');
  const [fundAsset, setFundAsset] = useState<'native-currency' | 'USDC'>('USDC');

  // Send states
  const [sendToRaw, setSendToRaw] = useState('');
  const [sendToResolved, setSendToResolved] = useState<`0x${string}` | null>(null);
  const [sendAmount, setSendAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);

  // Export states
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const [ensName, setEnsName] = useState<string | null>(null);
  
  useEffect(() => {
    const resolveEnsName = async () => {
      if (!address) return;
      try {
        const name = await resolveName({ address: address as `0x${string}` });
        setEnsName(name);
      } catch (error) {
        setEnsName(null);
      }
    };
    resolveEnsName();
  }, [address]);

  // Auto-select first token when balances load
  useEffect(() => {
    if (balances.length > 0 && !selectedToken) {
      const nativeToken = balances.find((b) => b.isNative);
      setSelectedToken(nativeToken || balances[0]);
    }
  }, [balances, selectedToken]);

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  // Filter relevant tokens for current chain
  const relevantTokens = useMemo(() => {
    return stablecoins.filter(
      (sc) => sc.chainIds.includes(activeChain.id) && sc.addresses[activeChain.id as keyof typeof sc.addresses]
    );
  }, [activeChain.id]);

  // Helper function to format balance with smart precision
  const formatBalance = (value: number, symbol: string): string => {
    if (value === 0) return '0';
    if (value < 0.000001) return '< 0.000001';
    if (value < 0.01) return value.toFixed(6);
    if (value < 1) return value.toFixed(4);
    if (value < 1000) return value.toFixed(2);
    return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  // Fetch balances when chain changes - with proper chain validation
  useEffect(() => {
    // Critical: Only fetch if activeChain matches actual wallet chainId
    if (!address || !publicClient || !nativeBalance || activeChain.id !== chainId) {
      console.log('Skipping balance fetch - chain mismatch or missing data');
      return;
    }
    
    const fetchBalances = async () => {
      setIsLoading(true);
      try {
        const tokenBalances: TokenBalance[] = [];

        // Validate native token belongs to current chain
        console.log(`Loading balances for ${activeChain.name} (chainId: ${activeChain.id})`);
        console.log(`Native balance symbol: ${nativeBalance.symbol}`);
        
        // Add native token balance with better formatting
        const formatted = parseFloat(formatUnits(nativeBalance.value, nativeBalance.decimals));
        const price = NATIVE_TOKEN_PRICES[activeChain.id] || 1;
        tokenBalances.push({
          symbol: nativeBalance.symbol,
          balance: formatBalance(formatted, nativeBalance.symbol),
          usd: (formatted * price).toFixed(2),
          decimals: nativeBalance.decimals,
          isNative: true
        });

        // Load all ERC20 token balances in parallel for better performance
        const tokenPromises = relevantTokens.map(async (token) => {
          try {
            const decimals =
              typeof token.decimals === 'object'
                ? (token.decimals as any)[activeChain.id] ?? 6
                : token.decimals;

            const balance = await publicClient.readContract({
              address: token.addresses[activeChain.id as keyof typeof token.addresses] as `0x${string}`,
              abi: ERC20_ABI,
              functionName: 'balanceOf',
              args: [address as `0x${string}`],
            });

            if (balance) {
              const formatted = parseFloat(formatUnits(balance as bigint, decimals));
              // Show tokens even with 0 balance for better UX
              return {
                symbol: token.baseToken,
                balance: formatBalance(formatted, token.baseToken),
                usd: (formatted * 1).toFixed(2),
                address: token.addresses[activeChain.id as keyof typeof token.addresses],
                decimals,
                isNative: false
              };
            }
            return null;
          } catch (error) {
            console.error(`Error loading ${token.baseToken} balance:`, error);
            return null;
          }
        });

        // Wait for all token balances to load in parallel
        const tokenResults = await Promise.allSettled(tokenPromises);
        
        tokenResults.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            tokenBalances.push(result.value);
          }
        });

        // Sort balances: native first, then by USD value
        tokenBalances.sort((a, b) => {
          if (a.isNative && !b.isNative) return -1;
          if (!a.isNative && b.isNative) return 1;
          return parseFloat(b.usd) - parseFloat(a.usd);
        });

        setBalances(tokenBalances);
      } catch (error) {
        console.error('Error fetching balances:', error);
        toast.error('Failed to fetch balances');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalances();
  }, [address, activeChain.id, chainId, publicClient, nativeBalance?.value, relevantTokens.length]);

  // Refetch native balance when chain actually changes in wallet
  useEffect(() => {
    if (address && refetchNativeBalance && !isLoadingNative) {
      console.log(`Refetching native balance for chainId: ${chainId}`);
      refetchNativeBalance();
    }
  }, [chainId, address]);

  const switchChain = async (chain: Chain) => {
    if (chain.id === chainId) {
      console.log('Already on this chain');
      return;
    }
    
    console.log(`Initiating chain switch from ${activeChain.name} to ${chain.name}`);
    setIsSwitchingChain(true);
    setIsLoading(true);
    setBalances([]); // Clear immediately to prevent stale data
    
    try {
      await switchChainAsync({ chainId: chain.id });
      // activeChain will be updated by the chainId useEffect
      toast.success(`Switched to ${chain.name}`);
    } catch (error: any) {
      console.error('Chain switch error:', error);
      toast.error(error.message || 'Failed to switch chain');
      // Revert to actual chain on error
      const currentChain = SUPPORTED_CHAINS.find(c => c.id === chainId);
      if (currentChain) setActiveChain(currentChain);
    } finally {
      setIsSwitchingChain(false);
      setIsLoading(false);
    }
  };

  const handleExportWallet = async () => {
    if (!address) return toast.error('No wallet connected');
    try {
      setIsExporting(true);
      await exportWallet({ address });
      toast.success('Private key exported successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to export wallet');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFund = async () => {
    if (!address || !fundAmount) return toast.error('Missing amount');
    try {
      setIsLoading(true);
      await fundWallet({ address: address as string });
      toast.success('Funding flow opened');
      setFundAmount('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to initiate funding');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!sendToResolved || !isAddress(sendToResolved) || !sendAmount || !selectedToken) {
      return toast.error('Please fill all fields correctly');
    }

    try {
      setIsLoading(true);
      const to = sendToResolved as `0x${string}`;

      if (selectedToken.isNative) {
        const { hash } = await sendTransaction({
          to,
          value: parseEther(sendAmount)
        });
        toast.success(`Transaction sent: ${hash.slice(0, 10)}...`);
      } else {
        const amount = parseUnits(sendAmount, selectedToken.decimals);
        const data = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [to, amount]
        });

        const { hash } = await sendTransaction({
          to: selectedToken.address as `0x${string}`,
          data,
        });
        toast.success(`Token transfer sent: ${hash.slice(0, 10)}...`);
      }

      setSendToRaw('');
      setSendToResolved(null);
      setSendAmount('');
    } catch (error: any) {
      toast.error(error.message || 'Transaction failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-slate-900/90 backdrop-blur-sm border-slate-700/50 text-white !rounded-3xl overflow-hidden">
        {/* Compact Header */}
        <div className="bg-slate-900/90 p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-purple-600 to-violet-600 rounded-lg">
                <Wallet className="h-4 w-4 text-white" />
              </div>
              <p className="text-base font-semibold text-white">Your Wallet</p>
            </div>
            {address && (
            <div className="flex items-center gap-2 bg-slate-700/50 px-2 py-1 rounded-lg border border-slate-600/50">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              <span className="text-xs text-slate-200 font-mono">
                {ensName || formatAddress(address)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(address, 'Address')}
                className="h-5 w-5 p-0 hover:bg-slate-600/50"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            )}
          </div>

          {/* Compact Chain Switcher */}
        <Select
          value={activeChain.id.toString()}
          onValueChange={(value) => {
            const chain = SUPPORTED_CHAINS.find(c => c.id.toString() === value);
            if (chain) switchChain(chain);
          }}
          disabled={isSwitchingChain || isLoading}
        >
          <SelectTrigger className="w-full bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-600/50 rounded-xl h-9">
            <div className="flex items-center gap-2">
              {isSwitchingChain ? (
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-purple-400 border-t-white" />
              ) : (
                <Image
                  src={getNativeTokenIcon(activeChain.id)}
                  alt={activeChain.name}
                  width={16}
                  height={16}
                  className="rounded-full"
                />
              )}
              <SelectValue>
                <span className="text-sm font-medium">
                  {isSwitchingChain ? 'Switching...' : activeChain.name}
                </span>
              </SelectValue>
            </div>
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 rounded-xl">
            {SUPPORTED_CHAINS.map((chain) => (
              <SelectItem key={chain.id} value={chain.id.toString()} className="text-white hover:bg-slate-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <Image
                    src={getNativeTokenIcon(chain.id)}
                    alt={chain.name}
                    width={14}
                    height={14}
                    className="rounded-full"
                  />
                  <span className="text-sm">{chain.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Compact Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border-b border-slate-700/50 rounded-none h-10">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:!text-white text-slate-400 rounded-lg text-xs">
            <Wallet className="h-3 w-3 mr-1" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="send" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:!text-white text-slate-400 rounded-lg text-xs">
            <Send className="h-3 w-3 mr-1" />
            Send
          </TabsTrigger>
          <TabsTrigger value="receive" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:!text-white text-slate-400 rounded-lg text-xs">
            <Download className="h-3 w-3 mr-1" />
            Receive
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-slate-600 data-[state=active]:!text-white text-slate-300 hover:text-white transition-all rounded-lg text-xs">
            <ArrowUpDown className="h-3 w-3 mr-1" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Compact Overview Tab */}
        <TabsContent value="overview" className="p-6">
          <div className="space-y-3">
            {isLoading || isSwitchingChain ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-400/30 border-t-purple-400 mx-auto" />
                <p className="text-slate-300 mt-2 text-sm">
                  {isSwitchingChain ? 'Switching chain...' : 'Loading balances...'}
                </p>
              </div>
            ) : balances.length > 0 ? (
              <div className="space-y-2">
                {balances.map((balance, index) => (
                  <div
                    key={`${balance.symbol}-${index}`}
                    className="flex justify-between items-center p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-purple-500/50 transition-all duration-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-700/50 flex items-center justify-center border border-slate-600/50">
                        <Image
                          src={getTokenIcon(balance.symbol, activeChain.id)}
                          alt={balance.symbol}
                          width={18}
                          height={18}
                          className="rounded-full"
                        />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{balance.symbol}</p>
                        <p className="text-xs text-slate-400">${balance.usd}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium text-sm">{balance.balance}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Wallet className="h-10 w-10 mx-auto mb-2 text-slate-600" />
                <p className="text-slate-400 text-sm">No assets found</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Send Tab */}
        <TabsContent value="send" className="p-6">
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              <Card className="bg-slate-800/50 border-slate-700/50 rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-white text-base">
                    <div className="p-1.5 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                      <Send className="h-4 w-4 text-white" />
                    </div>
                    Send Tokens
                  </CardTitle>
                  <CardDescription className="text-slate-300 text-sm">
                    Transfer tokens to any address or ENS name
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Token Selection */}
                  <div className="space-y-2">
                    <Label className="text-white">Select Token</Label>
                    <Select
                      value={selectedToken ? `${selectedToken.symbol}-${selectedToken.isNative}` : ''}
                      onValueChange={(value) => {
                        const [symbol, isNative] = value.split('-');
                        const token = balances.find(b => b.symbol === symbol && b.isNative === (isNative === 'true'));
                        if (token) setSelectedToken(token);
                      }}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 rounded-xl">
                        <SelectValue placeholder="Choose a token to send">
                          {selectedToken && (
                            <div className="flex items-center gap-3">
                              <Image
                                src={getTokenIcon(selectedToken.symbol, activeChain.id)}
                                alt={selectedToken.symbol}
                                width={16}
                                height={16}
                                className="rounded-full"
                              />
                              <span className="text-sm">{selectedToken.symbol}</span>
                              <Badge variant="outline" className="ml-auto text-xs bg-slate-700/80 text-slate-300 border-slate-600 rounded-md">
                                {selectedToken.balance}
                              </Badge>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 rounded-xl">
                        {balances.map((balance, index) => (
                          <SelectItem
                            key={`${balance.symbol}-${index}`}
                            value={`${balance.symbol}-${balance.isNative}`}
                            className="text-white hover:bg-slate-700 rounded-lg"
                          >
                            <div className="flex items-center gap-3 w-full">
                              <Image
                                src={getTokenIcon(balance.symbol, activeChain.id)}
                                alt={balance.symbol}
                                width={16}
                                height={16}
                                className="rounded-full"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-sm">{balance.symbol}</div>
                                <div className="text-xs text-slate-400">{balance.balance} available</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Recipient */}
                  <div className="space-y-2">
                    <EnsAddressInput
                      value={sendToRaw}
                      onChange={setSendToRaw}
                      onResolved={setSendToResolved}
                      label="Recipient (ENS or Address)"
                      placeholder="vitalik.eth or 0x..."
                    />
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Amount</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={sendAmount}
                        onChange={(e) => setSendAmount(e.target.value)}
                        placeholder={selectedToken ? `Amount in ${selectedToken.symbol}` : '0.0'}
                        step="any"
                        className="bg-slate-700 border-slate-600 text-white pr-16 rounded-xl"
                      />
                      {selectedToken && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSendAmount(selectedToken.balance)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 px-2 text-blue-400 hover:text-blue-300 rounded-lg"
                        >
                          MAX
                        </Button>
                      )}
                    </div>
                    {selectedToken && (
                      <div className="flex justify-between text-sm text-slate-400">
                        <span>Available: {selectedToken.balance} {selectedToken.symbol}</span>
                      </div>
                    )}
                  </div>

                  {/* Send Button */}
                  <Button
                    onClick={handleSend}
                    disabled={!sendToResolved || !isAddress(sendToResolved) || !sendAmount || !selectedToken || isLoading}
                    className="w-full h-10 bg-purple-600 hover:bg-purple-700 text-white border-0 shadow-lg rounded-xl"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400/30 border-t-white mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Transaction
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Receive Tab */}
        <TabsContent value="receive" className="p-6">
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {/* Address Display Card */}
              <Card className="bg-slate-800/50 border-slate-700/50 rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-white text-base">
                    <div className="p-1.5 bg-indigo-500 rounded-lg">
                      <Download className="h-4 w-4 text-white" />
                    </div>
                    Receive Tokens
                  </CardTitle>
                  <CardDescription className="text-slate-300 text-sm">
                    Share your wallet address to receive tokens
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className="p-4 bg-slate-700/50 rounded-xl border border-slate-600/50">
                      <Label className="text-slate-300 text-sm">Your Wallet Address</Label>
                      <div className="mt-2 p-3 bg-slate-800/80 rounded-lg border border-slate-600/50">
                        <code className="text-white text-sm break-all font-mono">
                          {address}
                        </code>
                      </div>
                    </div>
                    <Button
                      onClick={() => address && copyToClipboard(address, 'Address')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-lg rounded-xl"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Address
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Fund Wallet Card */}
              <Card className="bg-slate-800/50 border-slate-700/50 rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-white text-base">
                    <div className="p-1.5 bg-blue-500 rounded-lg">
                      <Plus className="h-4 w-4 text-white" />
                    </div>
                    Fund Wallet
                  </CardTitle>
                  <CardDescription className="text-slate-300 text-sm">
                    Add funds to your wallet using Privy
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Amount</Label>
                    <Input
                      type="number"
                      value={fundAmount}
                      onChange={(e) => setFundAmount(e.target.value)}
                      placeholder="Amount to fund"
                      className="bg-slate-700 border-slate-600 text-white rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white text-sm">Asset</Label>
                    <Select value={fundAsset} onValueChange={(value: any) => setFundAsset(value)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 rounded-xl">
                        <SelectItem value="USDC" className="text-white hover:bg-slate-700 rounded-lg">USDC</SelectItem>
                        <SelectItem value="native-currency" className="text-white hover:bg-slate-700 rounded-lg">Native Currency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    onClick={handleFund}
                    disabled={!fundAmount || isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-lg rounded-xl"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400/30 border-t-white mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Fund Wallet
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="p-6">
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {/* Privy Dashboard Card */}
              <Card className="bg-slate-800/50 border-slate-700/50 rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-white text-base">
                    <div className="p-1.5 bg-blue-500 rounded-lg">
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                    Advanced Wallet Management
                  </CardTitle>
                  <CardDescription className="text-slate-300 text-sm">
                    Access advanced features through your Privy dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="bg-slate-700/50 border-slate-600/50 rounded-xl">
                    <AlertDescription className="text-slate-300 text-sm">
                      For transaction history, advanced token management, and additional features,
                      visit your Privy dashboard.
                    </AlertDescription>
                  </Alert>
                  <Button
                    asChild
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-lg rounded-xl"
                  >
                    <a
                      href="https://home.privy.io"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      Open Privy Dashboard
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  {user && (user as any).email && (
                    <div className="text-center">
                      <Badge variant="secondary" className="text-xs bg-slate-700/80 text-slate-300 border-slate-600 rounded-md">
                        Login with: {(user as any).email.address}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Export Private Key Card */}
              <Card className="bg-slate-700/50 border-slate-600/50 rounded-xl hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-yellow-400 text-base">
                    <div className="p-1.5 bg-yellow-500 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-white" />
                    </div>
                    Export Private Key
                  </CardTitle>
                  <CardDescription className="text-yellow-300/90 text-sm">
                    Your private key gives full access to your wallet. Never share it with anyone.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="bg-yellow-900/30 border-yellow-600/50 rounded-xl">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-yellow-300 text-sm">
                      Store your private key securely. Anyone with access to it can control your wallet.
                    </AlertDescription>
                  </Alert>
                  
                  {!privateKey ? (
                    <Button
                      onClick={handleExportWallet}
                      disabled={isExporting || !address}
                      variant="outline"
                      className="w-full border-yellow-600 text-yellow-400 hover:bg-yellow-600/10 rounded-xl"
                    >
                      {isExporting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-400/30 border-t-yellow-400 mr-2" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Export Private Key
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-700 rounded-xl border border-slate-600">
                        <Label className="text-slate-300 text-sm">Private Key</Label>
                        <div className="mt-2 p-3 bg-slate-800 rounded-lg border border-slate-600">
                          <code className="text-white text-sm break-all font-mono">
                            {privateKey}
                          </code>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => copyToClipboard(privateKey, 'Private key')}
                          className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg rounded-xl"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                        <Button
                          onClick={() => setPrivateKey('')}
                          variant="outline"
                          className="flex-1 border-slate-600 text-slate-400 hover:bg-slate-700/50 rounded-xl"
                        >
                          Hide
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Network Information Card */}
              <Card className="bg-slate-800/50 border-slate-700/50 rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-white text-base">
                    <Zap className="h-4 w-4" />
                    Network Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Network:</span>
                      <Badge variant="secondary" className="bg-slate-700/80 text-slate-300 border-slate-600">{activeChain.name}</Badge>
                    </div>
                    <Separator className="bg-slate-600/50" />
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Chain ID:</span>
                      <span className="text-white font-medium">{activeChain.id}</span>
                    </div>
                    <Separator className="bg-slate-600/50" />
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Currency:</span>
                      <span className="text-white font-medium">{activeChain.nativeCurrency.symbol}</span>
                    </div>
                    {activeChain.blockExplorers?.default && (
                      <>
                        <Separator className="bg-slate-600/50" />
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Explorer:</span>
                          <Button
                            asChild
                            variant="link"
                            size="sm"
                            className="text-blue-400 hover:text-blue-300 p-0 h-auto"
                          >
                            <a
                              href={`${activeChain.blockExplorers.default.url}/address/${address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1"
                            >
                              View on Explorer
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
    </div>
  );
}
