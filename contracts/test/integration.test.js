const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("CRYB Platform Integration Tests", function () {
  // Test fixture to deploy all contracts
  async function deployFixture() {
    const [
      deployer,
      treasury,
      teamWallet,
      investorWallet,
      liquidityWallet,
      communityWallet,
      reserveWallet,
      emergencyAdmin,
      feeRecipient,
      moderatorPool,
      user1,
      user2,
      user3,
    ] = await ethers.getSigners();

    // Deploy CRYB Token
    const CRYBToken = await ethers.getContractFactory("CRYBToken");
    const cribToken = await CRYBToken.deploy(
      teamWallet.address,
      investorWallet.address,
      liquidityWallet.address,
      communityWallet.address,
      reserveWallet.address
    );

    // Deploy Timelock Controller
    const TimelockController = await ethers.getContractFactory("TimelockController");
    const timelock = await TimelockController.deploy(
      24 * 60 * 60, // 24 hours
      [deployer.address],
      [deployer.address],
      deployer.address
    );

    // Deploy Governance
    const CRYBGovernance = await ethers.getContractFactory("CRYBGovernance");
    const governance = await CRYBGovernance.deploy(
      cribToken.address,
      timelock.address,
      treasury.address,
      1, // 1 day voting delay
      7, // 7 days voting period
      ethers.utils.parseEther("1000000"), // 1M CRYB proposal threshold
      400 // 4% quorum
    );

    // Deploy Multi-Sig
    const CRYBMultiSig = await ethers.getContractFactory("CRYBMultiSig");
    const multiSig = await CRYBMultiSig.deploy(
      [deployer.address, treasury.address, emergencyAdmin.address],
      2, // 2 of 3 threshold
      emergencyAdmin.address
    );

    // Deploy Staking
    const CRYBStaking = await ethers.getContractFactory("CRYBStaking");
    const staking = await CRYBStaking.deploy(emergencyAdmin.address);

    // Deploy NFT Collection
    const CRYBNFTCollection = await ethers.getContractFactory("CRYBNFTCollection");
    const nftCollection = await CRYBNFTCollection.deploy(
      "CRYB Genesis",
      "CRYB",
      "https://api.cryb.ai/placeholder.json",
      teamWallet.address,
      treasury.address
    );

    // Deploy Marketplace
    const CRYBMarketplace = await ethers.getContractFactory("CRYBMarketplace");
    const marketplace = await CRYBMarketplace.deploy(
      feeRecipient.address,
      cribToken.address
    );

    // Deploy Yield Farm
    const currentBlock = await ethers.provider.getBlockNumber();
    const CRYBYieldFarm = await ethers.getContractFactory("CRYBYieldFarm");
    const yieldFarm = await CRYBYieldFarm.deploy(
      cribToken.address,
      treasury.address,
      currentBlock + 10,
      currentBlock + 1000
    );

    // Deploy Rewards System
    const CRYBRewards = await ethers.getContractFactory("CRYBRewards");
    const rewards = await CRYBRewards.deploy(
      cribToken.address,
      treasury.address,
      moderatorPool.address
    );

    // Set up initial configurations
    await staking.createPool(
      cribToken.address,
      cribToken.address,
      1000,
      0,
      ethers.utils.parseEther("100"),
      ethers.utils.parseEther("100000"),
      500,
      false
    );

    await yieldFarm.addPool(
      cribToken.address,
      cribToken.address,
      1000,
      0,
      ethers.utils.parseEther("100"),
      ethers.utils.parseEther("100000"),
      500,
      true
    );

    // Transfer some tokens to users for testing
    await cribToken.connect(communityWallet).transfer(user1.address, ethers.utils.parseEther("10000"));
    await cribToken.connect(communityWallet).transfer(user2.address, ethers.utils.parseEther("10000"));
    await cribToken.connect(communityWallet).transfer(user3.address, ethers.utils.parseEther("10000"));

    return {
      cribToken,
      timelock,
      governance,
      multiSig,
      staking,
      nftCollection,
      marketplace,
      yieldFarm,
      rewards,
      deployer,
      treasury,
      teamWallet,
      investorWallet,
      liquidityWallet,
      communityWallet,
      reserveWallet,
      emergencyAdmin,
      feeRecipient,
      moderatorPool,
      user1,
      user2,
      user3,
    };
  }

  describe("Token Functionality", function () {
    it("Should have correct initial supply distribution", async function () {
      const { cribToken, teamWallet, investorWallet, liquidityWallet, communityWallet, reserveWallet } = 
        await loadFixture(deployFixture);

      const totalSupply = await cribToken.totalSupply();
      expect(totalSupply).to.equal(ethers.utils.parseEther("1000000000")); // 1B tokens

      // Check allocation percentages
      const teamBalance = await cribToken.balanceOf(teamWallet.address);
      const investorBalance = await cribToken.balanceOf(investorWallet.address);
      const liquidityBalance = await cribToken.balanceOf(liquidityWallet.address);
      const communityBalance = await cribToken.balanceOf(communityWallet.address);
      const reserveBalance = await cribToken.balanceOf(reserveWallet.address);

      expect(teamBalance).to.equal(totalSupply.mul(20).div(100)); // 20%
      expect(investorBalance).to.equal(totalSupply.mul(15).div(100)); // 15%
      expect(liquidityBalance).to.equal(totalSupply.mul(25).div(100)); // 25%
      expect(communityBalance).to.equal(totalSupply.mul(30).div(100)); // 30%
      expect(reserveBalance).to.equal(totalSupply.mul(10).div(100)); // 10%
    });

    it("Should allow staking and reward calculation", async function () {
      const { cribToken, user1 } = await loadFixture(deployFixture);

      const stakeAmount = ethers.utils.parseEther("1000");
      
      // Stake tokens
      await cribToken.connect(user1).stake(stakeAmount);
      
      const stakingBalance = await cribToken.stakingBalance(user1.address);
      expect(stakingBalance).to.equal(stakeAmount);

      // Fast forward time and check rewards
      await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]); // 30 days
      await ethers.provider.send("evm_mine");

      const pendingRewards = await cribToken.calculateStakingReward(user1.address);
      expect(pendingRewards).to.be.gt(0);
    });

    it("Should enforce token gating levels", async function () {
      const { cribToken, user1 } = await loadFixture(deployFixture);

      // Check initial access level (should be Bronze)
      let accessLevel = await cribToken.getAccessLevel(user1.address);
      expect(accessLevel).to.equal(0); // Bronze

      // User has 10k CRYB, should be Silver level (>= 5k)
      accessLevel = await cribToken.getAccessLevel(user1.address);
      expect(accessLevel).to.equal(2); // Silver

      // Check access rights
      const hasSilverAccess = await cribToken.hasAccessLevel(user1.address, 2);
      expect(hasSilverAccess).to.be.true;
    });
  });

  describe("NFT and Marketplace Integration", function () {
    it("Should mint NFTs and list on marketplace", async function () {
      const { nftCollection, marketplace, cribToken, user1, user2, feeRecipient } = 
        await loadFixture(deployFixture);

      // Set marketplace as approved
      await nftCollection.setMarketplaceApproval(marketplace.address, true);

      // Mint NFT to user1
      await nftCollection.ownerMint(user1.address, 1);
      const tokenId = 1;

      // Approve marketplace
      await nftCollection.connect(user1).approve(marketplace.address, tokenId);

      // Create fixed price listing
      const listingPrice = ethers.utils.parseEther("100");
      await marketplace.connect(user1).createFixedPriceListing(
        nftCollection.address,
        tokenId,
        listingPrice,
        cribToken.address
      );

      // User2 buys the NFT
      await cribToken.connect(user2).approve(marketplace.address, listingPrice);
      await marketplace.connect(user2).buyFixedPrice(0);

      // Check ownership transfer
      const newOwner = await nftCollection.ownerOf(tokenId);
      expect(newOwner).to.equal(user2.address);
    });

    it("Should handle English auction correctly", async function () {
      const { nftCollection, marketplace, cribToken, user1, user2, user3 } = 
        await loadFixture(deployFixture);

      // Mint and approve NFT
      await nftCollection.ownerMint(user1.address, 1);
      await nftCollection.connect(user1).approve(marketplace.address, 1);

      // Create English auction
      const startingPrice = ethers.utils.parseEther("50");
      const reservePrice = ethers.utils.parseEther("80");
      const duration = 7 * 24 * 60 * 60; // 7 days

      await marketplace.connect(user1).createEnglishAuction(
        nftCollection.address,
        1,
        startingPrice,
        reservePrice,
        duration,
        cribToken.address
      );

      // Place bids
      const bid1 = ethers.utils.parseEther("60");
      const bid2 = ethers.utils.parseEther("90");

      await cribToken.connect(user2).approve(marketplace.address, bid1);
      await marketplace.connect(user2).placeBid(0, bid1);

      await cribToken.connect(user3).approve(marketplace.address, bid2);
      await marketplace.connect(user3).placeBid(0, bid2);

      // Fast forward past auction end
      await ethers.provider.send("evm_increaseTime", [duration + 1]);
      await ethers.provider.send("evm_mine");

      // Finalize auction
      await marketplace.finalizeAuction(0);

      // Check that user3 (highest bidder) owns the NFT
      const owner = await nftCollection.ownerOf(1);
      expect(owner).to.equal(user3.address);
    });
  });

  describe("Staking and Yield Farming", function () {
    it("Should allow staking in multiple pools", async function () {
      const { staking, cribToken, user1 } = await loadFixture(deployFixture);

      const stakeAmount = ethers.utils.parseEther("1000");

      // Approve tokens
      await cribToken.connect(user1).approve(staking.address, stakeAmount);

      // Stake in pool 0
      await staking.connect(user1).deposit(0, stakeAmount);

      // Check staking balance
      const userInfo = await staking.getUserInfo(0, user1.address);
      expect(userInfo.amount).to.equal(stakeAmount);
    });

    it("Should calculate and distribute yield farming rewards", async function () {
      const { yieldFarm, cribToken, user1 } = await loadFixture(deployFixture);

      const stakeAmount = ethers.utils.parseEther("1000");

      // Approve and deposit
      await cribToken.connect(user1).approve(yieldFarm.address, stakeAmount);
      await yieldFarm.connect(user1).deposit(0, stakeAmount);

      // Fast forward blocks
      for (let i = 0; i < 100; i++) {
        await ethers.provider.send("evm_mine");
      }

      // Check pending rewards
      const pendingRewards = await yieldFarm.pendingRewards(0, user1.address);
      expect(pendingRewards).to.be.gt(0);

      // Claim rewards
      const balanceBefore = await cribToken.balanceOf(user1.address);
      await yieldFarm.connect(user1).claimRewards(0);
      const balanceAfter = await cribToken.balanceOf(user1.address);

      expect(balanceAfter).to.be.gt(balanceBefore);
    });
  });

  describe("Content Rewards System", function () {
    it("Should reward content creation", async function () {
      const { rewards, cribToken, user1, treasury } = await loadFixture(deployFixture);

      // Fund rewards contract
      await cribToken.connect(treasury).transfer(rewards.address, ethers.utils.parseEther("100000"));

      const contentId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-content-1"));
      const qualityScore = 85;
      const metrics = [10, 5, 3, 100]; // likes, comments, shares, views

      const balanceBefore = await cribToken.balanceOf(user1.address);

      // Submit content for rewards
      await rewards.connect(user1).submitContent(
        contentId,
        0, // POST type
        qualityScore,
        metrics
      );

      const balanceAfter = await cribToken.balanceOf(user1.address);
      expect(balanceAfter).to.be.gt(balanceBefore);

      // Check user stats
      const userStats = await rewards.getUserStats(user1.address);
      expect(userStats.contentCreated).to.equal(1);
      expect(userStats.qualityScore).to.equal(qualityScore);
    });

    it("Should handle referral rewards", async function () {
      const { rewards, cribToken, user1, user2, treasury } = await loadFixture(deployFixture);

      // Fund rewards contract
      await cribToken.connect(treasury).transfer(rewards.address, ethers.utils.parseEther("100000"));

      // Set referral relationship
      await rewards.connect(user2).setReferrer(user1.address);

      const contentId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("referral-content"));
      const qualityScore = 75;
      const metrics = [5, 3, 2, 50];

      const referrerBalanceBefore = await cribToken.balanceOf(user1.address);

      // User2 creates content (should trigger referral reward for user1)
      await rewards.connect(user2).submitContent(
        contentId,
        0,
        qualityScore,
        metrics
      );

      const referrerBalanceAfter = await cribToken.balanceOf(user1.address);
      expect(referrerBalanceAfter).to.be.gt(referrerBalanceBefore);
    });
  });

  describe("Governance Integration", function () {
    it("Should create and execute proposals", async function () {
      const { governance, cribToken, timelock, user1, communityWallet } = await loadFixture(deployFixture);

      // Grant enough tokens for proposal threshold
      const proposalThreshold = ethers.utils.parseEther("1000000");
      await cribToken.connect(communityWallet).transfer(user1.address, proposalThreshold);

      // Delegate voting power to self
      await cribToken.connect(user1).delegate(user1.address);

      // Mine a block to update voting power
      await ethers.provider.send("evm_mine");

      // Create proposal (update staking reward rate)
      const targets = [cribToken.address];
      const values = [0];
      const calldatas = [cribToken.interface.encodeFunctionData("setStakingRewardRate", [600])]; // 6%
      const description = "Increase staking reward rate to 6%";

      await governance.connect(user1).proposeWithDetails(
        targets,
        values,
        calldatas,
        description,
        "Staking Rate Increase",
        "Tokenomics"
      );

      // Fast forward past voting delay
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]); // 1 day + 1 second
      await ethers.provider.send("evm_mine");

      // Vote on proposal
      await governance.connect(user1).castVoteWithReasonAndReward(1, 1, "I support this proposal");

      // Fast forward past voting period
      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60 + 1]); // 7 days + 1 second
      await ethers.provider.send("evm_mine");

      // Queue proposal
      const descriptionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(description));
      await governance.queue(targets, values, calldatas, descriptionHash);

      // Fast forward past timelock delay
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]); // 24 hours + 1 second
      await ethers.provider.send("evm_mine");

      // Execute proposal
      await governance.execute(targets, values, calldatas, descriptionHash);

      // Verify the change was made
      const newRate = await cribToken.stakingRewardRate();
      expect(newRate).to.equal(600);
    });
  });

  describe("Multi-Signature Functionality", function () {
    it("Should require multiple signatures for execution", async function () {
      const { multiSig, cribToken, deployer, treasury, emergencyAdmin } = await loadFixture(deployFixture);

      // Fund multisig wallet
      await cribToken.transfer(multiSig.address, ethers.utils.parseEther("1000"));

      // Create transaction to transfer tokens
      const to = cribToken.address;
      const value = 0;
      const data = cribToken.interface.encodeFunctionData("transfer", [treasury.address, ethers.utils.parseEther("500")]);

      await multiSig.connect(deployer).submitTransaction(
        to,
        value,
        data,
        "Transfer 500 CRYB to treasury",
        "routine"
      );

      // First confirmation (auto-confirmed by submitter)
      // Second confirmation needed
      await multiSig.connect(treasury).confirmTransaction(0);

      // Check if transaction is executable and execute
      const executable = await multiSig.isExecutable(0);
      expect(executable).to.be.true;

      await multiSig.executeTransaction(0);

      // Verify transfer
      const treasuryBalance = await cribToken.balanceOf(treasury.address);
      expect(treasuryBalance).to.be.gte(ethers.utils.parseEther("500"));
    });
  });

  describe("End-to-End User Journey", function () {
    it("Should complete full user journey", async function () {
      const {
        cribToken,
        nftCollection,
        marketplace,
        staking,
        rewards,
        user1,
        user2,
        treasury,
        feeRecipient
      } = await loadFixture(deployFixture);

      // 1. User creates content and earns rewards
      await cribToken.connect(treasury).transfer(rewards.address, ethers.utils.parseEther("100000"));
      
      const contentId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("user-journey-content"));
      await rewards.connect(user1).submitContent(
        contentId,
        0, // POST
        90, // high quality score
        [20, 10, 5, 200] // good engagement
      );

      // 2. User stakes earned tokens
      const earnedBalance = await cribToken.balanceOf(user1.address);
      const stakeAmount = earnedBalance.div(2);
      
      await cribToken.connect(user1).approve(staking.address, stakeAmount);
      await staking.connect(user1).deposit(0, stakeAmount);

      // 3. User purchases premium access
      const premiumCost = ethers.utils.parseEther("30000"); // 30 days * 1000 CRYB
      if (earnedBalance.gte(premiumCost)) {
        await rewards.connect(user1).purchasePremium(30);
        
        const hasPremium = await rewards.hasPremiumAccess(user1.address);
        expect(hasPremium).to.be.true;
      }

      // 4. User mints NFT (if they have premium or are verified)
      await nftCollection.ownerMint(user1.address, 1);
      await nftCollection.connect(user1).setProfilePicture(1);

      // 5. User lists NFT on marketplace
      await nftCollection.connect(user1).approve(marketplace.address, 1);
      await marketplace.connect(user1).createFixedPriceListing(
        nftCollection.address,
        1,
        ethers.utils.parseEther("200"),
        cribToken.address
      );

      // 6. Another user buys the NFT
      await cribToken.connect(user2).approve(marketplace.address, ethers.utils.parseEther("200"));
      await marketplace.connect(user2).buyFixedPrice(0);

      // 7. Verify final state
      const finalUser1Balance = await cribToken.balanceOf(user1.address);
      const nftOwner = await nftCollection.ownerOf(1);
      const stakingBalance = await staking.getUserInfo(0, user1.address);

      expect(nftOwner).to.equal(user2.address);
      expect(stakingBalance.amount).to.equal(stakeAmount);
      expect(finalUser1Balance).to.be.gt(0);

      console.log("🎉 Complete user journey test passed!");
      console.log(`   💰 User1 final balance: ${ethers.utils.formatEther(finalUser1Balance)} CRYB`);
      console.log(`   🥩 User1 staked: ${ethers.utils.formatEther(stakingBalance.amount)} CRYB`);
      console.log(`   🖼️ NFT owner: ${nftOwner}`);
    });
  });
});