// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Treasury
 * @dev DAO Treasury management for CRYB Platform
 */
contract Treasury is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        address recipient;
        uint256 amount;
        address token; // address(0) for ETH
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        bool cancelled;
        ProposalType proposalType;
    }

    enum ProposalType {
        SPENDING,
        INVESTMENT,
        GRANT,
        WITHDRAWAL
    }

    // Storage
    uint256 public nextProposalId;
    uint256 public votingPeriod = 7 days;
    uint256 public minQuorum = 10; // 10% of total voting power
    uint256 public executionDelay = 2 days;

    address public governanceToken;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => uint256)) public votes; // proposalId => voter => amount
    mapping(address => bool) public authorizedSpenders;

    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string description,
        ProposalType proposalType
    );
    event Voted(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 votes
    );
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);
    event FundsReceived(address indexed from, uint256 amount, address indexed token);
    event FundsWithdrawn(address indexed to, uint256 amount, address indexed token);

    constructor(address _governanceToken) {
        require(_governanceToken != address(0), "Invalid governance token");
        governanceToken = _governanceToken;
        authorizedSpenders[msg.sender] = true;
    }

    // Receive ETH
    receive() external payable {
        emit FundsReceived(msg.sender, msg.value, address(0));
    }

    // Create spending proposal
    function createProposal(
        string memory _description,
        address _recipient,
        uint256 _amount,
        address _token,
        ProposalType _proposalType
    ) external returns (uint256) {
        require(_recipient != address(0), "Invalid recipient");
        require(_amount > 0, "Amount must be greater than 0");

        // Check proposer has governance tokens
        IERC20 govToken = IERC20(governanceToken);
        require(govToken.balanceOf(msg.sender) > 0, "Must hold governance tokens");

        uint256 proposalId = nextProposalId++;

        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            description: _description,
            recipient: _recipient,
            amount: _amount,
            token: _token,
            votesFor: 0,
            votesAgainst: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + votingPeriod,
            executed: false,
            cancelled: false,
            proposalType: _proposalType
        });

        emit ProposalCreated(proposalId, msg.sender, _description, _proposalType);
        return proposalId;
    }

    // Vote on proposal
    function vote(uint256 _proposalId, bool _support) external nonReentrant {
        Proposal storage proposal = proposals[_proposalId];
        require(block.timestamp <= proposal.endTime, "Voting ended");
        require(!proposal.executed, "Already executed");
        require(!proposal.cancelled, "Proposal cancelled");
        require(!hasVoted[_proposalId][msg.sender], "Already voted");

        IERC20 govToken = IERC20(governanceToken);
        uint256 votingPower = govToken.balanceOf(msg.sender);
        require(votingPower > 0, "No voting power");

        hasVoted[_proposalId][msg.sender] = true;
        votes[_proposalId][msg.sender] = votingPower;

        if (_support) {
            proposal.votesFor += votingPower;
        } else {
            proposal.votesAgainst += votingPower;
        }

        emit Voted(_proposalId, msg.sender, _support, votingPower);
    }

    // Execute proposal
    function executeProposal(uint256 _proposalId) external nonReentrant {
        Proposal storage proposal = proposals[_proposalId];
        require(block.timestamp > proposal.endTime, "Voting not ended");
        require(!proposal.executed, "Already executed");
        require(!proposal.cancelled, "Proposal cancelled");
        require(
            block.timestamp >= proposal.endTime + executionDelay,
            "Execution delay not passed"
        );

        // Check if proposal passed
        require(proposal.votesFor > proposal.votesAgainst, "Proposal not passed");

        // Check quorum
        IERC20 govToken = IERC20(governanceToken);
        uint256 totalSupply = govToken.totalSupply();
        uint256 totalVotes = proposal.votesFor + proposal.votesAgainst;
        require(
            (totalVotes * 100) / totalSupply >= minQuorum,
            "Quorum not reached"
        );

        proposal.executed = true;

        // Execute transfer
        if (proposal.token == address(0)) {
            // ETH transfer
            require(address(this).balance >= proposal.amount, "Insufficient ETH balance");
            payable(proposal.recipient).transfer(proposal.amount);
        } else {
            // Token transfer
            IERC20 token = IERC20(proposal.token);
            require(
                token.balanceOf(address(this)) >= proposal.amount,
                "Insufficient token balance"
            );
            token.safeTransfer(proposal.recipient, proposal.amount);
        }

        emit ProposalExecuted(_proposalId);
        emit FundsWithdrawn(proposal.recipient, proposal.amount, proposal.token);
    }

    // Cancel proposal (only proposer or owner)
    function cancelProposal(uint256 _proposalId) external {
        Proposal storage proposal = proposals[_proposalId];
        require(
            msg.sender == proposal.proposer || msg.sender == owner(),
            "Not authorized"
        );
        require(!proposal.executed, "Already executed");
        require(!proposal.cancelled, "Already cancelled");

        proposal.cancelled = true;
        emit ProposalCancelled(_proposalId);
    }

    // Emergency withdraw (only authorized spenders)
    function emergencyWithdraw(
        address _token,
        address _recipient,
        uint256 _amount
    ) external nonReentrant {
        require(authorizedSpenders[msg.sender], "Not authorized");
        require(_recipient != address(0), "Invalid recipient");

        if (_token == address(0)) {
            require(address(this).balance >= _amount, "Insufficient balance");
            payable(_recipient).transfer(_amount);
        } else {
            IERC20 token = IERC20(_token);
            require(token.balanceOf(address(this)) >= _amount, "Insufficient balance");
            token.safeTransfer(_recipient, _amount);
        }

        emit FundsWithdrawn(_recipient, _amount, _token);
    }

    // Get treasury balance
    function getBalance(address _token) external view returns (uint256) {
        if (_token == address(0)) {
            return address(this).balance;
        } else {
            IERC20 token = IERC20(_token);
            return token.balanceOf(address(this));
        }
    }

    // Get proposal details
    function getProposal(uint256 _proposalId)
        external
        view
        returns (
            address proposer,
            string memory description,
            address recipient,
            uint256 amount,
            address token,
            uint256 votesFor,
            uint256 votesAgainst,
            uint256 startTime,
            uint256 endTime,
            bool executed,
            bool cancelled
        )
    {
        Proposal storage proposal = proposals[_proposalId];
        return (
            proposal.proposer,
            proposal.description,
            proposal.recipient,
            proposal.amount,
            proposal.token,
            proposal.votesFor,
            proposal.votesAgainst,
            proposal.startTime,
            proposal.endTime,
            proposal.executed,
            proposal.cancelled
        );
    }

    // Check if proposal can be executed
    function canExecute(uint256 _proposalId) external view returns (bool) {
        Proposal storage proposal = proposals[_proposalId];

        if (proposal.executed || proposal.cancelled) return false;
        if (block.timestamp <= proposal.endTime) return false;
        if (block.timestamp < proposal.endTime + executionDelay) return false;
        if (proposal.votesFor <= proposal.votesAgainst) return false;

        IERC20 govToken = IERC20(governanceToken);
        uint256 totalSupply = govToken.totalSupply();
        uint256 totalVotes = proposal.votesFor + proposal.votesAgainst;

        return (totalVotes * 100) / totalSupply >= minQuorum;
    }

    // Admin functions
    function setVotingPeriod(uint256 _period) external onlyOwner {
        require(_period >= 1 days && _period <= 30 days, "Invalid period");
        votingPeriod = _period;
    }

    function setMinQuorum(uint256 _quorum) external onlyOwner {
        require(_quorum > 0 && _quorum <= 100, "Invalid quorum");
        minQuorum = _quorum;
    }

    function setExecutionDelay(uint256 _delay) external onlyOwner {
        require(_delay <= 7 days, "Delay too long");
        executionDelay = _delay;
    }

    function setAuthorizedSpender(address _spender, bool _authorized) external onlyOwner {
        authorizedSpenders[_spender] = _authorized;
    }
}
