"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  DollarSign, 
  Wallet, 
  FileText, 
  Link as LinkIcon, 
  ArrowLeftRight 
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WithdrawTab from "@/ramps/components/WithdrawTab";
import WalletTab from "@/components/(wallet)/WalletTab";
import InvoiceTab from "@/invoice/components/InvoiceTab";
import PaymentLinkTab from "@/(paymentLinks)/payment-link/components/PaymentLinkTab";
import BridgeTab from "@/accross-bridge/components/BridgeTab";

interface DashboardTabsProps {
  walletAddress?: string;
}

export default function DashboardTabs({ walletAddress }: DashboardTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("withdraw");

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
            <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Withdraw</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="wallet" 
            className="flex !font-bold items-center gap-0.5 sm:gap-1 md:gap-1.5 px-1 sm:px-3 md:px-3 py-1 sm:py-2 md:py-2 rounded-full transition-all duration-200 text-[10px] sm:text-sm md:text-xs font-medium text-slate-300 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:!text-white data-[state=active]:shadow-lg whitespace-nowrap"
          >
            <Wallet className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Wallet</span>
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
          
          <TabsTrigger 
            value="bridge" 
            className="flex !font-bold items-center gap-0.5 sm:gap-1 md:gap-1.5 px-1 sm:px-3 md:px-3 py-1 sm:py-2 md:py-2 rounded-full transition-all duration-200 text-[10px] sm:text-sm md:text-xs font-medium text-slate-300 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:!text-white data-[state=active]:shadow-lg whitespace-nowrap"
          >
            <ArrowLeftRight className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Bridge</span>
          </TabsTrigger>
        </TabsList>
            </div>
          </div>

          {/* Tab Content */}
          <TabsContent value="withdraw" className="mt-0 md:max-w-2xl md:mx-auto">
            <WithdrawTab walletAddress={walletAddress} />
          </TabsContent>
          
          <TabsContent value="wallet" className="mt-0 md:max-w-2xl md:mx-auto">
            <WalletTab />
          </TabsContent>
          
          <TabsContent value="invoice" className="mt-0 md:max-w-2xl md:mx-auto">
            <InvoiceTab walletAddress={walletAddress} />
          </TabsContent>
          
          <TabsContent value="request" className="mt-0 md:max-w-2xl md:mx-auto">
            <PaymentLinkTab walletAddress={walletAddress} />
          </TabsContent>
          
          <TabsContent value="bridge" className="mt-0 md:max-w-2xl md:mx-auto">
            <BridgeTab walletAddress={walletAddress} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
