#!/usr/bin/env ts-node

/**
 * CRYB Platform Comprehensive Seed Data Script
 * 
 * This script populates the database with realistic demo content to showcase
 * all platform features including:
 * - Users with diverse profiles
 * - Communities and Discord-style servers
 * - Posts and comments with engagement
 * - Messages and chat history
 * - Friend relationships and social connections
 * - Voting patterns and interactions
 * 
 * The script is idempotent and can be run multiple times safely.
 */

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// Configuration
const SEED_CONFIG = {
  users: 60,
  communities: 12,
  servers: 8,
  postsPerCommunity: 15,
  commentsPerPost: 8,
  messagesPerChannel: 25,
  friendshipProbability: 0.15,
  voteProbability: 0.7,
  reactionProbability: 0.4,
};

// Sample data for realistic content
const TECH_COMMUNITIES = [
  {
    name: 'webdev',
    displayName: 'Web Development',
    description: 'A community for web developers to share knowledge, ask questions, and showcase projects. From frontend frameworks to backend architectures.',
    rules: [
      'Be respectful and constructive in discussions',
      'Search before posting to avoid duplicates',
      'Include relevant code snippets when asking for help',
      'No spam or self-promotion without value',
      'Keep discussions on-topic'
    ],
    isNsfw: false
  },
  {
    name: 'javascript',
    displayName: 'JavaScript',
    description: 'The definitive community for JavaScript developers. ES6+, Node.js, frameworks, libraries, and everything JS.',
    rules: [
      'Follow community guidelines for posting',
      'Use code blocks for code snippets',
      'Be patient with beginners',
      'No off-topic discussions'
    ],
    isNsfw: false
  },
  {
    name: 'programming',
    displayName: 'Programming',
    description: 'General programming discussion, career advice, and coding challenges across all languages and technologies.',
    rules: [
      'Keep discussions programming-related',
      'Be helpful and encouraging',
      'No homework dumps',
      'Credit sources when sharing content'
    ],
    isNsfw: false
  },
  {
    name: 'gamedev',
    displayName: 'Game Development',
    description: 'For indie game developers, hobbyists, and professionals. Share your games, get feedback, and learn from the community.',
    rules: [
      'Feedback Friday threads for showcasing work',
      'No excessive self-promotion',
      'Constructive criticism only',
      'Tag posts appropriately'
    ],
    isNsfw: false
  }
];

const GAMING_COMMUNITIES = [
  {
    name: 'gaming',
    displayName: 'Gaming',
    description: 'The largest gaming community on CRYB. Discuss games, share highlights, and connect with fellow gamers.',
    rules: [
      'No spoilers without proper tags',
      'Be respectful of different gaming preferences',
      'No piracy discussions',
      'Keep memes gaming-related'
    ],
    isNsfw: false
  },
  {
    name: 'indiegames',
    displayName: 'Indie Games',
    description: 'Discover and discuss independent games. Support indie developers and find your next favorite game.',
    rules: [
      'Developers welcome to share their work',
      'Honest reviews and feedback encouraged',
      'No hate speech or toxicity',
      'Support the indie community'
    ],
    isNsfw: false
  }
];

const CREATIVE_COMMUNITIES = [
  {
    name: 'digitalart',
    displayName: 'Digital Art',
    description: 'Showcase your digital artwork, get feedback, and learn new techniques. All skill levels welcome.',
    rules: [
      'Original content only',
      'Constructive criticism welcome',
      'Credit sources for tutorials/references',
      'No NSFW content without proper tags'
    ],
    isNsfw: false
  },
  {
    name: 'music',
    displayName: 'Music',
    description: 'Share your music, discover new artists, and discuss everything music-related.',
    rules: [
      'Original music encouraged',
      'Respect copyright when sharing',
      'Be supportive of new artists',
      'No spam or excessive self-promotion'
    ],
    isNsfw: false
  }
];

