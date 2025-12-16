import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp, MessageSquare, Share, Bookmark,
  Zap, Flame, Brain, Laugh,
  ChevronUp, ChevronDown, MoreHorizontal, Flag, Edit, Trash,
  BarChart3, Clock, Eye, Plus
} from 'lucide-react';

// Import our new reaction components
import ReactionBar from '../reactions/ReactionBar';
import ReactionPicker from '../reactions/ReactionPicker';
import ReactionAnalytics from '../reactions/ReactionAnalytics';
import reactionService from '../../services/reactionService';

// Import existing components
import FileUpload, { FileAttachment } from '../FileUpload/FileUploadSystem';
import ThreadedComments from '../Comments/ThreadedComments';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Button, IconButton } from '../ui/Button';
// Post Types with OpenSea styling
const POST_TYPES = {
  DISCUSSION: { icon: MessageSquare, label: 'Discussion', color: '#58a6ff' },
  NEWS: { icon: Zap, label: 'News', color: '#F59E0B' },
  ANALYSIS: { icon: Brain, label: 'Analysis', color: '#8B5CF6' },
  MEME: { icon: Laugh, label: 'Meme', color: '#10B981' },
  PREDICTION: { icon: TrendingUp, label: 'Prediction', color: '#06B6D4' },
  ALERT: { icon: Flame, label: 'Alert', color: '#EF4444' }
};

