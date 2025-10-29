/**
 * Auto-connect hook for Minipay
 * Automatically connects wallet when app loads in Minipay
 */

import { useEffect, useRef } from 'react';
import { useConnect, useAccount } from 'wagmi';
import { isMiniPay } from '@/utils/minipay-detection';

export function useAutoConnect() {
  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();
  const hasAttempted = useRef(false);

  useEffect(() => {
    // Only try once
    if (hasAttempted.current) return;

    // Only in Minipay
    if (!isMiniPay()) return;

    // Already connected
    if (isConnected) return;

    hasAttempted.current = true;

    // Find injected connector (Minipay provider)
    const injectedConnector =
      connectors.find((c) => c.id === 'injected') || connectors[0];

    if (injectedConnector) {
      console.log('[Minipay] Auto-connecting wallet...');
      connect({ connector: injectedConnector });
    } else {
      console.warn('[Minipay] No injected connector found');
    }
  }, [connect, connectors, isConnected]);

  return {
    isInMiniPay: isMiniPay(),
    isConnected,
    autoConnectAttempted: hasAttempted.current,
  };
}