const GENERAL_COMMUNITIES = [
  {
    name: 'help',
    displayName: 'Help & Support',
    description: 'Get help with platform features, report bugs, and receive technical support from the community.',
    rules: [
      'Search existing posts before asking',
      'Provide clear descriptions of issues',
      'Be patient with support staff',
      'No bug exploitation discussions'
    ],
    isNsfw: false
  },
  {
    name: 'announcements',
    displayName: 'Announcements',
    description: 'Official platform announcements, updates, and important community news.',
    rules: [
      'Official announcements only',
      'Read pinned posts for important updates',
      'Ask questions in dedicated threads',
      'No off-topic discussions'
    ],
    isNsfw: false
  },
  {
    name: 'feedback',
    displayName: 'Feedback',
    description: 'Share your thoughts on platform features, suggest improvements, and help shape the future of CRYB.',
    rules: [
      'Constructive feedback only',
      'Search for existing suggestions',
      'Explain your reasoning clearly',
      'Vote on others suggestions'
    ],
    isNsfw: false
  },
  {
    name: 'crypto',
    displayName: 'Cryptocurrency',
    description: 'Discuss blockchain technology, DeFi, NFTs, and the future of decentralized finance.',
    rules: [
      'No financial advice',
      'Verify information before sharing',
      'Respectful debate encouraged',
      'No pump and dump schemes'
    ],
    isNsfw: false
  }
];

// Sample post content by community type
const POST_TEMPLATES = {
  webdev: [
    {
      title: "Building a Real-time Chat App with WebSockets",
      content: "Just finished building a real-time chat application using Socket.io and Express. The performance is incredible! Here's what I learned about scaling WebSocket connections...",
      type: "text"
    },
    {
      title: "CSS Grid vs Flexbox: When to Use Which?",
      content: "After working with both CSS Grid and Flexbox for years, I've developed some guidelines for when to use each. Here's my take on the grid vs flex debate...",
      type: "text"
    },
    {
      title: "My React Performance Optimization Journey",
      content: "Spent the last month optimizing a large React app. Reduced bundle size by 40% and improved load times by 60%. Here are the techniques that made the biggest difference...",
      type: "text"
    }
  ],
  gaming: [
    {
      title: "Just finished Baldur's Gate 3 - What a masterpiece!",
      content: "After 120 hours, I finally completed my first playthrough. The storytelling, character development, and choice consequences are phenomenal. Already planning my second run...",
      type: "text"
    },
    {
      title: "Looking for co-op partners for Deep Rock Galactic",
      content: "Any miners want to team up for some Hazard 4+ missions? I'm a Scout main but can play any class. Let's mine some precious materials and leave no dwarf behind!",
      type: "text"
    },
    {
      title: "Indie game recommendation: Pizza Tower",
      content: "If you haven't played Pizza Tower yet, you're missing out on one of the best platformers in years. The animation, music, and gameplay are all top-tier...",
      type: "text"
    }
  ],
  programming: [
    {
      title: "Why I switched from VS Code to Neovim",
      content: "After 5 years with VS Code, I made the jump to Neovim. Here's why I switched and how the transition went. Spoiler: I'm never going back...",
      type: "text"
    },
    {
      title: "Learning Rust: My 30-day journey",
      content: "Decided to learn Rust and challenged myself to build something useful in 30 days. Here's what I built and what I learned about the language...",
      type: "text"
    },
    {
      title: "Career advice: From bootcamp to senior dev in 3 years",
      content: "Three years ago I was in a completely different field. Today I'm a senior software engineer. Here's the path I took and advice for others considering the switch...",
      type: "text"
    }
  ]
};