// Enhanced Post Component with Reaction System
function EnhancedPost({ 
  post, 
  onReaction, 
  onComment, 
  onReply, 
  onEditComment, 
  onDeleteComment, 
  currentUser, 
  compact = false,
  showAnalytics = false 
}) {
  const [showComments, setShowComments] = useState(false);
  const [reactions, setReactions] = useState({});
  const [userReactions, setUserReactions] = useState([]);
  const [reactionUsers, setReactionUsers] = useState({});
  const [loading, setLoading] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const postRef = useRef(null);

  // Load initial reaction data
  useEffect(() => {
    loadReactions();
    
    // Join real-time room for this post
    reactionService.joinContentRoom('post', post.id);
    
    // Listen for real-time reaction updates
    const handleReactionUpdate = (event) => {
      const { contentType, contentId, summary } = event.detail;
      if (contentType === 'post' && contentId === post.id) {
        updateReactionState(summary);
      }
    };

    window.addEventListener('reactionAdded', handleReactionUpdate);
    window.addEventListener('reactionRemoved', handleReactionUpdate);

    return () => {
      reactionService.leaveContentRoom('post', post.id);
      window.removeEventListener('reactionAdded', handleReactionUpdate);
      window.removeEventListener('reactionRemoved', handleReactionUpdate);
    };
  }, [post.id]);

  const loadReactions = async () => {
    try {
      const data = await reactionService.getReactions('post', post.id);
      if (data) {
        updateReactionState(data.summary);
        setUserReactions(data.userReactions.map(r => r.reaction_type));
        
        // Group users by reaction type
        const usersByReaction = {};
        data.reactions.forEach(reaction => {
          if (!usersByReaction[reaction.reaction_type]) {
            usersByReaction[reaction.reaction_type] = [];
          }
          usersByReaction[reaction.reaction_type].push({
            id: reaction.user_id,
            username: reaction.username,
            display_name: reaction.display_name,
            avatar: reaction.avatar
          });
        });
        setReactionUsers(usersByReaction);
      }
    } catch (error) {
      console.error('Error loading reactions:', error);
    }
  };

  const updateReactionState = (summary) => {
    if (summary) {
      setReactions({
        like: summary.like_count || 0,
        love: summary.love_count || 0,
        laugh: summary.laugh_count || 0,
        wow: summary.wow_count || 0,
        sad: summary.sad_count || 0,
        angry: summary.angry_count || 0,
        fire: summary.fire_count || 0,
        rocket: summary.rocket_count || 0,
        heart_eyes: summary.heart_eyes_count || 0,
        thinking: summary.thinking_count || 0,
        clap: summary.clap_count || 0,
        thumbs_up: summary.thumbs_up_count || 0,
        thumbs_down: summary.thumbs_down_count || 0,
        upvote: summary.upvote_count || 0,
        downvote: summary.downvote_count || 0
      });
    }
  };

  const handleReactionToggle = async (reactionData, isActive) => {
    if (loading) return;
    
    setLoading(true);
    try {
      await reactionService.toggleReaction(
        'post', 
        post.id, 
        reactionData.type, 
        isActive
      );
      
      // The real-time update will handle UI changes
    } catch (error) {
      console.error('Error toggling reaction:', error);
      // Could show a toast notification here
    } finally {
      setLoading(false);
    }
  };

  const handleViewReactionUsers = (reactionType, users) => {
    // Could open a modal showing all users who reacted
  };

  const handleAddComment = (content) => {
    const newComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      postId: post.id,
      content,
      author: {
        id: currentUser?.id || 'current_user',
        username: currentUser?.username || 'DemoUser',
        avatar: currentUser?.avatar || null,
        reputation: currentUser?.reputation || 1247
      },
      timestamp: new Date().toISOString(),
      likes: 0,
      userReacted: false,
      replies: []
    };
    onComment(post.id, newComment);
  };

  const postType = POST_TYPES[post.type] || POST_TYPES.DISCUSSION;
  const PostTypeIcon = postType.icon;

  const formatNumber = (num) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return `${Math.floor(diffMins / 1440)}d`;
  };

  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);

  return (
    <Card
      variant="interactive"
      hoverEffect="medium"
      className={`mb-4 ${compact ? 'compact' : ''}`}
      ref={postRef}
    >
      {/* Post Header */}
      <CardHeader className="pb-3">
        <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between'
}}>
          <span
            style={{
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '50%',
  fontWeight: '500'
}}
            style={{ backgroundColor: `${postType.color}15`, color: postType.color }}
          >
            <PostTypeIcon size={24} />
            {postType.label}
          </span>

          <div style={{
  display: 'flex',
  gap: '4px'
}}>
            {showAnalytics && (
              <IconButton
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowAnalyticsModal(true)}
                aria-label="View analytics"
              >
                <BarChart3 size={24} />
              </IconButton>
            )}

            <IconButton
              variant="ghost"
              size="icon-sm"
              aria-label="More options"
            >
              <MoreHorizontal size={24} />
            </IconButton>
          </div>
        </div>

        <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
          <div style={{
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: '600'
}}>
            {post.author.avatar ? (
              <img src={post.author.avatar} alt={post.author.username} style={{
  width: '100%',
  height: '100%',
  borderRadius: '50%'
}} />
            ) : (
              <span>{post.author.username[0].toUpperCase()}</span>
            )}
          </div>
          <div style={{
  flex: '1'
}}>
            <p style={{
  fontWeight: '500'
}}>{post.author.username}</p>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
              <span>{formatNumber(post.author.reputation)} rep</span>
              <span>•</span>
              <span>{getTimeAgo(post.timestamp)}</span>
              <span>•</span>
              <span style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                <Eye size={24} />
                {formatNumber(post.views)}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Post Title */}
        <CardTitle className="text-xl">{post.title}</CardTitle>

        {/* Post Tags */}
        {post.tags && post.tags.length > 0 && (
          <div style={{
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px'
}}>
            {post.tags.slice(0, 3).map(tag => (
              <span key={tag} style={{
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px'
}}>
                <Hash size={24} />
                {tag}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="text-xs text-text-muted">+{post.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Post Content */}
        {!compact && (
          <CardDescription className="text-base text-text-primary leading-relaxed">
            {post.content}
          </CardDescription>
        )}

        {/* Post Attachments */}
        {post.attachments && post.attachments.length > 0 && (
          <div className="space-y-2">
            {post.attachments.map((attachment) => (
              <FileAttachment
                key={attachment.id}
                attachment={attachment}
                compact={compact}
              />
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter style={{
  flexDirection: 'column',
  gap: '12px'
}}>
        {/* Enhanced Reaction Bar */}
        <ReactionBar
          contentType="post"
          contentId={post.id}
          reactions={reactions}
          userReactions={userReactions}
          totalReactions={totalReactions}
          reactionUsers={reactionUsers}
          onReactionToggle={handleReactionToggle}
          onViewReactionUsers={handleViewReactionUsers}
          showTrending={totalReactions > 10}
          showAnalytics={showAnalytics}
          compact={compact}
        />

        {/* Post Actions */}
        <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
          <div style={{
  display: 'flex',
  gap: '8px'
}}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              leftIcon={<MessageSquare size={24} />}
              className={showComments ? 'text-primary' : ''}
            >
              {formatNumber(post.commentCount || 0)}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Share size={24} />}
            >
              Share
            </Button>

            <IconButton
              variant="ghost"
              size="icon-sm"
              aria-label="Bookmark"
            >
              <Bookmark size={24} />
            </IconButton>
          </div>

          {post.rewards > 0 && (
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '50%',
  fontWeight: '500'
}}>
              <Award size={24} />
              {post.rewards} CRYB
            </div>
          )}
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="pt-4 border-t border-border">
            <ThreadedComments
              comments={post.comments || []}
              onAddComment={handleAddComment}
              onReply={onReply}
              onReact={(commentId, reactionType) => {
              }}
              onEdit={onEditComment}
              onDelete={onDeleteComment}
              currentUser={currentUser}
              placeholder="Share your thoughts on this post..."
            />
          </div>
        )}
      </CardFooter>

      {/* Analytics Modal */}
      {showAnalyticsModal && (
        <div style={{
  position: 'fixed',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}} onClick={() => setShowAnalyticsModal(false)}>
          <Card style={{
  width: '100%',
  margin: '16px'
}} variant="elevated" onClick={e => e.stopPropagation()}>
            <CardHeader style={{
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
              <CardTitle>Post Analytics</CardTitle>
              <IconButton
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowAnalyticsModal(false)}
                aria-label="Close"
              >
                ×
              </IconButton>
            </CardHeader>
            <CardContent className="pt-4">
              <ReactionAnalytics
                contentType="post"
                contentId={post.id}
                showTrending={false}
                showLeaderboard={false}
                showChart={true}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  );
}

// Enhanced Posts Feed Component
function EnhancedPostsFeed({ 
  channelId, 
  posts, 
  onCreatePost, 
  onReaction, 
  onComment, 
  onReply, 
  onEditComment, 
  onDeleteComment, 
  currentUser,
  showAnalytics = false 
}) {
  const [sortBy, setSortBy] = useState('hot');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTrending, setShowTrending] = useState(false);

  const sortedPosts = [...posts].sort((a, b) => {
    switch (sortBy) {
      case 'new':
        return new Date(b.timestamp) - new Date(a.timestamp);
      case 'top':
        return (b.reactions?.total || 0) - (a.reactions?.total || 0);
      case 'hot':
      default:
        // Enhanced hot algorithm with reaction engagement
        const aScore = (a.reactions?.total || 0) + (a.commentCount || 0) * 2;
        const bScore = (b.reactions?.total || 0) + (b.commentCount || 0) * 2;
        const aTime = new Date(a.timestamp).getTime();
        const bTime = new Date(b.timestamp).getTime();
        const timeDecay = 3600000; // 1 hour
        
        const aHot = aScore / (1 + (Date.now() - aTime) / timeDecay);
        const bHot = bScore / (1 + (Date.now() - bTime) / timeDecay);
        
        return bHot - aHot;
    }
  });

  return (
    <div className="enhanced-posts-feed">
      {/* Enhanced Feed Header */}
      <div className="feed-header">
        <div className="feed-title">
          <Hash size={24} />
          <h2>Community Posts</h2>
        </div>
        
        <div className="feed-controls">
          <div className="sort-options">
            {['hot', 'new', 'top'].map(option => (
              <button
                key={option}
                className={`sort-btn ${sortBy === option ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                onClick={() => setSortBy(option)}
              >
                {option === 'hot' && <Flame size={24} />}
                {option === 'new' && <Clock size={24} />}
                {option === 'top' && <TrendingUp size={24} />}
                <span>{option.charAt(0).toUpperCase() + option.slice(1)}</span>
              </button>
            ))}
          </div>

          <div className="view-toggles">
            <button
              className={`toggle-btn ${showTrending ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
              onClick={() => setShowTrending(!showTrending)}
              title="Show Trending"
            >
              <TrendingUp size={24} />
            </button>
            
            <button
              className="create-post-btn"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={24} />
              <span>Create Post</span>
            </button>
          </div>
        </div>
      </div>

      {/* Trending Section */}
      {showTrending && (
        <div className="trending-section">
          <ReactionAnalytics
            showTrending={true}
            showLeaderboard={false}
            showChart={false}
          />
        </div>
      )}

      {/* Posts List */}
      <div className="posts-list">
        {sortedPosts.length === 0 ? (
          <div className="empty-feed">
            <MessageSquare size={48} />
            <h3>No posts yet</h3>
            <p>Be the first to start a discussion in this channel!</p>
            <button 
              className="btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              Create First Post
            </button>
          </div>
        ) : (
          sortedPosts.map(post => (
            <EnhancedPost
              key={post.id}
              post={post}
              onReaction={onReaction}
              onComment={onComment}
              onReply={onReply}
              onEditComment={onEditComment}
              onDeleteComment={onDeleteComment}
              currentUser={currentUser}
              showAnalytics={showAnalytics}
            />
          ))
        )}
      </div>

      {/* Create Post Modal - would need to be updated to include reaction settings */}
      {showCreateModal && (
        <div className="create-post-modal">
          {/* Post creation form goes here */}
          <p>Create Post Modal - Enhanced with reaction options</p>
          <button onClick={() => setShowCreateModal(false)}>Close</button>
        </div>
      )}
    </div>
  );
}
export default EnhancedPostsFeed;
export { EnhancedPost, EnhancedPostsFeed, POST_TYPES };
