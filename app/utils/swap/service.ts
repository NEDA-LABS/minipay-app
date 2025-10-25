import { formatUnits, parseUnits } from 'viem';
import { ethers } from 'ethers';
import { getUniversalQuote, executeUniversalSwap, getRouterAddress } from '@/utils/universal-swap';
import { getDexConfig } from '@/utils/dex-config';
import { checkAllowance, approveToken } from '@/utils/erc20';
import { SwapQuote, SwapParams, SwapResult, SwapError } from './types';

const SLIPPAGE_TOLERANCE = 0.995; // 0.5% slippage

export class SwapService {
  /**
   * Fetch a quote for a token swap
   */
  static async getQuote(
    provider: ethers.providers.Provider,
    params: SwapParams,
    decimals: { from: number; to: number },
    poolType: 'stable' | 'volatile' = 'volatile',
    chainId: number
  ): Promise<SwapQuote> {
    try {
      if (!params.amount || params.fromToken === params.toToken) {
        throw new SwapError('Invalid swap parameters', 'INVALID_PARAMS');
      }

      const dexConfig = getDexConfig(chainId);
      if (!dexConfig) {
        throw new SwapError(`Swap not supported on this chain`, 'UNSUPPORTED_CHAIN');
      }

      const truncated = this.truncateToDecimals(params.amount, decimals.from);
      const parsed = parseUnits(truncated, decimals.from);

      if (parsed === 0n) {
        throw new SwapError('Amount must be greater than 0', 'ZERO_AMOUNT');
      }

      const amounts = await getUniversalQuote({
        provider,
        chainId,
        amountIn: parsed.toString(),
        fromToken: params.fromToken,
        toToken: params.toToken,
        stable: poolType === 'stable',
      });

      const amountOut = formatUnits(amounts[amounts.length - 1], decimals.to);
      const exchangeRate = Number(amountOut) / Number(params.amount);
      const priceImpact = this.calculatePriceImpact(exchangeRate);
      const minAmountOut = (Number(amountOut) * SLIPPAGE_TOLERANCE).toString();

      return {
        amountIn: params.amount,
        amountOut,
        exchangeRate,
        priceImpact,
        minAmountOut,
      };
    } catch (error: any) {
      if (error instanceof SwapError) throw error;
      throw new SwapError(
        error.message || 'Failed to fetch quote',
        'QUOTE_ERROR'
      );
    }
  }

  /**
   * Execute a token swap
   */
  static async executeSwap(
    signer: ethers.Signer,
    params: SwapParams,
    quote: SwapQuote,
    decimals: { from: number; to: number },
    poolType: 'stable' | 'volatile' = 'volatile',
    chainId: number
  ): Promise<SwapResult> {
    try {
      const dexConfig = getDexConfig(chainId);
      if (!dexConfig) {
        throw new SwapError(`Swap not supported on this chain`, 'UNSUPPORTED_CHAIN');
      }

      const routerAddress = getRouterAddress(chainId);
      if (!routerAddress) {
        throw new SwapError('Router address not found', 'NO_ROUTER');
      }

      const truncated = this.truncateToDecimals(params.amount, decimals.from);
      const amountIn = parseUnits(truncated, decimals.from);
      const minAmountOut = parseUnits(
        this.truncateToDecimals(quote.minAmountOut, decimals.to),
        decimals.to
      );

      // Check and approve if needed
      const userAddress = await signer.getAddress();
      const provider = signer.provider;

      if (!provider) {
        throw new SwapError('Provider not available', 'NO_PROVIDER');
      }

      const allowance = await checkAllowance({
        token: params.fromToken,
        owner: userAddress as `0x${string}`,
        spender: routerAddress as `0x${string}`,
        provider,
      });

      if (BigInt(allowance) < amountIn) {
        const approveTx = await approveToken({
          token: params.fromToken,
          spender: routerAddress as `0x${string}`,
          amount: amountIn.toString(),
          signer,
        });
        await approveTx.wait();
      }

      // Execute swap
      const tx = await executeUniversalSwap({
        signer,
        chainId,
        amountIn: amountIn.toString(),
        amountOutMin: minAmountOut.toString(),
        fromToken: params.fromToken,
        toToken: params.toToken,
        userAddress: params.userAddress,
        deadline: Math.floor(Date.now() / 1000) + 600,
        stable: poolType === 'stable',
      });

      return {
        hash: tx.hash,
        fromAmount: params.amount,
        toAmount: quote.amountOut,
        fromToken: params.fromToken,
        toToken: params.toToken,
      };
    } catch (error: any) {
      if (error instanceof SwapError) throw error;
      throw new SwapError(
        error.reason || error.message || 'Swap execution failed',
        'SWAP_ERROR'
      );
    }
  }

  /**
   * Utility: Truncate decimal places
   */
  private static truncateToDecimals(value: string, decimals: number): string {
    if (!value.includes('.')) return value;
    const [whole, frac] = value.split('.');
    return frac.length > decimals
      ? `${whole}.${frac.slice(0, decimals)}`
      : value;
  }

  /**
   * Utility: Calculate price impact percentage
   */
  private static calculatePriceImpact(exchangeRate: number): number {
    // Simplified: assumes 1:1 base rate
    // In production, fetch from oracle
    return Math.max(0, (1 - exchangeRate) * 100);
  }
}
