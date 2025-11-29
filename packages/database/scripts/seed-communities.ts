/**
 * Community Seed Script - Batched Seeding
 * Seeds users, communities, posts, and comments in rounds of 10
 */

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Community themes and topics
const COMMUNITY_THEMES = [
  { name: 'technology', displayName: 'Technology', description: 'All things tech, gadgets, and innovation', icon: '💻' },
  { name: 'gaming', displayName: 'Gaming', description: 'Video games, esports, and gaming culture', icon: '🎮' },
  { name: 'crypto', displayName: 'Cryptocurrency', description: 'Crypto trading, blockchain, and Web3', icon: '₿' },
  { name: 'art', displayName: 'Art & Design', description: 'Digital art, design, and creative work', icon: '🎨' },
  { name: 'music', displayName: 'Music', description: 'Music discussion, sharing, and discovery', icon: '🎵' },
  { name: 'fitness', displayName: 'Fitness & Health', description: 'Workout tips, nutrition, and wellness', icon: '💪' },
  { name: 'coding', displayName: 'Programming', description: 'Code, development, and software engineering', icon: '⌨️' },
  { name: 'movies', displayName: 'Movies & TV', description: 'Film discussions, reviews, and recommendations', icon: '🎬' },
  { name: 'books', displayName: 'Books & Reading', description: 'Book clubs, reviews, and literary discussions', icon: '📚' },
  { name: 'science', displayName: 'Science', description: 'Scientific discoveries and discussions', icon: '🔬' },
];

// Post templates by theme
const POST_TEMPLATES: Record<string, { title: string; content: string }[]> = {
  technology: [
    { title: 'Just launched my new app!', content: 'After 6 months of development, I finally launched my productivity app. Would love your feedback!' },
    { title: 'Best laptop for developers in 2025?', content: 'Looking to upgrade my setup. What are you all using for development work?' },
    { title: 'AI is changing everything', content: 'The pace of AI development is incredible. What are your thoughts on where we\'re headed?' },
    { title: 'Finally got my homelab running', content: 'Set up a complete homelab with Docker, K8s, and monitoring. Happy to share my setup!' },
    { title: 'New M4 MacBook Pro thoughts?', content: 'Anyone got the new MacBook Pro? How\'s the performance for heavy workloads?' },
    { title: 'Self-hosting everything in 2025', content: 'Complete guide to self-hosting your entire digital life. Ask me anything!' },
    { title: 'Linux on desktop is finally viable', content: 'Switched to Linux full-time 6 months ago. Here\'s my experience.' },
    { title: 'The future of quantum computing', content: 'IBM just announced a breakthrough. This could change everything.' },
    { title: 'Best tech podcasts to follow?', content: 'Looking for quality tech content. What are your recommendations?' },
    { title: 'Built a mechanical keyboard from scratch', content: 'Custom PCB, hand-soldered switches. Here\'s the build log!' },
  ],
  gaming: [
    { title: 'Just hit Diamond rank!', content: 'Finally climbed out of Platinum after 200 games. AMA!' },
    { title: 'Best indie games of 2025', content: 'What hidden gems have you discovered this year?' },
    { title: 'Looking for chill gaming group', content: 'Adult gamer looking for laid-back people to play with. No toxicity!' },
    { title: 'My gaming setup tour', content: 'After years of upgrades, here\'s my complete battle station.' },
    { title: 'Speedrun world record!', content: 'Just set a new Any% WR in my favorite game. Video in comments!' },
    { title: 'Retro gaming is back', content: 'Been collecting and playing classic games. The nostalgia is real!' },
    { title: 'Game recommendations for Steam Deck?', content: 'Just got a Steam Deck. What games work best on it?' },
    { title: 'The state of AAA gaming', content: 'Are we seeing a decline in quality? Let\'s discuss.' },
    { title: 'VR gaming is underrated', content: 'Finally tried VR gaming. This is the future!' },
    { title: 'Completed my first 100% run', content: 'Took 80 hours but I got every achievement. Worth it!' },
  ],
  crypto: [
    { title: 'BTC hitting new ATH soon?', content: 'Technical analysis suggests we might see $100k+ this quarter. Thoughts?' },
    { title: 'Best wallets for security', content: 'Hardware vs software wallets - what do you recommend?' },
    { title: 'DeFi yields are back', content: 'Found some great farming opportunities. Here\'s my strategy.' },
    { title: 'ETH 2.0 staking guide', content: 'Complete guide to staking ETH safely. Ask me anything!' },
    { title: 'NFT market analysis', content: 'Deep dive into current NFT trends and what\'s actually valuable.' },
    { title: 'Got rugged, lessons learned', content: 'Lost $5k to a scam project. Here\'s how to avoid my mistakes.' },
    { title: 'Layer 2 solutions comparison', content: 'Analyzed Arbitrum, Optimism, and zkSync. Here are the results.' },
    { title: 'Crypto tax tips for 2025', content: 'CPA here - answering your crypto tax questions!' },
    { title: 'Building on Solana', content: 'Developer guide to building dApps on Solana. Resources included!' },
    { title: 'Web3 gaming is evolving', content: 'Play-to-earn is dead, but play-and-earn is thriving.' },
  ],
  // Add templates for other themes...
};

