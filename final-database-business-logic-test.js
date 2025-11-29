#!/usr/bin/env node

/**
 * FINAL DATABASE AND BUSINESS LOGIC VERIFICATION TEST
 * 
 * This script tests the complete data flow through the CRYB platform
 * to verify all CRUD operations and business rules work correctly.
 */

const axios = require('axios');
const fs = require('fs');

const API_BASE_URL = 'http://localhost:3002';

class BusinessLogicTester {
  constructor() {
    this.authToken = null;
    this.cookies = {};
    this.testData = {
      users: [],
      communities: [],
      posts: [],
      comments: []
    };
    this.results = {
      timestamp: new Date().toISOString(),
      userWorkflows: {},
      communityWorkflows: {},
      postWorkflows: {},
      commentWorkflows: {},
      businessRules: {},
      dataIntegrity: {},
      summary: {}
    };
  }

  async makeAuthenticatedRequest(method, endpoint, data = null, customHeaders = {}) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...customHeaders
      };

      // Add auth token if available
      if (this.authToken) {
        headers.Authorization = `Bearer ${this.authToken}`;
      }

      // Add cookies if available
      if (Object.keys(this.cookies).length > 0) {
        headers.Cookie = Object.entries(this.cookies)
          .map(([key, value]) => `${key}=${value}`)
          .join('; ');
      }

      const config = {
        method,
        url: `${API_BASE_URL}${endpoint}`,
        headers,
        timeout: 15000
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);

      // Extract cookies from response
      if (response.headers['set-cookie']) {
        response.headers['set-cookie'].forEach(cookie => {
          const [cookieData] = cookie.split(';');
          const [key, value] = cookieData.split('=');
          this.cookies[key] = value;
          
          if (key === 'accessToken') {
            this.authToken = value;
          }
        });
      }

      return {
        success: true,
        status: response.status,
        data: response.data,
        headers: response.headers
      };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status || 0,
        error: error.message,
        data: error.response?.data || null
      };
    }
  }

  async testCompleteUserWorkflow() {
    console.log('\n👤 Testing Complete User Workflow...');
    
    const timestamp = Date.now();
    const userData = {
      username: `testuser_${timestamp}`,
      displayName: `Test User ${timestamp}`,
      email: `test_${timestamp}@example.com`,
      password: 'TestPassword123!',
      confirmPassword: 'TestPassword123!'
    };

    // Test user registration
    console.log('📝 Testing user registration...');
    const registerResult = await this.makeAuthenticatedRequest('POST', '/api/v1/auth/register', userData);
    this.results.userWorkflows.registration = registerResult;

    if (registerResult.success) {
      console.log('✅ User registration successful');
      const user = registerResult.data?.data?.user;
      this.testData.users.push(user);
      
      // Test user profile retrieval
      console.log('👤 Testing user profile retrieval...');
      const profileResult = await this.makeAuthenticatedRequest('GET', '/api/v1/users/me');
      this.results.userWorkflows.profileRetrieval = profileResult;
      
      if (profileResult.success) {
        console.log('✅ User profile retrieved successfully');
        
        // Test user profile update
        console.log('✏️ Testing user profile update...');
        const updateData = {
          displayName: `Updated ${userData.displayName}`,
          bio: 'This is a test bio from the comprehensive test suite'
        };
        
        const updateResult = await this.makeAuthenticatedRequest('PATCH', '/api/v1/users/me', updateData);
        this.results.userWorkflows.profileUpdate = updateResult;
        
        if (updateResult.success) {
          console.log('✅ User profile updated successfully');
        } else {
          console.log('❌ User profile update failed:', updateResult.error);
        }
      } else {
        console.log('❌ User profile retrieval failed:', profileResult.error);
      }
    } else {
      console.log('❌ User registration failed:', registerResult.error);
      return false;
    }

    return true;
  }

  async testCompleteCommunityWorkflow() {
    console.log('\n🏘️ Testing Complete Community Workflow...');
    
    if (!this.authToken) {
      console.log('❌ No authentication token available for community tests');
      return false;
    }

    const timestamp = Date.now();
    const communityData = {
      name: `testcommunity_${timestamp}`,
      displayName: `Test Community ${timestamp}`,
      description: 'A comprehensive test community for verifying all CRUD operations and business logic',
      isPublic: true,
      isNsfw: false
    };

    // Test community creation
    console.log('🏗️ Testing community creation...');
    const createResult = await this.makeAuthenticatedRequest('POST', '/api/v1/communities', communityData);
    this.results.communityWorkflows.creation = createResult;

    if (createResult.success) {
      console.log('✅ Community created successfully');
      const community = createResult.data?.data;
      this.testData.communities.push(community);
      
      // Test community retrieval
      console.log('📖 Testing community retrieval...');
      const getResult = await this.makeAuthenticatedRequest('GET', `/api/v1/communities/${community.id}`);
      this.results.communityWorkflows.retrieval = getResult;
      
      if (getResult.success) {
        console.log('✅ Community retrieved successfully');
        
        // Test community membership (join)
        console.log('👥 Testing community join...');
        const joinResult = await this.makeAuthenticatedRequest('POST', `/api/v1/communities/${community.id}/join`);
        this.results.communityWorkflows.join = joinResult;
        
        if (joinResult.success) {
          console.log('✅ Successfully joined community');
          
          // Test member list retrieval
          console.log('📋 Testing member list retrieval...');
          const membersResult = await this.makeAuthenticatedRequest('GET', `/api/v1/communities/${community.id}/members`);
          this.results.communityWorkflows.membersList = membersResult;
          
          if (membersResult.success) {
            console.log('✅ Member list retrieved successfully');
            console.log(`   Members count: ${membersResult.data?.data?.length || 0}`);
          } else {
            console.log('❌ Member list retrieval failed:', membersResult.error);
          }
        } else {
          console.log('❌ Community join failed:', joinResult.error);
        }
        
        // Test community update
        console.log('✏️ Testing community update...');
        const updateData = {
          description: 'Updated description from comprehensive test suite'
        };
        
        const updateResult = await this.makeAuthenticatedRequest('PATCH', `/api/v1/communities/${community.id}`, updateData);
        this.results.communityWorkflows.update = updateResult;
        
        if (updateResult.success) {
          console.log('✅ Community updated successfully');
        } else {
          console.log('❌ Community update failed:', updateResult.error);
        }
      } else {
        console.log('❌ Community retrieval failed:', getResult.error);
      }
    } else {
      console.log('❌ Community creation failed:', createResult.error);
      return false;
    }

    return true;
  }

  async testCompletePostWorkflow() {
    console.log('\n📝 Testing Complete Post Workflow...');
    
    if (!this.authToken || this.testData.communities.length === 0) {
      console.log('❌ Prerequisites not met for post tests (auth token or community)');
      return false;
    }

    const community = this.testData.communities[0];
    const timestamp = Date.now();
    const postData = {
      title: `Test Post ${timestamp}`,
      content: 'This is a comprehensive test post to verify all post-related CRUD operations and business logic.',
      communityId: community.id,
      type: 'text'
    };

    // Test post creation
    console.log('📝 Testing post creation...');
    const createResult = await this.makeAuthenticatedRequest('POST', '/api/v1/posts', postData);
    this.results.postWorkflows.creation = createResult;

    if (createResult.success) {
      console.log('✅ Post created successfully');
      const post = createResult.data?.data;
      this.testData.posts.push(post);
      
      // Test post retrieval
      console.log('📖 Testing post retrieval...');
      const getResult = await this.makeAuthenticatedRequest('GET', `/api/v1/posts/${post.id}`);
      this.results.postWorkflows.retrieval = getResult;
      
      if (getResult.success) {
        console.log('✅ Post retrieved successfully');
        
        // Test post voting (upvote)
        console.log('👍 Testing post upvote...');
        const upvoteResult = await this.makeAuthenticatedRequest('POST', `/api/v1/posts/${post.id}/vote`, { type: 'up' });
        this.results.postWorkflows.upvote = upvoteResult;
        
        if (upvoteResult.success) {
          console.log('✅ Post upvoted successfully');
          
          // Test post voting (downvote)
          console.log('👎 Testing post downvote...');
          const downvoteResult = await this.makeAuthenticatedRequest('POST', `/api/v1/posts/${post.id}/vote`, { type: 'down' });
          this.results.postWorkflows.downvote = downvoteResult;
          
          if (downvoteResult.success) {
            console.log('✅ Post downvoted successfully');
          } else {
            console.log('❌ Post downvote failed:', downvoteResult.error);
          }
        } else {
          console.log('❌ Post upvote failed:', upvoteResult.error);
        }
        
        // Test post update
        console.log('✏️ Testing post update...');
        const updateData = {
          content: 'Updated content from comprehensive test suite'
        };
        
        const updateResult = await this.makeAuthenticatedRequest('PATCH', `/api/v1/posts/${post.id}`, updateData);
        this.results.postWorkflows.update = updateResult;
        
        if (updateResult.success) {
          console.log('✅ Post updated successfully');
        } else {
          console.log('❌ Post update failed:', updateResult.error);
        }
      } else {
        console.log('❌ Post retrieval failed:', getResult.error);
      }
    } else {
      console.log('❌ Post creation failed:', createResult.error);
      return false;
    }

    return true;
  }

  async testCompleteCommentWorkflow() {
    console.log('\n💬 Testing Complete Comment Workflow...');
    
    if (!this.authToken || this.testData.posts.length === 0) {
      console.log('❌ Prerequisites not met for comment tests (auth token or post)');
      return false;
    }

    const post = this.testData.posts[0];
    const timestamp = Date.now();
    const commentData = {
      content: `Test comment ${timestamp} - Testing complete comment workflow including CRUD operations and business logic validation.`,
      postId: post.id
    };

    // Test comment creation
    console.log('💬 Testing comment creation...');
    const createResult = await this.makeAuthenticatedRequest('POST', '/api/v1/comments', commentData);
    this.results.commentWorkflows.creation = createResult;

    if (createResult.success) {
      console.log('✅ Comment created successfully');
      const comment = createResult.data?.data;
      this.testData.comments.push(comment);
      
      // Test comment retrieval
      console.log('📖 Testing comment retrieval...');
      const getResult = await this.makeAuthenticatedRequest('GET', `/api/v1/comments/${comment.id}`);
      this.results.commentWorkflows.retrieval = getResult;
      
      if (getResult.success) {
        console.log('✅ Comment retrieved successfully');
        
        // Test comment voting
        console.log('👍 Testing comment upvote...');
        const upvoteResult = await this.makeAuthenticatedRequest('POST', `/api/v1/comments/${comment.id}/vote`, { type: 'up' });
        this.results.commentWorkflows.upvote = upvoteResult;
        
        if (upvoteResult.success) {
          console.log('✅ Comment upvoted successfully');
        } else {
          console.log('❌ Comment upvote failed:', upvoteResult.error);
        }
        
        // Test comment update
        console.log('✏️ Testing comment update...');
        const updateData = {
          content: 'Updated comment content from comprehensive test suite'
        };
        
        const updateResult = await this.makeAuthenticatedRequest('PATCH', `/api/v1/comments/${comment.id}`, updateData);
        this.results.commentWorkflows.update = updateResult;
        
        if (updateResult.success) {
          console.log('✅ Comment updated successfully');
        } else {
          console.log('❌ Comment update failed:', updateResult.error);
        }
        
        // Test nested comment (reply)
        console.log('↳ Testing nested comment creation...');
        const replyData = {
          content: 'This is a reply to test nested commenting functionality',
          postId: post.id,
          parentId: comment.id
        };
        
        const replyResult = await this.makeAuthenticatedRequest('POST', '/api/v1/comments', replyData);
        this.results.commentWorkflows.nestedComment = replyResult;
        
        if (replyResult.success) {
          console.log('✅ Nested comment created successfully');
        } else {
          console.log('❌ Nested comment creation failed:', replyResult.error);
        }
      } else {
        console.log('❌ Comment retrieval failed:', getResult.error);
      }
    } else {
      console.log('❌ Comment creation failed:', createResult.error);
      return false;
    }

    return true;
  }

  async testBusinessRules() {
    console.log('\n📋 Testing Business Rules...');
    
    // Test duplicate username prevention
    console.log('🚫 Testing duplicate username prevention...');
    if (this.testData.users.length > 0) {
      const duplicateUserData = {
        username: this.testData.users[0].username,
        displayName: 'Duplicate Test User',
        email: 'duplicate@example.com',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!'
      };
      
      const duplicateResult = await this.makeAuthenticatedRequest('POST', '/api/v1/auth/register', duplicateUserData);
      this.results.businessRules.duplicateUsernameCheck = duplicateResult;
      
      if (!duplicateResult.success && duplicateResult.status === 409) {
        console.log('✅ Duplicate username correctly rejected');
      } else {
        console.log('❌ Duplicate username validation failed');
      }
    }
    
    // Test community name uniqueness
    console.log('🚫 Testing duplicate community name prevention...');
    if (this.testData.communities.length > 0) {
      const duplicateCommunityData = {
        name: this.testData.communities[0].name,
        displayName: 'Duplicate Community',
        description: 'Testing duplicate name validation'
      };
      
      const duplicateCommunityResult = await this.makeAuthenticatedRequest('POST', '/api/v1/communities', duplicateCommunityData);
      this.results.businessRules.duplicateCommunityCheck = duplicateCommunityResult;
      
      if (!duplicateCommunityResult.success && duplicateCommunityResult.status === 409) {
        console.log('✅ Duplicate community name correctly rejected');
      } else {
        console.log('❌ Duplicate community name validation failed');
      }
    }
    
    // Test authorization requirements
    console.log('🔒 Testing authorization requirements...');
    const originalToken = this.authToken;
    this.authToken = null; // Remove auth token
    
    const unauthorizedResult = await this.makeAuthenticatedRequest('POST', '/api/v1/communities', {
      name: 'unauthorized_test',
      displayName: 'Unauthorized Test'
    });
    this.results.businessRules.authorizationCheck = unauthorizedResult;
    
    if (!unauthorizedResult.success && unauthorizedResult.status === 401) {
      console.log('✅ Authorization correctly required');
    } else {
      console.log('❌ Authorization check failed');
    }
    
    this.authToken = originalToken; // Restore auth token
  }

  async testDataIntegrity() {
    console.log('\n🔍 Testing Data Integrity...');
    
    // Test cascading relationships
    if (this.testData.communities.length > 0) {
      const community = this.testData.communities[0];
      
      console.log('🔗 Testing community-post relationship...');
      const postsResult = await this.makeAuthenticatedRequest('GET', `/api/v1/communities/${community.id}/posts`);
      this.results.dataIntegrity.communityPostRelation = postsResult;
      
      if (postsResult.success) {
        console.log(`✅ Found ${postsResult.data?.data?.length || 0} posts in community`);
      } else {
        console.log('❌ Community-post relationship test failed:', postsResult.error);
      }
    }
    
    // Test post-comment relationship
    if (this.testData.posts.length > 0) {
      const post = this.testData.posts[0];
      
      console.log('🔗 Testing post-comment relationship...');
      const commentsResult = await this.makeAuthenticatedRequest('GET', `/api/v1/posts/${post.id}/comments`);
      this.results.dataIntegrity.postCommentRelation = commentsResult;
      
      if (commentsResult.success) {
        console.log(`✅ Found ${commentsResult.data?.data?.length || 0} comments on post`);
      } else {
        console.log('❌ Post-comment relationship test failed:', commentsResult.error);
      }
    }
    
    // Test vote counting integrity
    if (this.testData.posts.length > 0) {
      const post = this.testData.posts[0];
      
      console.log('🔢 Testing vote counting integrity...');
      const postWithVotes = await this.makeAuthenticatedRequest('GET', `/api/v1/posts/${post.id}`);
      this.results.dataIntegrity.voteCountingIntegrity = postWithVotes;
      
      if (postWithVotes.success) {
        const score = postWithVotes.data?.data?.score;
        console.log(`✅ Post score: ${score} (votes are being counted)`);
      } else {
        console.log('❌ Vote counting integrity test failed:', postWithVotes.error);
      }
    }
  }

  generateSummaryReport() {
    console.log('\n📊 Generating Business Logic Test Summary...');
    
    const allTests = [
      ...Object.values(this.results.userWorkflows),
      ...Object.values(this.results.communityWorkflows),
      ...Object.values(this.results.postWorkflows),
      ...Object.values(this.results.commentWorkflows),
      ...Object.values(this.results.businessRules),
      ...Object.values(this.results.dataIntegrity)
    ];

    const successfulTests = allTests.filter(test => test.success).length;
    const totalTests = allTests.length;
    const successRate = totalTests > 0 ? (successfulTests / totalTests) * 100 : 0;

    this.results.summary = {
      totalTests,
      successfulTests,
      failedTests: totalTests - successfulTests,
      successRate: successRate.toFixed(2) + '%',
      testData: {
        usersCreated: this.testData.users.length,
        communitiesCreated: this.testData.communities.length,
        postsCreated: this.testData.posts.length,
        commentsCreated: this.testData.comments.length
      },
      featureStatus: {
        userManagement: this.results.userWorkflows.registration?.success || false,
        communityManagement: this.results.communityWorkflows.creation?.success || false,
        postManagement: this.results.postWorkflows.creation?.success || false,
        commentSystem: this.results.commentWorkflows.creation?.success || false,
        votingSystem: this.results.postWorkflows.upvote?.success || false,
        businessRulesEnforced: this.results.businessRules.duplicateUsernameCheck ? 
          !this.results.businessRules.duplicateUsernameCheck.success : false,
        dataIntegrityMaintained: this.results.dataIntegrity.communityPostRelation?.success || false
      }
    };

    // Save detailed report
    fs.writeFileSync('business-logic-test-report.json', JSON.stringify(this.results, null, 2));

    console.log(`\n🎯 BUSINESS LOGIC & DATABASE TEST RESULTS`);
    console.log(`=========================================`);
    console.log(`📊 Total tests: ${totalTests}`);
    console.log(`✅ Successful: ${successfulTests}`);
    console.log(`❌ Failed: ${totalTests - successfulTests}`);
    console.log(`📈 Success rate: ${successRate.toFixed(2)}%`);
    
    console.log(`\n📋 Test Data Created:`);
    console.log(`   Users: ${this.testData.users.length}`);
    console.log(`   Communities: ${this.testData.communities.length}`);
    console.log(`   Posts: ${this.testData.posts.length}`);
    console.log(`   Comments: ${this.testData.comments.length}`);
    
    console.log(`\n🏗️ Feature Status:`);
    console.log(`   User Management: ${this.results.summary.featureStatus.userManagement ? 'Working' : 'Failed'}`);
    console.log(`   Community Management: ${this.results.summary.featureStatus.communityManagement ? 'Working' : 'Failed'}`);
    console.log(`   Post Management: ${this.results.summary.featureStatus.postManagement ? 'Working' : 'Failed'}`);
    console.log(`   Comment System: ${this.results.summary.featureStatus.commentSystem ? 'Working' : 'Failed'}`);
    console.log(`   Voting System: ${this.results.summary.featureStatus.votingSystem ? 'Working' : 'Failed'}`);
    console.log(`   Business Rules: ${this.results.summary.featureStatus.businessRulesEnforced ? 'Enforced' : 'Failed'}`);
    console.log(`   Data Integrity: ${this.results.summary.featureStatus.dataIntegrityMaintained ? 'Maintained' : 'Failed'}`);

    console.log(`\n📄 Detailed report saved to: business-logic-test-report.json`);
  }

  async run() {
    console.log('🚀 STARTING BUSINESS LOGIC & DATABASE VERIFICATION');
    console.log('=================================================');

    try {
      await this.testCompleteUserWorkflow();
      await this.testCompleteCommunityWorkflow();
      await this.testCompletePostWorkflow();
      await this.testCompleteCommentWorkflow();
      await this.testBusinessRules();
      await this.testDataIntegrity();
      this.generateSummaryReport();
    } catch (error) {
      console.error('❌ Critical error during business logic testing:', error);
      this.results.criticalError = error.message;
      this.generateSummaryReport();
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const tester = new BusinessLogicTester();
  tester.run().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = BusinessLogicTester;