import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import GovernanceDashboard from './GovernanceDashboard';
import * as governanceContracts from '../../lib/contracts/governance-contracts.js';
import { walletManager } from '../../lib/web3/WalletManager.js';
import { transactionManager } from '../../lib/web3/TransactionManager.js';

// Mock dependencies
vi.mock('../../lib/contracts/governance-contracts.js', () => ({
  getDaoGovernor: vi.fn(),
  getTreasury: vi.fn(),
  getMultiSigWallet: vi.fn(),
  PROPOSAL_STATE: {
    PENDING: 0,
    ACTIVE: 1,
    CANCELED: 2,
    DEFEATED: 3,
    SUCCEEDED: 4,
    QUEUED: 5,
    EXPIRED: 6,
    EXECUTED: 7
  },
  VOTE_TYPE: {
    AGAINST: 0,
    FOR: 1,
    ABSTAIN: 2
  },
  getProposalStateName: vi.fn((state) => {
    const names = ['Pending', 'Active', 'Canceled', 'Defeated', 'Succeeded', 'Queued', 'Expired', 'Executed'];
    return names[state] || 'Unknown';
  }),
  getVoteTypeName: vi.fn(),
  calculateProposalResult: vi.fn(),
  MOCK_PROPOSALS: []
}));

vi.mock('../../lib/web3/WalletManager.js', () => ({
  walletManager: {
    isConnected: true,
    account: '0x1234567890123456789012345678901234567890',
    currentChainId: 1,
    connect: vi.fn(),
    on: vi.fn(),
    off: vi.fn()
  }
}));

vi.mock('../../lib/web3/TransactionManager.js', () => ({
  transactionManager: {
    executeTransaction: vi.fn()
  }
}));

vi.mock('@radix-ui/themes', () => ({
  Card: ({ children, className, ...props }) => <div className={className} {...props}>{children}</div>,
  Button: ({ children, onClick, disabled, variant, size, color, className, ...props }) => (
    <button onClick={onClick} disabled={disabled} className={className} {...props}>{children}</button>
  ),
  Badge: ({ children, color }) => <span data-color={color}>{children}</span>,
  Progress: ({ value, className, color }) => <div className={className} data-value={value} data-color={color} />,
  Dialog: {
    Root: ({ children, open, onOpenChange }) => open ? <div data-testid="dialog">{children}</div> : null,
    Content: ({ children, maxWidth }) => <div data-testid="dialog-content" style={{ maxWidth }}>{children}</div>,
    Title: ({ children, className }) => <h2 className={className}>{children}</h2>
  },
  Tabs: ({ children }) => <div>{children}</div>,
  TextArea: ({ value, onChange, placeholder, rows, ...props }) => (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      {...props}
    />
  ),
  Select: ({ children, value, onValueChange }) => {
    const handleChange = (e) => onValueChange && onValueChange(e.target.value);
    return (
      <select value={value} onChange={handleChange}>
        {React.Children.map(children, child => {
          if (child?.type === Select.Trigger) return null;
          if (child?.type === Select.Content) return child;
          return child;
        })}
      </select>
    );
  },
  Separator: () => <hr />
}));

// Mock Dialog component
vi.mock('@radix-ui/themes', async () => {
  const actual = await vi.importActual('@radix-ui/themes');
  return {
    ...actual,
    Dialog: ({ children, open, onOpenChange }) => {
      if (!open) return null;
      return <div data-testid="dialog" onClick={(e) => {
        if (e.target.dataset.testid === 'dialog') {
          onOpenChange?.(false);
        }
      }}>{children}</div>;
    }
  };
});

const Select = ({ children, value, onValueChange }) => {
  const handleChange = (e) => onValueChange && onValueChange(e.target.value);
  return (
    <select value={value} onChange={handleChange} data-testid="select">
      {React.Children.map(children, child => {
        if (child?.type === Select.Trigger) return null;
        if (child?.type === Select.Content) {
          return React.Children.map(child.props.children, item => {
            if (item?.type === Select.Item) {
              return <option value={item.props.value}>{item.props.children}</option>;
            }
            return item;
          });
        }
        return child;
      })}
    </select>
  );
};
Select.Trigger = ({ children }) => <div>{children}</div>;
Select.Content = ({ children }) => <div>{children}</div>;
Select.Item = ({ children, value }) => <option value={value}>{children}</option>;

