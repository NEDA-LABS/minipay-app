"use client";

/**
 * Minipay-Optimized Dashboard
 * Minimal API calls, Celo-only, fast loading
 */

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useCeloBalances } from "@/hooks/useCeloBalance";
import Image from "next/image";
import { Banknote, FileText, Link as LinkIcon, Home, Wallet } from "lucide-react";
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
      {/* Custom Header with Logo */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-lg">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Image src="/logo.png" alt="Logo" width={35} height={35} className="rounded-lg" />
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
        {/* Feature Description - Only show on Home tab */}
        {activeTab === 'balances' && (
          <div className="mb-4 bg-slate-800/30">
            <p className="text-slate-300 text-sm">
              <span className="font-semibold text-white">Deposit, Withdraw, Send Invoices & Create Payment Links</span>
              <br />
              <span className="text-slate-400 text-xs">Fast, secure payments on Celo</span>
            </p>
          </div>
        )}

        {/* Balance Summary - Only show on Home tab */}
        {activeTab === 'balances' && (
          <div className="mb-6">
            {/* <h2 className="text-white text-xl font-bold mb-3">Your Balance</h2> */}
            {/* Horizontal scrollable row for balances */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {/* cUSD */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 min-w-[100px] flex-shrink-0">
                <div className="text-slate-400 text-sm mb-1">cUSD</div>
                <div className="text-white text-xl font-bold">
                  {balancesLoading ? (
                    <div className="h-7 w-20 bg-slate-700 animate-pulse rounded"></div>
                  ) : (
                    `$${parseFloat(typeof balances.cUSD === 'object' ? balances.cUSD.formatted : balances.cUSD || '0').toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                  )}
                </div>
                <div className="text-slate-500 text-xs mt-1">Celo Dollar</div>
              </div>

              {/* USDC */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 min-w-[100px] flex-shrink-0">
                <div className="text-slate-400 text-sm mb-1">USDC</div>
                <div className="text-white text-xl font-bold">
                  {balancesLoading ? (
                    <div className="h-7 w-20 bg-slate-700 animate-pulse rounded"></div>
                  ) : (
                    `$${parseFloat(typeof balances.USDC === 'object' ? balances.USDC.formatted : balances.USDC || '0').toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                  )}
                </div>
                <div className="text-slate-500 text-xs mt-1">USD Coin</div>
              </div>

              {/* USDT */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 min-w-[100px] flex-shrink-0">
                <div className="text-slate-400 text-sm mb-1">USDT</div>
                <div className="text-white text-xl font-bold">
                  {balancesLoading ? (
                    <div className="h-7 w-20 bg-slate-700 animate-pulse rounded"></div>
                  ) : (
                    `$${parseFloat(typeof balances.USDT === 'object' ? balances.USDT.formatted : balances.USDT || '0').toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
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
            <h2 className="text-white text-base font-bold mb-3">Recent Activity</h2>
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
            className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-colors ${
              activeTab === 'balances' ? 'bg-slate-800/70' : ''
            }`}
          >
            <Home className={`w-5 h-5 mb-1 transition-colors ${
              activeTab === 'balances' ? 'text-white' : 'text-slate-400'
            }`} />
            <span className={`text-xs font-medium transition-colors ${
              activeTab === 'balances' ? 'text-white' : 'text-slate-400'
            }`}>Home</span>
          </button>

          {/* Withdraw Button */}
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-colors ${
              activeTab === 'withdraw' ? 'bg-slate-800/70' : ''
            }`}
          >
            <Banknote className={`w-5 h-5 mb-1 transition-colors ${
              activeTab === 'withdraw' ? 'text-white' : 'text-slate-400'
            }`} />
            <span className={`text-xs font-medium transition-colors ${
              activeTab === 'withdraw' ? 'text-white' : 'text-slate-400'
            }`}>Withdraw</span>
          </button>

          {/* Invoice Button */}
          <button
            onClick={() => setActiveTab('invoice')}
            className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-colors ${
              activeTab === 'invoice' ? 'bg-slate-800/70' : ''
            }`}
          >
            <FileText className={`w-5 h-5 mb-1 transition-colors ${
              activeTab === 'invoice' ? 'text-white' : 'text-slate-400'
            }`} />
            <span className={`text-xs font-medium transition-colors ${
              activeTab === 'invoice' ? 'text-white' : 'text-slate-400'
            }`}>Invoice</span>
          </button>

          {/* Payment Link Button */}
          <button
            onClick={() => setActiveTab('link')}
            className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-colors ${
              activeTab === 'link' ? 'bg-slate-800/70' : ''
            }`}
          >
            <LinkIcon className={`w-5 h-5 mb-1 transition-colors ${
              activeTab === 'link' ? 'text-white' : 'text-slate-400'
            }`} />
            <span className={`text-xs font-medium transition-colors ${
              activeTab === 'link' ? 'text-white' : 'text-slate-400'
            }`}>Link</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
