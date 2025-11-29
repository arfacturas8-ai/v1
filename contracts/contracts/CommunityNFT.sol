// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title CommunityNFT
 * @dev Community membership NFT collection for CRYB Platform
 */
contract CommunityNFT is
    ERC721,
    ERC721Enumerable,
    ERC721URIStorage,
    ERC721Burnable,
    Pausable,
    Ownable,
    ReentrancyGuard
{
    using Counters for Counters.Counter;

    // Constants
    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public constant MAX_MINT_PER_TX = 10;

    // Storage
    Counters.Counter private _tokenIdCounter;

    uint256 public publicMintPrice = 0.08 ether;
    uint256 public whitelistMintPrice = 0.06 ether;

    // Minting phases
    enum MintPhase { CLOSED, WHITELIST, PUBLIC, FINISHED }
    MintPhase public currentPhase = MintPhase.CLOSED;

    // Whitelist management
    mapping(address => bool) public isWhitelisted;
    mapping(address => uint256) public whitelistMintCount;
    mapping(address => uint256) public publicMintCount;

    // Metadata
    string private _baseTokenURI;
    string private _placeholderURI;
    bool public isRevealed = false;

    // Profile picture
    mapping(address => uint256) public userProfilePicture;

    // Treasury
    address public teamWallet;

    // Events
    event PhaseChanged(MintPhase indexed newPhase);
    event WhitelistAdded(address[] indexed accounts);
    event BatchMinted(address indexed to, uint256 startTokenId, uint256 quantity);
    event Revealed(string indexed baseURI);
    event ProfilePictureSet(address indexed user, uint256 indexed tokenId);

    constructor(
        string memory name,
        string memory symbol,
        string memory placeholderURI,
        address _teamWallet
    ) ERC721(name, symbol) {
        _placeholderURI = placeholderURI;
        teamWallet = _teamWallet != address(0) ? _teamWallet : msg.sender;
    }

    // Mint functions
    function publicMint(uint256 quantity) external payable nonReentrant whenNotPaused {
        require(currentPhase == MintPhase.PUBLIC, "Public mint not active");
        require(quantity > 0 && quantity <= MAX_MINT_PER_TX, "Invalid quantity");
        require(_tokenIdCounter.current() + quantity <= MAX_SUPPLY, "Exceeds max supply");
        require(msg.value >= publicMintPrice * quantity, "Insufficient payment");

        publicMintCount[msg.sender] += quantity;

        uint256 startTokenId = _tokenIdCounter.current();
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            _safeMint(msg.sender, tokenId);
        }

        emit BatchMinted(msg.sender, startTokenId, quantity);
    }

    function whitelistMint(uint256 quantity) external payable nonReentrant whenNotPaused {
        require(currentPhase == MintPhase.WHITELIST, "Whitelist mint not active");
        require(isWhitelisted[msg.sender], "Not whitelisted");
        require(quantity > 0 && quantity <= MAX_MINT_PER_TX, "Invalid quantity");
        require(_tokenIdCounter.current() + quantity <= MAX_SUPPLY, "Exceeds max supply");
        require(msg.value >= whitelistMintPrice * quantity, "Insufficient payment");

        whitelistMintCount[msg.sender] += quantity;

        uint256 startTokenId = _tokenIdCounter.current();
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            _safeMint(msg.sender, tokenId);
        }

        emit BatchMinted(msg.sender, startTokenId, quantity);
    }

    function ownerMint(address to, uint256 quantity) external onlyOwner {
        require(_tokenIdCounter.current() + quantity <= MAX_SUPPLY, "Exceeds max supply");

        uint256 startTokenId = _tokenIdCounter.current();
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            _safeMint(to, tokenId);
        }

        emit BatchMinted(to, startTokenId, quantity);
    }

    // Whitelist management
    function addToWhitelist(address[] calldata accounts) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            isWhitelisted[accounts[i]] = true;
        }
        emit WhitelistAdded(accounts);
    }

    function removeFromWhitelist(address account) external onlyOwner {
        isWhitelisted[account] = false;
    }

    // Phase management
    function setPhase(MintPhase newPhase) external onlyOwner {
        currentPhase = newPhase;
        emit PhaseChanged(newPhase);
    }

    // Metadata management
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    function reveal(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
        isRevealed = true;
        emit Revealed(baseURI);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

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

        return super.tokenURI(tokenId);
    }

    // Profile picture
    function setProfilePicture(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        userProfilePicture[msg.sender] = tokenId;
        emit ProfilePictureSet(msg.sender, tokenId);
    }

    // Price management
    function setPublicMintPrice(uint256 price) external onlyOwner {
        publicMintPrice = price;
    }

    function setWhitelistMintPrice(uint256 price) external onlyOwner {
        whitelistMintPrice = price;
    }

    // Withdraw funds
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        payable(teamWallet).transfer(balance);
    }

    // Pausable
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // View functions
    function totalMinted() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    function remainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - _tokenIdCounter.current();
    }

    // Required overrides
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
