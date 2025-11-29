// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title TokenGating
 * @dev NFT and token-based access control for CRYB Platform
 */
contract TokenGating is Ownable, ReentrancyGuard {

    struct GateRequirement {
        address tokenAddress;
        uint256 minAmount;
        bool isNFT;
        bool isActive;
    }

    struct AccessGate {
        string name;
        string description;
        uint256[] requirementIds;
        bool requireAll; // true = AND logic, false = OR logic
        bool isActive;
        uint256 accessCount;
    }

    // Storage
    uint256 public nextRequirementId;
    uint256 public nextGateId;

    mapping(uint256 => GateRequirement) public requirements;
    mapping(uint256 => AccessGate) public gates;
    mapping(uint256 => mapping(address => bool)) public userAccess; // gateId => user => hasAccess
    mapping(uint256 => mapping(address => uint256)) public accessTimestamp; // gateId => user => timestamp

    // Events
    event RequirementCreated(uint256 indexed requirementId, address indexed tokenAddress, uint256 minAmount, bool isNFT);
    event GateCreated(uint256 indexed gateId, string name);
    event AccessGranted(uint256 indexed gateId, address indexed user);
    event AccessRevoked(uint256 indexed gateId, address indexed user);

    constructor() {}

    // Create a token requirement
    function createRequirement(
        address _tokenAddress,
        uint256 _minAmount,
        bool _isNFT
    ) external onlyOwner returns (uint256) {
        uint256 requirementId = nextRequirementId++;

        requirements[requirementId] = GateRequirement({
            tokenAddress: _tokenAddress,
            minAmount: _minAmount,
            isNFT: _isNFT,
            isActive: true
        });

        emit RequirementCreated(requirementId, _tokenAddress, _minAmount, _isNFT);
        return requirementId;
    }

    // Create an access gate
    function createGate(
        string memory _name,
        string memory _description,
        uint256[] memory _requirementIds,
        bool _requireAll
    ) external onlyOwner returns (uint256) {
        uint256 gateId = nextGateId++;

        gates[gateId] = AccessGate({
            name: _name,
            description: _description,
            requirementIds: _requirementIds,
            requireAll: _requireAll,
            isActive: true,
            accessCount: 0
        });

        emit GateCreated(gateId, _name);
        return gateId;
    }

    // Check if user has access to a gate
    function hasAccess(uint256 _gateId, address _user) public view returns (bool) {
        AccessGate storage gate = gates[_gateId];
        if (!gate.isActive) return false;

        if (gate.requireAll) {
            // AND logic - must meet ALL requirements
            for (uint256 i = 0; i < gate.requirementIds.length; i++) {
                if (!meetsRequirement(gate.requirementIds[i], _user)) {
                    return false;
                }
            }
            return true;
        } else {
            // OR logic - must meet ANY requirement
            for (uint256 i = 0; i < gate.requirementIds.length; i++) {
                if (meetsRequirement(gate.requirementIds[i], _user)) {
                    return true;
                }
            }
            return false;
        }
    }

    // Check if user meets a specific requirement
    function meetsRequirement(uint256 _requirementId, address _user) public view returns (bool) {
        GateRequirement storage req = requirements[_requirementId];
        if (!req.isActive) return false;

        if (req.isNFT) {
            // Check NFT ownership
            IERC721 nft = IERC721(req.tokenAddress);
            return nft.balanceOf(_user) >= req.minAmount;
        } else {
            // Check token balance
            IERC20 token = IERC20(req.tokenAddress);
            return token.balanceOf(_user) >= req.minAmount;
        }
    }

    // Grant access (called by external systems after verification)
    function grantAccess(uint256 _gateId, address _user) external nonReentrant {
        require(hasAccess(_gateId, _user), "User does not meet requirements");

        if (!userAccess[_gateId][_user]) {
            userAccess[_gateId][_user] = true;
            accessTimestamp[_gateId][_user] = block.timestamp;
            gates[_gateId].accessCount++;

            emit AccessGranted(_gateId, _user);
        }
    }

    // Revoke access
    function revokeAccess(uint256 _gateId, address _user) external onlyOwner {
        if (userAccess[_gateId][_user]) {
            userAccess[_gateId][_user] = false;
            emit AccessRevoked(_gateId, _user);
        }
    }

    // Update gate status
    function setGateActive(uint256 _gateId, bool _isActive) external onlyOwner {
        gates[_gateId].isActive = _isActive;
    }

    // Update requirement status
    function setRequirementActive(uint256 _requirementId, bool _isActive) external onlyOwner {
        requirements[_requirementId].isActive = _isActive;
    }

    // Get gate requirements
    function getGateRequirements(uint256 _gateId) external view returns (uint256[] memory) {
        return gates[_gateId].requirementIds;
    }
}
