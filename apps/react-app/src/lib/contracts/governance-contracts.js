// CRYB Platform Governance DAO Contracts
// Enterprise-grade governance system with timelocks, treasury, and multi-sig

import { CHAIN_IDS } from './cryb-contracts.js';

// Governance contract addresses
export const GOVERNANCE_ADDRESSES = {
  DAO_GOVERNOR: {
    [CHAIN_IDS.MAINNET]: '0x2D00000000000000000000000000000000000001',
    [CHAIN_IDS.POLYGON]: '0x2D00000000000000000000000000000000000002',
    [CHAIN_IDS.ARBITRUM]: '0x2D00000000000000000000000000000000000003',
    [CHAIN_IDS.OPTIMISM]: '0x2D00000000000000000000000000000000000004',
    [CHAIN_IDS.SEPOLIA]: '0x2D00000000000000000000000000000000000005'
  },
  TIMELOCK_CONTROLLER: {
    [CHAIN_IDS.MAINNET]: '0x3D00000000000000000000000000000000000001',
    [CHAIN_IDS.POLYGON]: '0x3D00000000000000000000000000000000000002',
    [CHAIN_IDS.ARBITRUM]: '0x3D00000000000000000000000000000000000003',
    [CHAIN_IDS.OPTIMISM]: '0x3D00000000000000000000000000000000000004',
    [CHAIN_IDS.SEPOLIA]: '0x3D00000000000000000000000000000000000005'
  },
  TREASURY: {
    [CHAIN_IDS.MAINNET]: '0x4D00000000000000000000000000000000000001',
    [CHAIN_IDS.POLYGON]: '0x4D00000000000000000000000000000000000002',
    [CHAIN_IDS.ARBITRUM]: '0x4D00000000000000000000000000000000000003',
    [CHAIN_IDS.OPTIMISM]: '0x4D00000000000000000000000000000000000004',
    [CHAIN_IDS.SEPOLIA]: '0x4D00000000000000000000000000000000000005'
  },
  MULTISIG_WALLET: {
    [CHAIN_IDS.MAINNET]: '0x5D00000000000000000000000000000000000001',
    [CHAIN_IDS.POLYGON]: '0x5D00000000000000000000000000000000000002',
    [CHAIN_IDS.ARBITRUM]: '0x5D00000000000000000000000000000000000003',
    [CHAIN_IDS.OPTIMISM]: '0x5D00000000000000000000000000000000000004',
    [CHAIN_IDS.SEPOLIA]: '0x5D00000000000000000000000000000000000005'
  }
};