// User personas for realistic profiles
const USER_PERSONAS = [
  {
    type: 'developer',
    bio: () => `Full-stack developer passionate about ${faker.helpers.arrayElement(['React', 'Vue', 'Angular', 'Node.js', 'Python', 'Go', 'Rust'])}. ${faker.helpers.arrayElement(['Building the future of web3', 'Love clean code and good coffee', 'Open source contributor', 'Always learning new technologies'])}.`,
    interests: ['programming', 'webdev', 'javascript']
  },
  {
    type: 'gamer',
    bio: () => `Avid gamer and ${faker.helpers.arrayElement(['streamer', 'content creator', 'esports enthusiast', 'indie game lover'])}. Currently playing ${faker.helpers.arrayElement(['Baldur\'s Gate 3', 'Cyberpunk 2077', 'Deep Rock Galactic', 'Hades', 'Hollow Knight'])}.`,
    interests: ['gaming', 'indiegames']
  },
  {
    type: 'artist',
    bio: () => `Digital artist specializing in ${faker.helpers.arrayElement(['character design', 'concept art', 'pixel art', 'illustrations', '3D modeling'])}. Commission work available!`,
    interests: ['digitalart', 'gamedev']
  },
  {
    type: 'creator',
    bio: () => `Content creator focused on ${faker.helpers.arrayElement(['tech tutorials', 'game reviews', 'art process videos', 'music production'])}. Always collaborating with the community.`,
    interests: ['music', 'digitalart', 'gaming']
  },
  {
    type: 'entrepreneur',
    bio: () => `Building the next big thing in ${faker.helpers.arrayElement(['fintech', 'web3', 'gaming', 'social media'])}. Love connecting with other founders and sharing insights.`,
    interests: ['crypto', 'programming', 'feedback']
  }
];

// Comment templates for realistic engagement
const COMMENT_TEMPLATES = [
  "This is exactly what I needed! Thanks for sharing.",
  "Great explanation! Have you considered trying {alternative}?",
  "I had the same issue and solved it by {solution}. Hope this helps!",
  "Awesome work! The {feature} part is particularly well done.",
  "This brings back memories from when I first started learning {topic}.",
  "Thanks for the detailed write-up. Bookmarked for later reference!",
  "I disagree with {point}. Here's my perspective...",
  "Can you share more details about {specific_aspect}?",
  "This is why I love this community. Such helpful people!",
  "Have you open-sourced this? Would love to contribute!",
  "Really inspiring work! How long did this take you to build?",
  "I'm working on something similar. Mind if I DM you with questions?"
];

// Utility functions
function generateId(): string {
  return crypto.randomBytes(12).toString('hex');
}

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function shouldGenerate(probability: number): boolean {
  return Math.random() < probability;
}

// Data generation functions
async function generateUsers(): Promise<any[]> {
  console.log(`🎭 Generating ${SEED_CONFIG.users} users...`);
  
  const users = [];
  
  for (let i = 0; i < SEED_CONFIG.users; i++) {
    const persona = randomElement(USER_PERSONAS);
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const username = faker.internet.userName({ firstName, lastName }).toLowerCase();
    
    const user = {
      id: generateId(),
      username: username,
      discriminator: faker.string.numeric(4),
      displayName: `${firstName} ${lastName}`,
      email: faker.internet.email({ firstName, lastName }),
      bio: persona.bio(),
      avatar: faker.image.avatar(),
      isVerified: faker.datatype.boolean({ probability: 0.1 }),
      premiumType: randomElement(['NONE', 'NONE', 'NONE', 'NITRO_CLASSIC', 'NITRO']),
      createdAt: faker.date.between({ 
        from: new Date('2023-01-01'), 
        to: new Date() 
      }),
      lastSeenAt: faker.date.recent({ days: 7 }),
    };
    
    users.push(user);
  }
  
  return users;
}

