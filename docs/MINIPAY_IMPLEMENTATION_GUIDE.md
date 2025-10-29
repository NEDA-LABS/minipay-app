# Minipay Implementation Guide

Complete code examples and step-by-step instructions for adapting NedaPay to Minipay.

## Table of Contents
1. [File Structure](#file-structure)
2. [Core Utilities](#core-utilities)
3. [Hooks](#hooks)
4. [Components](#components)
5. [Configuration](#configuration)
6. [Testing Setup](#testing-setup)

---

## File Structure

Create these new files in your project:

```
app/
├── utils/
│   ├── minipay-detection.ts       # Minipay detection
│   ├── celo-transactions.ts       # Transaction builders
│   └── phone-resolver.ts          # ODIS integration
├── hooks/
│   ├── useAutoConnect.ts          # Auto-connect hook
│   ├── usePhoneLookup.ts          # Phone lookup
│   └── useCeloBalance.ts          # Celo balances
├── components/minipay/
│   ├── PhoneNumberInput.tsx       # Phone input
│   ├── CeloTokenSelector.tsx      # Token selector
│   └── TransactionStatus.tsx      # TX status
└── data/
    └── minipay-stablecoins.ts     # Celo tokens
```

---

## Core Utilities

### 1. Minipay Detection (`utils/minipay-detection.ts`)

```typescript
/**
 * Minipay Detection Utilities
 * Detect when app runs inside Minipay wallet
 */

interface MiniPayProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  isMiniPay?: boolean;
}

declare global {
  interface Window {
    ethereum?: MiniPayProvider;
  }
}

/**
 * Check if app is running inside Minipay
 */
export function isMiniPay(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.ethereum && window.ethereum.isMiniPay);
}

/**
 * Get Minipay provider
 */
export function getProvider(): MiniPayProvider | null {
  if (typeof window === 'undefined') return null;
  return window.ethereum || null;
}

/**
 * Require Minipay environment
 * Throws error if not in Minipay
 */
export function requireMiniPay(): void {
  if (!isMiniPay()) {
    throw new Error(
      'This feature requires Minipay wallet. Please open this app in Minipay.'
    );
  }
}

/**
 * Get user address directly from provider
 */
export async function getConnectedAddress(): Promise<string | null> {
  const provider = getProvider();
  if (!provider) return null;

  try {
    const accounts = await provider.request({
      method: 'eth_requestAccounts',
      params: [],
    });
    return accounts[0] || null;
  } catch (error) {
    console.error('Failed to get connected address:', error);
    return null;
  }
}
```

### 2. Celo Transaction Builders (`utils/celo-transactions.ts`)

```typescript
import { parseEther, parseUnits } from 'viem';
import { encodeFunctionData } from 'viem';

// Celo stablecoin addresses
export const CELO_TOKENS = {
  cUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
  USDC: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C',
  USDT: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e',
};

export type FeeCurrency = 'cUSD' | 'USDC' | 'USDT';

/**
 * Build native CELO transfer (not commonly used in Minipay)
 */
export function buildNativeTransfer(params: {
  to: string;
  amount: string;
  feeCurrency?: FeeCurrency;
}) {
  return {
    to: params.to,
    value: parseEther(params.amount),
    // Legacy transaction - no EIP-1559 fields
    feeCurrency: CELO_TOKENS[params.feeCurrency || 'cUSD'],
  };
}

/**
 * Build ERC20 token transfer
 * Used for cUSD, USDC, USDT transfers
 */
export function buildTokenTransfer(params: {
  tokenAddress: string;
  to: string;
  amount: string;
  decimals: number;
  feeCurrency?: FeeCurrency;
}) {
  // ERC20 transfer function
  const data = encodeFunctionData({
    abi: [{
      name: 'transfer',
      type: 'function',
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' }
      ],
      outputs: [{ type: 'bool' }],
    }],
    functionName: 'transfer',
    args: [
      params.to,
      parseUnits(params.amount, params.decimals)
    ],
  });

  return {
    to: params.tokenAddress,
    value: '0x0',
    data,
    // Pay gas in stablecoins
    feeCurrency: CELO_TOKENS[params.feeCurrency || 'cUSD'],
  };
}

/**
 * Helper to send cUSD (most common)
 */
export function buildCUSDTransfer(to: string, amount: string) {
  return buildTokenTransfer({
    tokenAddress: CELO_TOKENS.cUSD,
    to,
    amount,
    decimals: 18,
    feeCurrency: 'cUSD',
  });
}

/**
 * Helper to send USDC
 */
export function buildUSDCTransfer(to: string, amount: string) {
  return buildTokenTransfer({
    tokenAddress: CELO_TOKENS.USDC,
    to,
    amount,
    decimals: 6,
    feeCurrency: 'cUSD', // Pay gas in cUSD
  });
}

/**
 * Helper to send USDT
 */
export function buildUSDTTransfer(to: string, amount: string) {
  return buildTokenTransfer({
    tokenAddress: CELO_TOKENS.USDT,
    to,
    amount,
    decimals: 6,
    feeCurrency: 'cUSD', // Pay gas in cUSD
  });
}
```

### 3. Phone Number Resolution (`utils/phone-resolver.ts`)

```typescript
import { OdisUtils } from '@celo/identity';
import { createPublicClient, http } from 'viem';
import { celo } from 'viem/chains';

/**
 * Resolve phone number to Celo address using ODIS
 */
export async function resolvePhoneNumber(
  phoneNumber: string
): Promise<string | null> {
  try {
    // Format to E.164 (international format)
    const formattedPhone = formatToE164(phoneNumber);
    
    // Create public client
    const publicClient = createPublicClient({
      chain: celo,
      transport: http(),
    });

    // Get obfuscated identifier
    const identifier = await OdisUtils.Identifier.getObfuscatedIdentifier(
      formattedPhone,
      OdisUtils.Identifier.IdentifierPrefix.PHONE_NUMBER
    );

    // Lookup address from Accounts contract
    const accountsContract = '0x7d21685C17607338b313a7174bAb6620baD0aaB7';
    
    // This is simplified - full implementation needs proper contract interaction
    // See: https://docs.celo.org/developer/build-on-minipay/code-library
    
    return null; // Implement full lookup
  } catch (error) {
    console.error('Failed to resolve phone number:', error);
    return null;
  }
}

/**
 * Format phone number to E.164 format
 * Example: +234 xxx xxx xxxx
 */
function formatToE164(phoneNumber: string): string {
  // Remove all non-digit characters except +
  let formatted = phoneNumber.replace(/[^\d+]/g, '');
  
  // Add + if not present
  if (!formatted.startsWith('+')) {
    formatted = '+' + formatted;
  }
  
  return formatted;
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  // E.164 format: + followed by 7-15 digits
  const e164Regex = /^\+[1-9]\d{6,14}$/;
  const formatted = formatToE164(phoneNumber);
  return e164Regex.test(formatted);
}
```

---

## Hooks

### 1. Auto-Connect Hook (`hooks/useAutoConnect.ts`)

```typescript
import { useEffect, useRef } from 'react';
import { useConnect, useAccount } from 'wagmi';
import { isMiniPay } from '@/utils/minipay-detection';

/**
 * Auto-connect wallet when in Minipay
 * Called once on app load
 */
export function useAutoConnect() {
  const { connect, connectors, isSuccess } = useConnect();
  const { isConnected } = useAccount();
  const hasAttempted = useRef(false);

  useEffect(() => {
    // Only try once
    if (hasAttempted.current) return;
    
    // Only in Minipay
    if (!isMiniPay()) return;
    
    // Already connected
    if (isConnected) return;

    hasAttempted.current = true;

    // Find injected connector
    const injectedConnector = connectors.find(c => c.id === 'injected') || connectors[0];
    
    if (injectedConnector) {
      console.log('Auto-connecting to Minipay...');
      connect({ connector: injectedConnector });
    }
  }, [connect, connectors, isConnected]);

  return {
    isInMiniPay: isMiniPay(),
    isConnected,
    autoConnectAttempted: hasAttempted.current,
  };
}
```

### 2. Phone Lookup Hook (`hooks/usePhoneLookup.ts`)

```typescript
import { useState } from 'react';
import { resolvePhoneNumber, isValidPhoneNumber } from '@/utils/phone-resolver';

export function usePhoneLookup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  const lookupPhone = async (phoneNumber: string) => {
    setLoading(true);
    setError(null);
    setAddress(null);

    // Validate format
    if (!isValidPhoneNumber(phoneNumber)) {
      setError('Invalid phone number format. Use international format: +234 xxx xxx xxxx');
      setLoading(false);
      return null;
    }

    try {
      const resolvedAddress = await resolvePhoneNumber(phoneNumber);
      
      if (!resolvedAddress) {
        setError('No Minipay account found for this phone number');
        setLoading(false);
        return null;
      }

      setAddress(resolvedAddress);
      setLoading(false);
      return resolvedAddress;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to lookup phone number';
      setError(message);
      setLoading(false);
      return null;
    }
  };

  const reset = () => {
    setAddress(null);
    setError(null);
    setLoading(false);
  };

  return {
    lookupPhone,
    loading,
    error,
    address,
    reset,
  };
}
```

### 3. Celo Balance Hook (`hooks/useCeloBalance.ts`)

```typescript
import { useBalance } from 'wagmi';
import { useAccount } from 'wagmi';
import { celo } from 'wagmi/chains';
import { CELO_TOKENS } from '@/utils/celo-transactions';

/**
 * Hook to fetch all Celo stablecoin balances
 */
export function useCeloBalances() {
  const { address } = useAccount();

  // Fetch cUSD balance
  const cUSD = useBalance({
    address,
    token: CELO_TOKENS.cUSD as `0x${string}`,
    chainId: celo.id,
  });

  // Fetch USDC balance
  const USDC = useBalance({
    address,
    token: CELO_TOKENS.USDC as `0x${string}`,
    chainId: celo.id,
  });

  // Fetch USDT balance
  const USDT = useBalance({
    address,
    token: CELO_TOKENS.USDT as `0x${string}`,
    chainId: celo.id,
  });

  const isLoading = cUSD.isLoading || USDC.isLoading || USDT.isLoading;
  const isError = cUSD.isError || USDC.isError || USDT.isError;

  return {
    balances: {
      cUSD: cUSD.data,
      USDC: USDC.data,
      USDT: USDT.data,
    },
    isLoading,
    isError,
    refetch: () => {
      cUSD.refetch();
      USDC.refetch();
      USDT.refetch();
    },
  };
}
```

---

## Components

### 1. Phone Number Input (`components/minipay/PhoneNumberInput.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { usePhoneLookup } from '@/hooks/usePhoneLookup';
import { Loader2, Phone, Search, CheckCircle, XCircle } from 'lucide-react';

interface PhoneNumberInputProps {
  onAddressResolved: (address: string) => void;
}

export function PhoneNumberInput({ onAddressResolved }: PhoneNumberInputProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const { lookupPhone, loading, error, address, reset } = usePhoneLookup();

  const handleLookup = async () => {
    const resolvedAddress = await lookupPhone(phoneNumber);
    if (resolvedAddress) {
      onAddressResolved(resolvedAddress);
    }
  };

  const handleChange = (value: string) => {
    setPhoneNumber(value);
    if (address || error) reset();
  };

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <Phone className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <p className="text-sm text-blue-900">
          Send to any Minipay phone number
        </p>
      </div>

      {/* Phone Input */}
      <div className="relative">
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="+234 xxx xxx xxxx"
          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading}
        />
        
        <button
          onClick={handleLookup}
          disabled={loading || !phoneNumber || phoneNumber.length < 10}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Success State */}
      {address && (
        <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-900">Address found!</p>
            <p className="text-xs text-green-700 font-mono break-all mt-1">
              {address}
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-900">{error}</p>
        </div>
      )}

      {/* Format Hint */}
      <p className="text-xs text-gray-500">
        Use international format: +[country code] [number]
      </p>
    </div>
  );
}
```

### 2. Celo Token Selector (`components/minipay/CeloTokenSelector.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useCeloBalances } from '@/hooks/useCeloBalance';
import { formatUnits } from 'viem';

export type CeloToken = 'cUSD' | 'USDC' | 'USDT';

interface TokenInfo {
  symbol: CeloToken;
  name: string;
  icon: string;
  decimals: number;
}

const TOKENS: TokenInfo[] = [
  { symbol: 'cUSD', name: 'Celo Dollar', icon: '💵', decimals: 18 },
  { symbol: 'USDC', name: 'USD Coin', icon: '🔵', decimals: 6 },
  { symbol: 'USDT', name: 'Tether USD', icon: '🟢', decimals: 6 },
];

interface CeloTokenSelectorProps {
  selectedToken: CeloToken;
  onSelectToken: (token: CeloToken) => void;
}

export function CeloTokenSelector({
  selectedToken,
  onSelectToken,
}: CeloTokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { balances, isLoading } = useCeloBalances();

  const selected = TOKENS.find(t => t.symbol === selectedToken)!;

  const getBalance = (token: CeloToken) => {
    const balance = balances[token];
    if (!balance) return '0.00';
    return parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(2);
  };

  return (
    <div className="relative">
      {/* Selected Token Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-white border border-gray-300 rounded-lg hover:border-blue-500 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{selected.icon}</span>
          <div className="text-left">
            <p className="font-semibold text-gray-900">{selected.symbol}</p>
            <p className="text-sm text-gray-500">{selected.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isLoading && (
            <span className="text-sm text-gray-600">
              {getBalance(selectedToken)}
            </span>
          )}
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {TOKENS.map((token) => (
            <button
              key={token.symbol}
              onClick={() => {
                onSelectToken(token.symbol);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{token.icon}</span>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">{token.symbol}</p>
                  <p className="text-sm text-gray-500">{token.name}</p>
                </div>
              </div>
              
              {!isLoading && (
                <span className="text-sm text-gray-600">
                  {getBalance(token.symbol)}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Configuration

### Updated `package.json` Dependencies

```json
{
  "dependencies": {
    "@celo/abis": "^11.0.0",
    "@celo/identity": "^6.0.0",
    "@celo/contractkit": "^6.0.0",
    "viem": "^2.31.4",
    "wagmi": "^2.14.16",
    "next": "15.3.0",
    "react": "^19.0.0",
    "lucide-react": "^0.503.0"
  }
}
```

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_CELO_RPC=https://forno.celo.org
NEXT_PUBLIC_CELO_TESTNET_RPC=https://alfajores-forno.celo-testnet.org
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
```

---

## Testing Setup

### 1. Install ngrok

```bash
# Install ngrok
npm install -g ngrok

# Or download from https://ngrok.com/download
```

### 2. Start Development Server

```bash
# Terminal 1: Start Next.js
npm run dev
```

### 3. Create ngrok Tunnel

```bash
# Terminal 2: Start ngrok
ngrok http --domain=your-static-domain.ngrok-free.app 3000

# Or without static domain
ngrok http 3000
```

### 4. Test in Minipay

1. Open Minipay app on phone
2. Tap compass icon (🧭)
3. Select "Test Page"
4. Enter ngrok URL
5. App should auto-connect

### 5. Enable Developer Mode

1. Open Minipay Settings
2. Tap "About" section
3. Tap version number 7 times
4. Developer Settings appear
5. Enable "Test Page" option

---

## Next Steps

1. **Create feature branch:**
   ```bash
   git checkout -b feature/minipay-integration
   ```

2. **Install dependencies:**
   ```bash
   npm install @celo/abis @celo/identity @celo/contractkit
   ```

3. **Create file structure:**
   ```bash
   mkdir -p app/utils app/hooks app/components/minipay
   ```

4. **Start with Phase 1:**
   - Copy utils files from this guide
   - Test Minipay detection
   - Implement auto-connect

5. **Test frequently:**
   - Use ngrok for mobile testing
   - Test on real Minipay app
   - Verify transactions on Celo explorer

Good luck with your Minipay integration! 🚀
