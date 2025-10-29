# Minipay Code Changes - Specific File Modifications

This document lists the exact changes needed in existing NedaPay files to support Minipay.

## Critical File Changes

### 1. `app/providers.tsx`

**Current:** Supports 8 chains with Privy authentication  
**Required:** Celo-only with optional Privy

```typescript
// REPLACE ENTIRE FILE with:
"use client";

import { celo, celoAlfajores } from "wagmi/chains";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { http } from "wagmi";
import { createConfig } from "wagmi";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected } from 'wagmi/connectors';
import { isMiniPay } from "@/utils/minipay-detection";

const queryClient = new QueryClient();

// Minipay configuration - Celo only
const wagmiConfig = createConfig({
  chains: [celo, celoAlfajores],
  connectors: [
    injected(), // Must be first for Minipay auto-connect
  ],
  transports: {
    [celo.id]: http(process.env.NEXT_PUBLIC_CELO_RPC || 'https://forno.celo.org'),
    [celoAlfajores.id]: http('https://alfajores-forno.celo-testnet.org'),
  },
});

export function Providers(props: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {props.children}
        </WagmiProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
```

---

### 2. `app/page.tsx`

**Add auto-connect and hide connect button in Minipay:**

```typescript
// ADD IMPORTS at top
import { useAutoConnect } from '@/hooks/useAutoConnect';
import { isMiniPay } from '@/utils/minipay-detection';

function HomeContent() {
  // ADD: Auto-connect hook
  const { isInMiniPay, isConnected } = useAutoConnect();
  
  // EXISTING CODE...
  const { authenticated, user, login, logout, ready } = usePrivy();
  
  // MODIFY: Don't show connect button in Minipay
  const showConnectButton = !isInMiniPay && !authenticated;
  
  return (
    <div className="min-h-screen w-full bg-slate-950">
      <Header />
      
      {/* Hero Section */}
      <HeroSection showConnectButton={showConnectButton} />
      
      {/* Rest of page... */}
    </div>
  );
}
```

---

### 3. `app/components/HeroSection.tsx`

**Hide wallet selector in Minipay:**

```typescript
// ADD PROPS
interface HeroSectionProps {
  showConnectButton?: boolean;
}

export default function HeroSection({ showConnectButton = true }: HeroSectionProps) {
  return (
    <section className="...">
      {/* Hero content */}
      
      {/* CONDITIONALLY RENDER connect button */}
      {showConnectButton && (
        <button onClick={handleConnect}>
          Sign in with Email or Wallet
        </button>
      )}
      
      {/* Show different CTA in Minipay */}
      {!showConnectButton && (
        <div className="text-center">
          <p className="text-white text-lg mb-4">
            ✨ Connected via Minipay
          </p>
          <button onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      )}
    </section>
  );
}
```

---

### 4. `app/dashboard/page.tsx`

**Simplify for Celo-only:**

```typescript
// MODIFY imports
import { useCeloBalances } from '@/hooks/useCeloBalance';
import { celo } from 'wagmi/chains';

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { balances, isLoading } = useCeloBalances();
  
  // REMOVE multi-chain logic
  // const [activeChain, setActiveChain] = useState(base);
  
  // SIMPLIFIED: Celo only
  const currentChain = celo;
  
  return (
    <div>
      {/* Remove chain selector */}
      {/* <ChainSelector /> */}
      
      {/* Show Celo balances only */}
      <div className="grid grid-cols-3 gap-4">
        <BalanceCard 
          token="cUSD" 
          balance={balances.cUSD} 
          icon="💵"
        />
        <BalanceCard 
          token="USDC" 
          balance={balances.USDC} 
          icon="🔵"
        />
        <BalanceCard 
          token="USDT" 
          balance={balances.USDT} 
          icon="🟢"
        />
      </div>
      
      {/* Rest of dashboard */}
    </div>
  );
}
```

---

### 5. `app/data/stablecoins.ts`

**Create Minipay-specific token list:**

