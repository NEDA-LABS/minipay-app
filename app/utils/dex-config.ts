/**
 * Multi-Chain DEX Configuration
 * Maps each chain to its primary DEX for swapping
 */

export interface DexConfig {
  name: string;
  routerAddress: string;
  factoryAddress: string;
  type: 'aerodrome' | 'uniswap-v2' | 'uniswap-v3' | 'pancakeswap';
  wethAddress?: string; // Wrapped native token for routing
  intermediates?: string[];
}

export const DEX_CONFIG: Record<number, DexConfig> = {
  // Base - Aerodrome
  8453: {
    name: 'Aerodrome',
    routerAddress: '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43',
    factoryAddress: '0x420DD381b31aEf6683db6B902084cB0FFECe40Da',
    type: 'aerodrome',
  },
  
  // BSC - PancakeSwap V2
  56: {
    name: 'PancakeSwap',
    routerAddress: '0x10ED43C718714eb63d5aA57B78B54704E256024E', // Official PancakeSwap V2 Router
    factoryAddress: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73', // Official PancakeSwap V2 Factory
    type: 'pancakeswap',
    wethAddress: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
    intermediates: ['0xe9e7cea3dedca5984780bafc599bd69add087d56'],
  },
  
  // Ethereum Mainnet - Uniswap V2
  1: {
    name: 'Uniswap V2',
    routerAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Official Uniswap V2 Router
    factoryAddress: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', // Official Uniswap V2 Factory
    type: 'uniswap-v2',
    wethAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
  },
  
  // Polygon - QuickSwap
  137: {
    name: 'QuickSwap',
    routerAddress: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff', // Official QuickSwap Router
    factoryAddress: '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32', // Official QuickSwap Factory
    type: 'uniswap-v2',
    wethAddress: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // WMATIC
  },
  
  // Arbitrum - Uniswap V3
  42161: {
    name: 'Uniswap V3',
    routerAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Official Uniswap V3 SwapRouter
    factoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984', // Official Uniswap V3 Factory
    type: 'uniswap-v3',
    wethAddress: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH on Arbitrum
  },
  
  // Optimism - Uniswap V3
  10: {
    name: 'Uniswap V3',
    routerAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Official Uniswap V3 SwapRouter
    factoryAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984', // Official Uniswap V3 Factory
    type: 'uniswap-v3',
    wethAddress: '0x4200000000000000000000000000000000000006', // WETH on Optimism
  },
  
  // Scroll - Uniswap V2 Fork (Zebra)
  534352: {
    name: 'Zebra',
    routerAddress: '0x0d7c4b40018969f81750d0a164c3839a77353EFB', // Zebra Router on Scroll
    factoryAddress: '0x0d7c4b40018969f81750d0a164c3839a77353EFB', // Zebra Factory on Scroll
    type: 'uniswap-v2',
    wethAddress: '0x5300000000000000000000000000000000000004', // WETH on Scroll
  },
  
  // Celo - Ubeswap
  42220: {
    name: 'Ubeswap',
    routerAddress: '0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121', // Official Ubeswap Router
    factoryAddress: '0x62d5b84bE28a183aBB507E125B384122D2C25fAE', // Official Ubeswap Factory
    type: 'uniswap-v2',
    wethAddress: '0x471EcE3750Da237f93B8E339c536989b8978a438', // CELO
  },
};

/**
 * Get DEX configuration for a specific chain
 */
export function getDexConfig(chainId: number): DexConfig | null {
  return DEX_CONFIG[chainId] || null;
}

/**
 * Check if swap is supported on a chain
 */
export function isSwapSupported(chainId: number): boolean {
  return chainId in DEX_CONFIG;
}

/**
 * Get list of supported chain IDs for swapping
 */
export function getSupportedSwapChains(): number[] {
  return Object.keys(DEX_CONFIG).map(Number);
}
