// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20FlashMint.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title CRYB Token
 * @dev Advanced ERC-20 token for the CRYB Platform ecosystem
 * 
 * Features:
 * - Standard ERC-20 functionality
 * - Governance capabilities (ERC20Votes)
 * - Permit functionality for gasless approvals
 * - Flash minting capabilities
 * - Staking rewards system
 * - Token gating utilities
 * - Anti-whale protection
 * - Pausable in emergency situations
 * - Burnable tokens
 * - Vesting schedules
 */
contract CRYBToken is 
    ERC20, 
    ERC20Burnable, 
    ERC20Permit, 
    ERC20Votes, 
    ERC20FlashMint, 
    Pausable, 
    Ownable, 
    ReentrancyGuard 
{
    using SafeMath for uint256;

    // ============ Constants ============
    
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18; // 1B tokens
    uint256 public constant MAX_TRANSACTION_AMOUNT = 10_000_000 * 10**18; // 1% of supply
    uint256 public constant MAX_WALLET_AMOUNT = 50_000_000 * 10**18; // 5% of supply
    
    // Allocation percentages (basis points out of 10000)
    uint256 public constant TEAM_ALLOCATION = 2000; // 20%
    uint256 public constant INVESTORS_ALLOCATION = 1500; // 15%
    uint256 public constant LIQUIDITY_ALLOCATION = 2500; // 25%
    uint256 public constant COMMUNITY_ALLOCATION = 3000; // 30%
    uint256 public constant RESERVE_ALLOCATION = 1000; // 10%
    
    // ============ Storage ============
    
    mapping(address => bool) public isExcludedFromFees;
    mapping(address => bool) public isExcludedFromMaxTx;
    mapping(address => bool) public isBlacklisted;
    mapping(address => uint256) public stakingBalance;
    mapping(address => uint256) public stakingStartTime;
    mapping(address => uint256) public stakedRewards;
    
    // Vesting structures
    struct VestingSchedule {
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 startTime;
        uint256 cliffDuration;
        uint256 vestingDuration;
        bool revocable;
        bool revoked;
    }
    
    mapping(address => VestingSchedule) public vestingSchedules;
    
    // Staking configuration
    uint256 public stakingRewardRate = 500; // 5% APY in basis points
    uint256 public constant STAKING_REWARD_PRECISION = 10000;
    uint256 public minimumStakeAmount = 1000 * 10**18; // 1000 CRYB
    uint256 public stakingPenaltyRate = 1000; // 10% early withdrawal penalty
    uint256 public constant STAKING_LOCK_PERIOD = 30 days;
    
    // Token gating levels
    mapping(uint256 => uint256) public tokenGatingLevels; // level => required balance
    mapping(address => uint256) public userAccessLevel;
    
    // Fee structure
    uint256 public transferFee = 0; // 0% initially
    uint256 public constant MAX_TRANSFER_FEE = 500; // Max 5%
    address public feeRecipient;
    
    // ============ Events ============
    
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount, uint256 reward);
    event RewardClaimed(address indexed user, uint256 reward);
    event VestingScheduleCreated(address indexed beneficiary, uint256 amount);
    event VestingScheduleRevoked(address indexed beneficiary);
    event TokensReleased(address indexed beneficiary, uint256 amount);
    event BlacklistUpdated(address indexed account, bool isBlacklisted);
    event AccessLevelUpdated(address indexed user, uint256 level);
    event TokenGatingLevelSet(uint256 level, uint256 requiredBalance);
    event TransferFeeUpdated(uint256 newFee);
    
    // ============ Constructor ============
    
    constructor(
        address _teamWallet,
        address _investorWallet,
        address _liquidityWallet,
        address _communityWallet,
        address _reserveWallet
    ) 
        ERC20("CRYB Token", "CRYB") 
        ERC20Permit("CRYB Token")
        Ownable()
    {
        require(_teamWallet != address(0), "Invalid team wallet");
        require(_investorWallet != address(0), "Invalid investor wallet");
        require(_liquidityWallet != address(0), "Invalid liquidity wallet");
        require(_communityWallet != address(0), "Invalid community wallet");
        require(_reserveWallet != address(0), "Invalid reserve wallet");
        
        feeRecipient = _reserveWallet;
        
        // Mint initial supply with allocation
        _mint(_teamWallet, TOTAL_SUPPLY.mul(TEAM_ALLOCATION).div(10000));
        _mint(_investorWallet, TOTAL_SUPPLY.mul(INVESTORS_ALLOCATION).div(10000));
        _mint(_liquidityWallet, TOTAL_SUPPLY.mul(LIQUIDITY_ALLOCATION).div(10000));
        _mint(_communityWallet, TOTAL_SUPPLY.mul(COMMUNITY_ALLOCATION).div(10000));
        _mint(_reserveWallet, TOTAL_SUPPLY.mul(RESERVE_ALLOCATION).div(10000));
        
        // Exclude key addresses from fees and limits
        isExcludedFromFees[owner()] = true;
        isExcludedFromFees[_reserveWallet] = true;
        isExcludedFromFees[address(this)] = true;
        
        isExcludedFromMaxTx[owner()] = true;
        isExcludedFromMaxTx[_reserveWallet] = true;
        isExcludedFromMaxTx[address(this)] = true;
        
        // Initialize token gating levels
        tokenGatingLevels[1] = 1000 * 10**18;   // Bronze: 1,000 CRYB
        tokenGatingLevels[2] = 5000 * 10**18;   // Silver: 5,000 CRYB
        tokenGatingLevels[3] = 25000 * 10**18;  // Gold: 25,000 CRYB
        tokenGatingLevels[4] = 100000 * 10**18; // Platinum: 100,000 CRYB
        tokenGatingLevels[5] = 500000 * 10**18; // Diamond: 500,000 CRYB
    }
    
    // ============ Modifiers ============
    
    modifier notBlacklisted(address account) {
        require(!isBlacklisted[account], "Account is blacklisted");
        _;
    }
    
    modifier validAddress(address account) {
        require(account != address(0), "Invalid address");
        _;
    }
    
    // ============ Core ERC20 Overrides ============
    
    function _beforeTokenTransfer(
        address from, 
        address to, 
        uint256 amount
    ) internal override whenNotPaused notBlacklisted(from) notBlacklisted(to) {
        super._beforeTokenTransfer(from, to, amount);
        
        // Skip checks for minting/burning
        if (from == address(0) || to == address(0)) return;
        
        // Check transaction limits
        if (!isExcludedFromMaxTx[from]) {
            require(amount <= MAX_TRANSACTION_AMOUNT, "Transfer exceeds max transaction amount");
        }
        
        // Check wallet limits
        if (!isExcludedFromMaxTx[to]) {
            require(
                balanceOf(to).add(amount) <= MAX_WALLET_AMOUNT,
                "Transfer would exceed max wallet amount"
            );
        }
    }
    
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        super._afterTokenTransfer(from, to, amount);
        
        // Update access levels based on new balances
        if (from != address(0)) _updateAccessLevel(from);
        if (to != address(0)) _updateAccessLevel(to);
    }
    
    function transfer(
        address to, 
        uint256 amount
    ) public override returns (bool) {
        address owner = _msgSender();
        uint256 transferAmount = amount;
        
        // Apply transfer fee if applicable
        if (transferFee > 0 && !isExcludedFromFees[owner] && !isExcludedFromFees[to]) {
            uint256 feeAmount = amount.mul(transferFee).div(10000);
            transferAmount = amount.sub(feeAmount);
            
            if (feeAmount > 0) {
                super.transfer(feeRecipient, feeAmount);
            }
        }
        
        return super.transfer(to, transferAmount);
    }
    
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public override returns (bool) {
        uint256 transferAmount = amount;
        
        // Apply transfer fee if applicable
        if (transferFee > 0 && !isExcludedFromFees[from] && !isExcludedFromFees[to]) {
            uint256 feeAmount = amount.mul(transferFee).div(10000);
            transferAmount = amount.sub(feeAmount);
            
            if (feeAmount > 0) {
                super.transferFrom(from, feeRecipient, feeAmount);
            }
        }
        
        return super.transferFrom(from, to, transferAmount);
    }
    
    // ============ Staking Functions ============
    
    /**
     * @dev Stake tokens to earn rewards
     * @param amount Amount of tokens to stake
     */
    function stake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount >= minimumStakeAmount, "Amount below minimum stake");
        require(balanceOf(_msgSender()) >= amount, "Insufficient balance");
        
        // Claim existing rewards first
        if (stakingBalance[_msgSender()] > 0) {
            _claimRewards(_msgSender());
        }
        
        // Update staking balance
        stakingBalance[_msgSender()] = stakingBalance[_msgSender()].add(amount);
        stakingStartTime[_msgSender()] = block.timestamp;
        
        // Transfer tokens to contract
        _transfer(_msgSender(), address(this), amount);
        
        emit Staked(_msgSender(), amount);
    }
    
    /**
     * @dev Unstake tokens and claim rewards
     * @param amount Amount of tokens to unstake
     */
    function unstake(uint256 amount) external nonReentrant whenNotPaused {
        require(stakingBalance[_msgSender()] >= amount, "Insufficient staked balance");
        
        uint256 actualAmount = amount;
        
        // Apply penalty if unstaking before lock period
        if (block.timestamp < stakingStartTime[_msgSender()].add(STAKING_LOCK_PERIOD)) {
            uint256 penalty = amount.mul(stakingPenaltyRate).div(STAKING_REWARD_PRECISION);
            actualAmount = amount.sub(penalty);
            
            // Transfer penalty to fee recipient
            if (penalty > 0) {
                _transfer(address(this), feeRecipient, penalty);
            }
        }
        
        // Claim rewards
        _claimRewards(_msgSender());
        
        // Update staking balance
        stakingBalance[_msgSender()] = stakingBalance[_msgSender()].sub(amount);
        
        // Transfer unstaked tokens back
        _transfer(address(this), _msgSender(), actualAmount);
        
        emit Unstaked(_msgSender(), amount, stakedRewards[_msgSender()]);
    }
    
    /**
     * @dev Claim staking rewards
     */
    function claimRewards() external nonReentrant whenNotPaused {
        _claimRewards(_msgSender());
    }
    
    /**
     * @dev Internal function to claim rewards
     */
    function _claimRewards(address account) internal {
        uint256 reward = calculateStakingReward(account);
        
        if (reward > 0) {
            stakedRewards[account] = 0;
            stakingStartTime[account] = block.timestamp;
            
            // Mint reward tokens
            _mint(account, reward);
            
            emit RewardClaimed(account, reward);
        }
    }
    
    /**
     * @dev Calculate staking rewards for an account
     * @param account Address to calculate rewards for
     * @return reward Calculated reward amount
     */
    function calculateStakingReward(address account) public view returns (uint256) {
        if (stakingBalance[account] == 0) return 0;
        
        uint256 stakingDuration = block.timestamp.sub(stakingStartTime[account]);
        uint256 yearlyReward = stakingBalance[account].mul(stakingRewardRate).div(STAKING_REWARD_PRECISION);
        uint256 reward = yearlyReward.mul(stakingDuration).div(365 days);
        
        return reward.add(stakedRewards[account]);
    }
    
    // ============ Vesting Functions ============
    
    /**
     * @dev Create a vesting schedule for a beneficiary
     * @param beneficiary Address of the beneficiary
     * @param totalAmount Total amount to be vested
     * @param cliffDuration Duration of cliff period
     * @param vestingDuration Total vesting duration
     * @param revocable Whether the vesting is revocable
     */
    function createVestingSchedule(
        address beneficiary,
        uint256 totalAmount,
        uint256 cliffDuration,
        uint256 vestingDuration,
        bool revocable
    ) external onlyOwner validAddress(beneficiary) {
        require(vestingSchedules[beneficiary].totalAmount == 0, "Vesting schedule already exists");
        require(totalAmount > 0, "Amount must be > 0");
        require(vestingDuration > 0, "Duration must be > 0");
        require(cliffDuration <= vestingDuration, "Cliff must be <= duration");
        
        vestingSchedules[beneficiary] = VestingSchedule({
            totalAmount: totalAmount,
            releasedAmount: 0,
            startTime: block.timestamp,
            cliffDuration: cliffDuration,
            vestingDuration: vestingDuration,
            revocable: revocable,
            revoked: false
        });
        
        emit VestingScheduleCreated(beneficiary, totalAmount);
    }
    
    /**
     * @dev Release vested tokens for a beneficiary
     * @param beneficiary Address of the beneficiary
     */
    function releaseVestedTokens(address beneficiary) external nonReentrant {
        VestingSchedule storage schedule = vestingSchedules[beneficiary];
        require(schedule.totalAmount > 0, "No vesting schedule");
        require(!schedule.revoked, "Vesting schedule revoked");
        
        uint256 releasableAmount = calculateReleasableAmount(beneficiary);
        require(releasableAmount > 0, "No tokens to release");
        
        schedule.releasedAmount = schedule.releasedAmount.add(releasableAmount);
        _mint(beneficiary, releasableAmount);
        
        emit TokensReleased(beneficiary, releasableAmount);
    }
    
    /**
     * @dev Calculate releasable amount for a beneficiary
     * @param beneficiary Address of the beneficiary
     * @return releasableAmount Amount that can be released
     */
    function calculateReleasableAmount(address beneficiary) public view returns (uint256) {
        VestingSchedule storage schedule = vestingSchedules[beneficiary];
        
        if (schedule.totalAmount == 0 || schedule.revoked) return 0;
        
        if (block.timestamp < schedule.startTime.add(schedule.cliffDuration)) {
            return 0;
        }
        
        if (block.timestamp >= schedule.startTime.add(schedule.vestingDuration)) {
            return schedule.totalAmount.sub(schedule.releasedAmount);
        }
        
        uint256 timeElapsed = block.timestamp.sub(schedule.startTime);
        uint256 vestedAmount = schedule.totalAmount.mul(timeElapsed).div(schedule.vestingDuration);
        
        return vestedAmount.sub(schedule.releasedAmount);
    }
    
    /**
     * @dev Revoke vesting schedule (only if revocable)
     * @param beneficiary Address of the beneficiary
     */
    function revokeVesting(address beneficiary) external onlyOwner {
        VestingSchedule storage schedule = vestingSchedules[beneficiary];
        require(schedule.totalAmount > 0, "No vesting schedule");
        require(schedule.revocable, "Vesting not revocable");
        require(!schedule.revoked, "Already revoked");
        
        // Release any vested tokens first
        uint256 releasableAmount = calculateReleasableAmount(beneficiary);
        if (releasableAmount > 0) {
            schedule.releasedAmount = schedule.releasedAmount.add(releasableAmount);
            _mint(beneficiary, releasableAmount);
            emit TokensReleased(beneficiary, releasableAmount);
        }
        
        schedule.revoked = true;
        emit VestingScheduleRevoked(beneficiary);
    }
    
    // ============ Token Gating Functions ============
    
    /**
     * @dev Update access level based on token balance
     * @param account Address to update
     */
    function _updateAccessLevel(address account) internal {
        uint256 balance = balanceOf(account);
        uint256 newLevel = 0;
        
        for (uint256 i = 5; i >= 1; i--) {
            if (balance >= tokenGatingLevels[i]) {
                newLevel = i;
                break;
            }
        }
        
        if (userAccessLevel[account] != newLevel) {
            userAccessLevel[account] = newLevel;
            emit AccessLevelUpdated(account, newLevel);
        }
    }
    
    /**
     * @dev Check if user has access to a specific level
     * @param account Address to check
     * @param requiredLevel Required access level
     * @return hasAccess Whether user has access
     */
    function hasAccessLevel(address account, uint256 requiredLevel) external view returns (bool) {
        return userAccessLevel[account] >= requiredLevel;
    }
    
    /**
     * @dev Get user's current access level
     * @param account Address to check
     * @return level Current access level
     */
    function getAccessLevel(address account) external view returns (uint256) {
        return userAccessLevel[account];
    }
    
    // ============ Admin Functions ============
    
    /**
     * @dev Set token gating level requirements
     * @param level Access level
     * @param requiredBalance Required token balance
     */
    function setTokenGatingLevel(uint256 level, uint256 requiredBalance) external onlyOwner {
        require(level >= 1 && level <= 5, "Invalid level");
        tokenGatingLevels[level] = requiredBalance;
        emit TokenGatingLevelSet(level, requiredBalance);
    }
    
    /**
     * @dev Update transfer fee
     * @param newFee New transfer fee in basis points
     */
    function setTransferFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_TRANSFER_FEE, "Fee too high");
        transferFee = newFee;
        emit TransferFeeUpdated(newFee);
    }
    
    /**
     * @dev Update fee recipient
     * @param newRecipient New fee recipient address
     */
    function setFeeRecipient(address newRecipient) external onlyOwner validAddress(newRecipient) {
        feeRecipient = newRecipient;
    }
    
    /**
     * @dev Update staking reward rate
     * @param newRate New reward rate in basis points
     */
    function setStakingRewardRate(uint256 newRate) external onlyOwner {
        require(newRate <= 5000, "Rate too high"); // Max 50% APY
        stakingRewardRate = newRate;
    }
    
    /**
     * @dev Update minimum stake amount
     * @param newAmount New minimum stake amount
     */
    function setMinimumStakeAmount(uint256 newAmount) external onlyOwner {
        minimumStakeAmount = newAmount;
    }
    
    /**
     * @dev Exclude/include account from fees
     * @param account Address to update
     * @param excluded Whether to exclude from fees
     */
    function setExcludeFromFees(address account, bool excluded) external onlyOwner {
        isExcludedFromFees[account] = excluded;
    }
    
    /**
     * @dev Exclude/include account from max transaction limits
     * @param account Address to update
     * @param excluded Whether to exclude from limits
     */
    function setExcludeFromMaxTx(address account, bool excluded) external onlyOwner {
        isExcludedFromMaxTx[account] = excluded;
    }
    
    /**
     * @dev Update blacklist status
     * @param account Address to update
     * @param blacklisted Whether to blacklist
     */
    function setBlacklisted(address account, bool blacklisted) external onlyOwner {
        isBlacklisted[account] = blacklisted;
        emit BlacklistUpdated(account, blacklisted);
    }
    
    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Emergency withdraw function (owner only)
     * @param token Token address to withdraw (address(0) for ETH)
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).transfer(owner(), amount);
        }
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Get comprehensive token information
     */
    function getTokenInfo() external view returns (
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 totalSupply,
        uint256 maxTxAmount,
        uint256 maxWalletAmount,
        uint256 transferFeeValue,
        bool isPaused
    ) {
        return (
            name(),
            symbol(),
            decimals(),
            totalSupply(),
            MAX_TRANSACTION_AMOUNT,
            MAX_WALLET_AMOUNT,
            transferFee,
            paused()
        );
    }
    
    /**
     * @dev Get user's staking information
     * @param account Address to query
     */
    function getStakingInfo(address account) external view returns (
        uint256 stakedAmount,
        uint256 stakingStart,
        uint256 pendingRewards,
        uint256 accessLevel
    ) {
        return (
            stakingBalance[account],
            stakingStartTime[account],
            calculateStakingReward(account),
            userAccessLevel[account]
        );
    }
    
    /**
     * @dev Get vesting information for an account
     * @param beneficiary Address to query
     */
    function getVestingInfo(address beneficiary) external view returns (
        uint256 totalAmount,
        uint256 releasedAmount,
        uint256 releasableAmount,
        uint256 startTime,
        uint256 cliffDuration,
        uint256 vestingDuration,
        bool revocable,
        bool revoked
    ) {
        VestingSchedule storage schedule = vestingSchedules[beneficiary];
        return (
            schedule.totalAmount,
            schedule.releasedAmount,
            calculateReleasableAmount(beneficiary),
            schedule.startTime,
            schedule.cliffDuration,
            schedule.vestingDuration,
            schedule.revocable,
            schedule.revoked
        );
    }
    
    // ============ Required Overrides ============
    
    function _mint(address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._mint(to, amount);
    }
    
    function _burn(address account, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._burn(account, amount);
    }
    
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }
    
    // Allow contract to receive ETH
    receive() external payable {}
}