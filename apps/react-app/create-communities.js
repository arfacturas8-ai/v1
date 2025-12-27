/**
 * Script to create initial communities from reference designs
 * Communities: Bitcoin, Ethereum, NFTs, DeFi, Metaverse, Web3
 */

const axios = require('axios');

// API configuration
const API_BASE_URL = 'http://localhost:3001/api'; // Update with your backend URL
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || ''; // Set admin auth token

// Community definitions from reference images
const communities = [
  {
    name: 'bitcoin',
    displayName: 'Bitcoin',
    description: 'The original cryptocurrency and digital gold',
    category: 'crypto',
    isPublic: true,
    rules: ['Be respectful', 'No spam', 'Quality discussions only']
  },
  {
    name: 'ethereum',
    displayName: 'Ethereum',
    description: 'Smart contracts and decentralized applications',
    category: 'crypto',
    isPublic: true,
    rules: ['Be respectful', 'No spam', 'Quality discussions only']
  },
  {
    name: 'nfts',
    displayName: 'NFTs',
    description: 'Non-fungible tokens, digital art, and collectibles',
    category: 'nft',
    isPublic: true,
    rules: ['Be respectful', 'No spam', 'Quality discussions only']
  },
  {
    name: 'defi',
    displayName: 'DeFi',
    description: 'Decentralized finance protocols and yield farming',
    category: 'defi',
    isPublic: true,
    rules: ['Be respectful', 'No spam', 'Quality discussions only']
  },
  {
    name: 'metaverse',
    displayName: 'Metaverse',
    description: 'Virtual worlds, gaming, and digital experiences',
    category: 'metaverse',
    isPublic: true,
    rules: ['Be respectful', 'No spam', 'Quality discussions only']
  },
  {
    name: 'web3',
    displayName: 'Web3',
    description: 'The decentralized internet and blockchain technology',
    category: 'crypto',
    isPublic: true,
    rules: ['Be respectful', 'No spam', 'Quality discussions only']
  }
];

async function createCommunity(communityData) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/communities`,
      communityData,
      {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ Created community: ${communityData.displayName}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log(`ℹ️  Community already exists: ${communityData.displayName}`);
    } else {
      console.error(`❌ Failed to create ${communityData.displayName}:`, error.response?.data || error.message);
    }
    return null;
  }
}

async function main() {
  console.log('🚀 Creating initial communities from reference designs...\n');

  if (!ADMIN_TOKEN) {
    console.error('❌ Error: ADMIN_TOKEN environment variable is required');
    console.log('Usage: ADMIN_TOKEN=your_token node create-communities.js');
    process.exit(1);
  }

  for (const community of communities) {
    await createCommunity(community);
  }

  console.log('\n✅ Done! All communities processed.');
}

// Run script
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { communities, createCommunity };
