import Image from "next/image";

// Chain configuration with SVG components
export const chainConfig = {
  10: { 
    name: "Optimism", 
    icon: (
      <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-[#FF0420] flex items-center justify-center">
        <Image src="/optimism.svg" alt="Optimism" width={16} height={16} className="md:w-6 md:h-6" />
      </div>
    ) 
  },
  42161: { 
    name: "Arbitrum", 
    icon: (
      <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-[#2D374B] flex items-center justify-center">
        <Image src="/arbitrum.svg" alt="Arbitrum" width={16} height={16} className="md:w-6 md:h-6" />
      </div>
    ) 
  },
  8453: { 
    name: "Base", 
    icon: (
      <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-blue-500 flex items-center justify-center">
        <Image src="/base.svg" alt="Base" width={16} height={16} className="md:w-6 md:h-6" />
      </div>
    ) 
  },
  137: { 
    name: "Polygon", 
    icon: (
      <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-[#8247E5] flex items-center justify-center">
        <Image src="/polygon.svg" alt="Polygon" width={16} height={16} className="md:w-6 md:h-6" />
      </div>
    ) 
  },
  56: { 
    name: "BNB Chain", 
    icon: (
      <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-[#F0B90B] flex items-center justify-center">
        <Image src="/bnb.svg" alt="BNB Chain" width={16} height={16} className="md:w-6 md:h-6" />
      </div>
    ) 
  },
  534352: { 
    name: "Scroll", 
    icon: (
      <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-[#EACD98] flex items-center justify-center">
        <Image src="/scroll.svg" alt="Scroll" width={16} height={16} className="md:w-6 md:h-6" />
      </div>
    ) 
  },
  42220: { 
    name: "Celo", 
    icon: (
      <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-[#FCFF52] flex items-center justify-center">
        <Image src="/celo.svg" alt="Celo" width={16} height={16} className="md:w-6 md:h-6" />
      </div>
    ) 
  },
};

// Explorer configuration
export const explorerConfig: Record<number, string> = {
  1: "https://etherscan.io/tx/",
  10: "https://optimistic.etherscan.io/tx/",
  42161: "https://arbiscan.io/tx/",
  8453: "https://basescan.org/tx/",
  137: "https://polygonscan.com/tx/",
  56: "https://bscscan.com/tx/",
  534352: "https://scrollscan.com/tx/",
  42220: "https://celoscan.io/tx/",
};

// Helper function to get token decimals by chain
export const getTokenDecimals = (token: any, chainId: number): number => {
  if (typeof token.decimals === 'number') {
    return token.decimals;
  }
  return token.decimals[chainId] || 18;
};

// Token configuration with SVG components
export const TOKENS = {
  ETH: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
    addresses: {
      1: "0x0000000000000000000000000000000000000000",
      10: "0x0000000000000000000000000000000000000000",
      42161: "0x0000000000000000000000000000000000000000",
      8453: "0x0000000000000000000000000000000000000000",
      137: "0x0000000000000000000000000000000000000000",
      56: "0x0000000000000000000000000000000000000000",
    },
    icon: (
      <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-[#627EEA] flex items-center justify-center">
        <Image src="/eth-logo.svg" alt="ETH" width={16} height={16} className="md:w-5 md:h-5" />
      </div>
    )
  },
  USDC: {
    name: "USD Coin",
    symbol: "USDC",
    decimals: {
      1: 6,
      10: 6,
      42161: 6,
      8453: 6,
      137: 6,
      56: 18,
      42220: 6,
      534352: 6,
    },
    addresses: {
      1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      10: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
      42161: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      137: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      56: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
      42220: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
      534352: "0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4",
    },
    icon: (
      <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-[#2775CA] flex items-center justify-center">
        <Image src="/usdc-logo.svg" alt="USDC" width={16} height={16} className="md:w-6 md:h-6" />
      </div>
    )
  },
  USDT: {
    name: "Tether USD",
    symbol: "USDT",
    decimals: 6,
    addresses: {
      1: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      10: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
      42161: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
      137: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      56: "0x55d398326f99059fF775485246999027B3197955",
      534352: "0xf55BEC9cafDbE8730f096Aa55dad6D22d44099Df",
      42220: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e",
    },
    icon: (
      <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-[#26A17B] flex items-center justify-center">
        <Image src="/usdt-logo.svg" alt="USDT" width={16} height={16} className="md:w-6 md:h-6" />
      </div>
    )
  },
};

export type TokenSymbol = keyof typeof TOKENS;

export interface CompletedBridge {
  fromChainId: number;
  toChainId: number;
  tokenSymbol: string;
  amountSent: string;
  amountReceived: string;
  depositTxHash?: string;
  fillTxHash?: string;
}
