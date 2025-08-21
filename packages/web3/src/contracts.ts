import { ethers } from "ethers";
import { SUPPORTED_CHAINS } from "./chains";

export const TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
];

export const NFT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
];

export function getProvider(chainId: number) {
  const chain = Object.values(SUPPORTED_CHAINS).find((c) => c.id === chainId);
  if (!chain) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return new ethers.JsonRpcProvider(chain.rpcUrl);
}

export async function getTokenBalance(
  tokenAddress: string,
  walletAddress: string,
  chainId: number
): Promise<string> {
  const provider = getProvider(chainId);
  const contract = new ethers.Contract(tokenAddress, TOKEN_ABI, provider);
  
  const [balance, decimals] = await Promise.all([
    contract.balanceOf(walletAddress),
    contract.decimals(),
  ]);
  
  return ethers.formatUnits(balance, decimals);
}

export async function getTokenInfo(tokenAddress: string, chainId: number) {
  const provider = getProvider(chainId);
  const contract = new ethers.Contract(tokenAddress, TOKEN_ABI, provider);
  
  const [name, symbol, decimals] = await Promise.all([
    contract.name(),
    contract.symbol(),
    contract.decimals(),
  ]);
  
  return { name, symbol, decimals };
}

export async function verifyNFTOwnership(
  nftAddress: string,
  walletAddress: string,
  chainId: number
): Promise<boolean> {
  const provider = getProvider(chainId);
  const contract = new ethers.Contract(nftAddress, NFT_ABI, provider);
  
  const balance = await contract.balanceOf(walletAddress);
  return balance > 0n;
}

export async function getNFTBalance(
  nftAddress: string,
  walletAddress: string,
  chainId: number
): Promise<number> {
  const provider = getProvider(chainId);
  const contract = new ethers.Contract(nftAddress, NFT_ABI, provider);
  
  const balance = await contract.balanceOf(walletAddress);
  return Number(balance);
}