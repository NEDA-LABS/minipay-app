"use client";

/**
 * Minipay-Optimized Dashboard
 * Minimal API calls, Celo-only, fast loading
 */

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useCeloBalances } from "@/hooks/useCeloBalance";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { ArrowDownToLine, FileText, Link as LinkIcon, Wallet } from "lucide-react";
import dynamic from "next/dynamic";

// Lazy-load tab content
const WithdrawTab = dynamic(() => import("@/ramps/components/WithdrawTab"), {
  ssr: false,
  loading: () => <div className="h-40 bg-white/5 rounded-2xl animate-pulse" />,
});
const InvoiceTab = dynamic(() => import("@/invoice/components/InvoiceTab"), {
  ssr: false,
  loading: () => <div className="h-40 bg-white/5 rounded-2xl animate-pulse" />,
});
const PaymentLinkTab = dynamic(
  () => import("@/(paymentLinks)/payment-link/components/PaymentLinkTab"),
  { ssr: false, loading: () => <div className="h-40 bg-white/5 rounded-2xl animate-pulse" /> }
);

export default function MinipayDashboard() {
  const { address, isConnected } = useAccount();
  const { balances, isLoading: balancesLoading } = useCeloBalances();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'balances' | 'withdraw' | 'invoice' | 'link'>('balances');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pb-24">
      {/* Custom Header with Logo + NEDAPay + Beta */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo + Brand */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Image src="/logo.svg" alt="NEDAPay" width={40} height={40} className="rounded-lg" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-lg">NEDAPay</span>
                <Badge variant="default" className="text-[0.6rem] font-bold px-1.5 py-0 bg-blue-600 text-white">
                  BETA
                </Badge>
              </div>
            </div>
            {/* Wallet Selector */}
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300 text-xs font-mono">
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
              </span>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Feature Description */}
        <div className="mb-4 bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
          <p className="text-slate-300 text-sm text-center">
            <span className="font-semibold text-white">Deposit, Withdraw, Send Invoices & Create Payment Links</span>
            <br />
            <span className="text-slate-400 text-xs">Fast, secure payments on Celo blockchain</span>
          </p>
        </div>

        {/* Balance Summary - Only show on Home tab */}
        {activeTab === 'balances' && (
          <div className="mb-6">
            <h2 className="text-white text-xl font-bold mb-3">Your Balance</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* cUSD */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <div className="text-slate-400 text-sm mb-1">cUSD</div>
                <div className="text-white text-2xl font-bold">
                  {balancesLoading ? (
                    <div className="h-8 w-24 bg-slate-700 animate-pulse rounded"></div>
                  ) : (
                    `$${typeof balances.cUSD === 'object' ? balances.cUSD.formatted : parseFloat(balances.cUSD || '0').toFixed(2)}`
                  )}
                </div>
                <div className="text-slate-500 text-xs mt-1">Celo Dollar</div>
              </div>

              {/* USDC */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <div className="text-slate-400 text-sm mb-1">USDC</div>
                <div className="text-white text-2xl font-bold">
                  {balancesLoading ? (
                    <div className="h-8 w-24 bg-slate-700 animate-pulse rounded"></div>
                  ) : (
                    `$${typeof balances.USDC === 'object' ? balances.USDC.formatted : parseFloat(balances.USDC || '0').toFixed(2)}`
                  )}
                </div>
                <div className="text-slate-500 text-xs mt-1">USD Coin</div>
              </div>

              {/* USDT */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <div className="text-slate-400 text-sm mb-1">USDT</div>
                <div className="text-white text-2xl font-bold">
                  {balancesLoading ? (
                    <div className="h-8 w-24 bg-slate-700 animate-pulse rounded"></div>
                  ) : (
                    `$${typeof balances.USDT === 'object' ? balances.USDT.formatted : parseFloat(balances.USDT || '0').toFixed(2)}`
                  )}
                </div>
                <div className="text-slate-500 text-xs mt-1">Tether USD</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content - Show based on active tab */}
        {activeTab === 'balances' && (
          <div className="mt-6">
            <h2 className="text-white text-xl font-bold mb-3">Recent Activity</h2>
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 text-center">
              <p className="text-slate-400 text-sm">Your recent transactions will appear here</p>
            </div>
          </div>
        )}

        {activeTab === 'withdraw' && (
          <div className="mt-2">
            <WithdrawTab walletAddress={address} />
          </div>
        )}

        {activeTab === 'invoice' && (
          <div className="mt-2">
            <InvoiceTab walletAddress={address} />
          </div>
        )}

        {activeTab === 'link' && (
          <div className="mt-2">
            <PaymentLinkTab walletAddress={address} />
          </div>
        )}
      </main>

      {/* Bottom Navigation Bar - Mobile App Style */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-700">
        <div className="grid grid-cols-4 gap-1 p-2">
          {/* Home/Balances Button */}
          <button
            onClick={() => setActiveTab('balances')}
            className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-colors group ${
              activeTab === 'balances' ? 'bg-slate-800/70' : 'hover:bg-slate-800/50'
            }`}
          >
            <div className={`p-2.5 rounded-lg mb-1.5 transition-colors ${
              activeTab === 'balances' 
                ? 'bg-emerald-500/30' 
                : 'bg-emerald-500/20 group-hover:bg-emerald-500/30'
            }`}>
              <Wallet className={`w-5 h-5 ${
                activeTab === 'balances' ? 'text-emerald-300' : 'text-emerald-400'
              }`} />
            </div>
            <span className={`text-xs font-medium ${
              activeTab === 'balances' ? 'text-white' : 'text-slate-300 group-hover:text-white'
            }`}>Home</span>
          </button>

          {/* Withdraw Button */}
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-colors group ${
              activeTab === 'withdraw' ? 'bg-slate-800/70' : 'hover:bg-slate-800/50'
            }`}
          >
            <div className={`p-2.5 rounded-lg mb-1.5 transition-colors ${
              activeTab === 'withdraw' 
                ? 'bg-purple-500/30' 
                : 'bg-purple-500/20 group-hover:bg-purple-500/30'
            }`}>
              <ArrowDownToLine className={`w-5 h-5 ${
                activeTab === 'withdraw' ? 'text-purple-300' : 'text-purple-400'
              }`} />
            </div>
            <span className={`text-xs font-medium ${
              activeTab === 'withdraw' ? 'text-white' : 'text-slate-300 group-hover:text-white'
            }`}>Withdraw</span>
          </button>

          {/* Invoice Button */}
          <button
            onClick={() => setActiveTab('invoice')}
            className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-colors group ${
              activeTab === 'invoice' ? 'bg-slate-800/70' : 'hover:bg-slate-800/50'
            }`}
          >
            <div className={`p-2.5 rounded-lg mb-1.5 transition-colors ${
              activeTab === 'invoice' 
                ? 'bg-blue-500/30' 
                : 'bg-blue-500/20 group-hover:bg-blue-500/30'
            }`}>
              <FileText className={`w-5 h-5 ${
                activeTab === 'invoice' ? 'text-blue-300' : 'text-blue-400'
              }`} />
            </div>
            <span className={`text-xs font-medium ${
              activeTab === 'invoice' ? 'text-white' : 'text-slate-300 group-hover:text-white'
            }`}>Invoice</span>
          </button>

          {/* Payment Link Button */}
          <button
            onClick={() => setActiveTab('link')}
            className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-colors group ${
              activeTab === 'link' ? 'bg-slate-800/70' : 'hover:bg-slate-800/50'
            }`}
          >
            <div className={`p-2.5 rounded-lg mb-1.5 transition-colors ${
              activeTab === 'link' 
                ? 'bg-orange-500/30' 
                : 'bg-orange-500/20 group-hover:bg-orange-500/30'
            }`}>
              <LinkIcon className={`w-5 h-5 ${
                activeTab === 'link' ? 'text-orange-300' : 'text-orange-400'
              }`} />
            </div>
            <span className={`text-xs font-medium ${
              activeTab === 'link' ? 'text-white' : 'text-slate-300 group-hover:text-white'
            }`}>Link</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
