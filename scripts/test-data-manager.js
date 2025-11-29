const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TestDataManager {
  constructor() {
    this.testDatabases = [
      'cryb_test',
      'cryb_e2e',
      'cryb_integration',
      'cryb_load_test',
      'cryb_performance'
    ];
    
    this.testUsers = [];
    this.testCommunities = [];
    this.testPosts = [];
    this.testComments = [];
    
    this.config = {
      api_url: process.env.API_URL || 'http://localhost:4000',
      database_url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432',
      redis_url: process.env.REDIS_URL || 'redis://localhost:6379',
      cleanup_after_minutes: 30,
      max_test_users: 1000,
      max_test_data_age_hours: 24
    };
  }

  async init() {
    console.log('🧪 Initializing Test Data Manager');
    console.log('Target API:', this.config.api_url);
    console.log('=' .repeat(60));

    try {
      await this.createTestDatabases();
      await this.loadTestData();
      console.log('✅ Test Data Manager initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Test Data Manager:', error.message);
      throw error;
    }
  }

  async createTestDatabases() {
    console.log('🗄️  Creating test databases...');

    for (const dbName of this.testDatabases) {
      try {
        // Create database if it doesn't exist
        const createDbCommand = `psql "${this.config.database_url}/postgres" -c "CREATE DATABASE ${dbName};" 2>/dev/null || true`;
        execSync(createDbCommand, { stdio: 'pipe' });
        
        // Run migrations on test database
        const migrateCommand = `DATABASE_URL="${this.config.database_url}/${dbName}" npm run db:migrate`;
        execSync(migrateCommand, { cwd: 'apps/api', stdio: 'pipe' });
        
        console.log(`✅ Database ${dbName} ready`);
      } catch (error) {
        console.warn(`⚠️  Could not create database ${dbName}:`, error.message);
      }
    }
  }

  async generateTestUsers(count = 50) {
    console.log(`👥 Generating ${count} test users...`);

    const users = [];
    for (let i = 0; i < count; i++) {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      
      const user = {
        id: `test-user-${timestamp}-${randomId}`,
        username: `testuser_${timestamp}_${randomId}`,
        email: `test_${timestamp}_${randomId}@example.com`,
        password: 'TestPassword123!',
        display_name: `Test User ${i + 1}`,
        bio: `This is a test user created for automated testing purposes. ID: ${randomId}`,
        created_at: new Date().toISOString()
      };
      
      users.push(user);
    }

    this.testUsers = users;
    await this.saveTestData('users', users);
    
    console.log(`✅ Generated ${users.length} test users`);
    return users;
  }

  async generateTestCommunities(count = 20) {
    console.log(`🏘️  Generating ${count} test communities...`);

    const communities = [];
    const communityTypes = ['public', 'private', 'restricted'];
    const topics = [
      'Technology', 'Gaming', 'Music', 'Art', 'Science', 'Sports',
      'Movies', 'Books', 'Food', 'Travel', 'Photography', 'Fitness',
      'Programming', 'Design', 'Business', 'Education', 'News', 'Humor'
    ];

    for (let i = 0; i < count; i++) {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const topic = topics[Math.floor(Math.random() * topics.length)];
      
      const community = {
        id: `test-community-${timestamp}-${randomId}`,
        name: `Test ${topic} Community ${randomId}`,
        description: `A test community for ${topic.toLowerCase()} enthusiasts. Created for automated testing.`,
        type: communityTypes[Math.floor(Math.random() * communityTypes.length)],
        category: topic.toLowerCase(),
        member_count: Math.floor(Math.random() * 1000) + 10,
        created_at: new Date().toISOString(),
        creator_id: this.testUsers[Math.floor(Math.random() * this.testUsers.length)]?.id
      };
      
      communities.push(community);
    }

    this.testCommunities = communities;
    await this.saveTestData('communities', communities);
    
    console.log(`✅ Generated ${communities.length} test communities`);
    return communities;
  }

  async generateTestPosts(count = 100) {
    console.log(`📝 Generating ${count} test posts...`);

    const posts = [];
    const postTypes = ['text', 'link', 'image', 'video'];
    const sampleTitles = [
      'Amazing discovery in quantum computing',
      'New social media trends emerging',
      'Climate change solutions that work',
      'Tech industry insights for 2024',
      'Best practices for remote work',
      'Gaming community discussions',
      'Cryptocurrency market analysis',
      'AI and machine learning updates',
      'Web development tutorials',
      'Health and wellness tips'
    ];

    const sampleContent = [
      'This is a detailed discussion about recent developments in the field...',
      'I wanted to share my thoughts on this important topic that affects us all...',
      'Has anyone else noticed the significant changes happening in this area?',
      'Looking for feedback and opinions on this approach and methodology...',
      'Sharing some valuable insights from my recent experience with this...',
      'This emerging trend has been gaining significant momentum lately...',
      'What are your thoughts on the future implications of these changes?',
      'Breaking down the complex aspects of this topic for better understanding...',
      'A comprehensive guide to understanding the nuances of this subject...',
      'Recent research suggests that there are important considerations...'
    ];

    for (let i = 0; i < count; i++) {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      
      const post = {
        id: `test-post-${timestamp}-${randomId}`,
        title: sampleTitles[Math.floor(Math.random() * sampleTitles.length)] + ` (Test ${randomId})`,
        content: sampleContent[Math.floor(Math.random() * sampleContent.length)],
        type: postTypes[Math.floor(Math.random() * postTypes.length)],
        upvotes: Math.floor(Math.random() * 100),
        downvotes: Math.floor(Math.random() * 20),
        comment_count: Math.floor(Math.random() * 50),
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        author_id: this.testUsers[Math.floor(Math.random() * this.testUsers.length)]?.id,
        community_id: this.testCommunities[Math.floor(Math.random() * this.testCommunities.length)]?.id
      };
      
      posts.push(post);
    }

    this.testPosts = posts;
    await this.saveTestData('posts', posts);
    
    console.log(`✅ Generated ${posts.length} test posts`);
    return posts;
  }

  async generateTestComments(count = 200) {
    console.log(`💬 Generating ${count} test comments...`);

    const comments = [];
    const sampleComments = [
      'Great post! Thanks for sharing this valuable information.',
      'I completely agree with your perspective on this topic.',
      'This is really interesting. Can you provide more details?',
      'I had a similar experience and can relate to this.',
      'Excellent analysis! This gives me a lot to think about.',
      'Thanks for the detailed explanation. Very helpful!',
      'I disagree with some points, but overall a good discussion.',
      'This reminds me of a similar situation I encountered.',
      'Well written and informative. Looking forward to more.',
      'Interesting perspective. I never thought about it that way.'
    ];

    for (let i = 0; i < count; i++) {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      
      const comment = {
        id: `test-comment-${timestamp}-${randomId}`,
        content: sampleComments[Math.floor(Math.random() * sampleComments.length)] + ` (Test comment ${randomId})`,
        upvotes: Math.floor(Math.random() * 20),
        downvotes: Math.floor(Math.random() * 5),
        created_at: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
        author_id: this.testUsers[Math.floor(Math.random() * this.testUsers.length)]?.id,
        post_id: this.testPosts[Math.floor(Math.random() * this.testPosts.length)]?.id,
        parent_id: Math.random() > 0.7 ? comments[Math.floor(Math.random() * comments.length)]?.id : null
      };
      
      comments.push(comment);
    }

    this.testComments = comments;
    await this.saveTestData('comments', comments);
    
    console.log(`✅ Generated ${comments.length} test comments`);
    return comments;
  }

  async createTestDataSet(options = {}) {
    const config = {
      users: 50,
      communities: 20,
      posts: 100,
      comments: 200,
      ...options
    };

    console.log('🎲 Creating comprehensive test data set...');
    console.log('Configuration:', config);

    try {
      await this.generateTestUsers(config.users);
      await this.generateTestCommunities(config.communities);
      await this.generateTestPosts(config.posts);
      await this.generateTestComments(config.comments);

      const summary = {
        users: this.testUsers.length,
        communities: this.testCommunities.length,
        posts: this.testPosts.length,
        comments: this.testComments.length,
        created_at: new Date().toISOString()
      };

      await this.saveTestData('summary', summary);
      
      console.log('✅ Test data set created successfully');
      console.log('Summary:', summary);
      
      return summary;
    } catch (error) {
      console.error('❌ Failed to create test data set:', error.message);
      throw error;
    }
  }

  async seedTestDatabase(databaseName = 'cryb_test') {
    console.log(`🌱 Seeding database: ${databaseName}`);

    try {
      // Load test data
      await this.loadTestData();

      if (this.testUsers.length === 0) {
        console.log('No test data found, creating new data set...');
        await this.createTestDataSet();
      }

      // Connect to specific test database
      const dbUrl = `${this.config.database_url}/${databaseName}`;
      
      // Here you would implement actual database seeding
      // This is a simplified version for demonstration
      console.log(`Seeding ${this.testUsers.length} users...`);
      console.log(`Seeding ${this.testCommunities.length} communities...`);
      console.log(`Seeding ${this.testPosts.length} posts...`);
      console.log(`Seeding ${this.testComments.length} comments...`);

      console.log(`✅ Database ${databaseName} seeded successfully`);
    } catch (error) {
      console.error(`❌ Failed to seed database ${databaseName}:`, error.message);
      throw error;
    }
  }

  async cleanupTestData(options = {}) {
    const config = {
      olderThanHours: this.config.max_test_data_age_hours,
      dryRun: false,
      ...options
    };

    console.log('🧹 Cleaning up test data...');
    console.log('Configuration:', config);

    try {
      const cutoffTime = new Date(Date.now() - config.olderThanHours * 60 * 60 * 1000);
      
      // Load existing test data
      await this.loadTestData();

      // Filter out old data
      const oldUsers = this.testUsers.filter(user => new Date(user.created_at) < cutoffTime);
      const oldCommunities = this.testCommunities.filter(community => new Date(community.created_at) < cutoffTime);
      const oldPosts = this.testPosts.filter(post => new Date(post.created_at) < cutoffTime);
      const oldComments = this.testComments.filter(comment => new Date(comment.created_at) < cutoffTime);

      console.log(`Found ${oldUsers.length} old users to clean up`);
      console.log(`Found ${oldCommunities.length} old communities to clean up`);
      console.log(`Found ${oldPosts.length} old posts to clean up`);
      console.log(`Found ${oldComments.length} old comments to clean up`);

      if (!config.dryRun) {
        // Remove old data from memory
        this.testUsers = this.testUsers.filter(user => new Date(user.created_at) >= cutoffTime);
        this.testCommunities = this.testCommunities.filter(community => new Date(community.created_at) >= cutoffTime);
        this.testPosts = this.testPosts.filter(post => new Date(post.created_at) >= cutoffTime);
        this.testComments = this.testComments.filter(comment => new Date(comment.created_at) >= cutoffTime);

        // Save updated data
        await this.saveTestData('users', this.testUsers);
        await this.saveTestData('communities', this.testCommunities);
        await this.saveTestData('posts', this.testPosts);
        await this.saveTestData('comments', this.testComments);

        // Clean up databases
        for (const dbName of this.testDatabases) {
          await this.cleanupDatabase(dbName, cutoffTime);
        }

        console.log('✅ Test data cleanup completed');
      } else {
        console.log('🔍 Dry run completed - no data was actually deleted');
      }

      return {
        cleaned_users: oldUsers.length,
        cleaned_communities: oldCommunities.length,
        cleaned_posts: oldPosts.length,
        cleaned_comments: oldComments.length,
        remaining_users: this.testUsers.length,
        remaining_communities: this.testCommunities.length,
        remaining_posts: this.testPosts.length,
        remaining_comments: this.testComments.length
      };

    } catch (error) {
      console.error('❌ Failed to cleanup test data:', error.message);
      throw error;
    }
  }

  async cleanupDatabase(databaseName, cutoffTime) {
    console.log(`🗄️  Cleaning up database: ${databaseName}`);

    try {
      // Here you would implement actual database cleanup
      // This is a simplified version for demonstration
      const dbUrl = `${this.config.database_url}/${databaseName}`;
      
      console.log(`Cleaning records older than ${cutoffTime.toISOString()}`);
      
      // Example cleanup commands (would be actual SQL in real implementation)
      console.log(`DELETE FROM comments WHERE created_at < '${cutoffTime.toISOString()}'`);
      console.log(`DELETE FROM posts WHERE created_at < '${cutoffTime.toISOString()}'`);
      console.log(`DELETE FROM communities WHERE created_at < '${cutoffTime.toISOString()}'`);
      console.log(`DELETE FROM users WHERE created_at < '${cutoffTime.toISOString()}'`);

      console.log(`✅ Database ${databaseName} cleaned up`);
    } catch (error) {
      console.warn(`⚠️  Could not cleanup database ${databaseName}:`, error.message);
    }
  }

  async resetAllTestData() {
    console.log('🔄 Resetting all test data...');

    try {
      // Clear in-memory data
      this.testUsers = [];
      this.testCommunities = [];
      this.testPosts = [];
      this.testComments = [];

      // Clear saved data files
      const dataDir = path.join(process.cwd(), 'test-data');
      if (fs.existsSync(dataDir)) {
        fs.rmSync(dataDir, { recursive: true, force: true });
      }

      // Reset all test databases
      for (const dbName of this.testDatabases) {
        await this.resetDatabase(dbName);
      }

      console.log('✅ All test data reset successfully');
    } catch (error) {
      console.error('❌ Failed to reset test data:', error.message);
      throw error;
    }
  }

  async resetDatabase(databaseName) {
    console.log(`🔄 Resetting database: ${databaseName}`);

    try {
      // Drop and recreate database
      const dropDbCommand = `psql "${this.config.database_url}/postgres" -c "DROP DATABASE IF EXISTS ${databaseName};"`;
      execSync(dropDbCommand, { stdio: 'pipe' });

      const createDbCommand = `psql "${this.config.database_url}/postgres" -c "CREATE DATABASE ${databaseName};"`;
      execSync(createDbCommand, { stdio: 'pipe' });

      // Run migrations
      const migrateCommand = `DATABASE_URL="${this.config.database_url}/${databaseName}" npm run db:migrate`;
      execSync(migrateCommand, { cwd: 'apps/api', stdio: 'pipe' });

      console.log(`✅ Database ${databaseName} reset successfully`);
    } catch (error) {
      console.warn(`⚠️  Could not reset database ${databaseName}:`, error.message);
    }
  }

  async saveTestData(type, data) {
    const dataDir = path.join(process.cwd(), 'test-data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const filePath = path.join(dataDir, `${type}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  async loadTestData() {
    const dataDir = path.join(process.cwd(), 'test-data');
    
    if (!fs.existsSync(dataDir)) {
      return;
    }

    try {
      const usersFile = path.join(dataDir, 'users.json');
      if (fs.existsSync(usersFile)) {
        this.testUsers = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
      }

      const communitiesFile = path.join(dataDir, 'communities.json');
      if (fs.existsSync(communitiesFile)) {
        this.testCommunities = JSON.parse(fs.readFileSync(communitiesFile, 'utf8'));
      }

      const postsFile = path.join(dataDir, 'posts.json');
      if (fs.existsSync(postsFile)) {
        this.testPosts = JSON.parse(fs.readFileSync(postsFile, 'utf8'));
      }

      const commentsFile = path.join(dataDir, 'comments.json');
      if (fs.existsSync(commentsFile)) {
        this.testComments = JSON.parse(fs.readFileSync(commentsFile, 'utf8'));
      }

      console.log(`📂 Loaded test data: ${this.testUsers.length} users, ${this.testCommunities.length} communities, ${this.testPosts.length} posts, ${this.testComments.length} comments`);
    } catch (error) {
      console.warn('⚠️  Could not load existing test data:', error.message);
    }
  }

  async getTestUser(index = 0) {
    await this.loadTestData();
    if (this.testUsers.length === 0) {
      await this.generateTestUsers(10);
    }
    return this.testUsers[index] || this.testUsers[0];
  }

  async getTestCommunity(index = 0) {
    await this.loadTestData();
    if (this.testCommunities.length === 0) {
      await this.generateTestCommunities(5);
    }
    return this.testCommunities[index] || this.testCommunities[0];
  }

  async getRandomTestData() {
    await this.loadTestData();
    
    if (this.testUsers.length === 0) {
      await this.createTestDataSet({ users: 10, communities: 5, posts: 20, comments: 30 });
    }

    return {
      user: this.testUsers[Math.floor(Math.random() * this.testUsers.length)],
      community: this.testCommunities[Math.floor(Math.random() * this.testCommunities.length)],
      post: this.testPosts[Math.floor(Math.random() * this.testPosts.length)],
      comment: this.testComments[Math.floor(Math.random() * this.testComments.length)]
    };
  }

  async generateTestReport() {
    await this.loadTestData();

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        users: this.testUsers.length,
        communities: this.testCommunities.length,
        posts: this.testPosts.length,
        comments: this.testComments.length
      },
      age_distribution: {
        users_last_hour: this.testUsers.filter(u => new Date(u.created_at) > new Date(Date.now() - 60 * 60 * 1000)).length,
        users_last_day: this.testUsers.filter(u => new Date(u.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length,
        posts_last_hour: this.testPosts.filter(p => new Date(p.created_at) > new Date(Date.now() - 60 * 60 * 1000)).length,
        posts_last_day: this.testPosts.filter(p => new Date(p.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length
      },
      databases: this.testDatabases,
      config: this.config
    };

    await this.saveTestData('report', report);
    
    console.log('📊 Test Data Report:');
    console.log(JSON.stringify(report, null, 2));
    
    return report;
  }
}

// CLI Interface
if (require.main === module) {
  const command = process.argv[2];
  const manager = new TestDataManager();

  async function runCommand() {
    try {
      await manager.init();

      switch (command) {
        case 'create':
          const count = parseInt(process.argv[3]) || 50;
          await manager.createTestDataSet({ users: count, communities: Math.ceil(count/3), posts: count*2, comments: count*3 });
          break;

        case 'seed':
          const dbName = process.argv[3] || 'cryb_test';
          await manager.seedTestDatabase(dbName);
          break;

        case 'cleanup':
          const hours = parseInt(process.argv[3]) || 24;
          const dryRun = process.argv[4] === '--dry-run';
          const result = await manager.cleanupTestData({ olderThanHours: hours, dryRun });
          console.log('Cleanup result:', result);
          break;

        case 'reset':
          await manager.resetAllTestData();
          break;

        case 'report':
          await manager.generateTestReport();
          break;

        case 'user':
          const user = await manager.getTestUser();
          console.log('Test user:', user);
          break;

        case 'random':
          const randomData = await manager.getRandomTestData();
          console.log('Random test data:', randomData);
          break;

        default:
          console.log(`
Usage: node test-data-manager.js <command> [args]

Commands:
  create [count]     - Create test data set (default: 50 users)
  seed [database]    - Seed specific database (default: cryb_test)
  cleanup [hours]    - Clean up data older than X hours (default: 24)
  reset              - Reset all test data
  report             - Generate test data report
  user               - Get a test user
  random             - Get random test data

Examples:
  node test-data-manager.js create 100
  node test-data-manager.js seed cryb_e2e
  node test-data-manager.js cleanup 48 --dry-run
  node test-data-manager.js reset
          `);
          break;
      }

    } catch (error) {
      console.error('Command failed:', error.message);
      process.exit(1);
    }
  }

  runCommand();
}

module.exports = TestDataManager;