async function generateCommunities(): Promise<any[]> {
  console.log(`🏘️ Generating ${SEED_CONFIG.communities} communities...`);
  
  const allCommunities = [
    ...TECH_COMMUNITIES,
    ...GAMING_COMMUNITIES,
    ...CREATIVE_COMMUNITIES,
    ...GENERAL_COMMUNITIES
  ];
  
  return allCommunities.map(community => ({
    id: generateId(),
    name: community.name,
    displayName: community.displayName,
    description: community.description,
    rules: community.rules,
    isPublic: true,
    isNsfw: community.isNsfw,
    icon: faker.image.url({ width: 256, height: 256 }),
    banner: faker.image.url({ width: 1200, height: 400 }),
    memberCount: 0, // Will be updated after creating members
    createdAt: faker.date.between({ 
      from: new Date('2023-01-01'), 
      to: new Date() 
    }),
  }));
}

async function generateServers(users: any[]): Promise<any[]> {
  console.log(`🖥️ Generating ${SEED_CONFIG.servers} Discord-style servers...`);
  
  const serverTemplates = [
    {
      name: "CRYB Developers",
      description: "Official community for CRYB platform developers",
      features: ["COMMUNITY", "NEWS", "DISCOVERABLE"]
    },
    {
      name: "Web3 Gaming Hub",
      description: "The ultimate destination for blockchain gaming enthusiasts",
      features: ["COMMUNITY", "GAMING", "VOICE_CHANNELS"]
    },
    {
      name: "Indie Game Makers",
      description: "Connect with fellow indie game developers and publishers",
      features: ["COMMUNITY", "DEVELOPER_SUPPORT", "SHOWCASE"]
    },
    {
      name: "Digital Artists Collective",
      description: "Share your art, get feedback, and collaborate with artists",
      features: ["COMMUNITY", "ART_SHOWCASE", "FEEDBACK"]
    },
    {
      name: "DeFi Discussions",
      description: "Deep dives into decentralized finance and crypto",
      features: ["COMMUNITY", "FINANCE", "EDUCATION"]
    },
    {
      name: "Code Review Café",
      description: "Get your code reviewed and help others improve theirs",
      features: ["COMMUNITY", "CODE_REVIEW", "MENTORSHIP"]
    },
    {
      name: "Music Producers Unite",
      description: "For producers, musicians, and audio enthusiasts",
      features: ["COMMUNITY", "MUSIC", "COLLABORATION"]
    },
    {
      name: "Startup Founders",
      description: "Connect with entrepreneurs building the next big thing",
      features: ["COMMUNITY", "NETWORKING", "INVESTOR_RELATIONS"]
    }
  ];
  
  return serverTemplates.map(template => ({
    id: generateId(),
    name: template.name,
    description: template.description,
    ownerId: randomElement(users).id,
    icon: faker.image.url({ width: 256, height: 256 }),
    banner: faker.image.url({ width: 1200, height: 400 }),
    features: template.features,
    verificationLevel: faker.number.int({ min: 0, max: 4 }),
    isPublic: true,
    maxMembers: faker.number.int({ min: 1000, max: 100000 }),
    createdAt: faker.date.between({ 
      from: new Date('2023-01-01'), 
      to: new Date() 
    }),
  }));
}

