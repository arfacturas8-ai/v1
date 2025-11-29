import React, { useState } from 'react';
import { Card, Button, Badge, Tabs } from '@radix-ui/themes';
import { 
  Coins, Image, Zap, Shield, TrendingUp, Users,
  Wallet, Crown, Gift, Globe, Star, Target,
  ArrowRight, ExternalLink, CheckCircle, Info
} from 'lucide-react';

// Import all the crypto components we've created
import YieldFarmingDashboard from './YieldFarmingDashboard';
import CryptoPaymentModal from './CryptoPaymentModal';
import TokenGatingPanel from './TokenGatingPanel';
import CryptoTippingSystem from './CryptoTippingSystem';
import EnhancedWalletConnect from './EnhancedWalletConnect';
import NFTProfileSystem from './NFTProfileSystem';

// Feature showcase data
const CRYPTO_FEATURES = {
  DEFI_YIELDS: {
    id: 'defi_yields',
    title: 'DeFi Yield Farming',
    description: 'Earn rewards through staking and liquidity provision',
    icon: <TrendingUp style={{
  width: '24px',
  height: '24px'
}} />,
    benefits: [
      'Up to 40% APY on staked CRYB tokens',
      'Automated compound interest',
      'Multiple staking pools with different lock periods',
      'Liquidity provision rewards',
      'Real-time portfolio tracking'
    ],
    status: 'live',
    category: 'earning'
  },
  CRYPTO_PAYMENTS: {
    id: 'crypto_payments',
    title: 'Crypto Payment Gateway',
    description: 'Seamless fiat-to-crypto and direct crypto payments',
    icon: <Coins style={{
  width: '24px',
  height: '24px'
}} />,
    benefits: [
      'Integrated Transak and MoonPay',
      'Multi-currency support (BTC, ETH, USDC, CRYB)',
      'Premium subscription payments',
      'Low transaction fees',
      'Instant payment processing'
    ],
    status: 'live',
    category: 'payments'
  },
  TOKEN_GATING: {
    id: 'token_gating',
    title: 'Token Gating & Access Control',
    description: 'NFT and token-based community access',
    icon: <Shield style={{
  width: '24px',
  height: '24px'
}} />,
    benefits: [
      'NFT-based community access',
      'Tiered membership levels',
      'Smart contract verification',
      'Automatic permission management',
      'Cross-chain compatibility'
    ],
    status: 'live',
    category: 'access'
  },
  CRYPTO_TIPPING: {
    id: 'crypto_tipping',
    title: 'Crypto Tipping System',
    description: 'Support creators with cryptocurrency tips',
    icon: <Gift style={{
  width: '24px',
  height: '24px'
}} />,
    benefits: [
      'Multi-token tipping (CRYB, ETH, USDC)',
      'Quick reaction tips',
      'Custom tip amounts and messages',
      'Real-time notifications',
      'Tip leaderboards and analytics'
    ],
    status: 'live',
    category: 'social'
  },
  NFT_PROFILES: {
    id: 'nft_profiles',
    title: 'NFT Profile System',
    description: 'Dynamic NFT profile pictures and achievements',
    icon: <Image style={{
  width: '24px',
  height: '24px'
}} />,
    benefits: [
      'NFT profile picture integration',
      'Dynamic achievement system',
      'Verification badges',
      'Social status indicators',
      'Collectible achievements'
    ],
    status: 'live',
    category: 'identity'
  },
  WALLET_CONNECT: {
    id: 'wallet_connect',
    title: 'Multi-Wallet Support',
    description: 'Support for all major Web3 wallets',
    icon: <Wallet style={{
  width: '24px',
  height: '24px'
}} />,
    benefits: [
      'MetaMask, WalletConnect, Coinbase Wallet',
      'Hardware wallet support (Ledger, Trezor)',
      'Mobile wallet integration',
      'Automatic network switching',
      'Secure connection management'
    ],
    status: 'live',
    category: 'infrastructure'
  },
  NFT_MARKETPLACE: {
    id: 'nft_marketplace',
    title: 'NFT Marketplace',
    description: 'Comprehensive NFT trading platform',
    icon: <Star style={{
  width: '24px',
  height: '24px'
}} />,
    benefits: [
      'EIP-2981 royalty support',
      'Auction and instant buy options',
      'Collection offers and batch operations',
      'Cross-chain NFT trading',
      'Low marketplace fees'
    ],
    status: 'live',
    category: 'marketplace'
  },
  MULTICHAIN: {
    id: 'multichain',
    title: 'Multi-Chain Bridge',
    description: 'Seamless cross-chain asset transfers',
    icon: <Globe style={{
  width: '24px',
  height: '24px'
}} />,
    benefits: [
      'Ethereum, Polygon, Arbitrum, Optimism',
      'Automated bridge routing',
      'Minimal slippage',
      'Real-time price optimization',
      'Secure cross-chain protocols'
    ],
    status: 'coming_soon',
    category: 'infrastructure'
  },
  DAO_GOVERNANCE: {
    id: 'dao_governance',
    title: 'DAO Governance',
    description: 'Decentralized platform governance',
    icon: <Crown style={{
  width: '24px',
  height: '24px'
}} />,
    benefits: [
      'Proposal creation and voting',
      'Treasury management',
      'Stake-weighted voting power',
      'Delegation mechanisms',
      'Transparent execution'
    ],
    status: 'coming_soon',
    category: 'governance'
  }
};

