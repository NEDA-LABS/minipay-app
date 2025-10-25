import { ethers } from 'ethers';
import { getDexConfig } from './dex-config';

// Universal Router ABI for Uniswap V2-style DEXs (PancakeSwap, QuickSwap, etc.)
const UNISWAP_V2_ROUTER_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
      { "internalType": "address[]", "name": "path", "type": "address[]" }
    ],
    "name": "getAmountsOut",
    "outputs": [{ "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
      { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
      { "internalType": "address[]", "name": "path", "type": "address[]" },
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "deadline", "type": "uint256" }
    ],
    "name": "swapExactTokensForTokens",
    "outputs": [{ "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const UNISWAP_V2_PAIR_ABI = [
  {
    "inputs": [],
    "name": "getReserves",
    "outputs": [
      { "internalType": "uint112", "name": "_reserve0", "type": "uint112" },
      { "internalType": "uint112", "name": "_reserve1", "type": "uint112" },
      { "internalType": "uint32", "name": "_blockTimestampLast", "type": "uint32" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

async function getPairAddress(factory: ethers.Contract, a: string, b: string): Promise<string> {
  return await factory.getPair(a, b);
}

async function hasPair(provider: ethers.providers.Provider, factory: ethers.Contract, a: string, b: string): Promise<boolean> {
  try {
    const pair = await getPairAddress(factory, a, b);
    if (!pair || pair === ethers.constants.AddressZero) return false;
    const code = await provider.getCode(pair);
    if (code === '0x') return false;
    try {
      const pairContract = new ethers.Contract(pair, UNISWAP_V2_PAIR_ABI, provider);
      const [r0, r1] = await pairContract.getReserves();
      const R0 = BigInt(r0.toString());
      const R1 = BigInt(r1.toString());
      return R0 > 0n && R1 > 0n;
    } catch {
      return true;
    }
  } catch {
    return false;
  }
}

async function findBestV2Path(
  provider: ethers.providers.Provider,
  dexConfig: ReturnType<typeof getDexConfig>,
  fromToken: string,
  toToken: string
): Promise<string[] | null> {
  if (!dexConfig) return null;
  const factory = new ethers.Contract(
    dexConfig.factoryAddress,
    UNISWAP_V2_FACTORY_ABI,
    provider
  );

  if (await hasPair(provider, factory, fromToken, toToken)) return [fromToken, toToken];

  if (dexConfig.wethAddress) {
    const w = dexConfig.wethAddress;
    if (
      fromToken.toLowerCase() !== w.toLowerCase() &&
      toToken.toLowerCase() !== w.toLowerCase()
    ) {
      const leg1 = await hasPair(provider, factory, fromToken, w);
      const leg2 = await hasPair(provider, factory, w, toToken);
      if (leg1 && leg2) return [fromToken, w, toToken];
    }
  }

  if (Array.isArray(dexConfig.intermediates)) {
    for (const mid of dexConfig.intermediates) {
      if ([fromToken.toLowerCase(), toToken.toLowerCase()].includes(mid.toLowerCase())) continue;
      const leg1 = await hasPair(provider, factory, fromToken, mid);
      const leg2 = await hasPair(provider, factory, mid, toToken);
      if (leg1 && leg2) return [fromToken, mid, toToken];
    }
  }

  return null;
}

// Uniswap V2 Factory ABI (getPair)
const UNISWAP_V2_FACTORY_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "tokenA", "type": "address" },
      { "internalType": "address", "name": "tokenB", "type": "address" }
    ],
    "name": "getPair",
    "outputs": [ { "internalType": "address", "name": "pair", "type": "address" } ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Aerodrome-specific ABI (with routes)
const AERODROME_ROUTER_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
      { "components": [
        { "internalType": "address", "name": "from", "type": "address" },
        { "internalType": "address", "name": "to", "type": "address" },
        { "internalType": "bool", "name": "stable", "type": "bool" },
        { "internalType": "address", "name": "factory", "type": "address" }
      ], "internalType": "struct IRouter.Route[]", "name": "routes", "type": "tuple[]" }
    ],
    "name": "getAmountsOut",
    "outputs": [{ "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
      { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
      { "components": [
        { "internalType": "address", "name": "from", "type": "address" },
        { "internalType": "address", "name": "to", "type": "address" },
        { "internalType": "bool", "name": "stable", "type": "bool" },
        { "internalType": "address", "name": "factory", "type": "address" }
      ], "internalType": "struct IRouter.Route[]", "name": "routes", "type": "tuple[]" },
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "deadline", "type": "uint256" }
    ],
    "name": "swapExactTokensForTokens",
    "outputs": [{ "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

/**
 * Get quote from any DEX based on chain configuration
 */
export async function getUniversalQuote({
  provider,
  chainId,
  amountIn,
  fromToken,
  toToken,
  stable = false,
}: {
  provider: ethers.providers.Provider;
  chainId: number;
  amountIn: string;
  fromToken: string;
  toToken: string;
  stable?: boolean;
}): Promise<bigint[]> {
  const dexConfig = getDexConfig(chainId);
  
  if (!dexConfig) {
    throw new Error(`Swap not supported on chain ${chainId}`);
  }

  // Validate inputs
  if (!amountIn || amountIn === '0') {
    throw new Error('Amount must be greater than 0');
  }
  if (!fromToken || !toToken) {
    throw new Error('Token addresses are required');
  }
  if (fromToken.toLowerCase() === toToken.toLowerCase()) {
    throw new Error('Cannot swap token to itself');
  }
  
  // Validate address format (0x + 40 hex chars)
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  if (!addressRegex.test(fromToken) || !addressRegex.test(toToken)) {
    throw new Error(`Invalid token addresses: from=${fromToken}, to=${toToken}`);
  }

  if (dexConfig.type === 'aerodrome') {
    // Aerodrome uses routes
    const router = new ethers.Contract(
      dexConfig.routerAddress,
      AERODROME_ROUTER_ABI,
      provider
    );
    const routes = [{ 
      from: fromToken, 
      to: toToken, 
      stable, 
      factory: dexConfig.factoryAddress 
    }];
    const amounts = await router.getAmountsOut(amountIn, routes);
    return amounts.map((a: any) => BigInt(a.toString()));
  } else {
    // Uniswap V2-style DEXs use path
    const router = new ethers.Contract(
      dexConfig.routerAddress,
      UNISWAP_V2_ROUTER_ABI,
      provider
    );

    // Build a viable path using factory getPair checks
    const path = await findBestV2Path(provider, dexConfig, fromToken, toToken);
    if (!path) {
      throw new Error(`[${dexConfig.name}] No viable path found for ${fromToken} → ${toToken}`);
    }
    console.log(`[${dexConfig.name}] Using path: ${path.join(' → ')}`);
    const amounts = await router.getAmountsOut(amountIn, path);
    return amounts.map((a: any) => BigInt(a.toString()));
  }
}

/**
 * Execute swap on any DEX based on chain configuration
 */
export async function executeUniversalSwap({
  signer,
  chainId,
  amountIn,
  amountOutMin,
  fromToken,
  toToken,
  userAddress,
  deadline,
  stable = false,
}: {
  signer: ethers.Signer;
  chainId: number;
  amountIn: string;
  amountOutMin: string;
  fromToken: string;
  toToken: string;
  userAddress: string;
  deadline: number;
  stable?: boolean;
}) {
  const dexConfig = getDexConfig(chainId);
  
  if (!dexConfig) {
    throw new Error(`Swap not supported on chain ${chainId}`);
  }

  if (dexConfig.type === 'aerodrome') {
    // Aerodrome uses routes
    const router = new ethers.Contract(
      dexConfig.routerAddress,
      AERODROME_ROUTER_ABI,
      signer
    );
    const routes = [{ 
      from: fromToken, 
      to: toToken, 
      stable, 
      factory: dexConfig.factoryAddress 
    }];
    return await router.swapExactTokensForTokens(
      amountIn,
      amountOutMin,
      routes,
      userAddress,
      deadline
    );
  } else {
    // Uniswap V2-style DEXs use path
    const router = new ethers.Contract(
      dexConfig.routerAddress,
      UNISWAP_V2_ROUTER_ABI,
      signer
    );

    // Use the same path finder as for quotes
    const readProvider = signer.provider!;
    const path = await findBestV2Path(readProvider, dexConfig, fromToken, toToken);
    if (!path) {
      throw new Error(`[${dexConfig.name}] No viable path found for ${fromToken} → ${toToken}`);
    }
    return await router.swapExactTokensForTokens(
      amountIn,
      amountOutMin,
      path,
      userAddress,
      deadline
    );
  }
}

/**
 * Get router address for approval
 */
export function getRouterAddress(chainId: number): string | null {
  const dexConfig = getDexConfig(chainId);
  return dexConfig?.routerAddress || null;
}