describe('GovernanceDashboard', () => {
  let mockGovernance;
  let mockTreasury;
  let mockProposals;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock proposals
    mockProposals = [
      {
        id: 1,
        title: 'Proposal 1',
        description: 'Description for proposal 1',
        proposer: '0x1234567890123456789012345678901234567890',
        state: governanceContracts.PROPOSAL_STATE.ACTIVE,
        startBlock: 18400000,
        endBlock: 18600000,
        forVotes: BigInt('1000000000000000000000'),
        againstVotes: BigInt('500000000000000000000'),
        abstainVotes: BigInt('100000000000000000000'),
        quorum: BigInt('800000000000000000000'),
        executed: false
      },
      {
        id: 2,
        title: 'Proposal 2',
        description: 'Description for proposal 2',
        proposer: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        state: governanceContracts.PROPOSAL_STATE.SUCCEEDED,
        startBlock: 18300000,
        endBlock: 18500000,
        forVotes: BigInt('2000000000000000000000'),
        againstVotes: BigInt('300000000000000000000'),
        abstainVotes: BigInt('50000000000000000000'),
        quorum: BigInt('800000000000000000000'),
        executed: false
      },
      {
        id: 3,
        title: 'Proposal 3',
        description: 'Description for proposal 3',
        proposer: '0x9876543210987654321098765432109876543210',
        state: governanceContracts.PROPOSAL_STATE.EXECUTED,
        startBlock: 18200000,
        endBlock: 18400000,
        forVotes: BigInt('3000000000000000000000'),
        againstVotes: BigInt('100000000000000000000'),
        abstainVotes: BigInt('20000000000000000000'),
        quorum: BigInt('800000000000000000000'),
        executed: true
      }
    ];

    mockGovernance = {
      address: '0xGovernanceAddress',
      abi: [
        { name: 'propose' },
        { name: 'castVoteWithReason' },
        { name: 'queue' },
        { name: 'execute' }
      ],
      getProposals: vi.fn().mockResolvedValue({
        proposals: mockProposals,
        total: mockProposals.length
      }),
      getUserVotingPower: vi.fn().mockResolvedValue(BigInt('500000000000000000000000')),
      hasVoted: vi.fn().mockResolvedValue(false)
    };

    mockTreasury = {
      getTreasuryBalance: vi.fn().mockResolvedValue({
        totalValueUSD: 1000000,
        tokens: []
      })
    };

    governanceContracts.getDaoGovernor.mockReturnValue(mockGovernance);
    governanceContracts.getTreasury.mockReturnValue(mockTreasury);
    governanceContracts.calculateProposalResult.mockImplementation((forVotes, againstVotes, quorum) => {
      const totalVotes = Number(forVotes) + Number(againstVotes);
      const forPercentage = totalVotes > 0 ? (Number(forVotes) / totalVotes) * 100 : 0;
      const againstPercentage = totalVotes > 0 ? (Number(againstVotes) / totalVotes) * 100 : 0;
      const quorumReached = Number(forVotes) + Number(againstVotes) >= Number(quorum);
      const passed = forPercentage > againstPercentage && quorumReached;

      return {
        forPercentage,
        againstPercentage,
        quorumReached,
        passed
      };
    });

    walletManager.isConnected = true;
    walletManager.account = '0x1234567890123456789012345678901234567890';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Dashboard Rendering', () => {
    it('should render the dashboard when wallet is connected', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
      });

      expect(screen.getByText('Voting Power')).toBeInTheDocument();
    });

    it('should show connect wallet message when wallet is not connected', () => {
      walletManager.isConnected = false;

      render(<GovernanceDashboard />);

      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      expect(screen.getByText('Connect your wallet to participate in governance')).toBeInTheDocument();
    });

    it('should render header stats correctly', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
      });

      expect(screen.getByText('Voting Power')).toBeInTheDocument();
      expect(screen.getByText('Active Proposals')).toBeInTheDocument();
      expect(screen.getByText('Treasury')).toBeInTheDocument();
      expect(screen.getByText('Participation')).toBeInTheDocument();
    });

    it('should render all stat cards', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
      });

      const votingPower = screen.getByText('500.0K CRYB');
      const activeCount = screen.getByText('1');
      const treasury = screen.getByText('$1,000,000');

      expect(votingPower).toBeInTheDocument();
      expect(activeCount).toBeInTheDocument();
      expect(treasury).toBeInTheDocument();
    });

    it('should render filter and sort controls', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
      });

      const selects = screen.getAllByRole('combobox');
      expect(selects).toHaveLength(2);
    });

    it('should render create proposal button', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /Create Proposal/i });
      expect(createButton).toBeInTheDocument();
    });
  });

  describe('Proposals List', () => {
    it('should render all proposals', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      expect(screen.getByText('Proposal 2')).toBeInTheDocument();
      expect(screen.getByText('Proposal 3')).toBeInTheDocument();
    });

    it('should display proposal titles and descriptions', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      expect(screen.getByText('Description for proposal 1')).toBeInTheDocument();
      expect(screen.getByText('Description for proposal 2')).toBeInTheDocument();
    });

    it('should display proposal states', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Succeeded')).toBeInTheDocument();
      expect(screen.getByText('Executed')).toBeInTheDocument();
    });

    it('should display proposal IDs', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
      expect(screen.getByText('#3')).toBeInTheDocument();
    });

    it('should display truncated proposer addresses', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      expect(screen.getByText(/By 0x1234...7890/)).toBeInTheDocument();
      expect(screen.getByText(/By 0xabcd...abcd/)).toBeInTheDocument();
    });

    it('should show empty state when no proposals exist', async () => {
      mockGovernance.getProposals.mockResolvedValue({
        proposals: [],
        total: 0
      });

      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('No Proposals Found')).toBeInTheDocument();
      });

      expect(screen.getByText('No proposals exist yet.')).toBeInTheDocument();
    });

    it('should display View Details button for each proposal', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const detailButtons = screen.getAllByRole('button', { name: /View Details/i });
      expect(detailButtons).toHaveLength(3);
    });
  });

  describe('Voting Power Display', () => {
    it('should display user voting power correctly', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('500.0K CRYB')).toBeInTheDocument();
      });
    });

    it('should format large voting power with M suffix', async () => {
      mockGovernance.getUserVotingPower.mockResolvedValue(BigInt('5000000000000000000000000'));

      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('5.0M CRYB')).toBeInTheDocument();
      });
    });

    it('should format small voting power without suffix', async () => {
      mockGovernance.getUserVotingPower.mockResolvedValue(BigInt('500000000000000000000'));

      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('500 CRYB')).toBeInTheDocument();
      });
    });

    it('should load voting power on mount', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(mockGovernance.getUserVotingPower).toHaveBeenCalledWith(walletManager.account);
      });
    });
  });

  describe('Active Proposals', () => {
    it('should display active proposals count', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Active Proposals')).toBeInTheDocument();
      });

      const activeCount = screen.getAllByText('1')[0];
      expect(activeCount).toBeInTheDocument();
    });

    it('should show time remaining for active proposals', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/remaining/i)).toBeInTheDocument();
      });
    });

    it('should show vote button for active proposals', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const voteButtons = screen.getAllByRole('button', { name: /Vote/i });
      expect(voteButtons.length).toBeGreaterThan(0);
    });

    it('should not show vote button for non-active proposals', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 2')).toBeInTheDocument();
      });

      const proposal2Card = screen.getByText('Proposal 2').closest('.p-6');
      const voteButton = within(proposal2Card).queryByRole('button', { name: /^Vote$/i });
      expect(voteButton).not.toBeInTheDocument();
    });

    it('should filter to show only active proposals', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const filterSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(filterSelect, { target: { value: 'active' } });

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
        expect(screen.queryByText('Proposal 2')).not.toBeInTheDocument();
        expect(screen.queryByText('Proposal 3')).not.toBeInTheDocument();
      });
    });
  });

  describe('Past Proposals', () => {
    it('should display succeeded proposals', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 2')).toBeInTheDocument();
      });

      expect(screen.getByText('Succeeded')).toBeInTheDocument();
    });

    it('should display executed proposals', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 3')).toBeInTheDocument();
      });

      expect(screen.getByText('Executed')).toBeInTheDocument();
    });

    it('should filter succeeded proposals', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const filterSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(filterSelect, { target: { value: 'succeeded' } });

      await waitFor(() => {
        expect(screen.queryByText('Proposal 1')).not.toBeInTheDocument();
        expect(screen.getByText('Proposal 2')).toBeInTheDocument();
        expect(screen.queryByText('Proposal 3')).not.toBeInTheDocument();
      });
    });

    it('should filter executed proposals', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const filterSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(filterSelect, { target: { value: 'executed' } });

      await waitFor(() => {
        expect(screen.queryByText('Proposal 1')).not.toBeInTheDocument();
        expect(screen.queryByText('Proposal 2')).not.toBeInTheDocument();
        expect(screen.getByText('Proposal 3')).toBeInTheDocument();
      });
    });

    it('should show Queue button for succeeded proposals', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 2')).toBeInTheDocument();
      });

      const queueButton = screen.getByRole('button', { name: /Queue/i });
      expect(queueButton).toBeInTheDocument();
    });
  });

  describe('Vote on Proposal', () => {
    it('should open vote dialog when clicking Vote button', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const voteButton = screen.getAllByRole('button', { name: /Vote/i })[0];
      fireEvent.click(voteButton);

      await waitFor(() => {
        expect(screen.getByText('Cast Your Vote')).toBeInTheDocument();
      });
    });

    it('should display proposal info in vote dialog', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const voteButton = screen.getAllByRole('button', { name: /Vote/i })[0];
      fireEvent.click(voteButton);

      await waitFor(() => {
        expect(screen.getAllByText('Proposal 1')).toHaveLength(2);
        expect(screen.getAllByText('Description for proposal 1')).toHaveLength(2);
      });
    });

    it('should show For, Against, and Abstain vote options', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const voteButton = screen.getAllByRole('button', { name: /Vote/i })[0];
      fireEvent.click(voteButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /For/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Against/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Abstain/i })).toBeInTheDocument();
      });
    });

    it('should allow selecting vote type', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const voteButton = screen.getAllByRole('button', { name: /Vote/i })[0];
      fireEvent.click(voteButton);

      await waitFor(() => {
        const againstButton = screen.getByRole('button', { name: /Against/i });
        fireEvent.click(againstButton);
        expect(againstButton).toBeInTheDocument();
      });
    });

    it('should show reason textarea in vote dialog', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const voteButton = screen.getAllByRole('button', { name: /Vote/i })[0];
      fireEvent.click(voteButton);

      await waitFor(() => {
        const reasonTextarea = screen.getByPlaceholderText(/Explain your reasoning/i);
        expect(reasonTextarea).toBeInTheDocument();
      });
    });

    it('should allow entering vote reason', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const voteButton = screen.getAllByRole('button', { name: /Vote/i })[0];
      fireEvent.click(voteButton);

      await waitFor(() => {
        const reasonTextarea = screen.getByPlaceholderText(/Explain your reasoning/i);
        fireEvent.change(reasonTextarea, { target: { value: 'This is my reason' } });
        expect(reasonTextarea.value).toBe('This is my reason');
      });
    });

    it('should call handleVote when Cast Vote button is clicked', async () => {
      transactionManager.executeTransaction.mockResolvedValue({ hash: '0xhash' });

      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const voteButton = screen.getAllByRole('button', { name: /Vote/i })[0];
      fireEvent.click(voteButton);

      await waitFor(() => {
        const castVoteButton = screen.getByRole('button', { name: /Cast Vote/i });
        fireEvent.click(castVoteButton);
      });

      await waitFor(() => {
        expect(transactionManager.executeTransaction).toHaveBeenCalled();
      });
    });

    it('should disable vote button when user has no voting power', async () => {
      mockGovernance.getUserVotingPower.mockResolvedValue(BigInt(0));

      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const voteButtons = screen.getAllByRole('button', { name: /Vote/i });
      expect(voteButtons[0]).toBeDisabled();
    });

    it('should not show vote button if user has already voted', async () => {
      mockGovernance.hasVoted.mockResolvedValue(true);

      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      await waitFor(() => {
        const proposal1Card = screen.getByText('Proposal 1').closest('.p-6');
        const voteButton = within(proposal1Card).queryByRole('button', { name: /^Vote$/i });
        expect(voteButton).not.toBeInTheDocument();
      });
    });

    it('should show "Voted" badge when user has voted', async () => {
      mockGovernance.hasVoted.mockResolvedValue(true);

      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Voted')).toBeInTheDocument();
      });
    });

    it('should close vote dialog after successful vote', async () => {
      transactionManager.executeTransaction.mockResolvedValue({ hash: '0xhash' });

      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const voteButton = screen.getAllByRole('button', { name: /Vote/i })[0];
      fireEvent.click(voteButton);

      await waitFor(() => {
        expect(screen.getByText('Cast Your Vote')).toBeInTheDocument();
      });

      const castVoteButton = screen.getByRole('button', { name: /Cast Vote/i });
      fireEvent.click(castVoteButton);

      await waitFor(() => {
        expect(screen.queryByText('Cast Your Vote')).not.toBeInTheDocument();
      });
    });
  });

  describe('Create Proposal', () => {
    it('should open create proposal dialog when clicking Create Proposal button', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /Create Proposal/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Create New Proposal')).toBeInTheDocument();
      });
    });

    it('should show title input in create dialog', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /Create Proposal/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Enter proposal title/i)).toBeInTheDocument();
      });
    });

    it('should show description textarea in create dialog', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /Create Proposal/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Provide a detailed description/i)).toBeInTheDocument();
      });
    });

    it('should show proposal type selector', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /Create Proposal/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Proposal Type')).toBeInTheDocument();
      });
    });

    it('should allow entering proposal title', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /Create Proposal/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText(/Enter proposal title/i);
        fireEvent.change(titleInput, { target: { value: 'New Proposal' } });
        expect(titleInput.value).toBe('New Proposal');
      });
    });

    it('should allow entering proposal description', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /Create Proposal/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        const descTextarea = screen.getByPlaceholderText(/Provide a detailed description/i);
        fireEvent.change(descTextarea, { target: { value: 'New Description' } });
        expect(descTextarea.value).toBe('New Description');
      });
    });

    it('should allow selecting proposal type', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /Create Proposal/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Proposal Type')).toBeInTheDocument();
      });
    });

    it('should call handleCreateProposal when Create button is clicked', async () => {
      transactionManager.executeTransaction.mockResolvedValue({ hash: '0xhash' });

      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /Create Proposal/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText(/Enter proposal title/i);
        const descTextarea = screen.getByPlaceholderText(/Provide a detailed description/i);

        fireEvent.change(titleInput, { target: { value: 'New Proposal' } });
        fireEvent.change(descTextarea, { target: { value: 'New Description' } });
      });

      const submitButton = screen.getAllByRole('button', { name: /Create Proposal/i })[1];
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(transactionManager.executeTransaction).toHaveBeenCalled();
      });
    });

    it('should disable create button when voting power is insufficient', async () => {
      mockGovernance.getUserVotingPower.mockResolvedValue(BigInt('50000000000000000000000'));

      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /Create Proposal/i });
      expect(createButton).toBeDisabled();
    });

    it('should show warning about voting power requirement', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /Create Proposal/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/Creating a proposal requires at least 100,000 CRYB/i)).toBeInTheDocument();
      });
    });

    it('should close dialog after successful proposal creation', async () => {
      transactionManager.executeTransaction.mockResolvedValue({ hash: '0xhash' });

      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /Create Proposal/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText(/Enter proposal title/i);
        const descTextarea = screen.getByPlaceholderText(/Provide a detailed description/i);

        fireEvent.change(titleInput, { target: { value: 'New Proposal' } });
        fireEvent.change(descTextarea, { target: { value: 'New Description' } });
      });

      const submitButton = screen.getAllByRole('button', { name: /Create Proposal/i })[1];
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Create New Proposal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Proposal Details', () => {
    it('should open proposal detail dialog when clicking View Details', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const detailButtons = screen.getAllByRole('button', { name: /View Details/i });
      fireEvent.click(detailButtons[0]);

      await waitFor(() => {
        expect(screen.getAllByText('Proposal 1')).toHaveLength(2);
      });
    });

    it('should show full proposal description in detail dialog', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const detailButtons = screen.getAllByRole('button', { name: /View Details/i });
      fireEvent.click(detailButtons[0]);

      await waitFor(() => {
        expect(screen.getAllByText('Description for proposal 1')).toHaveLength(2);
      });
    });

    it('should show proposal ID in detail dialog', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const detailButtons = screen.getAllByRole('button', { name: /View Details/i });
      fireEvent.click(detailButtons[0]);

      await waitFor(() => {
        expect(screen.getAllByText('#1')).toHaveLength(2);
      });
    });

    it('should show proposer address in detail dialog', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const detailButtons = screen.getAllByRole('button', { name: /View Details/i });
      fireEvent.click(detailButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Proposer:')).toBeInTheDocument();
      });
    });

    it('should show start and end blocks in detail dialog', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const detailButtons = screen.getAllByRole('button', { name: /View Details/i });
      fireEvent.click(detailButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Start Block:')).toBeInTheDocument();
        expect(screen.getByText('End Block:')).toBeInTheDocument();
      });
    });

    it('should show voting results in detail dialog', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const detailButtons = screen.getAllByRole('button', { name: /View Details/i });
      fireEvent.click(detailButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Voting Results')).toBeInTheDocument();
      });
    });

    it('should show quorum requirement in detail dialog', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const detailButtons = screen.getAllByRole('button', { name: /View Details/i });
      fireEvent.click(detailButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Quorum Required')).toBeInTheDocument();
      });
    });

    it('should show vote button in detail dialog for active proposals', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const detailButtons = screen.getAllByRole('button', { name: /View Details/i });
      fireEvent.click(detailButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Cast Your Vote/i })).toBeInTheDocument();
      });
    });
  });

  describe('Voting Results', () => {
    it('should display vote counts for For votes', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      expect(screen.getAllByText(/1.0K/i).length).toBeGreaterThan(0);
    });

    it('should display vote counts for Against votes', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      expect(screen.getAllByText(/500/i).length).toBeGreaterThan(0);
    });

    it('should display vote counts for Abstain votes', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      expect(screen.getAllByText(/100/i).length).toBeGreaterThan(0);
    });

    it('should display voting progress bars', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const progressBars = screen.getAllByTestId((content, element) => {
        return element.className?.includes('h-2');
      });
      expect(progressBars.length).toBeGreaterThan(0);
    });

    it('should show quorum reached indicator when quorum is met', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      expect(screen.getByText(/Quorum/i)).toBeInTheDocument();
    });

    it('should show passing indicator when proposal is passing', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      expect(screen.getByText(/Passing/i)).toBeInTheDocument();
    });

    it('should calculate vote percentages correctly', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(governanceContracts.calculateProposalResult).toHaveBeenCalled();
      });
    });
  });

  describe('Delegation', () => {
    it('should display current voting power', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('500.0K CRYB')).toBeInTheDocument();
      });
    });

    it('should show participation rate', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Participation')).toBeInTheDocument();
      });
    });

    it('should calculate participation percentage correctly', async () => {
      mockGovernance.hasVoted.mockResolvedValue(true);

      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Participation')).toBeInTheDocument();
      });

      await waitFor(() => {
        const participationText = screen.getByText(/\d+%/);
        expect(participationText).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should call getProposals on mount', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(mockGovernance.getProposals).toHaveBeenCalledWith(1, 20);
      });
    });

    it('should call getUserVotingPower on mount', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(mockGovernance.getUserVotingPower).toHaveBeenCalledWith(walletManager.account);
      });
    });

    it('should call getTreasuryBalance on mount', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(mockTreasury.getTreasuryBalance).toHaveBeenCalled();
      });
    });

    it('should reload data after creating proposal', async () => {
      transactionManager.executeTransaction.mockResolvedValue({ hash: '0xhash' });

      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const initialCallCount = mockGovernance.getProposals.mock.calls.length;

      const createButton = screen.getByRole('button', { name: /Create Proposal/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText(/Enter proposal title/i);
        const descTextarea = screen.getByPlaceholderText(/Provide a detailed description/i);

        fireEvent.change(titleInput, { target: { value: 'New Proposal' } });
        fireEvent.change(descTextarea, { target: { value: 'New Description' } });
      });

      const submitButton = screen.getAllByRole('button', { name: /Create Proposal/i })[1];
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockGovernance.getProposals.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });

    it('should reload data after casting vote', async () => {
      transactionManager.executeTransaction.mockResolvedValue({ hash: '0xhash' });

      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const initialCallCount = mockGovernance.getProposals.mock.calls.length;

      const voteButton = screen.getAllByRole('button', { name: /Vote/i })[0];
      fireEvent.click(voteButton);

      await waitFor(() => {
        const castVoteButton = screen.getByRole('button', { name: /Cast Vote/i });
        fireEvent.click(castVoteButton);
      });

      await waitFor(() => {
        expect(mockGovernance.getProposals.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });

    it('should check hasVoted for each proposal', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(mockGovernance.hasVoted).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading skeleton initially', () => {
      render(<GovernanceDashboard />);

      expect(screen.getByText((content, element) => {
        return element?.classList?.contains('animate-pulse');
      })).toBeInTheDocument();
    });

    it('should hide loading skeleton after data loads', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.queryByText((content, element) => {
          return element?.classList?.contains('animate-pulse');
        })).not.toBeInTheDocument();
      });
    });

    it('should show loading state when wallet is not connected', () => {
      walletManager.isConnected = false;

      render(<GovernanceDashboard />);

      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle proposal loading error gracefully', async () => {
      mockGovernance.getProposals.mockRejectedValue(new Error('Failed to load'));

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to load governance data:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });

    it('should handle vote casting error gracefully', async () => {
      transactionManager.executeTransaction.mockRejectedValue(new Error('Transaction failed'));

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const voteButton = screen.getAllByRole('button', { name: /Vote/i })[0];
      fireEvent.click(voteButton);

      await waitFor(() => {
        const castVoteButton = screen.getByRole('button', { name: /Cast Vote/i });
        fireEvent.click(castVoteButton);
      });

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to cast vote:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });

    it('should handle proposal creation error gracefully', async () => {
      transactionManager.executeTransaction.mockRejectedValue(new Error('Transaction failed'));

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /Create Proposal/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText(/Enter proposal title/i);
        const descTextarea = screen.getByPlaceholderText(/Provide a detailed description/i);

        fireEvent.change(titleInput, { target: { value: 'New Proposal' } });
        fireEvent.change(descTextarea, { target: { value: 'New Description' } });
      });

      const submitButton = screen.getAllByRole('button', { name: /Create Proposal/i })[1];
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to create proposal:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });

    it('should handle queue proposal error gracefully', async () => {
      transactionManager.executeTransaction.mockRejectedValue(new Error('Transaction failed'));

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 2')).toBeInTheDocument();
      });

      const queueButton = screen.getByRole('button', { name: /Queue/i });
      fireEvent.click(queueButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to queue proposal:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });

    it('should handle execute proposal error gracefully', async () => {
      const queuedProposal = {
        ...mockProposals[1],
        state: governanceContracts.PROPOSAL_STATE.QUEUED,
        eta: Date.now() - 1000
      };

      mockGovernance.getProposals.mockResolvedValue({
        proposals: [queuedProposal],
        total: 1
      });

      transactionManager.executeTransaction.mockRejectedValue(new Error('Transaction failed'));

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Execute/i })).toBeInTheDocument();
      });

      const executeButton = screen.getByRole('button', { name: /Execute/i });
      fireEvent.click(executeButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          'Failed to execute proposal:',
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });

    it('should handle insufficient voting power for creating proposal', async () => {
      mockGovernance.getUserVotingPower.mockResolvedValue(BigInt('50000000000000000000000'));

      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /Create Proposal/i });
      expect(createButton).toBeDisabled();
    });

    it('should handle already voted error', async () => {
      mockGovernance.hasVoted.mockResolvedValue(true);

      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const proposal1Card = screen.getByText('Proposal 1').closest('.p-6');
      const voteButton = within(proposal1Card).queryByRole('button', { name: /^Vote$/i });
      expect(voteButton).not.toBeInTheDocument();
    });
  });

  describe('Filtering and Sorting', () => {
    it('should sort proposals by newest by default', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const proposals = screen.getAllByText(/Proposal \d/);
      expect(proposals[0]).toHaveTextContent('Proposal 1');
    });

    it('should sort proposals by oldest', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const sortSelect = screen.getAllByRole('combobox')[1];
      fireEvent.change(sortSelect, { target: { value: 'oldest' } });

      await waitFor(() => {
        const proposals = screen.getAllByText(/Proposal \d/);
        expect(proposals[0]).toHaveTextContent('Proposal 3');
      });
    });

    it('should sort proposals by most votes', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const sortSelect = screen.getAllByRole('combobox')[1];
      fireEvent.change(sortSelect, { target: { value: 'mostVotes' } });

      await waitFor(() => {
        const proposals = screen.getAllByText(/Proposal \d/);
        expect(proposals[0]).toHaveTextContent('Proposal 3');
      });
    });

    it('should sort proposals by ending soon', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const sortSelect = screen.getAllByRole('combobox')[1];
      fireEvent.change(sortSelect, { target: { value: 'ending' } });

      await waitFor(() => {
        const proposals = screen.getAllByText(/Proposal \d/);
        expect(proposals).toHaveLength(3);
      });
    });

    it('should filter failed proposals', async () => {
      const failedProposal = {
        ...mockProposals[0],
        id: 4,
        title: 'Failed Proposal',
        state: governanceContracts.PROPOSAL_STATE.DEFEATED
      };

      mockGovernance.getProposals.mockResolvedValue({
        proposals: [...mockProposals, failedProposal],
        total: 4
      });

      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Failed Proposal')).toBeInTheDocument();
      });

      const filterSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(filterSelect, { target: { value: 'failed' } });

      await waitFor(() => {
        expect(screen.getByText('Failed Proposal')).toBeInTheDocument();
        expect(screen.queryByText('Proposal 1')).not.toBeInTheDocument();
      });
    });

    it('should show appropriate empty state message when filtering', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 1')).toBeInTheDocument();
      });

      const filterSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(filterSelect, { target: { value: 'failed' } });

      await waitFor(() => {
        expect(screen.getByText('No Proposals Found')).toBeInTheDocument();
        expect(screen.getByText(/No failed proposals found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Wallet Event Listeners', () => {
    it('should setup wallet event listeners on mount', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(walletManager.on).toHaveBeenCalledWith('accountChanged', expect.any(Function));
        expect(walletManager.on).toHaveBeenCalledWith('chainChanged', expect.any(Function));
      });
    });

    it('should cleanup wallet event listeners on unmount', async () => {
      const { unmount } = render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(walletManager.on).toHaveBeenCalled();
      });

      unmount();

      expect(walletManager.off).toHaveBeenCalledWith('accountChanged', expect.any(Function));
      expect(walletManager.off).toHaveBeenCalledWith('chainChanged', expect.any(Function));
    });
  });

  describe('Treasury Display', () => {
    it('should display treasury balance', async () => {
      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('$1,000,000')).toBeInTheDocument();
      });
    });

    it('should handle zero treasury balance', async () => {
      mockTreasury.getTreasuryBalance.mockResolvedValue({
        totalValueUSD: 0,
        tokens: []
      });

      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('$0')).toBeInTheDocument();
      });
    });
  });

  describe('Proposal Actions', () => {
    it('should show Execute button for queued proposals past ETA', async () => {
      const queuedProposal = {
        ...mockProposals[1],
        state: governanceContracts.PROPOSAL_STATE.QUEUED,
        eta: Date.now() - 1000
      };

      mockGovernance.getProposals.mockResolvedValue({
        proposals: [queuedProposal],
        total: 1
      });

      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Execute/i })).toBeInTheDocument();
      });
    });

    it('should not show Execute button for queued proposals before ETA', async () => {
      const queuedProposal = {
        ...mockProposals[1],
        state: governanceContracts.PROPOSAL_STATE.QUEUED,
        eta: Date.now() + 10000
      };

      mockGovernance.getProposals.mockResolvedValue({
        proposals: [queuedProposal],
        total: 1
      });

      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Execute/i })).not.toBeInTheDocument();
      });
    });

    it('should call handleQueueProposal when Queue button is clicked', async () => {
      transactionManager.executeTransaction.mockResolvedValue({ hash: '0xhash' });

      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Proposal 2')).toBeInTheDocument();
      });

      const queueButton = screen.getByRole('button', { name: /Queue/i });
      fireEvent.click(queueButton);

      await waitFor(() => {
        expect(transactionManager.executeTransaction).toHaveBeenCalled();
      });
    });

    it('should call handleExecuteProposal when Execute button is clicked', async () => {
      const queuedProposal = {
        ...mockProposals[1],
        state: governanceContracts.PROPOSAL_STATE.QUEUED,
        eta: Date.now() - 1000
      };

      mockGovernance.getProposals.mockResolvedValue({
        proposals: [queuedProposal],
        total: 1
      });

      transactionManager.executeTransaction.mockResolvedValue({ hash: '0xhash' });

      render(<GovernanceDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Execute/i })).toBeInTheDocument();
      });

      const executeButton = screen.getByRole('button', { name: /Execute/i });
      fireEvent.click(executeButton);

      await waitFor(() => {
        expect(transactionManager.executeTransaction).toHaveBeenCalled();
      });
    });
  });
});

export default names
