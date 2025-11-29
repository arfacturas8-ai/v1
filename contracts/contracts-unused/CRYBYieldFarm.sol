// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title CRYB Yield Farming Protocol
 * @dev Advanced yield farming with multiple pools and dynamic rewards
 * 
 * Features:
 * - Multiple farming pools with different reward rates
 * - Dynamic APY adjustment based on TVL
 * - Bonus multipliers for long-term farmers
 * - Reward boost for CRYB token holders
 * - Auto-compounding options
 * - Liquidity mining incentives
 * - Emergency withdrawal mechanisms
 */
contract CRYBYieldFarm is ReentrancyGuard, Pausable, Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // ============ Constants ============
    
    uint256 public constant PRECISION = 1e18;
    uint256 public constant MAX_POOLS = 20;
    uint256 public constant MAX_EMISSION_RATE = 100 * 10**18; // 100 CRYB per block max
    uint256 public constant BLOCKS_PER_YEAR = 2102400; // Assuming 15s block time

    // ============ Structs ============
    
    struct PoolInfo {
        IERC20 lpToken;                 // Address of LP token
        IERC20 rewardToken;            // Reward token (usually CRYB)
        uint256 allocPoint;            // Allocation points for this pool
        uint256 lastRewardBlock;       // Last block number that rewards were distributed
        uint256 accRewardPerShare;     // Accumulated rewards per share, times 1e18
        uint256 totalStaked;           // Total tokens staked in pool
        uint256 minStakeAmount;        // Minimum stake amount
        uint256 maxStakeAmount;        // Maximum stake amount per user
        uint256 lockPeriod;            // Lock period in blocks
        uint256 earlyWithdrawFee;      // Early withdrawal fee (basis points)
        bool isActive;                 // Whether pool is active
        bool autoCompound;             // Whether pool supports auto-compounding
        uint256 boostMultiplier;       // Boost multiplier for CRYB holders
    }
    
    struct UserInfo {
        uint256 amount;                // How many LP tokens user has provided
        uint256 rewardDebt;           // Reward debt
        uint256 lastDepositBlock;     // Last deposit block for lock period
        uint256 pendingRewards;       // Unclaimed rewards
        bool autoCompoundEnabled;     // User's auto-compound preference
        uint256 boostAmount;          // Amount of CRYB staked for boost
    }
    
    struct BoostInfo {
        uint256 threshold;            // CRYB amount needed for boost
        uint256 multiplier;           // Boost multiplier (basis points)
    }

    // ============ Storage ============
    
    PoolInfo[] public poolInfo;
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    mapping(address => bool) public authorizedOperators;
    
    // Boost configuration
    BoostInfo[] public boostTiers;
    mapping(address => uint256) public userBoostStake;
    IERC20 public cribToken;
    
    // Reward configuration
    uint256 public totalAllocPoint = 0;
    uint256 public rewardPerBlock = 1 * 10**18; // 1 CRYB per block initially
    uint256 public startBlock;
    uint256 public endBlock;
    
    // Dynamic reward adjustment
    bool public dynamicRewardsEnabled = true;
    uint256 public targetTVL = 10000000 * 10**18; // 10M USD target TVL
    uint256 public maxRewardMultiplier = 300; // 3x max multiplier
    
    // Treasury and fees
    address public treasury;
    uint256 public treasuryFee = 100; // 1% to treasury
    uint256 public totalFeesCollected;

    // ============ Events ============
    
    event PoolAdded(
        uint256 indexed pid,
        address indexed lpToken,
        uint256 allocPoint,
        uint256 lockPeriod
    );
    event PoolUpdated(
        uint256 indexed pid,
        uint256 allocPoint,
        uint256 lockPeriod
    );
    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event RewardClaimed(address indexed user, uint256 indexed pid, uint256 amount);
    event AutoCompoundToggled(address indexed user, uint256 indexed pid, bool enabled);
    event BoostStaked(address indexed user, uint256 amount);
    event BoostWithdrawn(address indexed user, uint256 amount);
    event RewardsCompounded(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);

    // ============ Constructor ============
    
    constructor(
        IERC20 _cribToken,
        address _treasury,
        uint256 _startBlock,
        uint256 _endBlock
    ) {
        require(address(_cribToken) != address(0), "Invalid CRYB token");
        require(_treasury != address(0), "Invalid treasury");
        require(_startBlock < _endBlock, "Invalid block range");
        
        cribToken = _cribToken;
        treasury = _treasury;
        startBlock = _startBlock;
        endBlock = _endBlock;
        
        // Initialize boost tiers
        boostTiers.push(BoostInfo({
            threshold: 10000 * 10**18,  // 10,000 CRYB
            multiplier: 1100            // 10% boost
        }));
        boostTiers.push(BoostInfo({
            threshold: 50000 * 10**18,  // 50,000 CRYB
            multiplier: 1250            // 25% boost
        }));
        boostTiers.push(BoostInfo({
            threshold: 100000 * 10**18, // 100,000 CRYB
            multiplier: 1500            // 50% boost
        }));
        boostTiers.push(BoostInfo({
            threshold: 500000 * 10**18, // 500,000 CRYB
            multiplier: 2000            // 100% boost
        }));
    }

    // ============ Modifiers ============
    
    modifier onlyAuthorized() {
        require(authorizedOperators[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    modifier validPool(uint256 _pid) {
        require(_pid < poolInfo.length, "Invalid pool ID");
        _;
    }

    // ============ Pool Management ============
    
    /**
     * @dev Add new farming pool
     * @param _lpToken LP token address
     * @param _rewardToken Reward token address
     * @param _allocPoint Allocation points
     * @param _lockPeriod Lock period in blocks
     * @param _minStakeAmount Minimum stake amount
     * @param _maxStakeAmount Maximum stake amount per user
     * @param _earlyWithdrawFee Early withdrawal fee in basis points
     * @param _autoCompound Whether pool supports auto-compounding
     */
    function addPool(
        IERC20 _lpToken,
        IERC20 _rewardToken,
        uint256 _allocPoint,
        uint256 _lockPeriod,
        uint256 _minStakeAmount,
        uint256 _maxStakeAmount,
        uint256 _earlyWithdrawFee,
        bool _autoCompound
    ) external onlyOwner {
        require(poolInfo.length < MAX_POOLS, "Max pools reached");
        require(_earlyWithdrawFee <= 2000, "Fee too high"); // Max 20%
        
        massUpdatePools();
        
        uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;
        totalAllocPoint = totalAllocPoint.add(_allocPoint);
        
        poolInfo.push(PoolInfo({
            lpToken: _lpToken,
            rewardToken: _rewardToken,
            allocPoint: _allocPoint,
            lastRewardBlock: lastRewardBlock,
            accRewardPerShare: 0,
            totalStaked: 0,
            minStakeAmount: _minStakeAmount,
            maxStakeAmount: _maxStakeAmount,
            lockPeriod: _lockPeriod,
            earlyWithdrawFee: _earlyWithdrawFee,
            isActive: true,
            autoCompound: _autoCompound,
            boostMultiplier: 10000 // 100% base multiplier
        }));
        
        emit PoolAdded(poolInfo.length.sub(1), address(_lpToken), _allocPoint, _lockPeriod);
    }

    /**
     * @dev Update pool allocation and parameters
     * @param _pid Pool ID
     * @param _allocPoint New allocation points
     * @param _lockPeriod New lock period
     * @param _isActive Whether pool is active
     */
    function updatePool(
        uint256 _pid,
        uint256 _allocPoint,
        uint256 _lockPeriod,
        bool _isActive
    ) external onlyOwner validPool(_pid) {
        massUpdatePools();
        
        totalAllocPoint = totalAllocPoint.sub(poolInfo[_pid].allocPoint).add(_allocPoint);
        poolInfo[_pid].allocPoint = _allocPoint;
        poolInfo[_pid].lockPeriod = _lockPeriod;
        poolInfo[_pid].isActive = _isActive;
        
        emit PoolUpdated(_pid, _allocPoint, _lockPeriod);
    }

    // ============ Farming Functions ============
    
    /**
     * @dev Deposit LP tokens to farm
     * @param _pid Pool ID
     * @param _amount Amount to deposit
     */
    function deposit(uint256 _pid, uint256 _amount) external nonReentrant whenNotPaused validPool(_pid) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        require(pool.isActive, "Pool not active");
        require(_amount > 0, "Amount must be > 0");
        require(_amount >= pool.minStakeAmount, "Below minimum stake");
        require(user.amount.add(_amount) <= pool.maxStakeAmount, "Above maximum stake");
        
        updatePoolRewards(_pid);
        
        // Claim pending rewards
        if (user.amount > 0) {
            uint256 pending = user.amount.mul(pool.accRewardPerShare).div(PRECISION).sub(user.rewardDebt);
            if (pending > 0) {
                if (user.autoCompoundEnabled && pool.autoCompound && address(pool.lpToken) == address(pool.rewardToken)) {
                    // Auto-compound rewards
                    user.amount = user.amount.add(pending);
                    pool.totalStaked = pool.totalStaked.add(pending);
                    emit RewardsCompounded(msg.sender, _pid, pending);
                } else {
                    // Regular reward claim
                    user.pendingRewards = user.pendingRewards.add(pending);
                }
            }
        }
        
        // Transfer LP tokens
        pool.lpToken.safeTransferFrom(msg.sender, address(this), _amount);
        
        // Update user and pool state
        user.amount = user.amount.add(_amount);
        user.lastDepositBlock = block.number;
        pool.totalStaked = pool.totalStaked.add(_amount);
        
        // Update reward debt with boost
        uint256 boostMultiplier = getUserBoostMultiplier(msg.sender);
        user.rewardDebt = user.amount.mul(pool.accRewardPerShare).mul(boostMultiplier).div(PRECISION).div(10000);
        
        emit Deposit(msg.sender, _pid, _amount);
    }

    /**
     * @dev Withdraw LP tokens and claim rewards
     * @param _pid Pool ID
     * @param _amount Amount to withdraw
     */
    function withdraw(uint256 _pid, uint256 _amount) external nonReentrant validPool(_pid) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        require(user.amount >= _amount, "Insufficient balance");
        require(_amount > 0, "Amount must be > 0");
        
        updatePoolRewards(_pid);
        
        // Calculate and claim pending rewards
        uint256 boostMultiplier = getUserBoostMultiplier(msg.sender);
        uint256 pending = user.amount.mul(pool.accRewardPerShare).mul(boostMultiplier).div(PRECISION).div(10000).sub(user.rewardDebt);
        if (pending > 0) {
            user.pendingRewards = user.pendingRewards.add(pending);
        }
        
        // Check for early withdrawal penalty
        uint256 actualAmount = _amount;
        if (block.number < user.lastDepositBlock.add(pool.lockPeriod) && pool.earlyWithdrawFee > 0) {
            uint256 penalty = _amount.mul(pool.earlyWithdrawFee).div(10000);
            actualAmount = _amount.sub(penalty);
            
            // Transfer penalty to treasury
            pool.lpToken.safeTransfer(treasury, penalty);
            totalFeesCollected = totalFeesCollected.add(penalty);
        }
        
        // Update state
        user.amount = user.amount.sub(_amount);
        pool.totalStaked = pool.totalStaked.sub(_amount);
        user.rewardDebt = user.amount.mul(pool.accRewardPerShare).mul(boostMultiplier).div(PRECISION).div(10000);
        
        // Transfer LP tokens back to user
        pool.lpToken.safeTransfer(msg.sender, actualAmount);
        
        emit Withdraw(msg.sender, _pid, _amount);
    }

    /**
     * @dev Claim pending rewards
     * @param _pid Pool ID
     */
    function claimRewards(uint256 _pid) external nonReentrant validPool(_pid) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        updatePoolRewards(_pid);
        
        uint256 boostMultiplier = getUserBoostMultiplier(msg.sender);
        uint256 pending = user.amount.mul(pool.accRewardPerShare).mul(boostMultiplier).div(PRECISION).div(10000).sub(user.rewardDebt);
        uint256 totalReward = pending.add(user.pendingRewards);
        
        if (totalReward > 0) {
            user.pendingRewards = 0;
            user.rewardDebt = user.amount.mul(pool.accRewardPerShare).mul(boostMultiplier).div(PRECISION).div(10000);
            
            // Deduct treasury fee
            uint256 treasuryAmount = totalReward.mul(treasuryFee).div(10000);
            uint256 userAmount = totalReward.sub(treasuryAmount);
            
            // Transfer rewards
            pool.rewardToken.safeTransfer(msg.sender, userAmount);
            if (treasuryAmount > 0) {
                pool.rewardToken.safeTransfer(treasury, treasuryAmount);
            }
            
            emit RewardClaimed(msg.sender, _pid, userAmount);
        }
    }

    /**
     * @dev Toggle auto-compound for user
     * @param _pid Pool ID
     * @param _enabled Whether to enable auto-compound
     */
    function toggleAutoCompound(uint256 _pid, bool _enabled) external validPool(_pid) {
        PoolInfo storage pool = poolInfo[_pid];
        require(pool.autoCompound, "Pool doesn't support auto-compound");
        
        userInfo[_pid][msg.sender].autoCompoundEnabled = _enabled;
        emit AutoCompoundToggled(msg.sender, _pid, _enabled);
    }

    // ============ Boost System ============
    
    /**
     * @dev Stake CRYB tokens for yield boost
     * @param _amount Amount of CRYB to stake
     */
    function stakeForBoost(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be > 0");
        
        cribToken.safeTransferFrom(msg.sender, address(this), _amount);
        userBoostStake[msg.sender] = userBoostStake[msg.sender].add(_amount);
        
        emit BoostStaked(msg.sender, _amount);
    }

    /**
     * @dev Withdraw CRYB tokens from boost staking
     * @param _amount Amount to withdraw
     */
    function withdrawBoostStake(uint256 _amount) external nonReentrant {
        require(userBoostStake[msg.sender] >= _amount, "Insufficient boost stake");
        
        userBoostStake[msg.sender] = userBoostStake[msg.sender].sub(_amount);
        cribToken.safeTransfer(msg.sender, _amount);
        
        emit BoostWithdrawn(msg.sender, _amount);
    }

    /**
     * @dev Get user's boost multiplier
     * @param _user User address
     */
    function getUserBoostMultiplier(address _user) public view returns (uint256) {
        uint256 userStake = userBoostStake[_user];
        
        for (uint256 i = boostTiers.length; i > 0; i--) {
            if (userStake >= boostTiers[i-1].threshold) {
                return boostTiers[i-1].multiplier;
            }
        }
        
        return 10000; // Base 100% multiplier
    }

    // ============ Reward Calculation ============
    
    /**
     * @dev Update rewards for all pools
     */
    function massUpdatePools() public {
        for (uint256 pid = 0; pid < poolInfo.length; pid++) {
            updatePoolRewards(pid);
        }
    }

    /**
     * @dev Update rewards for specific pool
     * @param _pid Pool ID
     */
    function updatePoolRewards(uint256 _pid) public validPool(_pid) {
        PoolInfo storage pool = poolInfo[_pid];
        
        if (block.number <= pool.lastRewardBlock || !pool.isActive) {
            return;
        }
        
        if (pool.totalStaked == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        
        uint256 blockReward = getBlockReward(pool.lastRewardBlock, block.number);
        uint256 poolReward = blockReward.mul(pool.allocPoint).div(totalAllocPoint);
        
        // Apply dynamic reward multiplier if enabled
        if (dynamicRewardsEnabled) {
            uint256 multiplier = getDynamicRewardMultiplier();
            poolReward = poolReward.mul(multiplier).div(10000);
        }
        
        pool.accRewardPerShare = pool.accRewardPerShare.add(poolReward.mul(PRECISION).div(pool.totalStaked));
        pool.lastRewardBlock = block.number;
    }

    /**
     * @dev Get block reward for given range
     * @param _from From block
     * @param _to To block
     */
    function getBlockReward(uint256 _from, uint256 _to) public view returns (uint256) {
        if (_to <= endBlock) {
            return _to.sub(_from).mul(rewardPerBlock);
        } else if (_from >= endBlock) {
            return 0;
        } else {
            return endBlock.sub(_from).mul(rewardPerBlock);
        }
    }

    /**
     * @dev Get dynamic reward multiplier based on TVL
     */
    function getDynamicRewardMultiplier() public view returns (uint256) {
        uint256 totalTVL = getTotalValueLocked();
        
        if (totalTVL >= targetTVL) {
            return 10000; // 100% base reward
        }
        
        // Increase rewards when TVL is below target
        uint256 shortfall = targetTVL.sub(totalTVL);
        uint256 multiplier = 10000 + shortfall.mul(maxRewardMultiplier.sub(100)).div(targetTVL);
        
        return multiplier > maxRewardMultiplier.mul(100) ? maxRewardMultiplier.mul(100) : multiplier;
    }

    /**
     * @dev Get total value locked across all pools
     */
    function getTotalValueLocked() public view returns (uint256) {
        uint256 tvl = 0;
        for (uint256 i = 0; i < poolInfo.length; i++) {
            tvl = tvl.add(poolInfo[i].totalStaked);
        }
        return tvl;
    }

    /**
     * @dev Get pending rewards for user
     * @param _pid Pool ID
     * @param _user User address
     */
    function pendingRewards(uint256 _pid, address _user) external view validPool(_pid) returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        
        uint256 accRewardPerShare = pool.accRewardPerShare;
        
        if (block.number > pool.lastRewardBlock && pool.totalStaked != 0 && pool.isActive) {
            uint256 blockReward = getBlockReward(pool.lastRewardBlock, block.number);
            uint256 poolReward = blockReward.mul(pool.allocPoint).div(totalAllocPoint);
            
            if (dynamicRewardsEnabled) {
                uint256 multiplier = getDynamicRewardMultiplier();
                poolReward = poolReward.mul(multiplier).div(10000);
            }
            
            accRewardPerShare = accRewardPerShare.add(poolReward.mul(PRECISION).div(pool.totalStaked));
        }
        
        uint256 boostMultiplier = getUserBoostMultiplier(_user);
        uint256 pending = user.amount.mul(accRewardPerShare).mul(boostMultiplier).div(PRECISION).div(10000).sub(user.rewardDebt);
        
        return pending.add(user.pendingRewards);
    }

    // ============ Emergency Functions ============
    
    /**
     * @dev Emergency withdraw without caring about rewards
     * @param _pid Pool ID
     */
    function emergencyWithdraw(uint256 _pid) external nonReentrant validPool(_pid) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        uint256 amount = user.amount;
        user.amount = 0;
        user.rewardDebt = 0;
        user.pendingRewards = 0;
        
        pool.totalStaked = pool.totalStaked.sub(amount);
        pool.lpToken.safeTransfer(msg.sender, amount);
        
        emit EmergencyWithdraw(msg.sender, _pid, amount);
    }

    // ============ Admin Functions ============
    
    /**
     * @dev Set authorized operator
     * @param _operator Operator address
     * @param _authorized Authorization status
     */
    function setAuthorizedOperator(address _operator, bool _authorized) external onlyOwner {
        authorizedOperators[_operator] = _authorized;
    }

    /**
     * @dev Update reward per block
     * @param _rewardPerBlock New reward per block
     */
    function setRewardPerBlock(uint256 _rewardPerBlock) external onlyOwner {
        require(_rewardPerBlock <= MAX_EMISSION_RATE, "Emission rate too high");
        massUpdatePools();
        rewardPerBlock = _rewardPerBlock;
    }

    /**
     * @dev Update farming period
     * @param _startBlock New start block
     * @param _endBlock New end block
     */
    function updateFarmingPeriod(uint256 _startBlock, uint256 _endBlock) external onlyOwner {
        require(_startBlock < _endBlock, "Invalid block range");
        startBlock = _startBlock;
        endBlock = _endBlock;
    }

    /**
     * @dev Set dynamic rewards configuration
     * @param _enabled Whether dynamic rewards are enabled
     * @param _targetTVL Target TVL for reward adjustment
     * @param _maxMultiplier Maximum reward multiplier
     */
    function setDynamicRewards(bool _enabled, uint256 _targetTVL, uint256 _maxMultiplier) external onlyOwner {
        dynamicRewardsEnabled = _enabled;
        targetTVL = _targetTVL;
        maxRewardMultiplier = _maxMultiplier;
    }

    /**
     * @dev Update treasury fee
     * @param _treasuryFee New treasury fee in basis points
     */
    function setTreasuryFee(uint256 _treasuryFee) external onlyOwner {
        require(_treasuryFee <= 1000, "Fee too high"); // Max 10%
        treasuryFee = _treasuryFee;
    }

    /**
     * @dev Add new boost tier
     * @param _threshold CRYB amount threshold
     * @param _multiplier Boost multiplier in basis points
     */
    function addBoostTier(uint256 _threshold, uint256 _multiplier) external onlyOwner {
        require(_multiplier <= 30000, "Multiplier too high"); // Max 300%
        boostTiers.push(BoostInfo({
            threshold: _threshold,
            multiplier: _multiplier
        }));
    }

    /**
     * @dev Emergency token withdrawal (owner only)
     * @param _token Token address
     * @param _amount Amount to withdraw
     */
    function emergencyTokenWithdraw(IERC20 _token, uint256 _amount) external onlyOwner {
        _token.safeTransfer(owner(), _amount);
    }

    /**
     * @dev Pause/unpause contract
     */
    function setPaused(bool _paused) external onlyOwner {
        if (_paused) {
            _pause();
        } else {
            _unpause();
        }
    }

    // ============ View Functions ============
    
    /**
     * @dev Get pool information
     * @param _pid Pool ID
     */
    function getPoolInfo(uint256 _pid) external view validPool(_pid) returns (
        address lpToken,
        address rewardToken,
        uint256 allocPoint,
        uint256 totalStaked,
        uint256 accRewardPerShare,
        bool isActive
    ) {
        PoolInfo storage pool = poolInfo[_pid];
        return (
            address(pool.lpToken),
            address(pool.rewardToken),
            pool.allocPoint,
            pool.totalStaked,
            pool.accRewardPerShare,
            pool.isActive
        );
    }

    /**
     * @dev Get user information
     * @param _pid Pool ID
     * @param _user User address
     */
    function getUserInfo(uint256 _pid, address _user) external view validPool(_pid) returns (
        uint256 amount,
        uint256 rewardDebt,
        uint256 pendingRewardsAmount,
        bool autoCompoundEnabled,
        uint256 boostStake,
        uint256 boostMultiplier
    ) {
        UserInfo storage user = userInfo[_pid][_user];
        return (
            user.amount,
            user.rewardDebt,
            user.pendingRewards,
            user.autoCompoundEnabled,
            userBoostStake[_user],
            getUserBoostMultiplier(_user)
        );
    }

    /**
     * @dev Get farming statistics
     */
    function getFarmingStats() external view returns (
        uint256 totalPools,
        uint256 totalTVL,
        uint256 totalAllocPoints,
        uint256 currentRewardPerBlock,
        uint256 blocksRemaining
    ) {
        uint256 remaining = endBlock > block.number ? endBlock.sub(block.number) : 0;
        return (
            poolInfo.length,
            getTotalValueLocked(),
            totalAllocPoint,
            rewardPerBlock,
            remaining
        );
    }

    /**
     * @dev Get estimated APY for pool
     * @param _pid Pool ID
     */
    function getPoolAPY(uint256 _pid) external view validPool(_pid) returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        
        if (pool.totalStaked == 0 || totalAllocPoint == 0) {
            return 0;
        }
        
        uint256 yearlyRewards = rewardPerBlock.mul(BLOCKS_PER_YEAR);
        uint256 poolYearlyRewards = yearlyRewards.mul(pool.allocPoint).div(totalAllocPoint);
        
        if (dynamicRewardsEnabled) {
            uint256 multiplier = getDynamicRewardMultiplier();
            poolYearlyRewards = poolYearlyRewards.mul(multiplier).div(10000);
        }
        
        // APY = (yearly rewards / total staked) * 100
        return poolYearlyRewards.mul(10000).div(pool.totalStaked);
    }
}