// DAO Governor ABI (OpenZeppelin Governor + custom extensions)
export const DAO_GOVERNOR_ABI = [
  // Core governance functions
  {
    inputs: [
      { name: 'targets', type: 'address[]' },
      { name: 'values', type: 'uint256[]' },
      { name: 'calldatas', type: 'bytes[]' },
      { name: 'description', type: 'string' }
    ],
    name: 'propose',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'support', type: 'uint8' }
    ],
    name: 'castVote',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'support', type: 'uint8' },
      { name: 'reason', type: 'string' }
    ],
    name: 'castVoteWithReason',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'support', type: 'uint8' },
      { name: 'reason', type: 'string' },
      { name: 'params', type: 'bytes' }
    ],
    name: 'castVoteWithReasonAndParams',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'voter', type: 'address' },
      { name: 'proposalId', type: 'uint256' },
      { name: 'support', type: 'uint8' },
      { name: 'reason', type: 'string' },
      { name: 'params', type: 'bytes' },
      { name: 'signature', type: 'bytes' }
    ],
    name: 'castVoteBySig',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'targets', type: 'address[]' },
      { name: 'values', type: 'uint256[]' },
      { name: 'calldatas', type: 'bytes[]' },
      { name: 'descriptionHash', type: 'bytes32' }
    ],
    name: 'execute',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'targets', type: 'address[]' },
      { name: 'values', type: 'uint256[]' },
      { name: 'calldatas', type: 'bytes[]' },
      { name: 'descriptionHash', type: 'bytes32' }
    ],
    name: 'queue',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'targets', type: 'address[]' },
      { name: 'values', type: 'uint256[]' },
      { name: 'calldatas', type: 'bytes[]' },
      { name: 'descriptionHash', type: 'bytes32' }
    ],
    name: 'cancel',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  // View functions
  {
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    name: 'state',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    name: 'proposalSnapshot',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    name: 'proposalDeadline',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    name: 'proposalVotes',
    outputs: [
      { name: 'againstVotes', type: 'uint256' },
      { name: 'forVotes', type: 'uint256' },
      { name: 'abstainVotes', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'proposalId', type: 'uint256' }
    ],
    name: 'hasVoted',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'blockNumber', type: 'uint256' }
    ],
    name: 'getVotes',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'votingDelay',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'votingPeriod',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'blockNumber', type: 'uint256' }],
    name: 'quorum',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  // Custom CRYB governance functions
  {
    inputs: [{ name: 'newThreshold', type: 'uint256' }],
    name: 'updateProposalThreshold',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'newQuorum', type: 'uint256' }],
    name: 'updateQuorumNumerator',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'newDelay', type: 'uint256' }],
    name: 'setVotingDelay',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'newPeriod', type: 'uint256' }],
    name: 'setVotingPeriod',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'emergencyPause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'emergencyUnpause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: 'proposalId', type: 'uint256' },
      { indexed: true, name: 'proposer', type: 'address' },
      { indexed: false, name: 'targets', type: 'address[]' },
      { indexed: false, name: 'values', type: 'uint256[]' },
      { indexed: false, name: 'signatures', type: 'string[]' },
      { indexed: false, name: 'calldatas', type: 'bytes[]' },
      { indexed: false, name: 'startBlock', type: 'uint256' },
      { indexed: false, name: 'endBlock', type: 'uint256' },
      { indexed: false, name: 'description', type: 'string' }
    ],
    name: 'ProposalCreated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'proposalId', type: 'uint256' },
      { indexed: true, name: 'voter', type: 'address' },
      { indexed: false, name: 'support', type: 'uint8' },
      { indexed: false, name: 'weight', type: 'uint256' },
      { indexed: false, name: 'reason', type: 'string' }
    ],
    name: 'VoteCast',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, name: 'proposalId', type: 'uint256' }],
    name: 'ProposalCanceled',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, name: 'proposalId', type: 'uint256' }],
    name: 'ProposalExecuted',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, name: 'proposalId', type: 'uint256' }],
    name: 'ProposalQueued',
    type: 'event'
  }
];

// Timelock Controller ABI
export const TIMELOCK_CONTROLLER_ABI = [
  {
    inputs: [
      { name: 'target', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'data', type: 'bytes' },
      { name: 'predecessor', type: 'bytes32' },
      { name: 'salt', type: 'bytes32' },
      { name: 'delay', type: 'uint256' }
    ],
    name: 'schedule',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'targets', type: 'address[]' },
      { name: 'values', type: 'uint256[]' },
      { name: 'payloads', type: 'bytes[]' },
      { name: 'predecessor', type: 'bytes32' },
      { name: 'salt', type: 'bytes32' },
      { name: 'delay', type: 'uint256' }
    ],
    name: 'scheduleBatch',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'target', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'payload', type: 'bytes' },
      { name: 'predecessor', type: 'bytes32' },
      { name: 'salt', type: 'bytes32' }
    ],
    name: 'execute',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'targets', type: 'address[]' },
      { name: 'values', type: 'uint256[]' },
      { name: 'payloads', type: 'bytes[]' },
      { name: 'predecessor', type: 'bytes32' },
      { name: 'salt', type: 'bytes32' }
    ],
    name: 'executeBatch',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [{ name: 'id', type: 'bytes32' }],
    name: 'cancel',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'id', type: 'bytes32' }],
    name: 'isOperation',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'id', type: 'bytes32' }],
    name: 'isOperationPending',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'id', type: 'bytes32' }],
    name: 'isOperationReady',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'id', type: 'bytes32' }],
    name: 'isOperationDone',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'id', type: 'bytes32' }],
    name: 'getTimestamp',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getMinDelay',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
];

