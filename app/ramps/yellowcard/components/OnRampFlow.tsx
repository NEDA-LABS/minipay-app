'use client';

/**
 * Yellow Card On-Ramp Flow Component
 * Guides user through fiat → crypto collection process
 */

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { usePrivy } from '@privy-io/react-auth';
import { Card } from '@/components/Card';
import { YELLOWCARD_COUNTRIES, YELLOWCARD_CONFIG } from '@/utils/yellowcard/config';
import type { Channel, Network, Recipient, Source } from '@/utils/yellowcard/types';
import { Landmark, Smartphone } from 'lucide-react';

type Step = 'channel' | 'amount' | 'network' | 'details' | 'review' | 'accept' | 'deposit' | 'complete';

// Helper function to get channel display name
function getChannelDisplayName(channel: Channel): string {
  const typeMap: Record<string, string> = {
    'bank': 'Bank Transfer',
    'momo': 'Mobile Money',
    'p2p': 'P2P Transfer',
  };
  return typeMap[channel.channelType] || channel.channelType;
}

// Type helpers for icons and labels
const typeLabel = (t?: string) => {
  const map: Record<string, string> = {
    bank: 'Bank Transfer',
    momo: 'Mobile Money',
    ewallet: 'E-Wallet',
    p2p: 'P2P Transfer',
  };
  const key = (t || '').toLowerCase();
  return map[key] || (t || '');
};

const typeIcon = (t?: string) => {
  const key = (t || '').toLowerCase();
  if (key === 'bank') return <Landmark className="w-4 h-4 text-slate-300" />;
  if (key === 'momo') return <Smartphone className="w-4 h-4 text-slate-300" />;
  return null;
};

