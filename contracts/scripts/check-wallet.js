const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  console.log("\n📍 Wallet Information\n");
  console.log("════════════════════════════════════════════════════════");

  // Get wallet from private key
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey || privateKey === "YOUR_PRIVATE_KEY_HERE") {
    console.log("❌ No private key found in .env file");
    console.log("\nPlease add a private key to your .env file:");
    console.log("PRIVATE_KEY=your_private_key_here");
    return;
  }

  const wallet = new ethers.Wallet(privateKey);
  console.log("Wallet Address:", wallet.address);
  console.log("════════════════════════════════════════════════════════");

  // Check balance on different networks
  const networks = {
    sepolia: process.env.SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY",
    ethereum: process.env.ETHEREUM_RPC_URL || "https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY",
  };

  console.log("\n💰 Balances:\n");

  for (const [name, rpc] of Object.entries(networks)) {
    try {
      if (!rpc.includes("YOUR_KEY")) {
        const provider = new ethers.JsonRpcProvider(rpc);
        const balance = await provider.getBalance(wallet.address);
        console.log(`${name.padEnd(10)}: ${ethers.formatEther(balance)} ETH`);
      } else {
        console.log(`${name.padEnd(10)}: ⚠️  RPC URL not configured`);
      }
    } catch (error) {
      console.log(`${name.padEnd(10)}: ❌ Failed to connect`);
    }
  }

  console.log("\n════════════════════════════════════════════════════════");
  console.log("\n📝 Next Steps:\n");
  console.log("1. Get Sepolia ETH:");
  console.log("   - https://sepoliafaucet.com/");
  console.log("   - https://www.alchemy.com/faucets/ethereum-sepolia");
  console.log("\n2. Deploy contracts:");
  console.log("   npx hardhat run scripts/deploy-v6.js --network sepolia");
  console.log("\n════════════════════════════════════════════════════════\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
