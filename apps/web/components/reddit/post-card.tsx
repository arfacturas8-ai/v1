'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  Award,
  ExternalLink,
  Eye,
  EyeOff,
  Flag,
  Lock,
  Pin,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RedditErrorBoundary, useRedditErrorReporting } from '../error-boundaries/reddit-error-boundary';
import { Post, VoteType, PostState, PostError, VoteValue } from './post-types';
import { VotingSystem } from './voting-system';

interface PostCardProps {
  post: Post;
  variant?: 'feed' | 'detailed' | 'compact';
  onVote?: (voteValue: VoteValue) => void;
  onSave?: (saved: boolean) => void;
  onShare?: () => void;
  onHide?: () => void;
  onReport?: (reason: string) => void;
  onDelete?: () => Promise<void>;
  className?: string;
}

export const PostCard = React.memo(function PostCard({
  post,
  variant = 'feed',
  onVote,
  onSave,
  onShare,
  onHide,
  onReport,
  onDelete,
  className
}: PostCardProps) {
  const { reportError } = useRedditErrorReporting('post-card');
  const [state, setState] = useState<PostState>({
    loading: false,
    error: null,
    retryCount: 0,
  });

  // Handle vote from voting system
  const handleVoteSuccess = useCallback((newScore: number) => {
    // Pass vote change to parent
    if (onVote) {
      onVote(post.userVote);
    }
  }, [post.userVote, onVote]);

  // Safe save handling
  const handleSave = useCallback(async () => {
    if (!onSave) return;

    const newSavedState = !post.isSaved;
    setState(prev => ({ ...prev, optimisticSave: newSavedState }));

    try {
      await onSave(newSavedState);
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        optimisticSave: undefined,
        error: {
          code: 'SAVE_FAILED',
          message: 'Failed to save post. Please try again.',
          recoverable: true,
          timestamp: new Date().toISOString(),
        }
      }));
      
      reportError(error as Error, { postId: post.id, action: 'save' });
    }
  }, [post.id, post.isSaved, onSave, reportError]);

  // Safe deletion with confirmation
  const handleDelete = useCallback(async () => {
    if (!onDelete || !window.confirm('Are you sure you want to delete this post?')) return;

    setState(prev => ({ ...prev, loading: true }));

    try {
      await onDelete();
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false,
        error: {
          code: 'DELETE_FAILED',
          message: 'Failed to delete post. Please try again.',
          recoverable: true,
          timestamp: new Date().toISOString(),
        }
      }));
      
      reportError(error as Error, { postId: post.id, action: 'delete' });
    }
  }, [post.id, onDelete, reportError]);

  // Calculate display values with error safety
  const displayVote = state.optimisticVote !== undefined ? state.optimisticVote : post.userVote;
  const displaySaved = state.optimisticSave !== undefined ? state.optimisticSave : post.isSaved;
  
  // Safe score calculation
  const displayScore = useMemo(() => {
    try {
      let score = post.score;
      
      if (state.optimisticVote !== undefined) {
        const oldVoteValue = post.userVote === 'upvote' ? 1 : post.userVote === 'downvote' ? -1 : 0;
        const newVoteValue = state.optimisticVote === 'upvote' ? 1 : state.optimisticVote === 'downvote' ? -1 : 0;
        score += (newVoteValue - oldVoteValue);
      }
      
      return Math.max(0, score);
    } catch (error) {
      reportError(error as Error, { postId: post.id, action: 'score-calculation' });
      return post.score;
    }
  }, [post.score, post.userVote, state.optimisticVote, post.id, reportError]);

  // Safe time formatting
  const timeAgo = useMemo(() => {
    try {
      const now = new Date();
      const postDate = new Date(post.createdAt);
      const diffMs = now.getTime() - postDate.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);
      
      if (diffMinutes < 1) return 'now';
      if (diffMinutes < 60) return `${diffMinutes}m`;
      if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
      return `${Math.floor(diffMinutes / 1440)}d`;
    } catch (error) {
      reportError(error as Error, { postId: post.id, action: 'time-formatting' });
      return '?';
    }
  }, [post.createdAt, post.id, reportError]);

  // Handle deleted or missing content
  if (post.isDeleted) {
    return (
      <div className={cn("p-4 border rounded-lg bg-gray-50", className)}>
        <div className="flex items-center gap-2 text-gray-500">
          <Trash2 className="h-4 w-4" />
          <span className="italic">This post has been deleted</span>
        </div>
      </div>
    );
  }

  return (
    <RedditErrorBoundary context="post-card" fallback={<PostErrorFallback />}>
      <div className={cn(
        "bg-white border rounded-lg hover:shadow-md transition-shadow",
        variant === 'compact' && "p-3",
        variant !== 'compact' && "p-4",
        className
      )}>
        {/* Error display */}
        {state.error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {state.error.message}
            </div>
            {state.error.recoverable && (
              <button
                onClick={() => setState(prev => ({ ...prev, error: null }))}
                className="mt-1 text-xs underline hover:no-underline"
              >
                Dismiss
              </button>
            )}
          </div>
        )}

        <div className="flex gap-3">
          {/* Voting System */}
          <VotingSystem
            itemId={post.id}
            itemType="post"
            score={post.score}
            userVote={post.userVote}
            onVoteSuccess={handleVoteSuccess}
          />

          {/* Post content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              {post.community && (
                <>
                  <span className="font-medium text-black">r/{post.community.name}</span>
                  <span>•</span>
                </>
              )}
              <span>u/{post.user.username}</span>
              <span>•</span>
              <span>{timeAgo}</span>
              {post.isStickied && <Pin className="h-3 w-3 text-green-500" />}
              {post.isLocked && <Lock className="h-3 w-3 text-gray-500" />}
              {post.isNsfw && <Badge variant="destructive" className="text-xs">NSFW</Badge>}
            </div>

            {/* Flair */}
            {post.flair && (
              <Badge
                variant="secondary"
                style={{ 
                  backgroundColor: post.flair.backgroundColor,
                  color: post.flair.color 
                }}
                className="mb-2"
              >
                {post.flair.text}
              </Badge>
            )}

            {/* Title */}
            <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
              {post.title}
            </h3>

            {/* Type-specific content */}
            <PostContent post={post} variant={variant} />

            {/* Awards */}
            {post.awards && post.awards.length > 0 && (
              <div className="flex items-center gap-1 mt-2">
                {post.awards.map((award, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <Award className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs text-gray-600">{award.count}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
              <Button variant="ghost" size="sm" className="p-0 h-auto">
                <MessageSquare className="h-4 w-4 mr-1" />
                {post.commentCount} comments
              </Button>

              <Button variant="ghost" size="sm" className="p-0 h-auto" onClick={onShare}>
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "p-0 h-auto",
                  displaySaved && "text-yellow-600"
                )}
                onClick={handleSave}
                disabled={state.loading}
              >
                <Bookmark className={cn("h-4 w-4 mr-1", displaySaved && "fill-current")} />
                Save
              </Button>

              {onHide && (
                <Button variant="ghost" size="sm" className="p-0 h-auto" onClick={onHide}>
                  <EyeOff className="h-4 w-4 mr-1" />
                  Hide
                </Button>
              )}

              {onReport && (
                <Button variant="ghost" size="sm" className="p-0 h-auto" onClick={() => onReport?.('spam')}>
                  <Flag className="h-4 w-4 mr-1" />
                  Report
                </Button>
              )}

              {onDelete && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-0 h-auto text-red-600" 
                  onClick={handleDelete}
                  disabled={state.loading}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </RedditErrorBoundary>
  );
});

// Type-specific content renderers with error boundaries
function PostContent({ post, variant }: { post: Post; variant: string }) {
  const { reportError } = useRedditErrorReporting('post-content');

  try {
    switch (post.type) {
      case 'text':
        return variant !== 'compact' ? (
          <div className="text-gray-700 line-clamp-3 mb-2">
            {post.content}
          </div>
        ) : null;

      case 'link':
        return (
          <div className="mb-2">
            <a 
              href={post.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              {new URL(post.url).hostname}
            </a>
            {post.linkPreview && variant !== 'compact' && (
              <div className="mt-2 p-3 border rounded-lg bg-gray-50">
                {post.linkPreview.image && (
                  <img 
                    src={post.linkPreview.image} 
                    alt={post.linkPreview.title} 
                    className="w-full h-32 object-cover rounded mb-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      reportError(new Error('Failed to load link preview image'), { 
                        postId: post.id, 
                        imageUrl: post.linkPreview?.image 
                      });
                    }}
                  />
                )}
                <h4 className="font-medium">{post.linkPreview.title}</h4>
                <p className="text-sm text-gray-600">{post.linkPreview.description}</p>
              </div>
            )}
          </div>
        );

      case 'image':
        return variant !== 'compact' ? (
          <div className="mb-2">
            <img 
              src={post.imageUrl} 
              alt={post.title}
              className="max-w-full h-auto rounded"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.src = '/api/placeholder/400/300';
                img.alt = 'Image failed to load';
                reportError(new Error('Failed to load post image'), { 
                  postId: post.id, 
                  imageUrl: post.imageUrl 
                });
              }}
            />
            {post.caption && (
              <p className="text-sm text-gray-600 mt-1">{post.caption}</p>
            )}
          </div>
        ) : (
          <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0">
            <img 
              src={post.imageUrl} 
              alt={post.title}
              className="w-full h-full object-cover rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        );

      case 'poll':
        return variant !== 'compact' ? (
          <div className="mb-2">
            {post.pollOptions.map((option, index) => (
              <div key={option.id} className="mb-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">{option.text}</span>
                  <span className="text-xs text-gray-500">{option.votes} votes</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${option.percentage}%` }}
                  />
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-500 mt-2">
              Total votes: {post.totalVotes}
            </p>
          </div>
        ) : null;

      default:
        return (
          <div className="text-red-500 text-sm">
            Unknown post type: {(post as any).type}
          </div>
        );
    }
  } catch (error) {
    reportError(error as Error, { postId: post.id, postType: post.type });
    return (
      <div className="text-red-500 text-sm">
        Error loading post content
      </div>
    );
  }
}

// Error fallback component
function PostErrorFallback() {
  return (
    <div className="p-4 border border-red-200 rounded-lg bg-red-50">
      <div className="flex items-center gap-2 text-red-600">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm">This post could not be loaded</span>
      </div>
    </div>
  );
}

PostCard.displayName = 'PostCard';