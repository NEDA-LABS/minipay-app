"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useDisconnect } from "wagmi";
import { Name } from "@coinbase/onchainkit/identity";
import { getBasename } from "@/utils/getBaseName";
import { useUserSync } from "@/hooks/useUserSync";
import { isMiniPay } from "@/utils/minipay-detection";
import { Wallet, LogOut, User, HelpCircle, History, BarChart3, Gift, Users, Shield, Smartphone } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { formatUnits } from "viem";

interface MinipayWalletSelectorProps {
  className?: string;
}

export function MinipayWalletSelector({ className }: MinipayWalletSelectorProps) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [username, setUsername] = useState<string | null>(null);
  const [isMinipay, setIsMinipay] = useState(false);

  // Sync user data when connected
  useUserSync();

  // Detect Minipay environment
  useEffect(() => {
    setIsMinipay(isMiniPay());
  }, []);

  // Fetch username from settings
  useEffect(() => {
    if (!isConnected || !address) return;
    
    const fetchUsername = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setUsername(data.settings?.businessName || null);
        }
      } catch (error) {
        console.error('Error fetching username:', error);
      }
    };
    
    fetchUsername();
  }, [isConnected, address]);

  const handleDisconnect = async () => {
    try {
      await disconnect();
      router.push('/');
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  if (!isConnected) {
    // Show connect button for non-Minipay browsers
    if (!isMinipay) {
      return (
        <Button onClick={() => router.push('/')} className={className}>
          Connect Wallet
        </Button>
      );
    }
    
    // In Minipay, show loading state while auto-connecting
    return (
      <div className={`flex items-center gap-2 px-4 py-2 ${className}`}>
        <Smartphone className="w-4 h-4 animate-pulse" />
        <span className="text-sm">Connecting...</span>
      </div>
    );
  }

  // Connected state
  const displayName = username || `${address?.slice(0, 6)}...${address?.slice(-4)}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={`flex items-center gap-2 ${className}`}>
          <Wallet className="w-4 h-4" />
          <span className="hidden sm:inline">{displayName}</span>
          <span className="sm:hidden">{displayName.slice(0, 8)}...</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          {isMinipay && <Smartphone className="w-4 h-4 text-green-600" />}
          <div>
            <p className="font-medium">{displayName}</p>
            <p className="text-xs text-muted-foreground">
              {isMinipay ? 'Minipay Wallet' : 'Connected Wallet'}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => handleNavigate('/dashboard')}>
          <BarChart3 className="w-4 h-4 mr-2" />
          Dashboard
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleNavigate('/transactions')}>
          <History className="w-4 h-4 mr-2" />
          Transactions
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleNavigate('/analytics')}>
          <BarChart3 className="w-4 h-4 mr-2" />
          Analytics
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleNavigate('/referrals')}>
          <Users className="w-4 h-4 mr-2" />
          Referrals
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleNavigate('/rewards')}>
          <Gift className="w-4 h-4 mr-2" />
          Rewards
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleNavigate('/settings')}>
          <User className="w-4 h-4 mr-2" />
          Settings
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleNavigate('/support')}>
          <HelpCircle className="w-4 h-4 mr-2" />
          Support
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {!isMinipay && (
          <DropdownMenuItem onClick={handleDisconnect}>
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default MinipayWalletSelector;
