// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CRYBToken
 * @dev Simple ERC20 token for CRYB Platform (Testing Version)
 */
contract CRYBToken is ERC20, Ownable {
    uint256 private constant TOTAL_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens

    constructor(
        address teamWallet,
        address investorWallet,
        address liquidityWallet,
        address communityWallet,
        address reserveWallet
    ) ERC20("CRYB", "CRYB") {
        // Distribute tokens
        _mint(teamWallet, (TOTAL_SUPPLY * 20) / 100);      // 20% team
        _mint(investorWallet, (TOTAL_SUPPLY * 15) / 100);   // 15% investors
        _mint(liquidityWallet, (TOTAL_SUPPLY * 25) / 100);  // 25% liquidity
        _mint(communityWallet, (TOTAL_SUPPLY * 30) / 100);  // 30% community
        _mint(reserveWallet, (TOTAL_SUPPLY * 10) / 100);    // 10% reserve
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