// Generic templates for communities without specific templates
const GENERIC_TEMPLATES = [
  { title: 'Introduction post!', content: 'Hey everyone! Excited to join this community. Looking forward to great discussions!' },
  { title: 'Sharing my recent project', content: 'Been working on this for a while. Would love your feedback and suggestions!' },
  { title: 'Beginner question', content: 'Just getting started in this area. Any tips for someone new?' },
  { title: 'Weekly discussion thread', content: 'What has everyone been up to this week? Share your updates!' },
  { title: 'Resource recommendation', content: 'Found this amazing resource that helped me a lot. Highly recommended!' },
  { title: 'Motivation Monday', content: 'Let\'s start the week strong! What are your goals?' },
  { title: 'Ask me anything', content: 'I\'ve been in this field for 5+ years. Happy to answer questions!' },
  { title: 'Success story', content: 'Just achieved a major milestone! Here\'s how I did it.' },
  { title: 'Looking for collaboration', content: 'Working on a project and looking for people to join. Interested?' },
  { title: 'Community feedback request', content: 'How can we make this community better? Share your ideas!' },
];

// Comment templates
const COMMENT_TEMPLATES = [
  'Great post! Really helpful information.',
  'I had the same experience! Thanks for sharing.',
  'This is exactly what I needed. Saved!',
  'Interesting perspective. I never thought about it that way.',
  'Could you elaborate more on this point?',
  'Thanks for posting this! Very informative.',
  'I disagree, but I respect your opinion.',
  'This deserves more upvotes!',
  'Following this thread. Great discussion!',
  'Update: I tried this and it worked perfectly!',
  'Can confirm, this is accurate.',
  'What resources would you recommend for learning more?',
  'This is a game changer. Thank you!',
  'I\'ve been doing this for years and can vouch for it.',
  'Bookmarking this for later. Excellent content!',
];

/**
 * ROUND 1: Seed Users
 */
async function seedUsers(count: number = 10) {
  console.log(`\n🚀 ROUND 1: Creating ${count} users...`);

  const users = [];

  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const username = faker.internet.userName({ firstName, lastName }).toLowerCase();

    const user = await prisma.user.create({
      data: {
        username,
        discriminator: faker.number.int({ min: 1, max: 9999 }).toString().padStart(4, '0'),
        displayName: `${firstName} ${lastName}`,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        avatar: faker.image.avatar(),
        banner: Math.random() > 0.6 ? faker.image.urlLoremFlickr({ category: 'nature' }) : null,
        bio: Math.random() > 0.4 ? faker.lorem.sentence() : null,
        pronouns: faker.helpers.arrayElement(['he/him', 'she/her', 'they/them', null, null]),
        isVerified: Math.random() > 0.7,
        premiumType: faker.helpers.weightedArrayElement([
          { weight: 0.7, value: 'NONE' },
          { weight: 0.2, value: 'NITRO_BASIC' },
          { weight: 0.1, value: 'NITRO' },
        ]) as any,
        lastSeenAt: faker.date.recent({ days: 7 }),
      },
    });

    users.push(user);
    console.log(`  ✅ Created user: ${user.username}#${user.discriminator}`);
  }

  console.log(`\n✨ Round 1 Complete: ${users.length} users created`);
  return users;
}

