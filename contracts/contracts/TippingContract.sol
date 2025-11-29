// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TippingContract
 * @dev Crypto tipping system for CRYB Platform
 */
contract TippingContract is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    struct Tip {
        address from;
        address to;
        uint256 amount;
        address token;
        string message;
        uint256 timestamp;
    }

    // Storage
    uint256 public nextTipId;
    uint256 public platformFeePercent = 250; // 2.5% (basis points)
    address public feeRecipient;

    mapping(uint256 => Tip) public tips;
    mapping(address => uint256) public totalTipsReceived; // user => total amount
    mapping(address => uint256) public totalTipsSent; // user => total amount
    mapping(address => uint256[]) public userReceivedTips; // user => tip IDs
    mapping(address => uint256[]) public userSentTips; // user => tip IDs
    mapping(address => bool) public supportedTokens;

    // Events
    event TipSent(
        uint256 indexed tipId,
        address indexed from,
        address indexed to,
        uint256 amount,
        address token,
        string message
    );
    event FeeUpdated(uint256 newFee);
    event TokenSupportUpdated(address indexed token, bool supported);

    constructor(address _feeRecipient, address _crybToken) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;

        // Support ETH (address(0)) and CRYB token by default
        supportedTokens[address(0)] = true;
        supportedTokens[_crybToken] = true;
    }

    // Send a tip in ETH
    function tipETH(address _to, string memory _message) external payable nonReentrant {
        require(msg.value > 0, "Tip amount must be greater than 0");
        require(_to != address(0), "Invalid recipient");
        require(_to != msg.sender, "Cannot tip yourself");
        require(supportedTokens[address(0)], "ETH tips not supported");

        uint256 fee = (msg.value * platformFeePercent) / 10000;
        uint256 netAmount = msg.value - fee;

        // Create tip record
        uint256 tipId = nextTipId++;
        tips[tipId] = Tip({
            from: msg.sender,
            to: _to,
            amount: msg.value,
            token: address(0),
            message: _message,
            timestamp: block.timestamp
        });

        // Update stats
        totalTipsSent[msg.sender] += msg.value;
        totalTipsReceived[_to] += msg.value;
        userSentTips[msg.sender].push(tipId);
        userReceivedTips[_to].push(tipId);

        // Transfer funds
        payable(_to).transfer(netAmount);
        if (fee > 0) {
            payable(feeRecipient).transfer(fee);
        }

        emit TipSent(tipId, msg.sender, _to, msg.value, address(0), _message);
    }

    // Send a tip in ERC20 tokens
    function tipToken(
        address _to,
        address _token,
        uint256 _amount,
        string memory _message
    ) external nonReentrant {
        require(_amount > 0, "Tip amount must be greater than 0");
        require(_to != address(0), "Invalid recipient");
        require(_to != msg.sender, "Cannot tip yourself");
        require(supportedTokens[_token], "Token not supported");

        IERC20 token = IERC20(_token);
        require(token.balanceOf(msg.sender) >= _amount, "Insufficient balance");

        uint256 fee = (_amount * platformFeePercent) / 10000;
        uint256 netAmount = _amount - fee;

        // Create tip record
        uint256 tipId = nextTipId++;
        tips[tipId] = Tip({
            from: msg.sender,
            to: _to,
            amount: _amount,
            token: _token,
            message: _message,
            timestamp: block.timestamp
        });

        // Update stats
        totalTipsSent[msg.sender] += _amount;
        totalTipsReceived[_to] += _amount;
        userSentTips[msg.sender].push(tipId);
        userReceivedTips[_to].push(tipId);

        // Transfer tokens
        token.safeTransferFrom(msg.sender, _to, netAmount);
        if (fee > 0) {
            token.safeTransferFrom(msg.sender, feeRecipient, fee);
        }

        emit TipSent(tipId, msg.sender, _to, _amount, _token, _message);
    }

    // Batch tip multiple users
    function batchTip(
        address[] memory _recipients,
        uint256[] memory _amounts,
        address _token,
        string memory _message
    ) external payable nonReentrant {
        require(_recipients.length == _amounts.length, "Array length mismatch");
        require(_recipients.length > 0, "No recipients");
        require(_recipients.length <= 100, "Too many recipients");

        if (_token == address(0)) {
            // ETH tips
            uint256 totalAmount = 0;
            for (uint256 i = 0; i < _amounts.length; i++) {
                totalAmount += _amounts[i];
            }
            require(msg.value >= totalAmount, "Insufficient ETH sent");

            for (uint256 i = 0; i < _recipients.length; i++) {
                _processSingleTip(_recipients[i], _amounts[i], address(0), _message);
            }
        } else {
            // Token tips
            for (uint256 i = 0; i < _recipients.length; i++) {
                _processSingleTipToken(_recipients[i], _amounts[i], _token, _message);
            }
        }
    }

    // Internal function for single tip processing
    function _processSingleTip(
        address _to,
        uint256 _amount,
        address _token,
        string memory _message
    ) internal {
        require(_to != address(0) && _to != msg.sender, "Invalid recipient");

        uint256 fee = (_amount * platformFeePercent) / 10000;
        uint256 netAmount = _amount - fee;

        uint256 tipId = nextTipId++;
        tips[tipId] = Tip({
            from: msg.sender,
            to: _to,
            amount: _amount,
            token: _token,
            message: _message,
            timestamp: block.timestamp
        });

        totalTipsSent[msg.sender] += _amount;
        totalTipsReceived[_to] += _amount;
        userSentTips[msg.sender].push(tipId);
        userReceivedTips[_to].push(tipId);

        payable(_to).transfer(netAmount);
        if (fee > 0) {
            payable(feeRecipient).transfer(fee);
        }

        emit TipSent(tipId, msg.sender, _to, _amount, _token, _message);
    }

    function _processSingleTipToken(
        address _to,
        uint256 _amount,
        address _token,
        string memory _message
    ) internal {
        require(_to != address(0) && _to != msg.sender, "Invalid recipient");
        require(supportedTokens[_token], "Token not supported");

        IERC20 token = IERC20(_token);
        uint256 fee = (_amount * platformFeePercent) / 10000;
        uint256 netAmount = _amount - fee;

        uint256 tipId = nextTipId++;
        tips[tipId] = Tip({
            from: msg.sender,
            to: _to,
            amount: _amount,
            token: _token,
            message: _message,
            timestamp: block.timestamp
        });

        totalTipsSent[msg.sender] += _amount;
        totalTipsReceived[_to] += _amount;
        userSentTips[msg.sender].push(tipId);
        userReceivedTips[_to].push(tipId);

        token.safeTransferFrom(msg.sender, _to, netAmount);
        if (fee > 0) {
            token.safeTransferFrom(msg.sender, feeRecipient, fee);
        }

        emit TipSent(tipId, msg.sender, _to, _amount, _token, _message);
    }

    // Get tips received by user
    function getReceivedTips(address _user) external view returns (uint256[] memory) {
        return userReceivedTips[_user];
    }

    // Get tips sent by user
    function getSentTips(address _user) external view returns (uint256[] memory) {
        return userSentTips[_user];
    }

    // Admin functions
    function updateFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 1000, "Fee too high"); // Max 10%
        platformFeePercent = _newFee;
        emit FeeUpdated(_newFee);
    }

    function setTokenSupport(address _token, bool _supported) external onlyOwner {
        supportedTokens[_token] = _supported;
        emit TokenSupportUpdated(_token, _supported);
    }

    function updateFeeRecipient(address _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "Invalid recipient");
        feeRecipient = _newRecipient;
    }

    // Emergency withdraw
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function emergencyWithdrawToken(address _token) external onlyOwner {
        IERC20 token = IERC20(_token);
        token.safeTransfer(owner(), token.balanceOf(address(this)));
    }
}
