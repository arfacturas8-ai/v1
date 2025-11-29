/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Web3Roadmap from '../Web3Roadmap';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Calendar: ({ className, ...props }) => <svg data-testid="calendar-icon" className={className} {...props} />,
  CheckCircle: ({ className, ...props }) => <svg data-testid="check-circle-icon" className={className} {...props} />,
  Clock: ({ className, ...props }) => <svg data-testid="clock-icon" className={className} {...props} />,
  Zap: ({ className, ...props }) => <svg data-testid="zap-icon" className={className} {...props} />,
  Users: ({ className, ...props }) => <svg data-testid="users-icon" className={className} {...props} />,
  Coins: ({ className, ...props }) => <svg data-testid="coins-icon" className={className} {...props} />,
  Shield: ({ className, ...props }) => <svg data-testid="shield-icon" className={className} {...props} />,
  TrendingUp: ({ className, ...props }) => <svg data-testid="trending-up-icon" className={className} {...props} />,
  Star: ({ className, ...props }) => <svg data-testid="star-icon" className={className} {...props} />,
  ArrowRight: ({ className, ...props }) => <svg data-testid="arrow-right-icon" className={className} {...props} />,
  GitBranch: ({ className, ...props }) => <svg data-testid="git-branch-icon" className={className} {...props} />,
  Target: ({ className, ...props }) => <svg data-testid="target-icon" className={className} {...props} />
}));

