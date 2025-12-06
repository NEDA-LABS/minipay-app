import React from 'react';
import { Loader2, AlertTriangle, Info } from 'lucide-react';
import { ChainConfig } from './offrampHooks/constants';

interface FeeInfoPanelProps {
  chain: ChainConfig;
  token: string;
  gasAbstractionActive: boolean;
  gasAbstractionInitializing: boolean;
  isCoinbaseWallet: boolean;
  gasAbstractionFailed: boolean;
  feeCurrency: string;
  estimatedFee: number;
  balance: string;
  balanceLoading: boolean;
  fiat: string;
  usdcToFiatRate?: number;
}

const FeeInfoPanel: React.FC<FeeInfoPanelProps> = ({
  chain,
  token,
  gasAbstractionActive,
  gasAbstractionInitializing,
  isCoinbaseWallet,
  gasAbstractionFailed,
  feeCurrency,
  estimatedFee,
  balance,
  balanceLoading,
  fiat,
  usdcToFiatRate
}) => {
  if (gasAbstractionInitializing && !isCoinbaseWallet) {
    return (
      <div className="p-3 bg-blue-900/30 rounded-lg border border-blue-700/50 mb-4">
        <div className="flex items-start gap-2">
          <Loader2 className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0 animate-spin" />
          <div>
            <p className="text-blue-200 font-medium text-xs">
              Initializing Gas Abstraction
            </p>
            <p className="text-blue-300 text-xs mt-1">
              Setting up fee sponsorship. This may take a moment...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isCoinbaseWallet) {
    return (
      <div className="space-y-3 mb-4">
        <div className="p-3 bg-blue-900/30 rounded-lg border border-blue-700/50">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-blue-200 font-medium text-xs">
                Coinbase Wallet Detected
              </p>
              <p className="text-blue-300 text-xs mt-1">
                {token} transfers in Coinbase Wallet have no gas fees on {chain.name}.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 text-xs">
                Available Balance:
              </span>
              {balanceLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
              ) : (
                <span className="font-medium text-xs text-white">
                  {parseFloat(balance).toLocaleString(undefined, {
                    maximumFractionDigits: 6,
                  })}{" "}
                  {token}
                </span>
              )}
            </div>
            {usdcToFiatRate && (
              <div className="text-xs text-slate-400 mt-1">
                ≈{" "}
                {(parseFloat(balance) * usdcToFiatRate).toLocaleString(
                  undefined,
                  { maximumFractionDigits: 2 }
                )}{" "}
                {fiat}
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 text-xs">Network Fee:</span>
              <span className="font-medium text-xs text-green-400">Free</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              No gas fees for {token} transfers
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gasAbstractionActive) {
    return (
      <div className="space-y-3 mb-4">
        <div className="p-3 bg-green-900/30 rounded-lg border border-green-700/50">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-green-200 font-medium text-xs">
                Gas Abstraction Active
              </p>
              <p className="text-green-300 text-xs mt-1">
                Transaction fees will be paid in {token} instead of {chain.nativeCurrency.symbol}.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 text-xs">
                Available Balance:
              </span>
              {balanceLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
              ) : (
                <span className="font-medium text-xs text-white">
                  {parseFloat(balance).toLocaleString(undefined, {
                    maximumFractionDigits: 6,
                  })}{" "}
                  {token}
                </span>
              )}
            </div>
            {usdcToFiatRate && (
              <div className="text-xs text-slate-400 mt-1">
                ≈{" "}
                {(parseFloat(balance) * usdcToFiatRate).toLocaleString(
                  undefined,
                  { maximumFractionDigits: 2 }
                )}{" "}
                {fiat}
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 text-xs">Estimated Fee:</span>
              <span className="font-medium text-xs text-white">
                {estimatedFee} {feeCurrency}
              </span>
            </div>
            {usdcToFiatRate && feeCurrency === token && (
              <div className="text-xs text-slate-400 mt-1">
                ≈{" "}
                {(estimatedFee * usdcToFiatRate).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}{" "}
                {fiat}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 mb-4">
      <div className="p-3 bg-amber-900/30 rounded-lg border border-amber-700/50">
        <div className="flex items-start gap-2">
          {/* <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" /> */}
          <div>
            {/* <p className="text-amber-800 font-medium text-xs">
              Gas Fees Required
            </p> */}
            <p className="text-amber-300 text-xs mt-1">
              You will pay fees in {chain.nativeCurrency.symbol} for {chain.name} network fees.
              {gasAbstractionFailed && " (Gas abstraction unavailable)"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60">
          <div className="flex justify-between items-center">
            <span className="text-slate-300 text-xs">
              Available Balance:
            </span>
            {balanceLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
            ) : (
              <span className="font-medium text-xs text-white">
                {parseFloat(balance).toLocaleString(undefined, {
                  maximumFractionDigits: 6,
                })}{" "}
                {token}
              </span>
            )}
          </div>
          {usdcToFiatRate && (
            <div className="text-xs text-slate-400 mt-1">
              ≈{" "}
              {(parseFloat(balance) * usdcToFiatRate).toLocaleString(
                undefined,
                { maximumFractionDigits: 2 }
              )}{" "}
              {fiat}
            </div>
          )}
        </div>

        <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60">
          <div className="flex justify-between items-center">
            <span className="text-slate-300 text-xs">Estimated Fee:</span>
            <span className="font-medium text-xs text-white">
              {estimatedFee} {feeCurrency}
            </span>
          </div>
          {usdcToFiatRate && feeCurrency === chain.nativeCurrency.symbol && (
            <div className="text-xs text-slate-400 mt-1">
              ≈{" "}
              {(estimatedFee * (usdcToFiatRate * 2000)).toLocaleString(
                undefined,
                { maximumFractionDigits: 2 }
              )}{" "}
              {fiat}*
            </div>
          )}
        </div>
      </div>

      {feeCurrency === chain.nativeCurrency.symbol && (
        <p className="text-xs text-slate-500">
          *{chain.nativeCurrency.symbol} fee estimate based on current market rates. Actual fee may vary.
        </p>
      )}
    </div>
  );
};

export default FeeInfoPanel;