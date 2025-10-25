import { Chain } from 'viem/chains';

export interface SwapQuote {
  amountIn: string;
  amountOut: string;
  exchangeRate: number;
  priceImpact: number;
  minAmountOut: string;
}

export interface SwapParams {
  fromToken: `0x${string}`;
  toToken: `0x${string}`;
  amount: string;
  userAddress: `0x${string}`;
  slippageTolerance?: number;
}

export interface SwapResult {
  hash: string;
  fromAmount: string;
  toAmount: string;
  fromToken: string;
  toToken: string;
}

export interface SwapState {
  fromToken: string | null;
  toToken: string | null;
  amount: string;
  quote: SwapQuote | null;
  isLoading: boolean;
  isSwapping: boolean;
  error: string | null;
  poolType: 'stable' | 'volatile';
}

export class SwapError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'SwapError';
  }
}
