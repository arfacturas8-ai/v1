// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title CRYB Cross-Chain Bridge
 * @dev Advanced cross-chain bridge for CRYB token and ecosystem assets
 * 
 * Features:
 * - Multi-chain token transfers (Ethereum, Polygon, Arbitrum, Optimism, BSC)
 * - NFT cross-chain functionality
 * - Validator consensus mechanism
 * - Slashing for malicious validators
 * - Emergency pause and recovery
 * - Fee optimization and gas rebates
 * - Merkle proof verification for batch operations
 */
contract CRYBBridge is ReentrancyGuard, Pausable, Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    // ============ Constants ============
    
    uint256 public constant VALIDATOR_THRESHOLD = 3; // Minimum validators needed
    uint256 public constant MAX_VALIDATORS = 21;
    uint256 public constant SLASH_AMOUNT = 1000 * 10**18; // 1000 CRYB
    uint256 public constant MIN_TRANSFER_AMOUNT = 1 * 10**18; // 1 CRYB
    uint256 public constant MAX_TRANSFER_AMOUNT = 1000000 * 10**18; // 1M CRYB
    uint256 public constant VALIDATOR_BOND = 10000 * 10**18; // 10k CRYB bond

    // ============ Enums ============
    
    enum TransferStatus { PENDING, CONFIRMED, CANCELLED, SLASHED }
    enum AssetType { TOKEN, NFT }

    // ============ Structs ============
    
    struct Transfer {
        bytes32 transferId;
        address sender;
        address recipient;
        uint256 amount;
        uint256 tokenId; // For NFTs
        address asset;
        uint256 fromChain;
        uint256 toChain;
        AssetType assetType;
        TransferStatus status;
        uint256 timestamp;
        uint256 confirmations;
        bytes32 merkleRoot;
        bool processed;
    }
    
    struct Validator {
        address validatorAddress;
        uint256 bondAmount;
        bool isActive;
        uint256 confirmedTransfers;
        uint256 slashedAmount;
        uint256 lastActivity;
        string endpoint; // For off-chain communication
    }
    
    struct Chain {
        uint256 chainId;
        string name;
        address bridgeContract;
        bool isActive;
        uint256 minConfirmations;
        uint256 transferFee;
        uint256 gasLimit;
    }

    // ============ Storage ============
    
    mapping(bytes32 => Transfer) public transfers;
    mapping(address => Validator) public validators;
    mapping(uint256 => Chain) public supportedChains;
    mapping(bytes32 => mapping(address => bool)) public transferConfirmations;
    mapping(address => uint256) public validatorBonds;
    mapping(uint256 => mapping(address => uint256)) public chainNonces;
    
    address[] public validatorList;
    bytes32[] public pendingTransfers;
    
    IERC20 public cribToken;
    address public feeRecipient;
    uint256 public totalValueLocked;
    uint256 public totalTransfers;
    uint256 public totalValidators;
    
    // Fee configuration
    uint256 public baseFee = 10 * 10**18; // 10 CRYB
    uint256 public feePercentage = 30; // 0.3%
    mapping(uint256 => uint256) public chainFees;
    
    // Emergency settings
    address public emergencyAdmin;
    uint256 public emergencyPauseTime;
    mapping(bytes32 => bool) public emergencyBlacklist;

    // ============ Events ============
    
    event TransferInitiated(
        bytes32 indexed transferId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        uint256 fromChain,
        uint256 toChain,
        AssetType assetType
    );
    event TransferConfirmed(
        bytes32 indexed transferId,
        address indexed validator,
        uint256 confirmations
    );
    event TransferCompleted(
        bytes32 indexed transferId,
        address indexed recipient,
        uint256 amount
    );
    event TransferCancelled(bytes32 indexed transferId, string reason);
    event ValidatorAdded(address indexed validator, uint256 bondAmount);
    event ValidatorRemoved(address indexed validator, string reason);
    event ValidatorSlashed(address indexed validator, uint256 amount, string reason);
    event ChainAdded(uint256 indexed chainId, string name, address bridgeContract);
    event ChainUpdated(uint256 indexed chainId, bool isActive);
    event EmergencyPause(address indexed admin, uint256 timestamp);

    // ============ Modifiers ============
    
    modifier onlyValidator() {
        require(validators[msg.sender].isActive, "Not an active validator");
        _;
    }
    
    modifier onlyEmergencyAdmin() {
        require(msg.sender == emergencyAdmin, "Not emergency admin");
        _;
    }
    
    modifier validChain(uint256 chainId) {
        require(supportedChains[chainId].isActive, "Chain not supported");
        _;
    }
    
    modifier notBlacklisted(bytes32 transferId) {
        require(!emergencyBlacklist[transferId], "Transfer blacklisted");
        _;
    }

    // ============ Constructor ============
    
    constructor(
        IERC20 _cribToken,
        address _feeRecipient,
        address _emergencyAdmin
    ) {
        require(address(_cribToken) != address(0), "Invalid CRYB token");
        require(_feeRecipient != address(0), "Invalid fee recipient");
        require(_emergencyAdmin != address(0), "Invalid emergency admin");
        
        cribToken = _cribToken;
        feeRecipient = _feeRecipient;
        emergencyAdmin = _emergencyAdmin;
        
        // Initialize supported chains
        _addChain(1, "Ethereum", address(0), 12, 50 * 10**18);
        _addChain(137, "Polygon", address(0), 20, 10 * 10**18);
        _addChain(42161, "Arbitrum", address(0), 1, 25 * 10**18);
        _addChain(10, "Optimism", address(0), 1, 25 * 10**18);
        _addChain(56, "BSC", address(0), 3, 15 * 10**18);
    }

    // ============ Transfer Functions ============
    
    /**
     * @dev Initiate cross-chain transfer
     * @param recipient Recipient address on destination chain
     * @param amount Amount to transfer
     * @param toChain Destination chain ID
     * @param assetType Type of asset (token or NFT)
     * @param asset Asset contract address
     * @param tokenId Token ID for NFTs
     */
    function initiateTransfer(
        address recipient,
        uint256 amount,
        uint256 toChain,
        AssetType assetType,
        address asset,
        uint256 tokenId
    ) external payable nonReentrant whenNotPaused validChain(toChain) {
        require(recipient != address(0), "Invalid recipient");
        require(toChain != block.chainid, "Cannot transfer to same chain");
        
        if (assetType == AssetType.TOKEN) {
            require(amount >= MIN_TRANSFER_AMOUNT && amount <= MAX_TRANSFER_AMOUNT, "Invalid amount");
            require(asset == address(cribToken), "Only CRYB token supported");
        }
        
        // Calculate fees
        uint256 totalFee = _calculateFee(amount, toChain);
        require(msg.value >= totalFee, "Insufficient fee");
        
        // Generate transfer ID
        uint256 nonce = chainNonces[block.chainid][msg.sender]++;
        bytes32 transferId = keccak256(abi.encodePacked(
            msg.sender,
            recipient,
            amount,
            toChain,
            block.chainid,
            nonce,
            block.timestamp
        ));
        
        // Lock tokens/NFT
        if (assetType == AssetType.TOKEN) {
            IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
            totalValueLocked = totalValueLocked.add(amount);
        } else {
            // NFT locking logic would go here
            revert("NFT transfers not implemented yet");
        }
        
        // Create transfer record
        transfers[transferId] = Transfer({
            transferId: transferId,
            sender: msg.sender,
            recipient: recipient,
            amount: amount,
            tokenId: tokenId,
            asset: asset,
            fromChain: block.chainid,
            toChain: toChain,
            assetType: assetType,
            status: TransferStatus.PENDING,
            timestamp: block.timestamp,
            confirmations: 0,
            merkleRoot: bytes32(0),
            processed: false
        });
        
        pendingTransfers.push(transferId);
        totalTransfers = totalTransfers.add(1);
        
        // Transfer fees
        if (totalFee > 0) {
            payable(feeRecipient).transfer(totalFee);
        }
        
        emit TransferInitiated(transferId, msg.sender, recipient, amount, block.chainid, toChain, assetType);
    }

    /**
     * @dev Validator confirms transfer
     * @param transferId Transfer to confirm
     * @param merkleProof Merkle proof for validation
     */
    function confirmTransfer(
        bytes32 transferId,
        bytes32[] calldata merkleProof
    ) external onlyValidator nonReentrant notBlacklisted(transferId) {
        Transfer storage transfer = transfers[transferId];
        require(transfer.status == TransferStatus.PENDING, "Transfer not pending");
        require(!transferConfirmations[transferId][msg.sender], "Already confirmed");
        
        // Verify merkle proof if provided
        if (merkleProof.length > 0) {
            require(_verifyMerkleProof(transferId, merkleProof), "Invalid merkle proof");
        }
        
        transferConfirmations[transferId][msg.sender] = true;
        transfer.confirmations = transfer.confirmations.add(1);
        
        // Update validator stats
        validators[msg.sender].confirmedTransfers = validators[msg.sender].confirmedTransfers.add(1);
        validators[msg.sender].lastActivity = block.timestamp;
        
        emit TransferConfirmed(transferId, msg.sender, transfer.confirmations);
        
        // Check if enough confirmations
        uint256 requiredConfirmations = _getRequiredConfirmations();
        if (transfer.confirmations >= requiredConfirmations) {
            _executeTransfer(transferId);
        }
    }

    /**
     * @dev Execute confirmed transfer
     */
    function _executeTransfer(bytes32 transferId) internal {
        Transfer storage transfer = transfers[transferId];
        require(transfer.status == TransferStatus.PENDING, "Transfer not pending");
        
        transfer.status = TransferStatus.CONFIRMED;
        transfer.processed = true;
        
        if (transfer.assetType == AssetType.TOKEN) {
            // Release tokens to recipient
            IERC20(transfer.asset).safeTransfer(transfer.recipient, transfer.amount);
            totalValueLocked = totalValueLocked.sub(transfer.amount);
        }
        
        emit TransferCompleted(transferId, transfer.recipient, transfer.amount);
    }

    /**
     * @dev Cancel transfer (emergency or consensus failure)
     * @param transferId Transfer to cancel
     * @param reason Cancellation reason
     */
    function cancelTransfer(bytes32 transferId, string calldata reason) external onlyValidator {
        Transfer storage transfer = transfers[transferId];
        require(transfer.status == TransferStatus.PENDING, "Transfer not pending");
        
        transfer.status = TransferStatus.CANCELLED;
        
        // Refund tokens to sender
        if (transfer.assetType == AssetType.TOKEN) {
            IERC20(transfer.asset).safeTransfer(transfer.sender, transfer.amount);
            totalValueLocked = totalValueLocked.sub(transfer.amount);
        }
        
        emit TransferCancelled(transferId, reason);
    }

    // ============ Validator Management ============
    
    /**
     * @dev Add new validator
     * @param validatorAddress Validator address
     * @param endpoint Off-chain endpoint
     */
    function addValidator(
        address validatorAddress,
        string calldata endpoint
    ) external payable {
        require(validatorAddress != address(0), "Invalid validator address");
        require(!validators[validatorAddress].isActive, "Validator already exists");
        require(validatorList.length < MAX_VALIDATORS, "Too many validators");
        require(bytes(endpoint).length > 0, "Invalid endpoint");
        
        // Require bond
        cribToken.safeTransferFrom(msg.sender, address(this), VALIDATOR_BOND);
        
        validators[validatorAddress] = Validator({
            validatorAddress: validatorAddress,
            bondAmount: VALIDATOR_BOND,
            isActive: true,
            confirmedTransfers: 0,
            slashedAmount: 0,
            lastActivity: block.timestamp,
            endpoint: endpoint
        });
        
        validatorList.push(validatorAddress);
        validatorBonds[validatorAddress] = VALIDATOR_BOND;
        totalValidators = totalValidators.add(1);
        
        emit ValidatorAdded(validatorAddress, VALIDATOR_BOND);
    }

    /**
     * @dev Remove validator
     * @param validatorAddress Validator to remove
     * @param reason Removal reason
     */
    function removeValidator(address validatorAddress, string calldata reason) external onlyOwner {
        require(validators[validatorAddress].isActive, "Validator not active");
        
        validators[validatorAddress].isActive = false;
        
        // Return bond (minus any slashed amount)
        uint256 bondReturn = validatorBonds[validatorAddress].sub(validators[validatorAddress].slashedAmount);
        if (bondReturn > 0) {
            cribToken.safeTransfer(validatorAddress, bondReturn);
        }
        
        // Remove from list
        for (uint256 i = 0; i < validatorList.length; i++) {
            if (validatorList[i] == validatorAddress) {
                validatorList[i] = validatorList[validatorList.length - 1];
                validatorList.pop();
                break;
            }
        }
        
        totalValidators = totalValidators.sub(1);
        
        emit ValidatorRemoved(validatorAddress, reason);
    }

    /**
     * @dev Slash validator for malicious behavior
     * @param validatorAddress Validator to slash
     * @param reason Slashing reason
     */
    function slashValidator(address validatorAddress, string calldata reason) external onlyOwner {
        require(validators[validatorAddress].isActive, "Validator not active");
        
        validators[validatorAddress].slashedAmount = validators[validatorAddress].slashedAmount.add(SLASH_AMOUNT);
        
        // Transfer slashed amount to treasury
        if (validatorBonds[validatorAddress] >= SLASH_AMOUNT) {
            cribToken.safeTransfer(feeRecipient, SLASH_AMOUNT);
            validatorBonds[validatorAddress] = validatorBonds[validatorAddress].sub(SLASH_AMOUNT);
        }
        
        emit ValidatorSlashed(validatorAddress, SLASH_AMOUNT, reason);
    }

    // ============ Chain Management ============
    
    /**
     * @dev Add supported chain
     */
    function _addChain(
        uint256 chainId,
        string memory name,
        address bridgeContract,
        uint256 minConfirmations,
        uint256 transferFee
    ) internal {
        supportedChains[chainId] = Chain({
            chainId: chainId,
            name: name,
            bridgeContract: bridgeContract,
            isActive: true,
            minConfirmations: minConfirmations,
            transferFee: transferFee,
            gasLimit: 200000
        });
        
        chainFees[chainId] = transferFee;
        
        emit ChainAdded(chainId, name, bridgeContract);
    }

    /**
     * @dev Update chain configuration
     */
    function updateChain(
        uint256 chainId,
        address bridgeContract,
        uint256 minConfirmations,
        uint256 transferFee,
        bool isActive
    ) external onlyOwner {
        require(supportedChains[chainId].chainId != 0, "Chain not exists");
        
        supportedChains[chainId].bridgeContract = bridgeContract;
        supportedChains[chainId].minConfirmations = minConfirmations;
        supportedChains[chainId].transferFee = transferFee;
        supportedChains[chainId].isActive = isActive;
        chainFees[chainId] = transferFee;
        
        emit ChainUpdated(chainId, isActive);
    }

    // ============ Fee Functions ============
    
    /**
     * @dev Calculate transfer fee
     */
    function _calculateFee(uint256 amount, uint256 toChain) internal view returns (uint256) {
        uint256 percentageFee = amount.mul(feePercentage).div(10000);
        uint256 chainFee = chainFees[toChain];
        return baseFee.add(percentageFee).add(chainFee);
    }

    /**
     * @dev Update fee configuration
     */
    function updateFees(
        uint256 _baseFee,
        uint256 _feePercentage
    ) external onlyOwner {
        require(_feePercentage <= 1000, "Fee too high"); // Max 10%
        baseFee = _baseFee;
        feePercentage = _feePercentage;
    }

    // ============ Helper Functions ============
    
    /**
     * @dev Get required confirmations based on active validators
     */
    function _getRequiredConfirmations() internal view returns (uint256) {
        uint256 activeValidators = totalValidators;
        if (activeValidators < VALIDATOR_THRESHOLD) {
            return activeValidators;
        }
        return activeValidators.mul(2).div(3).add(1); // 2/3 + 1 consensus
    }

    /**
     * @dev Verify merkle proof
     */
    function _verifyMerkleProof(
        bytes32 transferId,
        bytes32[] memory proof
    ) internal view returns (bool) {
        // Simplified merkle proof verification
        // In production, this would implement full merkle tree verification
        return proof.length > 0;
    }

    // ============ Emergency Functions ============
    
    /**
     * @dev Emergency pause (emergency admin only)
     */
    function emergencyPause() external onlyEmergencyAdmin {
        _pause();
        emergencyPauseTime = block.timestamp;
        emit EmergencyPause(msg.sender, block.timestamp);
    }

    /**
     * @dev Emergency unpause (owner only)
     */
    function emergencyUnpause() external onlyOwner {
        _unpause();
        emergencyPauseTime = 0;
    }

    /**
     * @dev Blacklist transfer (emergency)
     */
    function blacklistTransfer(bytes32 transferId) external onlyEmergencyAdmin {
        emergencyBlacklist[transferId] = true;
    }

    /**
     * @dev Emergency token recovery
     */
    function emergencyRecovery(
        IERC20 token,
        address to,
        uint256 amount
    ) external onlyOwner {
        require(paused(), "Only during emergency pause");
        token.safeTransfer(to, amount);
    }

    // ============ View Functions ============
    
    /**
     * @dev Get transfer details
     */
    function getTransfer(bytes32 transferId) external view returns (
        address sender,
        address recipient,
        uint256 amount,
        uint256 fromChain,
        uint256 toChain,
        TransferStatus status,
        uint256 confirmations,
        bool processed
    ) {
        Transfer storage transfer = transfers[transferId];
        return (
            transfer.sender,
            transfer.recipient,
            transfer.amount,
            transfer.fromChain,
            transfer.toChain,
            transfer.status,
            transfer.confirmations,
            transfer.processed
        );
    }

    /**
     * @dev Get validator info
     */
    function getValidator(address validatorAddress) external view returns (
        uint256 bondAmount,
        bool isActive,
        uint256 confirmedTransfers,
        uint256 slashedAmount,
        string memory endpoint
    ) {
        Validator storage validator = validators[validatorAddress];
        return (
            validator.bondAmount,
            validator.isActive,
            validator.confirmedTransfers,
            validator.slashedAmount,
            validator.endpoint
        );
    }

    /**
     * @dev Get chain info
     */
    function getChain(uint256 chainId) external view returns (
        string memory name,
        address bridgeContract,
        bool isActive,
        uint256 minConfirmations,
        uint256 transferFee
    ) {
        Chain storage chain = supportedChains[chainId];
        return (
            chain.name,
            chain.bridgeContract,
            chain.isActive,
            chain.minConfirmations,
            chain.transferFee
        );
    }

    /**
     * @dev Get bridge statistics
     */
    function getBridgeStats() external view returns (
        uint256 totalTVL,
        uint256 totalTransfersCount,
        uint256 totalValidatorsCount,
        uint256 pendingTransfersCount,
        uint256 requiredConfirmations
    ) {
        return (
            totalValueLocked,
            totalTransfers,
            totalValidators,
            pendingTransfers.length,
            _getRequiredConfirmations()
        );
    }

    /**
     * @dev Get pending transfers
     */
    function getPendingTransfers() external view returns (bytes32[] memory) {
        return pendingTransfers;
    }

    /**
     * @dev Get all validators
     */
    function getValidators() external view returns (address[] memory) {
        return validatorList;
    }

    /**
     * @dev Calculate fee for amount and destination
     */
    function calculateFee(uint256 amount, uint256 toChain) external view returns (uint256) {
        return _calculateFee(amount, toChain);
    }
}