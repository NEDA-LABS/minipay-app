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
import WithdrawTab from "@/components/WithdrawTab";
import WalletTab from "@/components/WalletTab";

interface DashboardTabsProps {
  walletAddress?: string;
}

export default function DashboardTabs({ walletAddress }: DashboardTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("withdraw");

  const handleTabChange = (value: string) => {
    // For navigation tabs, push to their pages
    switch (value) {
      case "invoice":
        router.push("/invoice");
        break;
      case "request":
        router.push("/payment-link");
        break;
      case "bridge":
        router.push("/accross-bridge");
        break;
      default:
        // For withdraw and wallet tabs, just change the active tab
        setActiveTab(value);
    }
  };

  return (
    <>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        {/* Tab Navigation */}
        <div className="flex justify-center mb-6">
          <TabsList className="inline-flex items-center bg-slate-900/90 backdrop-blur-sm rounded-full p-1.5 border border-slate-700/50 shadow-lg">
          <TabsTrigger 
            value="withdraw" 
            className="flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-200 text-sm font-medium text-slate-300 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]!:text-white data-[state=active]:shadow-lg"
          >
            <DollarSign className="w-4 h-4" />
            <span>Withdraw</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="wallet" 
            className="flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-200 text-sm font-medium text-slate-300 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]!:text-white data-[state=active]:shadow-lg"
          >
            <Wallet className="w-4 h-4" />
            <span>Wallet</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="invoice" 
            className="flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-200 text-sm font-medium text-slate-300 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            <FileText className="w-4 h-4" />
            <span>Invoice</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="request" 
            className="flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-200 text-sm font-medium text-slate-300 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            <LinkIcon className="w-4 h-4" />
            <span>Request</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="bridge" 
            className="flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-200 text-sm font-medium text-slate-300 hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Bridge</span>
          </TabsTrigger>
        </TabsList>
        </div>

        {/* Tab Content */}
        <TabsContent value="withdraw" className="mt-0">
          <WithdrawTab walletAddress={walletAddress} />
        </TabsContent>
        
        <TabsContent value="wallet" className="mt-0">
          <WalletTab />
        </TabsContent>
      </Tabs>
    </>
  );
}
