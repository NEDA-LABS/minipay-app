'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { withDashboardLayout } from '@/utils/withDashboardLayout';
import { useReferralCommissionEligibility } from '@/hooks/useReferralCommissionEligibility';
import { 
  Users, 
  Copy, 
  Check, 
  Gift, 
  TrendingUp,
  DollarSign,
  Share2,
  Sparkles,
  ExternalLink,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ReferralStats {
  code: string;
  inviteLink: string;
  invitees: {
    id: string;
    email?: string;
    wallet?: string;
    volumeUsd: number;
    createdAt: string;
  }[];
}

interface InviteeEligibility {
  wallet: string;
  eligible: boolean;
  loading: boolean;
}

function InviteeEligibilityChecker({ wallet, onEligibilityChange }: { 
  wallet: string; 
  onEligibilityChange: (wallet: string, eligible: boolean, loading: boolean) => void;
}) {
  const { eligible, loading } = useReferralCommissionEligibility({ 
    referredWallet: wallet,
    poll: false // Don't poll for individual invitees
  });

  useEffect(() => {
    onEligibilityChange(wallet, eligible, loading);
  }, [wallet, eligible, loading, onEligibilityChange]);

  return null; // This component doesn't render anything, just tracks eligibility
}

function ReferralsPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inviteeEligibility, setInviteeEligibility] = useState<Record<string, boolean>>({});
  const [eligibilityLoading, setEligibilityLoading] = useState<Record<string, boolean>>({});

  const handleEligibilityChange = useCallback((wallet: string, eligible: boolean, loading: boolean) => {
    setInviteeEligibility(prev => ({ ...prev, [wallet]: eligible }));
    setEligibilityLoading(prev => ({ ...prev, [wallet]: loading }));
  }, []);

  const copyLink = () => {
    if (!stats) return;
    navigator.clipboard.writeText(stats.inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate earnings only from eligible invitees (those with KYC and first settled transaction)
  const totalEarnings = stats?.invitees?.reduce((sum, inv) => {
    if (!inv.wallet) return sum;
    const isEligible = inviteeEligibility[inv.wallet];
    return isEligible ? sum + (inv.volumeUsd * 0.1) : sum;
  }, 0) || 0;

  // Count eligible invitees
  const eligibleInviteesCount = stats?.invitees?.filter(inv => 
    inv.wallet && inviteeEligibility[inv.wallet]
  ).length || 0;

  useEffect(() => {
    if (!isConnected) {
      router.replace('/dashboard');
      return;
    }
  }, [isConnected, router]);

  useEffect(() => {
    if (!address) return;
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/referral/code');
        if (res.ok) {
          setStats(await res.json());
        }
      } catch (error) {
        console.error('Error fetching referral stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [address]);

  const generateCode = async () => {
    try {
      const res = await fetch('/api/referral/code', { method: 'POST' });
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (error) {
      console.error('Error generating code:', error);
    }
  };

  return (
    <div className="min-h-screen w-full">
      <Header />
      <div className="container mx-auto max-w-6xl px-3 sm:px-4 py-4 sm:py-6">
        {/* Compact Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <Gift className="w-4 h-4 text-purple-400" />
              </div>
              <h1 className="text-lg sm:text-xl font-semibold text-white">
                Referral Program
              </h1>
            </div>
            <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-300">
              10% Commission
            </Badge>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm">
            Earn from verified referrals • KYC required
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : !stats ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 sm:p-8 text-center">
           
            <h3 className="text-lg font-semibold text-white mb-2">
              Start Earning Today
            </h3>
            <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
              Generate your referral code and earn commissions
            </p>
            <Button
              onClick={generateCode}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-6 py-2 text-sm"
            >
              
              Generate Code
            </Button>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {/* Compact Stats Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {/* Total Referrals */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                  <span className="text-[10px] sm:text-xs text-slate-400 font-medium">Referrals</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-white">
                  {stats.invitees?.length || 0}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">Total invited</p>
              </div>

              {/* Total Earnings */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                  <span className="text-[10px] sm:text-xs text-slate-400 font-medium">Earnings</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-emerald-400">
                  ${totalEarnings.toFixed(2)}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">Eligible only</p>
              </div>

              {/* Eligible Count */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-1">
                  <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                  <span className="text-[10px] sm:text-xs text-slate-400 font-medium">Eligible</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-purple-400">
                  {eligibleInviteesCount}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">KYC + TX</p>
              </div>
            </div>

            {/* Referral Link - Compact */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-white">Referral Link</span>
                </div>
                <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-300 px-2 py-0">
                  {stats.code}
                </Badge>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 overflow-hidden">
                  <p className="text-xs text-slate-300 font-mono truncate">
                    {stats.inviteLink}
                  </p>
                </div>
                <Button
                  onClick={copyLink}
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-3"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 sm:mr-1" />
                      <span className="hidden sm:inline text-xs">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 sm:mr-1" />
                      <span className="hidden sm:inline text-xs">Copy</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Eligibility Checkers (Hidden components that track KYC status) */}
            {stats?.invitees?.filter(inv => inv.wallet).map(invitee => (
              <InviteeEligibilityChecker
                key={invitee.wallet}
                wallet={invitee.wallet!}
                onEligibilityChange={handleEligibilityChange}
              />
            ))}

            {/* How it Works - Compact Horizontal */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-white">How It Works</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Step 1 */}
                <div className="flex items-start gap-3 p-3 bg-slate-800/40 border border-slate-700/40 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-400">1</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white mb-1">Share Link</h4>
                    <p className="text-xs text-slate-400 leading-snug">
                      Send your link to friends via social media
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 p-3 bg-slate-800/40 border border-slate-700/40 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-purple-400">2</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white mb-1">KYC Complete</h4>
                    <p className="text-xs text-slate-400 leading-snug">
                      Friends register and complete KYC verification
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3 p-3 bg-slate-800/40 border border-slate-700/40 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-emerald-400">3</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white mb-1">Earn 10%</h4>
                    <p className="text-xs text-slate-400 leading-snug">
                      Get commission from their first transaction
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Requirements - Compact Info Banner */}
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3 sm:p-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <AlertCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white mb-2">Eligibility Requirements</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-slate-300 font-medium mb-1.5">You (Referrer):</p>
                      <ul className="space-y-1 text-slate-400">
                        <li className="flex items-center gap-1.5">
                          <span className="text-green-400">✓</span>
                          <span>KYC verified</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <span className="text-green-400">✓</span>
                          <span>Valid referral code</span>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-slate-300 font-medium mb-1.5">Friends (Referrals):</p>
                      <ul className="space-y-1 text-slate-400">
                        <li className="flex items-center gap-1.5">
                          <span className="text-green-400">✓</span>
                          <span>KYC verified</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <span className="text-green-400">✓</span>
                          <span>First off-ramp completed</span>
                        </li>
                      </ul>
                    </div>
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

export default withDashboardLayout(ReferralsPage);