async function generateChannelsForServers(servers: any[]): Promise<any[]> {
  console.log(`📺 Generating channels for servers...`);
  
  const channels = [];
  
  for (const server of servers) {
    // Create category channels first
    const generalCategory = {
      id: generateId(),
      serverId: server.id,
      name: "General",
      type: "GUILD_CATEGORY",
      position: 0,
      createdAt: server.createdAt,
    };
    
    const voiceCategory = {
      id: generateId(),
      serverId: server.id,
      name: "Voice Channels",
      type: "GUILD_CATEGORY",
      position: 1,
      createdAt: server.createdAt,
    };
    
    channels.push(generalCategory, voiceCategory);
    
    // Create text channels
    const textChannels = [
      { name: "general", description: "General discussion" },
      { name: "announcements", description: "Important server announcements" },
      { name: "introductions", description: "Introduce yourself to the community" },
      { name: "help", description: "Get help and support" },
      { name: "showcase", description: "Show off your work" },
      { name: "random", description: "Random discussions and off-topic chat" }
    ];
    
    textChannels.forEach((channel, index) => {
      channels.push({
        id: generateId(),
        serverId: server.id,
        name: channel.name,
        description: channel.description,
        type: "GUILD_TEXT",
        parentId: generalCategory.id,
        position: index,
        createdAt: faker.date.between({ 
          from: server.createdAt, 
          to: new Date() 
        }),
      });
    });
    
    // Create voice channels
    const voiceChannels = [
      { name: "General Voice", userLimit: null },
      { name: "Study Room", userLimit: 8 },
      { name: "Gaming Session", userLimit: 12 },
      { name: "Music Listening Party", userLimit: 20 }
    ];
    
    voiceChannels.forEach((channel, index) => {
      channels.push({
        id: generateId(),
        serverId: server.id,
        name: channel.name,
        type: "GUILD_VOICE",
        parentId: voiceCategory.id,
        position: index,
        userLimit: channel.userLimit,
        bitrate: 64000,
        rtcRegion: "us-east",
        createdAt: faker.date.between({ 
          from: server.createdAt, 
          to: new Date() 
        }),
      });
    });
  }
  
  return channels;
}

async function generatePosts(communities: any[], users: any[]): Promise<any[]> {
  console.log(`📝 Generating posts...`);
  
  const posts = [];
  
  for (const community of communities) {
    const templates = (POST_TEMPLATES as any)[community.name] || POST_TEMPLATES['programming'];
    
    for (let i = 0; i < SEED_CONFIG.postsPerCommunity; i++) {
      const template = randomElement(templates);
      const author = randomElement(users);
      
      const post = {
        id: generateId(),
        communityId: community.id,
        userId: author.id,
        title: (template as any).title,
        content: (template as any).content,
        flair: randomElement(['Discussion', 'Help', 'Showcase', 'Question', 'Tutorial', null]),
        score: faker.number.int({ min: -5, max: 500 }),
        viewCount: faker.number.int({ min: 10, max: 2000 }),
        commentCount: 0, // Will be updated after creating comments
        isPinned: faker.datatype.boolean({ probability: 0.05 }),
        nsfw: faker.datatype.boolean({ probability: 0.02 }),
        createdAt: faker.date.between({ 
          from: community.createdAt, 
          to: new Date() 
        }),
      };
      
      posts.push(post);
    }
  }
  
  return posts;
}

async function generateComments(posts: any[], users: any[]): Promise<any[]> {
  console.log(`💬 Generating comments...`);
  
  const comments = [];
  
  for (const post of posts) {
    const numComments = faker.number.int({ min: 2, max: SEED_CONFIG.commentsPerPost });
    
    // Generate top-level comments
    for (let i = 0; i < numComments; i++) {
      const author = randomElement(users);
      const template = randomElement(COMMENT_TEMPLATES);
      
      const comment = {
        id: generateId(),
        postId: post.id,
        userId: author.id,
        parentId: null,
        content: template,
        score: faker.number.int({ min: -2, max: 50 }),
        createdAt: faker.date.between({ 
          from: post.createdAt, 
          to: new Date() 
        }),
      };
      
      comments.push(comment);
      
      // Generate replies (30% chance for each comment)
      if (shouldGenerate(0.3)) {
        const numReplies = faker.number.int({ min: 1, max: 3 });
        
        for (let j = 0; j < numReplies; j++) {
          const replyAuthor = randomElement(users);
          const replyTemplate = randomElement(COMMENT_TEMPLATES);
          
          const reply = {
            id: generateId(),
            postId: post.id,
            userId: replyAuthor.id,
            parentId: comment.id,
            content: replyTemplate,
            score: faker.number.int({ min: 0, max: 20 }),
            createdAt: faker.date.between({ 
              from: comment.createdAt, 
              to: new Date() 
            }),
          };
          
          comments.push(reply);
        }
      }
    }
  }
  
  return comments;
}

