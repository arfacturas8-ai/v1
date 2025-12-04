/**
 * Wallet Store (Zustand)
 * Manages Web3 wallet connection and blockchain state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WalletState {
  // Connection
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  provider: string | null; // 'metamask', 'walletconnect', etc.

  // Balance
  balance: string | null;

  // Actions
  connect: (provider: string, address: string, chainId: number) => void;
  disconnect: () => void;
  updateChainId: (chainId: number) => void;
  updateBalance: (balance: string) => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      // Initial State
      isConnected: false,
      address: null,
      chainId: null,
      provider: null,
      balance: null,

      // Connect wallet
      connect: (provider, address, chainId) => {
        set({
          isConnected: true,
          provider,
          address,
          chainId,
        });
      },

      // Disconnect wallet
      disconnect: () => {
        set({
          isConnected: false,
          address: null,
          chainId: null,
          provider: null,
          balance: null,
        });
      },

      // Update chain ID
      updateChainId: (chainId) => {
        set({ chainId });
      },

      // Update balance
      updateBalance: (balance) => {
        set({ balance });
      },
    }),
    {
      name: 'cryb-wallet',
      partialize: (state) => ({
        isConnected: state.isConnected,
        address: state.address,
        chainId: state.chainId,
        provider: state.provider,
      }),
    }
  )
);