/**
 * ROUND 2: Seed Communities
 */
async function seedCommunities(count: number = 10) {
  console.log(`\n🚀 ROUND 2: Creating ${count} communities...`);

  const communities = [];
  const themes = faker.helpers.arrayElements(COMMUNITY_THEMES, Math.min(count, COMMUNITY_THEMES.length));

  for (let i = 0; i < count; i++) {
    const theme = themes[i % themes.length];
    const suffix = i >= themes.length ? ` ${Math.floor(i / themes.length) + 1}` : '';

    const community = await prisma.community.create({
      data: {
        name: `${theme.name}${suffix.replace(' ', '')}`,
        displayName: `${theme.icon} ${theme.displayName}${suffix}`,
        description: theme.description,
        icon: `https://api.dicebear.com/7.x/shapes/svg?seed=${theme.name}`,
        banner: faker.image.urlLoremFlickr({ category: theme.name }),
        isPublic: Math.random() > 0.1, // 90% public
        isNsfw: false,
        memberCount: 0,
        rules: JSON.stringify([
          { id: 1, title: 'Be respectful', description: 'Treat others with respect' },
          { id: 2, title: 'No spam', description: 'Quality content only' },
          { id: 3, title: 'Stay on topic', description: 'Keep posts relevant to the community' },
        ]) as any,
      },
    });

    communities.push(community);
    console.log(`  ✅ Created community: ${community.displayName}`);
  }

  console.log(`\n✨ Round 2 Complete: ${communities.length} communities created`);
  return communities;
}

/**
 * ROUND 3: Seed Community Members
 */
async function seedCommunityMembers(communities: any[], users: any[]) {
  console.log(`\n🚀 ROUND 3: Adding users to communities...`);

  let totalMemberships = 0;

  for (const community of communities) {
    // Each community gets 5-10 random members
    const memberCount = faker.number.int({ min: 5, max: Math.min(10, users.length) });
    const members = faker.helpers.arrayElements(users, memberCount);

    for (const user of members) {
      try {
        await prisma.communityMember.create({
          data: {
            communityId: community.id,
            userId: user.id,
            joinedAt: faker.date.past({ years: 1 }),
          },
        });
        totalMemberships++;
      } catch (error) {
        // Skip if already exists
      }
    }

    // Update member count
    await prisma.community.update({
      where: { id: community.id },
      data: { memberCount },
    });

    console.log(`  ✅ Added ${memberCount} members to ${community.displayName}`);
  }

  console.log(`\n✨ Round 3 Complete: ${totalMemberships} memberships created`);
}

/**
 * ROUND 4: Seed Posts
 */
async function seedPosts(communities: any[], users: any[], postsPerCommunity: number = 10) {
  console.log(`\n🚀 ROUND 4: Creating ${postsPerCommunity} posts per community...`);

  const allPosts = [];

  for (const community of communities) {
    const communityName = community.name.replace(/\d+$/, ''); // Remove number suffix
    const templates = POST_TEMPLATES[communityName] || GENERIC_TEMPLATES;

    for (let i = 0; i < postsPerCommunity; i++) {
      const template = faker.helpers.arrayElement(templates);
      const author = faker.helpers.arrayElement(users);

      const post = await prisma.post.create({
        data: {
          title: template.title,
          content: template.content,
          communityId: community.id,
          userId: author.id,
          score: faker.number.int({ min: -10, max: 500 }),
          commentCount: 0, // Will update after comments
          viewCount: faker.number.int({ min: 0, max: 1000 }),
          isPinned: i === 0 && Math.random() > 0.7, // Pin first post sometimes
          nsfw: false,
          flair: Math.random() > 0.7 ? faker.helpers.arrayElement(['Discussion', 'Question', 'News', 'Guide', 'Meme']) : null,
          createdAt: faker.date.past({ years: 1 }),
        },
      });

      allPosts.push(post);
    }

    console.log(`  ✅ Created ${postsPerCommunity} posts in ${community.displayName}`);
  }

  console.log(`\n✨ Round 4 Complete: ${allPosts.length} posts created`);
  return allPosts;
}

