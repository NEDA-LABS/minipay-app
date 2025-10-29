"use client";

/**
 * WalletSelector - Wrapper component for Minipay compatibility
 * 
 * For Minipay migration: This component now simply wraps MinipayWalletSelector
 * which uses Wagmi instead of Privy for wallet connection.
 * 
 * The original Privy-based implementation has been replaced to avoid
 * dependency issues in the Minipay environment.
 */

import { MinipayWalletSelector } from "./minipay/MinipayWalletSelector";
import { forwardRef, ForwardedRef } from "react";

interface WalletSelectorProps {
  className?: string;
  ref?: ForwardedRef<any>;
}

/**
 * Simple wrapper that forwards to MinipayWalletSelector
 * Maintains backward compatibility with existing code
 */
const WalletSelector = forwardRef<any, WalletSelectorProps>(
  function WalletSelector(props, ref) {
    // Simply render the Minipay version
    // The ref is accepted but not used (for backward compatibility)
    return <MinipayWalletSelector {...props} />;
  }
);

WalletSelector.displayName = "WalletSelector";

export default WalletSelector;

// Export BasenameDisplay for backward compatibility (even though not used)
export { MinipayWalletSelector as BasenameDisplay };