async function generateMessages(channels: any[], users: any[]): Promise<any[]> {
  console.log(`💌 Generating messages...`);
  
  const messages = [];
  const textChannels = channels.filter(c => c.type === 'GUILD_TEXT');
  
  for (const channel of textChannels) {
    const channelMembers = randomElements(users, faker.number.int({ min: 5, max: 20 }));
    
    for (let i = 0; i < SEED_CONFIG.messagesPerChannel; i++) {
      const author = randomElement(channelMembers);
      
      const messageContent = faker.helpers.arrayElement([
        "Hey everyone! How's your day going?",
        "Just pushed a new feature to production. Everything looks good! 🚀",
        "Anyone else working on something cool this week?",
        "Check out this awesome article I found: " + faker.internet.url(),
        "Quick question - has anyone used " + faker.helpers.arrayElement(['React', 'Vue', 'Svelte', 'Angular']) + " for this type of project?",
        "Good morning! ☀️ Ready to tackle some code today!",
        "Found an interesting bug today. Took me 3 hours to realize I forgot a semicolon 😅",
        "Coffee ☕ + Code 💻 = Perfect morning",
        "Working on a new project. Will share updates soon!",
        "Thanks for all the help yesterday, really appreciate this community! ❤️"
      ]);
      
      const message = {
        id: generateId(),
        channelId: channel.id,
        userId: author.id,
        content: messageContent,
        timestamp: faker.date.between({ 
          from: channel.createdAt, 
          to: new Date() 
        }),
        tts: false,
        mentionEveryone: faker.datatype.boolean({ probability: 0.01 }),
        isPinned: faker.datatype.boolean({ probability: 0.02 }),
      };
      
      messages.push(message);
    }
  }
  
  return messages;
}

async function generateCommunityMemberships(communities: any[], users: any[]): Promise<any[]> {
  console.log(`👥 Generating community memberships...`);
  
  const memberships = [];
  
  for (const community of communities) {
    // Each community gets 20-80% of users as members
    const memberCount = faker.number.int({ 
      min: Math.floor(users.length * 0.2), 
      max: Math.floor(users.length * 0.8) 
    });
    
    const members = randomElements(users, memberCount);
    
    for (const user of members) {
      memberships.push({
        id: generateId(),
        communityId: community.id,
        userId: user.id,
        karma: faker.number.int({ min: 0, max: 1000 }),
        joinedAt: faker.date.between({ 
          from: community.createdAt, 
          to: new Date() 
        }),
      });
    }
  }
  
  return memberships;
}

async function generateServerMemberships(servers: any[], users: any[]): Promise<any[]> {
  console.log(`👥 Generating server memberships...`);
  
  const memberships = [];
  
  for (const server of servers) {
    // Each server gets 15-60% of users as members
    const memberCount = faker.number.int({ 
      min: Math.floor(users.length * 0.15), 
      max: Math.floor(users.length * 0.6) 
    });
    
    const members = randomElements(users, memberCount);
    
    for (const user of members) {
      memberships.push({
        id: generateId(),
        serverId: server.id,
        userId: user.id,
        nickname: faker.datatype.boolean({ probability: 0.3 }) ? faker.person.firstName() : null,
        joinedAt: faker.date.between({ 
          from: server.createdAt, 
          to: new Date() 
        }),
      });
    }
  }
  
  return memberships;
}

