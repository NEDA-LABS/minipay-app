# NedaPay Minipay 📱

A Celo-native miniapp for seamless stablecoin payments built specifically for the Minipay wallet. Accept payments, create invoices, and manage your business finances - all within Minipay.

---

## What is NedaPay Minipay?

NedaPay Minipay is a lightweight payment application designed exclusively for the Minipay ecosystem. Built on Celo, it provides merchants and businesses with essential tools to accept stablecoin payments, create invoices, and cash out to local fiat currencies - all without leaving the Minipay app.

### Why Minipay?

**Built for Africa**
- Optimized for mobile-first users
- Low transaction fees with gas paid in stablecoins
- Works seamlessly within Minipay wallet
- No need to switch between apps

**Celo-Native**
- Single network (Celo) - no chain switching
- Fast, affordable transactions
- Pay gas fees in cUSD, USDC, or USDT
- Instant settlement

**Miniapp Experience**
- Auto-connects to your Minipay wallet
- Native mobile UI/UX
- Lightweight and fast
- Integrated with Minipay's ecosystem

---

## Key Features

### Accept Payments
- **Payment Links**: Generate instant payment links with QR codes
- **Invoices**: Create professional invoices with automatic tracking
- **Multiple Stablecoins**: Accept cUSD, USDC, and USDT
- **Real-time Notifications**: Get notified when payments arrive

### Cash Out
- **Fiat Off-ramp**: Convert stablecoins to local currency
- **Bank Integration**: Direct deposits to your bank account
- **Mobile Money**: Support for M-Pesa and other mobile wallets
- **Competitive Rates**: Transparent pricing with no hidden fees

### Business Tools
- **Transaction History**: Track all your payments
- **Analytics**: Monitor revenue and growth
- **Export Data**: Download reports for accounting
- **Multi-currency**: View amounts in your local currency

---

## Getting Started

### For Users (Minipay)

1. **Open Minipay App**
   - Make sure you have Minipay installed on your phone
   - [Download Minipay](https://www.opera.com/products/minipay)

2. **Access NedaPay**
   - Open the Compass (🧭) in Minipay
   - Find NedaPay in the miniapps section
   - Or visit our direct link

3. **Start Accepting Payments**
   - App auto-connects to your Minipay wallet
   - Create your first invoice or payment link
   - Share with customers and get paid!

### For Developers

#### Prerequisites
- Node.js 18+ and npm
- Minipay app for testing
- ngrok for local testing

#### Installation

```bash
# Clone the repository
git clone https://github.com/NEDA-LABS/minipay-app.git
cd minipay-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

#### Testing in Minipay

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Start ngrok tunnel
ngrok http 3000

# Open ngrok URL in Minipay Test Page
# Settings → About → Tap Version 7x → Test Page
```

---

## 🌐 Supported Stablecoins

### Celo Mainnet
- **cUSD** - Celo Dollar (USD-pegged)
- **USDC** - USD Coin
- **USDT** - Tether USD

All tokens support **feeCurrency** - pay gas fees in stablecoins instead of CELO!

---

## Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with TypeScript
- **Tailwind CSS** - Utility-first styling
- **Wagmi 2.x** - Ethereum/Celo interactions

### Blockchain
- **Celo Network** - Fast, affordable, mobile-first
- **Viem** - Modern TypeScript Ethereum library
- **Wagmi** - React hooks for Celo
- **feeCurrency** - Pay gas in stablecoins

### Backend & Database
- **Prisma ORM** - Type-safe database access
- **PostgreSQL** - Production database
- **Next.js API Routes** - Serverless functions

### Authentication
- **Minipay Auto-connect** - Seamless wallet connection
- **Wagmi Injected Connector** - Direct Minipay integration
- **Optional Privy** - Fallback for web browsers

### Payments & Off-ramp
- **Payramp** - Fiat off-ramp integration
- **IDRX** - Alternative off-ramp provider
- **Sumsub** - KYC/KYB verification

---

## 📱 Minipay Integration

### Auto-Connect
```typescript
import { useAutoConnect } from '@/hooks/useAutoConnect';

const { isInMiniPay, isConnected } = useAutoConnect();
// Automatically connects wallet in Minipay
```

### Minipay Detection
```typescript
import { isMiniPay } from '@/utils/minipay-detection';

if (isMiniPay()) {
  // Minipay-specific logic
  // Skip landing page, auto-connect, etc.
}
```

### Celo Transactions
```typescript
import { buildCUSDTransfer } from '@/utils/celo-transactions';

const tx = buildCUSDTransfer(toAddress, amount);
// Includes feeCurrency for gas payment in cUSD
```

---

## 🏗️ Architecture

### Simplified for Minipay

**Before (Multi-Chain Platform):**
- 8 chains (Base, Polygon, BSC, Arbitrum, Celo, Scroll, Optimism, Lisk)
- Complex chain switching
- Multiple wallet connections
- Large bundle size

**After (Minipay Miniapp):**
- 1 chain (Celo only)
- Auto-connect wallet
- Native Minipay integration
- Lightweight and fast

### Dashboard Tabs

1. **Withdraw** - Cash out to fiat
2. **Invoice** - Create business invoices
3. **Request** - Payment links and requests

*Note: Wallet operations (send/receive/swap) are handled by Minipay natively*

---

## 🔐 Security & Compliance

### KYC/KYB Verification
- Integrated Sumsub for identity verification
- Required for fiat off-ramp
- Document verification and biometric checks
- Supports 50+ African countries

### Security Features
- End-to-end encryption for sensitive data
- Secure API key management
- Transaction signing with Minipay
- No private keys stored

---

## 🌍 Supported Regions

### Fiat Off-ramp Available
- 🇳🇬 Nigeria (NGN)
- 🇰🇪 Kenya (KES)
- 🇹🇿 Tanzania (TZS)
- 🇿🇦 South Africa (ZAR)
- 🇮🇩 Indonesia (IDR)
- And more...

### Payment Acceptance
- Global - Accept payments from anywhere
- Celo network - Fast and affordable
- Multiple stablecoins supported

---

## 📚 Documentation

### For Users
- [Quick Start Guide](./MINIPAY_QUICKSTART.md)
- [Environment Setup](./docs/MINIPAY_ENV_SETUP.md)
- [Dashboard Guide](./docs/MINIPAY_DASHBOARD_SIMPLIFICATION.md)

### For Developers
- [Migration Plan](./docs/MINIPAY_MIGRATION_PLAN.md)
- [Implementation Guide](./docs/MINIPAY_IMPLEMENTATION_GUIDE.md)
- [Code Changes](./docs/MINIPAY_CODE_CHANGES.md)
- [Phase 1 Complete](./docs/MINIPAY_PHASE1_COMPLETE.md)

---

## 🚦 Development Status

### ✅ Phase 1 Complete
- [x] Minipay detection and auto-connect
- [x] Celo-only network configuration
- [x] Direct dashboard routing (skip landing page)
- [x] Simplified dashboard (3 tabs)
- [x] Wallet operations delegated to Minipay
- [x] Documentation complete

### 🔄 Phase 2 (In Progress)
- [ ] Update components for Celo-only
- [ ] Phone number payments (ODIS)
- [ ] Enhanced mobile UI
- [ ] End-to-end testing

### ⏳ Phase 3 (Planned)
- [ ] Production deployment
- [ ] Minipay app store submission
- [ ] Performance optimization
- [ ] Analytics and monitoring

---

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test in Minipay
5. Submit a pull request

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Conventional commits

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---





*Making crypto payments simple, fast, and accessible for everyone in Africa and beyond.*
