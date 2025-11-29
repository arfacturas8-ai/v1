// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title CRYBGovernance
 * @dev Simple governance contract for CRYB Platform (Testing Version)
 */
contract CRYBGovernance is Ownable, ReentrancyGuard {
    IERC20 public governanceToken;
    address public timelock;

    uint256 public votingDelay;
    uint256 public votingPeriod;
    uint256 public proposalThreshold;
    uint256 public quorumPercentage;

    enum ProposalState {
        Pending,
        Active,
        Canceled,
        Defeated,
        Succeeded,
        Queued,
        Expired,
        Executed
    }

    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool canceled;
        bool executed;
    }

    struct Receipt {
        bool hasVoted;
        uint8 support;
        uint256 votes;
    }

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Receipt)) public receipts;

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string description,
        uint256 startBlock,
        uint256 endBlock
    );

    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        uint8 support,
        uint256 votes
    );

    event ProposalCanceled(uint256 indexed proposalId);
    event ProposalExecuted(uint256 indexed proposalId);

    constructor(
        IERC20 _governanceToken,
        address _timelock,
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _proposalThreshold,
        uint256 _quorumPercentage
    ) {
        governanceToken = _governanceToken;
        timelock = _timelock;
        votingDelay = _votingDelay;
        votingPeriod = _votingPeriod;
        proposalThreshold = _proposalThreshold;
        quorumPercentage = _quorumPercentage;
    }

    function propose(string memory description) external returns (uint256) {
        require(
            governanceToken.balanceOf(msg.sender) >= proposalThreshold,
            "Proposer votes below proposal threshold"
        );

        proposalCount++;
        uint256 proposalId = proposalCount;
        uint256 startBlock = block.number + votingDelay;
        uint256 endBlock = startBlock + votingPeriod;

        Proposal storage newProposal = proposals[proposalId];
        newProposal.id = proposalId;
        newProposal.proposer = msg.sender;
        newProposal.description = description;
        newProposal.startBlock = startBlock;
        newProposal.endBlock = endBlock;

        emit ProposalCreated(
            proposalId,
            msg.sender,
            description,
            startBlock,
            endBlock
        );

        return proposalId;
    }

    function castVote(uint256 proposalId, uint8 support) external nonReentrant {
        return _castVote(msg.sender, proposalId, support);
    }

    function _castVote(
        address voter,
        uint256 proposalId,
        uint8 support
    ) internal {
        require(state(proposalId) == ProposalState.Active, "Voting is closed");
        Proposal storage proposal = proposals[proposalId];
        Receipt storage receipt = receipts[proposalId][voter];
        require(!receipt.hasVoted, "Already voted");

        uint256 votes = governanceToken.balanceOf(voter);
        require(votes > 0, "No voting power");

        if (support == 0) {
            proposal.againstVotes += votes;
        } else if (support == 1) {
            proposal.forVotes += votes;
        } else if (support == 2) {
            proposal.abstainVotes += votes;
        } else {
            revert("Invalid vote type");
        }

        receipt.hasVoted = true;
        receipt.support = support;
        receipt.votes = votes;

        emit VoteCast(voter, proposalId, support, votes);
    }

    function state(uint256 proposalId) public view returns (ProposalState) {
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal id");
        Proposal storage proposal = proposals[proposalId];

        if (proposal.canceled) {
            return ProposalState.Canceled;
        }

        if (proposal.executed) {
            return ProposalState.Executed;
        }

        if (block.number <= proposal.startBlock) {
            return ProposalState.Pending;
        }

        if (block.number <= proposal.endBlock) {
            return ProposalState.Active;
        }

        if (proposal.forVotes <= proposal.againstVotes || !_quorumReached(proposalId)) {
            return ProposalState.Defeated;
        }

        return ProposalState.Succeeded;
    }

    function _quorumReached(uint256 proposalId) internal view returns (bool) {
        Proposal storage proposal = proposals[proposalId];
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        uint256 totalSupply = governanceToken.totalSupply();
        return (totalVotes * 100) / totalSupply >= quorumPercentage;
    }

    function execute(uint256 proposalId) external nonReentrant {
        require(
            state(proposalId) == ProposalState.Succeeded,
            "Proposal not succeeded"
        );

        Proposal storage proposal = proposals[proposalId];
        proposal.executed = true;

        emit ProposalExecuted(proposalId);
    }

    function cancel(uint256 proposalId) external {
        require(
            msg.sender == proposals[proposalId].proposer || msg.sender == owner(),
            "Only proposer or owner can cancel"
        );
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "Cannot cancel executed proposal");

        proposal.canceled = true;
        emit ProposalCanceled(proposalId);
    }

    function getProposal(uint256 proposalId)
        external
        view
        returns (
            uint256 id,
            address proposer,
            string memory description,
            uint256 startBlock,
            uint256 endBlock,
            uint256 forVotes,
            uint256 againstVotes,
            uint256 abstainVotes,
            bool canceled,
            bool executed
        )
    {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.id,
            proposal.proposer,
            proposal.description,
            proposal.startBlock,
            proposal.endBlock,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.abstainVotes,
            proposal.canceled,
            proposal.executed
        );
    }

    function getReceipt(uint256 proposalId, address voter)
        external
        view
        returns (
            bool hasVoted,
            uint8 support,
            uint256 votes
        )
    {
        Receipt storage receipt = receipts[proposalId][voter];
        return (receipt.hasVoted, receipt.support, receipt.votes);
    }
}
