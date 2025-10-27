import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';

export type SmileIDClientStatus =
  | 'not_started'
  | 'pending'
  | 'success'
  | 'failed'
  | 'expired'
  | 'unauthenticated'
  | 'error';

export interface SmileIDStatusData {
  status: SmileIDClientStatus;
  verificationUrl?: string;
  resultCode?: string;
  resultText?: string;
  completedAt?: string;
}

interface Options {
  poll?: boolean;
  intervalMs?: number; // default 5000
}

export function useSmileIDStatus(options: Options = {}) {
  const { getAccessToken, authenticated } = usePrivy();
  const [data, setData] = useState<SmileIDStatusData>({ status: 'not_started' });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const mapStatus = (apiStatus?: string | null): SmileIDClientStatus => {
    switch ((apiStatus || '').toUpperCase()) {
      case 'PENDING':
        return 'pending';
      case 'SUCCESS':
        return 'success';
      case 'FAILED':
        return 'failed';
      case 'EXPIRED':
        return 'expired';
      default:
        return 'not_started';
    }
  };

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getAccessToken();
      if (!token) {
        setData({ status: 'unauthenticated' });
        setLoading(false);
        return;
      }

      const res = await fetch('/api/kyc/smile-id/status', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 404) {
        // No verification record yet
        setData({ status: 'not_started' });
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Status request failed: ${res.status}`);
      }

      const json = await res.json();
      const payload = json?.data || {};
      setData({
        status: mapStatus(payload.status),
        verificationUrl: payload.verificationUrl,
        resultCode: payload.resultCode,
        resultText: payload.resultText,
        completedAt: payload.completedAt,
      });
    } catch (e: any) {
      console.error('useSmileIDStatus error:', e);
      setError(e?.message || 'Unknown error');
      setData((prev) => ({ ...prev, status: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  // initial fetch and polling
  useEffect(() => {
    fetchStatus();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchStatus]);

  useEffect(() => {
    if (!options.poll) return;
    if (!authenticated) return;

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(fetchStatus, options.intervalMs ?? 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [options.poll, options.intervalMs, authenticated, fetchStatus]);

  const flags = useMemo(
    () => ({
      isVerified: data.status === 'success',
      isStarted: data.status === 'pending',
      isNotVerified:
        data.status === 'not_started' || data.status === 'failed' || data.status === 'expired',
      isPending: data.status === 'pending',
      isFailed: data.status === 'failed',
      isExpired: data.status === 'expired',
      isErrored: data.status === 'error',
      isUnauthenticated: data.status === 'unauthenticated',
    }),
    [data.status]
  );

  const refresh = useCallback(() => fetchStatus(), [fetchStatus]);

  return { data, loading, error, refresh, ...flags };
}
