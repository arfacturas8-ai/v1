export const SUPPORTED_CHAINS = {
  ethereum: {
    id: 1,
    name: "Ethereum",
    rpcUrl: process.env.ETHEREUM_RPC_URL || `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
    explorer: "https://etherscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  polygon: {
    id: 137,
    name: "Polygon",
    rpcUrl: process.env.POLYGON_RPC_URL || `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
    explorer: "https://polygonscan.com",
    nativeCurrency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18,
    },
  },
  arbitrum: {
    id: 42161,
    name: "Arbitrum One",
    rpcUrl: process.env.ARBITRUM_RPC_URL || `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
    explorer: "https://arbiscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  base: {
    id: 8453,
    name: "Base",
    rpcUrl: process.env.BASE_RPC_URL || `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    explorer: "https://basescan.org",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
} as const;

export type ChainId = keyof typeof SUPPORTED_CHAINS;

export function getChainById(chainId: number) {
  return Object.values(SUPPORTED_CHAINS).find((chain) => chain.id === chainId);
}

export function isChainSupported(chainId: number): boolean {
  return Object.values(SUPPORTED_CHAINS).some((chain) => chain.id === chainId);
}