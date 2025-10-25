"use client";
import { useState, useEffect, useMemo } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { stablecoins } from "@/data/stablecoins";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { Copy, Check } from "lucide-react";
import SwapModal from "@/components/SwapModal";
import Header from "@/components/Header";
import {
  Activity,
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Download,
  Wallet,
  Send,
  BarChart3,
  PieChart,
  ExternalLink,
  Copy as CopyIcon,
  Sparkles,
  Zap,
  Globe,
  Shield,
  Repeat,
  Menu,
  ChevronLeft,
} from "lucide-react";
import DailyRevenueChart from "./DailyRevenueChart";
import Footer from "@/components/Footer";
import WalletKit from "./WalletKit";
import { resolveName, toHexAddress } from '../utils/ensUtils';

// import {
//   SidebarProvider,
//   useSidebar,
// } from "@/compliance/user/components/ui/sidebar";
// Removed StablecoinBalanceButton and StablecoinBalanceTracker - now in header
import DashboardTabs from "@/components/DashboardTabs";
import BroadCastNotificationListener from "@/components/pushNotificationsListener";

// Define ABIs and constants
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

const MULTICALL3_ABI = [
  "function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) view returns (tuple(bool success, bytes returnData)[] returnData)",
];

const MULTICALL3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";
const BASE_RPC_URL = "https://mainnet.base.org";

// Define type for stablecoin balance
type StablecoinBalance = {
  symbol: string;
  name: string;
  balance: string;
  flag: string;
  region: string;
};

// Define type for transaction
type Transaction = {
  id: string;
  shortId: string;
  date: string;
  amount: number;
  currency: string;
  status: string;
  sender: string;
  senderShort: string;
  rawDate: Date;
  blockExplorerUrl: string;
};

