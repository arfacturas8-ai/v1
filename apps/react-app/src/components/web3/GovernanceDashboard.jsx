import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Badge, Progress, Dialog, Tabs, TextArea, Select, Separator } from '@radix-ui/themes';
import { 
  Vote, Users, Clock, CheckCircle, XCircle, AlertCircle, 
  TrendingUp, MessageSquare, ExternalLink, Filter,
  ThumbsUp, ThumbsDown, Minus, Calendar, DollarSign
} from 'lucide-react';
import { 
  getDaoGovernor, 
  getTreasury, 
  getMultiSigWallet,
  PROPOSAL_STATE, 
  VOTE_TYPE,
  getProposalStateName,
  getVoteTypeName,
  calculateProposalResult,
  MOCK_PROPOSALS
} from '../../lib/contracts/governance-contracts.js';
import { walletManager } from '../../lib/web3/WalletManager.js';
import { transactionManager } from '../../lib/web3/TransactionManager.js';

const GovernanceDashboard = () => {
  const [proposals, setProposals] = useState([]);
  const [userVotes, setUserVotes] = useState(new Map());
  const [votingPower, setVotingPower] = useState(BigInt(0));
  const [treasuryData, setTreasuryData] = useState(null);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showCreateProposal, setShowCreateProposal] = useState(false);
  const [showVoteDialog, setShowVoteDialog] = useState(false);
  const [voteReason, setVoteReason] = useState('');
  const [selectedVoteType, setSelectedVoteType] = useState(VOTE_TYPE.FOR);
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    type: 'general'
  });

  const governance = getDaoGovernor(walletManager.currentChainId || 1);
  const treasury = getTreasury(walletManager.currentChainId || 1);

  // Load governance data
  const loadGovernanceData = useCallback(async () => {
    if (!walletManager.isConnected) return;

    try {
      setLoading(true);

      const [proposalsData, userVotingPower, treasuryBalance] = await Promise.all([
        governance.getProposals(1, 20),
        governance.getUserVotingPower(walletManager.account),
        treasury.getTreasuryBalance()
      ]);

      setProposals(proposalsData.proposals);
      setVotingPower(userVotingPower);
      setTreasuryData(treasuryBalance);

      // Load user votes for each proposal
      const votes = new Map();
      for (const proposal of proposalsData.proposals) {
        try {
          const hasVoted = await governance.hasVoted(walletManager.account, proposal.id);
          if (hasVoted) {
            votes.set(proposal.id, true);
          }
        } catch (error) {
        }
      }
      setUserVotes(votes);

    } catch (error) {
      console.error('Failed to load governance data:', error);
    } finally {
      setLoading(false);
    }
  }, [walletManager.isConnected, walletManager.account]);

  // Filter and sort proposals
  const filteredProposals = proposals
    .filter(proposal => {
      switch (filter) {
        case 'active':
          return proposal.state === PROPOSAL_STATE.ACTIVE;
        case 'succeeded':
          return proposal.state === PROPOSAL_STATE.SUCCEEDED;
        case 'executed':
          return proposal.state === PROPOSAL_STATE.EXECUTED;
        case 'failed':
          return proposal.state === PROPOSAL_STATE.DEFEATED || 
                 proposal.state === PROPOSAL_STATE.CANCELED;
        default:
          return true;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.startBlock - a.startBlock;
        case 'oldest':
          return a.startBlock - b.startBlock;
        case 'mostVotes':
          return (Number(b.forVotes) + Number(b.againstVotes)) - 
                 (Number(a.forVotes) + Number(a.againstVotes));
        case 'ending':
          return a.endBlock - b.endBlock;
        default:
          return 0;
      }
    });

  // Create new proposal
  const handleCreateProposal = async () => {
    if (!newProposal.title || !newProposal.description) return;

    try {
      // Check if user has enough voting power to create proposals
      const proposalThreshold = BigInt('100000') * BigInt(10 ** 18); // 100k CRYB
      if (votingPower < proposalThreshold) {
        throw new Error('Insufficient voting power to create proposals');
      }

      const txResult = await transactionManager.executeTransaction({
        to: governance.address,
        data: governance.abi.find(f => f.name === 'propose'),
        value: 0
      }, {
        priority: 'standard',
        gasStrategy: 'moderate'
      });

      // Reset form and close dialog
      setNewProposal({ title: '', description: '', type: 'general' });
      setShowCreateProposal(false);
      
      // Reload proposals
      await loadGovernanceData();

    } catch (error) {
      console.error('Failed to create proposal:', error);
    }
  };

  // Cast vote
  const handleVote = async (proposalId, support) => {
    if (!walletManager.isConnected) return;

    try {
      // Check if user has already voted
      if (userVotes.has(proposalId)) {
        throw new Error('You have already voted on this proposal');
      }

      const txResult = await transactionManager.executeTransaction({
        to: governance.address,
        data: governance.abi.find(f => f.name === 'castVoteWithReason'),
        value: 0
      }, {
        priority: 'fast',
        gasStrategy: 'moderate'
      });

      // Update local state
      setUserVotes(prev => new Map(prev.set(proposalId, true)));
      setShowVoteDialog(false);
      setVoteReason('');
      
      // Reload proposals to get updated vote counts
      await loadGovernanceData();

    } catch (error) {
      console.error('Failed to cast vote:', error);
    }
  };

  // Queue proposal for execution
  const handleQueueProposal = async (proposalId) => {
    try {
      const txResult = await transactionManager.executeTransaction({
        to: governance.address,
        data: governance.abi.find(f => f.name === 'queue'),
        value: 0
      }, {
        priority: 'standard',
        gasStrategy: 'moderate'
      });

      await loadGovernanceData();
    } catch (error) {
      console.error('Failed to queue proposal:', error);
    }
  };

  // Execute proposal
  const handleExecuteProposal = async (proposalId) => {
    try {
      const txResult = await transactionManager.executeTransaction({
        to: governance.address,
        data: governance.abi.find(f => f.name === 'execute'),
        value: 0
      }, {
        priority: 'standard',
        gasStrategy: 'moderate'
      });

      await loadGovernanceData();
    } catch (error) {
      console.error('Failed to execute proposal:', error);
    }
  };

  // Format vote counts
  const formatVotes = (amount) => {
    const num = Number(amount) / (10 ** 18);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
  };

  // Get proposal status color
  const getStatusColor = (state) => {
    switch (state) {
      case PROPOSAL_STATE.ACTIVE:
        return 'blue';
      case PROPOSAL_STATE.SUCCEEDED:
        return 'green';
      case PROPOSAL_STATE.EXECUTED:
        return 'gray';
      case PROPOSAL_STATE.DEFEATED:
      case PROPOSAL_STATE.CANCELED:
        return 'red';
      case PROPOSAL_STATE.QUEUED:
        return 'yellow';
      default:
        return 'gray';
    }
  };

  // Calculate time remaining for active proposals
  const getTimeRemaining = (endBlock) => {
    const currentBlock = 18500000; // Mock current block
    const blocksRemaining = endBlock - currentBlock;
    const hoursRemaining = (blocksRemaining * 15) / 3600; // 15 seconds per block
    
    if (hoursRemaining <= 0) return 'Ended';
    if (hoursRemaining < 24) return `${Math.floor(hoursRemaining)}h remaining`;
    const daysRemaining = Math.floor(hoursRemaining / 24);
    return `${daysRemaining}d remaining`;
  };

  useEffect(() => {
    loadGovernanceData();
  }, [loadGovernanceData]);

  useEffect(() => {
    // Setup wallet event listeners
    const handleAccountChanged = () => loadGovernanceData();
    const handleChainChanged = () => loadGovernanceData();
    
    walletManager.on('accountChanged', handleAccountChanged);
    walletManager.on('chainChanged', handleChainChanged);
    
    return () => {
      walletManager.off('accountChanged', handleAccountChanged);
      walletManager.off('chainChanged', handleChainChanged);
    };
  }, [loadGovernanceData]);

  if (!walletManager.isConnected) {
    return (
      <Card style={{
  padding: '24px',
  textAlign: 'center'
}}>
        <div className="mb-4">
          <Vote style={{
  width: '48px',
  height: '48px',
  color: '#A0A0A0'
}} />
        </div>
        <h3 style={{
  fontWeight: '600'
}}>Connect Wallet</h3>
        <p style={{
  color: '#A0A0A0'
}}>
          Connect your wallet to participate in governance
        </p>
        <Button onClick={() => walletManager.connect()}>
          Connect Wallet
        </Button>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card style={{
  padding: '24px'
}}>
        <div className=" space-y-4">
          <div style={{
  height: '24px',
  background: 'rgba(20, 20, 20, 0.6)',
  borderRadius: '4px'
}}></div>
          <div style={{
  height: '16px',
  background: 'rgba(20, 20, 20, 0.6)',
  borderRadius: '4px'
}}></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} style={{
  height: '96px',
  background: 'rgba(20, 20, 20, 0.6)',
  borderRadius: '4px'
}}></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div style={{
  display: 'grid',
  gap: '16px'
}}>
        <Card style={{
  padding: '16px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
            <div style={{
  padding: '8px',
  borderRadius: '12px'
}}>
              <Vote style={{
  width: '20px',
  height: '20px'
}} />
            </div>
            <div>
              <p style={{
  color: '#A0A0A0'
}}>Voting Power</p>
              <p style={{
  fontWeight: '600'
}}>
                {formatVotes(votingPower)} CRYB
              </p>
            </div>
          </div>
        </Card>

        <Card style={{
  padding: '16px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
            <div style={{
  padding: '8px',
  borderRadius: '12px'
}}>
              <Users style={{
  width: '20px',
  height: '20px'
}} />
            </div>
            <div>
              <p style={{
  color: '#A0A0A0'
}}>Active Proposals</p>
              <p style={{
  fontWeight: '600'
}}>
                {proposals.filter(p => p.state === PROPOSAL_STATE.ACTIVE).length}
              </p>
            </div>
          </div>
        </Card>

        <Card style={{
  padding: '16px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
            <div style={{
  padding: '8px',
  borderRadius: '12px'
}}>
              <DollarSign style={{
  width: '20px',
  height: '20px'
}} />
            </div>
            <div>
              <p style={{
  color: '#A0A0A0'
}}>Treasury</p>
              <p style={{
  fontWeight: '600'
}}>
                ${treasuryData?.totalValueUSD?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </Card>

        <Card style={{
  padding: '16px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
            <div style={{
  padding: '8px',
  borderRadius: '12px'
}}>
              <CheckCircle style={{
  width: '20px',
  height: '20px'
}} />
            </div>
            <div>
              <p style={{
  color: '#A0A0A0'
}}>Participation</p>
              <p style={{
  fontWeight: '600'
}}>
                {((userVotes.size / Math.max(proposals.length, 1)) * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Controls */}
      <div style={{
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  alignItems: 'flex-start'
}}>
        <div style={{
  display: 'flex'
}}>
          <Select value={filter} onValueChange={setFilter}>
            <Select.Trigger style={{
  width: '128px'
}}>
              <Filter style={{
  width: '16px',
  height: '16px'
}} />
              {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="all">All</Select.Item>
              <Select.Item value="active">Active</Select.Item>
              <Select.Item value="succeeded">Succeeded</Select.Item>
              <Select.Item value="executed">Executed</Select.Item>
              <Select.Item value="failed">Failed</Select.Item>
            </Select.Content>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <Select.Trigger style={{
  width: '128px'
}}>
              {sortBy === 'newest' ? 'Newest' :
               sortBy === 'oldest' ? 'Oldest' :
               sortBy === 'mostVotes' ? 'Most Votes' : 'Ending Soon'}
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="newest">Newest</Select.Item>
              <Select.Item value="oldest">Oldest</Select.Item>
              <Select.Item value="mostVotes">Most Votes</Select.Item>
              <Select.Item value="ending">Ending Soon</Select.Item>
            </Select.Content>
          </Select>
        </div>

        <Button 
          onClick={() => setShowCreateProposal(true)}
          disabled={votingPower < BigInt('100000') * BigInt(10 ** 18)}
        >
          <MessageSquare style={{
  width: '16px',
  height: '16px'
}} />
          Create Proposal
        </Button>
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        {filteredProposals.map((proposal) => {
          const result = calculateProposalResult(proposal.forVotes, proposal.againstVotes, proposal.quorum);
          const hasVoted = userVotes.has(proposal.id);
          
          return (
            <Card key={proposal.id} style={{
  padding: '24px'
}}>
              <div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start'
}}>
                <div style={{
  flex: '1'
}}>
                  <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                    <h3 style={{
  fontWeight: '600'
}}>{proposal.title}</h3>
                    <Badge color={getStatusColor(proposal.state)}>
                      {getProposalStateName(proposal.state)}
                    </Badge>
                    {hasVoted && (
                      <Badge color="gray">
                        <Vote style={{
  width: '12px',
  height: '12px'
}} />
                        Voted
                      </Badge>
                    )}
                  </div>
                  
                  <p style={{
  color: '#A0A0A0'
}}>
                    {proposal.description}
                  </p>
                  
                  <div style={{
  display: 'flex',
  alignItems: 'center',
  color: '#A0A0A0'
}}>
                    <span>#{proposal.id}</span>
                    <span>By {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}</span>
                    {proposal.state === PROPOSAL_STATE.ACTIVE && (
                      <span style={{
  display: 'flex',
  alignItems: 'center'
}}>
                        <Clock style={{
  width: '12px',
  height: '12px'
}} />
                        {getTimeRemaining(proposal.endBlock)}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{
  display: 'flex'
}}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedProposal(proposal)}
                  >
                    View Details
                  </Button>
                  
                  {proposal.state === PROPOSAL_STATE.ACTIVE && !hasVoted && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedProposal(proposal);
                        setShowVoteDialog(true);
                      }}
                      disabled={votingPower === BigInt(0)}
                    >
                      <Vote style={{
  width: '16px',
  height: '16px'
}} />
                      Vote
                    </Button>
                  )}
                  
                  {proposal.state === PROPOSAL_STATE.SUCCEEDED && !proposal.executed && (
                    <Button
                      size="sm"
                      color="green"
                      onClick={() => handleQueueProposal(proposal.id)}
                    >
                      Queue
                    </Button>
                  )}
                  
                  {proposal.state === PROPOSAL_STATE.QUEUED && proposal.eta && Date.now() >= proposal.eta && (
                    <Button
                      size="sm"
                      color="green"
                      onClick={() => handleExecuteProposal(proposal.id)}
                    >
                      Execute
                    </Button>
                  )}
                </div>
              </div>

              {/* Voting Progress */}
              <div className="space-y-3">
                <div style={{
  display: 'flex',
  justifyContent: 'space-between'
}}>
                  <span style={{
  color: '#A0A0A0'
}}>Voting Progress</span>
                  <span style={{
  fontWeight: '600'
}}>
                    {formatVotes(proposal.forVotes + proposal.againstVotes)} / {formatVotes(proposal.quorum)} votes
                  </span>
                </div>

                <div className="space-y-2">
                  {/* For votes */}
                  <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                    <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                      <ThumbsUp style={{
  width: '16px',
  height: '16px'
}} />
                      <span style={{
  fontWeight: '600'
}}>For</span>
                    </div>
                    <div style={{
  flex: '1'
}}>
                      <Progress value={result.forPercentage} style={{
  height: '8px'
}} color="green" />
                    </div>
                    <span style={{
  fontWeight: '600',
  textAlign: 'right'
}}>
                      {formatVotes(proposal.forVotes)} ({result.forPercentage.toFixed(1)}%)
                    </span>
                  </div>

                  {/* Against votes */}
                  <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                    <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                      <ThumbsDown style={{
  width: '16px',
  height: '16px'
}} />
                      <span style={{
  fontWeight: '600'
}}>Against</span>
                    </div>
                    <div style={{
  flex: '1'
}}>
                      <Progress value={result.againstPercentage} style={{
  height: '8px'
}} color="red" />
                    </div>
                    <span style={{
  fontWeight: '600',
  textAlign: 'right'
}}>
                      {formatVotes(proposal.againstVotes)} ({result.againstPercentage.toFixed(1)}%)
                    </span>
                  </div>

                  {/* Abstain votes */}
                  <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                    <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                      <Minus style={{
  width: '16px',
  height: '16px',
  color: '#A0A0A0'
}} />
                      <span style={{
  color: '#A0A0A0',
  fontWeight: '600'
}}>Abstain</span>
                    </div>
                    <div style={{
  flex: '1'
}}>
                      <Progress 
                        value={proposal.abstainVotes > 0 ? (Number(proposal.abstainVotes) / Number(proposal.forVotes + proposal.againstVotes + proposal.abstainVotes)) * 100 : 0} 
                        style={{
  height: '8px'
}} 
                        color="gray" 
                      />
                    </div>
                    <span style={{
  fontWeight: '600',
  textAlign: 'right'
}}>
                      {formatVotes(proposal.abstainVotes)}
                    </span>
                  </div>
                </div>

                {/* Quorum indicator */}
                <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                  <span style={{
  display: 'flex',
  alignItems: 'center'
}}>
                    {result.quorumReached ? <CheckCircle style={{
  width: '12px',
  height: '12px'
}} /> : <AlertCircle style={{
  width: '12px',
  height: '12px'
}} />}
                    <span>Quorum {result.quorumReached ? 'Reached' : 'Required'}</span>
                  </span>
                  
                  {result.passed && (
                    <span style={{
  display: 'flex',
  alignItems: 'center'
}}>
                      <CheckCircle style={{
  width: '12px',
  height: '12px'
}} />
                      <span>Passing</span>
                    </span>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredProposals.length === 0 && (
        <Card style={{
  padding: '24px',
  textAlign: 'center'
}}>
          <Vote style={{
  width: '48px',
  height: '48px',
  color: '#A0A0A0'
}} />
          <h3 style={{
  fontWeight: '600'
}}>No Proposals Found</h3>
          <p style={{
  color: '#A0A0A0'
}}>
            {filter === 'all' ? 'No proposals exist yet.' : `No ${filter} proposals found.`}
          </p>
        </Card>
      )}

      {/* Create Proposal Dialog */}
      <Dialog open={showCreateProposal} onOpenChange={setShowCreateProposal}>
        <Dialog.Content maxWidth="600px">
          <Dialog.Title>Create New Proposal</Dialog.Title>
          
          <div className="space-y-4 mt-4">
            <div>
              <label style={{
  display: 'block',
  fontWeight: '500'
}}>
                Proposal Title
              </label>
              <input
                type="text"
                style={{
  width: '100%',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}
                placeholder="Enter proposal title..."
                value={newProposal.title}
                onChange={(e) => setNewProposal(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div>
              <label style={{
  display: 'block',
  fontWeight: '500'
}}>
                Proposal Type
              </label>
              <Select 
                value={newProposal.type} 
                onValueChange={(value) => setNewProposal(prev => ({ ...prev, type: value }))}
              >
                <Select.Trigger style={{
  width: '100%'
}}>
                  {newProposal.type === 'general' ? 'General' :
                   newProposal.type === 'treasury' ? 'Treasury' :
                   newProposal.type === 'protocol' ? 'Protocol Update' : 'Parameter Change'}
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="general">General</Select.Item>
                  <Select.Item value="treasury">Treasury</Select.Item>
                  <Select.Item value="protocol">Protocol Update</Select.Item>
                  <Select.Item value="parameter">Parameter Change</Select.Item>
                </Select.Content>
              </Select>
            </div>

            <div>
              <label style={{
  display: 'block',
  fontWeight: '500'
}}>
                Description
              </label>
              <TextArea
                placeholder="Provide a detailed description of your proposal..."
                value={newProposal.description}
                onChange={(e) => setNewProposal(prev => ({ ...prev, description: e.target.value }))}
                rows={6}
              />
            </div>

            <div style={{
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
              <div style={{
  display: 'flex',
  alignItems: 'flex-start'
}}>
                <AlertCircle style={{
  width: '16px',
  height: '16px'
}} />
                <div>
                  <p className="text-sm text-yellow-800">
                    Creating a proposal requires at least 100,000 CRYB voting power.
                    Your current voting power: {formatVotes(votingPower)} CRYB
                  </p>
                </div>
              </div>
            </div>

            <div style={{
  display: 'flex'
}}>
              <Button
                variant="outline"
                style={{
  flex: '1'
}}
                onClick={() => setShowCreateProposal(false)}
              >
                Cancel
              </Button>
              <Button
                style={{
  flex: '1'
}}
                onClick={handleCreateProposal}
                disabled={!newProposal.title || !newProposal.description || votingPower < BigInt('100000') * BigInt(10 ** 18)}
              >
                Create Proposal
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog>

      {/* Vote Dialog */}
      <Dialog open={showVoteDialog} onOpenChange={setShowVoteDialog}>
        <Dialog.Content maxWidth="500px">
          <Dialog.Title>Cast Your Vote</Dialog.Title>
          
          {selectedProposal && (
            <div className="space-y-4 mt-4">
              <div style={{
  background: 'rgba(20, 20, 20, 0.6)',
  padding: '16px',
  borderRadius: '12px'
}}>
                <h4 style={{
  fontWeight: '600'
}}>{selectedProposal.title}</h4>
                <p style={{
  color: '#A0A0A0'
}}>
                  {selectedProposal.description}
                </p>
              </div>

              <div>
                <label style={{
  display: 'block',
  fontWeight: '500'
}}>
                  Your Vote
                </label>
                <div style={{
  display: 'grid',
  gap: '8px'
}}>
                  <Button
                    variant={selectedVoteType === VOTE_TYPE.FOR ? "solid" : "outline"}
                    color={selectedVoteType === VOTE_TYPE.FOR ? "green" : "gray"}
                    onClick={() => setSelectedVoteType(VOTE_TYPE.FOR)}
                    style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}
                  >
                    <ThumbsUp style={{
  width: '16px',
  height: '16px'
}} />
                    <span>For</span>
                  </Button>
                  
                  <Button
                    variant={selectedVoteType === VOTE_TYPE.AGAINST ? "solid" : "outline"}
                    color={selectedVoteType === VOTE_TYPE.AGAINST ? "red" : "gray"}
                    onClick={() => setSelectedVoteType(VOTE_TYPE.AGAINST)}
                    style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}
                  >
                    <ThumbsDown style={{
  width: '16px',
  height: '16px'
}} />
                    <span>Against</span>
                  </Button>
                  
                  <Button
                    variant={selectedVoteType === VOTE_TYPE.ABSTAIN ? "solid" : "outline"}
                    color={selectedVoteType === VOTE_TYPE.ABSTAIN ? "gray" : "gray"}
                    onClick={() => setSelectedVoteType(VOTE_TYPE.ABSTAIN)}
                    style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}
                  >
                    <Minus style={{
  width: '16px',
  height: '16px'
}} />
                    <span>Abstain</span>
                  </Button>
                </div>
              </div>

              <div>
                <label style={{
  display: 'block',
  fontWeight: '500'
}}>
                  Reason (Optional)
                </label>
                <TextArea
                  placeholder="Explain your reasoning for this vote..."
                  value={voteReason}
                  onChange={(e) => setVoteReason(e.target.value)}
                  rows={3}
                />
              </div>

              <div style={{
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
                <p className="text-sm text-blue-800">
                  Your voting power: {formatVotes(votingPower)} CRYB
                </p>
              </div>

              <div style={{
  display: 'flex'
}}>
                <Button
                  variant="outline"
                  style={{
  flex: '1'
}}
                  onClick={() => setShowVoteDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  style={{
  flex: '1'
}}
                  onClick={() => handleVote(selectedProposal.id, selectedVoteType)}
                  disabled={votingPower === BigInt(0)}
                >
                  Cast Vote
                </Button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog>

      {/* Proposal Detail Dialog */}
      <Dialog open={!!selectedProposal && !showVoteDialog} onOpenChange={() => setSelectedProposal(null)}>
        <Dialog.Content maxWidth="700px">
          {selectedProposal && (
            <>
              <Dialog.Title style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                <span>{selectedProposal.title}</span>
                <Badge color={getStatusColor(selectedProposal.state)}>
                  {getProposalStateName(selectedProposal.state)}
                </Badge>
              </Dialog.Title>
              
              <div className="space-y-6 mt-4">
                <div>
                  <h4 style={{
  fontWeight: '600'
}}>Description</h4>
                  <p style={{
  color: '#A0A0A0'
}}>
                    {selectedProposal.description}
                  </p>
                </div>

                <Separator />

                <div style={{
  display: 'grid',
  gap: '16px'
}}>
                  <div>
                    <span style={{
  color: '#A0A0A0'
}}>Proposal ID:</span>
                    <span style={{
  fontWeight: '600'
}}>#{selectedProposal.id}</span>
                  </div>
                  <div>
                    <span style={{
  color: '#A0A0A0'
}}>Proposer:</span>
                    <span style={{
  fontWeight: '600'
}}>
                      {selectedProposal.proposer.slice(0, 6)}...{selectedProposal.proposer.slice(-4)}
                    </span>
                  </div>
                  <div>
                    <span style={{
  color: '#A0A0A0'
}}>Start Block:</span>
                    <span style={{
  fontWeight: '600'
}}>{selectedProposal.startBlock.toLocaleString()}</span>
                  </div>
                  <div>
                    <span style={{
  color: '#A0A0A0'
}}>End Block:</span>
                    <span style={{
  fontWeight: '600'
}}>{selectedProposal.endBlock.toLocaleString()}</span>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 style={{
  fontWeight: '600'
}}>Voting Results</h4>
                  <div className="space-y-3">
                    <div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}}>
                      <span style={{
  fontWeight: '600'
}}>For</span>
                      <span style={{
  fontWeight: '600'
}}>{formatVotes(selectedProposal.forVotes)} CRYB</span>
                    </div>
                    <div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}}>
                      <span style={{
  fontWeight: '600'
}}>Against</span>
                      <span style={{
  fontWeight: '600'
}}>{formatVotes(selectedProposal.againstVotes)} CRYB</span>
                    </div>
                    <div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}}>
                      <span style={{
  color: '#A0A0A0',
  fontWeight: '600'
}}>Abstain</span>
                      <span style={{
  fontWeight: '600'
}}>{formatVotes(selectedProposal.abstainVotes)} CRYB</span>
                    </div>
                    <div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}}>
                      <span style={{
  color: '#A0A0A0'
}}>Quorum Required</span>
                      <span style={{
  fontWeight: '600'
}}>{formatVotes(selectedProposal.quorum)} CRYB</span>
                    </div>
                  </div>
                </div>

                {selectedProposal.state === PROPOSAL_STATE.ACTIVE && !userVotes.has(selectedProposal.id) && (
                  <Button
                    style={{
  width: '100%'
}}
                    onClick={() => setShowVoteDialog(true)}
                    disabled={votingPower === BigInt(0)}
                  >
                    <Vote style={{
  width: '16px',
  height: '16px'
}} />
                    Cast Your Vote
                  </Button>
                )}
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog>
    </div>
  );
};



export default GovernanceDashboard;