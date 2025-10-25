'use client';

import React, { useState } from 'react';
import { formatUnits, parseUnits } from 'viem';
import { Chain } from 'viem/chains';
import { getDexConfig, isSwapSupported } from '@/utils/dex-config';
import { ArrowDownUp, AlertCircle, Settings as SettingsIcon, Info, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useSwap } from '@/utils/swap/hooks';
import { SwapError } from '@/utils/swap/types';
import { getTokenIcon } from '@/utils/tokenIcons';
import TokenSelector from './TokenSelector';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SwapPanelProps {
  activeChain: Chain;
  balances: Array<{ symbol: string; balance: string; decimals: number; address?: string; isNative?: boolean }>;
  isLoading?: boolean;
  onSwapComplete?: (fromToken: string, toToken: string, amount: string) => void;
}

export default function SwapPanel({
  activeChain,
  balances,
  isLoading: externalLoading = false,
  onSwapComplete,
}: SwapPanelProps) {
  const {
    state,
    setState,
    availableTokens,
    getTokenDecimals,
    getTokenAddress,
    executeSwap,
    reverseSwap,
    reset,
  } = useSwap(activeChain);

  const [showSettings, setShowSettings] = useState(false);
  const [slippage, setSlippage] = useState('0.5');
  const [showFromTokens, setShowFromTokens] = useState(false);
  const [showToTokens, setShowToTokens] = useState(false);

  // Get balance for selected token
  const getBalance = (symbol: string): string => {
    if (!symbol) return '0';
    const balance = balances.find((b) => b.symbol === symbol);
    return balance ? balance.balance : '0';
  };

  // Set max amount
  const setMaxAmount = () => {
    if (state.fromToken) {
      const balance = getBalance(state.fromToken);
      setState((prev) => ({ ...prev, amount: balance, quote: null }));
    }
  };

  // Handle swap execution
  const handleSwap = async () => {
    if (!state.quote) return;

    try {
      const result = await executeSwap();
      toast.success(
        `Swapped ${state.amount} ${state.fromToken} → ${state.quote.amountOut} ${state.toToken}`
      );
      onSwapComplete?.(state.fromToken!, state.toToken!, state.amount);
    } catch (error: any) {
      const message = error instanceof SwapError ? error.message : 'Swap failed';
      toast.error(message);
    }
  };

  // Check if swap is supported on current chain
  const swapSupported = isSwapSupported(activeChain.id);
  const dexConfig = getDexConfig(activeChain.id);

  const canSwap =
    swapSupported &&
    state.fromToken &&
    state.toToken &&
    state.amount &&
    state.quote &&
    !state.isSwapping &&
    !state.isLoading &&
    !externalLoading;

  const exchangeRate =
    state.quote && state.amount
      ? (Number(state.quote.amountOut) / Number(state.amount)).toFixed(6)
      : null;

  return (
    <Card className="bg-gradient-to-b from-slate-800/90 to-slate-900/90 border-slate-700/50 rounded-3xl shadow-2xl">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-white">Swap</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="h-8 w-8 p-0 hover:bg-slate-700/50 rounded-lg"
          >
            <SettingsIcon className="h-4 w-4 text-slate-400" />
          </Button>
        </div>

        {/* Chain Warning */}
        {!swapSupported && (
          <Alert className="bg-yellow-900/20 border-yellow-500/50 rounded-xl mb-3">
            <AlertCircle className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-yellow-300 text-sm font-medium">
              Swap is not available on {activeChain.name}. Please switch to a supported network.
            </AlertDescription>
          </Alert>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-slate-700/30 rounded-xl p-3 space-y-2 border border-slate-600/30">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Slippage Tolerance</span>
              <div className="flex gap-2">
                {['0.1', '0.5', '1.0'].map((value) => (
                  <button
                    key={value}
                    onClick={() => setSlippage(value)}
                    className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                      slippage === value
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-600/50 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {value}%
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Pool Type</span>
              <div className="flex gap-2">
                {['volatile', 'stable'].map((type) => (
                  <button
                    key={type}
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        poolType: type as 'stable' | 'volatile',
                        quote: null,
                      }))
                    }
                    className={`px-3 py-1 text-xs rounded-lg capitalize transition-colors ${
                      state.poolType === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-600/50 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* From Token */}
        <div className="bg-slate-700/40 rounded-2xl p-4 border border-slate-600/40 hover:border-slate-500/50 transition-colors">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-medium text-slate-400">You Pay</span>
            <span className="text-xs text-slate-400">
              Balance: {getBalance(state.fromToken || '')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input
                type="number"
                value={state.amount}
                onChange={(e) =>
                  setState((prev) => ({ ...prev, amount: e.target.value, quote: null }))
                }
                placeholder="0.0"
                step="any"
                className="bg-transparent border-0 text-3xl font-semibold text-white placeholder-slate-500 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <div className="flex items-center gap-2">
              {state.fromToken && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={setMaxAmount}
                  className="h-6 px-2 text-xs font-semibold text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg"
                >
                  MAX
                </Button>
              )}
              <button
                onClick={() => setShowFromTokens(true)}
                className="flex items-center gap-2 bg-slate-600/50 hover:bg-slate-600 px-3 py-2 rounded-xl transition-colors"
              >
                {state.fromToken ? (
                  <>
                    <Image
                      src={getTokenIcon(state.fromToken, activeChain.id)}
                      alt={state.fromToken}
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                    <span className="text-white font-medium">{state.fromToken}</span>
                  </>
                ) : (
                  <span className="text-slate-300">Select</span>
                )}
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Reverse Button */}
        <div className="flex justify-center -my-2 relative z-10">
          <Button
            onClick={reverseSwap}
            disabled={!state.fromToken || !state.toToken}
            variant="ghost"
            size="sm"
            className="bg-slate-800 hover:bg-slate-700 border-2 border-slate-600/50 text-white rounded-xl p-2 h-10 w-10 shadow-lg disabled:opacity-50"
          >
            <ArrowDownUp className="h-5 w-5" />
          </Button>
        </div>

        {/* To Token */}
        <div className="bg-slate-700/40 rounded-2xl p-4 border border-slate-600/40 hover:border-slate-500/50 transition-colors">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-medium text-slate-400">You Receive</span>
            <span className="text-xs text-slate-400">
              Balance: {getBalance(state.toToken || '')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              {state.isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-400/30 border-t-blue-400" />
                  <span className="text-slate-400 text-sm">Fetching best price...</span>
                </div>
              ) : state.quote ? (
                <div className="text-3xl font-semibold text-white">
                  {parseFloat(state.quote.amountOut).toFixed(6)}
                </div>
              ) : (
                <div className="text-3xl font-semibold text-slate-500">0.0</div>
              )}
            </div>
            <button
              onClick={() => setShowToTokens(true)}
              className="flex items-center gap-2 bg-slate-600/50 hover:bg-slate-600 px-3 py-2 rounded-xl transition-colors"
            >
              {state.toToken ? (
                <>
                  <Image
                    src={getTokenIcon(state.toToken, activeChain.id)}
                    alt={state.toToken}
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                  <span className="text-white font-medium">{state.toToken}</span>
                </>
              ) : (
                <span className="text-slate-300">Select</span>
              )}
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Quote Details */}
        {state.quote && state.fromToken && state.toToken && (
          <div className="bg-slate-700/20 rounded-xl p-3 space-y-2 border border-slate-600/20">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Rate
              </span>
              <span className="text-white font-medium">
                1 {state.fromToken} = {exchangeRate} {state.toToken}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Price Impact</span>
              <span
                className={`font-semibold ${
                  state.quote.priceImpact > 5
                    ? 'text-red-400'
                    : state.quote.priceImpact > 1
                    ? 'text-yellow-400'
                    : 'text-green-400'
                }`}
              >
                {state.quote.priceImpact < 0.01 ? '<0.01' : state.quote.priceImpact.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Min. Received</span>
              <span className="text-white font-medium">
                {parseFloat(state.quote.minAmountOut).toFixed(6)} {state.toToken}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Slippage</span>
              <span className="text-white font-medium">{slippage}%</span>
            </div>
          </div>
        )}


        {/* Error Alert */}
        {state.error && !state.error.includes('not supported') && (
          <Alert className="bg-red-900/20 border-red-500/50 rounded-xl">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300 text-sm font-medium">
              {state.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Swap Button */}
        <Button
          onClick={handleSwap}
          disabled={!canSwap}
          className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold text-lg border-0 shadow-xl rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:from-slate-600 disabled:to-slate-600 transition-all"
        >
          {!swapSupported ? (
            'Swap Not Available'
          ) : state.isSwapping ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-3 border-white/30 border-t-white mr-2" />
              Swapping...
            </>
          ) : !state.fromToken || !state.toToken ? (
            'Select Tokens'
          ) : !state.amount || state.amount === '0' ? (
            'Enter Amount'
          ) : state.isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-3 border-white/30 border-t-white mr-2" />
              Fetching Quote...
            </>
          ) : (
            'Swap'
          )}
        </Button>

        {/* Info */}
        <div className="text-center">
          <p className="text-xs text-slate-400">
            {dexConfig ? `Powered by ${dexConfig.name}` : 'Select a supported network'} • {activeChain.name}
          </p>
        </div>
      </CardContent>

      {/* Token Selectors */}
      <TokenSelector
        open={showFromTokens}
        onClose={() => setShowFromTokens(false)}
        tokens={balances}
        onSelect={(symbol) => setState((prev) => ({ ...prev, fromToken: symbol, quote: null }))}
        activeChain={activeChain}
        selectedToken={state.fromToken || undefined}
      />

      <TokenSelector
        open={showToTokens}
        onClose={() => setShowToTokens(false)}
        tokens={balances.filter((b) => b.symbol !== state.fromToken)}
        onSelect={(symbol) => setState((prev) => ({ ...prev, toToken: symbol, quote: null }))}
        activeChain={activeChain}
        selectedToken={state.toToken || undefined}
      />
    </Card>
  );
}