export default function DashboardContent() {
  const { user, authenticated, ready } = usePrivy();
  const walletAddress = user?.wallet?.address;
  const walletType = user?.wallet?.walletClientType;

  // States
  const [stablecoinBalances, setStablecoinBalances] = useState<
    StablecoinBalance[]
  >([]);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapFromSymbol, setSwapFromSymbol] = useState<string>("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isTransactionLoading, setIsTransactionLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(true);
  // const { state, toggleSidebar } = useSidebar();
  // const isCollapsed = state === "collapsed";
  const [metrics, setMetrics] = useState({
    totalReceived: 0,
    totalTransactions: 0,
    averageTransaction: 0,
    monthlyGrowth: 0,
  });
  const [selectedStablecoin, setSelectedStablecoin] = useState<string>("");

  const [copied, setCopied] = useState(false);

  // Set up provider and multicall contract
  const provider = useMemo(
    () => new ethers.providers.JsonRpcProvider(BASE_RPC_URL),
    []
  );
  const multicallContract = useMemo(
    () => new ethers.Contract(MULTICALL3_ADDRESS, MULTICALL3_ABI, provider),
    [provider]
  );

  // State for ENS name
  const [ensName, setEnsName] = useState<string | null>(null);

  // Resolve ENS name (deferred - not critical for initial load)
  useEffect(() => {
    if (!ready || !authenticated || !walletAddress) return;

    // Defer ENS resolution by 1 second to prioritize critical data
    const timer = setTimeout(async () => {
      try {
        const name = await resolveName({ address: walletAddress as `0x${string}` });
        setEnsName(name);
      } catch (error) {
        console.error("Error resolving ENS name:", error);
        setEnsName(null);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [ready, authenticated, walletAddress]);



  // Fetch balances and transactions in parallel when walletAddress changes
  useEffect(() => {
    if (!ready || !authenticated || !walletAddress) return;

    const fetchAllData = async () => {
      setIsBalanceLoading(true);
      setIsTransactionLoading(true);

      try {
        // Fetch balances and transactions in parallel
        const [balancesResult, transactionsResult] = await Promise.allSettled([
          // Fetch balances
          (async () => {
            const baseStablecoins = stablecoins.filter((coin) =>
              coin.chainIds.includes(8453) && coin.addresses[8453]
            );
            const calls = baseStablecoins.flatMap((coin) => [
              {
                target: coin.addresses[8453],
                allowFailure: true,
                callData: new ethers.utils.Interface(ERC20_ABI).encodeFunctionData(
                  "balanceOf",
                  [walletAddress]
                ),
              },
              {
                target: coin.addresses[8453],
                allowFailure: true,
                callData: new ethers.utils.Interface(ERC20_ABI).encodeFunctionData(
                  "decimals",
                  []
                ),
              },
            ]);

            const results = await multicallContract.aggregate3(calls);
            const realBalances: Record<string, string> = {};
            baseStablecoins.forEach((coin, index) => {
              const balanceResult = results[index * 2];
              const decimalsResult = results[index * 2 + 1];

              if (balanceResult.success && decimalsResult.success) {
                try {
                  const balance = ethers.utils.defaultAbiCoder.decode(
                    ["uint256"],
                    balanceResult.returnData
                  )[0];
                  const decimals = ethers.utils.defaultAbiCoder.decode(
                    ["uint8"],
                    decimalsResult.returnData
                  )[0];
                  const formatted = ethers.utils.formatUnits(balance, decimals);
                  realBalances[coin.baseToken] =
                    parseFloat(formatted).toLocaleString();
                } catch (err) {
                  console.error(`Error processing ${coin.baseToken}:`, err);
                }
              }
            });

            return baseStablecoins.map((coin) => ({
              symbol: coin.baseToken,
              name: coin.name,
              balance: realBalances[coin.baseToken] || "0",
              flag: coin.flag,
              region: coin.region,
            }));
          })(),
          // Fetch transactions
          (async () => {
            const response = await fetch(
              `/api/transactions?merchantId=${walletAddress}`
            );
            if (!response.ok) throw new Error("Failed to fetch transactions");
            const data = await response.json();

            return data.map((tx: any): Transaction => ({
              id: tx.txHash,
              shortId: tx.txHash.slice(0, 6) + "..." + tx.txHash.slice(-4),
              date: new Date(tx.createdAt)
                .toISOString()
                .replace("T", " ")
                .slice(0, 16),
              amount: parseFloat(tx.amount),
              currency: tx.currency,
              status: tx.status,
              sender: tx.wallet,
              senderShort: tx.wallet.slice(0, 6) + "..." + tx.wallet.slice(-4),
              rawDate: new Date(tx.createdAt),
              blockExplorerUrl: `https://basescan.org/tx/${tx.txHash}`,
            }));
          })(),
        ]);

        // Handle balances result
        if (balancesResult.status === "fulfilled") {
          setStablecoinBalances(balancesResult.value);
        } else {
          console.error("Error fetching balances:", balancesResult.reason);
        }
        setIsBalanceLoading(false);

        // Handle transactions result
        if (transactionsResult.status === "fulfilled") {
          const formattedTransactions = transactionsResult.value as Transaction[];
          setTransactions(formattedTransactions);

          const uniqueStablecoins = Array.from(
            new Set(formattedTransactions.map((tx: Transaction) => tx.currency))
          );
          if (uniqueStablecoins.length > 0 && !selectedStablecoin) {
            setSelectedStablecoin(uniqueStablecoins[0] as string);
          }
        } else {
          console.error("Error fetching transactions:", transactionsResult.reason);
          setTransactions([]);
        }
        setIsTransactionLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsBalanceLoading(false);
        setIsTransactionLoading(false);
      }
    };

    fetchAllData();
  }, [ready, authenticated, walletAddress, multicallContract]);

  // Calculate metrics based on selected stablecoin
  useEffect(() => {
    if (!selectedStablecoin || transactions.length === 0) return;

    const filteredTxs = transactions.filter(
      (tx) => tx.currency === selectedStablecoin && tx.status === "Completed"
    );
    const totalReceived = filteredTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const totalTransactions = filteredTxs.length;
    const averageTransaction =
      totalTransactions > 0 ? totalReceived / totalTransactions : 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthTxs = filteredTxs.filter((tx) => {
      const txDate = tx.rawDate;
      return (
        txDate.getMonth() === currentMonth &&
        txDate.getFullYear() === currentYear
      );
    });

    const lastMonthTxs = filteredTxs.filter((tx) => {
      const txDate = tx.rawDate;
      return (
        txDate.getMonth() === lastMonth &&
        txDate.getFullYear() === lastMonthYear
      );
    });

    const currentMonthTotal = currentMonthTxs.reduce(
      (sum, tx) => sum + tx.amount,
      0
    );
    const lastMonthTotal = lastMonthTxs.reduce((sum, tx) => sum + tx.amount, 0);

    let monthlyGrowth = 0;
    if (lastMonthTotal > 0) {
      monthlyGrowth =
        ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
    } else if (currentMonthTotal > 0) {
      monthlyGrowth = 100;
    }

    setMetrics({
      totalReceived,
      totalTransactions,
      averageTransaction,
      monthlyGrowth,
    });
  }, [transactions, selectedStablecoin]);

  // Handle swap click
  const handleSwapClick = (fromSymbol: string) => {
    setSwapFromSymbol(fromSymbol);
    setSwapModalOpen(true);
  };

  const handleSwap = (from: string, to: string, amount: string) => {
    setSwapModalOpen(false);
    console.log(`Swapping ${amount} ${from} to ${to}`);
  };

  const getGradientClass = (index: number) => {
    switch (index) {
      case 0:
        return "bg-gradient-to-br from-green-500 to-emerald-600";
      case 1:
        return "bg-gradient-to-br from-blue-500 to-cyan-600";
      case 2:
        return "bg-gradient-to-br from-yellow-500 to-orange-600";
      case 3:
        return "bg-gradient-to-br from-purple-500 to-pink-600";
      default:
        return "bg-gradient-to-br from-indigo-500 to-violet-600";
    }
  };

  // Set page as loaded once authenticated and ready
  useEffect(() => {
    if (ready && authenticated) {
      setIsPageLoading(false);
    } else if (ready && !authenticated) {
      setIsPageLoading(false);
    }
  }, [ready, authenticated]);

  // Show loading state ONLY while Privy is initializing
  if (!ready || isPageLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 z-[9999]">
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-600/20 to-transparent rounded-full blur-3xl"
            style={{
              animation: "pulse 8s ease-in-out infinite",
            }}
          />
        </div>
        <div className="relative z-10 text-center">
          <div className="mb-8 flex justify-center">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-500 border-r-blue-500"
                style={{
                  animation: "spin 2s linear infinite",
                }}
              />
              <div
                className="absolute inset-2 rounded-full border-2 border-transparent border-b-purple-400 border-l-blue-400"
                style={{
                  animation: "spin 3s linear infinite reverse",
                }}
              />
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Preparing Your Dashboard
          </h2>
          <p className="text-slate-400 text-sm md:text-base">
            Setting up your account and loading your data
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 w-full">
      <Header />
      <BroadCastNotificationListener />
      {/* Dashboard Tabs - Main Content Area */}
      <div className="relative z-10">
        <div className="w-full">
          {authenticated ? (
            <DashboardTabs walletAddress={walletAddress} />
          ) : (
            <Card className="relative border-0 bg-slate-900/90 text-white shadow-2xl rounded-3xl">
              <CardContent className="relative p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Please Connect Wallet
                    </h2>
                    <p className="text-white/80">
                      Connect your wallet to get started
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
