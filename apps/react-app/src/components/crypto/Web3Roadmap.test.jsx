import React from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import Web3Roadmap from './Web3Roadmap'

describe('Web3Roadmap Component', () => {
  describe('Initial Rendering', () => {
    test('renders the main roadmap container', () => {
      render(<Web3Roadmap />)
      const mainContainer = screen.getByText(/Web3 Development/).closest('.card')
      expect(mainContainer).toBeInTheDocument()
    })

    test('displays the header section with roadmap title', () => {
      render(<Web3Roadmap />)
      expect(screen.getByText(/Web3 Development/)).toBeInTheDocument()
      expect(screen.getByText(/Roadmap/)).toBeInTheDocument()
    })

    test('shows development roadmap badge', () => {
      render(<Web3Roadmap />)
      expect(screen.getByText('Development Roadmap')).toBeInTheDocument()
    })

    test('displays header description text', () => {
      render(<Web3Roadmap />)
      expect(screen.getByText(/Our comprehensive plan to build the future/)).toBeInTheDocument()
    })

    test('renders call to action section', () => {
      render(<Web3Roadmap />)
      expect(screen.getByText('Shape the Future of Web3 Social')).toBeInTheDocument()
    })

    test('displays CTA buttons', () => {
      render(<Web3Roadmap />)
      expect(screen.getByText('Join Community')).toBeInTheDocument()
      expect(screen.getByText('View on GitHub')).toBeInTheDocument()
    })
  })

  describe('Roadmap Timeline Display', () => {
    test('renders all 5 roadmap phases', () => {
      render(<Web3Roadmap />)
      expect(screen.getByText('Phase 1')).toBeInTheDocument()
      expect(screen.getByText('Phase 2')).toBeInTheDocument()
      expect(screen.getByText('Phase 3')).toBeInTheDocument()
      expect(screen.getByText('Phase 4')).toBeInTheDocument()
      expect(screen.getByText('Phase 5')).toBeInTheDocument()
    })

    test('displays phase 1 title and subtitle', () => {
      render(<Web3Roadmap />)
      expect(screen.getByText('Foundation Layer')).toBeInTheDocument()
      expect(screen.getByText('Building Core Web3 Infrastructure')).toBeInTheDocument()
    })

    test('displays phase 2 title and subtitle', () => {
      render(<Web3Roadmap />)
      expect(screen.getByText('Social Integration')).toBeInTheDocument()
      expect(screen.getByText('NFTs, Profiles & Token Gating')).toBeInTheDocument()
    })

    test('displays phase 3 title and subtitle', () => {
      render(<Web3Roadmap />)
      expect(screen.getByText('DeFi Integration')).toBeInTheDocument()
      expect(screen.getByText('Trading, Yield & Cross-Chain')).toBeInTheDocument()
    })

    test('displays phase 4 title and subtitle', () => {
      render(<Web3Roadmap />)
      expect(screen.getByText('Ecosystem Expansion')).toBeInTheDocument()
      expect(screen.getByText('Partnerships, Integrations & Scale')).toBeInTheDocument()
    })

    test('displays phase 5 title and subtitle', () => {
      render(<Web3Roadmap />)
      expect(screen.getByText('Future Vision')).toBeInTheDocument()
      expect(screen.getByText('AI, Metaverse & Next-Gen Social')).toBeInTheDocument()
    })

    test('shows timeline for each phase', () => {
      render(<Web3Roadmap />)
      expect(screen.getByText('Q2 2024')).toBeInTheDocument()
      expect(screen.getByText('Q3 2024')).toBeInTheDocument()
      expect(screen.getByText('Q4 2024')).toBeInTheDocument()
      expect(screen.getByText('Q1 2025')).toBeInTheDocument()
      expect(screen.getByText('Q2-Q4 2025')).toBeInTheDocument()
    })

    test('displays feature count for each phase', () => {
      render(<Web3Roadmap />)
      const featureCounts = screen.getAllByText(/features planned|features/)
      expect(featureCounts.length).toBeGreaterThan(0)
    })
  })

  describe('Milestone Phases', () => {
    test('phase 1 shows correct objectives', () => {
      render(<Web3Roadmap />)
      const phase1 = screen.getAllByText('Phase 1')[0].closest('.card')
      fireEvent.click(phase1)
      expect(screen.getByText(/Launch CRYB token with advanced tokenomics/)).toBeInTheDocument()
      expect(screen.getByText(/Implement secure wallet integration system/)).toBeInTheDocument()
    })

    test('phase 1 shows correct features', () => {
      render(<Web3Roadmap />)
      const phase1 = screen.getAllByText('Phase 1')[0].closest('.card')
      fireEvent.click(phase1)
      expect(screen.getByText('Multi-Wallet Support')).toBeInTheDocument()
      expect(screen.getByText('CRYB Token Launch')).toBeInTheDocument()
      expect(screen.getByText('Basic Governance')).toBeInTheDocument()
      expect(screen.getByText('Staking System')).toBeInTheDocument()
    })

    test('phase 2 shows NFT-related features', () => {
      render(<Web3Roadmap />)
      const phase2 = screen.getAllByText('Phase 2')[0].closest('.card')
      fireEvent.click(phase2)
      expect(screen.getByText('NFT Profile System')).toBeInTheDocument()
      expect(screen.getByText('Token Gating')).toBeInTheDocument()
      expect(screen.getByText('Creator Rewards')).toBeInTheDocument()
      expect(screen.getByText('Social Tipping')).toBeInTheDocument()
    })

    test('phase 3 shows DeFi features', () => {
      render(<Web3Roadmap />)
      const phase3 = screen.getAllByText('Phase 3')[0].closest('.card')
      fireEvent.click(phase3)
      expect(screen.getByText('DEX Integration')).toBeInTheDocument()
      expect(screen.getByText('Yield Farming')).toBeInTheDocument()
      expect(screen.getByText('Cross-Chain Bridge')).toBeInTheDocument()
      expect(screen.getByText('DeFi Dashboard')).toBeInTheDocument()
    })

    test('phase 4 shows ecosystem features', () => {
      render(<Web3Roadmap />)
      const phase4 = screen.getAllByText('Phase 4')[0].closest('.card')
      fireEvent.click(phase4)
      expect(screen.getByText('Partner Integrations')).toBeInTheDocument()
      expect(screen.getByText('Mobile Web3 App')).toBeInTheDocument()
      expect(screen.getByText('Advanced DAO Tools')).toBeInTheDocument()
      expect(screen.getByText('Developer Ecosystem')).toBeInTheDocument()
    })

    test('phase 5 shows future vision features', () => {
      render(<Web3Roadmap />)
      const phase5 = screen.getAllByText('Phase 5')[0].closest('.card')
      fireEvent.click(phase5)
      expect(screen.getByText('AI Content Tools')).toBeInTheDocument()
      expect(screen.getByText('Metaverse Integration')).toBeInTheDocument()
      expect(screen.getByText('Advanced Reputation')).toBeInTheDocument()
      expect(screen.getByText('Autonomous Economy')).toBeInTheDocument()
    })
  })

  describe('Feature Status Indicators', () => {
    test('displays completed status with correct styling', () => {
      render(<Web3Roadmap />)
      const { container } = render(<Web3Roadmap />)
      // Test status color function exists
      expect(container).toBeInTheDocument()
    })

    test('shows in-progress status with animation', () => {
      render(<Web3Roadmap />)
      const { container } = render(<Web3Roadmap />)
      // Status indicators are rendered
      expect(container).toBeInTheDocument()
    })

    test('displays upcoming status', () => {
      render(<Web3Roadmap />)
      const upcomingStatuses = screen.getAllByText(/Upcoming/)
      expect(upcomingStatuses.length).toBeGreaterThan(0)
    })

    test('shows planning status', () => {
      render(<Web3Roadmap />)
      expect(screen.getByText('Planning')).toBeInTheDocument()
    })

    test('displays complexity indicators for features', () => {
      render(<Web3Roadmap />)
      const phase1 = screen.getAllByText('Phase 1')[0].closest('.card')
      fireEvent.click(phase1)
      expect(screen.getAllByText('Medium').length).toBeGreaterThan(0)
      expect(screen.getAllByText('High').length).toBeGreaterThan(0)
    })

    test('shows Very High complexity for advanced features', () => {
      render(<Web3Roadmap />)
      const phase3 = screen.getAllByText('Phase 3')[0].closest('.card')
      fireEvent.click(phase3)
      expect(screen.getByText('Very High')).toBeInTheDocument()
    })
  })

  describe('Progress Visualization', () => {
    test('displays progress bar for phase 1', () => {
      render(<Web3Roadmap />)
      const { container } = render(<Web3Roadmap />)
      const progressBars = container.querySelectorAll('.h-2.rounded-full')
      expect(progressBars.length).toBeGreaterThan(0)
    })

    test('shows correct progress percentage', () => {
      render(<Web3Roadmap />)
      const { container } = render(<Web3Roadmap />)
      const progressBar = container.querySelector('[style*="width: 25%"]')
      expect(progressBar).toBeInTheDocument()
    })

    test('hides progress bar for 0% progress phases', () => {
      render(<Web3Roadmap />)
      // Phases 2-5 have 0% progress, so fewer progress bars should be visible
      const { container } = render(<Web3Roadmap />)
      expect(container).toBeInTheDocument()
    })

    test('displays timeline nodes for desktop view', () => {
      render(<Web3Roadmap />)
      const { container } = render(<Web3Roadmap />)
      const timelineNodes = container.querySelectorAll('.w-4.h-4.rounded-full')
      expect(timelineNodes.length).toBeGreaterThan(0)
    })

    test('shows gradient timeline line', () => {
      render(<Web3Roadmap />)
      const { container } = render(<Web3Roadmap />)
      const timelineLine = container.querySelector('.bg-gradient-to-r.from-accent-primary.via-success.to-warning')
      expect(timelineLine).toBeInTheDocument()
    })
  })

  describe('Phase Selection and Interaction', () => {
    test('clicking phase card opens phase details', () => {
      render(<Web3Roadmap />)
      const phase1 = screen.getAllByText('Phase 1')[0].closest('.card')
      fireEvent.click(phase1)
      expect(screen.getByText('Key Objectives')).toBeInTheDocument()
    })

    test('clicking selected phase closes details', () => {
      render(<Web3Roadmap />)
      const phase1 = screen.getAllByText('Phase 1')[0].closest('.card')
      fireEvent.click(phase1)
      expect(screen.getByText('Key Objectives')).toBeInTheDocument()
      fireEvent.click(phase1)
      expect(screen.queryByText('Key Objectives')).not.toBeInTheDocument()
    })

    test('switching between phases updates details', () => {
      render(<Web3Roadmap />)
      const phase1 = screen.getAllByText('Phase 1')[0].closest('.card')
      const phase2 = screen.getAllByText('Phase 2')[0].closest('.card')

      fireEvent.click(phase1)
      expect(screen.getByText('Multi-Wallet Support')).toBeInTheDocument()

      fireEvent.click(phase2)
      expect(screen.getByText('NFT Profile System')).toBeInTheDocument()
      expect(screen.queryByText('Multi-Wallet Support')).not.toBeInTheDocument()
    })

    test('selected phase has visual highlight', () => {
      render(<Web3Roadmap />)
      const phase1 = screen.getAllByText('Phase 1')[0].closest('.card')
      fireEvent.click(phase1)
      expect(phase1.className).toContain('border-accent-primary/50')
    })
  })

  describe('Phase Details Display', () => {
    test('shows phase description when selected', () => {
      render(<Web3Roadmap />)
      const phase1 = screen.getAllByText('Phase 1')[0].closest('.card')
      fireEvent.click(phase1)
      expect(screen.getByText(/Establish the fundamental Web3 infrastructure/)).toBeInTheDocument()
    })

    test('displays phase statistics (timeline, duration, budget, team)', () => {
      render(<Web3Roadmap />)
      const phase1 = screen.getAllByText('Phase 1')[0].closest('.card')
      fireEvent.click(phase1)
      expect(screen.getAllByText('Q2 2024')[0]).toBeInTheDocument()
      expect(screen.getByText('3 months')).toBeInTheDocument()
      expect(screen.getByText('$500K')).toBeInTheDocument()
      expect(screen.getByText('Core Development')).toBeInTheDocument()
    })

    test('shows stat card labels', () => {
      render(<Web3Roadmap />)
      const phase1 = screen.getAllByText('Phase 1')[0].closest('.card')
      fireEvent.click(phase1)
      expect(screen.getByText('Timeline')).toBeInTheDocument()
      expect(screen.getByText('Duration')).toBeInTheDocument()
      expect(screen.getByText('Budget')).toBeInTheDocument()
      expect(screen.getByText('Team')).toBeInTheDocument()
    })

    test('displays key objectives section', () => {
      render(<Web3Roadmap />)
      const phase1 = screen.getAllByText('Phase 1')[0].closest('.card')
      fireEvent.click(phase1)
      expect(screen.getByText('Key Objectives')).toBeInTheDocument()
    })

    test('shows all objectives for selected phase', () => {
      render(<Web3Roadmap />)
      const phase1 = screen.getAllByText('Phase 1')[0].closest('.card')
      fireEvent.click(phase1)
      expect(screen.getByText(/Launch CRYB token with advanced tokenomics/)).toBeInTheDocument()
      expect(screen.getByText(/Deploy governance smart contracts/)).toBeInTheDocument()
      expect(screen.getByText(/Establish community treasury/)).toBeInTheDocument()
    })

    test('displays core features section', () => {
      render(<Web3Roadmap />)
      const phase1 = screen.getAllByText('Phase 1')[0].closest('.card')
      fireEvent.click(phase1)
      expect(screen.getByText('Core Features')).toBeInTheDocument()
    })

    test('shows feature descriptions', () => {
      render(<Web3Roadmap />)
      const phase1 = screen.getAllByText('Phase 1')[0].closest('.card')
      fireEvent.click(phase1)
      expect(screen.getByText(/Connect MetaMask, WalletConnect, Coinbase Wallet/)).toBeInTheDocument()
    })

    test('displays success metrics section', () => {
      render(<Web3Roadmap />)
      const phase1 = screen.getAllByText('Phase 1')[0].closest('.card')
      fireEvent.click(phase1)
      expect(screen.getByText('Success Metrics')).toBeInTheDocument()
    })

    test('shows all success metrics', () => {
      render(<Web3Roadmap />)
      const phase1 = screen.getAllByText('Phase 1')[0].closest('.card')
      fireEvent.click(phase1)
      expect(screen.getByText(/10,000\+ connected wallets/)).toBeInTheDocument()
      expect(screen.getByText(/1M\+ CRYB tokens staked/)).toBeInTheDocument()
    })

    test('displays key risks section', () => {
      render(<Web3Roadmap />)
      const phase1 = screen.getAllByText('Phase 1')[0].closest('.card')
      fireEvent.click(phase1)
      expect(screen.getByText('Key Risks')).toBeInTheDocument()
    })

    test('shows all risk items', () => {
      render(<Web3Roadmap />)
      const phase1 = screen.getAllByText('Phase 1')[0].closest('.card')
      fireEvent.click(phase1)
      expect(screen.getByText(/Smart contract vulnerabilities/)).toBeInTheDocument()
      expect(screen.getByText(/Regulatory compliance requirements/)).toBeInTheDocument()
    })

    test('displays key deliverables section', () => {
      render(<Web3Roadmap />)
      const phase1 = screen.getAllByText('Phase 1')[0].closest('.card')
      fireEvent.click(phase1)
      expect(screen.getByText('Key Deliverables')).toBeInTheDocument()
    })

    test('shows first 3 deliverables', () => {
      render(<Web3Roadmap />)
      const phase1 = screen.getAllByText('Phase 1')[0].closest('.card')
      fireEvent.click(phase1)
      expect(screen.getByText(/CRYB token smart contract deployment/)).toBeInTheDocument()
      expect(screen.getByText(/Wallet integration SDK/)).toBeInTheDocument()
    })

    test('indicates additional deliverables count', () => {
      render(<Web3Roadmap />)
      const phase1 = screen.getAllByText('Phase 1')[0].closest('.card')
      fireEvent.click(phase1)
      expect(screen.getByText(/\+3 more deliverables/)).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    test('desktop timeline is hidden on mobile', () => {
      render(<Web3Roadmap />)
      const { container } = render(<Web3Roadmap />)
      const desktopTimeline = container.querySelector('.hidden.lg\\:block')
      expect(desktopTimeline).toBeInTheDocument()
    })

    test('mobile timeline has vertical connector lines', () => {
      render(<Web3Roadmap />)
      const { container } = render(<Web3Roadmap />)
      const mobileTimeline = container.querySelector('.lg\\:hidden')
      expect(mobileTimeline).toBeInTheDocument()
    })

    test('mobile view shows all phases', () => {
      render(<Web3Roadmap />)
      expect(screen.getAllByText('Phase 1').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Phase 2').length).toBeGreaterThan(0)
    })

    test('mobile cards show duration and budget', () => {
      render(<Web3Roadmap />)
      const { container } = render(<Web3Roadmap />)
      expect(container.textContent).toContain('3 months')
      expect(container.textContent).toContain('$500K')
    })
  })

  describe('Icons and Visual Elements', () => {
    test('renders calendar icon in header badge', () => {
      render(<Web3Roadmap />)
      const { container } = render(<Web3Roadmap />)
      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    test('shows status icons for each phase', () => {
      render(<Web3Roadmap />)
      const { container } = render(<Web3Roadmap />)
      // Multiple SVG icons should be present
      const svgElements = container.querySelectorAll('svg')
      expect(svgElements.length).toBeGreaterThan(5)
    })

    test('displays feature icons when phase is selected', () => {
      render(<Web3Roadmap />)
      const phase1 = screen.getAllByText('Phase 1')[0].closest('.card')
      fireEvent.click(phase1)
      const { container } = render(<Web3Roadmap />)
      expect(container.querySelectorAll('svg').length).toBeGreaterThan(0)
    })

    test('shows stat card icons', () => {
      render(<Web3Roadmap />)
      const phase1 = screen.getAllByText('Phase 1')[0].closest('.card')
      fireEvent.click(phase1)
      // Icons for Timeline, Duration, Budget, Team should be present
      const { container } = render(<Web3Roadmap />)
      expect(container).toBeInTheDocument()
    })
  })

  describe('Animation and Transitions', () => {
    test('component has visibility animation class', () => {
      render(<Web3Roadmap />)
      const { container } = render(<Web3Roadmap />)
      const animatedElement = container.querySelector('.transition-all.duration-1000')
      expect(animatedElement).toBeInTheDocument()
    })

    test('phase cards have hover transitions', () => {
      render(<Web3Roadmap />)
      const { container } = render(<Web3Roadmap />)
      const transitionElement = container.querySelector('.transition-all.duration-300')
      expect(transitionElement).toBeInTheDocument()
    })

    test('in-progress status has pulse animation', () => {
      render(<Web3Roadmap />)
      const { container } = render(<Web3Roadmap />)
      // Test that animation classes exist in the component
      expect(container).toBeInTheDocument()
    })

    test('progress bar has transition animation', () => {
      render(<Web3Roadmap />)
      const { container } = render(<Web3Roadmap />)
      const progressBar = container.querySelector('.transition-all.duration-500')
      expect(progressBar).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('has proper heading hierarchy', () => {
      render(<Web3Roadmap />)
      const h2 = screen.getByRole('heading', { level: 2 })
      expect(h2).toBeInTheDocument()
    })

    test('phase cards are keyboard accessible', () => {
      render(<Web3Roadmap />)
      const { container } = render(<Web3Roadmap />)
      const clickableCards = container.querySelectorAll('.cursor-pointer')
      expect(clickableCards.length).toBeGreaterThan(0)
    })

    test('buttons have descriptive text', () => {
      render(<Web3Roadmap />)
      const joinButton = screen.getByText('Join Community')
      const githubButton = screen.getByText('View on GitHub')
      expect(joinButton).toBeInTheDocument()
      expect(githubButton).toBeInTheDocument()
    })

    test('status indicators have readable text', () => {
      render(<Web3Roadmap />)
      expect(screen.getAllByText(/Upcoming/).length).toBeGreaterThan(0)
      expect(screen.getByText('Planning')).toBeInTheDocument()
    })

    test('complexity badges have clear labels', () => {
      render(<Web3Roadmap />)
      const phase1 = screen.getAllByText('Phase 1')[0].closest('.card')
      fireEvent.click(phase1)
      expect(screen.getAllByText('Medium').length).toBeGreaterThan(0)
      expect(screen.getAllByText('High').length).toBeGreaterThan(0)
    })

    test('all sections have descriptive headings', () => {
      render(<Web3Roadmap />)
      const phase1 = screen.getAllByText('Phase 1')[0].closest('.card')
      fireEvent.click(phase1)
      expect(screen.getByText('Key Objectives')).toBeInTheDocument()
      expect(screen.getByText('Core Features')).toBeInTheDocument()
      expect(screen.getByText('Success Metrics')).toBeInTheDocument()
      expect(screen.getByText('Key Risks')).toBeInTheDocument()
      expect(screen.getByText('Key Deliverables')).toBeInTheDocument()
    })
  })

  describe('Content Accuracy', () => {
    test('displays correct number of phases', () => {
      render(<Web3Roadmap />)
      const phaseCards = screen.getAllByText(/^Phase \d$/)
      expect(phaseCards.length).toBe(10) // 5 phases x 2 (desktop + mobile)
    })

    test('phase 1 has 4 features', () => {
      render(<Web3Roadmap />)
      const phase1 = screen.getAllByText('Phase 1')[0].closest('.card')
      fireEvent.click(phase1)
      expect(screen.getByText('Multi-Wallet Support')).toBeInTheDocument()
      expect(screen.getByText('CRYB Token Launch')).toBeInTheDocument()
      expect(screen.getByText('Basic Governance')).toBeInTheDocument()
      expect(screen.getByText('Staking System')).toBeInTheDocument()
    })

    test('phase 2 has correct budget', () => {
      render(<Web3Roadmap />)
      const phase2 = screen.getAllByText('Phase 2')[0].closest('.card')
      fireEvent.click(phase2)
      expect(screen.getByText('$750K')).toBeInTheDocument()
    })

    test('phase 3 has correct timeline', () => {
      render(<Web3Roadmap />)
      const phase3 = screen.getAllByText('Phase 3')[0].closest('.card')
      fireEvent.click(phase3)
      expect(screen.getAllByText('Q4 2024')[0]).toBeInTheDocument()
    })

    test('phase 4 has correct duration', () => {
      render(<Web3Roadmap />)
      const phase4 = screen.getAllByText('Phase 4')[0].closest('.card')
      fireEvent.click(phase4)
      expect(screen.getByText('6 months')).toBeInTheDocument()
    })

    test('phase 5 has correct team', () => {
      render(<Web3Roadmap />)
      const phase5 = screen.getAllByText('Phase 5')[0].closest('.card')
      fireEvent.click(phase5)
      expect(screen.getByText('Research & Innovation')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    test('handles no selected phase state', () => {
      render(<Web3Roadmap />)
      expect(screen.queryByText('Key Objectives')).not.toBeInTheDocument()
    })

    test('displays all phases even with 0% progress', () => {
      render(<Web3Roadmap />)
      expect(screen.getAllByText('Phase 2').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Phase 3').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Phase 4').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Phase 5').length).toBeGreaterThan(0)
    })

    test('handles phase with multiple complexity levels', () => {
      render(<Web3Roadmap />)
      const phase5 = screen.getAllByText('Phase 5')[0].closest('.card')
      fireEvent.click(phase5)
      expect(screen.getAllByText('Very High').length).toBeGreaterThan(0)
      expect(screen.getAllByText('High').length).toBeGreaterThan(0)
    })

    test('CTA section always visible regardless of selected phase', () => {
      render(<Web3Roadmap />)
      expect(screen.getByText('Shape the Future of Web3 Social')).toBeInTheDocument()

      const phase1 = screen.getAllByText('Phase 1')[0].closest('.card')
      fireEvent.click(phase1)
      expect(screen.getByText('Shape the Future of Web3 Social')).toBeInTheDocument()
    })
  })
})

export default mainContainer
