/** @type {import('next').NextConfig} */
const nextConfig = {
  // Completely ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Turbopack config (Next.js 16 uses Turbopack by default)
  turbopack: {
    resolveAlias: {
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      http: 'stream-http',
      https: 'https-browserify',
      os: 'os-browserify',
      path: 'path-browserify',
      buffer: 'buffer',
    },
  },
  // Transpile problematic packages
  transpilePackages: [
    'wagmi', 
    '@coinbase/onchainkit', 
    'viem', 
    'next-themes',
    'ethers',
    '@biconomy/abstractjs',
    '@biconomy/mexa'
  ],
  // Use standard Next.js settings
  poweredByHeader: false,
  reactStrictMode: false,
  trailingSlash: false,
  // Ensure proper handling of SVG and other static assets
  images: {
    // remotePatterns: ['nedapay.xyz'],
    dangerouslyAllowSVG: true,
  },
};

module.exports = nextConfig;