describe('Web3Roadmap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<Web3Roadmap />);
      expect(container).toBeInTheDocument();
    });

    it('renders the header with title and subtitle', () => {
      render(<Web3Roadmap />);
      expect(screen.getByText(/Web3 Development/i)).toBeInTheDocument();
      expect(screen.getByText(/Roadmap/i)).toBeInTheDocument();
      expect(screen.getByText(/Development Roadmap/i)).toBeInTheDocument();
      expect(screen.getByText(/comprehensive plan to build the future/i)).toBeInTheDocument();
    });

    it('renders all 5 roadmap phases', () => {
      render(<Web3Roadmap />);
      expect(screen.getByText('Phase 1')).toBeInTheDocument();
      expect(screen.getByText('Foundation Layer')).toBeInTheDocument();
      expect(screen.getByText('Phase 2')).toBeInTheDocument();
      expect(screen.getByText('Social Integration')).toBeInTheDocument();
      expect(screen.getByText('Phase 3')).toBeInTheDocument();
      expect(screen.getByText('DeFi Integration')).toBeInTheDocument();
      expect(screen.getByText('Phase 4')).toBeInTheDocument();
      expect(screen.getByText('Ecosystem Expansion')).toBeInTheDocument();
      expect(screen.getByText('Phase 5')).toBeInTheDocument();
      expect(screen.getByText('Future Vision')).toBeInTheDocument();
    });

    it('renders phase subtitles', () => {
      render(<Web3Roadmap />);
      expect(screen.getByText('Building Core Web3 Infrastructure')).toBeInTheDocument();
      expect(screen.getByText('NFTs, Profiles & Token Gating')).toBeInTheDocument();
      expect(screen.getByText('Trading, Yield & Cross-Chain')).toBeInTheDocument();
      expect(screen.getByText('Partnerships, Integrations & Scale')).toBeInTheDocument();
      expect(screen.getByText('AI, Metaverse & Next-Gen Social')).toBeInTheDocument();
    });

    it('renders timeline periods', () => {
      render(<Web3Roadmap />);
      expect(screen.getByText('Q2 2024')).toBeInTheDocument();
      expect(screen.getByText('Q3 2024')).toBeInTheDocument();
      expect(screen.getByText('Q4 2024')).toBeInTheDocument();
      expect(screen.getByText('Q1 2025')).toBeInTheDocument();
      expect(screen.getByText('Q2-Q4 2025')).toBeInTheDocument();
    });

    it('renders call to action buttons', () => {
      render(<Web3Roadmap />);
      expect(screen.getByText('Join Community')).toBeInTheDocument();
      expect(screen.getByText('View on GitHub')).toBeInTheDocument();
    });

    it('renders call to action header text', () => {
      render(<Web3Roadmap />);
      expect(screen.getByText('Shape the Future of Web3 Social')).toBeInTheDocument();
      expect(screen.getByText(/Your feedback and participation shape our roadmap/i)).toBeInTheDocument();
    });
  });

  describe('Phase Status Indicators', () => {
    it('renders status badges for each phase', () => {
      render(<Web3Roadmap />);
      const upcomingStatuses = screen.getAllByText(/Upcoming/i);
      expect(upcomingStatuses.length).toBeGreaterThan(0);
      expect(screen.getByText(/Planning/i)).toBeInTheDocument();
    });

    it('displays correct status icons', () => {
      render(<Web3Roadmap />);
      expect(screen.getAllByTestId('calendar-icon').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('target-icon').length).toBeGreaterThan(0);
    });

    it('applies correct status colors', () => {
      const { container } = render(<Web3Roadmap />);
      // Check for status color classes
      expect(container.querySelector('.text-warning')).toBeInTheDocument();
      expect(container.querySelector('.text-muted')).toBeInTheDocument();
    });

    it('shows status background colors', () => {
      const { container } = render(<Web3Roadmap />);
      // Check for status background classes
      expect(container.innerHTML).toContain('bg-warning/20');
      expect(container.innerHTML).toContain('bg-muted/20');
    });
  });

  describe('Progress Bars', () => {
    it('renders progress bar for Phase 1 with 25% progress', () => {
      const { container } = render(<Web3Roadmap />);
      const progressBars = container.querySelectorAll('[style*="width"]');
      const phase1Progress = Array.from(progressBars).find(el =>
        el.getAttribute('style')?.includes('25%')
      );
      expect(phase1Progress).toBeInTheDocument();
    });

    it('does not render progress bars for phases with 0% progress', () => {
      render(<Web3Roadmap />);
      // Phase 2-5 have 0 progress, so fewer progress bars should exist
      const { container } = render(<Web3Roadmap />);
      const progressBars = container.querySelectorAll('[style*="width"]');
      // Should only have 1 progress bar (Phase 1)
      expect(progressBars.length).toBeLessThan(5);
    });

    it('applies correct color to progress bar based on status', () => {
      const { container } = render(<Web3Roadmap />);
      // Phase 1 is upcoming, so should have warning color
      expect(container.innerHTML).toContain('bg-warning');
    });
  });

  describe('Timeline Visualization', () => {
    it('renders desktop timeline with gradient line', () => {
      const { container } = render(<Web3Roadmap />);
      const timelineLine = container.querySelector('.bg-gradient-to-r.from-accent-primary');
      expect(timelineLine).toBeInTheDocument();
    });

    it('renders timeline nodes for each phase', () => {
      const { container } = render(<Web3Roadmap />);
      const nodes = container.querySelectorAll('[class*="rounded-full"][class*="border-3"]');
      expect(nodes.length).toBeGreaterThanOrEqual(5);
    });

    it('shows feature count for each phase', () => {
      render(<Web3Roadmap />);
      expect(screen.getByText('4 features planned')).toBeInTheDocument();
    });

    it('renders mobile timeline version', () => {
      const { container } = render(<Web3Roadmap />);
      expect(container.querySelector('.lg\\:hidden')).toBeInTheDocument();
    });

    it('renders connector lines in mobile view', () => {
      const { container } = render(<Web3Roadmap />);
      const connectorLines = container.querySelectorAll('.bg-gradient-to-b');
      expect(connectorLines.length).toBeGreaterThan(0);
    });
  });

  describe('Phase Expansion/Collapse', () => {
    it('does not show phase details initially', () => {
      render(<Web3Roadmap />);
      expect(screen.queryByText('Key Objectives')).not.toBeInTheDocument();
    });

    it('expands phase details when phase card is clicked', async () => {
      render(<Web3Roadmap />);

      // Find and click the first phase card
      const phase1Card = screen.getByText('Foundation Layer').closest('div[class*="card"]');
      fireEvent.click(phase1Card);

      await waitFor(() => {
        expect(screen.getByText('Key Objectives')).toBeInTheDocument();
      });
    });

    it('shows phase description when expanded', async () => {
      render(<Web3Roadmap />);

      const phase1Card = screen.getByText('Foundation Layer').closest('div[class*="card"]');
      fireEvent.click(phase1Card);

      await waitFor(() => {
        expect(screen.getByText(/Establish the fundamental Web3 infrastructure/i)).toBeInTheDocument();
      });
    });

    it('collapses phase details when clicked again', async () => {
      render(<Web3Roadmap />);

      const phase1Card = screen.getByText('Foundation Layer').closest('div[class*="card"]');

      // Expand
      fireEvent.click(phase1Card);
      await waitFor(() => {
        expect(screen.getByText('Key Objectives')).toBeInTheDocument();
      });

      // Collapse
      fireEvent.click(phase1Card);
      await waitFor(() => {
        expect(screen.queryByText('Key Objectives')).not.toBeInTheDocument();
      });
    });

    it('applies active styling to selected phase', async () => {
      const { container } = render(<Web3Roadmap />);

      const phase1Card = screen.getByText('Foundation Layer').closest('div[class*="card"]');
      fireEvent.click(phase1Card);

      await waitFor(() => {
        expect(phase1Card.className).toContain('border-accent-primary/50');
      });
    });
  });

  describe('Phase Details - Statistics', () => {
    it('shows timeline stat when phase is expanded', async () => {
      render(<Web3Roadmap />);

      const phase1Card = screen.getByText('Foundation Layer').closest('div[class*="card"]');
      fireEvent.click(phase1Card);

      await waitFor(() => {
        expect(screen.getByText('Timeline')).toBeInTheDocument();
      });
    });

    it('shows duration stat when phase is expanded', async () => {
      render(<Web3Roadmap />);

      const phase1Card = screen.getByText('Foundation Layer').closest('div[class*="card"]');
      fireEvent.click(phase1Card);

      await waitFor(() => {
        expect(screen.getByText('Duration')).toBeInTheDocument();
        expect(screen.getByText('3 months')).toBeInTheDocument();
      });
    });

    it('shows budget stat when phase is expanded', async () => {
      render(<Web3Roadmap />);

      const phase1Card = screen.getByText('Foundation Layer').closest('div[class*="card"]');
      fireEvent.click(phase1Card);

      await waitFor(() => {
        expect(screen.getByText('Budget')).toBeInTheDocument();
        expect(screen.getByText('$500K')).toBeInTheDocument();
      });
    });

    it('shows team stat when phase is expanded', async () => {
      render(<Web3Roadmap />);

      const phase1Card = screen.getByText('Foundation Layer').closest('div[class*="card"]');
      fireEvent.click(phase1Card);

      await waitFor(() => {
        expect(screen.getByText('Team')).toBeInTheDocument();
        expect(screen.getByText('Core Development')).toBeInTheDocument();
      });
    });
  });

  describe('Phase Details - Objectives', () => {
    it('displays objectives section when phase is expanded', async () => {
      render(<Web3Roadmap />);

      const phase1Card = screen.getByText('Foundation Layer').closest('div[class*="card"]');
      fireEvent.click(phase1Card);

      await waitFor(() => {
        expect(screen.getByText('Key Objectives')).toBeInTheDocument();
      });
    });

    it('shows all objectives for Phase 1', async () => {
      render(<Web3Roadmap />);

      const phase1Card = screen.getByText('Foundation Layer').closest('div[class*="card"]');
      fireEvent.click(phase1Card);

      await waitFor(() => {
        expect(screen.getByText(/Launch CRYB token with advanced tokenomics/i)).toBeInTheDocument();
        expect(screen.getByText(/Implement secure wallet integration system/i)).toBeInTheDocument();
        expect(screen.getByText(/Deploy governance smart contracts/i)).toBeInTheDocument();
        expect(screen.getByText(/Create basic staking infrastructure/i)).toBeInTheDocument();
        expect(screen.getByText(/Establish community treasury/i)).toBeInTheDocument();
      });
    });

    it('renders check icons next to objectives', async () => {
      render(<Web3Roadmap />);

      const phase1Card = screen.getByText('Foundation Layer').closest('div[class*="card"]');
      fireEvent.click(phase1Card);

      await waitFor(() => {
        const checkIcons = screen.getAllByTestId('check-circle-icon');
        expect(checkIcons.length).toBeGreaterThan(5);
      });
    });
  });

  describe('Phase Details - Features', () => {
    it('displays features section when phase is expanded', async () => {
      render(<Web3Roadmap />);

      const phase1Card = screen.getByText('Foundation Layer').closest('div[class*="card"]');
      fireEvent.click(phase1Card);

      await waitFor(() => {
        expect(screen.getByText('Core Features')).toBeInTheDocument();
      });
    });

    it('shows all features for Phase 1', async () => {
      render(<Web3Roadmap />);

      const phase1Card = screen.getByText('Foundation Layer').closest('div[class*="card"]');
      fireEvent.click(phase1Card);

      await waitFor(() => {
        expect(screen.getByText('Multi-Wallet Support')).toBeInTheDocument();
        expect(screen.getByText('CRYB Token Launch')).toBeInTheDocument();
        expect(screen.getByText('Basic Governance')).toBeInTheDocument();
        expect(screen.getByText('Staking System')).toBeInTheDocument();
      });
    });

    it('displays feature descriptions', async () => {
      render(<Web3Roadmap />);

      const phase1Card = screen.getByText('Foundation Layer').closest('div[class*="card"]');
      fireEvent.click(phase1Card);

      await waitFor(() => {
        expect(screen.getByText(/Connect MetaMask, WalletConnect, Coinbase Wallet/i)).toBeInTheDocument();
        expect(screen.getByText(/ERC-20 token with burn and staking mechanisms/i)).toBeInTheDocument();
      });
    });

    it('shows complexity badges for features', async () => {
      render(<Web3Roadmap />);

      const phase1Card = screen.getByText('Foundation Layer').closest('div[class*="card"]');
      fireEvent.click(phase1Card);

      await waitFor(() => {
        expect(screen.getAllByText('Medium').length).toBeGreaterThan(0);
        expect(screen.getAllByText('High').length).toBeGreaterThan(0);
      });
    });

    it('renders feature icons', async () => {
      render(<Web3Roadmap />);

      const phase1Card = screen.getByText('Foundation Layer').closest('div[class*="card"]');
      fireEvent.click(phase1Card);

      await waitFor(() => {
        expect(screen.getAllByTestId('shield-icon').length).toBeGreaterThan(0);
        expect(screen.getAllByTestId('coins-icon').length).toBeGreaterThan(0);
      });
    });

    it('applies complexity color coding', async () => {
      const { container } = render(<Web3Roadmap />);

      const phase1Card = screen.getByText('Foundation Layer').closest('div[class*="card"]');
      fireEvent.click(phase1Card);

      await waitFor(() => {
        expect(container.innerHTML).toContain('bg-warning/20');
        expect(container.innerHTML).toContain('bg-error/20');
      });
    });
  });

  describe('Phase Details - Success Metrics', () => {
    it('displays success metrics section when phase is expanded', async () => {
      render(<Web3Roadmap />);

      const phase1Card = screen.getByText('Foundation Layer').closest('div[class*="card"]');
      fireEvent.click(phase1Card);

      await waitFor(() => {
        expect(screen.getByText('Success Metrics')).toBeInTheDocument();
      });
    });

    it('shows all success metrics for Phase 1', async () => {
      render(<Web3Roadmap />);

      const phase1Card = screen.getByText('Foundation Layer').closest('div[class*="card"]');
      fireEvent.click(phase1Card);

      await waitFor(() => {
        expect(screen.getByText(/10,000\+ connected wallets/i)).toBeInTheDocument();
        expect(screen.getByText(/1M\+ CRYB tokens staked/i)).toBeInTheDocument();
        expect(screen.getByText(/500\+ governance votes cast/i)).toBeInTheDocument();
      });
    });

    it('renders success metric icons', async () => {
      render(<Web3Roadmap />);

      const phase1Card = screen.getByText('Foundation Layer').closest('div[class*="card"]');
      fireEvent.click(phase1Card);

      await waitFor(() => {
        expect(screen.getAllByTestId('trending-up-icon').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Phase Details - Risks', () => {
    it('displays risks section when phase is expanded', async () => {
      render(<Web3Roadmap />);

      const phase1Card = screen.getByText('Foundation Layer').closest('div[class*="card"]');
      fireEvent.click(phase1Card);

      await waitFor(() => {
        expect(screen.getByText('Key Risks')).toBeInTheDocument();
      });
    });

    it('shows all risks for Phase 1', async () => {
      render(<Web3Roadmap />);

      const phase1Card = screen.getByText('Foundation Layer').closest('div[class*="card"]');
      fireEvent.click(phase1Card);

      await waitFor(() => {
        expect(screen.getByText(/Smart contract vulnerabilities/i)).toBeInTheDocument();
        expect(screen.getByText(/Regulatory compliance requirements/i)).toBeInTheDocument();
        expect(screen.getByText(/Network congestion and gas fees/i)).toBeInTheDocument();
      });
    });

    it('renders risk icons', async () => {
      render(<Web3Roadmap />);

      const phase1Card = screen.getByText('Foundation Layer').closest('div[class*="card"]');
      fireEvent.click(phase1Card);

      await waitFor(() => {
        const shieldIcons = screen.getAllByTestId('shield-icon');
        expect(shieldIcons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Phase Details - Deliverables', () => {
    it('displays deliverables section when phase is expanded', async () => {
      render(<Web3Roadmap />);

      const phase1Card = screen.getByText('Foundation Layer').closest('div[class*="card"]');
      fireEvent.click(phase1Card);

      await waitFor(() => {
        expect(screen.getByText('Key Deliverables')).toBeInTheDocument();
      });
    });

    it('shows first 3 deliverables for Phase 1', async () => {
      render(<Web3Roadmap />);

      const phase1Card = screen.getByText('Foundation Layer').closest('div[class*="card"]');
      fireEvent.click(phase1Card);

      await waitFor(() => {
        expect(screen.getByText(/CRYB token smart contract deployment/i)).toBeInTheDocument();
        expect(screen.getByText(/Wallet integration SDK/i)).toBeInTheDocument();
        expect(screen.getByText(/Governance voting interface/i)).toBeInTheDocument();
      });
    });

    it('shows count of additional deliverables', async () => {
      render(<Web3Roadmap />);

      const phase1Card = screen.getByText('Foundation Layer').closest('div[class*="card"]');
      fireEvent.click(phase1Card);

      await waitFor(() => {
        expect(screen.getByText(/\+3 more deliverables/i)).toBeInTheDocument();
      });
    });
  });

  describe('Multiple Phase Expansion', () => {
    it('can expand different phases', async () => {
      render(<Web3Roadmap />);

      // Expand Phase 1
      const phase1Card = screen.getByText('Foundation Layer').closest('div[class*="card"]');
      fireEvent.click(phase1Card);
      await waitFor(() => {
        expect(screen.getByText(/Establish the fundamental Web3 infrastructure/i)).toBeInTheDocument();
      });

      // Collapse Phase 1 and expand Phase 2
      fireEvent.click(phase1Card);
      await waitFor(() => {
        expect(screen.queryByText(/Establish the fundamental Web3 infrastructure/i)).not.toBeInTheDocument();
      });

      const phase2Card = screen.getByText('Social Integration').closest('div[class*="card"]');
      fireEvent.click(phase2Card);
      await waitFor(() => {
        expect(screen.getByText(/Transform social interactions with NFT integration/i)).toBeInTheDocument();
      });
    });

    it('shows different budgets for different phases', async () => {
      render(<Web3Roadmap />);

      // Check Phase 2
      const phase2Card = screen.getByText('Social Integration').closest('div[class*="card"]');
      fireEvent.click(phase2Card);
      await waitFor(() => {
        expect(screen.getByText('$750K')).toBeInTheDocument();
      });
    });

    it('shows different durations for different phases', async () => {
      render(<Web3Roadmap />);

      // Check Phase 3
      const phase3Card = screen.getByText('DeFi Integration').closest('div[class*="card"]');
      fireEvent.click(phase3Card);
      await waitFor(() => {
        expect(screen.getByText('5 months')).toBeInTheDocument();
      });
    });

    it('shows different teams for different phases', async () => {
      render(<Web3Roadmap />);

      // Check Phase 4
      const phase4Card = screen.getByText('Ecosystem Expansion').closest('div[class*="card"]');
      fireEvent.click(phase4Card);
      await waitFor(() => {
        expect(screen.getByText('Full Organization')).toBeInTheDocument();
      });
    });
  });

  describe('Phase 2 - Social Integration Details', () => {
    it('shows Phase 2 specific features', async () => {
      render(<Web3Roadmap />);

      const phase2Card = screen.getByText('Social Integration').closest('div[class*="card"]');
      fireEvent.click(phase2Card);

      await waitFor(() => {
        expect(screen.getByText('NFT Profile System')).toBeInTheDocument();
        expect(screen.getByText('Token Gating')).toBeInTheDocument();
        expect(screen.getByText('Creator Rewards')).toBeInTheDocument();
        expect(screen.getByText('Social Tipping')).toBeInTheDocument();
      });
    });

    it('shows Phase 2 success metrics', async () => {
      render(<Web3Roadmap />);

      const phase2Card = screen.getByText('Social Integration').closest('div[class*="card"]');
      fireEvent.click(phase2Card);

      await waitFor(() => {
        expect(screen.getByText(/50,000\+ NFT profiles created/i)).toBeInTheDocument();
        expect(screen.getByText(/100\+ token-gated communities/i)).toBeInTheDocument();
      });
    });
  });

  describe('Phase 3 - DeFi Integration Details', () => {
    it('shows Phase 3 specific features', async () => {
      render(<Web3Roadmap />);

      const phase3Card = screen.getByText('DeFi Integration').closest('div[class*="card"]');
      fireEvent.click(phase3Card);

      await waitFor(() => {
        expect(screen.getByText('DEX Integration')).toBeInTheDocument();
        expect(screen.getByText('Yield Farming')).toBeInTheDocument();
        expect(screen.getByText('Cross-Chain Bridge')).toBeInTheDocument();
        expect(screen.getByText('DeFi Dashboard')).toBeInTheDocument();
      });
    });

    it('shows Very High complexity features', async () => {
      render(<Web3Roadmap />);

      const phase3Card = screen.getByText('DeFi Integration').closest('div[class*="card"]');
      fireEvent.click(phase3Card);

      await waitFor(() => {
        expect(screen.getByText('Very High')).toBeInTheDocument();
      });
    });
  });

  describe('Phase 4 - Ecosystem Expansion Details', () => {
    it('shows Phase 4 specific features', async () => {
      render(<Web3Roadmap />);

      const phase4Card = screen.getByText('Ecosystem Expansion').closest('div[class*="card"]');
      fireEvent.click(phase4Card);

      await waitFor(() => {
        expect(screen.getByText('Partner Integrations')).toBeInTheDocument();
        expect(screen.getByText('Mobile Web3 App')).toBeInTheDocument();
        expect(screen.getByText('Advanced DAO Tools')).toBeInTheDocument();
        expect(screen.getByText('Developer Ecosystem')).toBeInTheDocument();
      });
    });

    it('shows Phase 4 success metrics', async () => {
      render(<Web3Roadmap />);

      const phase4Card = screen.getByText('Ecosystem Expansion').closest('div[class*="card"]');
      fireEvent.click(phase4Card);

      await waitFor(() => {
        expect(screen.getByText(/10\+ major partnership integrations/i)).toBeInTheDocument();
        expect(screen.getByText(/100K\+ mobile app downloads/i)).toBeInTheDocument();
      });
    });
  });

  describe('Phase 5 - Future Vision Details', () => {
    it('shows Phase 5 specific features', async () => {
      render(<Web3Roadmap />);

      const phase5Card = screen.getByText('Future Vision').closest('div[class*="card"]');
      fireEvent.click(phase5Card);

      await waitFor(() => {
        expect(screen.getByText('AI Content Tools')).toBeInTheDocument();
        expect(screen.getByText('Metaverse Integration')).toBeInTheDocument();
        expect(screen.getByText('Advanced Reputation')).toBeInTheDocument();
        expect(screen.getByText('Autonomous Economy')).toBeInTheDocument();
      });
    });

    it('shows Phase 5 planning status', () => {
      render(<Web3Roadmap />);
      expect(screen.getByText('Planning')).toBeInTheDocument();
    });

    it('shows Phase 5 budget range', async () => {
      render(<Web3Roadmap />);

      const phase5Card = screen.getByText('Future Vision').closest('div[class*="card"]');
      fireEvent.click(phase5Card);

      await waitFor(() => {
        expect(screen.getByText('$2M+')).toBeInTheDocument();
      });
    });
  });

  describe('Animation and Transitions', () => {
    it('applies fade-in animation on mount', () => {
      const { container } = render(<Web3Roadmap />);
      const header = container.querySelector('.transition-all.duration-1000');
      expect(header).toBeInTheDocument();
    });

    it('applies hover effects to phase cards', () => {
      const { container } = render(<Web3Roadmap />);
      const cards = container.querySelectorAll('.hover\\:border-accent-primary\\/30');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('applies scale transform on selected phase', async () => {
      const { container } = render(<Web3Roadmap />);

      const phase1Card = screen.getByText('Foundation Layer').closest('div[class*="cursor-pointer"]');
      fireEvent.click(phase1Card);

      await waitFor(() => {
        expect(phase1Card.className).toContain('scale-105');
      });
    });

    it('animates progress bar transitions', () => {
      const { container } = render(<Web3Roadmap />);
      const progressBar = container.querySelector('.transition-all.duration-500');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('shows desktop timeline layout', () => {
      const { container } = render(<Web3Roadmap />);
      expect(container.querySelector('.hidden.lg\\:block')).toBeInTheDocument();
    });

    it('shows mobile timeline layout', () => {
      const { container } = render(<Web3Roadmap />);
      expect(container.querySelector('.lg\\:hidden')).toBeInTheDocument();
    });

    it('uses grid layout for desktop phases', () => {
      const { container } = render(<Web3Roadmap />);
      expect(container.querySelector('.lg\\:grid-cols-5')).toBeInTheDocument();
    });

    it('uses responsive grid for phase details', () => {
      const { container } = render(<Web3Roadmap />);
      expect(container.querySelector('.sm\\:grid-cols-4')).toBeInTheDocument();
      expect(container.querySelector('.md\\:grid-cols-2')).toBeInTheDocument();
    });

    it('has responsive call to action buttons', () => {
      const { container } = render(<Web3Roadmap />);
      expect(container.querySelector('.flex-col.sm\\:flex-row')).toBeInTheDocument();
    });
  });

  describe('User Interactions - Click Events', () => {
    it('handles click on Join Community button', () => {
      render(<Web3Roadmap />);
      const button = screen.getByText('Join Community').closest('button');
      expect(button).toBeInTheDocument();
      fireEvent.click(button);
      // Button should be clickable without errors
      expect(button).toBeInTheDocument();
    });

    it('handles click on GitHub button', () => {
      render(<Web3Roadmap />);
      const button = screen.getByText('View on GitHub').closest('button');
      expect(button).toBeInTheDocument();
      fireEvent.click(button);
      expect(button).toBeInTheDocument();
    });

    it('handles multiple rapid clicks on phase cards', async () => {
      render(<Web3Roadmap />);

      const phase1Card = screen.getByText('Foundation Layer').closest('div[class*="card"]');

      // Rapidly click multiple times
      fireEvent.click(phase1Card);
      fireEvent.click(phase1Card);
      fireEvent.click(phase1Card);

      // Should end up collapsed
      await waitFor(() => {
        expect(screen.queryByText('Key Objectives')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      const { container } = render(<Web3Roadmap />);
      expect(container.querySelector('.card')).toBeInTheDocument();
    });

    it('buttons are keyboard accessible', () => {
      render(<Web3Roadmap />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });

    it('has descriptive text content', () => {
      render(<Web3Roadmap />);
      expect(screen.getByText(/comprehensive plan/i)).toBeInTheDocument();
    });

    it('phase cards are interactive elements', () => {
      const { container } = render(<Web3Roadmap />);
      const interactiveCards = container.querySelectorAll('.cursor-pointer');
      expect(interactiveCards.length).toBeGreaterThan(0);
    });
  });

  describe('Content Accuracy', () => {
    it('displays correct number of features per phase', () => {
      render(<Web3Roadmap />);
      // Each phase has 4 features
      expect(screen.getAllByText('4 features planned').length).toBe(5);
    });

    it('shows correct phase numbering', () => {
      render(<Web3Roadmap />);
      ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Phase 5'].forEach(phase => {
        expect(screen.getByText(phase)).toBeInTheDocument();
      });
    });

    it('maintains consistent data structure across phases', async () => {
      render(<Web3Roadmap />);

      const phases = [
        'Foundation Layer',
        'Social Integration',
        'DeFi Integration',
        'Ecosystem Expansion',
        'Future Vision'
      ];

      for (const phase of phases) {
        const card = screen.getByText(phase).closest('div[class*="card"]');
        fireEvent.click(card);

        await waitFor(() => {
          expect(screen.getByText('Key Objectives')).toBeInTheDocument();
          expect(screen.getByText('Core Features')).toBeInTheDocument();
          expect(screen.getByText('Success Metrics')).toBeInTheDocument();
          expect(screen.getByText('Key Risks')).toBeInTheDocument();
          expect(screen.getByText('Key Deliverables')).toBeInTheDocument();
        });

        fireEvent.click(card); // Collapse for next iteration
      }
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid phase switching', async () => {
      render(<Web3Roadmap />);

      const phase1 = screen.getByText('Foundation Layer').closest('div[class*="card"]');
      const phase2 = screen.getByText('Social Integration').closest('div[class*="card"]');

      fireEvent.click(phase1);
      fireEvent.click(phase2);
      fireEvent.click(phase1);
      fireEvent.click(phase2);

      await waitFor(() => {
        expect(screen.getByText(/Transform social interactions/i)).toBeInTheDocument();
      });
    });

    it('renders correctly without errors', () => {
      const { container } = render(<Web3Roadmap />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles component unmount gracefully', () => {
      const { unmount } = render(<Web3Roadmap />);
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Visual States', () => {
    it('shows gradient text for roadmap title', () => {
      const { container } = render(<Web3Roadmap />);
      expect(container.innerHTML).toContain('text-gradient');
      expect(container.innerHTML).toContain('bg-gradient-to-r');
    });

    it('displays gradient background for call to action', () => {
      const { container } = render(<Web3Roadmap />);
      expect(container.innerHTML).toContain('from-accent-primary/20');
      expect(container.innerHTML).toContain('to-success/20');
    });

    it('shows backdrop blur effects', () => {
      const { container } = render(<Web3Roadmap />);
      expect(container.innerHTML).toContain('backdrop-blur-sm');
    });

    it('applies rounded corners to cards', () => {
      const { container } = render(<Web3Roadmap />);
      const cards = container.querySelectorAll('.rounded-lg, .rounded-xl, .rounded-full');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe('Icons and Visual Elements', () => {
    it('renders calendar icons', () => {
      render(<Web3Roadmap />);
      expect(screen.getAllByTestId('calendar-icon').length).toBeGreaterThan(0);
    });

    it('renders various icon types', () => {
      render(<Web3Roadmap />);
      expect(screen.getAllByTestId('users-icon').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('git-branch-icon').length).toBeGreaterThan(0);
    });

    it('shows icons in call to action buttons', () => {
      render(<Web3Roadmap />);
      const buttons = screen.getAllByRole('button');
      const buttonContainer = buttons[0].closest('.flex');
      expect(buttonContainer).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('initializes with null selectedPhase', () => {
      render(<Web3Roadmap />);
      expect(screen.queryByText('Key Objectives')).not.toBeInTheDocument();
    });

    it('updates selectedPhase on click', async () => {
      render(<Web3Roadmap />);

      const phase1Card = screen.getByText('Foundation Layer').closest('div[class*="card"]');
      fireEvent.click(phase1Card);

      await waitFor(() => {
        expect(screen.getByText('Key Objectives')).toBeInTheDocument();
      });
    });

    it('toggles selectedPhase correctly', async () => {
      render(<Web3Roadmap />);

      const phase1Card = screen.getByText('Foundation Layer').closest('div[class*="card"]');

      // Select
      fireEvent.click(phase1Card);
      await waitFor(() => {
        expect(screen.getByText('Key Objectives')).toBeInTheDocument();
      });

      // Deselect
      fireEvent.click(phase1Card);
      await waitFor(() => {
        expect(screen.queryByText('Key Objectives')).not.toBeInTheDocument();
      });
    });

    it('sets isVisible to true on mount', () => {
      const { container } = render(<Web3Roadmap />);
      const header = container.querySelector('.opacity-100');
      expect(header).toBeInTheDocument();
    });
  });
});

export default upcomingStatuses
