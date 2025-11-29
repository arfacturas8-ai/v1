#!/usr/bin/env node

/**
 * Sample Content Generator for CRYB Platform
 * This script generates realistic sample content including posts, comments, and user interactions
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3002';
const API_TOKEN = process.env.ADMIN_TOKEN || '';

// Sample data pools for generating realistic content
const sampleUsers = [
  {
    username: 'tech_sarah',
    displayName: 'Sarah Code',
    bio: 'Full-stack developer passionate about React and Node.js',
    interests: ['technology', 'programming', 'ai']
  },
  {
    username: 'gamer_alex',
    displayName: 'Alex Gaming',
    bio: 'Competitive gamer and streamer. Always up for a good match!',
    interests: ['gaming', 'esports', 'streaming']
  },
  {
    username: 'crypto_mike',
    displayName: 'Mike Blockchain',
    bio: 'DeFi enthusiast and blockchain developer. Building the future of finance.',
    interests: ['crypto', 'defi', 'blockchain']
  },
  {
    username: 'artist_luna',
    displayName: 'Luna Arts',
    bio: 'Digital artist exploring the intersection of art and technology.',
    interests: ['creative', 'art', 'nft']
  },
  {
    username: 'startup_jen',
    displayName: 'Jennifer Founder',
    bio: 'Serial entrepreneur building the next big thing. Always learning.',
    interests: ['business', 'startup', 'entrepreneurship']
  },
  {
    username: 'fitness_carlos',
    displayName: 'Carlos Fit',
    bio: 'Personal trainer helping people achieve their fitness goals.',
    interests: ['lifestyle', 'fitness', 'health']
  },
  {
    username: 'writer_emma',
    displayName: 'Emma Stories',
    bio: 'Creative writer and content creator. Words are my superpower.',
    interests: ['creative', 'writing', 'storytelling']
  },
  {
    username: 'data_scientist_raj',
    displayName: 'Raj Analytics',
    bio: 'Data scientist turning numbers into insights. Python enthusiast.',
    interests: ['technology', 'data', 'ai']
  }
];

const gamingPosts = [
  {
    title: "Just finished Elden Ring after 120 hours! 🎮",
    content: "What an incredible journey! The world-building in this game is absolutely phenomenal. FromSoftware really outdid themselves this time.\n\nSome thoughts:\n- The open world feels fresh and doesn't get repetitive\n- Boss fights are challenging but fair\n- The lore is deep and mysterious as always\n\nCurrently deciding between starting NG+ or trying a completely different build. What did you all think of the game?",
    type: "text",
    tags: ["elden-ring", "gaming", "fromsoft"]
  },
  {
    title: "Building my first gaming PC - need advice! 💻",
    content: "Finally making the switch from console to PC gaming! Been saving up for months and ready to pull the trigger.\n\nMy current build list:\n- CPU: AMD Ryzen 7 5700X\n- GPU: RTX 4060 Ti\n- RAM: 32GB DDR4\n- Storage: 1TB NVMe SSD\n\nAny suggestions for improvements? Budget is around $1500. Mainly playing competitive FPS and some AAA titles.",
    type: "text",
    tags: ["pc-gaming", "build", "advice"]
  },
  {
    title: "Cyberpunk 2077 is actually amazing now! 🌃",
    content: "Gave Cyberpunk another shot after the recent updates and I'm blown away. The game feels completely different from launch.\n\nWhat's improved:\n✅ Performance is smooth (even on my mid-range setup)\n✅ Way fewer bugs\n✅ Better AI and NPC behavior\n✅ Enhanced driving mechanics\n\nIf you wrote it off at launch, definitely worth another try. The story and world are incredible when the tech actually works!",
    type: "text",
    tags: ["cyberpunk", "gaming", "update"]
  }
];

const technologyPosts = [
  {
    title: "React 18 Concurrent Features - A Deep Dive 🚀",
    content: "Been experimenting with React 18's concurrent features and I'm impressed! Here's what I've learned:\n\n**Automatic Batching**\nMultiple state updates are now batched automatically, even in promises and timeouts. Huge performance win!\n\n**Transitions**\nThe `useTransition` hook lets you mark updates as non-urgent. Perfect for keeping the UI responsive during heavy operations.\n\n**Suspense Improvements**\nSuspense on the server is game-changing. Better UX with streaming HTML.\n\nAnyone else playing with these features? Share your experiences!",
    type: "text",
    tags: ["react", "javascript", "frontend"]
  },
  {
    title: "Why I switched from Docker to Podman",
    content: "After years of using Docker, I decided to give Podman a try. Here's why I'm not going back:\n\n🔒 **Security**: Rootless containers by default\n🏗️ **Architecture**: Daemonless design is more reliable\n🔧 **Compatibility**: Drop-in replacement for Docker CLI\n📦 **Pods**: Kubernetes-style pod management\n\nThe migration was surprisingly smooth. Most of my Docker Compose files work with minimal changes using podman-compose.\n\nHas anyone else made the switch? What's been your experience?",
    type: "text",
    tags: ["containers", "devops", "podman"]
  },
  {
    title: "AI Code Assistants: 6 months with GitHub Copilot 🤖",
    content: "I've been using GitHub Copilot for 6 months now. Here's my honest review:\n\n**The Good:**\n- Excellent at boilerplate code\n- Great for learning new APIs\n- Saves time on repetitive tasks\n- Surprisingly good at tests\n\n**The Not So Good:**\n- Sometimes suggests outdated patterns\n- Can make you lazy about understanding code\n- Occasional security anti-patterns\n\n**Bottom Line:** It's a powerful tool that makes me more productive, but it's not a replacement for understanding fundamentals.\n\nProductivity boost: ~30%\nWould I recommend it? Absolutely, with caveats.\n\nWhat's your experience with AI coding tools?",
    type: "text",
    tags: ["ai", "programming", "tools"]
  }
];

const cryptoPosts = [
  {
    title: "DeFi Yield Farming: My 6-Month Journey 📊",
    content: "Started yield farming 6 months ago with $5k. Here's what I learned:\n\n**Strategies that worked:**\n- Stablecoin pairs (USDC/USDT) for steady ~8-12% APY\n- Blue chip LP tokens (ETH/USDC) during market stability\n- Diversification across 3-4 protocols\n\n**Expensive lessons:**\n- Impermanent loss is real (lost ~15% on volatile pairs)\n- Gas fees ate into small positions\n- One protocol got exploited (lost $500)\n\n**Current portfolio:**\n- 40% stablecoin farms\n- 30% ETH-based pairs\n- 20% single-asset staking\n- 10% experimental/new protocols\n\n**Net result:** +$1,200 (24% gain)\n\nNot financial advice! Always DYOR and only invest what you can afford to lose.\n\nWhat strategies have worked for you?",
    type: "text",
    tags: ["defi", "yield-farming", "crypto"]
  },
  {
    title: "Ethereum's Energy Usage After The Merge 🌱",
    content: "The numbers are in! Ethereum's energy consumption dropped by ~99.95% after The Merge.\n\n**Before (Proof of Work):**\n- ~112 TWh per year\n- Equivalent to Netherlands' energy consumption\n- ~264 kg CO2 per transaction\n\n**After (Proof of Stake):**\n- ~0.0026 TWh per year\n- Equivalent to a small town\n- ~0.084 kg CO2 per transaction\n\nThis is huge for crypto's environmental narrative. Now if only Bitcoin would follow suit... 😅\n\nThoughts on PoS vs PoW trade-offs?",
    type: "text",
    tags: ["ethereum", "environment", "proof-of-stake"]
  }
];

const creativePosts = [
  {
    title: "My latest NFT collection: 'Digital Dreams' ✨",
    content: "Just dropped my new NFT collection exploring the intersection of dreams and digital reality!\n\n🎨 **Concept**: Each piece represents a different type of dream - lucid, recurring, nightmares, prophetic\n\n🖼️ **Style**: Mixed media combining 3D modeling, hand-drawn elements, and AI-generated textures\n\n💎 **Tech**: Minted on Polygon for lower gas fees\n\n🔥 **Editions**: 100 unique pieces, no rarities - every dream is special\n\nThis collection took 3 months to complete. Each piece tells a story about our relationship with technology and consciousness.\n\nCheck it out and let me know what you think! Which type of dreams do you remember most?",
    type: "image",
    url: "https://opensea.io/collection/digital-dreams",
    tags: ["nft", "art", "digital"]
  },
  {
    title: "Free Figma UI Kit: Mobile App Components 📱",
    content: "Created a comprehensive mobile UI kit and decided to share it with the community for free!\n\n**What's included:**\n- 150+ components\n- Dark and light themes\n- Auto-layout enabled\n- Multiple device sizes\n- Icon library (200+ icons)\n- Typography system\n\n**Use cases:**\n- Mobile app prototyping\n- Design system foundation\n- Learning component design\n- Client presentations\n\nLink in comments! Hope this helps fellow designers. Feel free to modify and share your creations!\n\n*Please credit if you use it commercially* 🙏",
    type: "link",
    url: "https://figma.com/community/file/mobile-ui-kit",
    tags: ["design", "figma", "mobile", "free"]
  }
];

const generalPosts = [
  {
    title: "Welcome new members! Introduce yourself here 👋",
    content: "Hey everyone! Seeing lots of new faces joining our community lately - welcome!\n\nFeel free to introduce yourself in the comments:\n- What brings you to CRYB?\n- What communities are you most excited about?\n- Any hobbies or interests you'd like to share?\n\nWe're a friendly bunch here, so don't be shy! Looking forward to getting to know you all.\n\n**Community Guidelines Reminder:**\n- Be kind and respectful\n- Stay on topic\n- Help newcomers feel welcome\n- Share knowledge and experiences\n\nLet's make this the best community platform out there! 🚀",
    type: "text",
    tags: ["welcome", "community", "introductions"]
  },
  {
    title: "CRYB Platform Updates - What's New This Month 📈",
    content: "Exciting updates this month! Here's what the team has been working on:\n\n**New Features:**\n✅ Enhanced mobile app with better performance\n✅ Improved search functionality\n✅ Real-time notifications system\n✅ Community analytics for moderators\n\n**Bug Fixes:**\n🐛 Fixed image upload issues\n🐛 Resolved notification delays\n🐛 Better handling of long posts\n\n**Coming Soon:**\n🔜 Voice channels (beta testing soon!)\n🔜 Advanced moderation tools\n🔜 Cryptocurrency tipping\n🔜 NFT profile pictures\n\n**Community Stats:**\n- 10,000+ active users\n- 500+ communities\n- 50,000+ posts\n- 200,000+ comments\n\nThanks for being part of this amazing community! Feedback and suggestions always welcome.",
    type: "text",
    tags: ["updates", "platform", "announcement"]
  }
];

const comments = [
  "This is exactly what I was looking for! Thanks for sharing.",
  "Great post! I've had similar experiences.",
  "Really helpful insights. Bookmarked for later reference.",
  "Thanks for the detailed breakdown. Very educational!",
  "Love this! Keep up the great work.",
  "Interesting perspective. I hadn't thought about it that way.",
  "This deserves more upvotes. Excellent content!",
  "Can you share more details about this?",
  "I've been wondering about this exact topic. Perfect timing!",
  "This is why I love this community. Such quality content.",
  "Amazing work! How long did this take you?",
  "Super useful! Sharing this with my team.",
  "This changed my perspective completely. Thank you!",
  "I tried something similar and got different results. Interesting!",
  "Would love to see a follow-up post on this topic.",
  "This is going in my saved posts. Great resource!",
  "Exactly the kind of content we need more of here.",
  "Thanks for taking the time to write this up!",
  "This is incredibly detailed. Must have taken hours to write.",
  "Brilliant! I'm definitely going to try this approach."
];

// Utility functions
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function makeRequest(endpoint, options = {}) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': API_TOKEN ? `Bearer ${API_TOKEN}` : '',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { response, data, status: response.status };
  } catch (error) {
    return { error: error.message, status: 0 };
  }
}

async function createSampleUsers() {
  log('Creating sample users...', 'blue');
  
  for (const userData of sampleUsers) {
    try {
      const result = await makeRequest('/api/v1/admin/create-content', {
        method: 'POST',
        body: JSON.stringify({
          authorUsername: userData.username,
          communityName: 'general',
          communityDisplayName: 'General Discussion',
          postTitle: `Hello from ${userData.displayName}!`,
          postContent: `Hi everyone! I'm ${userData.displayName}. ${userData.bio}\n\nLooking forward to connecting with fellow enthusiasts!`
        })
      });
      
      if (result.data?.success) {
        log(`✅ Created user: ${userData.username}`, 'green');
      } else {
        log(`❌ Failed to create user: ${userData.username}`, 'red');
      }
    } catch (error) {
      log(`❌ Error creating user ${userData.username}: ${error.message}`, 'red');
    }
  }
}

async function createPosts() {
  log('Creating sample posts...', 'blue');
  
  const postCategories = [
    { posts: gamingPosts, community: 'gaming', communityName: 'Gaming Central' },
    { posts: technologyPosts, community: 'technology', communityName: 'Tech Talk' },
    { posts: cryptoPosts, community: 'crypto', communityName: 'Crypto & DeFi' },
    { posts: creativePosts, community: 'creative', communityName: 'Creative Corner' },
    { posts: generalPosts, community: 'general', communityName: 'General Discussion' }
  ];
  
  for (const category of postCategories) {
    for (const post of category.posts) {
      try {
        const author = randomChoice(sampleUsers);
        
        const result = await makeRequest('/api/v1/admin/create-content', {
          method: 'POST',
          body: JSON.stringify({
            communityName: category.community,
            communityDisplayName: category.communityName,
            postTitle: post.title,
            postContent: post.content,
            postType: post.type || 'text',
            postUrl: post.url,
            authorUsername: author.username
          })
        });
        
        if (result.data?.success) {
          log(`✅ Created post: ${post.title.substring(0, 50)}...`, 'green');
          
          // Add some comments to the post
          await createCommentsForPost(result.data.data.post.id);
        } else {
          log(`❌ Failed to create post: ${post.title}`, 'red');
        }
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        log(`❌ Error creating post: ${error.message}`, 'red');
      }
    }
  }
}

async function createCommentsForPost(postId) {
  const numComments = randomInt(2, 8);
  
  for (let i = 0; i < numComments; i++) {
    try {
      const author = randomChoice(sampleUsers);
      const commentText = randomChoice(comments);
      
      const result = await makeRequest('/api/v1/comments', {
        method: 'POST',
        body: JSON.stringify({
          postId,
          content: commentText
        })
      });
      
      if (result.data?.success) {
        log(`  💬 Added comment to post`, 'cyan');
      }
    } catch (error) {
      // Silently fail for comments
    }
  }
}

async function generateSampleVotes() {
  log('Generating sample votes...', 'blue');
  
  try {
    // Get all posts
    const postsResult = await makeRequest('/api/v1/posts?limit=100');
    if (!postsResult.data?.success) return;
    
    const posts = postsResult.data.data.items;
    
    for (const post of posts) {
      // Generate random votes
      const numVotes = randomInt(5, 50);
      
      for (let i = 0; i < numVotes; i++) {
        const author = randomChoice(sampleUsers);
        const voteType = Math.random() > 0.2 ? 'up' : 'down'; // 80% upvotes
        
        try {
          await makeRequest(`/api/v1/posts/${post.id}/vote`, {
            method: 'POST',
            body: JSON.stringify({ value: voteType === 'up' ? 1 : -1 })
          });
        } catch (error) {
          // Silently fail for votes
        }
      }
    }
    
    log('✅ Generated sample votes', 'green');
  } catch (error) {
    log(`❌ Error generating votes: ${error.message}`, 'red');
  }
}

async function displayStats() {
  log('\n📊 Platform Statistics:', 'bold');
  log('========================', 'cyan');
  
  try {
    const statsResult = await makeRequest('/api/v1/admin/stats');
    if (statsResult.data?.success) {
      const stats = statsResult.data.data;
      log(`👥 Users: ${stats.users}`, 'yellow');
      log(`🏘️  Communities: ${stats.communities}`, 'yellow');
      log(`📝 Posts: ${stats.posts}`, 'yellow');
      log(`💬 Comments: ${stats.comments}`, 'yellow');
      log(`📈 Engagement Rate: ${stats.engagementRate}%`, 'yellow');
    }
  } catch (error) {
    log(`❌ Error getting stats: ${error.message}`, 'red');
  }
}

async function main() {
  log('🚀 Starting Sample Content Generation...', 'bold');
  log('=' .repeat(60), 'cyan');
  
  // Check if we can connect to the API
  try {
    const healthCheck = await makeRequest('/api/v1/health');
    if (!healthCheck.data) {
      log('❌ Cannot connect to API. Is the server running?', 'red');
      process.exit(1);
    }
  } catch (error) {
    log('❌ Cannot connect to API. Is the server running?', 'red');
    process.exit(1);
  }
  
  try {
    // Step 1: Create sample users
    await createSampleUsers();
    log('');
    
    // Step 2: Create sample posts
    await createPosts();
    log('');
    
    // Step 3: Generate votes
    await generateSampleVotes();
    log('');
    
    // Step 4: Display final stats
    await displayStats();
    
    log('\n🎉 Sample content generation completed!', 'bold');
    log('The platform now has realistic sample data for testing and demonstration.', 'green');
    
  } catch (error) {
    log(`❌ Error during content generation: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  log('Sample Content Generator for CRYB Platform', 'bold');
  log('');
  log('Usage:', 'yellow');
  log('  node generate-sample-content.js [options]', 'cyan');
  log('');
  log('Options:', 'yellow');
  log('  --help, -h     Show this help message', 'cyan');
  log('  --stats        Show current platform statistics only', 'cyan');
  log('');
  log('Environment Variables:', 'yellow');
  log('  API_URL        Base URL of the API (default: http://localhost:3002)', 'cyan');
  log('  ADMIN_TOKEN    Admin authentication token', 'cyan');
  process.exit(0);
}

if (args.includes('--stats')) {
  displayStats().then(() => process.exit(0));
} else {
  main();
}

module.exports = {
  createSampleUsers,
  createPosts,
  generateSampleVotes,
  displayStats
};