async function generateVotes(posts: any[], comments: any[], users: any[]): Promise<any[]> {
  console.log(`🗳️ Generating votes...`);
  
  const votes = [];
  
  // Generate votes for posts
  for (const post of posts) {
    const voterCount = faker.number.int({ min: 5, max: 50 });
    const voters = randomElements(users, voterCount);
    
    for (const voter of voters) {
      if (voter.id !== post.userId) { // Users can't vote on their own posts
        votes.push({
          id: generateId(),
          userId: voter.id,
          postId: post.id,
          commentId: null,
          value: faker.helpers.weightedArrayElement([
            { weight: 8, value: 1 },   // Upvote
            { weight: 1, value: -1 },  // Downvote
          ]),
          createdAt: faker.date.between({ 
            from: post.createdAt, 
            to: new Date() 
          }),
        });
      }
    }
  }
  
  // Generate votes for comments
  for (const comment of comments) {
    if (shouldGenerate(SEED_CONFIG.voteProbability)) {
      const voterCount = faker.number.int({ min: 1, max: 10 });
      const voters = randomElements(users, voterCount);
      
      for (const voter of voters) {
        if (voter.id !== comment.userId) { // Users can't vote on their own comments
          votes.push({
            id: generateId(),
            userId: voter.id,
            postId: null,
            commentId: comment.id,
            value: faker.helpers.weightedArrayElement([
              { weight: 7, value: 1 },   // Upvote
              { weight: 1, value: -1 },  // Downvote
            ]),
            createdAt: faker.date.between({ 
              from: comment.createdAt, 
              to: new Date() 
            }),
          });
        }
      }
    }
  }
  
  return votes;
}

async function generateFriendships(users: any[]): Promise<any[]> {
  console.log(`🤝 Generating friendships...`);
  
  const friendships: any[] = [];
  
  for (const user of users) {
    // Each user has a chance to send friend requests
    const potentialFriends = users.filter(u => u.id !== user.id);
    const friendCount = faker.number.int({ min: 0, max: 8 });
    const friends = randomElements(potentialFriends, friendCount);
    
    for (const friend of friends) {
      // Check if friendship already exists in either direction
      const exists = friendships.some((f: any) => 
        (f.initiatorId === user.id && f.receiverId === friend.id) ||
        (f.initiatorId === friend.id && f.receiverId === user.id)
      );
      
      if (!exists) {
        friendships.push({
          id: generateId(),
          initiatorId: user.id,
          receiverId: friend.id,
          status: faker.helpers.weightedArrayElement([
            { weight: 8, value: 'ACCEPTED' },
            { weight: 1, value: 'PENDING' },
          ]),
          createdAt: faker.date.between({ 
            from: user.createdAt, 
            to: new Date() 
          }),
        });
      }
    }
  }
  
  return friendships;
}

async function generateReactions(messages: any[], users: any[]): Promise<any[]> {
  console.log(`😊 Generating reactions...`);
  
  const reactions = [];
  const emojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '🎉', '💯', '👀'];
  
  for (const message of messages) {
    if (shouldGenerate(SEED_CONFIG.reactionProbability)) {
      const reactionCount = faker.number.int({ min: 1, max: 5 });
      const reactors = randomElements(users, reactionCount);
      
      for (const reactor of reactors) {
        if (reactor.id !== message.userId) { // Users can't react to their own messages
          reactions.push({
            id: generateId(),
            messageId: message.id,
            userId: reactor.id,
            emoji: randomElement(emojis),
            createdAt: faker.date.between({ 
              from: message.timestamp, 
              to: new Date() 
            }),
          });
        }
      }
    }
  }
  
  return reactions;
}