// Multi-signature Wallet ABI (Gnosis Safe compatible)
export const MULTISIG_WALLET_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'data', type: 'bytes' },
      { name: 'operation', type: 'uint8' },
      { name: 'safeTxGas', type: 'uint256' },
      { name: 'baseGas', type: 'uint256' },
      { name: 'gasPrice', type: 'uint256' },
      { name: 'gasToken', type: 'address' },
      { name: 'refundReceiver', type: 'address' },
      { name: 'signatures', type: 'bytes' }
    ],
    name: 'execTransaction',
    outputs: [{ name: 'success', type: 'bool' }],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getThreshold',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getOwners',
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'isOwner',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: '_threshold', type: 'uint256' }
    ],
    name: 'addOwnerWithThreshold',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'prevOwner', type: 'address' },
      { name: 'owner', type: 'address' },
      { name: '_threshold', type: 'uint256' }
    ],
    name: 'removeOwner',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'prevOwner', type: 'address' },
      { name: 'oldOwner', type: 'address' },
      { name: 'newOwner', type: 'address' }
    ],
    name: 'swapOwner',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: '_threshold', type: 'uint256' }],
    name: 'changeThreshold',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'nonce',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
];

// Treasury management ABI
export const TREASURY_ABI = [
  {
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'transferETH',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'token', type: 'address' }],
    name: 'getBalance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getETHBalance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getAllBalances',
    outputs: [
      { name: 'tokens', type: 'address[]' },
      { name: 'balances', type: 'uint256[]' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'proposal', type: 'bytes32' },
      { name: 'amount', type: 'uint256' },
      { name: 'recipient', type: 'address' }
    ],
    name: 'allocateFunds',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'proposal', type: 'bytes32' }],
    name: 'getAllocation',
    outputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'recipient', type: 'address' },
      { name: 'released', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
];

// Proposal states enum
export const PROPOSAL_STATE = {
  PENDING: 0,
  ACTIVE: 1,
  CANCELED: 2,
  DEFEATED: 3,
  SUCCEEDED: 4,
  QUEUED: 5,
  EXPIRED: 6,
  EXECUTED: 7
};

// Vote support enum
export const VOTE_TYPE = {
  AGAINST: 0,
  FOR: 1,
  ABSTAIN: 2
};

// Governance parameters
export const GOVERNANCE_CONFIG = {
  VOTING_DELAY: 1, // 1 block
  VOTING_PERIOD: 45818, // ~1 week in blocks (assuming 15s blocks)
  PROPOSAL_THRESHOLD: BigInt('100000') * BigInt(10 ** 18), // 100k CRYB tokens
  QUORUM_PERCENTAGE: 4, // 4% of total supply
  TIMELOCK_DELAY: 2 * 24 * 60 * 60, // 2 days in seconds
  EXECUTION_DELAY: 24 * 60 * 60, // 1 day in seconds
  GRACE_PERIOD: 14 * 24 * 60 * 60 // 2 weeks in seconds
};

// Mock governance data for development
export const MOCK_PROPOSALS = [
  {
    id: '1',
    title: 'CRYB Token Buyback Program',
    description: 'Implement a quarterly token buyback program using 10% of treasury funds to reduce circulating supply and increase token value.',
    proposer: '0x742d35Cc6644C068532C17cF3c4E4a44e4a94F3e',
    state: PROPOSAL_STATE.ACTIVE,
    startBlock: 18500000,
    endBlock: 18545818,
    forVotes: BigInt('2500000') * BigInt(10 ** 18),
    againstVotes: BigInt('150000') * BigInt(10 ** 18),
    abstainVotes: BigInt('50000') * BigInt(10 ** 18),
    quorum: BigInt('2000000') * BigInt(10 ** 18),
    executed: false,
    eta: null
  },
  {
    id: '2',
    title: 'NFT Marketplace Fee Reduction',
    description: 'Reduce the marketplace transaction fee from 2.5% to 1.5% to increase trading volume and competitiveness.',
    proposer: '0x8ba1f109551bD432803012645Hac136c22C177c9',
    state: PROPOSAL_STATE.SUCCEEDED,
    startBlock: 18450000,
    endBlock: 18495818,
    forVotes: BigInt('3200000') * BigInt(10 ** 18),
    againstVotes: BigInt('800000') * BigInt(10 ** 18),
    abstainVotes: BigInt('100000') * BigInt(10 ** 18),
    quorum: BigInt('2000000') * BigInt(10 ** 18),
    executed: false,
    eta: Date.now() + 86400000 // 1 day from now
  },
  {
    id: '3',
    title: 'Community Treasury Allocation',
    description: 'Allocate 500,000 CRYB tokens from treasury for community rewards and partnerships over the next quarter.',
    proposer: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    state: PROPOSAL_STATE.EXECUTED,
    startBlock: 18400000,
    endBlock: 18445818,
    forVotes: BigInt('4100000') * BigInt(10 ** 18),
    againstVotes: BigInt('200000') * BigInt(10 ** 18),
    abstainVotes: BigInt('80000') * BigInt(10 ** 18),
    quorum: BigInt('2000000') * BigInt(10 ** 18),
    executed: true,
    eta: null
  }
];

