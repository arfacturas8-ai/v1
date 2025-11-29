import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import CryptoFeatureShowcase from './CryptoFeatureShowcase';

// Mock all icon imports
jest.mock('lucide-react', () => ({
  Coins: () => <div data-testid="coins-icon">Coins</div>,
  Image: () => <div data-testid="image-icon">Image</div>,
  Zap: () => <div data-testid="zap-icon">Zap</div>,
  Shield: () => <div data-testid="shield-icon">Shield</div>,
  TrendingUp: () => <div data-testid="trendingup-icon">TrendingUp</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
  Wallet: () => <div data-testid="wallet-icon">Wallet</div>,
  Crown: () => <div data-testid="crown-icon">Crown</div>,
  Gift: () => <div data-testid="gift-icon">Gift</div>,
  Globe: () => <div data-testid="globe-icon">Globe</div>,
  Star: () => <div data-testid="star-icon">Star</div>,
  Target: () => <div data-testid="target-icon">Target</div>,
  ArrowRight: () => <div data-testid="arrowright-icon">ArrowRight</div>,
  ExternalLink: () => <div data-testid="externallink-icon">ExternalLink</div>,
  CheckCircle: () => <div data-testid="checkcircle-icon">CheckCircle</div>,
  Info: () => <div data-testid="info-icon">Info</div>,
}));

// Mock child components
jest.mock('./YieldFarmingDashboard', () => {
  return function YieldFarmingDashboard() {
    return <div data-testid="yield-farming-dashboard">Yield Farming Dashboard</div>;
  };
});

jest.mock('./CryptoPaymentModal', () => {
  return function CryptoPaymentModal() {
    return <div data-testid="crypto-payment-modal">Crypto Payment Modal</div>;
  };
});

jest.mock('./TokenGatingPanel', () => {
  return function TokenGatingPanel() {
    return <div data-testid="token-gating-panel">Token Gating Panel</div>;
  };
});

jest.mock('./CryptoTippingSystem', () => {
  return function CryptoTippingSystem() {
    return <div data-testid="crypto-tipping-system">Crypto Tipping System</div>;
  };
});

jest.mock('./EnhancedWalletConnect', () => {
  return function EnhancedWalletConnect() {
    return <div data-testid="enhanced-wallet-connect">Enhanced Wallet Connect</div>;
  };
});

jest.mock('./NFTProfileSystem', () => {
  return function NFTProfileSystem() {
    return <div data-testid="nft-profile-system">NFT Profile System</div>;
  };
});

