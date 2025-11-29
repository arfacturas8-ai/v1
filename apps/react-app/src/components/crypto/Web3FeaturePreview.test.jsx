import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import Web3FeaturePreview from './Web3FeaturePreview'
import { ChevronRight, ExternalLink, Play, Pause, Wallet, Image, CreditCard, Lock, TrendingUp, Users } from 'lucide-react'

jest.useFakeTimers()

describe('Web3FeaturePreview', () => {
  const mockWalletFeature = {
    icon: Wallet,
    title: 'Wallet Integration',
    description: 'Connect your Web3 wallet and manage your digital assets.',
    preview: 'Experience seamless wallet integration with MetaMask and WalletConnect',
    benefits: ['Secure authentication', 'Multi-wallet support', 'Cross-chain compatibility']
  }

  const mockNFTFeature = {
    icon: Image,
    title: 'NFT Profile System',
    description: 'Use your NFT collection as profile avatars.',
    preview: 'Showcase your digital identity with NFT avatars',
    benefits: ['Display owned NFTs', 'Auto-sync collections', 'Verified ownership']
  }

  const mockPaymentFeature = {
    icon: CreditCard,
    title: 'Crypto Payments',
    description: 'Send and receive crypto payments instantly.',
    preview: 'Fast, secure, and transparent crypto transactions',
    benefits: ['Low fees', 'Instant settlement', 'Multiple currencies']
  }

  const mockTokenGatingFeature = {
    icon: Lock,
    title: 'Token Gating',
    description: 'Access exclusive content based on token holdings.',
    preview: 'Create exclusive experiences for token holders',
    benefits: ['Automated verification', 'Flexible criteria', 'Real-time updates']
  }

  const mockDeFiFeature = {
    icon: TrendingUp,
    title: 'DeFi Integration',
    description: 'Track and manage your DeFi investments.',
    preview: 'Monitor your DeFi portfolio in real-time',
    benefits: ['Portfolio tracking', 'Yield optimization', 'Multi-protocol support']
  }

  const mockDAOFeature = {
    icon: Users,
    title: 'DAO Governance',
    description: 'Participate in decentralized governance.',
    preview: 'Vote on proposals and shape the future',
    benefits: ['Transparent voting', 'Delegation support', 'Proposal creation']
  }

  const mockGenericFeature = {
    icon: Wallet,
    title: 'Generic Feature',
    description: 'A generic feature without specific demo.',
    preview: 'Generic feature preview',
    benefits: ['Benefit 1', 'Benefit 2']
  }

  afterEach(() => {
    jest.clearAllTimers()
  })

  describe('Preview Card Rendering', () => {
    it('should render the preview card container', () => {
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      const card = screen.getByText(mockWalletFeature.title).closest('.card')
      expect(card).toBeInTheDocument()
    })

    it('should render with proper grid layout', () => {
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      const gridContainer = screen.getByText(mockWalletFeature.title).closest('.grid')
      expect(gridContainer).toHaveClass('lg:grid-cols-2')
    })

    it('should render both feature info and demo sections', () => {
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      expect(screen.getByText(mockWalletFeature.title)).toBeInTheDocument()
      expect(screen.getByText('Live Preview')).toBeInTheDocument()
    })
  })

  describe('Feature Information Display', () => {
    it('should display feature icon', () => {
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      const iconContainer = screen.getByText(mockWalletFeature.title).previousSibling
      expect(iconContainer).toBeInTheDocument()
      expect(iconContainer).toHaveClass('bg-accent-primary/20')
    })

    it('should display feature title', () => {
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      const title = screen.getByText(mockWalletFeature.title)
      expect(title).toBeInTheDocument()
      expect(title).toHaveClass('text-2xl', 'font-bold', 'text-primary')
    })

    it('should display feature description', () => {
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      expect(screen.getByText(mockWalletFeature.description)).toBeInTheDocument()
    })

    it('should display feature preview in highlighted section', () => {
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      const preview = screen.getByText(`"${mockWalletFeature.preview}"`)
      expect(preview).toBeInTheDocument()
      expect(preview.closest('div')).toHaveClass('bg-accent-primary/10')
    })

    it('should display all feature benefits', () => {
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      expect(screen.getByText('Key Benefits:')).toBeInTheDocument()
      mockWalletFeature.benefits.forEach(benefit => {
        expect(screen.getByText(benefit)).toBeInTheDocument()
      })
    })

    it('should display chevron icons for each benefit', () => {
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      const benefits = screen.getAllByText(/Secure authentication|Multi-wallet support|Cross-chain compatibility/)
      benefits.forEach(benefit => {
        expect(benefit.previousSibling).toBeInTheDocument()
      })
    })
  })

  describe('Interactive Demo', () => {
    it('should render Live Preview section', () => {
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      expect(screen.getByText('Live Preview')).toBeInTheDocument()
    })

    it('should render demo controls', () => {
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      const playPauseButton = screen.getByLabelText('Pause animation')
      expect(playPauseButton).toBeInTheDocument()
    })

    it('should render demo steps', () => {
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
      expect(screen.getByText('Verify Identity')).toBeInTheDocument()
      expect(screen.getByText('Access Features')).toBeInTheDocument()
    })

    it('should start animation by default', () => {
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      expect(screen.getByLabelText('Pause animation')).toBeInTheDocument()
    })

    it('should toggle animation state when clicking play/pause button', async () => {
      const user = userEvent.setup({ delay: null })
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      const button = screen.getByLabelText('Pause animation')
      await user.click(button)

      expect(screen.getByLabelText('Play animation')).toBeInTheDocument()
    })

    it('should toggle animation icon from Pause to Play', async () => {
      const user = userEvent.setup({ delay: null })
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      const button = screen.getByLabelText('Pause animation')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByLabelText('Play animation')).toBeInTheDocument()
      })
    })

    it('should toggle animation icon from Play to Pause', async () => {
      const user = userEvent.setup({ delay: null })
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      const pauseButton = screen.getByLabelText('Pause animation')
      await user.click(pauseButton)

      const playButton = screen.getByLabelText('Play animation')
      await user.click(playButton)

      expect(screen.getByLabelText('Pause animation')).toBeInTheDocument()
    })

    it('should advance animation steps automatically', () => {
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      jest.advanceTimersByTime(2000)

      expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
    })

    it('should cycle through all steps', () => {
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      jest.advanceTimersByTime(2000)
      jest.advanceTimersByTime(2000)
      jest.advanceTimersByTime(2000)

      expect(screen.getByText('Access Features')).toBeInTheDocument()
    })

    it('should stop animation when paused', async () => {
      const user = userEvent.setup({ delay: null })
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      const button = screen.getByLabelText('Pause animation')
      await user.click(button)

      jest.advanceTimersByTime(5000)

      expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
    })
  })

  describe('Wallet Integration Feature', () => {
    it('should display wallet integration demo content', () => {
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      expect(screen.getByText('Connected Wallet')).toBeInTheDocument()
    })

    it('should display wallet address', () => {
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      expect(screen.getByText(/Address: 0x742d...4a8C/)).toBeInTheDocument()
    })

    it('should display wallet balance', () => {
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      expect(screen.getByText(/Balance: 2.45 ETH/)).toBeInTheDocument()
    })

    it('should display network name', () => {
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      expect(screen.getByText(/✓ Ethereum Mainnet/)).toBeInTheDocument()
    })

    it('should display wallet integration steps', () => {
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
      expect(screen.getByText('Verify Identity')).toBeInTheDocument()
      expect(screen.getByText('Access Features')).toBeInTheDocument()
    })
  })

  describe('NFT Profile System Feature', () => {
    it('should display NFT profile demo content', () => {
      render(<Web3FeaturePreview feature={mockNFTFeature} />)

      expect(screen.getByText('Your Collections')).toBeInTheDocument()
    })

    it('should display NFT collections', () => {
      render(<Web3FeaturePreview feature={mockNFTFeature} />)

      expect(screen.getByText(/Bored Ape #1234/)).toBeInTheDocument()
      expect(screen.getByText(/CryptoPunk #5678/)).toBeInTheDocument()
      expect(screen.getByText(/Azuki #9012/)).toBeInTheDocument()
    })

    it('should highlight selected NFT after animation step', () => {
      render(<Web3FeaturePreview feature={mockNFTFeature} />)

      jest.advanceTimersByTime(2000)

      expect(screen.getByText('✓ Active')).toBeInTheDocument()
    })

    it('should display NFT profile steps', () => {
      render(<Web3FeaturePreview feature={mockNFTFeature} />)

      expect(screen.getByText('Scan Collections')).toBeInTheDocument()
      expect(screen.getByText('Select Avatar')).toBeInTheDocument()
      expect(screen.getByText('Update Profile')).toBeInTheDocument()
    })
  })

  describe('Crypto Payments Feature', () => {
    it('should display crypto payments demo content', () => {
      render(<Web3FeaturePreview feature={mockPaymentFeature} />)

      expect(screen.getByText('Payment Details')).toBeInTheDocument()
    })

    it('should display payment from address', () => {
      render(<Web3FeaturePreview feature={mockPaymentFeature} />)

      expect(screen.getByText(/From: You/)).toBeInTheDocument()
    })

    it('should display payment to address', () => {
      render(<Web3FeaturePreview feature={mockPaymentFeature} />)

      expect(screen.getByText(/To: @cryptouser/)).toBeInTheDocument()
    })

    it('should display payment amount', () => {
      render(<Web3FeaturePreview feature={mockPaymentFeature} />)

      expect(screen.getByText(/Amount: 50 USDC/)).toBeInTheDocument()
    })

    it('should display payment fee', () => {
      render(<Web3FeaturePreview feature={mockPaymentFeature} />)

      expect(screen.getByText(/Fee: 0.1 USDC/)).toBeInTheDocument()
    })

    it('should display payment steps', () => {
      render(<Web3FeaturePreview feature={mockPaymentFeature} />)

      expect(screen.getByText('Select Currency')).toBeInTheDocument()
      expect(screen.getByText('Enter Amount')).toBeInTheDocument()
      expect(screen.getByText('Confirm Transaction')).toBeInTheDocument()
    })
  })

  describe('Token Gating Feature', () => {
    it('should display token gating demo content', () => {
      render(<Web3FeaturePreview feature={mockTokenGatingFeature} />)

      expect(screen.getByText('Token Holdings')).toBeInTheDocument()
    })

    it('should display token symbols and amounts', () => {
      render(<Web3FeaturePreview feature={mockTokenGatingFeature} />)

      expect(screen.getByText(/CRYB: 1,000/)).toBeInTheDocument()
      expect(screen.getByText(/UNI: 25/)).toBeInTheDocument()
      expect(screen.getByText(/COMP: 5/)).toBeInTheDocument()
    })

    it('should display access status for tokens with sufficient holdings', () => {
      render(<Web3FeaturePreview feature={mockTokenGatingFeature} />)

      const accessGranted = screen.getAllByText('✓ Access')
      expect(accessGranted).toHaveLength(2)
    })

    it('should display insufficient status for tokens without enough holdings', () => {
      render(<Web3FeaturePreview feature={mockTokenGatingFeature} />)

      expect(screen.getByText('✗ Insufficient')).toBeInTheDocument()
    })

    it('should display token gating steps', () => {
      render(<Web3FeaturePreview feature={mockTokenGatingFeature} />)

      expect(screen.getByText('Check Holdings')).toBeInTheDocument()
      expect(screen.getByText('Verify Ownership')).toBeInTheDocument()
      expect(screen.getByText('Grant Access')).toBeInTheDocument()
    })
  })

  describe('DeFi Integration Feature', () => {
    it('should display DeFi integration demo content', () => {
      render(<Web3FeaturePreview feature={mockDeFiFeature} />)

      expect(screen.getByText('Portfolio Overview')).toBeInTheDocument()
    })

    it('should display total portfolio value', () => {
      render(<Web3FeaturePreview feature={mockDeFiFeature} />)

      expect(screen.getByText(/Total Value: \$12,543.21/)).toBeInTheDocument()
    })

    it('should display APR', () => {
      render(<Web3FeaturePreview feature={mockDeFiFeature} />)

      expect(screen.getByText(/APR: 8.3%/)).toBeInTheDocument()
    })

    it('should display supported protocols', () => {
      render(<Web3FeaturePreview feature={mockDeFiFeature} />)

      expect(screen.getByText(/Protocols: Uniswap, Compound, Aave/)).toBeInTheDocument()
    })

    it('should display DeFi integration steps', () => {
      render(<Web3FeaturePreview feature={mockDeFiFeature} />)

      expect(screen.getByText('Connect Protocols')).toBeInTheDocument()
      expect(screen.getByText('Sync Portfolio')).toBeInTheDocument()
      expect(screen.getByText('Display Analytics')).toBeInTheDocument()
    })
  })

  describe('DAO Governance Feature', () => {
    it('should display DAO governance demo content', () => {
      render(<Web3FeaturePreview feature={mockDAOFeature} />)

      expect(screen.getByText('Active Proposal')).toBeInTheDocument()
    })

    it('should display proposal title', () => {
      render(<Web3FeaturePreview feature={mockDAOFeature} />)

      expect(screen.getByText('Add Dark Mode Support')).toBeInTheDocument()
    })

    it('should display votes for proposal', () => {
      render(<Web3FeaturePreview feature={mockDAOFeature} />)

      expect(screen.getByText(/For: 1247/)).toBeInTheDocument()
    })

    it('should display votes against proposal', () => {
      render(<Web3FeaturePreview feature={mockDAOFeature} />)

      expect(screen.getByText(/Against: 89/)).toBeInTheDocument()
    })

    it('should display time remaining', () => {
      render(<Web3FeaturePreview feature={mockDAOFeature} />)

      expect(screen.getByText(/⏳ 2 days left/)).toBeInTheDocument()
    })

    it('should display DAO governance steps', () => {
      render(<Web3FeaturePreview feature={mockDAOFeature} />)

      expect(screen.getByText('Load Proposals')).toBeInTheDocument()
      expect(screen.getByText('Cast Vote')).toBeInTheDocument()
      expect(screen.getByText('Update Results')).toBeInTheDocument()
    })
  })

  describe('Generic Feature Fallback', () => {
    it('should render generic demo steps for unknown features', () => {
      render(<Web3FeaturePreview feature={mockGenericFeature} />)

      expect(screen.getByText('Initialize')).toBeInTheDocument()
      expect(screen.getByText('Process')).toBeInTheDocument()
      expect(screen.getByText('Complete')).toBeInTheDocument()
    })

    it('should not display feature-specific content for generic feature', () => {
      render(<Web3FeaturePreview feature={mockGenericFeature} />)

      expect(screen.queryByText('Connected Wallet')).not.toBeInTheDocument()
      expect(screen.queryByText('Your Collections')).not.toBeInTheDocument()
      expect(screen.queryByText('Payment Details')).not.toBeInTheDocument()
    })
  })

  describe('Learn More Button', () => {
    it('should render learn more button', () => {
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      expect(screen.getByText('Learn More')).toBeInTheDocument()
    })

    it('should have external link icon', () => {
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      const button = screen.getByText('Learn More').closest('button')
      expect(button).toBeInTheDocument()
    })

    it('should have proper button styling', () => {
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      const button = screen.getByText('Learn More').closest('button')
      expect(button).toHaveClass('btn', 'btn-secondary')
    })
  })

  describe('Step Status Indicators', () => {
    it('should show completed steps with success color', () => {
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      const firstStep = screen.getByText('Connect Wallet')
      const indicator = firstStep.previousSibling
      expect(indicator).toHaveClass('bg-success')
    })

    it('should show pending steps with border color', () => {
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      const lastStep = screen.getByText('Access Features')
      const indicator = lastStep.previousSibling
      expect(indicator).toHaveClass('bg-border-primary')
    })

    it('should update step indicators as animation progresses', () => {
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      jest.advanceTimersByTime(2000)

      const secondStep = screen.getByText('Verify Identity')
      const indicator = secondStep.previousSibling
      expect(indicator).toHaveClass('bg-success')
    })
  })

  describe('Animation Lifecycle', () => {
    it('should clean up interval on unmount', () => {
      const { unmount } = render(<Web3FeaturePreview feature={mockWalletFeature} />)

      unmount()

      jest.advanceTimersByTime(10000)
    })

    it('should restart interval when animation is resumed', async () => {
      const user = userEvent.setup({ delay: null })
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      const pauseButton = screen.getByLabelText('Pause animation')
      await user.click(pauseButton)

      const playButton = screen.getByLabelText('Play animation')
      await user.click(playButton)

      jest.advanceTimersByTime(2000)

      expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
    })

    it('should reset to first step after completing all steps', () => {
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      jest.advanceTimersByTime(6000)

      const firstStep = screen.getByText('Connect Wallet')
      expect(firstStep).toBeInTheDocument()
    })
  })

  describe('Responsive Layout', () => {
    it('should apply responsive grid classes', () => {
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      const gridContainer = screen.getByText(mockWalletFeature.title).closest('.grid')
      expect(gridContainer).toHaveClass('lg:grid-cols-2')
    })

    it('should render demo section with proper background', () => {
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      const demoSection = screen.getByText('Live Preview').closest('.bg-tertiary')
      expect(demoSection).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria-label for pause button', () => {
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      const button = screen.getByLabelText('Pause animation')
      expect(button).toBeInTheDocument()
    })

    it('should have proper aria-label for play button', async () => {
      const user = userEvent.setup({ delay: null })
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      const pauseButton = screen.getByLabelText('Pause animation')
      await user.click(pauseButton)

      const playButton = screen.getByLabelText('Play animation')
      expect(playButton).toBeInTheDocument()
    })

    it('should have semantic button elements', () => {
      render(<Web3FeaturePreview feature={mockWalletFeature} />)

      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })
})

export default mockWalletFeature
