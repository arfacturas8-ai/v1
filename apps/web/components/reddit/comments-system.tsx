'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Filter,
  Clock,
  Trophy,
  Flame,
  MoreHorizontal,
  Reply,
  Edit3,
  Trash2,
  Flag,
  Eye,
  EyeOff,
  Plus,
  Minus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { Comment, CommentSortType, CommentState, VoteValue } from './comment-types';
import { CommentEditor } from './comment-editor';
import { VotingSystem } from './voting-system';
import { RedditErrorBoundary, useRedditErrorReporting } from '../error-boundaries/reddit-error-boundary';

interface CommentsSystemProps {
  postId: string;
  initialComments?: Comment[];
  currentUserId?: string;
  className?: string;
}

interface CommentsSystemState {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  sort: CommentSortType;
  showNewCommentForm: boolean;
  expandedThreads: Set<string>;
  collapsedComments: Set<string>;
  loadingMore: Set<string>;
}

const SORT_OPTIONS = [
  { value: 'top', label: 'Best', icon: Trophy },
  { value: 'new', label: 'New', icon: Clock },
  { value: 'old', label: 'Old', icon: Clock },
  { value: 'controversial', label: 'Controversial', icon: Flame },
] as const;

const MAX_DEPTH = 8;
const COMMENTS_PER_LOAD = 20;

export function CommentsSystem({
  postId,
  initialComments = [],
  currentUserId,
  className,
}: CommentsSystemProps) {
  const { reportError } = useRedditErrorReporting('comments-system');
  
  const [state, setState] = useState<CommentsSystemState>({
    comments: initialComments,
    loading: false,
    error: null,
    sort: 'top',
    showNewCommentForm: false,
    expandedThreads: new Set(),
    collapsedComments: new Set(),
    loadingMore: new Set(),
  });

  // Load comments from API
  const loadComments = useCallback(async (sort: CommentSortType = state.sort, refresh = false) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await api.getComments(postId, sort);
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          comments: response.data || [],
          loading: false,
          sort,
        }));
      } else {
        throw new Error(response.error || 'Failed to load comments');
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
      reportError(error as Error, { postId, sort, refresh });
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load comments',
      }));
    }
  }, [postId, state.sort, reportError]);

  // Initial load
  useEffect(() => {
    if (initialComments.length === 0) {
      loadComments();
    }
  }, [postId, initialComments.length, loadComments]);

  // Vote on comment - this will be handled by the VotingSystem component directly
  const handleVote = useCallback(async (commentId: string, voteValue: VoteValue) => {
    // VotingSystem component will handle the API call
    // We just need to update the local state if needed
    setState(prev => ({
      ...prev,
      comments: updateCommentInTree(prev.comments, commentId, {
        userVote: voteValue,
      }),
    }));
  }, []);

  // Create new comment
  const handleCreateComment = useCallback(async (content: string, parentId?: string) => {
    try {
      const response = await api.createComment({
        postId,
        parentId,
        content,
      });

      if (response.success && response.data) {
        const newComment: Comment = {
          ...response.data,
          replies: [],
          userVote: null,
          _count: { replies: 0, votes: 0 },
        };

        setState(prev => {
          if (parentId) {
            // Add reply to parent comment
            return {
              ...prev,
              comments: addReplyToComment(prev.comments, parentId, newComment),
            };
          } else {
            // Add top-level comment
            return {
              ...prev,
              comments: [newComment, ...prev.comments],
              showNewCommentForm: false,
            };
          }
        });

        return newComment;
      } else {
        throw new Error(response.error || 'Failed to create comment');
      }
    } catch (error) {
      console.error('Failed to create comment:', error);
      reportError(error as Error, { postId, parentId, contentLength: content.length });
      throw error;
    }
  }, [postId, reportError]);

  // Edit comment
  const handleEditComment = useCallback(async (commentId: string, content: string) => {
    try {
      const response = await api.updateComment(commentId, content);
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          comments: updateCommentInTree(prev.comments, commentId, {
            content,
            editedAt: new Date().toISOString(),
          }),
        }));
      } else {
        throw new Error(response.error || 'Failed to edit comment');
      }
    } catch (error) {
      console.error('Failed to edit comment:', error);
      reportError(error as Error, { commentId, contentLength: content.length });
      throw error;
    }
  }, [reportError]);

  // Delete comment
  const handleDeleteComment = useCallback(async (commentId: string) => {
    try {
      const response = await api.deleteComment(commentId);
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          comments: updateCommentInTree(prev.comments, commentId, {
            content: '[deleted]',
            user: { ...prev.comments.find(c => c.id === commentId)?.user || {}, username: '[deleted]' } as any,
          }),
        }));
      } else {
        throw new Error(response.error || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
      reportError(error as Error, { commentId });
      throw error;
    }
  }, [reportError]);

  // Toggle comment collapse
  const toggleCollapse = useCallback((commentId: string) => {
    setState(prev => {
      const newCollapsed = new Set(prev.collapsedComments);
      if (newCollapsed.has(commentId)) {
        newCollapsed.delete(commentId);
      } else {
        newCollapsed.add(commentId);
      }
      return { ...prev, collapsedComments: newCollapsed };
    });
  }, []);

  // Load more replies for a comment
  const loadMoreReplies = useCallback(async (commentId: string) => {
    setState(prev => ({ ...prev, loadingMore: new Set(prev.loadingMore).add(commentId) }));

    try {
      const response = await api.request(`/api/v1/comments/more/${commentId}?sort=${state.sort}&limit=${COMMENTS_PER_LOAD}`);
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          comments: addRepliesToComment(prev.comments, commentId, response.data),
          loadingMore: new Set([...prev.loadingMore].filter(id => id !== commentId)),
        }));
      }
    } catch (error) {
      console.error('Failed to load more replies:', error);
      setState(prev => ({
        ...prev,
        loadingMore: new Set([...prev.loadingMore].filter(id => id !== commentId)),
      }));
    }
  }, [state.sort]);

  // Sort change handler
  const handleSortChange = useCallback((newSort: CommentSortType) => {
    if (newSort !== state.sort) {
      loadComments(newSort, true);
    }
  }, [state.sort, loadComments]);

  // Calculate total comments
  const totalComments = useMemo(() => {
    const countComments = (comments: Comment[]): number => {
      return comments.reduce((total, comment) => {
        return total + 1 + (comment.replies ? countComments(comment.replies) : 0);
      }, 0);
    };
    return countComments(state.comments);
  }, [state.comments]);

  return (
    <RedditErrorBoundary context="comments-system">
      <div className={cn("space-y-4", className)}>
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comments ({totalComments})
              </CardTitle>
              
              <div className="flex items-center gap-2">
                {/* Sort selector */}
                <Select value={state.sort} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map(option => {
                      const Icon = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                {/* Refresh button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadComments(state.sort, true)}
                  disabled={state.loading}
                >
                  <RefreshCw className={cn("h-4 w-4", state.loading && "animate-spin")} />
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* New comment form */}
          {currentUserId && (
            <CardContent className="pt-0">
              {!state.showNewCommentForm ? (
                <Button
                  variant="outline"
                  onClick={() => setState(prev => ({ ...prev, showNewCommentForm: true }))}
                  className="w-full justify-start"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add a comment...
                </Button>
              ) : (
                <CommentEditor
                  onSubmit={handleCreateComment}
                  onCancel={() => setState(prev => ({ ...prev, showNewCommentForm: false }))}
                  placeholder="What are your thoughts?"
                />
              )}
            </CardContent>
          )}
        </Card>

        {/* Error state */}
        {state.error && (
          <Card>
            <CardContent className="py-6">
              <div className="text-center text-red-600">
                <p className="mb-4">{state.error}</p>
                <Button onClick={() => loadComments(state.sort, true)}>
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading state */}
        {state.loading && state.comments.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Loading comments...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comments list */}
        {!state.loading && state.comments.length === 0 && !state.error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No comments yet</p>
              <p className="text-gray-400">Be the first to share what you think!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-1">
            {state.comments.map((comment, index) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                depth={0}
                currentUserId={currentUserId}
                isCollapsed={state.collapsedComments.has(comment.id)}
                isLoadingMore={state.loadingMore.has(comment.id)}
                onVote={handleVote}
                onReply={handleCreateComment}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
                onToggleCollapse={toggleCollapse}
                onLoadMore={loadMoreReplies}
              />
            ))}
          </div>
        )}
      </div>
    </RedditErrorBoundary>
  );
}

