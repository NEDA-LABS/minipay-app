# NedaPay Minipay 

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

-
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
