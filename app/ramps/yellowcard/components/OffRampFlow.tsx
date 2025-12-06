'use client';

import React, { useEffect, useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Loader2, Landmark, Smartphone } from 'lucide-react';
import { ethers } from 'ethers';
import { TOKEN_ABI, TOKEN_ADDRESSES } from '@/ramps/payramp/offrampHooks/tokenConfig';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { stablecoins } from '@/data/stablecoins';
import { YELLOWCARD_CONFIG } from '@/utils/yellowcard/config';

const SUPPORTED_CRYPTOS = ['USDT', 'USDC'] as const;
const SUPPORTED_NETWORKS = ['ERC20', 'POLYGON', 'BASE'] as const;
const CRYPTO_NETWORKS: Record<string, readonly string[]> = {
  USDT: ['ERC20', 'POLYGON', 'BASE'] as const,
  USDC: ['ERC20', 'POLYGON', 'BASE'] as const,
};

const NETWORK_ICONS: Record<string, string> = {
  ERC20: '/eth-logo.svg',
  POLYGON: '/polygon.svg',
  BASE: '/base.svg',
};

const tokenIcon = (symbol: string) => {
  if (symbol.toUpperCase() === 'USDC') return '/usdc-logo.svg';
  if (symbol.toUpperCase() === 'USDT') return '/usdt-logo.svg';
  const s = stablecoins.find(x => x.baseToken?.toUpperCase?.() === symbol.toUpperCase());
  return s?.flag || '/usdc-logo.svg';
};

interface Channel {
  id: string;
  channelType: 'bank' | 'momo' | 'p2p';
  rampType: 'deposit' | 'withdraw';
  country: string;
  currency: string;
  status: 'active' | 'inactive';
  min: number;
  max: number;
}

interface Network {
  id: string;
  name: string;
  type: 'bank' | 'momo' | 'ewallet';
  country: string;
  status: 'active' | 'inactive';
}

interface KyCMetadata {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  dob: string; // MM/DD/YYYY
  idType: string;
  idNumber: string;
  country: string; // ISO2, e.g. TZ
}

