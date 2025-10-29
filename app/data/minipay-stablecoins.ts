/**
 * Minipay Stablecoin Configuration
 * Only Celo network tokens supported
 */

export interface StablecoinInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId: number;
  icon: string;
  adapter?: string;
  usesAdapter?: boolean;
}

// Celo Mainnet Stablecoins (42220)
export const MINIPAY_STABLECOINS: Record<string, StablecoinInfo> = {
  cUSD: {
    address: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
    symbol: 'cUSD',
    name: 'Celo Dollar',
    decimals: 18,
    chainId: 42220,
    icon: '💵',
  },
  USDC: {
    address: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    chainId: 42220,
    icon: '🔵',
    adapter: '0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B',
    usesAdapter: true,
  },
  USDT: {
    address: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    chainId: 42220,
    icon: '🟢',
    adapter: '0x0E2A3e05bc9A16F5292A6170456A710cb89C6f72',
    usesAdapter: true,
  },
};

// Celo Alfajores Testnet Tokens (44787)
export const CELO_TESTNET_TOKENS: Record<string, StablecoinInfo> = {
  cUSD: {
    address: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
    symbol: 'cUSD',
    name: 'Celo Dollar (Testnet)',
    decimals: 18,
    chainId: 44787,
    icon: '💵',
  },
  USDC: {
    address: '0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B',
    symbol: 'USDC',
    name: 'USD Coin (Testnet)',
    decimals: 6,
    chainId: 44787,
    icon: '🔵',
  },
  USDT: {
    address: '0xC4f86E9B4A588D501c1c3e25628dFd50Bc8D615e',
    symbol: 'USDT',
    name: 'Tether USD (Testnet)',
    decimals: 6,
    chainId: 44787,
    icon: '🟢',
  },
};

// Supported fee currencies for gas payment
export const SUPPORTED_FEE_CURRENCIES = [
  MINIPAY_STABLECOINS.cUSD.address,
  MINIPAY_STABLECOINS.USDC.address,
  MINIPAY_STABLECOINS.USDT.address,
];

/**
 * Get token list for current network
 */
export function getCeloTokens(testnet = false): Record<string, StablecoinInfo> {
  return testnet ? CELO_TESTNET_TOKENS : MINIPAY_STABLECOINS;
}

/**
 * Get token by address
 */
export function getTokenByAddress(
  address: string,
  testnet = false
): StablecoinInfo | undefined {
  const tokens = getCeloTokens(testnet);
  return Object.values(tokens).find(
    (token) => token.address.toLowerCase() === address.toLowerCase()
  );
}

/**
 * Get token by symbol
 */
export function getTokenBySymbol(
  symbol: string,
  testnet = false
): StablecoinInfo | undefined {
  const tokens = getCeloTokens(testnet);
  return tokens[symbol];
}

/**
 * Get all token symbols
 */
export function getSupportedTokenSymbols(): string[] {
  return Object.keys(MINIPAY_STABLECOINS);
}
