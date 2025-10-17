'use client';

import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { withDashboardLayout } from '@/utils/withDashboardLayout';
import { 
  Users, 
  Copy, 
  Check, 
  Gift, 
  TrendingUp,
  DollarSign,
  Share2,
  Sparkles,
  ExternalLink
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

function ReferralsPage() {
  const { user, getAccessToken, authenticated } = usePrivy();
  const router = useRouter();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authenticated) {
      router.replace('/dashboard');
      return;
    }
  }, [authenticated, router]);

  useEffect(() => {
    if (!user) return;
    
    const fetchStats = async () => {
      setLoading(true);
      try {
        const tk = await getAccessToken();
        const res = await fetch('/api/referral/code', {
          headers: { Authorization: `Bearer ${tk}` },
        });
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
  }, [user, getAccessToken]);

  const generateCode = async () => {
    try {
      const tk = await getAccessToken();
      const res = await fetch('/api/referral/code', { 
        method: 'POST', 
        headers: { Authorization: `Bearer ${tk}` } 
      });
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (error) {
      console.error('Error generating code:', error);
    }
  };

  const copyLink = () => {
    if (!stats) return;
    navigator.clipboard.writeText(stats.inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalEarnings = stats?.invitees?.reduce((sum, inv) => sum + (inv.volumeUsd * 0.1), 0) || 0;

  return (
    <div className="min-h-screen w-full">
      <Header />
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
              <Gift className="w-6 h-6 text-purple-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 bg-clip-text text-transparent">
              Referral Program
            </h1>
          </div>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl">
            Invite friends and earn 10% commission from their first off-ramp transaction
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : !stats ? (
          <Card className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-800/95 backdrop-blur-xl border border-slate-700/60 shadow-2xl">
            <CardContent className="p-12 text-center">
              <div className="inline-flex p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl mb-6">
                <Sparkles className="w-12 h-12 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Start Earning Today
              </h3>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                Generate your unique referral code and start earning commissions from every successful referral
              </p>
              <Button
                onClick={generateCode}
                className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 hover:from-purple-700 hover:via-purple-600 hover:to-pink-700 text-white font-semibold px-8 py-6 text-base shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/40 transition-all duration-300"
              >
                <Gift className="w-5 h-5 mr-2" />
                Generate Referral Code
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Combined Stats Card */}
            <Card className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-800/95 backdrop-blur-xl border border-purple-500/20 shadow-2xl overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-700/50">
                  {/* Total Referrals */}
                  <div className="p-6 sm:p-8 group hover:bg-slate-800/30 transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <p className="text-slate-400 text-xs sm:text-sm font-medium uppercase tracking-wider mb-2">Total Referrals</p>
                        <p className="text-4xl sm:text-5xl font-bold bg-gradient-to-br from-blue-400 to-blue-600 bg-clip-text text-transparent">
                          {stats.invitees?.length || 0}
                        </p>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl border border-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                        <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">People you've invited</p>
                  </div>

                  {/* Total Earnings */}
                  <div className="p-6 sm:p-8 group hover:bg-slate-800/30 transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <p className="text-slate-400 text-xs sm:text-sm font-medium uppercase tracking-wider mb-2">Total Earnings</p>
                        <p className="text-4xl sm:text-5xl font-bold bg-gradient-to-br from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                          ${totalEarnings.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl border border-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                        <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">Commission earned</p>
                  </div>

                  {/* Commission Rate */}
                  <div className="p-6 sm:p-8 group hover:bg-slate-800/30 transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <p className="text-slate-400 text-xs sm:text-sm font-medium uppercase tracking-wider mb-2">Commission Rate</p>
                        <p className="text-4xl sm:text-5xl font-bold bg-gradient-to-br from-purple-400 to-pink-600 bg-clip-text text-transparent">
                          10%
                        </p>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-600/10 rounded-xl border border-purple-500/20 group-hover:scale-110 transition-transform duration-300">
                        <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">Per transaction</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Referral Link Card */}
            <Card className="bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-800/95 backdrop-blur-xl border border-purple-500/30 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Share2 className="w-5 h-5 text-purple-400" />
                  Your Referral Link
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Share this link with friends to start earning commissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3">
                    <p className="text-sm text-slate-300 font-mono break-all">
                      {stats.inviteLink}
                    </p>
                  </div>
                  <Button
                    onClick={copyLink}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40">
                    Code: {stats.code}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* How it Works */}
            <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-slate-700/60 shadow-xl overflow-hidden">
              <CardHeader className="border-b border-slate-700/50 bg-slate-800/30">
                <CardTitle className="text-white text-lg sm:text-xl flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  How It Works
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Three simple steps to start earning
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Step 1 */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative text-center p-6">
                      <div className="inline-flex p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-2xl mb-4 border border-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                        <Share2 className="w-7 h-7 text-blue-400" />
                      </div>
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold text-sm mb-3">
                        1
                      </div>
                      <h4 className="font-bold text-white mb-3 text-base sm:text-lg">Share Your Link</h4>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        Send your unique referral link to friends and family via social media or messaging
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative text-center p-6">
                      <div className="inline-flex p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-2xl mb-4 border border-purple-500/20 group-hover:scale-110 transition-transform duration-300">
                        <Users className="w-7 h-7 text-purple-400" />
                      </div>
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 font-bold text-sm mb-3">
                        2
                      </div>
                      <h4 className="font-bold text-white mb-3 text-base sm:text-lg">They Sign Up</h4>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        Your friends register using your link and complete their first off-ramp transaction
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative text-center p-6">
                      <div className="inline-flex p-4 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-2xl mb-4 border border-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                        <DollarSign className="w-7 h-7 text-emerald-400" />
                      </div>
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-sm mb-3">
                        3
                      </div>
                      <h4 className="font-bold text-white mb-3 text-base sm:text-lg">Earn Commission</h4>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        Receive 10% commission instantly from their first successful off-ramp transaction
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default withDashboardLayout(ReferralsPage);
