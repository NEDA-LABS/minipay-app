/**
 * Celo Transaction Builders for Minipay
 * Legacy transactions with feeCurrency support
 */

import { parseEther, parseUnits, encodeFunctionData } from 'viem';

// Celo Mainnet stablecoin addresses
export const CELO_TOKENS = {
  cUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
  USDC: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C',
  USDT: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e',
  USDC_ADAPTER: '0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B',
  USDT_ADAPTER: '0x0E2A3e05bc9A16F5292A6170456A710cb89C6f72',
} as const;

// Celo Alfajores (Testnet) addresses
export const CELO_TESTNET_TOKENS = {
  cUSD: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
  USDC: '0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B',
  USDT: '0xC4f86E9B4A588D501c1c3e25628dFd50Bc8D615e',
} as const;

export type FeeCurrency = 'cUSD' | 'USDC' | 'USDT';
export type CeloToken = keyof typeof CELO_TOKENS;

/**
 * Build native CELO transfer
 * Note: Most Minipay users prefer stablecoin transfers
 */
export function buildNativeTransfer(params: {
  to: string;
  amount: string;
  feeCurrency?: FeeCurrency;
}) {
  return {
    to: params.to as `0x${string}`,
    value: parseEther(params.amount),
    // Legacy transaction - no maxFeePerGas/maxPriorityFeePerGas
    gasPrice: undefined,
    // Pay gas in stablecoins (Celo-specific)
    feeCurrency: CELO_TOKENS[params.feeCurrency || 'cUSD'] as `0x${string}`,
  };
}

/**
 * Build ERC20 token transfer
 * Used for cUSD, USDC, USDT transfers
 */
export function buildTokenTransfer(params: {
  tokenAddress: string;
  to: string;
  amount: string;
  decimals: number;
  feeCurrency?: FeeCurrency;
}) {
  // ERC20 transfer function
  const data = encodeFunctionData({
    abi: [
      {
        name: 'transfer',
        type: 'function',
        inputs: [
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
        ],
        outputs: [{ type: 'bool' }],
        stateMutability: 'nonpayable',
      },
    ],
    functionName: 'transfer',
    args: [params.to as `0x${string}`, parseUnits(params.amount, params.decimals)],
  });

  return {
    to: params.tokenAddress as `0x${string}`,
    value: BigInt(0),
    data,
    // Pay gas in stablecoins
    feeCurrency: CELO_TOKENS[params.feeCurrency || 'cUSD'] as `0x${string}`,
  };
}

/**
 * Helper: Send cUSD (most common in Minipay)
 */
export function buildCUSDTransfer(to: string, amount: string) {
  return buildTokenTransfer({
    tokenAddress: CELO_TOKENS.cUSD,
    to,
    amount,
    decimals: 18,
    feeCurrency: 'cUSD',
  });
}

/**
 * Helper: Send USDC
 */
export function buildUSDCTransfer(to: string, amount: string) {
  return buildTokenTransfer({
    tokenAddress: CELO_TOKENS.USDC,
    to,
    amount,
    decimals: 6,
    feeCurrency: 'cUSD', // Pay gas in cUSD
  });
}

/**
 * Helper: Send USDT
 */
export function buildUSDTTransfer(to: string, amount: string) {
  return buildTokenTransfer({
    tokenAddress: CELO_TOKENS.USDT,
    to,
    amount,
    decimals: 6,
    feeCurrency: 'cUSD', // Pay gas in cUSD
  });
}

/**
 * Get token info by symbol
 */
export function getTokenInfo(symbol: FeeCurrency, testnet = false) {
  const tokens = testnet ? CELO_TESTNET_TOKENS : CELO_TOKENS;
  const decimals = {
    cUSD: 18,
    USDC: 6,
    USDT: 6,
  };

  return {
    address: tokens[symbol],
    symbol,
    decimals: decimals[symbol],
  };
}

/**
 * Validate Celo address format
 */
export function isValidCeloAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
