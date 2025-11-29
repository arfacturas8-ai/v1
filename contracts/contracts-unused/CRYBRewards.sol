// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title CRYB Content Creator & Community Rewards System
 * @dev Advanced tokenomics system for rewarding content creation and community participation
 * 
 * Features:
 * - Content creation rewards with quality metrics
 * - Community engagement rewards (likes, comments, shares)
 * - Moderator compensation system
 * - Premium feature access through token holdings
 * - Referral program with multi-level rewards
 * - Seasonal reward campaigns
 * - Anti-spam and quality assurance mechanisms
 */
contract CRYBRewards is ReentrancyGuard, Pausable, Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // ============ Constants ============
    
    uint256 public constant PRECISION = 1e18;
    uint256 public constant MAX_REFERRAL_LEVELS = 5;
    uint256 public constant MAX_QUALITY_SCORE = 100;
    uint256 public constant SECONDS_PER_DAY = 86400;

    // ============ Enums ============
    
    enum ContentType { POST, COMMENT, SHARE, LIKE, COMMUNITY_CREATE, MODERATE }
    enum UserTier { BRONZE, SILVER, GOLD, PLATINUM, DIAMOND }

    // ============ Structs ============
    
    struct ContentReward {
        ContentType contentType;
        uint256 baseReward;
        uint256 qualityMultiplier;
        uint256 timeDecayFactor;
        bool isActive;
    }
    
    struct UserStats {
        uint256 totalEarned;
        uint256 contentCreated;
        uint256 engagementScore;
        uint256 qualityScore;
        uint256 lastActivityTime;
        UserTier tier;
        uint256 referralCount;
        uint256 referralEarnings;
        bool isPremium;
        uint256 premiumExpiryTime;
    }
    
    struct ContentMetrics {
        uint256 likes;
        uint256 comments;
        uint256 shares;
        uint256 views;
        uint256 qualityScore;
        uint256 timestamp;
        address creator;
        bool rewarded;
    }
    
    struct Campaign {
        string name;
        uint256 totalBudget;
        uint256 remainingBudget;
        uint256 startTime;
        uint256 endTime;
        uint256 rewardMultiplier;
        mapping(address => bool) participated;
        mapping(address => uint256) userRewards;
        bool isActive;
    }
    
    struct ReferralReward {
        uint256 level;
        uint256 percentage; // Basis points
        uint256 minReferrals;
    }

    // ============ Storage ============
    
    IERC20 public cribToken;
    
    // Reward configuration
    mapping(ContentType => ContentReward) public contentRewards;
    mapping(address => UserStats) public userStats;
    mapping(bytes32 => ContentMetrics) public contentMetrics;
    mapping(uint256 => Campaign) public campaigns;
    mapping(address => address) public referrers;
    
    ReferralReward[] public referralRewards;
    
    // Treasury and fee management
    address public treasury;
    address public moderatorPool;
    uint256 public treasuryFee = 500; // 5%
    uint256 public moderatorFee = 200; // 2%
    
    // Anti-spam and quality control
    mapping(address => uint256) public dailyContentCount;
    mapping(address => uint256) public lastContentTime;
    mapping(address => bool) public bannedUsers;
    mapping(address => bool) public verifiedCreators;
    
    uint256 public maxDailyContent = 50;
    uint256 public minTimeBetweenContent = 60; // 1 minute
    uint256 public spamPenaltyDuration = 24 hours;
    
    // Premium access thresholds
    mapping(UserTier => uint256) public tierThresholds;
    mapping(UserTier => uint256) public tierMultipliers;
    
    // Campaign management
    uint256 public campaignCounter;
    bytes32 public merkleRoot; // For whitelisted users
    
    // Global stats
    uint256 public totalRewardsPaid;
    uint256 public totalContentCreated;
    uint256 public activeUsers;

    // ============ Events ============
    
    event ContentRewarded(
        address indexed user,
        bytes32 indexed contentId,
        ContentType contentType,
        uint256 reward,
        uint256 qualityScore
    );
    event ReferralReward(address indexed referrer, address indexed referee, uint256 level, uint256 reward);
    event TierUpgraded(address indexed user, UserTier newTier);
    event PremiumActivated(address indexed user, uint256 duration);
    event CampaignCreated(uint256 indexed campaignId, string name, uint256 budget);
    event CampaignReward(uint256 indexed campaignId, address indexed user, uint256 reward);
    event UserBanned(address indexed user, uint256 duration);
    event QualityScoreUpdated(bytes32 indexed contentId, uint256 newScore);

    // ============ Constructor ============
    
    constructor(
        IERC20 _cribToken,
        address _treasury,
        address _moderatorPool
    ) {
        require(address(_cribToken) != address(0), "Invalid CRYB token");
        require(_treasury != address(0), "Invalid treasury");
        require(_moderatorPool != address(0), "Invalid moderator pool");
        
        cribToken = _cribToken;
        treasury = _treasury;
        moderatorPool = _moderatorPool;
        
        _initializeRewardStructure();
        _initializeReferralProgram();
        _initializeTierSystem();
    }

    // ============ Modifiers ============
    
    modifier notBanned() {
        require(!bannedUsers[msg.sender], "User is banned");
        _;
    }
    
    modifier validContent(bytes32 contentId) {
        require(contentMetrics[contentId].timestamp != 0, "Content does not exist");
        _;
    }
    
    modifier rateLimit() {
        require(
            block.timestamp >= lastContentTime[msg.sender].add(minTimeBetweenContent),
            "Content creation too frequent"
        );
        require(
            dailyContentCount[msg.sender] < maxDailyContent,
            "Daily content limit exceeded"
        );
        _;
        
        lastContentTime[msg.sender] = block.timestamp;
        dailyContentCount[msg.sender] = dailyContentCount[msg.sender].add(1);
    }

    // ============ Content Reward Functions ============
    
    /**
     * @dev Submit content for rewards
     * @param contentId Unique content identifier
     * @param contentType Type of content
     * @param qualityScore Content quality score (0-100)
     * @param metrics Engagement metrics
     */
    function submitContent(
        bytes32 contentId,
        ContentType contentType,
        uint256 qualityScore,
        uint256[4] calldata metrics // [likes, comments, shares, views]
    ) external nonReentrant whenNotPaused notBanned rateLimit {
        require(contentMetrics[contentId].timestamp == 0, "Content already exists");
        require(qualityScore <= MAX_QUALITY_SCORE, "Invalid quality score");
        
        // Store content metrics
        contentMetrics[contentId] = ContentMetrics({
            likes: metrics[0],
            comments: metrics[1],
            shares: metrics[2],
            views: metrics[3],
            qualityScore: qualityScore,
            timestamp: block.timestamp,
            creator: msg.sender,
            rewarded: false
        });
        
        // Calculate and distribute rewards
        uint256 reward = _calculateContentReward(contentType, qualityScore, metrics);
        if (reward > 0) {
            _distributeReward(msg.sender, contentId, contentType, reward, qualityScore);
        }
        
        // Update user stats
        _updateUserStats(msg.sender, contentType, qualityScore);
        
        totalContentCreated = totalContentCreated.add(1);
    }

    /**
     * @dev Calculate reward for content
     */
    function _calculateContentReward(
        ContentType contentType,
        uint256 qualityScore,
        uint256[4] memory metrics
    ) internal view returns (uint256) {
        ContentReward memory rewardConfig = contentRewards[contentType];
        if (!rewardConfig.isActive) return 0;
        
        uint256 baseReward = rewardConfig.baseReward;
        
        // Apply quality multiplier
        uint256 qualityMultiplier = rewardConfig.qualityMultiplier.mul(qualityScore).div(MAX_QUALITY_SCORE);
        uint256 qualityReward = baseReward.mul(qualityMultiplier).div(PRECISION);
        
        // Apply engagement boost
        uint256 engagementScore = metrics[0].add(metrics[1].mul(2)).add(metrics[2].mul(3)).add(metrics[3].div(10));
        uint256 engagementBoost = engagementScore > 0 ? Math.sqrt(engagementScore).mul(100) : 0;
        uint256 engagementReward = baseReward.mul(engagementBoost).div(1000);
        
        return qualityReward.add(engagementReward);
    }

    /**
     * @dev Distribute reward with fees and referral bonuses
     */
    function _distributeReward(
        address user,
        bytes32 contentId,
        ContentType contentType,
        uint256 totalReward,
        uint256 qualityScore
    ) internal {
        contentMetrics[contentId].rewarded = true;
        
        // Calculate fees
        uint256 treasuryAmount = totalReward.mul(treasuryFee).div(10000);
        uint256 moderatorAmount = totalReward.mul(moderatorFee).div(10000);
        uint256 userReward = totalReward.sub(treasuryAmount).sub(moderatorAmount);
        
        // Apply tier multiplier
        UserTier userTier = userStats[user].tier;
        uint256 tierMultiplier = tierMultipliers[userTier];
        userReward = userReward.mul(tierMultiplier).div(PRECISION);
        
        // Transfer rewards
        cribToken.safeTransfer(user, userReward);
        if (treasuryAmount > 0) cribToken.safeTransfer(treasury, treasuryAmount);
        if (moderatorAmount > 0) cribToken.safeTransfer(moderatorPool, moderatorAmount);
        
        // Process referral rewards
        _processReferralRewards(user, userReward);
        
        // Update global stats
        totalRewardsPaid = totalRewardsPaid.add(totalReward);
        
        emit ContentRewarded(user, contentId, contentType, userReward, qualityScore);
    }

    // ============ Referral System ============
    
    /**
     * @dev Set referrer for user
     * @param referrer Address of referrer
     */
    function setReferrer(address referrer) external {
        require(referrers[msg.sender] == address(0), "Referrer already set");
        require(referrer != msg.sender, "Cannot refer yourself");
        require(referrer != address(0), "Invalid referrer");
        
        referrers[msg.sender] = referrer;
        userStats[referrer].referralCount = userStats[referrer].referralCount.add(1);
    }

    /**
     * @dev Process referral rewards for multiple levels
     */
    function _processReferralRewards(address user, uint256 amount) internal {
        address currentReferrer = referrers[user];
        
        for (uint256 level = 0; level < referralRewards.length && currentReferrer != address(0); level++) {
            ReferralReward memory rewardConfig = referralRewards[level];
            
            // Check if referrer meets minimum requirements
            if (userStats[currentReferrer].referralCount >= rewardConfig.minReferrals) {
                uint256 referralReward = amount.mul(rewardConfig.percentage).div(10000);
                
                cribToken.safeTransfer(currentReferrer, referralReward);
                userStats[currentReferrer].referralEarnings = userStats[currentReferrer].referralEarnings.add(referralReward);
                
                emit ReferralReward(currentReferrer, user, level + 1, referralReward);
            }
            
            currentReferrer = referrers[currentReferrer];
        }
    }

    // ============ User Management ============
    
    /**
     * @dev Update user statistics and tier
     */
    function _updateUserStats(address user, ContentType contentType, uint256 qualityScore) internal {
        UserStats storage stats = userStats[user];
        
        stats.contentCreated = stats.contentCreated.add(1);
        stats.qualityScore = stats.qualityScore.add(qualityScore).div(2); // Running average
        stats.lastActivityTime = block.timestamp;
        
        // Update engagement score based on content type
        if (contentType == ContentType.POST) {
            stats.engagementScore = stats.engagementScore.add(10);
        } else if (contentType == ContentType.COMMENT) {
            stats.engagementScore = stats.engagementScore.add(5);
        } else if (contentType == ContentType.SHARE) {
            stats.engagementScore = stats.engagementScore.add(3);
        } else if (contentType == ContentType.LIKE) {
            stats.engagementScore = stats.engagementScore.add(1);
        }
        
        // Check for tier upgrade
        _checkTierUpgrade(user);
        
        // Update active users count
        if (stats.lastActivityTime == block.timestamp && stats.contentCreated == 1) {
            activeUsers = activeUsers.add(1);
        }
    }

    /**
     * @dev Check and upgrade user tier
     */
    function _checkTierUpgrade(address user) internal {
        UserStats storage stats = userStats[user];
        UserTier currentTier = stats.tier;
        UserTier newTier = currentTier;
        
        uint256 totalScore = stats.engagementScore.add(stats.qualityScore.mul(10));
        
        if (totalScore >= tierThresholds[UserTier.DIAMOND] && currentTier < UserTier.DIAMOND) {
            newTier = UserTier.DIAMOND;
        } else if (totalScore >= tierThresholds[UserTier.PLATINUM] && currentTier < UserTier.PLATINUM) {
            newTier = UserTier.PLATINUM;
        } else if (totalScore >= tierThresholds[UserTier.GOLD] && currentTier < UserTier.GOLD) {
            newTier = UserTier.GOLD;
        } else if (totalScore >= tierThresholds[UserTier.SILVER] && currentTier < UserTier.SILVER) {
            newTier = UserTier.SILVER;
        }
        
        if (newTier != currentTier) {
            stats.tier = newTier;
            emit TierUpgraded(user, newTier);
        }
    }

    // ============ Premium Features ============
    
    /**
     * @dev Purchase premium access with CRYB tokens
     * @param duration Duration in days
     */
    function purchasePremium(uint256 duration) external nonReentrant {
        require(duration > 0 && duration <= 365, "Invalid duration");
        
        uint256 cost = duration.mul(1000 * 10**18); // 1000 CRYB per day
        cribToken.safeTransferFrom(msg.sender, treasury, cost);
        
        UserStats storage stats = userStats[msg.sender];
        uint256 currentExpiry = stats.premiumExpiryTime > block.timestamp ? stats.premiumExpiryTime : block.timestamp;
        stats.premiumExpiryTime = currentExpiry.add(duration.mul(SECONDS_PER_DAY));
        stats.isPremium = true;
        
        emit PremiumActivated(msg.sender, duration);
    }

    /**
     * @dev Check if user has premium access
     */
    function hasPremiumAccess(address user) external view returns (bool) {
        return userStats[user].isPremium && userStats[user].premiumExpiryTime > block.timestamp;
    }

    // ============ Campaign Management ============
    
    /**
     * @dev Create reward campaign
     * @param name Campaign name
     * @param budget Total campaign budget
     * @param duration Campaign duration in days
     * @param multiplier Reward multiplier (basis points)
     */
    function createCampaign(
        string calldata name,
        uint256 budget,
        uint256 duration,
        uint256 multiplier
    ) external onlyOwner {
        require(budget > 0, "Invalid budget");
        require(duration > 0 && duration <= 90, "Invalid duration");
        require(multiplier >= 10000, "Multiplier must be >= 100%");
        
        uint256 campaignId = campaignCounter++;
        Campaign storage campaign = campaigns[campaignId];
        
        campaign.name = name;
        campaign.totalBudget = budget;
        campaign.remainingBudget = budget;
        campaign.startTime = block.timestamp;
        campaign.endTime = block.timestamp.add(duration.mul(SECONDS_PER_DAY));
        campaign.rewardMultiplier = multiplier;
        campaign.isActive = true;
        
        // Transfer budget to contract
        cribToken.safeTransferFrom(msg.sender, address(this), budget);
        
        emit CampaignCreated(campaignId, name, budget);
    }

    /**
     * @dev Participate in campaign
     * @param campaignId Campaign ID
     * @param proof Merkle proof for whitelist (if applicable)
     */
    function participateInCampaign(
        uint256 campaignId,
        bytes32[] calldata proof
    ) external nonReentrant {
        Campaign storage campaign = campaigns[campaignId];
        require(campaign.isActive, "Campaign not active");
        require(block.timestamp >= campaign.startTime && block.timestamp <= campaign.endTime, "Campaign not running");
        require(!campaign.participated[msg.sender], "Already participated");
        
        // Verify whitelist if merkle root is set
        if (merkleRoot != bytes32(0)) {
            bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
            require(MerkleProof.verify(proof, merkleRoot, leaf), "Not whitelisted");
        }
        
        // Calculate campaign reward based on user activity
        uint256 userScore = userStats[msg.sender].engagementScore.add(userStats[msg.sender].qualityScore);
        uint256 baseReward = 1000 * 10**18; // 1000 CRYB base
        uint256 campaignReward = baseReward.mul(campaign.rewardMultiplier).div(10000);
        
        // Apply user score multiplier
        campaignReward = campaignReward.mul(userScore.add(100)).div(100);
        
        if (campaignReward > campaign.remainingBudget) {
            campaignReward = campaign.remainingBudget;
        }
        
        campaign.participated[msg.sender] = true;
        campaign.userRewards[msg.sender] = campaignReward;
        campaign.remainingBudget = campaign.remainingBudget.sub(campaignReward);
        
        cribToken.safeTransfer(msg.sender, campaignReward);
        
        emit CampaignReward(campaignId, msg.sender, campaignReward);
    }

    // ============ Quality Control ============
    
    /**
     * @dev Update content quality score (moderator only)
     * @param contentId Content identifier
     * @param newScore New quality score
     */
    function updateQualityScore(bytes32 contentId, uint256 newScore) external validContent(contentId) {
        require(msg.sender == moderatorPool || owner() == msg.sender, "Not authorized");
        require(newScore <= MAX_QUALITY_SCORE, "Invalid score");
        
        contentMetrics[contentId].qualityScore = newScore;
        emit QualityScoreUpdated(contentId, newScore);
    }

    /**
     * @dev Ban user for spam or violation
     * @param user User to ban
     * @param duration Ban duration in seconds
     */
    function banUser(address user, uint256 duration) external {
        require(msg.sender == moderatorPool || owner() == msg.sender, "Not authorized");
        require(duration <= 30 days, "Ban too long");
        
        bannedUsers[user] = true;
        
        // Auto-unban after duration
        if (duration > 0) {
            // This would need a scheduler or manual intervention
        }
        
        emit UserBanned(user, duration);
    }

    /**
     * @dev Verify creator status
     * @param creator Creator address
     * @param verified Verification status
     */
    function setVerifiedCreator(address creator, bool verified) external onlyOwner {
        verifiedCreators[creator] = verified;
    }

    // ============ Admin Functions ============
    
    /**
     * @dev Update content reward configuration
     */
    function updateContentReward(
        ContentType contentType,
        uint256 baseReward,
        uint256 qualityMultiplier,
        bool isActive
    ) external onlyOwner {
        contentRewards[contentType] = ContentReward({
            contentType: contentType,
            baseReward: baseReward,
            qualityMultiplier: qualityMultiplier,
            timeDecayFactor: 0,
            isActive: isActive
        });
    }

    /**
     * @dev Update rate limiting parameters
     */
    function updateRateLimit(
        uint256 _maxDailyContent,
        uint256 _minTimeBetweenContent
    ) external onlyOwner {
        maxDailyContent = _maxDailyContent;
        minTimeBetweenContent = _minTimeBetweenContent;
    }

    /**
     * @dev Update fee configuration
     */
    function updateFees(uint256 _treasuryFee, uint256 _moderatorFee) external onlyOwner {
        require(_treasuryFee.add(_moderatorFee) <= 2000, "Fees too high"); // Max 20%
        treasuryFee = _treasuryFee;
        moderatorFee = _moderatorFee;
    }

    /**
     * @dev Set merkle root for whitelisted campaigns
     */
    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
    }

    /**
     * @dev Emergency token withdrawal
     */
    function emergencyWithdraw(IERC20 token, uint256 amount) external onlyOwner {
        token.safeTransfer(owner(), amount);
    }

    // ============ View Functions ============
    
    /**
     * @dev Get user statistics
     */
    function getUserStats(address user) external view returns (
        uint256 totalEarned,
        uint256 contentCreated,
        uint256 engagementScore,
        uint256 qualityScore,
        UserTier tier,
        bool isPremium
    ) {
        UserStats memory stats = userStats[user];
        return (
            stats.totalEarned,
            stats.contentCreated,
            stats.engagementScore,
            stats.qualityScore,
            stats.tier,
            stats.isPremium && stats.premiumExpiryTime > block.timestamp
        );
    }

    /**
     * @dev Get platform statistics
     */
    function getPlatformStats() external view returns (
        uint256 totalRewards,
        uint256 totalContent,
        uint256 activeUsersCount,
        uint256 activeCampaigns
    ) {
        uint256 campaigns = 0;
        for (uint256 i = 0; i < campaignCounter; i++) {
            if (campaigns[i].isActive && 
                block.timestamp >= campaigns[i].startTime && 
                block.timestamp <= campaigns[i].endTime) {
                campaigns++;
            }
        }
        
        return (totalRewardsPaid, totalContentCreated, activeUsers, campaigns);
    }

    // ============ Internal Functions ============
    
    /**
     * @dev Initialize reward structure
     */
    function _initializeRewardStructure() internal {
        contentRewards[ContentType.POST] = ContentReward({
            contentType: ContentType.POST,
            baseReward: 100 * 10**18, // 100 CRYB
            qualityMultiplier: 2 * PRECISION, // 2x multiplier
            timeDecayFactor: 0,
            isActive: true
        });
        
        contentRewards[ContentType.COMMENT] = ContentReward({
            contentType: ContentType.COMMENT,
            baseReward: 25 * 10**18, // 25 CRYB
            qualityMultiplier: PRECISION, // 1x multiplier
            timeDecayFactor: 0,
            isActive: true
        });
        
        contentRewards[ContentType.SHARE] = ContentReward({
            contentType: ContentType.SHARE,
            baseReward: 10 * 10**18, // 10 CRYB
            qualityMultiplier: PRECISION / 2, // 0.5x multiplier
            timeDecayFactor: 0,
            isActive: true
        });
        
        contentRewards[ContentType.LIKE] = ContentReward({
            contentType: ContentType.LIKE,
            baseReward: 1 * 10**18, // 1 CRYB
            qualityMultiplier: PRECISION / 10, // 0.1x multiplier
            timeDecayFactor: 0,
            isActive: true
        });
    }

    /**
     * @dev Initialize referral program
     */
    function _initializeReferralProgram() internal {
        referralRewards.push(ReferralReward({
            level: 1,
            percentage: 1000, // 10%
            minReferrals: 1
        }));
        
        referralRewards.push(ReferralReward({
            level: 2,
            percentage: 500, // 5%
            minReferrals: 5
        }));
        
        referralRewards.push(ReferralReward({
            level: 3,
            percentage: 250, // 2.5%
            minReferrals: 10
        }));
    }

    /**
     * @dev Initialize tier system
     */
    function _initializeTierSystem() internal {
        tierThresholds[UserTier.BRONZE] = 0;
        tierThresholds[UserTier.SILVER] = 1000;
        tierThresholds[UserTier.GOLD] = 5000;
        tierThresholds[UserTier.PLATINUM] = 15000;
        tierThresholds[UserTier.DIAMOND] = 50000;
        
        tierMultipliers[UserTier.BRONZE] = PRECISION; // 1x
        tierMultipliers[UserTier.SILVER] = PRECISION.mul(110).div(100); // 1.1x
        tierMultipliers[UserTier.GOLD] = PRECISION.mul(125).div(100); // 1.25x
        tierMultipliers[UserTier.PLATINUM] = PRECISION.mul(150).div(100); // 1.5x
        tierMultipliers[UserTier.DIAMOND] = PRECISION.mul(200).div(100); // 2x
    }
}