/**
 * ROUND 5: Seed Comments
 */
async function seedComments(posts: any[], users: any[], commentsPerPost: number = 10) {
  console.log(`\n🚀 ROUND 5: Creating ${commentsPerPost} comments per post...`);

  let totalComments = 0;

  for (const post of posts) {
    const commentCount = faker.number.int({ min: 5, max: commentsPerPost });

    for (let i = 0; i < commentCount; i++) {
      const author = faker.helpers.arrayElement(users);

      await prisma.comment.create({
        data: {
          postId: post.id,
          userId: author.id,
          content: faker.helpers.arrayElement([
            ...COMMENT_TEMPLATES,
            faker.lorem.paragraph(),
          ]),
          score: faker.number.int({ min: -5, max: 100 }),
          createdAt: faker.date.between({ from: post.createdAt, to: new Date() }),
        },
      });

      totalComments++;
    }

    // Update post comment count
    await prisma.post.update({
      where: { id: post.id },
      data: { commentCount },
    });
  }

  console.log(`\n✨ Round 5 Complete: ${totalComments} comments created`);
}

/**
 * ROUND 6: Seed Votes (for authenticity)
 */
async function seedVotes(posts: any[], users: any[]) {
  console.log(`\n🚀 ROUND 6: Creating votes for authenticity...`);

  let totalVotes = 0;

  // Vote on random posts
  const postsToVoteOn = faker.helpers.arrayElements(posts, Math.min(posts.length, 50));

  for (const post of postsToVoteOn) {
    const voterCount = faker.number.int({ min: 3, max: 10 });
    const voters = faker.helpers.arrayElements(users, voterCount);

    for (const voter of voters) {
      try {
        await prisma.vote.create({
          data: {
            userId: voter.id,
            postId: post.id,
            value: faker.helpers.arrayElement([1, 1, 1, 1, -1]), // 80% upvote, 20% downvote
          },
        });
        totalVotes++;
      } catch (error) {
        // Skip if duplicate
      }
    }
  }

  console.log(`\n✨ Round 6 Complete: ${totalVotes} votes created`);
}

/**
 * Main seed function
 */
export async function seedCommunitiesInBatches(options: {
  users?: number;
  communities?: number;
  postsPerCommunity?: number;
  commentsPerPost?: number;
} = {}) {
  const opts = {
    users: options.users || 10,
    communities: options.communities || 10,
    postsPerCommunity: options.postsPerCommunity || 10,
    commentsPerPost: options.commentsPerPost || 10,
  };

  try {
    console.log('\n🌱 Starting Community Database Seed (Batched)');
    console.log('═'.repeat(50));
    console.log(`Configuration:
  - Users: ${opts.users}
  - Communities: ${opts.communities}
  - Posts per community: ${opts.postsPerCommunity}
  - Comments per post: ${opts.commentsPerPost}
`);

    // Round 1: Users
    const users = await seedUsers(opts.users);

    // Round 2: Communities
    const communities = await seedCommunities(opts.communities);

    // Round 3: Community Members
    await seedCommunityMembers(communities, users);

    // Round 4: Posts
    const posts = await seedPosts(communities, users, opts.postsPerCommunity);

    // Round 5: Comments
    await seedComments(posts, users, opts.commentsPerPost);

    // Round 6: Votes
    await seedVotes(posts, users);

    // Final Statistics
    console.log('\n🎉 Seed Completed Successfully!');
    console.log('═'.repeat(50));
    console.log('\n📊 Final Statistics:\n');

    const stats = {
      users: await prisma.user.count(),
      communities: await prisma.community.count(),
      posts: await prisma.post.count(),
      comments: await prisma.comment.count(),
      votes: await prisma.vote.count(),
      memberships: await prisma.communityMember.count(),
    };

    console.table(stats);

  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// CLI support
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: any = {};

  // Parse arguments: --users 10 --communities 10
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = parseInt(args[i + 1]);
    if (key && !isNaN(value)) {
      options[key] = value;
    }
  }

  seedCommunitiesInBatches(options)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
