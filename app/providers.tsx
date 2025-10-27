"use client";

import { base, polygon, arbitrum, celo, scroll, bsc, optimism, mainnet, lisk } from "wagmi/chains";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { http, fallback } from "wagmi";
import { createConfig as createPrivyConfig } from "@privy-io/wagmi";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider } from "@privy-io/react-auth";
import { SidebarProvider } from "@/compliance/user/components/ui/sidebar";
import { ChainProvider } from "@/contexts/ChainContext";

// Create a query client for React Query
const queryClient = new QueryClient();

// Detect environment
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * MEMORY OPTIMIZATION:
 * In development, we use all chains but with single RPC endpoints (no fallbacks)
 * to reduce memory usage from ~2-3GB to ~1-1.5GB.
 * 
 * In production, we use all chains with multiple fallback RPCs for reliability.
 */
const wagmiConfig = createPrivyConfig({
  chains: [base, polygon, bsc, arbitrum, celo, scroll, lisk, optimism],
  ssr: true,
  transports: isDevelopment
    ? // DEVELOPMENT: All chains with single RPC (8 chains, 8 RPCs total)
      {
        [base.id]: http(process.env.NEXT_PUBLIC_COINBASE_BASE_RPC || 'https://mainnet.base.org'),
        [polygon.id]: http(process.env.NEXT_PUBLIC_POLYGON_RPC || polygon.rpcUrls.default.http[0]),
        [bsc.id]: http(process.env.NEXT_PUBLIC_BSC_RPC || bsc.rpcUrls.default.http[0]),
        [arbitrum.id]: http(process.env.NEXT_PUBLIC_ARBITRUM_RPC || arbitrum.rpcUrls.default.http[0]),
        [celo.id]: http(process.env.NEXT_PUBLIC_CELO_RPC || celo.rpcUrls.default.http[0]),
        [scroll.id]: http(process.env.NEXT_PUBLIC_SCROLL_RPC || scroll.rpcUrls.default.http[0]),
        [optimism.id]: http(process.env.NEXT_PUBLIC_OPTIMISM_RPC || optimism.rpcUrls.default.http[0]),
        [lisk.id]: http(process.env.NEXT_PUBLIC_LISK_RPC || lisk.rpcUrls.default.http[0])
      }
    : // PRODUCTION: All chains with fallback RPCs for reliability (8 chains, 32+ RPCs total)
      {
        [base.id]: fallback([
          http(process.env.NEXT_PUBLIC_COINBASE_BASE_RPC),
          http('https://mainnet.base.org'),
          http('https://base-mainnet.g.alchemy.com/v2/demo'),
          http('https://base.llamarpc.com'),
          http('https://1rpc.io/base')
        ]),
        [polygon.id]: fallback([
          http(process.env.NEXT_PUBLIC_POLYGON_RPC || polygon.rpcUrls.default.http[0]),
          http('https://polygon-rpc.com'),
          http('https://rpc-mainnet.matic.network'),
          http('https://polygon.llamarpc.com'),
          http('https://1rpc.io/matic')
        ]),
        [bsc.id]: fallback([
          http(process.env.NEXT_PUBLIC_BSC_RPC || bsc.rpcUrls.default.http[0]),
          http('https://bscrpc.com'),
          http('https://bsc-mainnet.public.blastapi.io'),
          http('https://1rpc.io/bnb'),
          http('https://binance.llamarpc.com')
        ]),
        [arbitrum.id]: fallback([
          http(process.env.NEXT_PUBLIC_ARBITRUM_RPC || arbitrum.rpcUrls.default.http[0]),
          http('https://arbitrum-mainnet.infura.io/v3/demo'),
          http('https://arbitrum.public-rpc.com'),
          http('https://1rpc.io/arb'),
          http('https://arbitrum.llamarpc.com')
        ]),
        [celo.id]: fallback([
          http(process.env.NEXT_PUBLIC_CELO_RPC || celo.rpcUrls.default.http[0]),
          http('https://celo-mainnet.infura.io/v3/demo'),
          http('https://rpc.ankr.com/celo'),
          http('https://1rpc.io/celo'),
          http('https://celo.llamarpc.com')
        ]),
        [scroll.id]: fallback([
          http(process.env.NEXT_PUBLIC_SCROLL_RPC || scroll.rpcUrls.default.http[0]),
          http('https://scroll-mainnet.public.blastapi.io'),
          http('https://1rpc.io/scroll'),
          http('https://scroll.llamarpc.com')
        ]),
        [optimism.id]: fallback([
          http(process.env.NEXT_PUBLIC_OPTIMISM_RPC || optimism.rpcUrls.default.http[0]),
          http('https://optimistic.etherscan.io'),
          http('https://1rpc.io/optimism'),
          http('https://optimism.llamarpc.com')
        ]),
        [lisk.id]: fallback([
          http(process.env.NEXT_PUBLIC_LISK_RPC || lisk.rpcUrls.default.http[0]),
          http('https://lisk-mainnet.infura.io/v3/demo'),
          http('https://rpc.ankr.com/lisk'),
          http('https://1rpc.io/lisk'),
          http('https://lisk.llamarpc.com')
        ])
      }
});


export function Providers(props: { children: ReactNode }) {
  return (
    <SidebarProvider>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
        config={{
          appearance: {
            landingHeader: 'Sign in to NEDAPay',
            walletList: ['metamask', 'coinbase_wallet', 'base_account', 'binance', 'wallet_connect', 'bybit_wallet', 'okx_wallet'],
            walletChainType: 'ethereum-only',
            showWalletLoginFirst: true, // Show wallet options first for faster UX
          },
          embeddedWallets: {
            ethereum: {
              createOnLogin: "users-without-wallets",
            },
          },
          // Only include chains actively used to reduce initialization time
          supportedChains: [base, bsc, arbitrum, polygon, celo, scroll, lisk],
          loginMethods: ['wallet', 'email'], // Limit login methods for faster SDK load
        }}
      >
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={wagmiConfig}>
            <ChainProvider>
              {props.children}
            </ChainProvider>
          </WagmiProvider>
        </QueryClientProvider>
      </PrivyProvider>
    </ThemeProvider>
    </SidebarProvider>
  );
}