```typescript
// NEW FILE: app/data/minipay-stablecoins.ts
export const MINIPAY_STABLECOINS = {
  cUSD: {
    address: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
    symbol: 'cUSD',
    name: 'Celo Dollar',
    decimals: 18,
    chainId: 42220,
    icon: '💵',
  },
  USDC: {
    address: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    chainId: 42220,
    adapter: '0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B',
    icon: '🔵',
  },
  USDT: {
    address: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    chainId: 42220,
    adapter: '0x0E2A3e05bc9A16F5292A6170456A710cb89C6f72',
    icon: '🟢',
  },
};

export const CELO_TESTNET_TOKENS = {
  cUSD: {
    address: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
    symbol: 'cUSD',
    name: 'Celo Dollar (Testnet)',
    decimals: 18,
    chainId: 44787,
  },
  USDC: {
    address: '0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B',
    symbol: 'USDC',
    name: 'USD Coin (Testnet)',
    decimals: 6,
    chainId: 44787,
  },
};

export function getCeloTokens(testnet = false) {
  return testnet ? CELO_TESTNET_TOKENS : MINIPAY_STABLECOINS;
}
```

---

### 6. `app/components/WalletEmbedded.tsx`

**Simplify for Celo:**

```typescript
// REMOVE chain switching
// REMOVE multi-chain balance fetching
// ADD Celo-specific features

import { useCeloBalances } from '@/hooks/useCeloBalance';
import { MINIPAY_STABLECOINS } from '@/data/minipay-stablecoins';

export function WalletEmbedded() {
  const { balances, isLoading } = useCeloBalances();
  const [selectedToken, setSelectedToken] = useState<'cUSD' | 'USDC' | 'USDT'>('cUSD');
  
  return (
    <div className="wallet-container">
      {/* Remove chain selector */}
      
      {/* Celo token tabs */}
      <div className="flex gap-2 mb-4">
        {Object.keys(MINIPAY_STABLECOINS).map(token => (
          <button
            key={token}
            onClick={() => setSelectedToken(token as any)}
            className={selectedToken === token ? 'active' : ''}
          >
            {token}
          </button>
        ))}
      </div>
      
      {/* Show selected token balance */}
      <div className="balance">
        {balances[selectedToken] && formatBalance(balances[selectedToken])}
      </div>
      
      {/* Send/Swap tabs */}
      <Tabs>
        <Tab label="Send">
          <SendPanel token={selectedToken} />
        </Tab>
        <Tab label="Swap">
          <SwapPanel /> {/* Ubeswap integration */}
        </Tab>
      </Tabs>
    </div>
  );
}
```

---

### 7. Payment Link Generation

**Restrict to Celo:**

```typescript
// app/api/payment-link/route.ts

export async function POST(req: Request) {
  const { amount, currency, chain } = await req.json();
  
  // VALIDATE: Celo only
  if (chain && chain !== 'celo') {
    return Response.json(
      { error: 'Minipay only supports Celo network' },
      { status: 400 }
    );
  }
  
  // VALIDATE: Supported tokens
  const supportedTokens = ['cUSD', 'USDC', 'USDT'];
  if (!supportedTokens.includes(currency)) {
    return Response.json(
      { error: 'Unsupported token. Use cUSD, USDC, or USDT' },
      { status: 400 }
    );
  }
  
  // Create payment link...
}
```

---

### 8. Transaction Sending

**Use legacy transactions with feeCurrency:**

```typescript
// app/components/SendPanel.tsx

import { useSendTransaction } from 'wagmi';
import { buildCUSDTransfer, buildUSDCTransfer } from '@/utils/celo-transactions';

export function SendPanel({ token }: { token: 'cUSD' | 'USDC' | 'USDT' }) {
  const { sendTransaction } = useSendTransaction();
  
  const handleSend = async (to: string, amount: string) => {
    let txData;
    
    // Build transaction based on token
    switch (token) {
      case 'cUSD':
        txData = buildCUSDTransfer(to, amount);
        break;
      case 'USDC':
        txData = buildUSDCTransfer(to, amount);
        break;
      case 'USDT':
        txData = buildUSDTTransfer(to, amount);
        break;
    }
    
    // Send transaction
    await sendTransaction(txData);
  };
  
  return (
    // Send UI...
  );
}
```

