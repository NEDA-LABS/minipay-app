"use client";

import { celo, celoAlfajores } from "wagmi/chains";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { http, fallback } from "wagmi";
import { createConfig } from "wagmi";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected } from 'wagmi/connectors';
import { PrivyProvider } from "@privy-io/react-auth";
import { SidebarProvider } from "@/compliance/user/components/ui/sidebar";
import { ChainProvider } from "@/contexts/ChainContext";
import { isMiniPay } from "@/utils/minipay-detection";

// Create a query client for React Query
const queryClient = new QueryClient();

// Detect environment
const isDevelopment = process.env.NODE_ENV === 'development';
const isMinipay = typeof window !== 'undefined' && isMiniPay();

/**
 * MINIPAY CONFIGURATION:
 * Minipay only supports Celo network - removed all other chains.
 * Using injected connector for auto-connect with Minipay's window.ethereum provider.
 * 
 * In production, we use fallback RPCs for reliability.
 * In development, single RPC to reduce memory usage.
 */
const wagmiConfig = createConfig({
  chains: [celo, celoAlfajores],
  connectors: [
    injected(), // Must be first for Minipay auto-connect
  ],
  ssr: true,
  transports: isDevelopment
    ? {
        [celo.id]: http(process.env.NEXT_PUBLIC_CELO_RPC || 'https://forno.celo.org'),
        [celoAlfajores.id]: http('https://alfajores-forno.celo-testnet.org'),
      }
    : {
        [celo.id]: fallback([
          http(process.env.NEXT_PUBLIC_CELO_RPC || 'https://forno.celo.org'),
          http('https://rpc.ankr.com/celo'),
          http('https://1rpc.io/celo'),
        ]),
        [celoAlfajores.id]: fallback([
          http('https://alfajores-forno.celo-testnet.org'),
          http('https://celo-alfajores.infura.io/v3/demo'),
        ]),
      },
});


export function Providers(props: { children: ReactNode }) {
  const inMinipay = typeof window !== 'undefined' && isMiniPay();
  
  // Minipay: No Privy, just Wagmi
  if (inMinipay) {
    return (
      <SidebarProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <QueryClientProvider client={queryClient}>
            <WagmiProvider config={wagmiConfig}>
              <ChainProvider>
                {props.children}
              </ChainProvider>
            </WagmiProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </SidebarProvider>
    );
  }
  
  // Regular browser: Include Privy for backward compatibility
  return (
    <SidebarProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <PrivyProvider
          appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
          config={{
            appearance: {
              landingHeader: 'Sign in to NEDAPay',
              walletList: ['metamask', 'coinbase_wallet', 'wallet_connect'],
              walletChainType: 'ethereum-only'
            },
            embeddedWallets: {
              ethereum: {
                createOnLogin: "users-without-wallets",
              },
            },
            supportedChains: [celo, celoAlfajores]
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