// Governance contract interfaces
export class GovernanceContract {
  constructor(chainId, contractType = 'DAO_GOVERNOR') {
    this.chainId = chainId;
    this.contractType = contractType;
    this.address = GOVERNANCE_ADDRESSES[contractType][chainId];
    
    switch (contractType) {
      case 'DAO_GOVERNOR':
        this.abi = DAO_GOVERNOR_ABI;
        break;
      case 'TIMELOCK_CONTROLLER':
        this.abi = TIMELOCK_CONTROLLER_ABI;
        break;
      case 'TREASURY':
        this.abi = TREASURY_ABI;
        break;
      case 'MULTISIG_WALLET':
        this.abi = MULTISIG_WALLET_ABI;
        break;
      default:
        throw new Error(`Unknown contract type: ${contractType}`);
    }
    
    if (!this.address) {
      throw new Error(`${contractType} contract not deployed on chain ${chainId}`);
    }
  }

  // Mock implementation for development
  async getProposals(page = 1, limit = 10) {
    const start = (page - 1) * limit;
    const end = start + limit;
    return {
      proposals: MOCK_PROPOSALS.slice(start, end),
      total: MOCK_PROPOSALS.length,
      page,
      hasMore: end < MOCK_PROPOSALS.length
    };
  }

  async getProposal(proposalId) {
    return MOCK_PROPOSALS.find(p => p.id === proposalId.toString()) || null;
  }

  async getUserVotingPower(account, blockNumber = 'latest') {
    // Mock voting power based on token balance and NFT holdings
    const mockPower = BigInt(Math.floor(Math.random() * 100000)) * BigInt(10 ** 18);
    return mockPower;
  }

  async hasVoted(account, proposalId) {
    // Mock voting status - random for demo
    return Math.random() > 0.7;
  }

  async getQuorum(blockNumber = 'latest') {
    return BigInt('2000000') * BigInt(10 ** 18); // 2M CRYB tokens
  }

  async propose(targets, values, calldatas, description) {
    
    // Mock proposal creation
    const newProposal = {
      id: (MOCK_PROPOSALS.length + 1).toString(),
      title: description.split('.')[0],
      description,
      proposer: '0x0000000000000000000000000000000000000000', // Would be actual user address
      state: PROPOSAL_STATE.PENDING,
      startBlock: 18600000,
      endBlock: 18645818,
      forVotes: BigInt(0),
      againstVotes: BigInt(0),
      abstainVotes: BigInt(0),
      quorum: await this.getQuorum(),
      executed: false,
      eta: null
    };
    
    MOCK_PROPOSALS.unshift(newProposal);
    return Promise.resolve(`0x${'proposal'.repeat(12)}`);
  }

  async castVote(proposalId, support, reason = '') {
    if (reason) 
    
    return Promise.resolve(`0x${'vote'.repeat(16)}`);
  }

  async queueProposal(proposalId) {
    return Promise.resolve(`0x${'queue'.repeat(15)}`);
  }

  async executeProposal(proposalId) {
    return Promise.resolve(`0x${'execute'.repeat(13)}`);
  }

