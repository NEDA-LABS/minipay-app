"use client";

import { useState, useEffect } from "react";
import Header from "../components/Header";
import { useWallet } from "@/hooks/useWallet";
import { useRouter } from "next/navigation";
import CurrencyFilter from "./CurrencyFilter";
import { exportTransactionsToCSV } from "./ExportCSV";
import { RevenueLineChart, TransactionsBarChart, CurrencyDoughnutChart } from "./Charts";
import { ArrowRight, DollarSign } from "lucide-react";

const fetchTransactionsFromDB = async (
  walletAddress: string | undefined,
  setTransactions: (txs: any[]) => void,
  setIsTransactionLoading: (loading: boolean) => void
) => {
  if (!walletAddress) return;
  setIsTransactionLoading(true);
  try {
    const response = await fetch(
      `/api/transactions?merchantId=${walletAddress}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch transactions");
    }
    const transactions = await response.json();
    const formattedTransactions = transactions.map((tx: any) => ({
      id: tx.txHash,
      shortId: tx.txHash.slice(0, 6) + "..." + tx.txHash.slice(-4),
      date: new Date(tx.createdAt).toISOString().replace("T", " ").slice(0, 16),
      amount: tx.amount.toString(),
      currency: tx.currency,
      status: tx.status,
      sender: tx.wallet,
      senderShort: tx.wallet.slice(0, 6) + "..." + tx.wallet.slice(-4),
      blockExplorerUrl: `https://basescan.org/tx/${tx.txHash}`,
    }));
    setTransactions(formattedTransactions);
  } catch (error) {
    console.error("Error fetching transactions from DB:", error);
    setTransactions([]);
  } finally {
    setIsTransactionLoading(false);
  }
};

const getPaymentMethodsData = (transactions: any[]) => {
  const currencyDistribution: Record<string, number> = {};
  
  transactions.forEach(tx => {
    const currency = tx.currency;
    const amount = parseFloat(tx.amount) || 0;
    currencyDistribution[currency] = (currencyDistribution[currency] || 0) + amount;
  });

  const labels = Object.keys(currencyDistribution);
  const data = Object.values(currencyDistribution);

  return {
    labels,
    datasets: [
      {
        label: "Currency Distribution",
        data,
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)", // Blue
          "rgba(139, 92, 246, 0.8)", // Purple
          "rgba(79, 70, 229, 0.8)", // Indigo
          "rgba(255, 255, 255, 0.8)", // White
          "rgba(16, 185, 129, 0.8)", // Emerald
          "rgba(245, 158, 11, 0.8)", // Amber
          "rgba(236, 72, 153, 0.8)", // Pink
        ],
        borderColor: [
          "rgb(59, 130, 246)", // Blue
          "rgb(139, 92, 246)", // Purple
          "rgb(79, 70, 229)", // Indigo
          "rgb(255, 255, 255)", // White
          "rgb(16, 185, 129)", // Emerald
          "rgb(245, 158, 11)", // Amber
          "rgb(236, 72, 153)", // Pink
        ],
        borderWidth: 1,
      },
    ],
  };
};

