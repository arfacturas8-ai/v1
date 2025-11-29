// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NFTMarketplace
 * @dev NFT marketplace for CRYB Platform with fixed price listings and auctions
 */
contract NFTMarketplace is IERC721Receiver, ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    enum ListingType { FIXED_PRICE, AUCTION }
    enum ListingStatus { ACTIVE, SOLD, CANCELLED }

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
    }

    struct Bid {
        address bidder;
        uint256 amount;
        uint256 timestamp;
    }

    // Storage
    uint256 public nextListingId;
    uint256 public platformFeePercent = 250; // 2.5%
    address public feeRecipient;

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Bid[]) public listingBids;
    mapping(address => mapping(uint256 => uint256)) public nftToListing; // nftContract => tokenId => listingId

    // Events
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

    constructor(address _feeRecipient) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
    }

    // Create fixed price listing
    function createFixedPriceListing(
        address _nftContract,
        uint256 _tokenId,
        uint256 _price,
        address _paymentToken
    ) external whenNotPaused returns (uint256) {
        require(_price > 0, "Price must be greater than 0");
        require(nftToListing[_nftContract][_tokenId] == 0, "Already listed");

        IERC721 nft = IERC721(_nftContract);
        require(nft.ownerOf(_tokenId) == msg.sender, "Not token owner");
        require(
            nft.isApprovedForAll(msg.sender, address(this)) ||
            nft.getApproved(_tokenId) == address(this),
            "Marketplace not approved"
        );

        uint256 listingId = nextListingId++;

        listings[listingId] = Listing({
            listingId: listingId,
            seller: msg.sender,
            nftContract: _nftContract,
            tokenId: _tokenId,
            price: _price,
            startTime: block.timestamp,
            endTime: 0,
            paymentToken: _paymentToken,
            listingType: ListingType.FIXED_PRICE,
            status: ListingStatus.ACTIVE,
            highestBid: 0,
            highestBidder: address(0)
        });

        nftToListing[_nftContract][_tokenId] = listingId;

        // Transfer NFT to marketplace
        nft.safeTransferFrom(msg.sender, address(this), _tokenId);

        emit ListingCreated(listingId, msg.sender, _nftContract, _tokenId, _price, ListingType.FIXED_PRICE);
        return listingId;
    }

    // Create auction listing
    function createAuctionListing(
        address _nftContract,
        uint256 _tokenId,
        uint256 _startingPrice,
        uint256 _duration,
        address _paymentToken
    ) external whenNotPaused returns (uint256) {
        require(_startingPrice > 0, "Starting price must be greater than 0");
        require(_duration >= 1 hours && _duration <= 30 days, "Invalid duration");
        require(nftToListing[_nftContract][_tokenId] == 0, "Already listed");

        IERC721 nft = IERC721(_nftContract);
        require(nft.ownerOf(_tokenId) == msg.sender, "Not token owner");
        require(
            nft.isApprovedForAll(msg.sender, address(this)) ||
            nft.getApproved(_tokenId) == address(this),
            "Marketplace not approved"
        );

        uint256 listingId = nextListingId++;
        uint256 endTime = block.timestamp + _duration;

        listings[listingId] = Listing({
            listingId: listingId,
            seller: msg.sender,
            nftContract: _nftContract,
            tokenId: _tokenId,
            price: _startingPrice,
            startTime: block.timestamp,
            endTime: endTime,
            paymentToken: _paymentToken,
            listingType: ListingType.AUCTION,
            status: ListingStatus.ACTIVE,
            highestBid: 0,
            highestBidder: address(0)
        });

        nftToListing[_nftContract][_tokenId] = listingId;

        // Transfer NFT to marketplace
        nft.safeTransferFrom(msg.sender, address(this), _tokenId);

        emit ListingCreated(listingId, msg.sender, _nftContract, _tokenId, _startingPrice, ListingType.AUCTION);
        return listingId;
    }

    // Buy fixed price listing with ETH
    function buyWithETH(uint256 _listingId) external payable nonReentrant whenNotPaused {
        Listing storage listing = listings[_listingId];
        require(listing.status == ListingStatus.ACTIVE, "Listing not active");
        require(listing.listingType == ListingType.FIXED_PRICE, "Not a fixed price listing");
        require(listing.paymentToken == address(0), "Listing requires token payment");
        require(msg.value >= listing.price, "Insufficient payment");

        _executeSale(_listingId, msg.sender, listing.price);

        // Refund excess
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }
    }

    // Buy fixed price listing with tokens
    function buyWithToken(uint256 _listingId) external nonReentrant whenNotPaused {
        Listing storage listing = listings[_listingId];
        require(listing.status == ListingStatus.ACTIVE, "Listing not active");
        require(listing.listingType == ListingType.FIXED_PRICE, "Not a fixed price listing");
        require(listing.paymentToken != address(0), "Listing requires ETH payment");

        IERC20 token = IERC20(listing.paymentToken);
        require(token.balanceOf(msg.sender) >= listing.price, "Insufficient balance");

        token.safeTransferFrom(msg.sender, address(this), listing.price);
        _executeSale(_listingId, msg.sender, listing.price);
    }

    // Place bid on auction
    function placeBid(uint256 _listingId) external payable nonReentrant whenNotPaused {
        Listing storage listing = listings[_listingId];
        require(listing.status == ListingStatus.ACTIVE, "Listing not active");
        require(listing.listingType == ListingType.AUCTION, "Not an auction");
        require(block.timestamp <= listing.endTime, "Auction ended");
        require(listing.paymentToken == address(0), "Token bids not supported yet");

        uint256 minBid = listing.highestBid > 0 ? listing.highestBid + (listing.highestBid / 20) : listing.price; // 5% increment
        require(msg.value >= minBid, "Bid too low");

        // Refund previous highest bidder
        if (listing.highestBidder != address(0)) {
            payable(listing.highestBidder).transfer(listing.highestBid);
        }

        listing.highestBid = msg.value;
        listing.highestBidder = msg.sender;

        listingBids[_listingId].push(Bid({
            bidder: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp
        }));

        emit BidPlaced(_listingId, msg.sender, msg.value);
    }

    // Finalize auction
    function finalizeAuction(uint256 _listingId) external nonReentrant {
        Listing storage listing = listings[_listingId];
        require(listing.status == ListingStatus.ACTIVE, "Listing not active");
        require(listing.listingType == ListingType.AUCTION, "Not an auction");
        require(block.timestamp > listing.endTime, "Auction not ended");

        if (listing.highestBidder != address(0)) {
            _executeSale(_listingId, listing.highestBidder, listing.highestBid);
        } else {
            // No bids, return NFT to seller
            IERC721(listing.nftContract).safeTransferFrom(
                address(this),
                listing.seller,
                listing.tokenId
            );
            listing.status = ListingStatus.CANCELLED;
            delete nftToListing[listing.nftContract][listing.tokenId];
        }
    }

    // Cancel listing
    function cancelListing(uint256 _listingId) external nonReentrant {
        Listing storage listing = listings[_listingId];
        require(listing.seller == msg.sender, "Not seller");
        require(listing.status == ListingStatus.ACTIVE, "Listing not active");

        if (listing.listingType == ListingType.AUCTION) {
            require(listing.highestBidder == address(0), "Cannot cancel auction with bids");
        }

        listing.status = ListingStatus.CANCELLED;
        delete nftToListing[listing.nftContract][listing.tokenId];

        // Return NFT to seller
        IERC721(listing.nftContract).safeTransferFrom(
            address(this),
            listing.seller,
            listing.tokenId
        );

        emit ListingCancelled(_listingId);
    }

    // Internal sale execution
    function _executeSale(uint256 _listingId, address _buyer, uint256 _price) internal {
        Listing storage listing = listings[_listingId];

        uint256 fee = (_price * platformFeePercent) / 10000;
        uint256 sellerAmount = _price - fee;

        listing.status = ListingStatus.SOLD;
        delete nftToListing[listing.nftContract][listing.tokenId];

        // Transfer NFT to buyer
        IERC721(listing.nftContract).safeTransferFrom(
            address(this),
            _buyer,
            listing.tokenId
        );

        // Transfer payment
        if (listing.paymentToken == address(0)) {
            payable(listing.seller).transfer(sellerAmount);
            if (fee > 0) {
                payable(feeRecipient).transfer(fee);
            }
        } else {
            IERC20 token = IERC20(listing.paymentToken);
            token.safeTransfer(listing.seller, sellerAmount);
            if (fee > 0) {
                token.safeTransfer(feeRecipient, fee);
            }
        }

        emit ListingSold(_listingId, _buyer, _price);
    }

    // Admin functions
    function updateFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 1000, "Fee too high"); // Max 10%
        platformFeePercent = _newFee;
    }

    function updateFeeRecipient(address _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "Invalid recipient");
        feeRecipient = _newRecipient;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Required ERC721Receiver implementation
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    // View functions
    function getListingBids(uint256 _listingId) external view returns (Bid[] memory) {
        return listingBids[_listingId];
    }
}
