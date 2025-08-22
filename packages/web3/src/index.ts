// Core exports
export * from "./CryptoManager";
export * from "./types";

// Existing exports
export * from "./siwe";
export * from "./contracts";
export * from "./tokens";
export * from "./chains";

// Wallet providers
export * from "./wallets/MetaMaskProvider";

// Export main manager as default
export { CryptoManager as default } from "./CryptoManager";