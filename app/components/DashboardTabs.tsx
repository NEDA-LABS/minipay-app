"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowUp,
  ArrowDown, 
  FileText, 
  Link as LinkIcon
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from "next/dynamic";

// Lazy-load each tab's content to minimize initial bundle size
// Minipay: Removed Wallet tab (handled by Minipay) and Bridge tab (Celo-only, no bridging)
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

interface DashboardTabsProps {
  walletAddress?: string;
}

export default function DashboardTabs({ walletAddress }: DashboardTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("withdraw"); // Default to Send/Withdraw

  const handleTabChange = (value: string) => {
    // All tabs now render inline
    setActiveTab(value);
  };

  return (
    <>
      <div className="px-4 sm:px-6 md:px-0">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          {/* Tab Navigation */}
          <div className="w-full mb-4 sm:mb-6 flex justify-center">
            <div className="overflow-x-auto scrollbar-hide">
              <TabsList className="inline-flex items-center gap-0.5 sm:gap-1 bg-slate-900/90 backdrop-blur-sm rounded-full p-0.5 sm:p-1 border border-slate-700/50 shadow-lg font-semibold">
          <TabsTrigger 
            value="withdraw" 
            className="flex !font-bold items-center gap-0.5 sm:gap-1 md:gap-1.5 px-1 sm:px-3 md:px-3 py-1 sm:py-2 md:py-2 rounded-full transition-all duration-200 text-[10px] sm:text-sm md:text-xs font-medium text-slate-300 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:!text-white data-[state=active]:shadow-lg whitespace-nowrap"
          >
            <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Send</span>
          </TabsTrigger>

          <TabsTrigger 
            value="deposit" 
            className="flex !font-bold items-center gap-0.5 sm:gap-1 md:gap-1.5 px-1 sm:px-3 md:px-3 py-1 sm:py-2 md:py-2 rounded-full transition-all duration-200 text-[10px] sm:text-sm md:text-xs font-medium text-slate-300 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:!text-white data-[state=active]:shadow-lg whitespace-nowrap"
          >
            <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Deposit</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="invoice" 
            className="flex !font-bold items-center gap-0.5 sm:gap-1 md:gap-1.5 px-1 sm:px-3 md:px-3 py-1 sm:py-2 md:py-2 rounded-full transition-all duration-200 text-[10px] sm:text-sm md:text-xs font-medium text-slate-300 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:!text-white data-[state=active]:shadow-lg whitespace-nowrap"
          >
            <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Invoice</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="request" 
            className="flex !font-bold items-center gap-0.5 sm:gap-1 md:gap-1.5 px-1 sm:px-3 md:px-3 py-1 sm:py-2 md:py-2 rounded-full transition-all duration-200 text-[10px] sm:text-sm md:text-xs font-medium text-slate-300 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:!text-white data-[state=active]:shadow-lg whitespace-nowrap"
          >
            <LinkIcon className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Request</span>
          </TabsTrigger>
        </TabsList>
            </div>
          </div>

          {/* Tab Content */}
          <TabsContent value="withdraw" className="mt-0 md:max-w-2xl md:mx-auto">
            <WithdrawTab walletAddress={walletAddress} />
          </TabsContent>
          
          <TabsContent value="deposit" className="mt-0 md:max-w-2xl md:mx-auto">
            <DepositTab walletAddress={walletAddress} />
          </TabsContent>
          
          <TabsContent value="invoice" className="mt-0 md:max-w-2xl md:mx-auto">
            <InvoiceTab walletAddress={walletAddress} />
          </TabsContent>
          
          <TabsContent value="request" className="mt-0 md:max-w-2xl md:mx-auto">
            <PaymentLinkTab walletAddress={walletAddress} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
