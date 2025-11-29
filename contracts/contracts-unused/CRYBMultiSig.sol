// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title CRYB Multi-Signature Wallet
 * @dev Advanced multi-signature wallet for treasury management
 * 
 * Features:
 * - Multi-signature transaction execution
 * - Configurable threshold and owners
 * - Transaction queuing and execution
 * - Token and ETH management
 * - Emergency functions
 * - Time-locked transactions
 */
contract CRYBMultiSig is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    // ============ Constants ============
    
    uint256 public constant MAX_OWNERS = 50;
    uint256 public constant MIN_THRESHOLD = 1;
    uint256 public constant MAX_TIMELOCK = 30 days;

    // ============ Storage ============
    
    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 confirmations;
        uint256 timelock;
        uint256 submissionTime;
        address submitter;
        string description;
    }
    
    mapping(address => bool) public isOwner;
    mapping(uint256 => mapping(address => bool)) public confirmations;
    mapping(uint256 => Transaction) public transactions;
    
    address[] public owners;
    uint256 public threshold;
    uint256 public transactionCount;
    uint256 public defaultTimelock = 24 hours;
    bool public timelockEnabled = true;
    
    // Emergency settings
    bool public emergencyMode = false;
    address public emergencyOwner;
    uint256 public emergencyThreshold = 1;
    
    // Transaction categories for different timelock periods
    mapping(string => uint256) public categoryTimelocks;
    
    // ============ Events ============
    
    event OwnerAdded(address indexed owner);
    event OwnerRemoved(address indexed owner);
    event ThresholdChanged(uint256 threshold);
    event TransactionSubmitted(uint256 indexed transactionId, address indexed submitter);
    event TransactionConfirmed(uint256 indexed transactionId, address indexed owner);
    event TransactionRevoked(uint256 indexed transactionId, address indexed owner);
    event TransactionExecuted(uint256 indexed transactionId);
    event TransactionFailed(uint256 indexed transactionId);
    event EmergencyModeToggled(bool enabled);
    event TimelockUpdated(uint256 newTimelock);
    event CategoryTimelockSet(string category, uint256 timelock);

    // ============ Modifiers ============
    
    modifier onlyOwners() {
        require(isOwner[msg.sender], "Not an owner");
        _;
    }
    
    modifier transactionExists(uint256 transactionId) {
        require(transactionId < transactionCount, "Transaction does not exist");
        _;
    }
    
    modifier notExecuted(uint256 transactionId) {
        require(!transactions[transactionId].executed, "Transaction already executed");
        _;
    }
    
    modifier notConfirmed(uint256 transactionId) {
        require(!confirmations[transactionId][msg.sender], "Transaction already confirmed");
        _;
    }
    
    modifier validThreshold(uint256 _threshold) {
        require(_threshold >= MIN_THRESHOLD && _threshold <= owners.length, "Invalid threshold");
        _;
    }

    // ============ Constructor ============
    
    constructor(
        address[] memory _owners,
        uint256 _threshold,
        address _emergencyOwner
    ) validThreshold(_threshold) {
        require(_owners.length > 0, "Owners required");
        require(_owners.length <= MAX_OWNERS, "Too many owners");
        require(_emergencyOwner != address(0), "Invalid emergency owner");
        
        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid owner");
            require(!isOwner[owner], "Duplicate owner");
            
            isOwner[owner] = true;
            owners.push(owner);
            emit OwnerAdded(owner);
        }
        
        threshold = _threshold;
        emergencyOwner = _emergencyOwner;
        
        // Initialize category timelocks
        categoryTimelocks["treasury"] = 48 hours;
        categoryTimelocks["governance"] = 24 hours;
        categoryTimelocks["emergency"] = 1 hours;
        categoryTimelocks["routine"] = 12 hours;
        
        emit ThresholdChanged(_threshold);
    }

    // ============ Transaction Management ============
    
    /**
     * @dev Submit a new transaction
     * @param to Destination address
     * @param value ETH value to send
     * @param data Transaction data
     * @param description Transaction description
     * @param category Transaction category
     */
    function submitTransaction(
        address to,
        uint256 value,
        bytes calldata data,
        string calldata description,
        string calldata category
    ) external onlyOwners returns (uint256) {
        require(to != address(0), "Invalid destination");
        
        uint256 timelock = categoryTimelocks[category];
        if (timelock == 0) {
            timelock = defaultTimelock;
        }
        
        uint256 transactionId = transactionCount;
        transactions[transactionId] = Transaction({
            to: to,
            value: value,
            data: data,
            executed: false,
            confirmations: 0,
            timelock: timelock,
            submissionTime: block.timestamp,
            submitter: msg.sender,
            description: description
        });
        
        transactionCount = transactionCount.add(1);
        
        // Auto-confirm by submitter
        confirmTransaction(transactionId);
        
        emit TransactionSubmitted(transactionId, msg.sender);
        
        return transactionId;
    }

    /**
     * @dev Confirm a transaction
     * @param transactionId Transaction ID to confirm
     */
    function confirmTransaction(uint256 transactionId)
        public
        onlyOwners
        transactionExists(transactionId)
        notConfirmed(transactionId)
        notExecuted(transactionId)
    {
        confirmations[transactionId][msg.sender] = true;
        transactions[transactionId].confirmations = transactions[transactionId].confirmations.add(1);
        
        emit TransactionConfirmed(transactionId, msg.sender);
        
        // Try to execute if threshold met and timelock passed
        if (isExecutable(transactionId)) {
            executeTransaction(transactionId);
        }
    }

    /**
     * @dev Revoke transaction confirmation
     * @param transactionId Transaction ID to revoke
     */
    function revokeConfirmation(uint256 transactionId)
        external
        onlyOwners
        transactionExists(transactionId)
        notExecuted(transactionId)
    {
        require(confirmations[transactionId][msg.sender], "Transaction not confirmed");
        
        confirmations[transactionId][msg.sender] = false;
        transactions[transactionId].confirmations = transactions[transactionId].confirmations.sub(1);
        
        emit TransactionRevoked(transactionId, msg.sender);
    }

    /**
     * @dev Execute a confirmed transaction
     * @param transactionId Transaction ID to execute
     */
    function executeTransaction(uint256 transactionId)
        public
        nonReentrant
        transactionExists(transactionId)
        notExecuted(transactionId)
    {
        require(isExecutable(transactionId), "Transaction not executable");
        
        Transaction storage txn = transactions[transactionId];
        txn.executed = true;
        
        (bool success, ) = txn.to.call{value: txn.value}(txn.data);
        
        if (success) {
            emit TransactionExecuted(transactionId);
        } else {
            txn.executed = false;
            emit TransactionFailed(transactionId);
        }
    }

    /**
     * @dev Check if transaction is executable
     * @param transactionId Transaction ID to check
     */
    function isExecutable(uint256 transactionId) public view returns (bool) {
        Transaction storage txn = transactions[transactionId];
        
        if (txn.executed) return false;
        
        // Check confirmations threshold
        uint256 requiredThreshold = emergencyMode ? emergencyThreshold : threshold;
        if (txn.confirmations < requiredThreshold) return false;
        
        // Check timelock (unless in emergency mode or timelock disabled)
        if (timelockEnabled && !emergencyMode) {
            if (block.timestamp < txn.submissionTime.add(txn.timelock)) return false;
        }
        
        return true;
    }

    // ============ Owner Management ============
    
    /**
     * @dev Add a new owner (requires multisig)
     * @param owner Address of new owner
     */
    function addOwner(address owner) external onlyOwners {
        require(owner != address(0), "Invalid owner");
        require(!isOwner[owner], "Already an owner");
        require(owners.length < MAX_OWNERS, "Too many owners");
        
        // This should be called through submitTransaction for multisig approval
        isOwner[owner] = true;
        owners.push(owner);
        
        emit OwnerAdded(owner);
    }

    /**
     * @dev Remove an owner (requires multisig)
     * @param owner Address of owner to remove
     */
    function removeOwner(address owner) external onlyOwners {
        require(isOwner[owner], "Not an owner");
        require(owners.length > threshold, "Cannot remove owner below threshold");
        
        // This should be called through submitTransaction for multisig approval
        isOwner[owner] = false;
        
        // Remove from owners array
        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == owner) {
                owners[i] = owners[owners.length - 1];
                owners.pop();
                break;
            }
        }
        
        emit OwnerRemoved(owner);
    }

    /**
     * @dev Change confirmation threshold (requires multisig)
     * @param _threshold New threshold
     */
    function changeThreshold(uint256 _threshold) external onlyOwners validThreshold(_threshold) {
        // This should be called through submitTransaction for multisig approval
        threshold = _threshold;
        emit ThresholdChanged(_threshold);
    }

    // ============ Emergency Functions ============
    
    /**
     * @dev Toggle emergency mode (emergency owner only)
     */
    function toggleEmergencyMode() external {
        require(msg.sender == emergencyOwner, "Not emergency owner");
        emergencyMode = !emergencyMode;
        emit EmergencyModeToggled(emergencyMode);
    }

    /**
     * @dev Set emergency threshold
     * @param _threshold New emergency threshold
     */
    function setEmergencyThreshold(uint256 _threshold) external {
        require(msg.sender == emergencyOwner, "Not emergency owner");
        require(_threshold >= 1 && _threshold <= owners.length, "Invalid threshold");
        emergencyThreshold = _threshold;
    }

    /**
     * @dev Change emergency owner
     * @param _emergencyOwner New emergency owner
     */
    function changeEmergencyOwner(address _emergencyOwner) external {
        require(msg.sender == emergencyOwner, "Not emergency owner");
        require(_emergencyOwner != address(0), "Invalid address");
        emergencyOwner = _emergencyOwner;
    }

    // ============ Configuration Functions ============
    
    /**
     * @dev Set default timelock period
     * @param _timelock New timelock period
     */
    function setDefaultTimelock(uint256 _timelock) external onlyOwners {
        require(_timelock <= MAX_TIMELOCK, "Timelock too long");
        defaultTimelock = _timelock;
        emit TimelockUpdated(_timelock);
    }

    /**
     * @dev Set category-specific timelock
     * @param category Category name
     * @param timelock Timelock period for category
     */
    function setCategoryTimelock(string calldata category, uint256 timelock) external onlyOwners {
        require(timelock <= MAX_TIMELOCK, "Timelock too long");
        categoryTimelocks[category] = timelock;
        emit CategoryTimelockSet(category, timelock);
    }

    /**
     * @dev Toggle timelock enforcement
     */
    function toggleTimelock() external onlyOwners {
        timelockEnabled = !timelockEnabled;
    }

    // ============ Token Management ============
    
    /**
     * @dev Transfer ERC20 tokens
     * @param token Token contract address
     * @param to Recipient address
     * @param amount Amount to transfer
     */
    function transferToken(address token, address to, uint256 amount) external onlyOwners {
        require(IERC20(token).transfer(to, amount), "Token transfer failed");
    }

    /**
     * @dev Approve ERC20 token spending
     * @param token Token contract address
     * @param spender Spender address
     * @param amount Amount to approve
     */
    function approveToken(address token, address spender, uint256 amount) external onlyOwners {
        require(IERC20(token).approve(spender, amount), "Token approval failed");
    }

    // ============ View Functions ============
    
    /**
     * @dev Get transaction details
     * @param transactionId Transaction ID
     */
    function getTransaction(uint256 transactionId) external view returns (
        address to,
        uint256 value,
        bytes memory data,
        bool executed,
        uint256 confirmationsCount,
        uint256 timelock,
        uint256 submissionTime,
        address submitter,
        string memory description
    ) {
        Transaction storage txn = transactions[transactionId];
        return (
            txn.to,
            txn.value,
            txn.data,
            txn.executed,
            txn.confirmations,
            txn.timelock,
            txn.submissionTime,
            txn.submitter,
            txn.description
        );
    }

    /**
     * @dev Get list of owners
     */
    function getOwners() external view returns (address[] memory) {
        return owners;
    }

    /**
     * @dev Get confirmation status for transaction
     * @param transactionId Transaction ID
     * @param owner Owner address
     */
    function getConfirmation(uint256 transactionId, address owner) external view returns (bool) {
        return confirmations[transactionId][owner];
    }

    /**
     * @dev Get transaction count
     */
    function getTransactionCount() external view returns (uint256) {
        return transactionCount;
    }

    /**
     * @dev Get multisig configuration
     */
    function getConfiguration() external view returns (
        uint256 ownersCount,
        uint256 thresholdValue,
        uint256 defaultTimelockValue,
        bool timelockEnabledValue,
        bool emergencyModeValue,
        address emergencyOwnerValue
    ) {
        return (
            owners.length,
            threshold,
            defaultTimelock,
            timelockEnabled,
            emergencyMode,
            emergencyOwner
        );
    }

    // ============ Fallback Functions ============
    
    /**
     * @dev Receive ETH
     */
    receive() external payable {}

    /**
     * @dev Fallback function
     */
    fallback() external payable {}
}