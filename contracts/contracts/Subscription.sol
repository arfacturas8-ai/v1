// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Subscription
 * @dev Crypto subscription management for CRYB Platform
 */
contract Subscription is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    struct Plan {
        string name;
        string description;
        uint256 price;
        uint256 duration; // in seconds
        address paymentToken; // address(0) for ETH
        bool isActive;
        uint256 subscriberCount;
        address creator;
    }

    struct SubscriptionInfo {
        uint256 planId;
        address subscriber;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool autoRenew;
    }

    // Storage
    uint256 public nextPlanId;
    uint256 public nextSubscriptionId;
    uint256 public platformFeePercent = 250; // 2.5%
    address public feeRecipient;

    mapping(uint256 => Plan) public plans;
    mapping(uint256 => SubscriptionInfo) public subscriptions;
    mapping(address => mapping(uint256 => uint256)) public userPlanSubscription; // user => planId => subscriptionId
    mapping(address => uint256[]) public userSubscriptions; // user => subscription IDs
    mapping(uint256 => uint256[]) public planSubscriptions; // planId => subscription IDs

    // Events
    event PlanCreated(
        uint256 indexed planId,
        address indexed creator,
        string name,
        uint256 price,
        uint256 duration
    );
    event Subscribed(
        uint256 indexed subscriptionId,
        uint256 indexed planId,
        address indexed subscriber,
        uint256 endTime
    );
    event SubscriptionRenewed(
        uint256 indexed subscriptionId,
        uint256 newEndTime
    );
    event SubscriptionCancelled(
        uint256 indexed subscriptionId,
        address indexed subscriber
    );
    event PlanUpdated(uint256 indexed planId);

    constructor(address _feeRecipient) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
    }

    // Create a subscription plan
    function createPlan(
        string memory _name,
        string memory _description,
        uint256 _price,
        uint256 _duration,
        address _paymentToken
    ) external returns (uint256) {
        require(_price > 0, "Price must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");
        require(_duration >= 1 days, "Duration too short");

        uint256 planId = nextPlanId++;

        plans[planId] = Plan({
            name: _name,
            description: _description,
            price: _price,
            duration: _duration,
            paymentToken: _paymentToken,
            isActive: true,
            subscriberCount: 0,
            creator: msg.sender
        });

        emit PlanCreated(planId, msg.sender, _name, _price, _duration);
        return planId;
    }

    // Subscribe to a plan with ETH
    function subscribeETH(uint256 _planId, bool _autoRenew) external payable nonReentrant {
        Plan storage plan = plans[_planId];
        require(plan.isActive, "Plan not active");
        require(plan.paymentToken == address(0), "Plan requires token payment");
        require(msg.value >= plan.price, "Insufficient payment");

        _createSubscription(_planId, msg.sender, _autoRenew);

        // Calculate and transfer fees
        uint256 fee = (plan.price * platformFeePercent) / 10000;
        uint256 creatorAmount = plan.price - fee;

        payable(plan.creator).transfer(creatorAmount);
        if (fee > 0) {
            payable(feeRecipient).transfer(fee);
        }

        // Refund excess
        if (msg.value > plan.price) {
            payable(msg.sender).transfer(msg.value - plan.price);
        }
    }

    // Subscribe to a plan with tokens
    function subscribeToken(uint256 _planId, bool _autoRenew) external nonReentrant {
        Plan storage plan = plans[_planId];
        require(plan.isActive, "Plan not active");
        require(plan.paymentToken != address(0), "Plan requires ETH payment");

        IERC20 token = IERC20(plan.paymentToken);
        require(token.balanceOf(msg.sender) >= plan.price, "Insufficient balance");

        _createSubscription(_planId, msg.sender, _autoRenew);

        // Calculate and transfer fees
        uint256 fee = (plan.price * platformFeePercent) / 10000;
        uint256 creatorAmount = plan.price - fee;

        token.safeTransferFrom(msg.sender, plan.creator, creatorAmount);
        if (fee > 0) {
            token.safeTransferFrom(msg.sender, feeRecipient, fee);
        }
    }

    // Internal function to create subscription
    function _createSubscription(
        uint256 _planId,
        address _subscriber,
        bool _autoRenew
    ) internal {
        Plan storage plan = plans[_planId];

        // Check if user already has active subscription
        uint256 existingSubId = userPlanSubscription[_subscriber][_planId];
        if (existingSubId != 0 && subscriptions[existingSubId].isActive) {
            // Extend existing subscription
            SubscriptionInfo storage existingSub = subscriptions[existingSubId];
            uint256 extensionStart = existingSub.endTime > block.timestamp
                ? existingSub.endTime
                : block.timestamp;
            existingSub.endTime = extensionStart + plan.duration;
            existingSub.autoRenew = _autoRenew;

            emit SubscriptionRenewed(existingSubId, existingSub.endTime);
        } else {
            // Create new subscription
            uint256 subscriptionId = nextSubscriptionId++;
            uint256 endTime = block.timestamp + plan.duration;

            subscriptions[subscriptionId] = SubscriptionInfo({
                planId: _planId,
                subscriber: _subscriber,
                startTime: block.timestamp,
                endTime: endTime,
                isActive: true,
                autoRenew: _autoRenew
            });

            userPlanSubscription[_subscriber][_planId] = subscriptionId;
            userSubscriptions[_subscriber].push(subscriptionId);
            planSubscriptions[_planId].push(subscriptionId);
            plan.subscriberCount++;

            emit Subscribed(subscriptionId, _planId, _subscriber, endTime);
        }
    }

    // Renew subscription
    function renewSubscription(uint256 _subscriptionId) external payable nonReentrant {
        SubscriptionInfo storage sub = subscriptions[_subscriptionId];
        require(sub.subscriber == msg.sender, "Not subscriber");
        require(sub.isActive, "Subscription not active");

        Plan storage plan = plans[sub.planId];
        require(plan.isActive, "Plan not active");

        if (plan.paymentToken == address(0)) {
            // ETH payment
            require(msg.value >= plan.price, "Insufficient payment");

            uint256 fee = (plan.price * platformFeePercent) / 10000;
            uint256 creatorAmount = plan.price - fee;

            payable(plan.creator).transfer(creatorAmount);
            if (fee > 0) {
                payable(feeRecipient).transfer(fee);
            }

            if (msg.value > plan.price) {
                payable(msg.sender).transfer(msg.value - plan.price);
            }
        } else {
            // Token payment
            IERC20 token = IERC20(plan.paymentToken);
            require(token.balanceOf(msg.sender) >= plan.price, "Insufficient balance");

            uint256 fee = (plan.price * platformFeePercent) / 10000;
            uint256 creatorAmount = plan.price - fee;

            token.safeTransferFrom(msg.sender, plan.creator, creatorAmount);
            if (fee > 0) {
                token.safeTransferFrom(msg.sender, feeRecipient, fee);
            }
        }

        // Extend subscription
        uint256 extensionStart = sub.endTime > block.timestamp ? sub.endTime : block.timestamp;
        sub.endTime = extensionStart + plan.duration;

        emit SubscriptionRenewed(_subscriptionId, sub.endTime);
    }

    // Cancel subscription
    function cancelSubscription(uint256 _subscriptionId) external {
        SubscriptionInfo storage sub = subscriptions[_subscriptionId];
        require(sub.subscriber == msg.sender, "Not subscriber");
        require(sub.isActive, "Subscription not active");

        sub.autoRenew = false;
        // Note: subscription remains active until endTime

        emit SubscriptionCancelled(_subscriptionId, msg.sender);
    }

    // Check if subscription is active
    function isSubscriptionActive(uint256 _subscriptionId) public view returns (bool) {
        SubscriptionInfo storage sub = subscriptions[_subscriptionId];
        return sub.isActive && block.timestamp <= sub.endTime;
    }

    // Check if user has active subscription to plan
    function hasActiveSubscription(address _user, uint256 _planId) public view returns (bool) {
        uint256 subId = userPlanSubscription[_user][_planId];
        if (subId == 0) return false;
        return isSubscriptionActive(subId);
    }

    // Get user subscriptions
    function getUserSubscriptions(address _user) external view returns (uint256[] memory) {
        return userSubscriptions[_user];
    }

    // Get plan subscriptions
    function getPlanSubscriptions(uint256 _planId) external view returns (uint256[] memory) {
        return planSubscriptions[_planId];
    }

    // Update plan (only creator)
    function updatePlan(
        uint256 _planId,
        string memory _name,
        string memory _description,
        uint256 _price,
        bool _isActive
    ) external {
        Plan storage plan = plans[_planId];
        require(plan.creator == msg.sender, "Not plan creator");
        require(_price > 0, "Invalid price");

        plan.name = _name;
        plan.description = _description;
        plan.price = _price;
        plan.isActive = _isActive;

        emit PlanUpdated(_planId);
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

    // Deactivate expired subscriptions (can be called by anyone)
    function deactivateExpiredSubscription(uint256 _subscriptionId) external {
        SubscriptionInfo storage sub = subscriptions[_subscriptionId];
        require(sub.isActive, "Already inactive");
        require(block.timestamp > sub.endTime, "Not expired");

        sub.isActive = false;
    }
}