  async cancelProposal(proposalId) {
    return Promise.resolve(`0x${'cancel'.repeat(14)}`);
  }

  // Treasury functions
  async getTreasuryBalance() {
    if (this.contractType !== 'TREASURY') {
      throw new Error('Not a treasury contract');
    }
    
    return {
      ETH: BigInt('150') * BigInt(10 ** 18), // 150 ETH
      CRYB: BigInt('10000000') * BigInt(10 ** 18), // 10M CRYB
      USDC: BigInt('500000') * BigInt(10 ** 6), // 500k USDC
      totalValueUSD: 2500000 // $2.5M
    };
  }

  async allocateFunds(proposalHash, amount, recipient) {
    return Promise.resolve(`0x${'allocate'.repeat(12)}`);
  }

  // Multi-sig functions
  async getMultiSigInfo() {
    if (this.contractType !== 'MULTISIG_WALLET') {
      throw new Error('Not a multi-sig contract');
    }
    
    return {
      owners: [
        '0x742d35Cc6644C068532C17cF3c4E4a44e4a94F3e',
        '0x8ba1f109551bD432803012645Hac136c22C177c9',
        '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
        '0x6B175474E89094C44Da98b954EedeAC495271d0F'
      ],
      threshold: 3,
      nonce: 42
    };
  }

  async submitTransaction(to, value, data) {
    return Promise.resolve(`0x${'multisig'.repeat(11)}`);
  }

  formatTokenAmount(amount, decimals = 18) {
    return (Number(amount) / (10 ** decimals)).toFixed(4);
  }

  parseTokenAmount(amount, decimals = 18) {
    return BigInt(Math.floor(parseFloat(amount) * (10 ** decimals)));
  }
}

// Factory functions
export function getGovernanceContract(chainId, contractType = 'DAO_GOVERNOR') {
  return new GovernanceContract(chainId, contractType);
}

export function getDaoGovernor(chainId) {
  return new GovernanceContract(chainId, 'DAO_GOVERNOR');
}

export function getTimelockController(chainId) {
  return new GovernanceContract(chainId, 'TIMELOCK_CONTROLLER');
}

export function getTreasury(chainId) {
  return new GovernanceContract(chainId, 'TREASURY');
}

export function getMultiSigWallet(chainId) {
  return new GovernanceContract(chainId, 'MULTISIG_WALLET');
}

// Utility functions
export function getProposalStateName(state) {
  const stateNames = {
    [PROPOSAL_STATE.PENDING]: 'Pending',
    [PROPOSAL_STATE.ACTIVE]: 'Active',
    [PROPOSAL_STATE.CANCELED]: 'Canceled',
    [PROPOSAL_STATE.DEFEATED]: 'Defeated',
    [PROPOSAL_STATE.SUCCEEDED]: 'Succeeded',
    [PROPOSAL_STATE.QUEUED]: 'Queued',
    [PROPOSAL_STATE.EXPIRED]: 'Expired',
    [PROPOSAL_STATE.EXECUTED]: 'Executed'
  };
  return stateNames[state] || 'Unknown';
}

export function getVoteTypeName(voteType) {
  const voteNames = {
    [VOTE_TYPE.AGAINST]: 'Against',
    [VOTE_TYPE.FOR]: 'For',
    [VOTE_TYPE.ABSTAIN]: 'Abstain'
  };
  return voteNames[voteType] || 'Unknown';
}

export function calculateQuorumReached(forVotes, againstVotes, abstainVotes, quorum) {
  const totalVotes = forVotes + againstVotes + abstainVotes;
  return totalVotes >= quorum;
}

export function calculateProposalResult(forVotes, againstVotes, quorum) {
  const totalVotes = forVotes + againstVotes;
  const quorumReached = totalVotes >= quorum;
  const majorityFor = forVotes > againstVotes;
  
  return {
    quorumReached,
    majorityFor,
    passed: quorumReached && majorityFor,
    forPercentage: totalVotes > 0 ? (Number(forVotes) / Number(totalVotes)) * 100 : 0,
    againstPercentage: totalVotes > 0 ? (Number(againstVotes) / Number(totalVotes)) * 100 : 0
  };
}