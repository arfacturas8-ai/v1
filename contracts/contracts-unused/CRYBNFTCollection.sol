// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

/**
 * @title CRYB NFT Collection
 * @dev Advanced ERC-721 NFT collection for CRYB Platform
 * 
 * Features:
 * - ERC721 with enumerable and URI storage
 * - Royalty support (ERC2981)
 * - Minting phases (whitelist, public, etc.)
 * - Reveal mechanism for artwork
 * - Profile picture verification
 * - Staking/utility integration
 * - Marketplace integration
 * - Access control and pausability
 */
contract CRYBNFTCollection is 
    ERC721, 
    ERC721Enumerable, 
    ERC721URIStorage, 
    ERC721Burnable, 
    ERC721Royalty,
    Pausable, 
    Ownable, 
    ReentrancyGuard 
{
    using Counters for Counters.Counter;
    using SafeMath for uint256;
    
    // ============ Constants ============
    
    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public constant MAX_MINT_PER_TX = 10;
    uint256 public constant MAX_MINT_PER_WALLET = 50;
    uint256 public constant WHITELIST_MAX_MINT = 5;
    
    // ============ Storage ============
    
    Counters.Counter private _tokenIdCounter;
    
    // Minting configuration
    uint256 public publicMintPrice = 0.08 ether;
    uint256 public whitelistMintPrice = 0.06 ether;
    uint256 public maxWhitelistSupply = 2000;
    uint256 public whitelistMinted = 0;
    
    // Minting phases
    enum MintPhase { CLOSED, WHITELIST, PUBLIC, FINISHED }
    MintPhase public currentPhase = MintPhase.CLOSED;
    
    // Whitelist management
    mapping(address => bool) public isWhitelisted;
    mapping(address => uint256) public whitelistMintCount;
    mapping(address => uint256) public publicMintCount;
    
    // Metadata management
    string private _baseTokenURI;
    string private _placeholderURI;
    bool public isRevealed = false;
    
    // Profile picture verification
    mapping(uint256 => bool) public isProfilePictureEligible;
    mapping(address => uint256) public userProfilePicture; // user => tokenId
    
    // Utility and staking
    mapping(uint256 => bool) public isStaked;
    mapping(uint256 => uint256) public stakingStartTime;
    mapping(uint256 => uint256) public stakingRewards;
    uint256 public stakingRewardRate = 10 ether; // CRYB tokens per day
    
    // Marketplace integration
    mapping(uint256 => bool) public isMarketplaceApproved;
    mapping(address => bool) public approvedMarketplaces;
    
    // Treasury and team
    address public teamWallet;
    address public royaltyRecipient;
    uint96 public royaltyFeeNumerator = 750; // 7.5%
    
    // ============ Events ============
    
    event PhaseChanged(MintPhase indexed newPhase);
    event WhitelistAdded(address[] indexed accounts);
    event WhitelistRemoved(address[] indexed accounts);
    event BatchMinted(address indexed to, uint256 startTokenId, uint256 quantity);
    event Revealed(string indexed baseURI);
    event ProfilePictureSet(address indexed user, uint256 indexed tokenId);
    event TokenStaked(uint256 indexed tokenId, address indexed owner);
    event TokenUnstaked(uint256 indexed tokenId, address indexed owner, uint256 reward);
    event StakingRewardsClaimed(address indexed owner, uint256 amount);
    event MarketplaceApproved(address indexed marketplace, bool approved);
    
    // ============ Constructor ============
    
    constructor(
        string memory name,
        string memory symbol,
        string memory placeholderURI,
        address _teamWallet,
        address _royaltyRecipient
    ) ERC721(name, symbol) {
        require(_teamWallet != address(0), "Invalid team wallet");
        require(_royaltyRecipient != address(0), "Invalid royalty recipient");
        
        _placeholderURI = placeholderURI;
        teamWallet = _teamWallet;
        royaltyRecipient = _royaltyRecipient;
        
        // Set default royalty
        _setDefaultRoyalty(_royaltyRecipient, royaltyFeeNumerator);
        
        // Start from token ID 1
        _tokenIdCounter.increment();
    }
    
    // ============ Modifiers ============
    
    modifier validMintPhase(MintPhase phase) {
        require(currentPhase == phase, "Invalid minting phase");
        _;
    }
    
    modifier onlyTokenOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == _msgSender(), "Not token owner");
        _;
    }
    
    // ============ Minting Functions ============
    
    /**
     * @dev Whitelist minting
     * @param quantity Number of tokens to mint
     */
    function whitelistMint(uint256 quantity) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        validMintPhase(MintPhase.WHITELIST) 
    {
        require(isWhitelisted[_msgSender()], "Not whitelisted");
        require(quantity > 0 && quantity <= MAX_MINT_PER_TX, "Invalid quantity");
        require(whitelistMintCount[_msgSender()].add(quantity) <= WHITELIST_MAX_MINT, "Whitelist limit exceeded");
        require(whitelistMinted.add(quantity) <= maxWhitelistSupply, "Whitelist supply exceeded");
        require(totalSupply().add(quantity) <= MAX_SUPPLY, "Max supply exceeded");
        require(msg.value >= whitelistMintPrice.mul(quantity), "Insufficient payment");
        
        whitelistMintCount[_msgSender()] = whitelistMintCount[_msgSender()].add(quantity);
        whitelistMinted = whitelistMinted.add(quantity);
        
        _batchMint(_msgSender(), quantity);
    }
    
    /**
     * @dev Public minting
     * @param quantity Number of tokens to mint
     */
    function publicMint(uint256 quantity) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        validMintPhase(MintPhase.PUBLIC) 
    {
        require(quantity > 0 && quantity <= MAX_MINT_PER_TX, "Invalid quantity");
        require(publicMintCount[_msgSender()].add(quantity) <= MAX_MINT_PER_WALLET, "Wallet limit exceeded");
        require(totalSupply().add(quantity) <= MAX_SUPPLY, "Max supply exceeded");
        require(msg.value >= publicMintPrice.mul(quantity), "Insufficient payment");
        
        publicMintCount[_msgSender()] = publicMintCount[_msgSender()].add(quantity);
        
        _batchMint(_msgSender(), quantity);
    }
    
    /**
     * @dev Owner mint for team/community
     * @param to Address to mint to
     * @param quantity Number of tokens to mint
     */
    function ownerMint(address to, uint256 quantity) 
        external 
        onlyOwner 
        nonReentrant 
    {
        require(to != address(0), "Invalid address");
        require(quantity > 0, "Invalid quantity");
        require(totalSupply().add(quantity) <= MAX_SUPPLY, "Max supply exceeded");
        
        _batchMint(to, quantity);
    }
    
    /**
     * @dev Internal batch minting function
     * @param to Address to mint to
     * @param quantity Number of tokens to mint
     */
    function _batchMint(address to, uint256 quantity) internal {
        uint256 startTokenId = _tokenIdCounter.current();
        
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            _safeMint(to, tokenId);
            
            // Set profile picture eligibility for special tokens
            if (tokenId <= 100 || tokenId % 100 == 0) {
                isProfilePictureEligible[tokenId] = true;
            }
        }
        
        emit BatchMinted(to, startTokenId, quantity);
    }
    
    // ============ Metadata Functions ============
    
    /**
     * @dev Set base URI for revealed metadata
     * @param baseURI New base URI
     */
    function setBaseURI(string calldata baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }
    
    /**
     * @dev Set placeholder URI for unrevealed metadata
     * @param placeholderURI New placeholder URI
     */
    function setPlaceholderURI(string calldata placeholderURI) external onlyOwner {
        _placeholderURI = placeholderURI;
    }
    
    /**
     * @dev Reveal the collection
     * @param baseURI Base URI for revealed metadata
     */
    function reveal(string calldata baseURI) external onlyOwner {
        require(!isRevealed, "Already revealed");
        _baseTokenURI = baseURI;
        isRevealed = true;
        emit Revealed(baseURI);
    }
    
    /**
     * @dev Get token URI
     * @param tokenId Token ID to get URI for
     */
    function tokenURI(uint256 tokenId) 
        public 
        view 
        override(ERC721, ERC721URIStorage) 
        returns (string memory) 
    {
        require(_exists(tokenId), "Token does not exist");
        
        if (!isRevealed) {
            return _placeholderURI;
        }
        
        string memory storedURI = super.tokenURI(tokenId);
        if (bytes(storedURI).length > 0) {
            return storedURI;
        }
        
        return string(abi.encodePacked(_baseTokenURI, Strings.toString(tokenId), ".json"));
    }
    
    // ============ Profile Picture Functions ============
    
    /**
     * @dev Set token as profile picture
     * @param tokenId Token ID to use as profile picture
     */
    function setProfilePicture(uint256 tokenId) external onlyTokenOwner(tokenId) {
        require(isProfilePictureEligible[tokenId], "Token not eligible for profile picture");
        require(!isStaked[tokenId], "Token is staked");
        
        userProfilePicture[_msgSender()] = tokenId;
        emit ProfilePictureSet(_msgSender(), tokenId);
    }
    
    /**
     * @dev Remove profile picture
     */
    function removeProfilePicture() external {
        require(userProfilePicture[_msgSender()] != 0, "No profile picture set");
        
        uint256 tokenId = userProfilePicture[_msgSender()];
        userProfilePicture[_msgSender()] = 0;
        emit ProfilePictureSet(_msgSender(), 0);
    }
    
    /**
     * @dev Set profile picture eligibility for a token
     * @param tokenId Token ID
     * @param eligible Whether token is eligible
     */
    function setProfilePictureEligibility(uint256 tokenId, bool eligible) external onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        isProfilePictureEligible[tokenId] = eligible;
    }
    
    /**
     * @dev Get user's profile picture token ID
     * @param user Address to check
     * @return tokenId Profile picture token ID (0 if none set)
     */
    function getUserProfilePicture(address user) external view returns (uint256) {
        return userProfilePicture[user];
    }
    
    // ============ Staking Functions ============
    
    /**
     * @dev Stake NFT to earn rewards
     * @param tokenId Token ID to stake
     */
    function stakeToken(uint256 tokenId) external onlyTokenOwner(tokenId) whenNotPaused {
        require(!isStaked[tokenId], "Token already staked");
        
        isStaked[tokenId] = true;
        stakingStartTime[tokenId] = block.timestamp;
        
        emit TokenStaked(tokenId, _msgSender());
    }
    
    /**
     * @dev Unstake NFT and claim rewards
     * @param tokenId Token ID to unstake
     */
    function unstakeToken(uint256 tokenId) external onlyTokenOwner(tokenId) nonReentrant {
        require(isStaked[tokenId], "Token not staked");
        
        uint256 reward = calculateStakingReward(tokenId);
        
        isStaked[tokenId] = false;
        stakingStartTime[tokenId] = 0;
        stakingRewards[tokenId] = 0;
        
        // Remove as profile picture if set
        if (userProfilePicture[_msgSender()] == tokenId) {
            userProfilePicture[_msgSender()] = 0;
        }
        
        // Transfer rewards (would integrate with CRYB token contract)
        if (reward > 0) {
            // This would call CRYB token contract to mint rewards
            // ICRYB(crybTokenAddress).mint(_msgSender(), reward);
        }
        
        emit TokenUnstaked(tokenId, _msgSender(), reward);
    }
    
    /**
     * @dev Calculate staking rewards for a token
     * @param tokenId Token ID to calculate rewards for
     * @return reward Calculated reward amount
     */
    function calculateStakingReward(uint256 tokenId) public view returns (uint256) {
        if (!isStaked[tokenId]) return 0;
        
        uint256 stakingDuration = block.timestamp.sub(stakingStartTime[tokenId]);
        uint256 dailyReward = stakingRewardRate;
        uint256 reward = dailyReward.mul(stakingDuration).div(1 days);
        
        return reward.add(stakingRewards[tokenId]);
    }
    
    /**
     * @dev Set staking reward rate
     * @param newRate New reward rate (tokens per day)
     */
    function setStakingRewardRate(uint256 newRate) external onlyOwner {
        stakingRewardRate = newRate;
    }
    
    // ============ Marketplace Integration ============
    
    /**
     * @dev Approve marketplace for trading
     * @param marketplace Marketplace address
     * @param approved Whether to approve
     */
    function setMarketplaceApproval(address marketplace, bool approved) external onlyOwner {
        approvedMarketplaces[marketplace] = approved;
        emit MarketplaceApproved(marketplace, approved);
    }
    
    /**
     * @dev Check if marketplace is approved
     * @param marketplace Marketplace address
     * @return approved Whether marketplace is approved
     */
    function isMarketplaceApproved(address marketplace) external view returns (bool) {
        return approvedMarketplaces[marketplace];
    }
    
    /**
     * @dev Override approval to include marketplace checks
     */
    function approve(address to, uint256 tokenId) public override(ERC721, IERC721) {
        // Add marketplace approval logic if needed
        super.approve(to, tokenId);
    }
    
    // ============ Whitelist Management ============
    
    /**
     * @dev Add addresses to whitelist
     * @param accounts Array of addresses to whitelist
     */
    function addToWhitelist(address[] calldata accounts) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            isWhitelisted[accounts[i]] = true;
        }
        emit WhitelistAdded(accounts);
    }
    
    /**
     * @dev Remove addresses from whitelist
     * @param accounts Array of addresses to remove from whitelist
     */
    function removeFromWhitelist(address[] calldata accounts) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            isWhitelisted[accounts[i]] = false;
        }
        emit WhitelistRemoved(accounts);
    }
    
    // ============ Phase Management ============
    
    /**
     * @dev Set minting phase
     * @param phase New minting phase
     */
    function setMintPhase(MintPhase phase) external onlyOwner {
        currentPhase = phase;
        emit PhaseChanged(phase);
    }
    
    /**
     * @dev Set mint prices
     * @param _publicPrice New public mint price
     * @param _whitelistPrice New whitelist mint price
     */
    function setMintPrices(uint256 _publicPrice, uint256 _whitelistPrice) external onlyOwner {
        publicMintPrice = _publicPrice;
        whitelistMintPrice = _whitelistPrice;
    }
    
    /**
     * @dev Set whitelist supply limit
     * @param _maxWhitelistSupply New whitelist supply limit
     */
    function setMaxWhitelistSupply(uint256 _maxWhitelistSupply) external onlyOwner {
        require(_maxWhitelistSupply <= MAX_SUPPLY, "Cannot exceed max supply");
        maxWhitelistSupply = _maxWhitelistSupply;
    }
    
    // ============ Royalty Functions ============
    
    /**
     * @dev Set royalty information
     * @param recipient Royalty recipient
     * @param feeNumerator Royalty fee numerator (out of 10000)
     */
    function setRoyalty(address recipient, uint96 feeNumerator) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        require(feeNumerator <= 1000, "Royalty too high"); // Max 10%
        
        royaltyRecipient = recipient;
        royaltyFeeNumerator = feeNumerator;
        _setDefaultRoyalty(recipient, feeNumerator);
    }
    
    // ============ Admin Functions ============
    
    /**
     * @dev Set team wallet
     * @param _teamWallet New team wallet address
     */
    function setTeamWallet(address _teamWallet) external onlyOwner {
        require(_teamWallet != address(0), "Invalid address");
        teamWallet = _teamWallet;
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
     * @dev Withdraw contract balance
     */
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = teamWallet.call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @dev Emergency withdraw ERC20 tokens
     * @param token Token address
     * @param amount Amount to withdraw
     */
    function emergencyWithdrawToken(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(teamWallet, amount);
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Get collection information
     */
    function getCollectionInfo() external view returns (
        uint256 totalSupply,
        uint256 maxSupply,
        uint256 publicPrice,
        uint256 whitelistPrice,
        MintPhase phase,
        bool revealed
    ) {
        return (
            totalSupply(),
            MAX_SUPPLY,
            publicMintPrice,
            whitelistMintPrice,
            currentPhase,
            isRevealed
        );
    }
    
    /**
     * @dev Get user minting information
     * @param user Address to query
     */
    function getUserMintInfo(address user) external view returns (
        bool whitelisted,
        uint256 whitelistMinted,
        uint256 publicMinted,
        uint256 whitelistRemaining,
        uint256 publicRemaining
    ) {
        return (
            isWhitelisted[user],
            whitelistMintCount[user],
            publicMintCount[user],
            WHITELIST_MAX_MINT - whitelistMintCount[user],
            MAX_MINT_PER_WALLET - publicMintCount[user]
        );
    }
    
    /**
     * @dev Get tokens owned by address
     * @param owner Address to query
     * @return tokenIds Array of token IDs owned
     */
    function getTokensByOwner(address owner) external view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);
        
        for (uint256 i = 0; i < tokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }
        
        return tokenIds;
    }
    
    // ============ Required Overrides ============
    
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) whenNotPaused {
        // Prevent transfer of staked tokens
        if (from != address(0) && to != address(0)) {
            require(!isStaked[tokenId], "Token is staked");
        }
        
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
    
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage, ERC721Royalty) {
        // Clean up staking state
        if (isStaked[tokenId]) {
            isStaked[tokenId] = false;
            stakingStartTime[tokenId] = 0;
            stakingRewards[tokenId] = 0;
        }
        
        // Clean up profile picture
        address owner = ownerOf(tokenId);
        if (userProfilePicture[owner] == tokenId) {
            userProfilePicture[owner] = 0;
        }
        
        super._burn(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        override(ERC721, ERC721Enumerable, ERC721URIStorage, ERC721Royalty) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }
}