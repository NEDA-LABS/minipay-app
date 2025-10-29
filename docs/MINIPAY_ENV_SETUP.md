# Minipay Environment Setup

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# Celo RPC Endpoints
NEXT_PUBLIC_CELO_RPC=https://forno.celo.org
NEXT_PUBLIC_CELO_TESTNET_RPC=https://alfajores-forno.celo-testnet.org

# Optional: Faster RPC providers
# NEXT_PUBLIC_CELO_RPC=https://rpc.ankr.com/celo
# NEXT_PUBLIC_CELO_RPC=https://1rpc.io/celo

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id

# ODIS (Phone Number Lookup) - Optional for Phase 2
# NEXT_PUBLIC_ODIS_URL=https://mainnet-odis.celo.org
# NEXT_PUBLIC_DEK_PRIVATE_KEY=your_dek_private_key
```

## Installation Steps

### 1. Install Dependencies

```bash
npm install @celo/abis @celo/contractkit @celo/identity
```

### 2. Start Development Server

```bash
npm run dev
```

The app will start at `http://localhost:3000`

### 3. Set Up ngrok for Minipay Testing

```bash
# Install ngrok
npm install -g ngrok

# Or download from https://ngrok.com/download

# Sign up for free account and get auth token
ngrok config add-authtoken YOUR_AUTH_TOKEN

# Start tunnel (with free static domain if available)
ngrok http --domain=your-static-domain.ngrok-free.app 3000

# Or without static domain
ngrok http 3000
```

### 4. Enable Minipay Developer Mode

1. Open Minipay app on your phone
2. Go to **Settings** → **About**
3. Tap **Version** number 7 times
4. **Developer Settings** will appear
5. Enable **Test Page** option

### 5. Load Your App in Minipay

1. Open Minipay app
2. Tap the **Compass** icon 🧭
3. Select **Test Page**
4. Enter your ngrok URL (e.g., `https://your-domain.ngrok-free.app`)
5. Tap **Go**

Your app should auto-connect to Minipay!

## Get Testnet Tokens

Get free Celo testnet tokens from the faucet:

**Celo Alfajores Faucet:** https://faucet.celo.org/celo-sepolia/

1. Connect your wallet
2. Select Alfajores network
3. Request tokens (cUSD, CELO)

## Verify Connection

Open browser console in Minipay test page and check for:

```
[Minipay] Detected Minipay environment
[Minipay] Auto-connecting wallet...
```

If you see these logs, auto-connect is working correctly!

## Common Issues

### Issue: "Provider not found"
**Solution:** Make sure you're opening the app inside Minipay browser, not a regular browser.

### Issue: "Auto-connect not working"
**Solution:** 
1. Check that `injected()` connector is first in `wagmi.config.ts`
2. Verify `window.ethereum.isMiniPay` is `true` in console
3. Restart Minipay app

### Issue: "Wrong network"
**Solution:** Ensure you're only using Celo/Alfajores in wagmi config, not other networks.

### Issue: "TypeScript errors"
**Solution:** Run `npm install` to install new Celo packages, then restart dev server.

## Network Information

### Celo Mainnet (42220)
- **RPC:** https://forno.celo.org
- **Explorer:** https://celoscan.io/
- **cUSD:** 0x765DE816845861e75A25fCA122bb6898B8B1282a
- **USDC:** 0xcebA9300f2b948710d2653dD7B07f33A8B32118C
- **USDT:** 0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e

### Celo Alfajores Testnet (44787)
- **RPC:** https://alfajores-forno.celo-testnet.org
- **Explorer:** https://alfajores.celoscan.io/
- **cUSD:** 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
- **Faucet:** https://faucet.celo.org/

## Next Steps

After setup, test these features:
- ✅ Auto-connect on page load
- ✅ View Celo token balances (cUSD, USDC, USDT)
- ✅ Send transactions with feeCurrency
- ✅ Receive payments via QR/links
- ✅ Transaction history

See `MINIPAY_IMPLEMENTATION_GUIDE.md` for code examples and component usage.
