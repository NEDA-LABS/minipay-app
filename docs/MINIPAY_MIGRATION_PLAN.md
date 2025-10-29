# NedaPay to Minipay Miniapp Migration Plan

## Executive Summary

This document outlines the comprehensive plan to adapt NedaPay merchant portal into a Minipay miniapp. Minipay is Opera's lightweight stablecoin wallet with 8M+ users across emerging markets, providing a massive distribution opportunity for NedaPay.

**Migration Timeline:** 4-6 weeks  
**Estimated Effort:** Medium-High (significant architectural changes required)  
**Risk Level:** Medium (requires careful testing of payment flows)

---

## 1. Key Differences Analysis

### 1.1 Current NedaPay vs Minipay Requirements

| Aspect | Current NedaPay | Minipay Requirement | Impact |
|--------|----------------|---------------------|--------|
| **Blockchain Networks** | 8 chains (Base, Polygon, BSC, Arbitrum, Celo, Scroll, Optimism, Lisk) | Celo only (mainnet & Alfajores testnet) | **HIGH** - Remove 7 chains |
| **Stablecoins** | 11+ stablecoins across chains | cUSD, USDC, USDT on Celo only | **HIGH** - Reduce token list |
| **Authentication** | Privy multi-wallet with social login | Auto-connect via window.ethereum | **HIGH** - Remove Privy, simplify auth |
| **Wallet Connection** | Manual connect with wallet selector | Automatic on page load | **MEDIUM** - Remove connect UI |
| **Transaction Type** | EIP-1559 & Legacy | Legacy only | **LOW** - Use legacy transactions |
| **Gas Payment** | Native tokens (ETH, MATIC, BNB, etc.) | feeCurrency (cUSD, USDC, USDT) | **MEDIUM** - Implement feeCurrency |
| **User Identification** | Wallet address, ENS, email | Phone number mapping + address | **MEDIUM** - Add phone lookup |
| **Multi-chain Swaps** | Cross-chain DEX integration | Single-chain only (Ubeswap on Celo) | **MEDIUM** - Remove cross-chain features |
| **KYC/KYB** | Full Sumsub integration | Optional/simplified | **LOW** - Keep but simplify |
| **Payment Links** | Multi-chain support | Celo-only | **MEDIUM** - Restrict to Celo |

### 1.2 Minipay-Specific Capabilities to Add

**New Features:**
1. **Phone Number Resolution**: Resolve Minipay phone numbers to addresses using ODIS
2. **Minipay Detection**: Detect when app is running inside Minipay vs standalone
3. **In-App Discovery**: Optimize for Minipay's built-in app discovery page
4. **Simplified UX**: Mobile-first, minimal interface for emerging markets
5. **Offline Support**: Basic functionality with intermittent connectivity
6. **Sub-cent Fees**: Leverage Celo's ultra-low transaction costs

---

## 2. Technical Requirements

### 2.1 Development Environment

```bash
# Required Software
- Node.js v20+
- npm/yarn/pnpm
- ngrok account (for local testing)
- Minipay app (Android/iOS)
- Celo testnet tokens

# Required Packages (modifications to existing)
- @celo/abis - Celo contract ABIs
- @celo/identity - Phone number lookup
- viem@1.x - Compatible with Minipay
- wagmi (keep existing, configure for Celo only)
```

### 2.2 Minipay Detection Pattern

```typescript
// utils/minipay-detection.ts
export function isMiniPay(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.ethereum && window.ethereum.isMiniPay);
}

export function getProvider() {
  if (typeof window === 'undefined') return null;
  if (isMiniPay()) {
    return window.ethereum; // Minipay provider
  }
  return null; // Fallback or show install prompt
}
```

### 2.3 Auto-Connect Implementation

```typescript
// hooks/useAutoConnect.ts
import { useEffect } from 'react';
import { useConnect, useAccount } from 'wagmi';
import { isMiniPay } from '@/utils/minipay-detection';

export function useAutoConnect() {
  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();

  useEffect(() => {
    // Only auto-connect in Minipay
    if (!isMiniPay() || isConnected) return;
    
    // Connect with injected connector (first in list)
    const injectedConnector = connectors[0];
    if (injectedConnector) {
      connect({ connector: injectedConnector });
    }
  }, [connect, connectors, isConnected]);
}
```

