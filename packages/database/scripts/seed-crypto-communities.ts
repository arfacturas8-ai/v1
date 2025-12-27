/**
 * Crypto Communities Seed Script
 * Creates specific cryptocurrency communities matching the reference design
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Crypto communities from reference images (76gyub folder)
const CRYPTO_COMMUNITIES = [
  {
    name: 'bitcoin',
    displayName: 'Bitcoin',
    description: 'The original cryptocurrency and digital gold. Discussion about BTC, trading, mining, and blockchain technology.',
    members: 28943,
    coinHolders: 15234,
    icon: '₿',
    category: 'crypto',
  },
  {
    name: 'ethereum',
    displayName: 'Ethereum',
    description: 'Smart contracts and decentralized applications. ETH, DeFi, NFTs, and Web3 development.',
    members: 24521,
    coinHolders: 18765,
    icon: 'Ξ',
    category: 'crypto',
  },
  {
    name: 'solana',
    displayName: 'Solana',
    description: 'High-performance blockchain for DeFi and NFTs. Fast, scalable, and low-cost transactions.',
    members: 15867,
    coinHolders: 13989,
    icon: '◎',
    category: 'crypto',
  },
  {
    name: 'cardano',
    displayName: 'Cardano',
    description: 'Research-driven blockchain platform with peer-reviewed development. ADA and sustainable blockchain.',
    members: 12430,
    coinHolders: 9876,
    icon: '₳',
    category: 'crypto',
  },
  {
    name: 'polygon',
    displayName: 'Polygon',
    description: 'Ethereum scaling and infrastructure development. MATIC, Layer 2, and multi-chain solutions.',
    members: 14289,
    coinHolders: 11234,
    icon: '⬡',
    category: 'crypto',
  },
  {
    name: 'binance',
    displayName: 'Binance Coin',
    description: 'Native token of Binance ecosystem. BNB, BSC, and DeFi on Binance Smart Chain.',
    members: 9245,
    coinHolders: 8123,
    icon: 'Ⓑ',
    category: 'crypto',
  },
  {
    name: 'avalanche',
    displayName: 'Avalanche',
    description: 'Fast and scalable smart contract platform. AVAX, subnets, and enterprise blockchain.',
    members: 11842,
    coinHolders: 9567,
    icon: '🔺',
    category: 'crypto',
  },
  {
    name: 'polkadot',
    displayName: 'Polkadot',
    description: 'Multi-chain protocol for Web3. DOT, parachains, and cross-chain interoperability.',
    members: 8134,
    coinHolders: 7234,
    icon: '●',
    category: 'crypto',
  },
  {
    name: 'litecoin',
    displayName: 'Litecoin',
    description: 'Peer-to-peer cryptocurrency. LTC, fast transactions, and digital silver.',
    members: 6892,
    coinHolders: 5678,
    icon: 'Ł',
    category: 'crypto',
  },
  {
    name: 'tether',
    displayName: 'Tether',
    description: 'Leading stablecoin pegged to USD. USDT, stable value, and digital dollar.',
    members: 5421,
    coinHolders: 23456,
    icon: '₮',
    category: 'crypto',
  },
  {
    name: 'xrp',
    displayName: 'XRP',
    description: 'Fast and low-cost international payments. Ripple network and cross-border transfers.',
    members: 7234,
    coinHolders: 6789,
    icon: 'Ʀ',
    category: 'crypto',
  },
  {
    name: 'terra',
    displayName: 'Terra',
    description: 'Algorithmic stablecoins and DeFi ecosystem. LUNA, UST, and programmable money.',
    members: 4567,
    coinHolders: 3890,
    icon: '🌍',
    category: 'crypto',
  },
  {
    name: 'ftx',
    displayName: 'FTX',
    description: 'Cryptocurrency derivatives and trading platform. FTT token and advanced trading features.',
    members: 3456,
    coinHolders: 2345,
    icon: 'Ⓕ',
    category: 'crypto',
  },
  {
    name: 'vechain',
    displayName: 'VeChain',
    description: 'Enterprise blockchain for supply chain and business. VET, sustainability, and real-world adoption.',
    members: 4123,
    coinHolders: 3456,
    icon: 'Ⓥ',
    category: 'crypto',
  },
  {
    name: 'flow',
    displayName: 'Flow',
    description: 'Blockchain built for NFTs and gaming. Flow network, NBA Top Shot, and digital collectibles.',
    members: 3890,
    coinHolders: 2987,
    icon: '⚡',
    category: 'crypto',
  },
];

/**
 * Seed crypto communities
 */
async function seedCryptoCommunities() {
  console.log('\n🌱 Starting Crypto Communities Seed');
  console.log('═'.repeat(50));

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const communityData of CRYPTO_COMMUNITIES) {
    try {
      // Check if community already exists
      const existing = await prisma.community.findUnique({
        where: { name: communityData.name },
      });

      if (existing) {
        // Update existing community
        await prisma.community.update({
          where: { name: communityData.name },
          data: {
            displayName: communityData.displayName,
            description: communityData.description,
            memberCount: communityData.members,
            isPublic: true,
            isNsfw: false,
            icon: `https://api.dicebear.com/7.x/shapes/svg?seed=${communityData.name}`,
            rules: JSON.stringify([
              { id: 1, title: 'Be respectful', description: 'Treat others with respect and courtesy' },
              { id: 2, title: 'No spam or scams', description: 'Quality content only, no scam projects' },
              { id: 3, title: 'Stay on topic', description: 'Keep discussions relevant to ' + communityData.displayName },
              { id: 4, title: 'No financial advice', description: 'Do your own research, not financial advice' },
            ]) as any,
          },
        });
        updated++;
        console.log(`  ✅ Updated: ${communityData.displayName} (${communityData.members} members)`);
      } else {
        // Create new community
        await prisma.community.create({
          data: {
            id: randomUUID(),
            name: communityData.name,
            displayName: communityData.displayName,
            description: communityData.description,
            memberCount: communityData.members,
            isPublic: true,
            isNsfw: false,
            icon: `https://api.dicebear.com/7.x/shapes/svg?seed=${communityData.name}`,
            banner: `https://source.unsplash.com/1200x400/?${communityData.name},cryptocurrency`,
            updatedAt: new Date(),
            rules: JSON.stringify([
              { id: 1, title: 'Be respectful', description: 'Treat others with respect and courtesy' },
              { id: 2, title: 'No spam or scams', description: 'Quality content only, no scam projects' },
              { id: 3, title: 'Stay on topic', description: 'Keep discussions relevant to ' + communityData.displayName },
              { id: 4, title: 'No financial advice', description: 'Do your own research, not financial advice' },
            ]) as any,
          },
        });
        created++;
        console.log(`  ✨ Created: ${communityData.displayName} (${communityData.members} members)`);
      }
    } catch (error) {
      console.error(`  ❌ Failed to seed ${communityData.displayName}:`, error);
      skipped++;
    }
  }

  console.log('\n🎉 Crypto Communities Seed Completed!');
  console.log('═'.repeat(50));
  console.log(`\n📊 Summary:`);
  console.log(`  - Created: ${created} communities`);
  console.log(`  - Updated: ${updated} communities`);
  console.log(`  - Skipped: ${skipped} communities`);
  console.log(`  - Total: ${CRYPTO_COMMUNITIES.length} communities processed\n`);

  // Display final community count
  const totalCommunities = await prisma.community.count();
  console.log(`Total communities in database: ${totalCommunities}\n`);
}

// Run the seed
seedCryptoCommunities()
  .then(() => {
    console.log('✅ Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
