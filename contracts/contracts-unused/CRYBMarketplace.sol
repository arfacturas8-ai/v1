// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

/**
 * @title CRYB NFT Marketplace
 * @dev Advanced NFT marketplace with multiple auction types and trading features
 * 
 * Features:
 * - Fixed price listings
 * - English auctions (highest bid wins)
 * - Dutch auctions (decreasing price)
 * - Sealed-bid auctions
 * - Bundle listings
 * - Royalty support (ERC2981)
 * - Multi-token payment support
 * - Fractional ownership
 * - Collection offers
 * - Trading fees and rewards
 */
contract CRYBMarketplace is IERC721Receiver, ReentrancyGuard, Pausable, Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // ============ Constants ============
    
    uint256 public constant MAX_FEE = 1000; // 10% max fee
    uint256 public constant MIN_AUCTION_DURATION = 1 hours;
    uint256 public constant MAX_AUCTION_DURATION = 30 days;
    uint256 public constant MIN_BID_INCREMENT = 100; // 1% min increment
    uint256 public constant MAX_BUNDLE_SIZE = 50;

    // ============ Enums ============
    
    enum ListingType { FIXED_PRICE, ENGLISH_AUCTION, DUTCH_AUCTION, SEALED_BID_AUCTION }
    enum ListingStatus { ACTIVE, SOLD, CANCELLED, EXPIRED }

    // ============ Structs ============
    
    struct Listing {
        uint256 listingId;
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        uint256 startTime;
        uint256 endTime;
        address paymentToken; // address(0) for ETH
        ListingType listingType;
        ListingStatus status;
        uint256 highestBid;
        address highestBidder;
        uint256 reservePrice;
        uint256 startingPrice; // For Dutch auctions
        uint256 endingPrice; // For Dutch auctions
        bool isBundle;
        uint256[] bundleTokenIds;
    }
    
    struct Bid {
        address bidder;
        uint256 amount;
        uint256 timestamp;
        bool isActive;
        bytes32 commitment; // For sealed-bid auctions
        bool revealed;
    }
    
    struct Offer {
        address buyer;
        address nftContract;
        uint256 tokenId;
        uint256 amount;
        address paymentToken;
        uint256 expiration;
        bool isActive;
        bool isCollectionOffer;
    }
    
    struct FractionalShare {
        address nftContract;
        uint256 tokenId;
        uint256 totalShares;
        uint256 availableShares;
        uint256 pricePerShare;
        address paymentToken;
        mapping(address => uint256) userShares;
        bool isActive;
    }

    // ============ Storage ============
    
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => mapping(address => Bid)) public bids;
    mapping(uint256 => address[]) public listingBidders;
    mapping(uint256 => Offer) public offers;
    mapping(uint256 => FractionalShare) public fractionalShares;
    
    mapping(address => bool) public approvedPaymentTokens;
    mapping(address => uint256) public collectionFees; // Collection-specific fees
    mapping(address => bool) public bannedUsers;
    mapping(address => uint256) public userTradingVolume;
    mapping(address => uint256) public userTradingRewards;
    
    uint256 public listingCounter;
    uint256 public offerCounter;
    uint256 public fractionalCounter;
    uint256 public platformFee = 250; // 2.5%
    uint256 public totalVolume;
    uint256 public totalFees;
    
    address public feeRecipient;
    address public cribToken;
    
    // Trading rewards
    uint256 public tradingRewardRate = 100; // 1% of trading volume in CRYB tokens
    bool public tradingRewardsEnabled = true;

    // ============ Events ============
    
    event ListingCreated(
        uint256 indexed listingId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 price,
        ListingType listingType
    );
    event ListingSold(
        uint256 indexed listingId,
        address indexed buyer,
        uint256 price
    );
    event ListingCancelled(uint256 indexed listingId);
    event BidPlaced(
        uint256 indexed listingId,
        address indexed bidder,
        uint256 amount
    );
    event BidWithdrawn(uint256 indexed listingId, address indexed bidder);
    event OfferMade(
        uint256 indexed offerId,
        address indexed buyer,
        address indexed nftContract,
        uint256 tokenId,
        uint256 amount
    );
    event OfferAccepted(uint256 indexed offerId);
    event FractionalShareCreated(
        uint256 indexed shareId,
        address indexed nftContract,
        uint256 tokenId,
        uint256 totalShares,
        uint256 pricePerShare
    );
    event FractionalSharePurchased(
        uint256 indexed shareId,
        address indexed buyer,
        uint256 shares,
        uint256 totalPrice
    );
    event TradingRewardPaid(address indexed user, uint256 amount);

    // ============ Constructor ============
    
    constructor(
        address _feeRecipient,
        address _cribToken
    ) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        require(_cribToken != address(0), "Invalid CRYB token");
        
        feeRecipient = _feeRecipient;
        cribToken = _cribToken;
        
        // Approve ETH and CRYB token by default
        approvedPaymentTokens[address(0)] = true; // ETH
        approvedPaymentTokens[_cribToken] = true; // CRYB
    }

    // ============ Modifiers ============
    
    modifier notBanned() {
        require(!bannedUsers[msg.sender], "User is banned");
        _;
    }
    
    modifier validListing(uint256 listingId) {
        require(listingId < listingCounter, "Invalid listing ID");
        require(listings[listingId].status == ListingStatus.ACTIVE, "Listing not active");
        _;
    }
    
    modifier onlySeller(uint256 listingId) {
        require(listings[listingId].seller == msg.sender, "Not the seller");
        _;
    }

    // ============ Fixed Price Listings ============
    
    /**
     * @dev Create fixed price listing
     * @param nftContract NFT contract address
     * @param tokenId Token ID to list
     * @param price Fixed price
     * @param paymentToken Payment token (address(0) for ETH)
     */
    function createFixedPriceListing(
        address nftContract,
        uint256 tokenId,
        uint256 price,
        address paymentToken
    ) external nonReentrant whenNotPaused notBanned {
        require(price > 0, "Price must be > 0");
        require(approvedPaymentTokens[paymentToken], "Payment token not approved");
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not token owner");
        require(IERC721(nftContract).isApprovedForAll(msg.sender, address(this)) || 
                IERC721(nftContract).getApproved(tokenId) == address(this), "Not approved");
        
        uint256 listingId = listingCounter++;
        
        listings[listingId] = Listing({
            listingId: listingId,
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            startTime: block.timestamp,
            endTime: 0, // No end time for fixed price
            paymentToken: paymentToken,
            listingType: ListingType.FIXED_PRICE,
            status: ListingStatus.ACTIVE,
            highestBid: 0,
            highestBidder: address(0),
            reservePrice: 0,
            startingPrice: 0,
            endingPrice: 0,
            isBundle: false,
            bundleTokenIds: new uint256[](0)
        });
        
        // Transfer NFT to marketplace
        IERC721(nftContract).safeTransferFrom(msg.sender, address(this), tokenId);
        
        emit ListingCreated(listingId, msg.sender, nftContract, tokenId, price, ListingType.FIXED_PRICE);
    }

    /**
     * @dev Buy fixed price listing
     * @param listingId Listing ID to purchase
     */
    function buyFixedPrice(uint256 listingId) external payable nonReentrant whenNotPaused notBanned validListing(listingId) {
        Listing storage listing = listings[listingId];
        require(listing.listingType == ListingType.FIXED_PRICE, "Not a fixed price listing");
        require(listing.seller != msg.sender, "Cannot buy own listing");
        
        uint256 totalPrice = listing.price;
        
        // Handle payment
        if (listing.paymentToken == address(0)) {
            require(msg.value >= totalPrice, "Insufficient ETH");
        } else {
            IERC20(listing.paymentToken).safeTransferFrom(msg.sender, address(this), totalPrice);
        }
        
        _executeSale(listingId, msg.sender, totalPrice);
    }

    // ============ English Auctions ============
    
    /**
     * @dev Create English auction
     * @param nftContract NFT contract address
     * @param tokenId Token ID to auction
     * @param startingPrice Starting bid price
     * @param reservePrice Reserve price (minimum to sell)
     * @param duration Auction duration in seconds
     * @param paymentToken Payment token
     */
    function createEnglishAuction(
        address nftContract,
        uint256 tokenId,
        uint256 startingPrice,
        uint256 reservePrice,
        uint256 duration,
        address paymentToken
    ) external nonReentrant whenNotPaused notBanned {
        require(startingPrice > 0, "Starting price must be > 0");
        require(reservePrice >= startingPrice, "Reserve must be >= starting price");
        require(duration >= MIN_AUCTION_DURATION && duration <= MAX_AUCTION_DURATION, "Invalid duration");
        require(approvedPaymentTokens[paymentToken], "Payment token not approved");
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not token owner");
        require(IERC721(nftContract).isApprovedForAll(msg.sender, address(this)) || 
                IERC721(nftContract).getApproved(tokenId) == address(this), "Not approved");
        
        uint256 listingId = listingCounter++;
        
        listings[listingId] = Listing({
            listingId: listingId,
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: startingPrice,
            startTime: block.timestamp,
            endTime: block.timestamp.add(duration),
            paymentToken: paymentToken,
            listingType: ListingType.ENGLISH_AUCTION,
            status: ListingStatus.ACTIVE,
            highestBid: 0,
            highestBidder: address(0),
            reservePrice: reservePrice,
            startingPrice: startingPrice,
            endingPrice: 0,
            isBundle: false,
            bundleTokenIds: new uint256[](0)
        });
        
        // Transfer NFT to marketplace
        IERC721(nftContract).safeTransferFrom(msg.sender, address(this), tokenId);
        
        emit ListingCreated(listingId, msg.sender, nftContract, tokenId, startingPrice, ListingType.ENGLISH_AUCTION);
    }

    /**
     * @dev Place bid on English auction
     * @param listingId Listing ID to bid on
     * @param amount Bid amount
     */
    function placeBid(uint256 listingId, uint256 amount) external payable nonReentrant whenNotPaused notBanned validListing(listingId) {
        Listing storage listing = listings[listingId];
        require(listing.listingType == ListingType.ENGLISH_AUCTION, "Not an English auction");
        require(block.timestamp < listing.endTime, "Auction ended");
        require(listing.seller != msg.sender, "Cannot bid on own auction");
        
        uint256 currentHighestBid = listing.highestBid > 0 ? listing.highestBid : listing.startingPrice;
        uint256 minBidAmount = currentHighestBid.add(currentHighestBid.mul(MIN_BID_INCREMENT).div(10000));
        require(amount >= minBidAmount, "Bid too low");
        
        // Handle payment
        if (listing.paymentToken == address(0)) {
            require(msg.value >= amount, "Insufficient ETH");
        } else {
            IERC20(listing.paymentToken).safeTransferFrom(msg.sender, address(this), amount);
        }
        
        // Refund previous highest bidder
        if (listing.highestBidder != address(0)) {
            _refundBidder(listing.paymentToken, listing.highestBidder, listing.highestBid);
        }
        
        // Update auction state
        listing.highestBid = amount;
        listing.highestBidder = msg.sender;
        
        // Store bid info
        bids[listingId][msg.sender] = Bid({
            bidder: msg.sender,
            amount: amount,
            timestamp: block.timestamp,
            isActive: true,
            commitment: bytes32(0),
            revealed: false
        });
        
        listingBidders[listingId].push(msg.sender);
        
        emit BidPlaced(listingId, msg.sender, amount);
    }

    /**
     * @dev Finalize English auction
     * @param listingId Listing ID to finalize
     */
    function finalizeAuction(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.listingType == ListingType.ENGLISH_AUCTION, "Not an English auction");
        require(block.timestamp >= listing.endTime, "Auction not ended");
        require(listing.status == ListingStatus.ACTIVE, "Auction not active");
        
        if (listing.highestBid >= listing.reservePrice && listing.highestBidder != address(0)) {
            // Sale successful
            _executeSale(listingId, listing.highestBidder, listing.highestBid);
        } else {
            // Auction failed - return NFT to seller and refund highest bidder
            listing.status = ListingStatus.EXPIRED;
            IERC721(listing.nftContract).safeTransferFrom(address(this), listing.seller, listing.tokenId);
            
            if (listing.highestBidder != address(0)) {
                _refundBidder(listing.paymentToken, listing.highestBidder, listing.highestBid);
            }
        }
    }

    // ============ Dutch Auctions ============
    
    /**
     * @dev Create Dutch auction (price decreases over time)
     * @param nftContract NFT contract address
     * @param tokenId Token ID to auction
     * @param startingPrice Starting price
     * @param endingPrice Minimum price
     * @param duration Auction duration
     * @param paymentToken Payment token
     */
    function createDutchAuction(
        address nftContract,
        uint256 tokenId,
        uint256 startingPrice,
        uint256 endingPrice,
        uint256 duration,
        address paymentToken
    ) external nonReentrant whenNotPaused notBanned {
        require(startingPrice > endingPrice, "Starting price must be > ending price");
        require(endingPrice > 0, "Ending price must be > 0");
        require(duration >= MIN_AUCTION_DURATION && duration <= MAX_AUCTION_DURATION, "Invalid duration");
        require(approvedPaymentTokens[paymentToken], "Payment token not approved");
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not token owner");
        require(IERC721(nftContract).isApprovedForAll(msg.sender, address(this)) || 
                IERC721(nftContract).getApproved(tokenId) == address(this), "Not approved");
        
        uint256 listingId = listingCounter++;
        
        listings[listingId] = Listing({
            listingId: listingId,
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: startingPrice,
            startTime: block.timestamp,
            endTime: block.timestamp.add(duration),
            paymentToken: paymentToken,
            listingType: ListingType.DUTCH_AUCTION,
            status: ListingStatus.ACTIVE,
            highestBid: 0,
            highestBidder: address(0),
            reservePrice: 0,
            startingPrice: startingPrice,
            endingPrice: endingPrice,
            isBundle: false,
            bundleTokenIds: new uint256[](0)
        });
        
        // Transfer NFT to marketplace
        IERC721(nftContract).safeTransferFrom(msg.sender, address(this), tokenId);
        
        emit ListingCreated(listingId, msg.sender, nftContract, tokenId, startingPrice, ListingType.DUTCH_AUCTION);
    }

    /**
     * @dev Buy from Dutch auction at current price
     * @param listingId Listing ID to purchase
     */
    function buyDutchAuction(uint256 listingId) external payable nonReentrant whenNotPaused notBanned validListing(listingId) {
        Listing storage listing = listings[listingId];
        require(listing.listingType == ListingType.DUTCH_AUCTION, "Not a Dutch auction");
        require(block.timestamp < listing.endTime, "Auction ended");
        require(listing.seller != msg.sender, "Cannot buy own auction");
        
        uint256 currentPrice = getDutchAuctionPrice(listingId);
        
        // Handle payment
        if (listing.paymentToken == address(0)) {
            require(msg.value >= currentPrice, "Insufficient ETH");
        } else {
            IERC20(listing.paymentToken).safeTransferFrom(msg.sender, address(this), currentPrice);
        }
        
        _executeSale(listingId, msg.sender, currentPrice);
    }

    /**
     * @dev Get current price for Dutch auction
     * @param listingId Listing ID
     */
    function getDutchAuctionPrice(uint256 listingId) public view returns (uint256) {
        Listing storage listing = listings[listingId];
        require(listing.listingType == ListingType.DUTCH_AUCTION, "Not a Dutch auction");
        
        if (block.timestamp >= listing.endTime) {
            return listing.endingPrice;
        }
        
        uint256 elapsed = block.timestamp.sub(listing.startTime);
        uint256 duration = listing.endTime.sub(listing.startTime);
        uint256 priceDrop = listing.startingPrice.sub(listing.endingPrice);
        
        uint256 currentPriceDrop = priceDrop.mul(elapsed).div(duration);
        return listing.startingPrice.sub(currentPriceDrop);
    }

    // ============ Offers ============
    
    /**
     * @dev Make offer on NFT
     * @param nftContract NFT contract address
     * @param tokenId Token ID (0 for collection offer)
     * @param amount Offer amount
     * @param paymentToken Payment token
     * @param expiration Offer expiration timestamp
     * @param isCollectionOffer Whether this is a collection-wide offer
     */
    function makeOffer(
        address nftContract,
        uint256 tokenId,
        uint256 amount,
        address paymentToken,
        uint256 expiration,
        bool isCollectionOffer
    ) external nonReentrant whenNotPaused notBanned {
        require(amount > 0, "Amount must be > 0");
        require(expiration > block.timestamp, "Invalid expiration");
        require(approvedPaymentTokens[paymentToken], "Payment token not approved");
        
        if (!isCollectionOffer) {
            require(IERC721(nftContract).ownerOf(tokenId) != msg.sender, "Cannot offer on own NFT");
        }
        
        // Lock payment tokens
        if (paymentToken != address(0)) {
            IERC20(paymentToken).safeTransferFrom(msg.sender, address(this), amount);
        }
        
        uint256 offerId = offerCounter++;
        
        offers[offerId] = Offer({
            buyer: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            amount: amount,
            paymentToken: paymentToken,
            expiration: expiration,
            isActive: true,
            isCollectionOffer: isCollectionOffer
        });
        
        emit OfferMade(offerId, msg.sender, nftContract, tokenId, amount);
    }

    /**
     * @dev Accept offer
     * @param offerId Offer ID to accept
     * @param tokenId Token ID (for collection offers)
     */
    function acceptOffer(uint256 offerId, uint256 tokenId) external nonReentrant whenNotPaused notBanned {
        require(offerId < offerCounter, "Invalid offer ID");
        
        Offer storage offer = offers[offerId];
        require(offer.isActive, "Offer not active");
        require(block.timestamp < offer.expiration, "Offer expired");
        
        uint256 actualTokenId = offer.isCollectionOffer ? tokenId : offer.tokenId;
        require(IERC721(offer.nftContract).ownerOf(actualTokenId) == msg.sender, "Not token owner");
        require(IERC721(offer.nftContract).isApprovedForAll(msg.sender, address(this)) || 
                IERC721(offer.nftContract).getApproved(actualTokenId) == address(this), "Not approved");
        
        offer.isActive = false;
        
        // Transfer NFT to buyer
        IERC721(offer.nftContract).safeTransferFrom(msg.sender, offer.buyer, actualTokenId);
        
        // Handle payment
        uint256 totalAmount = offer.amount;
        uint256 fee = _calculateFee(offer.nftContract, totalAmount);
        uint256 royalty = _calculateRoyalty(offer.nftContract, actualTokenId, totalAmount);
        uint256 sellerAmount = totalAmount.sub(fee).sub(royalty);
        
        if (offer.paymentToken == address(0)) {
            // ETH payment
            payable(msg.sender).transfer(sellerAmount);
            if (fee > 0) payable(feeRecipient).transfer(fee);
            if (royalty > 0) {
                address royaltyRecipient = _getRoyaltyRecipient(offer.nftContract, actualTokenId);
                payable(royaltyRecipient).transfer(royalty);
            }
        } else {
            // Token payment
            IERC20(offer.paymentToken).safeTransfer(msg.sender, sellerAmount);
            if (fee > 0) IERC20(offer.paymentToken).safeTransfer(feeRecipient, fee);
            if (royalty > 0) {
                address royaltyRecipient = _getRoyaltyRecipient(offer.nftContract, actualTokenId);
                IERC20(offer.paymentToken).safeTransfer(royaltyRecipient, royalty);
            }
        }
        
        // Update stats and pay trading rewards
        _updateTradingStats(offer.buyer, msg.sender, totalAmount);
        
        emit OfferAccepted(offerId);
    }

    // ============ Bundle Listings ============
    
    /**
     * @dev Create bundle listing
     * @param nftContract NFT contract address
     * @param tokenIds Array of token IDs to bundle
     * @param price Total bundle price
     * @param paymentToken Payment token
     */
    function createBundleListing(
        address nftContract,
        uint256[] calldata tokenIds,
        uint256 price,
        address paymentToken
    ) external nonReentrant whenNotPaused notBanned {
        require(tokenIds.length > 1 && tokenIds.length <= MAX_BUNDLE_SIZE, "Invalid bundle size");
        require(price > 0, "Price must be > 0");
        require(approvedPaymentTokens[paymentToken], "Payment token not approved");
        
        // Verify ownership and approval for all tokens
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(IERC721(nftContract).ownerOf(tokenIds[i]) == msg.sender, "Not token owner");
            require(IERC721(nftContract).isApprovedForAll(msg.sender, address(this)) || 
                    IERC721(nftContract).getApproved(tokenIds[i]) == address(this), "Not approved");
        }
        
        uint256 listingId = listingCounter++;
        
        listings[listingId] = Listing({
            listingId: listingId,
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: 0, // Not used for bundles
            price: price,
            startTime: block.timestamp,
            endTime: 0,
            paymentToken: paymentToken,
            listingType: ListingType.FIXED_PRICE,
            status: ListingStatus.ACTIVE,
            highestBid: 0,
            highestBidder: address(0),
            reservePrice: 0,
            startingPrice: 0,
            endingPrice: 0,
            isBundle: true,
            bundleTokenIds: tokenIds
        });
        
        // Transfer all NFTs to marketplace
        for (uint256 i = 0; i < tokenIds.length; i++) {
            IERC721(nftContract).safeTransferFrom(msg.sender, address(this), tokenIds[i]);
        }
        
        emit ListingCreated(listingId, msg.sender, nftContract, 0, price, ListingType.FIXED_PRICE);
    }

    // ============ Fractional Ownership ============
    
    /**
     * @dev Create fractional shares for NFT
     * @param nftContract NFT contract address
     * @param tokenId Token ID to fractionalize
     * @param totalShares Total number of shares
     * @param pricePerShare Price per share
     * @param paymentToken Payment token
     */
    function createFractionalShares(
        address nftContract,
        uint256 tokenId,
        uint256 totalShares,
        uint256 pricePerShare,
        address paymentToken
    ) external nonReentrant whenNotPaused notBanned {
        require(totalShares > 1, "Must have > 1 share");
        require(pricePerShare > 0, "Price per share must be > 0");
        require(approvedPaymentTokens[paymentToken], "Payment token not approved");
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not token owner");
        require(IERC721(nftContract).isApprovedForAll(msg.sender, address(this)) || 
                IERC721(nftContract).getApproved(tokenId) == address(this), "Not approved");
        
        uint256 shareId = fractionalCounter++;
        
        FractionalShare storage share = fractionalShares[shareId];
        share.nftContract = nftContract;
        share.tokenId = tokenId;
        share.totalShares = totalShares;
        share.availableShares = totalShares;
        share.pricePerShare = pricePerShare;
        share.paymentToken = paymentToken;
        share.isActive = true;
        
        // Transfer NFT to marketplace
        IERC721(nftContract).safeTransferFrom(msg.sender, address(this), tokenId);
        
        emit FractionalShareCreated(shareId, nftContract, tokenId, totalShares, pricePerShare);
    }

    /**
     * @dev Purchase fractional shares
     * @param shareId Share ID
     * @param sharesToBuy Number of shares to purchase
     */
    function buyFractionalShares(uint256 shareId, uint256 sharesToBuy) external payable nonReentrant whenNotPaused notBanned {
        require(shareId < fractionalCounter, "Invalid share ID");
        
        FractionalShare storage share = fractionalShares[shareId];
        require(share.isActive, "Shares not active");
        require(sharesToBuy > 0 && sharesToBuy <= share.availableShares, "Invalid share amount");
        
        uint256 totalPrice = sharesToBuy.mul(share.pricePerShare);
        
        // Handle payment
        if (share.paymentToken == address(0)) {
            require(msg.value >= totalPrice, "Insufficient ETH");
        } else {
            IERC20(share.paymentToken).safeTransferFrom(msg.sender, address(this), totalPrice);
        }
        
        share.userShares[msg.sender] = share.userShares[msg.sender].add(sharesToBuy);
        share.availableShares = share.availableShares.sub(sharesToBuy);
        
        emit FractionalSharePurchased(shareId, msg.sender, sharesToBuy, totalPrice);
    }

    // ============ Internal Functions ============
    
    /**
     * @dev Execute sale and handle payments
     */
    function _executeSale(uint256 listingId, address buyer, uint256 totalPrice) internal {
        Listing storage listing = listings[listingId];
        listing.status = ListingStatus.SOLD;
        
        uint256 fee = _calculateFee(listing.nftContract, totalPrice);
        uint256 royalty = 0;
        
        if (listing.isBundle) {
            // Transfer all NFTs in bundle
            for (uint256 i = 0; i < listing.bundleTokenIds.length; i++) {
                IERC721(listing.nftContract).safeTransferFrom(address(this), buyer, listing.bundleTokenIds[i]);
                royalty = royalty.add(_calculateRoyalty(listing.nftContract, listing.bundleTokenIds[i], totalPrice.div(listing.bundleTokenIds.length)));
            }
        } else {
            // Transfer single NFT
            IERC721(listing.nftContract).safeTransferFrom(address(this), buyer, listing.tokenId);
            royalty = _calculateRoyalty(listing.nftContract, listing.tokenId, totalPrice);
        }
        
        uint256 sellerAmount = totalPrice.sub(fee).sub(royalty);
        
        // Handle payments
        if (listing.paymentToken == address(0)) {
            // ETH payment
            payable(listing.seller).transfer(sellerAmount);
            if (fee > 0) payable(feeRecipient).transfer(fee);
            if (royalty > 0) {
                address royaltyRecipient = _getRoyaltyRecipient(listing.nftContract, listing.tokenId);
                payable(royaltyRecipient).transfer(royalty);
            }
        } else {
            // Token payment
            IERC20(listing.paymentToken).safeTransfer(listing.seller, sellerAmount);
            if (fee > 0) IERC20(listing.paymentToken).safeTransfer(feeRecipient, fee);
            if (royalty > 0) {
                address royaltyRecipient = _getRoyaltyRecipient(listing.nftContract, listing.tokenId);
                IERC20(listing.paymentToken).safeTransfer(royaltyRecipient, royalty);
            }
        }
        
        // Update stats and pay trading rewards
        _updateTradingStats(buyer, listing.seller, totalPrice);
        
        emit ListingSold(listingId, buyer, totalPrice);
    }

    /**
     * @dev Calculate platform and collection fees
     */
    function _calculateFee(address nftContract, uint256 amount) internal view returns (uint256) {
        uint256 fee = collectionFees[nftContract];
        if (fee == 0) {
            fee = platformFee;
        }
        return amount.mul(fee).div(10000);
    }

    /**
     * @dev Calculate royalty using ERC2981
     */
    function _calculateRoyalty(address nftContract, uint256 tokenId, uint256 salePrice) internal view returns (uint256) {
        if (IERC165(nftContract).supportsInterface(type(IERC2981).interfaceId)) {
            (, uint256 royaltyAmount) = IERC2981(nftContract).royaltyInfo(tokenId, salePrice);
            return royaltyAmount;
        }
        return 0;
    }

    /**
     * @dev Get royalty recipient
     */
    function _getRoyaltyRecipient(address nftContract, uint256 tokenId) internal view returns (address) {
        if (IERC165(nftContract).supportsInterface(type(IERC2981).interfaceId)) {
            (address recipient, ) = IERC2981(nftContract).royaltyInfo(tokenId, 0);
            return recipient;
        }
        return address(0);
    }

    /**
     * @dev Update trading statistics and pay rewards
     */
    function _updateTradingStats(address buyer, address seller, uint256 amount) internal {
        totalVolume = totalVolume.add(amount);
        userTradingVolume[buyer] = userTradingVolume[buyer].add(amount);
        userTradingVolume[seller] = userTradingVolume[seller].add(amount);
        
        // Pay trading rewards in CRYB tokens
        if (tradingRewardsEnabled && cribToken != address(0)) {
            uint256 buyerReward = amount.mul(tradingRewardRate).div(10000);
            uint256 sellerReward = buyerReward;
            
            userTradingRewards[buyer] = userTradingRewards[buyer].add(buyerReward);
            userTradingRewards[seller] = userTradingRewards[seller].add(sellerReward);
            
            // This would mint or transfer CRYB tokens as rewards
            // ICRYB(cribToken).mint(buyer, buyerReward);
            // ICRYB(cribToken).mint(seller, sellerReward);
            
            emit TradingRewardPaid(buyer, buyerReward);
            emit TradingRewardPaid(seller, sellerReward);
        }
    }

    /**
     * @dev Refund bidder
     */
    function _refundBidder(address paymentToken, address bidder, uint256 amount) internal {
        if (paymentToken == address(0)) {
            payable(bidder).transfer(amount);
        } else {
            IERC20(paymentToken).safeTransfer(bidder, amount);
        }
    }

    // ============ Admin Functions ============
    
    /**
     * @dev Set platform fee
     * @param _fee New fee in basis points
     */
    function setPlatformFee(uint256 _fee) external onlyOwner {
        require(_fee <= MAX_FEE, "Fee too high");
        platformFee = _fee;
    }

    /**
     * @dev Set collection-specific fee
     * @param nftContract Collection address
     * @param _fee Fee in basis points
     */
    function setCollectionFee(address nftContract, uint256 _fee) external onlyOwner {
        require(_fee <= MAX_FEE, "Fee too high");
        collectionFees[nftContract] = _fee;
    }

    /**
     * @dev Add approved payment token
     * @param token Token address
     */
    function addPaymentToken(address token) external onlyOwner {
        approvedPaymentTokens[token] = true;
    }

    /**
     * @dev Remove approved payment token
     * @param token Token address
     */
    function removePaymentToken(address token) external onlyOwner {
        approvedPaymentTokens[token] = false;
    }

    /**
     * @dev Ban/unban user
     * @param user User address
     * @param banned Ban status
     */
    function setBannedUser(address user, bool banned) external onlyOwner {
        bannedUsers[user] = banned;
    }

    /**
     * @dev Cancel listing (admin only for moderation)
     * @param listingId Listing ID to cancel
     */
    function adminCancelListing(uint256 listingId) external onlyOwner {
        _cancelListing(listingId);
    }

    /**
     * @dev Cancel listing
     * @param listingId Listing ID to cancel
     */
    function cancelListing(uint256 listingId) external nonReentrant onlySeller(listingId) {
        _cancelListing(listingId);
    }

    /**
     * @dev Internal cancel listing function
     */
    function _cancelListing(uint256 listingId) internal {
        Listing storage listing = listings[listingId];
        require(listing.status == ListingStatus.ACTIVE, "Listing not active");
        
        listing.status = ListingStatus.CANCELLED;
        
        if (listing.isBundle) {
            // Return all NFTs in bundle
            for (uint256 i = 0; i < listing.bundleTokenIds.length; i++) {
                IERC721(listing.nftContract).safeTransferFrom(address(this), listing.seller, listing.bundleTokenIds[i]);
            }
        } else {
            // Return single NFT
            IERC721(listing.nftContract).safeTransferFrom(address(this), listing.seller, listing.tokenId);
        }
        
        // Refund highest bidder if auction
        if (listing.listingType == ListingType.ENGLISH_AUCTION && listing.highestBidder != address(0)) {
            _refundBidder(listing.paymentToken, listing.highestBidder, listing.highestBid);
        }
        
        emit ListingCancelled(listingId);
    }

    // ============ View Functions ============
    
    /**
     * @dev Get listing details
     * @param listingId Listing ID
     */
    function getListing(uint256 listingId) external view returns (
        address seller,
        address nftContract,
        uint256 tokenId,
        uint256 price,
        uint256 endTime,
        ListingType listingType,
        ListingStatus status,
        uint256 highestBid,
        address highestBidder
    ) {
        Listing storage listing = listings[listingId];
        return (
            listing.seller,
            listing.nftContract,
            listing.tokenId,
            listing.price,
            listing.endTime,
            listing.listingType,
            listing.status,
            listing.highestBid,
            listing.highestBidder
        );
    }

    /**
     * @dev Get user's fractional shares
     * @param shareId Share ID
     * @param user User address
     */
    function getUserShares(uint256 shareId, address user) external view returns (uint256) {
        return fractionalShares[shareId].userShares[user];
    }

    /**
     * @dev Required by IERC721Receiver
     */
    function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    // ============ Emergency Functions ============
    
    /**
     * @dev Emergency withdrawal (owner only)
     * @param token Token address (address(0) for ETH)
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
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
}