describe('CryptoFeatureShowcase', () => {
  describe('Component Rendering', () => {
    test('renders the main component without crashing', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.getByText('Web3 Features')).toBeInTheDocument();
    });

    test('renders the header section with correct title', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.getByText('Web3 Features')).toBeInTheDocument();
      expect(screen.getByText("Explore CRYB's comprehensive cryptocurrency and NFT capabilities")).toBeInTheDocument();
    });

    test('renders the overview tab by default', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.getByText('CRYB Web3 Platform')).toBeInTheDocument();
    });

    test('renders all tab triggers', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /defi/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /payments/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /access/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /nfts/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /tipping/i })).toBeInTheDocument();
    });
  });

  describe('Overview Section - Hero', () => {
    test('renders hero section with platform title', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.getByText('CRYB Web3 Platform')).toBeInTheDocument();
    });

    test('renders hero section description', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.getByText('The most comprehensive Web3 social platform with advanced NFT, DeFi, and cryptocurrency features')).toBeInTheDocument();
    });

    test('displays platform statistics - 8+ crypto features', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.getByText('8+')).toBeInTheDocument();
      expect(screen.getByText('Crypto Features')).toBeInTheDocument();
    });

    test('displays platform statistics - 5+ blockchains', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.getByText('5+')).toBeInTheDocument();
      expect(screen.getByText('Blockchains')).toBeInTheDocument();
    });

    test('displays platform statistics - 10+ wallet types', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.getByText('10+')).toBeInTheDocument();
      expect(screen.getByText('Wallet Types')).toBeInTheDocument();
    });

    test('displays platform statistics - 40% max APY', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.getByText('40%')).toBeInTheDocument();
      expect(screen.getByText('Max APY')).toBeInTheDocument();
    });
  });

  describe('Feature Cards Display', () => {
    test('renders DeFi Yield Farming feature card', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.getByText('DeFi Yield Farming')).toBeInTheDocument();
      expect(screen.getByText('Earn rewards through staking and liquidity provision')).toBeInTheDocument();
    });

    test('renders Crypto Payment Gateway feature card', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.getByText('Crypto Payment Gateway')).toBeInTheDocument();
      expect(screen.getByText('Seamless fiat-to-crypto and direct crypto payments')).toBeInTheDocument();
    });

    test('renders Token Gating & Access Control feature card', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.getByText('Token Gating & Access Control')).toBeInTheDocument();
      expect(screen.getByText('NFT and token-based community access')).toBeInTheDocument();
    });

    test('renders Crypto Tipping System feature card', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.getByText('Crypto Tipping System')).toBeInTheDocument();
      expect(screen.getByText('Support creators with cryptocurrency tips')).toBeInTheDocument();
    });

    test('renders NFT Profile System feature card', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.getByText('NFT Profile System')).toBeInTheDocument();
      expect(screen.getByText('Dynamic NFT profile pictures and achievements')).toBeInTheDocument();
    });

    test('renders Multi-Wallet Support feature card', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.getByText('Multi-Wallet Support')).toBeInTheDocument();
      expect(screen.getByText('Support for all major Web3 wallets')).toBeInTheDocument();
    });

    test('renders NFT Marketplace feature card', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.getByText('NFT Marketplace')).toBeInTheDocument();
      expect(screen.getByText('Comprehensive NFT trading platform')).toBeInTheDocument();
    });

    test('renders Multi-Chain Bridge feature card', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.getByText('Multi-Chain Bridge')).toBeInTheDocument();
      expect(screen.getByText('Seamless cross-chain asset transfers')).toBeInTheDocument();
    });

    test('renders DAO Governance feature card', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.getByText('DAO Governance')).toBeInTheDocument();
      expect(screen.getByText('Decentralized platform governance')).toBeInTheDocument();
    });
  });

  describe('Feature Status Badges', () => {
    test('displays "Live" badge for live features', () => {
      render(<CryptoFeatureShowcase />);
      const liveBadges = screen.getAllByText('Live');
      expect(liveBadges.length).toBeGreaterThan(0);
    });

    test('displays "Coming Soon" badge for upcoming features', () => {
      render(<CryptoFeatureShowcase />);
      const comingSoonBadges = screen.getAllByText('Coming Soon');
      expect(comingSoonBadges.length).toBeGreaterThan(0);
    });

    test('Multi-Chain Bridge shows Coming Soon status', () => {
      render(<CryptoFeatureShowcase />);
      const multiChainCard = screen.getByText('Multi-Chain Bridge').closest('div').closest('div');
      expect(within(multiChainCard).getByText('Coming Soon')).toBeInTheDocument();
    });

    test('DAO Governance shows Coming Soon status', () => {
      render(<CryptoFeatureShowcase />);
      const daoCard = screen.getByText('DAO Governance').closest('div').closest('div');
      expect(within(daoCard).getByText('Coming Soon')).toBeInTheDocument();
    });
  });

  describe('Feature Category Badges', () => {
    test('displays category badge for earning features', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.getByText('Earning')).toBeInTheDocument();
    });

    test('displays category badge for payment features', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.getByText('Payments')).toBeInTheDocument();
    });

    test('displays category badge for access control features', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.getByText('Access Control')).toBeInTheDocument();
    });

    test('displays category badge for social features', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.getByText('Social')).toBeInTheDocument();
    });

    test('displays category badge for identity features', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.getByText('Identity')).toBeInTheDocument();
    });

    test('displays category badge for infrastructure features', () => {
      render(<CryptoFeatureShowcase />);
      const infrastructureBadges = screen.getAllByText('Infrastructure');
      expect(infrastructureBadges.length).toBeGreaterThan(0);
    });

    test('displays category badge for marketplace features', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.getByText('Marketplace')).toBeInTheDocument();
    });

    test('displays category badge for governance features', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.getByText('Governance')).toBeInTheDocument();
    });
  });

  describe('Feature Benefits Display', () => {
    test('displays first 3 benefits for DeFi Yield Farming', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.getByText('Up to 40% APY on staked CRYB tokens')).toBeInTheDocument();
      expect(screen.getByText('Automated compound interest')).toBeInTheDocument();
      expect(screen.getByText('Multiple staking pools with different lock periods')).toBeInTheDocument();
    });

    test('shows additional benefits count when there are more than 3', () => {
      render(<CryptoFeatureShowcase />);
      const additionalBenefits = screen.getAllByText(/\+\d+ more features/);
      expect(additionalBenefits.length).toBeGreaterThan(0);
    });

    test('displays benefits for Crypto Payment Gateway', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.getByText('Integrated Transak and MoonPay')).toBeInTheDocument();
      expect(screen.getByText('Multi-currency support (BTC, ETH, USDC, CRYB)')).toBeInTheDocument();
    });

    test('displays benefits for Token Gating', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.getByText('NFT-based community access')).toBeInTheDocument();
      expect(screen.getByText('Tiered membership levels')).toBeInTheDocument();
    });
  });

  describe('Call-to-Action Buttons', () => {
    test('renders "Try Now" button for live features', () => {
      render(<CryptoFeatureShowcase />);
      const tryNowButtons = screen.getAllByRole('button', { name: /try now/i });
      expect(tryNowButtons.length).toBeGreaterThan(0);
    });

    test('renders "Coming Soon" button for upcoming features', () => {
      render(<CryptoFeatureShowcase />);
      const comingSoonButtons = screen.getAllByRole('button', { name: /coming soon/i });
      expect(comingSoonButtons.length).toBeGreaterThan(0);
    });

    test('disables buttons for coming soon features', () => {
      render(<CryptoFeatureShowcase />);
      const comingSoonButtons = screen.getAllByRole('button', { name: /coming soon/i });
      comingSoonButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    test('enables "Try Now" buttons for live features', () => {
      render(<CryptoFeatureShowcase />);
      const tryNowButtons = screen.getAllByRole('button', { name: /try now/i });
      tryNowButtons.forEach(button => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('Feature Card Interactions', () => {
    test('clicking a feature card opens the detail modal', () => {
      render(<CryptoFeatureShowcase />);
      const defiCard = screen.getByText('DeFi Yield Farming').closest('div').closest('div');
      fireEvent.click(defiCard);

      const modal = screen.getByText('Key Features & Benefits:');
      expect(modal).toBeInTheDocument();
    });

    test('modal displays all benefits when feature is selected', () => {
      render(<CryptoFeatureShowcase />);
      const defiCard = screen.getByText('DeFi Yield Farming').closest('div').closest('div');
      fireEvent.click(defiCard);

      expect(screen.getByText('Liquidity provision rewards')).toBeInTheDocument();
      expect(screen.getByText('Real-time portfolio tracking')).toBeInTheDocument();
    });

    test('modal shows status and category badges', () => {
      render(<CryptoFeatureShowcase />);
      const defiCard = screen.getByText('DeFi Yield Farming').closest('div').closest('div');
      fireEvent.click(defiCard);

      const liveBadges = screen.getAllByText('Live');
      expect(liveBadges.length).toBeGreaterThan(0);
    });

    test('clicking close button closes the modal', () => {
      render(<CryptoFeatureShowcase />);
      const defiCard = screen.getByText('DeFi Yield Farming').closest('div').closest('div');
      fireEvent.click(defiCard);

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      expect(screen.queryByText('Key Features & Benefits:')).not.toBeInTheDocument();
    });

    test('clicking "Try Feature" button in modal navigates to feature tab', () => {
      render(<CryptoFeatureShowcase />);
      const defiCard = screen.getByText('DeFi Yield Farming').closest('div').closest('div');
      fireEvent.click(defiCard);

      const tryFeatureButton = screen.getByRole('button', { name: /try feature/i });
      fireEvent.click(tryFeatureButton);

      expect(screen.getByTestId('yield-farming-dashboard')).toBeInTheDocument();
    });

    test('modal does not show "Try Feature" button for coming soon features', () => {
      render(<CryptoFeatureShowcase />);
      const multiChainCard = screen.getByText('Multi-Chain Bridge').closest('div').closest('div');
      fireEvent.click(multiChainCard);

      expect(screen.queryByRole('button', { name: /try feature/i })).not.toBeInTheDocument();
    });
  });

  describe('Technology Stack Section', () => {
    test('renders technology stack section', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.getByText('Technology Stack')).toBeInTheDocument();
    });

    test('displays Lightning Fast technology feature', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.getByText('Lightning Fast')).toBeInTheDocument();
      expect(screen.getByText('Optimized for performance')).toBeInTheDocument();
    });

    test('displays Secure technology feature', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.getByText('Secure')).toBeInTheDocument();
      expect(screen.getByText('Military-grade encryption')).toBeInTheDocument();
    });

    test('displays Multi-Chain technology feature', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.getByText('Multi-Chain')).toBeInTheDocument();
      expect(screen.getByText('Cross-chain compatible')).toBeInTheDocument();
    });

    test('displays Scalable technology feature', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.getByText('Scalable')).toBeInTheDocument();
      expect(screen.getByText('Built for growth')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    test('clicking DeFi tab navigates to Yield Farming Dashboard', () => {
      render(<CryptoFeatureShowcase />);
      const defiTab = screen.getByRole('tab', { name: /defi/i });
      fireEvent.click(defiTab);

      expect(screen.getByTestId('yield-farming-dashboard')).toBeInTheDocument();
    });

    test('clicking Payments tab navigates to crypto payments section', () => {
      render(<CryptoFeatureShowcase />);
      const paymentsTab = screen.getByRole('tab', { name: /payments/i });
      fireEvent.click(paymentsTab);

      expect(screen.getByText('Crypto Payment System')).toBeInTheDocument();
      expect(screen.getByText('Comprehensive cryptocurrency payment gateway with fiat-to-crypto onboarding')).toBeInTheDocument();
    });

    test('clicking Access tab navigates to Token Gating Panel', () => {
      render(<CryptoFeatureShowcase />);
      const accessTab = screen.getByRole('tab', { name: /access/i });
      fireEvent.click(accessTab);

      expect(screen.getByTestId('token-gating-panel')).toBeInTheDocument();
    });

    test('clicking NFTs tab navigates to NFT Profile System', () => {
      render(<CryptoFeatureShowcase />);
      const nftsTab = screen.getByRole('tab', { name: /nfts/i });
      fireEvent.click(nftsTab);

      expect(screen.getByTestId('nft-profile-system')).toBeInTheDocument();
    });

    test('clicking Tipping tab navigates to Crypto Tipping System', () => {
      render(<CryptoFeatureShowcase />);
      const tippingTab = screen.getByRole('tab', { name: /tipping/i });
      fireEvent.click(tippingTab);

      expect(screen.getByTestId('crypto-tipping-system')).toBeInTheDocument();
    });

    test('clicking Overview tab navigates back to overview section', () => {
      render(<CryptoFeatureShowcase />);
      const defiTab = screen.getByRole('tab', { name: /defi/i });
      fireEvent.click(defiTab);

      const overviewTab = screen.getByRole('tab', { name: /overview/i });
      fireEvent.click(overviewTab);

      expect(screen.getByText('CRYB Web3 Platform')).toBeInTheDocument();
    });
  });

  describe('Crypto Payments Tab Content', () => {
    test('displays payment system title and description', () => {
      render(<CryptoFeatureShowcase />);
      const paymentsTab = screen.getByRole('tab', { name: /payments/i });
      fireEvent.click(paymentsTab);

      expect(screen.getByText('Crypto Payment System')).toBeInTheDocument();
      expect(screen.getByText('Comprehensive cryptocurrency payment gateway with fiat-to-crypto onboarding')).toBeInTheDocument();
    });

    test('displays multi-currency feature card', () => {
      render(<CryptoFeatureShowcase />);
      const paymentsTab = screen.getByRole('tab', { name: /payments/i });
      fireEvent.click(paymentsTab);

      expect(screen.getByText('Multi-Currency')).toBeInTheDocument();
      expect(screen.getByText('BTC, ETH, USDC, CRYB')).toBeInTheDocument();
    });

    test('displays secure feature card', () => {
      render(<CryptoFeatureShowcase />);
      const paymentsTab = screen.getByRole('tab', { name: /payments/i });
      fireEvent.click(paymentsTab);

      const secureCards = screen.getAllByText('Secure');
      expect(secureCards.length).toBeGreaterThan(0);
      expect(screen.getByText('Bank-grade security')).toBeInTheDocument();
    });

    test('displays instant processing feature card', () => {
      render(<CryptoFeatureShowcase />);
      const paymentsTab = screen.getByRole('tab', { name: /payments/i });
      fireEvent.click(paymentsTab);

      expect(screen.getByText('Instant')).toBeInTheDocument();
      expect(screen.getByText('Real-time processing')).toBeInTheDocument();
    });
  });

  describe('Feature Card Button Navigation', () => {
    test('clicking "Try Now" button on feature card navigates to feature tab', () => {
      render(<CryptoFeatureShowcase />);
      const defiCard = screen.getByText('DeFi Yield Farming').closest('div').closest('div');
      const tryNowButton = within(defiCard).getByRole('button', { name: /try now/i });

      fireEvent.click(tryNowButton);

      expect(screen.getByTestId('yield-farming-dashboard')).toBeInTheDocument();
    });

    test('clicking "Try Now" button prevents card click event', () => {
      render(<CryptoFeatureShowcase />);
      const defiCard = screen.getByText('DeFi Yield Farming').closest('div').closest('div');
      const tryNowButton = within(defiCard).getByRole('button', { name: /try now/i });

      fireEvent.click(tryNowButton);

      expect(screen.queryByText('Key Features & Benefits:')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Design and Layout', () => {
    test('feature grid displays all feature cards', () => {
      render(<CryptoFeatureShowcase />);
      const featureCards = [
        'DeFi Yield Farming',
        'Crypto Payment Gateway',
        'Token Gating & Access Control',
        'Crypto Tipping System',
        'NFT Profile System',
        'Multi-Wallet Support',
        'NFT Marketplace',
        'Multi-Chain Bridge',
        'DAO Governance'
      ];

      featureCards.forEach(feature => {
        expect(screen.getByText(feature)).toBeInTheDocument();
      });
    });

    test('technology stack displays all four features in grid', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.getByText('Lightning Fast')).toBeInTheDocument();
      expect(screen.getByText('Secure')).toBeInTheDocument();
      expect(screen.getByText('Multi-Chain')).toBeInTheDocument();
      expect(screen.getByText('Scalable')).toBeInTheDocument();
    });

    test('modal is displayed with proper overlay when feature is selected', () => {
      render(<CryptoFeatureShowcase />);
      const defiCard = screen.getByText('DeFi Yield Farming').closest('div').closest('div');
      fireEvent.click(defiCard);

      const modal = screen.getByText('Key Features & Benefits:').closest('div').closest('div');
      expect(modal).toBeInTheDocument();
    });
  });

  describe('Animation and Hover Effects', () => {
    test('feature cards have cursor-pointer class for hover indication', () => {
      render(<CryptoFeatureShowcase />);
      const defiCard = screen.getByText('DeFi Yield Farming').closest('div').closest('div');
      expect(defiCard).toHaveClass('cursor-pointer');
    });

    test('feature cards have hover shadow transition class', () => {
      render(<CryptoFeatureShowcase />);
      const defiCard = screen.getByText('DeFi Yield Farming').closest('div').closest('div');
      expect(defiCard).toHaveClass('hover:shadow-lg');
      expect(defiCard).toHaveClass('transition-shadow');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('modal does not render when no feature is selected', () => {
      render(<CryptoFeatureShowcase />);
      expect(screen.queryByText('Key Features & Benefits:')).not.toBeInTheDocument();
    });

    test('handles multiple rapid clicks on feature cards', () => {
      render(<CryptoFeatureShowcase />);
      const defiCard = screen.getByText('DeFi Yield Farming').closest('div').closest('div');

      fireEvent.click(defiCard);
      fireEvent.click(defiCard);
      fireEvent.click(defiCard);

      expect(screen.getByText('Key Features & Benefits:')).toBeInTheDocument();
    });

    test('can switch between different feature modals', () => {
      render(<CryptoFeatureShowcase />);

      const defiCard = screen.getByText('DeFi Yield Farming').closest('div').closest('div');
      fireEvent.click(defiCard);
      expect(screen.getByText('Real-time portfolio tracking')).toBeInTheDocument();

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      const tippingCard = screen.getByText('Crypto Tipping System').closest('div').closest('div');
      fireEvent.click(tippingCard);
      expect(screen.getByText('Tip leaderboards and analytics')).toBeInTheDocument();
    });

    test('can navigate between tabs multiple times', () => {
      render(<CryptoFeatureShowcase />);

      const defiTab = screen.getByRole('tab', { name: /defi/i });
      fireEvent.click(defiTab);
      expect(screen.getByTestId('yield-farming-dashboard')).toBeInTheDocument();

      const overviewTab = screen.getByRole('tab', { name: /overview/i });
      fireEvent.click(overviewTab);
      expect(screen.getByText('CRYB Web3 Platform')).toBeInTheDocument();

      const tippingTab = screen.getByRole('tab', { name: /tipping/i });
      fireEvent.click(tippingTab);
      expect(screen.getByTestId('crypto-tipping-system')).toBeInTheDocument();
    });
  });
});

export default YieldFarmingDashboard