export default function AnalyticsContent() {
  const [dateRange, setDateRange] = useState("All");
  const { address, authenticated } = useWallet();
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isTransactionLoading, setIsTransactionLoading] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");

  // Wallet connection check
  useEffect(() => {
    if (typeof window !== "undefined") {
      const walletConnected = localStorage.getItem("walletConnected") === "true";
      const cookieWalletConnected = document.cookie.includes(
        "wallet_connected=true"
      );

      if (!authenticated && !walletConnected && !cookieWalletConnected) {
        router.push("/?walletRequired=true");
      }
    }
  }, [authenticated, router]);

  // Fetch transactions
  useEffect(() => {
    async function fetchData() {
      if (!address) return;
      await fetchTransactionsFromDB(address, setTransactions, setIsTransactionLoading);
    }
    if (authenticated && address) fetchData();
  }, [authenticated, address]);

  // Date range filtering
  const now = new Date();
  const getDateThreshold = () => {
    if (dateRange === "7d") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (dateRange === "30d") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (dateRange === "90d") return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    return new Date(0); // All time
  };
  
  const dateThreshold = getDateThreshold();
  
  const getPreviousThreshold = () => {
    if (dateRange === "7d") return new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    if (dateRange === "30d") return new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    if (dateRange === "90d") return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    return new Date(0);
  };
  
  const previousThreshold = getPreviousThreshold();

  const filteredTxs = transactions.filter((tx) => {
    const txDate = new Date(tx.date);
    const currencyMatch = !selectedCurrency || tx.currency === selectedCurrency;
    return txDate >= dateThreshold && currencyMatch;
  });

  const previousTxs = transactions.filter((tx) => {
    const txDate = new Date(tx.date);
    const currencyMatch = !selectedCurrency || tx.currency === selectedCurrency;
    return txDate >= previousThreshold && txDate < dateThreshold && currencyMatch;
  });

  // Compute percentage changes
  const computePercentageChange = (currentValue: number, previousValue: number) => {
    if (previousValue === 0) return currentValue > 0 ? 100 : 0;
    return ((currentValue - previousValue) / previousValue) * 100;
  };

  const currentRevenue = filteredTxs.reduce(
    (sum, tx) => sum + parseFloat(tx.amount || "0"),
    0
  );
  const previousRevenue = previousTxs.reduce(
    (sum, tx) => sum + parseFloat(tx.amount || "0"),
    0
  );
  const revenueChange = computePercentageChange(currentRevenue, previousRevenue);

  const currentTxCount = filteredTxs.length;
  const previousTxCount = previousTxs.length;
  const txCountChange = computePercentageChange(currentTxCount, previousTxCount);

  const currentAvg = filteredTxs.length > 0 ? currentRevenue / filteredTxs.length : 0;
  const previousAvgTx = previousTxs.length > 0 ? previousRevenue / previousTxs.length : 0;
  const avgTxChange = computePercentageChange(currentAvg, previousAvgTx);

  // Chart data
  const revenueData = {
    labels: filteredTxs.map((tx) => tx.date),
    datasets: [
      {
        label: "Revenue",
        data: filteredTxs.map((tx) => Number(tx.amount)),
        borderColor: "rgb(59, 130, 246)", // Blue
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        tension: 0.3,
      },
    ],
  };

  const transactionsData = { transactions: filteredTxs };
  const currencyDistributionData = getPaymentMethodsData(filteredTxs);

  return (
    <div className="flex flex-col min-h-screen text-white">
      <Header />
      <div className="flex-grow w-full overflow-x-hidden">
        {!authenticated || !address ? (
          <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-8 sm:py-12">
            <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/30 rounded-2xl p-6 text-center">
              <p className="text-red-400 font-medium">Please connect your wallet to view analytics.</p>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
            {/* Single Unified Card - Mobile First */}
            <div className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-800/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-700/60">
              
              {/* Header Section */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 sm:mb-5 pb-4 border-b border-slate-700/50">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1">
                  <CurrencyFilter
                    currencies={[...new Set(transactions.map((tx) => tx.currency))].filter(Boolean)}
                    selected={selectedCurrency}
                    onChange={setSelectedCurrency}
                  />
                  <div className="inline-flex rounded-lg border border-slate-700/50 bg-slate-900/50 p-0.5">
                    {["7d", "30d", "90d", "all"].map((range) => (
                      <button
                        key={range}
                        type="button"
                        onClick={() => setDateRange(range)}
                        className={`px-2 sm:px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                          dateRange === range
                            ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg"
                            : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                        }`}
                      >
                        {range === "7d" ? "7D" : range === "30d" ? "30D" : range === "90d" ? "90D" : "All"}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg px-3 py-1.5 text-white text-xs font-semibold transition-all duration-200 disabled:opacity-50 shadow-lg whitespace-nowrap"
                  onClick={() => exportTransactionsToCSV(filteredTxs)}
                  disabled={filteredTxs.length === 0}
                >
                  Export CSV
                </button>
              </div>

              {/* Stats cards */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5">
              <div className="bg-slate-800/40 rounded-xl p-2 sm:p-3 border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300">
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <h3 className="text-[9px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider leading-tight">
                    Total Revenue
                  </h3>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center">
                    <DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-400" />
                  </div>
                </div>
                {isTransactionLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                    <p className="text-sm text-slate-400">Loading...</p>
                  </div>
                ) : !transactions.length ? (
                  <p className="text-lg sm:text-2xl font-bold text-white">0</p>
                ) : (
                  (() => {
                    const sums: Record<string, number> = {};
                    filteredTxs.forEach((tx) => {
                      const amt = parseFloat(tx.amount || "0");
                      sums[tx.currency] = (sums[tx.currency] || 0) + amt;
                    });
                    const entries = Object.entries(sums);
                    if (entries.length === 1) {
                      const [currency, sum] = entries[0];
                      return (
                        <p className="text-lg sm:text-2xl font-bold text-white">
                          {sum.toLocaleString()} {currency}
                        </p>
                      );
                    }
                    return (
                      <div>
                        {entries.map(([currency, sum]) => (
                          <div
                            key={currency}
                            className="text-sm sm:text-base text-white font-bold"
                          >
                            {sum.toLocaleString()} {currency}
                          </div>
                        ))}
                      </div>
                    );
                  })()
                )}
                <p
                  className={`text-[9px] sm:text-xs mt-1.5 sm:mt-2 flex items-center font-medium ${
                    revenueChange >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d={
                        revenueChange >= 0
                          ? "M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586l3.293-3.293A1 1 0 0112 7z"
                          : "M12 13a1 1 0 110 2h-5a1 1 0 01-1-1V9a1 1 0 112 0v2.586l-4.293-4.293a1 1 0 01-1.414 0L16 9.586l4.293-4.293a1 1 0 011.414 1.414l-5 5a1 1 0 01-1.414 0L13 9.414l-3.293 3.293A1 1 0 0112 13z"
                      }
                      clipRule="evenodd"
                    />
                  </svg>
                  {revenueChange.toFixed(1)}% from last period
                </p>
              </div>

              <div className="bg-slate-800/40 rounded-xl p-2 sm:p-3 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300">
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <h3 className="text-[9px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider leading-tight">
                    Transactions
                  </h3>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center">
                    <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400" />
                  </div>
                </div>
                {isTransactionLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-sm text-slate-400">Loading...</p>
                  </div>
                ) : (
                  <p className="text-lg sm:text-2xl font-bold text-white">{filteredTxs.length}</p>
                )}
                <p
                  className={`text-[9px] sm:text-xs mt-1.5 sm:mt-2 flex items-center font-medium ${
                    txCountChange >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d={
                        txCountChange >= 0
                          ? "M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586l3.293-3.293A1 1 0 0112 7z"
                          : "M12 13a1 1 0 110 2h-5a1 1 0 01-1-1V9a1 1 0 112 0v2.586l-4.293-4.293a1 1 0 01-1.414 0L16 9.586l4.293-4.293a1 1 0 011.414 1.414l-5 5a1 1 0 01-1.414 0L13 9.414l-3.293 3.293A1 1 0 0112 13z"
                      }
                      clipRule="evenodd"
                    />
                  </svg>
                  {txCountChange.toFixed(1)}% from last period
                </p>
              </div>

              <div className="bg-slate-800/40 rounded-xl p-2 sm:p-3 border border-slate-700/50 hover:border-emerald-500/50 transition-all duration-300">
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <h3 className="text-[9px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider leading-tight">
                    Average Transaction
                  </h3>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
                  </div>
                </div>
                {isTransactionLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                    <p className="text-sm text-slate-400">Loading...</p>
                  </div>
                ) : !filteredTxs.length ? (
                  <p className="text-lg sm:text-2xl font-bold text-white">0</p>
                ) : (
                  (() => {
                    const sums: Record<string, { sum: number; count: number }> = {};
                    filteredTxs.forEach((tx) => {
                      const amt = parseFloat(tx.amount || "0");
                      if (!sums[tx.currency]) sums[tx.currency] = { sum: 0, count: 0 };
                      sums[tx.currency].sum += amt;
                      sums[tx.currency].count += 1;
                    });
                    const entries = Object.entries(sums);
                    if (entries.length === 1) {
                      const [currency, { sum, count }] = entries[0];
                      return (
                        <p className="text-lg sm:text-2xl font-bold text-white">
                          {(sum / count).toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}{" "}
                          {currency}
                        </p>
                      );
                    }
                    return (
                      <div>
                        {entries.map(([currency, { sum, count }]) => (
                          <div
                            key={currency}
                            className="text-sm sm:text-base text-white font-bold"
                          >
                            {(sum / count).toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}{" "}
                            {currency}
                          </div>
                        ))}
                      </div>
                    );
                  })()
                )}
                <p
                  className={`text-[9px] sm:text-xs mt-1.5 sm:mt-2 flex items-center font-medium ${
                    avgTxChange >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d={
                        avgTxChange >= 0
                          ? "M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586l3.293-3.293A1 1 0 0112 7z"
                          : "M12 13a1 1 0 110 2h-5a1 1 0 01-1-1V9a1 1 0 112 0v2.586l-4.293-4.293a1 1 0 01-1.414 0L16 9.586l4.293-4.293a1 1 0 011.414 1.414l-5 5a1 1 0 01-1.414 0L13 9.414l-3.293 3.293A1 1 0 0112 13z"
                      }
                      clipRule="evenodd"
                    />
                  </svg>
                  {avgTxChange.toFixed(1)}% from last period
                </p>
              </div>
            </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-5">
                <div className="bg-slate-800/40 rounded-xl p-3 sm:p-4 border border-slate-700/50">
                  <h3 className="text-xs sm:text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                    Revenue Over Time
                  </h3>
                {isTransactionLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                      <p className="text-sm text-slate-400">Loading chart...</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-64">
                    <RevenueLineChart data={revenueData} />
                  </div>
                )}
              </div>

                <div className="bg-slate-800/40 rounded-xl p-3 sm:p-4 border border-slate-700/50">
                  <h3 className="text-xs sm:text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                    Transaction History
                  </h3>
                  <div className="overflow-x-auto rounded-lg border border-slate-700/50 max-h-64">
                  <table className="min-w-full divide-y divide-slate-700/50">
                    <thead className="bg-slate-800/50">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Currency
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-slate-900/30 divide-y divide-slate-700/50">
                      {isTransactionLoading ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-3 sm:px-6 py-8 text-center"
                          >
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                              <p className="text-sm text-slate-400">Loading transactions...</p>
                            </div>
                          </td>
                        </tr>
                      ) : filteredTxs.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-3 sm:px-6 py-8 text-center text-slate-400"
                          >
                            No transactions found
                          </td>
                        </tr>
                      ) : (
                        filteredTxs.map((tx, idx) => (
                          <tr key={tx.id || idx} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-200">
                              {tx.date}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-white font-semibold">
                              {tx.amount}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-slate-200">
                              {tx.currency}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}