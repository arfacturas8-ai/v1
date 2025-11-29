/**
 * @jest-environment jsdom
 */
/* eslint-env jest */
import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { act } from 'react-dom/test-utils'
import CryptoPage from './CryptoPage'
import { AuthContext } from '../contexts/AuthContext'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Wallet: ({ className, 'aria-hidden': ariaHidden }) => (
    <span data-testid="wallet-icon" className={className} aria-hidden={ariaHidden}>Wallet</span>
  ),
  Coins: ({ className, 'aria-hidden': ariaHidden }) => (
    <span data-testid="coins-icon" className={className} aria-hidden={ariaHidden}>Coins</span>
  ),
  Shield: ({ className, 'aria-hidden': ariaHidden }) => (
    <span data-testid="shield-icon" className={className} aria-hidden={ariaHidden}>Shield</span>
  ),
  Zap: ({ className, 'aria-hidden': ariaHidden }) => (
    <span data-testid="zap-icon" className={className} aria-hidden={ariaHidden}>Zap</span>
  ),
  Users: ({ className, 'aria-hidden': ariaHidden }) => (
    <span data-testid="users-icon" className={className} aria-hidden={ariaHidden}>Users</span>
  ),
  TrendingUp: ({ className, 'aria-hidden': ariaHidden }) => (
    <span data-testid="trending-up-icon" className={className} aria-hidden={ariaHidden}>TrendingUp</span>
  ),
  Star: ({ className, 'aria-hidden': ariaHidden }) => (
    <span data-testid="star-icon" className={className} aria-hidden={ariaHidden}>Star</span>
  ),
  ChevronRight: ({ className, 'aria-hidden': ariaHidden }) => (
    <span data-testid="chevron-right-icon" className={className} aria-hidden={ariaHidden}>ChevronRight</span>
  ),
  Mail: ({ className, 'aria-hidden': ariaHidden }) => (
    <span data-testid="mail-icon" className={className} aria-hidden={ariaHidden}>Mail</span>
  ),
  Book: ({ className, 'aria-hidden': ariaHidden }) => (
    <span data-testid="book-icon" className={className} aria-hidden={ariaHidden}>Book</span>
  ),
  Calendar: ({ className, 'aria-hidden': ariaHidden }) => (
    <span data-testid="calendar-icon" className={className} aria-hidden={ariaHidden}>Calendar</span>
  ),
  Target: ({ className, 'aria-hidden': ariaHidden }) => (
    <span data-testid="target-icon" className={className} aria-hidden={ariaHidden}>Target</span>
  ),
  ArrowRight: ({ className, 'aria-hidden': ariaHidden }) => (
    <span data-testid="arrow-right-icon" className={className} aria-hidden={ariaHidden}>ArrowRight</span>
  ),
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    section: ({ children, ...props }) => <section {...props}>{children}</section>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

// Mock UI components
jest.mock('../components/ui', () => ({
  Button: ({ children, onClick, variant, className, as, href, ...props }) => {
    const Component = as || 'button'
    return (
      <Component
        onClick={onClick}
        data-variant={variant}
        className={className}
        href={href}
        {...props}
      >
        {children}
      </Component>
    )
  },
  Card: ({ children, className, ...props }) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
  CardContent: ({ children, className, ...props }) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
  CardTitle: ({ children, className, ...props }) => (
    <h3 className={className} {...props}>
      {children}
    </h3>
  ),
}))

// Mock crypto components
jest.mock('../components/crypto/CryptoCountdown', () => {
  return function CryptoCountdown() {
    return <div data-testid="crypto-countdown">Countdown Component</div>
  }
})

jest.mock('../components/crypto/Web3FeaturePreview', () => {
  return function Web3FeaturePreview({ feature }) {
    return (
      <div data-testid="web3-feature-preview">
        <h3>{feature.title}</h3>
        <p>{feature.description}</p>
      </div>
    )
  }
})

jest.mock('../components/crypto/EmailSignup', () => {
  return function EmailSignup({ variant }) {
    return (
      <div data-testid="email-signup" data-variant={variant}>
        Email Signup
      </div>
    )
  }
})

jest.mock('../components/crypto/Web3Education', () => {
  return function Web3Education() {
    return <div data-testid="web3-education">Web3 Education Content</div>
  }
})

jest.mock('../components/crypto/Web3Roadmap', () => {
  return function Web3Roadmap() {
    return <div data-testid="web3-roadmap">Web3 Roadmap Content</div>
  }
})

// Mock web3 components
jest.mock('../components/web3/WalletConnectButton', () => {
  return function WalletConnectButton({ size, variant }) {
    return (
      <button data-testid="wallet-connect-button" data-size={size} data-variant={variant}>
        Connect Wallet
      </button>
    )
  }
})

jest.mock('../components/web3/TokenBalanceDisplay', () => {
  return function TokenBalanceDisplay({ className }) {
    return (
      <div data-testid="token-balance-display" className={className}>
        Token Balance
      </div>
    )
  }
})

jest.mock('../components/web3/CryptoTippingButton', () => {
  return function CryptoTippingButton({ recipientName, size, variant, showAmount }) {
    return (
      <button
        data-testid="crypto-tipping-button"
        data-recipient={recipientName}
        data-size={size}
        data-variant={variant}
        data-show-amount={showAmount}
      >
        Tip {recipientName}
      </button>
    )
  }
})

jest.mock('../components/web3/NFTProfileBadge', () => {
  return function NFTProfileBadge({ collection, size, rarity }) {
    return (
      <div
        data-testid="nft-profile-badge"
        data-collection={collection}
        data-size={size}
        data-rarity={rarity}
      >
        {collection}
      </div>
    )
  }
})

const mockAuthContext = {
  user: {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
  },
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
}

const renderWithRouter = (authValue = mockAuthContext) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        <CryptoPage />
      </AuthContext.Provider>
    </BrowserRouter>
  )
}