const FEATURE_CATEGORIES = {
  earning: { name: 'Earning', color: 'green', icon: <TrendingUp style={{
  width: '16px',
  height: '16px'
}} /> },
  payments: { name: 'Payments', color: 'blue', icon: <Coins style={{
  width: '16px',
  height: '16px'
}} /> },
  access: { name: 'Access Control', color: 'purple', icon: <Shield style={{
  width: '16px',
  height: '16px'
}} /> },
  social: { name: 'Social', color: 'pink', icon: <Gift style={{
  width: '16px',
  height: '16px'
}} /> },
  identity: { name: 'Identity', color: 'orange', icon: <Image style={{
  width: '16px',
  height: '16px'
}} /> },
  infrastructure: { name: 'Infrastructure', color: 'gray', icon: <Wallet style={{
  width: '16px',
  height: '16px'
}} /> },
  marketplace: { name: 'Marketplace', color: 'yellow', icon: <Star style={{
  width: '16px',
  height: '16px'
}} /> },
  governance: { name: 'Governance', color: 'red', icon: <Crown style={{
  width: '16px',
  height: '16px'
}} /> }
};

const CryptoFeatureShowcase = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFeature, setSelectedFeature] = useState(null);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'live':
        return <Badge color="green">Live</Badge>;
      case 'coming_soon':
        return <Badge color="orange">Coming Soon</Badge>;
      case 'beta':
        return <Badge color="blue">Beta</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getCategoryBadge = (category) => {
    const cat = FEATURE_CATEGORIES[category];
    return cat ? (
      <Badge color={cat.color} variant="outline">
        {cat.icon}
        <span className="ml-1">{cat.name}</span>
      </Badge>
    ) : null;
  };

  // Overview Component
  const OverviewSection = () => (
    <div className="space-y-8">
      {/* Hero Section */}
      <Card style={{
  padding: '32px'
}}>
        <div style={{
  textAlign: 'center'
}}>
          <h1 style={{
  fontWeight: 'bold'
}}>
            CRYB Web3 Platform
          </h1>
          <p style={{
  color: '#c9d1d9'
}}>
            The most comprehensive Web3 social platform with advanced NFT, DeFi, and cryptocurrency features
          </p>
          
          <div style={{
  display: 'flex',
  justifyContent: 'center'
}}>
            <div style={{
  textAlign: 'center'
}}>
              <div style={{
  fontWeight: 'bold'
}}>8+</div>
              <div style={{
  color: '#c9d1d9'
}}>Crypto Features</div>
            </div>
            <div style={{
  textAlign: 'center'
}}>
              <div style={{
  fontWeight: 'bold'
}}>5+</div>
              <div style={{
  color: '#c9d1d9'
}}>Blockchains</div>
            </div>
            <div style={{
  textAlign: 'center'
}}>
              <div style={{
  fontWeight: 'bold'
}}>10+</div>
              <div style={{
  color: '#c9d1d9'
}}>Wallet Types</div>
            </div>
            <div style={{
  textAlign: 'center'
}}>
              <div style={{
  fontWeight: 'bold'
}}>40%</div>
              <div style={{
  color: '#c9d1d9'
}}>Max APY</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Feature Grid */}
      <div style={{
  display: 'grid',
  gap: '24px'
}}>
        {Object.values(CRYPTO_FEATURES).map((feature) => (
          <Card 
            key={feature.id}
            style={{
  padding: '24px'
}}
            onClick={() => setSelectedFeature(feature)}
          >
            <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between'
}}>
              <div style={{
  padding: '8px',
  borderRadius: '12px'
}}>
                {feature.icon}
              </div>
              <div style={{
  display: 'flex'
}}>
                {getStatusBadge(feature.status)}
                {getCategoryBadge(feature.category)}
              </div>
            </div>
            
            <h3 style={{
  fontWeight: '600'
}}>{feature.title}</h3>
            <p style={{
  color: '#c9d1d9'
}}>{feature.description}</p>
            
            <div className="space-y-1">
              {feature.benefits.slice(0, 3).map((benefit, index) => (
                <div key={index} style={{
  display: 'flex',
  alignItems: 'center'
}}>
                  <CheckCircle style={{
  width: '12px',
  height: '12px'
}} />
                  <span style={{
  color: '#c9d1d9'
}}>{benefit}</span>
                </div>
              ))}
              {feature.benefits.length > 3 && (
                <div style={{
  color: '#c9d1d9'
}}>
                  +{feature.benefits.length - 3} more features
                </div>
              )}
            </div>
            
            <div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}}>
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab(feature.id);
                }}
                disabled={feature.status !== 'live'}
              >
                {feature.status === 'live' ? 'Try Now' : 'Coming Soon'}
              </Button>
              <ArrowRight style={{
  width: '16px',
  height: '16px',
  color: '#c9d1d9'
}} />
            </div>
          </Card>
        ))}
      </div>

      {/* Technology Stack */}
      <Card style={{
  padding: '24px'
}}>
        <h2 style={{
  fontWeight: 'bold'
}}>Technology Stack</h2>
        <div style={{
  display: 'grid',
  gap: '16px'
}}>
          <div style={{
  textAlign: 'center'
}}>
            <div className="text-3xl mb-2">⚡</div>
            <h3 style={{
  fontWeight: '600'
}}>Lightning Fast</h3>
            <p style={{
  color: '#c9d1d9'
}}>Optimized for performance</p>
          </div>
          <div style={{
  textAlign: 'center'
}}>
            <div className="text-3xl mb-2">🔒</div>
            <h3 style={{
  fontWeight: '600'
}}>Secure</h3>
            <p style={{
  color: '#c9d1d9'
}}>Military-grade encryption</p>
          </div>
          <div style={{
  textAlign: 'center'
}}>
            <div className="text-3xl mb-2">🌐</div>
            <h3 style={{
  fontWeight: '600'
}}>Multi-Chain</h3>
            <p style={{
  color: '#c9d1d9'
}}>Cross-chain compatible</p>
          </div>
          <div style={{
  textAlign: 'center'
}}>
            <div className="text-3xl mb-2">🚀</div>
            <h3 style={{
  fontWeight: '600'
}}>Scalable</h3>
            <p style={{
  color: '#c9d1d9'
}}>Built for growth</p>
          </div>
        </div>
      </Card>
    </div>
  );

  // Feature Detail Modal
  const FeatureDetailModal = () => {
    if (!selectedFeature) return null;

    return (
      <div style={{
  position: 'fixed',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
        <Card style={{
  width: '100%',
  marginLeft: '16px',
  marginRight: '16px'
}}>
          <div style={{
  padding: '24px'
}}>
            <div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start'
}}>
              <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                <div style={{
  padding: '8px',
  borderRadius: '12px'
}}>
                  {selectedFeature.icon}
                </div>
                <div>
                  <h2 style={{
  fontWeight: 'bold'
}}>{selectedFeature.title}</h2>
                  <p style={{
  color: '#c9d1d9'
}}>{selectedFeature.description}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                onClick={() => setSelectedFeature(null)}
              >
                ×
              </Button>
            </div>

            <div style={{
  display: 'flex'
}}>
              {getStatusBadge(selectedFeature.status)}
              {getCategoryBadge(selectedFeature.category)}
            </div>

            <div className="space-y-4">
              <h3 style={{
  fontWeight: '600'
}}>Key Features & Benefits:</h3>
              <div className="space-y-2">
                {selectedFeature.benefits.map((benefit, index) => (
                  <div key={index} style={{
  display: 'flex',
  alignItems: 'flex-start'
}}>
                    <CheckCircle style={{
  width: '16px',
  height: '16px'
}} />
                    <span style={{
  color: '#c9d1d9'
}}>{benefit}</span>
                  </div>
                ))}
              </div>

              <div style={{
  display: 'flex',
  justifyContent: 'flex-end'
}}>
                <Button variant="outline" onClick={() => setSelectedFeature(null)}>
                  Close
                </Button>
                {selectedFeature.status === 'live' && (
                  <Button onClick={() => {
                    setSelectedFeature(null);
                    setActiveTab(selectedFeature.id);
                  }}>
                    Try Feature
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}}>
        <div>
          <h1 style={{
  fontWeight: 'bold'
}}>Web3 Features</h1>
          <p style={{
  color: '#c9d1d9'
}}>Explore CRYB's comprehensive cryptocurrency and NFT capabilities</p>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List style={{
  display: 'grid',
  gap: '4px'
}}>
          <Tabs.Trigger value="overview">
            <Info style={{
  width: '16px',
  height: '16px'
}} />
            Overview
          </Tabs.Trigger>
          <Tabs.Trigger value="defi_yields">
            <TrendingUp style={{
  width: '16px',
  height: '16px'
}} />
            DeFi
          </Tabs.Trigger>
          <Tabs.Trigger value="crypto_payments">
            <Coins style={{
  width: '16px',
  height: '16px'
}} />
            Payments
          </Tabs.Trigger>
          <Tabs.Trigger value="token_gating">
            <Shield style={{
  width: '16px',
  height: '16px'
}} />
            Access
          </Tabs.Trigger>
          <Tabs.Trigger value="nft_profiles">
            <Image style={{
  width: '16px',
  height: '16px'
}} />
            NFTs
          </Tabs.Trigger>
          <Tabs.Trigger value="crypto_tipping">
            <Gift style={{
  width: '16px',
  height: '16px'
}} />
            Tipping
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="overview">
          <OverviewSection />
        </Tabs.Content>

        <Tabs.Content value="defi_yields">
          <YieldFarmingDashboard />
        </Tabs.Content>

        <Tabs.Content value="crypto_payments">
          <Card style={{
  padding: '24px'
}}>
            <h2 style={{
  fontWeight: 'bold'
}}>Crypto Payment System</h2>
            <p style={{
  color: '#c9d1d9'
}}>
              Comprehensive cryptocurrency payment gateway with fiat-to-crypto onboarding
            </p>
            <div className="space-y-4">
              <div style={{
  display: 'grid',
  gap: '16px'
}}>
                <Card style={{
  padding: '16px',
  textAlign: 'center'
}}>
                  <Coins style={{
  width: '32px',
  height: '32px'
}} />
                  <h3 style={{
  fontWeight: '600'
}}>Multi-Currency</h3>
                  <p style={{
  color: '#c9d1d9'
}}>BTC, ETH, USDC, CRYB</p>
                </Card>
                <Card style={{
  padding: '16px',
  textAlign: 'center'
}}>
                  <Shield style={{
  width: '32px',
  height: '32px'
}} />
                  <h3 style={{
  fontWeight: '600'
}}>Secure</h3>
                  <p style={{
  color: '#c9d1d9'
}}>Bank-grade security</p>
                </Card>
                <Card style={{
  padding: '16px',
  textAlign: 'center'
}}>
                  <Zap style={{
  width: '32px',
  height: '32px'
}} />
                  <h3 style={{
  fontWeight: '600'
}}>Instant</h3>
                  <p style={{
  color: '#c9d1d9'
}}>Real-time processing</p>
                </Card>
              </div>
            </div>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="token_gating">
          <TokenGatingPanel />
        </Tabs.Content>

        <Tabs.Content value="nft_profiles">
          <NFTProfileSystem />
        </Tabs.Content>

        <Tabs.Content value="crypto_tipping">
          <CryptoTippingSystem />
        </Tabs.Content>
      </Tabs.Root>

      {/* Feature Detail Modal */}
      <FeatureDetailModal />
    </div>
  );
};




export default CRYPTO_FEATURES
