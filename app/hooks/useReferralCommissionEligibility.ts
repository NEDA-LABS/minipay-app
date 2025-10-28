import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useSmileIDStatus } from './useSmileIDStatus';

type Options = {
  // The referred user's wallet to check for commission eligibility
  referredWallet?: string;
  // Back-compat alias
  walletAddress?: string;
  // Polling controls
  poll?: boolean;
  pollMs?: number;
};

/**
 * Commission eligibility for referrals = current user KYC verified AND
 * the referred user (wallet) has a first settled off-ramp AND
 * the referred user has completed KYC successfully.
 * Data source matches referral analytics used across the app.
 */
export function useReferralCommissionEligibility(options: Options = {}) {
  const { getAccessToken } = usePrivy();
  const referredWallet = options.referredWallet || options.walletAddress || null;

  // Current user's KYC (Smile ID)
  const { data: kyc, loading: kycLoading, isVerified, refresh: refreshKyc } = useSmileIDStatus({
    poll: options.poll,
    intervalMs: options.pollMs ?? 5000,
  });

  const [hasFirstSettled, setHasFirstSettled] = useState<boolean>(false);
  const [txCount, setTxCount] = useState<number>(0);
  const [txLoading, setTxLoading] = useState<boolean>(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [inviteeKycVerified, setInviteeKycVerified] = useState<boolean>(false);
  const [inviteeKycLoading, setInviteeKycLoading] = useState<boolean>(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch influencer analytics and locate the referred wallet row
  const fetchReferralRow = useCallback(async () => {
    if (!referredWallet) return;
    try {
      setTxLoading(true);
      setInviteeKycLoading(true);
      setTxError(null);

      const token = await getAccessToken();
      
      // Fetch referral analytics data
      const res = await fetch('/api/referral/analytics/influencer', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed ${res.status}`);
      }
      const data = await res.json();
      const rows: any[] = Array.isArray(data?.referredUsers) ? data.referredUsers : [];
      const row = rows.find((r) => (r.wallet || '').toLowerCase() === referredWallet.toLowerCase());

      setTxCount(row?.txCount ?? 0);
      setHasFirstSettled(Boolean(row?.firstSettledTx));

      // Fetch invitee KYC status
      try {
        const kycRes = await fetch('/api/kyc/smile-id/status', {
          method: 'POST',
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ walletAddress: referredWallet }),
        });
        if (kycRes.ok) {
          const kycData = await kycRes.json();
          setInviteeKycVerified(kycData.verified || false);
        } else {
          setInviteeKycVerified(false);
        }
      } catch (kycError) {
        console.warn('Failed to fetch invitee KYC status:', kycError);
        setInviteeKycVerified(false);
      }
    } catch (e: any) {
      setTxError(e?.message || 'Unknown error');
      setTxCount(0);
      setHasFirstSettled(false);
      setInviteeKycVerified(false);
    } finally {
      setTxLoading(false);
      setInviteeKycLoading(false);
    }
  }, [referredWallet, getAccessToken]);

  useEffect(() => {
    if (!referredWallet) return;
    fetchReferralRow();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [referredWallet, fetchReferralRow]);

  useEffect(() => {
    if (!options.poll || !referredWallet) return;
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      fetchReferralRow();
      refreshKyc();
    }, options.pollMs ?? 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [options.poll, options.pollMs, referredWallet, fetchReferralRow, refreshKyc]);

  const eligible = useMemo(() => isVerified && hasFirstSettled && inviteeKycVerified, [isVerified, hasFirstSettled, inviteeKycVerified]);

  const loading = kycLoading || txLoading || inviteeKycLoading;
  const refresh = useCallback(() => {
    refreshKyc();
    fetchReferralRow();
  }, [refreshKyc, fetchReferralRow]);

  return {
    referredWallet,
    eligible,
    loading,
    kycStatus: kyc.status,
    kyc,
    hasFirstSettled,
    txCount,
    txLoading,
    txError,
    inviteeKycVerified,
    inviteeKycLoading,
    reasons: {
      kycVerified: isVerified,
      hasFirstSettled,
      inviteeKycVerified,
    },
    refresh,
  };
}