---

## Environment Variables

Update `.env.local`:

```bash
# Remove old multi-chain RPCs
# NEXT_PUBLIC_COINBASE_BASE_RPC=...
# NEXT_PUBLIC_POLYGON_RPC=...
# etc.

# Add Celo-specific
NEXT_PUBLIC_CELO_RPC=https://forno.celo.org
NEXT_PUBLIC_CELO_TESTNET_RPC=https://alfajores-forno.celo-testnet.org

# Minipay-specific (if using ODIS)
NEXT_PUBLIC_ODIS_URL=https://mainnet-odis.celo.org
NEXT_PUBLIC_DEK_PRIVATE_KEY=your-dek-key-here
```

---

## Package.json Changes

```json
{
  "dependencies": {
    // ADD Celo packages
    "@celo/abis": "^11.0.0",
    "@celo/identity": "^6.0.0",
    "@celo/contractkit": "^6.0.0",
    
    // KEEP core packages
    "wagmi": "^2.14.16",
    "viem": "^2.31.4",
    "next": "15.3.0",
    "react": "^19.0.0",
    
    // OPTIONAL: Keep Privy for non-Minipay users
    "@privy-io/react-auth": "^3.0.1", // Optional
    
    // REMOVE if not needed
    // "@across-protocol/app-sdk": "^0.3.0",
    // Multi-chain specific packages...
  }
}
```

---

## Migration Checklist

### Phase 1: Infrastructure
- [ ] Create `utils/minipay-detection.ts`
- [ ] Create `hooks/useAutoConnect.ts`
- [ ] Update `providers.tsx` to Celo-only
- [ ] Test auto-connect in Minipay

### Phase 2: UI Updates
- [ ] Update `page.tsx` to hide connect button
- [ ] Update `HeroSection.tsx` with Minipay messaging
- [ ] Simplify `dashboard/page.tsx` for Celo
- [ ] Remove chain selector UI

### Phase 3: Transaction Logic
- [ ] Create `utils/celo-transactions.ts`
- [ ] Update send functionality with feeCurrency
- [ ] Test transactions in Minipay
- [ ] Verify gas payment in stablecoins

### Phase 4: Advanced Features
- [ ] Implement phone number lookup
- [ ] Create `PhoneNumberInput` component
- [ ] Update payment links for Celo
- [ ] Test end-to-end flows

### Phase 5: Testing
- [ ] Set up ngrok tunnel
- [ ] Test on real Minipay app
- [ ] Test all payment flows
- [ ] Verify on Celo explorer

---

## Testing Commands

```bash
# Install dependencies
npm install @celo/abis @celo/identity @celo/contractkit

# Start dev server
npm run dev

# In another terminal, start ngrok
ngrok http 3000

# Or with static domain
ngrok http --domain=your-domain.ngrok-free.app 3000
```

---

## Common Issues & Solutions

### Issue 1: "Provider not found"
**Solution:** Ensure user has Minipay installed and app is loaded within Minipay browser

### Issue 2: "Transaction failed"
**Solution:** Check that you're using legacy transactions (no EIP-1559 fields) and proper feeCurrency

### Issue 3: "Auto-connect not working"
**Solution:** Verify `injected()` connector is first in connectors array and `isMiniPay()` returns true

### Issue 4: "Wrong network"
**Solution:** Ensure Wagmi config only includes Celo chains, not other networks

### Issue 5: "Phone lookup fails"
**Solution:** Verify ODIS configuration and that phone number is in E.164 format

---

## Resources

- **Minipay Docs:** https://docs.minipay.xyz/
- **Celo Docs:** https://docs.celo.org/build/build-on-minipay/overview
- **Celo Explorer:** https://celoscan.io/
- **Testnet Faucet:** https://faucet.celo.org/
- **Example Apps:** https://github.com/celo-org/minipay-minidapps

---

## Next Steps

1. Create feature branch: `git checkout -b feature/minipay`
2. Start with Phase 1 (infrastructure)
3. Test each phase before moving forward
4. Document any issues or blockers
5. Submit for Minipay app store review when ready

Good luck! 🚀
