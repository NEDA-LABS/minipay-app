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
 * the referred user (wallet) has a first settled off-ramp.
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
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch influencer analytics and locate the referred wallet row
  const fetchReferralRow = useCallback(async () => {
    if (!referredWallet) return;
    try {
      setTxLoading(true);
      setTxError(null);

      const token = await getAccessToken();
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
      refreshKyc();
    }, options.pollMs ?? 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [options.poll, options.pollMs, referredWallet, fetchReferralRow, refreshKyc]);

  const eligible = useMemo(() => isVerified && hasFirstSettled, [isVerified, hasFirstSettled]);

  const loading = kycLoading || txLoading;
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
    reasons: {
      kycVerified: isVerified,
      hasFirstSettled,
    },
    refresh,
  };
}