---

## 3. Architecture Changes

### 3.1 New Project Structure

```
miniapp/
├── app/
│   ├── (minipay)/                    # NEW: Minipay-specific routes
│   │   ├── layout.tsx                # Minipay wrapper with auto-connect
│   │   ├── page.tsx                  # Minipay home/dashboard
│   │   ├── send/                     # Send payments
│   │   ├── receive/                  # Receive payments (QR, links)
│   │   ├── transactions/             # Transaction history
│   │   └── settings/                 # Minimal settings
│   ├── components/
│   │   └── minipay/                  # NEW: Minipay-specific components
│   ├── hooks/
│   │   ├── useAutoConnect.ts         # NEW
│   │   ├── usePhoneLookup.ts         # NEW
│   │   └── useCeloBalance.ts         # NEW
│   └── utils/
│       ├── minipay-detection.ts      # NEW
│       ├── celo-transactions.ts      # NEW
│       └── phone-resolver.ts         # NEW
```

### 3.2 Providers Configuration for Celo Only

```typescript
// app/providers.tsx - SIMPLIFIED
import { celo, celoAlfajores } from "wagmi/chains";
import { createConfig } from "wagmi";
import { injected } from 'wagmi/connectors';

const wagmiConfig = createConfig({
  chains: [celo, celoAlfajores],
  connectors: [injected()], // Must be first for auto-connect
  transports: {
    [celo.id]: http('https://forno.celo.org'),
    [celoAlfajores.id]: http('https://alfajores-forno.celo-testnet.org'),
  },
});
```

---

## 4. Implementation Roadmap

### Phase 1: Core Infrastructure (Week 1)
- Create new `(minipay)` route group
- Implement Minipay detection utility
- Configure Wagmi for Celo-only
- Remove/optional Privy dependency
- Implement auto-connect hook
- Set up ngrok tunnel for testing

### Phase 2: Payment Features (Week 2-3)
- Build Celo token balance component
- Implement send payment with feeCurrency
- Create receive payment (QR code)
- Add phone number input
- Integrate ODIS for phone lookup
- Transaction history (Celo only)
- Payment link generation

### Phase 3: Advanced Features (Week 3-4)
- Invoice generation
- Payment link management
- Basic analytics dashboard
- Swap integration (Ubeswap)
- Multi-token support
- Notification system

### Phase 4: Polish & Optimization (Week 4-5)
- Mobile-first UI optimization
- Loading states and skeletons
- Error handling and retry logic
- Offline detection
- Performance optimization
- Accessibility improvements

### Phase 5: Testing & Deployment (Week 5-6)
- Comprehensive testing on Minipay
- Test on various devices
- Security audit
- Submit to Minipay app store
- Documentation and marketing

---

## 5. Risk Mitigation

### Technical Risks
- **Celo RPC downtime**: Use fallback RPCs, implement retry logic
- **ODIS unavailable**: Cache lookups, show manual address input
- **Transaction failures**: Proper error handling, retry mechanism
- **Slow mobile networks**: Optimize bundle size, loading states

### User Experience Risks
- **Complex UI**: Simplified onboarding, tooltips, tutorials
- **Single-chain confusion**: Clear messaging about Celo-only
- **Phone privacy**: Clear privacy policy, explain ODIS

### Business Risks
- **Low adoption**: Marketing campaign, partnerships
- **Policy changes**: Diversify distribution channels
- **Competition**: Unique features, superior UX

---

## 6. Success Metrics

### Launch Targets (First 3 Months)
- **Users:** 5,000+ active wallets
- **Transactions:** 10,000+ payments
- **Volume:** $100,000+ in transaction volume
- **Retention:** 30% monthly active users
- **Rating:** 4.5+ stars

### Performance Targets
- **Load Time:** < 2 seconds on 3G
- **Transaction Success:** > 95%
- **Uptime:** > 99.9%
- **Error Rate:** < 1%

---

## Next Steps

1. Set up Minipay development environment
2. Create `feature/minipay-integration` branch
3. Start Phase 1 implementation
4. Document progress and blockers
5. Weekly demos and reviews

See detailed implementation guide in `MINIPAY_IMPLEMENTATION_GUIDE.md`