export function YellowCardOffRampFlow({ onBack }: { onBack?: () => void }) {
  const { getAccessToken } = usePrivy();
  const { wallets } = useWallets();

  const displayChannelType = (t?: string) => {
    switch ((t || '').toLowerCase()) {
      case 'bank':
        return 'Bank Transfer';
      case 'momo':
        return 'Mobile Money';
      case 'p2p':
        return 'P2P Transfer';
      default:
        return t || '';
    }
  };

  const typeIcon = (t?: string) => {
    const key = (t || '').toLowerCase();
    if (key === 'bank') return <Landmark className="w-4 h-4 text-slate-300" />;
    if (key === 'momo') return <Smartphone className="w-4 h-4 text-slate-300" />;
    return null;
  };

  type Step = 'channel' | 'recipient' | 'amount' | 'review' | 'instructions';
  const [step, setStep] = useState<Step>('channel');
  const [loading, setLoading] = useState(false);

  // Lists / selections
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  const [networks, setNetworks] = useState<Network[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);

  // Destination
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<'bank' | 'momo'>('bank');

  // Crypto
  const [cryptoCurrency, setCryptoCurrency] = useState<string>(SUPPORTED_CRYPTOS[0]);
  const [cryptoNetwork, setCryptoNetwork] = useState<string>(SUPPORTED_NETWORKS[0]);
  const [cryptoAmount, setCryptoAmount] = useState('');

  // KYC metadata
  const [kyc, setKyc] = useState<KyCMetadata | null>(null);
  const [kycError, setKycError] = useState<string | null>(null);

  // Payment response
  const [payment, setPayment] = useState<any>(null);

  // Tx state
  const [txSending, setTxSending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  // Balance state
  const [balance, setBalance] = useState<string>('0');
  const [balanceLoading, setBalanceLoading] = useState<boolean>(false);
  const [lastSwitchedChain, setLastSwitchedChain] = useState<number | null>(null);

  // Helpers
  const networkToChainId = (net: string): number | null => {
    switch ((net || '').toUpperCase()) {
      case 'POLYGON':
        return 137;
      case 'BASE':
        return 8453;
      case 'ERC20': // Ethereum mainnet
        return 1;
      default:
        return null;
    }
  };

  // Keep selected cryptoNetwork compatible with selected cryptoCurrency
  useEffect(() => {
    const allowed = (CRYPTO_NETWORKS[cryptoCurrency] || SUPPORTED_NETWORKS) as readonly string[];
    if (!allowed.includes(cryptoNetwork)) {
      setCryptoNetwork(allowed[0] as string);
    }
  }, [cryptoCurrency]);

  const explorerFor = (chainId: number): string | null => {
    if (chainId === 137) return 'https://polygonscan.com/tx/';
    if (chainId === 8453) return 'https://basescan.org/tx/';
    if (chainId === 1) return 'https://etherscan.io/tx/';
    return null;
  };

  const hasTokenOnNetwork = (symbol: string, net: string): boolean => {
    const id = networkToChainId(net);
    if (!id) return false;
    const tokenMap = (TOKEN_ADDRESSES as any)[symbol];
    const addr: string | undefined = tokenMap?.[id];
    return !!addr && addr.length > 0;
  };

  // Switch wallet chain when user selects an EVM network
  useEffect(() => {
    const run = async () => {
      const id = networkToChainId(cryptoNetwork);
      const activeWallet = wallets?.[0] as any;
      if (!id || !activeWallet) return;
      if (lastSwitchedChain === id) return;
      try {
        await activeWallet.switchChain(id);
        setLastSwitchedChain(id);
      } catch (e) {
        console.warn('Chain switch failed:', e);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cryptoNetwork, wallets?.[0]?.address]);

  // Fetch ERC-20 balance for selected token/network
  useEffect(() => {
    const load = async () => {
      try {
        const id = networkToChainId(cryptoNetwork);
        const activeWallet = wallets?.[0] as any;
        if (!id || !activeWallet) {
          setBalance('0');
          return;
        }
        const tokenMap = (TOKEN_ADDRESSES as any)[cryptoCurrency];
        const tokenAddress: string | undefined = tokenMap?.[id];
        if (!tokenAddress) {
          setBalance('0');
          return;
        }
        setBalanceLoading(true);
        const provider = new ethers.providers.Web3Provider(await activeWallet.getEthereumProvider());
        const contract = new ethers.Contract(tokenAddress, TOKEN_ABI, provider);
        const [decimals, raw] = await Promise.all([
          contract.decimals().catch(() => 6),
          contract.balanceOf(activeWallet.address),
        ]);
        setBalance(ethers.utils.formatUnits(raw, decimals));
      } catch (e) {
        setBalance('0');
      } finally {
        setBalanceLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cryptoCurrency, cryptoNetwork, wallets?.[0]?.address]);

  const sendWithWallet = async () => {
    try {
      setTxError(null);
      setTxHash(null);
      setTxSending(true);

      if (!payment?.settlementInfo?.walletAddress || !payment?.settlementInfo?.cryptoAmount) {
        throw new Error('Missing settlement info');
      }

      const receiveAddress: string = payment.settlementInfo.walletAddress;
      const amountNum: number = payment.settlementInfo.cryptoAmount;
      const tokenSymbol: string = payment.settlementInfo.cryptoCurrency || cryptoCurrency;
      const net: string = payment.settlementInfo.cryptoNetwork || cryptoNetwork;

      const activeWallet = wallets?.[0];
      if (!activeWallet) throw new Error('No wallet connected');

      const chainId = networkToChainId(net);
      if (!chainId) throw new Error(`Unsupported network: ${net}`);

      // Resolve token address from shared PayRamp config
      const tokenMap = (TOKEN_ADDRESSES as any)[tokenSymbol];
      const tokenAddress: string | undefined = tokenMap?.[chainId];
      if (!tokenAddress) {
        throw new Error(`${tokenSymbol} not supported on selected network (${net}) for in-app send. Please send manually.`);
      }

      // Switch chain and build signer
      // @ts-ignore privy wallet type
      await activeWallet.switchChain(chainId);
      // @ts-ignore privy wallet type
      const provider = new ethers.providers.Web3Provider(await activeWallet.getEthereumProvider());
      const signer = provider.getSigner();

      const contract = new ethers.Contract(tokenAddress, TOKEN_ABI, signer);
      const decimals: number = await contract.decimals().catch(() => 6);
      const amountInWei = ethers.utils.parseUnits(String(amountNum), decimals);

      // Try with gas params, fallback without
      try {
        const gasPrice = await provider.getGasPrice();
        const gasLimit = await contract.estimateGas.transfer(receiveAddress, amountInWei);
        const safeGasLimit = gasLimit.mul(120).div(100);
        const tx = await contract.transfer(receiveAddress, amountInWei, { gasPrice, gasLimit: safeGasLimit });
        setTxHash(tx.hash);
        await tx.wait();
      } catch (err) {
        const tx = await contract.transfer(receiveAddress, amountInWei);
        setTxHash(tx.hash);
        await tx.wait();
      }
    } catch (e: any) {
      setTxError(e?.message || 'Failed to send transaction');
    } finally {
      setTxSending(false);
    }
  };

  // Fetch user KYC metadata
  useEffect(() => {
    const loadKyc = async () => {
      try {
        const token = await getAccessToken();
        const res = await fetch('/api/kyc/smile-id/metadata?format=yellowcard', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const data = await res.json();
        if (res.ok && data?.success && data?.data) {
          const d = data.data as {
            fullName: string;
            email?: string;
            phone: string;
            address: string;
            dob: string; // YYYY-MM-DD
            idType: string;
            idNumber: string;
            country: string;
          };
          const toMMDDYYYY = (iso: string) => {
            if (!iso || typeof iso !== 'string') return '';
            const [y, m, day] = iso.split('-');
            if (!y || !m || !day) return '';
            return `${m}/${day}/${y}`;
          };
          setKyc({
            fullName: d.fullName,
            email: d.email || '',
            phone: d.phone,
            address: d.address,
            dob: toMMDDYYYY(d.dob),
            idType: d.idType,
            idNumber: d.idNumber,
            country: d.country,
          });
          setKycError(null);
        } else {
          setKycError(data?.message || data?.error || 'KYC not completed.');
        }
      } catch (e: any) {
        setKycError(e.message || 'Failed to load KYC metadata');
      }
    };
    loadKyc();
  }, [getAccessToken]);

  // Fetch payment channels for TZ
  const fetchChannels = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/yellowcard/channels?country=TZ&type=payment');
      const data = await res.json();
      if (res.ok && data.data) {
        setChannels(data.data);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch networks for channel
  const fetchNetworks = async (channelId: string) => {
    setLoading(true);
    try {
      console.log('[OffRamp] Fetching networks for channel:', channelId);
      const res = await fetch(`/api/yellowcard/networks?country=TZ&channelId=${channelId}`);
      const data = await res.json();
      
      console.log('[OffRamp] Networks API response:', {
        status: res.status,
        ok: res.ok,
        statusCode: data.statusCode,
        dataLength: data.data?.length,
        error: data.error,
        message: data.message
      });
      
      if (res.ok && data.data) {
        console.log('[OffRamp] Successfully loaded networks:', data.data);
        setNetworks(data.data);
      } else {
        console.error('[OffRamp] Networks API error:', data);
        // For Tanzania in sandbox, create mock network
        if (!YELLOWCARD_CONFIG.IS_PRODUCTION) {
          console.log('[OffRamp] Creating mock network for Tanzania testing...');
          const mockNetwork: Network = {
            id: 'mock-tz-network',
            name: 'Mock Tanzania Network',
            type: 'bank',
            country: 'TZ',
            status: 'active',
          };
          setNetworks([mockNetwork]);
        }
      }
    } catch (error) {
      console.error('[OffRamp] Networks fetch error:', error);
      // For Tanzania in sandbox, create mock network on error
      if (!YELLOWCARD_CONFIG.IS_PRODUCTION) {
        console.log('[OffRamp] Creating mock network for Tanzania testing (fallback)...');
        const mockNetwork: Network = {
          id: 'mock-tz-network',
          name: 'Mock Tanzania Network',
          type: 'bank',
          country: 'TZ',
          status: 'active',
        };
        setNetworks([mockNetwork]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  // Submit payment request
  const submitPayment = async () => {
    if (!selectedChannel || !selectedNetwork || !kyc) return;

    setLoading(true);
    try {
      const token = await getAccessToken();
      
      // Use sandbox success account numbers in sandbox mode
      const sandboxAccountNumber = !YELLOWCARD_CONFIG.IS_PRODUCTION 
        ? (accountType === 'bank' 
            ? '1111111111' // Sandbox success bank account
            : '+2551111111111') // Sandbox success mobile money (TZ country code)
        : accountNumber;
      
      const sandboxAccountName = !YELLOWCARD_CONFIG.IS_PRODUCTION 
        ? 'Test Account'
        : accountName;
      
      if (!YELLOWCARD_CONFIG.IS_PRODUCTION) {
        console.log(`[OffRamp] [SANDBOX] Using success account: ${sandboxAccountNumber} (${accountType})`);
      }
      
      const makeBody = (net: string) => ({
        sender: {
          name: kyc.fullName,
          country: 'TZ',
          address: kyc.address,
          dob: kyc.dob,
          email: kyc.email,
          idNumber: kyc.idNumber,
          idType: kyc.idType,
        },
        destination: {
          accountName: sandboxAccountName,
          accountNumber: sandboxAccountNumber,
          accountType,
          networkId: selectedNetwork.id,
        },
        channelId: selectedChannel.id,
        currency: 'TZS',
        country: 'TZ',
        reason: 'other',
        cryptoCurrency,
        cryptoNetwork: net,
        cryptoAmount: parseFloat(cryptoAmount),
      });

      const send = async (net: string) => {
        const r = await fetch('/api/yellowcard/payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(makeBody(net)),
        });
        const j = await r.json();
        return { r, j };
      };

      const primaryNet = cryptoNetwork;
      let attempt = await send(primaryNet);
      if (!attempt.r.ok && (attempt.j?.message?.toLowerCase().includes('address unavailable') || attempt.j?.code === 'AddressAssignmentError')) {
        const fallbackNet = primaryNet === 'POLYGON' ? 'BASE' : 'POLYGON';
        attempt = await send(fallbackNet);
      }

      if (!attempt.r.ok || attempt.j?.error) {
        alert(attempt.j?.error || attempt.j?.message || 'Failed to create payment');
        return;
      }

      setPayment(attempt.j.data);
      setStep('instructions');
    } catch (e: any) {
      alert(e.message || 'Failed to create payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step: Select Channel */}
      {step === 'channel' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onBack?.()}
              className="px-3 py-2 bg-slate-800/60 border border-slate-700/60 text-slate-100 rounded-lg hover:bg-slate-800"
            >
              Back
            </button>
          </div>
          <h2 className="text-xl font-bold text-white">Select Method</h2>

          {kycError && (
            <div className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl">
              <p className="text-amber-300 text-sm">{kycError}</p>
              <button
                onClick={() => (window.location.href = '/kyc')}
                className="mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm"
              >
                Go to KYC
              </button>
            </div>
          )}

          {loading && (
            <div className="p-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto" />
              <p className="mt-4 text-slate-400">Loading channels...</p>
            </div>
          )}

          {!loading && channels.length > 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Method</label>
                <select
                  value={selectedChannel?.id || ''}
                  onChange={(e) => {
                    const ch = channels.find((c) => c.id === e.target.value) || null;
                    setSelectedChannel(ch);
                    if (ch) {
                      fetchNetworks(ch.id);
                      setStep('recipient');
                    }
                  }}
                  className="w-full bg-slate-800/60 border-slate-600/60 text-slate-100 h-12 rounded-xl p-3"
                >
                  <option value="">Select method</option>
                  {channels.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {displayChannelType(ch.channelType)} • {ch.currency} (Min: {ch.min}, Max: {ch.max})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step: Recipient */}
      {step === 'recipient' && selectedChannel && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onBack?.()}
              className="px-3 py-2 bg-slate-800/60 border border-slate-700/60 text-slate-100 rounded-lg hover:bg-slate-800"
            >
              Back
            </button>
          </div>
          <h2 className="text-xl font-bold text-white">Recipient Details</h2>

          {loading && (
            <div className="p-4 text-slate-400">Loading networks...</div>
          )}

          {!loading && networks.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Network</label>
              <select
                value={selectedNetwork?.id || ''}
                onChange={(e) => setSelectedNetwork(networks.find((n) => n.id === e.target.value) || null)}
                className="w-full bg-slate-800/60 border-slate-600/60 text-slate-100 h-12 rounded-xl p-3"
              >
                <option value="">Select Network</option>
                {networks.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Account Number</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder={accountType === 'bank' ? 'Enter bank account number' : 'Enter mobile money number'}
              className="w-full bg-slate-800/60 border-slate-600/60 text-slate-100 h-12 rounded-xl p-3"
            />
            {/* {!YELLOWCARD_CONFIG.IS_PRODUCTION && (
              <button
                type="button"
                onClick={() => {
                  const testNumber = accountType === 'bank' ? '1111111111' : '+2551111111111';
                  setAccountNumber(testNumber);
                }}
                className="mt-2 text-xs text-purple-400 hover:text-purple-300"
              >
                Fill with test number
              </button>
            )} */}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Account Name</label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Enter account name"
              className="w-full bg-slate-800/60 border-slate-600/60 text-slate-100 h-12 rounded-xl p-3"
            />
            {/* {!YELLOWCARD_CONFIG.IS_PRODUCTION && (
              <button
                type="button"
                onClick={() => {
                  const testName = kyc ? `Successful ${kyc.fullName}` : 'Successful Test';
                  setAccountName(testName);
                }}
                className="mt-2 text-xs text-purple-400 hover:text-purple-300"
              >
                Fill with test name
              </button>
            )} */}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep('channel')}
              className="flex-1 p-3 bg-slate-800/60 border border-slate-700/60 text-slate-100 rounded-xl"
            >
              Back
            </button>
            <button
              onClick={() => {
                console.log('[OffRamp] Continue button clicked:', {
                  selectedNetwork,
                  accountNumber,
                  accountName,
                  networks: networks.length,
                });
                setStep('amount');
              }}
              disabled={!selectedNetwork || !accountNumber}
              className="flex-1 p-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold rounded-xl disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step: Amount */}
      {step === 'amount' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onBack?.()}
              className="px-3 py-2 bg-slate-800/60 border border-slate-700/60 text-slate-100 rounded-lg hover:bg-slate-800"
            >
              Back
            </button>
          </div>
          <h2 className="text-xl font-bold text-white">Enter Amount</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Token</label>
              <Select value={cryptoCurrency} onValueChange={(v) => setCryptoCurrency(v)}>
                <SelectTrigger className="w-full rounded-xl bg-slate-800/60 border border-slate-600/60 px-4 py-3 text-white h-12">
                  <SelectValue placeholder="Select token">
                    <div className="flex items-center gap-2.5">
                      <img src={tokenIcon(cryptoCurrency)} alt={cryptoCurrency} className="w-5 h-5 rounded-full" />
                      <span className="text-base font-medium">{cryptoCurrency}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/60 rounded-xl shadow-2xl">
                  {SUPPORTED_CRYPTOS.map((c) => (
                    <SelectItem key={c} value={c} className="text-white hover:bg-purple-500/10 focus:bg-purple-500/15 cursor-pointer rounded-lg transition-colors my-0.5 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <img src={tokenIcon(c)} alt={c} className="w-5 h-5 rounded-full" />
                        <span className="text-base">{c}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Blockchain Network</label>
              <Select value={cryptoNetwork} onValueChange={(v) => setCryptoNetwork(v)}>
                <SelectTrigger className="w-full rounded-xl bg-slate-800/60 border border-slate-600/60 px-4 py-3 text-white h-12">
                  <SelectValue placeholder="Select network">
                    <div className="flex items-center gap-2.5">
                      <img src={NETWORK_ICONS[cryptoNetwork]} alt={cryptoNetwork} className="w-5 h-5 rounded-full" />
                      <span className="text-base font-medium">{cryptoNetwork}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/60 rounded-xl shadow-2xl">
                  {((CRYPTO_NETWORKS[cryptoCurrency] || SUPPORTED_NETWORKS) as readonly string[]).map((n) => (
                    <SelectItem key={n} value={n} className="text-white hover:bg-blue-500/10 focus:bg-blue-500/15 cursor-pointer rounded-lg transition-colors my-0.5 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <img src={NETWORK_ICONS[n]} alt={n} className="w-5 h-5 rounded-full" />
                        <span className="text-base">{n}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Balance: {balanceLoading ? 'Loading…' : `${balance} ${cryptoCurrency}`}
            </span>
            <button
              type="button"
              onClick={() => setCryptoAmount(balance || '')}
              className="text-blue-400 hover:text-blue-300"
            >
              Use Max
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Crypto Amount ({cryptoCurrency})</label>
            <input
              type="number"
              value={cryptoAmount}
              onChange={(e) => setCryptoAmount(e.target.value)}
              className="w-full bg-slate-800/60 border-slate-600/60 text-slate-100 h-12 rounded-xl p-3"
              placeholder="e.g. 10"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep('recipient')}
              className="flex-1 p-3 bg-slate-800/60 border border-slate-700/60 text-slate-100 rounded-xl"
            >
              Back
            </button>
            <button
              onClick={() => setStep('review')}
              disabled={!cryptoAmount || parseFloat(cryptoAmount) <= 0}
              className="flex-1 p-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold rounded-xl disabled:opacity-50"
            >
              Review
            </button>
          </div>
        </div>
      )}

      {/* Step: Review */}
      {step === 'review' && selectedChannel && selectedNetwork && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onBack?.()}
              className="px-3 py-2 bg-slate-800/60 border border-slate-700/60 text-slate-100 rounded-lg hover:bg-slate-800"
            >
              Back
            </button>
          </div>
          <h2 className="text-xl font-bold text-white">Review & Confirm</h2>

          <div className="p-4 bg-gradient-to-br from-slate-800/70 to-slate-900/70 border border-slate-700/60 rounded-xl">
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
              <div>
                <p className="text-slate-400">Channel</p>
                <p className="text-white font-medium flex items-center gap-2">{typeIcon(selectedChannel.channelType)} {displayChannelType(selectedChannel.channelType)}</p>
              </div>
              <div>
                <p className="text-slate-400">Network</p>
                <p className="text-white font-medium flex items-center gap-2">{typeIcon(selectedNetwork.type)} {selectedNetwork.name}</p>
              </div>
              <div>
                <p className="text-slate-400">Account Number</p>
                <p className="text-white font-medium">{accountNumber}</p>
              </div>
              <div>
                <p className="text-slate-400">Account Name</p>
                <p className="text-white font-medium">{accountName}</p>
              </div>
              <div>
                <p className="text-slate-400">Crypto</p>
                <p className="text-white font-medium">{cryptoAmount} {cryptoCurrency} • {cryptoNetwork}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep('amount')}
              className="flex-1 p-3 bg-slate-800/60 border border-slate-700/60 text-slate-100 rounded-xl"
            >
              Back
            </button>
            <button
              onClick={submitPayment}
              disabled={loading}
              className="flex-1 p-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Confirm & Create Payment'}
            </button>
          </div>
        </div>
      )}

      {/* Step: Instructions */}
      {step === 'instructions' && payment && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onBack?.()}
              className="px-3 py-2 bg-slate-800/60 border border-slate-700/60 text-slate-100 rounded-lg hover:bg-slate-800"
            >
              Back
            </button>
          </div>
          <h2 className="text-xl font-bold text-white">Confirm Details</h2>

          <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-300">
              <div>
                <p className="text-slate-400">Sending</p>
                <p className="text-white font-medium">
                  {payment.settlementInfo.cryptoAmount} {payment.settlementInfo.cryptoCurrency} • {payment.settlementInfo.cryptoNetwork || cryptoNetwork}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Channel</p>
                <p className="text-white font-medium flex items-center gap-2">{typeIcon(selectedChannel?.channelType)} {displayChannelType(selectedChannel?.channelType)}</p>
              </div>
              <div>
                <p className="text-slate-400">Network</p>
                <p className="text-white font-medium flex items-center gap-2">{typeIcon(selectedNetwork?.type)} {selectedNetwork?.name}</p>
              </div>
              <div>
                <p className="text-slate-400">Account Number</p>
                <p className="text-white font-medium">{accountNumber}</p>
              </div>
              <div>
                <p className="text-slate-400">Account Name</p>
                <p className="text-white font-medium">{accountName}</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm mt-3">Expires at: {payment.settlementInfo.expiresAt}</p>
            <div className="mt-4 flex flex-col gap-3">
              {(() => {
                const symbol = payment.settlementInfo.cryptoCurrency || cryptoCurrency;
                const net = payment.settlementInfo.cryptoNetwork || cryptoNetwork;
                const canSend = hasTokenOnNetwork(symbol, net);
                return canSend ? (
                  <button
                    onClick={sendWithWallet}
                    disabled={txSending}
                    className="w-full p-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold rounded-xl disabled:opacity-50"
                  >
                    {txSending ? 'Sending...' : `Send from Wallet (${symbol})`}
                  </button>
                ) : (
                  <div className="text-sm text-amber-300">
                    In-app send is unavailable for {symbol} on {net}. Please switch to a supported token/network and try again.
                  </div>
                );
              })()}
              {txHash && (
                <div className="text-sm text-slate-300">
                  <p className="break-all">Tx Hash: {txHash}</p>
                  {(() => {
                    const chainId = networkToChainId(payment.settlementInfo.cryptoNetwork || cryptoNetwork);
                    const base = chainId ? explorerFor(chainId) : null;
                    return base ? (
                      <a href={`${base}${txHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">View on Explorer</a>
                    ) : null;
                  })()}
                </div>
              )}
              {txError && (
                <p className="text-sm text-red-400">{txError}</p>
              )}
            </div>
          </div>

          <button
            onClick={() => setStep('channel')}
            className="w-full p-3 bg-slate-800/60 border border-slate-700/60 text-slate-100 rounded-xl"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