export function OnRampFlow() {
  const { toast } = useToast();
  const { getAccessToken } = usePrivy();

  const [step, setStep] = useState<Step>('channel');
  const [loading, setLoading] = useState(false);
  const [kycDataLoading, setKycDataLoading] = useState(false);
  const [kycDataLoaded, setKycDataLoaded] = useState(false);

  // Form state
  const [selectedCountry, setSelectedCountry] = useState('NG');
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  
  const [amount, setAmount] = useState('');
  const [estimatedCrypto, setEstimatedCrypto] = useState('0');
  const [rate, setRate] = useState(0);

  const [networks, setNetworks] = useState<Network[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);

  const userChangedCountryRef = useRef(false);

  const [recipient, setRecipient] = useState<Partial<Recipient>>({});
  const [source, setSource] = useState<Partial<Source>>({});
  const [cryptoCurrency, setCryptoCurrency] = useState('USDT'); // Yellow Card supports USDT on EVM networks
  const [cryptoNetwork, setCryptoNetwork] = useState('ERC20'); // Default to ERC20 (EVM-compatible)

  const [collectionResponse, setCollectionResponse] = useState<any>(null);
  const [pollingForBankInfo, setPollingForBankInfo] = useState(false);

  // Poll for bank info if not available
  useEffect(() => {
    if (!collectionResponse || collectionResponse.bankInfo || pollingForBankInfo) return;

    const pollBankInfo = async () => {
      setPollingForBankInfo(true);
      const maxAttempts = 10;
      const pollInterval = 3000; // 3 seconds

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));

        try {
          const token = await getAccessToken();
          const response = await fetch(`/api/yellowcard/collection?id=${collectionResponse.id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });

          const data = await response.json();
          
          if (data.data?.bankInfo) {
            setCollectionResponse(data.data);
            setPollingForBankInfo(false);
            return;
          }
        } catch (error) {
          console.error('[OnRamp] Polling error:', error);
        }
      }

      setPollingForBankInfo(false);
    };

    pollBankInfo();
  }, [collectionResponse, pollingForBankInfo, getAccessToken]);

  // Fetch Smile ID KYC metadata on component mount
  useEffect(() => {
    const fetchKYCMetadata = async () => {
      if (kycDataLoaded) return; // Only fetch once
      
      setKycDataLoading(true);
      try {
        const token = await getAccessToken();
        if (!token) {
          return;
        }

        const response = await fetch('/api/kyc/smile-id/metadata?format=yellowcard', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.success && data.data) {
          // Convert date from YYYY-MM-DD to MM/DD/YYYY
          const convertDate = (dateStr: string) => {
            const [year, month, day] = dateStr.split('-');
            return `${month}/${day}/${year}`;
          };
          
          // Auto-populate recipient data from Smile ID
          // Construct name as "FirstName LastName" (not "LastName FirstName" from fullName)
          const recipientName = data.data.firstName && data.data.lastName
            ? `${data.data.firstName} ${data.data.lastName}`.trim()
            : data.data.fullName; // Fallback to fullName if firstName/lastName not available
          
          setRecipient({
            name: recipientName, // "BARAKA JIMMY MANGESHO" instead of "MANGESHO BARAKA JIMMY"
            phone: data.data.phone,
            email: data.data.email || '', // Email from User table
            address: data.data.address,
            dob: convertDate(data.data.dob), // Convert to MM/DD/YYYY format
            idType: data.data.idType.toLowerCase(), // Convert to lowercase for select options
            idNumber: data.data.idNumber,
          });
          
          const kycCountry = data.data.country;
          if (!userChangedCountryRef.current && kycCountry) {
            setSelectedCountry(kycCountry);
          }
          
          setKycDataLoaded(true);
          
          toast({
            title: 'KYC Data Loaded',
            description: 'Your details have been auto-filled from your verification',
          });
        }
      } catch (error) {
        console.error('Failed to fetch KYC metadata:', error);
      } finally {
        setKycDataLoading(false);
      }
    };

    fetchKYCMetadata();
  }, [getAccessToken, kycDataLoaded, toast]);

  // Fetch channels when country changes
  const fetchChannels = async (country: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/yellowcard/channels?country=${country}&type=collection`
      );
      const data = await response.json();

      if (data.statusCode === 200 && data.data) {
        // Filter to only show deposit channels (on-ramp)
        const depositChannels = data.data.filter((ch: Channel) => ch.rampType === 'deposit');
        setChannels(depositChannels);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch channels',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch channels',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // On first load, automatically load channels for the default country
  useEffect(() => {
    fetchChannels(selectedCountry);
  }, []);

  // Fetch rates for amount calculation
  const fetchRates = async (country: string, currency: string) => {
    try {
      const response = await fetch(
        `/api/yellowcard/rates?country=${country}&currency=${currency}`
      );
      const data = await response.json();

      if (data.statusCode === 200 && data.data?.[0]) {
        const fetchedRate = data.data[0].rate;
        setRate(fetchedRate);
      }
    } catch (error) {
      console.error('Failed to fetch rates:', error);
    }
  };

  // Calculate estimated crypto amount
  const calculateEstimate = (fiatAmount: string) => {
    const numAmount = parseFloat(fiatAmount);
    if (!numAmount || !rate) {
      setEstimatedCrypto('0');
      return;
    }
    const cryptoAmount = numAmount / rate;
    setEstimatedCrypto(cryptoAmount.toFixed(6));
  };

  // Recalculate estimate when rate changes
  useEffect(() => {
    if (rate && amount) {
      calculateEstimate(amount);
    }
  }, [rate]);

  // Fetch networks
  const fetchNetworks = async () => {
    if (!selectedChannel) {
      console.warn('[OnRamp] fetchNetworks called without selectedChannel');
      return;
    }

    console.log('[OnRamp] Fetching networks for:', {
      country: selectedCountry,
      channelId: selectedChannel.id,
      channel: selectedChannel
    });

    setLoading(true);
    try {
      const url = `/api/yellowcard/networks?country=${selectedCountry}&channelId=${selectedChannel.id}`;
      console.log('[OnRamp] Fetching from URL:', url);
      
      const response = await fetch(url);
      const data = await response.json();

      console.log('[OnRamp] Networks API response:', {
        status: response.status,
        ok: response.ok,
        statusCode: data.statusCode,
        dataLength: data.data?.length,
        error: data.error,
        message: data.message
      });

      if (data.statusCode === 200 && data.data) {
        console.log('[OnRamp] Successfully loaded networks:', data.data);
        setNetworks(data.data);
      } else {
        console.error('[OnRamp] Networks API error:', data);
        toast({
          title: 'Error',
          description: data.error || data.message || 'Failed to fetch networks',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[OnRamp] Networks fetch error:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch networks - network error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Accept collection request
  const acceptCollection = async () => {
    if (!collectionResponse) return;
    
    setLoading(true);
    try {
      console.log('[OnRampFlow] User accepting collection:', collectionResponse.id);
      
      const acceptResponse = await fetch('/api/yellowcard/collection/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: collectionResponse.id }),
      });

      console.log('[OnRampFlow] Accept response status:', acceptResponse.status);
      const acceptData = await acceptResponse.json();
      
      if (!acceptResponse.ok || acceptData.error) {
        toast({
          title: 'Accept Failed',
          description: acceptData.error || acceptData.message || 'Failed to accept collection',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
      
      if (acceptData.data) {
        console.log('[OnRampFlow] ===== COLLECTION ACCEPTED =====');
        console.log('[OnRampFlow] Accepted status:', acceptData.data.status);
        console.log('[OnRampFlow] Has bankInfo:', !!acceptData.data.bankInfo);
        if (acceptData.data.bankInfo) {
          console.log('[OnRampFlow] Bank Info:', acceptData.data.bankInfo);
        }
        
        setCollectionResponse(acceptData.data);
        setStep('deposit');
      }
    } catch (error: any) {
      console.error('[OnRampFlow] Error accepting collection:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept collection',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Submit collection request
  const submitCollection = async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to continue',
          variant: 'destructive',
        });
        return;
      }

      const country = YELLOWCARD_COUNTRIES.find((c) => c.code === selectedCountry);
      if (!country) return;

      const response = await fetch('/api/yellowcard/collection', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: {
            name: recipient.name,
            country: selectedCountry,
            phone: recipient.phone,
            address: recipient.address,
            dob: recipient.dob,
            idNumber: recipient.idNumber,
            idType: recipient.idType,
          },
          source: {
            accountType: source.accountType,
            accountNumber: source.accountNumber,
          },
          channelId: selectedChannel?.id,
          amount: parseFloat(amount),
          currency: country.currency,
          country: selectedCountry,
          reason: 'investment',
          cryptoCurrency,
          cryptoNetwork,
        }),
      });

      const data = await response.json();

      // Check if API returned an error
      if (!response.ok || data.statusCode >= 400) {
        toast({
          title: 'Request Failed',
          description: data.error || data.message || 'Failed to create collection',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Check if we have data
      if (!data.data) {
        toast({
          title: 'Error',
          description: 'No response data received from Yellow Card',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Check if the collection failed due to validation errors
      if (data.data.status === 'failed' || data.data.errorCode) {
        const errorMessages: Record<string, string> = {
          'INVALID_RECIPIENT': 'Invalid recipient information. Please check phone number format (+255...) and other details.',
          'VALIDATION_FAILED': 'Transaction validation failed. Please check all information.',
          'INVALID_NETWORK': 'Invalid network selected for this country.',
          'INVALID_CURRENCY': 'Invalid or unsupported currency for this country.',
        };
        
        const errorMsg = data.data.errorCode 
          ? (errorMessages[data.data.errorCode] || `Error: ${data.data.errorCode}`)
          : 'Collection request failed';

        toast({
          title: 'Collection Failed',
          description: errorMsg,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Success - collection created, now show accept step
      console.log('[OnRampFlow] ===== COLLECTION CREATED ===== ');
      console.log('[OnRampFlow] Collection ID:', data.data.id);
      console.log('[OnRampFlow] Initial status:', data.data.status);
      console.log('[OnRampFlow] Moving to accept step...');
      
      setCollectionResponse(data.data);
      setStep('accept'); // Show accept step instead of auto-accepting
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create collection',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-800/95 backdrop-blur-xl border border-slate-700/60 shadow-2xl !rounded-3xl overflow-hidden">
      <div className="p-6 sm:p-7">
        {/* <h1 className="text-lg font-semibold text-white mb-6">Deposit: Buy Stablecoins</h1> */}
        
        {/* Sandbox indicator */}
        {/* {!YELLOWCARD_CONFIG.IS_PRODUCTION && (
          <div className="p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl mb-6">
            <p className="text-amber-300 text-sm font-medium">
              🧪 SANDBOX MODE: Using test addresses and success simulation for E2E testing
            </p>
          </div>
        )} */}

        {/* Step: Select Channel */}
        {step === 'channel' && (
          <div className="space-y-6">            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Country</label>
              <select
                value={selectedCountry}
                onChange={(e) => {
                  userChangedCountryRef.current = true;
                  const code = e.target.value;
                  setSelectedCountry(code);
                  setChannels([]);
                  setSelectedChannel(null);
                  setNetworks([]);
                  setSelectedNetwork(null);
                  fetchChannels(code);
                }}
                className="w-full bg-slate-800/60 border-slate-600/60 text-slate-100 hover:bg-slate-800/80 hover:border-purple-500/60 focus:border-purple-500 transition-all duration-200 h-12 rounded-xl shadow-sm hover:shadow-purple-500/10 p-3"
              >
                {YELLOWCARD_COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name} ({country.currency})
                  </option>
                ))}
              </select>
            </div>

          {channels.length > 0 && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-300 mb-2">Payment Channel</label>
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => {
                    userChangedCountryRef.current = true;
                    setSelectedChannel(channel);
                    setStep('amount');
                    const country = YELLOWCARD_COUNTRIES.find((c) => c.code === selectedCountry);
                    if (country) fetchRates(selectedCountry, country.currency);
                  }}
                  className="w-full p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl hover:bg-slate-800 hover:border-purple-500/60 transition-all duration-200 text-left group"
                >
                  <div className="font-semibold text-white group-hover:text-purple-400 transition-colors flex items-center gap-2">
                    {typeIcon(channel.channelType)}
                    {getChannelDisplayName(channel)}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">
                    {typeLabel(channel.channelType)} • {channel.currency} • Min: {channel.min.toLocaleString()} {channel.currency}
                  </div>
                </button>
              ))}
            </div>
          )}

          {channels.length === 0 && !loading && (
            <button
              onClick={() => fetchChannels(selectedCountry)}
              className="w-full bg-gradient-to-r from-purple-600 via-purple-500 to-violet-600 hover:from-purple-700 hover:via-purple-600 hover:to-violet-700 text-white font-semibold py-4 rounded-xl shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Load Payment Methods
            </button>
          )}
        </div>
      )}

      {/* Step: Enter Amount */}
      {step === 'amount' && (
        <div className="space-y-6">          
          <h2 className="text-xl font-bold text-white">Enter Amount</h2>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Amount ({selectedChannel?.currency})
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                calculateEstimate(e.target.value);
              }}
              className="w-full bg-slate-800/60 border-slate-600/60 text-slate-100 hover:bg-slate-800/80 hover:border-purple-500/60 focus:border-purple-500 transition-all duration-200 h-12 rounded-xl shadow-sm hover:shadow-purple-500/10 p-3"
              placeholder="Enter amount"
            />
            {selectedChannel?.min && (
              <p className="text-sm text-slate-400 mt-2">
                Min: {selectedChannel.min.toLocaleString()} {selectedChannel.currency} • Max: {selectedChannel.max.toLocaleString()} {selectedChannel.currency}
              </p>
            )}
          </div>

          {estimatedCrypto !== '0' && (
            <div className="p-4 bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/30 rounded-xl">
              <p className="text-sm text-slate-300">You will receive approximately:</p>
              <p className="text-2xl font-bold text-white mt-1">{estimatedCrypto} USDT</p>
              <p className="text-sm text-slate-400 mt-1">Rate: 1 USD = {rate} {selectedChannel?.currency}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => setStep('channel')}
              className="flex-1 p-3 bg-slate-800/60 border border-slate-700/60 text-slate-100 rounded-xl hover:bg-slate-800 hover:border-slate-600 transition-all"
            >
              Back
            </button>
            <button
              onClick={() => {
                setStep('network');
                fetchNetworks();
              }}
              disabled={!amount || parseFloat(amount) <= 0}
              className="flex-1 p-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step: Select Network */}
      {step === 'network' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">Provider</h2>
          
          {loading && (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              <p className="mt-4 text-slate-400">Loading networks...</p>
            </div>
          )}

          {!loading && networks.length === 0 && (
            <div className="p-8 text-center space-y-4">
              <p className="text-slate-400">
                {selectedCountry === 'TZ' 
                  ? 'No networks available for Tanzania in sandbox mode. This is expected behavior.'
                  : 'Unable to load networks. Please try again.'
                }
              </p>
              <div className="flex flex-col gap-3">
                {selectedCountry === 'TZ' ? (
                  <button
                    onClick={() => {
                      // Create mock network for Tanzania testing
                      const mockNetwork = {
                        id: 'mock-tz-network',
                        name: 'Mock Tanzania Network',
                        type: 'bank',
                        status: 'active',
                        country: 'TZ',
                        currency: 'TZS'
                      };
                      console.log('[OnRamp] Using mock network for Tanzania:', mockNetwork);
                      setNetworks([mockNetwork]);
                    }}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold rounded-xl shadow-lg transition-all"
                  >
                    Continue with Mock Network (Testing)
                  </button>
                ) : (
                  <button
                    onClick={fetchNetworks}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold rounded-xl shadow-lg transition-all"
                  >
                    Retry
                  </button>
                )}
                
                {/* Debug button for sandbox */}
                {!YELLOWCARD_CONFIG.IS_PRODUCTION && (
                  <button
                    onClick={async () => {
                      try {
                        console.log('[Debug] Testing networks API directly...');
                        const testUrl = `/api/yellowcard/networks?country=${selectedCountry}&channelId=${selectedChannel?.id || 'test'}`;
                        console.log('[Debug] Test URL:', testUrl);
                        
                        const response = await fetch(testUrl);
                        const data = await response.json();
                        
                        console.log('[Debug] Direct API test result:', {
                          status: response.status,
                          ok: response.ok,
                          data: data
                        });
                        
                        alert(`API Test Result:\nStatus: ${response.status}\nOK: ${response.ok}\nData: ${JSON.stringify(data, null, 2)}`);
                      } catch (e) {
                        console.error('[Debug] API test error:', e);
                        alert(`API Test Error: ${e}`);
                      }
                    }}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg"
                  >
                    🧪 Debug API
                  </button>
                )}
              </div>
            </div>
          )}

          {!loading && networks.length > 0 && (
            <div className="space-y-3">
              {/* <label className="block text-sm font-medium text-slate-300 mb-2">Provider</label> */}
              <select
                value={selectedNetwork?.id || ''}
                onChange={(e) => {
                  const net = networks.find((n) => n.id === e.target.value) || null;
                  setSelectedNetwork(net);
                  if (net) {
                    setSource({ accountType: net.type as any });
                  }
                }}
                className="w-full bg-slate-800/60 border-slate-600/60 text-slate-100 hover:bg-slate-800/80 hover:border-purple-500/60 focus:border-purple-500 transition-all duration-200 h-12 rounded-xl shadow-sm p-3"
              >
                <option value="">Select provider</option>
                {networks.map((network) => (
                  <option key={network.id} value={network.id}>
                    {network.name} • {typeLabel(network.type)}
                  </option>
                ))}
              </select>

              <div className="flex gap-4 mt-4">
                <button
                  onClick={() => setStep('amount')}
                  className="flex-1 p-3 bg-slate-800/60 border border-slate-700/60 text-slate-100 rounded-xl hover:bg-slate-800 hover:border-slate-600 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    if (!selectedNetwork) return;
                    setStep('details');
                  }}
                  disabled={!selectedNetwork}
                  className="flex-1 p-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step: Enter Details */}
      {step === 'details' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            {kycDataLoaded && (
              <span className="text-sm text-green-400 flex items-center gap-1 font-medium">
                KYC should be completed to proceed
              </span>
            )}
          </div>
          
          {kycDataLoading && (
            <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl">
              <p className="text-sm text-slate-300">Loading your KYC details...</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            {/* Hidden inputs for KYC data - sent to backend but not displayed */}
            <input type="hidden" value={recipient.name || ''} />
            <input type="hidden" value={recipient.phone || ''} />
            <input type="hidden" value={recipient.email || ''} />
            <input type="hidden" value={recipient.address || ''} />
            <input type="hidden" value={recipient.dob || ''} />
            <input type="hidden" value={recipient.idType || ''} />
            <input type="hidden" value={recipient.idNumber || ''} />

            {selectedCountry === 'NG' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Additional ID Type <span className="text-red-400">*</span> <span className="text-xs text-slate-400">(Nigeria)</span>
                  </label>
                  <select
                    value={recipient.additionalIdType || 'BVN'}
                    onChange={(e) => setRecipient({ ...recipient, additionalIdType: e.target.value })}
                    className="w-full bg-slate-800/60 border-slate-600/60 text-slate-100 hover:bg-slate-800/80 hover:border-purple-500/60 focus:border-purple-500 transition-all duration-200 h-12 rounded-xl shadow-sm p-3"
                    required
                  >
                    <option value="BVN">BVN (Bank Verification Number)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    BVN Number <span className="text-red-400">*</span> <span className="text-xs text-slate-400">(Nigeria)</span>
                  </label>
                  <input
                    type="text"
                    value={recipient.additionalIdNumber || ''}
                    onChange={(e) => setRecipient({ ...recipient, additionalIdNumber: e.target.value })}
                    className="w-full bg-slate-800/60 border-slate-600/60 text-slate-100 hover:bg-slate-800/80 hover:border-purple-500/60 focus:border-purple-500 transition-all duration-200 h-12 rounded-xl shadow-sm p-3"
                    placeholder="12345678901"
                    required
                  />
                </div>
              </>
            )}

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">Account Number</label>
              <input
                type="text"
                value={source.accountNumber || ''}
                onChange={(e) => setSource({ ...source, accountNumber: e.target.value })}
                className="w-full bg-slate-800/60 border-slate-600/60 text-slate-100 hover:bg-slate-800/80 hover:border-purple-500/60 focus:border-purple-500 transition-all duration-200 h-12 rounded-xl shadow-sm p-3"
              />
            </div>


            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Stablecoin</label>
              <select
                value={cryptoCurrency}
                onChange={(e) => setCryptoCurrency(e.target.value)}
                className="text-base w-full bg-slate-800/60 border-slate-600/60 text-slate-100 hover:bg-slate-800/80 hover:border-purple-500/60 focus:border-purple-500 transition-all duration-200 h-12 rounded-xl shadow-sm p-3"
              >
                {YELLOWCARD_CONFIG.SUPPORTED_CRYPTOS.map((crypto) => (
                  <option key={crypto} value={crypto}>{crypto}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Network</label>
              <select
                value={cryptoNetwork}
                onChange={(e) => setCryptoNetwork(e.target.value)}
                className="text-base w-full bg-slate-800/60 border-slate-600/60 text-slate-100 hover:bg-slate-800/80 hover:border-purple-500/60 focus:border-purple-500 transition-all duration-200 h-12 rounded-xl shadow-sm p-3"
              >
                {YELLOWCARD_CONFIG.SUPPORTED_NETWORKS.map((network) => (
                  <option key={network} value={network}>{network}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setStep('network')}
              className="flex-1 py-3 px-6 bg-slate-800/60 border border-slate-700/60 text-slate-100 rounded-xl hover:bg-slate-800 hover:border-slate-600 transition-all font-medium"
            >
              Back
            </button>
            <button
              onClick={() => setStep('review')}
              disabled={
                !recipient.name ||
                !recipient.phone ||
                !recipient.address ||
                !recipient.dob ||
                !recipient.idType ||
                !recipient.idNumber ||
                !source.accountNumber
              }
              className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Review
            </button>
          </div>
        </div>
      )}

      {/* Step: Review */}
      {step === 'review' && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold">Review Your Request</h2>
          
          <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400 text-base">Amount:</span>
              <span className="font-semibold text-white text-base">{amount} {selectedChannel?.currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 text-base">Estimated Crypto:</span>
              <span className="font-semibold text-white text-base">{estimatedCrypto} {cryptoCurrency}</span>
            </div>
            {rate > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-400 text-base">Exchange Rate:</span>
                <span className="font-medium text-xs text-slate-300 text-base">1 USD = {rate} {selectedChannel?.currency}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400 text-base">Network:</span>
              <span className="font-semibold text-white text-base">{cryptoNetwork}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 text-base">Provider:</span>
              <span className="font-semibold text-white text-base flex items-center gap-2">{typeIcon(selectedNetwork?.type)} {selectedNetwork?.name}</span>
            </div>
          </div>

          {estimatedCrypto === '0' && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                ⚠️ Exchange rate not available. The crypto amount will be calculated when you submit.
              </p>
            </div>
          )}

          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setStep('details')}
              className="flex-1 py-3 px-6 bg-slate-800/60 border border-slate-700/60 text-slate-100 rounded-xl hover:bg-slate-800 hover:border-slate-600 transition-all font-medium"
            >
              Back
            </button>
            <button
              onClick={submitCollection}
              disabled={loading}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? 'Creating...' : 'Proceed'}
            </button>
          </div>
        </div>
      )}

      {/* Step: Accept Collection */}
      {step === 'accept' && collectionResponse && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">Review & Accept</h2>
          
          <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl">
            <p className="font-semibold mb-3 text-blue-300">Collection Request Created</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Reference ID:</span>
                <span className="font-mono text-xs text-slate-300">{collectionResponse.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="font-medium text-amber-400 capitalize">{collectionResponse.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount:</span>
                <span className="font-semibold text-white">{collectionResponse.convertedAmount} {collectionResponse.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">You will receive:</span>
                <span className="font-semibold text-green-400">{collectionResponse.settlementInfo.cryptoAmount.toFixed(6)} {collectionResponse.settlementInfo.cryptoCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Network:</span>
                <span className="font-medium text-white">{collectionResponse.settlementInfo.cryptoNetwork}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/30 rounded-xl">
            <p className="text-sm text-slate-300 flex items-start gap-2">
              {/* <span className="text-lg">💡</span> */}
              <span><strong className="text-purple-300">Next Step:</strong> Click "Accept & Continue" to confirm this collection request. You will then receive bank deposit instructions.</span>
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep('review')}
              className="flex-1 py-3 px-6 bg-slate-800/60 border border-slate-700/60 text-slate-100 rounded-xl hover:bg-slate-800 hover:border-slate-600 transition-all"
            >
              Back
            </button>
            <button
              onClick={acceptCollection}
              disabled={loading}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Accepting...' : 'Accept & Continue'}
            </button>
          </div>
        </div>
      )}

      {/* Step: Deposit Instructions */}
      {step === 'deposit' && collectionResponse && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">Make Your Deposit</h2>
          
          {!collectionResponse.bankInfo && pollingForBankInfo && (
            <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl animate-pulse">
              <p className="font-semibold mb-2 text-blue-300 flex items-center gap-2">
                Fetching Bank Details...
              </p>
              <p className="text-sm text-slate-300">
                Please wait while we retrieve your deposit instructions.
              </p>
            </div>
          )}

          {!collectionResponse.bankInfo && !pollingForBankInfo && (
            <div className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl">
              <p className="font-semibold mb-2 text-amber-300 flex items-center gap-2">
                <span className="text-lg">⏳</span> Bank Details Pending
              </p>
              <p className="text-sm text-slate-300">
                Yellow Card is processing your request. Bank deposit instructions will be sent to you via email/SMS shortly.
              </p>
            </div>
          )}

          {collectionResponse.bankInfo && (
            <div className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl">
              <p className="font-semibold mb-3 text-green-300 flex items-center gap-2">
                <span className="text-lg">✅</span> Bank Details Ready
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Bank:</span>
                  <span className="font-medium text-white">{collectionResponse.bankInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Account Number:</span>
                  <span className="font-medium text-white">{collectionResponse.bankInfo.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Account Name:</span>
                  <span className="font-medium text-white">{collectionResponse.bankInfo.accountName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount:</span>
                  <span className="font-semibold text-white">{collectionResponse.amount} {collectionResponse.currency}</span>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl">
            <p className="font-semibold mb-3 text-white text-sm">Transaction Details</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Reference ID:</span>
                <span className="font-mono text-xs text-slate-300">{collectionResponse.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="font-medium text-white capitalize">{collectionResponse.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount to Deposit:</span>
                <span className="font-semibold text-white">{collectionResponse.amount} {collectionResponse.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">You will receive:</span>
                <span className="font-semibold text-green-400">{collectionResponse.settlementInfo.cryptoAmount.toFixed(6)} {cryptoCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Exchange Rate:</span>
                <span className="font-medium text-slate-300">1 USD = {collectionResponse.settlementInfo.cryptoLocalRate} {collectionResponse.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Network:</span>
                <span className="font-medium text-white">{collectionResponse.settlementInfo.cryptoNetwork}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-400">Wallet:</span>
                <span className="font-mono text-xs text-slate-300 text-right break-all">{collectionResponse.settlementInfo.walletAddress.substring(0, 10)}...{collectionResponse.settlementInfo.walletAddress.substring(38)}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 rounded-xl">
            <p className="text-sm text-slate-300 flex items-center gap-2">
              <span>This transaction will expire at <span className="font-semibold text-yellow-300">{new Date(collectionResponse.expiresAt).toLocaleString()}</span></span>
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/30 rounded-xl">
            <p className="text-sm text-slate-300 flex items-start gap-2">
              <span><strong className="text-purple-300">Next Steps:</strong> We will send you bank deposit instruction</span>
            </p>
          </div>

          <button
            onClick={() => setStep('complete')}
            className="w-full py-3 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            I Understand - Continue
          </button>
        </div>
      )}

      {/* Step: Complete */}
      {step === 'complete' && (
        <div className="text-center space-y-6 py-8">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-full flex items-center justify-center">
            <span className="text-5xl">✓</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Request Submitted!</h2>
            <p className="text-slate-300">
              Your collection request has been created!
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Start New Transaction
          </button>
        </div>
      )}
      </div>
    </Card>
  );
}
