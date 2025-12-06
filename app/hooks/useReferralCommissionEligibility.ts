import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWallet } from '@/hooks/useWallet';

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
 * Commission eligibility for referrals = the referred user (wallet) has a first settled off-ramp.
 * KYC is not required for MiniPay miniapp.
 * Data source matches referral analytics used across the app.
 */
export function useReferralCommissionEligibility(options: Options = {}) {
  const { getAccessToken } = useWallet();
  const referredWallet = options.referredWallet || options.walletAddress || null;

  const [hasFirstSettled, setHasFirstSettled] = useState<boolean>(false);
  const [txCount, setTxCount] = useState<number>(0);
  const [txLoading, setTxLoading] = useState<boolean>(false);
  const [txError, setTxError] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch influencer analytics and locate the referred wallet row
  const fetchReferralRow = useCallback(async () => {
    if (!referredWallet) return;
    try {
      setTxLoading(true);
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
    } catch (e: any) {
      setTxError(e?.message || 'Unknown error');
      setTxCount(0);
      setHasFirstSettled(false);
    } finally {
      setTxLoading(false);
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
    }, options.pollMs ?? 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [options.poll, options.pollMs, referredWallet, fetchReferralRow]);

  // Eligibility is now based only on having a first settled transaction (no KYC required)
  const eligible = useMemo(() => hasFirstSettled, [hasFirstSettled]);

  const loading = txLoading;
  const refresh = useCallback(() => {
    fetchReferralRow();
  }, [fetchReferralRow]);

  return {
    referredWallet,
    eligible,
    loading,
    hasFirstSettled,
    txCount,
    txLoading,
    txError,
    reasons: {
      hasFirstSettled,
    },
    refresh,
  };
}
