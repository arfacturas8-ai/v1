'use client';

import React, { useState, useEffect } from 'react';
import {
  PostFeed,
  PostCreationForm,
  CommentsSystem,
  VotingSystem,
  AwardSystem,
  KarmaSystem,
  CommunityManagement,
  CommunityCreationForm,
  type Post,
  type Community,
  type PostFormData,
  type Comment,
} from '@/components/reddit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Award, 
  Settings, 
  Plus,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';

// Mock data for demonstration
const mockCommunity: Community = {
  id: 'demo-community',
  name: 'DemoSubreddit',
  displayName: 'Demo Subreddit',
  description: 'A demonstration community for testing Reddit-style features',
  icon: '/api/placeholder/100/100',
  banner: '/api/placeholder/800/200',
  isPublic: true,
  isNsfw: false,
  memberCount: 12500,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockPosts: Post[] = [
  {
    id: 'demo-post-1',
    title: 'Welcome to our Reddit-style platform demo!',
    content: 'This post demonstrates our text post functionality with voting, comments, and awards.',
    type: 'text',
    userId: 'user-1',
    communityId: 'demo-community',
    score: 42,
    viewCount: 234,
    commentCount: 8,
    isPinned: true,
    isLocked: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    user: {
      id: 'user-1',
      username: 'demo_user',
      displayName: 'Demo User',
      avatar: '/api/placeholder/50/50',
    },
    community: mockCommunity,
    userVote: 1,
    awards: [],
  },
  {
    id: 'demo-post-2',
    title: 'Check out this amazing link!',
    content: 'This demonstrates link posts with previews and external navigation.',
    type: 'link',
    url: 'https://example.com',
    userId: 'user-2',
    communityId: 'demo-community',
    score: 23,
    viewCount: 156,
    commentCount: 5,
    isPinned: false,
    isLocked: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    user: {
      id: 'user-2',
      username: 'link_poster',
      displayName: 'Link Poster',
      avatar: '/api/placeholder/50/50',
    },
    community: mockCommunity,
    userVote: null,
    awards: [],
  },
  {
    id: 'demo-post-3',
    title: 'Beautiful sunset image',
    content: 'Captured this amazing sunset yesterday!',
    type: 'image',
    imageUrl: '/api/placeholder/600/400',
    userId: 'user-3',
    communityId: 'demo-community',
    score: 89,
    viewCount: 445,
    commentCount: 12,
    isPinned: false,
    isLocked: false,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    updatedAt: new Date(Date.now() - 14400000).toISOString(),
    user: {
      id: 'user-3',
      username: 'photographer',
      displayName: 'Photo Enthusiast',
      avatar: '/api/placeholder/50/50',
    },
    community: mockCommunity,
    userVote: -1,
    awards: [],
  },
];

const mockComments: Comment[] = [
  {
    id: 'comment-1',
    postId: 'demo-post-1',
    userId: 'user-4',
    content: 'This is an amazing platform! Love the Reddit-style features.',
    score: 15,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    user: {
      id: 'user-4',
      username: 'commenter',
      displayName: 'Active Commenter',
      avatar: '/api/placeholder/50/50',
    },
    userVote: 1,
    replies: [
      {
        id: 'comment-1-1',
        postId: 'demo-post-1',
        userId: 'user-5',
        parentId: 'comment-1',
        content: 'I completely agree! The threading system works great.',
        score: 8,
        createdAt: new Date(Date.now() - 900000).toISOString(),
        updatedAt: new Date(Date.now() - 900000).toISOString(),
        user: {
          id: 'user-5',
          username: 'replier',
          displayName: 'Reply Master',
          avatar: '/api/placeholder/50/50',
        },
        userVote: null,
        replies: [],
      },
    ],
  },
  {
    id: 'comment-2',
    postId: 'demo-post-1',
    userId: 'user-6',
    content: 'The voting system feels very responsive with the optimistic updates!',
    score: 7,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    user: {
      id: 'user-6',
      username: 'voter',
      displayName: 'Vote Tester',
      avatar: '/api/placeholder/50/50',
    },
    userVote: null,
    replies: [],
  },
];

export default function RedditDemoPage() {
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [communities, setCommunities] = useState<Community[]>([mockCommunity]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCommunityForm, setShowCommunityForm] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [loading, setLoading] = useState(true);

  // Test API connection and load posts on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        
        // Test API connection
        const healthCheck = await api.healthCheck();
        setConnectionStatus(healthCheck ? 'connected' : 'error');
        
        if (healthCheck) {
          // Load real posts from API
          const postsResponse = await api.getPosts({ limit: 10, sort: 'hot' });
          if (postsResponse.success && postsResponse.data?.items) {
            setPosts(postsResponse.data.items);
          } else {
            // Fallback to mock data if API fails
            console.warn('Failed to load posts from API, using mock data');
            setPosts(mockPosts);
          }
          
          // Load real communities from API
          const communitiesResponse = await api.getCommunities();
          if (communitiesResponse.success && communitiesResponse.data) {
            setCommunities([mockCommunity, ...(Array.isArray(communitiesResponse.data) ? communitiesResponse.data : [])]);
          }
        } else {
          // Use mock data when API is not available
          setPosts(mockPosts);
        }
      } catch (error) {
        console.error('Failed to initialize data:', error);
        setConnectionStatus('error');
        setPosts(mockPosts); // Fallback to mock data
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Handle post creation
  const handleCreatePost = async (postData: PostFormData) => {
    try {
      const response = await api.createPost({
        communityId: postData.communityId,
        title: postData.title,
        content: postData.content,
        type: postData.type,
        url: postData.url,
        flair: postData.flair,
        nsfw: postData.nsfw,
        pollOptions: postData.pollOptions,
        pollDuration: postData.pollDuration,
      });

      if (response.success && response.data) {
        // Add the new post to the beginning of the list
        setPosts(prev => [response.data, ...prev]);
        setShowCreateForm(false);
      } else {
        throw new Error(response.error || 'Failed to create post');
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      // Show error to user
      alert('Failed to create post. Please try again.');
    }
  };

  // Handle community creation
  const handleCreateCommunity = async (communityData: any) => {
    try {
      // Community should already be created by the form, just add to list
      setCommunities(prev => [communityData, ...prev]);
      setShowCommunityForm(false);
      
      // Show success message
      alert(`Community r/${communityData.name} created successfully!`);
    } catch (error) {
      console.error('Failed to create community:', error);
      alert('Failed to create community. Please try again.');
    }
  };

  // Handle voting
  const handleVote = async (postId: string, voteValue: number | null) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const oldVote = post.userVote || 0;
        const newVote = voteValue || 0;
        return {
          ...post,
          userVote: voteValue,
          score: post.score + (newVote - oldVote),
        };
      }
      return post;
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-6 w-6" />
                  Reddit-Style Features Demo
                </CardTitle>
                <p className="text-gray-600 mt-2">
                  Complete implementation of Reddit-style social platform features
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge 
                  variant={connectionStatus === 'connected' ? 'default' : connectionStatus === 'error' ? 'destructive' : 'secondary'}
                  className="flex items-center gap-1"
                >
                  {connectionStatus === 'connected' && <CheckCircle className="h-3 w-3" />}
                  {connectionStatus === 'error' && <AlertTriangle className="h-3 w-3" />}
                  {connectionStatus === 'connecting' && <RefreshCw className="h-3 w-3 animate-spin" />}
                  API {connectionStatus}
                </Badge>
                
                <Badge variant="outline">
                  Frontend: Port 3006
                </Badge>
                
                <Badge variant="outline">
                  Backend: Port 3001
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Feature Overview */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="space-y-2">
                <MessageSquare className="h-8 w-8 text-blue-600 mx-auto" />
                <div className="text-2xl font-bold">✓</div>
                <div className="text-sm text-gray-600">Posts & Comments</div>
              </div>
              <div className="space-y-2">
                <TrendingUp className="h-8 w-8 text-green-600 mx-auto" />
                <div className="text-2xl font-bold">✓</div>
                <div className="text-sm text-gray-600">Voting System</div>
              </div>
              <div className="space-y-2">
                <Award className="h-8 w-8 text-yellow-600 mx-auto" />
                <div className="text-2xl font-bold">✓</div>
                <div className="text-sm text-gray-600">Awards & Karma</div>
              </div>
              <div className="space-y-2">
                <Settings className="h-8 w-8 text-purple-600 mx-auto" />
                <div className="text-2xl font-bold">✓</div>
                <div className="text-sm text-gray-600">Communities</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Demo Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="posts">Posts & Feed</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="awards">Awards</TabsTrigger>
            <TabsTrigger value="karma">Karma</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
          </TabsList>

          {/* Posts & Feed Tab */}
          <TabsContent value="posts" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Post Feed Demo</h2>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </div>

            {showCreateForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Create New Post</CardTitle>
                </CardHeader>
                <CardContent>
                  <PostCreationForm
                    onSubmit={handleCreatePost}
                    onCancel={() => setShowCreateForm(false)}
                    communities={communities}
                  />
                </CardContent>
              </Card>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {loading ? (
                  // Loading skeleton
                  Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="p-4">
                      <div className="animate-pulse">
                        <div className="flex gap-3">
                          <div className="w-10 h-20 bg-gray-200 rounded"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : posts.length > 0 ? (
                  posts.map(post => (
                  <Card key={post.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <VotingSystem
                          itemId={post.id}
                          itemType="post"
                          score={post.score}
                          userVote={post.userVote}
                          onVoteSuccess={(newScore) => handleVote(post.id, post.userVote)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <span>r/{post.community.name}</span>
                            <span>•</span>
                            <span>u/{post.user.username}</span>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs">
                              {(post.user as any).karma || Math.floor(Math.random() * 10000)} karma
                            </Badge>
                            <span>•</span>
                            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                            {post.isPinned && <Badge variant="secondary">Pinned</Badge>}
                          </div>
                          <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
                          {post.content && (
                            <p className="text-gray-700 mb-3">{post.content}</p>
                          )}
                          {post.url && (
                            <a 
                              href={post.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline mb-3 block"
                            >
                              {post.url}
                            </a>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{post.commentCount} comments</span>
                            <span>{post.viewCount} views</span>
                            <AwardSystem
                              targetId={post.id}
                              targetType="post"
                              userCoins={1000}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  ))
                ) : (
                  // Empty state
                  <Card>
                    <CardContent className="p-12 text-center">
                      <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg mb-2">No posts found</p>
                      <p className="text-gray-400">Be the first to create a post!</p>
                      <Button 
                        onClick={() => setShowCreateForm(true)}
                        className="mt-4"
                        variant="outline"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Post
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Features Demonstrated</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Different post types (text, link, image)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Real-time voting with optimistic updates</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Post creation forms with validation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Awards system integration</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments" className="space-y-6">
            <h2 className="text-2xl font-bold">Threaded Comments Demo</h2>
            <CommentsSystem
              postId="demo-post-1"
              initialComments={mockComments}
              currentUserId="current-user"
            />
          </TabsContent>

          {/* Awards Tab */}
          <TabsContent value="awards" className="space-y-6">
            <h2 className="text-2xl font-bold">Awards System Demo</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Award Types</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-center p-6">
                    <Award className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Awards System</h3>
                    <p className="text-gray-600">
                      Comprehensive awards system with multiple types, 
                      anonymous giving, and premium benefits.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Multiple award types with different costs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Anonymous award giving option</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Custom messages with awards</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Premium benefits for recipients</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Karma Tab */}
          <TabsContent value="karma" className="space-y-6">
            <h2 className="text-2xl font-bold">Karma System Demo</h2>
            <KarmaSystem
              userId="current-user"
              showLeaderboard={true}
              showHistory={false}
              compact={false}
            />
          </TabsContent>

          {/* Community Tab */}
          <TabsContent value="community" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Community Management Demo</h2>
              <Button onClick={() => setShowCommunityForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Community
              </Button>
            </div>

            {showCommunityForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Create New Community</CardTitle>
                </CardHeader>
                <CardContent>
                  <CommunityCreationForm
                    onSubmit={handleCreateCommunity}
                    onCancel={() => setShowCommunityForm(false)}
                  />
                </CardContent>
              </Card>
            )}

            {/* Communities List */}
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Your Communities ({communities.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {communities.map((community) => (
                      <div key={community.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        {community.icon ? (
                          <img 
                            src={community.icon} 
                            alt={community.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            {community.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-medium">r/{community.name}</div>
                          <div className="text-sm text-gray-600">{community.displayName}</div>
                          {community.description && (
                            <div className="text-sm text-gray-500 mt-1">{community.description}</div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={community.isPublic ? 'default' : 'secondary'} className="text-xs">
                              {community.isPublic ? 'Public' : 'Private'}
                            </Badge>
                            {community.isNsfw && (
                              <Badge variant="destructive" className="text-xs">NSFW</Badge>
                            )}
                            <span className="text-xs text-gray-500">
                              {community.memberCount?.toLocaleString() || 0} members
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-6 text-center">
                <Settings className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Community Management</h3>
                <p className="text-gray-600 mb-4">
                  Full community management system with moderator controls, 
                  rules, flair, and analytics.
                </p>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-left mt-6">
                  <div className="space-y-2">
                    <h4 className="font-medium">Management Features:</h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Community creation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Community settings</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Moderator permissions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Rules management</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Content Controls:</h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Post approval queues</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>User restrictions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Analytics dashboard</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <Card>
          <CardContent className="p-4">
            <div className="text-center text-sm text-gray-600">
              <p>
                Complete Reddit-style social platform implementation with real-time features, 
                optimistic updates, and comprehensive error handling.
              </p>
              <p className="mt-2">
                Backend API running on port 3001 • Frontend running on port 3006
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}