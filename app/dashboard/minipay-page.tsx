"use client";

/**
 * Minipay-Optimized Dashboard
 * Minimal API calls, Celo-only, fast loading
 */

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useCeloBalances } from "@/hooks/useCeloBalance";
import Image from "next/image";
import { 
  Banknote, 
  FileText, 
  Link as LinkIcon, 
  Home, 
  Wallet, 
  Bell, 
  ArrowDown, 
  ArrowUp, 
  MoreHorizontal, 
  Send, 
  Repeat,
  Users,
  Settings,
  Clock,
  ChevronRight
} from "lucide-react";
import dynamic from "next/dynamic";

// Lazy-load tab content
const WithdrawTab = dynamic(() => import("@/ramps/components/WithdrawTab"), {
  ssr: false,
  loading: () => <div className="h-40 bg-white/5 rounded-2xl animate-pulse" />,
});
const DepositTab = dynamic(() => import("@/ramps/components/DepositTab"), {
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
  const [activeTab, setActiveTab] = useState<'balances' | 'activity' | 'contacts' | 'settings' | 'send' | 'deposit'>('balances');
  const [totalBalance, setTotalBalance] = useState("0.00");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch user profile
  useEffect(() => {
    if (address) {
      fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address })
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) setUserProfile(data.user);
      })
      .catch(err => console.error("Failed to sync user", err));
    }
  }, [address]);

  // Calculate total balance
  useEffect(() => {
    if (balancesLoading) return;
    
    const getVal = (val: any) => {
      if (!val) return 0;
      if (typeof val === 'object' && val.formatted) return parseFloat(val.formatted);
      return parseFloat(val);
    };

    const total = getVal(balances.cUSD) + getVal(balances.USDC) + getVal(balances.USDT);
    setTotalBalance(total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }, [balances, balancesLoading]);

  // Fetch transactions
  useEffect(() => {
    if (!address) return;
    
    const fetchTransactions = async () => {
      setTxLoading(true);
      try {
        const response = await fetch(
          `/api/transactions?merchantId=${address}`,
          {
            headers: {
              'x-app-secret': process.env.NEXT_PUBLIC_APP_ACCESS as string,
            },
          }
        );
        if (response.ok) {
          const json = await response.json();
          setTransactions((json.data || []).slice(0, 5)); // Take top 5
        }
      } catch (e) {
        console.error("Error fetching transactions", e);
      } finally {
        setTxLoading(false);
      }
    };

    fetchTransactions();
  }, [address]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'balances':
        return (
          <>
            {/* Total Balance Section */}
            <div className="mb-8 mt-2">
              <div className="text-slate-400 text-sm mb-1 font-medium">Total USD Balance</div>
              <div className="text-white text-4xl font-bold mb-1">
                ${totalBalance}
              </div>
              <div className="text-slate-500 text-sm">USD Value</div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <button onClick={() => setActiveTab('deposit')} className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-4 rounded-full font-semibold transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
                <ArrowDown className="w-5 h-5" />
                <span>Deposit</span>
              </button>
              <button onClick={() => setActiveTab('send')} className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-full font-semibold transition-all active:scale-95 shadow-lg shadow-blue-500/20">
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
              <button className="flex items-center justify-center gap-2 bg-violet-500 hover:bg-violet-600 text-white py-3 px-4 rounded-full font-semibold transition-all active:scale-95 shadow-lg shadow-violet-500/20">
                <MoreHorizontal className="w-5 h-5" />
                <span>More</span>
              </button>
            </div>

            {/* My Assets */}
            <div className="mb-8">
              <h2 className="text-white text-lg font-bold mb-4">My Assets</h2>
              <div className="grid grid-cols-3 gap-3">
                {/* cUSD */}
                <div className="bg-emerald-500 rounded-2xl p-4 flex flex-col justify-between h-32 relative overflow-hidden group">
                  <div className="absolute -right-2 -bottom-2 opacity-20 transform rotate-12 group-hover:scale-110 transition-transform">
                    <div className="w-16 h-16 rounded-full border-4 border-white"></div>
                  </div>
                  <div>
                    <div className="font-bold text-white mb-1">cUSD</div>
                    <div className="flex items-center gap-1 text-emerald-100 text-xs">
                      <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">$</div>
                      {balancesLoading ? '...' : 
                        parseFloat(typeof balances.cUSD === 'object' ? balances.cUSD.formatted : balances.cUSD || '0').toFixed(2)
                      }
                    </div>
                  </div>
                  <div>
                    <div className="text-emerald-100 text-xs">Celo Dollar</div>
                    <div className="text-white text-xs font-medium text-right mt-1">+01%</div>
                  </div>
                </div>

                {/* USDC */}
                <div className="bg-blue-500 rounded-2xl p-4 flex flex-col justify-between h-32 relative overflow-hidden group">
                  <div className="absolute -right-2 -bottom-2 opacity-20 transform rotate-12 group-hover:scale-110 transition-transform">
                    <div className="w-16 h-16 rounded-full border-4 border-white"></div>
                  </div>
                  <div>
                    <div className="font-bold text-white mb-1">USDC</div>
                    <div className="flex items-center gap-1 text-blue-100 text-xs">
                      <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">$</div>
                      {balancesLoading ? '...' : 
                        parseFloat(typeof balances.USDC === 'object' ? balances.USDC.formatted : balances.USDC || '0').toFixed(2)
                      }
                    </div>
                  </div>
                  <div>
                    <div className="text-blue-100 text-xs">USD Coin</div>
                    <div className="text-white text-xs font-medium text-right mt-1">-01%</div>
                  </div>
                </div>

                {/* USDT */}
                <div className="bg-amber-400 rounded-2xl p-4 flex flex-col justify-between h-32 relative overflow-hidden group">
                  <div className="absolute -right-2 -bottom-2 opacity-20 transform rotate-12 group-hover:scale-110 transition-transform">
                    <div className="w-16 h-16 rounded-full border-4 border-white"></div>
                  </div>
                  <div>
                    <div className="font-bold text-white mb-1">USDT</div>
                    <div className="flex items-center gap-1 text-amber-100 text-xs">
                      <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">$</div>
                      {balancesLoading ? '...' : 
                        parseFloat(typeof balances.USDT === 'object' ? balances.USDT.formatted : balances.USDT || '0').toFixed(2)
                      }
                    </div>
                  </div>
                  <div>
                    <div className="text-amber-100 text-xs">Tether USD</div>
                    <div className="text-white text-xs font-medium text-right mt-1">+01%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mb-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white text-lg font-bold">Recent Activity</h2>
                <button 
                  onClick={() => setActiveTab('activity')}
                  className="text-slate-400 text-sm hover:text-white transition-colors"
                >
                  See All
                </button>
              </div>

              <div className="space-y-3">
                {txLoading ? (
                  [1,2,3].map(i => (
                    <div key={i} className="bg-slate-800/50 rounded-xl p-4 animate-pulse flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-700"></div>
                      <div className="flex-1">
                        <div className="h-4 w-24 bg-slate-700 rounded mb-2"></div>
                        <div className="h-3 w-16 bg-slate-700 rounded"></div>
                      </div>
                    </div>
                  ))
                ) : transactions.length > 0 ? (
                  transactions.map((tx, idx) => (
                    <div key={idx} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between hover:bg-slate-800/60 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.wallet === address ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {tx.wallet === address ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {tx.wallet === address ? `Sent ${tx.currency}` : `Received ${tx.currency}`}
                          </div>
                          <div className="text-slate-400 text-xs">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${
                          tx.wallet === address ? 'text-white' : 'text-emerald-400'
                        }`}>
                          {tx.wallet === address ? '-' : '+'}{parseFloat(tx.amount).toFixed(2)} {tx.currency}
                        </div>
                        <div className="text-slate-500 text-xs">Completed</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-8 text-center">
                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Clock className="w-6 h-6 text-slate-500" />
                    </div>
                    <p className="text-slate-400 text-sm">No transactions yet</p>
                  </div>
                )}
              </div>
            </div>
          </>
        );
      
      case 'send':
        return (
          <div className="mt-4 space-y-4">
            <h2 className="text-xl font-bold text-white mb-6">Send & Withdraw</h2>
            <div className="grid gap-4">
              <div className="bg-slate-800/50 rounded-xl overflow-hidden">
                <WithdrawTab walletAddress={address} />
              </div>
            </div>
          </div>
        );
      
      case 'deposit':
        return (
          <div className="mt-4 space-y-4">
            <h2 className="text-xl font-bold text-white mb-6">Deposit Funds</h2>
            <div className="grid gap-4">
              <div className="bg-slate-800/50 rounded-xl overflow-hidden">
                <DepositTab walletAddress={address} />
              </div>
            </div>
          </div>
        );

      case 'contacts':
        return (
          <div className="mt-4 text-center py-12">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white text-lg font-medium">Contacts</h3>
            <p className="text-slate-400 text-sm">Manage your contacts here</p>
          </div>
        );

      case 'activity':
        return (
          <div className="mt-4">
            <h2 className="text-xl font-bold text-white mb-6">All Activity</h2>
             <div className="space-y-3 pb-24">
                {txLoading ? (
                  <div className="text-center py-12 text-slate-400">Loading...</div>
                ) : transactions.length > 0 ? (
                  transactions.map((tx, idx) => (
                    <div key={idx} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.wallet === address ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {tx.wallet === address ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {tx.wallet === address ? `Sent ${tx.currency}` : `Received ${tx.currency}`}
                          </div>
                          <div className="text-slate-400 text-xs">
                            {new Date(tx.createdAt).toLocaleDateString()} • {new Date(tx.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${
                          tx.wallet === address ? 'text-white' : 'text-emerald-400'
                        }`}>
                          {tx.wallet === address ? '-' : '+'}{parseFloat(tx.amount).toFixed(2)} {tx.currency}
                        </div>
                        <div className="text-slate-500 text-xs">{tx.status}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-500">No transaction history</div>
                )}
             </div>
          </div>
        );

      case 'settings':
        return (
          <div className="mt-4 text-center py-12">
            <Settings className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white text-lg font-medium">Settings</h3>
            <p className="text-slate-400 text-sm">App settings and preferences</p>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-slate-50 font-sans">
      {/* Custom Header */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-white/5">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo/Brand */}
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Logo" width={35} height={35} className="rounded-lg" />
              <span className="text-white font-bold text-lg">NEDAPay</span>
            </div>
            {/* Wallet/Profile */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end mr-1">
                <span className="text-white font-medium text-xs">
                  {userProfile?.name || 'User'}
                </span>
                <span className="text-slate-400 text-[10px] font-mono">
                  {address ? `${address.slice(0, 4)}...${address.slice(-4)}` : ''}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
                <span className="text-xs font-bold">
                  {userProfile?.name ? userProfile.name.slice(0, 2).toUpperCase() : (address ? address.slice(2, 4).toUpperCase() : 'MP')}
                </span>
              </div>
              <button className="relative">
                <Bell className="w-6 h-6 text-slate-300" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-950"></span>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 max-w-md">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-white/5 pb-safe">
        <div className="grid grid-cols-4 gap-1 p-2">
          <button
            onClick={() => setActiveTab('balances')}
            className={`flex flex-col items-center justify-center py-3 px-2 rounded-2xl transition-all duration-300 ${
              activeTab === 'balances' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Home className={`w-6 h-6 mb-1 ${activeTab === 'balances' ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-medium">Home</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`flex flex-col items-center justify-center py-3 px-2 rounded-2xl transition-all duration-300 ${
              activeTab === 'activity' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Clock className={`w-6 h-6 mb-1 ${activeTab === 'activity' ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-medium">Activity</span>
          </button>

          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex flex-col items-center justify-center py-3 px-2 rounded-2xl transition-all duration-300 ${
              activeTab === 'contacts' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Users className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Contacts</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center py-3 px-2 rounded-2xl transition-all duration-300 ${
              activeTab === 'settings' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Settings className={`w-6 h-6 mb-1 ${activeTab === 'settings' ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-medium">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