// Main seeding function
async function seedDatabase() {
  console.log('🌱 Starting CRYB Platform database seeding...\n');
  
  try {
    // Clear existing data (idempotent)
    console.log('🧹 Cleaning existing seed data...');
    await prisma.reaction.deleteMany();
    await prisma.vote.deleteMany();
    await prisma.friendship.deleteMany();
    await prisma.serverMember.deleteMany();
    await prisma.communityMember.deleteMany();
    await prisma.message.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
    await prisma.channel.deleteMany();
    await prisma.server.deleteMany();
    await prisma.community.deleteMany();
    await prisma.user.deleteMany();
    
    // Generate all data
    const users = await generateUsers();
    const communities = await generateCommunities();
    const servers = await generateServers(users);
    const channels = await generateChannelsForServers(servers);
    const posts = await generatePosts(communities, users);
    const comments = await generateComments(posts, users);
    const messages = await generateMessages(channels, users);
    const communityMemberships = await generateCommunityMemberships(communities, users);
    const serverMemberships = await generateServerMemberships(servers, users);
    const votes = await generateVotes(posts, comments, users);
    const friendships = await generateFriendships(users);
    const reactions = await generateReactions(messages, users);
    
    // Insert data into database
    console.log('\n💾 Inserting data into database...');
    
    console.log('  📄 Inserting users...');
    await prisma.user.createMany({ data: users });
    
    console.log('  🏘️ Inserting communities...');
    await prisma.community.createMany({ data: communities });
    
    console.log('  🖥️ Inserting servers...');
    await prisma.server.createMany({ data: servers });
    
    console.log('  📺 Inserting channels...');
    await prisma.channel.createMany({ data: channels });
    
    console.log('  📝 Inserting posts...');
    await prisma.post.createMany({ data: posts });
    
    console.log('  💬 Inserting comments...');
    await prisma.comment.createMany({ data: comments });
    
    console.log('  💌 Inserting messages...');
    await prisma.message.createMany({ data: messages });
    
    console.log('  👥 Inserting community memberships...');
    await prisma.communityMember.createMany({ data: communityMemberships });
    
    console.log('  👥 Inserting server memberships...');
    await prisma.serverMember.createMany({ data: serverMemberships });
    
    console.log('  🗳️ Inserting votes...');
    await prisma.vote.createMany({ data: votes });
    
    console.log('  🤝 Inserting friendships...');
    await prisma.friendship.createMany({ data: friendships });
    
    console.log('  😊 Inserting reactions...');
    await prisma.reaction.createMany({ data: reactions });
    
    // Update calculated fields
    console.log('\n🔄 Updating calculated fields...');
    
    // Update community member counts
    for (const community of communities) {
      const memberCount = communityMemberships.filter(m => m.communityId === community.id).length;
      await prisma.community.update({
        where: { id: community.id },
        data: { memberCount }
      });
    }
    
    // Update post comment counts
    for (const post of posts) {
      const commentCount = comments.filter(c => c.postId === post.id).length;
      await prisma.post.update({
        where: { id: post.id },
        data: { commentCount }
      });
    }
    
    // Generate summary statistics
    const stats = {
      users: users.length,
      communities: communities.length,
      servers: servers.length,
      channels: channels.length,
      posts: posts.length,
      comments: comments.length,
      messages: messages.length,
      communityMemberships: communityMemberships.length,
      serverMemberships: serverMemberships.length,
      votes: votes.length,
      friendships: friendships.length,
      reactions: reactions.length,
    };
    
    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary Statistics:');
    console.log(`  👥 Users: ${stats.users}`);
    console.log(`  🏘️ Communities: ${stats.communities}`);
    console.log(`  🖥️ Servers: ${stats.servers}`);
    console.log(`  📺 Channels: ${stats.channels}`);
    console.log(`  📝 Posts: ${stats.posts}`);
    console.log(`  💬 Comments: ${stats.comments}`);
    console.log(`  💌 Messages: ${stats.messages}`);
    console.log(`  👥 Community Memberships: ${stats.communityMemberships}`);
    console.log(`  👥 Server Memberships: ${stats.serverMemberships}`);
    console.log(`  🗳️ Votes: ${stats.votes}`);
    console.log(`  🤝 Friendships: ${stats.friendships}`);
    console.log(`  😊 Reactions: ${stats.reactions}`);
    
    console.log('\n🎉 Your CRYB platform is now populated with realistic demo content!');
    console.log('🚀 Ready to showcase all the amazing features!\n');
    
  } catch (error) {
    console.error('❌ Error during database seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding script
if (require.main === module) {
  seedDatabase()
    .catch((error) => {
      console.error('Failed to seed database:', error);
      process.exit(1);
    });
}

export { seedDatabase };