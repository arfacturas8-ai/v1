// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title CRYB Automated Market Maker (AMM)
 * @dev Advanced AMM with multiple curve types and dynamic fees
 * 
 * Features:
 * - Constant product (x*y=k) formula
 * - Dynamic trading fees based on volatility
 * - Liquidity mining rewards
 * - Flash loan functionality
 * - Multiple pool types (stable, volatile)
 * - Price impact protection
 * - MEV protection mechanisms
 */
contract CRYBAMM is ERC20, ReentrancyGuard, Pausable, Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // ============ Constants ============
    
    uint256 public constant MINIMUM_LIQUIDITY = 10**3;
    uint256 public constant MAX_FEE = 3000; // 3% max fee
    uint256 public constant FEE_DENOMINATOR = 100000;
    uint256 public constant PRICE_PRECISION = 1e18;

    // ============ Pool Configuration ============
    
    IERC20 public immutable token0;
    IERC20 public immutable token1;
    
    uint112 private reserve0;
    uint112 private reserve1;
    uint32 private blockTimestampLast;
    
    uint256 public price0CumulativeLast;
    uint256 public price1CumulativeLast;
    uint256 public kLast; // reserve0 * reserve1, as of immediately after the most recent liquidity event
    
    // Fee configuration
    uint256 public swapFee = 300; // 0.3% default
    uint256 public protocolFee = 0; // 0% initially
    address public feeTo;
    address public feeToSetter;
    
    // Pool type and curve parameters
    enum PoolType { CONSTANT_PRODUCT, STABLE_SWAP, WEIGHTED }
    PoolType public poolType;
    uint256 public amplificationParameter = 0; // For stable swap pools
    uint256 public weight0 = 50; // For weighted pools (out of 100)
    uint256 public weight1 = 50;
    
    // Dynamic fee parameters
    bool public dynamicFeeEnabled = false;
    uint256 public baseFee = 300; // 0.3%
    uint256 public maxDynamicFee = 1000; // 1%
    uint256 public volatilityThreshold = 500; // 0.5%
    
    // MEV protection
    uint256 public maxPriceImpact = 1000; // 1% max price impact per transaction
    mapping(address => uint256) public lastTradeBlock;
    uint256 public minTimeBetweenTrades = 0; // Blocks between trades for same address
    
    // Flash loan configuration
    uint256 public flashLoanFee = 9; // 0.009% flash loan fee
    bool public flashLoansEnabled = true;
    
    // Liquidity mining
    IERC20 public rewardToken;
    uint256 public rewardRate = 0; // Rewards per block
    uint256 public lastRewardBlock;
    uint256 public accRewardPerShare;
    mapping(address => uint256) public userRewardDebt;
    mapping(address => uint256) public pendingRewards;

    // ============ Events ============
    
    event Mint(address indexed sender, uint256 amount0, uint256 amount1);
    event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to);
    event Swap(
        address indexed sender,
        uint256 amount0In,
        uint256 amount1In,
        uint256 amount0Out,
        uint256 amount1Out,
        address indexed to
    );
    event Sync(uint112 reserve0, uint112 reserve1);
    event FlashLoan(address indexed borrower, uint256 amount0, uint256 amount1, uint256 fee0, uint256 fee1);
    event RewardPaid(address indexed user, uint256 reward);
    event FeeUpdated(uint256 newFee);
    event DynamicFeeToggled(bool enabled);

    // ============ Constructor ============
    
    constructor(
        address _token0,
        address _token1,
        string memory _name,
        string memory _symbol,
        PoolType _poolType,
        uint256 _amplificationParameter
    ) ERC20(_name, _symbol) {
        require(_token0 != _token1, "Identical tokens");
        require(_token0 != address(0) && _token1 != address(0), "Zero address");
        
        (address tokenA, address tokenB) = _token0 < _token1 ? (_token0, _token1) : (_token1, _token0);
        token0 = IERC20(tokenA);
        token1 = IERC20(tokenB);
        
        poolType = _poolType;
        amplificationParameter = _amplificationParameter;
        feeToSetter = msg.sender;
    }

    // ============ View Functions ============
    
    /**
     * @dev Get current reserves
     */
    function getReserves() public view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast) {
        _reserve0 = reserve0;
        _reserve1 = reserve1;
        _blockTimestampLast = blockTimestampLast;
    }

    /**
     * @dev Get current price
     */
    function getPrice() public view returns (uint256 price0, uint256 price1) {
        (uint112 _reserve0, uint112 _reserve1,) = getReserves();
        if (_reserve0 == 0 || _reserve1 == 0) {
            return (0, 0);
        }
        
        price0 = uint256(_reserve1).mul(PRICE_PRECISION).div(_reserve0);
        price1 = uint256(_reserve0).mul(PRICE_PRECISION).div(_reserve1);
    }

    /**
     * @dev Calculate output amount for given input
     */
    function getAmountOut(uint256 amountIn, address tokenIn) public view returns (uint256 amountOut, uint256 fee) {
        require(amountIn > 0, "Insufficient input amount");
        require(tokenIn == address(token0) || tokenIn == address(token1), "Invalid token");
        
        (uint112 _reserve0, uint112 _reserve1,) = getReserves();
        require(_reserve0 > 0 && _reserve1 > 0, "Insufficient liquidity");
        
        bool isToken0 = tokenIn == address(token0);
        uint256 reserveIn = isToken0 ? _reserve0 : _reserve1;
        uint256 reserveOut = isToken0 ? _reserve1 : _reserve0;
        
        fee = _calculateSwapFee(amountIn, reserveIn, reserveOut);
        uint256 amountInWithFee = amountIn.sub(fee);
        
        if (poolType == PoolType.CONSTANT_PRODUCT) {
            amountOut = _getAmountOutConstantProduct(amountInWithFee, reserveIn, reserveOut);
        } else if (poolType == PoolType.STABLE_SWAP) {
            amountOut = _getAmountOutStableSwap(amountInWithFee, reserveIn, reserveOut);
        } else if (poolType == PoolType.WEIGHTED) {
            uint256 weightIn = isToken0 ? weight0 : weight1;
            uint256 weightOut = isToken0 ? weight1 : weight0;
            amountOut = _getAmountOutWeighted(amountInWithFee, reserveIn, reserveOut, weightIn, weightOut);
        }
        
        // Check price impact
        uint256 priceImpact = _calculatePriceImpact(amountIn, amountOut, reserveIn, reserveOut);
        require(priceImpact <= maxPriceImpact, "Price impact too high");
    }

    // ============ Liquidity Functions ============
    
    /**
     * @dev Add liquidity to the pool
     * @param amount0Desired Desired amount of token0
     * @param amount1Desired Desired amount of token1
     * @param amount0Min Minimum amount of token0
     * @param amount1Min Minimum amount of token1
     * @param to Address to receive LP tokens
     * @param deadline Transaction deadline
     */
    function addLiquidity(
        uint256 amount0Desired,
        uint256 amount1Desired,
        uint256 amount0Min,
        uint256 amount1Min,
        address to,
        uint256 deadline
    ) external nonReentrant whenNotPaused returns (uint256 amount0, uint256 amount1, uint256 liquidity) {
        require(deadline >= block.timestamp, "Expired");
        require(to != address(0), "Invalid recipient");
        
        (amount0, amount1) = _calculateOptimalAmounts(amount0Desired, amount1Desired, amount0Min, amount1Min);
        
        // Transfer tokens to pool
        token0.safeTransferFrom(msg.sender, address(this), amount0);
        token1.safeTransferFrom(msg.sender, address(this), amount1);
        
        liquidity = _mint(to);
        
        // Update liquidity mining rewards
        _updateRewards(to);
    }

    /**
     * @dev Remove liquidity from the pool
     * @param liquidity Amount of LP tokens to burn
     * @param amount0Min Minimum amount of token0 to receive
     * @param amount1Min Minimum amount of token1 to receive
     * @param to Address to receive tokens
     * @param deadline Transaction deadline
     */
    function removeLiquidity(
        uint256 liquidity,
        uint256 amount0Min,
        uint256 amount1Min,
        address to,
        uint256 deadline
    ) external nonReentrant returns (uint256 amount0, uint256 amount1) {
        require(deadline >= block.timestamp, "Expired");
        require(to != address(0), "Invalid recipient");
        
        // Update liquidity mining rewards
        _updateRewards(msg.sender);
        
        // Transfer LP tokens to this contract
        _transfer(msg.sender, address(this), liquidity);
        
        (amount0, amount1) = _burn(to);
        require(amount0 >= amount0Min && amount1 >= amount1Min, "Insufficient output");
    }

    // ============ Trading Functions ============
    
    /**
     * @dev Swap exact tokens for tokens
     * @param amountIn Exact input amount
     * @param amountOutMin Minimum output amount
     * @param tokenIn Input token address
     * @param to Recipient address
     * @param deadline Transaction deadline
     */
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address tokenIn,
        address to,
        uint256 deadline
    ) external nonReentrant whenNotPaused returns (uint256 amountOut) {
        require(deadline >= block.timestamp, "Expired");
        require(to != address(0), "Invalid recipient");
        require(_canTrade(msg.sender), "Trade too frequent");
        
        bool isToken0 = tokenIn == address(token0);
        IERC20 inputToken = isToken0 ? token0 : token1;
        IERC20 outputToken = isToken0 ? token1 : token0;
        
        // Calculate output amount and fees
        uint256 fee;
        (amountOut, fee) = getAmountOut(amountIn, tokenIn);
        require(amountOut >= amountOutMin, "Insufficient output amount");
        
        // Transfer input tokens
        inputToken.safeTransferFrom(msg.sender, address(this), amountIn);
        
        // Perform swap
        if (isToken0) {
            _swap(0, amountOut, to);
        } else {
            _swap(amountOut, 0, to);
        }
        
        // Update last trade block for MEV protection
        lastTradeBlock[msg.sender] = block.number;
    }

    /**
     * @dev Swap tokens for exact tokens
     * @param amountOut Exact output amount
     * @param amountInMax Maximum input amount
     * @param tokenIn Input token address
     * @param to Recipient address
     * @param deadline Transaction deadline
     */
    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address tokenIn,
        address to,
        uint256 deadline
    ) external nonReentrant whenNotPaused returns (uint256 amountIn) {
        require(deadline >= block.timestamp, "Expired");
        require(to != address(0), "Invalid recipient");
        require(_canTrade(msg.sender), "Trade too frequent");
        
        bool isToken0 = tokenIn == address(token0);
        IERC20 inputToken = isToken0 ? token0 : token1;
        
        amountIn = getAmountIn(amountOut, tokenIn);
        require(amountIn <= amountInMax, "Excessive input amount");
        
        // Transfer input tokens
        inputToken.safeTransferFrom(msg.sender, address(this), amountIn);
        
        // Perform swap
        if (isToken0) {
            _swap(0, amountOut, to);
        } else {
            _swap(amountOut, 0, to);
        }
        
        lastTradeBlock[msg.sender] = block.number;
    }

    // ============ Flash Loan Functions ============
    
    /**
     * @dev Execute flash loan
     * @param amount0 Amount of token0 to borrow
     * @param amount1 Amount of token1 to borrow
     * @param recipient Recipient of flash loan
     * @param data Callback data
     */
    function flashLoan(
        uint256 amount0,
        uint256 amount1,
        address recipient,
        bytes calldata data
    ) external nonReentrant whenNotPaused {
        require(flashLoansEnabled, "Flash loans disabled");
        require(amount0 > 0 || amount1 > 0, "Invalid amounts");
        require(recipient != address(0), "Invalid recipient");
        
        (uint112 _reserve0, uint112 _reserve1,) = getReserves();
        require(amount0 <= _reserve0 && amount1 <= _reserve1, "Insufficient liquidity");
        
        uint256 balance0Before = token0.balanceOf(address(this));
        uint256 balance1Before = token1.balanceOf(address(this));
        
        // Calculate fees
        uint256 fee0 = amount0.mul(flashLoanFee).div(FEE_DENOMINATOR);
        uint256 fee1 = amount1.mul(flashLoanFee).div(FEE_DENOMINATOR);
        
        // Transfer borrowed amounts
        if (amount0 > 0) token0.safeTransfer(recipient, amount0);
        if (amount1 > 0) token1.safeTransfer(recipient, amount1);
        
        // Callback to borrower
        IFlashLoanReceiver(recipient).receiveFlashLoan(amount0, amount1, fee0, fee1, data);
        
        // Check repayment
        uint256 balance0After = token0.balanceOf(address(this));
        uint256 balance1After = token1.balanceOf(address(this));
        
        require(balance0After >= balance0Before.add(fee0), "Flash loan not repaid");
        require(balance1After >= balance1Before.add(fee1), "Flash loan not repaid");
        
        // Update reserves
        _update(balance0After, balance1After, _reserve0, _reserve1);
        
        emit FlashLoan(recipient, amount0, amount1, fee0, fee1);
    }

    // ============ Internal Functions ============
    
    /**
     * @dev Mint LP tokens
     */
    function _mint(address to) internal returns (uint256 liquidity) {
        (uint112 _reserve0, uint112 _reserve1,) = getReserves();
        uint256 balance0 = token0.balanceOf(address(this));
        uint256 balance1 = token1.balanceOf(address(this));
        uint256 amount0 = balance0.sub(_reserve0);
        uint256 amount1 = balance1.sub(_reserve1);
        
        bool feeOn = _mintFee(_reserve0, _reserve1);
        uint256 _totalSupply = totalSupply();
        
        if (_totalSupply == 0) {
            liquidity = Math.sqrt(amount0.mul(amount1)).sub(MINIMUM_LIQUIDITY);
            _mint(address(0), MINIMUM_LIQUIDITY); // permanently lock the first MINIMUM_LIQUIDITY tokens
        } else {
            liquidity = Math.min(amount0.mul(_totalSupply) / _reserve0, amount1.mul(_totalSupply) / _reserve1);
        }
        
        require(liquidity > 0, "Insufficient liquidity minted");
        _mint(to, liquidity);
        
        _update(balance0, balance1, _reserve0, _reserve1);
        if (feeOn) kLast = uint256(reserve0).mul(reserve1);
        
        emit Mint(msg.sender, amount0, amount1);
    }

    /**
     * @dev Burn LP tokens
     */
    function _burn(address to) internal returns (uint256 amount0, uint256 amount1) {
        (uint112 _reserve0, uint112 _reserve1,) = getReserves();
        address _token0 = address(token0);
        address _token1 = address(token1);
        uint256 balance0 = IERC20(_token0).balanceOf(address(this));
        uint256 balance1 = IERC20(_token1).balanceOf(address(this));
        uint256 liquidity = balanceOf(address(this));
        
        bool feeOn = _mintFee(_reserve0, _reserve1);
        uint256 _totalSupply = totalSupply();
        
        amount0 = liquidity.mul(balance0) / _totalSupply;
        amount1 = liquidity.mul(balance1) / _totalSupply;
        require(amount0 > 0 && amount1 > 0, "Insufficient liquidity burned");
        
        _burn(address(this), liquidity);
        IERC20(_token0).safeTransfer(to, amount0);
        IERC20(_token1).safeTransfer(to, amount1);
        
        balance0 = IERC20(_token0).balanceOf(address(this));
        balance1 = IERC20(_token1).balanceOf(address(this));
        
        _update(balance0, balance1, _reserve0, _reserve1);
        if (feeOn) kLast = uint256(reserve0).mul(reserve1);
        
        emit Burn(msg.sender, amount0, amount1, to);
    }

    /**
     * @dev Execute swap
     */
    function _swap(uint256 amount0Out, uint256 amount1Out, address to) internal {
        require(amount0Out > 0 || amount1Out > 0, "Insufficient output amount");
        (uint112 _reserve0, uint112 _reserve1,) = getReserves();
        require(amount0Out < _reserve0 && amount1Out < _reserve1, "Insufficient liquidity");
        
        uint256 balance0;
        uint256 balance1;
        {
            address _token0 = address(token0);
            address _token1 = address(token1);
            require(to != _token0 && to != _token1, "Invalid to");
            
            if (amount0Out > 0) IERC20(_token0).safeTransfer(to, amount0Out);
            if (amount1Out > 0) IERC20(_token1).safeTransfer(to, amount1Out);
            
            balance0 = IERC20(_token0).balanceOf(address(this));
            balance1 = IERC20(_token1).balanceOf(address(this));
        }
        
        uint256 amount0In = balance0 > _reserve0 - amount0Out ? balance0 - (_reserve0 - amount0Out) : 0;
        uint256 amount1In = balance1 > _reserve1 - amount1Out ? balance1 - (_reserve1 - amount1Out) : 0;
        require(amount0In > 0 || amount1In > 0, "Insufficient input amount");
        
        // Verify constant product formula (with fees)
        {
            uint256 currentFee = _getCurrentSwapFee();
            uint256 balance0Adjusted = balance0.mul(FEE_DENOMINATOR).sub(amount0In.mul(currentFee));
            uint256 balance1Adjusted = balance1.mul(FEE_DENOMINATOR).sub(amount1In.mul(currentFee));
            require(
                balance0Adjusted.mul(balance1Adjusted) >= uint256(_reserve0).mul(_reserve1).mul(FEE_DENOMINATOR**2),
                "K"
            );
        }
        
        _update(balance0, balance1, _reserve0, _reserve1);
        emit Swap(msg.sender, amount0In, amount1In, amount0Out, amount1Out, to);
    }

    /**
     * @dev Update reserves and price accumulators
     */
    function _update(uint256 balance0, uint256 balance1, uint112 _reserve0, uint112 _reserve1) private {
        require(balance0 <= type(uint112).max && balance1 <= type(uint112).max, "Overflow");
        uint32 blockTimestamp = uint32(block.timestamp % 2**32);
        uint32 timeElapsed = blockTimestamp - blockTimestampLast;
        
        if (timeElapsed > 0 && _reserve0 != 0 && _reserve1 != 0) {
            price0CumulativeLast += uint256(UQ112x112.encode(_reserve1).uqdiv(_reserve0)) * timeElapsed;
            price1CumulativeLast += uint256(UQ112x112.encode(_reserve0).uqdiv(_reserve1)) * timeElapsed;
        }
        
        reserve0 = uint112(balance0);
        reserve1 = uint112(balance1);
        blockTimestampLast = blockTimestamp;
        emit Sync(reserve0, reserve1);
    }

    // ============ Fee Calculation ============
    
    /**
     * @dev Calculate swap fee (can be dynamic)
     */
    function _calculateSwapFee(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) internal view returns (uint256) {
        if (!dynamicFeeEnabled) {
            return amountIn.mul(swapFee).div(FEE_DENOMINATOR);
        }
        
        // Calculate volatility-based dynamic fee
        uint256 priceImpact = _calculatePriceImpact(amountIn, 0, reserveIn, reserveOut);
        uint256 dynamicFee = baseFee;
        
        if (priceImpact > volatilityThreshold) {
            uint256 feeIncrease = priceImpact.sub(volatilityThreshold).mul(maxDynamicFee.sub(baseFee)).div(volatilityThreshold);
            dynamicFee = baseFee.add(feeIncrease);
            if (dynamicFee > maxDynamicFee) {
                dynamicFee = maxDynamicFee;
            }
        }
        
        return amountIn.mul(dynamicFee).div(FEE_DENOMINATOR);
    }

    /**
     * @dev Get current swap fee
     */
    function _getCurrentSwapFee() internal view returns (uint256) {
        return dynamicFeeEnabled ? baseFee : swapFee;
    }

    /**
     * @dev Calculate price impact
     */
    function _calculatePriceImpact(uint256 amountIn, uint256 amountOut, uint256 reserveIn, uint256 reserveOut) internal pure returns (uint256) {
        if (reserveIn == 0 || reserveOut == 0) return 0;
        
        uint256 priceBefore = reserveOut.mul(PRICE_PRECISION).div(reserveIn);
        uint256 newReserveIn = reserveIn.add(amountIn);
        uint256 newReserveOut = amountOut > 0 ? reserveOut.sub(amountOut) : reserveOut.mul(reserveIn).div(newReserveIn);
        
        if (newReserveIn == 0 || newReserveOut == 0) return type(uint256).max;
        
        uint256 priceAfter = newReserveOut.mul(PRICE_PRECISION).div(newReserveIn);
        
        if (priceAfter >= priceBefore) return 0;
        return priceBefore.sub(priceAfter).mul(10000).div(priceBefore);
    }

    /**
     * @dev Check if address can trade (MEV protection)
     */
    function _canTrade(address trader) internal view returns (bool) {
        return block.number >= lastTradeBlock[trader].add(minTimeBetweenTrades);
    }

    // ============ Curve-Specific Functions ============
    
    /**
     * @dev Get amount out for constant product curve
     */
    function _getAmountOutConstantProduct(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) internal pure returns (uint256) {
        uint256 numerator = amountIn.mul(reserveOut);
        uint256 denominator = reserveIn.add(amountIn);
        return numerator / denominator;
    }

    /**
     * @dev Get amount out for stable swap curve
     */
    function _getAmountOutStableSwap(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) internal view returns (uint256) {
        // Simplified stable swap calculation
        // In production, this would use the full StableSwap math
        uint256 A = amplificationParameter;
        uint256 sum = reserveIn.add(reserveOut);
        uint256 product = reserveIn.mul(reserveOut);
        
        uint256 c = product.mul(4).div(sum.mul(A));
        uint256 d = sum.add(c);
        
        uint256 newReserveIn = reserveIn.add(amountIn);
        uint256 newSum = newReserveIn.add(reserveOut);
        uint256 newProduct = newReserveIn.mul(reserveOut);
        uint256 newC = newProduct.mul(4).div(newSum.mul(A));
        uint256 newD = newSum.add(newC);
        
        return d > newD ? d.sub(newD) : 0;
    }

    /**
     * @dev Get amount out for weighted curve
     */
    function _getAmountOutWeighted(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut,
        uint256 weightIn,
        uint256 weightOut
    ) internal pure returns (uint256) {
        // Balancer-style weighted math
        uint256 newReserveIn = reserveIn.add(amountIn);
        uint256 ratio = reserveIn.mul(PRICE_PRECISION).div(newReserveIn);
        uint256 weightRatio = weightOut.mul(PRICE_PRECISION).div(weightIn);
        uint256 power = _pow(ratio, weightRatio);
        uint256 newReserveOut = reserveOut.mul(power).div(PRICE_PRECISION);
        
        return reserveOut > newReserveOut ? reserveOut.sub(newReserveOut) : 0;
    }

    /**
     * @dev Simple power function (for weighted pools)
     */
    function _pow(uint256 base, uint256 exponent) internal pure returns (uint256) {
        // Simplified power calculation - in production would use proper math library
        if (exponent == 0) return PRICE_PRECISION;
        if (base == 0) return 0;
        
        uint256 result = PRICE_PRECISION;
        uint256 baseTemp = base;
        uint256 expTemp = exponent;
        
        while (expTemp > 0) {
            if (expTemp % 2 == 1) {
                result = result.mul(baseTemp).div(PRICE_PRECISION);
            }
            baseTemp = baseTemp.mul(baseTemp).div(PRICE_PRECISION);
            expTemp /= 2;
        }
        
        return result;
    }

    // ============ Liquidity Mining ============
    
    /**
     * @dev Update liquidity mining rewards
     */
    function _updateRewards(address user) internal {
        if (address(rewardToken) == address(0) || rewardRate == 0) return;
        
        uint256 lpBalance = balanceOf(user);
        uint256 totalLpSupply = totalSupply();
        
        if (totalLpSupply == 0) return;
        
        uint256 blocksSinceLastReward = block.number.sub(lastRewardBlock);
        uint256 totalRewards = blocksSinceLastReward.mul(rewardRate);
        accRewardPerShare = accRewardPerShare.add(totalRewards.mul(PRICE_PRECISION).div(totalLpSupply));
        
        uint256 userReward = lpBalance.mul(accRewardPerShare).div(PRICE_PRECISION).sub(userRewardDebt[user]);
        if (userReward > 0) {
            pendingRewards[user] = pendingRewards[user].add(userReward);
        }
        
        userRewardDebt[user] = lpBalance.mul(accRewardPerShare).div(PRICE_PRECISION);
        lastRewardBlock = block.number;
    }

    /**
     * @dev Claim liquidity mining rewards
     */
    function claimRewards() external nonReentrant {
        _updateRewards(msg.sender);
        
        uint256 reward = pendingRewards[msg.sender];
        if (reward > 0) {
            pendingRewards[msg.sender] = 0;
            rewardToken.safeTransfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    // ============ Admin Functions ============
    
    /**
     * @dev Set swap fee
     */
    function setSwapFee(uint256 _swapFee) external {
        require(msg.sender == feeToSetter, "Forbidden");
        require(_swapFee <= MAX_FEE, "Fee too high");
        swapFee = _swapFee;
        emit FeeUpdated(_swapFee);
    }

    /**
     * @dev Toggle dynamic fees
     */
    function setDynamicFee(bool _enabled, uint256 _baseFee, uint256 _maxFee, uint256 _threshold) external {
        require(msg.sender == feeToSetter, "Forbidden");
        require(_baseFee <= _maxFee && _maxFee <= MAX_FEE, "Invalid fee config");
        
        dynamicFeeEnabled = _enabled;
        baseFee = _baseFee;
        maxDynamicFee = _maxFee;
        volatilityThreshold = _threshold;
        
        emit DynamicFeeToggled(_enabled);
    }

    /**
     * @dev Set liquidity mining rewards
     */
    function setLiquidityMining(IERC20 _rewardToken, uint256 _rewardRate) external onlyOwner {
        rewardToken = _rewardToken;
        rewardRate = _rewardRate;
        lastRewardBlock = block.number;
    }

    /**
     * @dev Set MEV protection parameters
     */
    function setMEVProtection(uint256 _maxPriceImpact, uint256 _minTimeBetweenTrades) external onlyOwner {
        require(_maxPriceImpact <= 5000, "Price impact too high"); // Max 5%
        maxPriceImpact = _maxPriceImpact;
        minTimeBetweenTrades = _minTimeBetweenTrades;
    }

    /**
     * @dev Set flash loan parameters
     */
    function setFlashLoanConfig(bool _enabled, uint256 _fee) external onlyOwner {
        require(_fee <= 100, "Fee too high"); // Max 0.1%
        flashLoansEnabled = _enabled;
        flashLoanFee = _fee;
    }

    /**
     * @dev Emergency token withdrawal
     */
    function emergencyWithdraw(IERC20 token, uint256 amount) external onlyOwner {
        token.safeTransfer(owner(), amount);
    }

    // ============ Helper Functions ============
    
    /**
     * @dev Calculate optimal amounts for adding liquidity
     */
    function _calculateOptimalAmounts(
        uint256 amount0Desired,
        uint256 amount1Desired,
        uint256 amount0Min,
        uint256 amount1Min
    ) internal view returns (uint256 amount0, uint256 amount1) {
        (uint112 _reserve0, uint112 _reserve1,) = getReserves();
        
        if (_reserve0 == 0 && _reserve1 == 0) {
            (amount0, amount1) = (amount0Desired, amount1Desired);
        } else {
            uint256 amount1Optimal = amount0Desired.mul(_reserve1) / _reserve0;
            if (amount1Optimal <= amount1Desired) {
                require(amount1Optimal >= amount1Min, "Insufficient amount1");
                (amount0, amount1) = (amount0Desired, amount1Optimal);
            } else {
                uint256 amount0Optimal = amount1Desired.mul(_reserve0) / _reserve1;
                assert(amount0Optimal <= amount0Desired);
                require(amount0Optimal >= amount0Min, "Insufficient amount0");
                (amount0, amount1) = (amount0Optimal, amount1Desired);
            }
        }
    }

    /**
     * @dev Get amount in for exact output
     */
    function getAmountIn(uint256 amountOut, address tokenIn) public view returns (uint256 amountIn) {
        require(amountOut > 0, "Insufficient output amount");
        
        (uint112 _reserve0, uint112 _reserve1,) = getReserves();
        require(_reserve0 > 0 && _reserve1 > 0, "Insufficient liquidity");
        
        bool isToken0 = tokenIn == address(token0);
        uint256 reserveIn = isToken0 ? _reserve0 : _reserve1;
        uint256 reserveOut = isToken0 ? _reserve1 : _reserve0;
        
        uint256 numerator = reserveIn.mul(amountOut).mul(FEE_DENOMINATOR);
        uint256 denominator = reserveOut.sub(amountOut).mul(FEE_DENOMINATOR.sub(_getCurrentSwapFee()));
        amountIn = numerator.div(denominator).add(1);
    }

    /**
     * @dev Mint protocol fee
     */
    function _mintFee(uint112 _reserve0, uint112 _reserve1) private returns (bool feeOn) {
        address _feeTo = feeTo;
        feeOn = _feeTo != address(0);
        uint256 _kLast = kLast;
        
        if (feeOn) {
            if (_kLast != 0) {
                uint256 rootK = Math.sqrt(uint256(_reserve0).mul(_reserve1));
                uint256 rootKLast = Math.sqrt(_kLast);
                if (rootK > rootKLast) {
                    uint256 numerator = totalSupply().mul(rootK.sub(rootKLast));
                    uint256 denominator = rootK.mul(5).add(rootKLast);
                    uint256 liquidity = numerator / denominator;
                    if (liquidity > 0) _mint(_feeTo, liquidity);
                }
            }
        } else if (_kLast != 0) {
            kLast = 0;
        }
    }
}

// ============ Interfaces ============

interface IFlashLoanReceiver {
    function receiveFlashLoan(
        uint256 amount0,
        uint256 amount1,
        uint256 fee0,
        uint256 fee1,
        bytes calldata data
    ) external;
}

// ============ Libraries ============

library UQ112x112 {
    uint224 constant Q112 = 2**112;

    function encode(uint112 y) internal pure returns (uint224 z) {
        z = uint224(y) * Q112;
    }

    function uqdiv(uint224 x, uint112 y) internal pure returns (uint224 z) {
        z = x / uint224(y);
    }
}