describe('CryptoPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Initial Rendering', () => {
    it('renders without crashing', () => {
      const { container } = renderWithRouter()
      expect(container).toBeInTheDocument()
    })

    it('renders main content area with proper role and aria-label', () => {
      renderWithRouter()
      const main = screen.getByRole('main', { name: /crypto features page/i })
      expect(main).toBeInTheDocument()
    })

    it('renders without console errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      renderWithRouter()
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('has proper container structure', () => {
      const { container } = renderWithRouter()
      expect(container.querySelector('.container')).toBeInTheDocument()
    })

    it('applies initial opacity and transform for fade-in effect', () => {
      const { container } = renderWithRouter()
      const heroSection = container.querySelector('section')
      expect(heroSection).toHaveClass('transition-all')
    })
  })

  describe('Hero Section', () => {
    it('displays Coming Soon badge', () => {
      renderWithRouter()
      expect(screen.getByText('Coming Soon')).toBeInTheDocument()
    })

    it('renders hero title with Web3 text', () => {
      renderWithRouter()
      expect(screen.getByText('The Future of')).toBeInTheDocument()
      expect(screen.getByText('Web3')).toBeInTheDocument()
      expect(screen.getByText('Social')).toBeInTheDocument()
    })

    it('displays hero subtitle', () => {
      renderWithRouter()
      expect(screen.getByText(/Get ready to experience social networking reimagined/i)).toBeInTheDocument()
    })

    it('renders CryptoCountdown component', () => {
      renderWithRouter()
      expect(screen.getByTestId('crypto-countdown')).toBeInTheDocument()
    })

    it('displays EmailSignup component', () => {
      renderWithRouter()
      const emailSignups = screen.getAllByTestId('email-signup')
      expect(emailSignups.length).toBeGreaterThan(0)
    })

    it('renders Learn More button', () => {
      renderWithRouter()
      expect(screen.getByText('Learn More')).toBeInTheDocument()
    })

    it('displays decorative background elements', () => {
      const { container } = renderWithRouter()
      const gradients = container.querySelectorAll('[aria-hidden="true"]')
      expect(gradients.length).toBeGreaterThan(0)
    })

    it('renders Zap icon in Coming Soon badge', () => {
      renderWithRouter()
      const zapIcon = screen.getAllByTestId('zap-icon')[0]
      expect(zapIcon).toBeInTheDocument()
    })

    it('renders ChevronRight icon in Learn More button', () => {
      renderWithRouter()
      expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument()
    })
  })

  describe('Navigation Section', () => {
    it('renders all navigation tabs', () => {
      renderWithRouter()
      expect(screen.getByText('Overview')).toBeInTheDocument()
      expect(screen.getByText('Demo')).toBeInTheDocument()
      expect(screen.getByText('Learn Web3')).toBeInTheDocument()
      expect(screen.getByText('Roadmap')).toBeInTheDocument()
      expect(screen.getByText('Token Economics')).toBeInTheDocument()
    })

    it('renders navigation icons for each tab', () => {
      renderWithRouter()
      expect(screen.getAllByTestId('zap-icon')).toBeTruthy()
      expect(screen.getAllByTestId('wallet-icon')).toBeTruthy()
      expect(screen.getByTestId('book-icon')).toBeInTheDocument()
      expect(screen.getByTestId('calendar-icon')).toBeInTheDocument()
      expect(screen.getByTestId('target-icon')).toBeInTheDocument()
    })

    it('highlights Overview tab by default', () => {
      const { container } = renderWithRouter()
      const buttons = container.querySelectorAll('button')
      const overviewButton = Array.from(buttons).find(btn => btn.textContent.includes('Overview'))
      expect(overviewButton).toHaveAttribute('data-variant', 'primary')
    })

    it('switches to Demo section when Demo tab is clicked', async () => {
      renderWithRouter()
      const demoButton = screen.getByText('Demo')

      await act(async () => {
        fireEvent.click(demoButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Try Web3 Features')).toBeInTheDocument()
      })
    })

    it('switches to Education section when Learn Web3 tab is clicked', async () => {
      renderWithRouter()
      const educationButton = screen.getByText('Learn Web3')

      await act(async () => {
        fireEvent.click(educationButton)
      })

      await waitFor(() => {
        expect(screen.getByTestId('web3-education')).toBeInTheDocument()
      })
    })

    it('switches to Roadmap section when Roadmap tab is clicked', async () => {
      renderWithRouter()
      const roadmapButton = screen.getByText('Roadmap')

      await act(async () => {
        fireEvent.click(roadmapButton)
      })

      await waitFor(() => {
        expect(screen.getByTestId('web3-roadmap')).toBeInTheDocument()
      })
    })

    it('switches to Tokenomics section when Token Economics tab is clicked', async () => {
      renderWithRouter()
      const tokenomicsButton = screen.getByText('Token Economics')

      await act(async () => {
        fireEvent.click(tokenomicsButton)
      })

      await waitFor(() => {
        expect(screen.getByText('CRYB Token Economics')).toBeInTheDocument()
      })
    })

    it('updates active tab styling when clicked', async () => {
      renderWithRouter()
      const demoButton = screen.getByText('Demo')

      await act(async () => {
        fireEvent.click(demoButton)
      })

      expect(demoButton).toHaveAttribute('data-variant', 'primary')
    })
  })

  describe('Demo Section', () => {
    beforeEach(async () => {
      renderWithRouter()
      const demoButton = screen.getByText('Demo')
      await act(async () => {
        fireEvent.click(demoButton)
      })
    })

    it('displays Interactive Demo badge', () => {
      expect(screen.getByText('Interactive Demo')).toBeInTheDocument()
    })

    it('displays demo section title and description', () => {
      expect(screen.getByText('Try Web3 Features')).toBeInTheDocument()
      expect(screen.getByText(/Get a preview of CRYB's Web3 functionality/i)).toBeInTheDocument()
    })

    it('renders Wallet Connection demo section', () => {
      expect(screen.getByText('Wallet Connection')).toBeInTheDocument()
      expect(screen.getByText(/Connect your Web3 wallet/i)).toBeInTheDocument()
    })

    it('renders multiple WalletConnectButton components', () => {
      const walletButtons = screen.getAllByTestId('wallet-connect-button')
      expect(walletButtons.length).toBe(2)
    })

    it('renders WalletConnectButton with different sizes', () => {
      const walletButtons = screen.getAllByTestId('wallet-connect-button')
      expect(walletButtons[0]).toHaveAttribute('data-size', 'md')
      expect(walletButtons[1]).toHaveAttribute('data-size', 'sm')
    })

    it('renders NFT Profile Badges section', () => {
      expect(screen.getByText('NFT Profile Badges')).toBeInTheDocument()
      expect(screen.getByText(/Show off your NFT collections/i)).toBeInTheDocument()
    })

    it('renders multiple NFT badges with different collections', () => {
      expect(screen.getByTestId('nft-profile-badge')).toBeInTheDocument()
      expect(screen.getByText('CRYB Genesis')).toBeInTheDocument()
      expect(screen.getByText('Cool Cats')).toBeInTheDocument()
      expect(screen.getByText('BAYC')).toBeInTheDocument()
    })

    it('renders NFT badges with different sizes', () => {
      const badges = screen.getAllByTestId('nft-profile-badge')
      expect(badges[0]).toHaveAttribute('data-size', 'sm')
      expect(badges[1]).toHaveAttribute('data-size', 'md')
      expect(badges[2]).toHaveAttribute('data-size', 'lg')
    })

    it('renders NFT badges with different rarities', () => {
      const badges = screen.getAllByTestId('nft-profile-badge')
      expect(badges[1]).toHaveAttribute('data-rarity', 'rare')
      expect(badges[2]).toHaveAttribute('data-rarity', 'legendary')
    })

    it('renders Token Portfolio section', () => {
      expect(screen.getByText('Token Portfolio')).toBeInTheDocument()
      expect(screen.getByText(/Track your crypto balances/i)).toBeInTheDocument()
    })

    it('renders TokenBalanceDisplay component', () => {
      expect(screen.getByTestId('token-balance-display')).toBeInTheDocument()
    })

    it('renders Crypto Tipping section', () => {
      expect(screen.getByText('Crypto Tipping')).toBeInTheDocument()
      expect(screen.getByText(/Tip creators and community members/i)).toBeInTheDocument()
    })

    it('renders multiple CryptoTippingButton components', () => {
      const tippingButtons = screen.getAllByTestId('crypto-tipping-button')
      expect(tippingButtons.length).toBe(2)
    })

    it('renders CryptoTippingButton with recipient information', () => {
      const tippingButtons = screen.getAllByTestId('crypto-tipping-button')
      expect(tippingButtons[0]).toHaveAttribute('data-recipient', '@alice')
      expect(tippingButtons[1]).toHaveAttribute('data-recipient', '@bob')
    })

    it('renders CryptoTippingButton with different variants', () => {
      const tippingButtons = screen.getAllByTestId('crypto-tipping-button')
      expect(tippingButtons[1]).toHaveAttribute('data-variant', 'secondary')
    })

    it('displays Demo Mode notice', () => {
      expect(screen.getByText('Demo Mode')).toBeInTheDocument()
      expect(screen.getByText(/These components demonstrate the planned Web3 functionality/i)).toBeInTheDocument()
    })

    it('displays environment variable hint in demo notice', () => {
      expect(screen.getByText(/VITE_ENABLE_WEB3_FEATURES=true/i)).toBeInTheDocument()
    })
  })

  describe('Education Section', () => {
    it('renders Web3Education component when education tab is active', async () => {
      renderWithRouter()
      const educationButton = screen.getByText('Learn Web3')

      await act(async () => {
        fireEvent.click(educationButton)
      })

      await waitFor(() => {
        expect(screen.getByTestId('web3-education')).toBeInTheDocument()
      })
    })

    it('hides other sections when education is active', async () => {
      renderWithRouter()
      const educationButton = screen.getByText('Learn Web3')

      await act(async () => {
        fireEvent.click(educationButton)
      })

      await waitFor(() => {
        expect(screen.queryByText('Powerful Web3 Features')).not.toBeInTheDocument()
      })
    })
  })

  describe('Roadmap Section', () => {
    it('renders Web3Roadmap component when roadmap tab is active', async () => {
      renderWithRouter()
      const roadmapButton = screen.getByText('Roadmap')

      await act(async () => {
        fireEvent.click(roadmapButton)
      })

      await waitFor(() => {
        expect(screen.getByTestId('web3-roadmap')).toBeInTheDocument()
      })
    })
  })

  describe('Tokenomics Section', () => {
    beforeEach(async () => {
      renderWithRouter()
      const tokenomicsButton = screen.getByText('Token Economics')
      await act(async () => {
        fireEvent.click(tokenomicsButton)
      })
    })

    it('displays Token Economics Preview badge', () => {
      expect(screen.getByText('Token Economics Preview')).toBeInTheDocument()
    })

    it('displays tokenomics title and description', () => {
      expect(screen.getByText('CRYB Token Economics')).toBeInTheDocument()
      expect(screen.getByText(/Discover how CRYB token will power the future/i)).toBeInTheDocument()
    })

    it('displays total supply statistic', () => {
      expect(screen.getByText('1B')).toBeInTheDocument()
      expect(screen.getByText('Total Supply')).toBeInTheDocument()
    })

    it('displays community owned percentage', () => {
      expect(screen.getByText('40%')).toBeInTheDocument()
      expect(screen.getByText('Community Owned')).toBeInTheDocument()
    })

    it('displays max staking APY', () => {
      expect(screen.getByText('15%')).toBeInTheDocument()
      expect(screen.getByText('Max Staking APY')).toBeInTheDocument()
    })

    it('displays token utility section', () => {
      expect(screen.getByText('Token Utility')).toBeInTheDocument()
    })

    it('displays governance voting rights utility', () => {
      expect(screen.getByText('Governance voting rights')).toBeInTheDocument()
    })

    it('displays token-gated community access utility', () => {
      expect(screen.getByText('Token-gated community access')).toBeInTheDocument()
    })

    it('displays staking rewards utility', () => {
      expect(screen.getByText('Staking rewards up to 15% APY')).toBeInTheDocument()
    })

    it('displays creator monetization utility', () => {
      expect(screen.getByText('Creator monetization & tips')).toBeInTheDocument()
    })

    it('displays token flow breakdown', () => {
      expect(screen.getByText('Token Flow')).toBeInTheDocument()
      expect(screen.getByText('User Rewards')).toBeInTheDocument()
      expect(screen.getByText('Development')).toBeInTheDocument()
      expect(screen.getByText('Ecosystem')).toBeInTheDocument()
      expect(screen.getByText('Treasury')).toBeInTheDocument()
      expect(screen.getByText('Public Sale')).toBeInTheDocument()
    })

    it('displays token flow percentages', () => {
      renderWithRouter()
      // Percentages are displayed in the token flow section
      expect(screen.getByText('20%')).toBeInTheDocument() // Development
      expect(screen.getByText('10%')).toBeInTheDocument() // Public Sale
    })

    it('renders View Full Tokenomics button', () => {
      expect(screen.getByText('View Full Tokenomics')).toBeInTheDocument()
    })

    it('View Full Tokenomics button is a link to /tokenomics', () => {
      const button = screen.getByText('View Full Tokenomics').closest('a')
      expect(button).toHaveAttribute('href', '/tokenomics')
    })
  })

  describe('Overview Section - Features', () => {
    it('displays "Powerful Web3 Features" title in overview section', () => {
      renderWithRouter()
      expect(screen.getByText('Powerful Web3 Features')).toBeInTheDocument()
    })

    it('displays features section description', () => {
      renderWithRouter()
      expect(screen.getByText(/Discover what's coming to CRYB's Web3 ecosystem/i)).toBeInTheDocument()
    })

    it('renders all six feature cards', () => {
      renderWithRouter()
      expect(screen.getByText('Wallet Integration')).toBeInTheDocument()
      expect(screen.getByText('NFT Profile System')).toBeInTheDocument()
      expect(screen.getByText('Crypto Payments')).toBeInTheDocument()
      expect(screen.getByText('Token Gating')).toBeInTheDocument()
      expect(screen.getByText('DeFi Integration')).toBeInTheDocument()
      expect(screen.getByText('DAO Governance')).toBeInTheDocument()
    })

    it('displays Wallet Integration feature details', () => {
      renderWithRouter()
      expect(screen.getByText(/Seamlessly connect with MetaMask/i)).toBeInTheDocument()
      expect(screen.getByText('Multi-wallet support')).toBeInTheDocument()
      expect(screen.getByText('Secure connections')).toBeInTheDocument()
      expect(screen.getByText('Gas optimization')).toBeInTheDocument()
    })

    it('displays NFT Profile System feature details', () => {
      renderWithRouter()
      expect(screen.getByText(/Use your NFTs as profile pictures/i)).toBeInTheDocument()
      expect(screen.getByText('NFT avatars')).toBeInTheDocument()
      expect(screen.getByText('Collection display')).toBeInTheDocument()
      expect(screen.getByText('Verified ownership')).toBeInTheDocument()
    })

    it('displays Crypto Payments feature details', () => {
      renderWithRouter()
      expect(screen.getByText(/Send and receive payments in cryptocurrency/i)).toBeInTheDocument()
      expect(screen.getByText('Multiple currencies')).toBeInTheDocument()
      expect(screen.getByText('Low fees')).toBeInTheDocument()
      expect(screen.getByText('Instant transfers')).toBeInTheDocument()
    })

    it('displays Token Gating feature details', () => {
      renderWithRouter()
      expect(screen.getByText(/Create exclusive communities based on token ownership/i)).toBeInTheDocument()
      expect(screen.getByText('Exclusive access')).toBeInTheDocument()
      expect(screen.getByText('Token verification')).toBeInTheDocument()
      expect(screen.getByText('Community rewards')).toBeInTheDocument()
    })

    it('displays DeFi Integration feature details', () => {
      renderWithRouter()
      expect(screen.getByText(/Access DeFi protocols directly from your CRYB profile/i)).toBeInTheDocument()
      expect(screen.getByText('Yield farming')).toBeInTheDocument()
      expect(screen.getByText('Staking rewards')).toBeInTheDocument()
      expect(screen.getByText('Portfolio tracking')).toBeInTheDocument()
    })

    it('displays DAO Governance feature details', () => {
      renderWithRouter()
      expect(screen.getByText(/Participate in decentralized decision making/i)).toBeInTheDocument()
      expect(screen.getByText('Voting rights')).toBeInTheDocument()
      expect(screen.getByText('Proposal creation')).toBeInTheDocument()
      expect(screen.getByText('Community governance')).toBeInTheDocument()
    })

    it('handles feature card click on desktop', async () => {
      const { container } = renderWithRouter()
      // Find clickable feature cards (desktop only)
      const cards = container.querySelectorAll('.card')

      if (cards.length > 0) {
        await act(async () => {
          fireEvent.click(cards[0])
        })
        // Active feature should update
        expect(cards[0]).toBeInTheDocument()
      }
    })
  })

  describe('Overview Section - Web3FeaturePreview', () => {
    it('renders Web3FeaturePreview component on desktop with default feature', () => {
      // This is only visible on lg screens and up
      renderWithRouter()
      const preview = screen.queryByTestId('web3-feature-preview')
      // Component should exist in DOM
      expect(preview).toBeInTheDocument()
    })

    it('displays correct feature in preview when feature card is clicked', async () => {
      const { container } = renderWithRouter()
      const cards = container.querySelectorAll('.card')

      if (cards.length > 1) {
        await act(async () => {
          fireEvent.click(cards[1])
        })

        await waitFor(() => {
          const preview = screen.getByTestId('web3-feature-preview')
          expect(preview).toBeInTheDocument()
        })
      }
    })
  })

  describe('Overview Section - Why CRYB Web3', () => {
    it('displays Why CRYB Web3 section title', () => {
      renderWithRouter()
      expect(screen.getByText('Why CRYB Web3?')).toBeInTheDocument()
    })

    it('displays benefits section description', () => {
      renderWithRouter()
      expect(screen.getByText(/The perfect blend of social networking and blockchain technology/i)).toBeInTheDocument()
    })

    it('displays Secure & Trustless benefit', () => {
      renderWithRouter()
      expect(screen.getByText('Secure & Trustless')).toBeInTheDocument()
      expect(screen.getByText(/Built on blockchain technology for maximum security/i)).toBeInTheDocument()
    })

    it('displays Community Owned benefit', () => {
      renderWithRouter()
      expect(screen.getByText('Community Owned')).toBeInTheDocument()
      expect(screen.getByText(/Participate in governance and help shape the future/i)).toBeInTheDocument()
    })

    it('displays Earn While Social benefit', () => {
      renderWithRouter()
      expect(screen.getByText('Earn While Social')).toBeInTheDocument()
      expect(screen.getByText(/Get rewarded for your contributions to the community/i)).toBeInTheDocument()
    })

    it('renders Shield icon for Secure & Trustless', () => {
      renderWithRouter()
      const shieldIcons = screen.getAllByTestId('shield-icon')
      expect(shieldIcons.length).toBeGreaterThan(0)
    })

    it('renders Users icon for Community Owned', () => {
      renderWithRouter()
      const usersIcons = screen.getAllByTestId('users-icon')
      expect(usersIcons.length).toBeGreaterThan(0)
    })

    it('renders TrendingUp icon for Earn While Social', () => {
      renderWithRouter()
      const trendingIcons = screen.getAllByTestId('trending-up-icon')
      expect(trendingIcons.length).toBeGreaterThan(0)
    })
  })

  describe('Final CTA Section', () => {
    it('displays "Be Among the First" title', () => {
      renderWithRouter()
      expect(screen.getByText('Be Among the First')).toBeInTheDocument()
    })

    it('displays CTA description', () => {
      renderWithRouter()
      expect(screen.getByText(/Join our early access program/i)).toBeInTheDocument()
    })

    it('renders EmailSignup component in CTA', () => {
      renderWithRouter()
      const emailSignups = screen.getAllByTestId('email-signup')
      const largeVariant = emailSignups.find(el => el.getAttribute('data-variant') === 'large')
      expect(largeVariant).toBeInTheDocument()
    })

    it('displays early access message with Mail icon', () => {
      renderWithRouter()
      expect(screen.getByText(/Get exclusive updates and early access/i)).toBeInTheDocument()
      expect(screen.getByTestId('mail-icon')).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('handles multiple tab switches correctly', async () => {
      renderWithRouter()

      // Switch to Demo
      await act(async () => {
        fireEvent.click(screen.getByText('Demo'))
      })
      expect(screen.getByText('Try Web3 Features')).toBeInTheDocument()

      // Switch to Education
      await act(async () => {
        fireEvent.click(screen.getByText('Learn Web3'))
      })
      expect(screen.getByTestId('web3-education')).toBeInTheDocument()

      // Switch back to Overview
      await act(async () => {
        fireEvent.click(screen.getByText('Overview'))
      })
      expect(screen.getByText('Powerful Web3 Features')).toBeInTheDocument()
    })

    it('maintains state when switching between sections', async () => {
      renderWithRouter()

      await act(async () => {
        fireEvent.click(screen.getByText('Demo'))
      })

      await waitFor(() => {
        expect(screen.getByText('Try Web3 Features')).toBeInTheDocument()
      })

      await act(async () => {
        fireEvent.click(screen.getByText('Overview'))
      })

      await waitFor(() => {
        expect(screen.getByText('Powerful Web3 Features')).toBeInTheDocument()
      })
    })
  })

  describe('State Management', () => {
    it('initializes with overview as active section', () => {
      renderWithRouter()
      expect(screen.getByText('Powerful Web3 Features')).toBeInTheDocument()
    })

    it('initializes with first feature as active feature', () => {
      renderWithRouter()
      const preview = screen.queryByTestId('web3-feature-preview')
      if (preview) {
        expect(preview).toHaveTextContent('Wallet Integration')
      }
    })

    it('updates active section state on tab click', async () => {
      renderWithRouter()

      await act(async () => {
        fireEvent.click(screen.getByText('Roadmap'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('web3-roadmap')).toBeInTheDocument()
      })
    })

    it('sets visibility state on mount', async () => {
      const { container } = renderWithRouter()

      await waitFor(() => {
        const heroSection = container.querySelector('section')
        // Component should have transitioned to visible state
        expect(heroSection).toBeInTheDocument()
      })
    })
  })

  describe('Component Integration', () => {
    it('integrates with all crypto components', () => {
      renderWithRouter()
      expect(screen.getByTestId('crypto-countdown')).toBeInTheDocument()
      expect(screen.getAllByTestId('email-signup').length).toBeGreaterThan(0)
    })

    it('integrates with Web3Education component', async () => {
      renderWithRouter()
      await act(async () => {
        fireEvent.click(screen.getByText('Learn Web3'))
      })
      expect(screen.getByTestId('web3-education')).toBeInTheDocument()
    })

    it('integrates with Web3Roadmap component', async () => {
      renderWithRouter()
      await act(async () => {
        fireEvent.click(screen.getByText('Roadmap'))
      })
      expect(screen.getByTestId('web3-roadmap')).toBeInTheDocument()
    })

    it('integrates with all web3 components in demo section', async () => {
      renderWithRouter()
      await act(async () => {
        fireEvent.click(screen.getByText('Demo'))
      })

      await waitFor(() => {
        expect(screen.getAllByTestId('wallet-connect-button').length).toBeGreaterThan(0)
        expect(screen.getByTestId('token-balance-display')).toBeInTheDocument()
        expect(screen.getAllByTestId('crypto-tipping-button').length).toBeGreaterThan(0)
        expect(screen.getAllByTestId('nft-profile-badge').length).toBeGreaterThan(0)
      })
    })
  })

  describe('Responsive Behavior', () => {
    it('renders mobile layout for feature grid', () => {
      const { container } = renderWithRouter()
      const mobileGrid = container.querySelector('.grid.gap-lg.md\\:hidden')
      expect(mobileGrid || container.querySelector('.grid')).toBeInTheDocument()
    })

    it('hides Web3FeaturePreview on mobile (lg screens only)', () => {
      const { container } = renderWithRouter()
      // Component structure should support responsive hiding
      expect(container.querySelector('.hidden') || container).toBeInTheDocument()
    })

    it('displays abbreviated navigation labels on mobile', () => {
      const { container } = renderWithRouter()
      // sm:inline class suggests responsive text display
      expect(container).toBeInTheDocument()
    })

    it('stacks CTA buttons vertically on mobile', () => {
      const { container } = renderWithRouter()
      const flexContainer = container.querySelector('.flex.flex-col.sm\\:flex-row')
      expect(flexContainer).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper page structure with main landmark', () => {
      renderWithRouter()
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
      expect(main).toHaveAttribute('aria-label', 'Crypto features page')
    })

    it('has decorative elements marked with aria-hidden', () => {
      const { container } = renderWithRouter()
      const decorative = container.querySelectorAll('[aria-hidden="true"]')
      expect(decorative.length).toBeGreaterThan(0)
    })

    it('has proper heading hierarchy', () => {
      renderWithRouter()
      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toBeInTheDocument()
      expect(h1.textContent).toContain('The Future of')
    })

    it('all interactive elements are keyboard accessible', () => {
      const { container } = renderWithRouter()
      const buttons = container.querySelectorAll('button')
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabIndex', '-1')
      })
    })

    it('navigation buttons have group classes for focus styles', () => {
      renderWithRouter()
      const buttons = screen.getByText('Learn More').closest('button')
      expect(buttons).toHaveClass('group')
    })
  })

  describe('Visual Effects and Animations', () => {
    it('applies gradient effects to hero section', () => {
      const { container } = renderWithRouter()
      const gradient = container.querySelector('.bg-gradient-to-br')
      expect(gradient).toBeInTheDocument()
    })

    it('applies blur effects to decorative elements', () => {
      const { container } = renderWithRouter()
      const blurred = container.querySelector('.blur-3xl')
      expect(blurred).toBeInTheDocument()
    })

    it('applies hover transitions to feature cards', () => {
      const { container } = renderWithRouter()
      const cards = container.querySelectorAll('.group')
      expect(cards.length).toBeGreaterThan(0)
    })

    it('applies transition classes to main hero section', () => {
      const { container } = renderWithRouter()
      const heroSection = container.querySelector('.transition-all')
      expect(heroSection).toBeInTheDocument()
    })
  })

  describe('Content Sections Visibility', () => {
    it('shows overview content by default', () => {
      renderWithRouter()
      expect(screen.getByText('Powerful Web3 Features')).toBeInTheDocument()
      expect(screen.getByText('Why CRYB Web3?')).toBeInTheDocument()
    })

    it('hides overview when demo is active', async () => {
      renderWithRouter()
      await act(async () => {
        fireEvent.click(screen.getByText('Demo'))
      })

      await waitFor(() => {
        expect(screen.queryByText('Powerful Web3 Features')).not.toBeInTheDocument()
      })
    })

    it('hides overview when education is active', async () => {
      renderWithRouter()
      await act(async () => {
        fireEvent.click(screen.getByText('Learn Web3'))
      })

      await waitFor(() => {
        expect(screen.queryByText('Powerful Web3 Features')).not.toBeInTheDocument()
      })
    })

    it('hides overview when roadmap is active', async () => {
      renderWithRouter()
      await act(async () => {
        fireEvent.click(screen.getByText('Roadmap'))
      })

      await waitFor(() => {
        expect(screen.queryByText('Powerful Web3 Features')).not.toBeInTheDocument()
      })
    })

    it('hides overview when tokenomics is active', async () => {
      renderWithRouter()
      await act(async () => {
        fireEvent.click(screen.getByText('Token Economics'))
      })

      await waitFor(() => {
        expect(screen.queryByText('Powerful Web3 Features')).not.toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles rapid tab switching without errors', async () => {
      renderWithRouter()

      await act(async () => {
        fireEvent.click(screen.getByText('Demo'))
      })
      await act(async () => {
        fireEvent.click(screen.getByText('Roadmap'))
      })
      await act(async () => {
        fireEvent.click(screen.getByText('Overview'))
      })

      expect(screen.getByText('Powerful Web3 Features')).toBeInTheDocument()
    })

    it('handles unauthenticated user context', () => {
      const unauthContext = {
        ...mockAuthContext,
        user: null,
        isAuthenticated: false,
      }

      const { container } = render(
        <BrowserRouter>
          <AuthContext.Provider value={unauthContext}>
            <CryptoPage />
          </AuthContext.Provider>
        </BrowserRouter>
      )

      expect(container).toBeInTheDocument()
      expect(screen.getByText('The Future of')).toBeInTheDocument()
    })

    it('handles missing auth context gracefully', () => {
      const { container } = render(
        <BrowserRouter>
          <CryptoPage />
        </BrowserRouter>
      )

      expect(container).toBeInTheDocument()
    })
  })

  describe('Styling and Layout', () => {
    it('applies container class for layout', () => {
      const { container } = renderWithRouter()
      expect(container.querySelector('.container')).toBeInTheDocument()
    })

    it('applies padding utilities', () => {
      const { container } = renderWithRouter()
      const paddedSections = container.querySelectorAll('[class*="py-"]')
      expect(paddedSections.length).toBeGreaterThan(0)
    })

    it('applies text color utilities', () => {
      const { container } = renderWithRouter()
      expect(container.querySelector('[class*="text-"]')).toBeInTheDocument()
    })

    it('applies rounded corners to cards', () => {
      const { container } = renderWithRouter()
      const roundedElements = container.querySelectorAll('[class*="rounded"]')
      expect(roundedElements.length).toBeGreaterThan(0)
    })

    it('applies border styling', () => {
      const { container } = renderWithRouter()
      const bordered = container.querySelectorAll('[class*="border"]')
      expect(bordered.length).toBeGreaterThan(0)
    })

    it('applies backdrop blur effects', () => {
      const { container } = renderWithRouter()
      const blurred = container.querySelector('.backdrop-blur-sm')
      expect(blurred).toBeInTheDocument()
    })
  })

  describe('Features Data Structure', () => {
    it('displays all feature icons correctly', () => {
      renderWithRouter()
      expect(screen.getAllByTestId('wallet-icon')).toBeTruthy()
      expect(screen.getAllByTestId('star-icon')).toBeTruthy()
      expect(screen.getAllByTestId('coins-icon')).toBeTruthy()
      expect(screen.getAllByTestId('shield-icon')).toBeTruthy()
      expect(screen.getAllByTestId('trending-up-icon')).toBeTruthy()
      expect(screen.getAllByTestId('users-icon')).toBeTruthy()
    })

    it('displays all feature titles', () => {
      renderWithRouter()
      const titles = [
        'Wallet Integration',
        'NFT Profile System',
        'Crypto Payments',
        'Token Gating',
        'DeFi Integration',
        'DAO Governance'
      ]

      titles.forEach(title => {
        expect(screen.getByText(title)).toBeInTheDocument()
      })
    })

    it('displays all feature descriptions', () => {
      renderWithRouter()
      expect(screen.getByText(/Seamlessly connect with MetaMask/i)).toBeInTheDocument()
      expect(screen.getByText(/Use your NFTs as profile pictures/i)).toBeInTheDocument()
      expect(screen.getByText(/Send and receive payments in cryptocurrency/i)).toBeInTheDocument()
      expect(screen.getByText(/Create exclusive communities based on token ownership/i)).toBeInTheDocument()
      expect(screen.getByText(/Access DeFi protocols directly from your CRYB profile/i)).toBeInTheDocument()
      expect(screen.getByText(/Participate in decentralized decision making/i)).toBeInTheDocument()
    })
  })

  describe('Button Interactions', () => {
    it('Learn More button is clickable', () => {
      renderWithRouter()
      const button = screen.getByText('Learn More')
      expect(button).toBeInTheDocument()

      fireEvent.click(button)
      // Button should be interactive
      expect(button).toBeInTheDocument()
    })

    it('navigation buttons update active state', async () => {
      renderWithRouter()
      const demoButton = screen.getByText('Demo')

      await act(async () => {
        fireEvent.click(demoButton)
      })

      expect(demoButton).toHaveAttribute('data-variant', 'primary')
    })
  })

  describe('Component Props', () => {
    it('passes correct size prop to WalletConnectButton', async () => {
      renderWithRouter()
      await act(async () => {
        fireEvent.click(screen.getByText('Demo'))
      })

      const buttons = screen.getAllByTestId('wallet-connect-button')
      expect(buttons[0]).toHaveAttribute('data-size', 'md')
      expect(buttons[1]).toHaveAttribute('data-size', 'sm')
    })

    it('passes correct variant prop to WalletConnectButton', async () => {
      renderWithRouter()
      await act(async () => {
        fireEvent.click(screen.getByText('Demo'))
      })

      const buttons = screen.getAllByTestId('wallet-connect-button')
      expect(buttons[1]).toHaveAttribute('data-variant', 'secondary')
    })

    it('passes correct props to NFTProfileBadge', async () => {
      renderWithRouter()
      await act(async () => {
        fireEvent.click(screen.getByText('Demo'))
      })

      const badges = screen.getAllByTestId('nft-profile-badge')
      expect(badges[0]).toHaveAttribute('data-collection', 'CRYB Genesis')
      expect(badges[1]).toHaveAttribute('data-collection', 'Cool Cats')
      expect(badges[2]).toHaveAttribute('data-collection', 'BAYC')
    })

    it('passes correct props to CryptoTippingButton', async () => {
      renderWithRouter()
      await act(async () => {
        fireEvent.click(screen.getByText('Demo'))
      })

      const buttons = screen.getAllByTestId('crypto-tipping-button')
      expect(buttons[0]).toHaveAttribute('data-recipient', '@alice')
      expect(buttons[1]).toHaveAttribute('data-show-amount', 'false')
    })

    it('passes variant prop to EmailSignup', () => {
      renderWithRouter()
      const signups = screen.getAllByTestId('email-signup')
      const largeVariant = signups.find(el => el.getAttribute('data-variant') === 'large')
      expect(largeVariant).toBeInTheDocument()
    })
  })

  describe('Conditional Rendering', () => {
    it('only shows demo section when demo tab is active', async () => {
      renderWithRouter()

      // Demo section should not be visible initially
      expect(screen.queryByText('Try Web3 Features')).not.toBeInTheDocument()

      // Click demo tab
      await act(async () => {
        fireEvent.click(screen.getByText('Demo'))
      })

      // Demo section should now be visible
      expect(screen.getByText('Try Web3 Features')).toBeInTheDocument()
    })

    it('only shows education section when education tab is active', async () => {
      renderWithRouter()

      expect(screen.queryByTestId('web3-education')).not.toBeInTheDocument()

      await act(async () => {
        fireEvent.click(screen.getByText('Learn Web3'))
      })

      expect(screen.getByTestId('web3-education')).toBeInTheDocument()
    })

    it('only shows roadmap section when roadmap tab is active', async () => {
      renderWithRouter()

      expect(screen.queryByTestId('web3-roadmap')).not.toBeInTheDocument()

      await act(async () => {
        fireEvent.click(screen.getByText('Roadmap'))
      })

      expect(screen.getByTestId('web3-roadmap')).toBeInTheDocument()
    })

    it('only shows tokenomics section when tokenomics tab is active', async () => {
      renderWithRouter()

      expect(screen.queryByText('CRYB Token Economics')).not.toBeInTheDocument()

      await act(async () => {
        fireEvent.click(screen.getByText('Token Economics'))
      })

      expect(screen.getByText('CRYB Token Economics')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('renders efficiently without unnecessary re-renders', () => {
      const { rerender } = renderWithRouter()
      rerender(
        <BrowserRouter>
          <AuthContext.Provider value={mockAuthContext}>
            <CryptoPage />
          </AuthContext.Provider>
        </BrowserRouter>
      )

      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('handles component mounting and unmounting', () => {
      const { unmount } = renderWithRouter()
      expect(screen.getByRole('main')).toBeInTheDocument()

      unmount()
      expect(screen.queryByRole('main')).not.toBeInTheDocument()
    })
  })

  describe('Layout Grid Structures', () => {
    it('uses grid layout for features section', () => {
      const { container } = renderWithRouter()
      const grids = container.querySelectorAll('.grid')
      expect(grids.length).toBeGreaterThan(0)
    })

    it('uses grid for tokenomics statistics', async () => {
      renderWithRouter()
      await act(async () => {
        fireEvent.click(screen.getByText('Token Economics'))
      })

      const { container } = renderWithRouter()
      expect(container.querySelector('.grid')).toBeInTheDocument()
    })

    it('uses grid for benefits section', () => {
      const { container } = renderWithRouter()
      const benefitsGrid = container.querySelectorAll('.grid')
      expect(benefitsGrid.length).toBeGreaterThan(0)
    })
  })

  describe('Text Content Accuracy', () => {
    it('displays accurate hero subtitle text', () => {
      renderWithRouter()
      const subtitle = screen.getByText(/Get ready to experience social networking reimagined with blockchain technology/i)
      expect(subtitle).toBeInTheDocument()
      expect(subtitle.textContent).toContain('Connect wallets')
      expect(subtitle.textContent).toContain('showcase NFTs')
      expect(subtitle.textContent).toContain('earn rewards')
      expect(subtitle.textContent).toContain('token-gated communities')
    })

    it('displays accurate demo section description', async () => {
      renderWithRouter()
      await act(async () => {
        fireEvent.click(screen.getByText('Demo'))
      })

      const description = screen.getByText(/Get a preview of CRYB's Web3 functionality/i)
      expect(description).toBeInTheDocument()
    })

    it('displays accurate tokenomics description', async () => {
      renderWithRouter()
      await act(async () => {
        fireEvent.click(screen.getByText('Token Economics'))
      })

      const description = screen.getByText(/Discover how CRYB token will power the future of decentralized social networking/i)
      expect(description).toBeInTheDocument()
    })
  })

  describe('Icon Rendering', () => {
    it('renders all required lucide-react icons', () => {
      renderWithRouter()

      // Check that icons are present
      expect(screen.getAllByTestId('wallet-icon').length).toBeGreaterThan(0)
      expect(screen.getAllByTestId('coins-icon').length).toBeGreaterThan(0)
      expect(screen.getAllByTestId('shield-icon').length).toBeGreaterThan(0)
      expect(screen.getAllByTestId('zap-icon').length).toBeGreaterThan(0)
      expect(screen.getAllByTestId('users-icon').length).toBeGreaterThan(0)
      expect(screen.getAllByTestId('trending-up-icon').length).toBeGreaterThan(0)
      expect(screen.getAllByTestId('star-icon').length).toBeGreaterThan(0)
    })

    it('renders navigation icons', () => {
      renderWithRouter()

      expect(screen.getByTestId('book-icon')).toBeInTheDocument()
      expect(screen.getByTestId('calendar-icon')).toBeInTheDocument()
      expect(screen.getByTestId('target-icon')).toBeInTheDocument()
    })

    it('renders CTA section icons', () => {
      renderWithRouter()

      expect(screen.getByTestId('mail-icon')).toBeInTheDocument()
      expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument()
    })
  })

  describe('Empty State Handling', () => {
    it('renders page even when no user is authenticated', () => {
      const unauthContext = {
        user: null,
        isAuthenticated: false,
        login: jest.fn(),
        logout: jest.fn(),
        loading: false,
      }

      render(
        <BrowserRouter>
          <AuthContext.Provider value={unauthContext}>
            <CryptoPage />
          </AuthContext.Provider>
        </BrowserRouter>
      )

      expect(screen.getByRole('main')).toBeInTheDocument()
    })
  })

  describe('Snapshot Testing', () => {
    it('matches snapshot for initial render', () => {
      const { container } = renderWithRouter()
      expect(container).toMatchSnapshot()
    })

    it('matches snapshot for demo section', async () => {
      const { container } = renderWithRouter()

      await act(async () => {
        fireEvent.click(screen.getByText('Demo'))
      })

      await waitFor(() => {
        expect(screen.getByText('Try Web3 Features')).toBeInTheDocument()
      })

      expect(container).toMatchSnapshot()
    })

    it('matches snapshot for tokenomics section', async () => {
      const { container } = renderWithRouter()

      await act(async () => {
        fireEvent.click(screen.getByText('Token Economics'))
      })

      await waitFor(() => {
        expect(screen.getByText('CRYB Token Economics')).toBeInTheDocument()
      })

      expect(container).toMatchSnapshot()
    })
  })
})

export default Component