// Individual comment component
interface CommentItemProps {
  comment: Comment;
  depth: number;
  currentUserId?: string;
  isCollapsed: boolean;
  isLoadingMore: boolean;
  onVote: (commentId: string, voteValue: VoteValue) => void;
  onReply: (content: string, parentId: string) => Promise<Comment>;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onToggleCollapse: (commentId: string) => void;
  onLoadMore: (commentId: string) => void;
}

function CommentItem({
  comment,
  depth,
  currentUserId,
  isCollapsed,
  isLoadingMore,
  onVote,
  onReply,
  onEdit,
  onDelete,
  onToggleCollapse,
  onLoadMore,
}: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const isOwnComment = currentUserId === comment.userId;
  const hasReplies = comment.replies && comment.replies.length > 0;
  const canNest = depth < MAX_DEPTH;
  
  // Format time ago
  const timeAgo = useMemo(() => {
    const now = new Date();
    const commentDate = new Date(comment.createdAt);
    const diffMs = now.getTime() - commentDate.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return 'now';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
    return `${Math.floor(diffMinutes / 1440)}d`;
  }, [comment.createdAt]);

  const handleReply = useCallback(async (content: string) => {
    try {
      await onReply(content, comment.id);
      setIsReplying(false);
    } catch (error) {
      // Error handled by parent
    }
  }, [onReply, comment.id]);

  const handleEdit = useCallback(async (content: string) => {
    try {
      await onEdit(comment.id, content);
      setIsEditing(false);
    } catch (error) {
      // Error handled by parent
    }
  }, [onEdit, comment.id]);

  const handleDelete = useCallback(async () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await onDelete(comment.id);
      } catch (error) {
        // Error handled by parent
      }
    }
  }, [onDelete, comment.id]);

  const indentLevel = Math.min(depth, MAX_DEPTH);
  
  return (
    <div className={cn(
      "relative",
      indentLevel > 0 && "ml-4 pl-4 border-l-2 border-gray-200"
    )}>
      <div className="bg-white rounded-lg p-3 border hover:shadow-sm transition-shadow">
        {/* Comment header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {/* Collapse button */}
            {hasReplies && (
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto"
                onClick={() => onToggleCollapse(comment.id)}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            )}

            <Avatar className="h-6 w-6">
              <AvatarImage src={comment.user.avatar} />
              <AvatarFallback>
                {comment.user.displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <span className="font-medium text-gray-900">
              u/{comment.user.username}
            </span>
            <span>•</span>
            <span>{timeAgo}</span>
            
            {comment.editedAt && (
              <>
                <span>•</span>
                <span className="italic text-xs">edited</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Voting */}
            <VotingSystem
              itemId={comment.id}
              itemType="comment"
              score={comment.score}
              userVote={comment.userVote}
              size="sm"
              onVoteSuccess={(newScore) => {
                // Update comment score in local state
                onVote(comment.id, comment.userVote || 0);
              }}
            />
          </div>
        </div>

        {/* Comment content */}
        {isEditing ? (
          <CommentEditor
            initialContent={comment.content}
            onSubmit={handleEdit}
            onCancel={() => setIsEditing(false)}
            placeholder="Edit your comment..."
            isEditing={true}
          />
        ) : (
          <div className="prose prose-sm max-w-none mb-3">
            <p className="whitespace-pre-wrap text-gray-900 leading-relaxed">
              {comment.content}
            </p>
          </div>
        )}

        {/* Comment actions */}
        {!isCollapsed && !isEditing && (
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto hover:text-gray-700"
              onClick={() => setIsReplying(!isReplying)}
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>

            {isOwnComment && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto hover:text-gray-700"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  Edit
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto hover:text-red-600"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto hover:text-gray-700"
            >
              <Flag className="h-3 w-3 mr-1" />
              Report
            </Button>
          </div>
        )}

        {/* Reply form */}
        {isReplying && (
          <div className="mt-3">
            <CommentEditor
              onSubmit={handleReply}
              onCancel={() => setIsReplying(false)}
              placeholder="Write a reply..."
            />
          </div>
        )}
      </div>

      {/* Replies */}
      {!isCollapsed && hasReplies && comment.replies && (
        <div className="mt-1">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              currentUserId={currentUserId}
              isCollapsed={false}
              isLoadingMore={false}
              onVote={onVote}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleCollapse={onToggleCollapse}
              onLoadMore={onLoadMore}
            />
          ))}

          {/* Load more replies */}
          {comment.hasMoreReplies && (
            <div className="mt-2 ml-4">
              <Button
                variant="link"
                size="sm"
                onClick={() => onLoadMore(comment.id)}
                disabled={isLoadingMore}
                className="text-blue-600 hover:text-blue-800 p-0 h-auto"
              >
                {isLoadingMore ? (
                  <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Plus className="h-3 w-3 mr-1" />
                )}
                Load more replies ({comment.totalReplies || 0} more)
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Continue thread for deep nesting */}
      {depth >= MAX_DEPTH && hasReplies && !isCollapsed && (
        <div className="mt-2 ml-4">
          <Button
            variant="link"
            size="sm"
            className="text-blue-600 hover:text-blue-800 p-0 h-auto text-xs"
          >
            Continue this thread →
          </Button>
        </div>
      )}
    </div>
  );
}

// Helper functions for managing comment tree state
function updateCommentInTree(
  comments: Comment[], 
  commentId: string, 
  updates: Partial<Comment>
): Comment[] {
  return comments.map(comment => {
    if (comment.id === commentId) {
      return { ...comment, ...updates };
    }
    if (comment.replies && comment.replies.length > 0) {
      return {
        ...comment,
        replies: updateCommentInTree(comment.replies, commentId, updates),
      };
    }
    return comment;
  });
}

function addReplyToComment(
  comments: Comment[],
  parentId: string,
  newReply: Comment
): Comment[] {
  return comments.map(comment => {
    if (comment.id === parentId) {
      return {
        ...comment,
        replies: [newReply, ...(comment.replies || [])],
        _count: {
          ...comment._count,
          replies: (comment._count?.replies || 0) + 1,
        },
      };
    }
    if (comment.replies && comment.replies.length > 0) {
      return {
        ...comment,
        replies: addReplyToComment(comment.replies, parentId, newReply),
      };
    }
    return comment;
  });
}

function addRepliesToComment(
  comments: Comment[],
  parentId: string,
  newReplies: Comment[]
): Comment[] {
  return comments.map(comment => {
    if (comment.id === parentId) {
      return {
        ...comment,
        replies: [...(comment.replies || []), ...newReplies],
        hasMoreReplies: false, // Assume no more after loading
      };
    }
    if (comment.replies && comment.replies.length > 0) {
      return {
        ...comment,
        replies: addRepliesToComment(comment.replies, parentId, newReplies),
      };
    }
    return comment;
  });
}